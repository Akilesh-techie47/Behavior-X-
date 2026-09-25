import { BehaviorEvent, EventCategory } from '../../types';

export interface FusedSignalBundle {
  activeCategories: EventCategory[];
  synergyMultiplier: number;
  correlatedSignals: BehaviorEvent[];
  modalityPresence: {
    camera: boolean;
    browser: boolean;
    keyboard: boolean;
    mouse: boolean;
    question: boolean;
  };
  dominantPatternDescription: string;
}

export class MultimodalFusionEngine {
  /**
   * Evaluates active events across modalities and applies synergy calculations
   */
  public fuse(events: BehaviorEvent[], windowDurationMs: number = 30000, now: number = Date.now()): FusedSignalBundle {
    const activeEvents = events.filter(e => now - e.timestamp <= windowDurationMs);

    const categories = new Set<EventCategory>();
    const modalityPresence = {
      camera: false,
      browser: false,
      keyboard: false,
      mouse: false,
      question: false,
    };

    activeEvents.forEach(e => {
      categories.add(e.category);
      if (e.category === 'presence' || e.category === 'attention') modalityPresence.camera = true;
      if (e.category === 'visibility') modalityPresence.browser = true;
      if (e.source === 'keystroke_detector' || e.category === 'interaction') {
        if (e.type.startsWith('MOUSE_') || e.type.startsWith('CURSOR_')) {
          modalityPresence.mouse = true;
        } else {
          modalityPresence.keyboard = true;
        }
      }
      if (e.category === 'question') modalityPresence.question = true;
    });

    const activeCategories = Array.from(categories);
    const categoryCount = activeCategories.length;

    // Cross-category synergy multiplier
    // Single modality = 1.0x
    // Two modalities = 1.35x
    // Three modalities = 1.70x
    // Four or more modalities = 2.10x
    let synergyMultiplier = 1.0;
    if (categoryCount >= 4) synergyMultiplier = 2.1;
    else if (categoryCount === 3) synergyMultiplier = 1.7;
    else if (categoryCount === 2) synergyMultiplier = 1.35;

    let dominantPatternDescription = 'Nominal single-channel telemetry';
    if (categoryCount >= 3) {
      dominantPatternDescription = `Multimodal correlation: ${activeCategories.join(' + ')} signals occurring concurrently.`;
    } else if (categoryCount === 2) {
      dominantPatternDescription = `Dual-modality correlation: ${activeCategories[0]} correlated with ${activeCategories[1]}.`;
    } else if (activeEvents.length > 0) {
      dominantPatternDescription = `Isolated single-modality observation (${activeCategories[0] || 'telemetry'}).`;
    }

    return {
      activeCategories,
      synergyMultiplier,
      correlatedSignals: activeEvents,
      modalityPresence,
      dominantPatternDescription,
    };
  }
}
