import { cx } from './cx.js';

export default function FieldError({ className, children, ...rest }) {
  return (
    <p className={cx('mt-1 text-[13px] text-danger-strong', className)} {...rest}>
      {children}
    </p>
  );
}
