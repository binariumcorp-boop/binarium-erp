// ============================================================
// auth-login-ui.js
// LOGIN (wiring da tela)
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== LOGIN =====
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-password').value;
  const err = document.getElementById('login-error');

  if (!email || !senha) {
    document.getElementById('login-error-msg').textContent = 'Preencha e-mail e senha.';
    err.classList.add('show');
    return;
  }

  const btn = document.getElementById('login-submit-btn');
  if (btn) { btn.disabled = true; }

  const result = await AuthService.login(email, senha);
  if (btn) { btn.disabled = false; }

  if (result.ok) {
    err.classList.remove('show');
    document.getElementById('login-screen').classList.add('hidden');
    const shell = document.getElementById('app-shell');
    shell.classList.add('visible');
    updateSidebarUser(result.user);
    renderLicencaBanner(result.user.assinaturaStatus);
    initApp();
  } else {
    const mensagens = {
      email: 'Não encontramos uma conta com esse e-mail.',
      inativo: 'Este usuário está inativo. Fale com um administrador.',
      senha: 'Senha incorreta. Verifique o Caps Lock e tente novamente.',
      offline: 'Não foi possível conectar ao servidor. Tente novamente em instantes.'
    };
    document.getElementById('login-error-msg').textContent = mensagens[result.motivo] || 'E-mail ou senha incorretos.';
    err.classList.add('show');
    document.getElementById('login-password').value = '';
    document.getElementById('login-password').focus();
    document.getElementById('login-email').classList.add('error');
    document.getElementById('login-password').classList.add('error');
    setTimeout(() => {
      document.getElementById('login-email').classList.remove('error');
      document.getElementById('login-password').classList.remove('error');
    }, 2000);
  }
}

function togglePwd() {
  const inp = document.getElementById('login-password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

function showForgotPwd() { openModal('forgot-pwd'); }

function enviarRecuperacao() {
  const email = document.getElementById('forgot-email').value.trim();
  if (!email) { showToast('Digite seu e-mail.', 'error'); return; }
  showToast('Instruções enviadas para ' + email + ' (modo demonstrativo).', 'info');
  closeModal();
}

function doLogout() {
  confirmAction('Deseja sair do sistema?', 'Sua sessão será encerrada.', () => {
    AuthService.logout();
    const banner = document.getElementById('licenca-banner');
    if (banner) banner.remove();
    document.getElementById('app-shell').classList.remove('visible');
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').classList.remove('show');
  }, '👋');
}

function updateSidebarUser(user) {
  const name = user.nome || 'Usuário';
  document.getElementById('sidebar-user-name').textContent = name;
  document.getElementById('sidebar-user-role').textContent = AuthService.isSuperAdmin(user) ? 'Super Admin • BinariumCorp' : (user.perfil || 'Usuário');
  document.getElementById('sidebar-user-av').textContent = FormatService.initials(name);
  aplicarVisibilidadeSuperAdmin(AuthService.isSuperAdmin(user));
}

// Exibe/oculta pontos do sistema exclusivos do Super Admin BinariumCorp
// (Alteração 4): nenhum administrador de empresa tem acesso a eles.
function aplicarVisibilidadeSuperAdmin(isSuper) {
  document.querySelectorAll('.super-admin-only').forEach(el => {
    el.style.display = isSuper ? '' : 'none';
  });
}

// Aviso não-intrusivo de licenciamento/assinatura (Etapa 5 / Asaas).
// Não altera nenhuma tela existente: só injeta uma faixa fixa quando a
// assinatura da empresa está atrasada/cancelada. Nada é bloqueado aqui;
// a regra de leitura-somente (Etapa 11) fica a critério de configuração.
function renderLicencaBanner(status) {
  let el = document.getElementById('licenca-banner');
  const estadosDeAlerta = { atrasado: 'Seu pagamento está atrasado. Regularize para evitar bloqueio.', cancelada: 'Sua assinatura está cancelada. Fale com a MB Soluções.' };
  if (!status || !estadosDeAlerta[status]) { if (el) el.remove(); return; }
  if (!el) {
    el = document.createElement('div');
    el.id = 'licenca-banner';
    el.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#b91c1c;color:#fff;padding:10px 16px;text-align:center;font-size:13px;font-weight:500';
    document.body.appendChild(el);
  }
  el.textContent = '⚠️ ' + estadosDeAlerta[status];
}

