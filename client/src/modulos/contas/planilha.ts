import { etapaDaOrdem } from "./regras";
import type { Ordem, TipoInvoice } from "./tipos";

/**
 * "Controle de Fechamento de Ordens" no mesmo layout da planilha do
 * escritório: uma aba por mês; colunas A a L; ordem com invoices de
 * honorários e de despesas ocupa duas linhas, com as células da ordem
 * mescladas; no pé, as ordens ainda não fechadas por moeda, com o total.
 *
 * `montarAba` é puro (testável); `exportarPlanilha` desenha com o ExcelJS,
 * carregado só quando alguém exporta.
 */

export const MESES_ABA = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];

export const CABECALHO = [
  "DATA RECEBIMENTO",
  "CLIENTE",
  "MOEDA",
  "VALOR TOTAL",
  "FATURAS",
  "VALOR",
  "TIPO",
  "BLOQUEIA E-MAILS DE  FATURAS VENCIDAS?",
  "COTAÇÃO",
  "DATA FECHAMENTO",
  "QUEM FECHOU",
  "PENDENTE?",
];
export const LARGURAS = [20, 47.43, 14.86, 17.71, 31.14, 11.57, 15.86, 25.29, 13, 18.43, 32.29, 15.86];

export type Celula = string | number | { data: string } | { formula: string } | null;
export type TipoLinha = "cabecalho" | "dado" | "cabecalho-pendentes" | "pendente" | "total";
export type Linha = { tipo: TipoLinha; celulas: Celula[] };
export type Aba = { nome: string; linhas: Linha[]; mesclas: string[] };

const COLUNAS = "ABCDEFGHIJKL";

/** Fatura só com dígitos vai como número, como na planilha original. */
function fatura(numeros: string[]): Celula {
  if (numeros.length === 1 && /^\d+$/.test(numeros[0])) return Number(numeros[0]);
  return numeros.join(", ") || null;
}

function gruposPorTipo(ordem: Ordem) {
  const ordemTipos: TipoInvoice[] = ["Honorários", "Despesas"];
  return ordemTipos
    .map((tipo) => ({ tipo, invoices: ordem.invoices.filter((invoice) => invoice.tipo === tipo) }))
    .filter((grupo) => grupo.invoices.length > 0);
}

/** "PENDENTE?" é o processo inteiro: só sai de SIM quando a baixa termina. */
export function pendenteNaPlanilha(ordem: Ordem) {
  return etapaDaOrdem(ordem) === "Concluída" ? "NÃO" : "SIM";
}

export function montarAba(ordens: Ordem[], mes: string): Aba {
  const doMes = ordens
    .filter((ordem) => ordem.dataRecebimento.startsWith(mes))
    .sort((a, b) => a.dataRecebimento.localeCompare(b.dataRecebimento) || a.numeroOrdem.localeCompare(b.numeroOrdem));
  const linhas: Linha[] = [{ tipo: "cabecalho", celulas: [...CABECALHO] }];
  const mesclas: string[] = [];

  for (const ordem of doMes) {
    const grupos = gruposPorTipo(ordem);
    const primeira = linhas.length + 1;
    const comuns = {
      A: { data: ordem.dataRecebimento },
      B: ordem.cliente,
      C: ordem.moeda,
      D: ordem.valor,
      H: ordem.bloqueiaEmails ? "SIM" : null,
      I: ordem.fechamento?.cotacao ?? null,
      J: ordem.fechamento ? { data: ordem.fechamento.data } : null,
      K: ordem.fechamento?.quemFechou ?? null,
      L: pendenteNaPlanilha(ordem),
    };
    if (grupos.length <= 1) {
      const grupo = grupos[0];
      linhas.push({
        tipo: "dado",
        celulas: [comuns.A, comuns.B, comuns.C, comuns.D, grupo ? fatura(grupo.invoices.map((i) => i.numero)) : "(Fecharemos depois)", null, grupo?.tipo ?? null, comuns.H, comuns.I, comuns.J, comuns.K, comuns.L],
      });
    } else {
      grupos.forEach((grupo, indice) => {
        const valor = Math.round(grupo.invoices.reduce((soma, invoice) => soma + invoice.valor * 100, 0)) / 100;
        const deOrdem = indice === 0;
        linhas.push({
          tipo: "dado",
          celulas: [
            deOrdem ? comuns.A : null,
            deOrdem ? comuns.B : null,
            deOrdem ? comuns.C : null,
            deOrdem ? comuns.D : null,
            fatura(grupo.invoices.map((i) => i.numero)),
            valor,
            grupo.tipo,
            deOrdem ? comuns.H : null,
            deOrdem ? comuns.I : null,
            deOrdem ? comuns.J : null,
            deOrdem ? comuns.K : null,
            deOrdem ? comuns.L : null,
          ],
        });
      });
      const ultima = primeira + grupos.length - 1;
      for (const coluna of "ABCDHIJKL") mesclas.push(`${coluna}${primeira}:${coluna}${ultima}`);
    }
  }

  // Pé da aba: o que ainda não fechou, separado por moeda, com o total.
  for (const moeda of ["USD", "EUR"] as const) {
    linhas.push({ tipo: "dado", celulas: [] }, { tipo: "dado", celulas: [] }, ...(moeda === "USD" ? [{ tipo: "dado" as const, celulas: [] }, { tipo: "dado" as const, celulas: [] }] : []));
    linhas.push({ tipo: "cabecalho-pendentes", celulas: [null, "CLIENTE", "MOEDA", "VALOR TOTAL", "FATURAS", "VALOR", "TIPO", "Fechada em "] });
    const inicio = linhas.length + 1;
    for (const ordem of doMes.filter((item) => item.moeda === moeda && !item.fechamento)) {
      linhas.push({
        tipo: "pendente",
        celulas: [null, ordem.cliente, ordem.moeda, ordem.valor, fatura(ordem.invoices.map((i) => i.numero)), null, gruposPorTipo(ordem).map((g) => g.tipo).join(" + ") || null, null],
      });
    }
    const fim = linhas.length;
    linhas.push({ tipo: "total", celulas: [null, null, `AMOUNT ${moeda}`, { formula: fim >= inicio ? `SUM(D${inicio}:D${fim})` : "0" }] });
  }
  return { nome: MESES_ABA[Number(mes.slice(5, 7)) - 1], linhas, mesclas };
}

