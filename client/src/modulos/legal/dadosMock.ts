import type { ClienteLegal, ConfigSla, Processo, Template } from "./tipos";

/** Empresas e pessoas fictícias — o link do protótipo é compartilhável. */

export const CLIENTES_LEGAL_DEMO: ClienteLegal[] = [
  { id: "cl-nordhaven", razaoBrasil: "Nordhaven Participações Ltda.", cnpjBrasil: "12.448.903/0001-20", razaoExterior: "Nordhaven Holdings AS", cnpjExterior: "", emails: "legal@nordhaven.no", pais: "Noruega", responsavel: "Helena Prado" },
  { id: "cl-alvora", razaoBrasil: "Alvora Brasil Comércio Ltda.", cnpjBrasil: "33.051.776/0001-41", razaoExterior: "Alvora GmbH", cnpjExterior: "", emails: "corporate@alvora.de", pais: "Alemanha", responsavel: "Rafael Bueno" },
  { id: "cl-pinecrest", razaoBrasil: "Pinecrest do Brasil S.A.", cnpjBrasil: "08.214.660/0001-09", razaoExterior: "Pinecrest Capital LLC", cnpjExterior: "", emails: "counsel@pinecrest.com", pais: "EUA", responsavel: "Helena Prado" },
  { id: "cl-lusitano", razaoBrasil: "Lusitano Engenharia Ltda.", cnpjBrasil: "27.905.118/0001-62", razaoExterior: "Lusitano SGPS, S.A.", cnpjExterior: "", emails: "juridico@lusitano.pt", pais: "Portugal", responsavel: "Caio Lemos" },
  { id: "cl-marelle", razaoBrasil: "Marelle Cosméticos Ltda.", cnpjBrasil: "41.338.207/0001-85", razaoExterior: "Marelle SAS", cnpjExterior: "", emails: "direction@marelle.fr, legal@marelle.fr", pais: "França", responsavel: "Rafael Bueno" },
];

function c(id: string, data: string, tipo: Processo["comunicacoes"][number]["tipo"], descricao: string, autor = "Helena Prado") {
  return { id, data, tipo, descricao, autor };
}

export const PROCESSOS_DEMO: Processo[] = [
  {
    id: "PR-1041", clienteId: "cl-nordhaven", tipo: "Societária", responsavel: "Helena Prado", vencimento: "2026-07-31",
    comQuem: "cliente", traducao: true, observacoes: "Sócio estrangeiro assina em Oslo.", etapa: "exterior",
    etapaDesde: "2026-06-08", criadoEm: "2026-05-12", ultimaAtividade: "2026-06-19",
    comunicacoes: [
      c("cm-1", "2026-05-12", "nota", "Processo criado · proposta a enviar"),
      c("cm-2", "2026-05-13", "email_enviado", "Proposta de renovação enviada."),
      c("cm-3", "2026-05-20", "resposta_recebida", "Cliente aprovou a proposta."),
      c("cm-4", "2026-06-08", "original_enviado", "Minutas enviadas via DHL para Oslo."),
      c("cm-5", "2026-06-19", "ligacao", "Cliente confirmou recebimento; assinatura prevista para a próxima semana."),
    ],
  },
  {
    id: "PR-1046", clienteId: "cl-alvora", tipo: "Fiscal", responsavel: "Rafael Bueno", vencimento: "2026-09-15",
    comQuem: "escritorio", traducao: false, observacoes: "", etapa: "minuta",
    etapaDesde: "2026-06-24", criadoEm: "2026-06-10", ultimaAtividade: "2026-06-26",
    comunicacoes: [
      c("cm-6", "2026-06-10", "nota", "Processo criado · proposta a enviar", "Rafael Bueno"),
      c("cm-7", "2026-06-11", "email_enviado", "Proposta enviada.", "Rafael Bueno"),
      c("cm-8", "2026-06-24", "resposta_recebida", "Aceite recebido por e-mail.", "Rafael Bueno"),
      c("cm-9", "2026-06-26", "nota", "Minuta em revisão interna.", "Rafael Bueno"),
    ],
  },
  {
    id: "PR-1049", clienteId: "cl-pinecrest", tipo: "Geral", responsavel: "Helena Prado", vencimento: "2026-08-20",
    comQuem: "cliente", traducao: true, observacoes: "", etapa: "aceite",
    etapaDesde: "2026-06-15", criadoEm: "2026-06-15", ultimaAtividade: "2026-06-17",
    comunicacoes: [
      c("cm-10", "2026-06-15", "email_enviado", "Proposta enviada para counsel@pinecrest.com."),
      c("cm-11", "2026-06-17", "email_retornado", "Endereço recusou a mensagem — confirmar novo contato."),
    ],
  },
  {
    id: "PR-1052", clienteId: "cl-lusitano", tipo: "Societária", responsavel: "Caio Lemos", vencimento: "2026-11-30",
    comQuem: "escritorio", traducao: true, observacoes: "Tradução de PT-PT dispensada pelo cartório? Confirmar.", etapa: "cotacao",
    etapaDesde: "2026-06-25", criadoEm: "2026-04-22", ultimaAtividade: "2026-06-25",
    comunicacoes: [
      c("cm-12", "2026-04-22", "nota", "Processo criado", "Caio Lemos"),
      c("cm-13", "2026-06-22", "doc_recebido", "Originais assinados chegaram de Lisboa.", "Caio Lemos"),
      c("cm-14", "2026-06-25", "cotacao_enviada", "Pedido de cotação à tradutora.", "Caio Lemos"),
    ],
  },
  {
    id: "PR-1038", clienteId: "cl-marelle", tipo: "Societária", responsavel: "Rafael Bueno", vencimento: "2026-12-10",
    comQuem: "escritorio", traducao: true, observacoes: "", etapa: "traducao",
    etapaDesde: "2026-06-12", criadoEm: "2026-03-30", ultimaAtividade: "2026-06-12",
    comunicacoes: [
      c("cm-15", "2026-06-10", "cotacao_aprovada", "Cliente aprovou R$ 2.480,00 de tradução.", "Rafael Bueno"),
      c("cm-16", "2026-06-12", "traducao", "Tradução juramentada solicitada.", "Rafael Bueno"),
    ],
  },
  {
    id: "PR-1029", clienteId: "cl-alvora", tipo: "Societária", responsavel: "Rafael Bueno", vencimento: "2027-05-30",
    comQuem: "escritorio", traducao: true, observacoes: "", etapa: "finalizado",
    etapaDesde: "2026-05-28", criadoEm: "2026-02-03", ultimaAtividade: "2026-05-28",
    comunicacoes: [c("cm-17", "2026-05-28", "registro", "Procuração registrada na Junta.", "Rafael Bueno")],
  },
  {
    id: "PR-1055", clienteId: "cl-nordhaven", tipo: "Fiscal", responsavel: "Helena Prado", vencimento: null,
    comQuem: "escritorio", traducao: false, observacoes: "", etapa: "proposta",
    etapaDesde: "2026-06-29", criadoEm: "2026-06-29", ultimaAtividade: "2026-06-29",
    comunicacoes: [c("cm-18", "2026-06-29", "nota", "Processo criado · proposta a enviar")],
  },
];

