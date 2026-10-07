import { criarColecao, useColecao } from "@/_core/armazenamento/colecao";
import { CONFIG_EMAILS_DEMO, EVENTOS_ECONOMICOS_DEMO, ORDENS_DEMO, TAREFAS_CONTAS_DEMO, TAXAS_DEMO } from "./dadosMock";
import type { ConfigEmailsOrdens, EventoEconomico, Ordem, Taxa, TarefaConta } from "./tipos";

export const tarefasContas = criarColecao<TarefaConta[]>("contas-tarefas", () => TAREFAS_CONTAS_DEMO, { vazio: () => [] });
export const taxas = criarColecao<Taxa[]>("contas-taxas", () => TAXAS_DEMO, { vazio: () => [] });
export const ordens = criarColecao<Ordem[]>("contas-ordens", () => ORDENS_DEMO, { vazio: () => [] });
// Configuração, não movimento: atravessa o "começar do zero".
export const configEmailsOrdens = criarColecao<ConfigEmailsOrdens>("contas-config-emails", () => CONFIG_EMAILS_DEMO);
export const eventosEconomicos = criarColecao<EventoEconomico[]>("contas-eventos", () => EVENTOS_ECONOMICOS_DEMO, { vazio: () => [] });

export function useDadosContas() {
  return {
    tarefas: useColecao(tarefasContas),
    taxas: useColecao(taxas),
    ordens: useColecao(ordens),
    eventos: useColecao(eventosEconomicos),
    configEmails: useColecao(configEmailsOrdens),
  };
}

