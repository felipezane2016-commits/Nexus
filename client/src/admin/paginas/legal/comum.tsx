import type { Tom } from "@/admin/componentes/Selo";
import Selo from "@/admin/componentes/Selo";
import type { SituacaoPrazo } from "@/modulos/legal/regras";
import type { ComQuem } from "@/modulos/legal/tipos";

export const TOM_PRAZO: Record<SituacaoPrazo, Tom> = {
  "Em dia": "green",
  "Em risco": "amber",
  Atrasado: "red",
  Concluído: "neutral",
  "Sem prazo": "neutral",
};

/** Com quem está a próxima ação. Âmbar para o cliente: é espera, não problema. */
export function SeloComQuem({ comQuem }: { comQuem: ComQuem }) {
  return comQuem === "cliente" ? <Selo tom="amber">Com o cliente</Selo> : <Selo tom="blue">Com o escritório</Selo>;
}
