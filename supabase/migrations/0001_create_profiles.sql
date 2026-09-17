-- Tabela de perfis de usuário, 1:1 com auth.users.
-- Como aplicar: cole este arquivo inteiro no SQL Editor do projeto no
-- supabase.com e execute. Idempotente (pode rodar mais de uma vez).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  cpf text unique,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Mantém updated_at em dia a cada UPDATE.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Cria a linha de perfil automaticamente quando alguém se cadastra
-- (cadastro.tsx já envia "nome" em options.data no supabase.auth.signUp).
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome, email)
  values (new.id, new.raw_user_meta_data ->> 'nome', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS: cada usuário só acessa e edita o próprio perfil.
alter table public.profiles enable row level security;

drop policy if exists "profiles: select own" on public.profiles;
create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);
