import { cx } from './cx.js';

export default function Button({ className, children, ...rest }) {
  return (
    <button
      type="button"
      className={cx('inline-flex items-center justify-center rounded-md font-bold active:opacity-80 disabled:opacity-40', className)}
      {...rest}
    >
      {children}
    </button>
  );
}
