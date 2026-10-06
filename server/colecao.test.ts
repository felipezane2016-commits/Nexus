import { afterEach, describe, expect, it } from "vitest";
import { criarColecao, VERSAO_DA_SEMENTE } from "../client/src/_core/armazenamento/colecao";
import { criarMotorDeMemoria, PREFIXO, usarMotor, type Motor } from "../client/src/_core/armazenamento/deposito";

/** Motor que conta gravações e guarda texto, como o localStorage. */
function motorContado(): Motor & { gravacoes: number; bruto: Map<string, string> } {
  const bruto = new Map<string, string>();
  const motor = {
    bruto,
    gravacoes: 0,
    ler: (chave: string) => bruto.get(chave) ?? null,
    gravar: (chave: string, valor: string) => {
      motor.gravacoes += 1;
      bruto.set(chave, valor);
    },
    remover: (chave: string) => void bruto.delete(chave),
    chaves: () => Array.from(bruto.keys()),
  };
  return motor;
}

const esperar = () => new Promise<void>((resolver) => queueMicrotask(resolver));
let contador = 0;
const nome = () => `teste-${++contador}`;

afterEach(() => usarMotor(criarMotorDeMemoria()));

describe("Coleção", () => {
  it("começa da semente e devolve sempre a mesma referência até mudar", () => {
    usarMotor(motorContado());
    const colecao = criarColecao(nome(), () => [1, 2]);
    expect(colecao.ler()).toEqual([1, 2]);
    expect(colecao.ler()).toBe(colecao.ler());
  });

  it("agrupa várias mudanças do mesmo tique numa gravação só", async () => {
    const motor = motorContado();
    usarMotor(motor);
    const colecao = criarColecao(nome(), () => [0]);
    colecao.ler();
    const antes = motor.gravacoes;
    colecao.atualizar((lista) => [...lista, 1]);
    colecao.atualizar((lista) => [...lista, 2]);
    colecao.atualizar((lista) => [...lista, 3]);
    await esperar();
    expect(motor.gravacoes - antes).toBe(1);
  });

  it("hidrata do que foi gravado, na mesma versão da semente", async () => {
    const motor = motorContado();
    usarMotor(motor);
    const chave = nome();
    const primeira = criarColecao(chave, () => ["semente"]);
    primeira.atualizar(() => ["gravado"]);
    await esperar();
    const segunda = criarColecao(chave, () => ["semente"]);
    expect(segunda.ler()).toEqual(["gravado"]);
  });

  it("descarta dado de outra versão e volta à semente", () => {
    const motor = motorContado();
    usarMotor(motor);
    const chave = nome();
    motor.bruto.set(PREFIXO + chave, JSON.stringify({ versao: VERSAO_DA_SEMENTE - 1, dados: ["velho"] }));
    expect(criarColecao(chave, () => ["novo"]).ler()).toEqual(["novo"]);
  });

  it("avisa quem assina e para de avisar depois de cancelar", () => {
    usarMotor(motorContado());
    const colecao = criarColecao(nome(), () => 0);
    let avisos = 0;
    const cancelar = colecao.assinar(() => (avisos += 1));
    colecao.atualizar((valor) => valor + 1);
    cancelar();
    colecao.atualizar((valor) => valor + 1);
    expect(avisos).toBe(1);
  });

  it("não avisa nem grava quando a transformação devolve o mesmo objeto", async () => {
    const motor = motorContado();
    usarMotor(motor);
    const colecao = criarColecao(nome(), () => ({ a: 1 }));
    colecao.ler();
    const antes = motor.gravacoes;
    let avisos = 0;
    colecao.assinar(() => (avisos += 1));
    colecao.atualizar((atual) => atual);
    await esperar();
    expect(avisos).toBe(0);
    expect(motor.gravacoes).toBe(antes);
  });
});
