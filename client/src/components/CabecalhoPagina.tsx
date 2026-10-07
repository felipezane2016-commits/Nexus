import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * O título da página mora no topo fixo da casca, não no miolo: a casca expõe
 * um encaixe e cada página declara o seu título, que é levado para lá por
 * portal. Assim o título continua visível ao rolar e a página não precisa
 * saber como a casca é montada.
 */
export const EncaixeCabecalho = createContext<HTMLElement | null>(null);

type Props = { titulo: ReactNode; descricao?: ReactNode; acoes?: ReactNode };

export default function CabecalhoPagina({ titulo, descricao, acoes }: Props) {
  const encaixe = useContext(EncaixeCabecalho);
  const conteudo = (
    <div className="page-heading">
      <div className="page-heading-copy">
        <h1>{titulo}</h1>
        {descricao ? <p>{descricao}</p> : null}
      </div>
      {acoes ? <div className="heading-actions">{acoes}</div> : null}
    </div>
  );
  // Fora de uma casca (ou no primeiro render, antes do encaixe existir) não
  // há onde pôr o título; a casca re-renderiza assim que o encaixe monta.
  return encaixe ? createPortal(conteudo, encaixe) : null;
}
