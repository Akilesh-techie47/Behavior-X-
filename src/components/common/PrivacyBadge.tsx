import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export const PrivacyBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-xs font-semibold text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs ${className}`}
        title="Click to view our privacy promise"
      >
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span>Privacy Shield Active</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Behavior-X Privacy Promise"
        subtitle="How we protect student privacy during exams"
        maxWidth="lg"
        footer={
          <Button variant="primary" size="sm" onClick={() => setIsOpen(false)}>
            Got it, thanks!
          </Button>
        }
      >
        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex items-start gap-3">
            <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-indigo-950 dark:text-indigo-200 text-xs">
                Zero Video or Photo Storage
              </h5>
              <p className="mt-1 text-xs text-slate-800 dark:text-slate-200">
                Your webcam is only checked inside your browser to see head movement. Frames are instantly erased in memory in less than a second. No videos, photos, or face scans are ever saved to a server or seen by anyone.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-slate-900 dark:text-white text-xs">
              Our 4 Core Promises to Students
            </h5>
            <ul className="list-disc pl-5 space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <li>
                <strong>Simple Actions Only:</strong> We only check basic movements (like looking away or switching tabs). We never claim to read your mind or judge your thoughts.
              </li>
              <li>
                <strong>No Face Recognition:</strong> We never identify who you are with facial recognition or store biometric face scans.
              </li>
              <li>
                <strong>Scores Mean "Check Context":</strong> A higher score never means you cheated. It only means "a human teacher should review what happened."
              </li>
              <li>
                <strong>Human Teachers Decide:</strong> A computer will never fail you. A real teacher reviews your answers and any notes before making any decisions.
              </li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  );
};
