// ============================================================
// contratos.js
// CONTRATOS
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== CONTRATOS =====
function renderContratos() {
  const contratos = DB.get('contratos');
  const hoje = new Date();
  document.getElementById('stat-ct-total').textContent = contratos.length;
  document.getElementById('stat-ct-ativos').textContent = contratos.filter(c => c.status === 'Ativo').length;
  document.getElementById('stat-ct-vencer').textContent = contratos.filter(c => {
    if (!c.termino) return false;
    const diff = (new Date(c.termino) - hoje) / 86400000;
    return diff > 0 && diff <= 30;
  }).length;
  document.getElementById('stat-ct-vencidos').textContent = contratos.filter(c => c.status === 'Vencido').length;
  const totalValor = contratos.reduce((s, c) => s + (c.valor || 0), 0);
  document.getElementById('stat-ct-valor').textContent = FormatService.currency(totalValor);
  populateSelect('ct-obra', DB.get('obras'), 'id', 'nome', 'Geral');
  filterContratos();
}

function filterContratos() {
  const search = document.getElementById('contratos-search').value.toLowerCase();
  const status = document.getElementById('contratos-filter-status').value;
  let contratos = DB.get('contratos');
  if (search) contratos = contratos.filter(c => c.numero.toLowerCase().includes(search) || c.fornecedor.toLowerCase().includes(search) || (c.objeto||'').toLowerCase().includes(search));
  if (status) contratos = contratos.filter(c => c.status === status);
  renderContratosTable(contratos);
}

function clearContratosFilter() {
  document.getElementById('contratos-search').value = '';
  document.getElementById('contratos-filter-status').value = '';
  filterContratos();
}

function renderContratosTable(contratos) {
  const tbody = document.getElementById('contratos-table-body');
  if (contratos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray400);padding:20px">Nenhum contrato encontrado</td></tr>';
    return;
  }
  tbody.innerHTML = contratos.map(c => `
    <tr style="cursor:pointer" onclick="showContratoDetail(${c.id})">
      <td><div style="font-weight:600;font-size:12px">${c.numero}</div><div style="font-size:10px;color:var(--gray400)">${c.categoria}</div></td>
      <td><div style="font-size:12px;font-weight:600">${c.fornecedor}</div><div style="font-size:10px;color:var(--gray400)">${c.objeto||''}</div></td>
      <td style="font-weight:600;font-size:12px">${FormatService.currency(c.valor)}</td>
      <td><span class="badge ${badgeClass(c.status)}">${c.status}</span></td>
      <td style="font-size:11px;color:${c.status==='Vencido'?'var(--red)':'inherit'}">${FormatService.date(c.termino)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();editarContrato(${c.id})">✏️</button>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();excluirContrato(${c.id})">🗑️</button>
      </td>
    </tr>`).join('');
}

