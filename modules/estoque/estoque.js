// ============================================================
// estoque.js
// ESTOQUE
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== ESTOQUE =====
function renderEstoque() {
  populateSelect('est-obra', DB.get('obras'), 'id', 'nome', 'Geral');
  populateSelect('mov-est-obra', DB.get('obras'), 'id', 'nome', 'Geral');
  if (typeof atualizarSelectsDeFornecedores === 'function') atualizarSelectsDeFornecedores();
  calcEstoqueStats();
  filterEstoque();
}

function calcEstoqueStats() {
  const est = DB.get('estoque');
  const criticos = est.filter(e => e.qtd === 0);
  const baixos = est.filter(e => e.qtd > 0 && e.qtd <= e.minimo);
  const normais = est.filter(e => e.qtd > e.minimo);
  const valor = est.reduce((s, e) => s + (e.qtd * e.valorUnit), 0);
  document.getElementById('stat-est-total').textContent = est.length;
  document.getElementById('stat-est-criticos').textContent = criticos.length;
  document.getElementById('stat-est-baixo').textContent = baixos.length;
  document.getElementById('stat-est-normal').textContent = normais.length;
  document.getElementById('stat-est-valor').textContent = FormatService.currency(valor);
}

function filterEstoque() {
  const search = normalizarTextoBusca(document.getElementById('estoque-search').value);
  const cat = document.getElementById('estoque-filter-cat').value;
  const nivel = document.getElementById('estoque-filter-nivel').value;
  let est = DB.get('estoque');
  if (search) {
    est = est.filter(e =>
      normalizarTextoBusca(e.nome).includes(search) ||
      normalizarTextoBusca(e.categoria).includes(search) ||
      normalizarTextoBusca(e.unidade).includes(search) ||
      normalizarTextoBusca(e.obraNome).includes(search) ||
      normalizarTextoBusca(e.fornecedorNome).includes(search)
    );
  }
  if (cat) est = est.filter(e => e.categoria === cat);
  if (nivel === 'critico') est = est.filter(e => e.qtd === 0);
  else if (nivel === 'baixo') est = est.filter(e => e.qtd > 0 && e.qtd <= e.minimo);
  else if (nivel === 'normal') est = est.filter(e => e.qtd > e.minimo);
  renderEstoqueTable(est);
}

function clearEstoqueFilter() {
  document.getElementById('estoque-search').value = '';
  document.getElementById('estoque-filter-cat').value = '';
  document.getElementById('estoque-filter-nivel').value = '';
  filterEstoque();
}

