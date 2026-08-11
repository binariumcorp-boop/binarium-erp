// ============================================================
// compras-itens.js
// FASE 2/ETAPA 6: COMPRAS - ITENS DA COMPRA
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== FASE 2/ETAPA 6: COMPRAS – ITENS DA COMPRA =====
let comprasItensAtual = [];
let comprasItemSeq = 0;

function adicionarItemCompra() {
  comprasItensAtual.push({ localId: ++comprasItemSeq, descricao: '', unidade: 'Unidade', quantidade: 1, valorUnitario: 0, recebido: false, quantidadeRecebida: 0 });
  renderItensCompraRows();
  recalcularTotaisCompra();
}

function removerItemCompra(localId) {
  comprasItensAtual = comprasItensAtual.filter(i => i.localId !== localId);
  renderItensCompraRows();
  recalcularTotaisCompra();
}

function atualizarItemCompra(localId, field, value) {
  const it = comprasItensAtual.find(i => i.localId === localId);
  if (!it) return;
  it[field] = (field === 'quantidade' || field === 'valorUnitario') ? converterValorMonetario(value) : value;
  recalcularTotaisCompra();
}

function renderItensCompraRows() {
  const tbody = document.getElementById('comp-itens-body');
  if (!tbody) return;
  if (comprasItensAtual.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray400);padding:10px;font-size:12px">Nenhum item adicionado</td></tr>';
    return;
  }
  const unidades = ['Unidade','Saco','m²','m³','kg','L','m','Rolo','Lata'];
  tbody.innerHTML = comprasItensAtual.map(it => `<tr data-local-id="${it.localId}">
      <td style="padding:4px"><input class="form-input" style="padding:4px 6px;font-size:12px" value="${String(it.descricao || '').replace(/"/g, '&quot;')}" placeholder="Descrição do item" oninput="atualizarItemCompra(${it.localId},'descricao',this.value)"></td>
      <td style="padding:4px"><select class="form-input" style="padding:4px 6px;font-size:12px" onchange="atualizarItemCompra(${it.localId},'unidade',this.value)">${unidades.map(u => `<option ${it.unidade === u ? 'selected' : ''}>${u}</option>`).join('')}</select></td>
      <td style="padding:4px"><input class="form-input" style="padding:4px 6px;font-size:12px" type="number" min="0" step="1" value="${it.quantidade}" oninput="atualizarItemCompra(${it.localId},'quantidade',this.value)"></td>
      <td style="padding:4px"><input class="form-input" style="padding:4px 6px;font-size:12px" type="number" min="0" step="0.01" value="${it.valorUnitario}" oninput="atualizarItemCompra(${it.localId},'valorUnitario',this.value)"></td>
      <td style="padding:4px;text-align:right;font-size:12px;font-weight:600" id="comp-item-subtotal-${it.localId}">${FormatService.currency((Number(it.quantidade) || 0) * (Number(it.valorUnitario) || 0))}</td>
      <td style="padding:4px;text-align:center"><button type="button" class="btn btn-ghost btn-sm" onclick="removerItemCompra(${it.localId})" title="Remover item">🗑️</button></td>
    </tr>`).join('');
}

function recalcularTotaisCompra() {
  const subtotal = comprasItensAtual.reduce((s, it) => s + (Number(it.quantidade) || 0) * (Number(it.valorUnitario) || 0), 0);
  const frete = converterValorMonetario(document.getElementById('comp-frete')?.value);
  const desconto = converterValorMonetario(document.getElementById('comp-desconto')?.value);
  let total = subtotal + frete - desconto;
  if (total < 0) total = 0;
  const subEl = document.getElementById('comp-subtotal-display');
  const totEl = document.getElementById('comp-total-display');
  if (subEl) subEl.value = FormatService.currency(subtotal);
  if (totEl) totEl.value = FormatService.currency(total);
  comprasItensAtual.forEach(it => {
    const cell = document.getElementById('comp-item-subtotal-' + it.localId);
    if (cell) cell.textContent = FormatService.currency((Number(it.quantidade) || 0) * (Number(it.valorUnitario) || 0));
  });
  return { subtotal, frete, desconto, total };
}

// Localiza o fornecedor de forma segura, tratando fornecedorId salvo como texto ou número.
function obterFornecedorPorId(fornecedorId) {
  if (fornecedorId === null || fornecedorId === undefined || fornecedorId === '') return null;
  const fornecedores = DB.KEYS.fornecedores ? DB.get('fornecedores') : [];
  return fornecedores.find(f => String(f.id) === String(fornecedorId)) || null;
}

