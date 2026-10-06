export const SERVICOS_CONSULTORIA = ["Tradução juramentada", "Registro CDT", "Marketing", "Sistemas"] as const;
export type ServicoConsultoria = (typeof SERVICOS_CONSULTORIA)[number];
export const STATUS_TRABALHO = ["Pendente", "Em andamento", "Concluído", "Cancelado"] as const;
export type StatusTrabalho = (typeof STATUS_TRABALHO)[number];
export const STATUS_PAGAMENTO = ["Pendente", "Parcial", "Pago"] as const;
export type StatusPagamento = (typeof STATUS_PAGAMENTO)[number];

export type ReuniaoCliente = { id: string; data: string; titulo: string; notas: string };

export type ClienteConsultoria = {
  id: string;
  nome: string;
  tags: string[];
  cadastro: string;
  contato: string;
  observacoes: string;
  reunioes: ReuniaoCliente[];
};

export type Trabalho = {
  id: string;
  clienteId: string;
  data: string;
  servicos: ServicoConsultoria[];
  descricao: string;
  status: StatusTrabalho;
  pagamento: StatusPagamento;
  valor: number;
};
