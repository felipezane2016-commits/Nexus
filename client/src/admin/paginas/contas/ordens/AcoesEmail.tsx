import { baixarBlob, lerAnexo } from "@/_core/armazenamento/anexos";
import type { Email } from "@/modulos/contas/emails";
import { montarEml, type ArquivoEml } from "@/modulos/contas/eml";
import { Check, Copy, Mail } from "lucide-react";
import { useState } from "react";

/**
 * Pré-visualização de um e-mail pronto e as duas saídas: rascunho para o
 * Outlook (.eml, com anexos) e cópia formatada para colar numa mensagem.
 */
export default function AcoesEmail({ email, aoMarcarEnviado, textoMarcar }: { email: Email; aoMarcarEnviado?: () => void; textoMarcar?: string }) {
  const [aviso, setAviso] = useState<string | null>(null);
  const semPdf = email.anexos.filter((invoice) => !invoice.anexoId);

  async function abrirNoOutlook() {
    const arquivos: ArquivoEml[] = [];
    for (const invoice of email.anexos) {
      if (!invoice.anexoId) continue;
      const anexo = await lerAnexo(invoice.anexoId);
      if (anexo) arquivos.push({ nome: anexo.nome, tipo: anexo.tipo, conteudo: new Uint8Array(await anexo.blob.arrayBuffer()) });
    }
    const eml = montarEml(email, arquivos);
    const nome = `${email.assunto.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 80)}.eml`;
    baixarBlob(new Blob([eml], { type: "message/rfc822" }), nome);
    setAviso(`Rascunho baixado${arquivos.length ? ` com ${arquivos.length} anexo(s)` : ""}. Abra o arquivo: o Outlook mostra a mensagem pronta para enviar.`);
  }

  async function copiar() {
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ "text/html": new Blob([email.html], { type: "text/html" }), "text/plain": new Blob([email.texto], { type: "text/plain" }) }),
        ]);
      } else await navigator.clipboard.writeText(email.texto);
      setAviso("Corpo copiado com a formatação. Cole numa mensagem nova do Outlook.");
    } catch {
      setAviso("O navegador bloqueou a cópia. Use o rascunho para o Outlook.");
    }
  }

  return (
    <div className="email-pronto">
      <dl className="email-pronto-cabecalho">
        <div>
          <dt>Para</dt>
          <dd>{email.para || "—"}</dd>
        </div>
        {email.cc ? (
          <div>
            <dt>Cc</dt>
            <dd>{email.cc}</dd>
          </div>
        ) : null}
        <div>
          <dt>Assunto</dt>
          <dd>{email.assunto}</dd>
        </div>
        {email.anexos.length ? (
          <div>
            <dt>Anexos</dt>
            <dd>
              {email.anexos.map((invoice) => invoice.arquivo ?? `Invoice ${invoice.numero}`).join(", ")}
              {semPdf.length ? <span className="email-pronto-falta"> · {semPdf.length} sem PDF anexado</span> : null}
            </dd>
          </div>
        ) : null}
      </dl>
      {/* O HTML vem de emails.ts, que escapa todo texto digitado. */}
      <div className="email-pronto-corpo" dangerouslySetInnerHTML={{ __html: email.html }} />
      <div className="inline-row espaco-acima-curto">
        <button type="button" className="button-secondary" onClick={abrirNoOutlook}>
          <Mail size={15} strokeWidth={2} /> Abrir no Outlook
        </button>
        <button type="button" className="button-secondary" onClick={copiar}>
          <Copy size={15} strokeWidth={2} /> Copiar formatado
        </button>
        {aoMarcarEnviado ? (
          <button type="button" className="button-primary" onClick={aoMarcarEnviado}>
            <Check size={15} strokeWidth={2.2} /> {textoMarcar ?? "Marcar como enviado"}
          </button>
        ) : null}
      </div>
      {aviso ? (
        <p className="field-hint espaco-acima-curto" role="status">
          {aviso}
        </p>
      ) : null}
    </div>
  );
}
