// ============================================================
// obras.js
// OBRAS + DETALHE DA OBRA
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== OBRAS =====
let obrasFilter = { search: '', status: '', municipio: '' };

function renderObras() {
  const obras = DB.get('obras');
  // Stats
  document.getElementById('stat-obras-total').textContent = obras.length;
  document.getElementById('stat-obras-concluidas').textContent = obras.filter(o => o.status === 'Concluída').length;
  document.getElementById('stat-obras-andamento').textContent = obras.filter(o => ['Em Andamento','Concluindo'].includes(o.status)).length;
  document.getElementById('stat-obras-paradas').textContent = obras.filter(o => ['Paralisada','Atrasada'].includes(o.status)).length;

  // Populate municipio filter
  const municipios = [...new Set(obras.map(o => o.municipio))];
  const mFilter = document.getElementById('obras-filter-municipio');
  const curMun = mFilter.value;
  mFilter.innerHTML = '<option value="">Município: Todos</option>' + municipios.map(m => `<option value="${m}" ${m === curMun ? 'selected' : ''}>${m}</option>`).join('');

  filterObras();
}

function filterObras() {
  const search = document.getElementById('obras-search').value.toLowerCase();
  const status = document.getElementById('obras-filter-status').value;
  const municipio = document.getElementById('obras-filter-municipio').value;
  let obras = DB.get('obras');
  if (search) obras = obras.filter(o => o.nome.toLowerCase().includes(search) || o.municipio.toLowerCase().includes(search) || o.codigo.toLowerCase().includes(search));
  if (status) obras = obras.filter(o => o.status === status);
  if (municipio) obras = obras.filter(o => o.municipio === municipio);
  renderObrasTable(obras);
}

function clearObrasFilter() {
  document.getElementById('obras-search').value = '';
  document.getElementById('obras-filter-status').value = '';
  document.getElementById('obras-filter-municipio').value = '';
  filterObras();
}

function renderObrasTable(obras) {
  const tbody = document.getElementById('obras-table-body');
  if (obras.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--gray400);padding:20px">Nenhuma obra encontrada</td></tr>';
    return;
  }
  tbody.innerHTML = obras.map(o => `
    <tr style="cursor:pointer" onclick="abrirObra(${o.id})">
      <td><div style="font-weight:600">${o.nome}</div><div style="font-size:11px;color:var(--gray400)">${o.municipio}</div></td>
      <td style="font-size:12px;color:var(--gray400)">${o.codigo}</td>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="av">${FormatService.initials(o.responsavel)}</div><span style="font-size:12px">${o.responsavel}</span></div></td>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="prog-bar" style="width:70px"><div class="prog-fill ${statusColor(o.status)}" style="width:${o.progresso}%"></div></div><span style="font-size:12px">${o.progresso}%</span></div></td>
      <td><span class="badge ${badgeClass(o.status)}">${o.status}</span></td>
      <td style="font-weight:600;font-size:12px">${FormatService.currency(o.valor)}</td>
      <td style="font-size:12px;color:${o.status==='Atrasada'?'var(--red)':'inherit'}">${FormatService.date(o.termino)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();abrirObra(${o.id})" title="Ver Detalhes">👁️</button>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();verServicosDaObra(${o.id})" title="Ver Serviços desta Obra">🔧</button>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();editarObra(${o.id})" title="Editar">✏️</button>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();excluirObra(${o.id})" title="Excluir">🗑️</button>
      </td>
    </tr>`).join('');
}

// ===== DETALHE DA OBRA =====
let currentObraId = null;
// Estado que preserva qual obra e qual aba estão abertas na tela de detalhes,
// para que atualizações (edições, exclusões, novos registros) não redefinam
// a aba de volta para "Serviços".
let obraDetalheAtualId = null;
let obraDetalheAbaAtual = 'servicos';
const OBRADET_TABS_ORDEM = ['servicos','equipe','financeiro','diario','cronograma','contratos','estoque'];

// Leva o usuário diretamente para a página de Serviços, já filtrada
// para mostrar apenas os serviços da obra clicada.
function verServicosDaObra(obraId) {
  goTo('servicos');
  const sel = document.getElementById('servicos-filter-obra');
  if (sel) sel.value = obraId;
  filterServicos();
}

