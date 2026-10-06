import type { ReactNode } from "react";

type Props = { rotulo: string; titulo: string; descricao?: string; acoes?: ReactNode };

export default function Cabecalho({ rotulo, titulo, descricao, acoes }: Props) {
  return (
    <header className="page-heading">
      <div>
        <span className="eyebrow">{rotulo}</span>
        <h1>{titulo}</h1>
        {descricao ? <p>{descricao}</p> : null}
      </div>
      {acoes ? <div className="heading-actions">{acoes}</div> : null}
    </header>
  );
}
