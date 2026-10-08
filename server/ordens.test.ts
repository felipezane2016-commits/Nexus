import { describe, expect, it } from "vitest";
import { ORDENS_DEMO } from "../client/src/modulos/contas/dadosMock";
import { emailAosSuperiores, emailInvoiceAoBanco, emailRespostaAoBanco, rotuloDia, saudacao } from "../client/src/modulos/contas/emails";
import { montarEml } from "../client/src/modulos/contas/eml";
import { horaDeBrasilia } from "../client/src/_core/tempo";
import { mesesDoAno, montarAba, pendenteNaPlanilha } from "../client/src/modulos/contas/planilha";
import {
  alertasDasOrdens,
  dataDoPrazo,
  diferencaItauBib,
  etapaDaOrdem,
  lerEmailOrdem,
  somarDiasUteis,
  tipoDaOrdem,
  ultimasCotacoes,
} from "../client/src/modulos/contas/regras";
import type { ConfigEmailsOrdens, Ordem, Taxa } from "../client/src/modulos/contas/tipos";

const config: ConfigEmailsOrdens = { emailBanco: "cambio@bib", copiaBanco: "", emailsSuperiores: "a@x; b@x", assinatura: "Fulano\nPNST" };

function base(extra: Partial<Ordem> = {}): Ordem {
  return {
    id: "o1", numeroOrdem: "90626", dataRecebimento: "2026-10-06", cliente: "ACME GMBH", beneficiario: "Pacheco Neto", moeda: "EUR", valor: 1263.49,
    invoices: [], bloqueiaEmails: false, observacoes: "", invoiceEnviadaEm: null, okBancoEm: null, enviadaSuperioresEm: null, decisao: null,
    fechamento: null, respostaBancoEm: null, baixa: { sisjuri: null, extrato: null, contrato: null }, historico: [], ...extra,
  };
}
const taxa = (data: string, horario: string, bibUsd: number, bibEur: number, itauUsd: number, itauEur: number): Taxa => ({ id: data + horario, data, horario, bibUsd, bibEur, itauUsd, itauEur, observacao: "" });

describe("leitura do e-mail do Banco Industrial", () => {
  it("lê o e-mail no formato que o banco manda", () => {
    const texto = `[BIB - PÚBLICO]\n\nBom dia,\n\nRecebemos a seguinte ordem de pagamento:\n\nBeneficiário: PACHECO NETO SANDEN TEISSEIRE ADVOGADOS\nOrdenante: ACME GMBH – BERLIN/DE\nValor:            EUR. 1.263,49\nNº da ordem: 90626\n.\n\nAguardamos instruções.`;
    expect(lerEmailOrdem(texto)).toEqual({
      numeroOrdem: "90626", cliente: "ACME GMBH – BERLIN/DE", beneficiario: "PACHECO NETO SANDEN TEISSEIRE ADVOGADOS", moeda: "EUR", valor: 1263.49, faltando: [],
    });
  });

  it("aceita USD com ponto decimal e aponta o que faltou", () => {
    const lido = lerEmailOrdem("Ordenante: X LLC\nValor: USD 15,200.00");
    expect(lido.moeda).toBe("USD");
    expect(lido.valor).toBe(15200);
    expect(lido.faltando).toEqual(["nº da ordem"]);
  });
});

