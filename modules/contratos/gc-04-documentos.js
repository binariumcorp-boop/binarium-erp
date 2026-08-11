// ============================================================
// gc-04-documentos.js
// GESTÃO CONTRATUAL — Documentos do contrato
// Entidade nova (DB.KEYS.contratoDocumentos). Segue o mesmo padrão de
// upload em base64 (FileReader.readAsDataURL) já usado em
// documentos.js, diario.js, rh.js etc — não introduz nenhum mecanismo
// novo de armazenamento.
// ============================================================

'use strict';

function gcObterDocumentosDoContrato(contratoId) {
  return (DB.get('contratoDocumentos') || []).filter(d => d.contratoId === contratoId).sort((a, b) => new Date(b.uploadAt) - new Date(a.uploadAt));
}

function gcHandleUploadDocContrato(event, contratoId) {
  const files = Array.from(event.target.files);
  const maxSize = 50 * 1024 * 1024;
  files.forEach(file => {
    if (file.size > maxSize) { showToast(`Arquivo muito grande: ${file.name} (máx. 50MB)`, 'error'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const c = DB.find('contratos', contratoId);
      const doc = {
        contratoId, contratoNumero: c ? c.numero : '',
        nome: file.name, tipo: gcInferirTipoDocumento(file.name),
        tamanho: formatFileSize(file.size), fileData: e.target.result,
        uploadAt: new Date().toISOString()
      };
      DB.add('contratoDocumentos', doc);
      if (typeof ActivityLog !== 'undefined') ActivityLog.add('Enviou documento do contrato', 'Contratos', `${c ? c.numero : ''} · ${file.name}`);
      showToast(`"${file.name}" enviado!`, 'success');
      gcRenderDocumentosTab(contratoId);
    };
    reader.readAsDataURL(file);
  });
  event.target.value = '';
}

function gcInferirTipoDocumento(nome) {
  const ext = (nome.split('.').pop() || '').toLowerCase();
  const map = { pdf: 'PDF do Contrato', doc: 'Word', docx: 'Word', xls: 'Excel', xlsx: 'Excel', dwg: 'DWG', jpg: 'Foto', jpeg: 'Foto', png: 'Foto', mp4: 'Vídeo', mov: 'Vídeo' };
  return map[ext] || 'Outro';
}

function gcExcluirDocumentoContrato(id, contratoId) {
  confirmAction('Excluir documento?', 'Este arquivo será removido do contrato.', () => {
    DB.delete('contratoDocumentos', id);
    showToast('Documento excluído.', 'success');
    gcRenderDocumentosTab(contratoId);
  }, '🗑️');
}

function gcDownloadDocumentoContrato(id) {
  const d = (DB.get('contratoDocumentos') || []).find(x => x.id === id);
  if (!d || !d.fileData) return;
  const a = document.createElement('a');
  a.href = d.fileData;
  a.download = d.nome;
  a.click();
}

function gcRenderDocumentosTab(contratoId) {
  const el = document.getElementById('gc-subtab-body');
  if (!el) return;
  const docs = gcObterDocumentosDoContrato(contratoId);
  el.innerHTML = `
    <div class="upload-area" style="padding:14px;text-align:center;margin-bottom:10px">
      <div style="font-size:11px;color:var(--gray400);margin-bottom:6px">PDF, Word, Excel, DWG, fotos, vídeos, ART, RRT, planilhas, croquis, ofícios, memoriais...</div>
      <label class="btn btn-primary btn-sm" style="cursor:pointer">📎 Enviar Documento<input type="file" multiple style="display:none" onchange="gcHandleUploadDocContrato(event,${contratoId})"></label>
    </div>
    ${docs.length === 0 ? `<div style="color:var(--gray400);font-size:12px;text-align:center;padding:16px">Nenhum documento enviado.</div>` : docs.map(d => `
      <div class="card" style="padding:8px 10px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:8px;min-width:0">
          <span style="font-size:18px">${gcDocIcon(d.tipo)}</span>
          <div style="min-width:0">
            <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px">${d.nome}</div>
            <div style="font-size:10px;color:var(--gray400)">${d.tipo} · ${d.tamanho} · ${FormatService.date(d.uploadAt)}</div>
          </div>
        </div>
        <div style="display:flex;gap:4px;flex-shrink:0">
          <button class="btn btn-ghost btn-sm" onclick="gcDownloadDocumentoContrato(${d.id})" title="Baixar">⬇️</button>
          <button class="btn btn-ghost btn-sm" onclick="gcExcluirDocumentoContrato(${d.id},${contratoId})" title="Excluir">🗑️</button>
        </div>
      </div>`).join('')}`;
}
