// ============================================================
// cronograma.js
// CRONOGRAMA
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== CRONOGRAMA =====

// Funções centrais de acesso à base de cronograma. Todo o módulo (e os
// módulos que integram com ele — Dashboard, Obra Detalhe, Linha do Tempo,
// migrações) deve ler e gravar através destas funções, evitando bases
// paralelas e mantendo uma única fonte de verdade.
function obterCronogramas() {
  return DB.get('cronograma') || [];
}

function salvarCronogramas(cronogramasAtualizados) {
  return DB.set('cronograma', cronogramasAtualizados || []);
}

// Comparação sempre via String() para tolerar id salvo como texto ou número,
// sem depender de igualdade estrita.
function obterCronogramaPorId(cronogramaId) {
  if (cronogramaId === null || cronogramaId === undefined || cronogramaId === '') return null;
  return obterCronogramas().find(c => String(c.id) === String(cronogramaId)) || null;
}

function obterCronogramasDaObra(obraId) {
  if (obraId === null || obraId === undefined || obraId === '') return [];
  return obterCronogramas().filter(c => String(c.obraId) === String(obraId));
}

// Uma atividade é considerada atrasada quando não está concluída/cancelada,
// possui data final válida e essa data já passou sem 100% de execução.
// Não sobrescreve o status manual salvo — é usada apenas para indicadores.
function isAtividadeAtrasada(c) {
  if (!c) return false;
  if (c.status === 'Concluída' || c.status === 'Cancelada') return false;
  const fim = criarDataLocal(c.fim);
  if (!fim) return false;
  const hoje = criarDataLocal(formatarDataLocalISO(new Date()));
  const progresso = normalizarProgresso(c.progresso);
  return fim < hoje && progresso < 100;
}

function renderCronograma() {
  const crono = obterCronogramas();
  document.getElementById('stat-crono-total').textContent = crono.length;
  document.getElementById('stat-crono-conc').textContent = crono.filter(c => c.status === 'Concluída').length;
  document.getElementById('stat-crono-and').textContent = crono.filter(c => c.status === 'Em Andamento').length;
  // Considera tanto o status manual "Atrasada" quanto atividades cujo prazo
  // já venceu sem conclusão, evitando subestimar o indicador.
  document.getElementById('stat-crono-atr').textContent = crono.filter(c => c.status === 'Atrasada' || isAtividadeAtrasada(c)).length;
  populateSelect('crono-filter-obra', DB.get('obras'), 'id', 'nome', 'Obra: Todas');
  renderGantt();
  renderCronoTable();
}

// Aplica os filtros ativos (obra, status, pesquisa) e retorna a lista
// resultante ordenada por data de início — usada tanto pela tabela quanto
// pelo Gantt, para que ambos sempre mostrem o mesmo conjunto de atividades.
function obterCronogramaFiltrado() {
  const obraId = document.getElementById('crono-filter-obra').value;
  const statusEl = document.getElementById('crono-filter-status');
  const status = statusEl ? statusEl.value : '';
  const searchEl = document.getElementById('crono-search');
  const search = searchEl ? normalizarTextoBusca(searchEl.value) : '';
  let crono = obterCronogramas();
  if (obraId) crono = crono.filter(c => String(c.obraId) === String(obraId));
  if (status) crono = crono.filter(c => c.status === status);
  if (search) {
    crono = crono.filter(c =>
      normalizarTextoBusca(c.nome).includes(search) ||
      normalizarTextoBusca(c.obraNome).includes(search) ||
      normalizarTextoBusca(c.etapa).includes(search) ||
      normalizarTextoBusca(c.responsavel).includes(search) ||
      normalizarTextoBusca(c.status).includes(search)
    );
  }
  return [...crono].sort((a, b) => {
    const di = criarDataLocal(a.inicio), dj = criarDataLocal(b.inicio);
    if (di && dj && di.getTime() !== dj.getTime()) return di - dj;
    if (di && !dj) return -1;
    if (!di && dj) return 1;
    return String(a.nome||'').localeCompare(String(b.nome||''));
  });
}

function clearCronoFilter() {
  const searchEl = document.getElementById('crono-search');
  const statusEl = document.getElementById('crono-filter-status');
  if (searchEl) searchEl.value = '';
  if (statusEl) statusEl.value = '';
  filterCronograma();
}

// Reaplica os filtros (obra, status, pesquisa) tanto na tabela quanto no
// Gantt, mantendo os dois sempre sincronizados.
function filterCronograma() {
  renderGantt();
  renderCronoTable();
}

