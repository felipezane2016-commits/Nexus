import { criarColecao, useColecao } from "@/_core/armazenamento/colecao";
import type { ClienteConsultoria, Trabalho } from "./tipos";

/** Empresas fictícias. */
const CLIENTES_DEMO: ClienteConsultoria[] = [
  {
    id: "cc-arvo", nome: "Arvo Alimentos Ltda.", tags: ["Indústria", "Ativo"], cadastro: "2025-09-12", contato: "compras@arvo.com.br",
    observacoes: "Expansão para exportação em 2026.",
    reunioes: [
      { id: "rc-1", data: "2026-06-11", titulo: "Planejamento de registros no exterior", notas: "Priorizar Chile e Uruguai." },
      { id: "rc-2", data: "2026-05-06", titulo: "Kick-off", notas: "" },
    ],
  },
  { id: "cc-brisa", nome: "Brisa Tecnologia S.A.", tags: ["Tecnologia", "PME"], cadastro: "2026-01-20", contato: "ops@brisatec.com", observacoes: "", reunioes: [{ id: "rc-3", data: "2026-06-24", titulo: "Revisão do sistema de pedidos", notas: "Entrega da fase 2 em agosto." }] },
  { id: "cc-cedro", nome: "Cedro Importadora Ltda.", tags: ["Comércio", "Ativo"], cadastro: "2025-11-03", contato: "diretoria@cedroimport.com.br", observacoes: "", reunioes: [] },
  { id: "cc-delta", nome: "Delta Saúde Clínicas", tags: ["Saúde"], cadastro: "2026-04-14", contato: "adm@deltasaude.com.br", observacoes: "Contrato em renegociação.", reunioes: [] },
];

const TRABALHOS_DEMO: Trabalho[] = [
  { id: "tb-1", clienteId: "cc-arvo", data: "2026-04-08", servicos: ["Tradução juramentada"], descricao: "Tradução de contrato social para o espanhol.", status: "Concluído", pagamento: "Pago", valor: 1850 },
  { id: "tb-2", clienteId: "cc-arvo", data: "2026-05-15", servicos: ["Registro CDT"], descricao: "Registro de títulos e documentos.", status: "Concluído", pagamento: "Pago", valor: 640 },
  { id: "tb-3", clienteId: "cc-arvo", data: "2026-06-18", servicos: ["Tradução juramentada", "Registro CDT"], descricao: "Certificados de origem.", status: "Em andamento", pagamento: "Parcial", valor: 2300 },
  { id: "tb-4", clienteId: "cc-brisa", data: "2026-03-10", servicos: ["Sistemas"], descricao: "Sistema de pedidos — fase 1.", status: "Concluído", pagamento: "Pago", valor: 9800 },
  { id: "tb-5", clienteId: "cc-brisa", data: "2026-06-02", servicos: ["Sistemas"], descricao: "Sistema de pedidos — fase 2.", status: "Em andamento", pagamento: "Pendente", valor: 12400 },
  { id: "tb-6", clienteId: "cc-cedro", data: "2026-05-22", servicos: ["Marketing"], descricao: "Catálogo bilíngue de produtos.", status: "Concluído", pagamento: "Pendente", valor: 3200 },
  { id: "tb-7", clienteId: "cc-cedro", data: "2026-06-27", servicos: ["Tradução juramentada"], descricao: "Faturas comerciais para desembaraço.", status: "Pendente", pagamento: "Pendente", valor: 720 },
  { id: "tb-8", clienteId: "cc-delta", data: "2026-04-30", servicos: ["Marketing", "Sistemas"], descricao: "Site institucional e agendamento.", status: "Cancelado", pagamento: "Pendente", valor: 6500 },
];

export const clientesConsultoria = criarColecao<ClienteConsultoria[]>("consultoria-clientes", () => CLIENTES_DEMO);
export const trabalhos = criarColecao<Trabalho[]>("consultoria-trabalhos", () => TRABALHOS_DEMO);

export function useDadosConsultoria() {
  return { clientes: useColecao(clientesConsultoria), trabalhos: useColecao(trabalhos) };
}

/** Faturado = trabalhos não cancelados; recebido = os pagos (parcial conta metade). */
export function resumoTrabalhos(lista: Trabalho[]) {
  const validos = lista.filter((trabalho) => trabalho.status !== "Cancelado");
  const faturado = validos.reduce((soma, trabalho) => soma + trabalho.valor, 0);
  const recebido = validos.reduce(
    (soma, trabalho) => soma + (trabalho.pagamento === "Pago" ? trabalho.valor : trabalho.pagamento === "Parcial" ? trabalho.valor / 2 : 0),
    0,
  );
  return { quantidade: validos.length, faturado, recebido, aReceber: faturado - recebido };
}
