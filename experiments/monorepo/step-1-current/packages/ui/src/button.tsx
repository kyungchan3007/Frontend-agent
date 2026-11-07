import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-md bg-primary px-4 py-2 text-sm font-medium text-surface hover:bg-primary-hover ${className}`}
      {...props}
    />
  );
}
