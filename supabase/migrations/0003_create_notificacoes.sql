-- Tabela de notificações do usuário (issue #27 foi fechada, mas a
-- tabela nunca chegou a existir de fato no banco — confirmado consultando
-- a API do projeto antes de escrever esta migração). Como aplicar: cole
-- este arquivo no SQL Editor do Supabase e execute. Idempotente.

create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  -- Senha à qual essa notificação se refere (quando aplicável). A
  -- constraint unique abaixo evita duplicar a notificação "sua vez está
  -- chegando" toda vez que a tela recarrega.
  senha_id uuid references public.senhas (id) on delete cascade,
  titulo text not null,
  mensagem text not null,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists notificacoes_senha_unica
  on public.notificacoes (senha_id)
  where senha_id is not null;

alter table public.notificacoes enable row level security;

drop policy if exists "notificacoes: select own" on public.notificacoes;
create policy "notificacoes: select own"
  on public.notificacoes for select
  to authenticated
  using (auth.uid() = usuario_id);

drop policy if exists "notificacoes: insert own" on public.notificacoes;
create policy "notificacoes: insert own"
  on public.notificacoes for insert
  to authenticated
  with check (auth.uid() = usuario_id);

drop policy if exists "notificacoes: update own" on public.notificacoes;
create policy "notificacoes: update own"
  on public.notificacoes for update
  to authenticated
  using (auth.uid() = usuario_id);
