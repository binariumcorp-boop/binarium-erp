// ============================================================
// tema.js
// TEMA (claro/escuro)
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== TEMA (claro/escuro) =====
function setTema(tema) {
  if (tema === 'claro') {
    setSidebarTheme('#ffffff');
    setCorTopo('#ffffff');
    document.body.classList.add('theme-light');
  } else {
    setSidebarTheme('#0f1729');
    document.body.classList.remove('theme-light');
  }
  const cfg = DB.getConfig();
  cfg.erp = cfg.erp || {};
  cfg.erp.tema = tema;
  DB.setConfig(cfg);
}

