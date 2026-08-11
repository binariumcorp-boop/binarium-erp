// ============================================================
// gc-00-schema.js
// GESTÃO CONTRATUAL — Extensão de schema (aditivo, não substitui nada)
//
// Este arquivo NÃO redefine nenhuma função existente. Ele apenas:
// 1) registra duas novas entidades no DB (medições e documentos do
//    contrato), do mesmo jeito que core/database.js já faz para as
//    entidades originais;
// 2) inclui essas duas novas entidades na sincronização com a nuvem,
//    do mesmo jeito que services/supabase.js já faz para as outras.
// Nada disso altera o comportamento de nenhuma tela existente.
// ============================================================

'use strict';

// ----- Novas entidades no DB (mesma convenção de core/database.js) -----
// obs: "aditivos" já usa DB.add/DB.get sem uma chave própria em DB.KEYS
// (fica salvo sob a chave "undefined" do StorageService — comportamento
// pré-existente, não alterado). Para as entidades NOVAS deste módulo,
// registramos chaves próprias para não colidir com "aditivos".
if (typeof DB !== 'undefined' && DB.KEYS && !DB.KEYS.medicoes) {
  DB.KEYS.medicoes = 'gob_medicoes';
  DB.KEYS.contratoDocumentos = 'gob_contrato_documentos';
}

// ----- Inclui as novas entidades na sincronização com a nuvem -----
// (mesma lógica de CLOUD_SYNC_KEYS em services/supabase.js, só que
// adicionando ao Set já existente em vez de redefinir o arquivo)
if (typeof CLOUD_SYNC_KEYS !== 'undefined') {
  CLOUD_SYNC_KEYS.add('gob_medicoes');
  CLOUD_SYNC_KEYS.add('gob_contrato_documentos');
}

// ----- Constantes do módulo -----

// Tipos de aditivo contratual pedidos para a Gestão Contratual (mais
// amplos que os 3 tipos originais de "Aditivo de Obra": Valor/Prazo/
// Escopo). O aditivo original continua funcionando exatamente igual;
// esses tipos novos são usados pelo formulário estendido em
// gc-02-aditivos.js.
const GC_TIPOS_ADITIVO = [
  'Acréscimo de Valor',
  'Supressão',
  'Prorrogação de Prazo',
  'Alteração de Escopo',
  'Reequilíbrio Financeiro',
  'Outro'
];

const GC_SITUACOES_ADITIVO = ['Em Análise', 'Aguardando Aprovação', 'Aprovado', 'Rejeitado'];

const GC_TIPOS_DOCUMENTO = [
  'PDF do Contrato', 'Planilha', 'Memorial', 'Cronograma', 'ART', 'RRT',
  'Croqui', 'Ofício', 'Foto', 'Vídeo', 'Word', 'Excel', 'DWG', 'Outro'
];

const GC_TIPOS_CONTRATO = ['Contrato com Cliente', 'Contrato com Fornecedor/Subcontratado'];

// Ícone por tipo de documento (mesma ideia de docIcon() em documentos.js,
// só que com os tipos específicos da Gestão Contratual)
function gcDocIcon(tipo) {
  const icons = {
    'PDF do Contrato': '📄', 'Planilha': '📊', 'Memorial': '📘',
    'Cronograma': '🗓️', 'ART': '📐', 'RRT': '📐', 'Croqui': '✏️',
    'Ofício': '✉️', 'Foto': '🖼️', 'Vídeo': '🎬', 'Word': '📝',
    'Excel': '📊', 'DWG': '📐', 'Outro': '📁'
  };
  return icons[tipo] || '📁';
}

// Cálculo automático do impacto financeiro dos aditivos de um contrato
// (usado no Contrato Principal, no Dashboard e no card "Impacto
// Financeiro dos Aditivos"). Não altera nenhum dado — é só leitura.
function gcImpactoAditivos(contratoId, valorOriginal) {
  const aditivos = (DB.get('aditivos') || []).filter(a => a.contratoId === contratoId);
  const valorAditivado = aditivos.reduce((s, a) => s + (a.gcValorAditivo || a.valorAdicional || 0), 0);
  const pct = valorOriginal > 0 ? (valorAditivado / valorOriginal * 100) : 0;
  return { valorOriginal: valorOriginal || 0, valorAditivado, percentual: pct };
}
