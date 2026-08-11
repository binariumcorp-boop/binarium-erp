// ============================================================
// gc-02-aditivos.js
// GESTÃO CONTRATUAL — Aditivos (tipos ampliados + cálculo automático)
//
// O aditivo original (aditivos.js) continua existindo e funcionando
// exatamente igual — não removemos nem reescrevemos nada de lá. Este
// arquivo sobrescreve o MODAL de aditivo (que é criado dinamicamente por
// ensureAditivoModal, então não existe HTML estático para editar) para
// oferecer os 6 tipos pedidos e os campos financeiros automáticos.
// ============================================================

'use strict';

function gcEnsureAditivoModal() {
  const existente = document.getElementById('modal-aditivo');
  if (existente) existente.remove(); // recria com os campos novos
  const div = document.createElement('div');
  div.className = 'modal-overlay';
  div.id = 'modal-aditivo';
  div.addEventListener('click', e => { if (e.target === div) closeModal(); });
  div.innerHTML = `
    <div class="modal" style="max-width:520px">
      <div class="modal-header"><h3 style="font-size:16px;font-weight:700">Novo Aditivo Contratual</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
      <input type="hidden" id="adt-contrato-id">
      <div class="form-group"><label class="form-label">Número do Aditivo</label><input class="form-input" id="adt-numero" placeholder="Ex: ADT-001"></div>
      <div class="form-group"><label class="form-label">Tipo de Aditivo</label>
        <select class="form-input" id="adt-tipo" onchange="gcToggleAditivoCampos()">
          ${GC_TIPOS_ADITIVO.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Data do Aditivo</label><input type="date" class="form-input" id="adt-data"></div>
        <div class="form-group"><label class="form-label">Responsável</label><input class="form-input" id="adt-responsavel" placeholder="Nome do responsável"></div>
      </div>
      <div class="form-group"><label class="form-label">Situação</label>
        <select class="form-input" id="adt-situacao">${GC_SITUACOES_ADITIVO.map(s => `<option value="${s}">${s}</option>`).join('')}</select>
      </div>

      <div id="adt-campo-valor" style="display:none">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Valor Anterior (R$)</label><input class="form-input" id="adt-valor-anterior" type="number" step="0.01" readonly style="background:var(--gray50)"></div>
          <div class="form-group"><label class="form-label">Valor do Aditivo (R$)</label><input class="form-input" id="adt-valor" type="number" step="0.01" placeholder="0,00" oninput="gcAtualizarCalculoAditivo()"></div>
        </div>
        <div class="form-group"><label class="form-label">Novo Valor Total (R$)</label><input class="form-input" id="adt-novo-valor" type="number" step="0.01" readonly style="background:var(--gray50);font-weight:700"></div>
      </div>

      <div id="adt-campo-prazo" style="display:none">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Prazo Anterior</label><input class="form-input" id="adt-prazo-anterior" type="date" readonly style="background:var(--gray50)"></div>
          <div class="form-group"><label class="form-label">Novo Prazo</label><input class="form-input" id="adt-prazo" type="date" oninput="gcAtualizarCalculoAditivo()"></div>
        </div>
        <div class="form-group"><label class="form-label">Dias Adicionados</label><input class="form-input" id="adt-dias-adicionados" type="number" readonly style="background:var(--gray50);font-weight:700"></div>
      </div>

      <div class="form-group"><label class="form-label">Justificativa</label><textarea class="form-input" id="adt-justificativa" rows="2" placeholder="Motivo do aditivo..."></textarea></div>
      <div class="form-group"><label class="form-label">Descrição</label><textarea class="form-input" id="adt-descricao" rows="2" placeholder="Descrição detalhada..."></textarea></div>

      <div class="form-group">
        <label class="form-label">Documento do Aditivo</label>
        <label class="btn btn-ghost btn-sm" style="cursor:pointer">📎 Anexar arquivo<input type="file" style="display:none" onchange="gcHandleAnexoAditivo(event)"></label>
        <span id="adt-anexo-nome" style="font-size:11px;color:var(--gray400);margin-left:8px">Nenhum arquivo</span>
      </div>

      <button class="btn btn-primary" style="width:100%" onclick="gcSalvarAditivo()">Salvar Aditivo</button>
    </div>`;
  document.body.appendChild(div);
}

