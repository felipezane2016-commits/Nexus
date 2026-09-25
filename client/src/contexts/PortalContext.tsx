import {
  competenciaOf,
  nextReceiptId,
  parseAmount,
  type Closing,
  type PrototypeReceiptStatus,
  type Provider,
  type Receipt,
  type ReceiptDraft,
} from "@/lib/portal";
import {
  DEMO_CLOSINGS,
  DEMO_COMPETENCIA,
  DEMO_CREDENTIALS,
  DEMO_PROVIDER,
  DEMO_RECEIPTS,
} from "@/lib/portalSeed";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Estado do protótipo. Não há servidor: os dados são semeados a partir de
 * `portalSeed` e persistidos em localStorage para que a navegação e o reload
 * pareçam reais durante a demonstração.
 */

const STORAGE_KEY = "nexus-portal-prototipo-v1";

type PersistedState = {
  signedIn: boolean;
  receipts: Receipt[];
  closings: Closing[];
};

type PortalContextValue = {
  provider: Provider;
  signedIn: boolean;
  receipts: Receipt[];
  closings: Closing[];
  currentCompetencia: string;
  signIn: (
    code: string,
    password: string
  ) => { ok: true } | { ok: false; message: string };
  signOut: () => void;
  resetPrototype: () => void;
  createReceipt: (draft: ReceiptDraft) => Receipt;
  updateReceipt: (id: string, draft: ReceiptDraft) => void;
  submitReceipt: (id: string) => void;
  removeReceipt: (id: string) => void;
  closingFor: (competencia: string) => Closing;
  attachClosingDocument: (
    competencia: string,
    documentName: string | null
  ) => void;
  submitClosing: (competencia: string) => void;
};

const PortalContext = createContext<PortalContextValue | null>(null);

function emptyClosing(competencia: string): Closing {
  return {
    competencia,
    documentName: null,
    submitted: false,
    submittedAt: null,
  };
}

function readPersisted(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!Array.isArray(parsed.receipts) || !Array.isArray(parsed.closings))
      return null;
    return parsed;
  } catch {
    // localStorage indisponível (navegação privada, storage bloqueado) — o
    // protótipo segue funcionando apenas em memória.
    return null;
  }
}

function draftToFields(draft: ReceiptDraft) {
  return {
    competencia: competenciaOf(draft.serviceDate),
    serviceDate: draft.serviceDate,
    category: draft.category,
    client: draft.client.trim(),
    caseRef: draft.caseRef.trim(),
    requester: draft.requester.trim(),
    description: draft.description.trim(),
    amount: parseAmount(draft.amount),
    attachmentName: draft.attachmentName,
  };
}

export function PortalProvider({ children }: { children: ReactNode }) {
  const persisted = useMemo(readPersisted, []);
  const [signedIn, setSignedIn] = useState(persisted?.signedIn ?? false);
  const [receipts, setReceipts] = useState<Receipt[]>(
    persisted?.receipts ?? DEMO_RECEIPTS
  );
  const [closings, setClosings] = useState<Closing[]>(
    persisted?.closings ?? DEMO_CLOSINGS
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          signedIn,
          receipts,
          closings,
        } satisfies PersistedState)
      );
    } catch {
      // Persistência é conveniência, não requisito.
    }
  }, [signedIn, receipts, closings]);

  const signIn = useCallback((code: string, password: string) => {
    const matches =
      code.trim().toUpperCase() === DEMO_CREDENTIALS.code &&
      password === DEMO_CREDENTIALS.password;
    if (!matches) {
      return {
        ok: false as const,
        message: "Código de acesso ou senha incorretos.",
      };
    }
    setSignedIn(true);
    return { ok: true as const };
  }, []);

  const signOut = useCallback(() => setSignedIn(false), []);

  const resetPrototype = useCallback(() => {
    setReceipts(DEMO_RECEIPTS);
    setClosings(DEMO_CLOSINGS);
  }, []);

  const createReceipt = useCallback((draft: ReceiptDraft) => {
    const fields = draftToFields(draft);
    let created!: Receipt;
    setReceipts(current => {
      created = {
        id: nextReceiptId(current),
        ...fields,
        status: "Rascunho" as PrototypeReceiptStatus,
        reviewNote: null,
        createdAt: new Date().toISOString(),
      };
      return [created, ...current];
    });
    return created;
  }, []);

  const updateReceipt = useCallback((id: string, draft: ReceiptDraft) => {
    const fields = draftToFields(draft);
    setReceipts(current =>
      current.map(receipt =>
        receipt.id === id
          ? {
              ...receipt,
              ...fields,
              // Reeditar um recibo devolvido volta a fila: limpa a devolutiva e
              // reabre como rascunho para novo envio.
              status:
                receipt.status === "Rejeitado" ? "Rascunho" : receipt.status,
              reviewNote:
                receipt.status === "Rejeitado" ? null : receipt.reviewNote,
            }
          : receipt
      )
    );
  }, []);

  const submitReceipt = useCallback((id: string) => {
    setReceipts(current =>
      current.map(receipt =>
        receipt.id === id && receipt.status !== "Aprovado"
          ? { ...receipt, status: "Enviado", reviewNote: null }
          : receipt
      )
    );
  }, []);

  const removeReceipt = useCallback((id: string) => {
    setReceipts(current => current.filter(receipt => receipt.id !== id));
  }, []);

  const closingFor = useCallback(
    (competencia: string) =>
      closings.find(closing => closing.competencia === competencia) ??
      emptyClosing(competencia),
    [closings]
  );

  const upsertClosing = useCallback(
    (competencia: string, patch: Partial<Closing>) => {
      setClosings(current => {
        const existing = current.find(
          closing => closing.competencia === competencia
        );
        if (!existing)
          return [...current, { ...emptyClosing(competencia), ...patch }];
        return current.map(closing =>
          closing.competencia === competencia
            ? { ...closing, ...patch }
            : closing
        );
      });
    },
    []
  );

  const attachClosingDocument = useCallback(
    (competencia: string, documentName: string | null) =>
      upsertClosing(competencia, { documentName }),
    [upsertClosing]
  );

  const submitClosing = useCallback(
    (competencia: string) => {
      upsertClosing(competencia, {
        submitted: true,
        submittedAt: new Date().toISOString(),
      });
      // Enviar o fechamento também encaminha os rascunhos da competência.
      setReceipts(current =>
        current.map(receipt =>
          receipt.competencia === competencia && receipt.status === "Rascunho"
            ? { ...receipt, status: "Enviado" }
            : receipt
        )
      );
    },
    [upsertClosing]
  );

  const value = useMemo<PortalContextValue>(
    () => ({
      provider: DEMO_PROVIDER,
      signedIn,
      receipts,
      closings,
      currentCompetencia: DEMO_COMPETENCIA,
      signIn,
      signOut,
      resetPrototype,
      createReceipt,
      updateReceipt,
      submitReceipt,
      removeReceipt,
      closingFor,
      attachClosingDocument,
      submitClosing,
    }),
    [
      signedIn,
      receipts,
      closings,
      signIn,
      signOut,
      resetPrototype,
      createReceipt,
      updateReceipt,
      submitReceipt,
      removeReceipt,
      closingFor,
      attachClosingDocument,
      submitClosing,
    ]
  );

  return (
    <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
  );
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context)
    throw new Error("usePortal precisa estar dentro de <PortalProvider>.");
  return context;
}
