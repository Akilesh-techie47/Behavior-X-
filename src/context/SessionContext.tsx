import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  ExamSession,
  Question,
  BehaviorEvent,
  CameraState,
  SystemStatus,
  RiskState,
} from '../types';
import { mockQuestions, mockSessions } from '../data/mockData';
import { BehaviorEngine } from '../engine/BehaviorEngine';
import { DEFAULT_BEHAVIOR_CONFIG } from '../engine/config';
import { BehaviorEventStore } from '../engine/BehaviorEventStore';
import { useCamera } from '../engine/camera/useCamera';

interface SessionContextType {
  // Session State
  session: ExamSession;
  questions: Question[];
  currentQuestion: Question;
  
  // Navigation & Answers
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  selectAnswer: (questionId: string, optionId: string) => void;
  toggleFlagQuestion: (questionId: string) => void;
  submitExam: () => void;
  startExam: () => void;
  resetSession: () => void;

  // Camera & System
  cameraState: CameraState;
  requestCamera: () => Promise<void>;
  stopCamera: () => void;
  systemStatus: SystemStatus;
  refreshSystemChecks: () => Promise<void>;

  // Behavioral Engine & Telemetry
  behaviorEngine: BehaviorEngine | null;
  isDemoMode: boolean;
  setDemoMode: (val: boolean) => void;
  addBehaviorEvent: (event: Omit<BehaviorEvent, 'id' | 'sessionId' | 'timestamp'>) => void;
  updateRiskState: (risk: Partial<RiskState>) => void;

  // Video element binding for face detector
  attachVideoElement: (video: HTMLVideoElement | null) => void;

  // Examiner multi-session registry
  allSessions: ExamSession[];
  loadSession: (sessionId: string) => void;
}

const STORAGE_KEY = 'behavior_x_active_session_v1';

const initialCameraState: CameraState = {
  status: 'idle',
  hasPermission: false,
  stream: null,
};

