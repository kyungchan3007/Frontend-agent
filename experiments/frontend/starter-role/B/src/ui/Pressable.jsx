import { cx } from './cx.js';

export default function Pressable({ onClick, disabled, className, children, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx('m-0 border-0 bg-transparent p-0 text-left text-inherit', className)}
      {...rest}
    >
      {children}
    </button>
  );
}
