import type { ConfigAprovacao, Fornecedor, Pagamento } from "./tipos";

/**
 * Semente da aprovação de pagamentos: um pedido em cada situação, pedidos do
 * financeiro e de outras áreas, um urgente, um vencido e um fornecedor que
 * trocou os dados bancários e ainda não foi validado.
 */

export const CONFIG_APROVACAO_DEMO: ConfigAprovacao = {
  aprovadorId: "usr-marcos",
  substitutoId: "usr-ricardo",
  substitutoDe: null,
  substitutoAte: null,
};

const evento = (quando: string, autor: string, texto: string) => ({ quando: `${quando}T12:00:00.000Z`, autor, texto });

function fornecedor(base: Omit<Fornecedor, "dadosValidados" | "historico"> & Partial<Fornecedor>): Fornecedor {
  return { dadosValidados: true, historico: [evento("2026-01-10", "Fernanda Moraes", "Fornecedor cadastrado.")], ...base };
}

export const FORNECEDORES_DEMO: Fornecedor[] = [
  fornecedor({ id: "forn-condominio", nome: "Condomínio Edifício Faria Lima Office", documento: "12.345.678/0001-90", email: "financeiro@flo.demo", banco: "Itaú", agencia: "0350", conta: "11220-4", chavePix: "" }),
  fornecedor({ id: "forn-enel", nome: "Enel Distribuição São Paulo", documento: "61.695.227/0001-93", email: "", banco: "", agencia: "", conta: "", chavePix: "" }),
  fornecedor({ id: "forn-ribeiro", nome: "Ribeiro Correspondentes Jurídicos", documento: "23.456.789/0001-01", email: "contato@ribeiro.demo", banco: "Bradesco", agencia: "1234", conta: "56789-0", chavePix: "23.456.789/0001-01" }),
  fornecedor({ id: "forn-nuvem", nome: "Nuvem Jurídica Software Ltda", documento: "34.567.890/0001-12", email: "cobranca@nuvemjur.demo", banco: "", agencia: "", conta: "", chavePix: "" }),
  fornecedor({
    id: "forn-papelaria",
    nome: "Papelaria Central Ltda",
    documento: "45.678.901/0001-23",
    email: "vendas@papelariacentral.demo",
    banco: "Santander",
    agencia: "0101",
    conta: "13000777-1",
    chavePix: "papelariacentral@pix.demo",
    dadosValidados: false,
    historico: [
      evento("2026-02-03", "Fernanda Moraes", "Fornecedor cadastrado."),
      evento("2026-06-27", "Helena Prado", "Dados bancários alterados (pedido recebido por e-mail). Aguardando validação."),
    ],
  }),
  fornecedor({ id: "forn-exato", nome: "Exato Contabilidade S/S", documento: "56.789.012/0001-34", email: "fiscal@exato.demo", banco: "Itaú", agencia: "0912", conta: "77881-2", chavePix: "fiscal@exato.demo" }),
  fornecedor({ id: "forn-aurora", nome: "Aurora Consultoria Empresarial", documento: "67.890.123/0001-45", email: "", banco: "Inter", agencia: "0001", conta: "998877-6", chavePix: "" }),
];

type Base = Pick<Pagamento, "id" | "numero" | "favorecido" | "descricao" | "categoria" | "valor" | "vencimento" | "forma" | "solicitante" | "solicitanteId" | "solicitadoEm"> & Partial<Pagamento>;

function pagamento(base: Base): Pagamento {
  return {
    empresa: "PNST",
    fornecedorId: null,
    dadosPagamento: "",
    cliente: "",
    caso: "",
    reembolsavel: false,
    urgente: false,
    justificativaUrgencia: "",
    documentos: [{ anexoId: null, nome: `${base.numero}.pdf` }],
    status: "Em conferência",
    conferencia: null,
    aprovacao: null,
    pagamento: null,
    motivo: "",
    origem: "Solicitação",
    origemId: null,
    historico: [evento(base.solicitadoEm, base.solicitante, "Pagamento solicitado.")],
    ...base,
  };
}

const FERNANDA = { porId: "usr-fernanda", por: "Fernanda Moraes" };
const RICARDO = { porId: "usr-ricardo", por: "Ricardo Alves" };
const MARCOS = { porId: "usr-marcos", por: "Marcos Teixeira" };
const BOLETO = "34191.79001 01043.510047 91020.150008 1 96610000018500";

