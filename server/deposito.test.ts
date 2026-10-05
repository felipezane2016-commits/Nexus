import { afterEach, describe, expect, it } from "vitest";
import {
  criarMotorDeMemoria,
  gravar,
  ler,
  PREFIXO,
  remover,
  usarMotor,
  type Motor,
} from "../client/src/_core/armazenamento/deposito";

/**
 * Motor falso que guarda texto, como o localStorage. Um motor que devolvesse a
 * mesma referência esconderia justamente o defeito de alterar a cópia lida.
 */
function motorDeTexto(): Motor & { bruto: Map<string, string> } {
  const bruto = new Map<string, string>();
  return {
    bruto,
    ler: chave => bruto.get(chave) ?? null,
    gravar: (chave, valor) => void bruto.set(chave, String(valor)),
    remover: chave => void bruto.delete(chave),
    chaves: () => Array.from(bruto.keys()),
  };
}

afterEach(() => usarMotor(criarMotorDeMemoria()));

describe("Depósito", () => {
  it("grava com o prefixo de versão e lê de volta", () => {
    const motor = motorDeTexto();
    usarMotor(motor);
    gravar("portal", { signedIn: true, itens: [1, 2] });
    expect(motor.chaves()).toEqual([`${PREFIXO}portal`]);
    expect(ler("portal")).toEqual({ signedIn: true, itens: [1, 2] });
  });

  it("devolve uma cópia: alterar o objeto lido não altera o gravado", () => {
    usarMotor(motorDeTexto());
    gravar("portal", { itens: [1] });
    const lido = ler<{ itens: number[] }>("portal")!;
    lido.itens.push(2);
    expect(ler("portal")).toEqual({ itens: [1] });
  });

  it("trata dado corrompido como ausente em vez de quebrar", () => {
    const motor = motorDeTexto();
    usarMotor(motor);
    motor.bruto.set(`${PREFIXO}portal`, "{nao é json");
    expect(ler("portal")).toBeNull();
  });

  it("não derruba o app quando o armazenamento recusa a escrita", () => {
    usarMotor({
      ...criarMotorDeMemoria(),
      gravar: () => {
        throw new Error("QuotaExceededError");
      },
    });
    expect(() => gravar("portal", { a: 1 })).not.toThrow();
  });

  it("remove pela mesma chave prefixada", () => {
    usarMotor(motorDeTexto());
    gravar("portal", { a: 1 });
    remover("portal");
    expect(ler("portal")).toBeNull();
  });
});
