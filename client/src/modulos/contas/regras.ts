import type { Moeda, Ordem, PrazoDecisao, Taxa, TipoOrdem } from "./tipos";

/** Regras puras do Banco Industrial: spread, médias móveis, tendência e economia. */

export function ordenarTaxas(taxas: Taxa[]) {
  return [...taxas].sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario));
}

export function taxaDoBanco(taxa: Taxa, banco: "bib" | "itau", moeda: Moeda) {
  if (banco === "bib") return moeda === "USD" ? taxa.bibUsd : taxa.bibEur;
  return moeda === "USD" ? taxa.itauUsd : taxa.itauEur;
}

/** BIB − Itaú. Positivo = o BIB paga mais reais pela moeda recebida. */
export function spread(taxa: Taxa, moeda: Moeda) {
  return taxaDoBanco(taxa, "bib", moeda) - taxaDoBanco(taxa, "itau", moeda);
}

export function media(valores: number[]) {
  return valores.length ? valores.reduce((soma, valor) => soma + valor, 0) / valores.length : 0;
}

/** Média dos últimos `janela` valores (ou de todos, se houver menos). */
export function mediaMovel(valores: number[], janela: number) {
  return media(valores.slice(-janela));
}

/**
 * Quanto se ganha recebendo a moeda pelo banco que paga mais. O valor da
 * operação é em reais pela pior cotação; a diferença é o que a melhor rende a mais.
 */
export function economiaPotencial(valorReais: number, taxaA: number, taxaB: number) {
  const melhor = Math.max(taxaA, taxaB);
  const pior = Math.min(taxaA, taxaB);
  if (!pior || valorReais <= 0) return { valor: 0, percentual: 0 };
  const quantidade = valorReais / pior;
  const valor = quantidade * melhor - valorReais;
  return { valor, percentual: (valor / valorReais) * 100 };
}

export function ordensDoMes(ordens: Ordem[], mes: string) {
  return ordens.filter((ordem) => ordem.dataRecebimento.startsWith(mes));
}

export function valorEmReais(ordem: Ordem) {
  return ordem.fechamento ? ordem.valor * ordem.fechamento.cotacao : null;
}

// ── Fluxo da ordem de pagamento ────────────────────────────────────────────

export const ETAPAS = [
  "Recebida",
  "Invoice enviada",
  "Liberada pelo banco",
  "Aguardando decisão",
  "Aguardando câmbio",
  "Fechamento agendado",
  "Fechada",
  "Baixa pendente",
  "Concluída",
] as const;
export type Etapa = (typeof ETAPAS)[number];

/** A etapa sai das datas preenchidas: não há estado guardado que possa divergir. */
export function etapaDaOrdem(ordem: Ordem): Etapa {
  if (!ordem.fechamento) {
    if (!ordem.invoiceEnviadaEm) return "Recebida";
    if (!ordem.okBancoEm) return "Invoice enviada";
    if (!ordem.enviadaSuperioresEm) return "Liberada pelo banco";
    if (!ordem.decisao) return "Aguardando decisão";
    return ordem.decisao.prazo === "Aguardar" ? "Aguardando câmbio" : "Fechamento agendado";
  }
  if (!ordem.respostaBancoEm) return "Fechada";
  const { sisjuri, extrato, contrato } = ordem.baixa;
  return sisjuri && extrato && contrato ? "Concluída" : "Baixa pendente";
}

/** O próximo passo, em palavras, para o botão principal da ficha. */
export const PROXIMO_PASSO: Record<Etapa, string> = {
  Recebida: "Gerar a invoice no Sisjuri e enviar ao banco",
  "Invoice enviada": "Registrar o OK do banco",
  "Liberada pelo banco": "Cotar e enviar aos superiores",
  "Aguardando decisão": "Registrar a decisão dos superiores",
  "Aguardando câmbio": "Fechar quando a taxa melhorar",
  "Fechamento agendado": "Cotar e fechar com o banco",
  Fechada: "Responder o e-mail da ordem com a cotação",
  "Baixa pendente": "Baixa no Sisjuri, extrato e contrato de câmbio",
  Concluída: "Nada a fazer",
};

export function tipoDaOrdem(ordem: Ordem): TipoOrdem | null {
  const tipos = new Set(ordem.invoices.map((invoice) => invoice.tipo));
  if (tipos.size === 0) return null;
  return tipos.size > 1 ? "Misto" : Array.from(tipos)[0];
}

export function somaInvoices(ordem: Ordem) {
  return Math.round(ordem.invoices.reduce((soma, invoice) => soma + invoice.valor * 100, 0)) / 100;
}

/** D+n em dias úteis (sem feriados: o banco avisa quando há). D+0 é o próprio dia. */
export function somarDiasUteis(data: string, dias: number) {
  const cursor = new Date(`${data}T12:00:00Z`);
  const util = () => cursor.getUTCDay() !== 0 && cursor.getUTCDay() !== 6;
  while (!util()) cursor.setUTCDate(cursor.getUTCDate() + 1);
  let restantes = dias;
  while (restantes > 0) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (util()) restantes -= 1;
  }
  return cursor.toISOString().slice(0, 10);
}

export function dataDoPrazo(prazo: PrazoDecisao, decididoEm: string) {
  return prazo === "Aguardar" ? null : somarDiasUteis(decididoEm, Number(prazo.slice(2)));
}

