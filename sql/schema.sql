-- ============================================================
-- VORTEX ERP — Schema de referência (Supabase / PostgreSQL)
-- ============================================================
-- Este schema foi ENGENHARIA-REVERSA a partir dos campos que o
-- código-fonte realmente lê/grava em cada entidade (ver DB.KEYS em
-- database/database.js e os formulários de cada módulo). Ele NÃO
-- existia no projeto original — hoje o app roda 100% sobre
-- localStorage e só espelha os dados para a nuvem via CloudSync
-- (services/sync.js) como JSON bruto, sem tabelas Postgres próprias.
--
-- Use este arquivo como PONTO DE PARTIDA para criar as tabelas reais
-- no Supabase quando for ativar a sincronização de verdade — não é
-- executado por nenhuma parte do app.
--
-- Convenção: cada tabela tem "empresa_id" para isolamento multi-tenant
-- (o app já se refere a esse conceito em CloudSync.empresaId, em
-- services/supabase.js) e deve ter Row Level Security (RLS) habilitado
-- no Supabase restringindo por empresa_id — isso é configurado no
-- painel do Supabase, não neste arquivo.
-- ============================================================

-- ----- OBRAS -----
-- Campos confirmados em modules/obras/obras.js (editarObra/salvarObra)
create table if not exists obras (
  id            bigint generated always as identity primary key,
  empresa_id    uuid not null,
  nome          text not null,
  codigo        text,
  municipio     text,
  licitacao     text,
  objeto        text,
  responsavel   text,
  status        text,
  valor         numeric(14,2) default 0,
  progresso     int default 0,
  inicio        date,
  termino       date,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ----- SERVIÇOS (itens de serviço de uma obra) -----
-- Campos confirmados em modules/obras/servicos.js (editarServico)
create table if not exists servicos (
  id              bigint generated always as identity primary key,
  empresa_id      uuid not null,
  obra_id         bigint references obras(id) on delete cascade,
  nome            text not null,
  etapa           text,
  responsavel     text,
  valor_contratado numeric(14,2),
  custo_orcado    numeric(14,2),
  inicio          date,
  prazo           date,
  inicio_real     date,
  fim_real        date,
  progresso       int default 0,
  status          text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ----- EQUIPE / FUNCIONÁRIOS -----
-- Campos confirmados em modules/funcionarios/funcionarios.js (editarColaborador)
create table if not exists equipe (
  id          bigint generated always as identity primary key,
  empresa_id  uuid not null,
  obra_id     bigint references obras(id) on delete set null,
  nome        text not null,
  cpf         text,
  funcao      text,
  telefone    text,
  admissao    date,
  status      text,
  salario     numeric(12,2),
  obs         text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ----- FINANCEIRO -----
-- Campos confirmados em modules/financeiro/financeiro.js (salvarMovimentacao)
create table if not exists financeiro (
  id                bigint generated always as identity primary key,
  empresa_id        uuid not null,
  obra_id           bigint references obras(id) on delete set null,
  fornecedor_id     bigint,
  descricao         text not null,
  valor             numeric(14,2) not null,
  data              date not null,
  tipo              text, -- 'entrada' | 'saida'
  status            text, -- 'Pago' | 'Pendente' etc.
  comprovante_id    bigint, -- referencia um registro em documentos
  comprovante_nome  text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ----- ESTOQUE -----
-- Campos confirmados em modules/estoque/estoque.js (editarItem)
create table if not exists estoque (
  id             bigint generated always as identity primary key,
  empresa_id     uuid not null,
  obra_id        bigint references obras(id) on delete set null,
  fornecedor_id  bigint,
  nome           text not null,
  categoria      text,
  unidade        text,
  qtd            numeric(12,2) default 0,
  minimo         numeric(12,2) default 0,
  valor_unit     numeric(12,2) default 0,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ----- DIÁRIO DE OBRA -----
-- Campos confirmados em modules/diario-obras/diario.js (salvarDiario)
create table if not exists diario (
  id                  bigint generated always as identity primary key,
  empresa_id          uuid not null,
  obra_id             bigint references obras(id) on delete cascade,
  data                date not null,
  titulo              text not null,
  equipe_ids          jsonb, -- array de ids de "equipe" presentes no dia
  colaboradores_extra int default 0,
  colaboradores_total int default 0,
  hora_inicio         time,
  hora_fim            time,
  horas_trabalhadas   numeric(5,2),
  fotos               jsonb, -- ver contrato_documentos para o padrão de anexo usado
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ----- CRONOGRAMA (atividades) -----
-- Campos confirmados em modules/cronograma/cronograma.js (salvarAtividade)
create table if not exists cronograma (
  id          bigint generated always as identity primary key,
  empresa_id  uuid not null,
  obra_id     bigint references obras(id) on delete cascade,
  nome        text not null,
  inicio      date,
  fim         date,
  status      text,
  progresso   int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ----- DOCUMENTOS (biblioteca geral de documentos) -----
-- Campos confirmados em modules/documentos/documentos.js
create table if not exists documentos (
  id           bigint generated always as identity primary key,
  empresa_id   uuid not null,
  obra_id      bigint references obras(id) on delete set null,
  nome         text not null,
  categoria    text,
  versao       text default 'v1.0',
  status       text,
  tamanho      text,
  tipo         text,
  favorito     boolean default false,
  file_name    text,
  file_url     text, -- caminho no Supabase Storage (o app hoje usa base64 direto no registro; migrar para Storage é recomendado)
  responsavel  text,
  obs          text,
  upload_at    date,
  created_at   timestamptz default now()
);

-- ----- FORNECEDORES -----
-- ⚠️ Campos abaixo NÃO foram 100% confirmados no código (o grep
-- automático não achou os ids de formulário) — confira com
-- modules/fornecedores/*.js antes de usar em produção.
create table if not exists fornecedores (
  id           bigint generated always as identity primary key,
  empresa_id   uuid not null,
  razao_social text not null,
  cnpj         text,
  categoria    text,
  telefone     text,
  email        text,
  status       text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ----- COMPRAS -----
-- ⚠️ Mesma ressalva do item acima — confira com modules/compras/*.js.
create table if not exists compras (
  id             bigint generated always as identity primary key,
  empresa_id     uuid not null,
  obra_id        bigint references obras(id) on delete set null,
  fornecedor_id  bigint references fornecedores(id) on delete set null,
  descricao      text,
  valor          numeric(14,2),
  status         text,
  data_compra    date,
  prazo_entrega  date,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ----- CONTRATOS -----
-- Campos originais confirmados em modules/contratos/contratos.js +
-- campos novos da Gestão Contratual (prefixo gc_) confirmados em
-- modules/contratos/gc-01-contrato-form.js
create table if not exists contratos (
  id                  bigint generated always as identity primary key,
  empresa_id          uuid not null,
  obra_id             bigint references obras(id) on delete set null,
  numero              text not null,
  categoria           text,
  fornecedor          text,   -- nome do fornecedor/subcontratado (modelo original)
  cnpj                text,
  objeto              text,
  pagamento           text,
  valor               numeric(14,2) default 0, -- valor ATUAL (já inclui aditivos de valor)
  valor_executado     numeric(14,2) default 0,
  status              text,
  inicio              date,
  termino             date,
  -- Campos da Gestão Contratual (novos, prefixo gc_):
  gc_tipo_contrato    text,   -- 'Contrato com Cliente' | 'Contrato com Fornecedor/Subcontratado'
  gc_cliente          text,
  gc_contratante      text,
  gc_responsavel      text,
  gc_data_assinatura  date,
  gc_observacoes      text,
  gc_valor_original   numeric(14,2), -- valor contratado ANTES de qualquer aditivo (imutável)
  gc_anexos           jsonb,  -- { pdfContrato, planilhas, memorial, cronograma, art, anexos }
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ----- ADITIVOS -----
-- ⚠️ No código atual (aditivos.js), esta entidade é gravada via
-- DB.add('aditivos', ...) SEM uma chave própria registrada em
-- DB.KEYS — no localStorage ela acaba salva sob a chave literal
-- "undefined" (comportamento pré-existente do app original, não
-- introduzido por nenhuma refatoração; funciona porque é usado de
-- forma consistente, mas é uma pegadinha para quem for portar para o
-- Supabase). Ao migrar, use uma tabela própria "aditivos" normalmente.
create table if not exists aditivos (
  id                  bigint generated always as identity primary key,
  empresa_id          uuid not null,
  contrato_id         bigint references contratos(id) on delete cascade,
  contrato_numero     text,
  numero              text not null,
  tipo                text not null, -- ver GC_TIPOS_ADITIVO em modules/contratos/gc-00-schema.js
  data                date not null,
  responsavel         text,
  situacao            text, -- 'Em Análise' | 'Aguardando Aprovação' | 'Aprovado' | 'Rejeitado'
  justificativa        text,
  descricao           text,
  gc_valor_anterior    numeric(14,2),
  gc_valor_aditivo     numeric(14,2),
  gc_novo_valor_total  numeric(14,2),
  gc_prazo_anterior    date,
  gc_novo_prazo        date,
  gc_dias_adicionados  int,
  documento            jsonb, -- { nome, tamanho, fileData }
  created_at          timestamptz default now()
);

-- ----- MEDIÇÕES (novo, Gestão Contratual) -----
-- Confirmado em modules/contratos/gc-03-medicoes.js
create table if not exists medicoes (
  id               bigint generated always as identity primary key,
  empresa_id       uuid not null,
  contrato_id      bigint references contratos(id) on delete cascade,
  contrato_numero  text,
  numero           text not null,
  data             date not null,
  valor            numeric(14,2) not null,
  percentual       numeric(5,2),
  responsavel      text,
  status           text, -- 'Pendente' | 'Aprovada' | 'Rejeitada' | 'Paga'
  obs              text,
  documento        jsonb,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ----- DOCUMENTOS DO CONTRATO (novo, Gestão Contratual) -----
-- Confirmado em modules/contratos/gc-04-documentos.js
create table if not exists contrato_documentos (
  id               bigint generated always as identity primary key,
  empresa_id       uuid not null,
  contrato_id      bigint references contratos(id) on delete cascade,
  contrato_numero  text,
  nome             text not null,
  tipo             text, -- ver GC_TIPOS_DOCUMENTO em gc-00-schema.js
  tamanho          text,
  file_url         text, -- o app hoje guarda base64 direto (file_data); migrar para Storage é recomendado
  file_data        text,
  upload_at        timestamptz default now()
);

-- ----- CONFIGURAÇÕES (registro único por empresa) -----
-- Corresponde a DB.getConfig()/DB.setConfig() — um único JSON por
-- empresa (tema, identidade visual, permissões, textos de login etc.)
create table if not exists config (
  empresa_id  uuid primary key,
  dados       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz default now()
);

-- ----- LOG DE ATIVIDADES -----
-- Corresponde a ActivityLog (services/activity-log.js)
create table if not exists activity_log (
  id           bigint generated always as identity primary key,
  empresa_id   uuid not null,
  usuario      text,
  acao         text not null,
  modulo       text not null,
  registro     text,
  valor_anterior text,
  valor_novo     text,
  data         date not null default current_date,
  hora         time not null default current_time,
  created_at   timestamptz default now()
);
