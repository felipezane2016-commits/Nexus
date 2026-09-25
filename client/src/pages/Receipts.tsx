import PortalShell from "@/components/PortalShell";
import ReceiptModal from "@/components/ReceiptModal";
import StatusPill from "@/components/StatusPill";
import { usePortal } from "@/contexts/PortalContext";
import {
  canEditReceipt,
  filterReceipts,
  formatBRL,
  formatDate,
  formatMonth,
  RECEIPT_STATUSES,
  summarizeReceipts,
  type PrototypeReceiptStatus,
  type Receipt,
  type ReceiptDraft,
} from "@/lib/portal";
import {
  CircleAlert,
  Paperclip,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { useState } from "react";

type StatusFilter = PrototypeReceiptStatus | "Todos";

export default function Receipts() {
  const {
    receipts,
    currentCompetencia,
    createReceipt,
    updateReceipt,
    submitReceipt,
    removeReceipt,
  } = usePortal();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("Todos");
  const [editing, setEditing] = useState<Receipt | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const visible = filterReceipts(receipts, search, status);
  const summary = summarizeReceipts(receipts);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(receipt: Receipt) {
    setEditing(receipt);
    setModalOpen(true);
  }

  function handleSave(draft: ReceiptDraft) {
    if (editing) updateReceipt(editing.id, draft);
    else createReceipt(draft);
    setModalOpen(false);
    setEditing(null);
  }

  const strip = [
    { label: "Recibos lançados", value: String(summary.count) },
    { label: "Valor bruto", value: formatBRL(summary.gross) },
    { label: "Aprovado", value: formatBRL(summary.approvedAmount) },
    { label: "Em rascunho", value: formatBRL(summary.draftAmount) },
  ];

  return (
    <PortalShell title="Meus recibos">
      <div className="page-header">
        <div>
          <span className="eyebrow">
            Competência aberta {formatMonth(currentCompetencia)}
          </span>
          <h1>Meus recibos</h1>
          <p>
            Lance, revise e envie cada serviço prestado para conferência do
            escritório.
          </p>
        </div>
        <button type="button" className="primary-button" onClick={openNew}>
          <Plus size={15} /> Lançar recibo
        </button>
      </div>

      <div className="summary-strip">
        {strip.map(item => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="card list-card">
        <div className="list-toolbar">
          <div className="search-input">
            <Search size={14} />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Buscar por cliente, processo, categoria ou nº do recibo"
              aria-label="Buscar recibos"
            />
          </div>
          <div className="filter-group">
            {(["Todos", ...RECEIPT_STATUSES] as StatusFilter[]).map(option => (
              <button
                key={option}
                type="button"
                className={status === option ? "selected" : undefined}
                aria-pressed={status === option}
                onClick={() => setStatus(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhum recibo encontrado</strong>
            <span>
              {receipts.length === 0
                ? "Lance o primeiro serviço da competência."
                : "Ajuste a busca ou o filtro de status."}
            </span>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Recibo</th>
                    <th>Serviço</th>
                    <th>Competência</th>
                    <th>Data</th>
                    <th>Comprovante</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th aria-label="Ações" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map(receipt => (
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
                        {receipt.reviewNote ? (
                          <span>
                            <CircleAlert size={10} /> {receipt.reviewNote}
                          </span>
                        ) : null}
                      </td>
                      <td>{formatMonth(receipt.competencia)}</td>
                      <td>{formatDate(receipt.serviceDate)}</td>
                      <td>
                        {receipt.attachmentName ? <Paperclip size={13} /> : "—"}
                      </td>
                      <td>{formatBRL(receipt.amount)}</td>
                      <td>
                        <StatusPill status={receipt.status} />
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            justifyContent: "flex-end",
                          }}
                        >
                          {canEditReceipt(receipt) ? (
                            <button
                              type="button"
                              className="text-button"
                              onClick={() => openEdit(receipt)}
                            >
                              Editar
                            </button>
                          ) : null}
                          {receipt.status === "Rascunho" ||
                          receipt.status === "Rejeitado" ? (
                            <button
                              type="button"
                              className="table-more"
                              aria-label={`Enviar ${receipt.id} para conferência`}
                              onClick={() => submitReceipt(receipt.id)}
                            >
                              <Send size={14} />
                            </button>
                          ) : null}
                          {receipt.status === "Rascunho" ? (
                            <button
                              type="button"
                              className="table-more"
                              aria-label={`Excluir ${receipt.id}`}
                              onClick={() => removeReceipt(receipt.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footnote">
              <span>
                <i className="green-dot" /> {visible.length} de{" "}
                {receipts.length} recibo(s)
              </span>
              <span>Recibos aprovados não podem mais ser editados.</span>
            </div>
          </>
        )}
      </div>

      {modalOpen ? (
        <ReceiptModal
          receipt={editing}
          competencia={currentCompetencia}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      ) : null}
    </PortalShell>
  );
}
