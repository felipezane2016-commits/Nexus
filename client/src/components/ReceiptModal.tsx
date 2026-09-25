import {
  RECEIPT_CATEGORIES,
  validateReceiptDraft,
  type Receipt,
  type ReceiptCategory,
  type ReceiptDraft,
  type ValidationErrors,
} from "@/lib/portal";
import { Paperclip, X } from "lucide-react";
import { useState, type ChangeEvent, type FormEvent } from "react";

function emptyDraft(competencia: string): ReceiptDraft {
  return {
    serviceDate: `${competencia}-01`,
    category: "Diligência",
    client: "",
    caseRef: "",
    requester: "",
    description: "",
    amount: "",
    attachmentName: null,
  };
}

function receiptToDraft(receipt: Receipt): ReceiptDraft {
  return {
    serviceDate: receipt.serviceDate,
    category: receipt.category,
    client: receipt.client,
    caseRef: receipt.caseRef,
    requester: receipt.requester,
    description: receipt.description,
    amount: receipt.amount.toFixed(2).replace(".", ","),
    attachmentName: receipt.attachmentName,
  };
}

type ReceiptModalProps = {
  receipt: Receipt | null;
  competencia: string;
  onClose: () => void;
  onSave: (draft: ReceiptDraft) => void;
};

export default function ReceiptModal({
  receipt,
  competencia,
  onClose,
  onSave,
}: ReceiptModalProps) {
  const [draft, setDraft] = useState<ReceiptDraft>(() =>
    receipt ? receiptToDraft(receipt) : emptyDraft(competencia)
  );
  const [errors, setErrors] = useState<ValidationErrors>({});

  function update<K extends keyof ReceiptDraft>(
    field: K,
    value: ReceiptDraft[K]
  ) {
    setDraft(current => ({ ...current, [field]: value }));
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    update("attachmentName", event.target.files?.[0]?.name ?? null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateReceiptDraft(draft);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    onSave(draft);
  }

  const firstError = Object.values(errors).find(Boolean);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={event => event.target === event.currentTarget && onClose()}
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={receipt ? "Editar recibo" : "Novo recibo"}
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              {receipt ? receipt.id : "Novo lançamento"}
            </span>
            <h2>{receipt ? "Editar recibo" : "Lançar recibo"}</h2>
            <p>
              O recibo fica como rascunho até você enviá-lo para conferência do
              escritório.
            </p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Fechar"
            onClick={onClose}
          >
            <X size={17} />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              <span>Data do serviço</span>
              <input
                type="date"
                value={draft.serviceDate}
                onChange={event => update("serviceDate", event.target.value)}
              />
            </label>
            <label>
              <span>Categoria</span>
              <select
                value={draft.category}
                onChange={event =>
                  update("category", event.target.value as ReceiptCategory)
                }
              >
                {RECEIPT_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-grid">
            <label>
              <span>Cliente</span>
              <input
                value={draft.client}
                onChange={event => update("client", event.target.value)}
                placeholder="Razão social ou nome"
              />
            </label>
            <label>
              <span>Valor (R$)</span>
              <input
                value={draft.amount}
                onChange={event => update("amount", event.target.value)}
                placeholder="1.280,50"
                inputMode="decimal"
              />
            </label>
          </div>

          <div className="form-grid">
            <label>
              <span>Caso / processo</span>
              <input
                value={draft.caseRef}
                onChange={event => update("caseRef", event.target.value)}
                placeholder="Número do processo ou projeto"
              />
            </label>
            <label>
              <span>Solicitante</span>
              <input
                value={draft.requester}
                onChange={event => update("requester", event.target.value)}
                placeholder="Quem pediu o serviço"
              />
            </label>
          </div>

          <label>
            <span>Descrição do serviço</span>
            <textarea
              value={draft.description}
              onChange={event => update("description", event.target.value)}
              placeholder="Descreva o que foi executado, onde e para quem."
            />
          </label>

          <label className="file-field">
            <span>Comprovante (NF, boleto ou recibo)</span>
            <div className="file-select">
              <input type="file" onChange={handleFile} />
              <Paperclip size={14} />
              {draft.attachmentName ?? "Selecionar arquivo — PDF, JPG ou PNG"}
            </div>
          </label>

          {firstError ? <p className="form-error">{firstError}</p> : null}

          <div className="modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className="primary-button">
              {receipt ? "Salvar alterações" : "Salvar rascunho"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
