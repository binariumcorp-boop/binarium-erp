// ============================================================
// documentos.js
// DOCUMENTOS
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== DOCUMENTOS =====
function renderDocumentos() {
  const docs = DB.get('documentos');
  document.getElementById('stat-doc-total').textContent = docs.length;
  document.getElementById('stat-doc-aprov').textContent = docs.filter(d => d.status === 'Aprovado').length;
  document.getElementById('stat-doc-pend').textContent = docs.filter(d => d.status === 'Pendente').length;
  document.getElementById('stat-doc-rej').textContent = docs.filter(d => d.status === 'Rejeitado').length;
  document.getElementById('stat-doc-fav').textContent = docs.filter(d => d.favorito).length;
  populateSelect('doc-filter-obra', DB.get('obras'), 'id', 'nome', 'Obra: Todas');
  populateSelect('doc-obra', DB.get('obras'), 'id', 'nome', 'Geral');
  filterDocumentos();
}

function filterDocumentos() {
  const search = document.getElementById('doc-search').value.toLowerCase();
  const cat = document.getElementById('doc-filter-cat').value;
  const obraId = document.getElementById('doc-filter-obra').value;
  const status = document.getElementById('doc-filter-status').value;
  let docs = DB.get('documentos');
  if (search) docs = docs.filter(d => d.nome.toLowerCase().includes(search) || (d.obraNome||'').toLowerCase().includes(search));
  if (cat) docs = docs.filter(d => d.categoria === cat);
  if (obraId) docs = docs.filter(d => d.obraId == obraId);
  if (status) docs = docs.filter(d => d.status === status);
  renderDocTable(docs);
}

function clearDocFilter() {
  document.getElementById('doc-search').value = '';
  document.getElementById('doc-filter-cat').value = '';
  document.getElementById('doc-filter-obra').value = '';
  document.getElementById('doc-filter-status').value = '';
  filterDocumentos();
}

function renderDocTable(docs) {
  const tbody = document.getElementById('doc-table-body');
  if (docs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray400);padding:20px">Nenhum documento encontrado</td></tr>';
    return;
  }
  tbody.innerHTML = docs.map(d => `
    <tr>
      <td><div style="display:flex;align-items:center;gap:8px"><span style="font-size:20px">${docIcon(d.tipo||'pdf')}</span><div><div style="font-weight:600;font-size:13px">${d.nome}</div><div style="font-size:11px;color:var(--gray400)">${d.versao||'v1.0'} ${d.favorito?'⭐':''}${d.responsavel?' · '+d.responsavel:''}</div></div></div></td>
      <td><span class="badge badge-gray">${d.categoria}</span></td>
      <td style="font-size:12px">${d.obraNome||'Geral'}</td>
      <td style="font-size:12px;color:var(--gray400)">${d.tamanho||'-'}</td>
      <td><span class="badge ${d.status==='Aprovado'?'badge-green':d.status==='Pendente'?'badge-amber':'badge-red'}">${d.status}</span></td>
      <td style="font-size:12px">${FormatService.date(d.uploadAt)}</td>
      <td>
        ${d.fileData?`<button class="btn btn-ghost btn-sm" onclick="downloadDoc(${d.id})" title="Download">⬇️</button>`:''}
        <button class="btn btn-ghost btn-sm" onclick="toggleFavorito(${d.id})" title="${d.favorito?'Remover favorito':'Favoritar'}">${d.favorito?'⭐':'☆'}</button>
        <button class="btn btn-ghost btn-sm" onclick="editarDoc(${d.id})">✏️</button>
        <button class="btn btn-ghost btn-sm" onclick="excluirDoc(${d.id})">🗑️</button>
      </td>
    </tr>`).join('');
}

function docIcon(tipo) {
  const icons = { pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️' };
  return icons[tipo] || '📁';
}

function handleDocUpload(event) {
  const files = Array.from(event.target.files);
  files.forEach(file => processDocFile(file));
  event.target.value = '';
}

function handleDrop(event, context) {
  event.preventDefault();
  document.getElementById('doc-upload-area').classList.remove('drag');
  const files = Array.from(event.dataTransfer.files);
  files.forEach(file => processDocFile(file));
}

function handleDragOver(event) {
  event.preventDefault();
  document.getElementById('doc-upload-area').classList.add('drag');
}

function processDocFile(file) {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowed = ['pdf','doc','docx','xls','xlsx','jpg','jpeg','png','gif'];
  const ext = file.name.split('.').pop().toLowerCase();
  if (!allowed.includes(ext)) { showToast(`Tipo não suportado: .${ext}`, 'error'); return; }
  if (file.size > maxSize) { showToast(`Arquivo muito grande: ${file.name} (máx. 50MB)`, 'error'); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    const doc = {
      nome: file.name.replace(/\.[^/.]+$/, ''),
      categoria: 'Outros', obraId: null, obraNome: 'Geral',
      versao: 'v1.0', status: 'Pendente',
      tamanho: formatFileSize(file.size), tipo: ext,
      favorito: false, uploadAt: new Date().toISOString().split('T')[0],
      fileData: e.target.result, fileName: file.name, obs: '',
      responsavel: ''
    };
    DB.add('documentos', doc);
    showToast(`"${file.name}" enviado com sucesso!`, 'success');
    atualizarAposAlteracaoDeDocumento(null);
  };
  reader.readAsDataURL(file);
}

function handleDocModalFile(event) {
  const file = event.target.files[0];
  if (file) document.getElementById('doc-modal-file-name').textContent = file.name;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1048576).toFixed(1) + ' MB';
}

