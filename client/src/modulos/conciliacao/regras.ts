import type { Casamento, ContaBancaria, FechamentoConciliacao, LancamentoExtrato, LancamentoRazao } from "./tipos";

/**
 * Regras puras da conciliação bancária, sem React. Valores com sinal: positivo
 * entra na conta, negativo sai. Comparações em centavos para não tropeçar em
 * ponto flutuante.
 */

export const TOLERANCIA_DIAS = 3;
/** Pendência mais velha que isto pede investigação, não só espera. */
export const DIAS_PENDENCIA_ANTIGA = 15;

export const centavos = (valor: number) => Math.round(valor * 100);
export const somar = (lista: { valor: number }[]) => lista.reduce((soma, item) => soma + centavos(item.valor), 0) / 100;

export function fimDoMes(mes: string) {
  const [ano, numero] = mes.split("-").map(Number);
  const ultimo = new Date(Date.UTC(ano, numero, 0)).getUTCDate();
  return `${mes}-${String(ultimo).padStart(2, "0")}`;
}

export function mesAnterior(mes: string) {
  const [ano, numero] = mes.split("-").map(Number);
  const data = new Date(Date.UTC(ano, numero - 2, 1));
  return data.toISOString().slice(0, 7);
}

export function diasEntre(a: string, b: string) {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
}

/** Lançamentos que contam para a conta: depois da data do saldo de abertura. */
function daConta<T extends { contaId: string; data: string }>(lista: T[], conta: ContaBancaria) {
  return lista.filter((item) => item.contaId === conta.id && item.data > conta.dataSaldoInicial);
}

export function saldoAte(conta: ContaBancaria, lista: { contaId: string; data: string; valor: number }[], data: string) {
  return (centavos(conta.saldoInicial) + centavos(somar(daConta(lista, conta).filter((item) => item.data <= data)))) / 100;
}

// ── Situação de cada lançamento numa data de corte ─────────────────────────

export type Situacao = "Conciliado" | "Pendente";

/**
 * Na data de corte, um lançamento é pendente se ainda não tem par, ou se o par
 * só aparece depois do corte (o cheque emitido em junho e compensado em julho
 * é pendência de junho, mesmo já casado).
 */
export function situacoesNoCorte(
  conta: ContaBancaria,
  extrato: LancamentoExtrato[],
  razao: LancamentoRazao[],
  casamentos: Casamento[],
  corte: string,
) {
  const dataExtrato = new Map(extrato.map((item) => [item.id, item.data]));
  const dataRazao = new Map(razao.map((item) => [item.id, item.data]));
  const casamentoDe = new Map<string, Casamento>();
  for (const casamento of casamentos) {
    if (casamento.contaId !== conta.id) continue;
    casamento.extratoIds.forEach((id) => casamentoDe.set(`e:${id}`, casamento));
    casamento.razaoIds.forEach((id) => casamentoDe.set(`r:${id}`, casamento));
  }
  const fechadoNoCorte = (casamento: Casamento) =>
    casamento.extratoIds.every((id) => (dataExtrato.get(id) ?? "9999") <= corte) &&
    casamento.razaoIds.every((id) => (dataRazao.get(id) ?? "9999") <= corte);
  const situacao = (chave: string): Situacao => {
    const casamento = casamentoDe.get(chave);
    return casamento && fechadoNoCorte(casamento) ? "Conciliado" : "Pendente";
  };
  return {
    extrato: daConta(extrato, conta)
      .filter((item) => item.data <= corte)
      .map((item) => ({ item, situacao: situacao(`e:${item.id}`), casamento: casamentoDe.get(`e:${item.id}`) ?? null })),
    razao: daConta(razao, conta)
      .filter((item) => item.data <= corte)
      .map((item) => ({ item, situacao: situacao(`r:${item.id}`), casamento: casamentoDe.get(`r:${item.id}`) ?? null })),
  };
}

// ── Demonstrativo ──────────────────────────────────────────────────────────

