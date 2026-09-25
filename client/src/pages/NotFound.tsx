import { ArrowLeft, Compass } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="page-content">
      <div className="card">
        <div className="empty-state">
          <Compass size={26} className="muted-icon" />
          <strong>Página não encontrada</strong>
          <span>O endereço acessado não existe no Portal do Prestador.</span>
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/")}
            style={{ marginTop: 14 }}
          >
            <ArrowLeft size={14} /> Voltar ao dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
