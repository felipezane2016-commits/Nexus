-- ════════════════════════════════════════════════════════════════════════════
-- PNST Administrativo — banco inicial
--
-- Cada coleção do app vira uma tabela `id text + dados jsonb`: o formato dos
-- registros continua sendo o do código (tipos.ts de cada módulo) e a camada
-- de sincronização do cliente só faz upsert/delete por id.
--
-- A segurança NÃO depende da tela: toda tabela tem RLS. Quem vê o quê sai do
-- perfil (papel + módulos, como em Usuários e acessos), e as regras que mexem
-- com dinheiro (segregação de funções nos pagamentos, troca de conta de
-- fornecedor) são checadas aqui, em gatilhos.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto with schema extensions;

-- ── Perfis: quem é quem ─────────────────────────────────────────────────────

create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nome text not null default '',
  departamento text not null default '',
  -- Mesmos papéis do app: admin, gestor, operador, viewer (leitor).
  papel text not null default 'viewer' check (papel in ('admin', 'gestor', 'operador', 'viewer')),
  modulos text[] not null default '{}',
  ativo boolean not null default true,
  -- 'equipe' usa o escritório; 'prestador' usa só o Portal do Prestador.
  tipo text not null default 'equipe' check (tipo in ('equipe', 'prestador')),
  prestador_id text,
  ultimo_acesso timestamptz,
  criado_em timestamptz not null default now()
);
create unique index perfis_email_unico on public.perfis (lower(email));

-- Funções de permissão. SECURITY DEFINER para ler `perfis` sem cair na RLS
-- dela mesma; `search_path` vazio contra sequestro de função.

create function public.meu_perfil() returns public.perfis
language sql stable security definer set search_path = '' as $$
  select p.* from public.perfis p where p.id = auth.uid() and p.ativo
$$;

create function public.eh_equipe() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo and p.tipo = 'equipe')
$$;

create function public.eh_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo and p.tipo = 'equipe' and p.papel = 'admin')
$$;

create function public.ve_modulo(modulo text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo and p.tipo = 'equipe' and modulo = any (p.modulos))
$$;

-- registros.editar no app: admin, gestor e operador.
create function public.pode_editar() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfis p where p.id = auth.uid() and p.ativo and p.tipo = 'equipe' and p.papel in ('admin', 'gestor', 'operador'))
$$;

-- Financeiro: edita e enxerga o Account Management (mesma regra de regras.ts).
create function public.eh_financeiro() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.pode_editar() and public.ve_modulo('contas')
$$;

-- ── Tabelas de dados (uma por coleção do app) ───────────────────────────────

create function public.criar_tabela_de_colecao(nome text) returns void
language plpgsql as $$
begin
  execute format($f$
    create table public.%I (
      id text primary key,
      dados jsonb not null,
      criado_em timestamptz not null default now(),
      atualizado_em timestamptz not null default now(),
      atualizado_por uuid default auth.uid()
    );
    alter table public.%I enable row level security;
  $f$, nome, nome);
end $$;

select public.criar_tabela_de_colecao(t) from unnest(array[
  'escritorio_tarefas', 'escritorio_documentos', 'escritorio_reunioes', 'notificacoes',
  'prestadores', 'recibos', 'fechamentos',
  'contas_tarefas', 'contas_taxas', 'contas_ordens', 'contas_eventos',
  'conciliacao_contas', 'conciliacao_extrato', 'conciliacao_razao', 'conciliacao_casamentos',
  'conciliacao_importacoes', 'conciliacao_saldos', 'conciliacao_fechamentos',
  'pagamentos', 'pagamentos_fornecedores', 'configuracoes'
]) as t;
drop function public.criar_tabela_de_colecao(text);

-- Colunas derivadas do JSON que as políticas precisam enxergar.
alter table public.recibos add column prestador_id text generated always as (dados ->> 'prestadorId') stored;
alter table public.fechamentos add column prestador_id text generated always as (dados ->> 'prestadorId') stored;
alter table public.pagamentos add column solicitante_id text generated always as (dados ->> 'solicitanteId') stored;
alter table public.pagamentos add column status text generated always as (dados ->> 'status') stored;
create index recibos_prestador on public.recibos (prestador_id);
create index fechamentos_prestador on public.fechamentos (prestador_id);
create index pagamentos_solicitante on public.pagamentos (solicitante_id);

