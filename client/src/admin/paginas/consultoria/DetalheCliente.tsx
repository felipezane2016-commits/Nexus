import { gravarItem } from "@/_core/armazenamento/colecao";
import { pode } from "@/_core/identidade/permissoes";
import { useUsuarioAtual } from "@/_core/identidade/sessao";
import { formatarData, gerarId, HOJE } from "@/_core/tempo";
import Barras from "@/admin/componentes/Barras";
import Campo from "@/admin/componentes/Campo";
import Kpi from "@/admin/componentes/Kpi";
import Painel from "@/admin/componentes/Painel";
import Selo from "@/admin/componentes/Selo";
import Vazio from "@/admin/componentes/Vazio";
import { formatBRL, formatMonth } from "@/lib/portal";
import { clientesConsultoria, resumoTrabalhos, useDadosConsultoria } from "@/modulos/consultoria/colecoes";
import { SERVICOS_CONSULTORIA, type ClienteConsultoria, type Trabalho } from "@/modulos/consultoria/tipos";
import { ArrowLeft, Briefcase, CalendarDays, Plus } from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { FormularioCliente, FormularioTrabalho, TOM_PAGAMENTO, TOM_TRABALHO } from "./comum";

type Aba = "informacoes" | "reunioes" | "servicos" | "trabalhos";

