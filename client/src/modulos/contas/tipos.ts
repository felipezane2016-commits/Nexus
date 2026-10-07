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

export const TIPOS_INVOICE = ["Honorários", "Despesas"] as const;
export type TipoInvoice = (typeof TIPOS_INVOICE)[number];
/** Tipo da ordem como um todo: o das invoices, ou "Misto" quando há dos dois. */
export type TipoOrdem = TipoInvoice | "Misto";

/** Invoice gerada no Sisjuri. O PDF fica no navegador (ver `anexos.ts`); aqui só a referência. */
export type Invoice = { numero: string; valor: number; tipo: TipoInvoice; anexoId: string | null; arquivo: string | null };

export const PRAZOS_DECISAO = ["Aguardar", "D+0", "D+1", "D+2"] as const;
export type PrazoDecisao = (typeof PRAZOS_DECISAO)[number];

/** O que os superiores decidiram: esperar o câmbio melhorar ou fechar em D+n. */
export type Decisao = {
  prazo: PrazoDecisao;
  /** Só em "Aguardar": cotação do BIB a partir da qual vale fechar. */
  taxaAlvo: number | null;
  /** Dia do fechamento em D+n (dias úteis a partir da decisão). */
  dataFechamento: string | null;
  decididoPor: string;
  quando: string;
  /** Registrada no próprio sistema pelo superior, ou transcrita do e-mail. */
  canal: "Sistema" | "E-mail";
  observacao: string;
};

export type EventoOrdem = { quando: string; autor: string; texto: string };

/**
 * Ordem de pagamento recebida do exterior pelo Banco Industrial. As datas
 * nulas marcam etapas ainda não feitas; a etapa atual é derivada delas
 * (`etapaDaOrdem`), nunca guardada à parte.
 */
export type Ordem = {
  id: string;
  /** Nº da ordem informado pelo banco. */
  numeroOrdem: string;
  dataRecebimento: string;
  /** Ordenante: o cliente que pagou do exterior. */
  cliente: string;
  beneficiario: string;
  moeda: Moeda;
  valor: number;
  invoices: Invoice[];
  /** Coluna da planilha: bloquear os avisos de fatura vencida para este cliente. */
  bloqueiaEmails: boolean;
  observacoes: string;
  invoiceEnviadaEm: string | null;
  okBancoEm: string | null;
  enviadaSuperioresEm: string | null;
  decisao: Decisao | null;
  fechamento: { cotacao: number; data: string; responsavel: string; quemFechou: string } | null;
  respostaBancoEm: string | null;
  baixa: { sisjuri: string | null; extrato: string | null; contrato: string | null };
  historico: EventoOrdem[];
};

/** Destinatários e assinatura dos e-mails do fluxo de ordens. */
export type ConfigEmailsOrdens = {
  emailBanco: string;
  copiaBanco: string;
  emailsSuperiores: string;
  assinatura: string;
};

export const REGIOES = ["Brasil", "EUA", "Europa"] as const;
export type Regiao = (typeof REGIOES)[number];
export type Impacto = "Alto" | "Médio" | "Baixo";

export type EventoEconomico = { id: string; data: string; hora: string; titulo: string; regiao: Regiao; impacto: Impacto };
