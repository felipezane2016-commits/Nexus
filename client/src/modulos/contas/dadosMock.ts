import { HOJE } from "@/_core/tempo";
import type { EventoEconomico, Ordem, Taxa, TarefaConta } from "./tipos";

/**
 * Tarefas do Account Management, com as categorias e periodicidades do app
 * antigo. Fornecedores genéricos; nada de nome de pessoa.
 */
type Semente = [nome: string, categoria: TarefaConta["categoria"], concluida: boolean, vencimento: string | null, periodo: string];

const SEMENTE: Semente[] = [
  ["Cotação para fechar ordens de pagamento", "Banco Industrial", true, null, "Quando houver"],
  ["Enviar ao BIB as invoices das ordens", "Banco Industrial", true, null, "Quando houver"],
  ["Assinar contratos de câmbio", "Banco Industrial", false, "2026-07-02", "Quando houver"],
  ["Atualizar planilha de extrato", "Banco Industrial", false, "2026-07-03", "Quando houver"],
  ["Atualizar planilha de fechamento de ordens", "Banco Industrial", false, null, "Quando houver"],
  ["Enviar e-mail com a cotação do câmbio", "Câmbio", true, null, "Diário"],
  ["Atualizar planilha de câmbio", "Câmbio", true, null, "Diário"],
  ["Lançar pagamentos no banco e enviar para aprovação", "Tarefas diárias", false, "2026-06-30", "Quando houver"],
  ["Atualizar pasta de pagamentos efetivados no GED", "Tarefas diárias", false, "2026-06-30", "Quando houver"],
  ["Conciliação bancária — PNSTART", "Tarefas diárias", false, "2026-07-01", "Diário"],
  ["Conciliação bancária — Itaú", "Tarefas diárias", true, "2026-06-30", "Diário"],
  ["Seguro do escritório", "Contas a pagar — PNST", false, "2026-07-15", "Mensal"],
  ["Energia elétrica", "Contas a pagar — PNST", false, "2026-07-18", "Mensal"],
  ["Pedido de VR e VT", "Contas a pagar — PNST", false, "2026-07-26", "Mensal"],
  ["Contabilidade terceirizada", "Contas a pagar — PNST", false, "2026-07-30", "Mensal"],
  ["Seguro de responsabilidade civil", "Contas a pagar — PNST", false, "2026-07-03", "Mensal"],
  ["Anuidade de associação profissional", "Contas a pagar — PNST", false, "2026-07-10", "Mensal"],
  ["Telefonia móvel", "Contas a pagar — PNST", false, "2026-07-01", "Mensal"],
  ["Plano de saúde", "Contas a pagar — PNST", false, "2026-07-03", "Mensal"],
  ["Assinatura eletrônica", "Contas a pagar — PNST", false, "2026-07-03", "Mensal"],
  ["Cartório — custas do mês", "Contas a pagar — PNST", false, "2026-07-10", "Quando houver"],
  ["Prestadores de diligência", "Contas a pagar — PNST", false, "2026-07-19", "Quando houver"],
  ["Correios", "Contas a pagar — PNST", false, "2026-07-22", "Quando houver"],
  ["Fatura do cartão corporativo", "Contas a pagar — PNST", false, "2026-07-25", "Mensal"],
  ["13º salário — CLT", "Contas a pagar — PNST", false, "2026-12-15", "Anual"],
  ["Contabilidade — PNSTART", "Contas a pagar — PNSTART", false, "2026-07-30", "Mensal"],
  ["Consulta de crédito", "Contas a pagar — PNSTART", false, "2026-07-10", "Mensal"],
  ["Guia unificada", "Impostos", false, "2026-07-19", "Mensal"],
  ["FGTS", "Impostos", false, "2026-07-19", "Mensal"],
  ["PIS/COFINS", "Impostos", false, "2026-07-25", "Mensal"],
  ["IRPJ/CSLL", "Impostos", false, "2026-07-30", "Mensal"],
  ["ISS profissionais", "Impostos", false, "2026-07-10", "Trimestral"],
  ["ISS terceiros", "Impostos", false, "2026-07-10", "Mensal"],
  ["Folha salarial", "Pagamentos jurídico e celetistas", false, "2026-07-30", "Mensal"],
  ["Distribuição de lucros", "Pagamentos jurídico e celetistas", false, "2026-07-03", "Mensal"],
  ["Adiantamento salarial", "Pagamentos jurídico e celetistas", false, "2026-07-15", "Quinzenal"],
  ["Planilha de distribuição para aprovação", "Pagamentos jurídico e celetistas", true, "2026-07-01", "Mensal"],
  ["Baixar invoices do Itaú", "Diversos", false, "2026-07-19", "Mensal"],
  ["Relatório de benefícios para a contabilidade", "Diversos", false, "2026-07-26", "Mensal"],
  ["Lançar rendimentos de aplicações", "Diversos", false, "2026-07-01", "Mensal"],
];

export const TAREFAS_CONTAS_DEMO: TarefaConta[] = SEMENTE.map(([nome, categoria, concluida, vencimento, periodo], indice) => ({
  id: `acc-${indice + 1}`,
  nome,
  categoria,
  concluida,
  vencimento,
  periodo,
  observacoes: "",
}));

/**
 * Sessenta dias úteis de cotação até a data da demonstração, num passeio
 * aleatório com semente fixa: os gráficos mostram tendência e spread
 * plausíveis e iguais a cada carga.
 */
