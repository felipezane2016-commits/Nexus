import { pode } from "@/_core/identidade/permissoes";
import { useUsuarioAtual } from "@/_core/identidade/sessao";
import { formatarData } from "@/_core/tempo";
import Barras from "@/admin/componentes/Barras";
import Cabecalho from "@/admin/componentes/Cabecalho";
import { GraficoBarras } from "@/admin/componentes/Graficos";
import Kpi from "@/admin/componentes/Kpi";
import Selo from "@/admin/componentes/Selo";
import { formatBRL, formatMonth } from "@/lib/portal";
import { resumoTrabalhos, useDadosConsultoria } from "@/modulos/consultoria/colecoes";
import { STATUS_TRABALHO, type Trabalho } from "@/modulos/consultoria/tipos";
import { BadgeCheck, Briefcase, Hourglass, Wallet } from "lucide-react";
import { useState } from "react";
import { FormularioTrabalho, TOM_PAGAMENTO, TOM_TRABALHO } from "./comum";

export default function PainelConsultoria() {
  const { clientes, trabalhos } = useDadosConsultoria();
  const usuario = useUsuarioAtual();
  const [mes, setMes] = useState("todos");
  const [clienteId, setClienteId] = useState("todos");
  const [aberto, setAberto] = useState<Trabalho | null>(null);
  const meses = Array.from(new Set(trabalhos.map((trabalho) => trabalho.data.slice(0, 7)))).sort();
  const nomeDe = new Map(clientes.map((cliente) => [cliente.id, cliente.nome]));
  const filtrados = trabalhos
    .filter((trabalho) => mes === "todos" || trabalho.data.startsWith(mes))
    .filter((trabalho) => clienteId === "todos" || trabalho.clienteId === clienteId)
    .sort((a, b) => b.data.localeCompare(a.data));
  const resumo = resumoTrabalhos(filtrados);
  const porMes = meses.map((competencia) => ({
    mes: formatMonth(competencia).split(" ")[0].slice(0, 3),
    valor: resumoTrabalhos(filtrados.filter((trabalho) => trabalho.data.startsWith(competencia))).faturado,
  }));

  return (
    <>
      <Cabecalho
        rotulo="Consultoria Empresarial"
        titulo="Painel"
        descricao="Faturamento, recebimento e andamento dos trabalhos."
        acoes={
          <>
            <select className="field-input" style={{ width: "auto" }} value={mes} onChange={(e) => setMes(e.target.value)} aria-label="Período">
              <option value="todos">Todo o período</option>
              {meses.map((item) => (
                <option key={item} value={item}>
                  {formatMonth(item)}
                </option>
              ))}
            </select>
            <select className="field-input" style={{ width: "auto" }} value={clienteId} onChange={(e) => setClienteId(e.target.value)} aria-label="Cliente">
              <option value="todos">Todos os clientes</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
          </>
        }
      />
      <div className="kpi-grid">
        <Kpi rotulo="Trabalhos" valor={String(resumo.quantidade)} detalhe="exceto cancelados" icone={Briefcase} />
        <Kpi rotulo="Faturado" valor={formatBRL(resumo.faturado)} icone={BadgeCheck} />
        <Kpi rotulo="Recebido" valor={formatBRL(resumo.recebido)} icone={Wallet} />
        <Kpi rotulo="A receber" valor={formatBRL(resumo.aReceber)} icone={Hourglass} />
      </div>
      <div className="grid-2" style={{ marginBottom: 18 }}>
        <section className="operations-surface">
          <div className="section-header">
            <div>
              <span className="eyebrow">Por cliente</span>
              <h3>Faturado</h3>
            </div>
          </div>
          <Barras
            rotuloAcessivel="Faturado por cliente"
            linhas={clientes
              .map((cliente) => {
                const valor = resumoTrabalhos(filtrados.filter((trabalho) => trabalho.clienteId === cliente.id)).faturado;
                return { rotulo: cliente.nome, valor, texto: formatBRL(valor) };
              })
              .sort((a, b) => b.valor - a.valor)}
          />
        </section>
        <section className="operations-surface">
          <div className="section-header">
            <div>
              <span className="eyebrow">Por status</span>
              <h3>Andamento</h3>
            </div>
          </div>
          <Barras
            rotuloAcessivel="Trabalhos por status"
            linhas={STATUS_TRABALHO.map((status) => {
              const total = filtrados.filter((trabalho) => trabalho.status === status).length;
              return { rotulo: status, valor: total, texto: String(total) };
            })}
          />
        </section>
      </div>
      {mes === "todos" ? (
        <section className="operations-surface" style={{ marginBottom: 18 }}>
          <div className="section-header">
            <div>
              <span className="eyebrow">Por mês</span>
              <h3>Faturado</h3>
            </div>
          </div>
          <GraficoBarras dados={porMes} chaveX="mes" chaveY="valor" nome="Faturado" formatar={formatBRL} formatarEixo={(valor) => `R$ ${Math.round(valor / 1000)} mil`} rotulo="Faturamento da consultoria por mês" />
        </section>
      ) : null}
      <section className="operations-surface">
        <div className="section-header">
          <div>
            <span className="eyebrow">Trabalhos</span>
            <h3>{filtrados.length} no filtro</h3>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Serviços</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((trabalho) => (
                <tr key={trabalho.id}>
                  <td>{formatarData(trabalho.data)}</td>
                  <td className="cell-main">
                    {pode(usuario, "registros.editar") ? (
                      <button type="button" className="text-button" style={{ color: "var(--foreground)" }} onClick={() => setAberto(trabalho)}>
                        <strong>{nomeDe.get(trabalho.clienteId) ?? "—"}</strong>
                      </button>
                    ) : (
                      <strong>{nomeDe.get(trabalho.clienteId) ?? "—"}</strong>
                    )}
                    <span>{trabalho.descricao}</span>
                  </td>
                  <td>{trabalho.servicos.join(", ")}</td>
                  <td className="money">{formatBRL(trabalho.valor)}</td>
                  <td>
                    <Selo tom={TOM_TRABALHO[trabalho.status]}>{trabalho.status}</Selo>
                  </td>
                  <td>
                    <Selo tom={TOM_PAGAMENTO[trabalho.pagamento]}>{trabalho.pagamento}</Selo>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {aberto ? <FormularioTrabalho trabalho={aberto} clientes={clientes} podeExcluir={pode(usuario, "registros.excluir")} aoFechar={() => setAberto(null)} /> : null}
    </>
  );
}
