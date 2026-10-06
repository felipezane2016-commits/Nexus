import type { TarefaConta } from "@/modulos/contas/tipos";
import type { Reuniao } from "./tipos";

export type TipoEvento = "Reunião" | "Pagamento";

export type EventoAgenda = {
  id: string;
  data: string;
  hora: string | null;
  tipo: TipoEvento;
  titulo: string;
  detalhe: string;
  destino: string;
};

type Fontes = {
  reunioes: Reuniao[];
  tarefasContas: TarefaConta[];
};

/**
 * A agenda não tem dono próprio: é o cruzamento das reuniões com os
 * vencimentos de contas a pagar. Assim o calendário nunca
 * fica desatualizado em relação aos módulos.
 */
export function montarAgenda({ reunioes, tarefasContas }: Fontes): EventoAgenda[] {
  const eventos: EventoAgenda[] = [
    ...reunioes.map((reuniao) => ({
      id: reuniao.id,
      data: reuniao.data,
      hora: reuniao.hora,
      tipo: "Reunião" as const,
      titulo: reuniao.titulo,
      detalhe: [reuniao.local, reuniao.participantes].filter(Boolean).join(" · "),
      destino: "/calendario",
    })),
    ...tarefasContas
      .filter((tarefa) => tarefa.vencimento && !tarefa.concluida)
      .map((tarefa) => ({
        id: tarefa.id,
        data: tarefa.vencimento as string,
        hora: null,
        tipo: "Pagamento" as const,
        titulo: tarefa.nome,
        detalhe: tarefa.categoria,
        destino: "/contas",
      })),
  ];
  return eventos.sort((a, b) => (a.data + (a.hora ?? "99")).localeCompare(b.data + (b.hora ?? "99")));
}

export function eventosDoDia(eventos: EventoAgenda[], data: string) {
  return eventos.filter((evento) => evento.data === data);
}

/** Contas pendentes que vencem de hoje até `dias` à frente. */
export function vencendoEmBreve(tarefas: TarefaConta[], hoje: string, ate: string) {
  return tarefas
    .filter((tarefa) => !tarefa.concluida && tarefa.vencimento && tarefa.vencimento >= hoje && tarefa.vencimento <= ate)
    .sort((a, b) => (a.vencimento as string).localeCompare(b.vencimento as string));
}