function renderGantt() {
  const crono = obterCronogramaFiltrado();
  if (crono.length === 0) {
    document.getElementById('gantt-container').innerHTML = '<div style="color:var(--gray400);font-size:12px;text-align:center;padding:20px">Nenhuma atividade no cronograma</div>';
    return;
  }
  // Só considera datas válidas para calcular o intervalo visível; atividades
  // sem data não quebram o cálculo (aparecem na tabela, mas não no Gantt).
  const datasValidas = crono
    .flatMap(c => [criarDataLocal(c.inicio), criarDataLocal(c.fim)])
    .filter(Boolean)
    .sort((a, b) => a - b);
  if (datasValidas.length === 0) {
    document.getElementById('gantt-container').innerHTML = '<div style="color:var(--gray400);font-size:12px;text-align:center;padding:20px">Nenhuma atividade com datas válidas para exibir no Gantt</div>';
    return;
  }
  const minDate = datasValidas[0];
  const maxDate = datasValidas[datasValidas.length - 1];
  const totalDays = Math.max(1, diferencaEmDias(formatarDataLocalISO(minDate), formatarDataLocalISO(maxDate))) + 7;
  const cols = Math.min(Math.ceil(totalDays / 7), 16);
  const ganttHTML = `
    <div style="min-width:600px">
      <div style="display:grid;grid-template-columns:200px 1fr;gap:0;border:1px solid var(--gray200);border-radius:8px;overflow:hidden">
        <div style="background:var(--gray50);padding:10px 12px;font-size:11px;font-weight:600;color:var(--gray400);border-right:1px solid var(--gray200)">ATIVIDADE</div>
        <div style="background:var(--gray50);display:grid;grid-template-columns:repeat(${cols},1fr);border-bottom:1px solid var(--gray200)">
          ${Array.from({length:cols},(_,i)=>{const d=new Date(minDate);d.setDate(d.getDate()+i*7);return `<div style="padding:6px 4px;font-size:10px;color:var(--gray400);text-align:center;border-right:1px solid var(--gray100)">${d.getDate()}/${d.getMonth()+1}</div>`;}).join('')}
        </div>
        ${crono.map(c => {
          const inicioC = criarDataLocal(c.inicio);
          const fimC = criarDataLocal(c.fim);
          // Sem data inicial válida, a atividade não pode ser posicionada na
          // grade — evita gerar índices NaN.
          const start = inicioC ? Math.max(0, Math.floor(diferencaEmDias(formatarDataLocalISO(minDate), formatarDataLocalISO(inicioC)) / 7)) : 0;
          const diasDuracao = (inicioC && fimC) ? Math.max(0, diferencaEmDias(c.inicio, c.fim)) : 0;
          const dur = Math.max(1, Math.round(diasDuracao / 7) || 1);
          const atrasada = isAtividadeAtrasada(c);
          const cor = c.status === 'Concluída' ? 'var(--green)' : (c.status === 'Atrasada' || atrasada) ? 'var(--red)' : c.status === 'Em Andamento' ? 'var(--blue)' : 'var(--gray200)';
          return `
            <div style="padding:8px 12px;font-size:12px;border-right:1px solid var(--gray200);border-bottom:1px solid var(--gray100);display:flex;align-items:center;gap:6px">
              <span class="badge ${badgeClass(c.status)}" style="font-size:9px">${normalizarProgresso(c.progresso)}%</span>
              <span style="font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.nome}</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(${cols},1fr);border-bottom:1px solid var(--gray100);align-items:center">
              ${Array.from({length:cols},(_,i)=>{
                if(inicioC && i>=start && i<start+dur){
                  const isFirst=i===start, isLast=i===start+dur-1;
                  return `<div style="background:${cor};height:16px;border-radius:${isFirst?'4px':0} ${isLast?'4px':0} ${isLast?'4px':0} ${isFirst?'4px':0};opacity:.85"></div>`;
                }
                return '<div></div>';
              }).join('')}
            </div>`;
        }).join('')}
      </div>
    </div>`;
  document.getElementById('gantt-container').innerHTML = ganttHTML;
}

function renderCronoTable() {
  const crono = obterCronogramaFiltrado();
  const tbody = document.getElementById('crono-table-body');
  if (crono.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--gray400);padding:20px">Nenhuma atividade encontrada</td></tr>';
    return;
  }
  tbody.innerHTML = crono.map(c => `
    <tr style="cursor:pointer" onclick="editarAtividade(${c.id})">
      <td><div style="font-weight:600;font-size:13px">${c.nome}</div></td>
      <td style="font-size:12px">${c.obraNome||'-'}</td>
      <td style="font-size:12px">${c.etapa||'-'}</td>
      <td style="font-size:12px">${FormatService.date(c.inicio)}</td>
      <td style="font-size:12px">${FormatService.date(c.fim)}</td>
      <td><div style="display:flex;align-items:center;gap:6px"><div class="prog-bar" style="width:60px"><div class="prog-fill ${statusColor(c.status)}" style="width:${normalizarProgresso(c.progresso)}%"></div></div><span style="font-size:12px">${normalizarProgresso(c.progresso)}%</span></div></td>
      <td><span class="badge ${badgeClass(c.status)}">${c.status}</span></td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();editarAtividade(${c.id})" title="Editar">✏️</button>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();excluirAtividade(${c.id})" title="Excluir">🗑️</button>
      </td>
    </tr>`).join('');
}

