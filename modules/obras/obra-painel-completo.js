// ============================================================
// obra-painel-completo.js
// FASE 3 (2): PAINEL COMPLETO DA OBRA
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

// 2. PAINEL COMPLETO DA OBRA + LINHA DO TEMPO
// =====================================================================
function abrirPainelObra(id) {
  const o = DB.find('obras', id);
  if (!o) return;
  ensurePainelObraModal();
  document.getElementById('po-title').textContent = o.nome;
  document.getElementById('po-sub').textContent = `${o.codigo} · ${o.municipio}`;
  document.getElementById('po-badge').innerHTML = `<span class="badge ${badgeClass(o.status)}">${o.status}</span>`;
  document.getElementById('po-obra-id').value = o.id;
  switchPainelObraTab('geral');
  openModal('painel-obra');
}

function ensurePainelObraModal() {
  if (document.getElementById('modal-painel-obra')) return;
  const div = document.createElement('div');
  div.className = 'modal-overlay';
  div.id = 'modal-painel-obra';
  div.addEventListener('click', e => { if (e.target === div) closeModal(); });
  div.innerHTML = `
    <div class="modal" style="max-width:900px;width:96%;max-height:90vh;display:flex;flex-direction:column">
      <div class="modal-header" style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="display:flex;align-items:center;gap:10px">
            <h3 id="po-title" style="font-size:17px;font-weight:700"></h3>
            <span id="po-badge"></span>
          </div>
          <div id="po-sub" style="font-size:12px;color:var(--gray400);margin-top:2px"></div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button>
      </div>
      <input type="hidden" id="po-obra-id">
      <div class="tabs" id="po-tabs" style="padding:0 4px;margin-top:10px">
        <div class="tab active" onclick="switchPainelObraTab('geral',this)">Visão Geral</div>
        <div class="tab" onclick="switchPainelObraTab('timeline',this)">Linha do Tempo</div>
        <div class="tab" onclick="switchPainelObraTab('servicos',this)">Serviços</div>
        <div class="tab" onclick="switchPainelObraTab('financeiro',this)">Financeiro</div>
        <div class="tab" onclick="switchPainelObraTab('equipe',this)">Equipe</div>
        <div class="tab" onclick="switchPainelObraTab('documentos',this)">Documentos</div>
      </div>
      <div id="po-body" style="overflow-y:auto;padding:16px 4px;flex:1"></div>
    </div>`;
  document.body.appendChild(div);
}

let painelObraAbaAtual = 'geral';

// Reexecuta a aba atualmente aberta no Painel Completo da Obra, mas apenas se
// o modal estiver aberto e for referente à obra que sofreu a alteração. Isso
// garante que qualquer mudança em Serviços, Financeiro, Equipe, Documentos ou
// Cronograma seja refletida no painel imediatamente, sem recarregar a página.
function refreshPainelObraSeAberto(obraId) {
  if (typeof currentModal === 'undefined' || currentModal !== 'painel-obra') return;
  const campoId = document.getElementById('po-obra-id');
  if (!campoId || !campoId.value) return;
  if (obraId !== undefined && obraId !== null && String(campoId.value) !== String(obraId)) return;
  switchPainelObraTab(painelObraAbaAtual);
}

