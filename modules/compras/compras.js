// ============================================================
// compras.js
// FASE 2: COMPRAS E COTACOES
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== FASE 2: COMPRAS E COTAÇÕES =====
function initCompras() {
  if (document.querySelector('[data-page="compras"]')) return;
  // Adicionar na sidebar
  const finSection = document.querySelector('.nav-item[data-page="estoque"]');
  if (!finSection) return;
  const comprasItem = document.createElement('div');
  comprasItem.className = 'nav-item';
  comprasItem.dataset.page = 'compras';
  comprasItem.onclick = () => goTo('compras');
  comprasItem.innerHTML = `<svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6" stroke-width="2"/><path stroke-width="2" d="M16 10a4 4 0 01-8 0"/></svg><span>Compras</span>`;
  finSection.parentElement.insertBefore(comprasItem, finSection.nextSibling);
  PAGE_TITLES['compras'] = 'Compras e Cotações';
  if (!DB.KEYS.compras) DB.KEYS.compras = 'gob_compras';
  // Página
  const content = document.getElementById('content');
  const page = document.createElement('div');
  page.className = 'page';
  page.id = 'page-compras';
  page.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div><h2 style="font-size:22px;font-weight:700">Compras e Cotações</h2><p style="font-size:13px;color:var(--gray400)">Gerencie solicitações de compra e cotações</p></div>
      <button class="btn btn-primary" onclick="openModal('nova-compra')">+ Nova Solicitação</button>
    </div>
    <div class="stats-row stats-4 mb-20">
      <div class="stat-card"><div class="stat-icon" style="background:#dbeafe">🛒</div><div><div class="stat-label">Total</div><div class="stat-value" id="stat-comp-total">0</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#fef3c7">⏳</div><div><div class="stat-label">Pendentes</div><div class="stat-value" id="stat-comp-pend">0</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#d1fae5">✅</div><div><div class="stat-label">Aprovadas</div><div class="stat-value" id="stat-comp-aprov">0</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#ede9fe">💰</div><div><div class="stat-label">Valor Total</div><div class="stat-value" style="font-size:15px" id="stat-comp-valor">R$ 0</div></div></div>
    </div>
    <div class="filters-row">
      <div class="search-box"><span>🔍</span><input type="text" id="compras-search" placeholder="Buscar compra..." oninput="filterCompras()"></div>
      <select class="select-box" id="compras-filter-obra" onchange="filterCompras()"><option value="">Obra: Todas</option></select>
      <select class="select-box" id="compras-filter-forn" onchange="filterCompras()"><option value="">Fornecedor: Todos</option></select>
      <select class="select-box" id="compras-filter-status" onchange="filterCompras()">
        <option value="">Status: Todos</option>
        <option value="Pendente">Pendente</option>
        <option value="Aprovada">Aprovada</option>
        <option value="Recebida">Recebida</option>
        <option value="Cancelada">Cancelada</option>
      </select>
      <button class="btn btn-ghost btn-sm" onclick="clearComprasFilter()">✕ Limpar</button>
    </div>
    <div class="card" style="padding:0">
      <div class="table-wrap">
        <table>
          <tr><th>Compra</th><th>Obra</th><th>Fornecedor</th><th>Valor Total</th><th>Status</th><th>Data</th><th>Ações</th></tr>
          <tbody id="compras-table-body"><tr><td colspan="7" style="text-align:center;color:var(--gray400);padding:20px">Nenhuma solicitação cadastrada</td></tr></tbody>
        </table>
      </div>
    </div>`;
  content.appendChild(page);
}

