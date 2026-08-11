// ============================================================
// backup.js
// FASE 2: BACKUP E RESTAURACAO
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== FASE 2: BACKUP E RESTAURAÇÃO =====
function initBackup() {
  // Adicionar botões nas configurações
  const cfgSeg = document.getElementById('ctab-seguranca');
  if (!cfgSeg || document.getElementById('backup-section')) return;
  const backupHTML = `
    <div class="card" id="backup-section">
      <div class="section-title mb-16">Backup e Restauração</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
        <button class="btn btn-primary" onclick="exportarBackup()">📥 Exportar Backup Completo</button>
        <button class="btn btn-ghost" onclick="document.getElementById('import-backup').click()">📤 Importar Backup</button>
        <input type="file" id="import-backup" accept=".json" style="display:none" onchange="importarBackup(event)">
      </div>
      <div class="alert alert-info" style="font-size:12px">O backup exporta todos os dados do sistema em formato JSON. A restauração substituirá todos os dados atuais.</div>
    </div>`;
  cfgSeg.insertAdjacentHTML('beforeend', backupHTML);
}

function exportarBackup() {
  const backup = {
    versao: '2.0.0',
    data: new Date().toISOString(),
    sistema: 'MB Soluções',
    dados: {}
  };
  Object.keys(DB.KEYS).forEach(k => {
    backup.dados[k] = DB.get(k);
  });
  backup.dados.config = DB.getConfig();
  const json = JSON.stringify(backup, null, 2);
  downloadFile(`mbsolucoes-backup-${new Date().toISOString().split('T')[0]}.json`, json, 'application/json');
  showToast('Backup exportado com sucesso!', 'success');
}

function importarBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const backup = JSON.parse(e.target.result);
      if (!backup.dados || !backup.sistema) { showToast('Arquivo de backup inválido.', 'error'); return; }
      confirmAction(
        'Restaurar backup?',
        `Backup de ${FormatService.date(backup.data?.split('T')[0])} (v${backup.versao}). Todos os dados atuais serão substituídos.`,
        () => {
          Object.keys(backup.dados).forEach(k => {
            if (DB.KEYS[k]) StorageService.set(DB.KEYS[k], backup.dados[k]);
          });
          if (backup.dados.config) DB.setConfig(backup.dados.config);
          showToast('Backup restaurado! Recarregando...', 'success');
          setTimeout(() => location.reload(), 1500);
        },
        '📤'
      );
    } catch { showToast('Erro ao ler o arquivo de backup.', 'error'); }
  };
  reader.readAsText(file);
  event.target.value = '';
}

