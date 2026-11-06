import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@repo/ui/button";
import { StatusBadge } from "@repo/ui/status-badge";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <h1 className="text-primary">대출 관리</h1>
    <StatusBadge status="loaned" />
    <StatusBadge status="overdue" />
    <Button>반납 처리</Button>
  </StrictMode>,
);
