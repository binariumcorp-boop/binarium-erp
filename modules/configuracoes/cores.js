// ============================================================
// cores.js
// CORES ADICIONAIS DE IDENTIDADE VISUAL
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== CORES ADICIONAIS DE IDENTIDADE VISUAL =====
function setCorSecundaria(color) {
  document.documentElement.style.setProperty('--green', color);
  const cfg = DB.getConfig();
  cfg.erp = cfg.erp || {};
  cfg.erp.corSecundaria = color;
  DB.setConfig(cfg);
  showToast('Cor secundária atualizada!', 'success');
}

function setCorBotoes(color) {
  document.documentElement.style.setProperty('--btn-color', color);
  document.documentElement.style.setProperty('--btn-color-dark', adjustColor(color, -20));
  const cfg = DB.getConfig();
  cfg.erp = cfg.erp || {};
  cfg.erp.corBotoes = color;
  DB.setConfig(cfg);
  showToast('Cor dos botões atualizada!', 'success');
}

function setCorTopo(color) {
  document.documentElement.style.setProperty('--topbar-bg', color);
  const cfg = DB.getConfig();
  cfg.erp = cfg.erp || {};
  cfg.erp.corTopo = color;
  DB.setConfig(cfg);
}

