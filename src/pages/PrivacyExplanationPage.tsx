import React from 'react';
import { ShieldCheck, Eye, EyeOff, Lock, ServerOff, Database, Cpu, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export const PrivacyExplanationPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Page Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[11px] font-mono text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>DATA MINIMIZATION CHARTER • HACKEX '26</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Ethical & Privacy-Preserving Architecture
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
          How Behavior-X guarantees academic honesty while upholding human dignity, civil liberties, and international data protection standards.
        </p>
      </div>

      {/* Core Architectural Guarantees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card
          title="Zero Video Storage"
          subtitle="Transient RAM processing"
          badge={<ServerOff className="w-4 h-4 text-emerald-600" />}
        >
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Conventional proctoring tools upload continuous streams of students' bedrooms. Behavior-X processes frames strictly inside volatile browser memory, releasing each frame instantly after computing geometric vectors.
          </p>
        </Card>

        <Card
          title="No Biometric ID"
          subtitle="Non-invasive edge telemetry"
          badge={<EyeOff className="w-4 h-4 text-indigo-600" />}
        >
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            We do not create facial recognition embeddings, compare against biometric databases, or infer protected demographic traits such as race, gender, or age.
          </p>
        </Card>

        <Card
          title="Explainable Scoring"
          subtitle="Human examiner decides"
          badge={<Lock className="w-4 h-4 text-amber-500" />}
        >
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            The algorithm provides an anomaly index, not an accusation. An academic integrity examiner must inspect observable telemetry before any determination is reached.
          </p>
        </Card>
      </div>

      {/* Detailed Technical Principles */}
      <Card title="Technical Implementation Standards">
        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-slate-900 dark:text-white">FERPA & GDPR Compliance:</strong>
              <p className="mt-0.5 text-slate-500">
                Adheres strictly to the Principle of Data Minimization (Article 5(1)(c) of GDPR) by ensuring only the minimum necessary behavioral telemetry required for validation is collected.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-slate-900 dark:text-white">Neutral Terminology:</strong>
              <p className="mt-0.5 text-slate-500">
                System telemetry emits non-judgmental event descriptors: "Attention deviation", "Multiple-person presence", "Window blur", never "Cheating", "Suspicious intent", or "Dishonest".
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-slate-900 dark:text-white">Edge Processing Pipeline:</strong>
              <p className="mt-0.5 text-slate-500">
                Client camera data never leaves the student device. The only payload transmitted to the server is a lightweight audit ledger containing mathematical events (e.g., event type, duration, timestamp).
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl">
        <div>
          <h4 className="text-sm font-semibold">Ready to test the proctoring experience?</h4>
          <p className="text-xs text-slate-400">Experience the difference between surveillance and behavioral understanding.</p>
        </div>
        <Button
          variant="academic"
          size="md"
          onClick={() => onNavigate('/student')}
        >
          Launch Student Test
        </Button>
      </div>
    </div>
  );
};
