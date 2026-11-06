import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  children: ReactNode;
};

export function Card({ title, children }: CardProps) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      {title && <h2 className="mb-2 text-base font-semibold text-text">{title}</h2>}
      {children}
    </section>
  );
}
