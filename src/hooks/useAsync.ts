import { useCallback, useEffect, useRef, useState } from 'react';
import { ServiceTimeoutError, ServiceUnavailableError } from '../services/contracts';

/**
 * The asynchronous state machine every data-backed screen in the product uses.
 *
 * `error` distinguishes three cases the interface must treat differently:
 *   - `unavailable`  the service could not be reached; the last known data
 *                    should stay on screen, marked stale
 *   - `timeout`      the request exceeded the response budget
 *   - `other`        a genuine failure, typically a not-found
 *
 * Keeping this in one hook is what stops each screen from inventing its own
 * idea of what "loading" looks like.
 */

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: { kind: 'unavailable' | 'timeout' | 'other'; message: string } | null;
  /** True while a background refresh runs over data already on screen. */
  refreshing: boolean;
}

export interface AsyncResult<T> extends AsyncState<T> {
  reload: () => void;
  /** Replace the data locally after a mutation, without a round trip. */
  mutate: (updater: (current: T) => T) => void;
}

function classify(error: unknown): AsyncState<never>['error'] {
  if (error instanceof ServiceUnavailableError) {
    return { kind: 'unavailable', message: error.message };
  }
  if (error instanceof ServiceTimeoutError) {
    return { kind: 'timeout', message: error.message };
  }
  if (error instanceof Error) {
    return { kind: 'other', message: error.message };
  }
  return { kind: 'other', message: 'Something went wrong.' };
}

export function useAsync<T>(
  produce: () => Promise<T>,
  deps: readonly unknown[],
  options: { enabled?: boolean } = {},
): AsyncResult<T> {
  const enabled = options.enabled ?? true;
  const [state, setState] = useState<AsyncState<T>>({
    status: enabled ? 'loading' : 'idle',
    data: null,
    error: null,
    refreshing: false,
  });

  const [nonce, setNonce] = useState(0);
  const produceRef = useRef(produce);
  produceRef.current = produce;
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle', data: null, error: null, refreshing: false });
      return;
    }

    let cancelled = false;
    setState(prev => ({
      status: prev.data === null ? 'loading' : prev.status,
      data: prev.data,
      error: null,
      refreshing: prev.data !== null,
    }));

    produceRef
      .current()
      .then(data => {
        if (cancelled || !mounted.current) return;
        setState({ status: 'success', data, error: null, refreshing: false });
      })
      .catch((error: unknown) => {
        if (cancelled || !mounted.current) return;
        setState(prev => ({
          status: prev.data === null ? 'error' : 'success',
          data: prev.data,
          error: classify(error),
          refreshing: false,
        }));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, enabled]);

  const reload = useCallback(() => setNonce(n => n + 1), []);

  const mutate = useCallback((updater: (current: T) => T) => {
    setState(prev => (prev.data === null ? prev : { ...prev, data: updater(prev.data) }));
  }, []);

  return { ...state, reload, mutate };
}

/**
 * Runs a one-shot action with pending and error state, for form submissions
 * such as saving a review decision.
 */
export function useAction<Args extends unknown[], Result>(
  action: (...args: Args) => Promise<Result>,
): {
  run: (...args: Args) => Promise<Result | null>;
  pending: boolean;
  error: string | null;
  clearError: () => void;
} {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const actionRef = useRef(action);
  actionRef.current = action;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (...args: Args) => {
    setPending(true);
    setError(null);
    try {
      const result = await actionRef.current(...args);
      return result;
    } catch (caught) {
      if (mounted.current) {
        setError(caught instanceof Error ? caught.message : 'The action could not be completed.');
      }
      return null;
    } finally {
      if (mounted.current) setPending(false);
    }
  }, []);

  return { run, pending, error, clearError: () => setError(null) };
}
