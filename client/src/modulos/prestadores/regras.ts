import { closingTotal, type Closing, type Receipt } from "@/lib/portal";
import type { CategoriaPrestador, Prestador, SituacaoLote } from "./tipos";

/**
 * Regras puras da conferência de recibos. Um "lote" é o conjunto de recibos de
 * um prestador numa competência — é a unidade que o escritório confere e paga.
 */

export type Lote = {
  chave: string;
  prestador: Prestador;
  competencia: string;
  recibos: Receipt[];
  fechamento: Closing | null;
  situacao: SituacaoLote;
  /** Recibos ainda esperando decisão do escritório. */
  pendentes: number;
  total: number;
};

export function situacaoDoLote(fechamento: Closing | null): SituacaoLote {
  if (!fechamento || !fechamento.submitted) return "Recibos avulsos";
  return fechamento.review ?? "Aguardando conferência";
}

/**
 * Monta os lotes que precisam do escritório: os que já tiveram fechamento
 * enviado e os que têm recibo enviado avulso. Rascunho puro não aparece — o
 * prestador ainda não pediu nada.
 */
export function montarLotes(recibos: Receipt[], fechamentos: Closing[], prestadores: Prestador[]): Lote[] {
  const porId = new Map(prestadores.map((prestador) => [prestador.id, prestador]));
  const grupos = new Map<string, Receipt[]>();
  for (const recibo of recibos) {
    const chave = `${recibo.prestadorId}|${recibo.competencia}`;
    grupos.set(chave, [...(grupos.get(chave) ?? []), recibo]);
  }

  const lotes: Lote[] = [];
  grupos.forEach((lista, chave) => {
    const [prestadorId, competencia] = chave.split("|");
    const prestador = porId.get(prestadorId);
    if (!prestador) return;
    const fechamento =
      fechamentos.find((item) => item.prestadorId === prestadorId && item.competencia === competencia) ?? null;
    const enviados = lista.filter((recibo) => recibo.status !== "Rascunho");
    if (!fechamento?.submitted && !enviados.some((recibo) => recibo.status === "Enviado")) return;
    lotes.push({
      chave,
      prestador,
      competencia,
      recibos: enviados,
      fechamento,
      situacao: situacaoDoLote(fechamento),
      pendentes: enviados.filter((recibo) => recibo.status === "Enviado").length,
      total: closingTotal(enviados),
    });
  });

  // Quem pede ação primeiro: aguardando > avulsos > conferido > pago; depois o mais recente.
  const ordem: Record<SituacaoLote, number> = {
    "Aguardando conferência": 0,
    "Recibos avulsos": 1,
    Conferido: 2,
    Pago: 3,
  };
  return lotes.sort(
    (a, b) => ordem[a.situacao] - ordem[b.situacao] || b.competencia.localeCompare(a.competencia),
  );
}

/** A conferência fecha quando o prestador enviou o mês e nada ficou sem decisão. */
export function podeFinalizarConferencia(lote: Lote) {
  return lote.situacao === "Aguardando conferência" && lote.pendentes === 0 && lote.recibos.length > 0;
}

export function podeMarcarPago(lote: Lote) {
  return lote.situacao === "Conferido";
}

export type LinhaRanking = { prestador: Prestador; valor: number; servicos: number };

/** Valor aprovado e serviços por prestador, do maior para o menor valor. */
export function rankingPrestadores(recibos: Receipt[], prestadores: Prestador[]): LinhaRanking[] {
  return prestadores
    .map((prestador) => {
      const aprovados = recibos.filter((recibo) => recibo.prestadorId === prestador.id && recibo.status === "Aprovado");
      return {
        prestador,
        valor: aprovados.reduce((total, recibo) => total + recibo.amount, 0),
        servicos: aprovados.length,
      };
    })
    .sort((a, b) => b.valor - a.valor);
}

export function totalPorCategoria(recibos: Receipt[], prestadores: Prestador[]) {
  const categoriaDe = new Map(prestadores.map((prestador) => [prestador.id, prestador.categoria]));
  const totais = new Map<CategoriaPrestador, number>();
  for (const recibo of recibos) {
    if (recibo.status !== "Aprovado") continue;
    const categoria = categoriaDe.get(recibo.prestadorId);
    if (!categoria) continue;
    totais.set(categoria, (totais.get(categoria) ?? 0) + recibo.amount);
  }
  return totais;
}

/** Valor aprovado por competência, em ordem cronológica. */
export function evolucaoMensal(recibos: Receipt[]) {
  const porMes = new Map<string, { valor: number; servicos: number }>();
  for (const recibo of recibos) {
    if (recibo.status !== "Aprovado") continue;
    const atual = porMes.get(recibo.competencia) ?? { valor: 0, servicos: 0 };
    porMes.set(recibo.competencia, { valor: atual.valor + recibo.amount, servicos: atual.servicos + 1 });
  }
  return Array.from(porMes.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([competencia, dados]) => ({ competencia, ...dados }));
}

/** Código de acesso livre? Ignora o próprio prestador ao editar. */
export function codigoDisponivel(codigo: string, prestadores: Prestador[], ignorarId?: string) {
  const alvo = codigo.trim().toUpperCase();
  return !prestadores.some((prestador) => prestador.id !== ignorarId && prestador.codigoAcesso.toUpperCase() === alvo);
}
