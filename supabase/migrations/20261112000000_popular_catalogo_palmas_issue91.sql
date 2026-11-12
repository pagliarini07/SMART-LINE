-- Issue #91 - Catálogo inicial de locais e serviços de Palmas/TO
-- Idempotente: atualiza locais/serviços pelo par (nome) e (local_id, titulo),
-- sem duplicar registros em execuções subsequentes.
--
-- Fonte dos nomes, endereços, órgãos e escopo dos serviços:
-- Mapeamento_Orgaos_Publicos_Palmas_Filas_Senhas, 12/11/2026.
-- Horários não informados no documento, tempos médios, prefixos, ícones,
-- cores e coordenadas são valores de demonstração. Coordenadas são aproximações
-- por quadra/região e DEVEM ser conferidas antes de uso operacional.
--
-- Observação de saúde: filas não substituem classificação de risco. A unidade
-- deve preservar integralmente o fluxo clínico e as prioridades assistenciais.

begin;

alter table public.locais
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists horario_estimado boolean not null default true;

alter table public.servicos
  add column if not exists documentos_sugeridos text[];

-- Categorias de locais
insert into public.categorias (nome, slug, icone)
select v.nome, v.slug, v.icone
from (values
  ('Cidadania', 'cidadania', 'people-outline'),
  ('Saúde', 'saude', 'medkit-outline'),
  ('Trânsito', 'transito', 'car-outline'),
  ('Previdência', 'previdencia', 'wallet-outline'),
  ('Tributação', 'tributacao', 'receipt-outline'),
  ('Defesa do consumidor', 'defesa-do-consumidor', 'shield-checkmark-outline'),
  ('Assistência social', 'assistencia-social', 'heart-outline'),
  ('Justiça', 'justica', 'scale-outline')
) as v(nome, slug, icone)
where not exists (
  select 1 from public.categorias c
  where lower(trim(c.nome)) = lower(trim(v.nome))
     or lower(trim(c.slug)) = lower(trim(v.slug))
);

-- Locais: horários típicos são estimativas, exceto 24h das UPAs e
-- 08:00-12:00 do CAC Receita Federal, conforme o documento.
with dados(
  nome, categoria, endereco, abertura, fechamento, horario_estimado,
  latitude, longitude, icone, cor_icone, cor_fundo
) as (values
  ('Resolve Palmas — Centro', 'Cidadania', '104 Sul, Avenida Juscelino Kubitschek, Conjunto 01, nº 120, Plano Diretor Sul, Palmas – TO, CEP 77020-012', '08:00'::time, '18:00'::time, true, -10.185021, -48.325598, 'business-outline', '#0757D8', '#EDF4FF'),
  ('Resolve Palmas – Taquaralto', 'Cidadania', 'Quadra 31, Rua 11, Lotes 1 a 18, antigo Shopping da Cidadania, Taquaralto, Palmas – TO', '08:00'::time, '18:00'::time, true, -10.293500, -48.324000, 'business-outline', '#0757D8', '#EDF4FF'),
  ('Resolve Palmas – Capim Dourado', 'Cidadania', 'Avenida JK, Quadra 107 Norte, Lote 1, s/n, Loja 06, Capim Dourado Shopping, Plano Diretor Norte, Palmas – TO, CEP 77001-098', '10:00'::time, '22:00'::time, true, -10.184400, -48.330700, 'business-outline', '#0757D8', '#EDF4FF'),
  ('UPA Norte', 'Saúde', 'Quadra 203 Norte, Avenida LO-06, APM 02, Plano Diretor Norte, Palmas – TO, CEP 77001-142', '00:00'::time, '23:59'::time, false, -10.174637, -48.339904, 'medkit-outline', '#D32F2F', '#FDECEC'),
  ('UPA Sul', 'Saúde', 'Avenida Perimetral 02, Quadras 72/73, Jardim Aureny II / Taquaralto, Palmas – TO', '00:00'::time, '23:59'::time, false, -10.292000, -48.321000, 'medkit-outline', '#D32F2F', '#FDECEC'),
  ('DETRAN-TO – Sede de Palmas', 'Trânsito', 'Quadra 401 Norte, Rua 01, s/n, Plano Diretor Norte, Palmas – TO, CEP 77006-340', '08:00'::time, '14:00'::time, true, -10.160700, -48.325900, 'car-outline', '#0757D8', '#EDF4FF'),
  ('INSS – Agência de Palmas', 'Previdência', 'Quadra 201 Sul, Avenida NS-01, Conjunto 02, Lote 05, Plano Diretor Sul, Palmas – TO, CEP 77015-202', '08:00'::time, '17:00'::time, true, -10.185500, -48.327000, 'wallet-outline', '#168653', '#E9F7EF'),
  ('Receita Federal – CAC Palmas', 'Tributação', 'Rua NE 13, Conjunto 03, Lotes 05 e 06, Quadra 202 Norte, Palmas – TO, CEP 77054-010', '08:00'::time, '12:00'::time, false, -10.174000, -48.329000, 'receipt-outline', '#168653', '#E9F7EF'),
  ('PROCON Tocantins – Núcleo Regional de Palmas', 'Defesa do consumidor', 'Quadra 103 Norte (ACNO II), Avenida LO-02, Conjunto 1, Lotes 57 a 59, Palmas – TO, CEP 77020-024', '08:00'::time, '18:00'::time, true, -10.176500, -48.331000, 'shield-checkmark-outline', '#8B5CF6', '#F2ECFF'),
  ('Coletoria Estadual de Palmas – SEFAZ-TO', 'Tributação', 'Quadra 104 Norte, Rua NE-05, nº 3, Plano Diretor Norte, Palmas – TO, CEP 77006-020', '08:00'::time, '14:00'::time, true, -10.184400, -48.330000, 'receipt-outline', '#168653', '#E9F7EF'),
  ('CRAS Kanela – 407 Norte', 'Assistência social', 'Quadra 407 Norte, Alameda 01, Lote 17, Plano Diretor Norte, Palmas – TO', '08:00'::time, '18:00'::time, true, -10.161867, -48.349330, 'heart-outline', '#D97706', '#FFF4E5'),
  ('CRAS Krahô – 1304 Sul', 'Assistência social', 'Quadra 1304 Sul, Rua 08, QI 06, APM 23, Palmas – TO', '08:00'::time, '18:00'::time, true, -10.235000, -48.326000, 'heart-outline', '#D97706', '#FFF4E5'),
  ('CRAS Karajá I – Aureny III', 'Assistência social', 'Jardim Aureny III, Quadra 151 A, Rua 30, Lote 16, ao lado da Feira Coberta, Palmas – TO', '08:00'::time, '18:00'::time, true, -10.292000, -48.318000, 'heart-outline', '#D97706', '#FFF4E5'),
  ('CRAS Javaé – Morada do Sol', 'Assistência social', 'Avenida dos Navegantes, APM 12, Setor Morada do Sol II, CEU, Palmas – TO', '08:00'::time, '18:00'::time, true, -10.310000, -48.315000, 'heart-outline', '#D97706', '#FFF4E5'),
  ('CRAS Karajá II – Santa Bárbara', 'Assistência social', 'Setor Santa Bárbara, Rua 10, APM 16, Palmas – TO', '08:00'::time, '18:00'::time, true, -10.300000, -48.300000, 'heart-outline', '#D97706', '#FFF4E5'),
  ('CRAS Taquaruçu', 'Assistência social', 'Quadra 29, Rua 04, Lote 08, Distrito de Taquaruçu, Palmas – TO', '08:00'::time, '18:00'::time, true, -10.326000, -48.162000, 'heart-outline', '#D97706', '#FFF4E5'),
  ('CRAS Xerente – Jardim Taquari', 'Assistência social', 'Setor Jardim Taquari, Avenida LO-15, T-21, ATM 45, Palmas – TO', '08:00'::time, '18:00'::time, true, -10.250000, -48.355000, 'heart-outline', '#D97706', '#FFF4E5'),
  ('Defensoria Pública do Estado do Tocantins – Sede de atendimentos', 'Justiça', 'Quadra AA SE 50, Avenida Siqueira Campos, Plano Diretor Sul, Palmas – TO, CEP 77021-654', '08:00'::time, '17:00'::time, true, -10.190000, -48.330000, 'scale-outline', '#8B5CF6', '#F2ECFF'),
  ('Hospital Geral de Palmas – HGP', 'Saúde', 'Quadra 201 Sul, Avenida NS-01, Conjunto 02, Lote 02, Plano Diretor Sul, Palmas – TO, CEP 77015-202', '00:00'::time, '23:59'::time, true, -10.185800, -48.327500, 'medkit-outline', '#D32F2F', '#FDECEC'),
  ('IGEPREV-TO', 'Previdência', 'Avenida Teotônio Segurado, Quadra 302 Norte, QI-01, Alameda 05, Lotes 02 e 03, Plano Diretor Norte, Palmas – TO, CEP 77006-328', '08:00'::time, '14:00'::time, true, -10.165000, -48.330000, 'wallet-outline', '#168653', '#E9F7EF')
)
insert into public.locais (
  categoria_id, nome, endereco, horario_abertura, horario_fechamento,
  horario_estimado, latitude, longitude, icone, cor_icone, cor_fundo, ativo
)
select c.id, d.nome, d.endereco, d.abertura, d.fechamento,
       d.horario_estimado, d.latitude, d.longitude, d.icone,
       d.cor_icone, d.cor_fundo, true
