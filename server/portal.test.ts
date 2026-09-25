import { describe, expect, it } from "vitest";
import { calculateClosingProgress, formatBRL, formatMonth, receiptsIncludedInClosing } from "../client/src/lib/portal";

describe("Portal do Prestador — regras do protótipo", () => {
  it("formata valores em reais no padrão brasileiro", () => {
    expect(formatBRL(1280.5)).toBe("R$ 1.280,50");
  });

  it("formata a competência mensal para exibição", () => {
    expect(formatMonth("2026-06")).toBe("junho de 2026");
  });

  it("calcula o progresso considerando recibos, revisão, documento e envio", () => {
    expect(calculateClosingProgress(["Rascunho"], false, false)).toBe(25);
    expect(calculateClosingProgress(["Aprovado", "Enviado"], true, false)).toBe(75);
    expect(calculateClosingProgress(["Aprovado"], true, true)).toBe(100);
  });

  it("exclui recibos rejeitados do fechamento", () => {
    expect(receiptsIncludedInClosing(["Aprovado", "Enviado", "Rejeitado"])).toBe(2);
  });
});
