import { cx } from './cx.js';

export default function SubjectDot({ className }) {
  return <span aria-hidden="true" className={cx('inline-block size-3 shrink-0 rounded-full', className)} />;
}
