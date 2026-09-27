create policy "senhas_cidadao_le_proprias"
on public.senhas
for select
to authenticated
using ((select auth.uid()) = usuario_id);

create index if not exists senhas_usuario_historico_idx
on public.senhas (usuario_id, retirada_em);
