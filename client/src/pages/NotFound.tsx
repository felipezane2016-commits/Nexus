import { ArrowLeft, Compass } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <main className="page-content">
      <section className="operations-surface">
        <div className="empty-state">
          <Compass size={19} strokeWidth={1.8} />
          <strong>Página não encontrada</strong>
          <span>O endereço acessado não existe no Portal do Prestador.</span>
          <button
            type="button"
            className="button-secondary"
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={14} strokeWidth={2} /> Voltar à visão geral
          </button>
        </div>
      </section>
    </main>
  );
}
