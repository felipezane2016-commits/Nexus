import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

export type AriaCampo = { id: string; "aria-invalid"?: true; "aria-describedby"?: string };

type Props = {
  id: string;
  rotulo: string;
  erro?: string;
  dica?: string;
  children: (aria: AriaCampo) => ReactNode;
};

/** Liga rótulo, dica e erro ao campo para o leitor de tela anunciar os três. */
export default function Campo({ id, rotulo, erro, dica, children }: Props) {
  const descrito = [erro ? `${id}-erro` : null, dica ? `${id}-dica` : null].filter(Boolean).join(" ");
  return (
    <div className="field-group">
      <label className="field-label" htmlFor={id}>
        {rotulo}
      </label>
      {children({ id, "aria-invalid": erro ? true : undefined, "aria-describedby": descrito || undefined })}
      {dica ? (
        <span id={`${id}-dica`} className="field-hint">
          {dica}
        </span>
      ) : null}
      {erro ? (
        <span id={`${id}-erro`} className="field-error" role="alert">
          <AlertCircle size={13} strokeWidth={2} />
          {erro}
        </span>
      ) : null}
    </div>
  );
}