from dados d
join public.categorias c
  on lower(trim(c.nome)) = lower(trim(d.categoria))
where not exists (
  select 1 from public.locais l
  where lower(trim(l.nome)) = lower(trim(d.nome))
);

-- Atualiza os metadados dos locais já existentes sem apagar avaliações,
-- senhas, ids ou demais relacionamentos.
with dados(nome, categoria, endereco, abertura, fechamento, horario_estimado,
 latitude, longitude, icone, cor_icone, cor_fundo) as (values
  ('Resolve Palmas — Centro', 'Cidadania', '104 Sul, Avenida Juscelino Kubitschek, Conjunto 01, nº 120, Plano Diretor Sul, Palmas – TO, CEP 77020-012', '08:00'::time, '18:00'::time, true, -10.185021, -48.325598, 'business-outline', '#0757D8', '#EDF4FF'),
  ('Resolve Palmas – Taquaralto', 'Cidadania', 'Quadra 31, Rua 11, Lotes 1 a 18, antigo Shopping da Cidadania, Taquaralto, Palmas – TO', '08:00'::time, '18:00'::time, true, -10.293500, -48.324000, 'business-outline', '#0757D8', '#EDF4FF'),
  ('Resolve Palmas – Capim Dourado', 'Cidadania', 'Avenida JK, Quadra 107 Norte, Lote 1, s/n, Loja 06, Capim Dourado Shopping, Plano Diretor Norte, Palmas – TO, CEP 77001-098', '10:00'::time, '22:00'::time, true, -10.184400, -48.330700, 'business-outline', '#0757D8', '#EDF4FF'),
  ('UPA Norte', 'Saúde', 'Quadra 203 Norte, Avenida LO-06, APM 02, Plano Diretor Norte, Palmas – TO, CEP 77001-142', '00:00'::time, '23:59'::time, false, -10.174637, -48.339904, 'medkit-outline', '#D32F2F', '#FDECEC'),
  ('UPA Sul', 'Saúde', 'Avenida Perimetral 02, Quadras 72/73, Jardim Aureny II / Taquaralto, Palmas – TO', '00:00'::time, '23:59'::time, false, -10.292000, -48.321000, 'medkit-outline', '#D32F2F', '#FDECEC'),
  ('DETRAN-TO – Sede de Palmas', 'Trânsito', 'Quadra 401 Norte, Rua 01, s/n, Plano Diretor Norte, Palmas – TO, CEP 77006-340', '08:00'::time, '14:00'::time, true, -10.160700, -48.325900, 'car-outline', '#0757D8', '#EDF4FF'),
  ('INSS – Agência de Palmas', 'Previdência', 'Quadra 201 Sul, Avenida NS-01, Conjunto 02, Lote 05, Plano Diretor Sul, Palmas – TO, CEP 77015-202', '08:00'::time, '17:00'::time, true, -10.185500, -48.327000, 'wallet-outline', '#168653', '#E9F7EF'),
  ('Receita Federal – CAC Palmas', 'Tributação', 'Rua NE 13, Conjunto 03, Lotes 05 e 06, Quadra 202 Norte, Palmas – TO, CEP 77054-010', '08:00'::time, '12:00'::time, false, -10.174000, -48.329000, 'receipt-outline', '#168653', '#E9F7EF'),
  ('PROCON Tocantins – Núcleo Regional de Palmas', 'Defesa do consumidor', 'Quadra 103 Norte (ACNO II), Avenida LO-02, Conjunto 1, Lotes 57 a 59, Palmas – TO, CEP 77020-024', '08:00'::time, '18:00'::time, true, -10.176500, -48.331000, 'shield-checkmark-outline', '#8B5CF6', '#F2ECFF'),
  ('Coletoria Estadual de Palmas – SEFAZ-TO', 'Tributação', 'Quadra 104 Norte, Rua NE-05, nº 3, Plano Diretor Norte, Palmas – TO, CEP 77006-020', '08:00'::time, '14:00'::time, true, -10.184400, -48.330000, 'receipt-outline', '#168653', '#E9F7EF'),
  ('CRAS Kanela – 407 Norte', 'Assistência social', 'Quadra 407 Norte, Alameda 01, Lote 17, Plano Diretor Norte, Palmas – TO', '08:00'::time, '18:00'::time, true, -10.161867, -48.349330, 'heart-outline', '#D97706', '#FFF4E5'),
  ('CRAS Krahô – 1304 Sul', 'Assistência social', 'Quadra 1304 Sul, Rua 08, QI 06, APM 23, Palmas – TO', '08:00'::time, '18:00'::time, true, -10.235000, -48.326000, 'heart-outline', '#D97706', '#FFF4E5'),
  ('CRAS Karajá I – Aureny III', 'Assistência social', 'Jardim Aureny III, Quadra 151 A, Rua 30, Lote 16, ao lado da Feira Coberta, Palmas – TO', '08:00'::time, '18:00'::time, true, -10.292000, -48.318000, 'heart-outline', '#D97706', '#FFF4E5'),
  ('CRAS Javaé – Morada do Sol', 'Assistência social', 'Avenida dos Navegantes, APM 12, Setor Morada do Sol II, CEU, Palmas – TO', '08:00'::time, '18:00'::time, true, -10.310000, -48.315000, 'heart-outline', '#D97706', '#FFF4E5'),
  ('CRAS Karajá II – Santa Bárbara', 'Assistência social', 'Setor Santa Bárbara, Rua 10, APM 16, Palmas – TO', '08:00'::time, '18:00'::time, true, -10.300000, -48.300000, 'heart-outline', '#D97706', '#FFF4E5'),
  ('CRAS Taquaruçu', 'Assistência social', 'Quadra 29, Rua 04, Lote 08, Distrito de Taquaruçu, Palmas – TO', '08:00'::time, '18:00'::time, true, -10.326000, -48.162000, 'heart-outline', '#D97706', '#FFF4E5'),
  ('CRAS Xerente – Jardim Taquari', 'Assistência social', 'Setor Jardim Taquari, Avenida LO-15, T-21, ATM 45, Palmas – TO', '08:00'::time, '18:00'::time, true, -10.250000, -48.355000, 'heart-outline', '#D97706', '#FFF4E5'),
  ('Defensoria Pública do Estado do Tocantins – Sede de atendimentos', 'Justiça', 'Quadra AA SE 50, Avenida Siqueira Campos, Plano Diretor Sul, Palmas – TO, CEP 77021-654', '08:00'::time, '17:00'::time, true, -10.190000, -48.330000, 'scale-outline', '#8B5CF6', '#F2ECFF'),
  ('Hospital Geral de Palmas – HGP', 'Saúde', 'Quadra 201 Sul, Avenida NS-01, Conjunto 02, Lote 02, Plano Diretor Sul, Palmas – TO, CEP 77015-202', '00:00'::time, '23:59'::time, true, -10.185800, -48.327500, 'medkit-outline', '#D32F2F', '#FDECEC'),
  ('IGEPREV-TO', 'Previdência', 'Avenida Teotônio Segurado, Quadra 302 Norte, QI-01, Alameda 05, Lotes 02 e 03, Plano Diretor Norte, Palmas – TO, CEP 77006-328', '08:00'::time, '14:00'::time, true, -10.165000, -48.330000, 'wallet-outline', '#168653', '#E9F7EF')
)
update public.locais l
set categoria_id = c.id,
    endereco = d.endereco,
    horario_abertura = d.abertura,
    horario_fechamento = d.fechamento,
    horario_estimado = d.horario_estimado,
    latitude = d.latitude,
    longitude = d.longitude,
    icone = d.icone,
    cor_icone = d.cor_icone,
    cor_fundo = d.cor_fundo,
    ativo = true
