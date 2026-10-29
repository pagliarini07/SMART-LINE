# Dados simulados e pendências técnicas (issue #68)

Última auditoria: 29/10/2026. Busca por `mock`, `TODO`, `FIXME`, valores fixos,
botões sem ação, imports e arquivos sem uso.

## O que era simulado e foi resolvido

| Item | Situação |
| --- | --- |
| `RESUMO_NIVEL` (Nível 6 / Cidadão Ativo / 1.450 pts) em `utils/niveis.ts` | Removido. Perfil e Conquistas usam `getResumoNivelUsuario` (pontos de `pontos_usuarios` e faixas de `niveis`). |
| Mapa `LOCAIS` com ids fixos em `avaliar/[localid].tsx` e `minhas-avaliacoes.tsx` | Removido. Nome e endereço vêm de `buscarLocaisPorIds` (tabela `locais`). |
| Card "Vai sair? / Informar saída" em `servicos.tsx` (botão sem ação e sem backend) | Removido da tela, junto com os estilos. Reativar só quando existir a função no banco. |
| Script `reset-project` em `package.json` (apontava para arquivo inexistente) | Removido. |
| Variável sem uso em `perfil.tsx` | Removida. |

## O que continua fixo no código (intencional)

| Item | Onde | Motivo |
| --- | --- | --- |
| Ícone, cor e texto de marco de cada conquista (`VISUAL_CONQUISTAS`) | `app/(app)/(perfil)/conquistas.tsx` | Só apresentação. Conquista nova no banco usa o visual padrão (troféu) até ganhar entrada no mapa. Os textos de marco repetem o critério cadastrado em `conquistas.criterio`. |
| Estado inicial zerado da sequência (`DADOS_INICIAIS`) | `app/(app)/(perfil)/sequencia.tsx` | Valor de partida enquanto carrega, não é exibido como dado real. |
| Mocks do Supabase nos testes | `services/senhas.test.ts` | Uso normal de testes. |

## Dados reais cadastrados manualmente (não são calculados)

| Item | Observação |
| --- | --- |
| `locais.distancia` (texto exibido em Locais) | Vem da coluna cadastrada, não de geolocalização. Conferir se os valores refletem a realidade ou trocar por cálculo real no futuro. |
| Faixas de pontos dos níveis | Definidas pela equipe em `20261029000002_cadastrar_niveis.sql`. |
| 10 pontos por atendimento concluído | Definido no trigger `trg_conceder_pontos_senha_atendida`. |
| Catálogo de conquistas | Cadastrado por migration; progresso calculado em `atualizar_progresso_conquistas`. |

## Avisos conhecidos de lint

`services/senhas.test.ts` (`import/first`): os imports ficam depois de
`jest.mock(...)` de propósito. Mantido como está.
