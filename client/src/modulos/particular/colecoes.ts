import { criarColecao, useColecao } from "@/_core/armazenamento/colecao";

export const CATEGORIAS_OBJETIVO = ["Carreira", "Saúde", "Social e família", "Casa", "Estudos", "Viagens", "Financeiro", "Outros"] as const;
export type CategoriaObjetivo = (typeof CATEGORIAS_OBJETIVO)[number];
export type StatusObjetivo = "Pendente" | "Em andamento" | "Concluído";

export type Objetivo = {
  id: string;
  texto: string;
  categoria: CategoriaObjetivo;
  ano: number;
  principal: boolean;
  status: StatusObjetivo;
};

export const CATEGORIAS_DESPESA = ["Saúde", "Alimentação", "Cartão de crédito", "Moradia", "Estudos", "Esporte", "Diversos"] as const;
export type CategoriaDespesa = (typeof CATEGORIAS_DESPESA)[number];
export type StatusDespesa = "Pendente" | "Em andamento" | "Pago";

export type Despesa = {
  id: string;
  titulo: string;
  data: string;
  valor: number;
  fixa: boolean;
  categoria: CategoriaDespesa;
  parcelas: string;
  status: StatusDespesa;
  observacoes: string;
};

const OBJETIVOS_DEMO: Objetivo[] = [
  { id: "ob-1", texto: "Concluir a pós-graduação em direito digital", categoria: "Estudos", ano: 2026, principal: true, status: "Em andamento" },
  { id: "ob-2", texto: "Correr uma meia maratona", categoria: "Saúde", ano: 2026, principal: true, status: "Pendente" },
  { id: "ob-3", texto: "Montar reserva de emergência de 6 meses", categoria: "Financeiro", ano: 2026, principal: true, status: "Em andamento" },
  { id: "ob-4", texto: "Viagem de férias em família", categoria: "Viagens", ano: 2026, principal: false, status: "Concluído" },
  { id: "ob-5", texto: "Reformar o escritório de casa", categoria: "Casa", ano: 2026, principal: false, status: "Pendente" },
  { id: "ob-6", texto: "Aprender espanhol (nível B1)", categoria: "Estudos", ano: 2025, principal: false, status: "Concluído" },
];

const DESPESAS_DEMO: Despesa[] = [
  { id: "dp-1", titulo: "Aluguel", data: "2026-06-05", valor: 3200, fixa: true, categoria: "Moradia", parcelas: "", status: "Pago", observacoes: "" },
  { id: "dp-2", titulo: "Condomínio", data: "2026-06-10", valor: 780, fixa: true, categoria: "Moradia", parcelas: "", status: "Pago", observacoes: "" },
  { id: "dp-3", titulo: "Plano de saúde", data: "2026-06-12", valor: 640, fixa: true, categoria: "Saúde", parcelas: "", status: "Pago", observacoes: "" },
  { id: "dp-4", titulo: "Mensalidade da pós", data: "2026-06-15", valor: 1150, fixa: true, categoria: "Estudos", parcelas: "6/18", status: "Pago", observacoes: "" },
  { id: "dp-5", titulo: "Fatura do cartão", data: "2026-06-20", valor: 2380.4, fixa: false, categoria: "Cartão de crédito", parcelas: "", status: "Pendente", observacoes: "" },
  { id: "dp-6", titulo: "Supermercado", data: "2026-06-22", valor: 912.35, fixa: false, categoria: "Alimentação", parcelas: "", status: "Pago", observacoes: "" },
  { id: "dp-7", titulo: "Inscrição da prova de corrida", data: "2026-06-28", valor: 260, fixa: false, categoria: "Esporte", parcelas: "", status: "Em andamento", observacoes: "" },
  { id: "dp-8", titulo: "Aluguel", data: "2026-05-05", valor: 3200, fixa: true, categoria: "Moradia", parcelas: "", status: "Pago", observacoes: "" },
  { id: "dp-9", titulo: "Supermercado", data: "2026-05-19", valor: 864.1, fixa: false, categoria: "Alimentação", parcelas: "", status: "Pago", observacoes: "" },
];

export const objetivos = criarColecao<Objetivo[]>("particular-objetivos", () => OBJETIVOS_DEMO);
export const despesas = criarColecao<Despesa[]>("particular-despesas", () => DESPESAS_DEMO);

export function useDadosParticular() {
  return { objetivos: useColecao(objetivos), despesas: useColecao(despesas) };
}
