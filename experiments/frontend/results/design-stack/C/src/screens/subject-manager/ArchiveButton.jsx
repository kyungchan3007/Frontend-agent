export default function ArchiveButton({ onClick, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ml-2 inline-flex h-7 items-center justify-center rounded-xl active:scale-[0.98] border border-danger bg-surface px-2 text-[12px] font-bold text-danger active:opacity-80 disabled:opacity-40"
      {...rest}
    >
      보관
    </button>
  );
}
