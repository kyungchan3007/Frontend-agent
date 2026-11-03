import { cx } from './cx.js';

export const SUBJECT_COLORS = {
  blue: 'bg-subject-blue',
  cyan: 'bg-subject-cyan',
  amber: 'bg-subject-amber',
  violet: 'bg-subject-violet',
  green: 'bg-subject-green',
  rose: 'bg-subject-rose',
  slate: 'bg-subject-slate',
};

export default function SubjectDot({ color = 'slate', className }) {
  return <span aria-hidden="true" className={cx('inline-block size-3 shrink-0 rounded-full', SUBJECT_COLORS[color], className)} />;
}
