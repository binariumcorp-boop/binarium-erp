// ============================================================
// diario.js
// DIARIO + FOTOS + EQUIPE PRESENTE + TIPO + HORAS + REPETIR
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== DIÁRIO =====
function renderDiario() {
  const diario = DB.get('diario');
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  document.getElementById('stat-diario-total').textContent = diario.length;
  document.getElementById('stat-diario-mes').textContent = diario.filter(d => {
    const dt = new Date(d.data);
    return dt.getMonth() === mesAtual && dt.getFullYear() === anoAtual;
  }).length;
  document.getElementById('stat-diario-ocorr').textContent = diario.filter(d => d.tipo === 'Ocorrência').length;
  // Comparação segura: usa String() para não contar a mesma obra duas vezes
  // caso obraId esteja salvo como texto em alguns registros e número em outros.
  document.getElementById('stat-diario-obras').textContent = [...new Set(diario.map(d => String(d.obraId)))].length;
  populateSelect('diario-filter-obra', DB.get('obras'), 'id', 'nome', 'Obra: Todas');
  filterDiario();
}

function filterDiario() {
  const search = normalizarTextoBusca(document.getElementById('diario-search').value);
  const obraId = document.getElementById('diario-filter-obra').value;
  const tipo = document.getElementById('diario-filter-tipo').value;
  const data = document.getElementById('diario-filter-data').value;
  let diario = DB.get('diario');
  if (search) {
    diario = diario.filter(d =>
      normalizarTextoBusca(d.titulo).includes(search) ||
      normalizarTextoBusca(d.descricao).includes(search) ||
      normalizarTextoBusca(d.obraNome).includes(search) ||
      normalizarTextoBusca(d.responsavel).includes(search) ||
      normalizarTextoBusca(d.clima).includes(search) ||
      normalizarTextoBusca(d.tipo).includes(search) ||
      normalizarTextoBusca(d.servicos).includes(search) ||
      normalizarTextoBusca(d.equipamentos).includes(search)
    );
  }
  // Comparação segura de tipos entre o valor do select (texto) e o obraId salvo.
  if (obraId) diario = diario.filter(d => String(d.obraId) === String(obraId));
  if (tipo) diario = diario.filter(d => d.tipo === tipo);
  if (data) diario = diario.filter(d => d.data === data);
  diario = [...diario].sort((a, b) => (b.data||'').localeCompare(a.data||''));
  renderDiarioTable(diario);
}

function clearDiarioFilter() {
  document.getElementById('diario-search').value = '';
  document.getElementById('diario-filter-obra').value = '';
  document.getElementById('diario-filter-tipo').value = '';
  document.getElementById('diario-filter-data').value = '';
  filterDiario();
}

function renderDiarioTable(diario) {
  const tbody = document.getElementById('diario-table-body');
  if (diario.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--gray400);padding:20px">Nenhum registro encontrado</td></tr>';
    return;
  }
  tbody.innerHTML = diario.map(d => `
    <tr style="cursor:pointer" onclick="editarDiario(${d.id})">
      <td style="font-size:12px">${FormatService.date(d.data)}</td>
      <td style="font-size:12px">${d.obraNome||'-'}</td>
      <td><span class="badge ${d.tipo==='Ocorrência'?'badge-red':d.tipo==='Inspeção'?'badge-blue':'badge-green'}">${d.tipo}</span>${d.tipo==='Ocorrência' && d.gravidade ? ` <span class="badge ${d.gravidade==='Alta'?'badge-red':d.gravidade==='Média'?'badge-amber':'badge-green'}">${d.gravidade}</span>` : ''}</td>
      <td><div style="font-weight:600;font-size:13px">${d.titulo}</div></td>
      <td style="font-size:12px">${d.responsavel||'-'}</td>
      <td style="font-size:12px">${d.colaboradores||0} 👥${d.horasTrabalhadas?` · ${d.horasTrabalhadas}h`:''}</td>
      <td style="font-size:12px">${d.clima||'-'}</td>
      <td>${d.fotos && d.fotos.length
          ? `<div class="diario-thumb-cell" onclick="event.stopPropagation();abrirGaleriaDiario(${d.id})" title="Ver fotos"><img src="${d.fotos[0].dataUrl}" alt="foto"><span>📷 ${d.fotos.length}</span></div>`
          : `<span style="font-size:11px;color:var(--gray400)">-</span>`}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();verDiario(${d.id})" title="Ver">👁️</button>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();editarDiario(${d.id})" title="Editar">✏️</button>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();excluirDiario(${d.id})" title="Excluir">🗑️</button>
      </td>
    </tr>`).join('');
}

