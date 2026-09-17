-- SmartLine — cole este arquivo no SQL Editor do Supabase (uma vez).
-- Cobre: #23 usuarios, #24 locais/servicos, #10 senhas.
-- NÃO cria tabela de Fila nem de Notificações.

create extension if not exists pgcrypto;

do $$ begin
  create type public.papel_usuario as enum ('cidadao', 'recepcao', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.status_senha as enum (
    'aguardando', 'chamado', 'atendido', 'nao_compareceu', 'cancelado'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.origem_senha as enum ('app', 'balcao');
exception when duplicate_object then null;
end $$;

create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  icone text,
  ordem int not null default 0
);

create table if not exists public.locais (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.categorias (id),
  nome text not null,
  endereco text not null,
  distancia text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  horario_abertura time,
  horario_fechamento time,
  icone text,
  cor_icone text,
  cor_fundo text,
  ativo boolean not null default true
);

create table if not exists public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text not null unique,
  papel public.papel_usuario not null default 'cidadao',
  local_id uuid references public.locais (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.servicos (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locais (id) on delete cascade,
  titulo text not null,
  descricao text,
  setor text,
  prefixo_senha char(1) not null,
  tempo_medio_minutos int not null default 5,
  prazo_comparecimento_segundos int not null default 240,
  icone text,
  cor_icone text,
  cor_fundo text,
  ativo boolean not null default true
);

create table if not exists public.senhas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.usuarios (id),
  servico_id uuid not null references public.servicos (id),
  origem public.origem_senha not null default 'app',
  codigo text not null,
  numero int not null,
  token char(4) not null,
  status public.status_senha not null default 'aguardando',
  posicao int,
  retirada_em timestamptz not null default now(),
  chamado_em timestamptz,
  token_expira_em timestamptz,
  atendido_em timestamptz,
  finalizado_em timestamptz,
  constraint senhas_app_tem_usuario check (
    (origem = 'app' and usuario_id is not null)
    or (origem = 'balcao' and usuario_id is null)
  )
);

create unique index if not exists senhas_uma_ativa_por_usuario
  on public.senhas (usuario_id)
  where status in ('aguardando', 'chamado') and usuario_id is not null;

create unique index if not exists senhas_token_aberto_por_servico
  on public.senhas (servico_id, token)
  where status in ('aguardando', 'chamado');

create index if not exists senhas_fila_idx
  on public.senhas (servico_id, status, retirada_em);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, nome, email, papel)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    'cidadao'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.entrar_na_fila(p_servico_id uuid)
returns public.senhas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_servico public.servicos;
  v_senha public.senhas;
  v_numero int;
  v_token char(4);
  i int := 0;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  if exists (
    select 1 from public.senhas
    where usuario_id = auth.uid()
      and status in ('aguardando', 'chamado')
  ) then
    raise exception 'Você já possui uma senha ativa';
  end if;

  select * into v_servico
  from public.servicos
  where id = p_servico_id and ativo = true;

  if v_servico.id is null then
    raise exception 'Serviço indisponível';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_servico_id::text));

  select coalesce(max(numero), 0) + 1
    into v_numero
  from public.senhas
  where servico_id = p_servico_id
    and retirada_em::date = (timezone('America/Araguaina', now()))::date;

  loop
    i := i + 1;
    v_token := lpad(floor(random() * 10000)::int::text, 4, '0');
    exit when not exists (
      select 1 from public.senhas
      where servico_id = p_servico_id
        and token = v_token
        and status in ('aguardando', 'chamado')
    );
    if i > 30 then
      raise exception 'Não foi possível gerar token';
    end if;
  end loop;

  insert into public.senhas (
    usuario_id, servico_id, origem, codigo, numero, token, status
  ) values (
    auth.uid(),
    p_servico_id,
    'app',
    v_servico.prefixo_senha || lpad(v_numero::text, 3, '0'),
    v_numero,
    v_token,
    'aguardando'
  )
  returning * into v_senha;

  return v_senha;
end;
$$;

alter table public.categorias enable row level security;
alter table public.locais enable row level security;
alter table public.servicos enable row level security;
alter table public.usuarios enable row level security;
alter table public.senhas enable row level security;

drop policy if exists categorias_leitura on public.categorias;
create policy categorias_leitura on public.categorias
  for select to authenticated using (true);

drop policy if exists locais_leitura on public.locais;
create policy locais_leitura on public.locais
  for select to authenticated using (ativo = true);

