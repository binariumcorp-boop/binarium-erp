// ============================================================
// funcionarios.js
// EQUIPE
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== EQUIPE =====
let equipeTabFilter = 'todos';

function renderEquipe() {
  const equipe = DB.get('equipe');
  document.getElementById('stat-eq-total').textContent = equipe.length;
  document.getElementById('stat-eq-ativos').textContent = equipe.filter(e => e.status === 'Ativo').length;
  document.getElementById('stat-eq-inativos').textContent = equipe.filter(e => e.status === 'Inativo').length;
  document.getElementById('stat-eq-pend').textContent = equipe.filter(e => e.obs && e.obs.length > 0).length;
  populateSelect('equipe-filter-obra', DB.get('obras'), 'id', 'nome', 'Obra: Todas');
  filterEquipe();
}

function filterEquipe() {
  const search = normalizarTextoBusca(document.getElementById('equipe-search').value);
  const obraId = document.getElementById('equipe-filter-obra').value;
  const status = document.getElementById('equipe-filter-status').value;
  let equipe = DB.get('equipe');
  if (equipeTabFilter !== 'todos') equipe = equipe.filter(e => e.status === equipeTabFilter);
  if (search) {
    equipe = equipe.filter(e =>
      normalizarTextoBusca(e.nome).includes(search) ||
      normalizarTextoBusca(e.funcao).includes(search) ||
      normalizarTextoBusca(e.obraNome).includes(search) ||
      normalizarTextoBusca(e.cpf).includes(search) ||
      normalizarTextoBusca(e.telefone).includes(search) ||
      normalizarTextoBusca(e.status).includes(search)
    );
  }
  // Comparação segura de tipos entre o valor do select (texto) e o obraId salvo.
  if (obraId) equipe = equipe.filter(e => String(e.obraId) === String(obraId));
  if (status) equipe = equipe.filter(e => e.status === status);
  renderEquipeTable(equipe);
}

function filterEquipeTab(tab, el) {
  equipeTabFilter = tab;
  document.querySelectorAll('#equipe-tabs .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  filterEquipe();
}

function clearEquipeFilter() {
  document.getElementById('equipe-search').value = '';
  document.getElementById('equipe-filter-obra').value = '';
  document.getElementById('equipe-filter-status').value = '';
  filterEquipe();
}

// Definição única de renderEquipeTable (antes havia uma segunda definição
// no final do arquivo sobrescrevendo esta função para adicionar o botão de
// RH — unificadas aqui para não haver funções duplicadas/conflitantes).
function renderEquipeTable(equipe) {
  const tbody = document.getElementById('equipe-table-body');
  if (equipe.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray400);padding:20px">Nenhum colaborador encontrado</td></tr>';
    return;
  }
  tbody.innerHTML = equipe.map(e => `
    <tr style="cursor:pointer" onclick="editarColaborador(${e.id})">
      <td><div style="display:flex;align-items:center;gap:10px"><div class="av">${FormatService.initials(e.nome)}</div><div><div style="font-weight:600;font-size:13px">${e.nome}</div><div style="font-size:11px;color:var(--gray400)">ID: ${String(e.id).padStart(3,'0')}</div></div></div></td>
      <td>${e.funcao}</td>
      <td style="font-size:12px;color:var(--gray400)">${e.cpf||'-'}</td>
      <td><div style="font-size:12px">${e.obraNome||'-'}</div></td>
      <td><span class="badge ${e.status==='Ativo'?'badge-green':'badge-red'}">${e.status}</span></td>
      <td style="font-size:12px">${FormatService.date(e.admissao)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();abrirPainelRH(${e.id})" title="RH / Ver Detalhes">👁️</button>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();editarColaborador(${e.id})" title="Editar">✏️</button>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();excluirColaborador(${e.id})" title="Excluir">🗑️</button>
      </td>
    </tr>`).join('');
}

function editarColaborador(id) {
  const e = DB.find('equipe', id);
  if (!e) { showToast('Colaborador não encontrado.', 'error'); return; }
  populateSelect('colab-obra', DB.get('obras'), 'id', 'nome', 'Sem obra');
  const selObra = document.getElementById('colab-obra');
  selObra.disabled = false;
  document.getElementById('colab-modal-title').textContent = 'Editar Colaborador';
  document.getElementById('colab-edit-id').value = e.id;
  document.getElementById('colab-nome').value = e.nome;
  document.getElementById('colab-cpf').value = e.cpf || '';
  document.getElementById('colab-funcao').value = e.funcao;
  document.getElementById('colab-tel').value = e.telefone || '';
  selObra.value = e.obraId || '';
  document.getElementById('colab-admissao').value = e.admissao || '';
  document.getElementById('colab-status').value = e.status;
  document.getElementById('colab-salario').value = e.salario || '';
  document.getElementById('colab-obs').value = e.obs || '';
  openModal('novo-colaborador');
}

