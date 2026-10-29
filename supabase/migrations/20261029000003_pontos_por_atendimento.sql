-- SmartLine: pontos automáticos por atendimento concluído.
-- Execute após 20261029000000_conquistas_pontuacao_niveis.sql.
-- Idempotente: pode ser executada novamente.
--
-- Regra: cada senha que passa para o status "atendido" gera 10 pontos para o
-- usuário dono da senha, uma única vez. A proteção contra duplicação vem da
-- restrição UNIQUE (usuario_id, origem, referencia_id) de pontos_usuarios, com
-- referencia_id = id da senha. O app não grava pontos: tudo roda no banco.

create or replace function public.conceder_pontos_senha_atendida()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  c_pontos_por_atendimento constant integer := 10;
begin
  -- Senha sem dono não gera pontos.
  if new.usuario_id is null then
    return new;
  end if;

  -- Só interessa quando a senha está atendida (o WHEN do trigger já filtra,
  -- mas mantemos a checagem aqui por segurança).
  if new.status::text <> 'atendido' then
    return new;
  end if;

  insert into public.pontos_usuarios
    (usuario_id, quantidade, origem, referencia_id, descricao)
  values
    (
      new.usuario_id,
      c_pontos_por_atendimento,
      'senha_atendida',
      new.id::text,
      'Atendimento concluído'
    )
  on conflict (usuario_id, origem, referencia_id) do nothing;

  return new;
end;
$$;

-- A função só deve ser executada pelo trigger, nunca chamada pelo app.
revoke all on function public.conceder_pontos_senha_atendida()
  from public, anon, authenticated;

drop trigger if exists trg_conceder_pontos_senha_atendida on public.senhas;

create trigger trg_conceder_pontos_senha_atendida
  after insert or update of status on public.senhas
  for each row
  when (new.status::text = 'atendido')
  execute function public.conceder_pontos_senha_atendida();

-- ---------------------------------------------------------------------------
-- Verificações opcionais (rode separadamente, depois da migration):
--
-- 1) Confirmar que o valor "atendido" existe no enum do status:
--    select enumlabel from pg_enum e
--    join pg_type t on t.oid = e.enumtypid
--    where t.typname = 'status_senha' order by e.enumsortorder;
--
-- 2) Confirmar que o trigger foi criado:
--    select tgname, pg_get_triggerdef(oid) from pg_trigger
--    where tgrelid = 'public.senhas'::regclass and not tgisinternal;
--
-- 3) Depois de marcar uma senha de teste como "atendido":
--    select * from public.pontos_usuarios
--    where origem = 'senha_atendida' order by created_at desc;
--    (marcar a mesma senha como atendida de novo não cria outro lançamento)
-- ---------------------------------------------------------------------------
