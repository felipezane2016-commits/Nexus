import { pode } from "@/_core/identidade/permissoes";
import { useUsuarioAtual } from "@/_core/identidade/sessao";
import { formatarData, HOJE } from "@/_core/tempo";
import Gaveta from "@/admin/componentes/Gaveta";
import Selo from "@/admin/componentes/Selo";
import { excluirProcesso, moverEtapa, registrarComunicacao } from "@/modulos/legal/acoes";
import { useDadosLegal } from "@/modulos/legal/colecoes";
import { diasParaVencer, diasSemAtividade, nomeEtapa, prazoRestante, situacaoPrazo } from "@/modulos/legal/regras";
import { ETAPAS, TIPOS_COMUNICACAO, type ComQuem, type TipoComunicacao } from "@/modulos/legal/tipos";
import { AlertTriangle, Check } from "lucide-react";
import { useState } from "react";
import { SeloComQuem, TOM_PRAZO } from "./comum";
import FormularioProcesso from "./FormularioProcesso";

type Aba = "comunicacoes" | "etapas" | "dados";

export default function DetalheProcesso({ id, aoFechar }: { id: string; aoFechar: () => void }) {
  const { processos, clientes, sla } = useDadosLegal();
  const usuario = useUsuarioAtual();
  const [aba, setAba] = useState<Aba>("comunicacoes");
  const [editando, setEditando] = useState(false);
  const processo = processos.find((item) => item.id === id);
  if (!processo || !usuario) return null;
  const cliente = clientes.find((item) => item.id === processo.clienteId);
  const podeEditar = pode(usuario, "registros.editar");
  const situacao = situacaoPrazo(processo, sla, HOJE);
  const restante = prazoRestante(processo, sla, HOJE);
  const parado = diasSemAtividade(processo, HOJE);
  const vence = diasParaVencer(processo, HOJE);

  if (editando) {
    return <FormularioProcesso processo={processo} clientes={clientes} autor={usuario.nome} aoFechar={() => setEditando(false)} />;
  }

  return (
    <Gaveta
      rotulo={`${processo.id} · ${processo.tipo}`}
      titulo={cliente?.razaoBrasil ?? "Cliente"}
      subtitulo={`${cliente?.razaoExterior ?? ""}${cliente?.pais ? ` · ${cliente.pais}` : ""}`}
      aoFechar={aoFechar}
      rodape={
        <>
          {pode(usuario, "registros.excluir") ? (
            <button
              type="button"
              className="text-button"
              style={{ color: "var(--status-red-fg)" }}
              onClick={() => {
                excluirProcesso(processo.id);
                aoFechar();
              }}
            >
              Excluir processo
            </button>
          ) : (
            <span />
          )}
          {podeEditar ? (
            <button type="button" className="button-secondary" onClick={() => setEditando(true)}>
              Editar dados
            </button>
          ) : null}
        </>
      }
    >
      <div className="inline-row" style={{ marginBottom: 14 }}>
        <Selo tom="neutral">{nomeEtapa(processo.etapa)}</Selo>
        <Selo tom={TOM_PRAZO[situacao]}>
          {situacao}
          {restante !== null ? ` · ${restante < 0 ? `${-restante} d atraso` : `${restante} d úteis`}` : ""}
        </Selo>
        <SeloComQuem comQuem={processo.comQuem} />
      </div>
      {parado >= 7 && processo.etapa !== "finalizado" ? (
        <div className="risk-card" style={{ marginBottom: 12 }}>
          <span className="risk-icon">
            <AlertTriangle size={15} strokeWidth={2} />
          </span>
          <div className="risk-card-head">
            <strong>Sem atividade há {parado} dias</strong>
            <p>Registre um contato ou mova o processo de etapa.</p>
          </div>
        </div>
      ) : null}
      {vence !== null && vence <= 60 && processo.etapa !== "finalizado" ? (
        <div className="risk-card" style={{ marginBottom: 12 }}>
          <span className="risk-icon">
            <AlertTriangle size={15} strokeWidth={2} />
          </span>
          <div className="risk-card-head">
            <strong>Procuração vence em {formatarData(processo.vencimento)}</strong>
            <p>{vence <= 0 ? "Já vencida." : `Faltam ${vence} dias.`}</p>
          </div>
        </div>
      ) : null}

      <div className="tab-row" role="tablist" aria-label="Detalhe do processo">
        {(
          [
            ["comunicacoes", "Comunicações"],
            ["etapas", "Etapas"],
            ["dados", "Dados"],
          ] as [Aba, string][]
        ).map(([chave, nome]) => (
          <button key={chave} type="button" role="tab" aria-selected={aba === chave} className={aba === chave ? "tab tab-active" : "tab"} onClick={() => setAba(chave)}>
            {nome}
          </button>
        ))}
      </div>

      {aba === "comunicacoes" ? (
        <>
          <ul className="item-list">
            {[...processo.comunicacoes].reverse().map((item) => (
              <li className="item-row" key={item.id}>
                <div className="item-row-copy">
                  <strong>{TIPOS_COMUNICACAO[item.tipo]}</strong>
                  {item.descricao ? <span>{item.descricao}</span> : null}
                  <time dateTime={item.data}>
                    {formatarData(item.data)} · {item.autor || "—"}
                  </time>
                </div>
              </li>
            ))}
          </ul>
          {podeEditar ? <NovaComunicacao processoId={processo.id} comQuemAtual={processo.comQuem} autor={usuario.nome} /> : null}
        </>
      ) : null}

      {aba === "etapas" ? (
        <ol className="next-step-list">
          {ETAPAS.map((etapa, indice) => {
            const atualIndice = ETAPAS.findIndex((item) => item.chave === processo.etapa);
            const feita = indice < atualIndice || processo.etapa === "finalizado";
            const atual = etapa.chave === processo.etapa;
            return (
              <li key={etapa.chave} className={feita ? "next-step next-step-done" : "next-step"}>
                <span className="step-number">{feita ? <Check size={13} strokeWidth={2.6} /> : indice + 1}</span>
                <span className="next-step-copy">
                  <strong>
                    {etapa.nome}
                    {atual ? " · etapa atual" : ""}
                  </strong>
                  <span>{sla.dias[etapa.chave] ? `SLA de ${sla.dias[etapa.chave]} dias úteis` : "Sem prazo"}</span>
                </span>
                {podeEditar && !atual ? (
                  <button type="button" className="text-button" onClick={() => moverEtapa(processo.id, etapa.chave, usuario.nome)}>
                    Mover para cá
                  </button>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : null}

      {aba === "dados" ? (
        <dl className="data-list">
          <div>
            <dt>Responsável</dt>
            <dd>{processo.responsavel || "—"}</dd>
          </div>
          <div>
            <dt>Tradução juramentada</dt>
            <dd>{processo.traducao ? "Sim" : "Não"}</dd>
          </div>
          <div>
            <dt>Vencimento da procuração</dt>
            <dd>{formatarData(processo.vencimento)}</dd>
          </div>
          <div>
            <dt>Criado em</dt>
            <dd>{formatarData(processo.criadoEm)}</dd>
          </div>
          <div>
            <dt>CNPJ Brasil</dt>
            <dd>{cliente?.cnpjBrasil || "—"}</dd>
          </div>
          <div>
            <dt>E-mails do cliente</dt>
            <dd>{cliente?.emails || "—"}</dd>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <dt>Observações</dt>
            <dd>{processo.observacoes || "—"}</dd>
          </div>
        </dl>
      ) : null}
    </Gaveta>
  );
}

function NovaComunicacao({ processoId, comQuemAtual, autor }: { processoId: string; comQuemAtual: ComQuem; autor: string }) {
  const [tipo, setTipo] = useState<TipoComunicacao>("email_enviado");
  const [data, setData] = useState(HOJE);
  const [descricao, setDescricao] = useState("");
  const [comQuem, setComQuem] = useState<ComQuem>(comQuemAtual);

  function salvar() {
    registrarComunicacao(processoId, { tipo, data, descricao: descricao.trim(), autor }, comQuem);
    setDescricao("");
  }

  return (
    <div className="stack" style={{ marginTop: 16, padding: 16, borderRadius: 9, background: "var(--subtle)" }}>
      <span className="eyebrow">Registrar comunicação</span>
      <div className="field-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="com-tipo">
            Tipo
          </label>
          <select id="com-tipo" className="field-input" value={tipo} onChange={(e) => setTipo(e.target.value as TipoComunicacao)}>
            {(Object.keys(TIPOS_COMUNICACAO) as TipoComunicacao[]).map((chave) => (
              <option key={chave} value={chave}>
                {TIPOS_COMUNICACAO[chave]}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="com-data">
            Data
          </label>
          <input id="com-data" className="field-input" type="date" value={data} max={HOJE} onChange={(e) => setData(e.target.value)} />
        </div>
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="com-descricao">
          Descrição
        </label>
        <textarea id="com-descricao" className="field-input" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>
      <div className="inline-row" style={{ justifyContent: "space-between" }}>
        <div className="field-group">
          <label className="field-label" htmlFor="com-comquem">
            Depois disso, está
          </label>
          <select id="com-comquem" className="field-input" value={comQuem} onChange={(e) => setComQuem(e.target.value as ComQuem)}>
            <option value="escritorio">Com o escritório</option>
            <option value="cliente">Com o cliente</option>
          </select>
        </div>
        <button type="button" className="button-primary" onClick={salvar} style={{ alignSelf: "flex-end" }}>
          Registrar
        </button>
      </div>
    </div>
  );
}
