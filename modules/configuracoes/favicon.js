// ============================================================
// favicon.js
// FAVICON
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== FAVICON (Alteração 3) =====
function handleFaviconUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    document.getElementById('favicon-link').href = dataUrl;
    document.getElementById('favicon-preview').innerHTML = `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:6px">`;
    const cfg = DB.getConfig();
    cfg.erp = cfg.erp || {};
    cfg.erp.faviconImg = dataUrl;
    DB.setConfig(cfg);
    showToast('Favicon atualizado!', 'success');
  };
  reader.readAsDataURL(file);
}

function removerFavicon() {
  document.getElementById('favicon-link').href = '';
  document.getElementById('favicon-preview').innerHTML = `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--gray400)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
  const cfg = DB.getConfig();
  cfg.erp = cfg.erp || {};
  cfg.erp.faviconImg = '';
  DB.setConfig(cfg);
  showToast('Favicon restaurado ao padrão.', 'info');
}

