# Schema atual do Supabase — SmartLine

Este documento é a referência consolidada do schema `public` utilizado pelo SmartLine.

Última verificação: **19/11/2026**  
Projeto Supabase: **SmartLine**  
Project ref: `mxaecijrusqnqxarrgof`  
Região: `sa-east-1`

> Este inventário foi conferido diretamente no banco Supabase e comparado com as migrations presentes em `supabase/migrations/`.

## Regra de versionamento

Toda alteração de schema realizada no Supabase deve ser registrada no repositório por meio de uma migration.

Isso inclui:

- criação ou alteração de tabelas;
- criação ou alteração de colunas;
- tipos e enums;
- foreign keys e constraints;
- índices;
- funções e RPCs;
- triggers;
- policies de RLS;
- grants e revokes relevantes.

Alterações feitas diretamente pelo Dashboard ou SQL Editor também devem receber uma migration correspondente no repositório.

---

# 1. Tabelas

O schema `public` possui atualmente as seguintes tabelas:

1. `categorias`
2. `locais`
3. `usuarios`
4. `servicos`
5. `senhas`
6. `avaliacoes`
7. `conquistas`
8. `progresso_conquistas`
9. `pontos_usuarios`
10. `niveis`
11. `notificacoes`

Todas estão atualmente com Row Level Security (RLS) habilitado.

---

## 1.1 `categorias`

Catálogo de categorias utilizadas para organizar os locais.

| Coluna | Tipo | Observação |
| --- | --- | --- |
| `id` | uuid | PK, default `gen_random_uuid()` |
| `nome` | text | nome da categoria |
| `slug` | text | valor único |
| `icone` | text | opcional |
| `ordem` | integer | default `0` |

Relacionamento:

- `locais.categoria_id` → `categorias.id`

---

## 1.2 `locais`

Unidades físicas apresentadas pelo aplicativo.

| Coluna | Tipo | Observação |
| --- | --- | --- |
| `id` | uuid | PK, default `gen_random_uuid()` |
| `categoria_id` | uuid | FK para `categorias` |
| `nome` | text | nome da unidade |
| `endereco` | text | endereço |
| `distancia` | text | opcional |
| `latitude` | numeric | opcional |
| `longitude` | numeric | opcional |
| `horario_abertura` | time | opcional |
| `horario_fechamento` | time | opcional |
| `icone` | text | opcional |
| `cor_icone` | text | opcional |
| `cor_fundo` | text | opcional |
| `ativo` | boolean | default `true` |
| `horario_estimado` | boolean | default `true` |

Relacionamentos recebidos:

- `servicos.local_id` → `locais.id`
- `avaliacoes.local_id` → `locais.id`
- `usuarios.local_id` → `locais.id`

---

## 1.3 `usuarios`

Perfil da aplicação associado a `auth.users`.

Substituiu a antiga tabela `profiles`.

| Coluna | Tipo | Observação |
| --- | --- | --- |
| `id` | uuid | PK e FK para `auth.users.id` |
| `nome` | text | nome do usuário |
| `email` | text | único |
| `papel` | `papel_usuario` | default `cidadao` |
| `local_id` | uuid | opcional, FK para `locais` |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | default `now()` |
| `cpf` | text | opcional |

Relacionamento:

- `senhas.usuario_id` → `usuarios.id`

---

## 1.4 `servicos`

Serviços oferecidos em cada local.

| Coluna | Tipo | Observação |
| --- | --- | --- |
| `id` | uuid | PK, default `gen_random_uuid()` |
| `local_id` | uuid | FK para `locais` |
| `titulo` | text | não pode ser vazio |
| `descricao` | text | opcional |
| `setor` | text | opcional |
| `prefixo_senha` | char | não pode ser vazio |
| `tempo_medio_minutos` | integer | default `5`, deve ser > 0 |
| `prazo_comparecimento_segundos` | integer | default `240`, deve ser > 0 |
| `icone` | text | opcional |
| `cor_icone` | text | opcional |
| `cor_fundo` | text | opcional |
| `ativo` | boolean | default `true` |
| `documentos_sugeridos` | text[] | opcional |

