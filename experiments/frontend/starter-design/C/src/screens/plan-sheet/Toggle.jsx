import { cx } from '../../ui/cx.js';

export default function Toggle({ checked, onChange, 'aria-label': ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      aria-label={ariaLabel}
      onClick={() => onChange?.(!checked)}
      className="inline-flex h-11 items-center bg-transparent p-0"
    >
      <span className={cx('relative block h-7 w-12 rounded-full transition-colors', checked ? 'bg-brand' : 'bg-line')}>
        <span
          className={cx(
            'absolute top-0.5 left-0.5 size-6 rounded-full bg-surface transition-transform',
            checked && 'translate-x-5',
          )}
        />
      </span>
    </button>
  );
}
