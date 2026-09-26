import { Suspense, lazy, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Link, match, useRoute } from './router';
import { useAsync } from './hooks';
import { CURRENT_EXAMINER, services } from './services';
import { PublicShell } from './shells/PublicShell';
import { StudentShell } from './shells/StudentShell';
import { ExaminerShell } from './shells/ExaminerShell';
import { MobileShell } from './shells/MobileShell';
import { Landing } from './screens/public/Landing';
import { LoadingBlock } from './components/feedback/StateBlock';
import { RouteErrorBoundary } from './components/feedback/ErrorBoundary';
import type { StudentContext } from './shells/StudentShell';

/**
 * Only the landing page ships in the first chunk.
 *
 * A candidate opening a link on a bad connection should not download the
 * examiner's console, the analytics fixtures, or the report model. Each screen
 * below is fetched the first time it is opened, which also means a broken
 * screen cannot take the rest of the product down with it.
 */
const Method = lazy(() => import('./screens/public/Method').then(m => ({ default: m.Method })));
const Privacy = lazy(() => import('./screens/public/Privacy').then(m => ({ default: m.Privacy })));
const Help = lazy(() => import('./screens/public/Help').then(m => ({ default: m.Help })));
const SignIn = lazy(() => import('./screens/public/SignIn').then(m => ({ default: m.SignIn })));
const NotFound = lazy(() => import('./screens/public/NotFound').then(m => ({ default: m.NotFound })));

const StudentEntry = lazy(() => import('./screens/student/StudentEntry').then(m => ({ default: m.StudentEntry })));
const DeviceCheck = lazy(() => import('./screens/student/DeviceCheck').then(m => ({ default: m.DeviceCheck })));
const Agreement = lazy(() => import('./screens/student/Agreement').then(m => ({ default: m.Agreement })));
const Exam = lazy(() => import('./screens/student/Exam').then(m => ({ default: m.Exam })));
const Submitted = lazy(() => import('./screens/student/Submitted').then(m => ({ default: m.Submitted })));
const SessionDetail = lazy(() => import('./screens/shared/SessionDetail').then(m => ({ default: m.SessionDetail })));
const Replay = lazy(() => import('./screens/shared/Replay').then(m => ({ default: m.Replay })));

const Console = lazy(() => import('./screens/examiner/Console').then(m => ({ default: m.Console })));
const ReviewQueue = lazy(() => import('./screens/examiner/ReviewQueue').then(m => ({ default: m.ReviewQueue })));
const LiveSessions = lazy(() => import('./screens/examiner/LiveSessions').then(m => ({ default: m.LiveSessions })));
const Workspace = lazy(() => import('./screens/examiner/Workspace').then(m => ({ default: m.Workspace })));
const EvidenceLibrary = lazy(() => import('./screens/examiner/EvidenceLibrary').then(m => ({ default: m.EvidenceLibrary })));
const PolicyLibrary = lazy(() => import('./screens/examiner/PolicyLibrary').then(m => ({ default: m.PolicyLibrary })));
const Schedule = lazy(() => import('./screens/examiner/Schedule').then(m => ({ default: m.Schedule })));
const Reports = lazy(() => import('./screens/examiner/Reports').then(m => ({ default: m.Reports })));
const Analytics = lazy(() => import('./screens/examiner/Analytics').then(m => ({ default: m.Analytics })));
const Devices = lazy(() => import('./screens/examiner/Devices').then(m => ({ default: m.Devices })));
const AuditLog = lazy(() => import('./screens/examiner/AuditLog').then(m => ({ default: m.AuditLog })));
const Settings = lazy(() => import('./screens/examiner/Settings').then(m => ({ default: m.Settings })));
const Companion = lazy(() => import('./screens/examiner/Companion').then(m => ({ default: m.Companion })));
const CompanionPairing = lazy(() => import('./screens/examiner/Companion').then(m => ({ default: m.CompanionPairing })));

