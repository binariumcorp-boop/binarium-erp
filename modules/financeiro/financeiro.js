// ============================================================
// financeiro.js
// FINANCEIRO
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== FINANCEIRO =====
let finTabFilter = 'todas';

// Converte texto ou número em um valor monetário numérico seguro, tratando
// vírgula e ponto como separador decimal e evitando NaN.
function converterValorMonetario(valor) {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : 0;
  }
  let texto = String(valor || '').trim();
  if (!texto) return 0;
  texto = texto.replace(/\s/g, '').replace('R$', '');
  if (texto.includes(',') && texto.includes('.')) {
    texto = texto.replace(/\./g, '').replace(',', '.');
  } else if (texto.includes(',')) {
    texto = texto.replace(',', '.');
  }
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : 0;
}

// Normaliza o tipo de movimentação (entrada/saída) preservando os textos
// já usados no sistema; usada apenas como verificação defensiva interna.
function normalizarTipoMovimentacao(tipo) {
  const valor = String(tipo || '').trim().toLowerCase();
  if (['entrada', 'receita', 'recebimento'].includes(valor)) return 'entrada';
  if (['saída', 'saida', 'despesa', 'pagamento'].includes(valor)) return 'saida';
  return valor;
}

// Preenche obraId em movimentações antigas que só possuem obraNome, sem
// duplicar registros, sem apagar dados e sem sobrescrever vínculos já existentes.
function migrarRelacionamentosFinanceiros() {
  const obras = DB.get('obras');
  if (!obras.length) return;
  const financeiro = DB.get('financeiro');
  if (!financeiro.length) return;
  let alterado = false;
  financeiro.forEach(f => {
    if (f && (f.obraId === undefined || f.obraId === null || f.obraId === '') && f.obraNome && f.obraNome !== 'Geral') {
      const correspondentes = obras.filter(o => o.nome === f.obraNome);
      if (correspondentes.length === 1) {
        f.obraId = correspondentes[0].id;
        alterado = true;
      } else if (correspondentes.length > 1) {
        // Nome ambíguo: preserva a movimentação sem relacionar automaticamente.
        console.warn(`Migração financeira: mais de uma obra com o nome "${f.obraNome}" — a movimentação "${f.descricao}" (id ${f.id}) não foi relacionada automaticamente.`);
      }
    }
  });
  if (alterado) DB.set('financeiro', financeiro);
}

function renderFinanceiro() {
  populateSelect('fin-filter-obra', DB.get('obras'), 'id', 'nome', 'Obra: Todas');
  populateSelect('mov-obra', DB.get('obras'), 'id', 'nome', 'Geral');
  if (typeof atualizarSelectsDeFornecedores === 'function') atualizarSelectsDeFornecedores();
  calcFinStats();
  filterFinanceiro();
}

function calcFinStats() {
  const fin = DB.get('financeiro');
  const entradas = fin.filter(f => f.tipo === 'entrada' && f.status === 'Pago').reduce((s, f) => s + f.valor, 0);
  const saidas = fin.filter(f => f.tipo === 'saida' && f.status === 'Pago').reduce((s, f) => s + f.valor, 0);
  const receber = fin.filter(f => f.tipo === 'entrada' && f.status === 'Pendente').reduce((s, f) => s + f.valor, 0);
  document.getElementById('fin-saldo').textContent = FormatService.currency(entradas - saidas);
  document.getElementById('fin-entradas').textContent = FormatService.currency(entradas);
  document.getElementById('fin-saidas').textContent = FormatService.currency(saidas);
  document.getElementById('fin-receber').textContent = FormatService.currency(receber);
}

