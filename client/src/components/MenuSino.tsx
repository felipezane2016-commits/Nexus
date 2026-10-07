import { Bell, CircleAlert, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { usarFecharFora } from "./usarFecharFora";

export type AvisoSino = { id: string; titulo: string; detalhe: string; abrir: () => void };

type Props = { avisos: AvisoSino[]; vazio: string; rodape?: { rotulo: string; abrir: () => void } };

/** Sino do topo: abre a lista do que pede atenção, como na referência. */
export default function MenuSino({ avisos, vazio, rodape }: Props) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fechar = useCallback(() => setAberto(false), []);
  usarFecharFora(ref, aberto, fechar);

  return (
    <div className="topbar-menu" ref={ref}>
      <button
        type="button"
        className={avisos.length > 0 ? "icon-button notification-dot" : "icon-button"}
        aria-label={avisos.length > 0 ? `${avisos.length} aviso(s)` : "Notificações"}
        aria-expanded={aberto}
        onClick={() => setAberto((valor) => !valor)}
      >
        <Bell size={17} strokeWidth={1.9} />
      </button>
      {aberto ? (
        <div className="topbar-dropdown notification-menu" role="dialog" aria-label="Notificações">
          <div className="notification-menu-header">
            <strong>Notificações</strong>
            <button type="button" className="notification-menu-close" aria-label="Fechar" onClick={fechar}>
              <X size={14} strokeWidth={2} />
            </button>
          </div>
          {avisos.length === 0 ? (
            <div className="notification-menu-empty">
              <Bell size={20} strokeWidth={1.8} />
              <span>{vazio}</span>
            </div>
          ) : (
            <div className="notification-list">
              {avisos.slice(0, 6).map((aviso) => (
                <button
                  key={aviso.id}
                  type="button"
                  className="notification-item"
                  onClick={() => {
                    fechar();
                    aviso.abrir();
                  }}
                >
                  <CircleAlert size={14} strokeWidth={2} />
                  <span>
                    <strong>{aviso.titulo}</strong>
                    <small>{aviso.detalhe}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
          {rodape ? (
            <button
              type="button"
              className="notification-menu-footer"
              onClick={() => {
                fechar();
                rodape.abrir();
              }}
            >
              {rodape.rotulo}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
