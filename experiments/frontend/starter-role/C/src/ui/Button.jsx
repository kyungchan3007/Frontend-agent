import { cx } from './cx.js';

const variants = {
  primary: 'bg-brand-strong text-inverse',
  secondary: 'bg-brand-soft text-brand-strong',
  ghost: 'bg-surface text-primary border border-line',
  danger: 'bg-danger-strong text-inverse',
};
const sizes = { L: 'h-13 px-6 text-[17px]', M: 'h-10 px-5 text-[15px]', S: 'h-8 px-3 text-[13px]' };

export default function Button({ variant = 'primary', size = 'L', disabled, onClick, className, children, ...rest }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'inline-flex items-center justify-center rounded-md font-bold active:opacity-80 disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
