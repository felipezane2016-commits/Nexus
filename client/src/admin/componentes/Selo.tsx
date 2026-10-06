import type { ReactNode } from "react";

export type Tom = "green" | "blue" | "amber" | "red" | "neutral";

/** Selo de estado: sempre com texto, nunca a cor sozinha. */
export default function Selo({ tom, children }: { tom: Tom; children: ReactNode }) {
  return (
    <span className={`status-pill status-${tom}`}>
      <span className="status-dot" aria-hidden="true" />
      {children}
    </span>
  );
}
