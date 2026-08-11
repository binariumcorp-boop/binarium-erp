// ============================================================
// utils-gerais.js
// UTILITARIOS
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== UTILITÁRIOS =====
function statusColor(status) {
  const map = { 'Em Andamento': 'prog-blue', 'Concluída': 'prog-green', 'Concluindo': 'prog-green', 'Atrasada': 'prog-red', 'Paralisada': 'prog-red', 'Pendente': 'prog-amber', 'Atrasado': 'prog-red', 'Concluído': 'prog-green', 'Não Iniciada': 'prog-gray' };
  return map[status] || 'prog-blue';
}

function badgeClass(status) {
  const map = { 'Em Andamento': 'badge-blue', 'Concluída': 'badge-green', 'Concluindo': 'badge-green', 'Concluído': 'badge-green', 'Atrasada': 'badge-red', 'Atrasado': 'badge-red', 'Paralisada': 'badge-red', 'Planejada': 'badge-gray', 'Pendente': 'badge-amber', 'Ativo': 'badge-green', 'Inativo': 'badge-red', 'A Vencer': 'badge-amber', 'Vencido': 'badge-red', 'Encerrado': 'badge-gray', 'Aprovado': 'badge-green', 'Rejeitado': 'badge-red', 'Não Iniciada': 'badge-gray' };
  return map[status] || 'badge-gray';
}

function populateSelect(selectId, items, valueKey, labelKey, emptyLabel) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = emptyLabel ? `<option value="">${emptyLabel}</option>` : '';
  items.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item[valueKey];
    opt.textContent = item[labelKey];
    sel.appendChild(opt);
  });
  if (cur) sel.value = cur;
}

function updateObrasSelects() {
  const obras = DB.get('obras');
  ['serv-obra','colab-obra','mov-obra','est-obra','mov-est-obra','diario-obra','crono-obra','ct-obra','doc-obra','doc-filter-obra','servicos-filter-obra','equipe-filter-obra','fin-filter-obra','diario-filter-obra','crono-filter-obra','contratos-filter-obra','rel-obra'].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) {
      const cur = sel.value;
      const emptyOpt = sel.options[0];
      const emptyLabel = emptyOpt ? emptyOpt.textContent : '';
      sel.innerHTML = emptyLabel ? `<option value="">${emptyLabel}</option>` : '';
      obras.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.id;
        opt.textContent = o.nome;
        sel.appendChild(opt);
      });
      if (cur) sel.value = cur;
    }
  });
  // Populate estoque item select
  const estItems = DB.get('estoque');
  const movEstItem = document.getElementById('mov-est-item');
  if (movEstItem) {
    movEstItem.innerHTML = '<option value="">Selecione um item</option>' + estItems.map(e => `<option value="${e.id}">${e.nome} (${e.qtd} ${e.unidade})</option>`).join('');
  }
}

function adjustColor(hex, amount) {
  const num = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function hexToLight(hex) {
  const num = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, ((num >> 16) & 255) + 180);
  const g = Math.min(255, ((num >> 8) & 255) + 180);
  const b = Math.min(255, (num & 255) + 180);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Arquivo exportado: ' + filename, 'success');
}

