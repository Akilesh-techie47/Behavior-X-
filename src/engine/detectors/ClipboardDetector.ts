import { BehaviorEvent } from '../../types';
import { BehaviorConfig } from '../config';
import { EventDebouncer } from '../EventDebouncer';
import { SignalDetector } from './SignalDetector';

export class ClipboardDetector implements SignalDetector {
  readonly id = 'clipboard_detector';
  private running = false;
  private onEventCallback: ((event: BehaviorEvent) => void) | null = null;
  private config: BehaviorConfig;
  private debouncer: EventDebouncer;
  private sessionId: string;

  constructor(sessionId: string, config: BehaviorConfig, debouncer: EventDebouncer) {
    this.sessionId = sessionId;
    this.config = config;
    this.debouncer = debouncer;
  }

  public setSessionId(id: string): void {
    this.sessionId = id;
  }

  public start(onEvent: (event: BehaviorEvent) => void): void {
    if (this.running) return;
    this.running = true;
    this.onEventCallback = onEvent;

    if (typeof window !== 'undefined') {
      window.addEventListener('copy', this.handleCopy);
      window.addEventListener('paste', this.handlePaste);
      window.addEventListener('cut', this.handleCut);
    }
  }

  public stop(): void {
    if (!this.running) return;
    this.running = false;
    this.onEventCallback = null;

    if (typeof window !== 'undefined') {
      window.removeEventListener('copy', this.handleCopy);
      window.removeEventListener('paste', this.handlePaste);
      window.removeEventListener('cut', this.handleCut);
    }
  }

  public isRunning(): boolean {
    return this.running;
  }

  private handleCopy = (e: ClipboardEvent) => {
    const textLength = window.getSelection()?.toString().length || 0;
    const now = Date.now();

    this.emit({
      id: `evt-copy-${now}-${Math.random().toString(36).substring(2, 6)}`,
      sessionId: this.sessionId,
      timestamp: now,
      type: 'CLIPBOARD_COPY',
      category: 'interaction',
      severity: textLength > 100 ? 'medium' : 'low',
      confidence: 1.0,
      duration: 300,
      durationSeconds: 0.3,
      source: 'keystroke_detector',
      description: `Clipboard copy operation intercepted (${textLength} characters selected).`,
      evidence: {
        clipboardLength: textLength,
        additionalContext: 'Copy event intercepted in active browser window.',
      },
    });
  };

  private handlePaste = (e: ClipboardEvent) => {
    const pastedData = e.clipboardData?.getData('text') || '';
    const textLength = pastedData.length;
    const now = Date.now();

    const isLargePaste = textLength > 120;
    this.emit({
      id: `evt-paste-${now}-${Math.random().toString(36).substring(2, 6)}`,
      sessionId: this.sessionId,
      timestamp: now,
      type: 'CLIPBOARD_PASTE',
      category: 'interaction',
      severity: isLargePaste ? 'high' : 'medium',
      confidence: 1.0,
      duration: 500,
      durationSeconds: 0.5,
      source: 'keystroke_detector',
      description: isLargePaste
        ? `Substantial external text insertion via paste (${textLength} chars). AI-era integrity check recommended.`
        : `Clipboard paste action executed (${textLength} chars).`,
      evidence: {
        clipboardLength: textLength,
        clipboardTextSnippet: textLength > 0 ? pastedData.slice(0, 40) + '...' : undefined,
        additionalContext: 'Paste event detected within exam workspace.',
      },
    });
  };

  private handleCut = () => {
    const now = Date.now();
    this.emit({
      id: `evt-cut-${now}-${Math.random().toString(36).substring(2, 6)}`,
      sessionId: this.sessionId,
      timestamp: now,
      type: 'CLIPBOARD_CUT',
      category: 'interaction',
      severity: 'low',
      confidence: 1.0,
      duration: 300,
      durationSeconds: 0.3,
      source: 'keystroke_detector',
      description: 'Clipboard cut action triggered in exam question response field.',
      evidence: {
        additionalContext: 'Cut event recorded.',
      },
    });
  };

  private emit(event: BehaviorEvent): void {
    if (this.onEventCallback) {
      this.onEventCallback(event);
    }
  }
}
