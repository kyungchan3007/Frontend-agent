import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { StatusBadge } from "@repo/ui/status-badge";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <h1 className="text-primary">도서 검색</h1>
    <Card title="모던 자바스크립트">
      <StatusBadge status="available" />
      <Button>대출하기</Button>
    </Card>
  </StrictMode>,
);
