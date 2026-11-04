import { cx } from './cx.js';

export default function TextField({ value, onChange, error, trailing, type = 'text', id, placeholder, 'aria-label': ariaLabel }) {
  const errId = id && error ? `${id}-error` : undefined;
  return (
    <div>
      <div
        className={cx(
          'flex h-12 items-center rounded-md border bg-surface px-4',
          error ? 'border-danger' : 'border-line focus-within:border-brand',
        )}
      >
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-invalid={error ? true : undefined}
          aria-describedby={errId}
          onChange={(e) => onChange?.(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[15px] font-bold text-primary outline-none placeholder:font-normal placeholder:text-secondary"
        />
        {trailing}
      </div>
      {error && (
        <p id={errId} className="mt-1 text-[13px] text-danger-strong">
          {error}
        </p>
      )}
    </div>
  );
}
