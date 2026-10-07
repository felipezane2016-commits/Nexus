import { somarDias } from "@/_core/tempo";
import { closingTotal } from "@/lib/portal";
import { ORDENS_DEMO } from "@/modulos/contas/dadosMock";
import { FECHAMENTOS_DEMO, PRESTADORES_DEMO, RECIBOS_DEMO } from "@/modulos/prestadores/dadosMock";
import { montarDemonstrativo, somar } from "./regras";
import type {
  Casamento,
  ContaBancaria,
  Contrapartida,
  FechamentoConciliacao,
  LancamentoExtrato,
  LancamentoRazao,
  OrigemRazao,
  SaldoInformado,
} from "./tipos";

/**
 * Semente da conciliação: maio conciliado e fechado nas três contas; junho em
 * andamento, com o que a área financeira encontra todo mês — tarifas e
 * rendimentos que só o banco conhece, cheque ainda não compensado, depósito em
 * trânsito e um lote de pagamentos debitado de uma vez só.
 */

export const CONTA_ITAU_PNST = "cb-itau-pnst";
export const CONTA_BIB_PNST = "cb-bib-pnst";
export const CONTA_ITAU_PNSTART = "cb-itau-pnstart";

export const CONTAS_BANCARIAS_DEMO: ContaBancaria[] = [
  { id: CONTA_ITAU_PNST, banco: "Itaú", empresa: "PNST", agencia: "0912", numero: "45021-3", contaContabil: "1.1.1.02.001", saldoInicial: 412_380.55, dataSaldoInicial: "2026-04-30", ativa: true },
  { id: CONTA_BIB_PNST, banco: "Banco Industrial", empresa: "PNST", agencia: "0001", numero: "88214-0", contaContabil: "1.1.1.02.002", saldoInicial: 96_540.1, dataSaldoInicial: "2026-04-30", ativa: true },
  { id: CONTA_ITAU_PNSTART, banco: "Itaú", empresa: "PNSTART", agencia: "0912", numero: "51877-1", contaContabil: "1.1.1.02.010", saldoInicial: 58_210.0, dataSaldoInicial: "2026-04-30", ativa: true },
];

type Movimento = {
  conta: string;
  /** Data no razão. */
  data: string;
  /** Data no banco, quando difere (compensação D+1, D+2). */
  dataBanco?: string;
  historico: string;
  descricao: string;
  documento?: string;
  valor: number;
  lado: "ambos" | "banco" | "razao";
  /** Já conciliado na semente. */
  casado?: boolean;
  origem?: OrigemRazao;
  origemId?: string;
  contrapartida: Contrapartida;
};

const extrato: LancamentoExtrato[] = [];
const razao: LancamentoRazao[] = [];
const casamentos: Casamento[] = [];
let sequencia = 0;

function lancar(mov: Movimento) {
  sequencia += 1;
  const documento = mov.documento ?? "";
  const linhaExtrato: LancamentoExtrato | null =
    mov.lado === "razao"
      ? null
      : {
          id: `ext-${sequencia}`,
          contaId: mov.conta,
          data: mov.dataBanco ?? mov.data,
          historico: mov.historico,
          documento,
          valor: mov.valor,
          origem: "Importação",
          importacaoId: `imp-${mov.conta}-${(mov.dataBanco ?? mov.data).slice(0, 7)}`,
          chave: `semente:${sequencia}`,
        };
  const linhaRazao: LancamentoRazao | null =
    mov.lado === "banco"
      ? null
      : {
          id: `raz-${sequencia}`,
          contaId: mov.conta,
          data: mov.data,
          descricao: mov.descricao,
          documento,
          valor: mov.valor,
          origem: mov.origem ?? (mov.valor < 0 ? "Contas a pagar" : "Contas a receber"),
          origemId: mov.origemId ?? null,
          contrapartida: mov.contrapartida,
        };
  if (linhaExtrato) extrato.push(linhaExtrato);
  if (linhaRazao) razao.push(linhaRazao);
  if (mov.casado && linhaExtrato && linhaRazao)
    casamentos.push({ id: `cas-${sequencia}`, contaId: mov.conta, extratoIds: [linhaExtrato.id], razaoIds: [linhaRazao.id], modo: "Automático", autor: "Helena Duarte", quando: `${linhaExtrato.data}T18:00:00.000Z` });
}

