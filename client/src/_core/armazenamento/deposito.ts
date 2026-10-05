/**
 * O único lugar que sabe onde os dados moram.
 *
 * Hoje o motor é o localStorage; a interface `Motor` existe para que ligar um
 * backend seja trocar uma implementação, não reescrever os módulos. É síncrono
 * de propósito: o estado do portal grava de forma síncrona.
 *
 * Regra: o depósito reserializa o JSON a cada leitura, então o objeto que volta
 * é sempre uma cópia. Alterar essa cópia não grava nada — leia uma vez, guarde
 * no estado e grave pelo depósito.
 */

export interface Motor {
  ler(chave: string): string | null;
  gravar(chave: string, valor: string): void;
  remover(chave: string): void;
  chaves(): string[];
}

/** Prefixo de versão: trocar o `v1` isola dados de um formato antigo. */
export const PREFIXO = "nexus:v1:";

/** Para quando o navegador recusa armazenamento (aba anônima, política, teste). */
export function criarMotorDeMemoria(): Motor {
  const dados = new Map<string, string>();
  return {
    ler: chave => dados.get(chave) ?? null,
    gravar: (chave, valor) => void dados.set(chave, valor),
    remover: chave => void dados.delete(chave),
    chaves: () => Array.from(dados.keys()),
  };
}

function criarMotorDoNavegador(): Motor | null {
  try {
    const armazenamento = window.localStorage;
    // Safari em aba anônima expõe o objeto mas lança na escrita: testa antes.
    const sonda = `${PREFIXO}__sonda`;
    armazenamento.setItem(sonda, "1");
    armazenamento.removeItem(sonda);
    return {
      ler: chave => armazenamento.getItem(chave),
      gravar: (chave, valor) => armazenamento.setItem(chave, valor),
      remover: chave => armazenamento.removeItem(chave),
      chaves: () => Object.keys(armazenamento),
    };
  } catch {
    return null;
  }
}

let motor: Motor =
  (typeof window !== "undefined" && criarMotorDoNavegador()) ||
  criarMotorDeMemoria();

/** Troca o motor — usado pelos testes e, no futuro, pelo backend. */
export function usarMotor(novo: Motor) {
  motor = novo;
}

export function ler<T>(nome: string): T | null {
  const bruto = motor.ler(PREFIXO + nome);
  if (bruto === null) return null;
  try {
    return JSON.parse(bruto) as T;
  } catch {
    // Dado corrompido não pode derrubar o app: trata como ausente.
    return null;
  }
}

export function gravar<T>(nome: string, valor: T) {
  try {
    motor.gravar(PREFIXO + nome, JSON.stringify(valor));
  } catch {
    // Cota estourada ou armazenamento revogado no meio da sessão: o estado em
    // memória continua valendo, só não sobrevive ao recarregar.
  }
}

export function remover(nome: string) {
  motor.remover(PREFIXO + nome);
}
