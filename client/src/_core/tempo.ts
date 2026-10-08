import { MODO_REAL } from "./supabase/modo";

/** Data local (Brasília) no formato AAAA-MM-DD. */
function hojeReal() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/**
 * "Hoje" do sistema. No modo real é a data de Brasília. Na demonstração fica
 * em 30/06/2026: os dados de exemplo vivem em junho e julho de 2026, e medir
 * prazos contra o relógio real deixaria tudo vencido.
 */
export const HOJE = MODO_REAL ? hojeReal() : "2026-06-30";

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