// ── Maio: tudo conciliado ──────────────────────────────────────────────────
const MAIO: Omit<Movimento, "casado">[] = [
  { conta: CONTA_ITAU_PNST, data: "2026-05-04", historico: "BOLETO ALUGUEL CONJ 1203", descricao: "Aluguel do escritório — maio", documento: "BOL 3290", valor: -18_500, lado: "ambos", contrapartida: "Aluguéis" },
  { conta: CONTA_ITAU_PNST, data: "2026-05-05", historico: "SISPAG SALARIOS", descricao: "Folha de pagamento — abril", valor: -84_975.2, lado: "ambos", contrapartida: "Folha de pagamento" },
  { conta: CONTA_ITAU_PNST, data: "2026-05-11", dataBanco: "2026-05-12", historico: "TED RECEBIDA VERTTI PART", descricao: "Honorários — Vertti Participações", documento: "NF 50860", valor: 52_000, lado: "ambos", contrapartida: "Honorários a receber" },
  { conta: CONTA_ITAU_PNST, data: "2026-05-20", historico: "DARF IRRF 0561", descricao: "IRRF sobre folha — abril", valor: -4_690.33, lado: "ambos", contrapartida: "Impostos e contribuições" },
  { conta: CONTA_ITAU_PNST, data: "2026-05-29", historico: "TARIFA PACOTE SERVICOS", descricao: "Tarifa bancária — maio", valor: -189.9, lado: "ambos", origem: "Ajuste de conciliação", contrapartida: "Despesas bancárias" },
  { conta: CONTA_ITAU_PNSTART, data: "2026-05-04", historico: "BOLETO ALUGUEL SALA 402", descricao: "Aluguel da sala — maio", documento: "BOL 1188", valor: -6_200, lado: "ambos", contrapartida: "Aluguéis" },
  { conta: CONTA_ITAU_PNSTART, data: "2026-05-15", historico: "PIX RECEBIDO HEXA TEC", descricao: "Honorários — Hexa Tecnologia", documento: "NF 2210", valor: 18_000, lado: "ambos", contrapartida: "Honorários a receber" },
  { conta: CONTA_ITAU_PNSTART, data: "2026-05-29", historico: "TARIFA PACOTE SERVICOS", descricao: "Tarifa bancária — maio", valor: -89.9, lado: "ambos", origem: "Ajuste de conciliação", contrapartida: "Despesas bancárias" },
];

// Ordens de câmbio fechadas: o banco credita os reais no dia seguinte ao fechamento.
const CAMBIO = ORDENS_DEMO.filter((ordem) => ordem.fechamento).map((ordem) => {
  const fechamento = ordem.fechamento!;
  const reais = Math.round(ordem.valor * fechamento.cotacao * 100) / 100;
  return {
    conta: CONTA_BIB_PNST,
    data: fechamento.data,
    dataBanco: somarDias(fechamento.data, 1),
    historico: `LIQ CAMBIO ${ordem.moeda} ${ordem.cliente.toUpperCase().slice(0, 18)}`,
    descricao: `Câmbio ${ordem.moeda} — ${ordem.cliente}`,
    documento: `FAT ${ordem.faturas[0]}`,
    valor: reais,
    lado: "ambos" as const,
    origem: "Câmbio" as const,
    origemId: ordem.id,
    contrapartida: "Honorários a receber" as const,
  };
});

// Lotes de prestadores pagos (competência de maio, pagos no começo de junho).
const nomeDe = new Map(PRESTADORES_DEMO.map((prestador) => [prestador.id, prestador.nome]));
const PRESTADORES_PAGOS = FECHAMENTOS_DEMO.filter((item) => item.review === "Pago" && item.competencia === "2026-05").map((item, indice) => {
  const total = closingTotal(RECIBOS_DEMO.filter((recibo) => recibo.prestadorId === item.prestadorId && recibo.competencia === item.competencia));
  return {
    id: `${item.prestadorId}|${item.competencia}`,
    data: `2026-06-0${4 + Math.min(indice, 3)}`,
    nome: nomeDe.get(item.prestadorId) ?? item.prestadorId,
    total: Math.round(total * 100) / 100,
  };
});

for (const mov of MAIO) lancar({ ...mov, casado: true });
for (const mov of CAMBIO.filter((item) => item.data < "2026-06-01")) lancar({ ...mov, casado: true });

