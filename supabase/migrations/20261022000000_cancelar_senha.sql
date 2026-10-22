-- Cancelamento real da senha pelo próprio usuário (issue #50).
-- Como aplicar: cole este arquivo inteiro no SQL Editor do projeto no
-- supabase.com e execute. Idempotente (pode rodar mais de uma vez).
--
-- Em vez de liberar UPDATE na tabela senhas pro usuário (o que deixaria
-- ele mexer em qualquer coluna da própria senha), o app chama esta função,
-- no mesmo padrão de entrar_na_fila. Ela só faz uma coisa: muda a senha
-- ainda em aberto do usuário logado para "cancelado".

create or replace function public.cancelar_senha(p_senha_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.senhas
     set status = 'cancelado',
         finalizado_em = coalesce(finalizado_em, now())
   where id = p_senha_id
     and usuario_id = auth.uid()
     and status::text not in ('atendido', 'cancelado', 'nao_compareceu');

  -- Nada atualizado: a senha não é do usuário, não existe ou já saiu da
  -- fila (ex.: foi chamada/atendida enquanto a tela estava aberta).
  if not found then
    raise exception 'Senha não encontrada ou já finalizada'
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.cancelar_senha(uuid) from public, anon;
grant execute on function public.cancelar_senha(uuid) to authenticated;
