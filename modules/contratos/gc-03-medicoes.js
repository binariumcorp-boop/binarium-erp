// ============================================================
// gc-03-medicoes.js
// GESTÃO CONTRATUAL — Medições
// Entidade nova (DB.KEYS.medicoes, registrada em gc-00-schema.js).
// ============================================================

'use strict';

function gcObterMedicoesDoContrato(contratoId) {
  return (DB.get('medicoes') || []).filter(m => m.contratoId === contratoId).sort((a, b) => new Date(b.data) - new Date(a.data));
}

function gcEnsureMedicaoModal() {
  if (document.getElementById('modal-gc-medicao')) return;
  const div = document.createElement('div');
  div.className = 'modal-overlay';
  div.id = 'modal-gc-medicao';
  div.addEventListener('click', e => { if (e.target === div) closeModal(); });
  div.innerHTML = `
    <div class="modal" style="max-width:460px">
      <div class="modal-header"><h3 style="font-size:16px;font-weight:700" id="gcmed-titulo">Nova Medição</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
      <input type="hidden" id="gcmed-id">
      <input type="hidden" id="gcmed-contrato-id">
      <div class="form-row">
        <div class="form-group"><label class="form-label">Número</label><input class="form-input" id="gcmed-numero" placeholder="Ex: MED-001"></div>
        <div class="form-group"><label class="form-label">Data</label><input class="form-input" id="gcmed-data" type="date"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Valor Medido (R$)</label><input class="form-input" id="gcmed-valor" type="number" step="0.01" placeholder="0,00" oninput="gcCalcularPctMedicao()"></div>
        <div class="form-group"><label class="form-label">% do Contrato</label><input class="form-input" id="gcmed-percentual" type="number" readonly style="background:var(--gray50)"></div>
      </div>
      <div class="form-group"><label class="form-label">Responsável</label><input class="form-input" id="gcmed-responsavel" placeholder="Nome do responsável"></div>
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-input" id="gcmed-status"><option>Pendente</option><option>Aprovada</option><option>Rejeitada</option><option>Paga</option></select>
      </div>
      <div class="form-group"><label class="form-label">Observações</label><textarea class="form-input" id="gcmed-obs" rows="2"></textarea></div>
      <div class="form-group">
        <label class="form-label">Documento Relacionado</label>
        <label class="btn btn-ghost btn-sm" style="cursor:pointer">📎 Anexar<input type="file" style="display:none" onchange="gcHandleAnexoMedicao(event)"></label>
        <span id="gcmed-anexo-nome" style="font-size:11px;color:var(--gray400);margin-left:8px">Nenhum arquivo</span>
      </div>
      <button class="btn btn-primary" style="width:100%" onclick="gcSalvarMedicao()">Salvar Medição</button>
    </div>`;
  document.body.appendChild(div);
}

function gcCalcularPctMedicao() {
  const contratoId = parseInt(document.getElementById('gcmed-contrato-id').value);
  const c = DB.find('contratos', contratoId);
  const valor = parseFloat(document.getElementById('gcmed-valor').value) || 0;
  const pct = c && c.valor > 0 ? (valor / c.valor * 100) : 0;
  document.getElementById('gcmed-percentual').value = pct.toFixed(1);
}

let gcAnexoMedicaoTemp = null;
function gcHandleAnexoMedicao(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    gcAnexoMedicaoTemp = { nome: file.name, tamanho: formatFileSize(file.size), fileData: e.target.result };
    document.getElementById('gcmed-anexo-nome').textContent = file.name;
  };
  reader.readAsDataURL(file);
}

function gcAbrirNovaMedicao(contratoId) {
  gcEnsureMedicaoModal();
  document.getElementById('gcmed-titulo').textContent = 'Nova Medição';
  document.getElementById('gcmed-id').value = '';
  document.getElementById('gcmed-contrato-id').value = contratoId;
  const n = gcObterMedicoesDoContrato(contratoId).length + 1;
  document.getElementById('gcmed-numero').value = 'MED-' + String(n).padStart(3, '0');
  document.getElementById('gcmed-data').value = new Date().toISOString().split('T')[0];
  document.getElementById('gcmed-valor').value = '';
  document.getElementById('gcmed-percentual').value = '0.0';
  document.getElementById('gcmed-responsavel').value = '';
  document.getElementById('gcmed-status').value = 'Pendente';
  document.getElementById('gcmed-obs').value = '';
  gcAnexoMedicaoTemp = null;
  document.getElementById('gcmed-anexo-nome').textContent = 'Nenhum arquivo';
  openModal('gc-medicao');
}

