// ============================================================
// aditivos.js
// FASE 3 (3): ADITIVOS DE OBRA + CONTRATOS ETAPA 10
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

// 3. ADITIVOS DE OBRA (CONTRATOS)
// =====================================================================
function ensureAditivoModal() {
  if (document.getElementById('modal-aditivo')) return;
  const div = document.createElement('div');
  div.className = 'modal-overlay';
  div.id = 'modal-aditivo';
  div.addEventListener('click', e => { if (e.target === div) closeModal(); });
  div.innerHTML = `
    <div class="modal" style="max-width:480px">
      <div class="modal-header"><h3 style="font-size:16px;font-weight:700">Novo Aditivo Contratual</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
      <input type="hidden" id="adt-contrato-id">
      <div class="form-group"><label class="form-label">Tipo de Aditivo</label>
        <select class="form-input" id="adt-tipo" onchange="toggleAditivoCampos()">
          <option value="Valor">Aditivo de Valor</option>
          <option value="Prazo">Aditivo de Prazo</option>
          <option value="Escopo">Aditivo de Escopo</option>
        </select>
      </div>
      <div class="form-group" id="adt-campo-valor"><label class="form-label">Valor Adicional (R$)</label><input type="number" class="form-input" id="adt-valor" step="0.01" placeholder="0,00"></div>
      <div class="form-group" id="adt-campo-prazo" style="display:none"><label class="form-label">Novo Prazo Final</label><input type="date" class="form-input" id="adt-prazo"></div>
      <div class="form-group"><label class="form-label">Data do Aditivo</label><input type="date" class="form-input" id="adt-data"></div>
      <div class="form-group"><label class="form-label">Justificativa</label><textarea class="form-input" id="adt-justificativa" rows="3" placeholder="Motivo do aditivo..."></textarea></div>
      <button class="btn btn-primary" style="width:100%" onclick="salvarAditivo()">Salvar Aditivo</button>
    </div>`;
  document.body.appendChild(div);
}
function toggleAditivoCampos() {
  const tipo = document.getElementById('adt-tipo').value;
  document.getElementById('adt-campo-valor').style.display = tipo === 'Valor' ? 'block' : 'none';
  document.getElementById('adt-campo-prazo').style.display = tipo === 'Prazo' ? 'block' : 'none';
}
function abrirNovoAditivo(contratoId) {
  ensureAditivoModal();
  document.getElementById('adt-contrato-id').value = contratoId;
  document.getElementById('adt-tipo').value = 'Valor';
  document.getElementById('adt-valor').value = '';
  document.getElementById('adt-prazo').value = '';
  document.getElementById('adt-data').value = new Date().toISOString().split('T')[0];
  document.getElementById('adt-justificativa').value = '';
  toggleAditivoCampos();
  openModal('aditivo');
}
function salvarAditivo() {
  const contratoId = parseInt(document.getElementById('adt-contrato-id').value);
  const c = DB.find('contratos', contratoId);
  if (!c) return;
  const tipo = document.getElementById('adt-tipo').value;
  const justificativa = document.getElementById('adt-justificativa').value.trim();
  if (!ValidationService.required(justificativa, 'Justificativa')) return;
  const data = {
    contratoId, contratoNumero: c.numero, tipo,
    valorAdicional: tipo === 'Valor' ? (parseFloat(document.getElementById('adt-valor').value) || 0) : 0,
    novoPrazo: tipo === 'Prazo' ? document.getElementById('adt-prazo').value : null,
    justificativa,
    data: document.getElementById('adt-data').value || new Date().toISOString().split('T')[0]
  };
  DB.add('aditivos', data);
  if (tipo === 'Valor' && data.valorAdicional) {
    DB.update('contratos', contratoId, { valor: (c.valor || 0) + data.valorAdicional });
  } else if (tipo === 'Prazo' && data.novoPrazo) {
    DB.update('contratos', contratoId, { termino: data.novoPrazo });
  }
  if (typeof ActivityLog !== 'undefined') ActivityLog.add('Cadastrou aditivo', 'Contratos', c.numero);
  showToast('Aditivo registrado com sucesso!', 'success');
  closeModal();
  showContratoDetail(contratoId);
  renderContratos();
}
function excluirAditivo(id, contratoId) {
  confirmAction('Excluir aditivo?', 'Este aditivo será removido do histórico do contrato.', () => {
    DB.delete('aditivos', id);
    showToast('Aditivo excluído.', 'success');
    showContratoDetail(contratoId);
  }, '🗑️');
}