describe("etapas", () => {
  it("anda pelas datas preenchidas", () => {
    expect(etapaDaOrdem(base())).toBe("Recebida");
    expect(etapaDaOrdem(base({ invoiceEnviadaEm: "d" }))).toBe("Invoice enviada");
    expect(etapaDaOrdem(base({ invoiceEnviadaEm: "d", okBancoEm: "d" }))).toBe("Liberada pelo banco");
    expect(etapaDaOrdem(base({ invoiceEnviadaEm: "d", okBancoEm: "d", enviadaSuperioresEm: "d" }))).toBe("Aguardando decisão");
    const decidida = { invoiceEnviadaEm: "d", okBancoEm: "d", enviadaSuperioresEm: "d" };
    const decisao = { taxaAlvo: null, dataFechamento: null, decididoPor: "R", quando: "", canal: "Sistema" as const, observacao: "" };
    expect(etapaDaOrdem(base({ ...decidida, decisao: { ...decisao, prazo: "Aguardar" } }))).toBe("Aguardando câmbio");
    expect(etapaDaOrdem(base({ ...decidida, decisao: { ...decisao, prazo: "D+1" } }))).toBe("Fechamento agendado");
    const fechada = { ...decidida, fechamento: { cotacao: 6, data: "d", responsavel: "F", quemFechou: "FM / X" } };
    expect(etapaDaOrdem(base(fechada))).toBe("Fechada");
    expect(etapaDaOrdem(base({ ...fechada, respostaBancoEm: "d", baixa: { sisjuri: "d", extrato: null, contrato: "d" } }))).toBe("Baixa pendente");
    expect(etapaDaOrdem(base({ ...fechada, respostaBancoEm: "d", baixa: { sisjuri: "d", extrato: "d", contrato: "d" } }))).toBe("Concluída");
  });

  it("a semente tem uma ordem em cada etapa", () => {
    const etapas = new Set(ORDENS_DEMO.map(etapaDaOrdem));
    for (const etapa of ["Recebida", "Invoice enviada", "Liberada pelo banco", "Aguardando decisão", "Aguardando câmbio", "Fechamento agendado", "Fechada", "Baixa pendente", "Concluída"])
      expect(etapas.has(etapa as never)).toBe(true);
  });

  it("tipo é misto quando há honorários e despesas", () => {
    const inv = (tipo: "Honorários" | "Despesas") => ({ numero: "1", valor: 1, tipo, anexoId: null, arquivo: null });
    expect(tipoDaOrdem(base())).toBeNull();
    expect(tipoDaOrdem(base({ invoices: [inv("Despesas")] }))).toBe("Despesas");
    expect(tipoDaOrdem(base({ invoices: [inv("Honorários"), inv("Despesas")] }))).toBe("Misto");
  });
});

describe("prazos D+n", () => {
  it("conta dias úteis e pula o fim de semana", () => {
    expect(somarDiasUteis("2026-10-07", 0)).toBe("2026-10-07"); // quarta
    expect(somarDiasUteis("2026-10-09", 1)).toBe("2026-10-12"); // sexta → segunda
    expect(somarDiasUteis("2026-10-08", 2)).toBe("2026-10-12"); // quinta → segunda
    expect(somarDiasUteis("2026-10-10", 0)).toBe("2026-10-12"); // sábado → segunda
    expect(dataDoPrazo("Aguardar", "2026-10-07")).toBeNull();
  });
});

describe("alertas", () => {
  const decidida = { invoiceEnviadaEm: "2026-06-26", okBancoEm: "2026-06-29", enviadaSuperioresEm: "2026-06-29" };
  const decisao = { decididoPor: "R", quando: "", canal: "Sistema" as const, observacao: "" };
  it("fechar hoje, atrasado, taxa-alvo atingida e OK do banco demorando", () => {
    const ordens = [
      base({ id: "hoje", ...decidida, decisao: { ...decisao, prazo: "D+1", taxaAlvo: null, dataFechamento: "2026-06-30" } }),
      base({ id: "atrasada", ...decidida, decisao: { ...decisao, prazo: "D+0", taxaAlvo: null, dataFechamento: "2026-06-29" } }),
      base({ id: "alvo", ...decidida, decisao: { ...decisao, prazo: "Aguardar", taxaAlvo: 6.1, dataFechamento: null } }),
      base({ id: "ok", invoiceEnviadaEm: "2026-06-27" }),
    ];
    const alertas = alertasDasOrdens(ordens, [taxa("2026-06-30", "11:00", 5.5, 6.12, 5.51, 6.13)], "2026-06-30");
    expect(alertas.map((a) => [a.ordemId, a.tom])).toEqual([["atrasada", "red"], ["hoje", "amber"], ["ok", "amber"], ["alvo", "green"]]);
  });
});

