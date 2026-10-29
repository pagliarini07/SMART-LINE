-- SmartLine: cálculo seguro do progresso de conquistas.
-- Execute após 20261029000000_conquistas_pontuacao_niveis.sql.
-- O usuário só consegue recalcular o próprio progresso. O progresso é derivado
-- de senhas reais; o cliente não pode enviar valores de progresso ou pontos.

create or replace function public.atualizar_progresso_conquistas()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_conquista record;
  v_progresso integer;
  v_necessario integer;
  v_total_servicos integer;
  v_concluida_em timestamptz;
begin
  if v_usuario_id is null then
    raise exception 'Usuário não autenticado' using errcode = '28000';
  end if;

  -- Inicializa o progresso em zero para as conquistas ativas do catálogo.
  insert into public.progresso_conquistas
    (usuario_id, conquista_id, progresso_atual, created_at, updated_at)
  select v_usuario_id, c.id, 0, now(), now()
  from public.conquistas c
  where c.ativa = true
  on conflict (usuario_id, conquista_id) do nothing;

  select count(*)::integer
    into v_total_servicos
  from public.servicos s
  where s.ativo = true;

  for v_conquista in
    select c.id, c.criterio, c.recompensa_pontos
    from public.conquistas c
    where c.ativa = true
  loop
    v_progresso := 0;
    v_necessario := coalesce((v_conquista.criterio->>'quantidade')::integer, 1);

    case v_conquista.criterio->>'tipo'
      when 'visitas_local' then
        select count(*)::integer
          into v_progresso
        from public.senhas se
        join public.servicos s on s.id = se.servico_id
        join public.locais l on l.id = s.local_id
        where se.usuario_id = v_usuario_id
          and se.status::text = 'atendido'
          and lower(trim(l.nome)) =
              lower(trim(v_conquista.criterio->>'local_nome'));

      when 'todos_servicos' then
        v_necessario := v_total_servicos;
        if v_total_servicos > 0 then
          select count(*)::integer
            into v_progresso
          from public.servicos s
          where s.ativo = true
            and (
              select count(*)
              from public.senhas se
              where se.usuario_id = v_usuario_id
                and se.servico_id = s.id
                and se.status::text = 'atendido'
            ) >= coalesce(
              (v_conquista.criterio->>'vezes_por_servico')::integer, 1
            );
        end if;

      when 'locais_distintos' then
        select count(distinct l.id)::integer
          into v_progresso
        from public.senhas se
        join public.servicos s on s.id = se.servico_id
        join public.locais l on l.id = s.local_id
        where se.usuario_id = v_usuario_id
          and se.status::text = 'atendido'
          and l.ativo = true;

      when 'dias_distintos_mesma_semana' then
        select coalesce(max(dias_na_semana), 0)::integer
          into v_progresso
        from (
          select date_trunc('week', se.retirada_em) as semana,
                 count(distinct se.retirada_em::date) as dias_na_semana
          from public.senhas se
          where se.usuario_id = v_usuario_id
            and se.status::text = 'atendido'
          group by date_trunc('week', se.retirada_em)
        ) dias;

      else
        -- Tipo de critério desconhecido: mantém progresso em zero em vez de
        -- conceder uma recompensa com uma regra que não foi implementada.
        v_progresso := 0;
    end case;

    v_progresso := greatest(v_progresso, 0);

    select pc.concluida_em
      into v_concluida_em
    from public.progresso_conquistas pc
    where pc.usuario_id = v_usuario_id
      and pc.conquista_id = v_conquista.id;

    update public.progresso_conquistas
       set progresso_atual = v_progresso,
           concluida_em = case
             when v_concluida_em is not null then v_concluida_em
             when v_progresso >= v_necessario then now()
             else null
           end,
           updated_at = now()
     where usuario_id = v_usuario_id
       and conquista_id = v_conquista.id;

    -- Concede a recompensa apenas quando a conquista está concluída.
    -- A restrição UNIQUE protege contra recompensas duplicadas.
    if v_necessario > 0
       and v_progresso >= v_necessario
       and v_conquista.recompensa_pontos > 0 then
      insert into public.pontos_usuarios
        (usuario_id, quantidade, origem, referencia_id, descricao)
      values
        (
          v_usuario_id,
          v_conquista.recompensa_pontos,
          'conquista',
          v_conquista.id,
          'Recompensa: ' || v_conquista.id
        )
      on conflict (usuario_id, origem, referencia_id) do nothing;
    end if;
  end loop;
end;
$$;

revoke all on function public.atualizar_progresso_conquistas() from public, anon;
grant execute on function public.atualizar_progresso_conquistas() to authenticated;

-- Os dados de progresso e pontos continuam somente para leitura do próprio
-- usuário por meio das políticas RLS criadas na migration anterior.
