// ============================================================
// gc-09-filtro-tabela.js
// GESTÃO CONTRATUAL — Aplica os filtros avançados do Dashboard também
// na tabela principal de contratos (não só nos gráficos).
//
// Reimplementa filterContratos() incluindo TODA a lógica original de
// busca por texto/status (para continuar funcionando 100% igual) e
// acrescenta os filtros de obra/cliente/responsável/período do
// Dashboard por cima.
// ============================================================

'use strict';

window.filterContratos = function () {
  const search = document.getElementById('contratos-search').value.toLowerCase();
  const status = document.getElementById('contratos-filter-status').value;
  let contratos = DB.get('contratos');
  if (search) contratos = contratos.filter(c => c.numero.toLowerCase().includes(search) || c.fornecedor.toLowerCase().includes(search) || (c.objeto || '').toLowerCase().includes(search));
  if (status) contratos = contratos.filter(c => c.status === status);

  const f = gcDashFiltros;
  if (f.obraId) contratos = contratos.filter(c => String(c.obraId) === String(f.obraId));
  if (f.cliente) contratos = contratos.filter(c => (c.gcCliente || '').toLowerCase().includes(f.cliente.toLowerCase()));
  if (f.responsavel) contratos = contratos.filter(c => (c.gcResponsavel || '').toLowerCase().includes(f.responsavel.toLowerCase()));
  if (f.dataIni) contratos = contratos.filter(c => c.inicio && c.inicio >= f.dataIni);
  if (f.dataFim) contratos = contratos.filter(c => c.termino && c.termino <= f.dataFim);

  renderContratosTable(contratos);
};
