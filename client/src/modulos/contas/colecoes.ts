import { criarColecao, useColecao } from "@/_core/armazenamento/colecao";
import { CONFIG_EMAILS_DEMO, ORDENS_DEMO, TAREFAS_CONTAS_DEMO, TAXAS_DEMO } from "./dadosMock";
import type { ConfigEmailsOrdens, Ordem, Taxa, TarefaConta } from "./tipos";

export const tarefasContas = criarColecao<TarefaConta[]>("contas-tarefas", () => TAREFAS_CONTAS_DEMO, { remota: { tipo: "lista", tabela: "contas_tarefas" }, vazio: () => [] });
export const taxas = criarColecao<Taxa[]>("contas-taxas", () => TAXAS_DEMO, { remota: { tipo: "lista", tabela: "contas_taxas" }, vazio: () => [] });
export const ordens = criarColecao<Ordem[]>("contas-ordens", () => ORDENS_DEMO, { remota: { tipo: "lista", tabela: "contas_ordens" }, vazio: () => [] });
// Configuração, não movimento: atravessa o "começar do zero".
export const configEmailsOrdens = criarColecao<ConfigEmailsOrdens>("contas-config-emails", () => CONFIG_EMAILS_DEMO, {
  remota: { tipo: "unico", tabela: "configuracoes", id: "contas-config-emails", inicial: () => ({ emailBanco: "", copiaBanco: "", emailsSuperiores: "", assinatura: "" }) },
});

export function useDadosContas() {
  return {
    tarefas: useColecao(tarefasContas),
    taxas: useColecao(taxas),
    ordens: useColecao(ordens),
    configEmails: useColecao(configEmailsOrdens),
  };
}