export type Demonstrativo = {
  corte: string;
  saldoExtrato: number;
  saldoRazao: number;
  /** No razão, ainda não no banco. */
  depositosEmTransito: LancamentoRazao[];
  pagamentosNaoCompensados: LancamentoRazao[];
  /** No banco, ainda não no razão. */
  creditosNaoContabilizados: LancamentoExtrato[];
  debitosNaoContabilizados: LancamentoExtrato[];
  saldoBancoAjustado: number;
  saldoRazaoAjustado: number;
  /** Diferença sem explicação. Zero é conciliação fechada. */
  diferenca: number;
  pendencias: number;
};

/**
 * O demonstrativo clássico: parte do saldo do banco e do saldo do razão,
 * soma e subtrai as pendências de cada lado e chega ao mesmo saldo ajustado.
 */
export function montarDemonstrativo(
  conta: ContaBancaria,
  extrato: LancamentoExtrato[],
  razao: LancamentoRazao[],
  casamentos: Casamento[],
  mes: string,
): Demonstrativo {
  const corte = fimDoMes(mes);
  const situacoes = situacoesNoCorte(conta, extrato, razao, casamentos, corte);
  const razaoPendente = situacoes.razao.filter((linha) => linha.situacao === "Pendente").map((linha) => linha.item);
  const extratoPendente = situacoes.extrato.filter((linha) => linha.situacao === "Pendente").map((linha) => linha.item);
  const saldoExtrato = saldoAte(conta, extrato, corte);
  const saldoRazao = saldoAte(conta, razao, corte);
  const saldoBancoAjustado = (centavos(saldoExtrato) + centavos(somar(razaoPendente))) / 100;
  const saldoRazaoAjustado = (centavos(saldoRazao) + centavos(somar(extratoPendente))) / 100;
  const porData = <T extends { data: string }>(lista: T[]) => [...lista].sort((a, b) => a.data.localeCompare(b.data));
  return {
    corte,
    saldoExtrato,
    saldoRazao,
    depositosEmTransito: porData(razaoPendente.filter((item) => item.valor > 0)),
    pagamentosNaoCompensados: porData(razaoPendente.filter((item) => item.valor < 0)),
    creditosNaoContabilizados: porData(extratoPendente.filter((item) => item.valor > 0)),
    debitosNaoContabilizados: porData(extratoPendente.filter((item) => item.valor < 0)),
    saldoBancoAjustado,
    saldoRazaoAjustado,
    diferenca: (centavos(saldoBancoAjustado) - centavos(saldoRazaoAjustado)) / 100,
    pendencias: razaoPendente.length + extratoPendente.length,
  };
}

// ── Casamento ──────────────────────────────────────────────────────────────

export type ErroCasamento = string | null;

export function validarCasamento(extrato: LancamentoExtrato[], razao: LancamentoRazao[], casamentos: Casamento[]): ErroCasamento {
  if (extrato.length === 0 || razao.length === 0) return "Selecione lançamentos dos dois lados.";
  const contas = new Set([...extrato, ...razao].map((item) => item.contaId));
  if (contas.size > 1) return "Os lançamentos são de contas diferentes.";
  const usados = new Set(casamentos.flatMap((casamento) => [...casamento.extratoIds.map((id) => `e:${id}`), ...casamento.razaoIds.map((id) => `r:${id}`)]));
  if (extrato.some((item) => usados.has(`e:${item.id}`)) || razao.some((item) => usados.has(`r:${item.id}`)))
    return "Algum lançamento já está conciliado.";
  if (centavos(somar(extrato)) !== centavos(somar(razao))) return "As somas dos dois lados precisam ser iguais.";
  return null;
}

export type Sugestao = { extratoIds: string[]; razaoIds: string[] };

/**
 * Casamento automático, do mais seguro ao menos seguro:
 * 1. um para um, mesmo valor, até 3 dias de distância — com o mesmo documento
 *    primeiro, depois a data mais próxima;
 * 2. um débito ou crédito do banco que soma 2 a 4 lançamentos do razão de
 *    mesmo sinal (o lote de pagamentos que o banco debita de uma vez).
 */