drop policy if exists servicos_leitura on public.servicos;
create policy servicos_leitura on public.servicos
  for select to authenticated using (ativo = true);

drop policy if exists usuarios_le_proprio on public.usuarios;
create policy usuarios_le_proprio on public.usuarios
  for select to authenticated using (id = auth.uid());

drop policy if exists usuarios_atualiza_proprio on public.usuarios;
create policy usuarios_atualiza_proprio on public.usuarios
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists senhas_cidadao_le_ativa on public.senhas;
create policy senhas_cidadao_le_ativa on public.senhas
  for select to authenticated
  using (
    usuario_id = auth.uid()
    and status in ('aguardando', 'chamado')
  );

create or replace function public.contagem_espera()
returns table (servico_id uuid, total int)
language sql
stable
security definer
set search_path = public
as $$
  select servico_id, count(*)::int as total
  from public.senhas
  where status in ('aguardando', 'chamado')
  group by servico_id;
$$;

grant execute on function public.entrar_na_fila(uuid) to authenticated;
grant execute on function public.contagem_espera() to authenticated;

-- Seed (pode rodar mais de uma vez)
insert into public.categorias (id, nome, slug, icone, ordem) values
  ('11111111-1111-1111-1111-111111111001', 'Cartórios', 'cartorios', 'business-outline', 1),
  ('11111111-1111-1111-1111-111111111002', 'Serviços', 'servicos', 'ellipsis-horizontal', 2),
  ('11111111-1111-1111-1111-111111111003', 'Documentação', 'documentacao', 'document-text-outline', 3),
  ('11111111-1111-1111-1111-111111111004', 'Veículos', 'veiculos', 'car-outline', 4)
on conflict (slug) do nothing;

insert into public.locais (
  id, categoria_id, nome, endereco, distancia, icone, cor_icone, cor_fundo,
  horario_abertura, horario_fechamento
) values
  (
    '22222222-2222-2222-2222-222222222001',
    '11111111-1111-1111-1111-111111111002',
    'Resolve Palmas — Centro',
    'Av. JK, 104 Norte, Palmas – TO',
    '450 m',
    'grid-outline', '#0757D8', '#EDF4FF',
    '08:00', '18:00'
  ),
  (
    '22222222-2222-2222-2222-222222222002',
    '11111111-1111-1111-1111-111111111001',
    'Cartório 2º Ofício',
    'Quadra 104 Norte, Av. LO 2, Nº 30',
    '850 m',
    'document-text-outline', '#274A8A', '#FFF7E5',
    '08:00', '17:00'
  ),
  (
    '22222222-2222-2222-2222-222222222003',
    '11111111-1111-1111-1111-111111111004',
    'Detran Palmas',
    '104 Sul, Av. LO 1, Conj. 01, Lt. 05',
    '1,2 km',
    'car-outline', '#0757D8', '#EDF4FF',
    '08:00', '17:00'
  )
on conflict (id) do nothing;

insert into public.servicos (
  id, local_id, titulo, descricao, setor, prefixo_senha, tempo_medio_minutos,
  icone, cor_icone, cor_fundo
) values
  (
    '33333333-3333-3333-3333-333333333001',
    '22222222-2222-2222-2222-222222222001',
    'Emissão de documentos',
    'RG, CPF, CNH e 2ª via de documentos.',
    'Identificação', 'A', 5,
    'document-text-outline', '#0757D8', '#EDF4FF'
  ),
  (
    '33333333-3333-3333-3333-333333333002',
    '22222222-2222-2222-2222-222222222001',
    'Atendimento tributário',
    'IPTU, ITBI, Alvará e demais tributos.',
    'Tributos', 'B', 5,
    'cash-outline', '#C9930B', '#FFF3D6'
  ),
  (
    '33333333-3333-3333-3333-333333333003',
    '22222222-2222-2222-2222-222222222001',
    'Credencial do idoso',
    'Emissão e renovação da credencial.',
    'Assistência Social', 'C', 5,
    'person-circle-outline', '#FFFFFF', '#0757D8'
  ),
  (
    '33333333-3333-3333-3333-333333333004',
    '22222222-2222-2222-2222-222222222001',
    'Protocolo geral',
    'Protocolos, requerimentos e processos.',
    'Protocolo', 'D', 5,
    'reader-outline', '#0757D8', '#EDF4FF'
  )
on conflict (id) do nothing;