function gerarTaxas(): Taxa[] {
  let semente = 42;
  const aleatorio = () => {
    semente = (semente * 16807) % 2147483647;
    return semente / 2147483647 - 0.5;
  };
  const datas: string[] = [];
  const cursor = new Date(`${HOJE}T12:00:00`);
  while (datas.length < 60) {
    const semana = cursor.getDay();
    if (semana !== 0 && semana !== 6) datas.unshift(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() - 1);
  }
  let usd = 5.62;
  let eur = 6.08;
  return datas.map((data, indice) => {
    usd = Math.max(5.2, usd + aleatorio() * 0.06 - 0.0015);
    eur = Math.max(5.7, eur + aleatorio() * 0.065 - 0.001);
    const arredondar = (valor: number) => Math.round(valor * 10000) / 10000;
    return {
      id: `tx-${indice + 1}`,
      data,
      horario: "10:30",
      bibUsd: arredondar(usd + 0.012 + aleatorio() * 0.01),
      bibEur: arredondar(eur + 0.009 + aleatorio() * 0.01),
      itauUsd: arredondar(usd),
      itauEur: arredondar(eur),
      observacao: "",
    };
  });
}

export const TAXAS_DEMO: Taxa[] = gerarTaxas();

export const ORDENS_DEMO: Ordem[] = [
  { id: "ord-1", dataRecebimento: "2026-06-03", cliente: "Nordhaven Holdings AS", moeda: "EUR", valor: 12480, faturas: ["50917", "50902"], tipo: "Honorários", observacoes: "", fechamento: { cotacao: 6.1245, data: "2026-06-04", responsavel: "Fernanda Moraes" } },
  { id: "ord-2", dataRecebimento: "2026-06-09", cliente: "Pinecrest Capital LLC", moeda: "USD", valor: 8650, faturas: ["50931"], tipo: "Misto", observacoes: "", fechamento: { cotacao: 5.5871, data: "2026-06-10", responsavel: "Ricardo Alves" } },
  { id: "ord-3", dataRecebimento: "2026-06-16", cliente: "Alvora GmbH", moeda: "EUR", valor: 4320.5, faturas: ["50944", "50945", "50948"], tipo: "Despesas", observacoes: "", fechamento: { cotacao: 6.0912, data: "2026-06-17", responsavel: "Fernanda Moraes" } },
  { id: "ord-4", dataRecebimento: "2026-06-24", cliente: "Marelle SAS", moeda: "EUR", valor: 9800, faturas: ["50957"], tipo: "Honorários", observacoes: "Aguardando melhor cotação.", fechamento: null },
  { id: "ord-5", dataRecebimento: "2026-06-26", cliente: "Pinecrest Capital LLC", moeda: "USD", valor: 15200, faturas: ["50961", "50963"], tipo: "Honorários", observacoes: "", fechamento: null },
  { id: "ord-6", dataRecebimento: "2026-06-29", cliente: "Lusitano SGPS, S.A.", moeda: "EUR", valor: 2150, faturas: ["50966"], tipo: "Despesas", observacoes: "", fechamento: null },
  { id: "ord-7", dataRecebimento: "2026-05-14", cliente: "Nordhaven Holdings AS", moeda: "EUR", valor: 7640, faturas: ["50871"], tipo: "Honorários", observacoes: "", fechamento: { cotacao: 6.0534, data: "2026-05-15", responsavel: "Fernanda Moraes" } },
  { id: "ord-8", dataRecebimento: "2026-05-27", cliente: "Pinecrest Capital LLC", moeda: "USD", valor: 5300, faturas: ["50889"], tipo: "Despesas", observacoes: "", fechamento: { cotacao: 5.6102, data: "2026-05-28", responsavel: "Ricardo Alves" } },
];

export const EVENTOS_ECONOMICOS_DEMO: EventoEconomico[] = [
  { id: "ev-1", data: "2026-07-01", hora: "10:00", titulo: "PMI industrial", regiao: "EUA", impacto: "Médio" },
  { id: "ev-2", data: "2026-07-03", hora: "09:30", titulo: "Payroll — relatório de emprego", regiao: "EUA", impacto: "Alto" },
  { id: "ev-3", data: "2026-07-07", hora: "06:00", titulo: "Inflação ao consumidor (prévia)", regiao: "Europa", impacto: "Médio" },
  { id: "ev-4", data: "2026-07-10", hora: "09:00", titulo: "IPCA de junho", regiao: "Brasil", impacto: "Alto" },
  { id: "ev-5", data: "2026-07-14", hora: "09:30", titulo: "Inflação ao consumidor (CPI)", regiao: "EUA", impacto: "Alto" },
  { id: "ev-6", data: "2026-07-16", hora: "09:15", titulo: "Decisão de juros do banco central europeu", regiao: "Europa", impacto: "Alto" },
  { id: "ev-7", data: "2026-07-22", hora: "18:30", titulo: "Decisão do Copom", regiao: "Brasil", impacto: "Alto" },
  { id: "ev-8", data: "2026-07-24", hora: "09:00", titulo: "IPCA-15", regiao: "Brasil", impacto: "Médio" },
  { id: "ev-9", data: "2026-07-29", hora: "15:00", titulo: "Decisão do FOMC", regiao: "EUA", impacto: "Alto" },
  { id: "ev-10", data: "2026-07-30", hora: "09:00", titulo: "Caged — emprego formal", regiao: "Brasil", impacto: "Baixo" },
];
