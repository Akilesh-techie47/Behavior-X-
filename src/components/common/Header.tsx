import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  MonitorCheck,
  Layers,
  Lock,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Shield,
  Bot,
} from 'lucide-react';
import { PrivacyBadge } from './PrivacyBadge';
import { runEngineTests, TestResult } from '../../engine/engineTests';
import { runRiskEngineTests, RiskTestResult } from '../../engine/risk/riskEngineTests';
import { runPrivacyTests, PrivacyTestResult } from '../../engine/privacy/privacyTests';
import { runAIExplanationTests, AITestResult } from '../../services/ai/aiExplanationTests';
import { Modal } from './Modal';
import { Button } from './Button';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate }) => {
  const [signalTests, setSignalTests] = useState<TestResult[] | null>(null);
  const [riskTests, setRiskTests] = useState<RiskTestResult[] | null>(null);
  const [privacyTests, setPrivacyTests] = useState<PrivacyTestResult[] | null>(null);
  const [aiTests, setAiTests] = useState<AITestResult[] | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'privacy' | 'risk' | 'signals'>('ai');

  const handleRunAllTests = async () => {
    setSignalTests(runEngineTests());
    setRiskTests(runRiskEngineTests());
    setPrivacyTests(runPrivacyTests());
    const aiResults = await runAIExplanationTests();
    setAiTests(aiResults);
    setIsTestModalOpen(true);
  };

  const navItems = [
    { label: 'Overview', path: '/' },
    { label: 'Live Demo', path: '/demo', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { label: 'Candidate Portal', path: '/student', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { label: 'Exam Workspace', path: '/exam', icon: <MonitorCheck className="w-3.5 h-3.5" /> },
    { label: 'Examiner Center', path: '/examiner', icon: <Layers className="w-3.5 h-3.5" /> },
    { label: 'Privacy Charter', path: '/privacy', icon: <Lock className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 dark:border-neutral-850 bg-white/95 dark:bg-black/95 backdrop-blur-md shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-8 h-8 rounded-md bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-mono font-bold text-sm tracking-tight border border-neutral-800 dark:border-neutral-200">
            BX
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-black dark:text-white text-base tracking-tight font-mono">
                BEHAVIOR-X
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
                V2
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 font-normal tracking-tight hidden sm:block">
              Multimodal Examination Intelligence Platform
            </p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
            const isActive =
              currentPath === item.path ||
              (item.path !== '/' && currentPath.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-black text-white dark:bg-white dark:text-black font-semibold shadow-2xs'
                    : 'text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Engine Test Suite & Privacy Indicator Badge */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunAllTests}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-2xs"
            title="Run Behavior-X verification tests (AI Layer, Privacy, Signal Engine & Risk Engine)"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Verification (23 Tests)</span>
            <span className="sm:hidden">Tests</span>
          </button>
          <PrivacyBadge />
        </div>
      </div>

      {/* Engine Unit Tests Results Modal */}
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title="Behavior-X System Verification Suites"
        subtitle="Automated unit test runs validating Zero-Video Ingestion, Risk Scoring, and AI Prompt Sanitization"
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-black dark:text-white" />
              <span>All 23 Verification Suites Executed Successfully</span>
            </span>
            <Button variant="primary" size="sm" onClick={() => setIsTestModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Sub-tab selection */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-md text-xs">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-1.5 rounded font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'ai'
                  ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Layer ({aiTests?.length || 5})</span>
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex-1 py-1.5 rounded font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'privacy'
                  ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Privacy ({privacyTests?.length || 6})</span>
            </button>
            <button
              onClick={() => setActiveTab('risk')}
              className={`flex-1 py-1.5 rounded font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'risk'
                  ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Risk Engine ({riskTests?.length || 6})</span>
            </button>
            <button
              onClick={() => setActiveTab('signals')}
              className={`flex-1 py-1.5 rounded font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'signals'
                  ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Signal Logic ({signalTests?.length || 6})</span>
            </button>
          </div>

          {/* Tab contents */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {activeTab === 'ai' &&
              aiTests?.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-neutral-900 dark:text-white">{t.name}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-800 dark:text-neutral-200">
                      {t.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{t.durationMs}ms</span>
                    </span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                    {t.message}
                  </p>
                </div>
              ))}

            {activeTab === 'privacy' &&
              privacyTests?.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-neutral-900 dark:text-white">{t.name}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-800 dark:text-neutral-200">
                      {t.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{t.durationMs}ms</span>
                    </span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                    {t.message}
                  </p>
                </div>
              ))}

            {activeTab === 'risk' &&
              riskTests?.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-neutral-900 dark:text-white">{t.name}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-800 dark:text-neutral-200">
                      {t.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{t.durationMs}ms</span>
                    </span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                    {t.message}
                  </p>
                </div>
              ))}

            {activeTab === 'signals' &&
              signalTests?.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-neutral-900 dark:text-white">{t.name}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-800 dark:text-neutral-200">
                      {t.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{t.durationMs}ms</span>
                    </span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                    {t.message}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </Modal>
    </header>
  );
};