-- O prestador logado (portal), se o acesso dele estiver ativo no cadastro.
create function public.meu_prestador() returns text
language sql stable security definer set search_path = '' as $$
  select p.prestador_id
  from public.perfis p
  join public.prestadores pr on pr.id = p.prestador_id
  where p.id = auth.uid() and p.ativo and p.tipo = 'prestador' and coalesce((pr.dados ->> 'portalAtivo')::boolean, false)
$$;

-- Quem aprova pagamentos hoje: o substituto dentro do período, senão o titular.
create function public.aprovador_vigente() returns uuid
language sql stable security definer set search_path = '' as $$
  select case
    when c.dados ->> 'substitutoId' is not null
      and (c.dados ->> 'substitutoDe')::date <= current_date
      and (c.dados ->> 'substitutoAte')::date >= current_date
    then nullif(c.dados ->> 'substitutoId', '')::uuid
    else nullif(c.dados ->> 'aprovadorId', '')::uuid
  end
  from public.configuracoes c where c.id = 'pagamentos-config'
$$;

-- O titular gravado hoje (lido sem RLS: a política da própria tabela usa isto).
create function public.aprovador_titular() returns uuid
language sql stable security definer set search_path = '' as $$
  select nullif(c.dados ->> 'aprovadorId', '')::uuid from public.configuracoes c where c.id = 'pagamentos-config'
$$;

create function public.eh_aprovador() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.eh_equipe() and (auth.uid() = public.aprovador_vigente() or auth.uid() = public.aprovador_titular())
$$;

-- ── Políticas ───────────────────────────────────────────────────────────────

-- Tabelas de um módulo: quem tem o módulo vê; quem tem o módulo e edita, grava.
create function public.politicas_de_modulo(tabela text, modulo text) returns void
language plpgsql as $$
begin
  execute format('create policy ver on public.%I for select to authenticated using (public.ve_modulo(%L))', tabela, modulo);
  execute format('create policy incluir on public.%I for insert to authenticated with check (public.pode_editar() and public.ve_modulo(%L))', tabela, modulo);
  execute format('create policy alterar on public.%I for update to authenticated using (public.pode_editar() and public.ve_modulo(%L)) with check (public.pode_editar() and public.ve_modulo(%L))', tabela, modulo, modulo);
  execute format('create policy excluir on public.%I for delete to authenticated using (public.pode_editar() and public.ve_modulo(%L))', tabela, modulo);
end $$;

select public.politicas_de_modulo('escritorio_tarefas', 'tarefas');
select public.politicas_de_modulo('escritorio_documentos', 'documentos');
select public.politicas_de_modulo('escritorio_reunioes', 'calendario');
select public.politicas_de_modulo(t, 'contas') from unnest(array[
  'contas_tarefas', 'contas_taxas', 'contas_ordens', 'contas_eventos',
  'conciliacao_contas', 'conciliacao_extrato', 'conciliacao_razao', 'conciliacao_casamentos',
  'conciliacao_importacoes', 'conciliacao_saldos', 'conciliacao_fechamentos'
]) as t;
drop function public.politicas_de_modulo(text, text);

-- Perfis: a equipe vê a equipe (nomes, aprovador); o prestador vê só o seu.
-- Só o administrador altera; ninguém insere ou apaga pelo app (convite e
-- gatilho de cadastro fazem isso).
alter table public.perfis enable row level security;
create policy ver on public.perfis for select to authenticated
  using ((public.eh_equipe() and tipo = 'equipe') or id = auth.uid() or public.eh_admin());
create policy alterar on public.perfis for update to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- Notificações: a caixa é da equipe; o portal só cria (fechamento recebido).
create policy ver on public.notificacoes for select to authenticated using (public.eh_equipe());
create policy incluir on public.notificacoes for insert to authenticated with check (public.eh_equipe() or public.meu_prestador() is not null);
create policy alterar on public.notificacoes for update to authenticated using (public.eh_equipe()) with check (public.eh_equipe());
create policy excluir on public.notificacoes for delete to authenticated using (public.pode_editar());

