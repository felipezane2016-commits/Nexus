import { criarColecao, useColecao } from "@/_core/armazenamento/colecao";
import type { Documento, Reuniao, Tarefa } from "./tipos";

const TAREFAS_DEMO: Tarefa[] = [
  { id: "tf-1", titulo: "Revisar contrato de prestação com nova agência postal", descricao: "Cláusula de reajuste anual.", prioridade: "Alta", area: "Prestadores", responsavelId: "usr-ricardo", prazo: "2026-07-03", coluna: "andamento" },
  { id: "tf-2", titulo: "Revisar categorias de serviço dos prestadores", descricao: "Separar diligência de cartório.", prioridade: "Média", area: "Prestadores", responsavelId: "usr-helena", prazo: "2026-07-10", coluna: "backlog" },
  { id: "tf-3", titulo: "Fechar relatório de despesas reembolsáveis de junho", descricao: "", prioridade: "Alta", area: "Financeiro", responsavelId: "usr-caio", prazo: "2026-07-02", coluna: "revisao" },
  { id: "tf-4", titulo: "Treinar equipe no novo fluxo de conferência", descricao: "Mostrar a gaveta de lote e a devolução com nota.", prioridade: "Média", area: "Prestadores", responsavelId: "usr-fernanda", prazo: "2026-07-08", coluna: "backlog" },
  { id: "tf-5", titulo: "Organizar pasta de contratos 2025 no GED", descricao: "", prioridade: "Baixa", area: "Geral", responsavelId: "usr-bianca", prazo: null, coluna: "backlog" },
  { id: "tf-6", titulo: "Cobrar documento de faturamento — Ofício Central", descricao: "", prioridade: "Alta", area: "Prestadores", responsavelId: "usr-helena", prazo: "2026-06-29", coluna: "andamento" },
  { id: "tf-7", titulo: "Renovar certificado digital do escritório", descricao: "", prioridade: "Média", area: "Geral", responsavelId: "usr-fernanda", prazo: "2026-06-20", coluna: "concluido" },
];

const DOCUMENTOS_DEMO: Documento[] = [
  { id: "doc-1", nome: "Contrato de prestação — Rota Leve.pdf", categoria: "Contratos", tamanho: 284_000, data: "2026-06-21", enviadoPor: "Ricardo Alves" },
  { id: "doc-2", nome: "Tabela de valores de prestadores 2026.pdf", categoria: "Contratos", tamanho: 512_000, data: "2026-06-25", enviadoPor: "Helena Prado" },
  { id: "doc-3", nome: "Relatório mensal de prestadores — maio.xlsx", categoria: "Relatórios", tamanho: 96_000, data: "2026-06-05", enviadoPor: "Caio Lemos" },
  { id: "doc-4", nome: "Contrato de locação — sala 1203.pdf", categoria: "Contratos", tamanho: 1_240_000, data: "2026-04-18", enviadoPor: "Fernanda Moraes" },
  { id: "doc-5", nome: "Política de reembolso 2026.docx", categoria: "Outros", tamanho: 74_000, data: "2026-03-02", enviadoPor: "Fernanda Moraes" },
  { id: "doc-6", nome: "Relatório de câmbio — 1º semestre.pdf", categoria: "Relatórios", tamanho: 388_000, data: "2026-06-30", enviadoPor: "Ricardo Alves" },
];

const REUNIOES_DEMO: Reuniao[] = [
  { id: "re-1", titulo: "Alinhamento semanal de operações", data: "2026-06-30", hora: "09:30", local: "Sala 2", participantes: "Fernanda, Ricardo, Caio", pauta: "Conferência de junho; contas da semana." },
  { id: "re-2", titulo: "Conferência de junho com prestadores", data: "2026-06-30", hora: "15:00", local: "Teams", participantes: "Helena, Ricardo", pauta: "Recibos devolvidos e prazos de envio." },
  { id: "re-3", titulo: "Revisão do contrato da agência postal", data: "2026-07-02", hora: "11:00", local: "Sala 1", participantes: "Ricardo, Fernanda", pauta: "Reajuste anual e reativação do acesso ao portal." },
  { id: "re-4", titulo: "Fechamento do mês com a contabilidade", data: "2026-07-06", hora: "14:00", local: "Zoom", participantes: "Caio, Fernanda", pauta: "" },
  { id: "re-5", titulo: "Comitê mensal", data: "2026-07-14", hora: "10:00", local: "Sala 1", participantes: "Sócios", pauta: "Resultados do semestre." },
];

export const tarefas = criarColecao<Tarefa[]>("escritorio-tarefas", () => TAREFAS_DEMO);
export const documentos = criarColecao<Documento[]>("escritorio-documentos", () => DOCUMENTOS_DEMO);
export const reunioes = criarColecao<Reuniao[]>("escritorio-reunioes", () => REUNIOES_DEMO);

export function useDadosEscritorio() {
  return { tarefas: useColecao(tarefas), documentos: useColecao(documentos), reunioes: useColecao(reunioes) };
}

export function formatarTamanho(bytes: number) {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(bytes / 1000))} KB`;
}
