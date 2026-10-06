import {
  RECEIPT_CATEGORIES,
  validateReceiptDraft,
  type Receipt,
  type ReceiptCategory,
  type ReceiptDraft,
  type ValidationErrors,
} from "@/lib/portal";
import { AlertCircle, CheckCircle2, Paperclip, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

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

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: (aria: {
    id: string;
    "aria-invalid"?: true;
    "aria-describedby"?: string;
  }) => ReactNode;
};

/** Liga rótulo, dica e erro ao campo, para leitor de tela anunciar os três. */
function Field({ id, label, error, hint, children }: FieldProps) {
  const describedBy = [error ? `${id}-erro` : null, hint ? `${id}-dica` : null]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="field-group">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy || undefined,
      })}
      {hint ? (
        <span id={`${id}-dica`} className="field-hint">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${id}-erro`} className="field-error" role="alert">
          <AlertCircle size={13} strokeWidth={2} />
          {error}
        </span>
      ) : null}
    </div>
  );
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
  const firstFieldRef = useRef<HTMLInputElement>(null);
  // onClose muda a cada render do pai; guardado em ref, o efeito abaixo roda uma
  // vez só e não devolve o foco ao primeiro campo no meio da digitação.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    firstFieldRef.current?.focus();
    const onKey = (event: KeyboardEvent) =>
      event.key === "Escape" && onCloseRef.current();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function update<K extends keyof ReceiptDraft>(
    field: K,
    value: ReceiptDraft[K]
  ) {
    setDraft(current => ({ ...current, [field]: value }));
    // Erro corrigido some na hora, sem esperar o próximo envio.
    if (errors[field])
      setErrors(current => ({ ...current, [field]: undefined }));
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    update("attachmentName", event.target.files?.[0]?.name ?? null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateReceiptDraft(draft);
    if (Object.values(found).some(Boolean)) {
      setErrors(found);
      return;
    }
    onSave(draft);
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={event => event.target === event.currentTarget && onClose()}
    >
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recibo-titulo"
      >
        <div className="modal-panel-header">
          <div>
            <span className="eyebrow">
              {receipt ? receipt.id : "Novo lançamento"}
            </span>
            <h2 id="recibo-titulo">
              {receipt ? "Editar recibo" : "Lançar recibo"}
            </h2>
            <p>
              O recibo fica como rascunho até você enviá-lo para conferência.
            </p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Fechar"
            onClick={onClose}
          >
            <X size={17} strokeWidth={2} />
          </button>
        </div>

        <form className="modal-panel-body" onSubmit={handleSubmit} noValidate>
          <div className="field-grid">
            <Field
              id="recibo-data"
              label="Data do serviço"
              error={errors.serviceDate}
            >
              {aria => (
                <input
                  {...aria}
                  ref={firstFieldRef}
                  className="field-input"
                  type="date"
                  value={draft.serviceDate}
                  onChange={event => update("serviceDate", event.target.value)}
                />
              )}
            </Field>
            <Field id="recibo-categoria" label="Categoria">
              {aria => (
                <select
                  {...aria}
                  className="field-input"
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
              )}
            </Field>
          </div>

          <div className="field-grid">
            <Field id="recibo-cliente" label="Cliente" error={errors.client}>
              {aria => (
                <input
                  {...aria}
                  className="field-input"
                  value={draft.client}
                  onChange={event => update("client", event.target.value)}
                  placeholder="Razão social ou nome"
                />
              )}
            </Field>
            <Field
              id="recibo-valor"
              label="Valor (R$)"
              error={errors.amount}
              hint="Aceita 1.280,50 ou 1280.50"
            >
              {aria => (
                <input
                  {...aria}
                  className="field-input"
                  value={draft.amount}
                  onChange={event => update("amount", event.target.value)}
                  placeholder="1.280,50"
                  inputMode="decimal"
                />
              )}
            </Field>
          </div>

          <div className="field-grid">
            <Field id="recibo-caso" label="Caso ou processo">
              {aria => (
                <input
                  {...aria}
                  className="field-input"
                  value={draft.caseRef}
                  onChange={event => update("caseRef", event.target.value)}
                  placeholder="Número do processo ou projeto"
                />
              )}
            </Field>
            <Field id="recibo-solicitante" label="Solicitante">
              {aria => (
                <input
                  {...aria}
                  className="field-input"
                  value={draft.requester}
                  onChange={event => update("requester", event.target.value)}
                  placeholder="Quem pediu o serviço"
                />
              )}
            </Field>
          </div>

          <Field
            id="recibo-descricao"
            label="Descrição do serviço"
            error={errors.description}
          >
            {aria => (
              <textarea
                {...aria}
                className="field-input"
                value={draft.description}
                onChange={event => update("description", event.target.value)}
                placeholder="O que foi executado, onde e para quem."
              />
            )}
          </Field>

          <div className="field-group">
            <span className="field-label" id="recibo-anexo-rotulo">
              Comprovante
            </span>
            <label
              className={
                draft.attachmentName
                  ? "upload-zone upload-zone-filled"
                  : "upload-zone"
              }
            >
              <input
                type="file"
                onChange={handleFile}
                aria-labelledby="recibo-anexo-rotulo"
              />
              {draft.attachmentName ? (
                <CheckCircle2 size={19} strokeWidth={1.9} />
              ) : (
                <Paperclip size={19} strokeWidth={1.9} />
              )}
              <strong>{draft.attachmentName ?? "Selecionar arquivo"}</strong>
              <span>
                {draft.attachmentName
                  ? "Clique para trocar"
                  : "NF, boleto ou recibo — PDF, JPG ou PNG"}
              </span>
            </label>
          </div>

          <div className="modal-panel-footer">
            <button
              type="button"
              className="button-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className="button-primary">
              {receipt ? "Salvar alterações" : "Salvar rascunho"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
