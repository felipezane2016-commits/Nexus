import { gravarItem, useColecao } from "@/_core/armazenamento/colecao";
import { iniciais, pode } from "@/_core/identidade/permissoes";
import { useUsuarioAtual, usuarios } from "@/_core/identidade/sessao";
import { formatarData, gerarId, HOJE } from "@/_core/tempo";
import Cabecalho from "@/admin/componentes/Cabecalho";
import Campo from "@/admin/componentes/Campo";
import Painel from "@/admin/componentes/Painel";
import Selo, { type Tom } from "@/admin/componentes/Selo";
import Vazio from "@/admin/componentes/Vazio";
import { tarefas } from "@/modulos/escritorio/colecoes";
import { AREAS_TAREFA, COLUNAS_TAREFA, type AreaTarefa, type ColunaTarefa, type Prioridade, type Tarefa } from "@/modulos/escritorio/tipos";
import { ArrowRight, Plus, Search, SearchX } from "lucide-react";
import { useState } from "react";

const TOM_PRIORIDADE: Record<Prioridade, Tom> = { Alta: "red", Média: "amber", Baixa: "neutral" };

export default function Tarefas() {
  const lista = useColecao(tarefas);
  const pessoas = useColecao(usuarios);
  const usuario = useUsuarioAtual();
  const podeEditar = pode(usuario, "registros.editar");
  const [visao, setVisao] = useState<"quadro" | "lista">("quadro");
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<Tarefa | "nova" | null>(null);

  const nomeDe = new Map(pessoas.map((pessoa) => [pessoa.id, pessoa.nome]));
  const termo = busca.trim().toLowerCase();
  const visiveis = lista.filter((tarefa) => !termo || `${tarefa.titulo} ${tarefa.area}`.toLowerCase().includes(termo));

  function avancar(tarefa: Tarefa) {
    const indice = COLUNAS_TAREFA.findIndex((coluna) => coluna.chave === tarefa.coluna);
    const proxima = COLUNAS_TAREFA[indice + 1];
    if (proxima) tarefas.atualizar((atual) => gravarItem(atual, { ...tarefa, coluna: proxima.chave }));
  }

  const prazo = (tarefa: Tarefa) =>
    tarefa.prazo ? (
      <span className={tarefa.prazo < HOJE && tarefa.coluna !== "concluido" ? "texto-alerta" : undefined}>
        {formatarData(tarefa.prazo)}
      </span>
    ) : (
      "sem prazo"
    );

  return (
    <>
      <Cabecalho
        rotulo="Escritório"
        titulo="Tarefas"
        descricao="O que a equipe tem em andamento, por etapa."
        acoes={
          podeEditar ? (
            <button type="button" className="button-primary" onClick={() => setEditando("nova")}>
              <Plus size={15} strokeWidth={2.2} /> Nova tarefa
            </button>
          ) : null
        }
      />
      <section className="operations-surface">
        <div className="surface-toolbar">
          <label className="inline-search">
            <Search size={15} strokeWidth={1.9} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar tarefa ou área" aria-label="Buscar tarefas" />
          </label>
          <div className="filter-chips" role="group" aria-label="Visualização">
            {(["quadro", "lista"] as const).map((opcao) => (
              <button
                key={opcao}
                type="button"
                className={visao === opcao ? "filter-chip filter-chip-active" : "filter-chip"}
                aria-pressed={visao === opcao}
                onClick={() => setVisao(opcao)}
              >
                {opcao === "quadro" ? "Quadro" : "Lista"}
              </button>
            ))}
          </div>
        </div>

        {visiveis.length === 0 ? (
          <Vazio icone={SearchX} titulo="Nenhuma tarefa encontrada" />
        ) : visao === "quadro" ? (
          <div className="board">
            {COLUNAS_TAREFA.map((coluna) => {
              const daColuna = visiveis.filter((tarefa) => tarefa.coluna === coluna.chave);
              return (
                <div className="board-column" key={coluna.chave}>
                  <div className="board-column-head">
                    {coluna.nome}
                    <span className="board-count">{daColuna.length}</span>
                  </div>
                  {daColuna.length === 0 ? <p className="board-empty">Nada aqui</p> : null}
                  {daColuna.map((tarefa) => (
                    <div className="board-card" key={tarefa.id}>
                      <button
                        type="button"
                        className="text-button"
                        style={{ color: "var(--foreground)", textAlign: "left" }}
                        onClick={() => setEditando(tarefa)}
                        disabled={!podeEditar}
                      >
                        <strong>{tarefa.titulo}</strong>
                      </button>
                      <div className="inline-row">
                        <Selo tom={TOM_PRIORIDADE[tarefa.prioridade]}>{tarefa.prioridade}</Selo>
                        <span className="status-pill status-neutral">{tarefa.area}</span>
                      </div>
                      <div className="board-card-meta">
                        <span className="inline-row">
                          {tarefa.responsavelId ? (
                            <span className="avatar avatar-sm" title={nomeDe.get(tarefa.responsavelId)} aria-label={nomeDe.get(tarefa.responsavelId)}>
                              {iniciais(nomeDe.get(tarefa.responsavelId) ?? "?")}
                            </span>
                          ) : null}
                          {prazo(tarefa)}
                        </span>
                        {podeEditar && coluna.chave !== "concluido" ? (
                          <button type="button" className="icon-button" style={{ width: 28, height: 28 }} aria-label={`Avançar "${tarefa.titulo}"`} onClick={() => avancar(tarefa)}>
                            <ArrowRight size={14} strokeWidth={2} />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Tarefa</th>
                  <th>Etapa</th>
                  <th>Prioridade</th>
                  <th>Responsável</th>
                  <th>Prazo</th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((tarefa) => (
                  <tr key={tarefa.id}>
                    <td className="cell-main">
                      <button type="button" className="text-button" style={{ color: "var(--foreground)" }} onClick={() => setEditando(tarefa)} disabled={!podeEditar}>
                        <strong>{tarefa.titulo}</strong>
                      </button>
                      <span>{tarefa.area}</span>
                    </td>
                    <td>{COLUNAS_TAREFA.find((coluna) => coluna.chave === tarefa.coluna)?.nome}</td>
                    <td>
                      <Selo tom={TOM_PRIORIDADE[tarefa.prioridade]}>{tarefa.prioridade}</Selo>
                    </td>
                    <td>{tarefa.responsavelId ? nomeDe.get(tarefa.responsavelId) : "—"}</td>
                    <td>{prazo(tarefa)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {editando ? (
        <FormularioTarefa tarefa={editando === "nova" ? null : editando} pessoas={pessoas.filter((pessoa) => pessoa.ativo)} podeExcluir={pode(usuario, "registros.excluir")} aoFechar={() => setEditando(null)} />
      ) : null}
    </>
  );
}

type Pessoa = { id: string; nome: string };

function FormularioTarefa({ tarefa, pessoas, podeExcluir, aoFechar }: { tarefa: Tarefa | null; pessoas: Pessoa[]; podeExcluir: boolean; aoFechar: () => void }) {
  const [dados, setDados] = useState<Tarefa>(
    tarefa ?? { id: gerarId("tf"), titulo: "", descricao: "", prioridade: "Média", area: "Geral", responsavelId: null, prazo: null, coluna: "backlog" },
  );
  const [erro, setErro] = useState<string | undefined>();

  function salvar() {
    if (!dados.titulo.trim()) {
      setErro("Descreva a tarefa.");
      return;
    }
    tarefas.atualizar((lista) => gravarItem(lista, { ...dados, titulo: dados.titulo.trim() }));
    aoFechar();
  }

  return (
    <Painel
      rotulo="Tarefas"
      titulo={tarefa ? "Editar tarefa" : "Nova tarefa"}
      aoFechar={aoFechar}
      aoEnviar={salvar}
      rodapeExtra={
        tarefa && podeExcluir ? (
          <button
            type="button"
            className="text-button"
            onClick={() => {
              tarefas.atualizar((lista) => lista.filter((item) => item.id !== tarefa.id));
              aoFechar();
            }}
          >
            Excluir
          </button>
        ) : null
      }
    >
      <Campo id="tf-titulo" rotulo="Título" erro={erro}>
        {(aria) => <input {...aria} className="field-input" value={dados.titulo} onChange={(e) => (setDados({ ...dados, titulo: e.target.value }), setErro(undefined))} />}
      </Campo>
      <div className="field-grid">
        <Campo id="tf-prioridade" rotulo="Prioridade">
          {(aria) => (
            <select {...aria} className="field-input" value={dados.prioridade} onChange={(e) => setDados({ ...dados, prioridade: e.target.value as Prioridade })}>
              <option>Alta</option>
              <option>Média</option>
              <option>Baixa</option>
            </select>
          )}
        </Campo>
        <Campo id="tf-area" rotulo="Área">
          {(aria) => (
            <select {...aria} className="field-input" value={dados.area} onChange={(e) => setDados({ ...dados, area: e.target.value as AreaTarefa })}>
              {AREAS_TAREFA.map((area) => (
                <option key={area}>{area}</option>
              ))}
            </select>
          )}
        </Campo>
      </div>
      <div className="field-grid">
        <Campo id="tf-responsavel" rotulo="Responsável">
          {(aria) => (
            <select {...aria} className="field-input" value={dados.responsavelId ?? ""} onChange={(e) => setDados({ ...dados, responsavelId: e.target.value || null })}>
              <option value="">Ninguém</option>
              {pessoas.map((pessoa) => (
                <option key={pessoa.id} value={pessoa.id}>
                  {pessoa.nome}
                </option>
              ))}
            </select>
          )}
        </Campo>
        <Campo id="tf-prazo" rotulo="Prazo">
          {(aria) => <input {...aria} className="field-input" type="date" value={dados.prazo ?? ""} onChange={(e) => setDados({ ...dados, prazo: e.target.value || null })} />}
        </Campo>
      </div>
      <Campo id="tf-etapa" rotulo="Etapa">
        {(aria) => (
          <select {...aria} className="field-input" value={dados.coluna} onChange={(e) => setDados({ ...dados, coluna: e.target.value as ColunaTarefa })}>
            {COLUNAS_TAREFA.map((coluna) => (
              <option key={coluna.chave} value={coluna.chave}>
                {coluna.nome}
              </option>
            ))}
          </select>
        )}
      </Campo>
      <Campo id="tf-descricao" rotulo="Descrição">
        {(aria) => <textarea {...aria} className="field-input" value={dados.descricao} onChange={(e) => setDados({ ...dados, descricao: e.target.value })} />}
      </Campo>
    </Painel>
  );
}
