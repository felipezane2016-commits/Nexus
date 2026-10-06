import type { Moeda, Ordem, Taxa } from "./tipos";

/** Regras puras do Banco Industrial: spread, médias móveis, tendência e economia. */

export function ordenarTaxas(taxas: Taxa[]) {
  return [...taxas].sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario));
}

export function taxaDoBanco(taxa: Taxa, banco: "bib" | "itau", moeda: Moeda) {
  if (banco === "bib") return moeda === "USD" ? taxa.bibUsd : taxa.bibEur;
  return moeda === "USD" ? taxa.itauUsd : taxa.itauEur;
}

/** BIB − Itaú. Positivo = o BIB paga mais reais pela moeda recebida. */
export function spread(taxa: Taxa, moeda: Moeda) {
  return taxaDoBanco(taxa, "bib", moeda) - taxaDoBanco(taxa, "itau", moeda);
}

export function media(valores: number[]) {
  return valores.length ? valores.reduce((soma, valor) => soma + valor, 0) / valores.length : 0;
}

/** Média dos últimos `janela` valores (ou de todos, se houver menos). */
export function mediaMovel(valores: number[], janela: number) {
  return media(valores.slice(-janela));
}

export type Tendencia = "Alta" | "Baixa" | "Estável";

/** Compara a média curta com a longa; diferença menor que 0,3% é estabilidade. */
export function tendencia(valores: number[]): Tendencia {
  const curta = mediaMovel(valores, 7);
  const longa = mediaMovel(valores, 30);
  if (!longa) return "Estável";
  const variacao = (curta - longa) / longa;
  if (variacao > 0.003) return "Alta";
  if (variacao < -0.003) return "Baixa";
  return "Estável";
}

/**
 * Quanto se ganha recebendo a moeda pelo banco que paga mais. O valor da
 * operação é em reais pela pior cotação; a diferença é o que a melhor rende a mais.
 */
export function economiaPotencial(valorReais: number, taxaA: number, taxaB: number) {
  const melhor = Math.max(taxaA, taxaB);
  const pior = Math.min(taxaA, taxaB);
  if (!pior || valorReais <= 0) return { valor: 0, percentual: 0 };
  const quantidade = valorReais / pior;
  const valor = quantidade * melhor - valorReais;
  return { valor, percentual: (valor / valorReais) * 100 };
}

export function ordensDoMes(ordens: Ordem[], mes: string) {
  return ordens.filter((ordem) => ordem.dataRecebimento.startsWith(mes));
}

export function valorEmReais(ordem: Ordem) {
  return ordem.fechamento ? ordem.valor * ordem.fechamento.cotacao : null;
}