export const PAGAMENTOS_DEMO: Pagamento[] = [
  pagamento({
    id: "pg-1", numero: "PG-0001", fornecedorId: "forn-condominio", favorecido: "Condomínio Edifício Faria Lima Office", descricao: "Aluguel e condomínio — junho/2026",
    categoria: "Aluguel e condomínio", valor: 18500, vencimento: "2026-06-01", forma: "Boleto", dadosPagamento: BOLETO,
    solicitante: "Fernanda Moraes", solicitanteId: "usr-fernanda", solicitadoEm: "2026-05-26", status: "Pago",
    conferencia: { ...RICARDO, em: "2026-05-27T10:00:00.000Z" }, aprovacao: { ...MARCOS, em: "2026-05-27T15:00:00.000Z" },
    pagamento: { ...FERNANDA, data: "2026-06-01", contaId: "cb-itau-pnst", comprovante: { anexoId: null, nome: "Comprovante PG-0001.pdf" } },
    historico: [evento("2026-05-26", "Fernanda Moraes", "Pagamento solicitado."), evento("2026-05-27", "Ricardo Alves", "Conferido."), evento("2026-05-27", "Marcos Teixeira", "Aprovado."), evento("2026-06-01", "Fernanda Moraes", "Pago no Itaú · PNST.")],
  }),
  pagamento({
    id: "pg-2", numero: "PG-0002", favorecido: "Tribunal de Justiça de São Paulo", descricao: "Preparo recursal — apelação cível",
    categoria: "Custas processuais", valor: 638.2, vencimento: "2026-06-10", forma: "Boleto", dadosPagamento: "86810000006-3 38200156202-6 60610100000-1 00000000000-0",
    cliente: "Grupo Sanches Alimentos", caso: "1002345-67.2025.8.26.0100", reembolsavel: true,
    solicitante: "Helena Prado", solicitanteId: "usr-helena", solicitadoEm: "2026-06-08", status: "Pago",
    conferencia: { ...FERNANDA, em: "2026-06-08T14:00:00.000Z" }, aprovacao: { ...MARCOS, em: "2026-06-09T09:30:00.000Z" },
    pagamento: { ...RICARDO, data: "2026-06-09", contaId: "cb-itau-pnst", comprovante: { anexoId: null, nome: "Comprovante PG-0002.pdf" } },
    historico: [evento("2026-06-08", "Helena Prado", "Pagamento solicitado."), evento("2026-06-08", "Fernanda Moraes", "Conferido."), evento("2026-06-09", "Marcos Teixeira", "Aprovado."), evento("2026-06-09", "Ricardo Alves", "Pago no Itaú · PNST.")],
  }),
  pagamento({
    id: "pg-3", numero: "PG-0003", fornecedorId: "forn-enel", favorecido: "Enel Distribuição São Paulo", descricao: "Energia elétrica — julho/2026",
    categoria: "Energia e telefonia", valor: 2406.75, vencimento: "2026-07-03", forma: "Boleto", dadosPagamento: "83660000024-1 06750048200-7 10703778121-4 00000000000-8",
    solicitante: "Fernanda Moraes", solicitanteId: "usr-fernanda", solicitadoEm: "2026-06-25", status: "Aprovado",
    conferencia: { ...RICARDO, em: "2026-06-26T10:00:00.000Z" }, aprovacao: { ...MARCOS, em: "2026-06-26T16:20:00.000Z" },
    historico: [evento("2026-06-25", "Fernanda Moraes", "Pagamento solicitado."), evento("2026-06-26", "Ricardo Alves", "Conferido."), evento("2026-06-26", "Marcos Teixeira", "Aprovado.")],
  }),
  pagamento({
    id: "pg-4", numero: "PG-0004", fornecedorId: "forn-ribeiro", favorecido: "Ribeiro Correspondentes Jurídicos", descricao: "Diligências em Campinas — audiência de 24/06",
    categoria: "Correspondentes e prestadores", valor: 1200, vencimento: "2026-07-01", forma: "Pix", dadosPagamento: "23.456.789/0001-01",
    cliente: "Vertti Participações", caso: "0021458-70.2025.8.26.0100", reembolsavel: true,
    solicitante: "Helena Prado", solicitanteId: "usr-helena", solicitadoEm: "2026-06-26", status: "Aguardando aprovação",
    conferencia: { ...FERNANDA, em: "2026-06-29T11:00:00.000Z" },
    historico: [evento("2026-06-26", "Helena Prado", "Pagamento solicitado."), evento("2026-06-29", "Fernanda Moraes", "Conferido.")],
  }),
  pagamento({
    id: "pg-5", numero: "PG-0005", favorecido: "Tribunal de Justiça de São Paulo", descricao: "Custas de interposição — agravo de instrumento",
    categoria: "Custas processuais", valor: 2450, vencimento: "2026-06-30", forma: "Boleto", dadosPagamento: "86870000024-5 50000156202-6 60630100000-1 00000000000-0",
    cliente: "Meridiano Logística", caso: "2104567-11.2026.8.26.0000", reembolsavel: true, urgente: true, justificativaUrgencia: "Prazo do agravo vence hoje: a guia precisa estar paga para protocolar.",
    solicitante: "Helena Prado", solicitanteId: "usr-helena", solicitadoEm: "2026-06-30", status: "Aguardando aprovação",
    conferencia: { ...RICARDO, em: "2026-06-30T09:10:00.000Z" },
    historico: [evento("2026-06-30", "Helena Prado", "Pagamento solicitado (urgente)."), evento("2026-06-30", "Ricardo Alves", "Conferido.")],
  }),
  pagamento({
    id: "pg-6", numero: "PG-0006", fornecedorId: "forn-nuvem", favorecido: "Nuvem Jurídica Software Ltda", descricao: "Licenças do software de gestão de processos — 2º semestre",
    categoria: "TI e software", valor: 3890, vencimento: "2026-07-10", forma: "Boleto", dadosPagamento: "23793.38128 60082.711113 85000.063305 7 96830000389000",
    solicitante: "Caio Lemos", solicitanteId: "usr-caio", solicitadoEm: "2026-06-29",
  }),
  pagamento({
    id: "pg-7", numero: "PG-0007", fornecedorId: "forn-papelaria", favorecido: "Papelaria Central Ltda", descricao: "Material de escritório — junho",
    categoria: "Fornecedores", valor: 640, vencimento: "2026-07-05", forma: "Pix", dadosPagamento: "papelariacentral@pix.demo",
    solicitante: "Helena Prado", solicitanteId: "usr-helena", solicitadoEm: "2026-06-29",
  }),
  pagamento({
    id: "pg-8", numero: "PG-0008", favorecido: "Helena Prado", descricao: "Reembolso de táxi — audiência no Fórum de Pinheiros",
    categoria: "Reembolso de despesas", valor: 185.4, vencimento: "2026-07-05", forma: "Pix", dadosPagamento: "helena@nexus.demo",
    cliente: "Grupo Sanches Alimentos", caso: "1002345-67.2025.8.26.0100", reembolsavel: true,
    solicitante: "Helena Prado", solicitanteId: "usr-helena", solicitadoEm: "2026-06-24", status: "Devolvido", motivo: "Falta o recibo do táxi da volta (22/06).",
    historico: [evento("2026-06-24", "Helena Prado", "Pagamento solicitado."), evento("2026-06-25", "Fernanda Moraes", "Devolvido: Falta o recibo do táxi da volta (22/06).")],
  }),
  pagamento({
    id: "pg-9", numero: "PG-0009", fornecedorId: "forn-aurora", favorecido: "Aurora Consultoria Empresarial", descricao: "Diagnóstico de processos internos",
    categoria: "Outras despesas", valor: 12000, vencimento: "2026-06-25", forma: "TED", dadosPagamento: "Inter · ag. 0001 · c/c 998877-6",
    solicitante: "Ricardo Alves", solicitanteId: "usr-ricardo", solicitadoEm: "2026-06-18", status: "Reprovado", motivo: "Contrato não foi assinado; não há serviço contratado.",
    conferencia: { ...FERNANDA, em: "2026-06-19T10:00:00.000Z" },
    historico: [evento("2026-06-18", "Ricardo Alves", "Pagamento solicitado."), evento("2026-06-19", "Fernanda Moraes", "Conferido."), evento("2026-06-19", "Marcos Teixeira", "Reprovado: Contrato não foi assinado; não há serviço contratado.")],
  }),
  pagamento({
    id: "pg-10", numero: "PG-0010", empresa: "PNSTART", fornecedorId: "forn-exato", favorecido: "Exato Contabilidade S/S", descricao: "Honorários contábeis — junho/2026",
    categoria: "Outras despesas", valor: 4200, vencimento: "2026-06-29", forma: "TED", dadosPagamento: "Itaú · ag. 0912 · c/c 77881-2",
    solicitante: "Fernanda Moraes", solicitanteId: "usr-fernanda", solicitadoEm: "2026-06-22", status: "Aprovado",
    conferencia: { ...RICARDO, em: "2026-06-23T10:00:00.000Z" }, aprovacao: { ...MARCOS, em: "2026-06-24T11:00:00.000Z" },
    historico: [evento("2026-06-22", "Fernanda Moraes", "Pagamento solicitado."), evento("2026-06-23", "Ricardo Alves", "Conferido."), evento("2026-06-24", "Marcos Teixeira", "Aprovado.")],
  }),
];
