import { useTheme } from "@/contexts/ThemeContext";
import { usePortal } from "@/contexts/PortalContext";
import {
  Bell,
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Receipt,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";

const NAV_ITEMS = [
  { path: "/", label: "Visão geral", icon: LayoutDashboard },
  { path: "/recibos", label: "Meus recibos", icon: Receipt },
  { path: "/fechamento", label: "Fechamento mensal", icon: CalendarCheck },
] as const;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function PortalShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { provider, receipts, signOut } = usePortal();
  const { theme, toggleTheme } = useTheme();
  const [location, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Fecha a gaveta a cada navegação, senão ela cobre a página recém-aberta.
  useEffect(() => setMenuOpen(false), [location]);

  const draftCount = receipts.filter(
    receipt => receipt.status === "Rascunho"
  ).length;
  const rejectedCount = receipts.filter(
    receipt => receipt.status === "Rejeitado"
  ).length;

  function handleSignOut() {
    signOut();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside
        className={menuOpen ? "sidebar sidebar-aberta" : "sidebar"}
        aria-label="Navegação principal"
      >
        <div className="brand-row">
          <span className="brand-mark" aria-hidden="true">
            N
          </span>
          <span className="brand-copy">Nexus Portal do Prestador</span>
          <button
            type="button"
            className="icon-button sidebar-close"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          >
            <X size={17} strokeWidth={2} />
          </button>
        </div>

        <p className="sidebar-section-label">Principal</p>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = location === item.path;
            const badge =
              item.path === "/recibos" && draftCount > 0 ? draftCount : null;
            return (
              <button
                key={item.path}
                type="button"
                className={active ? "nav-item nav-active" : "nav-item"}
                aria-current={active ? "page" : undefined}
                onClick={() => navigate(item.path)}
              >
                <Icon size={17} strokeWidth={1.9} />
                {item.label}
                {badge ? (
                  <span
                    className="nav-count"
                    aria-label={`${badge} rascunho(s)`}
                  >
                    {badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-account">
            <div className="avatar" aria-hidden="true">
              {initials(provider.name)}
            </div>
            <div>
              <strong>{provider.name}</strong>
              <span>{provider.code}</span>
            </div>
          </div>
          <button type="button" className="nav-item" onClick={handleSignOut}>
            <LogOut size={17} strokeWidth={1.9} />
            Sair do portal
          </button>
        </div>
      </aside>

      {menuOpen ? (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <div className="main-shell">
        <header className="topbar">
          <button
            type="button"
            className="icon-button menu-button"
            aria-label="Abrir menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={18} strokeWidth={2} />
          </button>
          <nav className="breadcrumbs" aria-label="Trilha">
            <span>Portal do Prestador</span>
            <span aria-hidden="true">/</span>
            <strong>{title}</strong>
          </nav>
          <div className="topbar-actions">
            {toggleTheme ? (
              <button
                type="button"
                className="icon-button"
                aria-label={
                  theme === "dark" ? "Usar tema claro" : "Usar tema escuro"
                }
                onClick={toggleTheme}
              >
                {theme === "dark" ? (
                  <Sun size={17} strokeWidth={1.9} />
                ) : (
                  <Moon size={17} strokeWidth={1.9} />
                )}
              </button>
            ) : null}
            <button
              type="button"
              className={
                rejectedCount > 0
                  ? "icon-button notification-dot"
                  : "icon-button"
              }
              aria-label={
                rejectedCount > 0
                  ? `${rejectedCount} recibo(s) devolvido(s)`
                  : "Sem novidades"
              }
              onClick={() => navigate("/recibos")}
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
