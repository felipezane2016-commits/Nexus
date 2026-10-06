import type { Moeda } from "./tipos";

export function formatarTaxa(valor: number) {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

export function formatarMoeda(valor: number, moeda: Moeda) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: moeda }).format(valor);
}

/** Variação com sinal, para spread e diferença entre dias. */
export function formatarDelta(valor: number) {
  return `${valor > 0 ? "+" : valor < 0 ? "−" : ""}${formatarTaxa(Math.abs(valor))}`;
}

export function diaMes(data: string) {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}`;
}