from dados d
join public.categorias c
  on lower(trim(c.nome)) = lower(trim(d.categoria))
where lower(trim(l.nome)) = lower(trim(d.nome));

-- Catálogo de serviços. Prefixos e tempos médios são parâmetros demonstrativos,
-- não tempos oficiais de atendimento. Documentos são sugestões baseadas no
-- mapeamento e devem ser confirmados pelo órgão antes de uso real.
with catalogo(local_nome, titulo, descricao, setor, prefixo, minutos, icone, cor, fundo, documentos) as (values
  ('Resolve Palmas — Centro', 'Tributos municipais – IPTU e ITBI', 'Emissão de guias, consulta e regularização de débitos de IPTU e ITBI.', 'Tributação municipal', 'F', 15, 'receipt-outline', '#168653', '#E9F7EF', array['CPF e documento oficial com foto','Inscrição imobiliária ou dados do imóvel','Carnê, guia ou identificação do débito']),
  ('Resolve Palmas — Centro', 'Habitação e regularização', 'Orientação e protocolo de cadastro habitacional e regularização conforme programas e editais vigentes.', 'Habitação', 'G', 25, 'home-outline', '#0757D8', '#EDF4FF', array['RG e CPF','Comprovante de residência','Comprovantes de renda familiar','Documentos dos dependentes','Comprovante de posse ou situação do imóvel']),
  ('Resolve Palmas — Centro', 'Protocolo, alvarás e licenças', 'Abertura e acompanhamento de protocolos urbanísticos, alvarás e licenças municipais.', 'Protocolo e urbanismo', 'H', 20, 'document-text-outline', '#0757D8', '#EDF4FF', array['Documento de identificação','Requerimento específico','CNPJ e ato constitutivo, quando empresa','Documentos do imóvel e planta/croqui']),
  ('Resolve Palmas — Centro', 'Procon Municipal – reclamação', 'Registro e orientação de reclamações de consumo atendidas pelo Procon Municipal dentro do Resolve Centro.', 'Defesa do consumidor', 'I', 25, 'shield-checkmark-outline', '#8B5CF6', '#F2ECFF', array['RG e CPF','Comprovante de endereço','Nota fiscal, contrato, fatura ou recibo','Comprovantes de pagamento e protocolos']),
  ('Resolve Palmas — Centro', 'Mobilidade e recurso de multa', 'Orientação e protocolo de demandas municipais de trânsito e recursos de infração.', 'Mobilidade urbana', 'J', 20, 'car-outline', '#0757D8', '#EDF4FF', array['Documento de identificação e CPF','Notificação ou auto de infração','CRLV, quando aplicável','Provas e procuração, se representante']),
  ('Resolve Palmas – Taquaralto', 'Tributos municipais – IPTU e ITBI', 'Emissão de guias, consulta e regularização de débitos municipais.', 'Tributação municipal', 'F', 15, 'receipt-outline', '#168653', '#E9F7EF', array['CPF e documento oficial com foto','Inscrição imobiliária ou dados do imóvel','Carnê, guia ou identificação do débito']),
  ('Resolve Palmas – Taquaralto', 'Cadastro habitacional', 'Orientação e protocolo de cadastro habitacional e regularização conforme editais municipais.', 'Habitação', 'G', 25, 'home-outline', '#0757D8', '#EDF4FF', array['RG e CPF','Certidão de nascimento ou casamento','Comprovante de residência','Comprovantes de renda familiar','Documentos dos dependentes']),
  ('Resolve Palmas – Taquaralto', 'Identificação civil – CIN', 'Atendimento de identificação civil e emissão da Carteira de Identidade Nacional mediante agendamento.', 'Identificação civil', 'H', 20, 'id-card-outline', '#0757D8', '#EDF4FF', array['Certidão de nascimento ou casamento original','Documento oficial com CPF','Agendamento prévio']),
  ('Resolve Palmas – Capim Dourado', 'Tributos municipais – IPTU e ITBI', 'Emissão de guias, consulta e regularização de débitos municipais.', 'Tributação municipal', 'F', 15, 'receipt-outline', '#168653', '#E9F7EF', array['CPF e documento oficial com foto','Inscrição imobiliária ou dados do imóvel','Carnê, guia ou identificação do débito']),
  ('Resolve Palmas – Capim Dourado', 'Identificação civil – CIN', 'Atendimento de identificação civil, emissão de CIN e serviços de identificação mediante agendamento.', 'Identificação civil', 'G', 20, 'id-card-outline', '#0757D8', '#EDF4FF', array['Certidão de nascimento ou casamento original','Documento oficial com CPF','Agendamento prévio']),
  ('Resolve Palmas – Capim Dourado', 'Protocolo e serviços urbanos', 'Orientação e abertura de protocolos municipais, alvarás e licenças.', 'Protocolo e urbanismo', 'H', 20, 'document-text-outline', '#0757D8', '#EDF4FF', array['Documento de identificação','Requerimento específico','Documentos do imóvel ou da empresa, conforme o caso']),
  ('UPA Norte', 'Acolhimento e classificação de risco', 'Acolhimento inicial e classificação de risco por equipe de saúde; a prioridade é clínica e não segue ordem numérica de senha.', 'Acolhimento e triagem', 'F', 10, 'medkit-outline', '#D32F2F', '#FDECEC', array['Documento de identificação, se disponível','CPF e CNS, se disponíveis','Informações clínicas relevantes']),
  ('UPA Norte', 'Atendimento médico de urgência', 'Atendimento médico e de enfermagem conforme avaliação e classificação de risco.', 'Urgência e emergência', 'G', 30, 'medkit-outline', '#D32F2F', '#FDECEC', array['Documento de identificação, se disponível','CPF e CNS, se disponíveis']),
  ('UPA Sul', 'Acolhimento e classificação de risco', 'Acolhimento inicial e classificação de risco por equipe de saúde; a prioridade é clínica e não segue ordem numérica de senha.', 'Acolhimento e triagem', 'F', 10, 'medkit-outline', '#D32F2F', '#FDECEC', array['Documento de identificação, se disponível','CPF e CNS, se disponíveis','Informações clínicas relevantes']),
  ('UPA Sul', 'Atendimento médico de urgência', 'Atendimento médico e de enfermagem conforme avaliação e classificação de risco.', 'Urgência e emergência', 'G', 30, 'medkit-outline', '#D32F2F', '#FDECEC', array['Documento de identificação, se disponível','CPF e CNS, se disponíveis']),
  ('DETRAN-TO – Sede de Palmas', 'Habilitação – CNH', 'Orientação e atendimento de processos de primeira habilitação, renovação e segunda via da CNH.', 'Habilitação', 'F', 20, 'car-outline', '#0757D8', '#EDF4FF', array['Documento oficial com foto','CPF','Comprovante de endereço','CNH anterior, quando aplicável']),
  ('DETRAN-TO – Sede de Palmas', 'Veículos – transferência e licenciamento', 'Atendimento de transferência de propriedade, registro e licenciamento de veículos.', 'Veículos', 'G', 25, 'car-sport-outline', '#0757D8', '#EDF4FF', array['Documento do proprietário e CPF','ATPV-e/CRV, conforme o caso','CRLV e dados do veículo','Comprovantes de débitos e taxas']),
  ('INSS – Agência de Palmas', 'Benefícios previdenciários', 'Orientação sobre aposentadorias, pensões e benefícios previdenciários, conforme agendamento e canal disponível.', 'Benefícios previdenciários', 'F', 25, 'wallet-outline', '#168653', '#E9F7EF', array['Documento de identificação e CPF','Carteira de trabalho e comprovantes de contribuição','Documentos específicos do benefício']),
  ('INSS – Agência de Palmas', 'Benefício por incapacidade e BPC', 'Orientação sobre benefícios por incapacidade e Benefício de Prestação Continuada.', 'Benefícios assistenciais e por incapacidade', 'G', 25, 'heart-outline', '#D97706', '#FFF4E5', array['Documento de identificação e CPF','Cadastro Único atualizado, para BPC','Laudos e relatórios médicos, quando aplicável','Comprovantes de renda e composição familiar']),
  ('Receita Federal – CAC Palmas', 'Regularização e alteração de CPF', 'Orientação e atendimento de regularização ou alteração cadastral de CPF.', 'Cadastro fiscal federal', 'F', 15, 'id-card-outline', '#168653', '#E9F7EF', array['Documento oficial com foto','CPF ou comprovante de inscrição','Documento que justifique a alteração']),
  ('Receita Federal – CAC Palmas', 'Imposto de Renda e situação fiscal', 'Orientação sobre declaração, pendências, débitos e situação fiscal de pessoa física.', 'Atendimento fiscal', 'G', 20, 'receipt-outline', '#168653', '#E9F7EF', array['Documento de identificação e CPF','Informes de rendimentos','Declarações, recibos e documentos da pendência']),
  ('PROCON Tocantins – Núcleo Regional de Palmas', 'Reclamação de consumo', 'Registro e acompanhamento de reclamações sobre produtos e serviços, com orientação e mediação de conflitos.', 'Defesa do consumidor', 'F', 25, 'shield-checkmark-outline', '#8B5CF6', '#F2ECFF', array['RG ou documento oficial e CPF','Comprovante de endereço','Nota fiscal, contrato ou fatura','Comprovantes de pagamento e protocolos']),
  ('PROCON Tocantins – Núcleo Regional de Palmas', 'Orientação ao consumidor', 'Orientação sobre direitos do consumidor, denúncias e encaminhamento de demandas.', 'Orientação ao consumidor', 'G', 15, 'chatbubbles-outline', '#8B5CF6', '#F2ECFF', array['Documento de identificação','Documentos e comprovantes relacionados à demanda']),
  ('Coletoria Estadual de Palmas – SEFAZ-TO', 'ICMS e inscrição estadual', 'Orientação sobre inscrição estadual, cadastro de contribuinte e obrigações relacionadas ao ICMS.', 'Tributação estadual', 'F', 20, 'receipt-outline', '#168653', '#E9F7EF', array['CPF ou CNPJ','Inscrição estadual, se existente','Ato constitutivo e documento do representante']),
  ('Coletoria Estadual de Palmas – SEFAZ-TO', 'Guias e débitos estaduais', 'Orientação sobre guias, débitos e pagamentos de obrigações tributárias estaduais.', 'Arrecadação estadual', 'G', 15, 'document-text-outline', '#168653', '#E9F7EF', array['CPF ou CNPJ','Identificação do contribuinte','Número da guia, débito ou processo']),
  ('CRAS Kanela – 407 Norte', 'Cadastro Único – inscrição e atualização', 'Atendimento para inscrição ou atualização dos dados da família no Cadastro Único.', 'Cadastro Único', 'F', 25, 'people-outline', '#D97706', '#FFF4E5', array['CPF do responsável familiar','Documento com foto','Comprovante de residência ou declaração','CPF/documentos dos demais integrantes']),
  ('CRAS Kanela – 407 Norte', 'PAIF e acompanhamento familiar', 'Acolhimento, acompanhamento familiar e encaminhamentos socioassistenciais pelo PAIF.', 'Proteção e acompanhamento social', 'G', 30, 'heart-outline', '#D97706', '#FFF4E5', array['Documento de identificação e CPF','Informações sobre composição e situação familiar']),
  ('CRAS Krahô – 1304 Sul', 'Cadastro Único – inscrição e atualização', 'Atendimento para inscrição ou atualização dos dados da família no Cadastro Único.', 'Cadastro Único', 'F', 25, 'people-outline', '#D97706', '#FFF4E5', array['CPF do responsável familiar','Documento com foto','Comprovante de residência','Documentos dos integrantes da família']),
  ('CRAS Krahô – 1304 Sul', 'Benefícios sociais e PAIF', 'Orientação sobre benefícios sociais, acompanhamento familiar e encaminhamentos.', 'Proteção e acompanhamento social', 'G', 25, 'heart-outline', '#D97706', '#FFF4E5', array['Documento de identificação e CPF','NIS ou folha resumo do CadÚnico, se houver','Documentos relacionados à solicitação']),
  ('CRAS Karajá I – Aureny III', 'Cadastro Único – inscrição e atualização', 'Atendimento para inscrição ou atualização dos dados da família no Cadastro Único.', 'Cadastro Único', 'F', 25, 'people-outline', '#D97706', '#FFF4E5', array['CPF do responsável familiar','Documento com foto','Comprovante de residência','Documentos dos integrantes da família']),
  ('CRAS Karajá I – Aureny III', 'Acompanhamento familiar – PAIF', 'Acolhimento, acompanhamento familiar e encaminhamentos socioassistenciais.', 'Proteção e acompanhamento social', 'G', 30, 'heart-outline', '#D97706', '#FFF4E5', array['Documento de identificação e CPF','Informações sobre a situação familiar']),
  ('CRAS Javaé – Morada do Sol', 'Cadastro Único – inscrição e atualização', 'Atendimento para inscrição ou atualização dos dados da família no Cadastro Único.', 'Cadastro Único', 'F', 25, 'people-outline', '#D97706', '#FFF4E5', array['CPF do responsável familiar','Documento com foto','Comprovante de residência','Documentos dos integrantes da família']),
  ('CRAS Javaé – Morada do Sol', 'PAIF e benefícios sociais', 'Acolhimento, orientação sobre benefícios e acompanhamento familiar.', 'Proteção e acompanhamento social', 'G', 30, 'heart-outline', '#D97706', '#FFF4E5', array['Documento de identificação e CPF','NIS ou folha resumo, se houver','Documentos relacionados à demanda']),
  ('CRAS Karajá II – Santa Bárbara', 'Cadastro Único – inscrição e atualização', 'Atendimento para inscrição ou atualização dos dados da família no Cadastro Único.', 'Cadastro Único', 'F', 25, 'people-outline', '#D97706', '#FFF4E5', array['CPF do responsável familiar','Documento com foto','Comprovante de residência','Documentos dos integrantes da família']),
  ('CRAS Karajá II – Santa Bárbara', 'Orientação sobre benefícios e PAIF', 'Orientação sobre benefícios sociais, acompanhamento familiar e encaminhamentos.', 'Proteção e acompanhamento social', 'G', 25, 'heart-outline', '#D97706', '#FFF4E5', array['Documento de identificação e CPF','NIS ou folha resumo, se houver','Documentos relacionados à demanda']),
  ('CRAS Taquaruçu', 'Cadastro Único – inscrição e atualização', 'Atendimento para inscrição ou atualização dos dados da família no Cadastro Único.', 'Cadastro Único', 'F', 25, 'people-outline', '#D97706', '#FFF4E5', array['CPF do responsável familiar','Documento com foto','Comprovante de residência','Documentos dos integrantes da família']),
  ('CRAS Taquaruçu', 'PAIF e encaminhamentos sociais', 'Acolhimento, acompanhamento familiar e encaminhamentos socioassistenciais.', 'Proteção e acompanhamento social', 'G', 30, 'heart-outline', '#D97706', '#FFF4E5', array['Documento de identificação e CPF','Informações sobre composição e situação familiar']),
  ('CRAS Xerente – Jardim Taquari', 'Cadastro Único – inscrição e atualização', 'Atendimento para inscrição ou atualização dos dados da família no Cadastro Único.', 'Cadastro Único', 'F', 25, 'people-outline', '#D97706', '#FFF4E5', array['CPF do responsável familiar','Documento com foto','Comprovante de residência','Documentos dos integrantes da família']),
  ('CRAS Xerente – Jardim Taquari', 'PAIF e orientação sobre benefícios', 'Acolhimento, orientação sobre benefícios e acompanhamento familiar.', 'Proteção e acompanhamento social', 'G', 30, 'heart-outline', '#D97706', '#FFF4E5', array['Documento de identificação e CPF','NIS ou folha resumo, se houver','Documentos relacionados à demanda']),
  ('Defensoria Pública do Estado do Tocantins – Sede de atendimentos', 'Atendimento jurídico inicial', 'Triagem e orientação jurídica gratuita para demandas cíveis, familiares e defesa de direitos.', 'Atendimento jurídico', 'F', 30, 'scale-outline', '#8B5CF6', '#F2ECFF', array['RG ou documento oficial e CPF','Comprovante de endereço','Comprovantes de renda','Documentos relacionados ao problema jurídico']),
  ('Defensoria Pública do Estado do Tocantins – Sede de atendimentos', 'Família – alimentos, guarda e divórcio', 'Orientação e encaminhamento de demandas de alimentos, guarda, convivência e dissolução familiar.', 'Direito de família', 'G', 35, 'people-outline', '#8B5CF6', '#F2ECFF', array['Documentos pessoais','Certidões pertinentes','Comprovante de endereço e renda','Documentos relacionados aos filhos e à demanda']),
  ('Hospital Geral de Palmas – HGP', 'Ambulatório e consulta especializada', 'Atendimento ambulatorial especializado mediante encaminhamento e regulação, conforme disponibilidade.', 'Ambulatório', 'F', 25, 'medkit-outline', '#D32F2F', '#FDECEC', array['Documento de identificação e CPF','CNS','Encaminhamento/regulação','Comprovante de agendamento']),
  ('Hospital Geral de Palmas – HGP', 'Exames e procedimentos', 'Orientação e atendimento para exames e procedimentos autorizados pela equipe de saúde.', 'Exames e procedimentos', 'G', 20, 'flask-outline', '#D32F2F', '#FDECEC', array['Documento de identificação','CNS','Pedido médico ou guia autorizada']),
  ('IGEPREV-TO', 'Aposentadoria e pensão', 'Orientação e protocolo de demandas de aposentadoria e pensão do regime próprio estadual.', 'Benefícios previdenciários estaduais', 'F', 30, 'wallet-outline', '#168653', '#E9F7EF', array['Requerimento','RG e CPF','Certidões pessoais','Documentos funcionais e de contribuição','Documentos do dependente, para pensão']),
  ('IGEPREV-TO', 'Recadastramento e atualização cadastral', 'Atualização de dados cadastrais de servidores aposentados, pensionistas e dependentes.', 'Cadastro previdenciário', 'G', 20, 'id-card-outline', '#168653', '#E9F7EF', array['Documento oficial com foto','CPF','Comprovantes das alterações cadastrais'])
)
insert into public.servicos (
  local_id, titulo, descricao, setor, prefixo_senha, tempo_medio_minutos,
  icone, cor_icone, cor_fundo, documentos_sugeridos, ativo
)
select l.id, c.titulo, c.descricao, c.setor, c.prefixo, c.minutos,
       c.icone, c.cor, c.fundo, c.documentos, true
