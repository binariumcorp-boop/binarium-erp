// ============================================================
// fornecedores.js
// FASE 2: FORNECEDORES
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== FASE 2: FORNECEDORES =====
function initFornecedores() {
  if (document.querySelector('[data-page="fornecedores"]')) return;
  const comprasItem = document.querySelector('[data-page="compras"]');
  if (!comprasItem) return;
  const fornItem = document.createElement('div');
  fornItem.className = 'nav-item';
  fornItem.dataset.page = 'fornecedores';
  fornItem.onclick = () => goTo('fornecedores');
  fornItem.innerHTML = `<svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4" stroke-width="2"/><path stroke-width="2" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg><span>Fornecedores</span>`;
  comprasItem.parentElement.insertBefore(fornItem, comprasItem.nextSibling);
  PAGE_TITLES['fornecedores'] = 'Fornecedores';
  if (!DB.KEYS.fornecedores) DB.KEYS.fornecedores = 'gob_fornecedores';
  const content = document.getElementById('content');
  const page = document.createElement('div');
  page.className = 'page';
  page.id = 'page-fornecedores';
  page.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div><h2 style="font-size:22px;font-weight:700">Fornecedores</h2><p style="font-size:13px;color:var(--gray400)">Cadastro de fornecedores e parceiros</p></div>
      <button class="btn btn-primary" onclick="openModal('novo-fornecedor')">+ Novo Fornecedor</button>
    </div>
    <div class="filters-row">
      <div class="search-box"><span>🔍</span><input type="text" id="forn-search" placeholder="Buscar fornecedor..." oninput="filterFornecedores()"></div>
      <select class="select-box" id="forn-filter-cat" onchange="filterFornecedores()"><option value="">Categoria: Todas</option><option>Material</option><option>Serviço</option><option>Equipamento</option><option>Outros</option></select>
      <select class="select-box" id="forn-filter-estado" onchange="filterFornecedores()"><option value="">Estado: Todos</option></select>
      <select class="select-box" id="forn-filter-status" onchange="filterFornecedores()"><option value="">Status: Todos</option><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option></select>
      <button class="btn btn-ghost btn-sm" onclick="clearFornFilter()">✕ Limpar</button>
    </div>
    <div class="card" style="padding:0">
      <div class="table-wrap">
        <table>
          <tr><th>Fornecedor</th><th>CNPJ</th><th>Categoria</th><th>Contato</th><th>Status</th><th>Ações</th></tr>
          <tbody id="forn-table-body"><tr><td colspan="6" style="text-align:center;color:var(--gray400);padding:20px">Nenhum fornecedor cadastrado</td></tr></tbody>
        </table>
      </div>
    </div>`;
  content.appendChild(page);
}

