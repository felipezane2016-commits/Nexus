import { describe, expect, it } from "vitest";
import {
  CASAMENTOS_DEMO,
  CONTAS_BANCARIAS_DEMO,
  EXTRATO_DEMO,
  FECHAMENTOS_CONCILIACAO_DEMO,
  RAZAO_DEMO,
  SALDOS_INFORMADOS_DEMO,
} from "../client/src/modulos/conciliacao/dadosMock";
import {
  checklistFechamento,
  fimDoMes,
  lerCsv,
  lerOfx,
  lerValor,
  mesAnterior,
  montarDemonstrativo,
  separarDuplicadas,
  sugerirCasamentos,
  validarCasamento,
} from "../client/src/modulos/conciliacao/regras";
import type { Casamento, ContaBancaria, LancamentoExtrato, LancamentoRazao } from "../client/src/modulos/conciliacao/tipos";

const conta: ContaBancaria = {
  id: "c1", banco: "Itaú", empresa: "PNST", agencia: "1", numero: "1", contaContabil: "1.1", saldoInicial: 1000, dataSaldoInicial: "2026-05-31", ativa: true,
};

function ext(id: string, data: string, valor: number, documento = ""): LancamentoExtrato {
  return { id, contaId: "c1", data, historico: id, documento, valor, origem: "Manual", importacaoId: null, chave: id };
}
function raz(id: string, data: string, valor: number, documento = ""): LancamentoRazao {
  return { id, contaId: "c1", data, descricao: id, documento, valor, origem: "Manual", origemId: null, contrapartida: "Outras despesas" };
}
function cas(extratoIds: string[], razaoIds: string[]): Casamento {
  return { id: `${extratoIds}-${razaoIds}`, contaId: "c1", extratoIds, razaoIds, modo: "Manual", autor: "x", quando: "" };
}

describe("datas", () => {
  it("fim do mês e mês anterior", () => {
    expect(fimDoMes("2026-02")).toBe("2026-02-28");
    expect(fimDoMes("2026-06")).toBe("2026-06-30");
    expect(mesAnterior("2026-01")).toBe("2025-12");
  });
});

describe("demonstrativo", () => {
  const extrato = [ext("e1", "2026-06-05", -500), ext("e2", "2026-06-25", -12.5), ext("e3", "2026-06-26", 3.4)];
  const razao = [raz("r1", "2026-06-04", -500), raz("r2", "2026-06-29", -200), raz("r3", "2026-06-30", 800)];

  it("classifica as pendências pelos quatro tipos clássicos e fecha os saldos ajustados", () => {
    const d = montarDemonstrativo(conta, extrato, razao, [cas(["e1"], ["r1"])], "2026-06");
    expect(d.saldoExtrato).toBeCloseTo(490.9);
    expect(d.saldoRazao).toBeCloseTo(1100);
    expect(d.depositosEmTransito.map((i) => i.id)).toEqual(["r3"]);
    expect(d.pagamentosNaoCompensados.map((i) => i.id)).toEqual(["r2"]);
    expect(d.creditosNaoContabilizados.map((i) => i.id)).toEqual(["e3"]);
    expect(d.debitosNaoContabilizados.map((i) => i.id)).toEqual(["e2"]);
    expect(d.saldoBancoAjustado).toBeCloseTo(1090.9);
    expect(d.saldoRazaoAjustado).toBeCloseTo(1090.9);
    expect(d.diferenca).toBe(0);
    expect(d.pendencias).toBe(4);
  });

  it("par que só compensa depois do corte continua pendente no mês", () => {
    const extratoJulho = [ext("e9", "2026-07-02", -200)];
    const d = montarDemonstrativo(conta, extratoJulho, [raz("r2", "2026-06-29", -200)], [cas(["e9"], ["r2"])], "2026-06");
    expect(d.pagamentosNaoCompensados.map((i) => i.id)).toEqual(["r2"]);
    const julho = montarDemonstrativo(conta, extratoJulho, [raz("r2", "2026-06-29", -200)], [cas(["e9"], ["r2"])], "2026-07");
    expect(julho.pendencias).toBe(0);
  });

  it("ignora lançamentos de antes do saldo de abertura", () => {
    const d = montarDemonstrativo(conta, [ext("e0", "2026-05-20", 99)], [], [], "2026-06");
    expect(d.saldoExtrato).toBe(1000);
    expect(d.pendencias).toBe(0);
  });
});

