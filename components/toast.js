// ============================================================
// toast.js
// NOTIFICATION SERVICE
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== NOTIFICATION SERVICE =====
const NotificationService = {
  show(msg, type = 'info', duration = 3500) {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    t.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => {
      t.style.animation = 'slideOut .3s ease forwards';
      setTimeout(() => t.remove(), 300);
    }, duration);
  }
};
function showToast(msg, type = 'info') { NotificationService.show(msg, type); }

