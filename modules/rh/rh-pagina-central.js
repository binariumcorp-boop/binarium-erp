// ============================================================
// rh-pagina-central.js
// FASE 4: MODULO RH (pagina central)
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

// =====================================================================
// FASE 4: MÓDULO RH (página central) — visão geral, colaboradores,
// admissão/contratação, documentos e salários, reunindo tudo que já
// existe no Painel RH por colaborador (checklist de admissão, upload de
// documentos, ASO, treinamentos/NRs, férias e ponto) em uma única aba
// no menu lateral.
// =====================================================================
let rhPageTab = 'visao';

function renderRHPage() {
  const equipe = DB.get('equipe');
  const ativos = equipe.filter(e => e.status === 'Ativo');
  const admissaoRegs = DB.get('rhAdmissao') || [];
  const totalEtapas = RH_ADMISSAO_ETAPAS.length;
  const emAndamento = equipe.filter(e => {
    const concluidas = admissaoRegs.filter(r => r.colabId === e.id && r.concluida).length;
    return concluidas > 0 && concluidas < totalEtapas;
  }).length;
  const docsPendentes = (DB.get('rhDocumentos') || []).filter(d => d.status === 'Pendente').length;
  const hoje = new Date();
  const em30 = new Date(); em30.setDate(hoje.getDate() + 30);
  const asoAlerta = (DB.get('rhAso') || []).filter(a => a.validade && new Date(a.validade) <= em30).length;
  const folha = ativos.reduce((s, e) => s + (e.salario || 0), 0);

  const elAtivos = document.getElementById('rh-stat-ativos');
  if (!elAtivos) return; // página ainda não está no DOM
  elAtivos.textContent = ativos.length;
  document.getElementById('rh-stat-admissoes').textContent = emAndamento;
  document.getElementById('rh-stat-docs').textContent = docsPendentes;
  document.getElementById('rh-stat-aso').textContent = asoAlerta;
  document.getElementById('rh-stat-folha').textContent = FormatService.currency(folha);

  switchRHPageTab(rhPageTab);
}

function switchRHPageTab(tab, el) {
  rhPageTab = tab;
  const tabsWrap = document.getElementById('rh-page-tabs');
  if (!tabsWrap) return;
  tabsWrap.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (el) {
    el.classList.add('active');
  } else {
    const idx = ['visao', 'colaboradores', 'admissao', 'documentos', 'salarios'].indexOf(tab);
    const t = tabsWrap.querySelectorAll('.tab')[idx];
    if (t) t.classList.add('active');
  }
  const body = document.getElementById('rh-page-body');
  if (!body) return;
  if (tab === 'visao') renderRHVisaoGeral(body);
  else if (tab === 'colaboradores') renderRHColaboradores(body);
  else if (tab === 'admissao') renderRHAdmissaoLista(body);
  else if (tab === 'documentos') renderRHDocumentosGlobal(body);
  else if (tab === 'salarios') renderRHSalarios(body);
}

