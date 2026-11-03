import { cx } from './cx.js';

const variants = {
  plain: '',
  back: 'text-[20px] font-bold text-primary',
  link: 'text-[12px] text-secondary',
  field: 'flex h-[44px] w-full items-center justify-between',
  option: 'flex h-[48px] w-full items-center rounded-lg bg-canvas px-4',
  card: 'flex h-[63px] w-full items-center rounded-lg border-2 px-4',
};

export default function Pressable({ variant = 'plain', selected, onClick, disabled, children, ...rest }) {
  const isCard = variant === 'card';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isCard ? !!selected : undefined}
      className={cx(
        'm-0 border-0 bg-transparent p-0 text-left text-inherit',
        variants[variant],
        isCard && (selected ? 'border-brand bg-brand-soft' : 'border-transparent bg-canvas'),
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