// Gera números sequenciais de compra (COM-0001, COM-0002...) sem depender
// apenas da quantidade de registros, evitando colisão após exclusões.
function gerarNumeroCompra() {
  const compras = DB.KEYS.compras ? DB.get('compras') : [];
  let max = 0;
  compras.forEach(c => {
    const m = /^COM-(\d+)$/.exec(c.numero || '');
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return 'COM-' + String(max + 1).padStart(4, '0');
}

function novaCompraParaObra(obraId) {
  const alvoObraId = obraId !== undefined ? obraId : currentObraId;
  openModal('nova-compra');
  const sel = document.getElementById('comp-obra');
  if (sel) {
    sel.value = alvoObraId;
    // Protege a obra durante o cadastro contextual: a compra criada a partir
    // da tela da obra deve sempre pertencer a ela.
    sel.disabled = true;
  }
  // Garante que, ao salvar, a aba Compras permaneça ativa na obra.
  obraDetalheAbaAtual = 'compras';
}

let salvandoCompra = false;

function salvarCompra() {
  if (salvandoCompra) return;
  const desc = document.getElementById('comp-desc').value.trim();
  if (!ValidationService.required(desc, 'Descrição')) return;
  if (comprasItensAtual.length === 0) { showToast('Adicione ao menos um item à compra.', 'error'); return; }
  for (const it of comprasItensAtual) {
    if (!String(it.descricao || '').trim()) { showToast('Preencha a descrição de todos os itens.', 'error'); return; }
    if (!(Number(it.quantidade) > 0)) { showToast('A quantidade deve ser maior que zero em todos os itens.', 'error'); return; }
    if (Number(it.valorUnitario) < 0) { showToast('O valor unitário não pode ser negativo.', 'error'); return; }
  }
  const frete = converterValorMonetario(document.getElementById('comp-frete').value);
  const desconto = converterValorMonetario(document.getElementById('comp-desconto').value);
  if (frete < 0) { showToast('O frete não pode ser negativo.', 'error'); return; }
  if (desconto < 0) { showToast('O desconto não pode ser negativo.', 'error'); return; }
  const subtotal = comprasItensAtual.reduce((s, it) => s + (Number(it.quantidade) || 0) * (Number(it.valorUnitario) || 0), 0);
  if (desconto > subtotal + frete) { showToast('O desconto não pode ser maior que o subtotal + frete.', 'error'); return; }
  let total = subtotal + frete - desconto;
  if (total < 0) total = 0;
  const previsao = document.getElementById('comp-previsao').value;
  if (previsao && isNaN(new Date(previsao).getTime())) { showToast('Previsão de entrega inválida.', 'error'); return; }

  const obraSelValue = document.getElementById('comp-obra').value;
  const obraId = obraSelValue ? parseInt(obraSelValue) : null;
  const obra = obraId ? obterObraPorId(obraId) : null;
  if (obraId && !obra) { showToast('Obra selecionada não foi encontrada.', 'error'); return; }
  const fornecedorSelValue = document.getElementById('comp-fornecedor').value;
  const fornecedorId = fornecedorSelValue ? parseInt(fornecedorSelValue) : null;
  const fornecedor = fornecedorId ? obterFornecedorPorId(fornecedorId) : null;
  if (fornecedorId && !fornecedor) { showToast('Fornecedor selecionado não foi encontrado.', 'error'); return; }

  const editId = parseInt(document.getElementById('comp-edit-id').value);
  const existente = editId ? DB.find('compras', editId) : null;
  const recebidosAnteriores = {};
  if (existente && Array.isArray(existente.itens)) {
    existente.itens.forEach(it => { recebidosAnteriores[it.id] = { recebido: it.recebido || false, quantidadeRecebida: it.quantidadeRecebida || 0 }; });
  }

  const itensSalvos = comprasItensAtual.map(it => {
    const anterior = it.localId ? recebidosAnteriores[it.localId] : null;
    return {
      id: it.localId, descricao: it.descricao.trim(), unidade: it.unidade,
      quantidade: Number(it.quantidade) || 0, valorUnitario: Number(it.valorUnitario) || 0,
      subtotal: (Number(it.quantidade) || 0) * (Number(it.valorUnitario) || 0),
      recebido: anterior ? anterior.recebido : false,
      quantidadeRecebida: anterior ? anterior.quantidadeRecebida : 0
    };
  });

  const data = {
    descricao: desc,
    obraId, obraNome: obra ? obra.nome : 'Geral',
    fornecedorId, fornecedorNome: fornecedor ? (fornecedor.fantasia || fornecedor.razao) : '',
    prioridade: document.getElementById('comp-prioridade').value,
    status: document.getElementById('comp-status').value,
    condicaoPagamento: document.getElementById('comp-condicao').value,
    dataPrevisaoEntrega: previsao || null,
    prazoEntrega: parseInt(document.getElementById('comp-prazo').value) || 0,
    itens: itensSalvos,
    subtotal, frete, desconto, total, valor: total,
    justificativa: document.getElementById('comp-justif').value.trim()
  };
  if (!editId) {
    data.numero = gerarNumeroCompra();
    data.data = new Date().toISOString().split('T')[0];
    data.recebidoNoEstoque = false;
    data.lancadoNoFinanceiro = false;
  }

  salvandoCompra = true;
  try {
    if (editId) { DB.update('compras', editId, data); showToast('Compra atualizada!', 'success'); }
    else { DB.add('compras', data); ActivityLog.add('Criou solicitação de compra', 'Compras', data.numero + ' – ' + desc); showToast('Solicitação de compra registrada!', 'success'); }
    closeModal();
    if (currentPage === 'obra-detalhe') { renderObraDetalhe(); } else { renderCompras(); }
  } finally {
    salvandoCompra = false;
  }
}

function editarCompra(id) {
  const c = DB.find('compras', id);
  if (!c) { showToast('Compra não encontrada.', 'error'); return; }
  populateSelect('comp-obra', DB.get('obras'), 'id', 'nome', 'Geral');
  populateSelect('comp-fornecedor', DB.KEYS.fornecedores ? DB.get('fornecedores') : [], 'id', 'razao', 'Selecione o fornecedor');
  document.getElementById('comp-fornecedor').value = c.fornecedorId || '';
  // Garante que um fornecedor inativo vinculado a esta compra permaneça
  // disponível/selecionado, mesmo após a atualização central dos selects.
  if (typeof atualizarSelectsDeFornecedores === 'function') atualizarSelectsDeFornecedores();
  document.getElementById('comp-fornecedor').value = c.fornecedorId || '';
  document.getElementById('comp-modal-title').textContent = 'Editar Compra' + (c.numero ? ' – ' + c.numero : '');
  document.getElementById('comp-edit-id').value = c.id;
  document.getElementById('comp-numero').value = c.numero || '';
  document.getElementById('comp-desc').value = c.descricao || '';
  document.getElementById('comp-obra').value = c.obraId || '';
  document.getElementById('comp-fornecedor').value = c.fornecedorId || '';
  document.getElementById('comp-prioridade').value = c.prioridade || 'Normal';
  document.getElementById('comp-status').value = c.status || 'Pendente';
  document.getElementById('comp-condicao').value = c.condicaoPagamento || '';
  document.getElementById('comp-previsao').value = c.dataPrevisaoEntrega || '';
  document.getElementById('comp-prazo').value = c.prazoEntrega || '';
  document.getElementById('comp-justif').value = c.justificativa || '';
  document.getElementById('comp-frete').value = c.frete || 0;
  document.getElementById('comp-desconto').value = c.desconto || 0;
  comprasItensAtual = (Array.isArray(c.itens) ? c.itens : []).map(it => ({
    localId: ++comprasItemSeq, descricao: it.descricao || '', unidade: it.unidade || 'Unidade',
    quantidade: it.quantidade || 0, valorUnitario: it.valorUnitario || 0,
    recebido: it.recebido || false, quantidadeRecebida: it.quantidadeRecebida || 0
  }));
  renderItensCompraRows();
  recalcularTotaisCompra();
  openModal('nova-compra');
}

function renderCompras() {
  populateSelect('compras-filter-obra', DB.get('obras'), 'id', 'nome', 'Obra: Todas');
  populateSelect('compras-filter-forn', DB.KEYS.fornecedores ? DB.get('fornecedores') : [], 'id', 'razao', 'Fornecedor: Todos');
  if (typeof atualizarSelectsDeFornecedores === 'function') atualizarSelectsDeFornecedores();
  calcComprasStats();
  filterCompras();
}

function calcComprasStats() {
  const compras = DB.get('compras');
  const el = id => document.getElementById(id);
  if (el('stat-comp-total')) el('stat-comp-total').textContent = compras.length;
  if (el('stat-comp-pend')) el('stat-comp-pend').textContent = compras.filter(c => c.status === 'Pendente').length;
  if (el('stat-comp-aprov')) el('stat-comp-aprov').textContent = compras.filter(c => c.status === 'Aprovada').length;
  if (el('stat-comp-valor')) el('stat-comp-valor').textContent = FormatService.currency(compras.reduce((s, c) => s + (c.status !== 'Cancelada' ? (c.total ?? c.valor ?? 0) : 0), 0));
}

function filterCompras() {
  const search = normalizarTextoBusca(document.getElementById('compras-search')?.value || '');
  const obraId = document.getElementById('compras-filter-obra')?.value || '';
  const fornId = document.getElementById('compras-filter-forn')?.value || '';
  const status = document.getElementById('compras-filter-status')?.value || '';
  let compras = DB.get('compras');
  if (search) {
    compras = compras.filter(c =>
      normalizarTextoBusca(c.numero).includes(search) ||
      normalizarTextoBusca(c.descricao).includes(search) ||
      normalizarTextoBusca(c.obraNome).includes(search) ||
      normalizarTextoBusca(c.fornecedorNome).includes(search) ||
      normalizarTextoBusca(c.status).includes(search) ||
      normalizarTextoBusca(c.condicaoPagamento).includes(search) ||
      normalizarTextoBusca(c.justificativa).includes(search) ||
      (Array.isArray(c.itens) && c.itens.some(it => normalizarTextoBusca(it.descricao).includes(search)))
    );
  }
  if (obraId) compras = compras.filter(c => String(c.obraId) === String(obraId));
  if (fornId) compras = compras.filter(c => String(c.fornecedorId) === String(fornId));
  if (status) compras = compras.filter(c => c.status === status);
  compras = compras.slice().sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')));
  renderComprasTable(compras);
}

function clearComprasFilter() {
  document.getElementById('compras-search').value = '';
  document.getElementById('compras-filter-obra').value = '';
  document.getElementById('compras-filter-forn').value = '';
  document.getElementById('compras-filter-status').value = '';
  filterCompras();
}

function renderComprasTable(compras) {
  const tbody = document.getElementById('compras-table-body');
  if (!tbody) return;
  if (compras.length === 0) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray400);padding:20px">Nenhuma solicitação cadastrada</td></tr>'; return; }
  const hoje = new Date().toISOString().split('T')[0];
  tbody.innerHTML = compras.map(c => {
    const atrasada = c.status !== 'Recebida' && c.status !== 'Cancelada' && c.dataPrevisaoEntrega && c.dataPrevisaoEntrega < hoje;
    const statusCls = (c.status === 'Aprovada' || c.status === 'Recebida') ? 'badge-green' : c.status === 'Pendente' ? 'badge-amber' : c.status === 'Cancelada' ? 'badge-red' : 'badge-gray';
    return `<tr style="cursor:pointer" onclick="editarCompra(${c.id})">
    <td><div style="font-weight:600;font-size:13px">${c.numero ? c.numero + ' – ' : ''}${c.descricao}</div><div style="font-size:11px;color:var(--gray400)">${c.prioridade || ''}${Array.isArray(c.itens) ? ' • ' + c.itens.length + ' item(ns)' : ''}</div></td>
    <td style="font-size:12px">${c.obraNome || 'Geral'}</td>
    <td style="font-size:12px">${c.fornecedorNome || '-'}</td>
    <td style="font-size:12px;font-weight:600">${FormatService.currency(c.total ?? c.valor ?? 0)}</td>
    <td><span class="badge ${statusCls}">${c.status}</span>${atrasada ? ' <span class="badge badge-red" title="Entrega atrasada">Atrasada</span>' : ''}</td>
    <td style="font-size:12px">${FormatService.date(c.data)}</td>
    <td onclick="event.stopPropagation()">
      ${c.status === 'Pendente' ? `<button class="btn btn-success btn-sm" onclick="aprovarCompra(${c.id})" title="Aprovar">✅</button>` : ''}
      ${c.status === 'Aprovada' ? `<button class="btn btn-ghost btn-sm" onclick="receberCompra(${c.id})" title="Receber">📦</button>` : ''}
      ${c.status === 'Recebida' && !c.lancadoNoFinanceiro ? `<button class="btn btn-ghost btn-sm" onclick="lancarCompraNoFinanceiro(${c.id})" title="Lançar no Financeiro">💰</button>` : ''}
      ${(c.status === 'Pendente' || c.status === 'Aprovada') ? `<button class="btn btn-ghost btn-sm" onclick="cancelarCompra(${c.id})" title="Cancelar">❌</button>` : ''}
      <button class="btn btn-ghost btn-sm" onclick="editarCompra(${c.id})" title="Editar">✏️</button>
      <button class="btn btn-ghost btn-sm" onclick="excluirCompra(${c.id})" title="Excluir">🗑️</button>
    </td>
  </tr>`;
  }).join('');
}

function aprovarCompra(id) {
  const c = DB.find('compras', id);
  if (!c) { showToast('Compra não encontrada.', 'error'); return; }
  if (c.status !== 'Pendente') { showToast('Apenas solicitações pendentes podem ser aprovadas.', 'error'); return; }
  DB.update('compras', id, { status: 'Aprovada' });
  ActivityLog.add('Aprovou compra', 'Compras', (c.numero ? c.numero + ' – ' : '') + c.descricao);
  showToast('Compra aprovada!', 'success');
  if (currentPage === 'obra-detalhe') { renderObraDetalhe(); } else { renderCompras(); }
}

function cancelarCompra(id) {
  const c = DB.find('compras', id);
  if (!c) { showToast('Compra não encontrada.', 'error'); return; }
  if (c.recebidoNoEstoque) { showToast('Não é possível cancelar uma compra já recebida no estoque.', 'error'); return; }
  confirmAction('Cancelar compra?', `A solicitação "${c.descricao}" será marcada como cancelada e não entrará mais nos indicadores ativos.`, () => {
    DB.update('compras', id, { status: 'Cancelada' });
    ActivityLog.add('Cancelou compra', 'Compras', (c.numero ? c.numero + ' – ' : '') + c.descricao);
    showToast('Compra cancelada.', 'success');
    if (currentPage === 'obra-detalhe') { renderObraDetalhe(); } else { renderCompras(); }
  }, '❌');
}

// Gera entradas de estoque para os itens ainda não recebidos da compra,
// somando à quantidade existente quando o item já existe na obra e criando
// um novo item de estoque caso contrário. Calcula apenas a diferença ainda
// não processada, para nunca duplicar entradas de uma mesma compra.
function gerarEntradasEstoqueDaCompra(compra) {
  const estoque = DB.get('estoque');
  let nextId = estoque.length > 0 ? Math.max(...estoque.map(e => e.id || 0)) + 1 : 1;
  let alterado = false;
  const agora = new Date().toISOString();
  compra.itens.forEach(it => {
    const qtdAReceber = (Number(it.quantidade) || 0) - (Number(it.quantidadeRecebida) || 0);
    if (qtdAReceber <= 0) return;
    const nomeNorm = normalizarTextoBusca(it.descricao);
    const existente = estoque.find(e => String(e.obraId) === String(compra.obraId) && normalizarTextoBusca(e.nome) === nomeNorm);
    if (existente) {
      existente.qtd = (existente.qtd || 0) + qtdAReceber;
      existente.updatedAt = agora;
      // Preenche o fornecedor do item existente somente se ainda não tiver um definido.
      if (!existente.fornecedorId && compra.fornecedorId) {
        existente.fornecedorId = compra.fornecedorId;
        existente.fornecedorNome = compra.fornecedorNome || '';
      }
    } else {
      estoque.push({
        id: nextId++, nome: it.descricao, categoria: 'Material', unidade: it.unidade || 'Unidade',
        qtd: qtdAReceber, minimo: 0, valorUnit: Number(it.valorUnitario) || 0,
        obraId: compra.obraId, obraNome: compra.obraNome || '',
        fornecedorId: compra.fornecedorId || null, fornecedorNome: compra.fornecedorNome || '',
        createdAt: agora, updatedAt: agora
      });
    }
    it.quantidadeRecebida = Number(it.quantidade) || 0;
    it.recebido = true;
    alterado = true;
  });
  if (alterado) DB.set('estoque', estoque);
  return alterado;
}

function receberCompra(id) {
  const c = DB.find('compras', id);
  if (!c) { showToast('Compra não encontrada.', 'error'); return; }
  if (c.status === 'Cancelada') { showToast('Uma compra cancelada não pode ser recebida.', 'error'); return; }
  if (c.recebidoNoEstoque) { showToast('Esta compra já foi recebida no Estoque.', 'error'); return; }
  if (!Array.isArray(c.itens) || c.itens.length === 0) { showToast('Esta compra não possui itens para receber.', 'error'); return; }
  confirmAction('Confirmar recebimento?', `Os itens de "${c.descricao}" (${c.numero || ''}) serão adicionados ao Estoque da obra vinculada.`, () => {
    gerarEntradasEstoqueDaCompra(c);
    DB.update('compras', id, { itens: c.itens, status: 'Recebida', recebidoNoEstoque: true, dataRecebimento: new Date().toISOString().split('T')[0] });
    ActivityLog.add('Recebeu compra', 'Compras', (c.numero ? c.numero + ' – ' : '') + c.descricao);
    showToast('Compra recebida! Itens adicionados ao Estoque.', 'success');
    if (currentPage === 'obra-detalhe') { renderObraDetalhe(); } else { renderCompras(); }
    if (typeof calcEstoqueStats === 'function') calcEstoqueStats();
    if (typeof filterEstoque === 'function' && currentPage === 'estoque') filterEstoque();
  }, '📦');
}

function lancarCompraNoFinanceiro(id) {
  const c = DB.find('compras', id);
  if (!c) { showToast('Compra não encontrada.', 'error'); return; }
  if (c.lancadoNoFinanceiro) { showToast('Esta compra já foi lançada no Financeiro.', 'error'); return; }
  const total = c.total ?? c.valor ?? 0;
  if (!total) { showToast('Compra sem valor total para lançar.', 'error'); return; }
  confirmAction('Lançar no Financeiro?', `Será criada uma saída de ${FormatService.currency(total)} vinculada a esta compra.`, () => {
    DB.add('financeiro', {
      tipo: 'saida', data: new Date().toISOString().split('T')[0],
      descricao: `Compra ${c.numero || ''} – ${c.descricao}`.trim(),
      obraId: c.obraId, obraNome: c.obraNome || 'Geral',
      categoria: 'Material', valor: total, status: 'Pendente',
      fornecedorId: c.fornecedorId || null, fornecedorNome: c.fornecedorNome || '',
      obs: c.fornecedorNome ? `Fornecedor: ${c.fornecedorNome}` : '',
      compraId: c.id
    });
    DB.update('compras', id, { lancadoNoFinanceiro: true });
    ActivityLog.add('Lançou compra no Financeiro', 'Compras', (c.numero ? c.numero + ' – ' : '') + c.descricao);
    showToast('Lançamento gerado no Financeiro!', 'success');
    if (currentPage === 'obra-detalhe') { renderObraDetalhe(); } else { renderCompras(); }
    if (typeof calcFinStats === 'function') calcFinStats();
  }, '💰');
}

function excluirCompra(id) {
  const c = DB.find('compras', id);
  if (!c) return;
  const msg = (c.recebidoNoEstoque || c.lancadoNoFinanceiro)
    ? 'Atenção: esta compra já gerou lançamentos no Estoque e/ou Financeiro. Esses lançamentos não serão removidos automaticamente. A solicitação de compra será excluída.'
    : 'Esta solicitação será removida.';
  confirmAction('Excluir solicitação?', msg, () => {
    DB.delete('compras', id);
    showToast('Solicitação excluída.', 'success');
    if (currentPage === 'obra-detalhe') { renderObraDetalhe(); } else { renderCompras(); }
  }, '🗑️');
}

// Preenche obraId/fornecedorId em compras antigas que só possuem os nomes, e
// migra o campo "itens" (texto livre da versão inicial) para lista estruturada.
function migrarComprasAntigas() {
  if (!DB.KEYS.compras) return;
  const compras = DB.get('compras');
  if (!compras.length) return;
  const obras = DB.get('obras');
  const fornecedores = DB.KEYS.fornecedores ? DB.get('fornecedores') : [];
  let alterado = false;
  compras.forEach(c => {
    if (typeof c.itens === 'string') {
      const linhas = c.itens.split('\n').map(l => l.trim()).filter(Boolean);
      const base = linhas.length ? linhas : [c.descricao || 'Item'];
      c.itens = base.map((linha, idx) => ({
        id: Date.now() + idx, descricao: linha, unidade: 'Unidade',
        quantidade: 1, valorUnitario: base.length === 1 ? (c.valor || 0) : 0,
        recebido: false, quantidadeRecebida: 0
      }));
      alterado = true;
    }
    if (!Array.isArray(c.itens)) { c.itens = []; alterado = true; }
    if (c.subtotal === undefined) { c.subtotal = c.itens.reduce((s, it) => s + (Number(it.quantidade) || 0) * (Number(it.valorUnitario) || 0), 0); alterado = true; }
    if (c.frete === undefined) { c.frete = 0; alterado = true; }
    if (c.desconto === undefined) { c.desconto = 0; alterado = true; }
    if (c.total === undefined) { c.total = c.valor || c.subtotal || 0; alterado = true; }
    if (c.recebidoNoEstoque === undefined) { c.recebidoNoEstoque = false; alterado = true; }
    if (c.lancadoNoFinanceiro === undefined) { c.lancadoNoFinanceiro = false; alterado = true; }
    if ((c.obraId === undefined || c.obraId === null || c.obraId === '') && c.obraNome && c.obraNome !== 'Geral') {
      const corresp = obras.filter(o => o.nome === c.obraNome);
      if (corresp.length === 1) { c.obraId = corresp[0].id; alterado = true; }
      else if (corresp.length > 1) console.warn(`Migração de compras: mais de uma obra com o nome "${c.obraNome}" — a compra "${c.descricao}" (id ${c.id}) não foi relacionada automaticamente.`);
    }
    if ((c.fornecedorId === undefined || c.fornecedorId === null || c.fornecedorId === '') && c.fornecedorNome) {
      const nomeAlvo = normalizarTextoBusca(c.fornecedorNome);
      const corresp = fornecedores.filter(f => normalizarTextoBusca(f.razao) === nomeAlvo || normalizarTextoBusca(f.fantasia) === nomeAlvo);
      if (corresp.length === 1) { c.fornecedorId = corresp[0].id; alterado = true; }
      else if (corresp.length > 1) console.warn(`Migração de compras: mais de um fornecedor com o nome "${c.fornecedorNome}" — a compra "${c.descricao}" (id ${c.id}) não foi relacionada automaticamente.`);
    }
  });
  let seq = 0;
  compras.forEach(c => { const m = /^COM-(\d+)$/.exec(c.numero || ''); if (m) seq = Math.max(seq, parseInt(m[1], 10)); });
  compras.forEach(c => { if (!c.numero) { seq += 1; c.numero = 'COM-' + String(seq).padStart(4, '0'); alterado = true; } });
  if (alterado) DB.set('compras', compras);
}

// Injeta dinamicamente a aba "Compras" na tela de detalhes da obra, seguindo
// o mesmo padrão já usado para injetar as páginas de Compras/Fornecedores.
function initComprasObraTab() {
  if (document.getElementById('obradet-tab-compras')) return;
  const tabs = document.getElementById('obradet-tabs');
  const estoquePane = document.getElementById('obradet-tab-estoque');
  if (!tabs || !estoquePane) return;
  const tabBtn = document.createElement('div');
  tabBtn.className = 'tab';
  tabBtn.textContent = 'Compras';
  tabBtn.onclick = function() { switchObraDetTab('compras', tabBtn); };
  tabs.appendChild(tabBtn);
  const pane = document.createElement('div');
  pane.id = 'obradet-tab-compras';
  pane.className = 'obradet-tabpane';
  pane.style.display = 'none';
  pane.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
      <button class="btn btn-primary btn-sm" onclick="novaCompraParaObra()">+ Nova Compra</button>
    </div>
    <div class="card" style="padding:0">
      <div class="table-wrap">
        <table>
          <tr><th>Compra</th><th>Fornecedor</th><th>Valor Total</th><th>Status</th><th>Data</th></tr>
          <tbody id="obradet-compras-body"><tr><td colspan="5" style="text-align:center;color:var(--gray400);padding:20px">Carregando...</td></tr></tbody>
        </table>
      </div>
    </div>`;
  estoquePane.insertAdjacentElement('afterend', pane);
  if (typeof OBRADET_TABS_ORDEM !== 'undefined' && !OBRADET_TABS_ORDEM.includes('compras')) OBRADET_TABS_ORDEM.push('compras');
}

