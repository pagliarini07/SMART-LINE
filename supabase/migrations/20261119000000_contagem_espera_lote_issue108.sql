-- Issue #108: agrega a contagem de espera de vários serviços em uma única RPC.
-- Retorna uma linha por serviço informado, inclusive quando não há senhas ativas.
create or replace function public.contagem_espera_lote(p_servico_ids uuid[])
returns table (
  servico_id uuid,
  quantidade integer
)
language sql
stable
security definer
set search_path = public
as $$
  with servicos_solicitados as (
    select distinct ids.servico_id
    from unnest(coalesce(p_servico_ids, '{}'::uuid[])) as ids(servico_id)
  )
  select
    solicitados.servico_id,
    count(senhas.id)::integer as quantidade
  from servicos_solicitados as solicitados
  left join public.senhas as senhas
    on senhas.servico_id = solicitados.servico_id
    and senhas.status::text not in ('atendido', 'cancelado', 'nao_compareceu')
  group by solicitados.servico_id;
$$;

revoke all on function public.contagem_espera_lote(uuid[]) from public, anon;
grant execute on function public.contagem_espera_lote(uuid[]) to authenticated;
