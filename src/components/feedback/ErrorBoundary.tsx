import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../primitives/Button';
import { ErrorBlock } from './StateBlock';

/**
 * A render error is a blank screen unless something catches it.
 *
 * This is not a theoretical concern for this product. A screen that throws while
 * reading a session an examiner was mid-way through is the worst possible moment
 * to show a white page, and it is exactly the moment an error is most likely —
 * a record with a gap, a bundle referencing a signal from a partial fixture, a
 * null where a name should be. The boundary turns that into a sentence the
 * examiner can read and a button that costs them nothing to press.
 *
 * It is deliberately at the screen level rather than around the whole app: a
 * failed chunk should not take the navigation with it, and the examiner must
 * still be able to leave the screen that broke.
 */

interface Props {
  children: ReactNode;
  /** Shown in the recovery message. "this view" reads better than a route. */
  scope?: string;
  onReset?: () => void;
}

interface State {
  error: Error | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(previous: Props): void {
    /* Navigating away from a broken screen must not leave the message up. */
    if (this.state.error !== null && previous.children !== this.props.children) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    /* Kept out of the interface on purpose: an examiner does not need a stack
     * trace, but a developer opening the console should find it. */
    console.error('Render error caught by RouteErrorBoundary', error, info.componentStack);
  }

  private readonly reset = (): void => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error === null) return this.props.children;

    const scope = this.props.scope ?? 'this view';

    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-[62ch]">
          <ErrorBlock
            title={`${cap(scope)} could not be displayed`}
            kind="other"
            message={`Something in the data for ${scope} was not in the shape this page expects. Nothing has been changed or lost. Try again, and if it keeps happening, tell an administrator the page and what you were doing.`}
            onRetry={this.reset}
          >
            <details className="mt-3">
              <summary className="text-[12px] text-neutral-500 cursor-pointer">
                Technical detail
              </summary>
              <p className="data mt-1.5 text-[11.5px] text-neutral-500 break-words">
                {error.message}
              </p>
            </details>
          </ErrorBlock>
          <div className="mt-3">
            <Button variant="ghost" onClick={this.reset}>
              Reload {scope}
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

function cap(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
