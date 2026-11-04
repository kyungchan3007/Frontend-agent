import { cx } from './cx.js';

const variants = {
  plain: '',
  row: 'flex h-[48px] w-full items-center rounded-lg bg-canvas px-4',
  field: 'flex h-[44px] w-full items-center justify-between',
  option: 'flex h-[63px] w-full items-center rounded-lg border-2 px-4',
};

export default function Pressable({ variant = 'plain', selected, onClick, disabled, children, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'm-0 border-0 bg-transparent p-0 text-left text-inherit',
        variants[variant],
        variant === 'option' && (selected ? 'border-brand bg-brand-soft' : 'border-transparent bg-canvas'),
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
