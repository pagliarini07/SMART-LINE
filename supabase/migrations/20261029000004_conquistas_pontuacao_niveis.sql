-- SmartLine: estrutura inicial de conquistas, progresso, níveis e pontuação.
-- Issue #68. Idempotente: pode ser executada novamente sem duplicar as conquistas.
-- A pontuação e o progresso serão escritos por lógica confiável no banco, não pelo app.

create table if not exists public.conquistas (
  id text primary key,
  nome text not null,
  descricao text not null,
  categoria text not null
    check (categoria in ('locais', 'servicos', 'sequencia')),
  criterio jsonb not null default '{}'::jsonb,
  recompensa_pontos integer not null default 0
    check (recompensa_pontos >= 0),
  ativa boolean not null default true,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.progresso_conquistas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  conquista_id text not null references public.conquistas (id) on delete cascade,
  progresso_atual integer not null default 0 check (progresso_atual >= 0),
  concluida_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint progresso_conquistas_usuario_conquista_unica
    unique (usuario_id, conquista_id)
);

-- Ledger de pontos: cada origem/referência só pode recompensar o usuário uma vez.
-- Não é permitido ao cliente inserir, editar ou apagar lançamentos diretamente.
create table if not exists public.pontos_usuarios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  quantidade integer not null check (quantidade > 0),
  origem text not null check (origem in ('senha_atendida', 'conquista')),
  referencia_id text not null,
  descricao text,
  created_at timestamptz not null default now(),
  constraint pontos_usuarios_origem_referencia_unica
    unique (usuario_id, origem, referencia_id)
);

-- A tabela fica pronta para cadastrar os níveis quando as faixas de pontos
-- forem definidas. Não são inventados limites que não existem no código atual.
create table if not exists public.niveis (
  nivel integer primary key check (nivel > 0),
  nome text not null,
  pontos_minimos integer not null unique check (pontos_minimos >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists progresso_conquistas_usuario_idx
  on public.progresso_conquistas (usuario_id);

create index if not exists pontos_usuarios_usuario_idx
  on public.pontos_usuarios (usuario_id, created_at desc);

alter table public.conquistas enable row level security;
alter table public.progresso_conquistas enable row level security;
alter table public.pontos_usuarios enable row level security;
alter table public.niveis enable row level security;

drop policy if exists "conquistas: leitura de ativas" on public.conquistas;
create policy "conquistas: leitura de ativas"
  on public.conquistas for select
  to authenticated
  using (ativa = true);

drop policy if exists "progresso_conquistas: leitura propria" on public.progresso_conquistas;
create policy "progresso_conquistas: leitura propria"
  on public.progresso_conquistas for select
  to authenticated
  using (auth.uid() = usuario_id);

drop policy if exists "pontos_usuarios: leitura propria" on public.pontos_usuarios;
create policy "pontos_usuarios: leitura propria"
  on public.pontos_usuarios for select
  to authenticated
  using (auth.uid() = usuario_id);

drop policy if exists "niveis: leitura autenticada" on public.niveis;
create policy "niveis: leitura autenticada"
  on public.niveis for select
  to authenticated
  using (true);

-- Reforça que o cliente só pode ler esses dados. Escritas serão feitas
-- por funções/rotinas confiáveis do banco na próxima etapa.
revoke insert, update, delete on public.conquistas from anon, authenticated;
revoke insert, update, delete on public.progresso_conquistas from anon, authenticated;
revoke insert, update, delete on public.pontos_usuarios from anon, authenticated;
revoke insert, update, delete on public.niveis from anon, authenticated;

grant select on public.conquistas to authenticated;
grant select on public.progresso_conquistas to authenticated;
grant select on public.pontos_usuarios to authenticated;
grant select on public.niveis to authenticated;

-- As seis conquistas que já existem na tela. Os números de progresso mockados
-- não são migrados: o progresso será calculado com base nas senhas reais.
insert into public.conquistas
  (id, nome, descricao, categoria, criterio, recompensa_pontos, ativa, ordem)
values
  (
    'frequentador-resolve',
    'Frequentador do Resolve Palmas',
    'Vá ao Resolve Palmas — Centro 5 vezes.',
    'locais',
    '{"tipo":"visitas_local","local_nome":"Resolve Palmas — Centro","quantidade":5}'::jsonb,
    250, true, 1
  ),
  (
    'explorador-servicos',
    'Explorador de serviços',
    'Utilize todos os tipos de serviço disponíveis pelo menos uma vez.',
    'servicos',
    '{"tipo":"todos_servicos","vezes_por_servico":1}'::jsonb,
    400, true, 2
  ),
  (
    'veterano-servicos',
    'Veterano dos serviços',
    'Utilize todos os serviços disponíveis pelo menos 2 vezes.',
    'servicos',
    '{"tipo":"todos_servicos","vezes_por_servico":2}'::jsonb,
    700, true, 3
  ),
  (
    'conhecendo-palmas',
    'Conhecendo Palmas',
    'Visite 3 locais públicos diferentes cadastrados no SmartLine.',
    'locais',
    '{"tipo":"locais_distintos","quantidade":3}'::jsonb,
    300, true, 4
  ),
  (
    'semana-produtiva',
    'Semana produtiva',
    'Use o SmartLine em 5 dias diferentes dentro da mesma semana.',
    'sequencia',
    '{"tipo":"dias_distintos_mesma_semana","quantidade":5}'::jsonb,
    200, true, 5
  ),
  (
    'mestre-cidade',
    'Mestre da cidade',
    'Visite 10 locais públicos diferentes.',
    'locais',
    '{"tipo":"locais_distintos","quantidade":10}'::jsonb,
    1000, true, 6
  )
on conflict (id) do update set
  nome = excluded.nome,
  descricao = excluded.descricao,
  categoria = excluded.categoria,
  criterio = excluded.criterio,
  recompensa_pontos = excluded.recompensa_pontos,
  ativa = excluded.ativa,
  ordem = excluded.ordem,
  updated_at = now();
