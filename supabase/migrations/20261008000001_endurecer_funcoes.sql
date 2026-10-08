-- ════════════════════════════════════════════════════════════════════════════
-- Endurece as funções (apontado pelo Security Advisor do Supabase)
--
-- O `revoke ... from anon` da migração inicial não basta: o Postgres dá
-- EXECUTE a PUBLIC em toda função nova, e o anon herda de PUBLIC. Aqui:
--   - ninguém anônimo executa nada;
--   - funções de gatilho não podem ser chamadas por /rest/v1/rpc (o gatilho
--     dispara do mesmo jeito: a permissão é checada ao criar o gatilho);
--   - quem está logado mantém só o que as políticas de RLS e o app usam.
-- E fixa o search_path das duas funções de gatilho que ainda não fixavam.
-- ════════════════════════════════════════════════════════════════════════════

alter function public.carimbar() set search_path = '';
alter function public.fornecedor_dados_bancarios() set search_path = '';

revoke execute on all functions in schema public from public, anon, authenticated;

-- Usadas pelas políticas de RLS (rodam com o papel de quem consulta).
grant execute on function
  public.meu_perfil(), public.eh_equipe(), public.eh_admin(), public.ve_modulo(text),
  public.pode_editar(), public.eh_financeiro(), public.meu_prestador(),
  public.aprovador_vigente(), public.aprovador_titular(), public.eh_aprovador()
to authenticated;

-- Chamada pelo app ao entrar.
grant execute on function public.registrar_acesso() to authenticated;

-- Funções criadas daqui para frente também nascem fechadas.
alter default privileges in schema public revoke execute on functions from public, anon;
