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
        className={`inline-flex items-center gap-1.5 h-8 px-3 text-[13px] font-medium rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors ${className}`}
        title="Click to view our privacy architecture"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span className="hidden xl:inline">Privacy Shield</span>
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
        <div className="space-y-5 text-[13px] text-slate-700 leading-relaxed">
          <div className="panel-inset p-4 flex items-start gap-3 bg-white">
            <Cpu className="w-[18px] h-[18px] text-brand-700 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold text-slate-900 text-sm">
                Zero Video or Biometric Storage (0ms)
              </h5>
              <p className="mt-1 text-slate-600">
                Webcam frames are analyzed transiently in volatile RAM for under 100ms and immediately discarded. No video recordings, biometric face embeddings, or demographic profiles are ever stored on disk or transmitted.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <h5 className="eyebrow text-slate-700">Core Privacy Guarantees</h5>
            <ul className="space-y-2.5 text-slate-700">
              <li className="flex gap-2.5">
                <span className="mt-[7px] w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                <span>
                  <strong className="font-semibold text-slate-900">Observable Telemetry Only:</strong> The system records observable actions (e.g. looking away, browser tab hidden). It never infers guilt, internal mental states, or protected traits.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-[7px] w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                <span>
                  <strong className="font-semibold text-slate-900">No Biometric Recognition:</strong> No identity verification models, facial vectors, or biometric templates are generated.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-[7px] w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                <span>
                  <strong className="font-semibold text-slate-900">Explainable Evidence:</strong> Scores represent review priorities for human academic staff, supported by inspectable evidence graphs.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-[7px] w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                <span>
                  <strong className="font-semibold text-slate-900">Human-in-the-Loop Sovereign:</strong> Certified examiners make all determinations. No student is ever automatically accused or penalized.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  );
};