Relacionamento:

- `senhas.servico_id` → `servicos.id`

---

## 1.5 `senhas`

Fila e histórico de atendimento.

| Coluna | Tipo | Observação |
| --- | --- | --- |
| `id` | uuid | PK, default `gen_random_uuid()` |
| `usuario_id` | uuid | opcional, FK para `usuarios` |
| `servico_id` | uuid | FK para `servicos` |
| `origem` | `origem_senha` | default `app` |
| `codigo` | text | código imutável exibido ao usuário |
| `numero` | integer | número sequencial |
| `token` | char | token da senha |
| `status` | `status_senha` | default `aguardando` |
| `posicao` | integer | opcional |
| `retirada_em` | timestamptz | default `now()` |
| `chamado_em` | timestamptz | opcional |
| `token_expira_em` | timestamptz | opcional |
| `atendido_em` | timestamptz | opcional |
| `finalizado_em` | timestamptz | opcional |

Relacionamento recebido:

- `notificacoes.senha_id` → `senhas.id`

---

## 1.6 `avaliacoes`

Avaliações realizadas pelos usuários para os locais.

| Coluna | Tipo | Observação |
| --- | --- | --- |
| `id` | uuid | PK, default `gen_random_uuid()` |
| `usuario_id` | uuid | FK para `auth.users` |
| `local_id` | uuid | FK para `locais` |
| `nota` | integer | entre 1 e 5 |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | default `now()` |

---

## 1.7 `conquistas`

Catálogo das conquistas disponíveis.

| Coluna | Tipo | Observação |
| --- | --- | --- |
| `id` | text | PK |
| `nome` | text | nome |
| `descricao` | text | descrição |
| `categoria` | text | `locais`, `servicos` ou `sequencia` |
| `criterio` | jsonb | default `{}` |
| `recompensa_pontos` | integer | default `0` |
| `ativa` | boolean | default `true` |
| `ordem` | integer | default `0` |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | default `now()` |

---

## 1.8 `progresso_conquistas`

Registra o progresso individual dos usuários.

| Coluna | Tipo | Observação |
| --- | --- | --- |
| `id` | uuid | PK, default `gen_random_uuid()` |
| `usuario_id` | uuid | FK para `auth.users` |
| `conquista_id` | text | FK para `conquistas` |
| `progresso_atual` | integer | default `0` |
| `concluida_em` | timestamptz | opcional |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | default `now()` |

---

## 1.9 `pontos_usuarios`

Lançamentos de pontos conquistados pelos usuários.

| Coluna | Tipo | Observação |
| --- | --- | --- |
| `id` | uuid | PK, default `gen_random_uuid()` |
| `usuario_id` | uuid | FK para `auth.users` |
| `quantidade` | integer | deve ser > 0 |
| `origem` | text | `senha_atendida` ou `conquista` |
| `referencia_id` | text | referência que originou os pontos |
| `descricao` | text | opcional |
| `created_at` | timestamptz | default `now()` |

---

## 1.10 `niveis`

Faixas de progressão por pontos.

| Coluna | Tipo | Observação |
| --- | --- | --- |
| `nivel` | integer | PK, deve ser > 0 |
| `nome` | text | nome do nível |
| `pontos_minimos` | integer | único e >= 0 |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | default `now()` |

---

## 1.11 `notificacoes`

Notificações relacionadas ao usuário e, opcionalmente, a uma senha.

| Coluna | Tipo | Observação |
| --- | --- | --- |
| `id` | uuid | PK, default `gen_random_uuid()` |
| `usuario_id` | uuid | FK para `auth.users` |
| `senha_id` | uuid | opcional, FK para `senhas` |
| `titulo` | text | título |
| `mensagem` | text | conteúdo |
| `lida` | boolean | default `false` |
| `created_at` | timestamptz | default `now()` |

