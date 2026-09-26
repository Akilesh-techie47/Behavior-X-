import { Link } from '../../router';
import { Button } from '../../components/primitives/Button';

export function NotFound() {
  return (
    <div className="mx-auto max-w-[520px] px-6 py-24 text-center">
      <div className="eyebrow mb-4">Error 404</div>
      <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">
        That page does not exist
      </h1>
      <p className="mt-3 text-[14px] leading-relaxed text-neutral-600">
        The address may be mistyped, or the record it referred to may have been closed and
        archived. Session identifiers are of the form S-1025.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/">
          <Button variant="primary">Return to the start</Button>
        </Link>
        <Link to="/examinations">
          <Button variant="outline">Examiner console</Button>
        </Link>
      </div>
    </div>
  );
}
