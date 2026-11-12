-- Issue #94
-- Alinha o schema remoto com o repositório, remove permissões públicas
-- desnecessárias, elimina policies redundantes e adiciona índices
-- apontados pelo Supabase Database Advisor.

-- ============================================================
-- 1. REMOVER RPC LEGADA
-- ============================================================

drop function if exists public.contagem_espera();


-- ============================================================
-- 2. RESTRINGIR RPCs SECURITY DEFINER
-- ============================================================

revoke all on function public.buscar_ranking_locais()
  from public, anon;

grant execute on function public.buscar_ranking_locais()
  to authenticated;

revoke all on function public.entrar_na_fila(uuid)
  from public, anon;

grant execute on function public.entrar_na_fila(uuid)
  to authenticated;

revoke all on function public.handle_new_user()
  from public, anon, authenticated;


-- ============================================================
-- 3. REMOVER POLICIES DUPLICADAS
-- ============================================================

drop policy if exists "categorias: leitura autenticada"
  on public.categorias;

drop policy if exists "locais: leitura autenticada"
  on public.locais;

drop policy if exists "servicos: leitura autenticada"
  on public.servicos;

drop policy if exists "senhas_cidadao_le_ativa"
  on public.senhas;


-- ============================================================
-- 4. OTIMIZAR POLICIES COM auth.uid()
-- ============================================================

drop policy if exists "usuarios_le_proprio"
  on public.usuarios;

create policy "usuarios_le_proprio"
  on public.usuarios
  for select
  to authenticated
  using ((select auth.uid()) = id);


drop policy if exists "usuarios_atualiza_proprio"
  on public.usuarios;

create policy "usuarios_atualiza_proprio"
  on public.usuarios
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);


drop policy if exists "usuarios podem ver suas proprias avaliacoes"
  on public.avaliacoes;

create policy "usuarios podem ver suas proprias avaliacoes"
  on public.avaliacoes
  for select
  to authenticated
  using ((select auth.uid()) = usuario_id);


drop policy if exists "usuarios podem criar suas proprias avaliacoes"
  on public.avaliacoes;

create policy "usuarios podem criar suas proprias avaliacoes"
  on public.avaliacoes
  for insert
  to authenticated
  with check ((select auth.uid()) = usuario_id);


drop policy if exists "usuarios podem editar suas proprias avaliacoes"
  on public.avaliacoes;

create policy "usuarios podem editar suas proprias avaliacoes"
  on public.avaliacoes
  for update
  to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);


drop policy if exists "notificacoes: select own"
  on public.notificacoes;

create policy "notificacoes: select own"
  on public.notificacoes
  for select
  to authenticated
  using ((select auth.uid()) = usuario_id);


drop policy if exists "notificacoes: insert own"
  on public.notificacoes;

create policy "notificacoes: insert own"
  on public.notificacoes
  for insert
  to authenticated
  with check ((select auth.uid()) = usuario_id);


drop policy if exists "notificacoes: update own"
  on public.notificacoes;

create policy "notificacoes: update own"
  on public.notificacoes
  for update
  to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);


drop policy if exists "progresso_conquistas: leitura propria"
  on public.progresso_conquistas;

create policy "progresso_conquistas: leitura propria"
  on public.progresso_conquistas
  for select
  to authenticated
  using ((select auth.uid()) = usuario_id);


drop policy if exists "pontos_usuarios: leitura propria"
  on public.pontos_usuarios;

create policy "pontos_usuarios: leitura propria"
  on public.pontos_usuarios
  for select
  to authenticated
  using ((select auth.uid()) = usuario_id);


-- ============================================================
-- 5. ÍNDICES PARA FOREIGN KEYS
-- ============================================================

create index if not exists avaliacoes_local_idx
  on public.avaliacoes(local_id);

create index if not exists locais_categoria_idx
  on public.locais(categoria_id);

create index if not exists notificacoes_usuario_idx
  on public.notificacoes(usuario_id);

create index if not exists progresso_conquistas_conquista_idx
  on public.progresso_conquistas(conquista_id);

create index if not exists usuarios_local_idx
  on public.usuarios(local_id);
