import { X } from "lucide-react";
import { useId, type FormEvent, type ReactNode } from "react";
import { usarModal } from "./usarModal";

type Props = {
  rotulo: string;
  titulo: string;
  descricao?: string;
  aoFechar: () => void;
  /** Com aoEnviar, o corpo vira um formulário e o rodapé recebe os botões. */
  aoEnviar?: () => void;
  textoEnviar?: string;
  rodapeExtra?: ReactNode;
  children: ReactNode;
};

/** Painel flutuante para formulários curtos. */
export default function Painel({ rotulo, titulo, descricao, aoFechar, aoEnviar, textoEnviar, rodapeExtra, children }: Props) {
  const raiz = usarModal(aoFechar);
  const tituloId = useId();

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    aoEnviar?.();
  }

  const corpo = (
    <>
      {children}
      {aoEnviar ? (
        <div className="modal-panel-footer">
          {rodapeExtra ? <div className="modal-rodape-extra">{rodapeExtra}</div> : null}
          <button type="button" className="button-secondary" onClick={aoFechar}>
            Cancelar
          </button>
          <button type="submit" className="button-primary">
            {textoEnviar ?? "Salvar"}
          </button>
        </div>
      ) : null}
    </>
  );

  return (
    <div className="modal-backdrop" onMouseDown={(evento) => evento.target === evento.currentTarget && aoFechar()}>
      <div ref={raiz} className="modal-panel" role="dialog" aria-modal="true" aria-labelledby={tituloId}>
        <div className="modal-panel-header">
          <div>
            <span className="eyebrow">{rotulo}</span>
            <h2 id={tituloId}>{titulo}</h2>
            {descricao ? <p>{descricao}</p> : null}
          </div>
          <button type="button" className="icon-button" aria-label="Fechar" data-fechar onClick={aoFechar}>
            <X size={17} strokeWidth={2} />
          </button>
        </div>
        {aoEnviar ? (
          <form className="modal-panel-body" onSubmit={enviar} noValidate>
            {corpo}
          </form>
        ) : (
          <div className="modal-panel-body">{corpo}</div>
        )}
      </div>
    </div>
  );
}