describe("cotação aos superiores", () => {
  it("diferença ITAÚ x BIB em percentual de verdade", () => {
    const t = taxa("2026-10-07", "11:50", 4.957, 5.5439, 4.9769, 5.5686);
    expect(diferencaItauBib(t, "USD")).toBeCloseTo(-0.3998, 3);
    expect(diferencaItauBib(t, "EUR")).toBeCloseTo(-0.4436, 3);
  });

  it("pega a última cotação de cada dia, as quatro mais recentes", () => {
    const lista = [taxa("2026-09-30", "11:10", 1, 1, 1, 1), taxa("2026-10-01", "10:00", 1, 1, 1, 1), taxa("2026-10-01", "14:35", 2, 2, 2, 2), taxa("2026-10-02", "14:35", 1, 1, 1, 1), taxa("2026-10-07", "11:50", 1, 1, 1, 1), taxa("2026-09-29", "9:00", 1, 1, 1, 1)];
    const ultimas = ultimasCotacoes(lista);
    expect(ultimas.map((t) => `${t.data} ${t.horario}`)).toEqual(["2026-09-30 11:10", "2026-10-01 14:35", "2026-10-02 14:35", "2026-10-07 11:50"]);
    expect(rotuloDia("2026-09-30")).toBe("30/set");
  });

  it("monta o e-mail com saudação, comentário, ordens e a tabela", () => {
    const taxas = [taxa("2026-10-07", "11:50", 4.957, 5.5439, 4.9769, 5.5686)];
    const email = emailAosSuperiores([base()], taxas, "O dólar iniciou a quarta-feira em alta.", config, 9);
    expect(email.assunto).toBe("Cotação de Câmbio 07/10");
    expect(email.para).toBe("a@x; b@x");
    expect(email.texto).toContain("Prezados, bom dia!");
    expect(email.texto).toContain("Segue cotação, o dólar iniciou a quarta-feira em alta.");
    expect(email.texto).toContain("Temos uma ordem de pagamento para fechamento:");
    expect(email.html).toContain("Horário Cotação");
    expect(email.html).toContain("07/out");
    expect(email.html).toContain("4,9570");
    expect(email.html).toContain("-0,40%");
    expect(saudacao(15)).toBe("boa tarde");
  });

  it("cumprimenta pela hora de Brasília, não pela do computador", () => {
    // 22:30 em UTC são 19:30 em Brasília.
    expect(horaDeBrasilia(new Date("2026-10-08T22:30:00Z"))).toBe(19);
    expect(saudacao(horaDeBrasilia(new Date("2026-10-08T22:30:00Z")))).toBe("boa noite");
    expect(saudacao(horaDeBrasilia(new Date("2026-10-08T12:00:00Z")))).toBe("bom dia");
    expect(horaDeBrasilia(new Date("2026-10-09T02:59:00Z"))).toBe(23);
    expect(horaDeBrasilia(new Date("2026-10-09T03:00:00Z"))).toBe(0);
  });

  it("escapa texto digitado no HTML", () => {
    const email = emailAosSuperiores([base({ cliente: "<script>x</script>" })], [], "<b>", config, 9);
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });
});

