import { gerarId, HOJE } from "@/_core/tempo";
import { notificar } from "@/modulos/notificacoes/colecao";
import { ordens } from "./colecoes";
import { formatarMoeda, formatarTaxa } from "./formato";
import { dataDoPrazo } from "./regras";
import type { Decisao, Ordem, PrazoDecisao } from "./tipos";

/**
 * Passos do fluxo de ordens. Cada um preenche a data da etapa e deixa uma
 * linha no histórico da ordem — a ficha mostra quem fez o quê e quando.
 */

const agora = () => new Date().toISOString();

function alterar(id: string, autor: string, texto: string, mudar: (ordem: Ordem) => Partial<Ordem>) {
  ordens.atualizar((lista) =>
    lista.map((ordem) => (ordem.id === id ? { ...ordem, ...mudar(ordem), historico: [...ordem.historico, { quando: agora(), autor, texto }] } : ordem)),
  );
}

const rotulo = (ordem: Ordem) => `${ordem.cliente} — ${formatarMoeda(ordem.valor, ordem.moeda)} (nº ${ordem.numeroOrdem})`;

export function novaOrdemVazia(): Ordem {
  return {
    id: gerarId("ord"),
    numeroOrdem: "",
    dataRecebimento: HOJE,
    cliente: "",
    beneficiario: "Pacheco Neto Sanden Teisseire Advogados",
    moeda: "EUR",
    valor: 0,
    invoices: [],
    bloqueiaEmails: false,
    observacoes: "",
    invoiceEnviadaEm: null,
    okBancoEm: null,
    enviadaSuperioresEm: null,
    decisao: null,
    fechamento: null,
    respostaBancoEm: null,
    baixa: { sisjuri: null, extrato: null, contrato: null },
    historico: [],
  };
}

export function salvarOrdem(ordem: Ordem, autor: string) {
  const existe = ordens.ler().some((item) => item.id === ordem.id);
  if (!existe) {
    ordens.atualizar((lista) => [...lista, { ...ordem, historico: [{ quando: agora(), autor, texto: `Ordem nº ${ordem.numeroOrdem} recebida do Banco Industrial.` }] }]);
    return;
  }
  const { historico: _historico, ...dados } = ordem;
  alterar(ordem.id, autor, "Dados da ordem editados.", () => dados);
}

export function registrarInvoiceEnviada(id: string, autor: string) {
  alterar(id, autor, "Invoice(s) enviada(s) ao Banco Industrial.", () => ({ invoiceEnviadaEm: HOJE }));
}

export function registrarOkBanco(id: string, autor: string) {
  alterar(id, autor, "Banco Industrial deu OK para o fechamento.", () => ({ okBancoEm: HOJE }));
}

export function registrarEnvioSuperiores(ids: string[], autor: string) {
  ids.forEach((id) => alterar(id, autor, "Cotação enviada aos superiores.", () => ({ enviadaSuperioresEm: HOJE })));
  notificar({
    tipo: "tarefa",
    titulo: ids.length === 1 ? "Ordem aguardando sua decisão" : `${ids.length} ordens aguardando sua decisão`,
    corpo: "Cotação do dia enviada. Decida: aguardar o câmbio ou fechar em D+0, D+1 ou D+2.",
    destino: "/contas/ordens",
  });
}

export function registrarDecisao(
  id: string,
  dados: { prazo: PrazoDecisao; taxaAlvo: number | null; observacao: string; canal: Decisao["canal"]; decididoPor: string },
  autor: string,
) {
  const decisao: Decisao = { ...dados, taxaAlvo: dados.prazo === "Aguardar" ? dados.taxaAlvo : null, dataFechamento: dataDoPrazo(dados.prazo, HOJE), quando: agora() };
  const texto =
    dados.prazo === "Aguardar"
      ? `Decisão de ${dados.decididoPor}: aguardar${dados.taxaAlvo ? ` até o BIB chegar a ${formatarTaxa(dados.taxaAlvo)}` : ""}${dados.canal === "E-mail" ? " (por e-mail)" : ""}.`
      : `Decisão de ${dados.decididoPor}: fechar em ${dados.prazo}${dados.canal === "E-mail" ? " (por e-mail)" : ""}.`;
  alterar(id, autor, texto, () => ({ decisao }));
  const ordem = ordens.ler().find((item) => item.id === id);
  if (ordem && dados.canal === "Sistema")
    notificar({ tipo: "agenda", titulo: `Decisão: ${dados.prazo}`, corpo: `${rotulo(ordem)} — ${texto}`, destino: "/contas/ordens" });
}

export function registrarFechamento(id: string, dados: { cotacao: number; data: string; quemFechou: string }, autor: string) {
  alterar(id, autor, `Câmbio fechado a ${formatarTaxa(dados.cotacao)} (${dados.quemFechou}).`, () => ({
    fechamento: { cotacao: dados.cotacao, data: dados.data, responsavel: autor, quemFechou: dados.quemFechou },
  }));
}

export function registrarResposta(id: string, autor: string) {
  alterar(id, autor, "Resposta com a cotação e as invoices enviada ao banco.", () => ({ respostaBancoEm: HOJE }));
}

export type ItemBaixa = keyof Ordem["baixa"];
const TEXTO_BAIXA: Record<ItemBaixa, string> = {
  sisjuri: "Baixa das invoices no Sisjuri",
  extrato: "Extrato do Banco Industrial lançado",
  contrato: "Contrato de câmbio assinado na plataforma do banco",
};

export function marcarBaixa(id: string, item: ItemBaixa, feito: boolean, autor: string) {
  alterar(id, autor, `${TEXTO_BAIXA[item]}${feito ? "" : " — desmarcado"}.`, (ordem) => ({ baixa: { ...ordem.baixa, [item]: feito ? HOJE : null } }));
}

/** Volta a ordem uma etapa — para quando um passo foi marcado por engano. */
export function voltarEtapa(id: string, autor: string) {
  const ordem = ordens.ler().find((item) => item.id === id);
  if (!ordem) return;
  const campos: (keyof Ordem)[] = ["respostaBancoEm", "fechamento", "decisao", "enviadaSuperioresEm", "okBancoEm", "invoiceEnviadaEm"];
  const ultimo = campos.find((campo) => ordem[campo]);
  if (!ultimo || Object.values(ordem.baixa).some(Boolean)) return;
  alterar(id, autor, "Etapa desfeita.", () => ({ [ultimo]: null }));
}