// Abre a galeria de fotos de um registro do diário direto pela tabela.
function abrirGaleriaDiario(id) {
  const d = DB.find('diario', id);
  if (!d || !d.fotos || !d.fotos.length) { showToast('Este registro não possui fotos.', 'warning'); return; }
  abrirGaleria(d.fotos, 0);
}

function verDiario(id) {
  const d = DB.find('diario', id);
  if (!d) { showToast('Registro não encontrado.', 'error'); return; }
  const equipeNomes = (d.equipeIds && d.equipeIds.length)
    ? d.equipeIds.map(id => { const c = DB.find('equipe', id); return c ? c.nome : null; }).filter(Boolean)
    : [];
  document.getElementById('view-diario-content').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
      <div><div class="form-label">Obra</div><div style="font-weight:600">${d.obraNome}</div></div>
      <div><div class="form-label">Data</div><div style="font-weight:600">${FormatService.date(d.data)}</div></div>
      <div><div class="form-label">Tipo</div><span class="badge ${d.tipo==='Ocorrência'?'badge-red':d.tipo==='Inspeção'?'badge-blue':'badge-green'}">${d.tipo}</span>${d.tipo==='Ocorrência' && d.gravidade ? ` <span class="badge ${d.gravidade==='Alta'?'badge-red':d.gravidade==='Média'?'badge-amber':'badge-green'}">${d.gravidade}</span>` : ''}</div>
      <div><div class="form-label">Clima</div><div>${d.clima||'-'}</div></div>
      <div><div class="form-label">Responsável</div><div>${d.responsavel||'-'}</div></div>
      <div><div class="form-label">Colaboradores</div><div>${d.colaboradores||0}${equipeNomes.length ? ` (${equipeNomes.length} da equipe${d.colaboradoresExtra?` + ${d.colaboradoresExtra} extra`:''})` : ''}</div></div>
      ${(d.horaInicio || d.horaFim) ? `<div><div class="form-label">Horário</div><div>${d.horaInicio||'-'} às ${d.horaFim||'-'}</div></div>` : ''}
      ${d.horasTrabalhadas ? `<div><div class="form-label">Horas Trabalhadas</div><div style="font-weight:600">${d.horasTrabalhadas} h</div></div>` : ''}
    </div>
    <div class="form-group"><div class="form-label">Título</div><div style="font-size:16px;font-weight:700">${d.titulo}</div></div>
    <div class="form-group"><div class="form-label">Descrição</div><div style="font-size:13px;line-height:1.6;white-space:pre-wrap">${d.descricao||'-'}</div></div>
    ${d.tipo==='Ocorrência' && d.acaoTomada ? `<div class="form-group"><div class="form-label">Ação Tomada</div><div style="font-size:13px">${d.acaoTomada}</div></div>` : ''}
    ${equipeNomes.length ? `<div class="form-group"><div class="form-label">Equipe Presente</div><div style="font-size:13px">${equipeNomes.join(', ')}</div></div>` : ''}
    ${d.equipamentos?`<div class="form-group"><div class="form-label">Equipamentos</div><div>${d.equipamentos}</div></div>`:''}
    ${d.materiais?`<div class="form-group"><div class="form-label">Materiais</div><div>${d.materiais}</div></div>`:''}
    ${d.servicos?`<div class="form-group"><div class="form-label">Serviços Executados</div><div>${d.servicos}</div></div>`:''}
    ${d.fotos && d.fotos.length ? `
    <div class="form-group">
      <div class="form-label">Fotos (${d.fotos.length})</div>
      <div class="diario-fotos-grid">
        ${d.fotos.map((f, i) => `
          <div class="diario-foto-thumb">
            <img src="${f.dataUrl}" alt="${f.nome||'Foto'}" onclick="abrirGaleria(DB.find('diario', ${d.id}).fotos, ${i})">
          </div>`).join('')}
      </div>
    </div>` : ''}`;
  openModal('view-diario');
}

function editarDiario(id) {
  const d = DB.find('diario', id);
  if (!d) { showToast('Registro não encontrado.', 'error'); return; }
  document.getElementById('diario-modal-title').textContent = 'Editar Registro';
  document.getElementById('diario-edit-id').value = d.id;
  openModal('novo-diario');
  // A troca de obra em um registro existente é permitida (ver editarDiario/
  // salvarDiario), então o select deve ficar habilitado durante a edição —
  // apenas o cadastro contextual (novoDiarioParaObra) o bloqueia.
  const selObra = document.getElementById('diario-obra');
  selObra.disabled = false;
  selObra.value = d.obraId;
  document.getElementById('diario-data').value = d.data;
  document.getElementById('diario-tipo').value = d.tipo;
  toggleDiarioOcorrencia();
  document.getElementById('diario-gravidade').value = d.gravidade || 'Baixa';
  document.getElementById('diario-acao-tomada').value = d.acaoTomada || '';
  document.getElementById('diario-clima').value = d.clima || 'Ensolarado';
  document.getElementById('diario-titulo').value = d.titulo;
  document.getElementById('diario-descricao').value = d.descricao || '';
  document.getElementById('diario-hora-inicio').value = d.horaInicio || '';
  document.getElementById('diario-hora-fim').value = d.horaFim || '';
  document.getElementById('diario-colaboradores').value = (d.colaboradoresExtra !== undefined ? d.colaboradoresExtra : d.colaboradores) || 0;
  document.getElementById('diario-responsavel').value = d.responsavel || '';
  document.getElementById('diario-equipamentos').value = d.equipamentos || '';
  document.getElementById('diario-materiais').value = d.materiais || '';
  document.getElementById('diario-servicos').value = d.servicos || '';
  diarioEquipeSelecionada = new Set((d.equipeIds || []).map(String));
  renderDiarioEquipeChecklist(d.obraId);
  calcularHorasDiario();
  diarioFotosAtuais = d.fotos ? d.fotos.slice() : [];
  renderDiarioFotosPreview();
  const quickbar = document.getElementById('diario-quickbar');
  if (quickbar) quickbar.style.display = 'none';
}

function salvarDiario() {
  // Impede que o mesmo clique (duplo clique, por exemplo) cadastre ou
  // atualize o registro duas vezes. Só trava quando o salvamento realmente
  // é executado; qualquer falha de validação libera o formulário na hora.
  if (salvarDiario._processing) return;

  const obraIdRaw = document.getElementById('diario-obra').value;
  const data = document.getElementById('diario-data').value;
  const titulo = document.getElementById('diario-titulo').value.trim();
  if (!obraIdRaw) { showToast('Selecione uma obra.', 'error'); return; }
  if (!data || isNaN(new Date(data).getTime())) { showToast('Informe uma data válida.', 'error'); return; }
  if (!ValidationService.required(titulo, 'Título')) return;

  // O relacionamento principal é sempre pelo obraId; nunca confiar apenas
  // no texto exibido no select. Se a obra não existir mais, não salva.
  const obra = obterObraPorId(obraIdRaw);
  if (!obra) {
    showToast('A obra selecionada não foi encontrada. Selecione uma obra válida.', 'error');
    return; // mantém o modal aberto
  }
  const obraId = obra.id;

  const colaboradoresExtraRaw = parseInt(document.getElementById('diario-colaboradores').value);
  const colaboradoresExtra = isNaN(colaboradoresExtraRaw) ? 0 : Math.max(0, colaboradoresExtraRaw);
  const equipeIds = [...diarioEquipeSelecionada].map(id => parseInt(id)).filter(id => !isNaN(id));
  const colaboradores = equipeIds.length + colaboradoresExtra; // total, mantido para compatibilidade com relatórios/estatísticas existentes

  const horaInicio = document.getElementById('diario-hora-inicio').value;
  const horaFim = document.getElementById('diario-hora-fim').value;
  const horasTrabalhadas = calcularHorasDiario();
  if (horaInicio && horaFim && horasTrabalhadas !== null && horasTrabalhadas <= 0) {
    showToast('O horário final deve ser diferente do horário inicial.', 'error');
    return;
  }

  const tipo = document.getElementById('diario-tipo').value;

  const editId = parseInt(document.getElementById('diario-edit-id').value);
  const item = {
    obraId, obraNome: obra.nome,
    data, tipo,
    clima: document.getElementById('diario-clima').value,
    titulo, descricao: document.getElementById('diario-descricao').value.trim(),
    horaInicio, horaFim,
    horasTrabalhadas: horasTrabalhadas !== null ? Number(horasTrabalhadas.toFixed(1)) : null,
    equipeIds, colaboradoresExtra, colaboradores,
    responsavel: document.getElementById('diario-responsavel').value.trim(),
    equipamentos: document.getElementById('diario-equipamentos').value.trim(),
    materiais: document.getElementById('diario-materiais').value.trim(),
    servicos: document.getElementById('diario-servicos').value.trim(),
    gravidade: tipo === 'Ocorrência' ? document.getElementById('diario-gravidade').value : '',
    acaoTomada: tipo === 'Ocorrência' ? document.getElementById('diario-acao-tomada').value.trim() : '',
    fotos: diarioFotosAtuais.slice()
  };

  // A partir daqui o salvamento será executado de fato — trava contra o
  // reenvio duplicado do mesmo clique e libera logo em seguida.
  salvarDiario._processing = true;
  try {
    let obraIdAnterior = null;
    if (editId) {
      const registroAnterior = DB.find('diario', editId);
      if (registroAnterior) obraIdAnterior = registroAnterior.obraId;
      DB.update('diario', editId, item);
      showToast('Registro atualizado!', 'success');
    } else {
      DB.add('diario', item);
      showToast('Registro salvo!', 'success');
    }
    closeModal();
    // Se o registro foi transferido para outra obra, atualiza as duas telas.
    if (obraIdAnterior !== null && String(obraIdAnterior) !== String(obraId)) {
      atualizarAposAlteracaoDeDiario(obraIdAnterior);
    }
    atualizarAposAlteracaoDeDiario(obraId);
  } finally {
    setTimeout(() => { salvarDiario._processing = false; }, 400);
  }
}

function excluirDiario(id) {
  const d = DB.find('diario', id);
  if (!d) { showToast('Registro não encontrado.', 'error'); return; }
  confirmAction('Excluir registro?', `O registro "${d.titulo}" de ${FormatService.date(d.data)} será removido.`, () => {
    const obraId = d.obraId;
    DB.delete('diario', id);
    showToast('Registro excluído.', 'success');
    atualizarAposAlteracaoDeDiario(obraId);
  }, '🗑️');
}

// Atualização centralizada após criar, editar ou excluir um registro do
// diário: reutiliza as funções de renderização já existentes no sistema,
// verificando sua existência antes de chamá-las, e nunca redireciona o
// usuário para fora da página/aba em que ele já estava.
function atualizarAposAlteracaoDeDiario(obraId) {
  if (typeof renderDiario === 'function' && currentPage === 'diario') {
    renderDiario();
  }
  if (typeof renderDashboard === 'function' && currentPage === 'dashboard') {
    renderDashboard();
  }
  // Só re-renderiza a tela de detalhes se ela estiver realmente aberta,
  // para não redirecionar o usuário de outra página por engano.
  if (typeof renderObraDetalhe === 'function' && currentPage === 'obra-detalhe' && currentObraId) {
    renderObraDetalhe();
  }
  if (typeof refreshPainelObraSeAberto === 'function') {
    refreshPainelObraSeAberto(obraId);
  }
}

function exportDiario() {
  const diario = [...DB.get('diario')].sort((a, b) => (b.data||'').localeCompare(a.data||''));
  const csv = 'Data,Obra,Tipo,Gravidade,Título,Responsável,Clima,Hora Início,Hora Fim,Horas Trabalhadas,Colaboradores,Equipamentos,Materiais,Fotos\n' + diario.map(d =>
    `"${FormatService.date(d.data)}","${d.obraNome}","${d.tipo}","${d.gravidade||''}","${d.titulo}","${d.responsavel||''}","${d.clima||''}","${d.horaInicio||''}","${d.horaFim||''}","${d.horasTrabalhadas||''}","${d.colaboradores||0}","${(d.equipamentos||'').replace(/"/g,'""')}","${(d.materiais||'').replace(/"/g,'""')}","${d.fotos?d.fotos.length:0}"`
  ).join('\n');
  downloadFile('diario_obra_mbsolucoes.csv', csv, 'text/csv');
}

function imprimirDiario() { window.print(); }

// ===== DIÁRIO DE OBRA – FOTOS =====
// Estado em memória das fotos do registro que está sendo criado/editado no
// modal. É persistido em diario.fotos somente ao clicar em "Salvar Registro".
let diarioFotosAtuais = [];
// Controla o comprovante anexado no modal de Movimentação Financeira.
// null = nenhum arquivo novo selecionado (mantém o que já existia, se houver);
// 'REMOVE' = usuário pediu para remover o comprovante existente;
// {fileData, fileName} = novo arquivo pronto para ser salvo como documento.
let movComprovanteAtual = null;

function handleMovComprovante(event) {
  const file = event.target.files[0];
  if (!file) return;
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) { showToast(`Arquivo muito grande: ${file.name} (máx. 50MB)`, 'error'); event.target.value = ''; return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    movComprovanteAtual = { fileData: e.target.result, fileName: file.name };
    renderMovComprovantePreview();
  };
  reader.readAsDataURL(file);
}

function removerMovComprovante() {
  movComprovanteAtual = 'REMOVE';
  document.getElementById('mov-comprovante').value = '';
  renderMovComprovantePreview();
}

function renderMovComprovantePreview() {
  const wrap = document.getElementById('mov-comprovante-preview');
  if (!wrap) return;
  if (movComprovanteAtual === 'REMOVE') {
    wrap.innerHTML = '<span style="color:var(--red)">Comprovante será removido ao salvar.</span>';
  } else if (movComprovanteAtual && movComprovanteAtual.fileName) {
    wrap.innerHTML = `📎 ${movComprovanteAtual.fileName} <a href="javascript:void(0)" onclick="removerMovComprovante()" style="color:var(--red);margin-left:8px">remover</a>`;
  } else {
    const editId = parseInt(document.getElementById('mov-edit-id').value);
    const f = editId ? DB.find('financeiro', editId) : null;
    if (f && f.comprovanteId) {
      wrap.innerHTML = `📎 <a href="javascript:void(0)" onclick="downloadDoc(${f.comprovanteId})" style="color:var(--blue)">${f.comprovanteNome || 'Ver comprovante'}</a> <a href="javascript:void(0)" onclick="removerMovComprovante()" style="color:var(--red);margin-left:8px">remover</a>`;
    } else {
      wrap.innerHTML = '';
    }
  }
}

// IDs (Set) dos colaboradores marcados como presentes no registro em edição.
let diarioEquipeSelecionada = new Set();

// ===== DIÁRIO DE OBRA – EQUIPE PRESENTE =====
function renderDiarioEquipeChecklist(obraId) {
  const box = document.getElementById('diario-equipe-box');
  if (!obraId) {
    box.innerHTML = '<div class="diario-equipe-vazio">Selecione uma obra para listar a equipe.</div>';
    atualizarContadorEquipeDiario();
    return;
  }
  const equipe = DB.get('equipe').filter(e => String(e.obraId) === String(obraId));
  if (equipe.length === 0) {
    box.innerHTML = '<div class="diario-equipe-vazio">Nenhum colaborador alocado nesta obra ainda.</div>';
    atualizarContadorEquipeDiario();
    return;
  }
  box.innerHTML = equipe.map(e => `
    <label class="diario-equipe-item">
      <input type="checkbox" value="${e.id}" ${diarioEquipeSelecionada.has(String(e.id)) ? 'checked' : ''} onchange="toggleDiarioEquipe(${e.id}, this.checked)">
      <span>${e.nome}</span><span class="func">${e.funcao||''}</span>
    </label>`).join('');
  atualizarContadorEquipeDiario();
}

function toggleDiarioEquipe(id, marcado) {
  if (marcado) diarioEquipeSelecionada.add(String(id));
  else diarioEquipeSelecionada.delete(String(id));
  atualizarContadorEquipeDiario();
}

function marcarTodaEquipeDiario(marcarTudo) {
  const box = document.getElementById('diario-equipe-box');
  const checks = box.querySelectorAll('input[type="checkbox"]');
  checks.forEach(c => {
    c.checked = marcarTudo;
    if (marcarTudo) diarioEquipeSelecionada.add(c.value);
    else diarioEquipeSelecionada.delete(c.value);
  });
  atualizarContadorEquipeDiario();
}

function atualizarContadorEquipeDiario() {
  const extraRaw = parseInt(document.getElementById('diario-colaboradores') ? document.getElementById('diario-colaboradores').value : 0);
  const extra = isNaN(extraRaw) ? 0 : Math.max(0, extraRaw);
  const totalEl = document.getElementById('diario-equipe-count');
  if (totalEl) {
    const total = diarioEquipeSelecionada.size + extra;
    totalEl.textContent = `${diarioEquipeSelecionada.size} da equipe selecionado(s)${extra ? ' + ' + extra + ' extra(s)' : ''} — ${total} no total`;
  }
}

function aoTrocarObraDiario() {
  diarioEquipeSelecionada = new Set();
  const obraId = document.getElementById('diario-obra').value;
  renderDiarioEquipeChecklist(obraId);
  const editId = document.getElementById('diario-edit-id').value;
  const quickbar = document.getElementById('diario-quickbar');
  if (quickbar) quickbar.style.display = (!editId && obraId) ? 'flex' : 'none';
}

// ===== DIÁRIO DE OBRA – TIPO OCORRÊNCIA =====
function toggleDiarioOcorrencia() {
  const tipo = document.getElementById('diario-tipo').value;
  document.getElementById('diario-ocorrencia-wrap').style.display = (tipo === 'Ocorrência') ? 'block' : 'none';
}

// ===== DIÁRIO DE OBRA – HORAS TRABALHADAS =====
function calcularHorasDiario() {
  const ini = document.getElementById('diario-hora-inicio').value;
  const fim = document.getElementById('diario-hora-fim').value;
  const resEl = document.getElementById('diario-horas-resultado');
  if (!ini || !fim) { resEl.style.display = 'none'; return null; }
  const [h1, m1] = ini.split(':').map(Number);
  const [h2, m2] = fim.split(':').map(Number);
  let minutos = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (minutos < 0) minutos += 24 * 60; // turno vira a meia-noite
  const horas = minutos / 60;
  resEl.style.display = 'flex';
  resEl.innerHTML = `⏱️ ${horas.toFixed(1).replace('.0','')} h trabalhadas no dia (${ini} às ${fim})`;
  return horas;
}

// ===== DIÁRIO DE OBRA – REPETIR ÚLTIMO REGISTRO =====
// Agiliza o lançamento diário: puxa equipe, equipamentos, clima e horários
// do último registro da mesma obra, deixando o usuário só ajustar o que
// mudou (título/descrição do dia).
function repetirUltimoRegistroDiario() {
  const obraId = document.getElementById('diario-obra').value;
  if (!obraId) { showToast('Selecione uma obra primeiro.', 'warning'); return; }
  const registros = DB.get('diario').filter(d => String(d.obraId) === String(obraId));
  if (registros.length === 0) { showToast('Nenhum registro anterior desta obra para repetir.', 'warning'); return; }
  const ultimo = [...registros].sort((a,b) => (b.data||'').localeCompare(a.data||'') || (b.id||0)-(a.id||0))[0];
  document.getElementById('diario-clima').value = ultimo.clima || 'Ensolarado';
  document.getElementById('diario-hora-inicio').value = ultimo.horaInicio || '';
  document.getElementById('diario-hora-fim').value = ultimo.horaFim || '';
  document.getElementById('diario-equipamentos').value = ultimo.equipamentos || '';
  document.getElementById('diario-materiais').value = ultimo.materiais || '';
  document.getElementById('diario-responsavel').value = ultimo.responsavel || '';
  document.getElementById('diario-colaboradores').value = ultimo.colaboradoresExtra || 0;
  diarioEquipeSelecionada = new Set((ultimo.equipeIds || []).map(String));
  renderDiarioEquipeChecklist(obraId);
  calcularHorasDiario();
  showToast('Dados do último registro carregados. Ajuste o título/descrição de hoje.', 'success');
}

// Abre o modal "Novo Registro" totalmente limpo (sem obra pré-travada),
// usado pelo botão da tela Diário de Obra.
function abrirNovoDiarioEmBranco() {
  diarioFotosAtuais = [];
  renderDiarioFotosPreview();
  diarioEquipeSelecionada = new Set();
  openModal('novo-diario');
  renderDiarioEquipeChecklist('');
}

function handleDiarioFotoUpload(event) {
  const files = Array.from(event.target.files);
  processDiarioFotoFiles(files);
  event.target.value = '';
}

function handleDiarioFotoDrop(event) {
  event.preventDefault();
  document.getElementById('diario-foto-upload-area').classList.remove('drag');
  const files = Array.from(event.dataTransfer.files);
  processDiarioFotoFiles(files);
}

function handleDiarioFotoDragOver(event) {
  event.preventDefault();
  document.getElementById('diario-foto-upload-area').classList.add('drag');
}

function handleDiarioFotoDragLeave(event) {
  document.getElementById('diario-foto-upload-area').classList.remove('drag');
}

function processDiarioFotoFiles(files) {
  const maxSize = 15 * 1024 * 1024; // 15MB por foto original
  const validas = files.filter(f => {
    if (!f.type.startsWith('image/')) { showToast(`"${f.name}" não é uma imagem.`, 'error'); return false; }
    if (f.size > maxSize) { showToast(`"${f.name}" excede o limite de 15MB.`, 'error'); return false; }
    return true;
  });
  if (!validas.length) return;
  let restantes = validas.length;
  validas.forEach(file => {
    comprimirImagemDiario(file, (dataUrl) => {
      diarioFotosAtuais.push({ nome: file.name, dataUrl });
      renderDiarioFotosPreview();
      restantes--;
      if (restantes === 0) {
        showToast(validas.length === 1 ? 'Foto adicionada!' : `${validas.length} fotos adicionadas!`, 'success');
      }
    });
  });
}

// Redimensiona a imagem (máx. 1600px no maior lado) e comprime para JPEG
// antes de guardar em base64, para manter o armazenamento local leve mesmo
// com várias fotos por registro.
function comprimirImagemDiario(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1600;
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w >= h) { h = Math.round(h * (maxDim / w)); w = maxDim; }
        else { w = Math.round(w * (maxDim / h)); h = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => callback(e.target.result);
    img.src = e.target.result;
  };
  reader.onerror = () => showToast(`Falha ao ler "${file.name}".`, 'error');
  reader.readAsDataURL(file);
}

function removeDiarioFoto(index) {
  diarioFotosAtuais.splice(index, 1);
  renderDiarioFotosPreview();
}

function renderDiarioFotosPreview() {
  const wrap = document.getElementById('diario-fotos-preview');
  if (!wrap) return;
  wrap.innerHTML = diarioFotosAtuais.map((f, i) => `
    <div class="diario-foto-thumb">
      <img src="${f.dataUrl}" alt="${f.nome || 'Foto'}" onclick="abrirGaleria(diarioFotosAtuais, ${i})">
      <button type="button" class="diario-foto-remove" onclick="event.stopPropagation();removeDiarioFoto(${i})" title="Remover foto">✕</button>
    </div>`).join('');
}

