import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Card } from "@repo/ui/card";
import { StatusBadge } from "@repo/ui/status-badge";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <h1 className="text-primary">통계</h1>
    <Card title="인기 도서">
      <StatusBadge status="available" />
    </Card>
  </StrictMode>,
);