function switchPainelObraTab(tab, el) {
  painelObraAbaAtual = tab;
  document.querySelectorAll('#po-tabs .tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  else { const t = document.querySelector(`#po-tabs .tab:nth-child(${['geral','timeline','servicos','financeiro','equipe','documentos'].indexOf(tab)+1})`); if (t) t.classList.add('active'); }
  const id = parseInt(document.getElementById('po-obra-id').value);
  const o = DB.find('obras', id);
  const body = document.getElementById('po-body');
  if (!o) return;

  // Todo o conteúdo abaixo é 100% derivado do DB (localStorage) no momento em
  // que a aba é renderizada — nenhum valor fixo/demonstrativo é usado, e como
  // esta função é reexecutada por refreshPainelObraSeAberto() após qualquer
  // alteração em Serviços, Financeiro, Equipe, Documentos ou Cronograma, o
  // painel está sempre sincronizado com os dados reais da obra.
  const servicosObra = DB.get('servicos').filter(s => String(s.obraId) === String(o.id));
  const financeiroObra = DB.get('financeiro').filter(f => String(f.obraId) === String(o.id));
  const equipeObra = DB.get('equipe').filter(e => String(e.obraId) === String(o.id));
  const documentosObra = DB.get('documentos').filter(d => String(d.obraId) === String(o.id));

  if (tab === 'geral') {
    const custoExec = financeiroObra.filter(f => f.tipo === 'saida' && f.status === 'Pago').reduce((s,f) => s + (f.valor||0), 0);
    const recebido = financeiroObra.filter(f => f.tipo === 'entrada' && f.status === 'Pago').reduce((s,f) => s + (f.valor||0), 0);
    const aReceber = financeiroObra.filter(f => f.tipo === 'entrada' && f.status === 'Pendente').reduce((s,f) => s + (f.valor||0), 0);
    const aPagar = financeiroObra.filter(f => f.tipo === 'saida' && f.status === 'Pendente').reduce((s,f) => s + (f.valor||0), 0);
    const receitaTotal = financeiroObra.filter(f => f.tipo === 'entrada').reduce((s,f) => s + (f.valor||0), 0);
    const despesaTotal = financeiroObra.filter(f => f.tipo === 'saida').reduce((s,f) => s + (f.valor||0), 0);
    const saldo = (o.valor||0) - custoExec;
    const margem = o.valor > 0 ? ((o.valor - custoExec) / o.valor * 100).toFixed(1) : '0.0';
    const custoMaoDeObra = equipeObra.filter(e => e.status === 'Ativo').reduce((s,e) => s + (e.salario||0), 0);
    const atrasados = servicosObra.filter(servicoEstaAtrasado).length;

    body.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:12px">
        <div class="stat-card"><div class="stat-icon" style="background:#dbeafe">💰</div><div><div class="stat-label">Valor do Contrato</div><div class="stat-value" style="font-size:15px">${FormatService.currency(o.valor)}</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:#d1fae5">📈</div><div><div class="stat-label">Progresso</div><div class="stat-value" style="font-size:15px">${o.progresso}%</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:#fef3c7">📅</div><div><div class="stat-label">Término Previsto</div><div class="stat-value" style="font-size:13px">${FormatService.date(o.termino)}</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:#ede9fe">👤</div><div><div class="stat-label">Responsável</div><div class="stat-value" style="font-size:13px">${o.responsavel}</div></div></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:12px">
        <div class="stat-card"><div class="stat-icon" style="background:#fee2e2">💸</div><div><div class="stat-label">Custo Realizado</div><div class="stat-value" style="font-size:15px">${FormatService.currency(custoExec)}</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:${saldo>=0?'#d1fae5':'#fee2e2'}">⚖️</div><div><div class="stat-label">Saldo</div><div class="stat-value" style="font-size:15px;color:${saldo>=0?'var(--green)':'var(--red)'}">${FormatService.currency(saldo)}</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:${margem>=0?'#d1fae5':'#fee2e2'}">📊</div><div><div class="stat-label">Margem</div><div class="stat-value" style="font-size:15px;color:${margem>=0?'var(--green)':'var(--red)'}">${margem}%</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:#d1fae5">✅</div><div><div class="stat-label">Recebido</div><div class="stat-value" style="font-size:15px">${FormatService.currency(recebido)}</div></div></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
        <div class="stat-card"><div class="stat-icon" style="background:#fef3c7">⏳</div><div><div class="stat-label">A Receber</div><div class="stat-value" style="font-size:15px">${FormatService.currency(aReceber)}</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:#fef3c7">⏳</div><div><div class="stat-label">A Pagar</div><div class="stat-value" style="font-size:15px">${FormatService.currency(aPagar)}</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:#e8f0fe">🛠️</div><div><div class="stat-label">Serviços</div><div class="stat-value" style="font-size:15px">${servicosObra.length}${atrasados ? ` <span style="color:var(--red);font-size:12px">(${atrasados} atrasado${atrasados>1?'s':''})</span>` : ''}</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:#e8f0fe">👥</div><div><div class="stat-label">Equipe / Mão de Obra</div><div class="stat-value" style="font-size:15px">${equipeObra.length} · ${FormatService.currency(custoMaoDeObra)}</div></div></div>
      </div>
      <div class="card">
        <div class="section-title mb-16">Informações da Obra</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
          <div><span style="color:var(--gray400)">Código:</span> ${o.codigo}</div>
          <div><span style="color:var(--gray400)">Município:</span> ${o.municipio}</div>
          <div><span style="color:var(--gray400)">Licitação:</span> ${o.licitacao||'-'}</div>
          <div><span style="color:var(--gray400)">Início:</span> ${FormatService.date(o.inicio)}</div>
          <div><span style="color:var(--gray400)">Receita Total:</span> ${FormatService.currency(receitaTotal)}</div>
          <div><span style="color:var(--gray400)">Despesa Total:</span> ${FormatService.currency(despesaTotal)}</div>
          <div style="grid-column:1/3"><span style="color:var(--gray400)">Objeto:</span> ${o.objeto||'-'}</div>
        </div>
        <div class="prog-bar" style="margin-top:16px"><div class="prog-fill ${statusColor(o.status)}" style="width:${o.progresso}%"></div></div>
      </div>`;
  } else if (tab === 'timeline') {
    body.innerHTML = renderLinhaDoTempo(o.id);
  } else if (tab === 'servicos') {
    const items = [...servicosObra].sort((a,b) => (a.inicio||'').localeCompare(b.inicio||''));
    body.innerHTML = items.length ? `<div class="table-wrap"><table><tr><th>Serviço</th><th>Responsável</th><th>Prev. Início</th><th>Prev. Conclusão</th><th>Real Início</th><th>Real Conclusão</th><th>Progresso</th><th>Status</th></tr>${items.map(s => {
      const atrasado = servicoEstaAtrasado(s);
      const concluido = s.status === 'Concluído';
      const rowBg = atrasado ? 'background:var(--red-light)' : (concluido ? 'background:var(--green-light)' : '');
      return `<tr style="${rowBg};cursor:pointer" onclick="editarServico(${s.id})">
        <td><div style="font-weight:600">${s.nome}</div><div style="font-size:11px;color:var(--gray400)">${s.etapa||''}</div></td>
        <td>${s.responsavel||'-'}</td>
        <td>${FormatService.date(s.inicio)}</td>
        <td>${FormatService.date(s.prazo)}</td>
        <td>${s.inicioReal ? FormatService.date(s.inicioReal) : '-'}</td>
        <td>${s.fimReal ? FormatService.date(s.fimReal) : '-'}</td>
        <td><div style="display:flex;align-items:center;gap:6px"><div class="prog-bar" style="width:50px"><div class="prog-fill ${statusColor(s.status)}" style="width:${s.progresso||0}%"></div></div><span>${s.progresso||0}%</span></div></td>
        <td><span class="badge ${badgeClass(s.status)}">${atrasado ? 'Atrasado' : s.status}</span></td>
      </tr>`;
    }).join('')}</table></div>` : emptyState('Nenhum serviço vinculado a esta obra.');
  } else if (tab === 'financeiro') {
    const items = financeiroObra;
    const ent = items.filter(f=>f.tipo==='entrada' && f.status==='Pago').reduce((s,f)=>s+(f.valor||0),0);
    const sai = items.filter(f=>f.tipo==='saida' && f.status==='Pago').reduce((s,f)=>s+(f.valor||0),0);
    const aReceber = items.filter(f=>f.tipo==='entrada' && f.status==='Pendente').reduce((s,f)=>s+(f.valor||0),0);
    const aPagar = items.filter(f=>f.tipo==='saida' && f.status==='Pendente').reduce((s,f)=>s+(f.valor||0),0);
    body.innerHTML = `
      <div style="display:flex;gap:10px;margin-bottom:14px;font-size:13px;flex-wrap:wrap">
        <div class="card" style="flex:1;min-width:110px"><div style="color:var(--gray400);font-size:11px">Entradas (Pago)</div><div style="font-weight:700;color:var(--green)">${FormatService.currency(ent)}</div></div>
        <div class="card" style="flex:1;min-width:110px"><div style="color:var(--gray400);font-size:11px">Saídas (Pago)</div><div style="font-weight:700;color:var(--red)">${FormatService.currency(sai)}</div></div>
        <div class="card" style="flex:1;min-width:110px"><div style="color:var(--gray400);font-size:11px">Saldo</div><div style="font-weight:700">${FormatService.currency(ent-sai)}</div></div>
        <div class="card" style="flex:1;min-width:110px"><div style="color:var(--gray400);font-size:11px">A Receber</div><div style="font-weight:700">${FormatService.currency(aReceber)}</div></div>
        <div class="card" style="flex:1;min-width:110px"><div style="color:var(--gray400);font-size:11px">A Pagar</div><div style="font-weight:700">${FormatService.currency(aPagar)}</div></div>
      </div>` + (items.length ? `<div class="table-wrap"><table><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Status</th></tr>${[...items].sort((a,b)=>new Date(b.data)-new Date(a.data)).map(f => `<tr style="cursor:pointer" onclick="editarMovimentacao(${f.id})"><td>${FormatService.date(f.data)}</td><td>${f.descricao}</td><td>${f.categoria}</td><td style="color:${f.tipo==='entrada'?'var(--green)':'var(--red)'}">${f.tipo==='entrada'?'+':'-'} ${FormatService.currency(f.valor)}</td><td><span class="badge ${badgeClass(f.status)}">${f.status}</span></td></tr>`).join('')}</table></div>` : emptyState('Nenhuma movimentação vinculada a esta obra.'));
  } else if (tab === 'equipe') {
    const items = equipeObra;
    const custoTotal = items.filter(e=>e.status==='Ativo').reduce((s,e)=>s+(e.salario||0),0);
    body.innerHTML = (items.length ? `<div class="card" style="margin-bottom:12px;padding:10px 14px"><span style="color:var(--gray400);font-size:12px">Custo de mão de obra (ativos):</span> <strong>${FormatService.currency(custoTotal)}</strong></div>` : '') +
      (items.length ? `<div class="table-wrap"><table><tr><th>Nome</th><th>Função</th><th>Status</th><th>Salário</th></tr>${items.map(e => `<tr style="cursor:pointer" onclick="editarColaborador(${e.id})"><td>${e.nome}</td><td>${e.funcao}</td><td><span class="badge ${e.status==='Ativo'?'badge-green':'badge-red'}">${e.status}</span></td><td>${FormatService.currency(e.salario||0)}</td></tr>`).join('')}</table></div>` : emptyState('Nenhum colaborador alocado nesta obra.'));
  } else if (tab === 'documentos') {
    const items = documentosObra;
    body.innerHTML = items.length ? `<div class="table-wrap"><table><tr><th>Documento</th><th>Categoria</th><th>Responsável</th><th>Status</th><th>Data</th></tr>${items.map(d => `<tr style="cursor:pointer" onclick="editarDoc(${d.id})"><td><div style="font-weight:600">${d.nome}</div>${d.obs?`<div style="font-size:11px;color:var(--gray400)">${d.obs}</div>`:''}</td><td>${d.categoria}</td><td>${d.responsavel||'-'}</td><td><span class="badge ${badgeClass(d.status)}">${d.status}</span></td><td>${FormatService.date(d.uploadAt)}</td></tr>`).join('')}</table></div>` : emptyState('Nenhum documento vinculado a esta obra.');
  }
}

function emptyState(msg) {
  return `<div style="text-align:center;color:var(--gray400);padding:40px;font-size:13px">${msg}</div>`;
}

// A Linha do Tempo é construída exclusivamente a partir dos serviços
// cadastrados da obra (nunca de um cronograma manual separado). Sempre que um
// serviço é criado, editado ou excluído, atualizarAposAlteracaoDeServico()
// aciona refreshPainelObraSeAberto(), que reexecuta esta função — portanto ela
// está sempre reorganizada cronologicamente e com o progresso recalculado.
function renderLinhaDoTempo(obraId) {
  const servicos = DB.get('servicos').filter(s => String(s.obraId) === String(obraId));

  if (!servicos.length) return emptyState('Nenhum serviço cadastrado para esta obra ainda. A Linha do Tempo é gerada automaticamente a partir dos serviços.');

  // Reorganiza cronologicamente pela data prevista de início (fallback para
  // a data real de início quando a prevista não foi informada).
  const ordenados = [...servicos].sort((a, b) => {
    const da = a.inicio || a.inicioReal || '';
    const db_ = b.inicio || b.inicioReal || '';
    return da.localeCompare(db_);
  });

  // Progresso geral recalculado em tempo real (mesma regra usada para
  // atualizar o progresso da obra), nunca um valor fixo.
  const progressoGeral = Math.round(ordenados.reduce((acc, s) => acc + normalizarProgresso(s.progresso), 0) / ordenados.length);
  const concluidos = ordenados.filter(s => s.status === 'Concluído').length;
  const atrasados = ordenados.filter(servicoEstaAtrasado).length;

  const resumo = `<div class="card" style="margin-bottom:18px;padding:14px 16px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-size:13px;font-weight:600">Progresso Geral da Obra (baseado nos serviços)</div>
      <div style="font-size:13px;font-weight:700">${progressoGeral}%</div>
    </div>
    <div class="prog-bar"><div class="prog-fill ${progressoGeral>=100?'prog-green':(atrasados>0?'prog-red':'prog-blue')}" style="width:${progressoGeral}%"></div></div>
    <div style="display:flex;gap:16px;margin-top:10px;font-size:12px;color:var(--gray400)">
      <span>${ordenados.length} serviço(s)</span>
      <span style="color:var(--green)">✔ ${concluidos} concluído(s)</span>
      ${atrasados ? `<span style="color:var(--red)">⚠ ${atrasados} atrasado(s)</span>` : ''}
    </div>
  </div>`;

  const linha = `<div style="position:relative;padding-left:22px">
    <div style="position:absolute;left:6px;top:4px;bottom:4px;width:2px;background:var(--gray200)"></div>
    ${ordenados.map(s => {
      const atrasado = servicoEstaAtrasado(s);
      const concluido = s.status === 'Concluído';
      const cor = atrasado ? '#dc2626' : (concluido ? '#059669' : '#1a56db');
      const icone = atrasado ? '⚠️' : (concluido ? '✔️' : '🔧');
      const destaqueBg = atrasado ? 'var(--red-light)' : (concluido ? 'var(--green-light)' : 'transparent');
      return `
      <div style="position:relative;margin-bottom:14px;cursor:pointer;background:${destaqueBg};border-radius:8px;padding:${destaqueBg!=='transparent'?'8px 10px':'0'}" onclick="editarServico(${s.id})">
        <div style="position:absolute;left:${destaqueBg!=='transparent'?'-32px':'-22px'};top:${destaqueBg!=='transparent'?'8px':'0'};width:16px;height:16px;border-radius:50%;background:${cor};display:flex;align-items:center;justify-content:center;font-size:9px">${icone}</div>
        <div style="font-size:11px;color:var(--gray400);font-family:'DM Mono',monospace">Previsto: ${FormatService.date(s.inicio)} → ${FormatService.date(s.prazo)}${(s.inicioReal||s.fimReal) ? ` · Real: ${s.inicioReal?FormatService.date(s.inicioReal):'-'} → ${s.fimReal?FormatService.date(s.fimReal):'-'}` : ''}</div>
        <div style="font-size:13px;font-weight:600">${s.nome}${s.etapa ? ` <span style="font-weight:400;color:var(--gray400)">· ${s.etapa}</span>` : ''}</div>
        <div style="font-size:12px;color:var(--gray400);display:flex;gap:10px;align-items:center;margin-top:2px">
          <span>${s.responsavel || 'Sem responsável definido'}</span>
          <span class="badge ${badgeClass(atrasado ? 'Atrasado' : s.status)}">${atrasado ? 'Atrasado' : s.status}</span>
          <span>${s.progresso||0}% executado</span>
        </div>
      </div>`;
    }).join('')}
  </div>`;

  return resumo + linha;
}

// Adiciona botão "Ver" na tabela de Obras (sobrescreve a função original)
window.renderObrasTable = function(obras) {
  const tbody = document.getElementById('obras-table-body');
  if (obras.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--gray400);padding:20px">Nenhuma obra encontrada</td></tr>';
    return;
  }
  tbody.innerHTML = obras.map(o => `
    <tr>
      <td><div style="font-weight:600">${o.nome}</div><div style="font-size:11px;color:var(--gray400)">${o.municipio}</div></td>
      <td style="font-size:12px;color:var(--gray400)">${o.codigo}</td>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="av">${FormatService.initials(o.responsavel)}</div><span style="font-size:12px">${o.responsavel}</span></div></td>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="prog-bar" style="width:70px"><div class="prog-fill ${statusColor(o.status)}" style="width:${o.progresso}%"></div></div><span style="font-size:12px">${o.progresso}%</span></div></td>
      <td><span class="badge ${badgeClass(o.status)}">${o.status}</span></td>
      <td style="font-weight:600;font-size:12px">${FormatService.currency(o.valor)}</td>
      <td style="font-size:12px;color:${o.status==='Atrasada'?'var(--red)':'inherit'}">${FormatService.date(o.termino)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="abrirPainelObra(${o.id})" title="Ver Detalhes">👁️</button>
        <button class="btn btn-ghost btn-sm" onclick="editarObra(${o.id})" title="Editar">✏️</button>
        <button class="btn btn-ghost btn-sm" onclick="excluirObra(${o.id})" title="Excluir">🗑️</button>
      </td>
    </tr>`).join('');
};

// =====================================================================