// ── Junho: em andamento ────────────────────────────────────────────────────
const JUNHO: Movimento[] = [
  // Itaú · PNST
  { conta: CONTA_ITAU_PNST, data: "2026-06-01", historico: "BOLETO ALUGUEL CONJ 1203", descricao: "Aluguel do escritório — junho", documento: "BOL 3321", valor: -18_500, lado: "ambos", casado: true, contrapartida: "Aluguéis" },
  { conta: CONTA_ITAU_PNST, data: "2026-06-05", historico: "SISPAG SALARIOS", descricao: "Folha de pagamento — maio", valor: -86_420.35, lado: "ambos", casado: true, contrapartida: "Folha de pagamento" },
  { conta: CONTA_ITAU_PNST, data: "2026-06-08", historico: "TED RECEBIDA VERTTI PART", descricao: "Honorários — Vertti Participações", documento: "NF 50912", valor: 45_000, lado: "ambos", casado: true, contrapartida: "Honorários a receber" },
  { conta: CONTA_ITAU_PNST, data: "2026-06-10", historico: "DARF IRRF 0561", descricao: "IRRF sobre folha — maio", valor: -4_812.77, lado: "ambos", casado: true, contrapartida: "Impostos e contribuições" },
  { conta: CONTA_ITAU_PNST, data: "2026-06-12", historico: "IOF S/ SALDO DEVEDOR", descricao: "", valor: -23.18, lado: "banco", contrapartida: "IOF" },
  { conta: CONTA_ITAU_PNST, data: "2026-06-15", dataBanco: "2026-06-16", historico: "DEB AUT ENEL SP", descricao: "Energia elétrica — junho", documento: "FAT 778120", valor: -2_318.4, lado: "ambos", contrapartida: "Energia e telefonia" },
  { conta: CONTA_ITAU_PNST, data: "2026-06-18", historico: "DEB AUT VIVO EMPRESAS", descricao: "Telefonia — junho", documento: "FAT 99812", valor: -1_245.9, lado: "ambos", contrapartida: "Energia e telefonia" },
  { conta: CONTA_ITAU_PNST, data: "2026-06-20", historico: "TED RECEBIDA BANCO INDUSTRIAL", descricao: "Transferência do Banco Industrial", documento: "TRF 0620", valor: 50_000, lado: "ambos", contrapartida: "Transferências entre contas" },
  { conta: CONTA_ITAU_PNST, data: "2026-06-20", dataBanco: "2026-06-22", historico: "TED RECEBIDA GRUPO SANCHES", descricao: "Honorários — Grupo Sanches Alimentos", documento: "NF 50931", valor: 28_750, lado: "ambos", contrapartida: "Honorários a receber" },
  { conta: CONTA_ITAU_PNST, data: "2026-06-25", historico: "TARIFA PACOTE SERVICOS", descricao: "", valor: -189.9, lado: "banco", contrapartida: "Despesas bancárias" },
  { conta: CONTA_ITAU_PNST, data: "2026-06-26", historico: "REND APLIC AUTOMATICA", descricao: "", valor: 312.44, lado: "banco", contrapartida: "Receitas financeiras" },
  { conta: CONTA_ITAU_PNST, data: "2026-06-29", historico: "", descricao: "Cheque 000981 — 2º Tabelionato de Notas", documento: "CHQ 000981", valor: -1_150, lado: "razao", contrapartida: "Outras despesas" },
  { conta: CONTA_ITAU_PNST, data: "2026-06-30", historico: "", descricao: "Depósito — Meridiano Logística", documento: "NF 50940", valor: 12_300, lado: "razao", contrapartida: "Honorários a receber" },
  // Banco Industrial · PNST
  { conta: CONTA_BIB_PNST, data: "2026-06-20", historico: "TED ENVIADA ITAU 45021-3", descricao: "Transferência para o Itaú", documento: "TRF 0620", valor: -50_000, lado: "ambos", contrapartida: "Transferências entre contas" },
  { conta: CONTA_BIB_PNST, data: "2026-06-30", historico: "TARIFA CONTRATO CAMBIO", descricao: "", valor: -150, lado: "banco", contrapartida: "Despesas bancárias" },
  // Itaú · PNSTART
  { conta: CONTA_ITAU_PNSTART, data: "2026-06-01", historico: "BOLETO ALUGUEL SALA 402", descricao: "Aluguel da sala — junho", documento: "BOL 1201", valor: -6_200, lado: "ambos", casado: true, contrapartida: "Aluguéis" },
  { conta: CONTA_ITAU_PNSTART, data: "2026-06-16", historico: "PIX RECEBIDO HEXA TEC", descricao: "Honorários — Hexa Tecnologia", documento: "NF 2244", valor: 18_000, lado: "ambos", contrapartida: "Honorários a receber" },
  { conta: CONTA_ITAU_PNSTART, data: "2026-06-29", historico: "TARIFA PACOTE SERVICOS", descricao: "", valor: -89.9, lado: "banco", contrapartida: "Despesas bancárias" },
];
for (const mov of JUNHO) lancar(mov);
for (const mov of CAMBIO.filter((item) => item.data >= "2026-06-01")) lancar({ ...mov, casado: mov.data < "2026-06-15" });