function abrirObra(id) {
  // Só reseta a aba para "Serviços" quando o usuário está entrando em uma obra
  // diferente da que estava aberta. Reabrir a mesma obra preserva a aba atual.
  if (obraDetalheAtualId !== id) {
    obraDetalheAbaAtual = 'servicos';
  }
  obraDetalheAtualId = id;
  currentObraId = id;
  goTo('obra-detalhe');
}

function switchObraDetTab(tab, el) {
  obraDetalheAbaAtual = tab;
  document.querySelectorAll('#obradet-tabs .tab').forEach(t => t.classList.remove('active'));
  if (el) {
    el.classList.add('active');
  } else {
    // Chamado programaticamente (ex.: ao re-renderizar a obra) sem o elemento
    // do clique — localiza a aba correspondente pela ordem conhecida.
    const idx = OBRADET_TABS_ORDEM.indexOf(tab);
    const tabs = document.querySelectorAll('#obradet-tabs .tab');
    if (tabs[idx]) tabs[idx].classList.add('active');
  }
  document.querySelectorAll('.obradet-tabpane').forEach(p => p.style.display = 'none');
  const pane = document.getElementById('obradet-tab-' + tab);
  if (pane) pane.style.display = '';
}

function novoServicoParaObra(obraId) {
  const alvoObraId = obraId !== undefined ? obraId : currentObraId;
  openModal('novo-servico');
  const sel = document.getElementById('serv-obra');
  if (sel) {
    sel.value = alvoObraId;
    // Protege a obra durante o cadastro contextual: o serviço criado a
    // partir da tela da obra deve sempre pertencer a ela.
    sel.disabled = true;
  }
  // Garante que, ao salvar, a aba Serviços permaneça ativa na obra.
  obraDetalheAbaAtual = 'servicos';
}

function novaMovimentacaoParaObra(obraId) {
  const alvoObraId = obraId !== undefined ? obraId : currentObraId;
  openModal('nova-movimentacao');
  const sel = document.getElementById('mov-obra');
  if (sel) {
    sel.value = alvoObraId;
    // Protege a obra durante o cadastro contextual: a movimentação criada a
    // partir da tela da obra deve sempre pertencer a ela.
    sel.disabled = true;
  }
  // Garante que, ao salvar, a aba Financeiro permaneça ativa na obra.
  obraDetalheAbaAtual = 'financeiro';
}

function novoDiarioParaObra(obraId) {
  const alvoObraId = obraId !== undefined ? obraId : currentObraId;
  diarioFotosAtuais = [];
  renderDiarioFotosPreview();
  diarioEquipeSelecionada = new Set();
  openModal('novo-diario');
  const sel = document.getElementById('diario-obra');
  if (sel) {
    sel.value = alvoObraId;
    // Protege a obra durante o cadastro contextual: o registro de diário
    // criado a partir da tela da obra deve sempre pertencer a ela.
    sel.disabled = true;
  }
  renderDiarioEquipeChecklist(alvoObraId);
  const quickbar = document.getElementById('diario-quickbar');
  if (quickbar) quickbar.style.display = alvoObraId ? 'flex' : 'none';
  // Garante que, ao salvar, a aba Diário de Obra permaneça ativa na obra.
  obraDetalheAbaAtual = 'diario';
}

function novaAtividadeParaObra(obraId) {
  const alvoObraId = obraId !== undefined ? obraId : currentObraId;
  openModal('nova-atividade');
  const sel = document.getElementById('crono-obra');
  if (sel) {
    sel.value = alvoObraId;
    // Protege a obra durante o cadastro contextual: a atividade criada a
    // partir da tela da obra deve sempre pertencer a ela.
    sel.disabled = true;
  }
  // Garante que, ao salvar, a aba Cronograma permaneça ativa na obra.
  obraDetalheAbaAtual = 'cronograma';
}

