import { gravarItem } from "@/_core/armazenamento/colecao";
import { gerarId, somarDias } from "@/_core/tempo";
import { closingTotal } from "@/lib/portal";
import { ordens } from "@/modulos/contas/colecoes";
import { notificar } from "@/modulos/notificacoes/colecao";
import { fechamentos, prestadores, recibos } from "@/modulos/prestadores/colecoes";
import { casamentos, contasBancarias, extrato, fechamentosConciliacao, importacoes, razao, saldosInformados } from "./colecoes";
import { CONTA_BIB_PNST, CONTA_ITAU_PNST } from "./dadosMock";
import { dataTravada, fechamentoDo, montarDemonstrativo, separarDuplicadas, sugerirCasamentos, validarCasamento, type LinhaLida } from "./regras";
import type { Casamento, ContaBancaria, Contrapartida, LancamentoExtrato, LancamentoRazao, ModoCasamento } from "./tipos";

/** Ações da conciliação. Cada uma recusa mexer em mês em revisão ou fechado. */

const agora = () => new Date().toISOString();
const travado = (contaId: string, data: string) => dataTravada(fechamentosConciliacao.ler(), contaId, data);

export function conciliar(extratoIds: string[], razaoIds: string[], autor: string, modo: ModoCasamento = "Manual"): string | null {
  const linhasExtrato = extrato.ler().filter((item) => extratoIds.includes(item.id));
  const linhasRazao = razao.ler().filter((item) => razaoIds.includes(item.id));
  const erro = validarCasamento(linhasExtrato, linhasRazao, casamentos.ler());
  if (erro) return erro;
  if ([...linhasExtrato, ...linhasRazao].some((item) => travado(item.contaId, item.data))) return "O mês desses lançamentos está em revisão ou fechado.";
  casamentos.atualizar((lista) => [
    ...lista,
    { id: gerarId("cas"), contaId: linhasExtrato[0].contaId, extratoIds, razaoIds, modo, autor, quando: agora() },
  ]);
  return null;
}

/** Casa sozinho o que é seguro entre os pendentes até o fim do mês. Devolve quantos casou. */
export function conciliarAutomaticamente(conta: ContaBancaria, ate: string, autor: string) {
  const usados = new Set(casamentos.ler().flatMap((casamento) => [...casamento.extratoIds, ...casamento.razaoIds]));
  const livre = <T extends { id: string; contaId: string; data: string }>(item: T) =>
    item.contaId === conta.id && item.data > conta.dataSaldoInicial && item.data <= somarDias(ate, 3) && !usados.has(item.id) && !travado(item.contaId, item.data);
  const sugestoes = sugerirCasamentos(extrato.ler().filter(livre), razao.ler().filter(livre));
  if (sugestoes.length === 0) return 0;
  casamentos.atualizar((lista) => [
    ...lista,
    ...sugestoes.map((sugestao): Casamento => ({ id: gerarId("cas"), contaId: conta.id, ...sugestao, modo: "Automático", autor, quando: agora() })),
  ]);
  return sugestoes.length;
}

export function desfazerCasamento(id: string): string | null {
  const casamento = casamentos.ler().find((item) => item.id === id);
  if (!casamento) return null;
  const datas = [
    ...extrato.ler().filter((item) => casamento.extratoIds.includes(item.id)),
    ...razao.ler().filter((item) => casamento.razaoIds.includes(item.id)),
  ];
  if (datas.some((item) => travado(item.contaId, item.data))) return "O mês está em revisão ou fechado.";
  casamentos.atualizar((lista) => lista.filter((item) => item.id !== id));
  // O lançamento de ajuste só existe por causa do casamento: sai junto.
  if (casamento.modo === "Ajuste") razao.atualizar((lista) => lista.filter((item) => !casamento.razaoIds.includes(item.id)));
  return null;
}

/**
 * Contabiliza no razão o que só o banco tem (tarifa, IOF, rendimento): cria o
 * lançamento espelho com a contrapartida escolhida e já o concilia.
 */