function editarAtividade(id) {
  const c = DB.find('cronograma', id);
  if (!c) { showToast('Atividade não encontrada.', 'error'); return; }
  document.getElementById('crono-modal-title').textContent = 'Editar Atividade';
  document.getElementById('crono-edit-id').value = c.id;
  openModal('nova-atividade');
  // A troca de obra em uma atividade existente é permitida, então o select
  // deve ficar habilitado durante a edição — apenas o cadastro contextual
  // (novaAtividadeParaObra) o bloqueia.
  const selObra = document.getElementById('crono-obra');
  selObra.disabled = false;
  selObra.value = c.obraId;
  document.getElementById('crono-nome').value = c.nome;
  document.getElementById('crono-etapa').value = c.etapa || '';
  document.getElementById('crono-inicio').value = c.inicio || '';
  document.getElementById('crono-fim').value = c.fim || '';
  document.getElementById('crono-progresso').value = normalizarProgresso(c.progresso);
  document.getElementById('crono-status').value = c.status;
  document.getElementById('crono-responsavel').value = c.responsavel || '';
}

function salvarAtividade() {
  // Impede que o mesmo clique (duplo clique, por exemplo) cadastre ou
  // atualize a atividade duas vezes. Só trava quando o salvamento realmente
  // é executado; qualquer falha de validação libera o formulário na hora.
  if (salvarAtividade._processing) return;

  const nome = document.getElementById('crono-nome').value.trim();
  const obraIdRaw = document.getElementById('crono-obra').value;
  if (!ValidationService.required(nome, 'Nome da atividade')) return;
  if (!obraIdRaw) { showToast('Selecione uma obra.', 'error'); return; }

  // O relacionamento principal é sempre pelo obraId; nunca confiar apenas
  // no texto exibido no select. Se a obra não existir mais, não salva.
  const obra = obterObraPorId(obraIdRaw);
  if (!obra) {
    showToast('A obra selecionada não foi encontrada. Selecione uma obra válida.', 'error');
    return; // mantém o modal aberto
  }
  const obraId = obra.id;

  const inicio = document.getElementById('crono-inicio').value;
  const fim = document.getElementById('crono-fim').value;
  if (inicio && !criarDataLocal(inicio)) { showToast('Data de início inválida.', 'error'); return; }
  if (fim && !criarDataLocal(fim)) { showToast('Data de fim inválida.', 'error'); return; }
  if (inicio && fim && diferencaEmDias(inicio, fim) < 0) {
    showToast('O fim planejado não pode ser anterior ao início planejado.', 'error');
    return;
  }

  const progresso = normalizarProgresso(parseNumeroSeguro(document.getElementById('crono-progresso').value));
  const editId = parseInt(document.getElementById('crono-edit-id').value);
  const data = {
    nome, obraId, obraNome: obra.nome,
    etapa: document.getElementById('crono-etapa').value.trim(),
    inicio, fim,
    progresso,
    status: document.getElementById('crono-status').value,
    responsavel: document.getElementById('crono-responsavel').value.trim()
  };

  // A partir daqui o salvamento será executado de fato — trava contra o
  // reenvio duplicado do mesmo clique e libera logo em seguida.
  salvarAtividade._processing = true;
  try {
    let obraIdAnterior = null;
    if (editId) {
      const atividadeAnterior = DB.find('cronograma', editId);
      if (atividadeAnterior) obraIdAnterior = atividadeAnterior.obraId;
      DB.update('cronograma', editId, data);
      showToast('Atividade atualizada!', 'success');
    } else {
      DB.add('cronograma', data);
      showToast('Atividade cadastrada!', 'success');
    }
    closeModal();
    // Se a atividade foi transferida para outra obra, atualiza as duas telas.
    if (obraIdAnterior !== null && String(obraIdAnterior) !== String(obraId)) {
      atualizarAposAlteracaoDeCronograma(obraIdAnterior);
    }
    atualizarAposAlteracaoDeCronograma(obraId);
  } finally {
    setTimeout(() => { salvarAtividade._processing = false; }, 400);
  }
}

function excluirAtividade(id) {
  const c = DB.find('cronograma', id);
  if (!c) { showToast('Atividade não encontrada.', 'error'); return; }
  confirmAction('Excluir atividade?', `"${c.nome}" será removida do cronograma.`, () => {
    const obraId = c.obraId;
    DB.delete('cronograma', id);
    showToast('Atividade excluída.', 'success');
    atualizarAposAlteracaoDeCronograma(obraId);
  }, '🗑️');
}

// Atualização centralizada após criar, editar, excluir ou transferir uma
// atividade: reutiliza as funções de renderização já existentes no sistema,
// verificando sua existência antes de chamá-las, e nunca redireciona o
// usuário para fora da página/aba em que ele já estava.
function atualizarAposAlteracaoDeCronograma(obraId) {
  if (typeof renderCronograma === 'function' && currentPage === 'cronograma') {
    renderCronograma();
  }
  if (typeof renderDashboard === 'function' && currentPage === 'dashboard') {
    renderDashboard();
  }
  // Só re-renderiza a tela de detalhes se ela estiver realmente aberta,
  // para não redirecionar o usuário de outra página por engano.
  if (typeof renderObraDetalhe === 'function' && currentPage === 'obra-detalhe' && currentObraId) {
    renderObraDetalhe();
  }
}

