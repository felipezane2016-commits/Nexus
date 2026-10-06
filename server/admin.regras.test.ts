import { describe, expect, it } from "vitest";
import { ambientesDisponiveis, pode, veModulo, type Usuario } from "../client/src/_core/identidade/permissoes";
import { diasUteisEntre } from "../client/src/_core/tempo";
import type { Closing, Receipt } from "../client/src/lib/portal";
import { economiaPotencial, mediaMovel, spread, tendencia } from "../client/src/modulos/contas/regras";
import type { Taxa, TarefaConta } from "../client/src/modulos/contas/tipos";
import { montarAgenda, vencendoEmBreve } from "../client/src/modulos/escritorio/agenda";
import { SLA_DEMO } from "../client/src/modulos/legal/dadosMock";
import { alertas, preencherTemplate, prazoRestante, situacaoPrazo } from "../client/src/modulos/legal/regras";
import type { ClienteLegal, Processo } from "../client/src/modulos/legal/tipos";
import { codigoDisponivel, montarLotes, podeFinalizarConferencia, podeMarcarPago, rankingPrestadores } from "../client/src/modulos/prestadores/regras";
import type { Prestador } from "../client/src/modulos/prestadores/tipos";

const HOJE = "2026-06-30";

function prestador(id: string, codigo = id.toUpperCase()): Prestador {
  return { id, nome: id, categoria: "Motoboy", documento: "", email: "", telefone: "", codigoAcesso: codigo, senha: "x", portalAtivo: true, contrato: "", desde: "2026-01-01" };
}

function recibo(id: string, prestadorId: string, status: Receipt["status"], amount = 100, competencia = "2026-06"): Receipt {
  return {
    id, prestadorId, competencia, serviceDate: `${competencia}-10`, category: "Transporte", client: "C", caseRef: "", requester: "",
    description: "", amount, status, attachmentName: null, reviewNote: null, createdAt: `${competencia}-10T00:00:00Z`,
  };
}

function fechamento(prestadorId: string, review: Closing["review"], competencia = "2026-06"): Closing {
  return { prestadorId, competencia, documentName: "nf.pdf", submitted: review !== null, submittedAt: null, review };
}

describe("Conferência de recibos", () => {
  const prestadores = [prestador("a"), prestador("b"), prestador("c")];

  it("agrupa por prestador e competência e ignora quem só tem rascunho", () => {
    const lotes = montarLotes(
      [recibo("1", "a", "Enviado"), recibo("2", "a", "Rascunho"), recibo("3", "b", "Rascunho")],
      [],
      prestadores,
    );
    expect(lotes).toHaveLength(1);
    expect(lotes[0].situacao).toBe("Recibos avulsos");
    // O rascunho do mesmo prestador não entra no lote: o escritório não pode decidir o que não recebeu.
    expect(lotes[0].recibos.map((item) => item.id)).toEqual(["1"]);
  });

  it("põe primeiro o que pede ação", () => {
    const lotes = montarLotes(
      [recibo("1", "a", "Aprovado"), recibo("2", "b", "Enviado"), recibo("3", "c", "Aprovado")],
      [fechamento("a", "Pago"), fechamento("b", "Aguardando conferência"), fechamento("c", "Conferido")],
      prestadores,
    );
    expect(lotes.map((lote) => lote.situacao)).toEqual(["Aguardando conferência", "Conferido", "Pago"]);
  });

  it("só finaliza com o fechamento enviado e nenhum recibo sem decisão", () => {
    const [comPendencia] = montarLotes([recibo("1", "a", "Enviado")], [fechamento("a", "Aguardando conferência")], prestadores);
    expect(podeFinalizarConferencia(comPendencia)).toBe(false);
    const [decidido] = montarLotes([recibo("1", "a", "Aprovado"), recibo("2", "a", "Rejeitado")], [fechamento("a", "Aguardando conferência")], prestadores);
    expect(podeFinalizarConferencia(decidido)).toBe(true);
    expect(podeMarcarPago(decidido)).toBe(false);
  });

  it("o total do lote exclui recibos rejeitados", () => {
    const [lote] = montarLotes([recibo("1", "a", "Aprovado", 300), recibo("2", "a", "Rejeitado", 900)], [fechamento("a", "Aguardando conferência")], prestadores);
    expect(lote.total).toBe(300);
  });

  it("ranking soma só o aprovado", () => {
    const [primeiro] = rankingPrestadores([recibo("1", "b", "Aprovado", 500), recibo("2", "a", "Enviado", 900)], prestadores);
    expect(primeiro.prestador.id).toBe("b");
    expect(primeiro.valor).toBe(500);
  });

  it("código de acesso é único, sem diferenciar maiúsculas, e livre para o próprio prestador", () => {
    const lista = [prestador("a", "PNST-1"), prestador("b", "PNST-2")];
    expect(codigoDisponivel("pnst-1", lista)).toBe(false);
    expect(codigoDisponivel("PNST-1", lista, "a")).toBe(true);
    expect(codigoDisponivel("PNST-3", lista)).toBe(true);
  });
});

