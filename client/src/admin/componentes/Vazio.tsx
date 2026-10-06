import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = { icone: LucideIcon; titulo: string; texto?: string; acao?: ReactNode };

export default function Vazio({ icone: Icone, titulo, texto, acao }: Props) {
  return (
    <div className="empty-state">
      <Icone size={19} strokeWidth={1.8} />
      <strong>{titulo}</strong>
      {texto ? <span>{texto}</span> : null}
      {acao}
    </div>
  );
}
