export const COLUNAS_TAREFA = [
  { chave: "backlog", nome: "Backlog" },
  { chave: "andamento", nome: "Em andamento" },
  { chave: "revisao", nome: "Revisão" },
  { chave: "concluido", nome: "Concluído" },
] as const;
export type ColunaTarefa = (typeof COLUNAS_TAREFA)[number]["chave"];
export type Prioridade = "Alta" | "Média" | "Baixa";
export const AREAS_TAREFA = ["Prestadores", "Financeiro", "Geral"] as const;
export type AreaTarefa = (typeof AREAS_TAREFA)[number];

export type Tarefa = {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: Prioridade;
  area: AreaTarefa;
  responsavelId: string | null;
  prazo: string | null;
  coluna: ColunaTarefa;
};

export const CATEGORIAS_DOCUMENTO = ["Contratos", "Jurídico", "Relatórios", "Outros"] as const;
export type CategoriaDocumento = (typeof CATEGORIAS_DOCUMENTO)[number];

export type Documento = {
  id: string;
  nome: string;
  categoria: CategoriaDocumento;
  tamanho: number;
  data: string;
  enviadoPor: string;
};

export type Reuniao = {
  id: string;
  titulo: string;
  data: string;
  hora: string;
  local: string;
  participantes: string;
  pauta: string;
};
