import logo from "@/assets/pnst-logo.webp";
import { usePortal } from "@/contexts/PortalContext";
import {
  CalendarCheck,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Receipt,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
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
  const [location, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Fecha o menu mobile a cada navegação.
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
    <div className="portal-shell">
      <aside className={menuOpen ? "sidebar sidebar-open" : "sidebar"}>
        <div className="sidebar-top">
          <div className="brand-logo-wrap">
            <img
              className="brand-logo"
              src={logo}
              alt="Pacheco Neto Sanden Teisseire Advogados"
            />
            <small>Portal do Prestador</small>
          </div>
          <button
            type="button"
            className="icon-button mobile-close"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          >
            <X size={17} />
          </button>
        </div>

        <div className="profile-mini">
          <div className="avatar">{initials(provider.name)}</div>
          <div>
            <strong>{provider.name}</strong>
            <span>{provider.code}</span>
          </div>
        </div>

        <p className="sidebar-label">Navegação</p>
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
                className={active ? "nav-button active" : "nav-button"}
                aria-current={active ? "page" : undefined}
                onClick={() => navigate(item.path)}
              >
                <Icon size={16} />
                {item.label}
                {badge ? <span className="nav-badge">{badge}</span> : null}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-help">
          <span className="help-icon">
            <LifeBuoy size={15} />
          </span>
          <strong>Dúvidas no fechamento?</strong>
          <p>
            O guia do prestador explica prazos, documentos aceitos e o que fazer
            com recibos devolvidos.
          </p>
          <button type="button">Abrir guia →</button>
        </div>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="nav-button logout-button"
            onClick={handleSignOut}
          >
            <LogOut size={16} />
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

      <div className="portal-main">
        <header className="topbar">
          <button
            type="button"
            className="icon-button mobile-menu"
            aria-label="Abrir menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={18} />
          </button>
          <div className="topbar-context">
            <strong>Portal do Prestador</strong> / {title}
          </div>
          <div className="topbar-actions">
            <button
              type="button"
              className="icon-button notification-button"
              aria-label={
                rejectedCount > 0
                  ? `${rejectedCount} recibo(s) devolvido(s)`
                  : "Sem novidades"
              }
              onClick={() => navigate("/recibos")}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {rejectedCount > 0 ? <i /> : null}
            </button>
            <div className="topbar-user">
              <div className="avatar avatar-small">
                {initials(provider.name)}
              </div>
              <div>
                <strong>{provider.name}</strong>
                <span>{provider.email}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