/**
 * The route table.
 *
 * Four shells, four audiences. The shells are chosen by path prefix rather
 * than by a flag, so it is not possible to end up with the examiner's chrome
 * around the candidate's interface — the failure this product is most likely
 * to have if the wiring is done lazily.
 */
export default function App() {
  const path = useRoute();
  const [pathname] = useMemo(() => [path.split('?')[0]], [path]);

  let screen: ReactNode;
  if (pathname.startsWith('/student')) {
    screen = <StudentRoutes path={pathname} />;
  } else if (pathname === '/companion') {
    screen = (
      <MobileShell>
        <Screen scope="this screen">
          <Companion />
        </Screen>
      </MobileShell>
    );
  } else if (EXAMINER_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(prefix))) {
    screen = <ExaminerRoutes path={pathname} />;
  } else {
    screen = <PublicRoutes path={pathname} />;
  }

  /* The outer Suspense is a backstop only: every screen is already wrapped in
   * its own boundary by `Screen`, so this can only fire if a shell itself fails
   * to load, which it cannot do while they are eagerly imported. */
  return <Suspense fallback={<RouteLoading />}>{screen}</Suspense>;
}

/**
 * Suspense and the error boundary belong *inside* the shell, around the screen.
 *
 * Putting them outside would mean a slow chunk removed the navigation and the
 * candidate's time remaining along with the page, which is the opposite of what
 * a fallback is for. Putting them here means the frame stays, the reader knows
 * where they are, and a screen that throws costs them one control to press
 * rather than the whole interface.
 */
function Screen({ scope, children }: { scope: string; children: ReactNode }) {
  return (
    <RouteErrorBoundary scope={scope}>
      <Suspense fallback={<RouteLoading />}>{children}</Suspense>
    </RouteErrorBoundary>
  );
}

/** Every path that is served by the examiner's shell. */
const EXAMINER_PREFIXES = [
  '/examinations',
  '/queue',
  '/live',
  '/evidence',
  '/policy',
  '/schedule',
  '/reports',
  '/analytics',
  '/devices',
  '/audit',
  '/settings',
  '/pair',
  '/sessions',
];

/**
 * The fallback keeps the shell's frame in place and says what is happening,
 * rather than replacing the page with a spinner: a reviewer who has just
 * clicked into a session should not be shown a blank screen while a chunk
 * arrives.
 */
