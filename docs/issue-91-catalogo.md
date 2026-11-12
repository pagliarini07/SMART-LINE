# Issue #91 — Catálogo inicial de Palmas/TO

## O que foi incluído

A migration `20261112000000_popular_catalogo_palmas_issue91.sql` cadastra os 20 locais listados no mapeamento de 12/11/2026 e 45 serviços associados, além de oito categorias.

- 3 unidades Resolve Palmas;
- 2 UPAs;
- DETRAN-TO, INSS, Receita Federal, PROCON-TO e Coletoria Estadual;
- 7 CRAS;
- Defensoria Pública, HGP e IGEPREV-TO.

O Procon Municipal e o Instituto de Identificação não foram criados como locais independentes: foram representados como fluxos/serviços nas unidades Resolve, conforme o documento-fonte.

## Campos preenchidos

- Locais: categoria, endereço, horários de abertura/fechamento, latitude, longitude, ícone, cores e `horario_estimado`.
- Serviços: descrição, setor, prefixo, tempo médio, ícone, cores, documentos sugeridos e status ativo.
- A migration também garante ao menos um serviço ativo para qualquer outro local ativo preexistente que ainda esteja sem serviços.

## Proveniência e limitações

O documento-fonte fornece nomes, endereços, órgãos, serviços e listas de documentos de referência. Ele não fornece coordenadas nem tempos médios de atendimento para a maioria dos serviços, e não informa o horário de todas as unidades.

Por isso:
- coordenadas são aproximadas por quadra/região e precisam ser verificadas antes de uso operacional;
- horários não explicitamente documentados estão marcados com `horario_estimado = true`;
- tempos médios e prefixos são parâmetros demonstrativos, não estatísticas oficiais;
- documentos sugeridos são referências, não checklists oficiais definitivos;
- endereços/funcionamento do CRAS Javaé, Karajá II, Taquaruçu e Xerente e outras unidades com observações de reforma devem ser confirmados com o órgão.

As UPAs permanecem identificadas como atendimento 24h. A descrição dos serviços reforça que a prioridade é clínica e não pode ser substituída pela ordem numérica da senha. A implantação real deve validar com a gestão da saúde se o fluxo admite qualquer mecanismo de senha.

## Alterações no aplicativo e na triagem

- A tela de serviços passa a mostrar o tempo médio estimado cadastrado.
- A triagem da Edge Function passa a incluir `documentos_sugeridos` no catálogo enviado ao modelo.
- A resposta final da triagem substitui a lista de documentos gerada livremente pela IA pelos documentos cadastrados para o serviço selecionado.
- O cliente usa os documentos persistidos no serviço como primeira fonte, mantendo fallback para compatibilidade com registros antigos.

## Como aplicar

1. Faça checkout da branch da Issue #91.
2. Copie a migration para `supabase/migrations/`.
3. No Supabase, execute a migration pelo fluxo de migrations do projeto. Se a equipe ainda aplica SQL manualmente, cole o conteúdo integral no SQL Editor.
4. Publique novamente a Edge Function `triagem` para que a alteração de catálogo/documentos entre em produção.
5. Reinicie o Expo e valide o catálogo no aplicativo.

## Consultas de validação

```sql
-- Não deve retornar linhas.
select l.id, l.nome
from public.locais l
where l.ativo = true
  and not exists (
    select 1
    from public.servicos s
    where s.local_id = l.id
      and s.ativo = true
  );

-- Verificar horários/coordenadas ausentes.
select id, nome, horario_abertura, horario_fechamento, latitude, longitude
from public.locais
where ativo = true
  and (
    horario_abertura is null
    or horario_fechamento is null
    or latitude is null
    or longitude is null
  );

-- Distribuição de serviços por local.
select l.nome, count(s.id) as servicos_ativos
from public.locais l
left join public.servicos s
  on s.local_id = l.id and s.ativo = true
where l.ativo = true
group by l.id, l.nome
order by l.nome;

-- Conferir metadados essenciais dos serviços.
select l.nome, s.titulo, s.setor, s.tempo_medio_minutos,
       s.prefixo_senha, s.documentos_sugeridos
from public.servicos s
join public.locais l on l.id = s.local_id
where s.ativo = true
order by l.nome, s.titulo;
```

## Observação técnica

O ZIP analisado não contém a definição original completa das tabelas `categorias`, `locais` e `servicos`, nem credenciais de conexão com o Supabase. A migration usa os nomes de colunas já consumidos pelo aplicativo e pelas migrations existentes. Antes de aplicar no banco remoto, confira especialmente os tipos de `horario_abertura` e `horario_fechamento` e a existência dos campos base de `categorias`, `locais` e `servicos`.


### Compatibilidade confirmada com o schema informado

- `categorias.slug` é obrigatório e único: a carga agora informa slugs para as oito categorias.
- `servicos.prefixo_senha` é `CHAR(1)`: todos os prefixos inseridos/atualizados foram reduzidos a um caractere. A carga usa `F` a `J` por local (até cinco serviços por unidade), preservando os prefixos `A` a `D` dos quatro serviços legados informados independentemente de qual local seja o registro legado.
- `tempo_medio_minutos` e `prazo_comparecimento_segundos` têm defaults/validações compatíveis; os serviços novos usam tempos positivos e prazo de 240 segundos.
- `latitude` e `longitude` já existem como `numeric`; a migração não tenta recriá-las. `horario_estimado` e `documentos_sugeridos` são adicionadas somente se ainda não existirem.
- A migração também cria um serviço genérico `Atendimento geral` para qualquer outro local que já esteja ativo e ainda não tenha serviço ativo, garantindo o critério de cobertura sem apagar dados existentes.
- As constraints `CHECK ... NOT VALID` continuam aplicáveis a novas gravações; os dados inseridos usam título, prefixo e tempos não vazios/positivos.