-- Prestadores: módulo Prestadores (e o financeiro, que paga) veem todos; o
-- prestador vê o próprio cadastro e não o altera.
create policy ver on public.prestadores for select to authenticated
  using (public.ve_modulo('prestadores') or public.ve_modulo('contas') or id = public.meu_prestador());
create policy incluir on public.prestadores for insert to authenticated with check (public.pode_editar() and public.ve_modulo('prestadores'));
create policy alterar on public.prestadores for update to authenticated
  using (public.pode_editar() and public.ve_modulo('prestadores')) with check (public.pode_editar() and public.ve_modulo('prestadores'));
create policy excluir on public.prestadores for delete to authenticated using (public.pode_editar() and public.ve_modulo('prestadores'));

-- Recibos: o escritório confere; o prestador lança, edita o que não foi
-- aprovado, envia — mas nunca aprova nem devolve.
create policy ver on public.recibos for select to authenticated
  using (public.ve_modulo('prestadores') or public.ve_modulo('contas') or prestador_id = public.meu_prestador());
create policy equipe_incluir on public.recibos for insert to authenticated with check (public.pode_editar() and public.ve_modulo('prestadores'));
create policy equipe_alterar on public.recibos for update to authenticated
  using (public.pode_editar() and public.ve_modulo('prestadores')) with check (public.pode_editar() and public.ve_modulo('prestadores'));
create policy equipe_excluir on public.recibos for delete to authenticated using (public.pode_editar() and public.ve_modulo('prestadores'));
create policy portal_incluir on public.recibos for insert to authenticated
  with check (prestador_id = public.meu_prestador() and dados ->> 'status' in ('Rascunho', 'Enviado'));
create policy portal_alterar on public.recibos for update to authenticated
  using (prestador_id = public.meu_prestador() and dados ->> 'status' <> 'Aprovado')
  with check (prestador_id = public.meu_prestador() and dados ->> 'status' in ('Rascunho', 'Enviado'));
create policy portal_excluir on public.recibos for delete to authenticated
  using (prestador_id = public.meu_prestador() and dados ->> 'status' = 'Rascunho');

-- Fechamentos: o prestador envia; conferir e pagar é do escritório.
create policy ver on public.fechamentos for select to authenticated
  using (public.ve_modulo('prestadores') or public.ve_modulo('contas') or prestador_id = public.meu_prestador());
create policy equipe_gravar on public.fechamentos for all to authenticated
  using ((public.pode_editar() and public.ve_modulo('prestadores')) or public.eh_financeiro())
  with check ((public.pode_editar() and public.ve_modulo('prestadores')) or public.eh_financeiro());
create policy portal_incluir on public.fechamentos for insert to authenticated
  with check (prestador_id = public.meu_prestador() and coalesce(dados ->> 'review', 'Aguardando conferência') = 'Aguardando conferência');
create policy portal_alterar on public.fechamentos for update to authenticated
  using (prestador_id = public.meu_prestador() and coalesce(dados ->> 'review', 'Aguardando conferência') = 'Aguardando conferência')
  with check (prestador_id = public.meu_prestador() and coalesce(dados ->> 'review', 'Aguardando conferência') = 'Aguardando conferência');

-- Pagamentos: qualquer pessoa da equipe pede; vê os próprios pedidos, e o
-- financeiro e o aprovador veem todos. As transições são do gatilho abaixo.
create policy ver on public.pagamentos for select to authenticated
  using (public.eh_equipe() and (solicitante_id = auth.uid()::text or public.eh_financeiro() or public.eh_aprovador()));
create policy incluir on public.pagamentos for insert to authenticated with check (public.eh_equipe());
create policy alterar on public.pagamentos for update to authenticated
  using (public.eh_equipe() and (solicitante_id = auth.uid()::text or public.eh_financeiro() or public.eh_aprovador()))
  with check (public.eh_equipe());
-- Sem política de exclusão: pagamento se cancela, nunca some.

