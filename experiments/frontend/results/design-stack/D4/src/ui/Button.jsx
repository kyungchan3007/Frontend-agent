import { cx } from './cx.js';

const variants = {
  primary: 'bg-brand-strong text-inverse',
  secondary: 'bg-brand-soft text-brand-strong',
  ghost: 'bg-surface text-primary border border-line',
  danger: 'bg-danger-strong text-inverse',
  dangerOutline: 'bg-surface text-danger-strong border border-danger-strong',
};
const sizes = { L: 'h-13 px-6 text-[17px]', M: 'h-10 px-5 text-[15px]', S: 'h-8 px-3 text-[13px]' };

export default function Button({ variant = 'primary', size = 'L', disabled, onClick, fullWidth, loading, children, ...rest }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={cx(
        'inline-flex items-center justify-center rounded-xl font-bold active:scale-[0.98] active:opacity-80 disabled:opacity-40',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
      )}
      {...rest}
    >
      {loading && <span aria-hidden="true" className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}