function RouteLoading() {
  return (
    <div className="p-4 lg:p-6">
      <LoadingBlock rows={8} label="Loading this view" />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Public
 * ------------------------------------------------------------------ */

function PublicRoutes({ path }: { path: string }) {
  let screen = <Landing />;

  switch (path) {
    case '/method':
      screen = <Method />;
      break;
    case '/privacy':
      screen = <Privacy />;
      break;
    case '/help':
      screen = <Help />;
      break;
    case '/signin':
      screen = <SignIn />;
      break;
    default:
      if (path !== '/' && path !== '') screen = <NotFound />;
  }

  return <PublicShell><Screen scope="this page">{screen}</Screen></PublicShell>;
}

/* ------------------------------------------------------------------ *
 * Candidate
 * ------------------------------------------------------------------ */

function StudentRoutes({ path }: { path: string }) {
  const live = useAsync(() => services.sessions.list({ status: 'live' }), []);
  const session = (live.data ?? [])[0] ?? null;

  const context: StudentContext = {
    examTitle: session?.examTitle ?? 'Examination',
    sectionLabel: 'Section 1',
    seatId: session?.candidate.registrationId ?? '—',
    remainingSeconds: session ? Math.max(0, session.totalSeconds - session.elapsedSeconds) : null,
    connection: 'good',
    onWithdraw: () => window.location.assign('#/student/withdraw'),
  };

  const sessionDetail = match('/session/:id', path);
  const replay = match('/replay/:id', path);

  if (sessionDetail) {
    return (
      <StudentShell context={context}>
        <Screen scope={`session ${sessionDetail.id}`}>
          <SessionDetail sessionId={sessionDetail.id} />
        </Screen>
      </StudentShell>
    );
  }

  if (replay) {
    return (
      <StudentShell context={context}>
        <Screen scope={`replay ${replay.id}`}>
          <Replay sessionId={replay.id} />
        </Screen>
      </StudentShell>
    );
  }

  let screen = <StudentEntry />;

  switch (path) {
    case '/student/check':
      screen = <DeviceCheck />;
      break;
    case '/student/agreement':
      screen = <Agreement />;
      break;
    case '/student/exam':
      screen = <Exam />;
      break;
    case '/student/submitted':
      screen = <Submitted />;
      break;
    case '/student/withdraw':
      screen = <Withdrawn />;
      break;
    case '/student':
      screen = <StudentEntry />;
      break;
    default:
      screen = <NotFound />;
  }

  return <StudentShell context={context}><Screen scope="this page">{screen}</Screen></StudentShell>;
}

function Withdrawn() {
  return (
    <div className="mx-auto max-w-[620px] px-5 py-10">
      <div className="border border-neutral-200 bg-white p-6">
        <h1 className="text-[18px] font-semibold text-neutral-900">You have withdrawn</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-neutral-600">
          Your session has ended and the record is closed. Nothing further is being recorded
          on this device. Tell the invigilator if this was not what you meant, and they can
          record the correction on the session.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link to="/student">
            <span className="inline-flex items-center h-8 px-3 rounded-[3px] bg-neutral-900 text-white text-[12.5px] font-medium">
              Return to the start
            </span>
          </Link>
          <Link to="/help">
            <span className="inline-flex items-center h-8 px-3 rounded-[3px] border border-neutral-300 bg-white text-neutral-700 text-[12.5px] font-medium">
              Ask for help
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Examiner
 * ------------------------------------------------------------------ */

/**
 * The examiner shell needs the session list for its sidebar and its badges.
 * It is loaded once here rather than in the shell so that the shell stays a
 * presentational frame and can be rendered in a test with fixed props.
 */
function ExaminerFrame({ children, scope = 'this page' }: { children: ReactNode; scope?: string }) {
  const sessions = useAsync(() => services.sessions.list(), []);
  return (
    <ExaminerShell examiner={CURRENT_EXAMINER} sessions={sessions.data ?? []}>
      <Screen scope={scope}>{children}</Screen>
    </ExaminerShell>
  );
}

function ExaminerRoutes({ path }: { path: string }) {
  const workspace = match('/examinations/:id', path);
  const sessionDetail = match('/session/:id', path);
  const replay = match('/replay/:id', path);

  if (workspace) {
    return (
      <ExaminerFrame scope={`the review for ${workspace.id}`}>
        <Workspace sessionId={workspace.id} />
      </ExaminerFrame>
    );
  }

  if (sessionDetail) {
    return (
      <ExaminerFrame scope={`session ${sessionDetail.id}`}>
        <SessionDetail sessionId={sessionDetail.id} />
      </ExaminerFrame>
    );
  }

  if (replay) {
    return (
      <ExaminerFrame scope={`replay ${replay.id}`}>
        <Replay sessionId={replay.id} />
      </ExaminerFrame>
    );
  }

  let screen: ReactNode = <Console />;

  switch (path) {
    case '/queue':
      screen = <ReviewQueue />;
      break;
    case '/live':
      screen = <LiveSessions />;
      break;
    case '/evidence':
      screen = <EvidenceLibrary />;
      break;
    case '/policy':
      screen = <PolicyLibrary />;
      break;
    case '/schedule':
      screen = <Schedule />;
      break;
    case '/reports':
      screen = <Reports />;
      break;
    case '/analytics':
      screen = <Analytics />;
      break;
    case '/devices':
      screen = <Devices />;
      break;
    case '/audit':
      screen = <AuditLog />;
      break;
    case '/settings':
      screen = <Settings />;
      break;
    case '/pair':
      screen = <CompanionPairing />;
      break;
    case '/sessions':
      screen = <Console />;
      break;
    default:
      if (path !== '/examinations') screen = <NotFound />;
  }

  return <ExaminerFrame>{screen}</ExaminerFrame>;
}
