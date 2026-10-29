-- Issue #71: a recomendação precisa sugerir documentos por serviço, mas
-- a tabela servicos não tinha esse dado. Adiciona a coluna (nullable) e
-- preenche um valor padrão por setor pra quem já está cadastrado.
-- Idempotente: a coluna só é criada se não existir, e o UPDATE só toca
-- linhas onde o valor ainda está vazio.

alter table public.servicos
  add column if not exists documentos_sugeridos text[];

update public.servicos
set documentos_sugeridos = case
  when setor ilike '%identific%'
    then array['RG ou CNH', 'CPF', 'Comprovante de residência']
  when setor ilike '%tribut%'
    then array['CPF ou CNPJ', 'Comprovante de residência', 'Guia ou carnê do tributo']
  when setor ilike '%social%' or setor ilike '%idoso%'
    then array['RG', 'CPF', 'Comprovante de residência']
  when setor ilike '%protocolo%'
    then array['Documento de identificação', 'Requerimento preenchido']
  else array['Documento de identificação com foto', 'Comprovante de residência']
end
where documentos_sugeridos is null;
