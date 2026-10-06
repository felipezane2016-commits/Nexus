import { X } from "lucide-react";
import { useId, type ReactNode } from "react";
import { usarModal } from "./usarModal";

type Props = {
  rotulo: string;
  titulo: string;
  subtitulo?: ReactNode;
  aoFechar: () => void;
  rodape?: ReactNode;
  children: ReactNode;
};

/** Gaveta lateral: abre o detalhe de um registro sem tirar a pessoa da lista. */
export default function Gaveta({ rotulo, titulo, subtitulo, aoFechar, rodape, children }: Props) {
  const raiz = usarModal(aoFechar);
  const tituloId = useId();
  return (
    <>
      <div className="drawer-backdrop" onMouseDown={aoFechar} />
      <aside ref={raiz} className="drawer-panel" role="dialog" aria-modal="true" aria-labelledby={tituloId}>
        <div className="modal-panel-header">
          <div className="drawer-head-copy">
            <span className="eyebrow">{rotulo}</span>
            <h2 id={tituloId}>{titulo}</h2>
            {subtitulo ? <p>{subtitulo}</p> : null}
          </div>
          <button type="button" className="icon-button" aria-label="Fechar" data-fechar onClick={aoFechar}>
            <X size={17} strokeWidth={2} />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {rodape ? <div className="drawer-footer">{rodape}</div> : null}
      </aside>
    </>
  );
}