// --- Aba: Visão Geral ---
function renderRHVisaoGeral(body) {
  const equipe = DB.get('equipe');
  const admissaoRegs = DB.get('rhAdmissao') || [];
  const totalEtapas = RH_ADMISSAO_ETAPAS.length;
  const emAndamento = equipe.map(e => {
    const concluidas = admissaoRegs.filter(r => r.colabId === e.id && r.concluida).length;
    return { e, concluidas, pct: Math.round((concluidas / totalEtapas) * 100) };
  }).filter(x => x.concluidas > 0 && x.concluidas < totalEtapas).sort((a, b) => b.pct - a.pct);

  const docs = (DB.get('rhDocumentos') || []).filter(d => d.status === 'Pendente')
    .sort((a, b) => new Date(b.uploadAt) - new Date(a.uploadAt));

  const hoje = new Date();
  const em30 = new Date(); em30.setDate(hoje.getDate() + 30);
  const asos = (DB.get('rhAso') || [])
    .map(a => ({ ...a, colab: DB.find('equipe', a.colabId) }))
    .filter(a => a.colab && a.validade && new Date(a.validade) <= em30)
    .sort((a, b) => new Date(a.validade) - new Date(b.validade));

  body.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px" class="rh-visao-grid">
      <div>
        <div class="section-title mb-16">📋 Admissões em Andamento</div>
        ${emAndamento.length ? emAndamento.map(x => `
          <div style="padding:10px;border:1px solid var(--gray200);border-radius:8px;margin-bottom:8px;cursor:pointer" onclick="abrirPainelRH(${x.e.id})">
            <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:600"><span>${x.e.nome}</span><span>${x.pct}%</span></div>
            <div class="prog-bar" style="margin-top:6px"><div class="prog-fill ${x.pct === 100 ? 'prog-green' : 'prog-blue'}" style="width:${x.pct}%"></div></div>
            <div style="font-size:11px;color:var(--gray400);margin-top:4px">${x.e.funcao} · ${x.concluidas}/${totalEtapas} etapas concluídas</div>
          </div>`).join('') : emptyState('Nenhuma admissão em andamento no momento.')}

        <div class="section-title mb-16" style="margin-top:22px">🩺 ASOs a vencer (30 dias) ou vencidos</div>
        ${asos.length ? `<div class="table-wrap"><table><tr><th>Colaborador</th><th>Validade</th></tr>
          ${asos.map(a => `<tr style="cursor:pointer" onclick="abrirPainelRH(${a.colabId})"><td>${a.colab.nome}</td><td style="color:${new Date(a.validade) < hoje ? 'var(--red)' : 'var(--amber)'}">${FormatService.date(a.validade)}${new Date(a.validade) < hoje ? ' (vencido)' : ''}</td></tr>`).join('')}
          </table></div>` : emptyState('Nenhum ASO vencendo nos próximos 30 dias.')}
      </div>
      <div>
        <div class="section-title mb-16">📄 Documentos Pendentes de Aprovação</div>
        ${docs.length ? docs.map(d => {
          const colab = DB.find('equipe', d.colabId);
          return `<div style="padding:10px;border:1px solid var(--gray200);border-radius:8px;margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
              <div>
                <div style="font-size:13px;font-weight:600">${d.nome}</div>
                <div style="font-size:11px;color:var(--gray400)">${colab ? colab.nome : '—'} · ${d.categoria}</div>
              </div>
              <div style="display:flex;gap:4px;flex-shrink:0">
                <button class="btn btn-ghost btn-sm" onclick="downloadRHDoc(${d.id})" title="Baixar">⬇️</button>
                <button class="btn btn-ghost btn-sm" onclick="rhGlobalSetDocStatus(${d.id},'Aprovado')" title="Aprovar">✅</button>
                <button class="btn btn-ghost btn-sm" onclick="rhGlobalSetDocStatus(${d.id},'Rejeitado')" title="Rejeitar">❌</button>
              </div>
            </div>
          </div>`;
        }).join('') : emptyState('Nenhum documento pendente de aprovação.')}
      </div>
    </div>`;
}

// --- Aba: Colaboradores ---
function renderRHColaboradores(body) {
  const equipe = DB.get('equipe').slice().sort((a, b) => a.nome.localeCompare(b.nome));
  body.innerHTML = `
    <div class="filters-row" style="margin-bottom:12px">
      <div class="search-box"><span>🔍</span><input type="text" id="rh-colab-search" oninput="filterRHColaboradores()" placeholder="Buscar colaborador..."></div>
    </div>
    <div class="table-wrap"><table>
      <tr><th>Nome</th><th>Função</th><th>Obra</th><th>Status</th><th>Admissão</th><th>Salário</th><th>Ações</th></tr>
      <tbody id="rh-colab-tbody"></tbody>
    </table></div>`;
  renderRHColabTbody(equipe);
}

function renderRHColabTbody(list) {
  const tbody = document.getElementById('rh-colab-tbody');
  if (!tbody) return;
  tbody.innerHTML = list.length ? list.map(e => `
    <tr>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="av">${FormatService.initials(e.nome)}</div><span style="font-weight:600;font-size:13px">${e.nome}</span></div></td>
      <td>${e.funcao}</td>
      <td style="font-size:12px">${e.obraNome || '-'}</td>
      <td><span class="badge ${e.status === 'Ativo' ? 'badge-green' : 'badge-red'}">${e.status}</span></td>
      <td style="font-size:12px">${FormatService.date(e.admissao)}</td>
      <td style="font-size:12px;font-weight:600">${FormatService.currency(e.salario || 0)}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="abrirPainelRH(${e.id})">👁️ Abrir RH</button></td>
    </tr>`).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--gray400);padding:20px">Nenhum colaborador encontrado</td></tr>';
}

function filterRHColaboradores() {
  const searchEl = document.getElementById('rh-colab-search');
  const q = searchEl ? normalizarTextoBusca(searchEl.value) : '';
  const equipe = DB.get('equipe').filter(e => !q ||
    normalizarTextoBusca(e.nome).includes(q) ||
    normalizarTextoBusca(e.funcao).includes(q) ||
    normalizarTextoBusca(e.obraNome).includes(q)
  ).sort((a, b) => a.nome.localeCompare(b.nome));
  renderRHColabTbody(equipe);
}

// --- Aba: Admissão / Contratação ---
function renderRHAdmissaoLista(body) {
  const equipe = DB.get('equipe');
  const admissaoRegs = DB.get('rhAdmissao') || [];
  const totalEtapas = RH_ADMISSAO_ETAPAS.length;
  const rows = equipe.map(e => {
    const concluidas = admissaoRegs.filter(r => r.colabId === e.id && r.concluida).length;
    return { e, concluidas, pct: Math.round((concluidas / totalEtapas) * 100) };
  }).sort((a, b) => a.pct - b.pct);

  body.innerHTML = `
    <div class="card mb-16" style="background:var(--gray50)">
      <div class="section-title mb-10">Checklist padrão de contratação</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${RH_ADMISSAO_ETAPAS.map(et => `<span class="badge badge-gray" title="${et.desc}">${et.nome}</span>`).join('')}
      </div>
    </div>
    <div class="table-wrap"><table>
      <tr><th>Colaborador</th><th>Função</th><th>Obra</th><th>Progresso</th><th>Status</th><th>Ações</th></tr>
      ${rows.length ? rows.map(r => `<tr>
        <td>${r.e.nome}</td>
        <td>${r.e.funcao}</td>
        <td style="font-size:12px">${r.e.obraNome || '-'}</td>
        <td style="min-width:170px"><div style="display:flex;align-items:center;gap:8px"><div class="prog-bar" style="width:100px"><div class="prog-fill ${r.pct === 100 ? 'prog-green' : 'prog-blue'}" style="width:${r.pct}%"></div></div><span style="font-size:12px">${r.concluidas}/${totalEtapas}</span></div></td>
        <td><span class="badge ${r.pct === 100 ? 'badge-green' : r.concluidas > 0 ? 'badge-amber' : 'badge-gray'}">${r.pct === 100 ? 'Concluída' : r.concluidas > 0 ? 'Em andamento' : 'Não iniciada'}</span></td>
        <td><button class="btn btn-ghost btn-sm" onclick="abrirPainelRH(${r.e.id})">Ver checklist</button></td>
      </tr>`).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--gray400);padding:20px">Nenhum colaborador cadastrado ainda.</td></tr>'}
    </table></div>`;
}

// --- Aba: Documentos (repositório global, já com as categorias pré-definidas) ---
function renderRHDocumentosGlobal(body) {
  const equipe = DB.get('equipe').slice().sort((a, b) => a.nome.localeCompare(b.nome));
  const docs = (DB.get('rhDocumentos') || []).slice().sort((a, b) => new Date(b.uploadAt) - new Date(a.uploadAt));

  body.innerHTML = `
    <div class="card mb-16" style="background:var(--gray50)">
      <div class="section-title mb-10">📤 Enviar novo documento</div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Colaborador *</label>
          <select class="form-input" id="rh-global-colab-select">
            <option value="">Selecione o colaborador...</option>
            ${equipe.map(e => `<option value="${e.id}">${e.nome} — ${e.funcao}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="upload-area" onclick="rhGlobalUploadClick()" ondragover="event.preventDefault();this.classList.add('drag')" ondragleave="this.classList.remove('drag')" ondrop="rhGlobalHandleDrop(event)">
        <div style="font-size:24px">📤</div>
        <p>Arraste e solte o arquivo aqui ou <strong style="color:var(--blue)">clique para selecionar</strong></p>
        <p style="font-size:11px">PDF, DOC, DOCX, JPG, PNG – Máx. 10MB por arquivo</p>
      </div>
      <input type="file" id="rh-global-doc-input" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif" style="display:none" onchange="rhGlobalHandleFile(event)">
      <div style="margin-top:10px;font-size:11px;color:var(--gray400)">Categorias de documento disponíveis: ${RH_DOC_CATEGORIAS.join(' · ')}</div>
    </div>

    <div class="filters-row">
      <div class="search-box"><span>🔍</span><input type="text" id="rh-doc-global-search" oninput="filterRHDocumentosGlobal()" placeholder="Buscar documento ou colaborador..."></div>
      <select class="select-box" id="rh-doc-global-filter-cat" onchange="filterRHDocumentosGlobal()">
        <option value="">Categoria: Todas</option>
        ${RH_DOC_CATEGORIAS.map(c => `<option>${c}</option>`).join('')}
      </select>
      <select class="select-box" id="rh-doc-global-filter-status" onchange="filterRHDocumentosGlobal()">
        <option value="">Status: Todos</option>
        <option>Pendente</option><option>Aprovado</option><option>Rejeitado</option>
      </select>
      <button class="btn btn-ghost btn-sm" onclick="clearRHDocGlobalFilter()">✕ Limpar</button>
    </div>

    <div class="table-wrap"><table>
      <tr><th>Documento</th><th>Colaborador</th><th>Categoria</th><th>Validade</th><th>Status</th><th>Ações</th></tr>
      <tbody id="rh-doc-global-tbody"></tbody>
    </table></div>`;
  renderRHDocGlobalTbody(docs);
}

function renderRHDocGlobalTbody(docs) {
  const tbody = document.getElementById('rh-doc-global-tbody');
  if (!tbody) return;
  const hoje = new Date();
  tbody.innerHTML = docs.length ? docs.map(d => {
    const colab = DB.find('equipe', d.colabId);
    const venc = d.validade && new Date(d.validade) < hoje;
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:8px"><span style="font-size:16px">${typeof docIcon === 'function' ? docIcon(d.tipo || 'pdf') : '📄'}</span><span style="font-size:12px;font-weight:600">${d.nome}</span></div></td>
      <td style="font-size:12px">${colab ? colab.nome : '—'}</td>
      <td><span class="badge badge-gray">${d.categoria}</span></td>
      <td style="font-size:12px;color:${venc ? 'var(--red)' : 'inherit'}">${d.validade ? FormatService.date(d.validade) + (venc ? ' (vencido)' : '') : '-'}</td>
      <td><span class="badge ${d.status === 'Aprovado' ? 'badge-green' : d.status === 'Rejeitado' ? 'badge-red' : 'badge-amber'}">${d.status}</span></td>
      <td style="white-space:nowrap">
        <button class="btn btn-ghost btn-sm" onclick="downloadRHDoc(${d.id})" title="Baixar">⬇️</button>
        <button class="btn btn-ghost btn-sm" onclick="rhGlobalSetDocStatus(${d.id},'Aprovado')" title="Aprovar">✅</button>
        <button class="btn btn-ghost btn-sm" onclick="rhGlobalSetDocStatus(${d.id},'Rejeitado')" title="Rejeitar">❌</button>
      </td>
    </tr>`;
  }).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--gray400);padding:20px">Nenhum documento enviado ainda.</td></tr>';
}

function filterRHDocumentosGlobal() {
  const searchEl = document.getElementById('rh-doc-global-search');
  const q = searchEl ? normalizarTextoBusca(searchEl.value) : '';
  const cat = document.getElementById('rh-doc-global-filter-cat').value;
  const status = document.getElementById('rh-doc-global-filter-status').value;
  let docs = (DB.get('rhDocumentos') || []).slice().sort((a, b) => new Date(b.uploadAt) - new Date(a.uploadAt));
  if (q) docs = docs.filter(d => {
    const colab = DB.find('equipe', d.colabId);
    return normalizarTextoBusca(d.nome).includes(q) || (colab && normalizarTextoBusca(colab.nome).includes(q));
  });
  if (cat) docs = docs.filter(d => d.categoria === cat);
  if (status) docs = docs.filter(d => d.status === status);
  renderRHDocGlobalTbody(docs);
}

function clearRHDocGlobalFilter() {
  const s = document.getElementById('rh-doc-global-search'); if (s) s.value = '';
  const c = document.getElementById('rh-doc-global-filter-cat'); if (c) c.value = '';
  const st = document.getElementById('rh-doc-global-filter-status'); if (st) st.value = '';
  filterRHDocumentosGlobal();
}

function rhGlobalSetDocStatus(id, status) {
  DB.update('rhDocumentos', id, { status });
  showToast(`Documento marcado como "${status}".`, 'success');
  if (rhPageTab === 'documentos') filterRHDocumentosGlobal();
  renderRHPage();
}

function rhGlobalUploadClick() {
  const sel = document.getElementById('rh-global-colab-select');
  if (!sel || !sel.value) { showToast('Selecione um colaborador antes de enviar o documento.', 'warning'); return; }
  document.getElementById('rh-global-doc-input').click();
}

function rhGlobalHandleDrop(ev) {
  ev.preventDefault();
  const sel = document.getElementById('rh-global-colab-select');
  if (!sel || !sel.value) { showToast('Selecione um colaborador antes de enviar o documento.', 'warning'); return; }
  const file = ev.dataTransfer.files[0];
  if (file) processRHDocFile(file, parseInt(sel.value));
}

function rhGlobalHandleFile(ev) {
  const sel = document.getElementById('rh-global-colab-select');
  const file = ev.target.files[0];
  ev.target.value = '';
  if (!sel || !sel.value || !file) return;
  processRHDocFile(file, parseInt(sel.value));
}

// --- Aba: Salários ---
function renderRHSalarios(body) {
  const equipe = DB.get('equipe');
  const ativos = equipe.filter(e => e.status === 'Ativo');
  const total = ativos.reduce((s, e) => s + (e.salario || 0), 0);
  const porObra = {};
  ativos.forEach(e => {
    const k = e.obraNome || 'Sem obra definida';
    porObra[k] = (porObra[k] || 0) + (e.salario || 0);
  });

  body.innerHTML = `
    <div class="card mb-16" style="padding:12px 16px">
      <span style="color:var(--gray400);font-size:12px">Folha salarial mensal (colaboradores ativos):</span>
      <strong style="font-size:16px;margin-left:6px">${FormatService.currency(total)}</strong>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px" class="rh-salarios-grid">
      <div>
        <div class="section-title mb-10">Por Colaborador</div>
        <div class="table-wrap"><table>
          <tr><th>Nome</th><th>Função</th><th>Obra</th><th>Salário</th></tr>
          ${ativos.length ? ativos.slice().sort((a, b) => (b.salario || 0) - (a.salario || 0)).map(e => `<tr><td>${e.nome}</td><td>${e.funcao}</td><td style="font-size:12px">${e.obraNome || '-'}</td><td style="font-weight:600">${FormatService.currency(e.salario || 0)}</td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--gray400);padding:16px">Nenhum colaborador ativo.</td></tr>'}
        </table></div>
      </div>
      <div>
        <div class="section-title mb-10">Por Obra</div>
        <div class="table-wrap"><table>
          <tr><th>Obra</th><th>Total (mês)</th></tr>
          ${Object.keys(porObra).length ? Object.entries(porObra).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<tr><td>${k}</td><td style="font-weight:600">${FormatService.currency(v)}</td></tr>`).join('') : '<tr><td colspan="2" style="text-align:center;color:var(--gray400);padding:16px">Sem dados.</td></tr>'}
        </table></div>
      </div>
    </div>`;
}

// --- Roteamento: garante que a aba RH seja recalculada ao navegar até ela ---
const origRenderPageF4 = window.renderPage;
window.renderPage = function(page) {
  origRenderPageF4(page);
  if (page === 'rh') renderRHPage();
};

// --- Permissões: inclui o novo módulo RH no controle de acesso por perfil ---
if (typeof PERM_MODULES !== 'undefined' && !PERM_MODULES.some(m => m[0] === 'rh')) {
  const idxEquipe = PERM_MODULES.findIndex(m => m[0] === 'equipe');
  PERM_MODULES.splice(idxEquipe >= 0 ? idxEquipe + 1 : PERM_MODULES.length, 0, ['rh', 'RH']);
}
const origDefaultPermForRH = defaultPermFor;
window.defaultPermFor = defaultPermFor = function(perfil) {
  const map = origDefaultPermForRH(perfil);
  if (perfil === 'Administrador') return map;
  if (perfil === 'RH') {
    const full = { ver: true, criar: true, editar: true, excluir: true };
    map['rh'] = { ...full };
    map['equipe'] = { ...full };
  }
  return map;
};

