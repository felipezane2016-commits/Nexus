/**
 * Rascunho de e-mail em formato .eml. Com o cabeçalho "X-Unsent: 1", o
 * Outlook abre o arquivo como mensagem nova, editável, já com destinatários,
 * assunto, corpo formatado e anexos — é o que um link mailto não consegue.
 */

export type ArquivoEml = { nome: string; tipo: string; conteudo: Uint8Array };

function base64(bytes: Uint8Array) {
  let binario = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binario += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  return btoa(binario).replace(/.{76}/g, "$&\r\n");
}

const utf8 = (texto: string) => new TextEncoder().encode(texto);
/** Cabeçalho com acento: codificação "encoded-word" (RFC 2047). */
const cabecalho = (texto: string) => (/^[\x20-\x7e]*$/.test(texto) ? texto : `=?UTF-8?B?${base64(utf8(texto)).replace(/\r\n/g, "")}?=`);

export function montarEml(email: { para: string; cc: string; assunto: string; texto: string; html: string }, anexos: ArquivoEml[]) {
  const misto = `misto_${Math.random().toString(36).slice(2)}`;
  const alternativo = `alt_${Math.random().toString(36).slice(2)}`;
  const enderecos = (lista: string) =>
    lista
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .join(", ");
  const linhas = [
    `To: ${enderecos(email.para)}`,
    ...(email.cc.trim() ? [`Cc: ${enderecos(email.cc)}`] : []),
    `Subject: ${cabecalho(email.assunto)}`,
    "X-Unsent: 1",
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${misto}"`,
    "",
    `--${misto}`,
    `Content-Type: multipart/alternative; boundary="${alternativo}"`,
    "",
    `--${alternativo}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    base64(utf8(email.texto)),
    `--${alternativo}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    base64(utf8(`<html><body>${email.html}</body></html>`)),
    `--${alternativo}--`,
    ...anexos.flatMap((anexo) => [
      `--${misto}`,
      `Content-Type: ${anexo.tipo}; name="${cabecalho(anexo.nome)}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${cabecalho(anexo.nome)}"`,
      "",
      base64(anexo.conteudo),
    ]),
    `--${misto}--`,
    "",
  ];
  return linhas.join("\r\n");
}
