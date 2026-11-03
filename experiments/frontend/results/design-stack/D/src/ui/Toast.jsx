export default function Toast({ children }) {
  return (
    <div
      role="status"
      className="absolute top-4 right-4 left-4 flex items-center gap-3 rounded-lg bg-primary px-4 py-4 text-[15px] text-inverse"
    >
      <span className="h-5 w-1 rounded-full bg-brand" />
      {children}
    </div>
  );
}
