// ============================================================
// gc-01-contrato-form.js
// GESTÃO CONTRATUAL — Contrato Principal (campos novos + uploads)
//
// Segue o mesmo padrão já usado em outras partes do sistema (ex:
// aditivos.js sobrescrevendo showContratoDetail, initLogAtividades()
// injetando um item de menu) para ADICIONAR funcionalidade sem editar
// os arquivos originais nem o HTML estático:
//   1) injeta os campos novos dentro do modal #modal-novo-contrato via
//      DOM (não edita o index.html);
//   2) guarda as funções originais editarContrato/salvarContrato antes
//      de sobrescrevê-las, e a nova versão SEMPRE lê/grava também os
//      campos antigos exatamente como a versão original fazia — nenhum
//      contrato cadastrado antes desta mudança perde dados.
// ============================================================

'use strict';

function gcEnsureContratoFormFields() {
  const modal = document.getElementById('modal-novo-contrato');
  if (!modal) return;
  const body = modal.querySelector('.modal-body');
  if (!body || document.getElementById('ct-tipo-contrato')) return; // já injetado

  body.insertAdjacentHTML('beforeend', `
    <div style="margin:18px 0 10px;padding-top:14px;border-top:1px solid var(--gray100)">
      <div style="font-size:12px;font-weight:700;color:var(--gray400);text-transform:uppercase;letter-spacing:.03em">Gestão Contratual</div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Tipo de Contrato</label>
        <select class="form-input" id="ct-tipo-contrato">
          ${GC_TIPOS_CONTRATO.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Responsável</label><input class="form-input" id="ct-responsavel" placeholder="Nome do responsável pelo contrato"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Cliente</label><input class="form-input" id="ct-cliente" placeholder="Nome do cliente"></div>
      <div class="form-group"><label class="form-label">Contratante</label><input class="form-input" id="ct-contratante" placeholder="Razão social do contratante"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Data da Assinatura</label><input class="form-input" id="ct-data-assinatura" type="date"></div>
    </div>
    <div class="form-group"><label class="form-label">Observações</label><textarea class="form-input" id="ct-observacoes" rows="2" placeholder="Observações gerais do contrato..."></textarea></div>

    <div style="margin:14px 0 8px">
      <div class="form-label" style="margin-bottom:8px">Anexos do Contrato</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px" id="ct-anexos-grid"></div>
    </div>
  `);

  const camposAnexo = [
    ['pdfContrato', 'PDF do Contrato'], ['planilhas', 'Planilhas'],
    ['memorial', 'Memorial'], ['cronograma', 'Cronograma'],
    ['art', 'ART'], ['anexos', 'Outros Anexos']
  ];
  const grid = document.getElementById('ct-anexos-grid');
  grid.innerHTML = camposAnexo.map(([key, label]) => `
    <div class="upload-area" style="padding:10px;text-align:center" id="ct-anexo-${key}-area">
      <div style="font-size:11px;font-weight:600;margin-bottom:4px">${label}</div>
      <div style="font-size:10px;color:var(--gray400);margin-bottom:6px" id="ct-anexo-${key}-nome">Nenhum arquivo</div>
      <label class="btn btn-ghost btn-sm" style="cursor:pointer">
        📎 Anexar
        <input type="file" style="display:none" onchange="gcHandleAnexoContrato(event,'${key}')">
      </label>
    </div>`).join('');
}

// Guarda ficheiro em base64 (mesmo padrão de handleDocUpload em
// documentos.js) — não sobe para nenhum bucket porque este projeto ainda
// não tem integração real de Supabase Storage em nenhuma outra tela;
// os dados do arquivo já são sincronizados com a nuvem via CloudSync,
// do mesmo jeito que documentos.js já faz.
let gcAnexosContratoTemp = {};
function gcHandleAnexoContrato(event, key) {
  const file = event.target.files[0];
  if (!file) return;
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) { showToast(`Arquivo muito grande: ${file.name} (máx. 50MB)`, 'error'); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    gcAnexosContratoTemp[key] = { nome: file.name, tamanho: formatFileSize(file.size), fileData: e.target.result };
    const nomeEl = document.getElementById(`ct-anexo-${key}-nome`);
    if (nomeEl) nomeEl.textContent = file.name;
  };
  reader.readAsDataURL(file);
}

function gcPreencherAnexosNoForm(anexos) {
  gcAnexosContratoTemp = JSON.parse(JSON.stringify(anexos || {}));
  ['pdfContrato', 'planilhas', 'memorial', 'cronograma', 'art', 'anexos'].forEach(key => {
    const nomeEl = document.getElementById(`ct-anexo-${key}-nome`);
    if (nomeEl) nomeEl.textContent = gcAnexosContratoTemp[key] ? gcAnexosContratoTemp[key].nome : 'Nenhum arquivo';
  });
}

