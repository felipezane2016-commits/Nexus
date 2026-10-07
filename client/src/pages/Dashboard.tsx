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
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Check,
  Clock3,
  Plus,
  Receipt as ReceiptIcon,
  Wallet,
} from "lucide-react";
import { useLocation } from "wouter";
import CabecalhoPagina from "@/components/CabecalhoPagina";

export default function Dashboard() {
  const { receipts, currentCompetencia, closingFor, provider } = usePortal();
  const [, navigate] = useLocation();

  const monthReceipts = receiptsOfCompetencia(receipts, currentCompetencia);
  const summary = summarizeReceipts(monthReceipts);
  const closing = closingFor(currentCompetencia);
  const statuses = monthReceipts.map(receipt => receipt.status);
  const hasDocument = Boolean(closing.documentName);
  const progress = calculateClosingProgress(
    statuses,
    hasDocument,
    closing.submitted
  );
  const steps = closingSteps(statuses, hasDocument, closing.submitted);
  const rejected = monthReceipts.filter(
    receipt => receipt.status === "Rejeitado"
  );
  const recent = [...receipts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  const firstName = provider.name.split(" ")[0];

  const stepDetails = [
    `${summary.count} recibo(s) na competência`,
    summary.byStatus.Aprovado > 0
      ? `${summary.byStatus.Aprovado} aprovado(s) pelo escritório`
      : "Aguardando a primeira aprovação",
    closing.documentName ?? "Nota fiscal ou recibo consolidado",
    closing.submitted
      ? "Recebido pelo escritório"
      : "Libera a conferência final",
  ];

  // O bloco escuro aponta uma única ação: a que destrava o fechamento primeiro.
  const nextAction = rejected.length
    ? {
        title:
          rejected.length === 1
            ? "Corrija o recibo devolvido"
            : `Corrija os ${rejected.length} recibos devolvidos`,
        text:
          rejected[0]?.reviewNote ??
          "Revise os dados e reenvie para conferência.",
        label: "Abrir recibos",
        path: "/recibos",
      }
    : !hasDocument
      ? {
          title: "Anexe o documento de faturamento",
          text: `O valor deve bater com ${formatBRL(closingTotal(monthReceipts))}.`,
          label: "Abrir fechamento",
          path: "/fechamento",
        }
      : !closing.submitted
        ? {
            title: "Envie o fechamento",
            text: "Tudo pronto: os rascunhos da competência seguem junto.",
            label: "Abrir fechamento",
            path: "/fechamento",
          }
        : {
            title: "Fechamento enviado",
            text: "Aguarde a conferência final do escritório.",
            label: "Ver recibos",
            path: "/recibos",
          };

  const kpis = [
    {
      icon: ReceiptIcon,
      label: "Recibos na competência",
      value: String(summary.count),
      detail: `${receiptsIncludedInClosing(statuses)} entram no fechamento`,
    },
    {
      icon: BadgeCheck,
      label: "Aprovado",
      value: formatBRL(summary.approvedAmount),
      detail: `${summary.byStatus.Aprovado} recibo(s) conferido(s)`,
    },
    {
      icon: Clock3,
      label: "Em análise",
      value: formatBRL(summary.sentAmount),
      detail: `${summary.byStatus.Enviado} aguardando conferência`,
    },
    {
      icon: Wallet,
      label: "Total do fechamento",
      value: formatBRL(closingTotal(monthReceipts)),
      detail: "Exclui recibos rejeitados",
    },
  ];

  return (
    <PortalShell title="Visão geral">
      <CabecalhoPagina
        titulo={`Olá, ${firstName}`}
        descricao={`Competência ${formatMonth(currentCompetencia)} · acompanhe os recibos e feche o mês sem pendências.`}
        acoes={
          <button
            type="button"
            className="button-primary"
            onClick={() => navigate("/recibos")}
          >
            <Plus size={15} strokeWidth={2.2} /> Lançar recibo
          </button>
        }
      />

      {rejected.length > 0 ? (
        <div className="risk-card" role="status">
          <span className="risk-icon">
            <AlertTriangle size={16} strokeWidth={2} />
          </span>
          <div className="risk-card-head">
            <strong>
              {rejected.length} recibo{rejected.length > 1 ? "s" : ""} devolvido
              {rejected.length > 1 ? "s" : ""} pelo escritório
            </strong>
            <p>
              {rejected[0]?.reviewNote ??
                "Revise os dados e reenvie para conferência."}
            </p>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() => navigate("/recibos")}
          >
            Revisar <ArrowRight size={13} strokeWidth={2.2} />
          </button>
        </div>
      ) : null}

      <div className="kpi-grid">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div className="kpi-card" key={kpi.label}>
              <div className="kpi-card-head">
                <span className="kpi-label">{kpi.label}</span>
                <span className="kpi-icon" aria-hidden="true">
                  <Icon size={16} strokeWidth={1.9} />
                </span>
              </div>
              <p className="kpi-value">{kpi.value}</p>
              <p className="kpi-detail">{kpi.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="grid-main">
        <section className="operations-surface">
          <div className="section-header">
            <div>
              <span className="eyebrow">Fechamento</span>
              <h3>{formatMonth(currentCompetencia)}</h3>
              <p>Quatro etapas para o escritório liberar o pagamento.</p>
            </div>
            <button
              type="button"
              className="button-secondary"
              onClick={() => navigate("/fechamento")}
            >
              Abrir
            </button>
          </div>
          <div className="progress-meter">
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
                    <Check size={13} strokeWidth={2.4} />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="next-step-copy">
                  <strong>{label}</strong>
                  <span>{stepDetails[index]}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <aside className="attention-card">
          <span className="eyebrow">Próximo passo</span>
          <h3>{nextAction.title}</h3>
          <p>{nextAction.text}</p>
          <button
            type="button"
            className="button-primary"
            onClick={() => navigate(nextAction.path)}
          >
            {nextAction.label} <ArrowRight size={14} strokeWidth={2.2} />
          </button>
        </aside>
      </div>

      <section className="operations-surface espaco-acima">
        <div className="section-header">
          <div>
            <span className="eyebrow">Atividade</span>
            <h3>Últimos lançamentos</h3>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() => navigate("/recibos")}
          >
            Ver todos <ArrowRight size={13} strokeWidth={2.2} />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="empty-state">
            <ReceiptIcon size={19} strokeWidth={1.8} />
            <strong>Nenhum recibo lançado</strong>
            <span>Comece registrando o primeiro serviço da competência.</span>
          </div>
        ) : (
          <div className="table-scroll">
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
                      <span className="cell-code">{receipt.id}</span>
                    </td>
                    <td className="cell-main">
                      <strong>{receipt.client}</strong>
                      <span>
                        {receipt.category} · {receipt.caseRef || "sem processo"}
                      </span>
                    </td>
                    <td>{formatDate(receipt.serviceDate)}</td>
                    <td className="money">{formatBRL(receipt.amount)}</td>
                    <td>
                      <StatusPill status={receipt.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PortalShell>
  );
}
