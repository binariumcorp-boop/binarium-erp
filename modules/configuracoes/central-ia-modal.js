// ============================================================
// central-ia-modal.js
// FASE 2: MODAL CFG IA
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== FASE 2: MODAL CFG IA =====
function initModalCfgIA() {
  if (document.getElementById('modal-cfg-ia')) return;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'modal-cfg-ia';
  modal.innerHTML = `<div class="modal" style="max-width:420px">
    <div class="modal-header"><h3 style="font-size:16px;font-weight:600">Configurar API de IA</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="alert alert-warn mb-16">⚠️ Nunca compartilhe sua chave de API. Ela é armazenada apenas no seu navegador.</div>
      <div class="form-group"><label class="form-label">Provedor</label><select class="form-input" id="ia-provedor"><option value="openai">OpenAI (GPT-3.5/4)</option></select></div>
      <div class="form-group"><label class="form-label">Chave de API</label><input class="form-input" type="password" id="ia-api-key" placeholder="sk-..." value="${StorageService.get('gob_ia_key','')}"></div>
      <div class="form-group"><label class="form-label">Modelo</label><select class="form-input" id="ia-modelo"><option value="gpt-3.5-turbo">GPT-3.5 Turbo (rápido)</option><option value="gpt-4">GPT-4 (preciso)</option></select></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="salvarCfgIA()">💾 Salvar</button>
    </div>
  </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.body.appendChild(modal);
}

function salvarCfgIA() {
  const key = document.getElementById('ia-api-key').value.trim();
  StorageService.set('gob_ia_key', key);
  const alertEl = document.getElementById('ia-mode-alert');
  if (alertEl) {
    if (key) { alertEl.className = 'alert alert-info mb-20'; alertEl.innerHTML = '✅ API configurada. Respostas reais ativadas.'; }
    else { alertEl.className = 'alert alert-info mb-20'; alertEl.innerHTML = 'ℹ️ <strong>Modo Demonstrativo:</strong> Configure uma chave de API OpenAI nas configurações para respostas reais.'; }
  }
  closeModal();
  showToast(key ? 'API de IA configurada!' : 'Configuração removida.', key ? 'success' : 'info');
}

