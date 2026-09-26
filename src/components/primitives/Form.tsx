import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { useId } from 'react';

/**
 * Form controls.
 *
 * Every control is label-associated, every group is a real fieldset, and errors
 * are wired through `aria-describedby` and `aria-invalid` rather than being
 * shown in red next to the field. Colour is not the error channel anywhere in
 * this product.
 */

const CONTROL_BASE =
  'w-full bg-white border border-neutral-300 rounded-[3px] text-[13.5px] text-neutral-900 ' +
  'placeholder:text-neutral-400 transition-colors duration-100 ' +
  'hover:border-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed';

const CONTROL_ERROR = 'border-neutral-900 border-2';

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className = '',
  id,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
  className?: string;
  id?: string;
}) {
  const generated = useId();
  const controlId = id ?? generated;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={controlId} className="block text-[12.5px] font-medium text-neutral-800 mb-1.5">
        {label}
        {required && (
          <span className="text-neutral-400 ml-1" aria-hidden="true">
            required
          </span>
        )}
      </label>
      {children({ id: controlId, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-[12px] text-neutral-500 leading-relaxed">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          className="mt-1.5 text-[12px] text-neutral-900 leading-relaxed flex items-start gap-1.5"
        >
          <span aria-hidden="true" className="verbatim mt-px">
            !
          </span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export function TextInput({
  className = '',
  invalid,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={`${CONTROL_BASE} h-9 px-2.5 ${invalid ? CONTROL_ERROR : ''} ${className}`}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

export function TextArea({
  className = '',
  invalid,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={`${CONTROL_BASE} px-2.5 py-2 leading-relaxed resize-y min-h-[80px] ${
        invalid ? CONTROL_ERROR : ''
      } ${className}`}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

export function Select({
  className = '',
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={`${CONTROL_BASE} h-8 pr-7 pl-2.5 appearance-none cursor-pointer ${className}`}
        {...rest}
      >
        {children}
      </select>
      <svg
        className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M2.5 4.5 6 8l3.5-3.5" />
      </svg>
    </div>
  );
}

/**
 * A switch, for settings that take effect immediately rather than on submit.
 * The label sits to the left of the control so the row reads as a sentence,
 * and the state is exposed to assistive technology through the native input.
 */
export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={`flex items-center gap-3 shrink-0 ${className}`}>
      <span id={`${id}-state`} className="data text-[10.5px] text-neutral-400 w-[26px] text-right">
        {checked ? 'On' : 'Off'}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-state`}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-[34px] h-[18px] rounded-[2px] border transition-colors ${
          checked ? 'bg-neutral-800 border-neutral-800' : 'bg-white border-neutral-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-[2px] w-[12px] h-[12px] rounded-[1px] transition-all ${
            checked ? 'left-[18px] bg-white' : 'left-[2px] bg-neutral-400'
          }`}
        />
      </button>
    </div>
  );
}

export function Checkbox({
  label,
  description,
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; description?: ReactNode }) {
  const id = useId();
  return (
    <div className={`flex items-start gap-2.5 ${className}`}>
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 w-3.5 h-3.5 rounded-[2px] border-neutral-400 shrink-0 cursor-pointer"
        {...rest}
      />
      <label htmlFor={id} className="cursor-pointer select-none">
        <span className="block text-[13px] text-neutral-800 leading-snug">{label}</span>
        {description && (
          <span className="block text-[12px] text-neutral-500 leading-relaxed mt-0.5">
            {description}
          </span>
        )}
      </label>
    </div>
  );
}

/** A radio rendered as a full-width selectable row. Used for exam options and
 *  review decisions, where the label needs room to be read. */
export function RadioRow({
  name,
  value,
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div
      className={[
        'relative flex items-start gap-3 px-3 py-2.5 border rounded-[3px] cursor-pointer',
        'transition-colors duration-100',
        checked ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400',
        disabled ? 'opacity-40 pointer-events-none' : '',
      ].join(' ')}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        disabled={disabled}
        className="mt-0.5 w-3.5 h-3.5 shrink-0 cursor-pointer"
      />
      <label htmlFor={id} className="cursor-pointer select-none min-w-0 flex-1">
        <span className="block text-[13.5px] text-neutral-900 leading-snug">{label}</span>
        {description && (
          <span className="block text-[12px] text-neutral-500 leading-relaxed mt-1">
            {description}
          </span>
        )}
      </label>
    </div>
  );
}

/** Label/value row used throughout the examiner console instead of more cards. */
export function DataRow({
  label,
  children,
  mono,
  className = '',
}: {
  label: ReactNode;
  children: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-1.5 ${className}`}>
      <dt className="text-[12px] text-neutral-500 shrink-0">{label}</dt>
      <dd className={`text-[13px] text-neutral-900 text-right min-w-0 ${mono ? 'data' : ''}`}>
        {children}
      </dd>
    </div>
  );
}

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2.5">{children}</div>;
}