// ----- Sobrescreve editarContrato (mantém 100% do comportamento original) -----
const gcEditarContratoOriginal = editarContrato;
window.editarContrato = function (id) {
  gcEditarContratoOriginal(id); // preenche todos os campos originais
  gcEnsureContratoFormFields();
  const c = DB.find('contratos', id);
  if (!c) return;
  document.getElementById('ct-tipo-contrato').value = c.gcTipoContrato || GC_TIPOS_CONTRATO[1];
  document.getElementById('ct-responsavel').value = c.gcResponsavel || '';
  document.getElementById('ct-cliente').value = c.gcCliente || '';
  document.getElementById('ct-contratante').value = c.gcContratante || '';
  document.getElementById('ct-data-assinatura').value = c.gcDataAssinatura || '';
  document.getElementById('ct-observacoes').value = c.gcObservacoes || '';
  gcPreencherAnexosNoForm(c.gcAnexos);
};

// ----- Sobrescreve abrirNovoContrato-equivalente: como o sistema original
// abre "Novo Contrato" direto pelo botão (openModal('novo-contrato')),
// garantimos que os campos novos existam e comecem limpos também nesse
// fluxo, sem duplicar a lógica de abertura do modal. -----
document.addEventListener('DOMContentLoaded', gcEnsureContratoFormFields);
if (document.readyState !== 'loading') gcEnsureContratoFormFields();

const gcOpenModalOriginal = openModal;
window.openModal = function (id) {
  gcOpenModalOriginal(id);
  if (id === 'novo-contrato') {
    gcEnsureContratoFormFields();
    // Se não estamos editando (campo ct-edit-id vazio), limpa os campos novos
    const editId = document.getElementById('ct-edit-id');
    if (editId && !editId.value) {
      document.getElementById('ct-tipo-contrato').value = GC_TIPOS_CONTRATO[1];
      document.getElementById('ct-responsavel').value = '';
      document.getElementById('ct-cliente').value = '';
      document.getElementById('ct-contratante').value = '';
      document.getElementById('ct-data-assinatura').value = '';
      document.getElementById('ct-observacoes').value = '';
      gcAnexosContratoTemp = {};
      gcPreencherAnexosNoForm({});
    }
  }
};

// ----- Sobrescreve salvarContrato (mantém toda a validação/lógica original,
// só acrescenta a leitura/gravação dos campos novos) -----
const gcSalvarContratoOriginal = salvarContrato;
window.salvarContrato = function () {
  if (window.salvarContrato._processing) return;

  // Reaproveita a validação e o fluxo de salvar/atualizar originais.
  // Para conseguir gravar os campos extras sem duplicar toda a lógica de
  // validação, capturamos o id do contrato ANTES (se for edição) e DEPOIS
  // (se for novo, via nextId) para então mesclar os campos da Gestão
  // Contratual no mesmo registro.
  const editIdField = document.getElementById('ct-edit-id');
  const isEdicao = !!editIdField.value;
  const idAntesDeSalvar = isEdicao ? parseInt(editIdField.value) : DB.nextId('contratos');

  gcSalvarContratoOriginal();

  // Se a validação original falhou (campo obrigatório vazio, etc.), o
  // registro não foi criado/alterado — checamos se ele existe antes de
  // gravar os campos extras, para não criar dado órfão.
  const c = DB.find('contratos', idAntesDeSalvar);
  if (!c) return;

  const extras = {
    gcTipoContrato: document.getElementById('ct-tipo-contrato').value,
    gcResponsavel: document.getElementById('ct-responsavel').value.trim(),
    gcCliente: document.getElementById('ct-cliente').value.trim(),
    gcContratante: document.getElementById('ct-contratante').value.trim(),
    gcDataAssinatura: document.getElementById('ct-data-assinatura').value,
    gcObservacoes: document.getElementById('ct-observacoes').value.trim(),
    gcAnexos: gcAnexosContratoTemp
  };
  if (!isEdicao) extras.gcValorOriginal = c.valor; // baseline imutável, só na criação
  DB.update('contratos', c.id, extras);

  if (typeof ActivityLog !== 'undefined') {
    ActivityLog.add(isEdicao ? 'Atualizou dados de Gestão Contratual' : 'Cadastrou dados de Gestão Contratual', 'Contratos', c.numero);
  }
};
