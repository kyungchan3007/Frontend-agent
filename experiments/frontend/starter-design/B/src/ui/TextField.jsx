import { cx } from './cx.js';

export default function TextField({ className, children }) {
  return <div className={cx('flex h-12 items-center rounded-md border bg-surface px-4', className)}>{children}</div>;
}
