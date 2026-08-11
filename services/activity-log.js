// ============================================================
// activity-log.js
// FASE 2: LOG DE ATIVIDADES
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== FASE 2: LOG DE ATIVIDADES =====
const ActivityLog = {
  KEY: 'gob_activity_log',
  add(acao, modulo, registro, valorAnterior = null, valorNovo = null) {
    const session = AuthService.getSession();
    const log = StorageService.get(this.KEY, []);
    log.unshift({
      id: Date.now(),
      usuario: session ? session.nome : 'Sistema',
      data: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().split(' ')[0],
      acao, modulo, registro,
      valorAnterior: valorAnterior ? JSON.stringify(valorAnterior).substring(0, 200) : null,
      valorNovo: valorNovo ? JSON.stringify(valorNovo).substring(0, 200) : null
    });
    if (log.length > 500) log.splice(500);
    StorageService.set(this.KEY, log);
  },
  get() { return StorageService.get(this.KEY, []); }
};

function initLogAtividades() {
  if (document.querySelector('[data-page="log"]')) return;
  const cfgItem = document.querySelector('[data-page="configuracoes"]');
  if (!cfgItem) return;
  const logItem = document.createElement('div');
  logItem.className = 'nav-item';
  logItem.dataset.page = 'log';
  logItem.onclick = () => goTo('log');
  logItem.innerHTML = `<svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1" stroke-width="2"/></svg><span>Log de Atividades</span>`;
  cfgItem.parentElement.insertBefore(logItem, cfgItem);
  PAGE_TITLES['log'] = 'Log de Atividades';
  const content = document.getElementById('content');
  const page = document.createElement('div');
  page.className = 'page';
  page.id = 'page-log';
  page.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div><h2 style="font-size:22px;font-weight:700">Log de Atividades</h2><p style="font-size:13px;color:var(--gray400)">Histórico de ações realizadas no sistema</p></div>
      <button class="btn btn-ghost btn-sm" onclick="exportarLog()">📥 Exportar</button>
    </div>
    <div class="filters-row">
      <div class="search-box"><span>🔍</span><input type="text" id="log-search" placeholder="Buscar no log..." oninput="filterLog()"></div>
      <select class="select-box" id="log-filter-modulo" onchange="filterLog()"><option value="">Módulo: Todos</option><option>Obras</option><option>Serviços</option><option>Equipe</option><option>Financeiro</option><option>Estoque</option><option>Contratos</option><option>Documentos</option></select>
      <button class="btn btn-ghost btn-sm" onclick="limparLog()">🗑️ Limpar Log</button>
    </div>
    <div class="card" style="padding:0">
      <div class="table-wrap">
        <table>
          <tr><th>Data/Hora</th><th>Usuário</th><th>Ação</th><th>Módulo</th><th>Registro</th></tr>
          <tbody id="log-table-body"><tr><td colspan="5" style="text-align:center;color:var(--gray400);padding:20px">Nenhuma atividade registrada</td></tr></tbody>
        </table>
      </div>
    </div>`;
  content.appendChild(page);
}

function renderLog() {
  filterLog();
}

function filterLog() {
  const search = (document.getElementById('log-search')?.value || '').toLowerCase();
  const modulo = document.getElementById('log-filter-modulo')?.value || '';
  let log = ActivityLog.get();
  if (search) log = log.filter(l => l.acao.toLowerCase().includes(search) || l.registro.toLowerCase().includes(search) || l.usuario.toLowerCase().includes(search));
  if (modulo) log = log.filter(l => l.modulo === modulo);
  const tbody = document.getElementById('log-table-body');
  if (!tbody) return;
  if (log.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray400);padding:20px">Nenhuma atividade encontrada</td></tr>'; return; }
  tbody.innerHTML = log.slice(0, 100).map(l => `<tr><td style="font-size:12px">${FormatService.date(l.data)} ${l.hora}</td><td style="font-size:12px">${l.usuario}</td><td><span class="badge ${l.acao.includes('Excluiu')?'badge-red':l.acao.includes('Criou')?'badge-green':'badge-blue'}">${l.acao}</span></td><td style="font-size:12px">${l.modulo}</td><td style="font-size:12px">${l.registro}</td></tr>`).join('');
}

function exportarLog() {
  const log = ActivityLog.get();
  const csv = 'Data,Hora,Usuário,Ação,Módulo,Registro\n' + log.map(l => `"${FormatService.date(l.data)}","${l.hora}","${l.usuario}","${l.acao}","${l.modulo}","${l.registro}"`).join('\n');
  downloadFile('log_atividades_mbsolucoes.csv', csv, 'text/csv');
}

function limparLog() {
  confirmAction('Limpar log?', 'Todo o histórico de atividades será removido.', () => {
    StorageService.set(ActivityLog.KEY, []);
    renderLog();
    showToast('Log limpo.', 'success');
  }, '🗑️');
}