function switchFinTab(tab, el) {
  finTabFilter = tab;
  document.querySelectorAll('#fin-tabs .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  filterFinanceiro();
}

function filterFinanceiro() {
  const search = normalizarTextoBusca(document.getElementById('fin-search').value);
  const obraId = document.getElementById('fin-filter-obra').value;
  const cat = document.getElementById('fin-filter-cat').value;
  const de = document.getElementById('fin-filter-de').value;
  const ate = document.getElementById('fin-filter-ate').value;
  let fin = DB.get('financeiro');
  if (finTabFilter === 'entrada') fin = fin.filter(f => f.tipo === 'entrada');
  else if (finTabFilter === 'saida') fin = fin.filter(f => f.tipo === 'saida');
  else if (finTabFilter === 'pendente') fin = fin.filter(f => f.status === 'Pendente');
  if (search) {
    fin = fin.filter(f =>
      normalizarTextoBusca(f.descricao).includes(search) ||
      normalizarTextoBusca(f.obraNome).includes(search) ||
      normalizarTextoBusca(f.categoria).includes(search) ||
      normalizarTextoBusca(f.tipo === 'entrada' ? 'entrada' : 'saída').includes(search) ||
      normalizarTextoBusca(f.status).includes(search) ||
      normalizarTextoBusca(f.fornecedorNome).includes(search) ||
      normalizarTextoBusca(f.obs).includes(search)
    );
  }
  // Comparação segura de tipos entre o valor do select (texto) e o obraId salvo.
  if (obraId) fin = fin.filter(f => String(f.obraId) === String(obraId));
  if (cat) fin = fin.filter(f => f.categoria === cat);
  if (de) fin = fin.filter(f => f.data >= de);
  if (ate) fin = fin.filter(f => f.data <= ate);
  fin.sort((a, b) => b.data.localeCompare(a.data));
  renderFinTable(fin);
}

function clearFinFilter() {
  document.getElementById('fin-search').value = '';
  document.getElementById('fin-filter-obra').value = '';
  document.getElementById('fin-filter-cat').value = '';
  document.getElementById('fin-filter-de').value = '';
  document.getElementById('fin-filter-ate').value = '';
  filterFinanceiro();
}

function renderFinTable(fin) {
  const tbody = document.getElementById('fin-table-body');
  if (fin.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--gray400);padding:20px">Nenhuma movimentação encontrada</td></tr>';
    return;
  }
  tbody.innerHTML = fin.map(f => `
    <tr style="cursor:pointer" onclick="editarMovimentacao(${f.id})">
      <td style="font-size:12px">${FormatService.date(f.data)}</td>
      <td><div style="font-size:13px;font-weight:500">${f.descricao}</div>${f.obs?`<div style="font-size:11px;color:var(--gray400)">${f.obs}</div>`:''}</td>
      <td style="font-size:12px">${f.obraNome||'Geral'}</td>
      <td><span class="badge badge-gray">${f.categoria}</span></td>
      <td><span class="badge ${f.tipo==='entrada'?'badge-green':'badge-red'}">${f.tipo==='entrada'?'Entrada':'Saída'}</span></td>
      <td style="font-weight:600;font-size:13px;color:${f.tipo==='entrada'?'var(--green)':'var(--red)'}">${f.tipo==='saida'?'-':''}${FormatService.currency(f.valor)}</td>
      <td><span class="badge ${f.status==='Pago'?'badge-green':f.status==='Pendente'?'badge-amber':'badge-red'}">${f.status}</span></td>
      <td>
        ${f.comprovanteId?`<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();downloadDoc(${f.comprovanteId})" title="Ver comprovante: ${f.comprovanteNome||''}">📎</button>`:''}
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();editarMovimentacao(${f.id})" title="Editar">✏️</button>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();excluirMovimentacao(${f.id})" title="Excluir">🗑️</button>
      </td>
    </tr>`).join('');
}

function editarMovimentacao(id) {
  const f = DB.find('financeiro', id);
  if (!f) return;
  populateSelect('mov-obra', DB.get('obras'), 'id', 'nome', 'Geral');
  document.getElementById('mov-modal-title').textContent = 'Editar Movimentação';
  document.getElementById('mov-edit-id').value = f.id;
  document.getElementById('mov-tipo').value = f.tipo;
  document.getElementById('mov-data').value = f.data;
  document.getElementById('mov-descricao').value = f.descricao;
  document.getElementById('mov-obra').value = f.obraId || '';
  populateSelect('mov-fornecedor', DB.KEYS.fornecedores ? DB.get('fornecedores') : [], 'id', 'razao', 'Nenhum');
  document.getElementById('mov-fornecedor').value = f.fornecedorId || '';
  if (typeof atualizarSelectsDeFornecedores === 'function') atualizarSelectsDeFornecedores();
  document.getElementById('mov-fornecedor').value = f.fornecedorId || '';
  document.getElementById('mov-categoria').value = f.categoria;
  document.getElementById('mov-valor').value = f.valor;
  document.getElementById('mov-status').value = f.status;
  document.getElementById('mov-obs').value = f.obs || '';
  openModal('nova-movimentacao');
  renderMovComprovantePreview();
}

let salvandoMovimentacao = false;

function salvarMovimentacao() {
  // Impede duplo clique gerando duplicidade de lançamentos.
  if (salvandoMovimentacao) return;
  const descricao = document.getElementById('mov-descricao').value.trim();
  const valor = converterValorMonetario(document.getElementById('mov-valor').value);
  const data = document.getElementById('mov-data').value;
  if (!ValidationService.required(descricao, 'Descrição')) return;
  if (!data || isNaN(new Date(data).getTime())) { showToast('Data é obrigatória.', 'error'); return; }
  if (!valor || valor <= 0) { showToast('Valor deve ser maior que zero.', 'error'); return; }
  const obraSelValue = document.getElementById('mov-obra').value;
  const obraId = obraSelValue ? parseInt(obraSelValue) : null;
  // Localiza a obra real pelo obraId em vez de confiar apenas no texto do
  // select, garantindo que obraNome fique sempre sincronizado.
  const obra = obraId ? obterObraPorId(obraId) : null;
  if (obraId && !obra) { showToast('Obra selecionada não foi encontrada.', 'error'); return; }
  const editId = parseInt(document.getElementById('mov-edit-id').value);
  const movAnteriorRef = editId ? DB.find('financeiro', editId) : null;
  const fornecedorSelValue = document.getElementById('mov-fornecedor')?.value || '';
  const fornecedorId = fornecedorSelValue ? parseInt(fornecedorSelValue) : null;
  const fornecedor = fornecedorId ? obterFornecedorPorId(fornecedorId) : null;
  if (fornecedorId && !fornecedor) { showToast('Fornecedor selecionado não foi encontrado.', 'error'); return; }
  // Resolve o comprovante: mantém o existente por padrão, cria um novo
  // documento se um arquivo foi selecionado, ou remove se solicitado.
  let comprovanteId = movAnteriorRef ? (movAnteriorRef.comprovanteId || null) : null;
  let comprovanteNome = movAnteriorRef ? (movAnteriorRef.comprovanteNome || '') : '';
  if (movComprovanteAtual === 'REMOVE') {
    comprovanteId = null;
    comprovanteNome = '';
  } else if (movComprovanteAtual && movComprovanteAtual.fileName) {
    const ext = movComprovanteAtual.fileName.split('.').pop().toLowerCase();
    const novoDoc = {
      nome: descricao, categoria: 'Financeiro', obraId, obraNome: obra ? obra.nome : 'Geral',
      versao: 'v1.0', status: 'Aprovado', tipo: ext,
      favorito: false, uploadAt: new Date().toISOString().split('T')[0],
      fileData: movComprovanteAtual.fileData, fileName: movComprovanteAtual.fileName,
      obs: 'Comprovante financeiro', responsavel: ''
    };
    const criado = DB.add('documentos', novoDoc);
    comprovanteId = criado.id;
    comprovanteNome = movComprovanteAtual.fileName;
  }
  const item = {
    tipo: normalizarTipoMovimentacao(document.getElementById('mov-tipo').value) || document.getElementById('mov-tipo').value,
    data, descricao, obraId, obraNome: obra ? obra.nome : 'Geral',
    categoria: document.getElementById('mov-categoria').value,
    valor, status: document.getElementById('mov-status').value,
    fornecedorId, fornecedorNome: fornecedor ? (fornecedor.fantasia || fornecedor.razao) : '',
    comprovanteId, comprovanteNome,
    obs: document.getElementById('mov-obs').value.trim()
  };
  salvandoMovimentacao = true;
  try {
    let obraIdAnterior = null;
    if (editId) {
      if (movAnteriorRef) obraIdAnterior = movAnteriorRef.obraId;
      DB.update('financeiro', editId, item);
      showToast('Movimentação atualizada!', 'success');
    }
    else {
      DB.add('financeiro', item);
      const avisoRecebimento = item.tipo === 'entrada' && item.status === 'Pago';
      showToast(avisoRecebimento ? `💰 Recebimento de ${FormatService.currency(item.valor)} registrado!` : 'Movimentação registrada!', 'success');
    }
    closeModal();
    movComprovanteAtual = null;
    if (obraIdAnterior !== null && String(obraIdAnterior) !== String(obraId)) {
      atualizarAposAlteracaoFinanceira(obraIdAnterior);
    }
    atualizarAposAlteracaoFinanceira(obraId);
  } finally {
    salvandoMovimentacao = false;
  }
}

function excluirMovimentacao(id) {
  const m = DB.find('financeiro', id);
  confirmAction('Excluir movimentação?', 'Esta ação não pode ser desfeita.', () => {
    const obraId = m ? m.obraId : null;
    DB.delete('financeiro', id);
    showToast('Movimentação excluída.', 'success');
    atualizarAposAlteracaoFinanceira(obraId);
  }, '🗑️');
}

// Atualização centralizada após criar, editar ou excluir uma movimentação
// financeira: recalcula e re-renderiza todas as telas que dependem de dados
// financeiros (obra, dashboard, painel completo), sem precisar recarregar a
// página e sem duplicar cálculos — tudo é derivado do DB.get('financeiro').
function atualizarAposAlteracaoFinanceira(obraId) {
  if (currentPage === 'obra-detalhe' && currentObraId) {
    renderObraDetalhe();
  } else if (currentPage === 'financeiro') {
    calcFinStats();
    filterFinanceiro();
  }
  if (typeof renderDashboard === 'function' && currentPage === 'dashboard') {
    renderDashboard();
  }
  if (typeof renderObras === 'function' && currentPage === 'obras') {
    renderObras();
  }
  if (typeof refreshPainelObraSeAberto === 'function') {
    refreshPainelObraSeAberto(obraId);
  }
}

function exportFinanceiro() {
  const fin = DB.get('financeiro');
  const csv = 'Data,Descrição,Obra,Categoria,Tipo,Valor,Status\n' + fin.map(f =>
    `"${FormatService.date(f.data)}","${f.descricao}","${f.obraNome||'Geral'}","${f.categoria}","${f.tipo}","${FormatService.currency(f.valor)}","${f.status}"`
  ).join('\n');
  downloadFile('financeiro_mbsolucoes.csv', csv, 'text/csv');
}

function novoItemParaObra(obraId) {
  const alvoObraId = obraId !== undefined ? obraId : currentObraId;
  openModal('novo-item-estoque');
  const sel = document.getElementById('est-obra');
  if (sel) {
    sel.value = alvoObraId;
    // Protege a obra durante o cadastro contextual: o item criado a partir
    // da tela da obra deve sempre pertencer a ela.
    sel.disabled = true;
  }
  // Garante que, ao salvar, a aba Estoque permaneça ativa na obra.
  obraDetalheAbaAtual = 'estoque';
}

