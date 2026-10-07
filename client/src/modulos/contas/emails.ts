import { formatarData } from "@/_core/tempo";
import { formatBRL } from "@/lib/portal";
import { formatarMoeda, formatarTaxa } from "./formato";
import { diferencaItauBib, tipoDaOrdem, valorEmReais } from "./regras";
import type { ConfigEmailsOrdens, Invoice, Ordem, Taxa } from "./tipos";

/**
 * Os três e-mails do fluxo de ordens, montados do jeito que o escritório já
 * manda: ao banco com a invoice, aos superiores com a cotação, e a resposta
 * ao banco depois do fechamento. Cada um sai em texto e em HTML (para colar
 * no Outlook com a tabela formatada) e com a lista de anexos.
 */

export type Email = { para: string; cc: string; assunto: string; texto: string; html: string; anexos: Invoice[] };

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function saudacao(hora: number) {
  return hora < 12 ? "bom dia" : hora < 18 ? "boa tarde" : "boa noite";
}

function escapar(texto: string) {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Parágrafos de texto simples viram <p>; linhas simples, <br>. */
function paragrafos(texto: string) {
  return texto
    .split(/\n{2,}/)
    .map((bloco) => `<p style="margin:0 0 12px">${escapar(bloco).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function corpoHtml(...partes: string[]) {
  return `<div style="font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#000">${partes.join("")}</div>`;
}

function linhaInvoice(invoice: Invoice, ordem: Ordem) {
  return `Invoice ${invoice.numero} — ${invoice.tipo} — ${formatarMoeda(invoice.valor, ordem.moeda)}`;
}

function resumoOrdem(ordem: Ordem) {
  return [
    `Ordenante: ${ordem.cliente}`,
    `Valor: ${formatarMoeda(ordem.valor, ordem.moeda)}`,
    `Nº da ordem: ${ordem.numeroOrdem}`,
    `Tipo: ${tipoDaOrdem(ordem) ?? "—"}${ordem.invoices.length ? ` (invoices ${ordem.invoices.map((i) => i.numero).join(", ")})` : ""}`,
  ].join("\n");
}

export function assuntoDaOrdem(ordem: Ordem) {
  return `RE: Ordem de Pagamento - ${ordem.beneficiario.split(/\s+/)[0]?.toUpperCase() ?? ""} - Nº ${ordem.numeroOrdem}`;
}

/** Etapa 2: invoice ao Banco Industrial, dizendo se é honorários ou despesas. */
export function emailInvoiceAoBanco(ordem: Ordem, config: ConfigEmailsOrdens, hora: number): Email {
  const varias = ordem.invoices.length > 1;
  const texto = [
    `Prezados, ${saudacao(hora)}!`,
    `Segue${varias ? "m" : ""} em anexo ${varias ? "as invoices referentes" : "a invoice referente"} à ordem de pagamento nº ${ordem.numeroOrdem}, no valor de ${formatarMoeda(ordem.valor, ordem.moeda)}, recebida de ${ordem.cliente}.`,
    `Natureza da ordem: ${tipoDaOrdem(ordem) ?? "—"}\n${ordem.invoices.map((invoice) => linhaInvoice(invoice, ordem)).join("\n")}`,
    "Ficamos no aguardo do OK para o fechamento.",
    `Att,\n${config.assinatura}`,
  ].join("\n\n");
  return { para: config.emailBanco, cc: config.copiaBanco, assunto: assuntoDaOrdem(ordem), texto, html: corpoHtml(paragrafos(texto)), anexos: ordem.invoices };
}

/** Etapa 8: resposta ao e-mail da ordem com a cotação fechada e as invoices. */
export function emailRespostaAoBanco(ordem: Ordem, config: ConfigEmailsOrdens, hora: number): Email {
  const fechamento = ordem.fechamento;
  const reais = valorEmReais(ordem);
  const texto = [
    `Prezados, ${saudacao(hora)}!`,
    fechamento
      ? `Conforme combinado, a ordem de pagamento nº ${ordem.numeroOrdem} (${formatarMoeda(ordem.valor, ordem.moeda)} — ${ordem.cliente}) foi fechada em ${formatarData(fechamento.data)} à taxa de R$ ${formatarTaxa(fechamento.cotacao)}, totalizando ${formatBRL(reais ?? 0)}.`
      : `A ordem de pagamento nº ${ordem.numeroOrdem} ainda não foi fechada.`,
    `Seguem em anexo as invoices para análise:\n${ordem.invoices.map((invoice) => linhaInvoice(invoice, ordem)).join("\n")}`,
    `Att,\n${config.assinatura}`,
  ].join("\n\n");
  return { para: config.emailBanco, cc: config.copiaBanco, assunto: assuntoDaOrdem(ordem), texto, html: corpoHtml(paragrafos(texto)), anexos: ordem.invoices };
}

export function rotuloDia(data: string) {
  return `${data.slice(8, 10)}/${MESES[Number(data.slice(5, 7)) - 1]}`;
}

function pct(valor: number) {
  return `${valor < 0 ? "-" : ""}${Math.abs(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/** A tabela "Horário Cotação × dia × USD/EUR × BIB/ITAU × ITAÚ x BIB", com as cores do e-mail de hoje. */
export function tabelaCotacoesHtml(taxas: Taxa[]) {
  const borda = "border:1px solid #000;";
  const cel = (conteudo: string, estilo = "") =>
    `<td style="${borda}padding:2px 8px;text-align:center;font-size:10pt;white-space:nowrap;${estilo}">${conteudo}</td>`;
  const vazio = `<td style="width:14px"></td>`;
  const rotulo = (texto: string, fundo: string) => `<td style="${borda}padding:2px 8px;font-weight:bold;font-size:10pt;background:${fundo}">${texto}</td>`;
  const grupo = (f: (taxa: Taxa) => string) => taxas.map((taxa) => `${vazio}${f(taxa)}`).join("");
  const linhas = [
    `<tr>${rotulo("Horário Cotação", "#C6E0B4")}${grupo((t) => cel(`<b>${escapar(t.horario)}</b>`, "background:#C6E0B4").replace("<td", '<td colspan="2"'))}</tr>`,
    `<tr><td style="height:8px"></td></tr>`,
    `<tr><td></td>${grupo((t) => cel(`<b>${rotuloDia(t.data)}</b>`, "background:#D9D9D9").replace("<td", '<td colspan="2"'))}</tr>`,
    `<tr><td style="height:8px"></td></tr>`,
    `<tr><td></td>${grupo(() => cel("<b>USD</b>", "background:#F8CBAD") + cel("<b>EUR</b>", "background:#F8CBAD"))}</tr>`,
    `<tr>${rotulo("BIB", "#D9D9D9")}${grupo((t) => cel(formatarTaxa(t.bibUsd)) + cel(formatarTaxa(t.bibEur)))}</tr>`,
    `<tr>${rotulo("ITAU", "#D9D9D9")}${grupo((t) => cel(formatarTaxa(t.itauUsd)) + cel(formatarTaxa(t.itauEur)))}</tr>`,
    `<tr><td style="height:8px"></td></tr>`,
    `<tr>${rotulo("ITAÚ x BIB", "#F8CBAD")}${grupo((t) => cel(pct(diferencaItauBib(t, "USD"))) + cel(pct(diferencaItauBib(t, "EUR"))))}</tr>`,
  ];
  return `<table style="border-collapse:collapse;font-family:Calibri,Arial,sans-serif;margin:8px 0 16px">${linhas.join("")}</table>`;
}

function tabelaCotacoesTexto(taxas: Taxa[]) {
  const col = (texto: string) => texto.padStart(9);
  return [
    `${"".padEnd(12)}${taxas.map((t) => col(rotuloDia(t.data)) + col(t.horario)).join("  ")}`,
    `${"".padEnd(12)}${taxas.map(() => col("USD") + col("EUR")).join("  ")}`,
    `${"BIB".padEnd(12)}${taxas.map((t) => col(formatarTaxa(t.bibUsd)) + col(formatarTaxa(t.bibEur))).join("  ")}`,
    `${"ITAU".padEnd(12)}${taxas.map((t) => col(formatarTaxa(t.itauUsd)) + col(formatarTaxa(t.itauEur))).join("  ")}`,
    `${"ITAÚ x BIB".padEnd(12)}${taxas.map((t) => col(pct(diferencaItauBib(t, "USD"))) + col(pct(diferencaItauBib(t, "EUR")))).join("  ")}`,
  ].join("\n");
}

/** Etapa 5: cotação do dia aos superiores, com as ordens para fechamento e o comentário de mercado. */
export function emailAosSuperiores(ordens: Ordem[], taxas: Taxa[], comentario: string, config: ConfigEmailsOrdens, hora: number): Email {
  const hoje = taxas.at(-1)?.data ?? "";
  const quantas = ordens.length === 1 ? "uma ordem de pagamento" : `${ordens.length} ordens de pagamento`;
  const abertura = `Prezados, ${saudacao(hora)}!`;
  const mercado = `Segue cotação${comentario.trim() ? `, ${comentario.trim().replace(/^[A-Z]/, (c) => c.toLowerCase())}` : "."}`;
  const chamada = `Temos ${quantas} para fechamento:`;
  const blocos = ordens.map(resumoOrdem);
  const texto = [abertura, mercado, chamada, ...blocos, tabelaCotacoesTexto(taxas), `Att,\n${config.assinatura}`].join("\n\n");
  const html = corpoHtml(
    paragrafos([abertura, mercado, chamada].join("\n\n")),
    ...blocos.map((bloco) => `<p style="margin:0 0 12px;padding-left:10px;border-left:3px solid #F16122">${escapar(bloco).replace(/\n/g, "<br>")}</p>`),
    tabelaCotacoesHtml(taxas),
    paragrafos(`Att,\n${config.assinatura}`),
  );
  return { para: config.emailsSuperiores, cc: "", assunto: `Cotação de Câmbio ${hoje ? `${hoje.slice(8, 10)}/${hoje.slice(5, 7)}` : ""}`.trim(), texto, html, anexos: [] };
}