describe("casamento", () => {
  it("valida somas, lados e itens já usados", () => {
    expect(validarCasamento([ext("e1", "2026-06-01", -10)], [], [])).toMatch(/dois lados/);
    expect(validarCasamento([ext("e1", "2026-06-01", -10)], [raz("r1", "2026-06-01", -9.99)], [])).toMatch(/somas/);
    expect(validarCasamento([ext("e1", "2026-06-01", -10)], [raz("r1", "2026-06-01", -10)], [cas(["e1"], ["rx"])])).toMatch(/já está/);
    expect(validarCasamento([ext("e1", "2026-06-01", -0.3)], [raz("r1", "2026-06-01", -0.1), raz("r2", "2026-06-01", -0.2)], [])).toBeNull();
  });

  it("sugere 1:1 por valor e prazo, preferindo o mesmo documento", () => {
    const sugestoes = sugerirCasamentos(
      [ext("e1", "2026-06-10", -100, "CHQ 2")],
      [raz("r1", "2026-06-10", -100, "CHQ 1"), raz("r2", "2026-06-09", -100, "CHQ 2")],
    );
    expect(sugestoes).toEqual([{ extratoIds: ["e1"], razaoIds: ["r2"] }]);
  });

  it("não casa fora da tolerância de dias", () => {
    expect(sugerirCasamentos([ext("e1", "2026-06-10", -100)], [raz("r1", "2026-06-02", -100)])).toEqual([]);
  });

  it("acha o lote: um débito do banco que soma vários lançamentos do razão", () => {
    const sugestoes = sugerirCasamentos(
      [ext("e1", "2026-06-05", -895)],
      [raz("r1", "2026-06-04", -195), raz("r2", "2026-06-05", -700), raz("r3", "2026-06-05", -50)],
    );
    expect(sugestoes).toEqual([{ extratoIds: ["e1"], razaoIds: ["r1", "r2"] }]);
  });
});

describe("checklist de fechamento", () => {
  it("exige mês anterior fechado, extrato completo, ajustes feitos e diferença zero", () => {
    const d = montarDemonstrativo(conta, [ext("e1", "2026-07-03", -5)], [], [], "2026-07");
    const itens = checklistFechamento(conta, "2026-07", d, null, []);
    expect(itens.map((item) => item.ok)).toEqual([false, false, false, true]);
    const ok = checklistFechamento(conta, "2026-07", montarDemonstrativo(conta, [], [], [], "2026-07"), 1000, [
      { id: "f", contaId: "c1", mes: "2026-06", status: "Fechada", saldoExtrato: 0, saldoRazao: 0, pendencias: 0, preparadoPor: "a", preparadoEm: "", revisadoPor: "b", revisadoEm: "", observacao: "" },
    ]);
    expect(ok.every((item) => item.ok)).toBe(true);
  });
});

