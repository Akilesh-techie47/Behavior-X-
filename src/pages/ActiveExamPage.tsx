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

  // Keyboard navigation support (Arrow keys, 1-4, A-D, M for bookmark)
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
    <div className="space-y-4 py-4 font-sans">
      {/* 1. Distraction-Free Monochrome Header */}
      <header
        className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 p-4 flex flex-wrap items-center justify-between gap-4"
        role="region"
        aria-label="Examination Header"
      >
        {/* Brand & Exam Name */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-neutral-950 dark:border-white bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center font-mono font-bold text-xs tracking-wider">
            BX
          </div>
          <div>
            <h2 className="font-bold text-neutral-950 dark:text-neutral-50 text-sm font-mono uppercase tracking-tight">
              {session.settings.courseName || session.settings.examTitle}
            </h2>
            <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-500">
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

        {/* Right: Submit Button */}
        <div className="flex items-center gap-2">
          <Button
            variant="academic"
            size="sm"
            onClick={() => setIsSubmitModalOpen(true)}
            icon={<Send className="w-3.5 h-3.5" />}
          >
            Submit Examination
          </Button>
        </div>
      </header>

      {/* 2. Demo Mode Callout if active */}
      {isDemoMode && (
        <div className="p-3 border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-xs font-mono text-neutral-800 dark:text-neutral-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-none bg-neutral-950 dark:bg-white animate-pulse" />
            <strong className="uppercase">DEMO MODE ACTIVE:</strong>
            <span>Telemetry events can be injected synthetically without physical sensor hardware.</span>
          </div>
          <span className="text-[10px] uppercase text-neutral-500 underline cursor-pointer" onClick={() => onNavigate('/demo')}>
            Open Demo Lab
          </span>
        </div>
      )}

      {/* 3. Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Question Presentation */}
        <main className="lg:col-span-8 space-y-4" role="main">
          <Card
            title={`QUESTION ${String(currentQuestion.number).padStart(2, '0')} / ${String(questions.length).padStart(2, '0')}`}
            subtitle={currentQuestion.category ? `Domain: ${currentQuestion.category.toUpperCase()}` : 'OBJECTIVE EVALUATION'}
            badge={
              <span className="text-[10px] font-mono uppercase text-neutral-500 border border-neutral-300 dark:border-neutral-700 px-2 py-0.5">
                Weight: 1.0 Point
              </span>
            }
            action={
              <button
                onClick={() => toggleFlagQuestion(currentQuestion.id)}
                className={`inline-flex items-center gap-1.5 text-xs font-mono uppercase px-3 py-1.5 border transition-colors ${
                  isCurrentFlagged
                    ? 'border-neutral-950 bg-neutral-950 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950 font-bold'
                    : 'border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-900'
                }`}
                aria-pressed={isCurrentFlagged}
                title="Press 'M' key to toggle review bookmark"
              >
                <Bookmark className={`w-3.5 h-3.5 ${isCurrentFlagged ? 'fill-current' : ''}`} />
                <span>{isCurrentFlagged ? 'Flagged for Review' : 'Mark for Review'}</span>
              </button>
            }
          >
            <div className="space-y-5">
              {/* Question Prompt */}
              <p className="text-base sm:text-lg text-neutral-950 dark:text-neutral-50 font-medium leading-relaxed">
                {currentQuestion.prompt}
              </p>

              {/* Code Snippet if present */}
              {currentQuestion.codeSnippet && (
                <div className="bg-neutral-950 text-neutral-100 p-4 font-mono text-xs sm:text-sm overflow-x-auto border border-neutral-800 leading-relaxed">
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
                      className={`flex items-start gap-3.5 p-4 border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-neutral-950 bg-neutral-100 dark:border-neutral-100 dark:bg-neutral-850 text-neutral-950 dark:text-neutral-50 ring-1 ring-neutral-950 dark:ring-neutral-100'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option.id}
                        checked={isSelected}
                        onChange={() => selectAnswer(currentQuestion.id, option.id)}
                        className="mt-1 w-4 h-4 rounded-none border-neutral-400 accent-neutral-950 focus:ring-0"
                      />
                      <div className="text-sm leading-relaxed select-none">
                        <span className="font-mono font-bold mr-2 text-neutral-950 dark:text-neutral-50">
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

          {/* Navigation Controls Bar */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="md"
              disabled={session.currentQuestionIndex === 0}
              onClick={prevQuestion}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous Item
            </Button>

            <span className="text-[11px] font-mono text-neutral-500 hidden sm:inline">
              Shortcuts: <strong>1-4</strong> or <strong>A-D</strong> select • <strong>Arrows</strong> navigate • <strong>M</strong> bookmark
            </span>

            {session.currentQuestionIndex < questions.length - 1 ? (
              <Button
                variant="primary"
                size="md"
                onClick={nextQuestion}
                icon={<ChevronRight className="w-4 h-4" />}
                className="flex-row-reverse"
              >
                Next Item
              </Button>
            ) : (
              <Button
                variant="academic"
                size="md"
                onClick={() => setIsSubmitModalOpen(true)}
                icon={<Send className="w-4 h-4" />}
              >
                Review & Submit
              </Button>
            )}
          </div>
        </main>

        {/* Right Column: Question Navigator & Camera Monitor */}
        <aside className="lg:col-span-4 space-y-4" role="complementary" aria-label="Examination Overview">
          {/* Question Navigator Grid */}
          <Card
            title="Item Matrix"
            subtitle={`${answeredCount} of ${questions.length} completed`}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = !!session.answers[q.id];
                  const isCurrent = idx === session.currentQuestionIndex;
                  const isFlagged = session.flaggedQuestionIds.includes(q.id);

                  let bgClass = 'bg-neutral-50 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700';
                  if (isCurrent) {
                    bgClass = 'border-neutral-950 bg-neutral-950 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950 font-bold';
                  } else if (isFlagged) {
                    bgClass = 'border-dashed border-neutral-600 bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-bold';
                  } else if (isAnswered) {
                    bgClass = 'border-neutral-400 bg-neutral-150 dark:bg-neutral-850 text-neutral-900 dark:text-neutral-100 font-medium';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(idx)}
                      className={`relative h-10 border text-xs font-mono flex items-center justify-center transition-all ${bgClass}`}
                      aria-label={`Jump to question ${idx + 1}`}
                    >
                      <span>{String(idx + 1).padStart(2, '0')}</span>
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-neutral-950 dark:bg-white" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Status Legend */}
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase text-neutral-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-neutral-200 dark:bg-neutral-800 border border-neutral-400" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 border border-dashed border-neutral-600 bg-neutral-300 dark:bg-neutral-700" />
                  <span>Flagged</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700" />
                  <span>Remaining</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Privacy Camera Feed */}
          <Card
            title="Sensory Verification Feed"
            subtitle="Local memory loop (0ms video storage)"
            badge={
              <div className="flex items-center gap-1.5 px-2 py-0.5 border border-neutral-300 dark:border-neutral-700 text-[10px] font-mono uppercase text-neutral-600 dark:text-neutral-400">
                <span className="w-1.5 h-1.5 bg-neutral-950 dark:bg-neutral-50" />
                <span>EPHEMERAL RAM</span>
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

              <div className="text-[10px] font-mono text-neutral-500 space-y-1">
                <div className="flex justify-between">
                  <span>Storage Policy:</span>
                  <span className="text-neutral-900 dark:text-neutral-100 font-bold">Zero Raw Frames Persisted</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed Items:</span>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">
                    {answeredCount} / {questions.length}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      {/* 4. Submission Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Finalize Examination Submission"
        subtitle="Confirm completion of session"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button variant="outline" size="sm" onClick={() => setIsSubmitModalOpen(false)}>
              Resume Exam
            </Button>
            <Button variant="academic" size="sm" onClick={handleConfirmSubmit}>
              Confirm Final Submission
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs font-mono">
          <div className="p-4 border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 space-y-2">
            <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
              <span>Answered items:</span>
              <strong className="text-neutral-950 dark:text-neutral-50 font-bold">{answeredCount}</strong>
            </div>
            <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
              <span>Unanswered items:</span>
              <strong className="text-neutral-950 dark:text-neutral-50 font-bold">{unansweredCount}</strong>
            </div>
            <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
              <span>Items marked for review:</span>
              <strong className="text-neutral-950 dark:text-neutral-50 font-bold">
                {session.flaggedQuestionIds.length}
              </strong>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div className="p-3 border border-neutral-950 dark:border-neutral-50 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Attention: {unansweredCount} question{unansweredCount > 1 ? 's remain' : ' remains'} unanswered. You may resume and answer prior to finalization.
              </span>
            </div>
          )}

          <p className="text-neutral-600 dark:text-neutral-400">
            Upon submission, your answers and encrypted behavioral telemetry record will be cryptographically locked for human examiner evaluation.
          </p>
        </div>
      </Modal>
    </div>
  );
};