// Tipos que afetam o valor do contrato (positiva ou negativamente)
const GC_TIPOS_ADITIVO_VALOR = ['Acréscimo de Valor', 'Supressão', 'Reequilíbrio Financeiro'];
// Tipos que afetam o prazo do contrato
const GC_TIPOS_ADITIVO_PRAZO = ['Prorrogação de Prazo'];

function gcToggleAditivoCampos() {
  const tipo = document.getElementById('adt-tipo').value;
  document.getElementById('adt-campo-valor').style.display = GC_TIPOS_ADITIVO_VALOR.includes(tipo) ? 'block' : 'none';
  document.getElementById('adt-campo-prazo').style.display = GC_TIPOS_ADITIVO_PRAZO.includes(tipo) ? 'block' : 'none';
  gcAtualizarCalculoAditivo();
}

function gcAtualizarCalculoAditivo() {
  const tipo = document.getElementById('adt-tipo').value;
  const valorAnterior = parseFloat(document.getElementById('adt-valor-anterior').value) || 0;
  if (GC_TIPOS_ADITIVO_VALOR.includes(tipo)) {
    let valorAditivo = parseFloat(document.getElementById('adt-valor').value) || 0;
    if (tipo === 'Supressão' && valorAditivo > 0) valorAditivo = -valorAditivo; // supressão sempre reduz
    document.getElementById('adt-novo-valor').value = (valorAnterior + valorAditivo).toFixed(2);
  }
  if (GC_TIPOS_ADITIVO_PRAZO.includes(tipo)) {
    const prazoAnteriorStr = document.getElementById('adt-prazo-anterior').value;
    const novoPrazoStr = document.getElementById('adt-prazo').value;
    if (prazoAnteriorStr && novoPrazoStr) {
      const dias = diferencaEmDias(prazoAnteriorStr, novoPrazoStr);
      document.getElementById('adt-dias-adicionados').value = dias;
    } else {
      document.getElementById('adt-dias-adicionados').value = '';
    }
  }
}

let gcAnexoAditivoTemp = null;
function gcHandleAnexoAditivo(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    gcAnexoAditivoTemp = { nome: file.name, tamanho: formatFileSize(file.size), fileData: e.target.result };
    document.getElementById('adt-anexo-nome').textContent = file.name;
  };
  reader.readAsDataURL(file);
}

function gcAbrirNovoAditivo(contratoId) {
  gcEnsureAditivoModal();
  const c = DB.find('contratos', contratoId);
  if (!c) return;
  document.getElementById('adt-contrato-id').value = contratoId;
  document.getElementById('adt-numero').value = 'ADT-' + String(((DB.get('aditivos') || []).filter(a => a.contratoId === contratoId).length) + 1).padStart(3, '0');
  document.getElementById('adt-tipo').value = GC_TIPOS_ADITIVO[0];
  document.getElementById('adt-data').value = new Date().toISOString().split('T')[0];
  document.getElementById('adt-responsavel').value = '';
  document.getElementById('adt-situacao').value = 'Aguardando Aprovação';
  document.getElementById('adt-valor-anterior').value = (c.valor || 0).toFixed(2);
  document.getElementById('adt-valor').value = '';
  document.getElementById('adt-novo-valor').value = (c.valor || 0).toFixed(2);
  document.getElementById('adt-prazo-anterior').value = c.termino || '';
  document.getElementById('adt-prazo').value = '';
  document.getElementById('adt-dias-adicionados').value = '';
  document.getElementById('adt-justificativa').value = '';
  document.getElementById('adt-descricao').value = '';
  gcAnexoAditivoTemp = null;
  document.getElementById('adt-anexo-nome').textContent = 'Nenhum arquivo';
  gcToggleAditivoCampos();
  openModal('aditivo');
}