describe("Legal Workflow", () => {
  const base: Processo = {
    id: "PR-1", clienteId: "cl", tipo: "Geral", responsavel: "", vencimento: null, comQuem: "escritorio", traducao: false,
    observacoes: "", etapa: "minuta", etapaDesde: "2026-06-25", criadoEm: "2026-06-01", ultimaAtividade: "2026-06-29", comunicacoes: [],
  };
  const clientes: ClienteLegal[] = [{ id: "cl", razaoBrasil: "Empresa", cnpjBrasil: "", razaoExterior: "", cnpjExterior: "", emails: "", pais: "", responsavel: "" }];

  it("conta dias úteis, pulando fim de semana", () => {
    // 26/06/2026 é sexta; até terça 30/06 são 2 dias úteis.
    expect(diasUteisEntre("2026-06-26", "2026-06-30")).toBe(2);
  });

  it("classifica o prazo da etapa em dia, em risco e atrasado", () => {
    // Minuta tem SLA de 3 dias úteis; de 25/06 a 30/06 passaram 3.
    expect(prazoRestante(base, SLA_DEMO, HOJE)).toBe(0);
    expect(situacaoPrazo(base, SLA_DEMO, HOJE)).toBe("Em risco");
    expect(situacaoPrazo({ ...base, etapaDesde: "2026-06-29" }, SLA_DEMO, HOJE)).toBe("Em dia");
    expect(situacaoPrazo({ ...base, etapaDesde: "2026-06-18" }, SLA_DEMO, HOJE)).toBe("Atrasado");
    expect(situacaoPrazo({ ...base, etapa: "finalizado" }, SLA_DEMO, HOJE)).toBe("Concluído");
  });

  it("alerta processo parado, procuração vencendo e e-mail que voltou, nessa ordem", () => {
    const lista = alertas(
      [
        { ...base, id: "email", comunicacoes: [{ id: "1", data: HOJE, tipo: "email_retornado", descricao: "", autor: "" }] },
        { ...base, id: "vence", vencimento: "2026-07-20" },
        { ...base, id: "parado", ultimaAtividade: "2026-06-20" },
        { ...base, id: "fim", etapa: "finalizado", ultimaAtividade: "2026-01-01" },
      ],
      clientes,
      HOJE,
    );
    expect(lista.map((alerta) => alerta.processo.id)).toEqual(["parado", "vence", "email"]);
    expect(lista[1].gravidade).toBe("alta");
  });

  it("preenche o template e deixa à mostra a variável sem valor", () => {
    expect(preencherTemplate("Olá {{nome}}, prazo {{prazo}}", { nome: "Ana" })).toBe("Olá Ana, prazo {{prazo}}");
  });
});