from catalogo c
join public.locais l
  on lower(trim(l.nome)) = lower(trim(c.local_nome))
where not exists (
  select 1 from public.servicos s
  where s.local_id = l.id
    and lower(trim(s.titulo)) = lower(trim(c.titulo))
);

-- Mantém os registros já existentes sincronizados com os dados desta seed.
with catalogo(local_nome, titulo, descricao, setor, prefixo, minutos, icone, cor, fundo, documentos) as (values
  ('Resolve Palmas — Centro', 'Tributos municipais – IPTU e ITBI', 'Emissão de guias, consulta e regularização de débitos de IPTU e ITBI.', 'Tributação municipal', 'F', 15, 'receipt-outline', '#168653', '#E9F7EF', array['CPF e documento oficial com foto','Inscrição imobiliária ou dados do imóvel','Carnê, guia ou identificação do débito']),
  ('Resolve Palmas — Centro', 'Habitação e regularização', 'Orientação e protocolo de cadastro habitacional e regularização conforme programas e editais vigentes.', 'Habitação', 'G', 25, 'home-outline', '#0757D8', '#EDF4FF', array['RG e CPF','Comprovante de residência','Comprovantes de renda familiar','Documentos dos dependentes','Comprovante de posse ou situação do imóvel']),
  ('Resolve Palmas — Centro', 'Protocolo, alvarás e licenças', 'Abertura e acompanhamento de protocolos urbanísticos, alvarás e licenças municipais.', 'Protocolo e urbanismo', 'H', 20, 'document-text-outline', '#0757D8', '#EDF4FF', array['Documento de identificação','Requerimento específico','CNPJ e ato constitutivo, quando empresa','Documentos do imóvel e planta/croqui']),
  ('Resolve Palmas — Centro', 'Procon Municipal – reclamação', 'Registro e orientação de reclamações de consumo atendidas pelo Procon Municipal dentro do Resolve Centro.', 'Defesa do consumidor', 'I', 25, 'shield-checkmark-outline', '#8B5CF6', '#F2ECFF', array['RG e CPF','Comprovante de endereço','Nota fiscal, contrato, fatura ou recibo','Comprovantes de pagamento e protocolos']),
  ('Resolve Palmas — Centro', 'Mobilidade e recurso de multa', 'Orientação e protocolo de demandas municipais de trânsito e recursos de infração.', 'Mobilidade urbana', 'J', 20, 'car-outline', '#0757D8', '#EDF4FF', array['Documento de identificação e CPF','Notificação ou auto de infração','CRLV, quando aplicável','Provas e procuração, se representante']),
  ('Resolve Palmas – Taquaralto', 'Tributos municipais – IPTU e ITBI', 'Emissão de guias, consulta e regularização de débitos municipais.', 'Tributação municipal', 'F', 15, 'receipt-outline', '#168653', '#E9F7EF', array['CPF e documento oficial com foto','Inscrição imobiliária ou dados do imóvel','Carnê, guia ou identificação do débito']),
  ('Resolve Palmas – Taquaralto', 'Cadastro habitacional', 'Orientação e protocolo de cadastro habitacional e regularização conforme editais municipais.', 'Habitação', 'G', 25, 'home-outline', '#0757D8', '#EDF4FF', array['RG e CPF','Certidão de nascimento ou casamento','Comprovante de residência','Comprovantes de renda familiar','Documentos dos dependentes']),
  ('Resolve Palmas – Taquaralto', 'Identificação civil – CIN', 'Atendimento de identificação civil e emissão da Carteira de Identidade Nacional mediante agendamento.', 'Identificação civil', 'H', 20, 'id-card-outline', '#0757D8', '#EDF4FF', array['Certidão de nascimento ou casamento original','Documento oficial com CPF','Agendamento prévio']),
  ('Resolve Palmas – Capim Dourado', 'Tributos municipais – IPTU e ITBI', 'Emissão de guias, consulta e regularização de débitos municipais.', 'Tributação municipal', 'F', 15, 'receipt-outline', '#168653', '#E9F7EF', array['CPF e documento oficial com foto','Inscrição imobiliária ou dados do imóvel','Carnê, guia ou identificação do débito']),
  ('Resolve Palmas – Capim Dourado', 'Identificação civil – CIN', 'Atendimento de identificação civil, emissão de CIN e serviços de identificação mediante agendamento.', 'Identificação civil', 'G', 20, 'id-card-outline', '#0757D8', '#EDF4FF', array['Certidão de nascimento ou casamento original','Documento oficial com CPF','Agendamento prévio']),
  ('Resolve Palmas – Capim Dourado', 'Protocolo e serviços urbanos', 'Orientação e abertura de protocolos municipais, alvarás e licenças.', 'Protocolo e urbanismo', 'H', 20, 'document-text-outline', '#0757D8', '#EDF4FF', array['Documento de identificação','Requerimento específico','Documentos do imóvel ou da empresa, conforme o caso']),
  ('UPA Norte', 'Acolhimento e classificação de risco', 'Acolhimento inicial e classificação de risco por equipe de saúde; a prioridade é clínica e não segue ordem numérica de senha.', 'Acolhimento e triagem', 'F', 10, 'medkit-outline', '#D32F2F', '#FDECEC', array['Documento de identificação, se disponível','CPF e CNS, se disponíveis','Informações clínicas relevantes']),
  ('UPA Norte', 'Atendimento médico de urgência', 'Atendimento médico e de enfermagem conforme avaliação e classificação de risco.', 'Urgência e emergência', 'G', 30, 'medkit-outline', '#D32F2F', '#FDECEC', array['Documento de identificação, se disponível','CPF e CNS, se disponíveis']),
  ('UPA Sul', 'Acolhimento e classificação de risco', 'Acolhimento inicial e classificação de risco por equipe de saúde; a prioridade é clínica e não segue ordem numérica de senha.', 'Acolhimento e triagem', 'F', 10, 'medkit-outline', '#D32F2F', '#FDECEC', array['Documento de identificação, se disponível','CPF e CNS, se disponíveis','Informações clínicas relevantes']),
  ('UPA Sul', 'Atendimento médico de urgência', 'Atendimento médico e de enfermagem conforme avaliação e classificação de risco.', 'Urgência e emergência', 'G', 30, 'medkit-outline', '#D32F2F', '#FDECEC', array['Documento de identificação, se disponível','CPF e CNS, se disponíveis']),
  ('DETRAN-TO – Sede de Palmas', 'Habilitação – CNH', 'Orientação e atendimento de processos de primeira habilitação, renovação e segunda via da CNH.', 'Habilitação', 'F', 20, 'car-outline', '#0757D8', '#EDF4FF', array['Documento oficial com foto','CPF','Comprovante de endereço','CNH anterior, quando aplicável']),
  ('DETRAN-TO – Sede de Palmas', 'Veículos – transferência e licenciamento', 'Atendimento de transferência de propriedade, registro e licenciamento de veículos.', 'Veículos', 'G', 25, 'car-sport-outline', '#0757D8', '#EDF4FF', array['Documento do proprietário e CPF','ATPV-e/CRV, conforme o caso','CRLV e dados do veículo','Comprovantes de débitos e taxas']),
  ('INSS – Agência de Palmas', 'Benefícios previdenciários', 'Orientação sobre aposentadorias, pensões e benefícios previdenciários, conforme agendamento e canal disponível.', 'Benefícios previdenciários', 'F', 25, 'wallet-outline', '#168653', '#E9F7EF', array['Documento de identificação e CPF','Carteira de trabalho e comprovantes de contribuição','Documentos específicos do benefício']),
  ('INSS – Agência de Palmas', 'Benefício por incapacidade e BPC', 'Orientação sobre benefícios por incapacidade e Benefício de Prestação Continuada.', 'Benefícios assistenciais e por incapacidade', 'G', 25, 'heart-outline', '#D97706', '#FFF4E5', array['Documento de identificação e CPF','Cadastro Único atualizado, para BPC','Laudos e relatórios médicos, quando aplicável','Comprovantes de renda e composição familiar']),
  ('Receita Federal – CAC Palmas', 'Regularização e alteração de CPF', 'Orientação e atendimento de regularização ou alteração cadastral de CPF.', 'Cadastro fiscal federal', 'F', 15, 'id-card-outline', '#168653', '#E9F7EF', array['Documento oficial com foto','CPF ou comprovante de inscrição','Documento que justifique a alteração']),
  ('Receita Federal – CAC Palmas', 'Imposto de Renda e situação fiscal', 'Orientação sobre declaração, pendências, débitos e situação fiscal de pessoa física.', 'Atendimento fiscal', 'G', 20, 'receipt-outline', '#168653', '#E9F7EF', array['Documento de identificação e CPF','Informes de rendimentos','Declarações, recibos e documentos da pendência']),
  ('PROCON Tocantins – Núcleo Regional de Palmas', 'Reclamação de consumo', 'Registro e acompanhamento de reclamações sobre produtos e serviços, com orientação e mediação de conflitos.', 'Defesa do consumidor', 'F', 25, 'shield-checkmark-outline', '#8B5CF6', '#F2ECFF', array['RG ou documento oficial e CPF','Comprovante de endereço','Nota fiscal, contrato ou fatura','Comprovantes de pagamento e protocolos']),
  ('PROCON Tocantins – Núcleo Regional de Palmas', 'Orientação ao consumidor', 'Orientação sobre direitos do consumidor, denúncias e encaminhamento de demandas.', 'Orientação ao consumidor', 'G', 15, 'chatbubbles-outline', '#8B5CF6', '#F2ECFF', array['Documento de identificação','Documentos e comprovantes relacionados à demanda']),
  ('Coletoria Estadual de Palmas – SEFAZ-TO', 'ICMS e inscrição estadual', 'Orientação sobre inscrição estadual, cadastro de contribuinte e obrigações relacionadas ao ICMS.', 'Tributação estadual', 'F', 20, 'receipt-outline', '#168653', '#E9F7EF', array['CPF ou CNPJ','Inscrição estadual, se existente','Ato constitutivo e documento do representante']),
  ('Coletoria Estadual de Palmas – SEFAZ-TO', 'Guias e débitos estaduais', 'Orientação sobre guias, débitos e pagamentos de obrigações tributárias estaduais.', 'Arrecadação estadual', 'G', 15, 'document-text-outline', '#168653', '#E9F7EF', array['CPF ou CNPJ','Identificação do contribuinte','Número da guia, débito ou processo']),
  ('CRAS Kanela – 407 Norte', 'Cadastro Único – inscrição e atualização', 'Atendimento para inscrição ou atualização dos dados da família no Cadastro Único.', 'Cadastro Único', 'F', 25, 'people-outline', '#D97706', '#FFF4E5', array['CPF do responsável familiar','Documento com foto','Comprovante de residência ou declaração','CPF/documentos dos demais integrantes']),
  ('CRAS Kanela – 407 Norte', 'PAIF e acompanhamento familiar', 'Acolhimento, acompanhamento familiar e encaminhamentos socioassistenciais pelo PAIF.', 'Proteção e acompanhamento social', 'G', 30, 'heart-outline', '#D97706', '#FFF4E5', array['Documento de identificação e CPF','Informações sobre composição e situação familiar']),
  ('CRAS Krahô – 1304 Sul', 'Cadastro Único – inscrição e atualização', 'Atendimento para inscrição ou atualização dos dados da família no Cadastro Único.', 'Cadastro Único', 'F', 25, 'people-outline', '#D97706', '#FFF4E5', array['CPF do responsável familiar','Documento com foto','Comprovante de residência','Documentos dos integrantes da família']),
  ('CRAS Krahô – 1304 Sul', 'Benefícios sociais e PAIF', 'Orientação sobre benefícios sociais, acompanhamento familiar e encaminhamentos.', 'Proteção e acompanhamento social', 'G', 25, 'heart-outline', '#D97706', '#FFF4E5', array['Documento de identificação e CPF','NIS ou folha resumo do CadÚnico, se houver','Documentos relacionados à solicitação']),
  ('CRAS Karajá I – Aureny III', 'Cadastro Único – inscrição e atualização', 'Atendimento para inscrição ou atualização dos dados da família no Cadastro Único.', 'Cadastro Único', 'F', 25, 'people-outline', '#D97706', '#FFF4E5', array['CPF do responsável familiar','Documento com foto','Comprovante de residência','Documentos dos integrantes da família']),
  ('CRAS Karajá I – Aureny III', 'Acompanhamento familiar – PAIF', 'Acolhimento, acompanhamento familiar e encaminhamentos socioassistenciais.', 'Proteção e acompanhamento social', 'G', 30, 'heart-outline', '#D97706', '#FFF4E5', array['Documento de identificação e CPF','Informações sobre a situação familiar']),
  ('CRAS Javaé – Morada do Sol', 'Cadastro Único – inscrição e atualização', 'Atendimento para inscrição ou atualização dos dados da família no Cadastro Único.', 'Cadastro Único', 'F', 25, 'people-outline', '#D97706', '#FFF4E5', array['CPF do responsável familiar','Documento com foto','Comprovante de residência','Documentos dos integrantes da família']),
  ('CRAS Javaé – Morada do Sol', 'PAIF e benefícios sociais', 'Acolhimento, orientação sobre benefícios e acompanhamento familiar.', 'Proteção e acompanhamento social', 'G', 30, 'heart-outline', '#D97706', '#FFF4E5', array['Documento de identificação e CPF','NIS ou folha resumo, se houver','Documentos relacionados à demanda']),
  ('CRAS Karajá II – Santa Bárbara', 'Cadastro Único – inscrição e atualização', 'Atendimento para inscrição ou atualização dos dados da família no Cadastro Único.', 'Cadastro Único', 'F', 25, 'people-outline', '#D97706', '#FFF4E5', array['CPF do responsável familiar','Documento com foto','Comprovante de residência','Documentos dos integrantes da família']),
  ('CRAS Karajá II – Santa Bárbara', 'Orientação sobre benefícios e PAIF', 'Orientação sobre benefícios sociais, acompanhamento familiar e encaminhamentos.', 'Proteção e acompanhamento social', 'G', 25, 'heart-outline', '#D97706', '#FFF4E5', array['Documento de identificação e CPF','NIS ou folha resumo, se houver','Documentos relacionados à demanda']),
  ('CRAS Taquaruçu', 'Cadastro Único – inscrição e atualização', 'Atendimento para inscrição ou atualização dos dados da família no Cadastro Único.', 'Cadastro Único', 'F', 25, 'people-outline', '#D97706', '#FFF4E5', array['CPF do responsável familiar','Documento com foto','Comprovante de residência','Documentos dos integrantes da família']),
  ('CRAS Taquaruçu', 'PAIF e encaminhamentos sociais', 'Acolhimento, acompanhamento familiar e encaminhamentos socioassistenciais.', 'Proteção e acompanhamento social', 'G', 30, 'heart-outline', '#D97706', '#FFF4E5', array['Documento de identificação e CPF','Informações sobre composição e situação familiar']),
  ('CRAS Xerente – Jardim Taquari', 'Cadastro Único – inscrição e atualização', 'Atendimento para inscrição ou atualização dos dados da família no Cadastro Único.', 'Cadastro Único', 'F', 25, 'people-outline', '#D97706', '#FFF4E5', array['CPF do responsável familiar','Documento com foto','Comprovante de residência','Documentos dos integrantes da família']),
  ('CRAS Xerente – Jardim Taquari', 'PAIF e orientação sobre benefícios', 'Acolhimento, orientação sobre benefícios e acompanhamento familiar.', 'Proteção e acompanhamento social', 'G', 30, 'heart-outline', '#D97706', '#FFF4E5', array['Documento de identificação e CPF','NIS ou folha resumo, se houver','Documentos relacionados à demanda']),
  ('Defensoria Pública do Estado do Tocantins – Sede de atendimentos', 'Atendimento jurídico inicial', 'Triagem e orientação jurídica gratuita para demandas cíveis, familiares e defesa de direitos.', 'Atendimento jurídico', 'F', 30, 'scale-outline', '#8B5CF6', '#F2ECFF', array['RG ou documento oficial e CPF','Comprovante de endereço','Comprovantes de renda','Documentos relacionados ao problema jurídico']),
  ('Defensoria Pública do Estado do Tocantins – Sede de atendimentos', 'Família – alimentos, guarda e divórcio', 'Orientação e encaminhamento de demandas de alimentos, guarda, convivência e dissolução familiar.', 'Direito de família', 'G', 35, 'people-outline', '#8B5CF6', '#F2ECFF', array['Documentos pessoais','Certidões pertinentes','Comprovante de endereço e renda','Documentos relacionados aos filhos e à demanda']),
  ('Hospital Geral de Palmas – HGP', 'Ambulatório e consulta especializada', 'Atendimento ambulatorial especializado mediante encaminhamento e regulação, conforme disponibilidade.', 'Ambulatório', 'F', 25, 'medkit-outline', '#D32F2F', '#FDECEC', array['Documento de identificação e CPF','CNS','Encaminhamento/regulação','Comprovante de agendamento']),
  ('Hospital Geral de Palmas – HGP', 'Exames e procedimentos', 'Orientação e atendimento para exames e procedimentos autorizados pela equipe de saúde.', 'Exames e procedimentos', 'G', 20, 'flask-outline', '#D32F2F', '#FDECEC', array['Documento de identificação','CNS','Pedido médico ou guia autorizada']),
  ('IGEPREV-TO', 'Aposentadoria e pensão', 'Orientação e protocolo de demandas de aposentadoria e pensão do regime próprio estadual.', 'Benefícios previdenciários estaduais', 'F', 30, 'wallet-outline', '#168653', '#E9F7EF', array['Requerimento','RG e CPF','Certidões pessoais','Documentos funcionais e de contribuição','Documentos do dependente, para pensão']),
  ('IGEPREV-TO', 'Recadastramento e atualização cadastral', 'Atualização de dados cadastrais de servidores aposentados, pensionistas e dependentes.', 'Cadastro previdenciário', 'G', 20, 'id-card-outline', '#168653', '#E9F7EF', array['Documento oficial com foto','CPF','Comprovantes das alterações cadastrais'])
)
update public.servicos s
set descricao = c.descricao,
    setor = c.setor,
    prefixo_senha = c.prefixo,
    tempo_medio_minutos = c.minutos,
    icone = c.icone,
    cor_icone = c.cor,
    cor_fundo = c.fundo,
    documentos_sugeridos = c.documentos,
    ativo = true
