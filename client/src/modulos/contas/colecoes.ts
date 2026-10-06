import { criarColecao, useColecao } from "@/_core/armazenamento/colecao";
import { EVENTOS_ECONOMICOS_DEMO, ORDENS_DEMO, TAREFAS_CONTAS_DEMO, TAXAS_DEMO } from "./dadosMock";
import type { EventoEconomico, Ordem, Taxa, TarefaConta } from "./tipos";

export const tarefasContas = criarColecao<TarefaConta[]>("contas-tarefas", () => TAREFAS_CONTAS_DEMO);
export const taxas = criarColecao<Taxa[]>("contas-taxas", () => TAXAS_DEMO);
export const ordens = criarColecao<Ordem[]>("contas-ordens", () => ORDENS_DEMO);
export const eventosEconomicos = criarColecao<EventoEconomico[]>("contas-eventos", () => EVENTOS_ECONOMICOS_DEMO);

export function useDadosContas() {
  return {
    tarefas: useColecao(tarefasContas),
    taxas: useColecao(taxas),
    ordens: useColecao(ordens),
    eventos: useColecao(eventosEconomicos),
  };
}

