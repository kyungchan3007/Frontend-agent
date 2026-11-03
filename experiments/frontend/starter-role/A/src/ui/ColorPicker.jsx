import { cx } from './cx.js';
import { SUBJECT_COLORS } from './SubjectDot.jsx';

export default function ColorPicker({ value, onChange }) {
  return (
    <div className="flex gap-3">
      {Object.keys(SUBJECT_COLORS).map((key) => (
        <button
          key={key}
          type="button"
          aria-label={key}
          aria-pressed={value === key}
          onClick={() => onChange?.(key)}
          className={cx(
            'size-8 rounded-full border-2',
            SUBJECT_COLORS[key],
            value === key ? 'border-primary' : 'border-transparent',
          )}
        />
      ))}
    </div>
  );
}
