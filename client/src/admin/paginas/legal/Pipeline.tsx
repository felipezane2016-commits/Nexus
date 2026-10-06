import { pode } from "@/_core/identidade/permissoes";
import { useUsuarioAtual } from "@/_core/identidade/sessao";
import { HOJE } from "@/_core/tempo";
import Cabecalho from "@/admin/componentes/Cabecalho";
import Selo from "@/admin/componentes/Selo";
import { useDadosLegal } from "@/modulos/legal/colecoes";
import { diasParaVencer, diasSemAtividade, prazoRestante, situacaoPrazo, type SituacaoPrazo } from "@/modulos/legal/regras";
import { ETAPAS, type ComQuem } from "@/modulos/legal/tipos";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { useSearch } from "wouter";
import { SeloComQuem, TOM_PRAZO } from "./comum";
import DetalheProcesso from "./DetalheProcesso";
import FormularioProcesso from "./FormularioProcesso";

export default function Pipeline() {
  const { processos, clientes, sla } = useDadosLegal();
  const usuario = useUsuarioAtual();
  const parametros = new URLSearchParams(useSearch());
  const [busca, setBusca] = useState("");
  const [responsavel, setResponsavel] = useState("todos");
  const [prazo, setPrazo] = useState<SituacaoPrazo | "todos">("todos");
  const [comQuem, setComQuem] = useState<ComQuem | "todos">((parametros.get("com") as ComQuem | null) ?? "todos");
  const [aberto, setAberto] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  if (!usuario) return null;

  const nomeCliente = new Map(clientes.map((cliente) => [cliente.id, cliente]));
  const responsaveis = Array.from(new Set(processos.map((processo) => processo.responsavel).filter(Boolean)));
  const termo = busca.trim().toLowerCase();
  const visiveis = processos.filter((processo) => {
    const cliente = nomeCliente.get(processo.clienteId);
    if (termo && !`${processo.id} ${cliente?.razaoBrasil} ${cliente?.razaoExterior}`.toLowerCase().includes(termo)) return false;
    if (responsavel !== "todos" && processo.responsavel !== responsavel) return false;
    if (prazo !== "todos" && situacaoPrazo(processo, sla, HOJE) !== prazo) return false;
    if (comQuem !== "todos" && processo.comQuem !== comQuem) return false;
    return true;
  });

  return (
    <>
      <Cabecalho
        rotulo="Legal Workflow"
        titulo="Pipeline"
        descricao="Cada coluna é uma etapa; o prazo conta em dias úteis desde a entrada na etapa."
        acoes={
          pode(usuario, "registros.editar") ? (
            <button type="button" className="button-primary" onClick={() => setCriando(true)}>
              <Plus size={15} strokeWidth={2.2} /> Novo processo
            </button>
          ) : null
        }
      />
      <section className="operations-surface">
        <div className="surface-toolbar">
          <label className="inline-search">
            <Search size={15} strokeWidth={1.9} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cliente ou processo" aria-label="Buscar processos" />
          </label>
          <div className="inline-row">
            <select className="field-input" style={{ width: "auto" }} value={responsavel} onChange={(e) => setResponsavel(e.target.value)} aria-label="Responsável">
              <option value="todos">Todos os responsáveis</option>
              {responsaveis.map((nome) => (
                <option key={nome}>{nome}</option>
              ))}
            </select>
            <select className="field-input" style={{ width: "auto" }} value={prazo} onChange={(e) => setPrazo(e.target.value as SituacaoPrazo | "todos")} aria-label="Prazo">
              <option value="todos">Todos os prazos</option>
              <option>Em dia</option>
              <option>Em risco</option>
              <option>Atrasado</option>
            </select>
            <select className="field-input" style={{ width: "auto" }} value={comQuem} onChange={(e) => setComQuem(e.target.value as ComQuem | "todos")} aria-label="Com quem está">
              <option value="todos">Com qualquer um</option>
              <option value="cliente">Com o cliente</option>
              <option value="escritorio">Com o escritório</option>
            </select>
          </div>
        </div>
        <div className="board board-wide">
          {ETAPAS.map((etapa) => {
            const daEtapa = visiveis.filter((processo) => processo.etapa === etapa.chave);
            return (
              <div className="board-column" key={etapa.chave}>
                <div className="board-column-head">
                  {etapa.nome}
                  <span className="board-count">{daEtapa.length}</span>
                </div>
                {daEtapa.length === 0 ? <p className="board-empty">Nenhum processo</p> : null}
                {daEtapa.map((processo) => {
                  const cliente = nomeCliente.get(processo.clienteId);
                  const situacao = situacaoPrazo(processo, sla, HOJE);
                  const restante = prazoRestante(processo, sla, HOJE);
                  const parado = diasSemAtividade(processo, HOJE);
                  const vence = diasParaVencer(processo, HOJE);
                  return (
                    <button type="button" className="board-card" key={processo.id} onClick={() => setAberto(processo.id)}>
                      <strong>{cliente?.razaoExterior || cliente?.razaoBrasil}</strong>
                      <span className="board-card-meta">
                        <span>
                          {processo.id} · {processo.tipo}
                          {cliente?.pais ? ` · ${cliente.pais}` : ""}
                        </span>
                      </span>
                      <span className="inline-row">
                        <Selo tom={TOM_PRAZO[situacao]}>
                          {restante === null ? situacao : restante < 0 ? `${-restante} d atraso` : `${restante} d úteis`}
                        </Selo>
                        {etapa.chave !== "finalizado" ? <SeloComQuem comQuem={processo.comQuem} /> : null}
                      </span>
                      {(parado >= 7 || (vence !== null && vence <= 60)) && etapa.chave !== "finalizado" ? (
                        <span className="board-card-meta">
                          {parado >= 7 ? <span>Parado há {parado} d</span> : null}
                          {vence !== null && vence <= 60 ? <span style={{ color: "var(--status-red-fg)" }}>Vence em {vence} d</span> : null}
                        </span>
                      ) : null}
                      <span className="board-card-meta">
                        <span>{processo.responsavel}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>
      {aberto ? <DetalheProcesso id={aberto} aoFechar={() => setAberto(null)} /> : null}
      {criando ? <FormularioProcesso processo={null} clientes={clientes} autor={usuario.nome} aoFechar={() => setCriando(false)} /> : null}
    </>
  );
}