export default function DetalheCliente() {
  const { id } = useParams<{ id: string }>();
  const { clientes, trabalhos } = useDadosConsultoria();
  const usuario = useUsuarioAtual();
  const [, navegar] = useLocation();
  const [aba, setAba] = useState<Aba>("informacoes");
  const [editandoCliente, setEditandoCliente] = useState(false);
  const [trabalhoAberto, setTrabalhoAberto] = useState<Trabalho | "novo" | null>(null);
  const [novaReuniao, setNovaReuniao] = useState(false);
  const cliente = clientes.find((item) => item.id === id);
  const podeEditar = pode(usuario, "registros.editar");

  if (!cliente) {
    return (
      <section className="operations-surface">
        <Vazio
          icone={Briefcase}
          titulo="Cliente não encontrado"
          acao={
            <button type="button" className="button-secondary" onClick={() => navegar("/consultoria")}>
              Voltar à lista
            </button>
          }
        />
      </section>
    );
  }

  const doCliente = trabalhos.filter((trabalho) => trabalho.clienteId === cliente.id).sort((a, b) => b.data.localeCompare(a.data));
  const resumo = resumoTrabalhos(doCliente);
  const porMes = Array.from(new Set(doCliente.map((trabalho) => trabalho.data.slice(0, 7))));

  return (
    <>
      <button type="button" className="text-button" style={{ marginBottom: 14 }} onClick={() => navegar("/consultoria")}>
        <ArrowLeft size={14} strokeWidth={2} /> Clientes
      </button>
      <header className="page-heading">
        <div>
          <span className="eyebrow">Cliente desde {formatarData(cliente.cadastro)}</span>
          <h1>{cliente.nome}</h1>
          <div className="inline-row">
            {cliente.tags.map((tag) => (
              <span key={tag} className="status-pill status-neutral">
                {tag}
              </span>
            ))}
          </div>
        </div>
        {podeEditar ? (
          <div className="heading-actions">
            <button type="button" className="button-secondary" onClick={() => setEditandoCliente(true)}>
              Editar cliente
            </button>
            <button type="button" className="button-primary" onClick={() => setTrabalhoAberto("novo")}>
              <Plus size={15} strokeWidth={2.2} /> Novo trabalho
            </button>
          </div>
        ) : null}
      </header>

      <div className="kpi-grid">
        <Kpi rotulo="Trabalhos" valor={String(resumo.quantidade)} detalhe="exceto cancelados" />
        <Kpi rotulo="Faturado" valor={formatBRL(resumo.faturado)} />
        <Kpi rotulo="Recebido" valor={formatBRL(resumo.recebido)} detalhe="parcial conta metade" />
        <Kpi rotulo="A receber" valor={formatBRL(resumo.aReceber)} />
      </div>

      <section className="operations-surface">
        <div className="tab-row" role="tablist" aria-label="Detalhe do cliente">
          {(
            [
              ["informacoes", "Informações"],
              ["reunioes", `Reuniões (${cliente.reunioes.length})`],
              ["servicos", "Serviços"],
              ["trabalhos", `Trabalhos (${doCliente.length})`],
            ] as [Aba, string][]
          ).map(([chave, nome]) => (
            <button key={chave} type="button" role="tab" aria-selected={aba === chave} className={aba === chave ? "tab tab-active" : "tab"} onClick={() => setAba(chave)}>
              {nome}
            </button>
          ))}
        </div>

        {aba === "informacoes" ? (
          <dl className="data-list">
            <div>
              <dt>Contato</dt>
              <dd>{cliente.contato || "—"}</dd>
            </div>
            <div>
              <dt>Cliente desde</dt>
              <dd>{formatarData(cliente.cadastro)}</dd>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <dt>Observações</dt>
              <dd>{cliente.observacoes || "—"}</dd>
            </div>
          </dl>
        ) : null}

        {aba === "reunioes" ? (
          <>
            {podeEditar ? (
              <button type="button" className="button-secondary" style={{ marginBottom: 12 }} onClick={() => setNovaReuniao(true)}>
                <Plus size={14} strokeWidth={2.2} /> Registrar reunião
              </button>
            ) : null}
            {cliente.reunioes.length === 0 ? (
              <Vazio icone={CalendarDays} titulo="Nenhuma reunião registrada" />
            ) : (
              <ul className="item-list">
                {[...cliente.reunioes]
                  .sort((a, b) => b.data.localeCompare(a.data))
                  .map((reuniao) => (
                    <li className="item-row" key={reuniao.id}>
                      <div className="item-row-copy">
                        <strong>{reuniao.titulo}</strong>
                        {reuniao.notas ? <span>{reuniao.notas}</span> : null}
                        <time dateTime={reuniao.data}>{formatarData(reuniao.data)}</time>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </>
        ) : null}

        {aba === "servicos" ? (
          <Barras
            rotuloAcessivel="Valor por serviço"
            linhas={SERVICOS_CONSULTORIA.map((servico) => {
              const comServico = doCliente.filter((trabalho) => trabalho.status !== "Cancelado" && trabalho.servicos.includes(servico));
              const valor = comServico.reduce((soma, trabalho) => soma + trabalho.valor / trabalho.servicos.length, 0);
              return { rotulo: servico, valor, texto: `${formatBRL(valor)} · ${comServico.length} trab.` };
            })}
          />
        ) : null}

        {aba === "trabalhos" ? (
          doCliente.length === 0 ? (
            <Vazio icone={Briefcase} titulo="Nenhum trabalho ainda" />
          ) : (
            <div className="stack">
              {porMes.map((mes) => (
                <div key={mes}>
                  <p className="eyebrow" style={{ marginBottom: 4 }}>
                    {formatMonth(mes)}
                  </p>
                  <div className="ged-list">
                    {doCliente
                      .filter((trabalho) => trabalho.data.startsWith(mes))
                      .map((trabalho) => (
                        <div className="ged-line" key={trabalho.id}>
                          <div className="ged-line-copy">
                            {podeEditar ? (
                              <button type="button" className="text-button" style={{ color: "var(--foreground)" }} onClick={() => setTrabalhoAberto(trabalho)}>
                                <strong>{trabalho.servicos.join(" + ")}</strong>
                              </button>
                            ) : (
                              <strong>{trabalho.servicos.join(" + ")}</strong>
                            )}
                            <span>
                              {formatarData(trabalho.data)} · {trabalho.descricao || "sem descrição"}
                            </span>
                          </div>
                          <div className="ged-line-meta">
                            <span className="money">{formatBRL(trabalho.valor)}</span>
                            <Selo tom={TOM_TRABALHO[trabalho.status]}>{trabalho.status}</Selo>
                            <Selo tom={TOM_PAGAMENTO[trabalho.pagamento]}>{trabalho.pagamento}</Selo>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}
      </section>

      {editandoCliente ? <FormularioCliente cliente={cliente} aoFechar={() => setEditandoCliente(false)} /> : null}
      {trabalhoAberto ? (
        <FormularioTrabalho
          trabalho={trabalhoAberto === "novo" ? null : trabalhoAberto}
          clientes={clientes}
          clienteFixo={cliente.id}
          podeExcluir={pode(usuario, "registros.excluir")}
          aoFechar={() => setTrabalhoAberto(null)}
        />
      ) : null}
      {novaReuniao ? <FormularioReuniaoCliente cliente={cliente} aoFechar={() => setNovaReuniao(false)} /> : null}
    </>
  );
}

function FormularioReuniaoCliente({ cliente, aoFechar }: { cliente: ClienteConsultoria; aoFechar: () => void }) {
  const [dados, setDados] = useState({ titulo: "", data: HOJE, notas: "" });
  const [erro, setErro] = useState<string | undefined>();
  return (
    <Painel
      rotulo={cliente.nome}
      titulo="Registrar reunião"
      aoFechar={aoFechar}
      aoEnviar={() => {
        if (!dados.titulo.trim()) {
          setErro("Dê um título à reunião.");
          return;
        }
        clientesConsultoria.atualizar((lista) =>
          gravarItem(lista, { ...cliente, reunioes: [...cliente.reunioes, { id: gerarId("rc"), ...dados, titulo: dados.titulo.trim() }] }),
        );
        aoFechar();
      }}
    >
      <div className="field-grid">
        <Campo id="rc-titulo" rotulo="Assunto" erro={erro}>
          {(aria) => <input {...aria} className="field-input" value={dados.titulo} onChange={(e) => setDados({ ...dados, titulo: e.target.value })} />}
        </Campo>
        <Campo id="rc-data" rotulo="Data">
          {(aria) => <input {...aria} className="field-input" type="date" value={dados.data} onChange={(e) => setDados({ ...dados, data: e.target.value })} />}
        </Campo>
      </div>
      <Campo id="rc-notas" rotulo="Notas">
        {(aria) => <textarea {...aria} className="field-input" value={dados.notas} onChange={(e) => setDados({ ...dados, notas: e.target.value })} />}
      </Campo>
    </Painel>
  );
}
