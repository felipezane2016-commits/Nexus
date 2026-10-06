import Cabecalho from "@/admin/componentes/Cabecalho";
import { GraficoLinhas } from "@/admin/componentes/Graficos";
import Selo from "@/admin/componentes/Selo";
import { useDadosContas } from "@/modulos/contas/colecoes";
import { diaMes, formatarTaxa } from "@/modulos/contas/formato";
import { mediaMovel, ordenarTaxas, tendencia, type Tendencia as TipoTendencia } from "@/modulos/contas/regras";
import type { Moeda } from "@/modulos/contas/tipos";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

const ICONE = { Alta: TrendingUp, Baixa: TrendingDown, Estável: Minus };

function Cartao({ moeda, valores }: { moeda: Moeda; valores: number[] }) {
  const sentido: TipoTendencia = tendencia(valores);
  const Icone = ICONE[sentido];
  return (
    <section className="operations-surface">
      <div className="section-header">
        <div>
          <span className="eyebrow">{moeda} · BIB</span>
          <h3 className="inline-row">
            <Icone size={18} strokeWidth={2} /> {sentido}
          </h3>
          <p>
            {sentido === "Estável"
              ? "A média dos últimos 7 dias está a menos de 0,3% da média de 30."
              : `A média de 7 dias está ${sentido === "Alta" ? "acima" : "abaixo"} da de 30: o ${moeda} vem ${sentido === "Alta" ? "subindo" : "caindo"}.`}
          </p>
        </div>
        <Selo tom={sentido === "Estável" ? "neutral" : "blue"}>{sentido}</Selo>
      </div>
      <dl className="data-list">
        <div>
          <dt>Média 7 dias</dt>
          <dd className="money">{formatarTaxa(mediaMovel(valores, 7))}</dd>
        </div>
        <div>
          <dt>Média 30 dias</dt>
          <dd className="money">{formatarTaxa(mediaMovel(valores, 30))}</dd>
        </div>
      </dl>
    </section>
  );
}

export default function Tendencia() {
  const { taxas } = useDadosContas();
  const ordenadas = ordenarTaxas(taxas);
  const usd = ordenadas.map((taxa) => taxa.bibUsd);
  const pontos = ordenadas.map((taxa, indice) => ({
    dia: diaMes(taxa.data),
    mm7: Number(mediaMovel(usd.slice(0, indice + 1), 7).toFixed(4)),
    mm30: Number(mediaMovel(usd.slice(0, indice + 1), 30).toFixed(4)),
  }));

  return (
    <>
      <Cabecalho
        rotulo="Banco Industrial"
        titulo="Tendência"
        descricao="Médias móveis da cotação do BIB. Média curta acima da longa indica alta; abaixo, baixa."
      />
      <div className="grid-2 espaco-abaixo">
        <Cartao moeda="USD" valores={usd} />
        <Cartao moeda="EUR" valores={ordenadas.map((taxa) => taxa.bibEur)} />
      </div>
      <section className="operations-surface">
        <div className="section-header">
          <div>
            <span className="eyebrow">Histórico</span>
            <h3>Médias móveis do USD</h3>
          </div>
        </div>
        <GraficoLinhas
          dados={pontos.slice(29)}
          chaveX="dia"
          series={[
            { chave: "mm7", nome: "Média 7 dias" },
            { chave: "mm30", nome: "Média 30 dias" },
          ]}
          formatar={formatarTaxa}
          rotulo="Médias móveis de 7 e 30 dias da cotação do dólar no BIB"
        />
        <p className="field-hint espaco-acima-curto">
          O gráfico começa no 30º dia: antes disso a média de 30 dias ainda não tem dados suficientes.
        </p>
      </section>
    </>
  );
}
