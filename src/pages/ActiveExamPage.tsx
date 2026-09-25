import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Timer } from '../components/common/Timer';
import { CameraPreview } from '../components/common/CameraPreview';
import { StatusBadge } from '../components/common/StatusBadge';
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
    isDemoMode,
  } = useSession();

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const answeredCount = Object.keys(session.answers).length;
  const unansweredCount = questions.length - answeredCount;
  const isCurrentFlagged = session.flaggedQuestionIds.includes(currentQuestion.id);
  const selectedOptionId = session.answers[currentQuestion.id];
  const examProgress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

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

  const cameraStatus = (() => {
    switch (cameraState.status) {
      case 'active':
        return { status: 'Camera live', variant: 'nominal' as const };
      case 'requesting':
        return { status: 'Starting', variant: 'info' as const };
      case 'denied':
        return { status: 'Blocked', variant: 'high' as const };
      default:
        return { status: 'Standby', variant: 'neutral' as const };
    }
  })();

  return (
    <div className="py-6 space-y-5">
      {/* 1. Session bar: identity, progress, countdown, submit */}
      <header
        className="panel px-5 py-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-4"
        role="region"
        aria-label="Examination Header"
      >
        <div className="min-w-[220px] flex-1">
          <p className="eyebrow">Examination in progress</p>
          <h1 className="text-[15px] font-semibold text-slate-900 tracking-[-0.01em] mt-1 truncate">
            {session.settings.courseName || session.settings.examTitle}
          </h1>
          <p className="flex flex-wrap items-center gap-x-2 text-[12.5px] text-slate-500 mt-1">
            <span className="data">{session.settings.courseCode}</span>
            <span className="text-slate-300">·</span>
            <span className="truncate">{session.student.name}</span>
            <span className="text-slate-300">·</span>
            <span>
              {answeredCount} of {questions.length} answered
            </span>
          </p>
          <div className="mt-2.5 h-1 w-full max-w-[320px] rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-700 transition-[width] duration-300 ease-out"
              style={{ width: `${examProgress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Timer
            initialDurationMinutes={session.settings.totalDurationMinutes}
            onExpire={handleTimerExpire}
          />
          <Button
            variant="academic"
            size="sm"
            onClick={() => setIsSubmitModalOpen(true)}
            icon={<Send className="w-3.5 h-3.5" />}
          >
            Submit examination
          </Button>
        </div>
      </header>

      {/* 2. Demo mode notice */}
      {isDemoMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50/70 px-4 py-2.5">
          <div className="flex items-center gap-2.5 text-[13px] text-amber-900">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>
              <strong className="font-semibold">Demo mode active.</strong> Telemetry events can be
              injected synthetically without physical sensor hardware.
            </span>
          </div>
          <button
            onClick={() => onNavigate('/demo')}
            className="text-[13px] font-medium text-amber-900 underline underline-offset-2 hover:text-amber-950"
          >
            Open demo lab
          </button>
        </div>
      )}

      {/* 3. Main workspace grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left column: question presentation */}
        <main className="lg:col-span-8 space-y-4" role="main">
          <Card
            title={`Question ${currentQuestion.number} of ${questions.length}`}
            subtitle={
              currentQuestion.category
                ? `Domain: ${currentQuestion.category}`
                : 'Objective evaluation'
            }
            badge={
              <span className="hidden sm:inline text-[12px] text-slate-500 whitespace-nowrap">
                Weight 1.0 point
              </span>
            }
            bodyClassName="p-5 sm:p-6"
            action={
              <button
                onClick={() => toggleFlagQuestion(currentQuestion.id)}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-medium border transition-colors ${
                  isCurrentFlagged
                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-slate-900'
                }`}
                aria-pressed={isCurrentFlagged}
                title="Press 'M' key to toggle review bookmark"
              >
                <Bookmark
                  className={`w-3.5 h-3.5 ${isCurrentFlagged ? 'fill-current text-amber-600' : ''}`}
                />
                <span>{isCurrentFlagged ? 'Flagged' : 'Mark for review'}</span>
              </button>
            }
          >
            <div className="space-y-6">
              {/* Question prompt */}
              <p className="text-[17px] leading-[1.6] text-slate-900">
                {currentQuestion.prompt}
              </p>

              {/* Code snippet if present */}
              {currentQuestion.codeSnippet && (
                <div className="rounded-md bg-slate-900 border border-slate-800 p-4 overflow-x-auto">
                  <pre className="font-mono text-[13px] leading-relaxed text-slate-100">
                    {currentQuestion.codeSnippet}
                  </pre>
                </div>
              )}

              {/* Answer choices */}
              <fieldset className="space-y-2.5">
                <legend className="sr-only">Answer choices for question {currentQuestion.number}</legend>
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOptionId === option.id;
                  const letter = String.fromCharCode(65 + idx);

                  return (
                    <label
                      key={option.id}
                      className={`flex items-start gap-3.5 p-3.5 rounded-md border cursor-pointer transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600 ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/70'
                          : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option.id}
                        checked={isSelected}
                        onChange={() => selectAnswer(currentQuestion.id, option.id)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 grid place-items-center w-6 h-6 shrink-0 rounded-[4px] border text-[12px] font-semibold transition-colors ${
                          isSelected
                            ? 'bg-brand-700 text-white border-brand-700'
                            : 'bg-white text-slate-500 border-slate-300'
                        }`}
                      >
                        {letter}
                      </span>
                      <span
                        className={`text-[15px] leading-relaxed ${
                          isSelected ? 'text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        {option.text}
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            </div>
          </Card>

          {/* Navigation controls */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="md"
              disabled={session.currentQuestionIndex === 0}
              onClick={prevQuestion}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>

            <div className="hidden lg:flex items-center gap-1.5 text-[12px] text-slate-500">
              <span className="kbd">1</span>
              <span className="kbd">–</span>
              <span className="kbd">4</span>
              <span className="ml-1.5">select</span>
              <span className="mx-1 text-slate-300">·</span>
              <span className="kbd">←</span>
              <span className="kbd">→</span>
              <span className="ml-1.5">navigate</span>
              <span className="mx-1 text-slate-300">·</span>
              <span className="kbd">M</span>
              <span className="ml-1.5">bookmark</span>
            </div>

            {session.currentQuestionIndex < questions.length - 1 ? (
              <Button
                variant="primary"
                size="md"
                onClick={nextQuestion}
                icon={<ChevronRight className="w-4 h-4" />}
                className="flex-row-reverse"
              >
                Next
              </Button>
            ) : (
              <Button
                variant="academic"
                size="md"
                onClick={() => setIsSubmitModalOpen(true)}
                icon={<Send className="w-4 h-4" />}
              >
                Review &amp; submit
              </Button>
            )}
          </div>
        </main>

        {/* Right column: navigator & monitoring */}
        <aside className="lg:col-span-4 space-y-4" role="complementary" aria-label="Examination Overview">
          {/* Question navigator */}
          <Card
            title="Question navigator"
            subtitle={`${answeredCount} of ${questions.length} completed`}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-1.5">
                {questions.map((q, idx) => {
                  const isAnswered = !!session.answers[q.id];
                  const isCurrent = idx === session.currentQuestionIndex;
                  const isFlagged = session.flaggedQuestionIds.includes(q.id);

                  let cellClass =
                    'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-400';
                  if (isCurrent) {
                    cellClass = 'bg-brand-700 text-white border-brand-700';
                  } else if (isFlagged) {
                    cellClass = 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100';
                  } else if (isAnswered) {
                    cellClass = 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(idx)}
                      className={`relative h-9 rounded-[4px] border text-[13px] data font-medium transition-colors ${cellClass}`}
                      aria-label={`Jump to question ${idx + 1}`}
                      aria-current={isCurrent ? 'true' : undefined}
                    >
                      <span>{String(idx + 1).padStart(2, '0')}</span>
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="pt-3.5 border-t border-slate-200 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-[3px] bg-white border border-slate-300" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-[3px] bg-amber-50 border border-amber-300" />
                  <span>Flagged</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-[3px] bg-slate-50 border border-slate-200" />
                  <span>Remaining</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-[3px] bg-brand-700 border border-brand-700" />
                  <span>Current</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Monitoring */}
          <Card
            title="Monitoring"
            subtitle="Local memory loop · 0ms video storage"
            badge={<StatusBadge status={cameraStatus.status} variant={cameraStatus.variant} size="sm" />}
          >
            <div className="space-y-3.5">
              <CameraPreview
                cameraState={cameraState}
                onRequestCamera={requestCamera}
                showOverlay={true}
                className="w-full aspect-video"
              />

              <dl className="divide-y divide-slate-100 border-t border-slate-200 text-[12.5px]">
                <div className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-slate-500">Storage policy</dt>
                  <dd className="font-medium text-slate-900">Zero raw frames persisted</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-slate-500">Items completed</dt>
                  <dd className="data font-medium text-slate-900">
                    {answeredCount} / {questions.length}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-slate-500">Flagged for review</dt>
                  <dd className="data font-medium text-slate-900">
                    {session.flaggedQuestionIds.length}
                  </dd>
                </div>
              </dl>
            </div>
          </Card>
        </aside>
      </div>

      {/* 4. Submission modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Finalize examination submission"
        subtitle="Confirm completion of session"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button variant="outline" size="sm" onClick={() => setIsSubmitModalOpen(false)}>
              Resume exam
            </Button>
            <Button variant="academic" size="sm" onClick={handleConfirmSubmit}>
              Confirm final submission
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <dl className="panel-inset divide-y divide-slate-200 bg-white">
            <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-[13px]">
              <dt className="text-slate-500">Answered items</dt>
              <dd className="data font-semibold text-slate-900">{answeredCount}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-[13px]">
              <dt className="text-slate-500">Unanswered items</dt>
              <dd className="data font-semibold text-slate-900">{unansweredCount}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-[13px]">
              <dt className="text-slate-500">Items marked for review</dt>
              <dd className="data font-semibold text-slate-900">
                {session.flaggedQuestionIds.length}
              </dd>
            </div>
          </dl>

          {unansweredCount > 0 && (
            <div className="flex items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50/70 px-4 py-3 text-[13px] text-amber-900">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <span>
                Attention: {unansweredCount} question{unansweredCount > 1 ? 's remain' : ' remains'} unanswered. You may resume and answer prior to finalization.
              </span>
            </div>
          )}

          <p className="text-[13px] text-slate-600 leading-relaxed">
            Upon submission, your answers and encrypted behavioral telemetry record will be cryptographically locked for human examiner evaluation.
          </p>
        </div>
      </Modal>
    </div>
  );
};
