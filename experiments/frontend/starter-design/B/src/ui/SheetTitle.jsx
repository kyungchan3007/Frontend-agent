import { cx } from './cx.js';

export default function SheetTitle({ className, children }) {
  return <h2 className={cx('mb-4 text-[20px] font-bold text-primary', className)}>{children}</h2>;
}
