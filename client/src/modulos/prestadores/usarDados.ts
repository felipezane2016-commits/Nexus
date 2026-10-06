import { useColecao } from "@/_core/armazenamento/colecao";
import { fechamentos, prestadores, recibos } from "./colecoes";

/** As três coleções do módulo, já reativas. */
export function useDadosPrestadores() {
  return {
    prestadores: useColecao(prestadores),
    recibos: useColecao(recibos),
    fechamentos: useColecao(fechamentos),
  };
}
