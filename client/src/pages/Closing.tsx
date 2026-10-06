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
  AlertTriangle,
  Check,
  CheckCircle2,
  FileText,
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
  const hasDocument = Boolean(closing.documentName);
  const progress = calculateClosingProgress(
    statuses,
    hasDocument,
    closing.submitted
  );
  const steps = closingSteps(statuses, hasDocument, closing.submitted);
  const included = receiptsIncludedInClosing(statuses);
  const total = closingTotal(monthReceipts);
  const rejected = monthReceipts.filter(
    receipt => receipt.status === "Rejeitado"
  );
  const canSubmit = canSubmitClosing(
    monthReceipts,
    hasDocument,
    closing.submitted
  );

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    attachClosingDocument(competencia, event.target.files?.[0]?.name ?? null);
  }

  return (
    <PortalShell title="Fechamento mensal">
      <header className="page-heading">
        <div>
          <span className="eyebrow">Fechamento</span>
          <h1>Fechamento mensal</h1>
          <p>
            Consolide os recibos da competência, anexe o documento de
            faturamento e envie ao escritório.
          </p>
        </div>
        <div className="heading-actions">
          <div className="field-group">
            <label className="field-label" htmlFor="competencia">
              Competência
            </label>
            <select
              id="competencia"
              className="field-input"
              value={competencia}
              onChange={event => setCompetencia(event.target.value)}
            >
              {competencias.map(option => (
                <option key={option} value={option}>
                  {formatMonth(option)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div
        className={closing.submitted ? "risk-card risk-card-ok" : "risk-card"}
        data-estado={closing.submitted ? "enviado" : "aberto"}
        role="status"
      >
        <span className="risk-icon">
          {closing.submitted ? (
            <CheckCircle2 size={16} strokeWidth={2} />
          ) : (
            <AlertTriangle size={16} strokeWidth={2} />
          )}
        </span>
        <div className="risk-card-head">
          <strong>
            {closing.submitted
              ? `Fechamento enviado${closing.submittedAt ? ` em ${formatDate(closing.submittedAt.slice(0, 10))}` : ""}`
              : "Fechamento em aberto"}
          </strong>
          <p>
            {closing.submitted
              ? closing.review === "Pago"
                ? "Pagamento registrado pelo escritório. Nada mais a fazer nesta competência."
                : closing.review === "Conferido"
                  ? "Conferência concluída pelo escritório. O pagamento é o próximo passo."
                  : "Aguarde a conferência final. Você será avisada se algum recibo precisar de ajuste."
              : `${included} de ${monthReceipts.length} recibos entram no fechamento.${
                  rejected.length === 1
                    ? " O rejeitado fica de fora até ser corrigido."
                    : rejected.length > 1
                      ? ` Os ${rejected.length} rejeitados ficam de fora até serem corrigidos.`
                      : ""
                }`}
          </p>
        </div>
        <span
          className={`status-pill ${
            !closing.submitted
              ? "status-amber"
              : closing.review === "Pago"
                ? "status-green"
                : "status-blue"
          }`}
        >
          <span className="status-dot" aria-hidden="true" />
          {closing.submitted ? (closing.review ?? "Enviado") : "Em aberto"}
        </span>
      </div>

      <div className="grid-main">
        <section className="operations-surface">
          <div className="section-header">
            <div>
              <span className="eyebrow">Recibos</span>
              <h3>{formatMonth(competencia)}</h3>
              <p>Rejeitados ficam listados, mas não entram na soma.</p>
            </div>
          </div>

          {monthReceipts.length === 0 ? (
            <div className="empty-state">
              <FileText size={22} strokeWidth={1.8} />
              <strong>Nenhum recibo nesta competência</strong>
              <span>Lance os serviços prestados para montar o fechamento.</span>
            </div>
          ) : (
            <>
              <div className="ged-list">
                {monthReceipts.map(receipt => (
                  <div className="ged-line" key={receipt.id}>
                    <span className="doc-icon" aria-hidden="true">
                      <FileText size={16} strokeWidth={1.9} />
                    </span>
                    <div className="ged-line-copy">
                      <strong>
                        {receipt.client} · {receipt.category}
                      </strong>
                      <span>
                        {receipt.id} · {formatDate(receipt.serviceDate)}
                      </span>
                    </div>
                    <div className="ged-line-meta">
                      <span className="money">{formatBRL(receipt.amount)}</span>
                      <StatusPill status={receipt.status} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="total-line">
                <span>{included} recibo(s) no fechamento</span>
                <strong>{formatBRL(total)}</strong>
              </div>
            </>
          )}
        </section>

        <section className="operations-surface">
          <div className="section-header">
            <div>
              <span className="eyebrow">Envio</span>
              <h3>Documento de faturamento</h3>
              <p>Nota fiscal ou recibo consolidado da competência.</p>
            </div>
          </div>

          <label
            className={
              hasDocument ? "upload-zone upload-zone-filled" : "upload-zone"
            }
          >
            <input
              type="file"
              onChange={handleUpload}
              disabled={closing.submitted}
              aria-label="Documento de faturamento"
            />
            {hasDocument ? (
              <CheckCircle2 size={22} strokeWidth={1.9} />
            ) : (
              <Upload size={22} strokeWidth={1.9} />
            )}
            <strong>{closing.documentName ?? "Selecionar arquivo"}</strong>
            <span>
              {hasDocument
                ? closing.submitted
                  ? "Enviado"
                  : "Clique para trocar"
                : "PDF ou imagem até 10 MB"}
            </span>
          </label>
          <p className="field-hint">
            O valor do documento deve bater com {formatBRL(total)}.
          </p>

          <div className="progress-meter" style={{ marginTop: 20 }}>
            <div
              className="progress-track"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso do fechamento"
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-value">{progress}%</span>
          </div>
          <ol className="next-step-list">
            {CLOSING_STEPS.map((label, index) => (
              <li
                className={
                  steps[index] ? "next-step next-step-done" : "next-step"
                }
                key={label}
              >
                <span className="step-number">
                  {steps[index] ? (
                    <Check size={13} strokeWidth={2.6} />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="next-step-copy">
                  <strong>{label}</strong>
                </span>
              </li>
            ))}
          </ol>

          <button
            type="button"
            className="button-primary button-block"
            style={{ marginTop: 16 }}
            disabled={!canSubmit}
            onClick={() => submitClosing(competencia)}
          >
            <Send size={15} strokeWidth={2} />{" "}
            {closing.submitted
              ? "Fechamento enviado"
              : "Enviar para conferência"}
          </button>
          <p
            className="field-hint"
            style={{ marginTop: 9, textAlign: "center" }}
          >
            {closing.submitted
              ? "Este fechamento já foi enviado ao escritório."
              : canSubmit
                ? "Os rascunhos da competência seguem junto."
                : "Anexe o documento e tenha ao menos um recibo válido."}
          </p>
        </section>
      </div>
    </PortalShell>
  );
}