// Sobrescreve o painel de detalhes do contrato para incluir Aditivos
window.showContratoDetail = function(id) {
  const c = DB.find('contratos', id);
  if (!c) return;
  const hoje = new Date();
  const diasRestantes = c.termino ? Math.round((new Date(c.termino) - hoje) / 86400000) : null;
  const execPct = c.valor > 0 ? Math.round((c.valorExecutado || 0) / c.valor * 100) : 0;
  const aditivos = (DB.get('aditivos') || []).filter(a => a.contratoId === c.id);
  const totalAditivado = aditivos.filter(a => a.tipo === 'Valor').reduce((s, a) => s + (a.valorAdicional || 0), 0);

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
      <div style="display:flex;justify-content:space-between"><span style="color:var(--gray400)">Valor Contratado (atual):</span><span style="font-weight:600">${FormatService.currency(c.valor)}</span></div>
      ${totalAditivado ? `<div style="display:flex;justify-content:space-between"><span style="color:var(--gray400)">Inclui aditivos:</span><span style="font-weight:600;color:var(--amber)">+ ${FormatService.currency(totalAditivado)}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between"><span style="color:var(--gray400)">Valor Executado:</span><span style="font-weight:600">${FormatService.currency(c.valorExecutado||0)} (${execPct}%)</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--gray400)">A Executar:</span><span style="font-weight:600">${FormatService.currency((c.valor||0)-(c.valorExecutado||0))}</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--gray400)">Forma:</span><span>${c.pagamento||'-'}</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--gray400)">Prazo:</span><span>${FormatService.date(c.inicio)} a ${FormatService.date(c.termino)}</span></div>
      ${diasRestantes !== null ? `<div style="display:flex;justify-content:space-between"><span style="color:var(--gray400)">Prazo Restante:</span><span style="color:${diasRestantes<0?'var(--red)':diasRestantes<30?'var(--amber)':'inherit'};font-weight:600">${diasRestantes<0?'Vencido há '+Math.abs(diasRestantes)+' dias':diasRestantes+' dias'}</span></div>` : ''}
    </div>
    <div class="prog-bar mb-12" style="margin-bottom:12px"><div class="prog-fill prog-blue" style="width:${execPct}%"></div></div>
    <button class="btn btn-primary" style="width:100%;font-size:12px;margin-bottom:16px" onclick="editarContrato(${c.id})">✏️ Editar Contrato</button>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-size:12px;font-weight:600">Aditivos (${aditivos.length})</div>
      <button class="btn btn-ghost btn-sm" onclick="abrirNovoAditivo(${c.id})">+ Aditivo</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${aditivos.length ? aditivos.map(a => `
        <div style="padding:8px;background:var(--gray50);border-radius:8px;font-size:11px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:600">${a.tipo === 'Valor' ? '💰' : a.tipo === 'Prazo' ? '📅' : '📋'} Aditivo de ${a.tipo}</span>
            <button class="btn btn-ghost btn-sm" style="padding:2px 6px" onclick="excluirAditivo(${a.id},${c.id})">🗑️</button>
          </div>
          ${a.tipo === 'Valor' ? `<div>Valor adicional: ${FormatService.currency(a.valorAdicional)}</div>` : ''}
          ${a.tipo === 'Prazo' ? `<div>Novo prazo: ${FormatService.date(a.novoPrazo)}</div>` : ''}
          <div style="color:var(--gray400)">${FormatService.date(a.data)} — ${a.justificativa}</div>
        </div>`).join('') : `<div style="font-size:11px;color:var(--gray400)">Nenhum aditivo registrado.</div>`}
    </div>`;
};

// =====================================================================
// 3b. CONTRATOS — ETAPA 10 (Vigência, Parcelas, Reajustes, Garantias,
// Indicadores, Alertas, Histórico, Migração)
// =====================================================================

// Registra as novas chaves de armazenamento seguindo o mesmo padrão já
// usado por Compras/Fornecedores/Aditivos: só cria a chave se ainda não
// existir, sem jamais reinicializar dados já gravados.
if (!DB.KEYS.parcelas) DB.KEYS.parcelas = 'gob_parcelas';
if (!DB.KEYS.reajustes) DB.KEYS.reajustes = 'gob_reajustes';
if (!DB.KEYS.garantias) DB.KEYS.garantias = 'gob_garantias';

// ---- Funções centrais de acesso (fonte única de verdade) ----
function obterContratos() { return DB.get('contratos') || []; }
function obterContratoPorId(id) {
  if (id === null || id === undefined || id === '') return null;
  return obterContratos().find(c => String(c.id) === String(id)) || null;
}
function obterParcelasDoContrato(contratoId) {
  return (DB.KEYS.parcelas ? DB.get('parcelas') : []).filter(p => String(p.contratoId) === String(contratoId));
}
function obterAditivosDoContrato(contratoId) {
  return (DB.KEYS.aditivos ? DB.get('aditivos') : []).filter(a => String(a.contratoId) === String(contratoId));
}
function obterReajustesDoContrato(contratoId) {
  return (DB.KEYS.reajustes ? DB.get('reajustes') : []).filter(r => String(r.contratoId) === String(contratoId));
}
function obterGarantiaDoContrato(contratoId) {
  return (DB.KEYS.garantias ? DB.get('garantias') : []).find(g => String(g.contratoId) === String(contratoId)) || null;
}

// Status calculado da parcela: não depende só do campo salvo, evita
// diferenças de fuso horário usando o parser local já usado no Cronograma.
function statusCalculadoParcela(p) {
  if (!p) return '';
  if (p.status === 'Paga' || p.status === 'Cancelada') return p.status;
  const venc = criarDataLocal(p.vencimento);
  const hoje = criarDataLocal(formatarDataLocalISO(new Date()));
  if (venc && hoje && venc < hoje) return 'Atrasada';
  return 'Aberta';
}

// Dias restantes/vencidos de vigência do contrato, sem gerar NaN/Invalid Date.
function calcularVigenciaContrato(c) {
  if (!c || !c.termino) return { diasRestantes: null, vencido: false };
  const fim = criarDataLocal(c.termino);
  if (!fim) return { diasRestantes: null, vencido: false };
  const hoje = criarDataLocal(formatarDataLocalISO(new Date()));
  const dias = diferencaEmDias(formatarDataLocalISO(hoje), formatarDataLocalISO(fim));
  return { diasRestantes: dias, vencido: dias < 0 };
}

// ---- Migração final: normaliza registros antigos sem apagar nada ----
function migrarContratosFinal() {
  const contratos = obterContratos();
  let alterado = false;
  contratos.forEach(c => {
    if (c.valorExecutado === undefined || c.valorExecutado === null) { c.valorExecutado = 0; alterado = true; }
    if (typeof c.valor !== 'number' || Number.isNaN(c.valor)) { c.valor = parseFloat(c.valor) || 0; alterado = true; }
    if (!c.status) { c.status = 'Ativo'; alterado = true; }
    if (!c.createdAt) { c.createdAt = new Date().toISOString(); alterado = true; }
    if (!c.updatedAt) { c.updatedAt = c.createdAt; alterado = true; }
  });
  if (alterado) DB.set('contratos', contratos);

  if (DB.KEYS.parcelas) {
    const parcelas = DB.get('parcelas');
    let alteradoP = false;
    parcelas.forEach(p => {
      if (typeof p.valor !== 'number' || Number.isNaN(p.valor)) { p.valor = parseFloat(p.valor) || 0; alteradoP = true; }
      if (!p.status) { p.status = 'Aberta'; alteradoP = true; }
    });
    if (alteradoP) DB.set('parcelas', parcelas);
  }
}

// ---- PARCELAS ----
function ensureParcelaModal() {
  if (document.getElementById('modal-parcela')) return;
  const div = document.createElement('div');
  div.className = 'modal-overlay';
  div.id = 'modal-parcela';
  div.addEventListener('click', e => { if (e.target === div) closeModal(); });
  div.innerHTML = `
    <div class="modal" style="max-width:420px">
      <div class="modal-header"><h3 style="font-size:16px;font-weight:700">Nova Parcela</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
      <input type="hidden" id="parc-contrato-id">
      <div class="form-group"><label class="form-label">Vencimento</label><input type="date" class="form-input" id="parc-vencimento"></div>
      <div class="form-group"><label class="form-label">Valor (R$)</label><input type="number" class="form-input" id="parc-valor" step="0.01" min="0" placeholder="0,00"></div>
      <button class="btn btn-primary" style="width:100%" onclick="salvarParcela()">Salvar Parcela</button>
    </div>`;
  document.body.appendChild(div);
}
function abrirNovaParcela(contratoId) {
  ensureParcelaModal();
  document.getElementById('parc-contrato-id').value = contratoId;
  document.getElementById('parc-vencimento').value = '';
  document.getElementById('parc-valor').value = '';
  openModal('parcela');
}
function salvarParcela() {
  if (salvarParcela._processing) return;
  const contratoId = parseInt(document.getElementById('parc-contrato-id').value);
  const c = obterContratoPorId(contratoId);
  if (!c) { showToast('Contrato não encontrado.', 'error'); return; }
  const vencimento = document.getElementById('parc-vencimento').value;
  const valor = parseFloat(String(document.getElementById('parc-valor').value).replace(',', '.')) || 0;
  if (!vencimento || !criarDataLocal(vencimento)) { showToast('Informe um vencimento válido.', 'error'); return; }
  if (valor <= 0) { showToast('O valor da parcela deve ser maior que zero.', 'error'); return; }

  salvarParcela._processing = true;
  try {
    const existentes = obterParcelasDoContrato(contratoId);
    DB.add('parcelas', {
      contratoId, contratoNumero: c.numero,
      numero: existentes.length + 1,
      vencimento, valor, status: 'Aberta', financeiroId: null
    });
    ActivityLog.add('Cadastrou parcela', 'Contratos', `${c.numero} – parcela ${existentes.length + 1}`);
    showToast('Parcela cadastrada!', 'success');
    closeModal();
    showContratoDetail(contratoId);
    atualizarAposAlteracaoDeContrato(c.obraId);
  } finally {
    setTimeout(() => { salvarParcela._processing = false; }, 400);
  }
}
function excluirParcela(id, contratoId) {
  const p = (DB.get('parcelas') || []).find(x => x.id === id);
  if (!p) return;
  if (p.financeiroId) {
    showToast('Esta parcela já gerou um lançamento no Financeiro e não pode ser excluída. Cancele-a em vez disso.', 'error');
    return;
  }
  confirmAction('Excluir parcela?', `A parcela nº ${p.numero} será removida.`, () => {
    DB.delete('parcelas', id);
    ActivityLog.add('Excluiu parcela', 'Contratos', `${p.contratoNumero || ''} – parcela ${p.numero}`);
    showToast('Parcela excluída.', 'success');
    showContratoDetail(contratoId);
    atualizarAposAlteracaoDeContrato(obterContratoPorId(contratoId)?.obraId);
  }, '🗑️');
}
// Marca a parcela como paga e gera automaticamente o lançamento no
// Financeiro, vinculado por financeiroId — nunca duplica o lançamento.
function pagarParcela(id, contratoId) {
  const parcelas = DB.get('parcelas') || [];
  const p = parcelas.find(x => x.id === id);
  const c = obterContratoPorId(contratoId);
  if (!p || !c) { showToast('Registro não encontrado.', 'error'); return; }
  if (p.financeiroId) { showToast('Esta parcela já foi paga.', 'error'); return; }
  confirmAction('Confirmar pagamento da parcela?', `Será criada uma saída de ${FormatService.currency(p.valor)} no Financeiro.`, () => {
    const lancamento = DB.add('financeiro', {
      tipo: 'saida', data: new Date().toISOString().split('T')[0],
      descricao: `Contrato ${c.numero} – parcela ${p.numero}`,
      obraId: c.obraId || null, obraNome: c.obraNome || 'Geral',
      categoria: 'Contrato', valor: p.valor, status: 'Pago',
      fornecedorId: c.fornecedorId || null, fornecedorNome: c.fornecedor || '',
      contratoId: c.id
    });
    DB.update('parcelas', id, { status: 'Paga', financeiroId: lancamento.id });
    DB.update('contratos', c.id, { valorExecutado: (c.valorExecutado || 0) + p.valor });
    ActivityLog.add('Registrou pagamento de parcela', 'Contratos', `${c.numero} – parcela ${p.numero}`);
    showToast('Parcela paga e lançada no Financeiro!', 'success');
    showContratoDetail(contratoId);
    atualizarAposAlteracaoDeContrato(c.obraId);
    if (typeof calcFinStats === 'function') calcFinStats();
  }, '💰');
}

// ---- REAJUSTES ----
function ensureReajusteModal() {
  if (document.getElementById('modal-reajuste')) return;
  const div = document.createElement('div');
  div.className = 'modal-overlay';
  div.id = 'modal-reajuste';
  div.addEventListener('click', e => { if (e.target === div) closeModal(); });
  div.innerHTML = `
    <div class="modal" style="max-width:420px">
      <div class="modal-header"><h3 style="font-size:16px;font-weight:700">Novo Reajuste</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
      <input type="hidden" id="reaj-contrato-id">
      <div class="form-group"><label class="form-label">Índice</label>
        <select class="form-input" id="reaj-indice"><option>INCC</option><option>IGP-M</option><option>IPCA</option><option>Outro</option></select>
      </div>
      <div class="form-group"><label class="form-label">Percentual (%)</label><input type="number" class="form-input" id="reaj-percentual" step="0.01" placeholder="0,00"></div>
      <div class="form-group"><label class="form-label">Data</label><input type="date" class="form-input" id="reaj-data"></div>
      <button class="btn btn-primary" style="width:100%" onclick="salvarReajuste()">Aplicar Reajuste</button>
    </div>`;
  document.body.appendChild(div);
}
function abrirNovoReajuste(contratoId) {
  ensureReajusteModal();
  document.getElementById('reaj-contrato-id').value = contratoId;
  document.getElementById('reaj-percentual').value = '';
  document.getElementById('reaj-data').value = new Date().toISOString().split('T')[0];
  openModal('reajuste');
}
// Um reajuste sempre soma ao histórico; jamais sobrescreve reajustes
// anteriores. O valor vigente do contrato passa a refletir o valor
// reajustado, mas o registro anterior permanece intacto em 'reajustes'.
function salvarReajuste() {
  if (salvarReajuste._processing) return;
  const contratoId = parseInt(document.getElementById('reaj-contrato-id').value);
  const c = obterContratoPorId(contratoId);
  if (!c) { showToast('Contrato não encontrado.', 'error'); return; }
  const percentual = parseFloat(String(document.getElementById('reaj-percentual').value).replace(',', '.'));
  if (!percentual || Number.isNaN(percentual)) { showToast('Informe um percentual de reajuste válido.', 'error'); return; }
  const data = document.getElementById('reaj-data').value || new Date().toISOString().split('T')[0];
  const valorAnterior = c.valor || 0;
  const valorReajustado = Math.round(valorAnterior * (1 + percentual / 100) * 100) / 100;

  salvarReajuste._processing = true;
  try {
    DB.add('reajustes', {
      contratoId, contratoNumero: c.numero,
      indice: document.getElementById('reaj-indice').value,
      percentual, valorAnterior, valorReajustado, data
    });
    DB.update('contratos', contratoId, { valor: valorReajustado });
    ActivityLog.add('Aplicou reajuste', 'Contratos', `${c.numero} – ${percentual}%`);
    showToast('Reajuste aplicado!', 'success');
    closeModal();
    showContratoDetail(contratoId);
    atualizarAposAlteracaoDeContrato(c.obraId);
  } finally {
    setTimeout(() => { salvarReajuste._processing = false; }, 400);
  }
}
function excluirReajuste(id, contratoId) {
  confirmAction('Excluir reajuste do histórico?', 'O valor atual do contrato não será revertido automaticamente; ajuste manualmente se necessário.', () => {
    DB.delete('reajustes', id);
    ActivityLog.add('Excluiu reajuste', 'Contratos', 'Contrato #' + contratoId);
    showToast('Reajuste removido do histórico.', 'success');
    showContratoDetail(contratoId);
  }, '🗑️');
}

// ---- GARANTIAS (um registro por contrato — criar ou atualizar) ----
function ensureGarantiaModal() {
  if (document.getElementById('modal-garantia')) return;
  const div = document.createElement('div');
  div.className = 'modal-overlay';
  div.id = 'modal-garantia';
  div.addEventListener('click', e => { if (e.target === div) closeModal(); });
  div.innerHTML = `
    <div class="modal" style="max-width:420px">
      <div class="modal-header"><h3 style="font-size:16px;font-weight:700">Garantia Contratual</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
      <input type="hidden" id="gar-contrato-id">
      <div class="form-group"><label class="form-label">Tipo</label>
        <select class="form-input" id="gar-tipo"><option>Caução</option><option>Seguro-Garantia</option><option>Fiança Bancária</option><option>Outra</option></select>
      </div>
      <div class="form-group"><label class="form-label">Percentual (%)</label><input type="number" class="form-input" id="gar-percentual" step="0.01" placeholder="0,00"></div>
      <div class="form-group"><label class="form-label">Valor (R$)</label><input type="number" class="form-input" id="gar-valor" step="0.01" min="0" placeholder="0,00"></div>
      <div class="form-group"><label class="form-label">Validade</label><input type="date" class="form-input" id="gar-validade"></div>
      <button class="btn btn-primary" style="width:100%" onclick="salvarGarantia()">Salvar Garantia</button>
    </div>`;
  document.body.appendChild(div);
}
function abrirGarantia(contratoId) {
  ensureGarantiaModal();
  const g = obterGarantiaDoContrato(contratoId);
  document.getElementById('gar-contrato-id').value = contratoId;
  document.getElementById('gar-tipo').value = g?.tipo || 'Caução';
  document.getElementById('gar-percentual').value = g?.percentual || '';
  document.getElementById('gar-valor').value = g?.valor || '';
  document.getElementById('gar-validade').value = g?.validade || '';
  openModal('garantia');
}
function salvarGarantia() {
  const contratoId = parseInt(document.getElementById('gar-contrato-id').value);
  const c = obterContratoPorId(contratoId);
  if (!c) { showToast('Contrato não encontrado.', 'error'); return; }
  const valor = parseFloat(String(document.getElementById('gar-valor').value).replace(',', '.')) || 0;
  const percentual = parseFloat(String(document.getElementById('gar-percentual').value).replace(',', '.')) || 0;
  const validade = document.getElementById('gar-validade').value;
  const tipo = document.getElementById('gar-tipo').value;
  const existente = obterGarantiaDoContrato(contratoId);
  if (existente) {
    DB.update('garantias', existente.id, { tipo, valor, percentual, validade });
    ActivityLog.add('Atualizou garantia contratual', 'Contratos', c.numero);
  } else {
    DB.add('garantias', { contratoId, contratoNumero: c.numero, tipo, valor, percentual, validade });
    ActivityLog.add('Registrou garantia contratual', 'Contratos', c.numero);
  }
  showToast('Garantia salva!', 'success');
  closeModal();
  showContratoDetail(contratoId);
}

// ---- ALERTAS (calculados; não persistem cópias no LocalStorage) ----
function obterAlertasContratos() {
  const contratos = obterContratos();
  const alertas = [];
  contratos.forEach(c => {
    if (c.status === 'Encerrado' || c.status === 'Cancelado') return;
    const { diasRestantes, vencido } = calcularVigenciaContrato(c);
    if (vencido) alertas.push({ tipo: 'red', titulo: 'Contrato Vencido', desc: c.numero });
    else if (diasRestantes !== null && diasRestantes <= 30) alertas.push({ tipo: 'amber', titulo: 'Contrato Vencendo', desc: `${c.numero} – ${diasRestantes} dia(s)` });

    obterParcelasDoContrato(c.id).forEach(p => {
      if (statusCalculadoParcela(p) === 'Atrasada') alertas.push({ tipo: 'red', titulo: 'Parcela Vencida', desc: `${c.numero} – parcela ${p.numero}` });
    });

    const garantia = obterGarantiaDoContrato(c.id);
    if (garantia && garantia.validade) {
      const dias = diferencaEmDias(formatarDataLocalISO(new Date()), garantia.validade);
      if (dias < 0) alertas.push({ tipo: 'red', titulo: 'Garantia Vencida', desc: c.numero });
      else if (dias <= 30) alertas.push({ tipo: 'amber', titulo: 'Garantia Vencendo', desc: `${c.numero} – ${dias} dia(s)` });
    }
  });
  return alertas;
}

// Estende (sem duplicar elementos) o widget "Contratos a Vencer" já
// existente no Dashboard, somando também as parcelas atrasadas de cada
// contrato — sem criar novos cards nem alterar o layout do Dashboard.
const _renderDashboardOriginalEtapa10 = window.renderDashboard;
window.renderDashboard = function () {
  if (typeof _renderDashboardOriginalEtapa10 === 'function') _renderDashboardOriginalEtapa10();
  const ctEl = document.getElementById('dash-contratos-vencer');
  if (!ctEl || !DB.KEYS.parcelas) return;
  const hoje = new Date();
  const contratos = obterContratos();
  const aVencer = contratos.filter(c => {
    if (!c.termino) return false;
    const diff = (new Date(c.termino) - hoje) / 86400000;
    return c.status === 'Vencido' || (diff > 0 && diff <= 60 && c.status === 'Ativo');
  }).sort((a, b) => new Date(a.termino) - new Date(b.termino)).slice(0, 5);
  if (aVencer.length === 0) return; // mantém a mensagem "nenhum contrato a vencer" já renderizada
  ctEl.innerHTML = aVencer.map(c => {
    const parcAtrasadas = obterParcelasDoContrato(c.id).filter(p => statusCalculadoParcela(p) === 'Atrasada').length;
    return `<div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--gray600)">${c.numero} – ${c.fornecedor.split(' ')[0]}${parcAtrasadas ? ' ⚠️' : ''}</span><span style="font-weight:600;color:${c.status==='Vencido'?'var(--red)':'var(--amber)'}">${c.status==='Vencido'?'Vencido':FormatService.date(c.termino)}</span></div>`;
  }).join('');
};

// Sobrescreve novamente o painel de detalhes do contrato, agora incluindo
// Parcelas, Reajustes e Garantia além dos Aditivos já implementados.
window.showContratoDetail = function (id) {
  const c = DB.find('contratos', id);
  if (!c) return;
  const hoje = new Date();
  const { diasRestantes } = calcularVigenciaContrato(c);
  const execPct = c.valor > 0 ? Math.round((c.valorExecutado || 0) / c.valor * 100) : 0;
  const aditivos = obterAditivosDoContrato(c.id);
  const totalAditivado = aditivos.filter(a => a.tipo === 'Valor').reduce((s, a) => s + (a.valorAdicional || 0), 0);
  const parcelas = obterParcelasDoContrato(c.id).sort((a, b) => (a.vencimento || '').localeCompare(b.vencimento || ''));
  const reajustes = obterReajustesDoContrato(c.id).sort((a, b) => (a.data || '').localeCompare(b.data || ''));
  const garantia = obterGarantiaDoContrato(c.id);

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
      <div style="display:flex;justify-content:space-between"><span style="color:var(--gray400)">Valor Contratado (atual):</span><span style="font-weight:600">${FormatService.currency(c.valor)}</span></div>
      ${totalAditivado ? `<div style="display:flex;justify-content:space-between"><span style="color:var(--gray400)">Inclui aditivos:</span><span style="font-weight:600;color:var(--amber)">+ ${FormatService.currency(totalAditivado)}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between"><span style="color:var(--gray400)">Valor Executado:</span><span style="font-weight:600">${FormatService.currency(c.valorExecutado||0)} (${execPct}%)</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--gray400)">Saldo Contratual:</span><span style="font-weight:600">${FormatService.currency((c.valor||0)-(c.valorExecutado||0))}</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--gray400)">Forma:</span><span>${c.pagamento||'-'}</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--gray400)">Prazo:</span><span>${FormatService.date(c.inicio)} a ${FormatService.date(c.termino)}</span></div>
      ${diasRestantes !== null ? `<div style="display:flex;justify-content:space-between"><span style="color:var(--gray400)">Prazo Restante:</span><span style="color:${diasRestantes<0?'var(--red)':diasRestantes<30?'var(--amber)':'inherit'};font-weight:600">${diasRestantes<0?'Vencido há '+Math.abs(diasRestantes)+' dias':diasRestantes+' dias'}</span></div>` : ''}
    </div>
    <div class="prog-bar mb-12" style="margin-bottom:12px"><div class="prog-fill prog-blue" style="width:${execPct}%"></div></div>
    <button class="btn btn-primary" style="width:100%;font-size:12px;margin-bottom:16px" onclick="editarContrato(${c.id})">✏️ Editar Contrato</button>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-size:12px;font-weight:600">Parcelas (${parcelas.length})</div>
      <button class="btn btn-ghost btn-sm" onclick="abrirNovaParcela(${c.id})">+ Parcela</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
      ${parcelas.length ? parcelas.map(p => {
        const st = statusCalculadoParcela(p);
        return `<div style="padding:8px;background:var(--gray50);border-radius:8px;font-size:11px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:600">Parcela ${p.numero} — ${FormatService.currency(p.valor)}</span>
            <span class="badge ${badgeClass(st)}" style="font-size:9px">${st}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;color:var(--gray400)">
            <span>Vence em ${FormatService.date(p.vencimento)}</span>
            <span>
              ${st !== 'Paga' ? `<button class="btn btn-ghost btn-sm" style="padding:2px 6px" onclick="pagarParcela(${p.id},${c.id})">💰 Pagar</button>` : ''}
              <button class="btn btn-ghost btn-sm" style="padding:2px 6px" onclick="excluirParcela(${p.id},${c.id})">🗑️</button>
            </span>
          </div>
        </div>`;
      }).join('') : `<div style="font-size:11px;color:var(--gray400)">Nenhuma parcela cadastrada.</div>`}
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-size:12px;font-weight:600">Reajustes (${reajustes.length})</div>
      <button class="btn btn-ghost btn-sm" onclick="abrirNovoReajuste(${c.id})">+ Reajuste</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
      ${reajustes.length ? reajustes.map(r => `
        <div style="padding:8px;background:var(--gray50);border-radius:8px;font-size:11px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:600">📈 ${r.indice} – ${r.percentual}%</span>
            <button class="btn btn-ghost btn-sm" style="padding:2px 6px" onclick="excluirReajuste(${r.id},${c.id})">🗑️</button>
          </div>
          <div style="color:var(--gray400)">${FormatService.date(r.data)} — de ${FormatService.currency(r.valorAnterior)} para ${FormatService.currency(r.valorReajustado)}</div>
        </div>`).join('') : `<div style="font-size:11px;color:var(--gray400)">Nenhum reajuste registrado.</div>`}
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-size:12px;font-weight:600">Garantia</div>
      <button class="btn btn-ghost btn-sm" onclick="abrirGarantia(${c.id})">${garantia ? '✏️ Editar' : '+ Garantia'}</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${garantia ? `<div style="padding:8px;background:var(--gray50);border-radius:8px;font-size:11px">
          <div style="font-weight:600">${garantia.tipo} — ${FormatService.currency(garantia.valor)} (${garantia.percentual}%)</div>
          <div style="color:var(--gray400)">Validade: ${FormatService.date(garantia.validade)}</div>
        </div>` : `<div style="font-size:11px;color:var(--gray400)">Nenhuma garantia registrada.</div>`}
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;margin-bottom:8px">
      <div style="font-size:12px;font-weight:600">Aditivos (${aditivos.length})</div>
      <button class="btn btn-ghost btn-sm" onclick="abrirNovoAditivo(${c.id})">+ Aditivo</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${aditivos.length ? aditivos.map(a => `
        <div style="padding:8px;background:var(--gray50);border-radius:8px;font-size:11px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:600">${a.tipo === 'Valor' ? '💰' : a.tipo === 'Prazo' ? '📅' : '📋'} Aditivo de ${a.tipo}</span>
            <button class="btn btn-ghost btn-sm" style="padding:2px 6px" onclick="excluirAditivo(${a.id},${c.id})">🗑️</button>
          </div>
          ${a.tipo === 'Valor' ? `<div>Valor adicional: ${FormatService.currency(a.valorAdicional)}</div>` : ''}
          ${a.tipo === 'Prazo' ? `<div>Novo prazo: ${FormatService.date(a.novoPrazo)}</div>` : ''}
          <div style="color:var(--gray400)">${FormatService.date(a.data)} — ${a.justificativa}</div>
        </div>`).join('') : `<div style="font-size:11px;color:var(--gray400)">Nenhum aditivo registrado.</div>`}
    </div>`;
};

// =====================================================================