/** Meses do ano que entram no arquivo: do primeiro ao último com ordem. */
export function mesesDoAno(ordens: Ordem[], ano: string) {
  const meses = ordens.map((ordem) => ordem.dataRecebimento.slice(0, 7)).filter((mes) => mes.startsWith(ano)).sort();
  if (meses.length === 0) return [];
  const primeiro = Number(meses[0].slice(5, 7));
  const ultimo = Number(meses.at(-1)!.slice(5, 7));
  return Array.from({ length: ultimo - primeiro + 1 }, (_, i) => `${ano}-${String(primeiro + i).padStart(2, "0")}`);
}

const CINZA = "FFAEAAAA";
const AZUL = "FF9BC2E6";
const AMARELO = "FFFFFF00";

export async function exportarPlanilha(ordens: Ordem[], ano: string): Promise<Blob> {
  const { default: ExcelJS } = await import("exceljs");
  const livro = new ExcelJS.Workbook();
  const fino = { style: "thin" as const };
  const borda = { top: fino, left: fino, bottom: fino, right: fino };
  for (const mes of mesesDoAno(ordens, ano)) {
    const aba = montarAba(ordens, mes);
    const folha = livro.addWorksheet(aba.nome, { views: [{ state: "frozen", ySplit: 1 }] });
    folha.columns = LARGURAS.map((width) => ({ width }));
    aba.linhas.forEach((linha, indice) => {
      const linhaExcel = folha.getRow(indice + 1);
      linha.celulas.forEach((valor, coluna) => {
        const celula = linhaExcel.getCell(coluna + 1);
        if (valor && typeof valor === "object" && "data" in valor) {
          const [a, m, d] = valor.data.split("-").map(Number);
          celula.value = new Date(Date.UTC(a, m - 1, d));
          celula.numFmt = "mm-dd-yy";
        } else if (valor && typeof valor === "object" && "formula" in valor) celula.value = { formula: valor.formula };
        else celula.value = valor;
        const letra = COLUNAS[coluna];
        if (letra === "D" || letra === "F") celula.numFmt = "0.00";
        if (letra === "I" && typeof valor === "number") celula.numFmt = "0.0000";
      });
      const preencher = (inicio: number, fim: number, cor: string | null, negrito: boolean, tamanho = 11) => {
        for (let c = inicio; c <= fim; c++) {
          const celula = linhaExcel.getCell(c);
          celula.font = { name: "Calibri", size: tamanho, bold: negrito };
          celula.alignment = { horizontal: "center", vertical: "middle" };
          celula.border = borda;
          if (cor) celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: cor } };
        }
      };
      if (linha.tipo === "cabecalho") {
        linhaExcel.height = 30;
        preencher(1, 12, CINZA, true);
      } else if (linha.tipo === "dado" && linha.celulas.length) preencher(1, 12, null, false);
      else if (linha.tipo === "cabecalho-pendentes") {
        preencher(2, 7, CINZA, true);
        preencher(8, 8, AMARELO, true);
      } else if (linha.tipo === "pendente") preencher(2, 8, null, false);
      else if (linha.tipo === "total") preencher(3, 4, AZUL, true, 12);
    });
    aba.mesclas.forEach((faixa) => folha.mergeCells(faixa));
    folha.autoFilter = "A1:L1";
  }
  const buffer = await livro.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
