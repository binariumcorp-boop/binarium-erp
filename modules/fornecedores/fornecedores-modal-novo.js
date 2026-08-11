// ============================================================
// fornecedores-modal-novo.js
// FASE 2: MODAL NOVO FORNECEDOR
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== FASE 2: MODAL NOVO FORNECEDOR =====
function initModalNovoFornecedor() {
  if (document.getElementById('modal-novo-fornecedor')) return;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'modal-novo-fornecedor';
  modal.innerHTML = `<div class="modal modal-lg">
    <div class="modal-header"><h3 style="font-size:16px;font-weight:600" id="forn-modal-title">Novo Fornecedor</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <input type="hidden" id="forn-edit-id">
      <div class="form-row">
        <div class="form-group"><label class="form-label">Razão Social *</label><input class="form-input" id="forn-razao" placeholder="Razão social"></div>
        <div class="form-group"><label class="form-label">Nome Fantasia</label><input class="form-input" id="forn-fantasia" placeholder="Nome fantasia"></div>
      </div>
      <div class="form-row-3">
        <div class="form-group"><label class="form-label">CNPJ</label><input class="form-input" id="forn-cnpj" placeholder="00.000.000/0000-00"></div>
        <div class="form-group"><label class="form-label">CPF</label><input class="form-input" id="forn-cpf" placeholder="000.000.000-00"></div>
        <div class="form-group"><label class="form-label">Categoria</label><select class="form-input" id="forn-categoria"><option>Material</option><option>Serviço</option><option>Equipamento</option><option>Outros</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Nome do Contato</label><input class="form-input" id="forn-contato" placeholder="Pessoa de contato"></div>
        <div class="form-group"><label class="form-label">Telefone</label><input class="form-input" id="forn-tel" placeholder="(00) 00000-0000"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">WhatsApp</label><input class="form-input" id="forn-whatsapp" placeholder="(00) 00000-0000"></div>
        <div class="form-group"><label class="form-label">E-mail</label><input class="form-input" id="forn-email" type="email" placeholder="contato@empresa.com.br"></div>
      </div>
      <div class="form-group"><label class="form-label">Endereço</label><input class="form-input" id="forn-end" placeholder="Endereço completo"></div>
      <div class="form-row-3">
        <div class="form-group"><label class="form-label">Cidade</label><input class="form-input" id="forn-cidade" placeholder="Cidade"></div>
        <div class="form-group"><label class="form-label">Estado</label><input class="form-input" id="forn-estado" maxlength="2" style="text-transform:uppercase" placeholder="UF"></div>
        <div class="form-group"><label class="form-label">CEP</label><input class="form-input" id="forn-cep" placeholder="00000-000"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Condição de Pagamento</label><input class="form-input" id="forn-condicao" placeholder="Ex: 30/60/90, à vista..."></div>
        <div class="form-group"><label class="form-label">Prazo de Entrega (dias)</label><input class="form-input" id="forn-prazo" type="number" min="0" placeholder="0"></div>
      </div>
      <div class="form-group"><label class="form-label">Chave PIX</label><input class="form-input" id="forn-pix" placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Status</label><select class="form-input" id="forn-status"><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option></select></div>
        <div class="form-group"><label class="form-label">Avaliação</label><select class="form-input" id="forn-avaliacao"><option value="5">⭐⭐⭐⭐⭐ Excelente</option><option value="4">⭐⭐⭐⭐ Bom</option><option value="3">⭐⭐⭐ Regular</option><option value="2">⭐⭐ Ruim</option><option value="1">⭐ Péssimo</option></select></div>
      </div>
      <div class="form-group"><label class="form-label">Observações</label><textarea class="form-input" id="forn-obs" rows="2" placeholder="Observações..."></textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="salvarFornecedor()">💾 Salvar Fornecedor</button>
    </div>
  </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.body.appendChild(modal);
}

function filterFornecedores() {
  if (!DB.KEYS.fornecedores) DB.KEYS.fornecedores = 'gob_fornecedores';
  const search = normalizarTextoBusca(document.getElementById('forn-search')?.value || '');
  const searchDigits = somenteNumeros(document.getElementById('forn-search')?.value || '');
  const cat = document.getElementById('forn-filter-cat')?.value || '';
  const estado = document.getElementById('forn-filter-estado')?.value || '';
  const status = document.getElementById('forn-filter-status')?.value || '';
  let forns = DB.get('fornecedores');

  // Popula o filtro de estados dinamicamente com base nos fornecedores existentes,
  // preservando a opção selecionada.
  const selEstado = document.getElementById('forn-filter-estado');
  if (selEstado) {
    const estadosDisponiveis = Array.from(new Set(forns.map(f => (f.estado || '').toUpperCase()).filter(Boolean))).sort();
    const atual = selEstado.value;
    selEstado.innerHTML = '<option value="">Estado: Todos</option>' + estadosDisponiveis.map(uf => `<option value="${uf}">${uf}</option>`).join('');
    if (atual) selEstado.value = atual;
  }

  if (search) {
    forns = forns.filter(f =>
      normalizarTextoBusca(f.razao).includes(search) ||
      normalizarTextoBusca(f.fantasia).includes(search) ||
      normalizarTextoBusca(f.categoria).includes(search) ||
      normalizarTextoBusca(f.contato).includes(search) ||
      normalizarTextoBusca(f.cidade).includes(search) ||
      normalizarTextoBusca(f.estado).includes(search) ||
      normalizarTextoBusca(f.status).includes(search) ||
      normalizarTextoBusca(f.email).includes(search) ||
      normalizarTextoBusca(f.obs).includes(search) ||
      (searchDigits && (somenteNumeros(f.cnpj).includes(searchDigits) || somenteNumeros(f.cpf).includes(searchDigits) || somenteNumeros(f.tel).includes(searchDigits) || somenteNumeros(f.whatsapp).includes(searchDigits)))
    );
  }
  if (cat) forns = forns.filter(f => f.categoria === cat);
  if (estado) forns = forns.filter(f => (f.estado || '').toUpperCase() === estado);
  if (status) forns = forns.filter(f => f.status === status);

  const tbody = document.getElementById('forn-table-body');
  if (!tbody) return;
  if (forns.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray400);padding:20px">Nenhum fornecedor encontrado</td></tr>'; return; }
  tbody.innerHTML = forns.map(f => `<tr>
    <td><div style="font-weight:600;font-size:13px">${f.razao}</div><div style="font-size:11px;color:var(--gray400)">${f.fantasia||''}</div></td>
    <td style="font-size:12px">${f.cnpj || f.cpf || '-'}</td>
    <td><span class="badge badge-gray">${f.categoria}</span></td>
    <td style="font-size:12px">${f.tel||f.whatsapp||f.email||'-'}</td>
    <td><span class="badge ${f.status==='Ativo'?'badge-green':'badge-red'}">${f.status}</span></td>
    <td>
      <button class="btn btn-ghost btn-sm" onclick="verFornecedor(${f.id})" title="Ver Detalhes">👁️</button>
      <button class="btn btn-ghost btn-sm" onclick="editarFornecedor(${f.id})" title="Editar">✏️</button>
      <button class="btn btn-ghost btn-sm" onclick="excluirFornecedor(${f.id})" title="Excluir/Inativar">🗑️</button>
    </td>
  </tr>`).join('');
}

function clearFornFilter() {
  document.getElementById('forn-search').value = '';
  document.getElementById('forn-filter-cat').value = '';
  const selEstado = document.getElementById('forn-filter-estado'); if (selEstado) selEstado.value = '';
  const selStatus = document.getElementById('forn-filter-status'); if (selStatus) selStatus.value = '';
  filterFornecedores();
}

function editarFornecedor(id) {
  if (!DB.KEYS.fornecedores) DB.KEYS.fornecedores = 'gob_fornecedores';
  const f = DB.find('fornecedores', id);
  if (!f) return;
  document.getElementById('forn-modal-title').textContent = 'Editar Fornecedor';
  document.getElementById('forn-edit-id').value = f.id;
  document.getElementById('forn-razao').value = f.razao || '';
  document.getElementById('forn-fantasia').value = f.fantasia || '';
  document.getElementById('forn-cnpj').value = f.cnpj || '';
  document.getElementById('forn-cpf').value = f.cpf || '';
  document.getElementById('forn-categoria').value = f.categoria;
  document.getElementById('forn-contato').value = f.contato || '';
  document.getElementById('forn-tel').value = f.tel || '';
  document.getElementById('forn-whatsapp').value = f.whatsapp || '';
  document.getElementById('forn-email').value = f.email || '';
  document.getElementById('forn-end').value = f.end || '';
  document.getElementById('forn-cidade').value = f.cidade || '';
  document.getElementById('forn-estado').value = f.estado || '';
  document.getElementById('forn-cep').value = f.cep || '';
  document.getElementById('forn-condicao').value = f.condicaoPagamento || '';
  document.getElementById('forn-prazo').value = f.prazoEntrega || '';
  document.getElementById('forn-pix').value = f.pix || '';
  document.getElementById('forn-status').value = f.status || 'Ativo';
  document.getElementById('forn-avaliacao').value = f.avaliacao || '5';
  document.getElementById('forn-obs').value = f.obs || '';
  openModal('novo-fornecedor');
}

let salvandoFornecedor = false;

function salvarFornecedor() {
  // Impede duplo clique gerando cadastro duplicado.
  if (salvandoFornecedor) return;
  if (!DB.KEYS.fornecedores) DB.KEYS.fornecedores = 'gob_fornecedores';
  const razao = document.getElementById('forn-razao').value.trim();
  const fantasia = document.getElementById('forn-fantasia').value.trim();
  if (!razao && !fantasia) { showToast('Informe ao menos a Razão Social ou o Nome Fantasia.', 'error'); return; }

  const cnpj = document.getElementById('forn-cnpj').value.trim();
  const cpf = document.getElementById('forn-cpf').value.trim();
  const cnpjDigits = somenteNumeros(cnpj);
  const cpfDigits = somenteNumeros(cpf);
  if (cnpjDigits && cnpjDigits.length === 14 && !ValidationService.cnpj(cnpjDigits)) { showToast('CNPJ inválido.', 'error'); return; }
  if (cpfDigits && cpfDigits.length === 11 && !ValidationService.cpf(cpfDigits)) { showToast('CPF inválido.', 'error'); return; }

  const email = document.getElementById('forn-email').value.trim();
  if (email && !ValidationService.email(email)) { showToast('E-mail inválido.', 'error'); return; }

  const editId = parseInt(document.getElementById('forn-edit-id').value);
  const todosFornecedores = DB.get('fornecedores');

  // Impede CNPJ/CPF duplicado, comparando apenas os dígitos e ignorando o próprio registro em edição.
  if (cnpjDigits) {
    const duplicado = todosFornecedores.find(f => f.id !== editId && somenteNumeros(f.cnpj) === cnpjDigits);
    if (duplicado) { showToast(`Já existe um fornecedor com este CNPJ: ${duplicado.razao}.`, 'error'); return; }
  }
  if (cpfDigits) {
    const duplicado = todosFornecedores.find(f => f.id !== editId && somenteNumeros(f.cpf) === cpfDigits);
    if (duplicado) { showToast(`Já existe um fornecedor com este CPF: ${duplicado.razao}.`, 'error'); return; }
  }

  const status = document.getElementById('forn-status').value;
  const data = {
    razao: razao || fantasia, fantasia,
    cnpj, cpf, categoria: document.getElementById('forn-categoria').value,
    contato: document.getElementById('forn-contato').value.trim(),
    tel: document.getElementById('forn-tel').value.trim(),
    whatsapp: document.getElementById('forn-whatsapp').value.trim(),
    email,
    end: document.getElementById('forn-end').value.trim(),
    cidade: document.getElementById('forn-cidade').value.trim(),
    estado: document.getElementById('forn-estado').value.trim().toUpperCase(),
    cep: document.getElementById('forn-cep').value.trim(),
    condicaoPagamento: document.getElementById('forn-condicao').value.trim(),
    prazoEntrega: Math.max(0, parseInt(document.getElementById('forn-prazo').value) || 0),
    pix: document.getElementById('forn-pix').value.trim(),
    status, ativo: status === 'Ativo',
    avaliacao: document.getElementById('forn-avaliacao').value,
    obs: document.getElementById('forn-obs').value.trim()
  };

  salvandoFornecedor = true;
  try {
    let fornecedorId;
    if (editId) {
      DB.update('fornecedores', editId, data);
      fornecedorId = editId;
      showToast('Fornecedor atualizado!', 'success');
      ActivityLog.add('Editou fornecedor', 'Fornecedores', data.razao);
    } else {
      const novo = DB.add('fornecedores', data);
      fornecedorId = novo.id;
      showToast('Fornecedor cadastrado!', 'success');
      ActivityLog.add('Cadastrou fornecedor', 'Fornecedores', data.razao);
    }
    closeModal();
    atualizarAposAlteracaoDeFornecedor(fornecedorId);
  } finally {
    salvandoFornecedor = false;
  }
}

// Verifica se o fornecedor possui vínculos em Compras, Estoque ou Financeiro,
// usando sempre fornecedorId (nunca o nome) para a comparação.
function fornecedorPossuiVinculos(id) {
  const compras = DB.KEYS.compras ? DB.get('compras') : [];
  const estoque = DB.get('estoque');
  const financeiro = DB.get('financeiro');
  return {
    compras: compras.filter(c => String(c.fornecedorId) === String(id)).length,
    estoque: estoque.filter(e => String(e.fornecedorId) === String(id)).length,
    financeiro: financeiro.filter(m => String(m.fornecedorId) === String(id)).length
  };
}

function excluirFornecedor(id) {
  if (!DB.KEYS.fornecedores) DB.KEYS.fornecedores = 'gob_fornecedores';
  const f = DB.find('fornecedores', id);
  if (!f) return;
  const vinculos = fornecedorPossuiVinculos(id);
  const totalVinculos = vinculos.compras + vinculos.estoque + vinculos.financeiro;

  if (totalVinculos > 0) {
    // Preferir inativação quando houver histórico vinculado, preservando os
    // registros existentes em Compras/Estoque/Financeiro.
    confirmAction(
      'Fornecedor com vínculos',
      `"${f.razao}" possui ${vinculos.compras} compra(s), ${vinculos.estoque} item(ns) de estoque e ${vinculos.financeiro} movimentação(ões) financeira(s) vinculados. Por segurança, ele será inativado em vez de excluído, preservando todo o histórico.`,
      () => {
        DB.update('fornecedores', id, { status: 'Inativo', ativo: false });
        ActivityLog.add('Inativou fornecedor (possui vínculos)', 'Fornecedores', f.razao);
        showToast('Fornecedor inativado. Os vínculos existentes foram preservados.', 'success');
        atualizarAposAlteracaoDeFornecedor(id);
      }, '⚠️'
    );
    return;
  }

  confirmAction('Excluir fornecedor?', `"${f.razao}" será removido. Esta ação não pode ser desfeita.`, () => {
    DB.delete('fornecedores', id);
    ActivityLog.add('Excluiu fornecedor', 'Fornecedores', f.razao);
    showToast('Fornecedor excluído.', 'success');
    atualizarAposAlteracaoDeFornecedor(null);
  }, '🗑️');
}

// Completa a estrutura de fornecedores antigos sem alterar ou apagar dados
// existentes. Nunca reinicializa a base nem duplica registros.
function migrarDadosDeFornecedores() {
  if (!DB.KEYS.fornecedores) return;
  const fornecedores = DB.get('fornecedores');
  if (!fornecedores.length) return;
  let alterado = false;
  let nextId = fornecedores.length > 0 ? Math.max(...fornecedores.map(f => f.id || 0)) + 1 : 1;
  fornecedores.forEach(f => {
    if (f.id === undefined || f.id === null) { f.id = nextId++; alterado = true; }
    if (!f.razao) { f.razao = f.fantasia || f.nome || 'Fornecedor sem nome'; alterado = true; }
    if (f.fantasia === undefined) { f.fantasia = ''; alterado = true; }
    if (!f.status) { f.status = 'Ativo'; alterado = true; }
    if (f.ativo === undefined) { f.ativo = f.status !== 'Inativo'; alterado = true; }
    if (f.categoria === undefined) { f.categoria = 'Outros'; alterado = true; }
    if (f.createdAt === undefined) { f.createdAt = new Date().toISOString(); alterado = true; }
    if (f.updatedAt === undefined) { f.updatedAt = f.createdAt; alterado = true; }
  });
  if (alterado) DB.set('fornecedores', fornecedores);
}

// Preenche fornecedorId em registros antigos de Estoque/Financeiro que só
// possuem fornecedorNome, apenas quando há correspondência única e segura.
function migrarRelacionamentosDeFornecedores() {
  if (!DB.KEYS.fornecedores) return;
  const fornecedores = DB.get('fornecedores');

  const estoque = DB.get('estoque');
  let alterouEstoque = false;
  estoque.forEach(e => {
    if ((e.fornecedorId === undefined || e.fornecedorId === null || e.fornecedorId === '') && e.fornecedorNome) {
      const nomeAlvo = normalizarTextoBusca(e.fornecedorNome);
      const corresp = fornecedores.filter(f => normalizarTextoBusca(f.razao) === nomeAlvo || normalizarTextoBusca(f.fantasia) === nomeAlvo);
      if (corresp.length === 1) { e.fornecedorId = corresp[0].id; alterouEstoque = true; }
      else if (corresp.length > 1) console.warn(`Migração de estoque: mais de um fornecedor com o nome "${e.fornecedorNome}" — o item "${e.nome}" (id ${e.id}) não foi relacionado automaticamente.`);
    }
  });
  if (alterouEstoque) DB.set('estoque', estoque);

  const financeiro = DB.get('financeiro');
  let alterouFinanceiro = false;
  financeiro.forEach(m => {
    if ((m.fornecedorId === undefined || m.fornecedorId === null || m.fornecedorId === '') && m.fornecedorNome) {
      const nomeAlvo = normalizarTextoBusca(m.fornecedorNome);
      const corresp = fornecedores.filter(f => normalizarTextoBusca(f.razao) === nomeAlvo || normalizarTextoBusca(f.fantasia) === nomeAlvo);
      if (corresp.length === 1) { m.fornecedorId = corresp[0].id; alterouFinanceiro = true; }
      else if (corresp.length > 1) console.warn(`Migração financeira: mais de um fornecedor com o nome "${m.fornecedorNome}" — o lançamento "${m.descricao}" (id ${m.id}) não foi relacionado automaticamente.`);
    }
  });
  if (alterouFinanceiro) DB.set('financeiro', financeiro);
}

// Sincroniza o nome de exibição (fornecedorNome) em Compras, Estoque e
// Financeiro sempre que a razão social/nome fantasia do fornecedor mudar.
// Nunca altera fornecedorId nem qualquer outro dado dos registros relacionados.
function sincronizarNomeFornecedor(fornecedorId) {
  const fornecedor = obterFornecedorPorId(fornecedorId);
  if (!fornecedor) return;
  const nomeExibicao = fornecedor.fantasia || fornecedor.razao || '';

  let alterouCompras = false;
  if (DB.KEYS.compras) {
    const compras = DB.get('compras');
    compras.forEach(c => {
      if (String(c.fornecedorId) === String(fornecedorId) && c.fornecedorNome !== nomeExibicao) {
        c.fornecedorNome = nomeExibicao;
        alterouCompras = true;
      }
    });
    if (alterouCompras) DB.set('compras', compras);
  }

  let alterouEstoque = false;
  const estoque = DB.get('estoque');
  estoque.forEach(e => {
    if (String(e.fornecedorId) === String(fornecedorId) && e.fornecedorNome !== nomeExibicao) {
      e.fornecedorNome = nomeExibicao;
      alterouEstoque = true;
    }
  });
  if (alterouEstoque) DB.set('estoque', estoque);

  let alterouFinanceiro = false;
  const financeiro = DB.get('financeiro');
  financeiro.forEach(m => {
    if (String(m.fornecedorId) === String(fornecedorId) && m.fornecedorNome !== nomeExibicao) {
      m.fornecedorNome = nomeExibicao;
      alterouFinanceiro = true;
    }
  });
  if (alterouFinanceiro) DB.set('financeiro', financeiro);
}

// Atualiza todos os selects de fornecedor existentes no sistema (Compras,
// Estoque, Financeiro e filtros), mostrando apenas fornecedores ativos para
// novos cadastros, mas preservando o fornecedor inativo já selecionado.
function atualizarSelectsDeFornecedores() {
  const todos = DB.KEYS.fornecedores ? DB.get('fornecedores') : [];

  const montarLista = (selectId) => {
    const sel = document.getElementById(selectId);
    if (!sel) return null;
    const atualId = sel.value;
    let lista = todos.filter(f => f.status !== 'Inativo');
    if (atualId) {
      const atual = todos.find(f => String(f.id) === String(atualId));
      if (atual && !lista.some(f => String(f.id) === String(atual.id))) lista = lista.concat(atual);
    }
    return lista;
  };

  ['comp-fornecedor', 'est-fornecedor', 'mov-fornecedor'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const lista = montarLista(id);
    const atualId = sel.value;
    populateSelect(id, lista, 'id', 'razao', 'Selecione o fornecedor');
    if (atualId) sel.value = atualId;
  });

  const selFiltro = document.getElementById('compras-filter-forn');
  if (selFiltro) {
    const atualId = selFiltro.value;
    populateSelect('compras-filter-forn', todos, 'id', 'razao', 'Fornecedor: Todos');
    if (atualId) selFiltro.value = atualId;
  }
}

// Atualização centralizada disparada após criar, editar, inativar ou excluir
// um fornecedor. Chama apenas funções que já existem no sistema.
function atualizarAposAlteracaoDeFornecedor(fornecedorId) {
  if (typeof filterFornecedores === 'function') filterFornecedores();
  if (typeof atualizarSelectsDeFornecedores === 'function') atualizarSelectsDeFornecedores();
  if (fornecedorId && typeof sincronizarNomeFornecedor === 'function') sincronizarNomeFornecedor(fornecedorId);

  if (typeof renderCompras === 'function' && currentPage === 'compras') renderCompras();
  if (typeof calcEstoqueStats === 'function' && currentPage === 'estoque') { calcEstoqueStats(); filterEstoque(); }
  if (typeof calcFinStats === 'function' && currentPage === 'financeiro') { calcFinStats(); filterFinanceiro(); }
  if (currentPage === 'obra-detalhe' && typeof renderObraDetalhe === 'function') renderObraDetalhe();
  if (typeof renderDashboard === 'function' && currentPage === 'dashboard') renderDashboard();
  if (typeof renderRelatorios === 'function' && currentPage === 'relatorios') renderRelatorios();
}

