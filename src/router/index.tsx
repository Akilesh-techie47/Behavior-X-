import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';

/**
 * Routing.
 *
 * Hash-based, ~90 lines, no dependency. Every screen in this product is a
 * deep link that a colleague can be pasted — "S-1025" has to survive being
 * sent over a review panel, so real paths would be preferable in production;
 * hash paths behave identically from a static host, a file path, or a laptop
 * with no server, which is how this build is actually reviewed.
 */

function currentPath(): string {
  const raw = window.location.hash.replace(/^#/, '');
  return raw === '' ? '/' : raw;
}

export function useRoute() {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const onChange = () => setPath(currentPath());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return path;
}

export function navigate(to: string, options: { replace?: boolean } = {}) {
  const target = `#${to.startsWith('/') ? to : `/${to}`}`;
  if (options.replace) {
    window.history.replaceState(null, '', target);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else if (window.location.hash === target) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = to.startsWith('/') ? to : `/${to}`;
  }
}

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
  replace?: boolean;
  children: ReactNode;
}

/** An internal link. Renders a real anchor so middle-click and copy-link work. */
export function Link({ to, replace, onClick, children, ...rest }: LinkProps) {
  const handle = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
        return;
      }
      event.preventDefault();
      navigate(to, { replace });
    },
    [onClick, to, replace],
  );

  return (
    <a href={`#${to}`} onClick={handle} {...rest}>
      {children}
    </a>
  );
}

/**
 * Matches a path against a pattern with `:param` segments.
 * `match('/examinations/:id', '/examinations/S-1')` returns `{ id: 'S-1' }`.
 */
export function match(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('?')[0].split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    const expected = patternParts[i];
    const actual = pathParts[i];
    if (expected.startsWith(':')) {
      params[expected.slice(1)] = decodeURIComponent(actual);
    } else if (expected !== actual) {
      return null;
    }
  }
  return params;
}

export function useQueryParam(name: string): string | null {
  const path = useRoute();
  return useMemo(() => {
    const queryIndex = path.indexOf('?');
    if (queryIndex === -1) return null;
    return new URLSearchParams(path.slice(queryIndex + 1)).get(name);
  }, [path, name]);
}

/** Programmatic navigation, stable across renders. */
export function useNavigate() {
  return useCallback(
    (to: string, options?: { replace?: boolean }) => navigate(to, options),
    [],
  );
}

export { currentPath as getCurrentPath };
