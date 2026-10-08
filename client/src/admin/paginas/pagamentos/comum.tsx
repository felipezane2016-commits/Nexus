import { baixarBlob, lerAnexo } from "@/_core/armazenamento/anexos";
import Selo, { type Tom } from "@/admin/componentes/Selo";
import type { AnexoRef, StatusPagamento } from "@/modulos/pagamentos/tipos";
import { Download, FileText } from "lucide-react";

export const TOM_STATUS: Record<StatusPagamento, Tom> = {
  "Em conferência": "neutral",
  Devolvido: "red",
  "Aguardando aprovação": "amber",
  Aprovado: "blue",
  Pago: "green",
  Reprovado: "red",
  Cancelado: "neutral",
};

export function SeloStatus({ status }: { status: StatusPagamento }) {
  return <Selo tom={TOM_STATUS[status]}>{status}</Selo>;
}

/** Documento anexado: baixa do navegador quando há arquivo; na demonstração, só o nome. */
export function LinkDocumento({ anexo }: { anexo: AnexoRef }) {
  async function baixar() {
    if (!anexo.anexoId) return;
    const arquivo = await lerAnexo(anexo.anexoId);
    if (arquivo) baixarBlob(arquivo.blob, arquivo.nome);
  }
  return (
    <span className="documento-pagamento">
      <FileText size={15} strokeWidth={1.8} aria-hidden="true" />
      <span>{anexo.nome}</span>
      {anexo.anexoId ? (
        <button type="button" className="icon-button icon-button-pequeno" aria-label={`Baixar ${anexo.nome}`} onClick={baixar}>
          <Download size={14} strokeWidth={1.9} />
        </button>
      ) : null}
    </span>
  );
}