-- Fornecedores: a equipe consulta (para pedir); financeiro e aprovador mantêm.
create policy ver on public.pagamentos_fornecedores for select to authenticated using (public.eh_equipe());
create policy incluir on public.pagamentos_fornecedores for insert to authenticated with check (public.eh_financeiro() or public.eh_aprovador());
create policy alterar on public.pagamentos_fornecedores for update to authenticated
  using (public.eh_financeiro() or public.eh_aprovador()) with check (public.eh_financeiro() or public.eh_aprovador());

-- Configurações (um registro por chave): a equipe lê; cada chave tem seu dono.
create policy ver on public.configuracoes for select to authenticated using (public.eh_equipe());
-- Aprovador e substituto: o administrador ou o próprio aprovador titular.
create policy gravar_aprovacao on public.configuracoes for all to authenticated
  using (id = 'pagamentos-config' and (public.eh_admin() or auth.uid() = public.aprovador_titular()))
  with check (id = 'pagamentos-config' and (public.eh_admin() or auth.uid() = public.aprovador_titular()));
create policy gravar_emails on public.configuracoes for all to authenticated
  using (id = 'contas-config-emails' and public.pode_editar() and public.ve_modulo('contas'))
  with check (id = 'contas-config-emails' and public.pode_editar() and public.ve_modulo('contas'));

-- ── Regras de negócio no banco ──────────────────────────────────────────────

-- Data de atualização e autor em toda gravação.
create function public.carimbar() returns trigger
language plpgsql as $$
begin
  new.atualizado_em := now();
  new.atualizado_por := auth.uid();
  return new;
end $$;

-- Numeração PG-0001 única no banco: quem não é do financeiro só enxerga os
-- próprios pedidos e não teria como saber o próximo número.
create sequence public.pagamentos_numero;

create function public.pagamento_novo() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  eu uuid := auth.uid();
begin
  if eu is not null then
    if new.dados ->> 'solicitanteId' is distinct from eu::text then
      raise exception 'O pedido precisa sair em nome de quem está logado.';
    end if;
    -- Pedido comum entra em conferência; o lote de prestador já vem conferido pelo financeiro.
    if new.dados ->> 'status' = 'Aguardando aprovação' then
      if not (public.eh_financeiro() and new.dados ->> 'origem' = 'Prestadores') then
        raise exception 'Pedido novo começa em conferência.';
      end if;
    elsif new.dados ->> 'status' <> 'Em conferência' then
      raise exception 'Pedido novo começa em conferência.';
    end if;
  end if;
  new.dados := jsonb_set(new.dados, '{numero}', to_jsonb('PG-' || lpad(nextval('public.pagamentos_numero')::text, 4, '0')));
  return new;
end $$;

-- Segregação de funções: quem pede não confere, quem pede ou confere não
-- aprova, quem aprova não paga. Espelha modulos/pagamentos/regras.ts.
create function public.pagamento_transicao() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  eu text := auth.uid()::text;
  de text := old.dados ->> 'status';
  para text := new.dados ->> 'status';
  solicitante text := old.dados ->> 'solicitanteId';
  conferente text := old.dados #>> '{conferencia,porId}';
