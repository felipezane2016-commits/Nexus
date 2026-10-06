import { useColecao } from "@/_core/armazenamento/colecao";
import { iniciais, pode, PAPEIS, veModulo, type Usuario } from "@/_core/identidade/permissoes";
import { sair } from "@/_core/identidade/sessao";
import { useTheme } from "@/contexts/ThemeContext";
import { notificacoes } from "@/modulos/notificacoes/colecao";
import { fechamentos, prestadores, recibos } from "@/modulos/prestadores/colecoes";
import { montarLotes } from "@/modulos/prestadores/regras";
import { ArrowLeft, Bell, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { itemAtivo, MENU_ESCRITORIO, menuDaRota, type Contador, type Grupo, type ItemMenu } from "./menu";

/** Primeira rota que a pessoa pode abrir no escritório. */
export function rotaInicial(usuario: Usuario) {
  for (const grupo of MENU_ESCRITORIO) {
    for (const item of grupo.itens) {
      if (item.modulo && veModulo(usuario, item.modulo)) return item.rota;
    }
  }
  return "/notificacoes";
}

function visivel(usuario: Usuario, item: ItemMenu) {
  if (item.exige && !pode(usuario, item.exige)) return false;
  if (item.modulo && !veModulo(usuario, item.modulo)) return false;
  return true;
}

function useContadores(): Record<Contador, number> {
  const avisos = useColecao(notificacoes);
  const listaRecibos = useColecao(recibos);
  const listaFechamentos = useColecao(fechamentos);
  const listaPrestadores = useColecao(prestadores);
  return useMemo(
    () => ({
      notificacoes: avisos.filter((aviso) => !aviso.lida).length,
      conferencia: montarLotes(listaRecibos, listaFechamentos, listaPrestadores).filter(
        (lote) => lote.situacao === "Aguardando conferência" || lote.pendentes > 0,
      ).length,
    }),
    [avisos, listaRecibos, listaFechamentos, listaPrestadores],
  );
}

type Props = { usuario: Usuario; titulo: string; children: ReactNode };

export default function CascaAdmin({ usuario, titulo, children }: Props) {
  const { theme, toggleTheme } = useTheme();
  const [caminho, navegar] = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const contadores = useContadores();

  // Fecha a gaveta a cada navegação, senão ela cobre a página recém-aberta.
  useEffect(() => {
    setMenuAberto(false);
  }, [caminho]);

  const menuModulo = menuDaRota(caminho);
  const grupos: Grupo[] = (menuModulo ? menuModulo.grupos : MENU_ESCRITORIO)
    .map((grupo) => ({ ...grupo, itens: grupo.itens.filter((item) => visivel(usuario, item)) }))
    .filter((grupo) => grupo.itens.length > 0);
  const ativo = itemAtivo(
    grupos.flatMap((grupo) => grupo.itens),
    caminho,
  );

  function sairDoAdmin() {
    sair();
    navegar("/login");
  }

  return (
    <div className="app-shell">
      <aside className={menuAberto ? "sidebar sidebar-aberta" : "sidebar"} aria-label="Navegação principal">
        <div className="brand-row">
          <span className="brand-mark" aria-hidden="true">
            N
          </span>
          <span className="brand-copy">Nexus Escritório</span>
          <button type="button" className="icon-button sidebar-close" aria-label="Fechar menu" onClick={() => setMenuAberto(false)}>
            <X size={17} strokeWidth={2} />
          </button>
        </div>

        <div className="sidebar-scroll">
          {menuModulo ? (
            <>
              <button type="button" className="nav-item sidebar-back" onClick={() => navegar(rotaInicial(usuario))}>
                <ArrowLeft size={16} strokeWidth={2} />
                Voltar ao escritório
              </button>
              <p className="sidebar-module-title">{menuModulo.titulo}</p>
            </>
          ) : null}

          {grupos.map((grupo) => (
            <div key={grupo.rotulo}>
              <p className="sidebar-section-label">{grupo.rotulo}</p>
              <nav className="sidebar-nav" aria-label={grupo.rotulo}>
                {grupo.itens.map((item) => {
                  const Icone = item.icone;
                  const estaAtivo = ativo?.rota === item.rota;
                  const contagem = item.contador ? contadores[item.contador] : 0;
                  return (
                    <button
                      key={item.rota}
                      type="button"
                      className={estaAtivo ? "nav-item nav-active" : "nav-item"}
                      aria-current={estaAtivo ? "page" : undefined}
                      onClick={() => navegar(item.rota)}
                    >
                      <Icone size={17} strokeWidth={1.9} />
                      {item.rotulo}
                      {contagem > 0 ? (
                        <span className="nav-count" aria-label={`${contagem} pendente(s)`}>
                          {contagem}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-account">
            <div className="avatar" aria-hidden="true">
              {iniciais(usuario.nome)}
            </div>
            <div>
              <strong>{usuario.nome}</strong>
              <span>
                {PAPEIS[usuario.papel].nome} · {usuario.departamento}
              </span>
            </div>
          </div>
          <button type="button" className="nav-item" onClick={sairDoAdmin}>
            <LogOut size={17} strokeWidth={1.9} />
            Sair
          </button>
        </div>
      </aside>

      {menuAberto ? (
        <button type="button" className="sidebar-overlay" aria-label="Fechar menu" onClick={() => setMenuAberto(false)} />
      ) : null}

      <div className="main-shell">
        <header className="topbar">
          <button type="button" className="icon-button menu-button" aria-label="Abrir menu" onClick={() => setMenuAberto(true)}>
            <Menu size={18} strokeWidth={2} />
          </button>
          <nav className="breadcrumbs" aria-label="Trilha">
            <span>Escritório</span>
            {menuModulo ? (
              <>
                <span aria-hidden="true">/</span>
                <span>{menuModulo.titulo}</span>
              </>
            ) : null}
            <span aria-hidden="true">/</span>
            <strong>{titulo}</strong>
          </nav>
          <div className="topbar-actions">
            {toggleTheme ? (
              <button
                type="button"
                className="icon-button"
                aria-label={theme === "dark" ? "Usar tema claro" : "Usar tema escuro"}
                onClick={toggleTheme}
              >
                {theme === "dark" ? <Sun size={17} strokeWidth={1.9} /> : <Moon size={17} strokeWidth={1.9} />}
              </button>
            ) : null}
            <button
              type="button"
              className={contadores.notificacoes > 0 ? "icon-button notification-dot" : "icon-button"}
              aria-label={contadores.notificacoes > 0 ? `${contadores.notificacoes} notificação(ões) não lida(s)` : "Notificações"}
              onClick={() => navegar("/notificacoes")}
            >
              <Bell size={17} strokeWidth={1.9} />
            </button>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
