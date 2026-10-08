-- Reforça schema/RLS das tabelas locais/servicos (issue #40/#41).
-- Como não temos acesso de leitura ao schema completo do projeto fora
-- deste editor, cada passo é condicional (só roda se ainda não existir).
-- Seguro rodar mais de uma vez.

-- FK servicos.local_id -> locais.id, se ainda não existir.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'locais'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'servicos' and column_name = 'local_id'
  ) and not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'servicos_local_id_fkey'
  ) then
    alter table public.servicos
      add constraint servicos_local_id_fkey
      foreign key (local_id) references public.locais (id)
      on delete cascade;
  end if;
end $$;

-- FK locais.categoria_id -> categorias.id, se a tabela categorias existir
-- e a FK ainda não existir.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'categorias'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'locais' and column_name = 'categoria_id'
  ) and not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'locais_categoria_id_fkey'
  ) then
    alter table public.locais
      add constraint locais_categoria_id_fkey
      foreign key (categoria_id) references public.categorias (id)
      on delete set null;
  end if;
end $$;

-- Leitura pública (qualquer usuário autenticado) para dados de referência.
alter table public.locais enable row level security;
alter table public.servicos enable row level security;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'categorias'
  ) then
    execute 'alter table public.categorias enable row level security';
  end if;
end $$;

drop policy if exists "locais: leitura autenticada" on public.locais;
create policy "locais: leitura autenticada"
  on public.locais for select
  to authenticated
  using (true);

drop policy if exists "servicos: leitura autenticada" on public.servicos;
create policy "servicos: leitura autenticada"
  on public.servicos for select
  to authenticated
  using (true);

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'categorias'
  ) then
    execute 'drop policy if exists "categorias: leitura autenticada" on public.categorias';
    execute 'create policy "categorias: leitura autenticada" on public.categorias for select to authenticated using (true)';
  end if;
end $$;
