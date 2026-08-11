// ============================================================
// router-paginas-extras.js
// FASE 2: RENDERIZACAO DE PAGINAS EXTRAS
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== FASE 2: RENDERIZAÇÃO DE PÁGINAS EXTRAS =====
const origRenderPage = renderPage;
window.renderPage = function(page) {
  switch(page) {
    case 'ia': break; // Já renderizado
    case 'compras': renderCompras(); break;
    case 'fornecedores': filterFornecedores(); break;
    case 'log': renderLog(); break;
    case 'assinatura': renderMinhaAssinatura(); break;
    default: origRenderPage(page);
  }
};

