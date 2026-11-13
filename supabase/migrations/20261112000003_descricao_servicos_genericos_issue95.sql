-- Issue #95: a triagem com IA escolhe o serviço lendo título e descrição.
-- Os serviços "Atendimento geral" tinham descrição genérica ("Atendimento
-- inicial e orientação sobre os serviços disponíveis nesta unidade"), então
-- pedidos como "preciso reconhecer firma" ou "certidão de nascimento" não
-- chegavam ao cartório. Aqui as descrições passam a dizer o que cada
-- unidade resolve.
--
-- Idempotente: só altera o serviço ativo pelo par (local, título).

update public.servicos s
set descricao = 'Reconhecimento de firma, autenticação de documentos, certidões (nascimento, casamento, óbito), procurações e escrituras.'
from public.locais l
where s.local_id = l.id
  and l.nome = 'Cartório 2º Ofício'
  and s.titulo = 'Atendimento geral';

update public.servicos s
set descricao = 'Atendimento inicial do DETRAN: orientação sobre CNH, veículos, multas e documentos de trânsito.'
from public.locais l
where s.local_id = l.id
  and l.nome = 'Detran Palmas'
  and s.titulo = 'Atendimento geral';
