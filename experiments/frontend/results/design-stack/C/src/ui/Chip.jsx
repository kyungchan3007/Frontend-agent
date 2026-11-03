import { cx } from './cx.js';

export default function Chip({ selected, onClick, className, children }) {
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      onClick={onClick}
      className={cx(
        'inline-flex h-8 items-center rounded-xl active:scale-[0.98] px-3 text-[13px] font-bold',
        selected ? 'bg-primary text-inverse' : 'border border-line bg-surface text-secondary',
        className,
      )}
    >
      {children}
    </button>
  );
}
