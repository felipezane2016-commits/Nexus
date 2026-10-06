export type ChaveEtapa =
  | "proposta"
  | "aceite"
  | "minuta"
  | "exterior"
  | "recebido"
  | "cotacao"
  | "aprovacao"
  | "traducao"
  | "registro"
  | "finalizado";

/** As dez etapas do processo de procuração, na ordem do pipeline. */
export const ETAPAS: { chave: ChaveEtapa; nome: string }[] = [
  { chave: "proposta", nome: "Proposta enviada" },
  { chave: "aceite", nome: "Aguardando aceite" },
  { chave: "minuta", nome: "Elaborando minutas" },
  { chave: "exterior", nome: "Enviado ao exterior" },
  { chave: "recebido", nome: "Documentos recebidos" },
  { chave: "cotacao", nome: "Em cotação" },
  { chave: "aprovacao", nome: "Aguardando aprovação" },
  { chave: "traducao", nome: "Em tradução" },
  { chave: "registro", nome: "Em registro" },
  { chave: "finalizado", nome: "Finalizado" },
];

export const TIPOS_PROCURACAO = ["Societária", "Fiscal", "Geral"] as const;
export type TipoProcuracao = (typeof TIPOS_PROCURACAO)[number];

/** Com quem está a próxima ação — a "bola" do app antigo. */
export type ComQuem = "escritorio" | "cliente";

export const TIPOS_COMUNICACAO = {
  email_enviado: "E-mail enviado",
  email_retornado: "E-mail retornou",
  resposta_recebida: "Resposta recebida do cliente",
  minuta_enviada: "Minuta enviada para assinatura",
  doc_recebido: "Documentos físicos recebidos",
  cotacao_enviada: "Cotação de tradução enviada",
  cotacao_aprovada: "Cotação aprovada",
  traducao: "Tradução solicitada",
  original_enviado: "Original enviado pelos Correios",
  registro: "Enviado ao cartório ou registro",
  ligacao: "Ligação ou contato telefônico",
  nota: "Nota interna",
} as const;
export type TipoComunicacao = keyof typeof TIPOS_COMUNICACAO;

export type Comunicacao = {
  id: string;
  data: string;
  tipo: TipoComunicacao;
  descricao: string;
  autor: string;
};

export type Processo = {
  id: string;
  clienteId: string;
  tipo: TipoProcuracao;
  responsavel: string;
  /** Vencimento da procuração vigente — o motivo de o processo existir. */
  vencimento: string | null;
  comQuem: ComQuem;
  traducao: boolean;
  observacoes: string;
  etapa: ChaveEtapa;
  /** Desde quando está na etapa atual: base do prazo de SLA. */
  etapaDesde: string;
  criadoEm: string;
  ultimaAtividade: string;
  comunicacoes: Comunicacao[];
};

export type ClienteLegal = {
  id: string;
  razaoBrasil: string;
  cnpjBrasil: string;
  razaoExterior: string;
  cnpjExterior: string;
  emails: string;
  pais: string;
  responsavel: string;
};

export type Template = { id: string; nome: string; gatilho: string; corpo: string };

export type ConfigSla = {
  /** Dias úteis por etapa; 0 = sem prazo. */
  dias: Record<ChaveEtapa, number>;
  regras: { id: string; titulo: string; descricao: string; ativa: boolean }[];
};
