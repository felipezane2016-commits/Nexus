import CabecalhoPagina from "@/components/CabecalhoPagina";
import type { ReactNode } from "react";

/** `rotulo` fica no código para contexto, mas o topo mostra só título e descrição. */
type Props = { rotulo?: string; titulo: string; descricao?: string; acoes?: ReactNode };

export default function Cabecalho({ titulo, descricao, acoes }: Props) {
  return <CabecalhoPagina titulo={titulo} descricao={descricao} acoes={acoes} />;
}
