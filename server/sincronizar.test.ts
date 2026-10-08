import { describe, expect, it } from "vitest";
import { diferenca } from "../client/src/_core/supabase/sincronizar";

const remota = { tipo: "lista" as const, tabela: "t" };

describe("sincronização: só o que mudou vai para o banco", () => {
  const a = { id: "a", v: 1 };
  const b = { id: "b", v: 1 };
  it("item novo, alterado e removido", () => {
    const b2 = { id: "b", v: 2 };
    const c = { id: "c", v: 1 };
    expect(diferenca(remota, [a, b], [a, b2, c])).toEqual({ novos: [c], alterados: [b2], apagar: [] });
    expect(diferenca(remota, [a, b], [a])).toEqual({ novos: [], alterados: [], apagar: ["b"] });
  });
  it("objeto novo com o mesmo conteúdo não regrava", () => {
    expect(diferenca(remota, [a], [{ id: "a", v: 1 }])).toEqual({ novos: [], alterados: [], apagar: [] });
  });
  it("chave composta (fechamento é por prestador e competência)", () => {
    const comChave = { ...remota, chave: (f: never) => `${(f as { p: string }).p}|${(f as { c: string }).c}` };
    const f1 = { p: "x", c: "2026-06", ok: false };
    expect(diferenca(comChave, [f1], [{ ...f1, ok: true }]).alterados).toHaveLength(1);
    expect(diferenca(comChave, [f1], []).apagar).toEqual(["x|2026-06"]);
  });
  it("perfis: só altera, nunca cria nem apaga pelo app", () => {
    const perfis = { ...remota, somenteAlterar: true };
    expect(diferenca(perfis, [a], [{ id: "a", v: 9 }, b])).toEqual({ novos: [], alterados: [{ id: "a", v: 9 }], apagar: [] });
    expect(diferenca(perfis, [a, b], [a]).apagar).toEqual([]);
  });
});