begin
  if auth.uid() is null then return new; end if; -- manutenção pelo painel do Supabase
  new.dados := jsonb_set(new.dados, '{numero}', old.dados -> 'numero');
  new.dados := jsonb_set(new.dados, '{solicitanteId}', old.dados -> 'solicitanteId');

  if de = para then
    if not (public.eh_financeiro() or (eu = solicitante and de = 'Devolvido')) then
      raise exception 'Só o financeiro altera um pedido em andamento.';
    end if;
    return new;
  end if;

  if para = 'Cancelado' then
    if de not in ('Em conferência', 'Devolvido', 'Aguardando aprovação', 'Aprovado') then
      raise exception 'Este pagamento não pode mais ser cancelado.';
    end if;
    if not (eu = solicitante or public.eh_financeiro()) then
      raise exception 'Só quem pediu ou o financeiro cancela.';
    end if;
    return new;
  end if;

  if de = 'Em conferência' and para in ('Aguardando aprovação', 'Devolvido') then
    if not public.eh_financeiro() then raise exception 'A conferência é do financeiro.'; end if;
    if eu = solicitante then raise exception 'Quem pediu o pagamento não confere o próprio pedido.'; end if;
    if para = 'Aguardando aprovação' and new.dados #>> '{conferencia,porId}' is distinct from eu then
      raise exception 'A conferência precisa ser registrada em nome de quem conferiu.';
    end if;
    return new;
  end if;

  if de = 'Aguardando aprovação' and para in ('Aprovado', 'Reprovado', 'Devolvido') then
    if auth.uid() is distinct from public.aprovador_vigente() then
      raise exception 'A aprovação é do chefe da administração (ou do substituto no período).';
    end if;
    if eu = solicitante or eu = conferente then
      raise exception 'Quem pediu ou conferiu não aprova: a aprovação fica com o substituto.';
    end if;
    if para = 'Aprovado' and new.dados #>> '{aprovacao,porId}' is distinct from eu then
      raise exception 'A aprovação precisa ser registrada em nome de quem aprovou.';
    end if;
    return new;
  end if;

  if de = 'Aprovado' and para = 'Pago' then
    if not public.eh_financeiro() then raise exception 'O pagamento é registrado pelo financeiro.'; end if;
    if eu = old.dados #>> '{aprovacao,porId}' then raise exception 'Quem aprovou não executa o pagamento.'; end if;
    return new;
  end if;

  if de = 'Devolvido' and para = 'Em conferência' then
    if not (eu = solicitante or public.eh_financeiro()) then
      raise exception 'Só quem pediu ou o financeiro reenvia.';
    end if;
    return new;
  end if;

  raise exception 'Mudança de situação não permitida: % → %.', de, para;
end $$;

-- Troca de banco, agência, conta ou Pix derruba a validação, venha de onde vier.
create function public.fornecedor_dados_bancarios() returns trigger
language plpgsql as $$
begin
  if (old.dados ->> 'banco', old.dados ->> 'agencia', old.dados ->> 'conta', old.dados ->> 'chavePix')
     is distinct from (new.dados ->> 'banco', new.dados ->> 'agencia', new.dados ->> 'conta', new.dados ->> 'chavePix') then
    new.dados := jsonb_set(new.dados, '{dadosValidados}', 'false'::jsonb);
  end if;
  return new;
end $$;

-- O último administrador ativo não pode deixar de ser administrador.
create function public.proteger_ultimo_admin() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.papel = 'admin' and old.ativo and (new.papel <> 'admin' or not new.ativo or new.tipo <> 'equipe')
     and (select count(*) from public.perfis p where p.papel = 'admin' and p.ativo and p.tipo = 'equipe') <= 1 then
    raise exception 'Este é o último administrador ativo do sistema.';
  end if;
  new.id := old.id;
  new.email := old.email;
  return new;
end $$;

do $$
declare t text;
begin
  for t in select unnest(array[
    'escritorio_tarefas', 'escritorio_documentos', 'escritorio_reunioes', 'notificacoes',
    'prestadores', 'recibos', 'fechamentos',
    'contas_tarefas', 'contas_taxas', 'contas_ordens', 'contas_eventos',
    'conciliacao_contas', 'conciliacao_extrato', 'conciliacao_razao', 'conciliacao_casamentos',
    'conciliacao_importacoes', 'conciliacao_saldos', 'conciliacao_fechamentos',
    'pagamentos', 'pagamentos_fornecedores', 'configuracoes'
  ]) loop
    execute format('create trigger carimbar before insert or update on public.%I for each row execute function public.carimbar()', t);
  end loop;
end $$;

create trigger pagamento_novo before insert on public.pagamentos for each row execute function public.pagamento_novo();
create trigger pagamento_transicao before update on public.pagamentos for each row execute function public.pagamento_transicao();
create trigger fornecedor_dados_bancarios before update on public.pagamentos_fornecedores for each row execute function public.fornecedor_dados_bancarios();
create trigger proteger_ultimo_admin before update on public.perfis for each row execute function public.proteger_ultimo_admin();

-- ── Auditoria: tudo que muda fica registrado ────────────────────────────────

create table public.auditoria (
  id bigint generated always as identity primary key,
  quando timestamptz not null default now(),
  usuario uuid default auth.uid(),
  tabela text not null,
  registro_id text not null,
  operacao text not null,
  antes jsonb,
  depois jsonb
);
create index auditoria_registro on public.auditoria (tabela, registro_id);
alter table public.auditoria enable row level security;
create policy ver on public.auditoria for select to authenticated using (public.eh_admin());