function renderEstoqueTable(est) {
  const tbody = document.getElementById('estoque-table-body');
  if (est.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--gray400);padding:20px">Nenhum item encontrado</td></tr>';
    return;
  }
  tbody.innerHTML = est.map(e => {
    const nivel = e.qtd === 0 ? { label: 'Crítico', cls: 'badge-red' } : e.qtd <= e.minimo ? { label: 'Baixo', cls: 'badge-amber' } : { label: 'Normal', cls: 'badge-green' };
    return `<tr style="cursor:pointer" onclick="editarItemEstoque(${e.id})">
      <td><div style="font-weight:600;font-size:13px">${e.nome}</div></td>
      <td><span class="badge badge-gray">${e.categoria}</span></td>
      <td style="font-size:12px">${e.unidade}</td>
      <td style="font-weight:600;font-size:13px;color:${e.qtd<=e.minimo?'var(--red)':'inherit'}">${e.qtd}</td>
      <td style="font-size:12px;color:var(--gray400)">${e.minimo}</td>
      <td style="font-size:12px">${FormatService.currency(e.valorUnit)}</td>
      <td style="font-weight:600;font-size:12px">${FormatService.currency(e.qtd * e.valorUnit)}</td>
      <td><span class="badge ${nivel.cls}">${nivel.label}</span></td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();editarItemEstoque(${e.id})" title="Editar">✏️</button>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();excluirItemEstoque(${e.id})" title="Excluir">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

function editarItemEstoque(id) {
  const e = DB.find('estoque', id);
  if (!e) return;
  document.getElementById('est-modal-title').textContent = 'Editar Item';
  document.getElementById('est-edit-id').value = e.id;
  document.getElementById('est-nome').value = e.nome;
  document.getElementById('est-categoria').value = e.categoria;
  document.getElementById('est-unidade').value = e.unidade;
  document.getElementById('est-qtd').value = e.qtd;
  document.getElementById('est-minimo').value = e.minimo;
  document.getElementById('est-valor-unit').value = e.valorUnit;
  document.getElementById('est-obra').value = e.obraId || '';
  populateSelect('est-fornecedor', DB.KEYS.fornecedores ? DB.get('fornecedores') : [], 'id', 'razao', 'Selecione o fornecedor');
  document.getElementById('est-fornecedor').value = e.fornecedorId || '';
  if (typeof atualizarSelectsDeFornecedores === 'function') atualizarSelectsDeFornecedores();
  document.getElementById('est-fornecedor').value = e.fornecedorId || '';
  openModal('novo-item-estoque');
}

let salvandoItemEstoque = false;

function salvarItemEstoque() {
  if (salvandoItemEstoque) return;
  const nome = document.getElementById('est-nome').value.trim();
  if (!ValidationService.required(nome, 'Nome do item')) return;
  const qtd = parseInt(document.getElementById('est-qtd').value) || 0;
  const minimo = parseInt(document.getElementById('est-minimo').value) || 0;
  if (qtd < 0) { showToast('Quantidade não pode ser negativa.', 'error'); return; }
  if (minimo < 0) { showToast('Estoque mínimo não pode ser negativo.', 'error'); return; }
  const editId = parseInt(document.getElementById('est-edit-id').value);
  const obraSelValue = document.getElementById('est-obra').value;
  const obraId = obraSelValue ? parseInt(obraSelValue) : null;
  // Localiza a obra real pelo obraId em vez de confiar apenas no texto do
  // select, garantindo que obraNome fique sempre sincronizado.
  const obra = obraId ? obterObraPorId(obraId) : null;
  if (obraId && !obra) { showToast('Obra selecionada não foi encontrada.', 'error'); return; }
  const fornecedorSelValue = document.getElementById('est-fornecedor')?.value || '';
  const fornecedorId = fornecedorSelValue ? parseInt(fornecedorSelValue) : null;
  const fornecedor = fornecedorId ? obterFornecedorPorId(fornecedorId) : null;
  if (fornecedorId && !fornecedor) { showToast('Fornecedor selecionado não foi encontrado.', 'error'); return; }
  const data = {
    nome, categoria: document.getElementById('est-categoria').value,
    unidade: document.getElementById('est-unidade').value,
    qtd, minimo, valorUnit: converterValorMonetario(document.getElementById('est-valor-unit').value),
    obraId, obraNome: obra ? obra.nome : '',
    fornecedorId, fornecedorNome: fornecedor ? (fornecedor.fantasia || fornecedor.razao) : ''
  };
  salvandoItemEstoque = true;
  try {
    if (editId) { DB.update('estoque', editId, data); showToast('Item atualizado!', 'success'); }
    else { DB.add('estoque', data); showToast('Item cadastrado!', 'success'); }
    closeModal();
    if (currentPage === 'obra-detalhe') { renderObraDetalhe(); } else { calcEstoqueStats(); filterEstoque(); }
  } finally {
    salvandoItemEstoque = false;
  }
}

function excluirItemEstoque(id) {
  const e = DB.find('estoque', id);
  if (!e) return;
  confirmAction('Excluir item?', `"${e.nome}" será removido do estoque.`, () => {
    DB.delete('estoque', id);
    showToast('Item excluído.', 'success');
    if (currentPage === 'obra-detalhe') { renderObraDetalhe(); } else { calcEstoqueStats(); filterEstoque(); }
  }, '🗑️');
}

let salvandoMovEstoque = false;

function salvarMovEstoque() {
  if (salvandoMovEstoque) return;
  const itemId = parseInt(document.getElementById('mov-est-item').value);
  const tipo = document.getElementById('mov-est-tipo').value;
  const qtd = parseInt(document.getElementById('mov-est-qtd').value);
  if (!itemId) { showToast('Selecione um item.', 'error'); return; }
  if (!qtd || qtd <= 0) { showToast('Quantidade deve ser maior que zero.', 'error'); return; }
  const item = DB.find('estoque', itemId);
  if (!item) { showToast('Item não encontrado.', 'error'); return; }
  if (tipo === 'saida' && qtd > item.qtd) {
    showToast(`Saldo insuficiente. Disponível: ${item.qtd} ${item.unidade}`, 'error');
    return;
  }
  const obraSelValue = document.getElementById('mov-est-obra').value;
  const obraId = obraSelValue ? parseInt(obraSelValue) : null;
  const obra = obraId ? obterObraPorId(obraId) : null;
  if (obraId && !obra) { showToast('Obra selecionada não foi encontrada.', 'error'); return; }

  salvandoMovEstoque = true;
  try {
    if (tipo === 'transferencia') {
      // Transferência move o item para outra obra, sem alterar a quantidade
      // total (o estoque não é fracionado por obra neste sistema).
      if (!obraId) { showToast('Selecione a obra de destino da transferência.', 'error'); return; }
      if (String(item.obraId) === String(obraId)) { showToast('O item já está vinculado a esta obra.', 'error'); return; }
      DB.update('estoque', itemId, { obraId, obraNome: obra ? obra.nome : '' });
      showToast(`Item transferido para ${obra ? obra.nome : 'a obra selecionada'}!`, 'success');
    } else {
      const novaQtd = tipo === 'entrada' ? item.qtd + qtd : item.qtd - qtd;
      const updates = { qtd: novaQtd };
      // Em entradas/saídas registradas dentro do contexto de uma obra, quando
      // o item ainda não possui obra vinculada, aproveita a obra selecionada
      // na movimentação para preencher o vínculo sem sobrescrever um vínculo já existente.
      if (obraId && (item.obraId === null || item.obraId === undefined || item.obraId === '')) {
        updates.obraId = obraId;
        updates.obraNome = obra ? obra.nome : '';
      }
      DB.update('estoque', itemId, updates);
      showToast(`Movimentação registrada! Novo saldo: ${novaQtd} ${item.unidade}`, 'success');
    }
    closeModal();
    if (currentPage === 'obra-detalhe') { renderObraDetalhe(); } else { calcEstoqueStats(); filterEstoque(); }
  } finally {
    salvandoMovEstoque = false;
  }
}

