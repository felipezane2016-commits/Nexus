import CabecalhoPagina from "@/components/CabecalhoPagina";
import type { ReactNode } from "react";

type Props = { rotulo?: string; titulo: string; descricao?: string; acoes?: ReactNode };

export default function Cabecalho({ rotulo, titulo, descricao, acoes }: Props) {
  return <CabecalhoPagina rotulo={rotulo} titulo={titulo} descricao={descricao} acoes={acoes} />;
}
