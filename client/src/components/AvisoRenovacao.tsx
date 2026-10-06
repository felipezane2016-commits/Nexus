import { dispensarAvisoDeRenovacao, useDemonstracaoRenovada, VERSAO_DA_SEMENTE } from "@/_core/armazenamento/semente";
import { Info } from "lucide-react";

/**
 * Aviso de demonstração renovada: aparece uma vez quando a versão da semente
 * mudou e os dados de teste guardados neste navegador foram substituídos.
 */
export default function AvisoRenovacao() {
  const renovada = useDemonstracaoRenovada();
  if (!renovada) return null;
  return (
    <div className="acesso-alerta-info espaco-abaixo" role="status">
      <Info size={15} strokeWidth={2} aria-hidden="true" />
      <span className="aviso-texto">
        <strong>Demonstração atualizada (versão {VERSAO_DA_SEMENTE}).</strong> Os dados de teste deste navegador foram renovados.
      </span>
      <button type="button" className="text-button" onClick={dispensarAvisoDeRenovacao}>
        Entendi
      </button>
    </div>
  );
}
