import { cx } from './cx.js';

export default function Chip({ selected, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      onClick={onClick}
      className={cx(
        'inline-flex h-8 items-center rounded-xl px-3 text-[13px] font-bold active:scale-[0.98]',
        selected ? 'bg-primary text-inverse' : 'border border-line bg-surface text-secondary',
      )}
    >
      {children}
      {selected && <span aria-hidden="true" className="ml-1.5 inline-block h-2 w-2 rounded-full bg-current" />}
    </button>
  );
}
