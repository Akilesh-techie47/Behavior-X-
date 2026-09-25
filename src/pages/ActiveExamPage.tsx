import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Send,
  Shield,
  AlertTriangle,
  HelpCircle,
  Eye,
  Camera,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Timer } from '../components/common/Timer';
import { CameraPreview } from '../components/common/CameraPreview';
import { Modal } from '../components/common/Modal';
import { DemoControlPanel } from '../components/demo/DemoControlPanel';

export const ActiveExamPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const {
    session,
    questions,
    currentQuestion,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    selectAnswer,
    toggleFlagQuestion,
    submitExam,
    cameraState,
    requestCamera,
    systemStatus,
    isDemoMode,
  } = useSession();

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const answeredCount = Object.keys(session.answers).length;
  const unansweredCount = questions.length - answeredCount;
  const isCurrentFlagged = session.flaggedQuestionIds.includes(currentQuestion.id);
  const selectedOptionId = session.answers[currentQuestion.id];

  // Auto-submit when timer expires
  const handleTimerExpire = () => {
    submitExam();
    onNavigate('/exam/complete');
  };

  const handleConfirmSubmit = () => {
    setIsSubmitModalOpen(false);
    submitExam();
    onNavigate('/exam/complete');
  };

  // Keyboard navigation support (Arrow keys and A, B, C, D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'ArrowRight' && session.currentQuestionIndex < questions.length - 1) {
        nextQuestion();
      } else if (e.key === 'ArrowLeft' && session.currentQuestionIndex > 0) {
        prevQuestion();
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const optionIndex = parseInt(e.key, 10) - 1;
        if (currentQuestion.options[optionIndex]) {
          selectAnswer(currentQuestion.id, currentQuestion.options[optionIndex].id);
        }
      } else if (['a', 'b', 'c', 'd'].includes(e.key.toLowerCase())) {
        const optionIndex = e.key.toLowerCase().charCodeAt(0) - 97;
        if (currentQuestion.options[optionIndex]) {
          selectAnswer(currentQuestion.id, currentQuestion.options[optionIndex].id);
        }
      } else if (e.key.toLowerCase() === 'm') {
        toggleFlagQuestion(currentQuestion.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session.currentQuestionIndex, questions.length, currentQuestion, nextQuestion, prevQuestion, selectAnswer, toggleFlagQuestion]);

  return (
    <div className="space-y-4 py-3">
      {/* 1. TOP BAR */}
      <header
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4"
        role="region"
        aria-label="Examination Header"
      >
        {/* Brand & Exam Name */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white dark:bg-indigo-600 flex items-center justify-center font-mono font-bold text-sm shadow-xs">
            BX
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
              {session.settings.courseName}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>{session.settings.courseCode}</span>
              <span>•</span>
              <span>{session.student.name}</span>
            </div>
          </div>
        </div>

        {/* Center: Countdown Timer */}
        <div className="flex items-center gap-3">
          <Timer
            initialDurationMinutes={session.settings.totalDurationMinutes}
            onExpire={handleTimerExpire}
          />
        </div>

        {/* Right: Finish Button */}
        <div className="flex items-center gap-2">
          <Button
            variant="academic"
            size="sm"
            onClick={() => setIsSubmitModalOpen(true)}
            icon={<Send className="w-3.5 h-3.5" />}
            className="shadow-xs font-semibold"
          >
            Finish Exam
          </Button>
        </div>
      </header>

      {/* 2. DEMO MODE FLOATING INSTRUCTION */}
      {isDemoMode && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-950 dark:text-amber-200 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <strong className="font-semibold">TESTING DEMO MODE:</strong>
            <span>You can simulate looking away or second persons without an actual webcam.</span>
          </div>
          <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
            Open /demo for interactive scenarios
          </span>
        </div>
      )}

      {/* 3. MAIN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Question Presentation */}
        <main className="lg:col-span-8 space-y-4" role="main">
          <Card
            title={`Question ${currentQuestion.number} of ${questions.length}`}
            subtitle={currentQuestion.category ? `Topic: ${currentQuestion.category}` : 'Multiple Choice Question'}
            badge={
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-md">
                1 Point
              </span>
            }
            action={
              <button
                onClick={() => toggleFlagQuestion(currentQuestion.id)}
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors focus:ring-2 focus:ring-amber-400 ${
                  isCurrentFlagged
                    ? 'bg-amber-50 text-amber-950 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800'
                    : 'text-slate-600 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-850'
                }`}
                aria-pressed={isCurrentFlagged}
                title="Press 'M' key on your keyboard to bookmark"
              >
                <Bookmark className={`w-3.5 h-3.5 ${isCurrentFlagged ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span>{isCurrentFlagged ? 'Bookmarked for Review' : 'Bookmark for Later'}</span>
              </button>
            }
          >
            <div className="space-y-5">
              {/* Question Prompt */}
              <p className="text-base sm:text-lg text-slate-900 dark:text-slate-100 font-semibold leading-relaxed">
                {currentQuestion.prompt}
              </p>

              {/* Code Snippet if present */}
              {currentQuestion.codeSnippet && (
                <div className="bg-slate-950 text-indigo-200 p-4 rounded-xl font-mono text-xs sm:text-sm overflow-x-auto border border-slate-800 shadow-inner leading-relaxed">
                  <pre>{currentQuestion.codeSnippet}</pre>
                </div>
              )}

              {/* Answer Choices */}
              <fieldset className="space-y-3 pt-2">
                <legend className="sr-only">Answer choices for question {currentQuestion.number}</legend>
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOptionId === option.id;
                  const letter = String.fromCharCode(65 + idx);

                  return (
                    <label
                      key={option.id}
                      className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all focus-within:ring-2 focus-within:ring-indigo-500 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-100 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option.id}
                        checked={isSelected}
                        onChange={() => selectAnswer(currentQuestion.id, option.id)}
                        className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      />
                      <div className="text-sm leading-relaxed select-none">
                        <span className="font-bold mr-2 text-indigo-700 dark:text-indigo-400">
                          [{letter}]
                        </span>
                        <span>{option.text}</span>
                      </div>
                    </label>
                  );
                })}
              </fieldset>
            </div>
          </Card>

          {/* CONTROLS BAR: Previous, Next, Submit */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="md"
              disabled={session.currentQuestionIndex === 0}
              onClick={prevQuestion}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous Question
            </Button>

            <span className="text-xs text-slate-500 hidden sm:inline font-medium">
              Tip: Press <strong>1-4</strong> or <strong>A-D</strong> to select answer, <strong>Arrow Keys</strong> to move
            </span>

            {session.currentQuestionIndex < questions.length - 1 ? (
              <Button
                variant="primary"
                size="md"
                onClick={nextQuestion}
                icon={<ChevronRight className="w-4 h-4" />}
                className="flex-row-reverse"
              >
                Next Question
              </Button>
            ) : (
              <Button
                variant="academic"
                size="md"
                onClick={() => setIsSubmitModalOpen(true)}
                icon={<Send className="w-4 h-4" />}
                className="shadow-sm font-semibold"
              >
                Review & Finish
              </Button>
            )}
          </div>
        </main>

        {/* Right Column: Question Navigator & Camera Monitor */}
        <aside className="lg:col-span-4 space-y-4" role="complementary" aria-label="Exam Tools">
          {/* Question Navigator Grid */}
          <Card
            title="Question List"
            subtitle={`${answeredCount} of ${questions.length} answered`}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = !!session.answers[q.id];
                  const isCurrent = idx === session.currentQuestionIndex;
                  const isFlagged = session.flaggedQuestionIds.includes(q.id);

                  let bgClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
                  if (isCurrent) {
                    bgClass = 'ring-2 ring-indigo-600 bg-indigo-600 text-white font-bold border-indigo-600';
                  } else if (isFlagged) {
                    bgClass = 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 font-semibold';
                  } else if (isAnswered) {
                    bgClass = 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 font-medium';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(idx)}
                      className={`relative h-10 rounded-xl border text-xs flex items-center justify-center transition-all ${bgClass}`}
                      aria-label={`Go to question ${idx + 1}`}
                    >
                      <span>{idx + 1}</span>
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Status Legend */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-300" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-300" />
                  <span>Bookmarked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-300" />
                  <span>Unanswered</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Privacy Camera Feed */}
          <Card
            title="Privacy Camera Feed"
            subtitle="Processed on your computer (never saved)"
            badge={
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>NO VIDEO SAVED</span>
              </div>
            }
          >
            <div className="space-y-3">
              <CameraPreview
                cameraState={cameraState}
                onRequestCamera={requestCamera}
                showOverlay={true}
                className="w-full aspect-video"
              />

              <div className="text-[11px] text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Privacy Mode:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Erased in 0 seconds</span>
                </div>
                <div className="flex justify-between">
                  <span>Questions Done:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {answeredCount} of {questions.length}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      {/* 4. CONFIRM SUBMISSION MODAL */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Ready to Finish Your Exam?"
        subtitle="Please review your answers before submitting"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button variant="outline" size="sm" onClick={() => setIsSubmitModalOpen(false)}>
              Keep Working
            </Button>
            <Button variant="academic" size="sm" onClick={handleConfirmSubmit}>
              Yes, Submit Exam
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>Answered questions:</span>
              <strong className="text-emerald-600 font-bold">{answeredCount}</strong>
            </div>
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>Unanswered questions:</span>
              <strong className={unansweredCount > 0 ? 'text-amber-600 font-bold' : 'text-slate-600'}>
                {unansweredCount}
              </strong>
            </div>
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>Bookmarked for review:</span>
              <strong className="text-slate-800 dark:text-slate-200 font-bold">
                {session.flaggedQuestionIds.length}
              </strong>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                You still have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}. You can return and answer them before finishing.
              </span>
            </div>
          )}

          <p className="text-slate-600 dark:text-slate-400">
            Once submitted, your answers will be securely saved and an exam receipt will be displayed.
          </p>
        </div>
      </Modal>
    </div>
  );
};
