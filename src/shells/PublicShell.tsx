import type { ReactNode } from 'react';
import { Link, useRoute } from '../router';
import { NavBrand } from '../components/brand/Wordmark';
import { Button } from '../components/primitives/Button';

const PUBLIC_LINKS = [
  { to: '/method', label: 'Method' },
  { to: '/privacy', label: 'Data handling' },
  { to: '/help', label: 'Help' },
];

/** Marketing and public pages. Deliberately not the examiner console's
 *  furniture, so there is no confusion about which side of the product a
 *  reader is on. */
export function PublicShell({ children }: { children: ReactNode }) {
  const path = useRoute();

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-[2px]">
        <div className="mx-auto max-w-[1180px] px-6 h-14 flex items-center justify-between gap-6">
          <NavBrand to="/" tag="Examination integrity" />
          <nav className="flex items-center gap-1" aria-label="Primary">
            {PUBLIC_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-2.5 h-8 inline-flex items-center text-[12.5px] font-medium rounded-[3px] transition-colors ${
                  path.startsWith(link.to)
                    ? 'text-neutral-900 bg-neutral-100'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <span className="w-px h-4 bg-neutral-200 mx-2" aria-hidden="true" />
            <Link to="/signin">
              <Button size="sm" variant="primary">
                Sign in
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-[1180px] px-6 py-10">
          <div className="flex flex-wrap gap-x-12 gap-y-8 justify-between">
            <div className="max-w-[42ch]">
              <NavBrand to="/" />
              <p className="mt-3 text-[12.5px] leading-relaxed text-neutral-500">
                Observation and evidence infrastructure for supervised and remote
                examination. The record describes what was observed, what it means in
                context, and what a human decided.
              </p>
            </div>
            <FooterColumn
              title="Product"
              links={[
                { to: '/method', label: 'Method' },
                { to: '/examinations', label: 'Examiner console' },
                { to: '/student', label: 'Candidate access' },
              ]}
            />
            <FooterColumn
              title="Trust"
              links={[
                { to: '/privacy', label: 'Data handling' },
                { to: '/help', label: 'Help centre' },
              ]}
            />
            <FooterColumn
              title="Demonstration"
              links={[
                { to: '/examinations/S-1025', label: 'Sample review' },
                { to: '/mobile', label: 'Companion device' },
              ]}
            />
          </div>
          <div className="mt-10 pt-5 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11.5px] text-neutral-400">
              Demonstration build. All names, records and observations are synthetic.
            </p>
            <p className="data text-[11px] text-neutral-400">BUILD 0.9.0-DEMO</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <div className="eyebrow mb-3">{title}</div>
      <ul className="space-y-2">
        {links.map(link => (
          <li key={link.to}>
            <Link to={link.to} className="text-[12.5px] text-neutral-600 hover:text-neutral-900 transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
