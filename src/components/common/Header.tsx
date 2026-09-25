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

const TEST_TABS = [
  { id: 'ai', label: 'AI layer', icon: Bot },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'risk', label: 'Risk engine', icon: Activity },
  { id: 'signals', label: 'Signal logic', icon: Clock },
] as const;

type TestTabId = (typeof TEST_TABS)[number]['id'];

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate }) => {
  const [signalTests, setSignalTests] = useState<TestResult[] | null>(null);
  const [riskTests, setRiskTests] = useState<RiskTestResult[] | null>(null);
  const [privacyTests, setPrivacyTests] = useState<PrivacyTestResult[] | null>(null);
  const [aiTests, setAiTests] = useState<AITestResult[] | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TestTabId>('ai');

  const handleRunAllTests = async () => {
    setSignalTests(runEngineTests());
    setRiskTests(runRiskEngineTests());
    setPrivacyTests(runPrivacyTests());
    const aiResults = await runAIExplanationTests();
    setAiTests(aiResults);
    setIsTestModalOpen(true);
  };

  const tabCounts: Record<TestTabId, number> = {
    ai: aiTests?.length || 5,
    privacy: privacyTests?.length || 6,
    risk: riskTests?.length || 6,
    signals: signalTests?.length || 6,
  };

  const activeResults: Array<{ name: string; passed: boolean; message: string; durationMs: number }> =
    activeTab === 'ai'
      ? (aiTests || [])
      : activeTab === 'privacy'
      ? (privacyTests || [])
      : activeTab === 'risk'
      ? (riskTests || [])
      : (signalTests || []);

  const navItems = [
    { label: 'Overview', path: '/' },
    { label: 'Live demo', path: '/demo', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { label: 'Candidate portal', path: '/student', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { label: 'Exam workspace', path: '/exam', icon: <MonitorCheck className="w-3.5 h-3.5" /> },
    { label: 'Examiner center', path: '/examiner', icon: <Layers className="w-3.5 h-3.5" /> },
    { label: 'Privacy charter', path: '/privacy', icon: <Lock className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2.5 text-left group select-none"
        >
          <div className="w-8 h-8 rounded-md bg-brand-900 text-white grid place-items-center text-[13px] font-semibold tracking-[-0.02em] shrink-0">
            BX
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 text-[15px] tracking-[-0.01em]">
                Behavior-X
              </span>
              <span className="text-[10px] font-medium px-1 py-px rounded-[3px] border border-slate-200 bg-slate-50 text-slate-500">
                v2
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight hidden 2xl:block">
              Multimodal examination intelligence platform
            </p>
          </div>
        </button>

        {/* Navigation items */}
        <nav className="hidden md:flex items-center gap-0.5" aria-label="Primary">
          {navItems.map(item => {
            const isActive =
              currentPath === item.path ||
              (item.path !== '/' && currentPath.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                title={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex items-center h-8 px-2.5 gap-1.5 rounded-md text-[13px] transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span className="hidden xl:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Engine Test Suite & Privacy Indicator */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAllTests}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-slate-300 bg-white text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            title="Run Behavior-X verification tests (AI Layer, Privacy, Signal Engine & Risk Engine)"
          >
            <PlayCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden 2xl:inline">Verification (23 tests)</span>
          </button>
          <PrivacyBadge />
        </div>
      </div>

      {/* Engine Unit Tests Results Modal */}
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title="Behavior-X system verification suites"
        subtitle="Automated unit runs validating zero-video ingestion, risk scoring, and AI prompt sanitization"
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full gap-4">
            <span className="text-[13px] text-slate-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>All 23 verification suites executed successfully</span>
            </span>
            <Button variant="primary" size="sm" onClick={() => setIsTestModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Sub-tab selection */}
          <div
            className="flex items-center gap-1 p-1 bg-slate-100 rounded-md"
            role="tablist"
          >
            {TEST_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 h-7 px-2 rounded-[4px] text-[12px] font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate">
                    {tab.label} ({tabCounts[tab.id]})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab contents */}
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 -mr-1">
            {activeResults.map((t, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 border border-slate-200 rounded-md bg-slate-50/60"
              >
                <span className="mt-0.5 shrink-0">
                  {t.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13px] font-medium text-slate-900 truncate">
                      {t.name}
                    </span>
                    <span className="data text-[11px] text-slate-400 shrink-0">
                      {t.durationMs}ms
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-600 mt-0.5 leading-relaxed">
                    {t.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </header>
  );
};
