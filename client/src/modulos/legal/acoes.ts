import { gerarId, HOJE } from "@/_core/tempo";
import { clientesLegal, processos } from "./colecoes";
import { nomeEtapa } from "./regras";
import type { ChaveEtapa, ClienteLegal, ComQuem, Comunicacao, Processo } from "./tipos";

export function salvarProcesso(processo: Processo) {
  processos.atualizar((lista) =>
    lista.some((item) => item.id === processo.id) ? lista.map((item) => (item.id === processo.id ? processo : item)) : [...lista, processo],
  );
}

export function novoIdProcesso(lista: Processo[]) {
  const maior = lista.reduce((max, item) => Math.max(max, Number.parseInt(item.id.replace(/\D/g, ""), 10) || 0), 1000);
  return `PR-${maior + 1}`;
}

/** Mudar de etapa zera o relógio do SLA e deixa rastro no histórico. */
export function moverEtapa(id: string, etapa: ChaveEtapa, autor: string) {
  processos.atualizar((lista) =>
    lista.map((processo) =>
      processo.id === id && processo.etapa !== etapa
        ? {
            ...processo,
            etapa,
            etapaDesde: HOJE,
            ultimaAtividade: HOJE,
            comunicacoes: [
              ...processo.comunicacoes,
              { id: gerarId("cm"), data: HOJE, tipo: "nota", descricao: `Etapa alterada para ${nomeEtapa(etapa)}`, autor },
            ],
          }
        : processo,
    ),
  );
}

export function registrarComunicacao(id: string, comunicacao: Omit<Comunicacao, "id">, comQuem: ComQuem) {
  processos.atualizar((lista) =>
    lista.map((processo) =>
      processo.id === id
        ? {
            ...processo,
            comQuem,
            // Registro retroativo não pode fazer o processo parecer mais parado.
            ultimaAtividade: comunicacao.data > processo.ultimaAtividade ? comunicacao.data : processo.ultimaAtividade,
            comunicacoes: [...processo.comunicacoes, { ...comunicacao, id: gerarId("cm") }].sort((a, b) => a.data.localeCompare(b.data)),
          }
        : processo,
    ),
  );
}

export function excluirProcesso(id: string) {
  processos.atualizar((lista) => lista.filter((processo) => processo.id !== id));
}

export function salvarClienteLegal(cliente: ClienteLegal) {
  clientesLegal.atualizar((lista) =>
    lista.some((item) => item.id === cliente.id) ? lista.map((item) => (item.id === cliente.id ? cliente : item)) : [...lista, cliente],
  );
}
