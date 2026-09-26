import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  FileText,
  LayoutGrid,
  ListChecks,
  LogOut,
  Monitor,
  Search,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { Link, navigate, useRoute } from '../router';
import { NavBrand, Pipeline } from '../components/brand/Wordmark';
import { Avatar } from '../components/layout/Avatar';
import { Button } from '../components/primitives/Button';
import { Examiner, SessionRecord } from '../domain/types';

/**
 * Examiner console shell.
 *
 * The only interface in the product that is genuinely dense, and deliberately
 * so: an examiner comparing two sessions does not want whitespace, they want
 * more columns. The layout is a fixed left rail, a command bar, and a content
 * area that is never centred — content starts at the left edge because that is
 * where the eye starts and where a table's row numbers belong.
 */

const NAV_GROUPS: { group: string; items: { to: string; label: string; icon: ReactNode; badge?: number }[] }[] = [
  {
    group: 'Operations',
    items: [
      { to: '/examinations', label: 'Console', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
      { to: '/queue', label: 'Review queue', icon: <ListChecks className="w-3.5 h-3.5" />, badge: 7 },
      { to: '/live', label: 'Live sessions', icon: <Activity className="w-3.5 h-3.5" />, badge: 3 },
    ],
  },
  {
    group: 'Evidence',
    items: [
      { to: '/evidence', label: 'Evidence library', icon: <BookOpen className="w-3.5 h-3.5" /> },
      { to: '/policy', label: 'Policy library', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    ],
  },
  {
    group: 'Programme',
    items: [
      { to: '/schedule', label: 'Schedule', icon: <CalendarDays className="w-3.5 h-3.5" /> },
      { to: '/reports', label: 'Reports', icon: <FileText className="w-3.5 h-3.5" /> },
      { to: '/analytics', label: 'Analytics', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    ],
  },
  {
    group: 'Administration',
    items: [
      { to: '/devices', label: 'Devices', icon: <Monitor className="w-3.5 h-3.5" /> },
      { to: '/audit', label: 'Audit log', icon: <ClipboardCheck className="w-3.5 h-3.5" /> },
      { to: '/settings', label: 'Settings', icon: <Settings className="w-3.5 h-3.5" /> },
    ],
  },
];

export function ExaminerShell({
  examiner,
  sessions,
  children,
}: {
  examiner: Examiner;
  sessions: SessionRecord[];
  children: ReactNode;
}) {
  const path = useRoute();
  const [accountOpen, setAccountOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const queued = sessions.filter(s => s.reviewStatus === 'queued').length;
  const live = sessions.filter(s => s.status === 'live').length;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setCommandOpen(open => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-dvh bg-neutral-50 flex">
      <a href="#console-main" className="skip-link">
        Skip to content
      </a>

      {/* Left rail */}
      <nav
        aria-label="Console sections"
        className="hidden lg:flex flex-col w-[212px] shrink-0 bg-white border-r border-neutral-200 sticky top-0 h-dvh"
      >
        <div className="h-14 flex items-center px-3.5 border-b border-neutral-200">
          <NavBrand to="/" tag="Examiner" />
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-2">
          {NAV_GROUPS.map(section => (
            <div key={section.group} className="mb-4 last:mb-0">
              <div className="eyebrow px-2 mb-1.5">{section.group}</div>
              <ul className="space-y-px">
                {section.items.map(item => {
                  const active = path === item.to || (item.to !== '/examinations' && path.startsWith(item.to));
                  const badge =
                    item.to === '/queue' ? queued : item.to === '/live' ? live : item.badge;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className={`flex items-center gap-2.5 h-8 px-2 rounded-[3px] text-[12.5px] font-medium transition-colors ${
                          active
                            ? 'bg-neutral-900 text-white'
                            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                        }`}
                      >
                        <span className={active ? 'text-white/80' : 'text-neutral-400'}>{item.icon}</span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {badge !== undefined && badge > 0 && (
                          <span
                            className={`data text-[10.5px] px-1.5 h-[17px] inline-flex items-center rounded-[2px] ${
                              active ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-neutral-200 p-2">
          <AccountMenu examiner={examiner} open={accountOpen} setOpen={setAccountOpen} />
        </div>
      </nav>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 h-14 bg-white border-b border-neutral-200 flex items-center gap-3 px-4 lg:px-6">
          <div className="lg:hidden">
            <NavBrand to="/" />
          </div>

          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="hidden md:flex items-center gap-2 h-8 px-2.5 w-[280px] border border-neutral-200 rounded-[3px] text-[12.5px] text-neutral-400 hover:border-neutral-300 hover:text-neutral-500 transition-colors text-left"
          >
            <Search className="w-3.5 h-3.5" aria-hidden="true" />
            Search sessions, candidates…
            <span className="ml-auto data text-[10.5px] border border-neutral-200 rounded-[2px] px-1 py-px text-neutral-400">
              ⌘K
            </span>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11.5px] text-neutral-500 mr-1">
              <span className="w-1.5 h-1.5 rounded-[1px] bg-neutral-900" aria-hidden="true" />
              {live} live · {queued} queued
            </span>
            <Button size="sm" variant="ghost" icon={<Bell className="w-3.5 h-3.5" />} aria-label="Notifications" />
            <div className="lg:hidden">
              <AccountMenu examiner={examiner} open={accountOpen} setOpen={setAccountOpen} compact />
            </div>
          </div>
        </header>

        <main id="console-main" className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {commandOpen && <CommandPalette sessions={sessions} onClose={() => setCommandOpen(false)} />}

      {/* Mobile section switcher */}
      <nav
        aria-label="Console sections, compact"
        className="lg:hidden sticky bottom-0 z-20 bg-white border-t border-neutral-200 flex overflow-x-auto"
      >
        {NAV_GROUPS.flatMap(s => s.items).map(item => {
          const active = path === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex-1 min-w-[64px] flex flex-col items-center gap-1 py-2 px-1 text-[10px] font-medium ${
                active ? 'text-neutral-900' : 'text-neutral-500'
              }`}
            >
              {item.icon}
              <span className="truncate w-full text-center">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function AccountMenu({
  examiner,
  open,
  setOpen,
  compact,
}: {
  examiner: Examiner;
  open: boolean;
  setOpen: (value: boolean) => void;
  compact?: boolean;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`w-full flex items-center gap-2.5 h-10 px-2 rounded-[3px] hover:bg-neutral-100 transition-colors ${
          compact ? 'justify-center' : ''
        }`}
      >
        <Avatar initials={examiner.name.split(' ').map(p => p[0]).join('').slice(0, 2)} />
        {!compact && (
          <>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-[12.5px] font-medium text-neutral-900 truncate">
                {examiner.name}
              </span>
              <span className="block text-[11px] text-neutral-500 truncate">
                {examiner.role}
              </span>
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="menu"
            className="absolute bottom-full left-0 mb-1 w-[196px] bg-white border border-neutral-300 rounded-[3px] shadow-[0_6px_18px_-8px_rgba(0,0,0,0.2)] z-20 py-1"
          >
            <div className="px-3 py-2 border-b border-neutral-100">
              <div className="text-[12.5px] font-medium text-neutral-900">{examiner.name}</div>
              <div className="data text-[11px] text-neutral-500">{examiner.id}</div>
            </div>
            <MenuItem to="/settings" onNavigate={() => setOpen(false)}>
              Profile and preferences
            </MenuItem>
            <MenuItem to="/settings#security" onNavigate={() => setOpen(false)}>
              Security
            </MenuItem>
            <div className="h-px bg-neutral-100 my-1" />
            <MenuItem to="/" onNavigate={() => setOpen(false)}>
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              Sign out
            </MenuItem>
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  to,
  children,
  onNavigate,
}: {
  to: string;
  children: ReactNode;
  onNavigate: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      role="menuitem"
      className="w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors text-left"
    >
      {children}
    </Link>
  );
}

/** ⌘K search over sessions and candidates. */
function CommandPalette({ sessions, onClose }: { sessions: SessionRecord[]; onClose: () => void }) {
  const [query, setQuery] = useState('');

  const results = sessions.filter(session => {
    const q = query.toLowerCase();
    return (
      session.id.toLowerCase().includes(q) ||
      session.candidate.name.toLowerCase().includes(q) ||
      session.candidate.registrationId.toLowerCase().includes(q) ||
      session.examTitle.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-neutral-900/25" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-[540px] bg-white border border-neutral-300 rounded-[4px] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="flex items-center gap-2.5 px-3.5 h-11 border-b border-neutral-200">
          <Search className="w-4 h-4 text-neutral-400" aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search sessions, candidates, exams…"
            className="flex-1 text-[13.5px] outline-none placeholder:text-neutral-400"
            aria-label="Search"
            onKeyDown={e => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && results[0]) {
                navigate(`/examinations/${results[0].id}`);
                onClose();
              }
            }}
          />
          <span className="data text-[10.5px] text-neutral-400 border border-neutral-200 rounded-[2px] px-1 py-px">
            ESC
          </span>
        </div>
        <div className="max-h-[320px] overflow-y-auto py-1">
          {results.length === 0 && (
            <p className="px-3.5 py-6 text-center text-[12.5px] text-neutral-500">No matching sessions.</p>
          )}
          {results.slice(0, 8).map(session => (
            <Link
              key={session.id}
              to={`/examinations/${session.id}`}
              onClick={onClose}
              className="flex items-center gap-3 px-3.5 py-2 hover:bg-neutral-50"
            >
              <span className="data text-[11.5px] text-neutral-400 w-[62px] shrink-0">{session.id}</span>
              <span className="text-[12.5px] text-neutral-900 truncate flex-1">{session.candidate.name}</span>
              <span className="text-[11.5px] text-neutral-500 truncate max-w-[200px] hidden sm:block">
                {session.examTitle}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export { Pipeline };