export function lancarAjustes(extratoIds: string[], contrapartida: Contrapartida, autor: string): string | null {
  const linhas = extrato.ler().filter((item) => extratoIds.includes(item.id));
  if (linhas.length === 0) return "Selecione lançamentos do extrato.";
  if (linhas.some((item) => travado(item.contaId, item.data))) return "O mês está em revisão ou fechado.";
  const usados = new Set(casamentos.ler().flatMap((casamento) => casamento.extratoIds));
  if (linhas.some((item) => usados.has(item.id))) return "Algum lançamento já está conciliado.";
  const novos = linhas.map(
    (linha): LancamentoRazao => ({
      id: gerarId("raz"),
      contaId: linha.contaId,
      data: linha.data,
      descricao: `${contrapartida} — ${linha.historico}`,
      documento: linha.documento,
      valor: linha.valor,
      origem: "Ajuste de conciliação",
      origemId: linha.id,
      contrapartida,
    }),
  );
  razao.atualizar((lista) => [...lista, ...novos]);
  casamentos.atualizar((lista) => [
    ...lista,
    ...linhas.map((linha, i): Casamento => ({ id: gerarId("cas"), contaId: linha.contaId, extratoIds: [linha.id], razaoIds: [novos[i].id], modo: "Ajuste", autor, quando: agora() })),
  ]);
  return null;
}

export function salvarLancamentoExtrato(item: LancamentoExtrato): string | null {
  if (travado(item.contaId, item.data)) return "O mês está em revisão ou fechado.";
  extrato.atualizar((lista) => gravarItem(lista, item));
  return null;
}

export function salvarLancamentoRazao(item: LancamentoRazao): string | null {
  if (travado(item.contaId, item.data)) return "O mês está em revisão ou fechado.";
  razao.atualizar((lista) => gravarItem(lista, item));
  return null;
}

/** Só sai o que não está conciliado e não é de mês travado. */
export function excluirLancamento(lado: "extrato" | "razao", id: string): string | null {
  const conciliado = casamentos.ler().some((casamento) => (lado === "extrato" ? casamento.extratoIds : casamento.razaoIds).includes(id));
  if (conciliado) return "Desfaça a conciliação antes de excluir.";
  const item = (lado === "extrato" ? extrato.ler() : razao.ler()).find((linha) => linha.id === id);
  if (item && travado(item.contaId, item.data)) return "O mês está em revisão ou fechado.";
  if (lado === "extrato") extrato.atualizar((lista) => lista.filter((linha) => linha.id !== id));
  else razao.atualizar((lista) => lista.filter((linha) => linha.id !== id));
  return null;
}

export function importarExtrato(
  conta: ContaBancaria,
  arquivo: string,
  formato: "CSV" | "OFX",
  linhas: LinhaLida[],
  saldoFinal: number | null,
  autor: string,
) {
  const livres = linhas.filter((linha) => !travado(conta.id, linha.data));
  const { novas, duplicadas } = separarDuplicadas(livres, extrato.ler(), conta.id);
  const id = gerarId("imp");
  extrato.atualizar((lista) => [
    ...lista,
    ...novas.map((linha): LancamentoExtrato => ({ id: gerarId("ext"), contaId: conta.id, ...linha, origem: "Importação", importacaoId: id })),
  ]);
  importacoes.atualizar((lista) => [
    { id, contaId: conta.id, arquivo, formato, quando: agora(), autor, novas: novas.length, duplicadas: duplicadas.length + (linhas.length - livres.length) },
    ...lista,
  ]);
  // O saldo do arquivo vale para o mês da última linha: é o saldo final daquele extrato.
  const ultima = [...linhas].sort((a, b) => a.data.localeCompare(b.data)).at(-1);
  if (saldoFinal !== null && ultima) informarSaldo(conta.id, ultima.data.slice(0, 7), saldoFinal);
  return { novas: novas.length, duplicadas: duplicadas.length, travadas: linhas.length - livres.length };
}

export function informarSaldo(contaId: string, mes: string, saldo: number | null) {
  saldosInformados.atualizar((lista) => {
    const resto = lista.filter((item) => !(item.contaId === contaId && item.mes === mes));
    return saldo === null ? resto : [...resto, { id: `sal-${contaId}-${mes}`, contaId, mes, saldo }];
  });
}

/**
 * Traz para o razão o que o próprio sistema já sabe: lotes de prestadores
 * pagos (saída no Itaú PNST) e ordens de câmbio fechadas (entrada no Banco
 * Industrial). Não duplica: cada registro de origem entra uma vez.
 */
