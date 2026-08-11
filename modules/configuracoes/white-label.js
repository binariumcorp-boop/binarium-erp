// ============================================================
// white-label.js
// APLICACAO CENTRAL DA IDENTIDADE VISUAL
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== APLICAÇÃO CENTRAL DA IDENTIDADE VISUAL (White Label) =====
// Chamada no boot (loadConfig) e sempre que a Identidade Visual é salva.
// Nunca sobrescreve a marca BinariumCorp, que é fixa em todo o sistema.
function applyBranding(cfg) {
  cfg = cfg || DB.getConfig();
  const empresa = cfg.empresa || {};
  const erp = cfg.erp || {};
  const aparencia = cfg.aparencia || {};

  const nomeExibido = empresa.nome || 'MB SOLUÇÕES';
  const slogan = empresa.slogan || '';
  const nomeSistema = erp.nome || nomeExibido;

  // Nome do ERP / título da aba
  document.title = nomeSistema;
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = nomeSistema;

  // Sidebar
  const sbName = document.getElementById('sidebar-company-name');
  const sbSub = document.getElementById('sidebar-company-sub');
  const sbIcon = document.getElementById('sidebar-logo-icon');
  if (sbName) sbName.textContent = nomeExibido;
  if (sbSub) sbSub.textContent = slogan;
  if (sbIcon) {
    if (erp.logoImg) {
      sbIcon.style.backgroundImage = `url('${erp.logoImg}')`;
      sbIcon.textContent = '';
    } else {
      sbIcon.style.backgroundImage = '';
      sbIcon.textContent = (erp.logoLetra || nomeExibido[0] || 'G').toUpperCase();
    }
  }

  // Tela de login
  const setText = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };
  setText('login-brand-name', nomeExibido);
  setText('login-brand-sub', slogan);
  setText('login-brand-name-right', nomeExibido);
  setText('login-brand-sub-right', slogan);
  if (erp.boasVindas) { const h = document.getElementById('login-headline'); if (h) h.innerHTML = erp.boasVindas.replace(/\n/g, '<br>'); }
  if (erp.descLogin) { const d = document.getElementById('login-desc'); if (d) d.textContent = erp.descLogin; }

  // Logo personalizado (login e sidebar)
  ['login-logo-img', 'login-logo-img-right'].forEach(id => {
    const img = document.getElementById(id);
    if (img && erp.logoImg) img.src = erp.logoImg;
  });

  // Favicon
  const favEl = document.getElementById('favicon-link');
  if (favEl) favEl.href = erp.faviconImg || '';

  // Cores
  if (aparencia.cor) {
    document.documentElement.style.setProperty('--blue', aparencia.cor);
    document.documentElement.style.setProperty('--blue-dark', adjustColor(aparencia.cor, -20));
    document.documentElement.style.setProperty('--blue-light', hexToLight(aparencia.cor));
  }
  if (aparencia.sidebarBg) {
    document.documentElement.style.setProperty('--sidebar-bg', aparencia.sidebarBg);
    const sb = document.getElementById('sidebar'); if (sb) sb.style.background = aparencia.sidebarBg;
  }
  if (erp.corSecundaria) document.documentElement.style.setProperty('--green', erp.corSecundaria);
  if (erp.corBotoes) {
    document.documentElement.style.setProperty('--btn-color', erp.corBotoes);
    document.documentElement.style.setProperty('--btn-color-dark', adjustColor(erp.corBotoes, -20));
  }
  if (erp.corTopo) {
    document.documentElement.style.setProperty('--topbar-bg', erp.corTopo);
    const tb = document.getElementById('topbar'); if (tb) tb.style.background = erp.corTopo;
  }
  if (erp.tema === 'claro') document.body.classList.add('theme-light');
  else document.body.classList.remove('theme-light');

  // Imagem da tela de login
  aplicarImagemLogin(cfg);
}

function setColor(color) {
  document.documentElement.style.setProperty('--blue', color);
  document.documentElement.style.setProperty('--blue-dark', adjustColor(color, -20));
  document.documentElement.style.setProperty('--blue-light', hexToLight(color));
  document.getElementById('cur-color-txt').textContent = color;
  document.getElementById('custom-color').value = color;
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  const cfg = DB.getConfig();
  cfg.aparencia = cfg.aparencia || {};
  cfg.aparencia.cor = color;
  DB.setConfig(cfg);
  showToast('Cor atualizada!', 'success');
}

function setSidebarTheme(bg) {
  document.getElementById('sidebar').style.background = bg;
  document.documentElement.style.setProperty('--sidebar-bg', bg);
  const cfg = DB.getConfig();
  cfg.aparencia = cfg.aparencia || {};
  cfg.aparencia.sidebarBg = bg;
  DB.setConfig(cfg);
  showToast('Tema da sidebar atualizado!', 'success');
}

function toggleSwitch(el) {
  el.classList.toggle('on');
}

function checkPwd() {
  const pwd = document.getElementById('new-pwd').value;
  const el = document.getElementById('pwd-strength');
  if (!pwd) { el.textContent = ''; return; }
  if (pwd.length < 6) el.innerHTML = '<span style="color:var(--red)">Senha fraca – mínimo 6 caracteres</span>';
  else if (pwd.length < 10) el.innerHTML = '<span style="color:var(--amber)">Senha razoável</span>';
  else el.innerHTML = '<span style="color:var(--green)">Senha forte ✓</span>';
}

function alterarSenha() {
  const atual = document.getElementById('pwd-atual').value;
  const nova = document.getElementById('new-pwd').value;
  const confirma = document.getElementById('new-pwd2').value;
  AuthService.changePassword(atual, nova, confirma);
}

function handleLogoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const wrap = document.getElementById('logo-preview-wrap');
    wrap.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:contain;border-radius:8px">`;
    const cfg = DB.getConfig();
    cfg.erp = cfg.erp || {};
    cfg.erp.logoImg = e.target.result;
    DB.setConfig(cfg);
    applyBranding(cfg);
    showToast('Logo atualizado!', 'success');
  };
  reader.readAsDataURL(file);
}

function handleFotoEngenheiro(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const av = document.getElementById('eng-avatar-preview');
    av.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    showToast('Foto atualizada!', 'success');
  };
  reader.readAsDataURL(file);
}

function atualizarEngenheiro() {
  const nome = document.getElementById('cfg-eng-nome').value;
  const cargo = document.getElementById('cfg-eng-cargo').value;
  document.getElementById('sidebar-user-name').textContent = nome;
  document.getElementById('sidebar-user-role').textContent = cargo;
}

function clearAllData() {
  StorageService.clear();
  showToast('Todos os dados foram removidos. Recarregando...', 'warning');
  setTimeout(() => location.reload(), 1500);
}

