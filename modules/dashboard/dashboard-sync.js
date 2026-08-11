// ============================================================
// dashboard-sync.js
// ATUALIZACAO CENTRALIZADA DOS DASHBOARDS
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== ATUALIZAÇÃO CENTRALIZADA DOS DASHBOARDS =====
// Sempre que qualquer entidade for criada/editada/excluída (DB.add/update/delete
// chamam DB.set internamente), este listener único repinta o(s) dashboard(s)
// que estiverem visíveis, sem precisar espalhar chamadas em cada tela de CRUD.
document.addEventListener('db:change', () => {
  if (typeof currentPage === 'undefined' || currentPage !== 'dashboard') return;
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof dashExecVisible !== 'undefined' && dashExecVisible && typeof renderDashboardExecutivo === 'function') {
    renderDashboardExecutivo();
  }
});

