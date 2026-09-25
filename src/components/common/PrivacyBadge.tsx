import React, { useState } from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export const PrivacyBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-xs font-semibold text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors shadow-2xs ${className}`}
        title="Click to view our privacy architecture"
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Privacy Shield</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Behavior-X Privacy Architecture"
        subtitle="Zero raw video retention and privacy-preserving edge processing"
        maxWidth="lg"
        footer={
          <Button variant="primary" size="sm" onClick={() => setIsOpen(false)}>
            Close Architecture Charter
          </Button>
        }
      >
        <div className="space-y-4 text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
          <div className="p-3.5 rounded-md bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-start gap-3">
            <Cpu className="w-5 h-5 text-black dark:text-white flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-black dark:text-white text-xs">
                Zero Video or Biometric Storage (0ms)
              </h5>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                Webcam frames are analyzed transiently in volatile RAM for under 100ms and immediately discarded. No video recordings, biometric face embeddings, or demographic profiles are ever stored on disk or transmitted.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-black dark:text-white text-xs uppercase tracking-wider">
              Core Privacy Guarantees
            </h5>
            <ul className="list-disc pl-5 space-y-2 text-xs text-neutral-700 dark:text-neutral-300">
              <li>
                <strong>Observable Telemetry Only:</strong> The system records observable actions (e.g. looking away, browser tab hidden). It never infers guilt, internal mental states, or protected traits.
              </li>
              <li>
                <strong>No Biometric Recognition:</strong> No identity verification models, facial vectors, or biometric templates are generated.
              </li>
              <li>
                <strong>Explainable Evidence:</strong> Scores represent review priorities for human academic staff, supported by inspectable evidence graphs.
              </li>
              <li>
                <strong>Human-in-the-Loop Sovereign:</strong> Certified examiners make all determinations. No student is ever automatically accused or penalized.
              </li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  );
};
