// ============================================================
// router.js
// NAVIGATION
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== NAVIGATION =====
const PAGE_TITLES = {
  dashboard: 'Dashboard', obras: 'Obras', 'obra-detalhe': 'Detalhe da Obra', servicos: 'Serviços',
  equipe: 'Equipe', rh: 'RH', financeiro: 'Financeiro', estoque: 'Estoque',
  diario: 'Diário de Obra', cronograma: 'Cronograma', contratos: 'Contratos',
  documentos: 'Documentos', relatorios: 'Relatórios', configuracoes: 'Configurações'
};

let currentPage = 'dashboard';

function goTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');
  document.getElementById('topbar-title').textContent = PAGE_TITLES[page] || page;
  document.getElementById('content').scrollTop = 0;
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.dataset.page === page) n.classList.add('active');
  });
  currentPage = page;
  // Breadcrumb
  const bc = document.getElementById('topbar-breadcrumb');
  bc.innerHTML = page !== 'dashboard'
    ? `<a onclick="goTo('dashboard')">Dashboard</a><span>›</span><span>${PAGE_TITLES[page] || page}</span>`
    : '';
  // Render page
  renderPage(page);
  // Mobile: close sidebar
  closeMobileSidebar();
}

function renderPage(page) {
  switch(page) {
    case 'dashboard': renderDashboard(); break;
    case 'obras': renderObras(); break;
    case 'obra-detalhe': renderObraDetalhe(); break;
    case 'servicos': renderServicos(); break;
    case 'equipe': renderEquipe(); break;
    case 'financeiro': renderFinanceiro(); break;
    case 'estoque': renderEstoque(); break;
    case 'diario': renderDiario(); break;
    case 'cronograma': renderCronograma(); break;
    case 'contratos': renderContratos(); break;
    case 'documentos': renderDocumentos(); break;
    case 'relatorios': renderRelatorios(); break;
    case 'configuracoes': renderConfiguracoes(); break;
  }
}