export function ultimaTaxa(taxas: Taxa[]) {
  return ordenarTaxas(taxas).at(-1) ?? null;
}

/** As últimas `n` cotações, uma por dia (a mais recente de cada dia), da mais antiga à mais nova. */
export function ultimasCotacoes(taxas: Taxa[], n = 4) {
  const porDia = new Map<string, Taxa>();
  for (const taxa of ordenarTaxas(taxas)) porDia.set(taxa.data, taxa);
  return Array.from(porDia.values()).slice(-n);
}

/**
 * Linha "ITAÚ x BIB" do e-mail aos superiores, em percentual de verdade:
 * (BIB − Itaú) / Itaú. Negativo = o BIB paga menos reais que o Itaú.
 * (A planilha antiga mostrava a diferença em reais formatada como %.)
 */
export function diferencaItauBib(taxa: Taxa, moeda: Moeda) {
  const itau = taxaDoBanco(taxa, "itau", moeda);
  return itau ? ((taxaDoBanco(taxa, "bib", moeda) - itau) / itau) * 100 : 0;
}

export type Alerta = { ordemId: string; tom: "red" | "amber" | "green"; texto: string };

/** O que pede ação hoje: fechamento do dia ou atrasado, taxa-alvo atingida, OK do banco demorando. */
export function alertasDasOrdens(ordens: Ordem[], taxas: Taxa[], hoje: string): Alerta[] {
  const taxa = ultimaTaxa(taxas);
  const alertas: Alerta[] = [];
  for (const ordem of ordens) {
    const etapa = etapaDaOrdem(ordem);
    const quem = `${ordem.cliente} (${ordem.moeda} ${ordem.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})`;
    if (etapa === "Fechamento agendado" && ordem.decisao?.dataFechamento) {
      if (ordem.decisao.dataFechamento < hoje) alertas.push({ ordemId: ordem.id, tom: "red", texto: `Fechamento ${ordem.decisao.prazo} atrasado: ${quem}.` });
      else if (ordem.decisao.dataFechamento === hoje) alertas.push({ ordemId: ordem.id, tom: "amber", texto: `Fechar hoje (${ordem.decisao.prazo}): ${quem}.` });
    }
    if (etapa === "Aguardando câmbio" && ordem.decisao?.taxaAlvo && taxa) {
      const atual = taxaDoBanco(taxa, "bib", ordem.moeda);
      if (atual >= ordem.decisao.taxaAlvo)
        alertas.push({ ordemId: ordem.id, tom: "green", texto: `Taxa-alvo atingida: BIB ${ordem.moeda} ${atual.toFixed(4).replace(".", ",")} ≥ ${ordem.decisao.taxaAlvo.toFixed(4).replace(".", ",")} — ${quem}.` });
    }
    if (etapa === "Invoice enviada" && ordem.invoiceEnviadaEm && diasCorridos(ordem.invoiceEnviadaEm, hoje) >= 2)
      alertas.push({ ordemId: ordem.id, tom: "amber", texto: `OK do banco pendente há ${diasCorridos(ordem.invoiceEnviadaEm, hoje)} dias: ${quem}.` });
  }
  const peso = { red: 0, amber: 1, green: 2 };
  return alertas.sort((a, b) => peso[a.tom] - peso[b.tom]);
}

function diasCorridos(de: string, ate: string) {
  return Math.round((Date.parse(`${ate}T12:00:00Z`) - Date.parse(`${de}T12:00:00Z`)) / 86_400_000);
}

// ── Leitura do e-mail do Banco Industrial ──────────────────────────────────

export type OrdemLida = { numeroOrdem: string; cliente: string; beneficiario: string; moeda: Moeda | null; valor: number | null; faltando: string[] };

/**
 * Lê o e-mail "Ordem de Pagamento" do BIB colado na tela:
 * "Beneficiário: …", "Ordenante: …", "Valor: EUR. 1.263,49", "Nº da ordem: 90626".
 */
export function lerEmailOrdem(texto: string): OrdemLida {
  const linha = (rotulo: RegExp) => rotulo.exec(texto)?.[1]?.trim() ?? "";
  const beneficiario = linha(/benefici[áa]rio\s*:?[ \t]*(.+)/i);
  const cliente = linha(/ordenante\s*:?[ \t]*(.+)/i);
  const numeroOrdem = linha(/n[º°o]\.?\s*da\s*ordem\s*:?\s*([\w-]+)/i);
  const valorBruto = /valor\s*:?\s*(USD|EUR|US\$|€)\.?\s*([\d.,]+)/i.exec(texto);
  const simbolo = valorBruto?.[1]?.toUpperCase();
  const moeda: Moeda | null = simbolo ? (simbolo === "EUR" || simbolo === "€" ? "EUR" : "USD") : null;
  const numero = valorBruto?.[2] ?? "";
  const virgulaDecimal = /,\d{1,2}$/.test(numero);
  const valor = numero ? Number(virgulaDecimal ? numero.replace(/\./g, "").replace(",", ".") : numero.replace(/,/g, "")) : null;
  const faltando = [
    !cliente && "ordenante",
    !numeroOrdem && "nº da ordem",
    !moeda && "moeda",
    !(valor && Number.isFinite(valor)) && "valor",
  ].filter(Boolean) as string[];
  return { numeroOrdem, cliente, beneficiario, moeda, valor: valor && Number.isFinite(valor) ? valor : null, faltando };
}
