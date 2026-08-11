// ============================================================
// logo.js
// LOGO PERSONALIZADO
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== LOGO PERSONALIZADO (usado no login e na sidebar) =====
function removerLogo() {
  const cfg = DB.getConfig();
  cfg.erp = cfg.erp || {};
  cfg.erp.logoImg = '';
  DB.setConfig(cfg);
  document.getElementById('logo-preview-wrap').innerHTML = `
    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="var(--gray400)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
    <span style="font-size:11px;color:var(--gray400)">Clique para upload</span>`;
  applyBranding(cfg);
  showToast('Logo personalizado removido.', 'info');
}