describe("leitura de extrato", () => {
  it("lê valores no formato brasileiro e com indicador D/C", () => {
    expect(lerValor("1.234,56")).toBe(1234.56);
    expect(lerValor("-1234.56")).toBe(-1234.56);
    expect(lerValor("(89,90)")).toBe(-89.9);
    expect(lerValor("R$ 10,00 D")).toBe(-10);
    expect(lerValor("abc")).toBeNull();
  });

  it("lê CSV com valor único ou crédito/débito separados e guarda o saldo final", () => {
    const csv = "Data;Histórico;Documento;Valor\n01/06/2026;TARIFA;;-12,50\n02/06/2026;TED RECEBIDA;NF 1;1.000,00\n30/06/2026;SALDO DO DIA;;987,50\nxx;quebrada;;1";
    const leitura = lerCsv(csv);
    expect(leitura.linhas.map((l) => [l.data, l.valor])).toEqual([["2026-06-01", -12.5], ["2026-06-02", 1000]]);
    expect(leitura.saldoFinal).toBe(987.5);
    expect(leitura.erros).toHaveLength(1);
    const separado = lerCsv("data,descricao,credito,debito\n2026-06-03,PIX,50.00,\n2026-06-04,BOLETO,,20.00");
    expect(separado.linhas.map((l) => l.valor)).toEqual([50, -20]);
  });

  it("lê OFX e usa o FITID para não importar duas vezes", () => {
    const ofx = `<OFX><BANKTRANLIST><STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260605120000[-3:BRT]<TRNAMT>-895.00<FITID>A1<MEMO>SISPAG LOTE</STMTTRN>
<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20260608<TRNAMT>45000.00<FITID>A2<NAME>TED VERTTI</STMTTRN></BANKTRANLIST><LEDGERBAL><BALAMT>1234.56<DTASOF>20260630</LEDGERBAL></OFX>`;
    const leitura = lerOfx(ofx);
    expect(leitura.linhas.map((l) => [l.data, l.valor, l.chave])).toEqual([["2026-06-05", -895, "ofx:A1"], ["2026-06-08", 45000, "ofx:A2"]]);
    expect(leitura.saldoFinal).toBe(1234.56);
    const existentes = [{ ...ext("x", "2026-06-05", -895), chave: "ofx:A1" }];
    const { novas, duplicadas } = separarDuplicadas(leitura.linhas, existentes, "c1");
    expect(novas).toHaveLength(1);
    expect(duplicadas).toHaveLength(1);
  });
});

describe("semente da demonstração", () => {
  it("maio fechado e sem pendências em todas as contas, com o saldo do banco batendo", () => {
    for (const c of CONTAS_BANCARIAS_DEMO) {
      const d = montarDemonstrativo(c, EXTRATO_DEMO, RAZAO_DEMO, CASAMENTOS_DEMO, "2026-05");
      expect(d.pendencias).toBe(0);
      expect(d.diferenca).toBe(0);
      expect(SALDOS_INFORMADOS_DEMO.find((s) => s.contaId === c.id && s.mes === "2026-05")?.saldo).toBe(d.saldoExtrato);
      expect(FECHAMENTOS_CONCILIACAO_DEMO.find((f) => f.contaId === c.id)?.status).toBe("Fechada");
    }
  });

  it("junho tem os quatro tipos de pendência e o casamento automático resolve o lote", () => {
    const itau = CONTAS_BANCARIAS_DEMO[0];
    const d = montarDemonstrativo(itau, EXTRATO_DEMO, RAZAO_DEMO, CASAMENTOS_DEMO, "2026-06");
    expect(d.depositosEmTransito.length).toBeGreaterThan(0);
    expect(d.pagamentosNaoCompensados.length).toBeGreaterThan(0);
    expect(d.creditosNaoContabilizados.length).toBeGreaterThan(0);
    expect(d.debitosNaoContabilizados.length).toBeGreaterThan(0);
    expect(d.diferenca).toBe(0);
    const usados = new Set(CASAMENTOS_DEMO.flatMap((c) => [...c.extratoIds, ...c.razaoIds]));
    const livres = <T extends { id: string; contaId: string; data: string }>(l: T[]) => l.filter((i) => i.contaId === itau.id && i.data >= "2026-06-01" && !usados.has(i.id));
    const sugestoes = sugerirCasamentos(livres(EXTRATO_DEMO), livres(RAZAO_DEMO));
    expect(sugestoes.some((s) => s.razaoIds.length === 2)).toBe(true);
  });
});