const initialSystemStatus: SystemStatus = {
  cameraReady: false,
  edgeEngineReady: true,
  networkLatencyMs: 22,
  privacyMode: 'strict_edge_only',
  browserSupported: typeof window !== 'undefined' && !!navigator.mediaDevices,
  engineMode: 'real',
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allSessions, setAllSessions] = useState<ExamSession[]>(mockSessions);
  
  // Initialize session from localStorage if available, or default to mockSessions[0]
  const [session, setSession] = useState<ExamSession>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return mockSessions[0];
  });

  const [questions] = useState<Question[]>(mockQuestions);
  const [cameraState, setCameraState] = useState<CameraState>(initialCameraState);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(initialSystemStatus);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Behavioral observation engine instance
  const engineRef = useRef<BehaviorEngine | null>(null);

  if (!engineRef.current) {
    const eventStore = new BehaviorEventStore(session.events || []);
    engineRef.current = new BehaviorEngine(session.id, DEFAULT_BEHAVIOR_CONFIG, eventStore);
  }

  // Hook event store notifications to React state
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    engine.setSessionId(session.id);
    engine.setMode(isDemoMode ? 'demo' : 'real');

    const unsubscribe = engine.getEventStore().subscribe((newEvent, allEvents) => {
      // Re-evaluate risk state using RiskEngine
      const updatedRisk = engine.getRiskEngine().evaluateRisk(allEvents);

      setSession(prev => ({
        ...prev,
        events: allEvents,
        riskState: updatedRisk,
      }));
    });

    return () => {
      unsubscribe();
    };
  }, [session.id, isDemoMode]);

  // Start engine when exam becomes active
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (session.status === 'active') {
      engine.start();
    } else {
      engine.stop();
    }

    return () => {
      engine.stop();
    };
  }, [session.status]);

  const currentQuestion = questions[session.currentQuestionIndex] || questions[0];

  // Save session state to localStorage on modification
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore
    }
  }, [session]);

  const attachVideoElement = (video: HTMLVideoElement | null) => {
    if (engineRef.current && video) {
      engineRef.current.faceDetector.attachVideo(video);
    }
  };

  // Request Camera Hardware with disconnect listener
  const requestCamera = async () => {
    setCameraState(prev => ({ ...prev, status: 'requesting' }));
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is unsupported on this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });

      // Track disconnection or hardware unplug
      stream.getVideoTracks().forEach(track => {
        track.onended = () => {
          setCameraState({
            status: 'denied',
            hasPermission: false,
            stream: null,
            errorMessage: 'Optical sensor was disconnected or closed by system.',
          });
          setSystemStatus(prev => ({ ...prev, cameraReady: false }));

          if (engineRef.current) {
            engineRef.current.handleIncomingEvent({
              id: `evt-cam-disc-${Date.now()}`,
              sessionId: session.id,
              timestamp: Date.now(),
              type: 'CAMERA_DISCONNECTED',
              category: 'system',
              severity: 'high',
              confidence: 1.0,
              duration: 1000,
              durationSeconds: 1,
              source: 'camera_lifecycle',
              description: 'Camera video track was terminated or disconnected.',
              evidence: {},
            });
          }
        };
      });

      setCameraState({
        status: 'active',
        hasPermission: true,
        stream,
      });
      setSystemStatus(prev => ({ ...prev, cameraReady: true }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to access camera sensor.';
      setCameraState({
        status: 'denied',
        hasPermission: false,
        stream: null,
        errorMessage: message,
      });
      setSystemStatus(prev => ({ ...prev, cameraReady: false }));
    }
  };

  const stopCamera = () => {
    if (cameraState.stream) {
      cameraState.stream.getTracks().forEach(track => track.stop());
    }
    setCameraState({
      status: 'idle',
      hasPermission: false,
      stream: null,
    });
    setSystemStatus(prev => ({ ...prev, cameraReady: false }));
  };

  const refreshSystemChecks = async () => {
    const start = performance.now();
    try {
      await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
      const latency = Math.round(performance.now() - start);
      setSystemStatus(prev => ({
        ...prev,
        networkLatencyMs: latency > 0 ? latency : 18,
        browserSupported: !!(navigator.mediaDevices && window.indexedDB),
      }));
    } catch {
      setSystemStatus(prev => ({
        ...prev,
        networkLatencyMs: 45,
      }));
    }
  };

  // Exam Progress Actions
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setSession(prev => ({ ...prev, currentQuestionIndex: index }));
    }
  };

  const nextQuestion = () => {
    if (session.currentQuestionIndex < questions.length - 1) {
      goToQuestion(session.currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (session.currentQuestionIndex > 0) {
      goToQuestion(session.currentQuestionIndex - 1);
    }
  };

  const selectAnswer = (questionId: string, optionId: string) => {
    setSession(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: optionId,
      },
    }));
  };

  const toggleFlagQuestion = (questionId: string) => {
    setSession(prev => {
      const isFlagged = prev.flaggedQuestionIds.includes(questionId);
      const nextFlags = isFlagged
        ? prev.flaggedQuestionIds.filter(id => id !== questionId)
        : [...prev.flaggedQuestionIds, questionId];
      return {
        ...prev,
        flaggedQuestionIds: nextFlags,
      };
    });
  };

  const startExam = () => {
    setSession(prev => ({
      ...prev,
      status: 'active',
      startedAt: Date.now(),
      endedAt: null,
    }));
    if (engineRef.current) {
      engineRef.current.start();
    }
  };

  const submitExam = () => {
    setSession(prev => ({
      ...prev,
      status: 'submitted',
      endedAt: Date.now(),
    }));
    if (engineRef.current) {
      engineRef.current.stop();
    }
    stopCamera();
  };

  const resetSession = () => {
    const freshSession: ExamSession = {
      ...mockSessions[0],
      status: 'not_started',
      startedAt: null,
      endedAt: null,
      answers: {},
      flaggedQuestionIds: [],
      currentQuestionIndex: 0,
      events: [],
      riskState: {
        currentScore: 0,
        level: 'nominal',
        breakdown: { attentionDeviationScore: 0, presenceScore: 0, environmentScore: 0 },
        lastCalculatedAt: Date.now(),
      },
    };
    setSession(freshSession);
    if (engineRef.current) {
      engineRef.current.getEventStore().clear();
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(freshSession));
    } catch {
      // ignore
    }
  };

  const addBehaviorEvent = (eventData: Omit<BehaviorEvent, 'id' | 'sessionId' | 'timestamp'>) => {
    if (engineRef.current) {
      engineRef.current.handleIncomingEvent({
        ...eventData,
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sessionId: session.id,
        timestamp: session.startedAt ? Date.now() - session.startedAt : Date.now(),
      });
    }
  };

  const updateRiskState = (risk: Partial<RiskState>) => {
    setSession(prev => ({
      ...prev,
      riskState: {
        ...prev.riskState,
        ...risk,
        lastCalculatedAt: Date.now(),
      },
    }));
  };

  const loadSession = (sessionId: string) => {
    const target = allSessions.find(s => s.id === sessionId);
    if (target) {
      setSession(target);
      if (engineRef.current) {
        engineRef.current.setSessionId(sessionId);
      }
    }
  };

  // Sync session changes back to allSessions array
  useEffect(() => {
    setAllSessions(prev =>
      prev.map(s => (s.id === session.id ? session : s))
    );
  }, [session]);

  return (
    <SessionContext.Provider
      value={{
        session,
        questions,
        currentQuestion,
        goToQuestion,
        nextQuestion,
        prevQuestion,
        selectAnswer,
        toggleFlagQuestion,
        submitExam,
        startExam,
        resetSession,
        cameraState,
        requestCamera,
        stopCamera,
        systemStatus,
        refreshSystemChecks,
        behaviorEngine: engineRef.current,
        isDemoMode,
        setDemoMode: setIsDemoMode,
        addBehaviorEvent,
        updateRiskState,
        attachVideoElement,
        allSessions,
        loadSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
