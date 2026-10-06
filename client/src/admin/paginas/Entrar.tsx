import { PAPEIS } from "@/_core/identidade/permissoes";
import { entrar, USUARIOS_DEMO, useUsuarioAtual } from "@/_core/identidade/sessao";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Info } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Redirect, useLocation } from "wouter";

const GARANTIAS = [
  { titulo: "Um lugar para a operação", texto: "Legal, prestadores, contas e agenda no mesmo ambiente." },
  { titulo: "Cada um vê o que precisa", texto: "Papel e módulos definem o que aparece para cada pessoa." },
  { titulo: "Ligado ao portal", texto: "O que o prestador envia chega direto na conferência." },
];

export default function Entrar() {
  const usuario = useUsuarioAtual();
  const [, navegar] = useLocation();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (usuario) return <Redirect to="/" />;

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const resultado = entrar(email, senha);
    if (!resultado.ok) {
      setErro(resultado.mensagem);
      return;
    }
    setErro(null);
    navegar("/");
  }

  return (
    <div className="acesso">
      <section className="acesso-painel">
        <div className="brand-row">
          <span className="brand-mark" aria-hidden="true">
            N
          </span>
          <span className="brand-copy">Nexus Escritório</span>
        </div>
        <div>
          <span className="eyebrow">Plataforma de inteligência operacional</span>
          <h1>
            A operação do escritório, <em>num só lugar</em>.
          </h1>
          <p>Processos, prestadores, contas e agenda com o histórico de quem decidiu o quê.</p>
        </div>
        <ul className="acesso-pontos">
          {GARANTIAS.map((item) => (
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
          <span className="accent-eyebrow">Escritório · Entrar</span>
          <h2>Bem-vindo de volta</h2>
          <p>Entre com o e-mail corporativo.</p>

          <form className="acesso-form" onSubmit={enviar} noValidate>
            <div className="field-group">
              <label className="field-label" htmlFor="admin-email">
                E-mail
              </label>
              <input
                id="admin-email"
                className="field-input"
                type="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                autoComplete="username"
                aria-invalid={erro ? true : undefined}
                aria-describedby={erro ? "admin-erro" : undefined}
              />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="admin-senha">
                Senha
              </label>
              <div className="campo-senha">
                <input
                  id="admin-senha"
                  className="field-input"
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(evento) => setSenha(evento.target.value)}
                  autoComplete="current-password"
                  aria-invalid={erro ? true : undefined}
                  aria-describedby={erro ? "admin-erro" : undefined}
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={mostrarSenha}
                  onClick={() => setMostrarSenha((atual) => !atual)}
                >
                  {mostrarSenha ? <EyeOff size={16} strokeWidth={1.9} /> : <Eye size={16} strokeWidth={1.9} />}
                </button>
              </div>
            </div>

            {erro ? (
              <div id="admin-erro" className="acesso-alerta-erro" role="alert">
                <AlertCircle size={15} strokeWidth={2} />
                <span>{erro}</span>
              </div>
            ) : null}

            <button type="submit" className="button-primary button-block">
              Entrar
            </button>

            <div className="acesso-alerta-info">
              <Info size={15} strokeWidth={2} />
              <span>
                <strong>Ambiente de demonstração.</strong> Senha <code>nexus2026</code> para todas as contas. Cada uma mostra
                um papel diferente:
              </span>
            </div>
            <div className="filter-chips" role="group" aria-label="Contas de demonstração">
              {USUARIOS_DEMO.filter((item) => item.ativo).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="filter-chip"
                  onClick={() => {
                    setEmail(item.email);
                    setSenha(item.senha);
                    setErro(null);
                  }}
                >
                  {item.nome.split(" ")[0]} · {PAPEIS[item.papel].nome}
                </button>
              ))}
            </div>
          </form>

          <p className="acesso-rodape">
            É prestador de serviço? <Link href="/portal/login">Entrar no Portal do Prestador</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
