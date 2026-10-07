import { useCallback, useRef, useState, type ReactNode } from "react";
import { usarFecharFora } from "./usarFecharFora";

export type AcaoConta = { rotulo: string; icone: ReactNode; aoClicar: () => void };

type Props = { iniciais: string; nome: string; detalhe: string; acoes: AcaoConta[] };

/** Avatar do topo com o menu da conta. */
export default function MenuConta({ iniciais, nome, detalhe, acoes }: Props) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fechar = useCallback(() => setAberto(false), []);
  usarFecharFora(ref, aberto, fechar);

  return (
    <div className="topbar-menu" ref={ref}>
      <button type="button" className="topbar-avatar" aria-label={`Conta de ${nome}`} aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        <span className="avatar avatar-sm" aria-hidden="true">
          {iniciais}
        </span>
      </button>
      {aberto ? (
        <div className="topbar-dropdown account-menu" role="menu">
          <div className="account-menu-header">
            <span className="avatar avatar-sm" aria-hidden="true">
              {iniciais}
            </span>
            <div className="account-menu-header-text">
              <div className="account-menu-name">{nome}</div>
              <div className="account-menu-team">{detalhe}</div>
            </div>
          </div>
          {acoes.map((acao) => (
            <button
              key={acao.rotulo}
              type="button"
              role="menuitem"
              className="action-menu-item"
              onClick={() => {
                fechar();
                acao.aoClicar();
              }}
            >
              {acao.icone}
              <span>{acao.rotulo}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