export const TEMPLATES_DEMO: Template[] = [
  {
    id: "tp-proposta", nome: "Envio de proposta", gatilho: "Ao criar o processo",
    corpo: "Prezado(a) {{nome_cliente}},\n\nConforme conversamos, segue a proposta para renovação da procuração da {{empresa}}.\n\nResumo dos serviços:\n• Elaboração e revisão das minutas\n• Envio por courier internacional\n• Coordenação da tradução juramentada\n• Registro no órgão competente\n\nPrazo estimado: {{prazo_dias}} dias úteis.\n\nAtenciosamente,\n{{nome_advogado}}",
  },
  {
    id: "tp-followup", nome: "Follow-up de proposta", gatilho: "Automático · 3 dias sem resposta",
    corpo: "Prezado(a) {{nome_cliente}},\n\nGostaríamos de confirmar se teve a oportunidade de analisar nossa proposta para a {{empresa}}.\n\nO prazo estimado segue de {{prazo_dias}} dias úteis.\n\nAtenciosamente,\n{{nome_advogado}}",
  },
  {
    id: "tp-minutas", nome: "Envio de minutas", gatilho: "Manual · após aprovação da proposta",
    corpo: "Prezado(a) {{nome_cliente}},\n\nEncaminhamos as minutas de procuração da {{empresa}} para assinatura.\n\nPrazo para retorno: {{prazo_assinatura}} dias úteis.\n\n{{nome_advogado}}",
  },
  {
    id: "tp-status", nome: "Atualização de status", gatilho: "Automático · ao mudar de etapa",
    corpo: "Prezado(a) {{nome_cliente}},\n\nO processo de procuração da {{empresa}} avançou para a etapa:\n\n{{nova_etapa}}\n\n{{nome_advogado}}",
  },
  {
    id: "tp-pronto", nome: "Documentos prontos", gatilho: "Manual · ao finalizar o processo",
    corpo: "Prezado(a) {{nome_cliente}},\n\nOs documentos de procuração da {{empresa}} estão prontos e registrados.\n\nObrigado pela confiança!\n\n{{nome_advogado}}\n{{escritorio}}",
  },
];

export const SLA_DEMO: ConfigSla = {
  dias: { proposta: 5, aceite: 5, minuta: 3, exterior: 25, recebido: 3, cotacao: 2, aprovacao: 3, traducao: 8, registro: 5, finalizado: 0 },
  regras: [
    { id: "rg-1", titulo: "Follow-up de proposta", descricao: "Cliente sem resposta em 3 dias → e-mail automático", ativa: true },
    { id: "rg-2", titulo: "Alerta de atraso", descricao: "SLA ultrapassado → avisa o responsável e escala em 24 h", ativa: true },
    { id: "rg-3", titulo: "Follow-up de orçamento", descricao: "Orçamento não aprovado em 3 dias → follow-up automático", ativa: true },
    { id: "rg-4", titulo: "Lembrete de cotação", descricao: "Tradutora sem resposta em 48 h → lembrete e alternativa", ativa: true },
    { id: "rg-5", titulo: "Follow-up por WhatsApp", descricao: "Depende de integração com WhatsApp Business", ativa: false },
  ],
};
