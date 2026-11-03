export default function BottomSheet({ children }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-end bg-dim">
      <section className="rounded-t-2xl bg-surface px-6 pt-3 pb-6">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
        {children}
      </section>
    </div>
  );
}
