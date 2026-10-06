import { criarColecao, useColecao } from "@/_core/armazenamento/colecao";
import { CLIENTES_LEGAL_DEMO, PROCESSOS_DEMO, SLA_DEMO, TEMPLATES_DEMO } from "./dadosMock";
import type { ClienteLegal, ConfigSla, Processo, Template } from "./tipos";

export const processos = criarColecao<Processo[]>("legal-processos", () => PROCESSOS_DEMO);
export const clientesLegal = criarColecao<ClienteLegal[]>("legal-clientes", () => CLIENTES_LEGAL_DEMO);
export const templates = criarColecao<Template[]>("legal-templates", () => TEMPLATES_DEMO);
export const sla = criarColecao<ConfigSla>("legal-sla", () => SLA_DEMO);

export function useDadosLegal() {
  return {
    processos: useColecao(processos),
    clientes: useColecao(clientesLegal),
    templates: useColecao(templates),
    sla: useColecao(sla),
  };
}
