import type { LucideIcon } from "lucide-react";

type Props = { rotulo: string; valor: string; detalhe?: string; icone?: LucideIcon; aoClicar?: () => void };

export default function Kpi({ rotulo, valor, detalhe, icone: Icone, aoClicar }: Props) {
  const conteudo = (
    <>
      <div className="kpi-card-head">
        <span className="kpi-label">{rotulo}</span>
        {Icone ? (
          <span className="kpi-icon" aria-hidden="true">
            <Icone size={16} strokeWidth={1.9} />
          </span>
        ) : null}
      </div>
      <p className="kpi-value">{valor}</p>
      {detalhe ? <p className="kpi-detail">{detalhe}</p> : null}
    </>
  );
  if (!aoClicar) return <div className="kpi-card">{conteudo}</div>;
  return (
    <button type="button" className="kpi-card" style={{ textAlign: "left" }} onClick={aoClicar}>
      {conteudo}
    </button>
  );
}
