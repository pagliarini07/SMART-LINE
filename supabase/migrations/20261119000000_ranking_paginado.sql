-- Issue #114: a tela de Ranking buscava todos os locais de uma vez via
-- buscar_ranking_locais() -- funciona bem com poucos locais, mas o
-- catálogo cresceu bastante (issue #91) e a lista só tende a aumentar.
--
-- Cria uma variante paginada em vez de alterar a função existente, pra
-- não arriscar mudar um comportamento já em uso sem poder conferir ao
-- vivo a definição atual. buscar_ranking_locais() continua intacta.
--
-- Como aplicar: cole este arquivo inteiro no SQL Editor do projeto no
-- supabase.com e execute. Idempotente (pode rodar mais de uma vez).
--
-- Observação pra quem revisar: a query reconstrói a lógica de
-- agregação (média de nota + contagem por local, com locais sem
-- avaliação aparecendo com media_nota null) a partir do contrato já
-- observado em RankingLocal/ranking.tsx. Vale conferir contra a
-- definição real de buscar_ranking_locais() se o critério de
-- desempate ou o filtro de "ativo" for diferente do daqui.

create or replace function public.buscar_ranking_locais_paginado(
  p_limit integer default 15,
  p_offset integer default 0
)
returns table (
  local_id uuid,
  nome text,
  media_nota numeric,
  total_avaliacoes integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    l.id as local_id,
    l.nome,
    avg(a.nota)::numeric as media_nota,
    count(a.id)::integer as total_avaliacoes
  from public.locais l
  left join public.avaliacoes a on a.local_id = l.id
  where l.ativo = true
  group by l.id, l.nome
  order by
    avg(a.nota) desc nulls last,
    count(a.id) desc,
    l.nome asc
  limit p_limit
  offset p_offset;
$$;

revoke all on function public.buscar_ranking_locais_paginado(integer, integer)
  from public, anon;

grant execute on function public.buscar_ranking_locais_paginado(integer, integer)
  to authenticated;
