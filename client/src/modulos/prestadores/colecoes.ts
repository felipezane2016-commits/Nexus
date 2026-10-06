import { criarColecao } from "@/_core/armazenamento/colecao";
import type { Closing, Receipt } from "@/lib/portal";
import { FECHAMENTOS_DEMO, PRESTADORES_DEMO, RECIBOS_DEMO } from "./dadosMock";
import type { Prestador } from "./tipos";

/** Donas únicas desses dados: o portal e o admin leem e gravam só por aqui. */
export const prestadores = criarColecao<Prestador[]>("prestadores", () => PRESTADORES_DEMO, { vazio: () => [] });
export const recibos = criarColecao<Receipt[]>("recibos", () => RECIBOS_DEMO, { vazio: () => [] });
export const fechamentos = criarColecao<Closing[]>("fechamentos", () => FECHAMENTOS_DEMO, { vazio: () => [] });