function gcSalvarAditivo() {
  const contratoId = parseInt(document.getElementById('adt-contrato-id').value);
  const c = DB.find('contratos', contratoId);
  if (!c) return;
  const numero = document.getElementById('adt-numero').value.trim();
  const tipo = document.getElementById('adt-tipo').value;
  const justificativa = document.getElementById('adt-justificativa').value.trim();
  if (!ValidationService.required(numero, 'Número do aditivo')) return;
  if (!ValidationService.required(justificativa, 'Justificativa')) return;

  const valorAnterior = parseFloat(document.getElementById('adt-valor-anterior').value) || 0;
  let valorAditivo = 0, novoValorTotal = valorAnterior;
  let prazoAnterior = null, novoPrazo = null, diasAdicionados = 0;

  if (GC_TIPOS_ADITIVO_VALOR.includes(tipo)) {
    valorAditivo = parseFloat(document.getElementById('adt-valor').value) || 0;
    if (tipo === 'Supressão' && valorAditivo > 0) valorAditivo = -valorAditivo;
    novoValorTotal = valorAnterior + valorAditivo;
    if (novoValorTotal < 0) { showToast('O novo valor total não pode ficar negativo.', 'error'); return; }
  }
  if (GC_TIPOS_ADITIVO_PRAZO.includes(tipo)) {
    prazoAnterior = document.getElementById('adt-prazo-anterior').value || null;
    novoPrazo = document.getElementById('adt-prazo').value || null;
    if (!novoPrazo) { showToast('Informe o novo prazo.', 'error'); return; }
    diasAdicionados = prazoAnterior ? diferencaEmDias(prazoAnterior, novoPrazo) : 0;
  }

  const data = {
    contratoId, contratoNumero: c.numero,
    numero, tipo,
    data: document.getElementById('adt-data').value || new Date().toISOString().split('T')[0],
    responsavel: document.getElementById('adt-responsavel').value.trim(),
    situacao: document.getElementById('adt-situacao').value,
    justificativa, descricao: document.getElementById('adt-descricao').value.trim(),
    // Campos automáticos pedidos na Gestão Contratual
    gcValorAnterior: valorAnterior, gcValorAditivo: valorAditivo, gcNovoValorTotal: novoValorTotal,
    gcPrazoAnterior: prazoAnterior, gcNovoPrazo: novoPrazo, gcDiasAdicionados: diasAdicionados,
    documento: gcAnexoAditivoTemp,
    // Mantém compatibilidade com os campos que o aditivo original usava
    valorAdicional: GC_TIPOS_ADITIVO_VALOR.includes(tipo) ? valorAditivo : 0
  };

  DB.add('aditivos', data);
  if (GC_TIPOS_ADITIVO_VALOR.includes(tipo)) {
    DB.update('contratos', contratoId, { valor: novoValorTotal });
  } else if (GC_TIPOS_ADITIVO_PRAZO.includes(tipo) && novoPrazo) {
    DB.update('contratos', contratoId, { termino: novoPrazo });
  }
  if (typeof ActivityLog !== 'undefined') ActivityLog.add(`Cadastrou aditivo (${tipo})`, 'Contratos', `${c.numero} · ${numero}`);
  showToast('Aditivo registrado com sucesso!', 'success');
  closeModal();
  showContratoDetail(contratoId);
  if (typeof renderContratos === 'function' && currentPage === 'contratos') renderContratos();
  if (typeof refreshPainelObraSeAberto === 'function') refreshPainelObraSeAberto(c.obraId);
}

// abrirNovoAditivo é chamado pelo botão "+ Aditivo" que aditivos.js já
// desenha dentro de showContratoDetail. Sobrescrevemos para abrir o modal
// novo (com os 6 tipos), sem alterar aditivos.js.
window.abrirNovoAditivo = gcAbrirNovoAditivo;
