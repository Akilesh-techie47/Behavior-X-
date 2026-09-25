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
      <div className="min-h-screen bg-white dark:bg-black text-neutral-950 dark:text-neutral-50 flex flex-col font-sans transition-colors duration-200">
        <Header currentPath={currentPath} onNavigate={navigate} />

        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          {renderCurrentRoute()}
        </div>

        <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black py-8 mt-12 text-xs font-mono text-neutral-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-950 dark:text-neutral-50 uppercase">BEHAVIOR-X V2</span>
              <span>•</span>
              <span>Multimodal Examination Intelligence Platform</span>
              <span>•</span>
              <span className="text-neutral-400">0ms Stored Video</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/demo')}
                className="text-neutral-950 dark:text-neutral-50 hover:underline font-bold uppercase"
              >
                Deterministic Demo (/demo)
              </button>
              <button
                onClick={() => navigate('/examiner')}
                className="hover:text-neutral-950 dark:hover:text-neutral-200 transition-colors uppercase"
              >
                Examiner Console
              </button>
              <button
                onClick={() => navigate('/privacy')}
                className="hover:text-neutral-950 dark:hover:text-neutral-200 transition-colors uppercase"
              >
                Privacy Charter
              </button>
            </div>
          </div>
        </footer>
      </div>
    </SessionProvider>
  );
}
