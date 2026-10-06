import { usePortal } from "@/contexts/PortalContext";
import { DEMO_CREDENTIALS } from "@/lib/portalSeed";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Info } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";

const GARANTIAS = [
  {
    titulo: "Cada recibo com seu histórico",
    texto: "Quem lançou, quando foi enviado e o que o escritório decidiu.",
  },
  {
    titulo: "Fechamento em quatro etapas",
    texto: "Recibos, revisão, documento e envio — o progresso fica à vista.",
  },
  {
    titulo: "Acesso por contrato",
    texto: "Cada prestador vê apenas os próprios recibos.",
  },
];

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
    <div className="acesso">
      <section className="acesso-painel">
        <div className="brand-row">
          <span className="brand-mark" aria-hidden="true">
            N
          </span>
          <span className="brand-copy">Nexus Portal do Prestador</span>
        </div>

        <div>
          <span className="eyebrow">Recibos e fechamento mensal</span>
          <h1>
            Seus recibos, <em>fechados no prazo</em>.
          </h1>
          <p>
            Lance cada serviço prestado, acompanhe a conferência do escritório e
            envie o fechamento sem trocar e-mails.
          </p>
        </div>

        <ul className="acesso-pontos">
          {GARANTIAS.map(item => (
            <li key={item.titulo}>
              <CheckCircle2 size={17} strokeWidth={2} />
              <div>
                <strong>{item.titulo}</strong>
                {item.texto}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="acesso-palco">
        <div className="acesso-cartao">
          <span className="accent-eyebrow">Entrar</span>
          <h2>Bem-vinda de volta</h2>
          <p>
            Use o código de acesso enviado pelo escritório na assinatura do
            contrato.
          </p>

          <form className="acesso-form" onSubmit={handleSubmit} noValidate>
            <div className="field-group">
              <label className="field-label" htmlFor="login-codigo">
                Código de acesso
              </label>
              <input
                id="login-codigo"
                className="field-input"
                value={code}
                onChange={event => setCode(event.target.value)}
                placeholder="PNST-0000"
                autoComplete="username"
                autoCapitalize="characters"
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
              <button type="button" className="text-button" onClick={fillDemo}>
                Preencher credenciais demo
              </button>
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

            <div className="acesso-alerta-info">
              <Info size={15} strokeWidth={2} />
              <span>
                <strong>Ambiente de demonstração.</strong> Código{" "}
                <code>{DEMO_CREDENTIALS.code}</code>, senha{" "}
                <code>{DEMO_CREDENTIALS.password}</code>. Os dados ficam só
                neste navegador.
              </span>
            </div>
          </form>

          <p className="acesso-rodape">
            É do escritório? <Link href="~/login">Entrar no Nexus Escritório</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
