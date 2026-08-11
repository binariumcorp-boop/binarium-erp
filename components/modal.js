// ============================================================
// modal.js
// MODAL + CONFIRM DIALOG
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== MODAL =====
let currentModal = null;
function openModal(id) {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
  const m = document.getElementById('modal-' + id);
  if (m) { m.classList.add('open'); currentModal = id; }
}
function closeModal() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
  currentModal = null;
  // FASE 3 FIX: limpa todos os IDs de edição ao fechar qualquer modal,
  // para que "+ Novo/Nova" nunca reaproveite por engano o registro editado por último.
  ['obra-edit-id','servico-edit-id','colab-edit-id','mov-edit-id','est-edit-id',
   'diario-edit-id','crono-edit-id','ct-edit-id','doc-edit-id','usr-edit-id','forn-edit-id','comp-edit-id'
  ].forEach(fid => { const el = document.getElementById(fid); if (el) el.value = ''; });
  diarioFotosAtuais = [];
  renderDiarioFotosPreview();
}
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) closeModal(); });
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ===== CONFIRM DIALOG =====
let confirmCallback = null;
function confirmAction(title, msg, callback, icon = '⚠️') {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent = msg;
  document.getElementById('confirm-icon').textContent = icon;
  confirmCallback = callback;
  document.getElementById('confirm-overlay').classList.add('open');
}
function confirmOk() {
  document.getElementById('confirm-overlay').classList.remove('open');
  if (confirmCallback) { confirmCallback(); confirmCallback = null; }
}
function confirmCancel() {
  document.getElementById('confirm-overlay').classList.remove('open');
  confirmCallback = null;
}

