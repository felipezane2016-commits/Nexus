export const CATEGORIAS_CONTAS = [
  "Banco Industrial",
  "Câmbio",
  "Tarefas diárias",
  "Contas a pagar — PNST",
  "Contas a pagar — PNSTART",
  "Impostos",
  "Pagamentos jurídico e celetistas",
  "Diversos",
] as const;
export type CategoriaConta = (typeof CATEGORIAS_CONTAS)[number];

export type TarefaConta = {
  id: string;
  nome: string;
  categoria: CategoriaConta;
  concluida: boolean;
  vencimento: string | null;
  periodo: string;
  observacoes: string;
};

/** Cotação do dia nos dois bancos, em R$ por unidade da moeda. */
export type Taxa = {
  id: string;
  data: string;
  horario: string;
  bibUsd: number;
  bibEur: number;
  itauUsd: number;
  itauEur: number;
  observacao: string;
};

export type Moeda = "USD" | "EUR";
export const TIPOS_ORDEM = ["Honorários", "Despesas", "Misto"] as const;
export type TipoOrdem = (typeof TIPOS_ORDEM)[number];

export type Ordem = {
  id: string;
  dataRecebimento: string;
  cliente: string;
  moeda: Moeda;
  valor: number;
  faturas: string[];
  tipo: TipoOrdem;
  observacoes: string;
  /** null = pendente, ainda não fechada. */
  fechamento: { cotacao: number; data: string; responsavel: string } | null;
};

export const REGIOES = ["Brasil", "EUA", "Europa"] as const;
export type Regiao = (typeof REGIOES)[number];
export type Impacto = "Alto" | "Médio" | "Baixo";

export type EventoEconomico = { id: string; data: string; hora: string; titulo: string; regiao: Regiao; impacto: Impacto };