function gcEditarMedicao(id) {
  const m = (DB.get('medicoes') || []).find(x => x.id === id);
  if (!m) return;
  gcEnsureMedicaoModal();
  document.getElementById('gcmed-titulo').textContent = 'Editar Medição';
  document.getElementById('gcmed-id').value = m.id;
  document.getElementById('gcmed-contrato-id').value = m.contratoId;
  document.getElementById('gcmed-numero').value = m.numero;
  document.getElementById('gcmed-data').value = m.data;
  document.getElementById('gcmed-valor').value = m.valor;
  document.getElementById('gcmed-responsavel').value = m.responsavel || '';
  document.getElementById('gcmed-status').value = m.status;
  document.getElementById('gcmed-obs').value = m.obs || '';
  gcAnexoMedicaoTemp = m.documento || null;
  document.getElementById('gcmed-anexo-nome').textContent = m.documento ? m.documento.nome : 'Nenhum arquivo';
  gcCalcularPctMedicao();
  openModal('gc-medicao');
}

function gcSalvarMedicao() {
  const contratoId = parseInt(document.getElementById('gcmed-contrato-id').value);
  const c = DB.find('contratos', contratoId);
  if (!c) return;
  const numero = document.getElementById('gcmed-numero').value.trim();
  const valor = parseFloat(document.getElementById('gcmed-valor').value) || 0;
  if (!ValidationService.required(numero, 'Número da medição')) return;
  if (valor <= 0) { showToast('Informe um valor de medição maior que zero.', 'error'); return; }

  const editId = document.getElementById('gcmed-id').value ? parseInt(document.getElementById('gcmed-id').value) : null;
  const data = {
    contratoId, contratoNumero: c.numero, numero,
    data: document.getElementById('gcmed-data').value || new Date().toISOString().split('T')[0],
    valor, percentual: c.valor > 0 ? (valor / c.valor * 100) : 0,
    responsavel: document.getElementById('gcmed-responsavel').value.trim(),
    status: document.getElementById('gcmed-status').value,
    obs: document.getElementById('gcmed-obs').value.trim(),
    documento: gcAnexoMedicaoTemp
  };

  if (editId) {
    DB.update('medicoes', editId, data);
    if (typeof ActivityLog !== 'undefined') ActivityLog.add('Atualizou medição', 'Contratos', `${c.numero} · ${numero}`);
    showToast('Medição atualizada!', 'success');
  } else {
    DB.add('medicoes', data);
    if (typeof ActivityLog !== 'undefined') ActivityLog.add('Cadastrou medição', 'Contratos', `${c.numero} · ${numero}`);
    showToast('Medição registrada!', 'success');
  }
  closeModal();
  gcRenderMedicoesTab(contratoId);
  if (typeof refreshPainelObraSeAberto === 'function') refreshPainelObraSeAberto(c.obraId);
}

function gcExcluirMedicao(id, contratoId) {
  confirmAction('Excluir medição?', 'Esta medição será removida do contrato.', () => {
    const m = (DB.get('medicoes') || []).find(x => x.id === id);
    DB.delete('medicoes', id);
    if (typeof ActivityLog !== 'undefined' && m) ActivityLog.add('Excluiu medição', 'Contratos', `${m.contratoNumero} · ${m.numero}`);
    showToast('Medição excluída.', 'success');
    gcRenderMedicoesTab(contratoId);
  }, '🗑️');
}

function gcRenderMedicoesTab(contratoId) {
  const el = document.getElementById('gc-subtab-body');
  if (!el) return;
  const medicoes = gcObterMedicoesDoContrato(contratoId);
  const totalMedido = medicoes.filter(m => m.status !== 'Rejeitada').reduce((s, m) => s + (m.valor || 0), 0);
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div style="font-size:12px;color:var(--gray400)">Total medido: <b>${FormatService.currency(totalMedido)}</b></div>
      <button class="btn btn-primary btn-sm" onclick="gcAbrirNovaMedicao(${contratoId})">+ Medição</button>
    </div>
    ${medicoes.length === 0 ? `<div style="color:var(--gray400);font-size:12px;text-align:center;padding:16px">Nenhuma medição registrada.</div>` : medicoes.map(m => `
      <div class="card" style="padding:10px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:12px;font-weight:700">${m.numero} <span class="badge ${m.status==='Aprovada'||m.status==='Paga'?'badge-green':m.status==='Rejeitada'?'badge-red':'badge-amber'}" style="margin-left:4px">${m.status}</span></div>
            <div style="font-size:11px;color:var(--gray400)">${FormatService.date(m.data)} · ${m.responsavel || 'Sem responsável'}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:13px;font-weight:700">${FormatService.currency(m.valor)}</div>
            <div style="font-size:10px;color:var(--gray400)">${(m.percentual||0).toFixed(1)}% do contrato</div>
          </div>
        </div>
        ${m.documento ? `<div style="font-size:10px;color:var(--gray400);margin-top:4px">📎 ${m.documento.nome}</div>` : ''}
        <div style="margin-top:6px;display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm" onclick="gcEditarMedicao(${m.id})">✏️ Editar</button>
          <button class="btn btn-ghost btn-sm" onclick="gcExcluirMedicao(${m.id},${contratoId})">🗑️ Excluir</button>
        </div>
      </div>`).join('')}`;
}
