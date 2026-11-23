-- Issue #109: a Edge Function "triagem" chama a API do Gemini sem nenhum
-- limite de quantos pedidos um usuário pode mandar em sequência. Cada
-- chamada custa uma requisição real pra API, então isso é uma porta aberta
-- pra custo excessivo (reenvio rápido, ou um script usando a sessão).
--
-- Como aplicar: cole este arquivo inteiro no SQL Editor do projeto no
-- supabase.com e execute. Idempotente (pode rodar mais de uma vez).
--
-- A checagem fica no banco (não só no app) porque o app nunca é confiável
-- pra aplicar limites sozinho. A função usa auth.uid() internamente (é
-- chamada com o client do próprio usuário logado, não com o admin), no
-- mesmo padrão de cancelar_senha/entrar_na_fila.

create table if not exists public.triagem_rate_limit (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  ultimo_pedido_em timestamptz not null default now()
);

alter table public.triagem_rate_limit enable row level security;

-- Nenhuma política: a tabela só é lida/escrita por dentro da função
-- SECURITY DEFINER abaixo, nunca diretamente pelo cliente (nem pelo
-- próprio dono da linha).

create or replace function public.checar_cooldown_triagem(
  p_cooldown_segundos integer default 20
)
returns table (permitido boolean, segundos_restantes integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario uuid := auth.uid();
  v_agora timestamptz := now();
  v_atualizado timestamptz;
  v_ultimo timestamptz;
begin
  if v_usuario is null then
    raise exception 'Usuário não autenticado' using errcode = '28000';
  end if;

  -- Upsert condicional: só atualiza (e libera o pedido) se o cooldown da
  -- última linha já tiver passado. Se a condição do WHERE for falsa, o
  -- conflito não atualiza nada e RETURNING não devolve linha -- é assim
  -- que fica atômico mesmo com dois pedidos chegando quase juntos.
  insert into public.triagem_rate_limit (usuario_id, ultimo_pedido_em)
  values (v_usuario, v_agora)
  on conflict (usuario_id) do update
    set ultimo_pedido_em = v_agora
    where public.triagem_rate_limit.ultimo_pedido_em
      <= v_agora - (p_cooldown_segundos || ' seconds')::interval
  returning public.triagem_rate_limit.ultimo_pedido_em into v_atualizado;

  if v_atualizado is not null then
    return query select true, 0;
    return;
  end if;

  select t.ultimo_pedido_em into v_ultimo
  from public.triagem_rate_limit t
  where t.usuario_id = v_usuario;

  return query select
    false,
    greatest(
      0,
      p_cooldown_segundos - extract(epoch from (v_agora - v_ultimo))::integer
    );
end;
$$;

revoke all on function public.checar_cooldown_triagem(integer) from public, anon;
grant execute on function public.checar_cooldown_triagem(integer) to authenticated;
