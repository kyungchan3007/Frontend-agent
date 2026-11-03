import { cx } from './cx.js';

export default function Chip({ className, children, ...rest }) {
  return (
    <button type="button" className={cx('inline-flex h-8 items-center rounded-xl active:scale-[0.98] px-3 text-[13px] font-bold', className)} {...rest}>
      {children}
    </button>
  );
}
