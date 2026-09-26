import { useEffect, useRef, useState } from 'react';

export * from './useAsync';

/** Ticking countdown to a wall-clock deadline. */
export function useCountdown(targetMs: number | null): number {
  const [remaining, setRemaining] = useState(() =>
    targetMs === null ? 0 : Math.max(0, Math.round((targetMs - Date.now()) / 1000)),
  );
  const targetRef = useRef(targetMs);
  targetRef.current = targetMs;

  useEffect(() => {
    if (targetMs === null) return;
    const tick = () => {
      setRemaining(Math.max(0, Math.round((targetRef.current! - Date.now()) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  return remaining;
}

/** A clock that ticks once a second, for live "x min ago" columns. */
export function useTick(intervalMs = 30_000): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(list.matches);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** True when the viewer has asked for reduced motion. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/** Traps Tab focus inside a container while it is open. */
export function useFocusTrap(active: boolean) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active || !ref.current) return;
    const node = ref.current;
    const selector =
      'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(selector)).filter(
        el => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    node.addEventListener('keydown', onKeyDown);
    const previous = document.activeElement as HTMLElement | null;
    const target = node.querySelector<HTMLElement>(selector);
    target?.focus();

    return () => {
      node.removeEventListener('keydown', onKeyDown);
      previous?.focus();
    };
  }, [active]);

  return ref;
}

/** Reads and writes a value in localStorage without throwing in private mode. */
export function useStoredState<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });

  const set = (next: T) => {
    setValue(next);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* storage unavailable — the value still applies for this page view */
    }
  };

  return [value, set];
}
