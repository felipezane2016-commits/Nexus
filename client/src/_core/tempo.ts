/**
 * Data de referência da demonstração. Os dados de exemplo vivem em junho e
 * julho de 2026; medir prazos contra o relógio real deixaria tudo vencido e a
 * demonstração sem sentido. Com backend, isto vira `new Date()`.
 */
export const HOJE = "2026-06-30";

export function hojeData() {
  return new Date(`${HOJE}T12:00:00`);
}

/** Diferença em dias corridos entre duas datas `YYYY-MM-DD` (b − a). */
export function diasEntre(a: string, b: string) {
  return Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86_400_000);
}

/** Dias úteis (seg–sex) decorridos de `inicio` até `fim`, sem contar o dia inicial. */
export function diasUteisEntre(inicio: string, fim: string) {
  let dias = 0;
  const cursor = new Date(`${inicio}T12:00:00`);
  const alvo = new Date(`${fim}T12:00:00`);
  while (cursor < alvo) {
    cursor.setDate(cursor.getDate() + 1);
    const semana = cursor.getDay();
    if (semana !== 0 && semana !== 6) dias += 1;
  }
  return dias;
}

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
