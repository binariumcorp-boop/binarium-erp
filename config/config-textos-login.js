// ============================================================
// config-textos-login.js
// TEXTOS DO PAINEL DE LOGIN
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== TEXTOS DO PAINEL DE LOGIN (Alteração 6) =====
function atualizarTextosLogin() {
  const boasVindas = document.getElementById('cfg-erp-boasvindas').value.trim();
  const descLogin = document.getElementById('cfg-erp-desc-login').value.trim();
  if (boasVindas) document.getElementById('login-headline').innerHTML = boasVindas.replace(/\n/g, '<br>');
  if (descLogin) document.getElementById('login-desc').textContent = descLogin;
}

