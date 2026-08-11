// ============================================================
// app-hooks-fase3.js
// FASE 3: GANCHOS DE ROTEAMENTO E INICIALIZACAO
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

// =====================================================================
// FASE 3: GANCHOS DE ROTEAMENTO E INICIALIZAÇÃO
// =====================================================================
const origRenderPageF3 = window.renderPage;
window.renderPage = function(page) {
  origRenderPageF3(page);
  if (page === 'mapa') setTimeout(renderMapaObras, 60);
};

const origGoToF3 = window.goTo;
window.goTo = function(page) {
  origGoToF3(page);
  setTimeout(applyPermissoes, 30);
};

const origSwitchConfigTabF3 = window.switchConfigTab;
window.switchConfigTab = function(tab, el) {
  origSwitchConfigTabF3(tab, el);
  if (tab === 'permissoes') renderPermTable();
};

const origInitAppF3 = window.initApp;
window.initApp = function() {
  origInitAppF3();
  setTimeout(() => {
    initMapaObras();
    initPermissoesTab();
    applyPermissoes();
  }, 150);
};

if (document.getElementById('app-shell') && document.getElementById('app-shell').classList.contains('visible')) {
  setTimeout(() => {
    initMapaObras();
    initPermissoesTab();
    applyPermissoes();
  }, 250);
}