export function trazerDoSistema() {
  const jaTrazidos = new Set(razao.ler().map((item) => item.origemId).filter(Boolean));
  const novos: LancamentoRazao[] = [];
  const nomes = new Map(prestadores.ler().map((item) => [item.id, item.nome]));
  for (const fechamento of fechamentos.ler()) {
    const chave = `${fechamento.prestadorId}|${fechamento.competencia}`;
    if (fechamento.review !== "Pago" || jaTrazidos.has(chave)) continue;
    const total = closingTotal(recibos.ler().filter((recibo) => recibo.prestadorId === fechamento.prestadorId && recibo.competencia === fechamento.competencia));
    const data = fechamento.paidAt ?? somarDias((fechamento.submittedAt ?? `${fechamento.competencia}-28`).slice(0, 10), 3);
    if (!total || travado(CONTA_ITAU_PNST, data)) continue;
    const [ano, mes] = fechamento.competencia.split("-");
    novos.push({
      id: gerarId("raz"),
      contaId: CONTA_ITAU_PNST,
      data,
      descricao: `Pagamento — ${nomes.get(fechamento.prestadorId) ?? fechamento.prestadorId} (${mes}/${ano})`,
      documento: "",
      valor: -Math.round(total * 100) / 100,
      origem: "Prestadores",
      origemId: chave,
      contrapartida: "Fornecedores — prestadores",
    });
  }
  for (const ordem of ordens.ler()) {
    if (!ordem.fechamento || jaTrazidos.has(ordem.id) || travado(CONTA_BIB_PNST, ordem.fechamento.data)) continue;
    novos.push({
      id: gerarId("raz"),
      contaId: CONTA_BIB_PNST,
      data: ordem.fechamento.data,
      descricao: `Câmbio ${ordem.moeda} — ${ordem.cliente}`,
      documento: ordem.faturas[0] ? `FAT ${ordem.faturas[0]}` : "",
      valor: Math.round(ordem.valor * ordem.fechamento.cotacao * 100) / 100,
      origem: "Câmbio",
      origemId: ordem.id,
      contrapartida: "Honorários a receber",
    });
  }
  if (novos.length) razao.atualizar((lista) => [...lista, ...novos]);
  return novos.length;
}

export function salvarContaBancaria(conta: ContaBancaria) {
  contasBancarias.atualizar((lista) => gravarItem(lista, conta));
}

// ── Fechamento: quem prepara não aprova ────────────────────────────────────

function rotuloConta(conta: ContaBancaria) {
  return `${conta.banco} · ${conta.empresa}`;
}

export function enviarParaRevisao(conta: ContaBancaria, mes: string, autor: string, observacao: string) {
  const demonstrativo = montarDemonstrativo(conta, extrato.ler(), razao.ler(), casamentos.ler(), mes);
  fechamentosConciliacao.atualizar((lista) =>
    gravarItem(lista, {
      id: `fch-${conta.id}-${mes}`,
      contaId: conta.id,
      mes,
      status: "Em revisão",
      saldoExtrato: demonstrativo.saldoExtrato,
      saldoRazao: demonstrativo.saldoRazao,
      pendencias: demonstrativo.pendencias,
      preparadoPor: autor,
      preparadoEm: agora(),
      revisadoPor: null,
      revisadoEm: null,
      observacao: observacao.trim(),
    }),
  );
  notificar({
    tipo: "tarefa",
    titulo: "Conciliação para revisar",
    corpo: `${rotuloConta(conta)} — ${mes.slice(5)}/${mes.slice(0, 4)} enviada por ${autor}.`,
    destino: "/contas/conciliacao/demonstrativo",
  });
}

export function aprovarFechamento(conta: ContaBancaria, mes: string, revisor: string): string | null {
  const atual = fechamentoDo(fechamentosConciliacao.ler(), conta.id, mes);
  if (!atual || atual.status !== "Em revisão") return "Este mês não está em revisão.";
  if (atual.preparadoPor === revisor) return "Quem preparou a conciliação não pode aprová-la.";
  fechamentosConciliacao.atualizar((lista) => gravarItem(lista, { ...atual, status: "Fechada", revisadoPor: revisor, revisadoEm: agora() }));
  notificar({
    tipo: "sucesso",
    titulo: "Conciliação fechada",
    corpo: `${rotuloConta(conta)} — ${mes.slice(5)}/${mes.slice(0, 4)} aprovada por ${revisor}.`,
    destino: "/contas/conciliacao",
  });
  return null;
}

/** Devolver (revisão) ou reabrir (fechada) apagam o registro: o mês volta a ficar em aberto. */
export function reabrirMes(conta: ContaBancaria, mes: string, autor: string, motivo: string) {
  const atual = fechamentoDo(fechamentosConciliacao.ler(), conta.id, mes);
  if (!atual) return;
  fechamentosConciliacao.atualizar((lista) => lista.filter((item) => item.id !== atual.id));
  notificar({
    tipo: "atencao",
    titulo: atual.status === "Fechada" ? "Conciliação reaberta" : "Conciliação devolvida",
    corpo: `${rotuloConta(conta)} — ${mes.slice(5)}/${mes.slice(0, 4)} por ${autor}${motivo.trim() ? `: ${motivo.trim()}` : "."}`,
    destino: "/contas/conciliacao/conciliar",
  });
}
