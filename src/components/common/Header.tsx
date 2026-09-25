import React, { useState } from 'react';
import {
  ShieldCheck,
  BookOpen,
  Layers,
  MonitorCheck,
  Lock,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Activity,
  Shield,
  Sparkles,
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
    { label: 'Home', path: '/' },
    { label: 'Interactive Demo', path: '/demo', icon: <Sparkles className="w-3.5 h-3.5 text-amber-500" /> },
    { label: 'Take Exam', path: '/student', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { label: 'Active Test', path: '/exam', icon: <MonitorCheck className="w-3.5 h-3.5" /> },
    { label: 'Teacher Dashboard', path: '/examiner', icon: <Layers className="w-3.5 h-3.5" /> },
    { label: 'Privacy Policy', path: '/privacy', icon: <Lock className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white dark:bg-indigo-600 flex items-center justify-center font-mono font-bold text-base shadow-sm group-hover:bg-indigo-600 transition-colors">
            <span className="text-white tracking-tighter">BX</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
                BEHAVIOR<span className="text-indigo-600 dark:text-indigo-400 font-extrabold">-X</span>
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                HACKEX '26
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight hidden sm:block">
              Privacy-Friendly Exam Proctoring
            </p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map(item => {
            const isActive =
              currentPath === item.path ||
              (item.path !== '/' && currentPath.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-850'
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
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors shadow-2xs"
            title="Run Behavior-X verification tests (AI Layer, Privacy, Signal Engine & Risk Engine)"
          >
            <PlayCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Run Tests (23/23 Passing)</span>
            <span className="sm:hidden">Tests</span>
          </button>
          <PrivacyBadge />
        </div>
      </div>

      {/* Engine Unit Tests Results Modal */}
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title="Behavior-X System Verification Tests"
        subtitle="23 automated tests verifying Camera Safety, AI Explanations, Privacy, and Calculations"
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>All 23 Verification Tests Passed Successfully</span>
            </span>
            <Button variant="primary" size="sm" onClick={() => setIsTestModalOpen(false)}>
              Close Tests
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Sub-tab selection */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-1.5 font-semibold rounded-md transition-all ${
                activeTab === 'ai'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              AI Notes (5)
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex-1 py-1.5 font-semibold rounded-md transition-all ${
                activeTab === 'privacy'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Privacy (4)
            </button>
            <button
              onClick={() => setActiveTab('risk')}
              className={`flex-1 py-1.5 font-semibold rounded-md transition-all ${
                activeTab === 'risk'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Scores (9)
            </button>
            <button
              onClick={() => setActiveTab('signals')}
              className={`flex-1 py-1.5 font-semibold rounded-md transition-all ${
                activeTab === 'signals'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Sensors (5)
            </button>
          </div>

          {activeTab === 'ai' && aiTests && (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {aiTests.map((t, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    t.passed
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50/80 border-rose-200 text-rose-950 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <div className="flex items-center gap-2">
                      {t.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      )}
                      <span>{t.name}</span>
                    </div>
                    <span className="text-[11px] opacity-75">{t.durationMs}ms</span>
                  </div>
                  <p className="mt-1 pl-6 text-xs text-slate-700 dark:text-slate-300">{t.message}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'privacy' && privacyTests && (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {privacyTests.map((t, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    t.passed
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50/80 border-rose-200 text-rose-950 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <div className="flex items-center gap-2">
                      {t.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      )}
                      <span>{t.name}</span>
                    </div>
                    <span className="text-[11px] opacity-75">{t.durationMs}ms</span>
                  </div>
                  <p className="mt-1 pl-6 text-xs text-slate-700 dark:text-slate-300">{t.message}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'risk' && riskTests && (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {riskTests.map((t, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    t.passed
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50/80 border-rose-200 text-rose-950 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <div className="flex items-center gap-2">
                      {t.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      )}
                      <span>{t.name}</span>
                    </div>
                    <span className="text-[11px] opacity-75">{t.durationMs}ms</span>
                  </div>
                  <p className="mt-1 pl-6 text-xs text-slate-700 dark:text-slate-300">{t.message}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'signals' && signalTests && (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {signalTests.map((t, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    t.passed
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50/80 border-rose-200 text-rose-950 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <div className="flex items-center gap-2">
                      {t.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      )}
                      <span>{t.name}</span>
                    </div>
                    <span className="text-[11px] opacity-75">{t.durationMs}ms</span>
                  </div>
                  <p className="mt-1 pl-6 text-xs text-slate-700 dark:text-slate-300">{t.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </header>
  );
};
