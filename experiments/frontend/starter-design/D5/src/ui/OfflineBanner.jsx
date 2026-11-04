export default function OfflineBanner({ children }) {
  return (
    <div role="alert" className="bg-danger/12 px-6 py-3 text-[14px] font-medium text-danger-strong">
      {children}
    </div>
  );
}
