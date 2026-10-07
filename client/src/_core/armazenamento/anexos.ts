/**
 * Arquivos anexados (PDF das invoices) no IndexedDB do navegador: o
 * localStorage não comporta binários. Com backend, vira upload para o
 * servidor e este módulo passa a falar com ele.
 */

export type Anexo = { id: string; nome: string; tipo: string; blob: Blob };

const BANCO = "pnst-anexos";
const LOJA = "arquivos";

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolver, rejeitar) => {
    const pedido = indexedDB.open(BANCO, 1);
    pedido.onupgradeneeded = () => pedido.result.createObjectStore(LOJA, { keyPath: "id" });
    pedido.onsuccess = () => resolver(pedido.result);
    pedido.onerror = () => rejeitar(pedido.error);
  });
}

async function operar<T>(modo: IDBTransactionMode, acao: (loja: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const banco = await abrir();
  return new Promise((resolver, rejeitar) => {
    const pedido = acao(banco.transaction(LOJA, modo).objectStore(LOJA));
    pedido.onsuccess = () => resolver(pedido.result);
    pedido.onerror = () => rejeitar(pedido.error);
  });
}

export async function guardarAnexo(arquivo: File): Promise<Anexo> {
  const anexo: Anexo = { id: `anx-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, nome: arquivo.name, tipo: arquivo.type || "application/pdf", blob: arquivo };
  await operar("readwrite", (loja) => loja.put(anexo));
  return anexo;
}

export async function lerAnexo(id: string): Promise<Anexo | null> {
  try {
    return (await operar<Anexo | undefined>("readonly", (loja) => loja.get(id))) ?? null;
  } catch {
    return null;
  }
}

export async function apagarAnexo(id: string) {
  try {
    await operar("readwrite", (loja) => loja.delete(id));
  } catch {
    // Sem IndexedDB (aba privada, por exemplo) não há o que apagar.
  }
}

export function baixarBlob(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
