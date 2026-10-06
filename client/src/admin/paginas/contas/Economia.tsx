import { HOJE } from "@/_core/tempo";
import Cabecalho from "@/admin/componentes/Cabecalho";
import { GraficoBarras } from "@/admin/componentes/Graficos";
import Kpi from "@/admin/componentes/Kpi";
import { formatBRL, parseAmount } from "@/lib/portal";
import { useDadosContas } from "@/modulos/contas/colecoes";
import { diaMes, formatarTaxa } from "@/modulos/contas/formato";
import { economiaPotencial, mediaMovel, ordenarTaxas, taxaDoBanco } from "@/modulos/contas/regras";
import type { Moeda } from "@/modulos/contas/tipos";
import { Landmark, PiggyBank } from "lucide-react";
import { useState } from "react";

type Base = "hoje" | "media7" | "media30";

export default function Economia() {
  const { taxas } = useDadosContas();
  const [valorTexto, setValorTexto] = useState("100.000");
  const [moeda, setMoeda] = useState<Moeda>("USD");
  const [base, setBase] = useState<Base>("hoje");
  const ordenadas = ordenarTaxas(taxas);
  const janela = base === "hoje" ? 1 : base === "media7" ? 7 : 30;
  const bib = mediaMovel(ordenadas.map((taxa) => taxaDoBanco(taxa, "bib", moeda)), janela);
  const itau = mediaMovel(ordenadas.map((taxa) => taxaDoBanco(taxa, "itau", moeda)), janela);
  const valor = parseAmount(valorTexto);
  const resultado = economiaPotencial(Number.isNaN(valor) ? 0 : valor, bib, itau);
  const bibMelhor = bib >= itau;

  const doMes = ordenadas.filter((taxa) => taxa.data.startsWith(HOJE.slice(0, 7)));
  const diario = doMes.map((taxa) => ({
    dia: diaMes(taxa.data),
    economia: Number(economiaPotencial(100_000, taxaDoBanco(taxa, "bib", moeda), taxaDoBanco(taxa, "itau", moeda)).valor.toFixed(2)),
  }));

  return (
    <>
      <Cabecalho rotulo="Banco Industrial" titulo="Economia potencial" descricao="Quanto se ganha fechando o câmbio pelo banco que paga mais pela moeda recebida." />
      <section className="operations-surface espaco-abaixo">
        <div className="field-grid field-grid-fluido">
          <div className="field-group">
            <label className="field-label" htmlFor="eco-valor">
              Valor da operação (R$)
            </label>
            <input id="eco-valor" className="field-input" inputMode="decimal" value={valorTexto} onChange={(e) => setValorTexto(e.target.value)} />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="eco-moeda">
              Moeda
            </label>
            <select id="eco-moeda" className="field-input" value={moeda} onChange={(e) => setMoeda(e.target.value as Moeda)}>
              <option>USD</option>
              <option>EUR</option>
            </select>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="eco-base">
              Cotação de referência
            </label>
            <select id="eco-base" className="field-input" value={base} onChange={(e) => setBase(e.target.value as Base)}>
              <option value="hoje">Última leitura</option>
              <option value="media7">Média de 7 dias</option>
              <option value="media30">Média de 30 dias</option>
            </select>
          </div>
        </div>
      </section>
      <div className="kpi-grid kpi-grid-fluido" aria-live="polite">
        <Kpi rotulo="Melhor banco" valor={bibMelhor ? "BIB" : "Itaú"} detalhe={formatarTaxa(Math.max(bib, itau))} icone={Landmark} />
        <Kpi rotulo="Pior banco" valor={bibMelhor ? "Itaú" : "BIB"} detalhe={formatarTaxa(Math.min(bib, itau))} icone={Landmark} />
        <Kpi rotulo="Economia potencial" valor={formatBRL(resultado.valor)} detalhe={`${resultado.percentual.toFixed(2).replace(".", ",")}% da operação`} icone={PiggyBank} />
      </div>
      <section className="operations-surface">
        <div className="section-header">
          <div>
            <span className="eyebrow">No mês</span>
            <h3>Economia por dia numa operação de R$ 100 mil em {moeda}</h3>
          </div>
        </div>
        <GraficoBarras
          dados={diario}
          chaveX="dia"
          chaveY="economia"
          nome="Economia"
          formatar={formatBRL}
          formatarEixo={(valorEixo) => `R$ ${Math.round(valorEixo)}`}
          rotulo={`Economia diária escolhendo o melhor banco numa operação de R$ 100 mil em ${moeda}`}
        />
        <p className="field-hint espaco-acima-curto">
          Total no mês, se cada dia tivesse uma operação de R$ 100 mil: {formatBRL(diario.reduce((soma, ponto) => soma + ponto.economia, 0))}.
        </p>
      </section>
    </>
  );
}