// O banco debita os dois primeiros lotes num SISPAG só: casa 1 do extrato com 2 do razão.
PRESTADORES_PAGOS.forEach((lote, indice) => {
  sequencia += 1;
  razao.push({
    id: `raz-${sequencia}`,
    contaId: CONTA_ITAU_PNST,
    data: lote.data,
    descricao: `Pagamento — ${lote.nome} (05/2026)`,
    documento: "",
    valor: -lote.total,
    origem: "Prestadores",
    origemId: lote.id,
    contrapartida: "Fornecedores — prestadores",
  });
  if (indice >= 2) {
    casamentos.push({ id: `cas-${sequencia}`, contaId: CONTA_ITAU_PNST, extratoIds: [`ext-${sequencia}`], razaoIds: [`raz-${sequencia}`], modo: "Automático", autor: "Helena Duarte", quando: `${lote.data}T18:00:00.000Z` });
    extrato.push({ id: `ext-${sequencia}`, contaId: CONTA_ITAU_PNST, data: lote.data, historico: `SISPAG FORNECEDOR ${lote.nome.toUpperCase().slice(0, 16)}`, documento: "", valor: -lote.total, origem: "Importação", importacaoId: `imp-${CONTA_ITAU_PNST}-2026-06`, chave: `semente:${sequencia}` });
  }
});
if (PRESTADORES_PAGOS.length >= 2) {
  sequencia += 1;
  extrato.push({
    id: `ext-${sequencia}`,
    contaId: CONTA_ITAU_PNST,
    data: PRESTADORES_PAGOS[1].data,
    historico: "SISPAG FORNECEDORES LOTE 0612",
    documento: "",
    valor: -somar(PRESTADORES_PAGOS.slice(0, 2).map((lote) => ({ valor: lote.total }))),
    origem: "Importação",
    importacaoId: `imp-${CONTA_ITAU_PNST}-2026-06`,
    chave: `semente:${sequencia}`,
  });
}

export const EXTRATO_DEMO = extrato;
export const RAZAO_DEMO = razao;
export const CASAMENTOS_DEMO = casamentos;

const saldoDoExtrato = (conta: ContaBancaria, mes: string) => montarDemonstrativo(conta, extrato, razao, casamentos, mes).saldoExtrato;

/** O banco informa o saldo de maio de todas; junho, só o Itaú PNST já baixou o extrato completo. */
export const SALDOS_INFORMADOS_DEMO: SaldoInformado[] = [
  ...CONTAS_BANCARIAS_DEMO.map((conta) => ({ id: `sal-${conta.id}-2026-05`, contaId: conta.id, mes: "2026-05", saldo: saldoDoExtrato(conta, "2026-05") })),
  { id: `sal-${CONTA_ITAU_PNST}-2026-06`, contaId: CONTA_ITAU_PNST, mes: "2026-06", saldo: saldoDoExtrato(CONTAS_BANCARIAS_DEMO[0], "2026-06") },
];

export const FECHAMENTOS_CONCILIACAO_DEMO: FechamentoConciliacao[] = CONTAS_BANCARIAS_DEMO.map((conta) => {
  const demonstrativo = montarDemonstrativo(conta, extrato, razao, casamentos, "2026-05");
  return {
    id: `fch-${conta.id}-2026-05`,
    contaId: conta.id,
    mes: "2026-05",
    status: "Fechada",
    saldoExtrato: demonstrativo.saldoExtrato,
    saldoRazao: demonstrativo.saldoRazao,
    pendencias: demonstrativo.pendencias,
    preparadoPor: "Helena Duarte",
    preparadoEm: "2026-06-03T17:20:00.000Z",
    revisadoPor: "Ricardo Alves",
    revisadoEm: "2026-06-04T10:05:00.000Z",
    observacao: "",
  };
});