describe("Banco Industrial", () => {
  const taxa = (bibUsd: number, itauUsd: number): Taxa => ({ id: "t", data: HOJE, horario: "10:00", bibUsd, bibEur: 6, itauUsd, itauEur: 6, observacao: "" });

  it("spread é BIB menos Itaú", () => {
    expect(spread(taxa(5.62, 5.6), "USD")).toBeCloseTo(0.02, 6);
  });

  it("média móvel usa só a janela final", () => {
    expect(mediaMovel([1, 2, 3, 4, 5], 2)).toBe(4.5);
    expect(mediaMovel([2, 4], 30)).toBe(3);
  });

  it("tendência compara média de 7 com a de 30", () => {
    const subindo = [...Array(23).fill(5), ...Array(7).fill(5.2)];
    expect(tendencia(subindo)).toBe("Alta");
    expect(tendencia(Array(30).fill(5))).toBe("Estável");
  });

  it("economia é o que a melhor cotação rende a mais sobre a mesma quantidade de moeda", () => {
    const resultado = economiaPotencial(100_000, 5.0, 5.05);
    expect(resultado.valor).toBeCloseTo(1000, 6);
    expect(resultado.percentual).toBeCloseTo(1, 6);
    expect(economiaPotencial(0, 5, 5.1).valor).toBe(0);
  });
});

describe("Agenda", () => {
  const tarefa = (id: string, vencimento: string | null, concluida = false): TarefaConta => ({
    id, nome: id, categoria: "Impostos", concluida, vencimento, periodo: "", observacoes: "",
  });

  it("junta reuniões, contas a pagar pendentes e procurações ativas", () => {
    const agenda = montarAgenda({
      reunioes: [{ id: "r", titulo: "Reunião", data: HOJE, hora: "09:00", local: "", participantes: "", pauta: "" }],
      tarefasContas: [tarefa("paga", HOJE, true), tarefa("aberta", HOJE)],
      processos: [],
      clientesLegal: [],
    });
    expect(agenda.map((evento) => evento.id)).toEqual(["r", "aberta"]);
  });

  it("vencendo em breve vai de hoje até o limite, sem vencidas nem concluídas", () => {
    const lista = vencendoEmBreve([tarefa("ontem", "2026-06-29"), tarefa("hoje", HOJE), tarefa("semana", "2026-07-07"), tarefa("depois", "2026-07-08")], HOJE, "2026-07-07");
    expect(lista.map((item) => item.id)).toEqual(["hoje", "semana"]);
  });
});

describe("Permissões", () => {
  const usuario = (papel: Usuario["papel"], modulos: Usuario["modulos"], ativo = true): Usuario => ({
    id: "u", nome: "U", email: "u@x", senha: "x", departamento: "", papel, modulos, ativo, ultimoAcesso: null,
  });

  it("o papel decide o que a pessoa pode fazer", () => {
    expect(pode(usuario("admin", []), "usuarios.gerenciar")).toBe(true);
    expect(pode(usuario("gestor", []), "usuarios.gerenciar")).toBe(false);
    expect(pode(usuario("operador", []), "registros.editar")).toBe(true);
    expect(pode(usuario("operador", []), "registros.excluir")).toBe(false);
    expect(pode(usuario("viewer", []), "registros.editar")).toBe(false);
  });

  it("o módulo decide onde ela entra; inativo não entra em nada", () => {
    expect(veModulo(usuario("admin", ["legal"]), "legal")).toBe(true);
    expect(veModulo(usuario("admin", ["legal"]), "contas")).toBe(false);
    expect(veModulo(usuario("admin", ["legal"], false), "legal")).toBe(false);
    expect(pode(usuario("admin", ["legal"], false), "registros.editar")).toBe(false);
  });

  it("só oferece os ambientes em que a pessoa tem algum módulo", () => {
    expect(ambientesDisponiveis(usuario("operador", ["legal"]))).toEqual(["escritorio"]);
    expect(ambientesDisponiveis(usuario("admin", ["visao", "consultoria", "particular"]))).toEqual(["escritorio", "consultoria", "particular"]);
  });
});
