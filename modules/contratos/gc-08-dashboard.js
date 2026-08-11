// ============================================================
// gc-08-dashboard.js
// GESTÃO CONTRATUAL — Dashboard completo
//
// Envolve renderContratos() (chama a versão original primeiro, que
// continua atualizando os 5 cards + tabela exatamente como sempre) e
// ACRESCENTA, logo abaixo dos cards originais, os KPIs extras, os
// filtros avançados e os gráficos pedidos. Nenhum elemento original é
// removido ou reescrito — tudo é inserido via DOM.
//
// Gráficos: o projeto não usa nenhuma biblioteca de gráficos (Chart.js,
// D3, etc. não existem em nenhum outro módulo). Para seguir o padrão
// visual do sistema, os gráficos são barras horizontais construídas
// com os mesmos elementos .prog-bar/.prog-fill já usados em Serviços,
// Obras e Dashboard Executivo — não uma biblioteca nova.
// ============================================================

'use strict';

let gcDashFiltros = { obraId: '', cliente: '', responsavel: '', dataIni: '', dataFim: '' };

function gcEnsureDashboardContainer() {
  const page = document.getElementById('page-contratos');
  if (!page || document.getElementById('gc-dashboard')) return;
  const statsRow = page.querySelector('.stats-row');
  if (!statsRow) return;
  const container = document.createElement('div');
  container.id = 'gc-dashboard';
  statsRow.insertAdjacentElement('afterend', container);
}

function gcContratosFiltradosDashboard() {
  let contratos = DB.get('contratos');
  const f = gcDashFiltros;
  if (f.obraId) contratos = contratos.filter(c => String(c.obraId) === String(f.obraId));
  if (f.cliente) contratos = contratos.filter(c => (c.gcCliente || '').toLowerCase().includes(f.cliente.toLowerCase()));
  if (f.responsavel) contratos = contratos.filter(c => (c.gcResponsavel || '').toLowerCase().includes(f.responsavel.toLowerCase()));
  if (f.dataIni) contratos = contratos.filter(c => c.inicio && c.inicio >= f.dataIni);
  if (f.dataFim) contratos = contratos.filter(c => c.termino && c.termino <= f.dataFim);
  return contratos;
}

function gcBarraHorizontal(label, valor, max, cor) {
  const pct = max > 0 ? Math.round(valor / max * 100) : 0;
  return `
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px"><span>${label}</span><span style="font-weight:600">${valor}</span></div>
      <div class="prog-bar"><div class="prog-fill" style="width:${pct}%;background:${cor}"></div></div>
    </div>`;
}

// Mesma barra horizontal, mas com o valor formatado em R$ em vez de um
// número inteiro simples (usada no gráfico de evolução do valor).
function gcBarraHorizontalMoeda(label, valor, max, cor) {
  const pct = max > 0 ? Math.round(valor / max * 100) : 0;
  return `
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px"><span>${label}</span><span style="font-weight:600">${FormatService.currency(valor)}</span></div>
      <div class="prog-bar"><div class="prog-fill" style="width:${pct}%;background:${cor}"></div></div>
    </div>`;
}

