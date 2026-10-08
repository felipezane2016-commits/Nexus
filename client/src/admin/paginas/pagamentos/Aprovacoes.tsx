import { useColecao } from "@/_core/armazenamento/colecao";
import { usuarios, useUsuarioAtual } from "@/_core/identidade/sessao";
import { formatarData, HOJE } from "@/_core/tempo";
import Cabecalho from "@/admin/componentes/Cabecalho";
import Vazio from "@/admin/componentes/Vazio";
import { formatBRL } from "@/lib/portal";
import { aprovar } from "@/modulos/pagamentos/acoes";
import { useDadosPagamentos } from "@/modulos/pagamentos/colecoes";
import { aprovadorVigente, diasAte, podeAprovar } from "@/modulos/pagamentos/regras";
import { CheckCheck, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { LinkDocumento } from "./comum";
import FichaPagamento from "./FichaPagamento";

/**
 * A fila do aprovador: urgentes primeiro, depois por vencimento. Aprova em
 * lote o que não tem pendência; o que tem (fornecedor com conta nova) exige
 * abrir e confirmar.
 */
export default function Aprovacoes() {
  const usuario = useUsuarioAtual();
  const { pagamentos, fornecedores, config } = useDadosPagamentos();
  const pessoas = useColecao(usuarios);
  const [marcados, setMarcados] = useState<string[]>([]);
  const [aberto, setAberto] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  if (!usuario) return null;

  const aprovadorId = aprovadorVigente(config, HOJE);
  const aprovador = pessoas.find((p) => p.id === aprovadorId);
  const fila = pagamentos
    .filter((p) => p.status === "Aguardando aprovação")
    .sort((a, b) => Number(b.urgente) - Number(a.urgente) || a.vencimento.localeCompare(b.vencimento));
  const ehAprovador = usuario.id === aprovadorId;
  const dadosPendentes = (fornecedorId: string | null) => Boolean(fornecedores.find((f) => f.id === fornecedorId && !f.dadosValidados));
  const aprovaveis = fila.filter((p) => podeAprovar(usuario, p, config, HOJE).ok && !dadosPendentes(p.fornecedorId));
  const total = fila.filter((p) => marcados.includes(p.id)).reduce((t, p) => t + p.valor, 0);
  const selecionado = pagamentos.find((p) => p.id === aberto) ?? null;

  function aprovarMarcados() {
    const erros = marcados.map((id) => aprovar(id, usuario!)).filter(Boolean);
    setAviso(erros.length ? erros.join(" ") : `${marcados.length} pagamento(s) aprovado(s), ${formatBRL(total)}.`);
    setMarcados([]);
  }

  return (
    <>
      <Cabecalho
        rotulo="Contas a pagar"
        titulo="Aprovações"
        descricao={`Pagamentos conferidos pelo financeiro que aguardam ${ehAprovador ? "a sua aprovação" : `a aprovação de ${aprovador?.nome ?? "chefe da administração"}`}.`}
        acoes={
          ehAprovador && marcados.length ? (
            <button type="button" className="button-primary" onClick={aprovarMarcados}>
              <CheckCheck size={15} strokeWidth={2.2} /> Aprovar {marcados.length} ({formatBRL(total)})
            </button>
          ) : null
        }
      />
      {aviso ? (
        <div className="acesso-alerta-sucesso espaco-abaixo" role="status">
          <span>{aviso}</span>
        </div>
      ) : null}
      <section className="operations-surface">
        {fila.length === 0 ? (
          <Vazio icone={ShieldCheck} titulo="Nada aguardando aprovação" texto="Quando o financeiro conferir um pedido, ele aparece aqui." />
        ) : (
          <>
            {ehAprovador && aprovaveis.length > 1 ? (
              <label className="check-label espaco-abaixo">
                <input
                  type="checkbox"
                  checked={aprovaveis.every((p) => marcados.includes(p.id))}
                  onChange={(e) => setMarcados(e.target.checked ? aprovaveis.map((p) => p.id) : [])}
                />
                Marcar todos os que podem ser aprovados em lote ({aprovaveis.length})
              </label>
            ) : null}
            <ul className="fila-aprovacao">
              {fila.map((p) => {
                const pode = podeAprovar(usuario, p, config, HOJE);
                const emLote = pode.ok && !dadosPendentes(p.fornecedorId);
                const dias = diasAte(p.vencimento, HOJE);
                return (
                  <li key={p.id} className={p.urgente ? "fila-item fila-item-urgente" : "fila-item"}>
                    {ehAprovador ? (
                      <input
                        type="checkbox"
                        disabled={!emLote}
                        checked={marcados.includes(p.id)}
                        onChange={() => setMarcados((atual) => (atual.includes(p.id) ? atual.filter((id) => id !== p.id) : [...atual, p.id]))}
                        aria-label={`Marcar ${p.numero}`}
                        title={emLote ? undefined : pode.ok ? "Fornecedor com dados bancários a validar: abra para confirmar." : pode.motivo}
                      />
                    ) : null}
                    <div className="fila-item-copy">
                      <strong>
                        {p.favorecido}
                        {p.urgente ? <span className="marca-urgente"> Urgente</span> : null}
                      </strong>
                      <span>
                        {p.numero} · {p.descricao}
                      </span>
                      <span>
                        {p.cliente || "Escritório"}
                        {p.caso ? ` · ${p.caso}` : ""} · {p.categoria} · pedido por {p.solicitante} · conferido por {p.conferencia?.por ?? "—"}
                      </span>
                      {dadosPendentes(p.fornecedorId) ? <span className="texto-vencido">Fornecedor trocou os dados bancários: confirme antes de aprovar.</span> : null}
                      {!pode.ok && ehAprovador ? <span className="texto-vencido">{pode.motivo}</span> : null}
                      <div className="inline-row espaco-acima-curto">
                        {p.documentos.map((d, i) => (
                          <LinkDocumento key={i} anexo={d} />
                        ))}
                      </div>
                    </div>
                    <div className="fila-item-fim">
                      <strong className="money">{formatBRL(p.valor)}</strong>
                      <span className={dias < 0 ? "texto-vencido" : dias <= 1 ? "texto-vencendo" : undefined}>
                        vence {formatarData(p.vencimento)}
                        {dias === 0 ? " (hoje)" : dias < 0 ? " (vencido)" : ""}
                      </span>
                      <button type="button" className="button-secondary" onClick={() => setAberto(p.id)}>
                        Abrir
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
      {selecionado ? <FichaPagamento pagamento={selecionado} usuario={usuario} aoFechar={() => setAberto(null)} aoCorrigir={() => setAberto(null)} /> : null}
    </>
  );
}
