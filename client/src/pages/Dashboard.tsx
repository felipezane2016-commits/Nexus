import PortalShell from "@/components/PortalShell";
import StatusPill from "@/components/StatusPill";
import { usePortal } from "@/contexts/PortalContext";
import {
  calculateClosingProgress,
  closingSteps,
  CLOSING_STEPS,
  closingTotal,
  formatBRL,
  formatDate,
  formatMonth,
  receiptsIncludedInClosing,
  receiptsOfCompetencia,
  summarizeReceipts,
} from "@/lib/portal";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileUp,
  Plus,
  Receipt as ReceiptIcon,
  Wallet,
} from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { receipts, currentCompetencia, closingFor } = usePortal();
  const [, navigate] = useLocation();

  const monthReceipts = receiptsOfCompetencia(receipts, currentCompetencia);
  const summary = summarizeReceipts(monthReceipts);
  const closing = closingFor(currentCompetencia);
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
  const rejected = monthReceipts.filter(
    receipt => receipt.status === "Rejeitado"
  );
  const recent = [...receipts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const metrics = [
    {
      tone: "blue",
      icon: ReceiptIcon,
      label: "Recibos na competência",
      value: String(summary.count),
      detail: `${receiptsIncludedInClosing(statuses)} entram no fechamento`,
    },
    {
      tone: "green",
      icon: BadgeCheck,
      label: "Aprovado pelo escritório",
      value: formatBRL(summary.approvedAmount),
      detail: `${summary.byStatus.Aprovado} recibo(s) conferido(s)`,
    },
    {
      tone: "orange",
      icon: Clock3,
      label: "Em análise",
      value: formatBRL(summary.sentAmount),
      detail: `${summary.byStatus.Enviado} aguardando conferência`,
    },
    {
      tone: "violet",
      icon: Wallet,
      label: "Total do fechamento",
      value: formatBRL(closingTotal(monthReceipts)),
      detail: "Exclui recibos rejeitados",
    },
  ] as const;

  return (
    <PortalShell title="Dashboard">
      <div className="page-header">
        <div>
          <span className="eyebrow">
            Competência {formatMonth(currentCompetencia)}
          </span>
          <h1>Olá, Marina</h1>
          <p>
            Acompanhe os recibos da competência e feche o mês sem pendências.
          </p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => navigate("/recibos")}
        >
          <Plus size={15} /> Lançar recibo
        </button>
      </div>

      {rejected.length > 0 ? (
        <div className="notice-banner">
          <span className="notice-icon">
            <CircleAlert size={17} />
          </span>
          <div>
            <strong>
              {rejected.length} recibo{rejected.length > 1 ? "s" : ""} devolvido
              {rejected.length > 1 ? "s" : ""} pelo escritório
            </strong>
            <span>
              {rejected[0]?.reviewNote ??
                "Revise os dados e reenvie para conferência."}
            </span>
          </div>
          <button type="button" onClick={() => navigate("/recibos")}>
            Revisar <ArrowRight size={13} />
          </button>
        </div>
      ) : null}

      <div className="metric-grid">
        {metrics.map(metric => {
          const Icon = metric.icon;
          return (
            <div className="metric-card" key={metric.label}>
              <span className={`metric-icon ${metric.tone}`}>
                <Icon size={16} />
              </span>
              <p className="metric-label">{metric.label}</p>
              <p className="metric-value">{metric.value}</p>
              <p className="metric-detail">{metric.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-heading">
            <div>
              <h3>Fechamento de {formatMonth(currentCompetencia)}</h3>
              <p>Quatro etapas para o escritório liberar o pagamento.</p>
            </div>
            <span className="progress-percent">{progress}%</span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>
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
            className="secondary-button"
            onClick={() => navigate("/fechamento")}
          >
            Abrir fechamento <ArrowRight size={14} />
          </button>
        </div>

        <div className="card quick-card">
          <div className="card-heading">
            <div>
              <h3>Ações rápidas</h3>
              <p>O caminho mais curto do serviço ao pagamento.</p>
            </div>
          </div>
          <button
            type="button"
            className="quick-action"
            onClick={() => navigate("/recibos")}
          >
            <span className="quick-action-icon">
              <Plus size={15} />
            </span>
            <span>
              <strong>Lançar novo recibo</strong>
              <small>Registre um serviço prestado nesta competência</small>
            </span>
            <ChevronRight size={15} />
          </button>
          <button
            type="button"
            className="quick-action"
            onClick={() => navigate("/fechamento")}
          >
            <span className="quick-action-icon">
              <FileUp size={15} />
            </span>
            <span>
              <strong>Anexar documento de faturamento</strong>
              <small>
                {closing.documentName ?? "Nenhum documento anexado ainda"}
              </small>
            </span>
            <ChevronRight size={15} />
          </button>
          <button
            type="button"
            className="quick-action"
            onClick={() => navigate("/recibos")}
          >
            <span className="quick-action-icon">
              <CircleAlert size={15} />
            </span>
            <span>
              <strong>Resolver devoluções</strong>
              <small>
                {rejected.length > 0
                  ? `${rejected.length} recibo(s) aguardando correção`
                  : "Nenhuma devolução aberta"}
              </small>
            </span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="card recent-card">
        <div className="card-heading">
          <div>
            <h3>Últimos lançamentos</h3>
            <p>Os cinco recibos mais recentes, de todas as competências.</p>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() => navigate("/recibos")}
          >
            Ver todos
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhum recibo lançado</strong>
            <span>Comece registrando o primeiro serviço da competência.</span>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Recibo</th>
                    <th>Serviço</th>
                    <th>Data</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(receipt => (
                    <tr key={receipt.id}>
                      <td>
                        <span className="receipt-id">{receipt.id}</span>
                      </td>
                      <td className="service-cell">
                        <strong>{receipt.client}</strong>
                        <span>
                          {receipt.category} ·{" "}
                          {receipt.caseRef || "sem processo"}
                        </span>
                      </td>
                      <td>{formatDate(receipt.serviceDate)}</td>
                      <td>{formatBRL(receipt.amount)}</td>
                      <td>
                        <StatusPill status={receipt.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footnote">
              <span>
                <i className="green-dot" /> Atualizado agora
              </span>
              <span>{receipts.length} recibo(s) no total</span>
            </div>
          </>
        )}
      </div>
    </PortalShell>
  );
}
