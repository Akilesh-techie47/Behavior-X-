import { BehaviorEvent } from '../../types';

export interface SignalDetector {
  readonly id: string;
  start(onEvent: (event: BehaviorEvent) => void): void;
  stop(): void;
  isRunning(): boolean;
}
