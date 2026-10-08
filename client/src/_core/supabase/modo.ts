/**
 * Modo real × demonstração. Com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no
 * ambiente (`.env.local`), o app fala com o Supabase: login de verdade, dados
 * no banco, permissões checadas pela RLS. Sem elas, é a demonstração de
 * sempre, com dados fictícios no navegador.
 */
const url = (import.meta.env?.VITE_SUPABASE_URL as string | undefined) ?? "";
const chave = (import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";

// Os testes automáticos (vitest) rodam sempre na demonstração, mesmo com um
// .env.local de verdade na pasta: nunca gravam no banco real.
export const MODO_REAL = Boolean(url && chave) && import.meta.env?.MODE !== "test";
export const CONFIG_SUPABASE = { url, chave };

/**
 * A demonstração só existe quando pedida (VITE_DEMO=1, como na prévia) ou nos
 * testes. Um site publicado sem as chaves do Supabase NÃO cai nela: mostra
 * "sistema não configurado" — ninguém digita dado real num ambiente de teste.
 */
export const MODO_DEMO =
  !MODO_REAL && ((import.meta.env?.VITE_DEMO as string | undefined) === "1" || import.meta.env?.MODE === "test");