create function public.auditar() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.auditoria (tabela, registro_id, operacao, antes, depois)
  values (
    tg_table_name,
    coalesce(new.id::text, old.id::text),
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return null;
end $$;

do $$
declare t text;
begin
  for t in select unnest(array[
    'perfis', 'prestadores', 'recibos', 'fechamentos',
    'contas_ordens', 'conciliacao_contas', 'conciliacao_extrato', 'conciliacao_razao', 'conciliacao_casamentos',
    'conciliacao_fechamentos', 'pagamentos', 'pagamentos_fornecedores', 'configuracoes'
  ]) loop
    execute format('create trigger auditar after insert or update or delete on public.%I for each row execute function public.auditar()', t);
  end loop;
end $$;

-- ── Cadastro: cada usuário do Supabase Auth ganha um perfil ─────────────────
-- O primeiro usuário vira administrador (é quem configura o sistema — por
-- isso o cadastro público fica DESLIGADO desde o início; ver SUPABASE.md). Um
-- e-mail igual ao de um prestador com portal ativo vira acesso ao portal.
-- Os demais entram como leitor sem módulos até o convite ou o administrador
-- liberar em Usuários e acessos.

create function public.novo_usuario() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  prestador text;
  nome text := coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1));
begin
  select pr.id into prestador from public.prestadores pr
  where lower(pr.dados ->> 'email') = lower(new.email) and coalesce((pr.dados ->> 'portalAtivo')::boolean, false)
  limit 1;

  if prestador is not null then
    insert into public.perfis (id, email, nome, tipo, prestador_id, papel)
    values (new.id, new.email, nome, 'prestador', prestador, 'viewer');
  elsif not exists (select 1 from public.perfis p where p.papel = 'admin') then
    insert into public.perfis (id, email, nome, papel, modulos)
    values (new.id, new.email, nome, 'admin', array['visao', 'calendario', 'tarefas', 'documentos', 'prestadores', 'contas']);
  else
    -- Papel e módulos NUNCA vêm dos metadados do cadastro (quem se cadastra
    -- escreveria o que quisesse): o convite, no servidor, é que os define.
    insert into public.perfis (id, email, nome) values (new.id, new.email, nome);
  end if;
  return new;
end $$;

create trigger novo_usuario after insert on auth.users for each row execute function public.novo_usuario();

-- Último acesso: o próprio usuário registra, sem poder mexer no resto do perfil.
create function public.registrar_acesso() returns void
language sql security definer set search_path = '' as $$
  update public.perfis set ultimo_acesso = now() where id = auth.uid()
$$;

-- ── Arquivos (PDFs de invoices, documentos, comprovantes) ───────────────────

insert into storage.buckets (id, name, public, file_size_limit)
values ('anexos', 'anexos', false, 20971520)
on conflict (id) do nothing;

create policy anexos_ver on storage.objects for select to authenticated using (bucket_id = 'anexos' and public.eh_equipe());
create policy anexos_incluir on storage.objects for insert to authenticated with check (bucket_id = 'anexos' and public.eh_equipe());
create policy anexos_excluir on storage.objects for delete to authenticated using (bucket_id = 'anexos' and public.pode_editar());

-- ── Tempo real: as telas abertas recebem o que os outros gravam ─────────────

do $$
declare t text;
begin
  for t in select unnest(array[
    'perfis', 'escritorio_tarefas', 'escritorio_documentos', 'escritorio_reunioes', 'notificacoes',
    'prestadores', 'recibos', 'fechamentos',
    'contas_tarefas', 'contas_taxas', 'contas_ordens', 'contas_eventos',
    'conciliacao_contas', 'conciliacao_extrato', 'conciliacao_razao', 'conciliacao_casamentos',
    'conciliacao_importacoes', 'conciliacao_saldos', 'conciliacao_fechamentos',
    'pagamentos', 'pagamentos_fornecedores', 'configuracoes'
  ]) loop
    execute format('alter publication supabase_realtime add table public.%I', t);
  end loop;
end $$;

-- Ninguém anônimo lê nada.
revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from anon;
