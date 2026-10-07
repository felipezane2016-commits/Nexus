import type { LucideIcon } from "lucide-react";

/** Tom do filete na base do cartão, como os indicadores da referência. */
export type TomKpi = "laranja" | "vermelho" | "ambar" | "verde" | "neutro";

type Props = { rotulo: string; valor: string; detalhe?: string; icone?: LucideIcon; tom?: TomKpi; aoClicar?: () => void };

export default function Kpi({ rotulo, valor, detalhe, icone: Icone, tom = "neutro", aoClicar }: Props) {
  const classe = `kpi-card kpi-${tom}`;
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
  if (!aoClicar) return <div className={classe}>{conteudo}</div>;
  return (
    <button type="button" className={classe} onClick={aoClicar}>
      {conteudo}
    </button>
  );
}