export function sugerirCasamentos(extrato: LancamentoExtrato[], razao: LancamentoRazao[]): Sugestao[] {
  const sugestoes: Sugestao[] = [];
  const livresRazao = new Map(razao.map((item) => [item.id, item]));
  const sobras: LancamentoExtrato[] = [];
  const documentoIgual = (a: string, b: string) => Boolean(a.trim()) && a.trim().toLowerCase() === b.trim().toLowerCase();

  for (const linha of [...extrato].sort((a, b) => a.data.localeCompare(b.data))) {
    const candidatos = Array.from(livresRazao.values()).filter(
      (item) => centavos(item.valor) === centavos(linha.valor) && Math.abs(diasEntre(item.data, linha.data)) <= TOLERANCIA_DIAS,
    );
    candidatos.sort(
      (a, b) =>
        Number(documentoIgual(b.documento, linha.documento)) - Number(documentoIgual(a.documento, linha.documento)) ||
        Math.abs(diasEntre(a.data, linha.data)) - Math.abs(diasEntre(b.data, linha.data)),
    );
    const par = candidatos[0];
    if (par) {
      sugestoes.push({ extratoIds: [linha.id], razaoIds: [par.id] });
      livresRazao.delete(par.id);
    } else sobras.push(linha);
  }

  for (const linha of sobras) {
    const perto = Array.from(livresRazao.values())
      .filter((item) => Math.sign(item.valor) === Math.sign(linha.valor) && Math.abs(diasEntre(item.data, linha.data)) <= TOLERANCIA_DIAS)
      .slice(0, 14);
    const combinacao = combinacaoQueSoma(perto, centavos(linha.valor));
    if (combinacao) {
      sugestoes.push({ extratoIds: [linha.id], razaoIds: combinacao.map((item) => item.id) });
      combinacao.forEach((item) => livresRazao.delete(item.id));
    }
  }
  return sugestoes;
}

function combinacaoQueSoma<T extends { valor: number }>(itens: T[], alvo: number): T[] | null {
  const escolhidos: T[] = [];
  function buscar(inicio: number, resto: number): boolean {
    if (escolhidos.length >= 2 && resto === 0) return true;
    if (escolhidos.length === 4) return false;
    for (let i = inicio; i < itens.length; i++) {
      escolhidos.push(itens[i]);
      if (buscar(i + 1, resto - centavos(itens[i].valor))) return true;
      escolhidos.pop();
    }
    return false;
  }
  return buscar(0, alvo) ? [...escolhidos] : null;
}

// ── Fechamento ─────────────────────────────────────────────────────────────

export function fechamentoDo(fechamentos: FechamentoConciliacao[], contaId: string, mes: string) {
  return fechamentos.find((item) => item.contaId === contaId && item.mes === mes) ?? null;
}

/** Mês em revisão ou fechado não aceita mudança em lançamento datado nele. */
export function dataTravada(fechamentos: FechamentoConciliacao[], contaId: string, data: string) {
  return Boolean(fechamentoDo(fechamentos, contaId, data.slice(0, 7)));
}

export type ItemChecklist = { rotulo: string; ok: boolean; detalhe: string };

/** O que a área financeira confere antes de mandar o mês para revisão. */
export function checklistFechamento(
  conta: ContaBancaria,
  mes: string,
  demonstrativo: Demonstrativo,
  saldoInformado: number | null,
  fechamentos: FechamentoConciliacao[],
): ItemChecklist[] {
  const anterior = mesAnterior(mes);
  const anteriorExige = anterior > conta.dataSaldoInicial.slice(0, 7);
  const anteriorFechado = !anteriorExige || fechamentoDo(fechamentos, conta.id, anterior)?.status === "Fechada";
  const naoContabilizados = demonstrativo.creditosNaoContabilizados.length + demonstrativo.debitosNaoContabilizados.length;
  return [
    {
      rotulo: "Mês anterior fechado",
      ok: anteriorFechado,
      detalhe: anteriorFechado ? "A abertura do mês parte de um saldo conciliado." : "Feche o mês anterior primeiro.",
    },
    {
      rotulo: "Extrato completo",
      ok: saldoInformado !== null && centavos(saldoInformado) === centavos(demonstrativo.saldoExtrato),
      detalhe:
        saldoInformado === null
          ? "Informe o saldo final que o banco mostra no extrato."
          : centavos(saldoInformado) === centavos(demonstrativo.saldoExtrato)
            ? "O saldo calculado bate com o informado pelo banco."
            : "O saldo calculado não bate com o do banco: falta ou sobra lançamento no extrato.",
    },
    {
      rotulo: "Lançamentos do banco contabilizados",
      ok: naoContabilizados === 0,
      detalhe: naoContabilizados === 0 ? "Tarifas, rendimentos e afins já estão no razão." : `${naoContabilizados} lançamento(s) do banco ainda sem registro no razão.`,
    },
    {
      rotulo: "Diferença zerada",
      ok: centavos(demonstrativo.diferenca) === 0,
      detalhe: centavos(demonstrativo.diferenca) === 0 ? "Saldo bancário ajustado = saldo contábil ajustado." : "Há diferença sem explicação.",
    },
  ];
}

