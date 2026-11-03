import { cx } from './cx.js';

export default function TextInput({ onChange, className, ...rest }) {
  return (
    <input
      type="text"
      onChange={(e) => onChange?.(e.target.value)}
      className={cx('min-w-0 flex-1 bg-transparent text-[15px] font-bold text-primary outline-none placeholder:font-normal placeholder:text-secondary', className)}
      {...rest}
    />
  );
}