function showContratoDetail(id) {
  const c = DB.find('contratos', id);
  if (!c) return;
  const hoje = new Date();
  const diasRestantes = c.termino ? Math.round((new Date(c.termino) - hoje) / 86400000) : null;
  const execPct = c.valor > 0 ? Math.round((c.valorExecutado || 0) / c.valor * 100) : 0;
  document.getElementById('contrato-detail-panel').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div style="font-size:13px;font-weight:600">Detalhes do Contrato</div>
      <span class="badge ${badgeClass(c.status)}">${c.status}</span>
    </div>
    <div style="font-size:14px;font-weight:700;margin-bottom:4px">${c.numero}</div>
    <div style="font-size:11px;color:var(--gray400);margin-bottom:14px">${c.categoria}</div>
    <div style="font-size:12px;font-weight:600;margin-bottom:6px">Fornecedor</div>
    <div style="padding:10px;background:var(--gray50);border-radius:8px;margin-bottom:14px">
      <div style="font-size:13px;font-weight:600">${c.fornecedor}</div>
      <div style="font-size:11px;color:var(--gray400)">CNPJ: ${c.cnpj||'-'}</div>
    </div>
    <div style="font-size:12px;font-weight:600;margin-bottom:8px">Resumo Financeiro</div>
    <div style="display:flex;flex-direction:column;gap:6px;font-size:12px;margin-bottom:14px">
      <div style="display:flex;justify-content:space-between"><span style="color:var(--gray400)">Valor Contratado:</span><span style="font-weight:600">${FormatService.currency(c.valor)}</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--
gray400)">Valor Executado:</span><span style="font-weight:600">${FormatService.currency(c.valorExecutado||0)} (${execPct}%)</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--gray400)">A Executar:</span><span style="font-weight:600">${FormatService.currency((c.valor||0)-(c.valorExecutado||0))}</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--gray400)">Forma:</span><span>${c.pagamento||'-'}</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--gray400)">Prazo:</span><span>${FormatService.date(c.inicio)} a ${FormatService.date(c.termino)}</span></div>
      ${diasRestantes !== null ? `<div style="display:flex;justify-content:space-between"><span style="color:var(--gray400)">Prazo Restante:</span><span style="color:${diasRestantes<0?'var(--red)':diasRestantes<30?'var(--amber)':'inherit'};font-weight:600">${diasRestantes<0?'Vencido há '+Math.abs(diasRestantes)+' dias':diasRestantes+' dias'}</span></div>` : ''}
    </div>
    <div class="prog-bar mb-12" style="margin-bottom:12px"><div class="prog-fill prog-blue" style="width:${execPct}%"></div></div>
    <button class="btn btn-primary" style="width:100%;font-size:12px" onclick="editarContrato(${c.id})">✏️ Editar Contrato</button>`;
}

function editarContrato(id) {
  const c = DB.find('contratos', id);
  if (!c) return;
  populateSelect('ct-obra', DB.get('obras'), 'id', 'nome', 'Geral');
  document.getElementById('ct-modal-title').textContent = 'Editar Contrato';
  document.getElementById('ct-edit-id').value = c.id;
  document.getElementById('ct-numero').value = c.numero;
  document.getElementById('ct-categoria').value = c.categoria;
  document.getElementById('ct-fornecedor').value = c.fornecedor;
  document.getElementById('ct-cnpj').value = c.cnpj || '';
  document.getElementById('ct-objeto').value = c.objeto || '';
  document.getElementById('ct-obra').value = c.obraId || '';
  document.getElementById('ct-pagamento').value = c.pagamento || 'Medido';
  document.getElementById('ct-valor').value = c.valor;
  document.getElementById('ct-status').value = c.status;
  document.getElementById('ct-inicio').value = c.inicio || '';
  document.getElementById('ct-termino').value = c.termino || '';
  openModal('novo-contrato');
}

// Atualização centralizada após criar, editar, excluir ou alterar a execução
// (parcelas, aditivos, reajustes, garantias) de um contrato: reutiliza as
// telas já existentes, verificando sua existência antes de chamar, e nunca
// redireciona o usuário para fora da página em que ele já estava.
function atualizarAposAlteracaoDeContrato(obraId) {
  if (currentPage === 'contratos' && typeof renderContratos === 'function') renderContratos();
  if (currentPage === 'obra-detalhe' && currentObraId && typeof renderObraDetalhe === 'function') renderObraDetalhe();
  if (currentPage === 'dashboard' && typeof renderDashboard === 'function') renderDashboard();
  if (currentPage === 'fornecedores' && typeof renderFornecedores === 'function') renderFornecedores();
}

function salvarContrato() {
  // Impede que um duplo clique (ou o Enter acionando o listener duas vezes)
  // cadastre ou atualize o mesmo contrato mais de uma vez.
  if (salvarContrato._processing) return;

  const numero = document.getElementById('ct-numero').value.trim();
  const fornecedor = document.getElementById('ct-fornecedor').value.trim();
  const valorRaw = document.getElementById('ct-valor').value;
  const valor = parseFloat(String(valorRaw).replace(',', '.')) || 0;
  if (!ValidationService.required(numero, 'Número do contrato')) return;
  if (!ValidationService.required(fornecedor, 'Fornecedor')) return;
  if (valor < 0) { showToast('O valor do contrato não pode ser negativo.', 'error'); return; }

  const editId = parseInt(document.getElementById('ct-edit-id').value);
  const inicio = document.getElementById('ct-inicio').value;
  const termino = document.getElementById('ct-termino').value;
  if (inicio && termino && criarDataLocal(inicio) && criarDataLocal(termino) && diferencaEmDias(inicio, termino) < 0) {
    showToast('A data de término não pode ser anterior à data de início.', 'error');
    return;
  }

  const obraId = parseInt(document.getElementById('ct-obra').value) || null;
  const obra = obraId ? DB.find('obras', obraId) : null;
  const anterior = editId ? DB.find('contratos', editId) : null;
  const data = {
    numero, categoria: document.getElementById('ct-categoria').value,
    fornecedor, cnpj: document.getElementById('ct-cnpj').value.trim(),
    objeto: document.getElementById('ct-objeto').value.trim(),
    obraId, obraNome: obra ? obra.nome : '',
    pagamento: document.getElementById('ct-pagamento').value,
    valor, valorExecutado: anterior?.valorExecutado || 0,
    status: document.getElementById('ct-status').value,
    inicio, termino
  };

  salvarContrato._processing = true;
  try {
    let obraIdAnterior = null;
    if (editId) {
      if (anterior) obraIdAnterior = anterior.obraId;
      DB.update('contratos', editId, data);
      ActivityLog.add('Editou contrato', 'Contratos', numero);
      showToast('Contrato atualizado!', 'success');
    } else {
      DB.add('contratos', data);
      ActivityLog.add('Cadastrou contrato', 'Contratos', numero);
      showToast('Contrato cadastrado!', 'success');
    }
    closeModal();
    if (obraIdAnterior !== null && String(obraIdAnterior) !== String(obraId)) {
      atualizarAposAlteracaoDeContrato(obraIdAnterior);
    }
    atualizarAposAlteracaoDeContrato(obraId);
  } finally {
    setTimeout(() => { salvarContrato._processing = false; }, 400);
  }
}

function excluirContrato(id) {
  const c = DB.find('contratos', id);
  if (!c) { showToast('Contrato não encontrado.', 'error'); return; }

  // Verifica vínculos reais antes de excluir: parcelas, aditivos, reajustes
  // e garantia já registrados para este contrato. Havendo vínculo, orienta o
  // cancelamento (via status) em vez de excluir silenciosamente.
  const parcelas = obterParcelasDoContrato(c.id);
  const aditivos = obterAditivosDoContrato(c.id);
  const reajustes = obterReajustesDoContrato(c.id);
  const garantia = obterGarantiaDoContrato(c.id);
  const temVinculos = parcelas.length > 0 || aditivos.length > 0 || reajustes.length > 0 || !!garantia;

  if (temVinculos) {
    confirmAction(
      'Contrato possui registros vinculados',
      `"${c.numero}" possui ${parcelas.length} parcela(s), ${aditivos.length} aditivo(s), ${reajustes.length} reajuste(s)${garantia ? ' e garantia registrada' : ''}. Recomenda-se cancelar o contrato em vez de excluí-lo. Deseja cancelar o contrato agora?`,
      () => {
        DB.update('contratos', id, { status: 'Encerrado' });
        ActivityLog.add('Cancelou/encerrou contrato (possui vínculos)', 'Contratos', c.numero);
        showToast('Contrato marcado como Encerrado.', 'success');
        atualizarAposAlteracaoDeContrato(c.obraId);
      },
      '⚠️'
    );
    return;
  }

  confirmAction('Excluir contrato?', `"${c.numero}" será removido.`, () => {
    DB.delete('contratos', id);
    ActivityLog.add('Excluiu contrato', 'Contratos', c.numero);
    showToast('Contrato excluído.', 'success');
    atualizarAposAlteracaoDeContrato(c.obraId);
  }, '🗑️');
}

