import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { CONFIG_SUPABASE, MODO_REAL } from "./modo";

/**
 * O link do convite e o de "esqueci a senha" chegam com `#...type=invite` ou
 * `type=recovery` na URL. O supabase-js consome e apaga esse trecho ao
 * iniciar, então ele é lido antes — é o que decide mostrar "Defina sua senha".
 */
const hashInicial = typeof window !== "undefined" ? window.location.hash : "";
export const CHEGOU_POR_LINK: "convite" | "recuperacao" | null = /type=invite/.test(hashInicial)
  ? "convite"
  : /type=recovery/.test(hashInicial)
    ? "recuperacao"
    : null;

let cliente: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!MODO_REAL) throw new Error("Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
  cliente ??= createClient(CONFIG_SUPABASE.url, CONFIG_SUPABASE.chave, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return cliente;
}