function editarDoc(id) {
  const d = DB.find('documentos', id);
  if (!d) return;
  populateSelect('doc-obra', DB.get('obras'), 'id', 'nome', 'Geral');
  document.getElementById('doc-modal-title').textContent = 'Editar Documento';
  document.getElementById('doc-edit-id').value = d.id;
  document.getElementById('doc-nome').value = d.nome;
  document.getElementById('doc-categoria').value = d.categoria;
  document.getElementById('doc-obra').value = d.obraId || '';
  document.getElementById('doc-versao').value = d.versao || 'v1.0';
  document.getElementById('doc-status').value = d.status;
  document.getElementById('doc-responsavel').value = d.responsavel || '';
  document.getElementById('doc-obs').value = d.obs || '';
  document.getElementById('doc-modal-file-name').textContent = d.fileName || '';
  openModal('novo-doc');
}

function salvarDocumento() {
  const nome = document.getElementById('doc-nome').value.trim();
  if (!ValidationService.required(nome, 'Nome do documento')) return;
  const editId = parseInt(document.getElementById('doc-edit-id').value);
  const obraId = parseInt(document.getElementById('doc-obra').value) || null;
  const obra = obraId ? DB.find('obras', obraId) : null;
  const fileInput = document.getElementById('doc-modal-file');
  const data = {
    nome, categoria: document.getElementById('doc-categoria').value,
    obraId, obraNome: obra ? obra.nome : 'Geral',
    versao: document.getElementById('doc-versao').value || 'v1.0',
    status: document.getElementById('doc-status').value,
    responsavel: document.getElementById('doc-responsavel').value.trim(),
    obs: document.getElementById('doc-obs').value.trim(),
    uploadAt: new Date().toISOString().split('T')[0]
  };
  if (fileInput.files[0]) {
    const file = fileInput.files[0];
    data.tamanho = formatFileSize(file.size);
    data.tipo = file.name.split('.').pop().toLowerCase();
    data.fileName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      data.fileData = e.target.result;
      if (editId) { DB.update('documentos', editId, data); showToast('Documento atualizado!', 'success'); }
      else { DB.add('documentos', data); showToast('Documento cadastrado!', 'success'); }
      closeModal();
      atualizarAposAlteracaoDeDocumento(obraId);
    };
    reader.readAsDataURL(file);
  } else {
    if (editId) { DB.update('documentos', editId, data); showToast('Documento atualizado!', 'success'); }
    else { DB.add('documentos', data); showToast('Documento cadastrado!', 'success'); }
    closeModal();
    atualizarAposAlteracaoDeDocumento(obraId);
  }
}

// Atualização centralizada após criar, editar, favoritar ou excluir um
// documento: garante que a lista de Documentos, o Painel Completo da Obra e a
// Linha do Tempo reflitam a mudança imediatamente, sem recarregar a página.
function atualizarAposAlteracaoDeDocumento(obraId) {
  if (typeof renderDocumentos === 'function') {
    renderDocumentos();
  }
  if (typeof refreshPainelObraSeAberto === 'function') {
    refreshPainelObraSeAberto(obraId);
  }
}

function downloadDoc(id) {
  const d = DB.find('documentos', id);
  if (!d || !d.fileData) { showToast('Arquivo não disponível para download.', 'warning'); return; }
  const a = document.createElement('a');
  a.href = d.fileData;
  a.download = d.fileName || d.nome;
  a.click();
}

function toggleFavorito(id) {
  const d = DB.find('documentos', id);
  if (!d) return;
  DB.update('documentos', id, { favorito: !d.favorito });
  showToast(d.favorito ? 'Removido dos favoritos.' : 'Adicionado aos favoritos!', 'success');
  atualizarAposAlteracaoDeDocumento(d.obraId);
}

function excluirDoc(id) {
  const d = DB.find('documentos', id);
  if (!d) return;
  confirmAction('Excluir documento?', `"${d.nome}" será removido.`, () => {
    const obraId = d.obraId;
    DB.delete('documentos', id);
    showToast('Documento excluído.', 'success');
    atualizarAposAlteracaoDeDocumento(obraId);
  }, '🗑️');
}