function renderObraDetalhe() {
  const o = DB.find('obras', currentObraId);
  if (!o) { goTo('obras'); return; }
  obraDetalheAtualId = o.id;
  // Comparação segura de tipos: garante que "obraId" salvo como texto ou como
  // número sempre relacione corretamente com o id da obra aberta.
  const financeiro = DB.get('financeiro').filter(f => String(f.obraId) === String(o.id));
  const servicos = DB.get('servicos').filter(s => String(s.obraId) === String(o.id));
  const equipe = DB.get('equipe').filter(e => String(e.obraId) === String(o.id));
  const diario = DB.get('diario').filter(d => String(d.obraId) === String(o.id));
  const cronograma = obterCronogramasDaObra(o.id);
  const contratos = DB.get('contratos').filter(c => String(c.obraId) === String(o.id));
  const estoque = DB.get('estoque').filter(e => String(e.obraId) === String(o.id));
  // Compras é um módulo carregado dinamicamente (Fase 2); protege contra o
  // caso raro de renderObraDetalhe ser chamado antes de DB.KEYS.compras existir.
  const compras = (typeof DB !== 'undefined' && DB.KEYS.compras ? DB.get('compras') : []).filter(c => String(c.obraId) === String(o.id));

  // Header
  document.getElementById('obradet-breadcrumb').textContent = o.nome;
  document.getElementById('obradet-nome').textContent = o.nome;
  document.getElementById('obradet-sub').textContent = `${o.codigo} · ${o.municipio} · ${o.responsavel}`;
  const badge = document.getElementById('obradet-status-badge');
  badge.textContent = o.status;
  badge.className = 'badge ' + badgeClass(o.status);
  document.getElementById('obradet-editar-btn').onclick = () => editarObra(o.id);
  document.getElementById('obradet-progresso-txt').textContent = o.progresso + '%';
  const bar = document.getElementById('obradet-progresso-bar');
  bar.style.width = o.progresso + '%';
  bar.className = 'prog-fill ' + statusColor(o.status);

  // KPIs financeiros
  const custoExec = financeiro.filter(f => f.tipo === 'saida' && f.status === 'Pago').reduce((s,f) => s + f.valor, 0);
  const recebido = financeiro.filter(f => f.tipo === 'entrada' && f.status === 'Pago').reduce((s,f) => s + f.valor, 0);
  const aReceber = financeiro.filter(f => f.tipo === 'entrada' && f.status === 'Pendente').reduce((s,f) => s + f.valor, 0);
  const saldo = o.valor - custoExec;
  const margem = o.valor > 0 ? ((o.valor - custoExec) / o.valor * 100).toFixed(1) : 0;
  document.getElementById('obradet-valor').textContent = FormatService.currency(o.valor);
  document.getElementById('obradet-custo').textContent = FormatService.currency(custoExec);
  document.getElementById('obradet-saldo').textContent = FormatService.currency(saldo);
  document.getElementById('obradet-saldo').style.color = saldo >= 0 ? 'var(--green)' : 'var(--red)';
  document.getElementById('obradet-margem').textContent = margem + '%';
  document.getElementById('obradet-margem').style.color = margem >= 0 ? 'var(--green)' : 'var(--red)';
  document.getElementById('obradet-recebido').textContent = FormatService.currency(recebido);
  document.getElementById('obradet-areceber').textContent = FormatService.currency(aReceber);
  document.getElementById('obradet-qtd-servicos').textContent = servicos.length;
  document.getElementById('obradet-qtd-equipe').textContent = equipe.length;

  // Serviços
  const servBody = document.getElementById('obradet-servicos-body');
  servBody.innerHTML = servicos.length === 0
    ? '<tr><td colspan="10" style="text-align:center;color:var(--gray400);padding:20px">Nenhum serviço cadastrado para esta obra</td></tr>'
    : servicos.map(s => {
      const lucro = (s.valorContratado||0) - (s.custoOrcado||0);
      const margS = s.valorContratado > 0 ? (lucro / s.valorContratado * 100).toFixed(1) : 0;
      return `<tr style="cursor:pointer" onclick="editarServico(${s.id})">
        <td><div style="font-weight:600;font-size:13px">${s.nome}</div><div style="font-size:11px;color:var(--gray400)">${s.etapa||''}</div></td>
        <td style="font-size:12px">${s.responsavel||'-'}</td>
        <td><div style="display:flex;align-items:center;gap:8px"><div class="prog-bar" style="width:60px"><div class="prog-fill ${statusColor(s.status)}" style="width:${s.progresso||0}%"></div></div><span style="font-size:12px">${s.progresso||0}%</span></div></td>
        <td><span class="badge ${badgeClass(s.status)}">${s.status}</span></td>
        <td style="font-size:12px;font-weight:600">${FormatService.currency(s.valorContratado||0)}</td>
        <td style="font-size:12px">${FormatService.currency(s.custoOrcado||0)}</td>
        <td style="font-size:12px;font-weight:600;color:${lucro>=0?'var(--green)':'var(--red)'}">${FormatService.currency(lucro)} (${margS}%)</td>
        <td style="font-size:11px">${FormatService.date(s.inicio)}</td>
        <td style="font-size:11px">${FormatService.date(s.prazo)}</td>
        <td><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();editarServico(${s.id})" title="Editar">✏️</button><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();excluirServicoObra(${s.id})" title="Excluir">🗑️</button></td>
      </tr>`;
    }).join('');

  // Equipe
  const eqBody = document.getElementById('obradet-equipe-body');
  eqBody.innerHTML = equipe.length === 0
    ? '<tr><td colspan="6" style="text-align:center;color:var(--gray400);padding:20px">Nenhum colaborador alocado</td></tr>'
    : equipe.map(e => `<tr style="cursor:pointer" onclick="editarColaborador(${e.id})">
        <td><div style="display:flex;align-items:center;gap:8px"><div class="av">${FormatService.initials(e.nome)}</div><span style="font-weight:600;font-size:12px">${e.nome}</span></div></td>
        <td style="font-size:12px">${e.funcao}</td>
        <td style="font-size:12px">${e.telefone||'-'}</td>
        <td style="font-size:12px">${FormatService.date(e.admissao)}</td>
        <td><span class="badge ${badgeClass(e.status)}">${e.status}</span></td>
        <td style="font-size:12px;font-weight:600">${FormatService.currency(e.salario||0)}</td>
      </tr>`).join('');

  // Financeiro
  const entradasObra = financeiro.filter(f => f.tipo === 'entrada' && f.status === 'Pago').reduce((s,f) => s+f.valor, 0);
  const saidasObra = financeiro.filter(f => f.tipo === 'saida' && f.status === 'Pago').reduce((s,f) => s+f.valor, 0);
  document.getElementById('obradet-fin-entradas').textContent = FormatService.currency(entradasObra);
  document.getElementById('obradet-fin-saidas').textContent = FormatService.currency(saidasObra);
  document.getElementById('obradet-fin-saldo').textContent = FormatService.currency(entradasObra - saidasObra);
  const finBody = document.getElementById('obradet-financeiro-body');
  finBody.innerHTML = financeiro.length === 0
    ? '<tr><td colspan="7" style="text-align:center;color:var(--gray400);padding:20px">Nenhum lançamento financeiro</td></tr>'
    : [...financeiro].sort((a,b) => new Date(b.data)-new Date(a.data)).map(f => `<tr style="cursor:pointer" onclick="editarMovimentacao(${f.id})">
        <td style="font-size:12px">${FormatService.date(f.data)}</td>
        <td><span class="badge ${f.tipo==='entrada'?'badge-green':'badge-red'}">${f.tipo==='entrada'?'Entrada':'Saída'}</span></td>
        <td style="font-size:12px">${f.descricao}</td>
        <td style="font-size:12px">${f.categoria}</td>
        <td style="font-size:12px;font-weight:600;color:${f.tipo==='entrada'?'var(--green)':'var(--red)'}">${FormatService.currency(f.valor)}</td>
        <td><span class="badge ${badgeClass(f.status)}">${f.status}</span></td>
        <td>${f.comprovanteId?`<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();downloadDoc(${f.comprovanteId})" title="Ver comprovante: ${f.comprovanteNome||''}">📎</button>`:''}</td>
      </tr>`).join('');

  // Diário – exibido como um feed de cards (registro ágil de obra), mais
  // rápido de escanear no dia a dia do que uma tabela, especialmente no celular.
  const diTimeline = document.getElementById('obradet-diario-timeline');
  diTimeline.innerHTML = diario.length === 0
    ? '<div style="text-align:center;color:var(--gray400);padding:20px">Nenhum registro no diário de obra ainda. Clique em "+ Novo Registro" para começar.</div>'
    : [...diario].sort((a,b) => new Date(b.data)-new Date(a.data) || (b.id||0)-(a.id||0)).map(d => `
      <div class="diario-card" onclick="editarDiario(${d.id})">
        <div class="diario-card-top">
          <div>
            <span class="badge ${d.tipo==='Ocorrência'?'badge-red':d.tipo==='Inspeção'?'badge-blue':'badge-green'}">${d.tipo}</span>
            ${d.tipo==='Ocorrência' && d.gravidade ? ` <span class="badge ${d.gravidade==='Alta'?'badge-red':d.gravidade==='Média'?'badge-amber':'badge-green'}">${d.gravidade}</span>` : ''}
          </div>
          <div style="font-size:11px;color:var(--gray400);white-space:nowrap">${FormatService.date(d.data)}</div>
        </div>
        <div style="font-weight:700;font-size:14px">${d.titulo}</div>
        ${d.descricao ? `<div style="font-size:12px;color:var(--gray600);margin-top:4px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${d.descricao}</div>` : ''}
        <div class="diario-card-meta">
          ${d.responsavel ? `<span>👤 ${d.responsavel}</span>` : ''}
          <span>👥 ${d.colaboradores||0}</span>
          ${d.horasTrabalhadas ? `<span>⏱️ ${d.horasTrabalhadas}h</span>` : ''}
          ${d.clima ? `<span>🌤️ ${d.clima}</span>` : ''}
          ${d.fotos && d.fotos.length ? `<span>📷 ${d.fotos.length}</span>` : ''}
        </div>
        ${d.fotos && d.fotos.length ? `
        <div class="diario-card-fotos">
          ${d.fotos.slice(0,4).map((f,i) => i < 3
            ? `<img src="${f.dataUrl}" alt="${f.nome||'Foto'}" onclick="event.stopPropagation();abrirGaleria(DB.find('diario', ${d.id}).fotos, ${i})">`
            : `<div class="mais" onclick="event.stopPropagation();abrirGaleria(DB.find('diario', ${d.id}).fotos, 3)">+${d.fotos.length-3}</div>`).join('')}
        </div>` : ''}
      </div>`).join('');

  // Cronograma
  const crBody = document.getElementById('obradet-cronograma-body');
  crBody.innerHTML = cronograma.length === 0
    ? '<tr><td colspan="6" style="text-align:center;color:var(--gray400);padding:20px">Nenhuma etapa cadastrada</td></tr>'
    : [...cronograma].sort((a,b) => (a.inicio||'').localeCompare(b.inicio||'')).map(c => `<tr style="cursor:pointer" onclick="editarAtividade(${c.id})">
        <td><div style="font-weight:600;font-size:12px">${c.nome}</div><div style="font-size:11px;color:var(--gray400)">${c.etapa||''}</div></td>
        <td style="font-size:12px">${FormatService.date(c.inicio)}</td>
        <td style="font-size:12px">${FormatService.date(c.fim)}</td>
        <td><div style="display:flex;align-items:center;gap:8px"><div class="prog-bar" style="width:60px"><div class="prog-fill ${statusColor(c.status)}" style="width:${normalizarProgresso(c.progresso)}%"></div></div><span style="font-size:12px">${normalizarProgresso(c.progresso)}%</span></div></td>
        <td><span class="badge ${badgeClass(c.status)}">${c.status}</span></td>
        <td style="font-size:12px">${c.responsavel||'-'}</td>
      </tr>`).join('');

  // Contratos
  const ctBody = document.getElementById('obradet-contratos-body');
  ctBody.innerHTML = contratos.length === 0
    ? '<tr><td colspan="7" style="text-align:center;color:var(--gray400);padding:20px">Nenhum contrato vinculado</td></tr>'
    : contratos.map(c => `<tr style="cursor:pointer" onclick="editarContrato(${c.id})">
        <td style="font-size:12px;font-weight:600">${c.numero}</td>
        <td style="font-size:12px">${c.categoria}</td>
        <td style="font-size:12px">${c.fornecedor}</td>
        <td style="font-size:12px">${FormatService.currency(c.valor)}</td>
        <td style="font-size:12px">${FormatService.currency(c.valorExecutado||0)}</td>
        <td><span class="badge ${badgeClass(c.status)}">${c.status}</span></td>
        <td style="font-size:12px">${FormatService.date(c.termino)}</td>
      </tr>`).join('');

  // Estoque
  const esBody = document.getElementById('obradet-estoque-body');
  esBody.innerHTML = estoque.length === 0
    ? '<tr><td colspan="6" style="text-align:center;color:var(--gray400);padding:20px">Nenhum item de estoque vinculado</td></tr>'
    : estoque.map(e => `<tr style="cursor:pointer" onclick="editarItemEstoque(${e.id})">
        <td style="font-size:12px;font-weight:600">${e.nome}</td>
        <td style="font-size:12px">${e.categoria}</td>
        <td style="font-size:12px;color:${e.qtd<=e.minimo?'var(--red)':'inherit'}">${e.qtd} ${e.unidade}</td>
        <td style="font-size:12px">${e.minimo} ${e.unidade}</td>
        <td style="font-size:12px">${FormatService.currency(e.valorUnit||0)}</td>
        <td style="font-size:12px;font-weight:600">${FormatService.currency((e.qtd||0)*(e.valorUnit||0))}</td>
      </tr>`).join('');

  // Compras (a aba é injetada dinamicamente; só renderiza se já existir)
  const compBody = document.getElementById('obradet-compras-body');
  if (compBody) {
    compBody.innerHTML = compras.length === 0
      ? '<tr><td colspan="5" style="text-align:center;color:var(--gray400);padding:20px">Nenhuma compra vinculada</td></tr>'
      : compras.map(c => {
          const statusCls = (c.status === 'Aprovada' || c.status === 'Recebida') ? 'badge-green' : c.status === 'Pendente' ? 'badge-amber' : c.status === 'Cancelada' ? 'badge-red' : 'badge-gray';
          return `<tr style="cursor:pointer" onclick="editarCompra(${c.id})">
        <td style="font-size:12px;font-weight:600">${c.numero ? c.numero + ' – ' : ''}${c.descricao}</td>
        <td style="font-size:12px">${c.fornecedorNome || '-'}</td>
        <td style="font-size:12px;font-weight:600">${FormatService.currency(c.total ?? c.valor ?? 0)}</td>
        <td><span class="badge ${statusCls}">${c.status}</span></td>
        <td style="font-size:12px">${FormatService.date(c.data)}</td>
      </tr>`;
        }).join('');
  }

  // Preserva a aba em que o usuário estava (equipe, financeiro, estoque, etc.)
  // em vez de sempre voltar para "Serviços" a cada atualização/renderização.
  // A aba "Serviços" só é usada na primeira entrada na obra (definido em abrirObra).
  switchObraDetTab(obraDetalheAbaAtual);
}

function excluirServicoObra(id) {
  const s = DB.find('servicos', id);
  if (!s) { showToast('Serviço não encontrado.', 'error'); return; }
  confirmAction('Excluir serviço?', `"${s.nome}" será removido.`, () => {
    const obraId = s.obraId;
    DB.delete('servicos', id);
    showToast('Serviço excluído.', 'success');
    atualizarAposAlteracaoDeServico(obraId);
  }, '🗑️');
}

function openModal_novaObra() {
  document.getElementById('obra-modal-title').textContent = 'Nova Obra';
  document.getElementById('obra-edit-id').value = '';
  ['obra-nome','obra-codigo','obra-municipio','obra-objeto','obra-responsavel'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('obra-responsavel').value = 'Ysmael Q. Nunes';
  document.getElementById('obra-progresso').value = '0';
  document.getElementById('obra-valor').value = '';
  document.getElementById('obra-inicio').value = '';
  document.getElementById('obra-termino').value = '';
  document.getElementById('obra-status').value = 'Em Andamento';
  openModal('nova-obra');
}

function editarObra(id) {
  const o = DB.find('obras', id);
  if (!o) return;
  document.getElementById('obra-modal-title').textContent = 'Editar Obra';
  document.getElementById('obra-edit-id').value = o.id;
  document.getElementById('obra-nome').value = o.nome;
  document.getElementById('obra-codigo').value = o.codigo;
  document.getElementById('obra-municipio').value = o.municipio;
  document.getElementById('obra-licitacao').value = o.licitacao || 'Pregão Eletrônico';
  document.getElementById('obra-objeto').value = o.objeto || '';
  document.getElementById('obra-responsavel').value = o.responsavel;
  document.getElementById('obra-status').value = o.status;
  document.getElementById('obra-valor').value = o.valor;
  document.getElementById('obra-progresso').value = o.progresso;
  document.getElementById('obra-inicio').value = o.inicio || '';
  document.getElementById('obra-termino').value = o.termino || '';
  openModal('nova-obra');
}

function salvarObra() {
  // Impede que o mesmo clique de salvar (ex.: duplo clique ou clique duplo
  // do botão) cadastre/atualize a obra duas vezes. Só trava quando o
  // salvamento realmente é executado; qualquer falha de validação libera
  // o formulário imediatamente para uma nova tentativa do usuário.
  if (salvarObra._processing) return;

  const nome = document.getElementById('obra-nome').value.trim();
  const codigo = document.getElementById('obra-codigo').value.trim();
  const municipio = document.getElementById('obra-municipio').value.trim();
  const valor = parseFloat(document.getElementById('obra-valor').value) || 0;
  const inicio = document.getElementById('obra-inicio').value;
  const termino = document.getElementById('obra-termino').value;
  if (!ValidationService.required(nome, 'Nome da obra')) return;
  if (!ValidationService.required(codigo, 'Código')) return;
  if (!ValidationService.required(municipio, 'Município')) return;
  if (valor < 0) { showToast('O valor da obra não pode ser negativo.', 'error'); return; }
  if (inicio && termino && new Date(termino) < new Date(inicio)) {
    showToast('A data de término não pode ser anterior à data de início.', 'error');
    return;
  }

  const editId = parseInt(document.getElementById('obra-edit-id').value);
  const data = {
    nome, codigo, municipio,
    licitacao: document.getElementById('obra-licitacao').value,
    objeto: document.getElementById('obra-objeto').value.trim(),
    responsavel: document.getElementById('obra-responsavel').value.trim() || 'Ysmael Q. Nunes',
    status: document.getElementById('obra-status').value,
    valor, progresso: Math.min(100, Math.max(0, parseInt(document.getElementById('obra-progresso').value) || 0)),
    inicio, termino
  };

  // Verificar código duplicado
  const obras = DB.get('obras');
  const dupCodigo = obras.find(o => o.codigo === codigo && o.id !== editId);
  if (dupCodigo) { showToast('Código de obra já existe: ' + codigo, 'error'); return; }

  // A partir daqui o salvamento será executado de fato — trava contra o
  // reenvio duplicado do mesmo clique e libera logo em seguida.
  salvarObra._processing = true;
  try {
    if (editId) {
      const obraAnterior = DB.find('obras', editId);
      DB.update('obras', editId, data);
      // O relacionamento principal continua sendo o "obraId"; o nome é apenas
      // informação auxiliar exibida nos registros relacionados, então quando
      // ele muda, sincronizamos esse campo auxiliar em todas as bases.
      if (obraAnterior && obraAnterior.nome !== nome) {
        sincronizarNomeDaObra(editId, nome);
      }
      showToast('Obra atualizada com sucesso!', 'success');
    } else {
      DB.add('obras', data);
      showToast('Obra cadastrada com sucesso!', 'success');
    }
    closeModal();
    renderObras();
    atualizarSelectsDeObras();
    if (currentPage === 'obra-detalhe') renderObraDetalhe();
  } finally {
    setTimeout(() => { salvarObra._processing = false; }, 400);
  }
}

// Atualiza o campo auxiliar "obraNome" em todos os registros relacionados
// quando o nome de uma obra é alterado. O relacionamento real permanece
// sempre pelo "obraId" — o nome é somente informação de exibição.
function sincronizarNomeDaObra(obraId, novoNome) {
  const bases = ['servicos','equipe','financeiro','estoque','diario','cronograma','contratos','documentos','compras'];
  bases.forEach(entity => {
    const key = (DB.KEYS && DB.KEYS[entity]) || ('gob_' + entity);
    const registros = StorageService.get(key, []);
    if (!Array.isArray(registros) || registros.length === 0) return;
    let alterado = false;
    registros.forEach(r => {
      if (r && String(r.obraId) === String(obraId) && r.obraNome !== novoNome) {
        r.obraNome = novoNome;
        alterado = true;
      }
    });
    if (alterado) StorageService.set(key, registros);
  });
}

// Conta registros relacionados a uma obra em todas as bases existentes,
// usado antes de permitir a exclusão da obra (exclusão segura).
function getRelacionamentosDaObra(obraId) {
  const mapaBases = {
    servicos: 'serviço(s)', equipe: 'colaborador(es)', financeiro: 'lançamento(s) financeiro(s)',
    diario: 'registro(s) de diário', cronograma: 'atividade(s) de cronograma', contratos: 'contrato(s)',
    estoque: 'item(ns) de estoque', documentos: 'documento(s)', compras: 'solicitação(ões) de compra'
  };
  const detalhes = {};
  let total = 0;
  Object.keys(mapaBases).forEach(entity => {
    const key = (DB.KEYS && DB.KEYS[entity]) || ('gob_' + entity);
    const registros = StorageService.get(key, []) || [];
    const qtd = Array.isArray(registros) ? registros.filter(r => r && String(r.obraId) === String(obraId)).length : 0;
    if (qtd > 0) { detalhes[mapaBases[entity]] = qtd; total += qtd; }
  });
  return { total, detalhes };
}

// Função central para atualizar todos os selects de obra do sistema.
// Mantida como um alias do updateObrasSelects() já existente para evitar
// funções conflitantes fazendo a mesma tarefa.
function atualizarSelectsDeObras() {
  updateObrasSelects();
}

// Localiza registros antigos que possuem apenas "obraNome" (sem "obraId")
// e preenche o "obraId" correspondente, sem apagar nenhum campo existente
// e sem alterar registros que já tenham um ID válido.
function migrarRelacionamentosDeObras() {
  const obras = DB.get('obras');
  if (!obras.length) return;
  // "servicos" e "equipe" não entram mais nesta lista: cada uma tem sua
  // própria migração dedicada, incluindo aviso para nomes de obra ambíguos.
  const bases = ['financeiro','estoque','diario','cronograma','contratos','documentos','compras'];
  bases.forEach(entity => {
    const key = (DB.KEYS && DB.KEYS[entity]) || ('gob_' + entity);
    const registros = StorageService.get(key, []);
    if (!Array.isArray(registros) || registros.length === 0) return;
    let alterado = false;
    registros.forEach(r => {
      if (r && (r.obraId === undefined || r.obraId === null || r.obraId === '') && r.obraNome) {
        const obraCorrespondente = obras.find(o => o.nome === r.obraNome);
        if (obraCorrespondente) {
          r.obraId = obraCorrespondente.id;
          alterado = true;
        }
      }
    });
    if (alterado) StorageService.set(key, registros);
  });
}

function excluirObra(id) {
  const o = DB.find('obras', id);
  if (!o) return;

  const executarExclusao = () => {
    DB.delete('obras', id);
    showToast('Obra excluída.', 'success');
    if (currentPage === 'obra-detalhe' && currentObraId === id) {
      goTo('obras');
    } else {
      renderObras();
      if (currentPage === 'obra-detalhe') renderObraDetalhe();
    }
    atualizarSelectsDeObras();
  };

  const rel = getRelacionamentosDaObra(id);
  if (rel.total === 0) {
    confirmAction('Excluir obra?', `"${o.nome}" será removida permanentemente.`, executarExclusao, '🗑️');
  } else {
    // Exclusão segura: nunca apaga silenciosamente uma obra que possui
    // registros vinculados. Avisa claramente quais dados existem e só
    // prossegue com confirmação explícita do usuário.
    const resumo = Object.entries(rel.detalhes).map(([label, qtd]) => `${qtd} ${label}`).join(', ');
    confirmAction(
      'Obra possui dados vinculados',
      `"${o.nome}" possui ${resumo}. Excluir a obra não apaga esses registros, mas eles ficarão sem vínculo com nenhuma obra. Deseja realmente excluir?`,
      executarExclusao,
      '⚠️'
    );
  }
}

