export type LoanStatus = "available" | "loaned" | "overdue";

const LABEL: Record<LoanStatus, string> = {
  available: "대출 가능",
  loaned: "대출 중",
  overdue: "연체",
};

// Tailwind가 클래스를 찾을 수 있도록 전체 이름을 그대로 적는다
const COLOR: Record<LoanStatus, string> = {
  available: "bg-status-available",
  loaned: "bg-status-loaned",
  overdue: "bg-status-overdue",
};

export function StatusBadge({ status }: { status: LoanStatus }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium text-surface ${COLOR[status]}`}>
      {LABEL[status]}
    </span>
  );
}
