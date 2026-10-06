import { useSyncExternalStore } from "react";
import { gravar, ler } from "./deposito";

/**
 * Coleção: um dado do app com dono único. Hidrata uma vez a partir do
 * depósito, guarda a referência viva em memória e grava pelo depósito.
 *
 * Por que não ler do depósito a cada render: ele reserializa o JSON, então o
 * que volta é uma cópia — alterar a cópia não grava nada. Quem lê usa sempre
 * `ler()` (ou o hook), que devolve a mesma referência até a próxima mudança.
 *
 * É um store externo (useSyncExternalStore), então o portal e o admin
 * enxergam a mesma lista: o recibo aprovado no admin aparece aprovado no
 * portal sem recarregar.
 */

/** Trocar este número renova a demonstração de todas as coleções. */
export const VERSAO_DA_SEMENTE = 3;

type Envelope<T> = { versao: number; dados: T };

export interface Colecao<T> {
  readonly nome: string;
  ler(): T;
  atualizar(transformar: (atual: T) => T): void;
  assinar(ouvinte: () => void): () => void;
  /** Volta à semente de demonstração. */
  restaurar(): void;
}

const registradas: Colecao<unknown>[] = [];

export function criarColecao<T>(nome: string, semente: () => T): Colecao<T> {
  let atual: T | undefined;
  const ouvintes = new Set<() => void>();
  let gravacaoAgendada = false;

  function hidratar(): T {
    const salvo = ler<Envelope<T>>(nome);
    // Envelope de outra versão é dado de formato antigo: recomeça da semente.
    if (salvo && salvo.versao === VERSAO_DA_SEMENTE) return salvo.dados;
    const novo = semente();
    gravar<Envelope<T>>(nome, { versao: VERSAO_DA_SEMENTE, dados: novo });
    return novo;
  }

  function agendarGravacao() {
    // Várias mudanças no mesmo tique viram uma gravação só.
    if (gravacaoAgendada) return;
    gravacaoAgendada = true;
    queueMicrotask(() => {
      gravacaoAgendada = false;
      gravar<Envelope<T>>(nome, { versao: VERSAO_DA_SEMENTE, dados: atual as T });
    });
  }

  const colecao: Colecao<T> = {
    nome,
    ler() {
      if (atual === undefined) atual = hidratar();
      return atual;
    },
    atualizar(transformar) {
      const proximo = transformar(colecao.ler());
      if (Object.is(proximo, atual)) return;
      atual = proximo;
      agendarGravacao();
      ouvintes.forEach((ouvinte) => ouvinte());
    },
    assinar(ouvinte) {
      ouvintes.add(ouvinte);
      return () => ouvintes.delete(ouvinte);
    },
    restaurar() {
      atual = semente();
      agendarGravacao();
      ouvintes.forEach((ouvinte) => ouvinte());
    },
  };
  registradas.push(colecao as Colecao<unknown>);
  return colecao;
}

export function useColecao<T>(colecao: Colecao<T>): T {
  return useSyncExternalStore(colecao.assinar, colecao.ler, colecao.ler);
}

/** Volta todas as coleções à demonstração (usado pelo botão "Restaurar demonstração"). */
export function restaurarDemonstracao() {
  registradas.forEach((colecao) => colecao.restaurar());
}


/** Substitui o registro de mesmo id ou o acrescenta no fim. */
export function gravarItem<T extends { id: string }>(lista: T[], item: T): T[] {
  return lista.some((atual) => atual.id === item.id) ? lista.map((atual) => (atual.id === item.id ? item : atual)) : [...lista, item];
}
