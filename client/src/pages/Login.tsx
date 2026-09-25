import { usePortal } from "@/contexts/PortalContext";
import { DEMO_CREDENTIALS } from "@/lib/portalSeed";
import { ShieldCheck, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const { signIn } = usePortal();
  const [, navigate] = useLocation();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = signIn(code, password);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    navigate("/");
  }

  function fillDemo() {
    setCode(DEMO_CREDENTIALS.code);
    setPassword(DEMO_CREDENTIALS.password);
    setError(null);
  }

  return (
    <div className="login-page">
      <section className="login-artwork">
        <div className="art-grid" />
        <div className="art-orbit orbit-one" />
        <div className="art-orbit orbit-two" />
        <div className="login-art-copy">
          <span className="eyebrow light">
            <Sparkles size={12} /> Nexus · Operações
          </span>
          <h1>
            Seus recibos, <em>fechados no prazo</em>.
          </h1>
          <p>
            Lance cada serviço prestado, acompanhe a conferência do escritório e
            envie o fechamento mensal sem trocar um único e-mail.
          </p>
          <div className="trust-line">
            <ShieldCheck size={15} />
            Acesso individual por contrato — cada prestador vê apenas os
            próprios recibos.
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-panel-inner">
          <div className="brand-lockup">
            <span className="brand-mark">N</span>
            <div>
              <strong>Nexus</strong>
              <small>Portal do Prestador</small>
            </div>
          </div>

          <div className="login-heading">
            <span className="eyebrow">Entrar</span>
            <h2>Bem-vinda de volta</h2>
            <p>
              Use o código de acesso enviado pelo escritório na assinatura do
              contrato.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              <span>Código de acesso</span>
              <input
                value={code}
                onChange={event => setCode(event.target.value)}
                placeholder="PNST-0000"
                autoComplete="username"
                autoCapitalize="characters"
                required
              />
            </label>

            <label>
              <span>Senha</span>
              <div className="password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowPassword(current => !current)}
                  onKeyDown={event => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setShowPassword(current => !current);
                    }
                  }}
                >
                  {showPassword ? "OCULTAR" : "VER"}
                </span>
              </div>
            </label>

            <div className="login-options">
              <label className="check-label">
                <input type="checkbox" defaultChecked />
                Manter conectado neste dispositivo
              </label>
              <button type="button" className="text-button" onClick={fillDemo}>
                Preencher credenciais demo
              </button>
            </div>

            {error ? <p className="form-error">{error}</p> : null}

            <button type="submit" className="primary-button login-submit">
              Entrar no portal
            </button>
          </form>

          <div className="demo-note">
            <span className="demo-dot" />
            <div>
              <strong>Protótipo navegável.</strong> Acesse com{" "}
              <code>{DEMO_CREDENTIALS.code}</code> e senha{" "}
              <code>{DEMO_CREDENTIALS.password}</code>. Nenhum dado é enviado a
              servidores.
            </div>
          </div>

          <p className="login-legal">
            Nexus · Plataforma de inteligência operacional
          </p>
        </div>
      </section>
    </div>
  );
}