---

# 2. Enums

## `papel_usuario`

Valores:

- `cidadao`
- `recepcao`
- `admin`

## `origem_senha`

Valores:

- `app`
- `balcao`

## `status_senha`

Valores:

- `aguardando`
- `chamado`
- `atendido`
- `nao_compareceu`
- `cancelado`

---

# 3. Funções e RPCs atuais

## `atualizar_progresso_conquistas()`

- retorna `void`;
- `SECURITY DEFINER`;
- recalcula o progresso das conquistas do usuário autenticado;
- pode conceder pontos quando uma conquista é concluída;
- execução disponível para `authenticated`.

## `buscar_ranking_locais()`

- retorna `local_id`, `nome`, `media_nota` e `total_avaliacoes`;
- `SECURITY DEFINER`;
- calcula o ranking dos locais ativos com base nas avaliações;
- execução disponível para `authenticated`.

## `cancelar_senha(p_senha_id uuid)`

- retorna `void`;
- `SECURITY DEFINER`;
- permite cancelar uma senha do próprio usuário;
- execução disponível para `authenticated`.

## `conceder_pontos_senha_atendida()`

- função de trigger;
- `SECURITY DEFINER`;
- concede 10 pontos quando uma senha passa para `atendido`;
- não é exposta diretamente ao usuário autenticado.

## `contagem_espera(p_servico_id uuid)`

- retorna `integer`;
- `SECURITY DEFINER`;
- retorna a quantidade de senhas ainda ativas de um serviço;
- execução disponível para `authenticated`.

## `contagem_espera_lote(p_servico_ids uuid[])`

- retorna `servico_id` e `quantidade`;
- `SECURITY DEFINER`;
- realiza a contagem de espera de vários serviços em uma única chamada;
- execução disponível para `authenticated`.

## `entrar_na_fila(p_servico_id uuid)`

- retorna uma linha de `senhas`;
- `SECURITY DEFINER`;
- valida autenticação e existência de senha ativa;
- gera número, código e token;
- cria a nova senha;
- execução disponível para `authenticated`.

## `handle_new_user()`

- função de trigger;
- `SECURITY DEFINER`;
- cria automaticamente um registro em `usuarios` após cadastro em `auth.users`;
- não é exposta diretamente ao usuário autenticado.

## `posicao_senha(p_senha_id uuid)`

- retorna `posicao` e `tempo_estimado_minutos`;
- `SECURITY DEFINER`;
- só permite calcular a posição de uma senha pertencente ao usuário autenticado;
- execução disponível para `authenticated`.

---

# 4. Triggers atuais

## `on_auth_user_created`

Tabela:

`auth.users`

Evento:

`AFTER INSERT`

Executa:

`handle_new_user()`

Objetivo: criar automaticamente o perfil correspondente em `public.usuarios`.

## `trg_conceder_pontos_senha_atendida`

Tabela:

`public.senhas`

Eventos:

- `AFTER INSERT`
- `AFTER UPDATE`

Executa:

`conceder_pontos_senha_atendida()`

Objetivo: conceder pontos automaticamente quando uma senha é atendida.

---

# 5. Policies RLS atuais

## `avaliacoes`

### `usuarios podem criar suas proprias avaliacoes`

- operação: `INSERT`
- role: `authenticated`
- permite apenas `usuario_id = auth.uid()`

### `usuarios podem editar suas proprias avaliacoes`

- operação: `UPDATE`
- role: `authenticated`
- permite apenas registros do próprio usuário.

### `usuarios podem ver suas proprias avaliacoes`

- operação: `SELECT`
- role: `authenticated`
- permite apenas registros do próprio usuário.

---

## `categorias`

### `categorias_leitura`

- operação: `SELECT`
- role: `authenticated`
- condição: `true`

---

## `conquistas`

### `conquistas: leitura de ativas`

- operação: `SELECT`
- role: `authenticated`
- condição: `ativa = true`

