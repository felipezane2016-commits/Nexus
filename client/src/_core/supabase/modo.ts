/**
 * Modo real × demonstração. Com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no
 * ambiente (`.env.local`), o app fala com o Supabase: login de verdade, dados
 * no banco, permissões checadas pela RLS. Sem elas, é a demonstração de
 * sempre, com dados fictícios no navegador.
 */
const url = (import.meta.env?.VITE_SUPABASE_URL as string | undefined) ?? "";
const chave = (import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";

export const MODO_REAL = Boolean(url && chave);
export const CONFIG_SUPABASE = { url, chave };
