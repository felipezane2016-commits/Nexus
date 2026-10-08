import { criarColecao, useColecao } from "@/_core/armazenamento/colecao";
import { CONFIG_APROVACAO_DEMO, FORNECEDORES_DEMO, PAGAMENTOS_DEMO } from "./dadosMock";
import type { ConfigAprovacao, Fornecedor, Pagamento } from "./tipos";

export const pagamentos = criarColecao<Pagamento[]>("pagamentos", () => PAGAMENTOS_DEMO, { remota: { tipo: "lista", tabela: "pagamentos" }, vazio: () => [] });
// Cadastro e configuração atravessam o "começar do zero".
export const fornecedores = criarColecao<Fornecedor[]>("pagamentos-fornecedores", () => FORNECEDORES_DEMO, { remota: { tipo: "lista", tabela: "pagamentos_fornecedores" } });
export const configAprovacao = criarColecao<ConfigAprovacao>("pagamentos-config", () => CONFIG_APROVACAO_DEMO, {
  remota: { tipo: "unico", tabela: "configuracoes", id: "pagamentos-config", inicial: () => ({ aprovadorId: "", substitutoId: null, substitutoDe: null, substitutoAte: null }) },
});

export function useDadosPagamentos() {
  return {
    pagamentos: useColecao(pagamentos),
    fornecedores: useColecao(fornecedores),
    config: useColecao(configAprovacao),
  };
}
