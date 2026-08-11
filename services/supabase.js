// ============================================================
// supabase.js
// CLOUD SYNC - config/conexao Supabase
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== CLOUD SYNC — Infraestrutura SaaS (Etapa 5: Supabase/Asaas) =====
// =====================================================================
// Este bloco NÃO altera nenhuma tela, menu ou funcionalidade do ERP.
// Ele apenas conecta o StorageService (que todo o resto do sistema já
// usa) a um backend real no Supabase, mantendo o localStorage como
// cache local/rápido de leitura (por isso nenhuma tela precisou virar
// assíncrona). Cada empresa (tenant) enxerga só os próprios dados via
// Row Level Security. Preencha as duas constantes abaixo com os dados
// do seu projeto Supabase (Project Settings > API).
const CLOUD_CONFIG = {
  SUPABASE_URL: 'https://SEU_PROJECT_REF.supabase.co',
  SUPABASE_ANON_KEY: 'SUA_ANON_KEY_AQUI',
  ATIVADO: true // false = roda 100% local (comportamento original), sem nuvem
};

// Chaves de negócio que devem ser sincronizadas com a nuvem (empresa a
// empresa). Chaves de sessão/local (token, preferências do navegador)
// ficam de fora de propósito.
const CLOUD_SYNC_KEYS = new Set([
  ...Object.values({
    obras: 'gob_obras', servicos: 'gob_servicos', equipe: 'gob_equipe',
    financeiro: 'gob_financeiro', estoque: 'gob_estoque', diario: 'gob_diario',
    cronograma: 'gob_cronograma', contratos: 'gob_contratos', documentos: 'gob_documentos',
    config: 'gob_config', fornecedores: 'gob_fornecedores', compras: 'gob_compras',
    permissoes: 'gob_permissoes'
  }),
  'gob_users', 'gob_activity_log'
]);

