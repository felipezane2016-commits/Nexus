import { HOJE } from "@/_core/tempo";
import Cabecalho from "@/admin/componentes/Cabecalho";
import { GraficoLinhas } from "@/admin/componentes/Graficos";
import Kpi from "@/admin/componentes/Kpi";
import Selo from "@/admin/componentes/Selo";
import Vazio from "@/admin/componentes/Vazio";
import { formatBRL } from "@/lib/portal";
import { useDadosContas } from "@/modulos/contas/colecoes";
import { diaMes, formatarDelta, formatarTaxa } from "@/modulos/contas/formato";
import { media, ordenarTaxas, ordensDoMes, spread, valorEmReais } from "@/modulos/contas/regras";
import type { Moeda } from "@/modulos/contas/tipos";
import { Banknote, LineChart } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function PainelCambio() {
  const { taxas, ordens } = useDadosContas();
  const [, navegar] = useLocation();
  const [periodo, setPeriodo] = useState(30);
  const ordenadas = ordenarTaxas(taxas);
  const atual = ordenadas[ordenadas.length - 1];
  const anterior = ordenadas[ordenadas.length - 2];

  if (!atual) {
    return (
      <>
        <Cabecalho rotulo="Banco Industrial" titulo="Painel de câmbio" />
        <section className="operations-surface">
          <Vazio
            icone={Banknote}
            titulo="Nenhuma taxa registrada"
            acao={
              <button type="button" className="button-secondary" onClick={() => navegar("/contas/taxas")}>
                Registrar taxas
              </button>
            }
          />
        </section>
      </>
    );
  }

  const mes = HOJE.slice(0, 7);
  const doMes = ordenadas.filter((taxa) => taxa.data.startsWith(mes));
  const janela = ordenadas.slice(-periodo);
  const pontos = janela.map((taxa) => ({
    dia: diaMes(taxa.data),
    bibUsd: taxa.bibUsd,
    itauUsd: taxa.itauUsd,
    bibEur: taxa.bibEur,
    itauEur: taxa.itauEur,
    spreadUsd: Number(spread(taxa, "USD").toFixed(4)),
  }));
  const fechadasMes = ordensDoMes(ordens, mes).filter((ordem) => ordem.fechamento);
  const volume = (moeda: Moeda) => fechadasMes.filter((ordem) => ordem.moeda === moeda).reduce((soma, ordem) => soma + (valorEmReais(ordem) ?? 0), 0);
  const variacao = (agora: number, antes: number | undefined) => (antes === undefined ? "sem dia anterior" : `${formatarDelta(agora - antes)} vs. dia anterior`);

  const melhor = (moeda: Moeda) => {
    const diferenca = spread(atual, moeda);
    if (Math.abs(diferenca) < 0.0005) return <Selo tom="neutral">Empate</Selo>;
    return <Selo tom="green">{diferenca > 0 ? "BIB paga mais" : "Itaú paga mais"}</Selo>;
  };

  return (
    <>
      <Cabecalho
        rotulo="Banco Industrial"
        titulo="Painel de câmbio"
        descricao={`Cotações do BIB e do Itaú em reais por unidade. Última leitura: ${diaMes(atual.data)} às ${atual.horario}.`}
        acoes={
          <button type="button" className="button-secondary" onClick={() => navegar("/contas/taxas")}>
            Registrar taxas de hoje
          </button>
        }
      />
      <div className="kpi-grid">
        <Kpi rotulo="BIB · USD" valor={formatarTaxa(atual.bibUsd)} detalhe={variacao(atual.bibUsd, anterior?.bibUsd)} icone={LineChart} />
        <Kpi rotulo="Itaú · USD" valor={formatarTaxa(atual.itauUsd)} detalhe={variacao(atual.itauUsd, anterior?.itauUsd)} icone={LineChart} />
        <Kpi rotulo="BIB · EUR" valor={formatarTaxa(atual.bibEur)} detalhe={variacao(atual.bibEur, anterior?.bibEur)} icone={LineChart} />
        <Kpi rotulo="Itaú · EUR" valor={formatarTaxa(atual.itauEur)} detalhe={variacao(atual.itauEur, anterior?.itauEur)} icone={LineChart} />
      </div>

      <div className="grid-3" style={{ marginBottom: 18 }}>
        <section className="operations-surface">
          <span className="eyebrow">Spread de hoje · BIB − Itaú</span>
          <dl className="data-list" style={{ marginTop: 14 }}>
            <div>
              <dt>USD</dt>
              <dd className="money">{formatarDelta(spread(atual, "USD"))}</dd>
              <dd>{melhor("USD")}</dd>
            </div>
            <div>
              <dt>EUR</dt>
              <dd className="money">{formatarDelta(spread(atual, "EUR"))}</dd>
              <dd>{melhor("EUR")}</dd>
            </div>
          </dl>
        </section>
        <section className="operations-surface">
          <span className="eyebrow">Análise do mês · {doMes.length} leituras</span>
          <dl className="data-list" style={{ marginTop: 14 }}>
            <div>
              <dt>Média USD · BIB</dt>
              <dd>{doMes.length ? formatarTaxa(media(doMes.map((taxa) => taxa.bibUsd))) : "—"}</dd>
            </div>
            <div>
              <dt>Mín. / máx. USD</dt>
              <dd>
                {doMes.length
                  ? `${formatarTaxa(Math.min(...doMes.map((taxa) => taxa.bibUsd)))} / ${formatarTaxa(Math.max(...doMes.map((taxa) => taxa.bibUsd)))}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Média EUR · BIB</dt>
              <dd>{doMes.length ? formatarTaxa(media(doMes.map((taxa) => taxa.bibEur))) : "—"}</dd>
            </div>
            <div>
              <dt>Spread médio USD</dt>
              <dd>{doMes.length ? formatarDelta(media(doMes.map((taxa) => spread(taxa, "USD")))) : "—"}</dd>
            </div>
          </dl>
        </section>
        <section className="operations-surface">
          <span className="eyebrow">Ordens fechadas no mês · em R$</span>
          <dl className="data-list" style={{ marginTop: 14 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <dt>Volume total</dt>
              <dd className="money" style={{ fontSize: 22 }}>
                {formatBRL(volume("USD") + volume("EUR"))}
              </dd>
            </div>
            <div>
              <dt>De USD</dt>
              <dd>{formatBRL(volume("USD"))}</dd>
            </div>
            <div>
              <dt>De EUR</dt>
              <dd>{formatBRL(volume("EUR"))}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="operations-surface" style={{ marginBottom: 18 }}>
        <div className="section-header">
          <div>
            <span className="eyebrow">Tendência</span>
            <h3>USD — BIB e Itaú</h3>
          </div>
          <div className="filter-chips" role="group" aria-label="Período">
            {[15, 30, 60].map((dias) => (
              <button key={dias} type="button" className={periodo === dias ? "filter-chip filter-chip-active" : "filter-chip"} aria-pressed={periodo === dias} onClick={() => setPeriodo(dias)}>
                {dias} dias
              </button>
            ))}
          </div>
        </div>
        <GraficoLinhas
          dados={pontos}
          chaveX="dia"
          series={[
            { chave: "bibUsd", nome: "BIB" },
            { chave: "itauUsd", nome: "Itaú" },
          ]}
          formatar={formatarTaxa}
          rotulo={`Cotação do dólar no BIB e no Itaú nos últimos ${periodo} dias úteis`}
        />
      </section>
      <div className="grid-2">
        <section className="operations-surface">
          <div className="section-header">
            <div>
              <span className="eyebrow">Tendência</span>
              <h3>EUR — BIB e Itaú</h3>
            </div>
          </div>
          <GraficoLinhas
            dados={pontos}
            chaveX="dia"
            series={[
              { chave: "bibEur", nome: "BIB" },
              { chave: "itauEur", nome: "Itaú" },
            ]}
            formatar={formatarTaxa}
            rotulo={`Cotação do euro no BIB e no Itaú nos últimos ${periodo} dias úteis`}
          />
        </section>
        <section className="operations-surface">
          <div className="section-header">
            <div>
              <span className="eyebrow">Evolução</span>
              <h3>Spread USD (BIB − Itaú)</h3>
            </div>
          </div>
          <GraficoLinhas
            dados={pontos}
            chaveX="dia"
            series={[{ chave: "spreadUsd", nome: "Spread USD" }]}
            formatar={formatarDelta}
            rotulo="Diferença diária entre a cotação do dólar no BIB e no Itaú"
          />
        </section>
      </div>
    </>
  );
}
