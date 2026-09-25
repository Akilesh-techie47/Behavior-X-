import React, { useState, useEffect } from 'react';
import { SessionProvider } from './context/SessionContext';
import { Header } from './components/common/Header';
import { LandingPage } from './pages/LandingPage';
import { StudentEntryPage } from './pages/StudentEntryPage';
import { ActiveExamPage } from './pages/ActiveExamPage';
import { ExamCompletePage } from './pages/ExamCompletePage';
import { ExaminerDashboardPage } from './pages/ExaminerDashboardPage';
import { SessionDetailPage } from './pages/SessionDetailPage';
import { PrivacyExplanationPage } from './pages/PrivacyExplanationPage';
import { DemoPage } from './pages/DemoPage';

export default function App() {
  // Hash/path router compatible with preview environment
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Simple, robust client-side route matcher
  const renderCurrentRoute = () => {
    if (currentPath === '/') {
      return <LandingPage onNavigate={navigate} />;
    }
    if (currentPath === '/demo') {
      return <DemoPage onNavigate={navigate} />;
    }
    if (currentPath === '/student') {
      return <StudentEntryPage onNavigate={navigate} />;
    }
    if (currentPath === '/exam') {
      return <ActiveExamPage onNavigate={navigate} />;
    }
    if (currentPath === '/exam/complete') {
      return <ExamCompletePage onNavigate={navigate} />;
    }
    if (currentPath === '/examiner') {
      return <ExaminerDashboardPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/examiner/session/')) {
      const sessionId = currentPath.replace('/examiner/session/', '');
      return <SessionDetailPage sessionId={sessionId} onNavigate={navigate} />;
    }
    if (currentPath === '/privacy') {
      return <PrivacyExplanationPage onNavigate={navigate} />;
    }

    // Default fallback
    return <LandingPage onNavigate={navigate} />;
  };

  return (
    <SessionProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Header currentPath={currentPath} onNavigate={navigate} />

        <main className="flex-1 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {renderCurrentRoute()}
          </div>
        </main>

        <footer className="mt-16 border-t border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-slate-500">
              <span className="font-semibold text-slate-900 tracking-[-0.01em]">
                Behavior-X v2
              </span>
              <span className="text-slate-300">|</span>
              <span>Multimodal examination intelligence platform</span>
              <span className="text-slate-300">|</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                0 ms stored video
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <button onClick={() => navigate('/demo')} className="quiet-link">
                Deterministic demo
              </button>
              <button onClick={() => navigate('/examiner')} className="quiet-link">
                Examiner console
              </button>
              <button onClick={() => navigate('/privacy')} className="quiet-link">
                Privacy charter
              </button>
            </div>
          </div>
        </footer>
      </div>
    </SessionProvider>
  );
}