describe("e-mails ao banco", () => {
  const invoices = [
    { numero: "52260", valor: 1000, tipo: "Honorários" as const, anexoId: "a", arquivo: "Invoice 52260.pdf" },
    { numero: "52261", valor: 263.49, tipo: "Despesas" as const, anexoId: null, arquivo: null },
  ];
  it("invoice: natureza da ordem e anexos", () => {
    const email = emailInvoiceAoBanco(base({ invoices }), config, 10);
    expect(email.para).toBe("cambio@bib");
    expect(email.texto).toContain("Seguem em anexo as invoices referentes à ordem de pagamento nº 90626");
    expect(email.texto).toContain("Natureza da ordem: Misto");
    expect(email.anexos).toHaveLength(2);
  });
  it("resposta: cotação e total em reais", () => {
    const email = emailRespostaAoBanco(base({ invoices, fechamento: { cotacao: 6.25, data: "2026-10-07", responsavel: "F", quemFechou: "FM / X" } }), config, 10);
    expect(email.texto).toContain("à taxa de R$ 6,2500");
    expect(email.texto).toMatch(/totalizando R\$\s7\.896,81/);
  });
  it("rascunho .eml abre como mensagem nova no Outlook", () => {
    const eml = montarEml({ para: "a@x; b@x", cc: "", assunto: "Cotação de Câmbio 07/10", texto: "oi", html: "<p>oi</p>" }, [{ nome: "Invoice 1.pdf", tipo: "application/pdf", conteudo: new Uint8Array([37, 80, 68, 70]) }]);
    expect(eml).toContain("X-Unsent: 1");
    expect(eml).toContain("To: a@x, b@x");
    expect(eml).toContain("Subject: =?UTF-8?B?");
    expect(eml).toContain('filename="Invoice 1.pdf"');
    expect(eml).toContain("JVBERg=="); // "%PDF" em base64
  });
});

describe("planilha de controle", () => {
  const fechada = { invoiceEnviadaEm: "d", okBancoEm: "d", enviadaSuperioresEm: "d", fechamento: { cotacao: 6.302, data: "2026-01-05", responsavel: "F", quemFechou: "FMZ / IGOR" }, respostaBancoEm: "d" };
  it("ordem mista ocupa duas linhas com as colunas da ordem mescladas", () => {
    const ordem = base({
      dataRecebimento: "2026-01-02",
      invoices: [
        { numero: "50917", valor: 1000, tipo: "Honorários", anexoId: null, arquivo: null },
        { numero: "50902", valor: 263.49, tipo: "Despesas", anexoId: null, arquivo: null },
      ],
      ...fechada,
    });
    const aba = montarAba([ordem], "2026-01");
    expect(aba.nome).toBe("JANEIRO");
    expect(aba.linhas[0].celulas[7]).toBe("BLOQUEIA E-MAILS DE  FATURAS VENCIDAS?");
    expect(aba.linhas[1].celulas).toEqual([{ data: "2026-01-02" }, "ACME GMBH", "EUR", 1263.49, 50917, 1000, "Honorários", null, 6.302, { data: "2026-01-05" }, "FMZ / IGOR", "SIM"]);
    expect(aba.linhas[2].celulas.slice(4, 7)).toEqual([50902, 263.49, "Despesas"]);
    expect(aba.mesclas).toContain("A2:A3");
    expect(aba.mesclas).toContain("L2:L3");
    expect(aba.mesclas).not.toContain("E2:E3");
  });

  it("PENDENTE? só vira NÃO com a baixa completa", () => {
    expect(pendenteNaPlanilha(base(fechada))).toBe("SIM");
    expect(pendenteNaPlanilha(base({ ...fechada, baixa: { sisjuri: "d", extrato: "d", contrato: "d" } }))).toBe("NÃO");
  });

  it("pé da aba lista o que não fechou, por moeda, com o total", () => {
    const aba = montarAba([base({ dataRecebimento: "2026-01-10" }), base({ id: "o2", dataRecebimento: "2026-01-11", moeda: "USD", valor: 100 })], "2026-01");
    const totais = aba.linhas.filter((linha) => linha.tipo === "total");
    expect(totais.map((linha) => linha.celulas[2])).toEqual(["AMOUNT USD", "AMOUNT EUR"]);
    const pendentes = aba.linhas.filter((linha) => linha.tipo === "pendente");
    expect(pendentes.map((linha) => linha.celulas[2])).toEqual(["USD", "EUR"]);
    expect(aba.linhas[1].celulas[4]).toBe("(Fecharemos depois)");
  });

  it("uma aba por mês, do primeiro ao último com ordem", () => {
    expect(mesesDoAno([base({ dataRecebimento: "2026-02-03" }), base({ dataRecebimento: "2026-04-01" })], "2026")).toEqual(["2026-02", "2026-03", "2026-04"]);
  });
});
