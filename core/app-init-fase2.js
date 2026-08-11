// ============================================================
// app-init-fase2.js
// FASE 2: INICIALIZACAO
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== FASE 2: INICIALIZAÇÃO =====
const origInitApp = initApp;
window.initApp = function() {
  origInitApp();
  // Inicializar melhorias da Fase 2
  setTimeout(() => {
    initBuscaUniversal();
    initCentralIA();
    initCompras();
    initFornecedores();
    migrarDadosDeFornecedores();
    migrarComprasAntigas();
    migrarRelacionamentosDeFornecedores();
    initComprasObraTab();
    initDashboardExecutivo();
    initBackup();
    initLogAtividades();
    initMinhaAssinatura();
    initAlertasInteligentes();
    initModalCfgIA();
    initModalNovaCompra();
    initModalNovoFornecedor();
    initModalVerFornecedor();
    renderAlertas();
    // Adicionar selects de obras nos modais de compra e fornecedor
    const compObraEl = document.getElementById('comp-obra');
    if (compObraEl) populateSelect('comp-obra', DB.get('obras'), 'id', 'nome', 'Geral');
  }, 100);
};

// Sobrescrever initApp se já foi chamado
if (document.getElementById('app-shell').classList.contains('visible')) {
  setTimeout(() => {
    initBuscaUniversal();
    initCentralIA();
    initCompras();
    initFornecedores();
    migrarDadosDeFornecedores();
    migrarComprasAntigas();
    migrarRelacionamentosDeFornecedores();
    initComprasObraTab();
    initDashboardExecutivo();
    initBackup();
    initLogAtividades();
    initMinhaAssinatura();
    initAlertasInteligentes();
    initModalCfgIA();
    initModalNovaCompra();
    initModalNovoFornecedor();
    initModalVerFornecedor();
    renderAlertas();
  }, 200);
}

