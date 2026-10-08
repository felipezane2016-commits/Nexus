import { usePortal } from "@/contexts/PortalContext";
import { DEMO_CREDENTIALS } from "@/lib/portalSeed";
import { AlertCircle, Eye, EyeOff, Info } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import logoPnst from "@/assets/pnst-logo.webp";
import { MODO_REAL } from "@/_core/supabase/modo";
import EsqueciSenha from "@/components/EsqueciSenha";

export default function Login() {
  const { signIn } = usePortal();
  const [, navigate] = useLocation();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await signIn(code, password);
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
    <div className="acesso">

      <section className="acesso-palco">
        <div className="acesso-cartao">
          <div className="auth-badge">
            <img src={logoPnst} alt="PNST — Pacheco Neto Sanden Teisseire Advogados" />
          </div>
          <span className="accent-eyebrow">Entrar</span>
          <h2>Bem-vinda de volta</h2>
          <p>
            {MODO_REAL
              ? "Use o e-mail cadastrado no escritório e a senha que você criou pelo convite."
              : "Use o código de acesso enviado pelo escritório na assinatura do contrato."}
          </p>

          <form className="acesso-form" onSubmit={handleSubmit} noValidate>
            <div className="field-group">
              <label className="field-label" htmlFor="login-codigo">
                {MODO_REAL ? "E-mail" : "Código de acesso"}
              </label>
              <input
                id="login-codigo"
                className="field-input"
                type={MODO_REAL ? "email" : "text"}
                value={code}
                onChange={event => setCode(event.target.value)}
                placeholder={MODO_REAL ? "voce@empresa.com.br" : "PNST-0000"}
                autoComplete="username"
                autoCapitalize={MODO_REAL ? "none" : "characters"}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "login-erro" : undefined}
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="login-senha">
                Senha
              </label>
              <div className="campo-senha">
                <input
                  id="login-senha"
                  className="field-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  autoComplete="current-password"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "login-erro" : undefined}
                  required
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(current => !current)}
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={1.9} />
                  ) : (
                    <Eye size={16} strokeWidth={1.9} />
                  )}
                </button>
              </div>
            </div>

            <div className="acesso-opcoes">
              <label className="check-label">
                <input type="checkbox" defaultChecked />
                Manter conectado
              </label>
              {MODO_REAL ? (
                <EsqueciSenha emailInicial={code} />
              ) : (
                <button type="button" className="text-button" onClick={fillDemo}>
                  Preencher credenciais demo
                </button>
              )}
            </div>

            {error ? (
              <div id="login-erro" className="acesso-alerta-erro" role="alert">
                <AlertCircle size={15} strokeWidth={2} />
                <span>{error}</span>
              </div>
            ) : null}

            <button type="submit" className="button-primary button-block">
              Entrar no portal
            </button>

            {MODO_REAL ? null : (
              <div className="acesso-alerta-info">
                <Info size={15} strokeWidth={2} />
                <span>
                  <strong>Ambiente de demonstração.</strong> Código{" "}
                  <code>{DEMO_CREDENTIALS.code}</code>, senha{" "}
                  <code>{DEMO_CREDENTIALS.password}</code>. Os dados ficam só
                  neste navegador.
                </span>
              </div>
            )}
          </form>

          <p className="acesso-rodape">
            É do escritório? <Link href="~/login">Entrar no escritório</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
