/**
 * Conciliação bancária: o extrato do banco de um lado, o razão da conta
 * contábil do outro. Cada lançamento do extrato precisa de um par no razão (e
 * vice-versa); o que sobra é pendência e explica a diferença entre os saldos.
 */

export const EMPRESAS = ["PNST", "PNSTART"] as const;
export type Empresa = (typeof EMPRESAS)[number];

export type ContaBancaria = {
  id: string;
  banco: string;
  empresa: Empresa;
  agencia: string;
  numero: string;
  /** Conta do plano de contas que espelha o banco no razão. */
  contaContabil: string;
  /** Saldo de abertura, igual no banco e no razão, na data abaixo. */
  saldoInicial: number;
  dataSaldoInicial: string;
  ativa: boolean;
};

/** Valor com sinal: positivo é crédito na conta (entrada), negativo é débito (saída). */
export type LancamentoExtrato = {
  id: string;
  contaId: string;
  data: string;
  historico: string;
  documento: string;
  valor: number;
  origem: "Importação" | "Manual";
  importacaoId: string | null;
  /** Identidade no banco (FITID do OFX ou assinatura da linha): impede importar duas vezes. */
  chave: string;
};

export const ORIGENS_RAZAO = ["Prestadores", "Câmbio", "Contas a pagar", "Contas a receber", "Ajuste de conciliação", "Manual"] as const;
export type OrigemRazao = (typeof ORIGENS_RAZAO)[number];

export const CONTRAPARTIDAS = [
  "Fornecedores — prestadores",
  "Folha de pagamento",
  "Aluguéis",
  "Impostos e contribuições",
  "Despesas bancárias",
  "IOF",
  "Receitas financeiras",
  "Honorários a receber",
  "Transferências entre contas",
  "Energia e telefonia",
  "Outras despesas",
  "Outras receitas",
] as const;
export type Contrapartida = (typeof CONTRAPARTIDAS)[number];

export type LancamentoRazao = {
  id: string;
  contaId: string;
  data: string;
  descricao: string;
  documento: string;
  valor: number;
  origem: OrigemRazao;
  /** Registro do sistema que gerou o lançamento (lote de prestador, ordem de câmbio). */
  origemId: string | null;
  contrapartida: Contrapartida;
};

export type ModoCasamento = "Automático" | "Manual" | "Ajuste";

/** Um ou mais lançamentos do extrato casados com um ou mais do razão, de mesma soma. */
export type Casamento = {
  id: string;
  contaId: string;
  extratoIds: string[];
  razaoIds: string[];
  modo: ModoCasamento;
  autor: string;
  quando: string;
};

export type Importacao = {
  id: string;
  contaId: string;
  arquivo: string;
  formato: "CSV" | "OFX";
  quando: string;
  autor: string;
  novas: number;
  duplicadas: number;
};

/** Saldo final que o banco informa no extrato do mês — confere a importação. */
export type SaldoInformado = { id: string; contaId: string; mes: string; saldo: number };

export type StatusFechamento = "Em revisão" | "Fechada";

/** Sem registro = mês em aberto. Em revisão ou fechada, o mês fica travado. */
export type FechamentoConciliacao = {
  id: string;
  contaId: string;
  mes: string;
  status: StatusFechamento;
  saldoExtrato: number;
  saldoRazao: number;
  pendencias: number;
  preparadoPor: string;
  preparadoEm: string;
  revisadoPor: string | null;
  revisadoEm: string | null;
  observacao: string;
};