---

## `locais`

### `locais_leitura`

- operação: `SELECT`
- role: `authenticated`
- condição: `ativo = true`

---

## `niveis`

### `niveis: leitura autenticada`

- operação: `SELECT`
- role: `authenticated`
- condição: `true`

---

## `notificacoes`

### `notificacoes: select own`

- `SELECT`
- somente registros do próprio usuário.

### `notificacoes: insert own`

- `INSERT`
- somente registros do próprio usuário.

### `notificacoes: update own`

- `UPDATE`
- somente registros do próprio usuário.

---

## `pontos_usuarios`

### `pontos_usuarios: leitura propria`

- `SELECT`
- somente registros do próprio usuário.

---

## `progresso_conquistas`

### `progresso_conquistas: leitura propria`

- `SELECT`
- somente registros do próprio usuário.

---

## `senhas`

### `senhas_cidadao_le_proprias`

- `SELECT`
- somente senhas cujo `usuario_id` corresponde ao usuário autenticado.

---

## `servicos`

### `servicos_leitura`

- operação: `SELECT`
- role: `authenticated`
- condição: `ativo = true`

---

## `usuarios`

### `usuarios_le_proprio`

- `SELECT`
- somente o próprio perfil.

### `usuarios_atualiza_proprio`

- `UPDATE`
- somente o próprio perfil;
- possui `USING` e `WITH CHECK` verificando `auth.uid() = id`.

---

# 6. Estruturas que originalmente não possuíam criação versionada

Parte do schema original foi criada diretamente no Supabase antes da adoção consistente de migrations.

As estruturas abaixo existem no banco atual, mas sua criação inicial completa não está representada por uma migration `CREATE TABLE` correspondente no histórico do repositório:

- `categorias`
- `locais`
- `usuarios`
- `servicos`
- `senhas`
- `avaliacoes`

Também existem funções cuja criação original não está completamente representada pelas migrations atuais, especialmente:

- `entrar_na_fila(uuid)`
- `buscar_ranking_locais()`
- versão atual de `handle_new_user()` voltada para `usuarios`

Por esse motivo, este documento deve ser usado como referência consolidada junto às migrations existentes.

---

# 7. Situação das migrations

O banco Supabase possui migrations aplicadas até:

`20261119000000_contagem_espera_lote_issue108`

As migrations versionadas anteriores também constam no histórico remoto.

## Divergência conhecida

O repositório contém atualmente dois arquivos iniciados pela mesma versão:

- `20261119000000_contagem_espera_lote_issue108.sql`
- `20261119000000_ranking_paginado.sql`

No banco verificado, a versão registrada é:

`20261119000000_contagem_espera_lote_issue108`

A função:

`buscar_ranking_locais_paginado(integer, integer)`

**não existe no schema atual verificado**.

Portanto, `20261119000000_ranking_paginado.sql` não deve ser considerado parte do schema de produção atual até que sua situação de versionamento/aplicação seja corrigida separadamente.

---

# 8. Fluxo obrigatório para futuras alterações

Ao alterar o banco:

1. criar uma migration versionada em `supabase/migrations/`;
2. colocar nela toda alteração de schema;
3. revisar RLS, policies, grants e constraints;
4. aplicar a alteração no ambiente correspondente;
5. validar o banco após a aplicação;
6. incluir a migration no mesmo Pull Request do código que depende dela.

Não devem existir novas mudanças permanentes feitas somente pelo Dashboard ou SQL Editor sem uma migration correspondente no Git.

---

# 9. Fonte de verdade

Para desenvolvimento normal:

- `supabase/migrations/` contém o histórico versionado das mudanças;
- este arquivo, `docs/schema-supabase.md`, documenta o estado consolidado verificado do schema atual;
- novas alterações devem sempre ser adicionadas como migrations.

Se houver divergência futura entre o banco e o repositório, ela deve ser corrigida e documentada no mesmo Pull Request.