from catalogo c
join public.locais l
  on lower(trim(l.nome)) = lower(trim(c.local_nome))
where s.local_id = l.id
  and lower(trim(s.titulo)) = lower(trim(c.titulo));

-- Garante pelo menos um serviço para TODO local ativo, inclusive locais
-- preexistentes que não façam parte dos 20 registros desta carga.
-- Como prefixo_senha é CHAR(1), usa um único caractere.
insert into public.servicos (
  local_id, titulo, descricao, setor, prefixo_senha,
  tempo_medio_minutos, prazo_comparecimento_segundos,
  icone, cor_icone, cor_fundo, documentos_sugeridos, ativo
)
select
  l.id,
  'Atendimento geral',
  'Atendimento inicial e orientação sobre os serviços disponíveis nesta unidade.',
  'Atendimento geral',
  'Z',
  15,
  240,
  coalesce(l.icone, 'help-circle-outline'),
  coalesce(l.cor_icone, '#0757D8'),
  coalesce(l.cor_fundo, '#EDF4FF'),
  array['Documento de identificação com foto'],
  true
from public.locais l
where l.ativo = true
  and not exists (
    select 1 from public.servicos s
    where s.local_id = l.id and s.ativo = true
  );

-- Preenche metadados básicos de serviços ativos legados que não tenham sido
-- contemplados no catálogo acima; evita descrições/setores vazios no app/IA.
update public.servicos
set descricao = coalesce(nullif(trim(descricao), ''), 'Atendimento e orientação relacionados a ' || titulo || '.'),
    setor = coalesce(nullif(trim(setor), ''), 'Atendimento geral'),
    prefixo_senha = coalesce(nullif(trim(prefixo_senha), ''), 'A'),
    tempo_medio_minutos = coalesce(tempo_medio_minutos, 15),
    documentos_sugeridos = coalesce(documentos_sugeridos, array['Documento de identificação com foto'])
where ativo = true;

commit;

-- Verificação pós-migration:
-- select count(*) as locais_ativos_sem_servico
-- from public.locais l
-- where l.ativo = true and not exists (
--   select 1 from public.servicos s where s.local_id = l.id and s.ativo = true
-- );
-- Esperado: 0.
-- select l.nome, count(s.id) as servicos_ativos
-- from public.locais l left join public.servicos s
--   on s.local_id = l.id and s.ativo = true
-- where l.ativo = true group by l.id, l.nome order by l.nome;
