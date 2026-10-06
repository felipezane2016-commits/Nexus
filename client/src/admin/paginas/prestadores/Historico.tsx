import { formatarData } from "@/_core/tempo";
import Cabecalho from "@/admin/componentes/Cabecalho";
import Vazio from "@/admin/componentes/Vazio";
import StatusPill from "@/components/StatusPill";
import { formatBRL, formatMonth, listCompetencias, RECEIPT_STATUSES, type PrototypeReceiptStatus } from "@/lib/portal";
import { useDadosPrestadores } from "@/modulos/prestadores/usarDados";
import { Search, SearchX } from "lucide-react";
import { useState } from "react";

type FiltroStatus = PrototypeReceiptStatus | "Todos";

export default function Historico() {
  const { prestadores, recibos } = useDadosPrestadores();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<FiltroStatus>("Todos");
  const [prestadorId, setPrestadorId] = useState("todos");
  const [competencia, setCompetencia] = useState("todas");

  const nomeDe = new Map(prestadores.map((prestador) => [prestador.id, prestador.nome]));
  const termo = busca.trim().toLowerCase();
  const visiveis = recibos
    .filter((recibo) => status === "Todos" || recibo.status === status)
    .filter((recibo) => prestadorId === "todos" || recibo.prestadorId === prestadorId)
    .filter((recibo) => competencia === "todas" || recibo.competencia === competencia)
    .filter(
      (recibo) =>
        !termo ||
        [recibo.id, recibo.client, recibo.description, recibo.category, nomeDe.get(recibo.prestadorId) ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(termo),
    )
    .sort((a, b) => b.serviceDate.localeCompare(a.serviceDate));
  const total = visiveis.reduce((soma, recibo) => soma + recibo.amount, 0);

  return (
    <>
      <Cabecalho
        rotulo="Prestadores de serviço"
        titulo="Histórico de recibos"
        descricao="Todos os recibos de todos os prestadores, inclusive os rascunhos que ainda não chegaram ao escritório."
      />
      <section className="operations-surface">
        <div className="surface-toolbar">
          <label className="inline-search">
            <Search size={15} strokeWidth={1.9} />
            <input value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Buscar recibo, cliente ou prestador" aria-label="Buscar recibos" />
          </label>
          <div className="inline-row">
            <select className="field-input field-input-compacto" value={prestadorId} onChange={(evento) => setPrestadorId(evento.target.value)} aria-label="Prestador">
              <option value="todos">Todos os prestadores</option>
              {prestadores.map((prestador) => (
                <option key={prestador.id} value={prestador.id}>
                  {prestador.nome}
                </option>
              ))}
            </select>
            <select className="field-input field-input-compacto" value={competencia} onChange={(evento) => setCompetencia(evento.target.value)} aria-label="Competência">
              <option value="todas">Todas as competências</option>
              {listCompetencias(recibos).map((opcao) => (
                <option key={opcao} value={opcao}>
                  {formatMonth(opcao)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="filter-chips espaco-abaixo" role="group" aria-label="Filtrar por status">
          {(["Todos", ...RECEIPT_STATUSES] as FiltroStatus[]).map((opcao) => (
            <button
              key={opcao}
              type="button"
              className={status === opcao ? "filter-chip filter-chip-active" : "filter-chip"}
              aria-pressed={status === opcao}
              onClick={() => setStatus(opcao)}
            >
              {opcao}
            </button>
          ))}
        </div>

        {visiveis.length === 0 ? (
          <Vazio icone={SearchX} titulo="Nenhum recibo encontrado" texto="Ajuste a busca ou os filtros." />
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Recibo</th>
                    <th>Prestador</th>
                    <th>Serviço</th>
                    <th>Data</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visiveis.map((recibo) => (
                    <tr key={recibo.id}>
                      <td>
                        <span className="cell-code">{recibo.id}</span>
                      </td>
                      <td>{nomeDe.get(recibo.prestadorId) ?? "—"}</td>
                      <td className="cell-main">
                        <strong>{recibo.client}</strong>
                        <span>{recibo.category}</span>
                      </td>
                      <td>{formatarData(recibo.serviceDate)}</td>
                      <td className="money">{formatBRL(recibo.amount)}</td>
                      <td>
                        <StatusPill status={recibo.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="surface-footnote">
              <span>{visiveis.length} recibo(s)</span>
              <span>Total listado: {formatBRL(total)}</span>
            </div>
          </>
        )}
      </section>
    </>
  );
}
