import { diasEntre, diasUteisEntre } from "@/_core/tempo";
import { ETAPAS, type ChaveEtapa, type ClienteLegal, type ConfigSla, type Processo } from "./tipos";

/** Regras puras do Legal Workflow — prazo, inatividade, vencimento e alertas. */

export type SituacaoPrazo = "Em dia" | "Em risco" | "Atrasado" | "Concluído" | "Sem prazo";

export function nomeEtapa(chave: ChaveEtapa) {
  return ETAPAS.find((etapa) => etapa.chave === chave)?.nome ?? chave;
}

/** Dias úteis restantes do SLA da etapa atual (negativo = atrasado). */
export function prazoRestante(processo: Processo, sla: ConfigSla, hoje: string): number | null {
  const limite = sla.dias[processo.etapa];
  if (processo.etapa === "finalizado" || !limite) return null;
  return limite - diasUteisEntre(processo.etapaDesde, hoje);
}

export function situacaoPrazo(processo: Processo, sla: ConfigSla, hoje: string): SituacaoPrazo {
  if (processo.etapa === "finalizado") return "Concluído";
  const restante = prazoRestante(processo, sla, hoje);
  if (restante === null) return "Sem prazo";
  if (restante < 0) return "Atrasado";
  if (restante <= 1) return "Em risco";
  return "Em dia";
}

export function diasSemAtividade(processo: Processo, hoje: string) {
  return diasEntre(processo.ultimaAtividade, hoje);
}

export function diasParaVencer(processo: Processo, hoje: string): number | null {
  return processo.vencimento ? diasEntre(hoje, processo.vencimento) : null;
}

export function ativos(processos: Processo[]) {
  return processos.filter((processo) => processo.etapa !== "finalizado");
}

export type Alerta = {
  processo: Processo;
  gravidade: "alta" | "media";
  titulo: string;
  descricao: string;
};

/**
 * Os três alertas do app antigo, nesta ordem de prioridade: processo parado há
 * 7 dias ou mais, procuração vencendo em até 60 dias (alta até 30) e último
 * e-mail que voltou.
 */
export function alertas(processos: Processo[], clientes: ClienteLegal[], hoje: string): Alerta[] {
  const nome = (processo: Processo) => clientes.find((cliente) => cliente.id === processo.clienteId)?.razaoBrasil ?? "Cliente";
  const lista: (Alerta & { prioridade: number })[] = [];
  for (const processo of ativos(processos)) {
    const parado = diasSemAtividade(processo, hoje);
    if (parado >= 7) {
      lista.push({
        processo,
        prioridade: 0,
        gravidade: "alta",
        titulo: `${nome(processo)} — sem atividade há ${parado} dias`,
        descricao: `${nomeEtapa(processo.etapa)} · ${processo.comQuem === "cliente" ? "aguardando o cliente" : "com o escritório"}`,
      });
    }
    const vence = diasParaVencer(processo, hoje);
    if (vence !== null && vence <= 60) {
      lista.push({
        processo,
        prioridade: 1,
        gravidade: vence <= 30 ? "alta" : "media",
        titulo: `${nome(processo)} — procuração ${vence < 0 ? `vencida há ${-vence} dias` : vence === 0 ? "vence hoje" : `vence em ${vence} dias`}`,
        descricao: `Procuração ${processo.tipo.toLowerCase()}`,
      });
    }
    const ultima = processo.comunicacoes[processo.comunicacoes.length - 1];
    if (ultima?.tipo === "email_retornado") {
      lista.push({
        processo,
        prioridade: 2,
        gravidade: "media",
        titulo: `${nome(processo)} — e-mail retornou`,
        descricao: ultima.descricao || "E-mail inválido ou desatualizado",
      });
    }
  }
  return lista.sort((a, b) => a.prioridade - b.prioridade).map(({ prioridade: _, ...alerta }) => alerta);
}

/** Substitui {{variavel}} pelos dados do processo; variável sem valor fica à mostra. */
export function preencherTemplate(corpo: string, valores: Record<string, string>) {
  return corpo.replace(/\{\{(\w+)\}\}/g, (marca, chave: string) => valores[chave] ?? marca);
}