// ── Leitura de arquivos de extrato ─────────────────────────────────────────

export type LinhaLida = { data: string; historico: string; documento: string; valor: number; chave: string };
export type Leitura = { linhas: LinhaLida[]; erros: string[]; saldoFinal: number | null };

/** "1.234,56", "-1234.56", "(89,90)", "R$ 10,00 D" → número com sinal. */
export function lerValor(texto: string): number | null {
  let bruto = texto.trim().replace(/R\$\s?/i, "");
  if (!bruto) return null;
  let sinal = 1;
  if (/^\(.*\)$/.test(bruto)) {
    sinal = -1;
    bruto = bruto.slice(1, -1);
  }
  if (/\s?D$/i.test(bruto)) {
    sinal = -1;
    bruto = bruto.replace(/\s?D$/i, "");
  } else bruto = bruto.replace(/\s?C$/i, "");
  if (bruto.startsWith("-")) {
    sinal *= -1;
    bruto = bruto.slice(1);
  }
  const virgulaDecimal = /,\d{1,2}$/.test(bruto);
  const normal = virgulaDecimal ? bruto.replace(/\./g, "").replace(",", ".") : bruto.replace(/,/g, "");
  const valor = Number(normal);
  return Number.isFinite(valor) ? sinal * valor : null;
}

/** "31/05/2026", "2026-05-31", "20260531" → "2026-05-31". */
export function lerData(texto: string): string | null {
  const limpo = texto.trim();
  let m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(limpo);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(limpo);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{4})(\d{2})(\d{2})/.exec(limpo);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

function assinatura(linhas: Omit<LinhaLida, "chave">[]): LinhaLida[] {
  // Duas linhas idênticas no mesmo arquivo são lançamentos distintos: o índice as separa.
  const vistas = new Map<string, number>();
  return linhas.map((linha) => {
    const base = `${linha.data}|${centavos(linha.valor)}|${linha.historico.toLowerCase()}|${linha.documento}`;
    const n = (vistas.get(base) ?? 0) + 1;
    vistas.set(base, n);
    return { ...linha, chave: `${base}|${n}` };
  });
}

/**
 * CSV com cabeçalho. Colunas reconhecidas: data; histórico/descrição;
 * documento; valor — ou crédito e débito separados. Separador ";" ou ",".
 */
