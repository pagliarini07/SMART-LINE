-- Issue #93: o frontend hoje consulta a tabela senhas direto, mas a
-- policy "senhas_cidadao_le_proprias" (RLS, select) só deixa cada
-- usuário ver as PRÓPRIAS linhas -- então qualquer contagem/posição
-- calculada no cliente (locais.ts, servicos.ts, recomendacao.ts,
-- senhas.ts) está errada pra quem não é o dono da senha. A Edge
-- Function de triagem usa um client admin (bypassa RLS) e por isso
-- mostra números diferentes -- "IA e frontend usam valores
-- inconsistentes", exatamente o problema que a issue aponta.
--
-- Solução: duas funções SECURITY DEFINER que agregam no banco e
-- devolvem só números (nunca linhas de senhas de outras pessoas).
--
-- Como aplicar: cole este arquivo inteiro no SQL Editor do projeto no
-- supabase.com e execute. Idempotente (pode rodar mais de uma vez).

-- contagem_espera: quantas senhas ainda ativas existem pra um serviço.
-- Puramente agregado -- não expõe nenhum dado individual.
create or replace function public.contagem_espera(p_servico_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.senhas
  where servico_id = p_servico_id
    and status::text not in ('atendido', 'cancelado', 'nao_compareceu');
$$;

revoke all on function public.contagem_espera(uuid) from public, anon;
grant execute on function public.contagem_espera(uuid) to authenticated;

-- posicao_senha: posição na fila + tempo estimado de UMA senha
-- específica. Só retorna algo se a senha pertencer a quem está
-- chamando (auth.uid()) -- ninguém consegue consultar a posição da
-- senha de outra pessoa, mesmo sabendo o id dela.
create or replace function public.posicao_senha(p_senha_id uuid)
returns table (
  posicao integer,
  tempo_estimado_minutos integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_servico_id uuid;
  v_retirada_em timestamptz;
  v_usuario_id uuid;
  v_tempo_medio integer;
begin
  select servico_id, retirada_em, usuario_id
    into v_servico_id, v_retirada_em, v_usuario_id
  from public.senhas
  where id = p_senha_id;

  if v_usuario_id is null or v_usuario_id <> auth.uid() then
    raise exception 'Senha não encontrada.' using errcode = 'P0002';
  end if;

  select tempo_medio_minutos into v_tempo_medio
  from public.servicos
  where id = v_servico_id;

  return query
  select
    greatest(contagem.total, 1) as posicao,
    greatest(contagem.total, 1) * coalesce(v_tempo_medio, 5)
      as tempo_estimado_minutos
  from (
    select count(*)::integer as total
    from public.senhas
    where servico_id = v_servico_id
      and status::text not in ('atendido', 'cancelado', 'nao_compareceu')
      and retirada_em <= v_retirada_em
  ) as contagem;
end;
$$;

revoke all on function public.posicao_senha(uuid) from public, anon;
grant execute on function public.posicao_senha(uuid) to authenticated;
