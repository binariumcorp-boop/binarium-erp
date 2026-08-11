// ============================================================
// compras-modal-nova.js
// FASE 2: MODAL NOVA COMPRA
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== FASE 2: MODAL NOVA COMPRA =====
function initModalNovaCompra() {
  if (document.getElementById('modal-nova-compra')) return;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'modal-nova-compra';
  modal.innerHTML = `<div class="modal modal-lg">
    <div class="modal-header"><h3 style="font-size:16px;font-weight:600" id="comp-modal-title">Nova Solicitação de Compra</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <input type="hidden" id="comp-edit-id">
      <input type="hidden" id="comp-numero">
      <div class="form-row">
        <div class="form-group"><label class="form-label">Descrição *</label><input class="form-input" id="comp-desc" placeholder="Ex: Cimento e areia para obra"></div>
        <div class="form-group"><label class="form-label">Obra</label><select class="form-input" id="comp-obra"></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Fornecedor</label><select class="form-input" id="comp-fornecedor"><option value="">Selecione o fornecedor</option></select></div>
        <div class="form-group"><label class="form-label">Prioridade</label><select class="form-input" id="comp-prioridade"><option>Normal</option><option>Alta</option><option>Urgente</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Status</label><select class="form-input" id="comp-status">
          <option value="Pendente">Pendente</option>
          <option value="Aprovada">Aprovada</option>
          <option value="Recebida">Recebida</option>
          <option value="Cancelada">Cancelada</option>
        </select></div>
        <div class="form-group"><label class="form-label">Condição de Pagamento</label><select class="form-input" id="comp-condicao">
          <option value="">Não definida</option>
          <option>À vista</option>
          <option>30 dias</option>
          <option>30/60</option>
          <option>30/60/90</option>
          <option>Entrada + parcelas</option>
        </select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Previsão de Entrega</label><input class="form-input" id="comp-previsao" type="date"></div>
        <div class="form-group"><label class="form-label">Prazo de Entrega (dias)</label><input class="form-input" id="comp-prazo" type="number" min="0" placeholder="0"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Itens da Compra *</label>
        <div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
          <table style="width:100%">
            <tr style="background:#f9fafb"><th style="padding:6px;text-align:left;font-size:11px">Descrição</th><th style="padding:6px;text-align:left;font-size:11px;width:90px">Unidade</th><th style="padding:6px;text-align:left;font-size:11px;width:70px">Qtd.</th><th style="padding:6px;text-align:left;font-size:11px;width:100px">Valor Unit.</th><th style="padding:6px;text-align:right;font-size:11px;width:100px">Subtotal</th><th style="width:36px"></th></tr>
            <tbody id="comp-itens-body"></tbody>
          </table>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="adicionarItemCompra()">+ Adicionar Item</button>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Frete (R$)</label><input class="form-input" id="comp-frete" type="number" min="0" step="0.01" placeholder="0.00" oninput="recalcularTotaisCompra()"></div>
        <div class="form-group"><label class="form-label">Desconto (R$)</label><input class="form-input" id="comp-desconto" type="number" min="0" step="0.01" placeholder="0.00" oninput="recalcularTotaisCompra()"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Subtotal</label><input class="form-input" id="comp-subtotal-display" disabled value="R$ 0,00"></div>
        <div class="form-group"><label class="form-label">Total</label><input class="form-input" id="comp-total-display" disabled value="R$ 0,00" style="font-weight:700"></div>
      </div>
      <div class="form-group"><label class="form-label">Justificativa / Observações</label><textarea class="form-input" id="comp-justif" rows="2" placeholder="Por que esta compra é necessária?"></textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="salvarCompra()">💾 Salvar Compra</button>
    </div>
  </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.body.appendChild(modal);
}

