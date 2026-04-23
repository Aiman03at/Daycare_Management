import type { ReactNode } from "react";

export default function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl bg-white p-6 shadow-sm ${className}`.trim()}>
      {children}
    </div>
  );
}
