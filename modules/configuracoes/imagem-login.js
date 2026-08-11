// ============================================================
// imagem-login.js
// IMAGEM DA TELA DE LOGIN
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== IMAGEM DA TELA DE LOGIN (Alteração 2) =====
function handleLoginImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const cfg = DB.getConfig();
    cfg.erp = cfg.erp || {};
    cfg.erp.loginImg = e.target.result;
    cfg.erp.loginImgState = 'custom';
    DB.setConfig(cfg);
    aplicarImagemLogin(cfg);
    showToast('Imagem da tela de login atualizada!', 'success');
  };
  reader.readAsDataURL(file);
}

function removerImagemLogin() {
  const cfg = DB.getConfig();
  cfg.erp = cfg.erp || {};
  cfg.erp.loginImgState = 'none';
  DB.setConfig(cfg);
  aplicarImagemLogin(cfg);
  showToast('Imagem da tela de login removida.', 'info');
}

function restaurarImagemLoginPadrao() {
  const cfg = DB.getConfig();
  cfg.erp = cfg.erp || {};
  cfg.erp.loginImgState = 'default';
  cfg.erp.loginImg = '';
  cfg.erp.loginImgPos = 'center';
  cfg.erp.loginImgZoom = 100;
  cfg.erp.loginImgOpacity = 100;
  DB.setConfig(cfg);
  const posEl = document.getElementById('cfg-login-img-pos'); if (posEl) posEl.value = 'center';
  const zoomEl = document.getElementById('cfg-login-img-zoom'); if (zoomEl) zoomEl.value = 100;
  const opEl = document.getElementById('cfg-login-img-opacity'); if (opEl) opEl.value = 100;
  document.getElementById('login-img-zoom-val').textContent = '100%';
  document.getElementById('login-img-opacity-val').textContent = '100%';
  aplicarImagemLogin(cfg);
  showToast('Imagem de login restaurada ao padrão.', 'info');
}

function ajustarImagemLogin() {
  const cfg = DB.getConfig();
  cfg.erp = cfg.erp || {};
  const pos = document.getElementById('cfg-login-img-pos').value;
  const zoom = parseInt(document.getElementById('cfg-login-img-zoom').value, 10);
  const opacity = parseInt(document.getElementById('cfg-login-img-opacity').value, 10);
  cfg.erp.loginImgPos = pos;
  cfg.erp.loginImgZoom = zoom;
  cfg.erp.loginImgOpacity = opacity;
  document.getElementById('login-img-zoom-val').textContent = zoom + '%';
  document.getElementById('login-img-opacity-val').textContent = opacity + '%';
  DB.setConfig(cfg);
  aplicarImagemLogin(cfg);
}

// Aplica o estado atual da imagem de login (padrão / personalizada / removida)
// tanto na pré-visualização das Configurações quanto na tela de login real.
function aplicarImagemLogin(cfg) {
  const erp = (cfg && cfg.erp) || {};
  const state = erp.loginImgState || 'default';
  const bgWrap = document.getElementById('login-right-bg');
  const bgImg = document.getElementById('login-bg-img');
  const prevImg = document.getElementById('login-img-preview');
  const prevEmpty = document.getElementById('login-img-preview-empty');
  const posMap = { center: 'center', top: 'top', bottom: 'bottom', left: 'left', right: 'right' };
  const objPos = posMap[erp.loginImgPos] || 'center';
  const zoom = (erp.loginImgZoom || 100) / 100;
  const opacity = (erp.loginImgOpacity != null ? erp.loginImgOpacity : 100) / 100;

  if (state === 'custom' && erp.loginImg) {
    if (bgWrap) bgWrap.style.backgroundImage = 'radial-gradient(ellipse at 70% 30%, rgba(26,86,219,.25) 0%, transparent 55%)';
    if (bgImg) {
      bgImg.src = erp.loginImg;
      bgImg.style.display = 'block';
      bgImg.style.objectPosition = objPos;
      bgImg.style.transform = `scale(${zoom})`;
      bgImg.style.opacity = opacity;
    }
    if (prevImg) { prevImg.src = erp.loginImg; prevImg.style.display = 'block'; }
    if (prevEmpty) prevEmpty.style.display = 'none';
  } else if (state === 'none') {
    if (bgWrap) bgWrap.style.backgroundImage = 'radial-gradient(ellipse at 70% 30%, rgba(26,86,219,.25) 0%, transparent 55%)';
    if (bgImg) bgImg.style.display = 'none';
    if (prevImg) prevImg.style.display = 'none';
    if (prevEmpty) { prevEmpty.style.display = 'flex'; prevEmpty.textContent = 'Sem imagem (removida pelo administrador)'; }
  } else {
    // padrão: restaura o CSS original (gradiente + foto padrão do sistema)
    if (bgWrap) bgWrap.style.backgroundImage = '';
    if (bgImg) bgImg.style.display = 'none';
    if (prevImg) prevImg.style.display = 'none';
    if (prevEmpty) { prevEmpty.style.display = 'flex'; prevEmpty.textContent = 'Sem imagem personalizada (usando padrão)'; }
  }
}

