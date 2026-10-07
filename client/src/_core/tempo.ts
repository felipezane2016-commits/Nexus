/**
 * Data de referência da demonstração. Os dados de exemplo vivem em junho e
 * julho de 2026; medir prazos contra o relógio real deixaria tudo vencido e a
 * demonstração sem sentido. Com backend, isto vira `new Date()`.
 */
export const HOJE = "2026-06-30";

export function somarDias(data: string, dias: number) {
  const d = new Date(`${data}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function formatarData(data: string | null | undefined) {
  if (!data) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${data.slice(0, 10)}T12:00:00`));
}

export function formatarDataHora(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}

export function gerarId(prefixo: string) {
  return `${prefixo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Dias corridos de `data` até hoje (da demonstração). */
export function diasDesde(data: string) {
  return Math.round((Date.parse(`${HOJE}T12:00:00Z`) - Date.parse(`${data.slice(0, 10)}T12:00:00Z`)) / 86_400_000);
}
