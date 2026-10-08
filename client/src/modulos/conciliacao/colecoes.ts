import { criarColecao, useColecao } from "@/_core/armazenamento/colecao";
import { HOJE } from "@/_core/tempo";
import { useSyncExternalStore } from "react";
import {
  CASAMENTOS_DEMO,
  CONTAS_BANCARIAS_DEMO,
  EXTRATO_DEMO,
  FECHAMENTOS_CONCILIACAO_DEMO,
  RAZAO_DEMO,
  SALDOS_INFORMADOS_DEMO,
} from "./dadosMock";
import type { Casamento, ContaBancaria, FechamentoConciliacao, Importacao, LancamentoExtrato, LancamentoRazao, SaldoInformado } from "./tipos";

// Contas bancárias são cadastro, não movimento: atravessam o "começar do zero".
export const contasBancarias = criarColecao<ContaBancaria[]>("conciliacao-contas", () => CONTAS_BANCARIAS_DEMO, { remota: { tipo: "lista", tabela: "conciliacao_contas" } });
export const extrato = criarColecao<LancamentoExtrato[]>("conciliacao-extrato", () => EXTRATO_DEMO, { remota: { tipo: "lista", tabela: "conciliacao_extrato" }, vazio: () => [] });
export const razao = criarColecao<LancamentoRazao[]>("conciliacao-razao", () => RAZAO_DEMO, { remota: { tipo: "lista", tabela: "conciliacao_razao" }, vazio: () => [] });
export const casamentos = criarColecao<Casamento[]>("conciliacao-casamentos", () => CASAMENTOS_DEMO, { remota: { tipo: "lista", tabela: "conciliacao_casamentos" }, vazio: () => [] });
export const importacoes = criarColecao<Importacao[]>("conciliacao-importacoes", () => [], { remota: { tipo: "lista", tabela: "conciliacao_importacoes" }, vazio: () => [] });
export const saldosInformados = criarColecao<SaldoInformado[]>("conciliacao-saldos", () => SALDOS_INFORMADOS_DEMO, { remota: { tipo: "lista", tabela: "conciliacao_saldos" }, vazio: () => [] });
export const fechamentosConciliacao = criarColecao<FechamentoConciliacao[]>("conciliacao-fechamentos", () => FECHAMENTOS_CONCILIACAO_DEMO, {
  remota: { tipo: "lista", tabela: "conciliacao_fechamentos" }, 
  vazio: () => [],
});

export function useDadosConciliacao() {
  return {
    contas: useColecao(contasBancarias),
    extrato: useColecao(extrato),
    razao: useColecao(razao),
    casamentos: useColecao(casamentos),
    importacoes: useColecao(importacoes),
    saldos: useColecao(saldosInformados),
    fechamentos: useColecao(fechamentosConciliacao),
  };
}

// ── Conta e mês em trabalho: compartilhados pelas páginas da conciliação ──
// Ficam só na memória da aba; ao recarregar, voltam para a 1ª conta e o mês corrente.

type Selecao = { contaId: string; mes: string };
let selecao: Selecao = { contaId: "", mes: HOJE.slice(0, 7) };
const ouvintes = new Set<() => void>();

export function escolher(parcial: Partial<Selecao>) {
  selecao = { ...selecao, ...parcial };
  ouvintes.forEach((ouvinte) => ouvinte());
}

export function useSelecao() {
  const atual = useSyncExternalStore(
    (ouvinte) => {
      ouvintes.add(ouvinte);
      return () => ouvintes.delete(ouvinte);
    },
    () => selecao,
  );
  const contas = useColecao(contasBancarias);
  const conta = contas.find((item) => item.id === atual.contaId) ?? contas.find((item) => item.ativa) ?? contas[0] ?? null;
  return { conta, mes: atual.mes };
}
