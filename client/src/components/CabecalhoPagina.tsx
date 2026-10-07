import type { ReactNode } from "react";

/**
 * Abertura de página, como na Central de Operações PNST: sobrelinha em
 * laranja, título e descrição dentro do conteúdo; o topo fixo mostra só o
 * nome da seção, a busca e as ações da conta.
 */
type Props = { rotulo?: ReactNode; titulo: ReactNode; descricao?: ReactNode; acoes?: ReactNode };

export default function CabecalhoPagina({ rotulo, titulo, descricao, acoes }: Props) {
  return (
    <header className="page-heading">
      <div className="page-heading-copy">
        {rotulo ? <span className="eyebrow accent-eyebrow">{rotulo}</span> : null}
        <h1>{titulo}</h1>
        {descricao ? <p>{descricao}</p> : null}
      </div>
      {acoes ? <div className="heading-actions">{acoes}</div> : null}
    </header>
  );
}