function gcRenderDashboard() {
  gcEnsureDashboardContainer();
  const el = document.getElementById('gc-dashboard');
  if (!el) return;

  const todos = DB.get('contratos');
  const contratos = gcContratosFiltradosDashboard();
  const aditivos = DB.get('aditivos') || [];
  const aditivosDosContratos = aditivos.filter(a => contratos.some(c => c.id === a.contratoId));
  const medicoes = DB.get('medicoes') || [];
  const hoje = new Date();

  // ----- KPIs gerais -----
  const valorTotalContratado = contratos.reduce((s, c) => s + ((typeof c.gcValorOriginal === 'number') ? c.gcValorOriginal : (c.valor || 0)), 0);
  const valorTotalAtual = contratos.reduce((s, c) => s + (c.valor || 0), 0);
  const valorTotalAditivado = valorTotalAtual - valorTotalContratado;
  const valorExecutado = contratos.reduce((s, c) => s + (c.valorExecutado || 0), 0);
  const saldoContratual = valorTotalAtual - valorExecutado;
  const pctAditivos = valorTotalContratado > 0 ? (valorTotalAditivado / valorTotalContratado * 100) : 0;

  const contratosVencendo = contratos.filter(c => c.termino && (new Date(c.termino) - hoje) / 86400000 > 0 && (new Date(c.termino) - hoje) / 86400000 <= 30).length;
  const contratosVencidos = contratos.filter(c => c.status === 'Vencido' || (c.termino && new Date(c.termino) < hoje && c.status !== 'Encerrado')).length;
  const aditivosAguardando = aditivosDosContratos.filter(a => a.situacao === 'Aguardando Aprovação' || a.situacao === 'Em Análise').length;
  const medicoesPendentes = medicoes.filter(m => contratos.some(c => c.id === m.contratoId) && m.status === 'Pendente').length;
  // "Documentos pendentes" = contratos ativos sem nenhum documento anexado ainda
  const documentosPendentes = contratos.filter(c => c.status !== 'Encerrado' && gcObterDocumentosDoContrato(c.id).length === 0).length;

  const venc30 = contratos.filter(c => c.termino && (new Date(c.termino)-hoje)/86400000 > 0 && (new Date(c.termino)-hoje)/86400000 <= 30).length;
  const venc60 = contratos.filter(c => c.termino && (new Date(c.termino)-hoje)/86400000 > 30 && (new Date(c.termino)-hoje)/86400000 <= 60).length;
  const venc90 = contratos.filter(c => c.termino && (new Date(c.termino)-hoje)/86400000 > 60 && (new Date(c.termino)-hoje)/86400000 <= 90).length;

  // ----- Aditivos por tipo -----
  const porTipo = {};
  GC_TIPOS_ADITIVO.forEach(t => porTipo[t] = 0);
  aditivosDosContratos.forEach(a => { porTipo[a.tipo] = (porTipo[a.tipo] || 0) + 1; });
  const maxTipo = Math.max(1, ...Object.values(porTipo));

  // ----- Aditivos por obra -----
  const porObra = {};
  aditivosDosContratos.forEach(a => {
    const c = DB.find('contratos', a.contratoId);
    const nomeObra = c && c.obraNome ? c.obraNome : 'Sem obra';
    porObra[nomeObra] = (porObra[nomeObra] || 0) + 1;
  });
  const maxObra = Math.max(1, ...Object.values(porObra), 1);

  // ----- Contratos por status -----
  const porStatus = {};
  contratos.forEach(c => { porStatus[c.status] = (porStatus[c.status] || 0) + 1; });
  const maxStatus = Math.max(1, ...Object.values(porStatus), 1);

  // Filtro: obras (para o <select>)
  const obras = DB.get('obras');

  el.innerHTML = `
    <div class="card" style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div style="font-size:14px;font-weight:700">📊 Dashboard da Gestão Contratual</div>
      </div>

      <div class="filters-row" style="margin-bottom:16px">
        <select class="select-box" id="gc-filtro-obra" onchange="gcAtualizarFiltrosDashboard()"><option value="">Obra: Todas</option>${obras.map(o => `<option value="${o.id}">${o.nome}</option>`).join('')}</select>
        <input class="select-box" id="gc-filtro-cliente" placeholder="Filtrar por cliente..." oninput="gcAtualizarFiltrosDashboard()">
        <input class="select-box" id="gc-filtro-responsavel" placeholder="Filtrar por responsável..." oninput="gcAtualizarFiltrosDashboard()">
        <input class="select-box" id="gc-filtro-periodo-ini" type="date" title="Início do período" onchange="gcAtualizarFiltrosDashboard()">
        <input class="select-box" id="gc-filtro-periodo-fim" type="date" title="Fim do período" onchange="gcAtualizarFiltrosDashboard()">
        <button class="btn btn-ghost btn-sm" onclick="gcLimparFiltrosDashboard()">✕ Limpar</button>
      </div>

      <div style="display:grid;padding:12px;background:var(--gray50);border-radius:10px;margin-bottom:16px;grid-template-columns:repeat(3,1fr);gap:10px">
        <div>
          <div style="font-size:10px;color:var(--gray400);text-transform:uppercase;font-weight:700">Impacto Financeiro dos Aditivos</div>
          <div style="font-size:11px;color:var(--gray400);margin-top:6px">Valor contratado: <b style="color:inherit">${FormatService.currency(valorTotalContratado)}</b></div>
          <div style="font-size:11px;color:var(--gray400)">Valor dos aditivos: <b style="color:${valorTotalAditivado<0?'var(--red)':'var(--amber)'}">${valorTotalAditivado>=0?'+ ':''}${FormatService.currency(valorTotalAditivado)}</b></div>
        </div>
        <div style="display:flex;flex-direction:column;justify-content:center;align-items:center">
          <div style="font-size:26px;font-weight:800;color:var(--amber)">${pctAditivos.toFixed(1)}%</div>
          <div style="font-size:10px;color:var(--gray400)">percentual de aditivos</div>
        </div>
        <div style="display:flex;flex-direction:column;justify-content:center">
          <div style="font-size:11px;color:var(--gray400)">Executado: <b style="color:inherit">${FormatService.currency(valorExecutado)}</b></div>
          <div style="font-size:11px;color:var(--gray400)">Saldo contratual: <b style="color:inherit">${FormatService.currency(saldoContratual)}</b></div>
        </div>
      </div>

      <div class="stats-row" style="grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:20px">
        <div class="stat-card" style="cursor:pointer" onclick="gcDrillDownAditivosSituacao('Aguardando Aprovação')"><div class="stat-icon" style="background:#fef3c7">⏳</div><div><div class="stat-label">Aditivos p/ Aprovar</div><div class="stat-value">${aditivosAguardando}</div></div></div>
        <div class="stat-card" style="cursor:pointer" onclick="gcDrillDownMedicoesPendentes()"><div class="stat-icon" style="background:#fef3c7">📏</div><div><div class="stat-label">Medições Pendentes</div><div class="stat-value">${medicoesPendentes}</div></div></div>
        <div class="stat-card" style="cursor:pointer" onclick="gcDrillDownDocumentosPendentes()"><div class="stat-icon" style="background:#fee2e2">📁</div><div><div class="stat-label">Contratos sem Doc.</div><div class="stat-value">${documentosPendentes}</div></div></div>
        <div class="stat-card" style="cursor:pointer" onclick="gcDrillDownVencimento(30)"><div class="stat-icon" style="background:#fef3c7">🗓️</div><div><div class="stat-label">Vencem em 30d</div><div class="stat-value">${venc30}</div></div></div>
        <div class="stat-card" style="cursor:pointer" onclick="gcDrillDownVencimento(60)"><div class="stat-icon" style="background:#fef3c7">🗓️</div><div><div class="stat-label">Vencem em 60d</div><div class="stat-value">${venc60}</div></div></div>
        <div class="stat-card" style="cursor:pointer" onclick="gcDrillDownVencimento(90)"><div class="stat-icon" style="background:#fef3c7">🗓️</div><div><div class="stat-label">Vencem em 90d</div><div class="stat-value">${venc90}</div></div></div>
      </div>

      <div style="margin-bottom:20px">
        <div style="font-size:12px;font-weight:700;margin-bottom:8px">Evolução: Valor Contratado × Valor Atualizado</div>
        ${gcBarraHorizontalMoeda('Valor Contratado (original)', valorTotalContratado, Math.max(1, valorTotalContratado, valorTotalAtual), 'var(--gray400)')}
        ${gcBarraHorizontalMoeda('Valor Atualizado (com aditivos)', valorTotalAtual, Math.max(1, valorTotalContratado, valorTotalAtual), 'var(--blue)')}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div>
          <div style="font-size:12px;font-weight:700;margin-bottom:8px">Aditivos por Tipo</div>
          ${Object.entries(porTipo).filter(([,v]) => v > 0).map(([tipo, qtd]) => `<div style="cursor:pointer" onclick="gcDrillDownAditivosTipo('${tipo}')">${gcBarraHorizontal(tipo, qtd, maxTipo, 'var(--blue)')}</div>`).join('') || `<div style="font-size:11px;color:var(--gray400)">Nenhum aditivo registrado.</div>`}
        </div>
        <div>
          <div style="font-size:12px;font-weight:700;margin-bottom:8px">Contratos por Status</div>
          ${Object.entries(porStatus).map(([status, qtd]) => `<div style="cursor:pointer" onclick="gcDrillDownStatus('${status}')">${gcBarraHorizontal(status, qtd, maxStatus, 'var(--green)')}</div>`).join('') || `<div style="font-size:11px;color:var(--gray400)">Nenhum contrato.</div>`}
        </div>
      </div>
      <div style="margin-top:16px">
        <div style="font-size:12px;font-weight:700;margin-bottom:8px">Aditivos por Obra</div>
        ${Object.entries(porObra).map(([obra, qtd]) => `<div style="cursor:pointer" onclick="gcDrillDownAditivosObra('${obra.replace(/'/g,"\\'")}')">${gcBarraHorizontal(obra, qtd, maxObra, 'var(--amber)')}</div>`).join('') || `<div style="font-size:11px;color:var(--gray400)">Nenhum aditivo registrado.</div>`}
      </div>
    </div>`;
}

function gcAtualizarFiltrosDashboard() {
  gcDashFiltros = {
    obraId: document.getElementById('gc-filtro-obra').value,
    cliente: document.getElementById('gc-filtro-cliente').value,
    responsavel: document.getElementById('gc-filtro-responsavel').value,
    dataIni: document.getElementById('gc-filtro-periodo-ini').value,
    dataFim: document.getElementById('gc-filtro-periodo-fim').value
  };
  gcRenderDashboard();
  filterContratos(); // reaplica também na tabela principal (ver gc-09)
}

function gcLimparFiltrosDashboard() {
  gcDashFiltros = { obraId: '', cliente: '', responsavel: '', dataIni: '', dataFim: '' };
  gcRenderDashboard();
  document.getElementById('contratos-search').value = '';
  document.getElementById('contratos-filter-status').value = '';
  filterContratos();
}

// ----- Drill-down: clicar num indicador/gráfico abre a lista já filtrada -----
function gcScrollParaTabela() {
  const tbl = document.getElementById('contratos-table-body');
  if (tbl) tbl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function gcDrillDownStatus(status) {
  document.getElementById('contratos-filter-status').value = status;
  filterContratos();
  gcScrollParaTabela();
}
function gcDrillDownVencimento(dias) {
  const hoje = new Date();
  const lista = gcContratosFiltradosDashboard().filter(c => c.termino && (new Date(c.termino) - hoje) / 86400000 > 0 && (new Date(c.termino) - hoje) / 86400000 <= dias);
  renderContratosTable(lista);
  gcScrollParaTabela();
}
function gcDrillDownAditivosTipo(tipo) {
  const ids = new Set((DB.get('aditivos') || []).filter(a => a.tipo === tipo).map(a => a.contratoId));
  renderContratosTable(gcContratosFiltradosDashboard().filter(c => ids.has(c.id)));
  gcScrollParaTabela();
}
function gcDrillDownAditivosObra(nomeObra) {
  renderContratosTable(gcContratosFiltradosDashboard().filter(c => c.obraNome === nomeObra));
  gcScrollParaTabela();
}
function gcDrillDownAditivosSituacao(situacao) {
  const ids = new Set((DB.get('aditivos') || []).filter(a => a.situacao === situacao).map(a => a.contratoId));
  renderContratosTable(gcContratosFiltradosDashboard().filter(c => ids.has(c.id)));
  gcScrollParaTabela();
}
function gcDrillDownMedicoesPendentes() {
  const ids = new Set((DB.get('medicoes') || []).filter(m => m.status === 'Pendente').map(m => m.contratoId));
  renderContratosTable(gcContratosFiltradosDashboard().filter(c => ids.has(c.id)));
  gcScrollParaTabela();
}
function gcDrillDownDocumentosPendentes() {
  renderContratosTable(gcContratosFiltradosDashboard().filter(c => gcObterDocumentosDoContrato(c.id).length === 0));
  gcScrollParaTabela();
}

// ----- Envolve renderContratos original: mantém 100% do que já existia
// e acrescenta o dashboard por cima. -----
const gcRenderContratosAnterior = renderContratos;
window.renderContratos = function () {
  gcRenderContratosAnterior();
  gcRenderDashboard();
};
