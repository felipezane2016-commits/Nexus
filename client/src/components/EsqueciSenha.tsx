import { useState } from "react";

/** "Esqueci minha senha" (modo real): o Supabase manda o link de redefinição. */
export default function EsqueciSenha({ emailInicial }: { emailInicial: string }) {
  const [aberto, setAberto] = useState(false);
  const [email, setEmail] = useState(emailInicial);
  const [estado, setEstado] = useState<{ tom: "info" | "erro" | "sucesso"; texto: string } | null>(null);

  if (!aberto)
    return (
      <button type="button" className="text-button" onClick={() => setAberto(true)}>
        Esqueci minha senha
      </button>
    );

  async function enviar() {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setEstado({ tom: "erro", texto: "Informe o e-mail cadastrado." });
    const { pedirNovaSenha } = await import("@/_core/supabase/autenticacao");
    const erro = await pedirNovaSenha(email);
    setEstado(erro ? { tom: "erro", texto: erro } : { tom: "sucesso", texto: "Se o e-mail estiver cadastrado, o link para criar uma senha nova chega em instantes." });
  }

  return (
    <div className="field-group esqueci-senha">
      <label className="field-label" htmlFor="esqueci-email">
        E-mail para receber o link
      </label>
      <div className="inline-row inline-row-fixo">
        <input id="esqueci-email" className="field-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="button" className="button-secondary" onClick={enviar}>
          Enviar link
        </button>
      </div>
      {estado ? (
        <div className={`acesso-alerta-${estado.tom}`} role="status">
          <span>{estado.texto}</span>
        </div>
      ) : null}
    </div>
  );
}