function salvarColaborador() {
  // Impede que o mesmo clique (duplo clique, por exemplo) cadastre ou
  // atualize o colaborador duas vezes. Só trava quando o salvamento
  // realmente é executado; qualquer falha de validação libera na hora.
  if (salvarColaborador._processing) return;

  const nome = document.getElementById('colab-nome').value.trim();
  const cpfRaw = document.getElementById('colab-cpf').value.trim();
  const funcao = document.getElementById('colab-funcao').value.trim();
  if (!ValidationService.required(nome, 'Nome')) return;
  if (!ValidationService.required(funcao, 'Função')) return;

  // CPF é opcional (registros antigos podem não ter), mas se informado
  // precisa ser válido e não pode duplicar um já cadastrado.
  const cpf = cpfRaw.replace(/\s+/g, '');
  const editId = parseInt(document.getElementById('colab-edit-id').value);
  if (cpf) {
    if (!ValidationService.cpf(cpf)) { showToast('CPF inválido.', 'error'); return; }
    const equipeAtual = DB.get('equipe');
    const dupCPF = equipeAtual.find(e => e.cpf && e.cpf.replace(/\D/g,'') === cpf.replace(/\D/g,'') && e.id !== editId);
    if (dupCPF) { showToast('CPF já cadastrado: ' + dupCPF.nome, 'error'); return; }
  }

  // A obra é opcional para colaboradores (ex.: equipe administrativa), mas
  // se uma for selecionada, o relacionamento deve ser sempre por obraId,
  // nunca apenas pelo texto do select — e a obra precisa existir de fato.
  const obraIdRaw = document.getElementById('colab-obra').value;
  let obraId = null, obra = null;
  if (obraIdRaw) {
    obra = obterObraPorId(obraIdRaw);
    if (!obra) {
      showToast('A obra selecionada não foi encontrada. Selecione uma obra válida.', 'error');
      return; // mantém o modal aberto
    }
    obraId = obra.id;
  }

  const admissao = document.getElementById('colab-admissao').value;
  const salario = parseNumeroSeguro(document.getElementById('colab-salario').value);
  if (salario < 0) { showToast('O salário não pode ser negativo.', 'error'); return; }

  const data = {
    nome, cpf, funcao,
    telefone: document.getElementById('colab-tel').value.trim(),
    obraId, obraNome: obra ? obra.nome : '',
    admissao,
    status: document.getElementById('colab-status').value,
    salario,
    obs: document.getElementById('colab-obs').value.trim()
  };

  // A partir daqui o salvamento será executado de fato — trava contra o
  // reenvio duplicado do mesmo clique e libera logo em seguida.
  salvarColaborador._processing = true;
  try {
    let obraIdAnterior = null;
    if (editId) {
      const colaboradorAnterior = DB.find('equipe', editId);
      if (colaboradorAnterior) obraIdAnterior = colaboradorAnterior.obraId;
      DB.update('equipe', editId, data);
      showToast('Colaborador atualizado!', 'success');
    } else {
      DB.add('equipe', data);
      showToast('Colaborador cadastrado!', 'success');
    }
    closeModal();
    // Se o colaborador foi transferido de obra, atualiza as duas.
    if (obraIdAnterior !== null && String(obraIdAnterior) !== String(obraId)) {
      atualizarAposAlteracaoDaEquipe(obraIdAnterior);
    }
    atualizarAposAlteracaoDaEquipe(obraId);
  } finally {
    setTimeout(() => { salvarColaborador._processing = false; }, 400);
  }
}

function excluirColaborador(id) {
  const e = DB.find('equipe', id);
  if (!e) { showToast('Colaborador não encontrado.', 'error'); return; }
  confirmAction('Excluir colaborador?', `"${e.nome}" será removido.`, () => {
    const obraId = e.obraId;
    DB.delete('equipe', id);
    showToast('Colaborador excluído.', 'success');
    atualizarAposAlteracaoDaEquipe(obraId);
  }, '🗑️');
}

// Abre o modal de colaborador já preenchendo e travando a obra atual —
// usado pelo botão "+ Novo Colaborador" dentro da tela de detalhes da obra.
function novoColaboradorParaObra(obraId) {
  const alvoObraId = obraId !== undefined ? obraId : currentObraId;
  openModal('novo-colaborador');
  const sel = document.getElementById('colab-obra');
  if (sel) {
    sel.value = alvoObraId;
    // Protege a obra durante o cadastro contextual: o colaborador criado a
    // partir da tela da obra deve sempre pertencer a ela.
    sel.disabled = true;
  }
  // Garante que, ao salvar, a aba Equipe permaneça ativa na obra.
  obraDetalheAbaAtual = 'equipe';
}

// Atualização centralizada após criar, editar, transferir, inativar ou
// excluir um colaborador: reutiliza as funções de renderização já
// existentes, verificando sua existência antes de chamá-las.
function atualizarAposAlteracaoDaEquipe(obraId) {
  if (typeof renderEquipe === 'function') {
    renderEquipe();
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

// Localiza colaboradores antigos com obraNome mas sem obraId e preenche o
// relacionamento, sem duplicar, sem apagar dados e sem reinicializar a base.
function migrarRelacionamentosDaEquipe() {
  const obras = DB.get('obras');
  if (!obras.length) return;
  const equipe = DB.get('equipe');
  if (!equipe.length) return;
  let alterado = false;
  equipe.forEach(e => {
    if (e && (e.obraId === undefined || e.obraId === null || e.obraId === '') && e.obraNome) {
      const correspondentes = obras.filter(o => o.nome === e.obraNome);
      if (correspondentes.length === 1) {
        e.obraId = correspondentes[0].id;
        alterado = true;
      } else if (correspondentes.length > 1) {
        // Nome ambíguo: preserva o colaborador sem relacionar automaticamente.
        console.warn(`Migração de equipe: mais de uma obra com o nome "${e.obraNome}" — o colaborador "${e.nome}" (id ${e.id}) não foi relacionado automaticamente.`);
      }
    }
  });
  if (alterado) DB.set('equipe', equipe);
}



function formatCPF(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 11);
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  input.value = v;
}

