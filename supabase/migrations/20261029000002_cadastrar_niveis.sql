-- SmartLine: cadastro inicial de níveis de usuário.
-- Mantém o ponto de referência legado: nível 6 = Cidadão Ativo;
-- 1.450 pontos ficam no intervalo do nível 6 e o nível 7 começa em 2.000.
-- Idempotente: pode ser executada novamente sem duplicar níveis.

insert into public.niveis (nivel, nome, pontos_minimos)
values
  (1,  'Novo cidadão',          0),
  (2,  'Cidadão atento',       100),
  (3,  'Cidadão participativo',250),
  (4,  'Cidadão colaborador',  500),
  (5,  'Cidadão engajado',     800),
  (6,  'Cidadão Ativo',       1200),
  (7,  'Cidadão destaque',    2000),
  (8,  'Cidadão referência',  3000),
  (9,  'Cidadão exemplar',    4500),
  (10, 'Embaixador da cidade',6500)
on conflict (nivel) do update set
  nome = excluded.nome,
  pontos_minimos = excluded.pontos_minimos,
  updated_at = now();
