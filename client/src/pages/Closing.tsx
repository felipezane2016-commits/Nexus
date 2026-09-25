import PortalShell from "@/components/PortalShell";
import StatusPill from "@/components/StatusPill";
import { usePortal } from "@/contexts/PortalContext";
import {
  calculateClosingProgress,
  canSubmitClosing,
  closingSteps,
  CLOSING_STEPS,
  closingTotal,
  formatBRL,
  formatDate,
  formatMonth,
  listCompetencias,
  receiptsIncludedInClosing,
  receiptsOfCompetencia,
} from "@/lib/portal";
import {
  CalendarDays,
  Check,
  CircleAlert,
  FileText,
  Info,
  Send,
  Upload,
} from "lucide-react";
import { useState, type ChangeEvent } from "react";

export default function Closing() {
  const {
    receipts,
    currentCompetencia,
    closingFor,
    attachClosingDocument,
    submitClosing,
  } = usePortal();
  const competencias = listCompetencias(receipts);
  const [competencia, setCompetencia] = useState(
    competencias.includes(currentCompetencia)
      ? currentCompetencia
      : (competencias[0] ?? currentCompetencia)
  );

  const monthReceipts = receiptsOfCompetencia(receipts, competencia);
  const closing = closingFor(competencia);
  const statuses = monthReceipts.map(receipt => receipt.status);
  const progress = calculateClosingProgress(
    statuses,
    Boolean(closing.documentName),
    closing.submitted
  );
  const steps = closingSteps(
    statuses,
    Boolean(closing.documentName),
    closing.submitted
  );
  const included = receiptsIncludedInClosing(statuses);
  const total = closingTotal(monthReceipts);
  const rejected = monthReceipts.filter(
    receipt => receipt.status === "Rejeitado"
  );
  const canSubmit = canSubmitClosing(
    monthReceipts,
    Boolean(closing.documentName),
    closing.submitted
  );

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    attachClosingDocument(competencia, event.target.files?.[0]?.name ?? null);
  }

  return (
    <PortalShell title="Fechamento mensal">
      <div className="page-header">
        <div>
          <span className="eyebrow">Fechamento</span>
          <h1>Fechamento mensal</h1>
          <p>
            Consolide os recibos da competência, anexe o documento de
            faturamento e envie ao escritório.
          </p>
        </div>
        <div className="month-select">
          <CalendarDays size={15} />
          <select
            value={competencia}
            onChange={event => setCompetencia(event.target.value)}
            aria-label="Competência"
          >
            {competencias.map(option => (
              <option key={option} value={option}>
                {formatMonth(option)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className={
          closing.submitted ? "closing-status closing-sent" : "closing-status"
        }
      >
        <span className="closing-status-icon">
          {closing.submitted ? <Check size={17} /> : <Info size={17} />}
        </span>
        <div>
          <strong>
            {closing.submitted
              ? `Fechamento enviado ao escritório${closing.submittedAt ? ` em ${formatDate(closing.submittedAt.slice(0, 10))}` : ""}`
              : "Fechamento em aberto"}
          </strong>
          <span>
            {closing.submitted
              ? "Aguarde a conferência final. Você será avisada se algum recibo precisar de ajuste."
              : `${included} de ${monthReceipts.length} recibo(s) prontos para envio — ${progress}% das etapas concluídas.`}
          </span>
        </div>
        <span
          className={
            closing.submitted ? "status status-approved" : "status status-sent"
          }
        >
          <i className="status-dot" />
          {closing.submitted ? "Enviado" : "Em aberto"}
        </span>
      </div>

      {rejected.length > 0 && !closing.submitted ? (
        <div className="notice-banner">
          <span className="notice-icon">
            <CircleAlert size={17} />
          </span>
          <div>
            <strong>
              {rejected.length} recibo{rejected.length > 1 ? "s" : ""} fora do
              fechamento
            </strong>
            <span>
              Recibos rejeitados não somam no total. Corrija e reenvie para
              incluí-los nesta competência.
            </span>
          </div>
        </div>
      ) : null}

      <div className="closing-grid">
        <div className="card closing-main">
          <div className="card-heading">
            <div>
              <h3>Recibos de {formatMonth(competencia)}</h3>
              <p>Rejeitados ficam listados, mas não entram na soma.</p>
            </div>
            <span className="closing-total">{formatBRL(total)}</span>
          </div>

          {monthReceipts.length === 0 ? (
            <div className="empty-state">
              <strong>Nenhum recibo nesta competência</strong>
              <span>Lance os serviços prestados para montar o fechamento.</span>
            </div>
          ) : (
            <>
              <div className="closing-receipts">
                {monthReceipts.map(receipt => (
                  <div className="closing-receipt" key={receipt.id}>
                    <span className="closing-receipt-icon">
                      <FileText size={15} />
                    </span>
                    <div>
                      <strong>
                        {receipt.client} · {receipt.category}
                      </strong>
                      <span>
                        {receipt.id} · {formatDate(receipt.serviceDate)}
                      </span>
                    </div>
                    <div className="closing-receipt-value">
                      {formatBRL(receipt.amount)}
                      <StatusPill status={receipt.status} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="closing-total-line">
                <span>{included} recibo(s) no fechamento</span>
                <strong>{formatBRL(total)}</strong>
              </div>
            </>
          )}
        </div>

        <div className="card upload-card">
          <div className="card-heading">
            <div>
              <h3>Documento de faturamento</h3>
              <p>Nota fiscal ou recibo consolidado da competência.</p>
            </div>
            <span className="progress-percent">{progress}%</span>
          </div>

          <label
            className={
              closing.documentName ? "upload-box has-file" : "upload-box"
            }
          >
            <input
              type="file"
              onChange={handleUpload}
              disabled={closing.submitted}
            />
            {closing.documentName ? <Check size={20} /> : <Upload size={20} />}
            <strong>
              {closing.documentName ?? "Arraste ou selecione o arquivo"}
            </strong>
            <span>
              {closing.documentName
                ? "Clique para substituir"
                : "PDF ou imagem até 10 MB"}
            </span>
          </label>

          <p className="upload-tip">
            <Info size={12} /> O valor do documento deve bater com{" "}
            {formatBRL(total)}.
          </p>

          <div className="progress-steps">
            {CLOSING_STEPS.map((label, index) => (
              <div
                className={
                  steps[index] ? "progress-step done" : "progress-step"
                }
                key={label}
              >
                <span>{steps[index] ? <Check size={9} /> : <span />}</span>
                {label}
              </div>
            ))}
          </div>

          <button
            type="button"
            className="primary-button full-width"
            disabled={!canSubmit}
            onClick={() => submitClosing(competencia)}
          >
            <Send size={15} />{" "}
            {closing.submitted
              ? "Fechamento enviado"
              : "Enviar para conferência"}
          </button>
          <span className="button-hint">
            {closing.submitted
              ? "Este fechamento já foi enviado ao escritório."
              : canSubmit
                ? "Os rascunhos da competência serão enviados junto."
                : "Anexe o documento de faturamento e tenha ao menos um recibo válido."}
          </span>
        </div>
      </div>
    </PortalShell>
  );
}