export function lerCsv(texto: string): Leitura {
  const linhasTexto = texto.replace(/^﻿/, "").split(/\r?\n/).filter((linha) => linha.trim());
  const erros: string[] = [];
  if (linhasTexto.length < 2) return { linhas: [], erros: ["O arquivo não tem lançamentos."], saldoFinal: null };
  const separador = linhasTexto[0].includes(";") ? ";" : ",";
  const dividir = (linha: string) => linha.split(separador).map((celula) => celula.trim().replace(/^"|"$/g, ""));
  const cabecalho = dividir(linhasTexto[0]).map((celula) => celula.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase());
  const coluna = (...nomes: string[]) => cabecalho.findIndex((celula) => nomes.some((nome) => celula.startsWith(nome)));
  const iData = coluna("data");
  const iHistorico = coluna("historico", "descricao", "lancamento");
  const iDocumento = coluna("documento", "doc", "numero");
  const iValor = coluna("valor");
  const iCredito = coluna("credito", "entrada");
  const iDebito = coluna("debito", "saida");
  if (iData < 0 || iHistorico < 0 || (iValor < 0 && iCredito < 0 && iDebito < 0))
    return { linhas: [], erros: ["Cabeçalho não reconhecido. Use: data; histórico; documento; valor."], saldoFinal: null };

  const lidas: Omit<LinhaLida, "chave">[] = [];
  let saldoFinal: number | null = null;
  linhasTexto.slice(1).forEach((texto, indice) => {
    const celulas = dividir(texto);
    const historico = celulas[iHistorico] ?? "";
    // Linhas de saldo do banco não são lançamentos, mas o último saldo confere a importação.
    if (/^saldo/i.test(historico)) {
      const valor = lerValor(celulas[iValor] ?? "");
      if (valor !== null) saldoFinal = valor;
      return;
    }
    const data = lerData(celulas[iData] ?? "");
    let valor: number | null = null;
    if (iValor >= 0) valor = lerValor(celulas[iValor] ?? "");
    else {
      const credito = lerValor(celulas[iCredito] ?? "") ?? 0;
      const debito = lerValor(celulas[iDebito] ?? "") ?? 0;
      valor = Math.abs(credito) - Math.abs(debito);
    }
    if (!data || valor === null || !historico) {
      erros.push(`Linha ${indice + 2}: data, histórico ou valor inválido.`);
      return;
    }
    lidas.push({ data, historico, documento: iDocumento >= 0 ? (celulas[iDocumento] ?? "") : "", valor });
  });
  return { linhas: assinatura(lidas), erros, saldoFinal };
}

/** OFX (SGML ou XML): STMTTRN com DTPOSTED, TRNAMT, FITID, MEMO/NAME, CHECKNUM; LEDGERBAL como saldo. */
export function lerOfx(texto: string): Leitura {
  const campo = (bloco: string, nome: string) => new RegExp(`<${nome}>([^<\\r\\n]*)`, "i").exec(bloco)?.[1]?.trim() ?? "";
  const blocos = texto.split(/<STMTTRN>/i).slice(1);
  const erros: string[] = [];
  const linhas: LinhaLida[] = [];
  blocos.forEach((bloco, indice) => {
    const data = lerData(campo(bloco, "DTPOSTED"));
    const valor = Number(campo(bloco, "TRNAMT").replace(",", "."));
    const historico = campo(bloco, "MEMO") || campo(bloco, "NAME");
    const fitid = campo(bloco, "FITID");
    if (!data || !Number.isFinite(valor) || !historico) {
      erros.push(`Transação ${indice + 1}: data, valor ou histórico ausente.`);
      return;
    }
    const documento = campo(bloco, "CHECKNUM") || campo(bloco, "REFNUM");
    linhas.push({ data, historico, documento, valor, chave: fitid ? `ofx:${fitid}` : `${data}|${centavos(valor)}|${historico.toLowerCase()}|${documento}|${indice}` });
  });
  const saldo = /<LEDGERBAL>[\s\S]*?<BALAMT>([^<\r\n]*)/i.exec(texto)?.[1];
  const saldoFinal = saldo !== undefined && Number.isFinite(Number(saldo.trim().replace(",", "."))) ? Number(saldo.trim().replace(",", ".")) : null;
  if (blocos.length === 0) erros.push("Nenhuma transação encontrada no OFX.");
  return { linhas, erros, saldoFinal };
}

export function lerExtrato(nomeArquivo: string, texto: string): Leitura & { formato: "CSV" | "OFX" } {
  const ofx = /\.ofx$/i.test(nomeArquivo) || /<OFX>/i.test(texto);
  return ofx ? { ...lerOfx(texto), formato: "OFX" } : { ...lerCsv(texto), formato: "CSV" };
}

/** Separa as linhas lidas entre novas e já importadas antes (mesma chave na mesma conta). */
export function separarDuplicadas(linhas: LinhaLida[], existentes: LancamentoExtrato[], contaId: string) {
  const chaves = new Set(existentes.filter((item) => item.contaId === contaId).map((item) => item.chave));
  return { novas: linhas.filter((linha) => !chaves.has(linha.chave)), duplicadas: linhas.filter((linha) => chaves.has(linha.chave)) };
}
