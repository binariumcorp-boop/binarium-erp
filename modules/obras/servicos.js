// ============================================================
// servicos.js
// SERVICOS
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== SERVIÇOS =====
// Um serviço é considerado atrasado no indicador quando não está concluído
// e sua data final já passou — sem nunca sobrescrever o status salvo.
function servicoEstaAtrasado(s) {
  if (!s || s.status === 'Concluído') return false;
  if (s.status === 'Atrasado') return true;
  if (!s.prazo) return false;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const prazo = new Date(s.prazo + 'T00:00:00');
  return prazo < hoje;
}

function renderServicos() {
  const servicos = DB.get('servicos');
  document.getElementById('stat-serv-total').textContent = servicos.length;
  document.getElementById('stat-serv-conc').textContent = servicos.filter(s => s.status === 'Concluído').length;
  document.getElementById('stat-serv-and').textContent = servicos.filter(s => s.status === 'Em Andamento').length;
  document.getElementById('stat-serv-atr').textContent = servicos.filter(servicoEstaAtrasado).length;
  populateSelect('servicos-filter-obra', DB.get('obras'), 'id', 'nome', 'Obra: Todas');
  filterServicos();
}

// Normaliza texto para pesquisa: ignora maiúsculas/minúsculas, acentos e espaços extras.
function normalizarTextoBusca(valor) {
  return String(valor || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim().replace(/\s+/g, ' ');
}

// Remove tudo que não for dígito. Usado para comparar CNPJ, CPF, telefone e CEP
// independentemente da formatação visual do campo.
function somenteNumeros(valor) {
  return String(valor || '').replace(/\D/g, '');
}

function filterServicos() {
  const search = normalizarTextoBusca(document.getElementById('servicos-search').value);
  const obraId = document.getElementById('servicos-filter-obra').value;
  const status = document.getElementById('servicos-filter-status').value;
  let servicos = DB.get('servicos');
  if (search) {
    servicos = servicos.filter(s =>
      normalizarTextoBusca(s.nome).includes(search) ||
      normalizarTextoBusca(s.obraNome).includes(search) ||
      normalizarTextoBusca(s.responsavel).includes(search) ||
      normalizarTextoBusca(s.etapa).includes(search) ||
      normalizarTextoBusca(s.status).includes(search)
    );
  }
  // Comparação segura de tipos entre o valor do select (texto) e o obraId salvo.
  if (obraId) servicos = servicos.filter(s => String(s.obraId) === String(obraId));
  if (status) servicos = servicos.filter(s => s.status === status);
  renderServicosTable(servicos);
}

function clearServicosFilter() {
  document.getElementById('servicos-search').value = '';
  document.getElementById('servicos-filter-obra').value = '';
  document.getElementById('servicos-filter-status').value = '';
  filterServicos();
}

function renderServicosTable(servicos) {
  const tbody = document.getElementById('servicos-table-body');
  if (servicos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--gray400);padding:20px">Nenhum serviço encontrado</td></tr>';
    return;
  }
  tbody.innerHTML = servicos.map(s => {
    const lucro = (s.valorContratado || 0) - (s.custoOrcado || 0);
    const margem = s.valorContratado > 0 ? (lucro / s.valorContratado * 100).toFixed(1) : 0;
    return `<tr style="cursor:pointer" onclick="editarServico(${s.id})">
      <td><div style="font-weight:600;font-size:13px">${s.nome}</div><div style="font-size:11px;color:var(--gray400)">${s.etapa||''}</div></td>
      <td style="font-size:12px"><span style="color:var(--blue);cursor:pointer;text-decoration:underline" onclick="event.stopPropagation();abrirObra(${s.obraId})" title="Ver obra">${s.obraNome||'-'}</span></td>
      <td style="font-size:12px">${s.responsavel||'-'}</td>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="prog-bar" style="width:60px"><div class="prog-fill ${statusColor(s.status)}" style="width:${s.progresso||0}%"></div></div><span style="font-size:12px">${s.progresso||0}%</span></div></td>
      <td style="font-size:12px;font-weight:600">${FormatService.currency(s.valorContratado||0)}</td>
      <td style="font-size:12px;font-weight:600;color:${lucro>=0?'var(--green)':'var(--red)'}">${FormatService.currency(lucro)} (${margem}%)</td>
      <td><span class="badge ${badgeClass(s.status)}">${s.status}</span></td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();abrirObra(${s.obraId})" title="Ver Obra">🏗️</button>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();registrarRecebimentoServico(${s.id})" title="Registrar Recebimento">💰</button>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();editarServico(${s.id})" title="Editar">✏️</button>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();excluirServico(${s.id})" title="Excluir">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

// Abre o modal de Financeiro já pronto para lançar o recebimento de um
// serviço específico: obra travada, descrição e valor sugeridos, tipo
// Entrada e status Pago (o usuário ainda pode ajustar o valor, ex: recebimento parcial).
function registrarRecebimentoServico(servicoId) {
  const servico = DB.get('servicos').find(s => s.id === servicoId);
  if (!servico) return;
  openModal('nova-movimentacao');
  const sel = document.getElementById('mov-obra');
  if (sel) {
    sel.value = servico.obraId;
    sel.disabled = true;
  }
  document.getElementById('mov-descricao').value = `Recebimento - ${servico.nome}`;
  document.getElementById('mov-valor').value = servico.valorContratado || '';
  document.getElementById('mov-tipo').value = 'entrada';
  document.getElementById('mov-status').value = 'Pago';
  document.getElementById('mov-categoria').value = 'Medição';
}

function calcLucroServico() {
  const cont = parseNumeroSeguro(document.getElementById('serv-valor-cont').value);
  const orc = parseNumeroSeguro(document.getElementById('serv-custo-orc').value);
  const lucro = cont - orc;
  const margem = cont > 0 ? (lucro / cont * 100).toFixed(1) : 0;
  document.getElementById('serv-lucro-prev').value = FormatService.currency(lucro);
  document.getElementById('serv-margem-prev').value = margem + '%';
}

// Aceita números com vírgula ou ponto decimal, trata vazio como zero e nunca retorna NaN.
function parseNumeroSeguro(valor) {
  if (valor === null || valor === undefined || valor === '') return 0;
  const num = parseFloat(String(valor).trim().replace(',', '.'));
  return isNaN(num) ? 0 : num;
}

// Garante progresso sempre entre 0 e 100, como número, sem gerar NaN.
function normalizarProgresso(valor) {
  const numero = Number(valor) || 0;
  return Math.min(100, Math.max(0, numero));
}

// Interpreta uma data simples (YYYY-MM-DD) no fuso horário local, evitando
// que new Date('YYYY-MM-DD') seja interpretada como UTC e "volte" um dia
// dependendo do fuso do navegador. Retorna null quando o valor é inválido.
function criarDataLocal(valor) {
  if (!valor) return null;
  const partes = String(valor).split('-');
  if (partes.length !== 3) return null;
  const ano = Number(partes[0]);
  const mes = Number(partes[1]) - 1;
  const dia = Number(partes[2]);
  const data = new Date(ano, mes, dia);
  return Number.isNaN(data.getTime()) ? null : data;
}

// Formata um objeto Date como YYYY-MM-DD usando os componentes locais
// (sem passar por toISOString, que converteria para UTC e poderia mudar o dia).
function formatarDataLocalISO(data) {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) return '';
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// Diferença em dias entre duas datas simples (YYYY-MM-DD), sempre no fuso
// local. Retorna 0 quando qualquer uma das datas for inválida.
function diferencaEmDias(dataInicial, dataFinal) {
  const inicio = criarDataLocal(dataInicial);
  const fim = criarDataLocal(dataFinal);
  if (!inicio || !fim) return 0;
  const msPorDia = 1000 * 60 * 60 * 24;
  return Math.round((fim - inicio) / msPorDia);
}

// Localiza a obra de forma segura, tratando obraId salvo como texto ou número.
function obterObraPorId(obraId) {
  if (obraId === null || obraId === undefined || obraId === '') return null;
  const obras = DB.get('obras');
  return obras.find(obra => String(obra.id) === String(obraId)) || null;
}

function editarServico(id) {
  const s = DB.find('servicos', id);
  if (!s) { showToast('Serviço não encontrado.', 'error'); return; }
  populateSelect('serv-obra', DB.get('obras'), 'id', 'nome', '');
  const selObra = document.getElementById('serv-obra');
  selObra.disabled = false;
  document.getElementById('servico-modal-title').textContent = 'Editar Serviço';
  document.getElementById('servico-edit-id').value = s.id;
  document.getElementById('serv-nome').value = s.nome;
  selObra.value = s.obraId;
  document.getElementById('serv-etapa').value = s.etapa || '';
  document.getElementById('serv-responsavel').value = s.responsavel || '';
  document.getElementById('serv-valor-cont').value = s.valorContratado || '';
  document.getElementById('serv-custo-orc').value = s.custoOrcado || '';
  document.getElementById('serv-inicio').value = s.inicio || '';
  document.getElementById('serv-prazo').value = s.prazo || '';
  document.getElementById('serv-inicio-real').value = s.inicioReal || '';
  document.getElementById('serv-fim-real').value = s.fimReal || '';
  document.getElementById('serv-progresso').value = s.progresso || 0;
  document.getElementById('serv-status').value = s.status;
  calcLucroServico();
  openModal('novo-servico');
}

function salvarServico() {
  // Impede que o mesmo clique (duplo clique, por exemplo) cadastre ou
  // atualize o serviço duas vezes. Só trava quando o salvamento realmente
  // é executado; qualquer falha de validação libera o formulário na hora.
  if (salvarServico._processing) return;

  const nome = document.getElementById('serv-nome').value.trim();
  const obraIdRaw = document.getElementById('serv-obra').value;
  if (!ValidationService.required(nome, 'Nome do serviço')) return;
  if (!obraIdRaw) { showToast('Selecione uma obra.', 'error'); return; }

  // O relacionamento principal é sempre pelo obraId; nunca confiar apenas
  // no texto exibido no select. Se a obra não existir mais, não salva.
  const obra = obterObraPorId(obraIdRaw);
  if (!obra) {
    showToast('A obra selecionada não foi encontrada. Selecione uma obra válida.', 'error');
    return; // mantém o modal aberto
  }
  const obraId = obra.id;

  const cont = parseNumeroSeguro(document.getElementById('serv-valor-cont').value);
  const orc = parseNumeroSeguro(document.getElementById('serv-custo-orc').value);
  if (cont < 0 || orc < 0) { showToast('Valores não podem ser negativos.', 'error'); return; }

  const inicio = document.getElementById('serv-inicio').value;
  const prazo = document.getElementById('serv-prazo').value;
  if (inicio && prazo && new Date(prazo) < new Date(inicio)) {
    showToast('O prazo previsto não pode ser anterior à data de início.', 'error');
    return;
  }

  const editId = parseInt(document.getElementById('servico-edit-id').value);
  const status = document.getElementById('serv-status').value;
  let progresso = normalizarProgresso(document.getElementById('serv-progresso').value);
  // Se o status for Concluído, o progresso nunca deve ficar abaixo de 100.
  if (status === 'Concluído' && progresso < 100) progresso = 100;

  // Datas reais: o usuário pode informar manualmente, mas o sistema também
  // preenche automaticamente quando o serviço já começou/terminou de fato,
  // para que a Linha do Tempo nunca dependa de digitação manual separada.
  const hojeISO = new Date().toISOString().split('T')[0];
  let inicioReal = document.getElementById('serv-inicio-real').value;
  let fimReal = document.getElementById('serv-fim-real').value;
  if (!inicioReal && (progresso > 0 || ['Em Andamento','Atrasado','Concluído'].includes(status))) {
    inicioReal = hojeISO;
  }
  if (!fimReal && status === 'Concluído') {
    fimReal = hojeISO;
  }
  // Se o serviço deixar de estar concluído, a data real de conclusão não faz
  // mais sentido — evita manter um "fim real" incoerente com o status atual.
  if (status !== 'Concluído') {
    fimReal = document.getElementById('serv-fim-real').value || '';
  }

  const data = {
    nome, obraId, obraNome: obra.nome,
    etapa: document.getElementById('serv-etapa').value.trim(),
    responsavel: document.getElementById('serv-responsavel').value.trim(),
    valorContratado: cont, custoOrcado: orc,
    inicio, prazo, inicioReal, fimReal, progresso, status
  };

  // A partir daqui o salvamento será executado de fato — trava contra o
  // reenvio duplicado do mesmo clique e libera logo em seguida.
  salvarServico._processing = true;
  try {
    let obraIdAnterior = null;
    if (editId) {
      const servicoAnterior = DB.find('servicos', editId);
      if (servicoAnterior) obraIdAnterior = servicoAnterior.obraId;
      DB.update('servicos', editId, data);
      showToast('Serviço atualizado!', 'success');
    } else {
      DB.add('servicos', data);
      showToast('Serviço cadastrado!', 'success');
    }
    closeModal();
    // Se o serviço foi transferido para outra obra, atualiza as duas.
    if (obraIdAnterior !== null && String(obraIdAnterior) !== String(obraId)) {
      atualizarAposAlteracaoDeServico(obraIdAnterior);
    }
    atualizarAposAlteracaoDeServico(obraId);
  } finally {
    setTimeout(() => { salvarServico._processing = false; }, 400);
  }
}

function excluirServico(id) {
  const s = DB.find('servicos', id);
  if (!s) { showToast('Serviço não encontrado.', 'error'); return; }
  confirmAction('Excluir serviço?', `"${s.nome}" será removido.`, () => {
    DB.delete('servicos', id);
    showToast('Serviço excluído.', 'success');
    atualizarAposAlteracaoDeServico(s.obraId);
  }, '🗑️');
}

// Recalcula o progresso da obra com base na média dos serviços vinculados.
// Se a obra não tiver nenhum serviço, preserva o progresso manual existente.
function recalcularProgressoDaObra(obraId) {
  if (obraId === null || obraId === undefined || obraId === '') return;
  const obra = obterObraPorId(obraId);
  if (!obra) return;
  const servicosDaObra = DB.get('servicos').filter(s => String(s.obraId) === String(obraId));
  if (servicosDaObra.length === 0) return; // não apaga o progresso manual já existente
  const soma = servicosDaObra.reduce((acc, s) => acc + normalizarProgresso(s.progresso), 0);
  const progressoFinal = Math.round(normalizarProgresso(soma / servicosDaObra.length));
  if (obra.progresso !== progressoFinal) {
    DB.update('obras', obra.id, { progresso: progressoFinal });
  }
}

// Atualização centralizada após criar, editar, excluir ou transferir um
// serviço: reutiliza as funções de renderização já existentes no sistema,
// verificando sua existência antes de chamá-las.
function atualizarAposAlteracaoDeServico(obraId) {
  if (typeof recalcularProgressoDaObra === 'function') {
    recalcularProgressoDaObra(obraId);
  }
  if (typeof renderServicos === 'function') {
    renderServicos();
  }
  if (typeof renderObras === 'function') {
    renderObras();
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

// Localiza serviços antigos com obraNome mas sem obraId e preenche o
// relacionamento, sem duplicar, sem apagar dados e sem reinicializar a base.
function migrarRelacionamentosDeServicos() {
  const obras = DB.get('obras');
  if (!obras.length) return;
  const servicos = DB.get('servicos');
  if (!servicos.length) return;
  let alterado = false;
  servicos.forEach(s => {
    if (s && (s.obraId === undefined || s.obraId === null || s.obraId === '') && s.obraNome) {
      const correspondentes = obras.filter(o => o.nome === s.obraNome);
      if (correspondentes.length === 1) {
        s.obraId = correspondentes[0].id;
        alterado = true;
      } else if (correspondentes.length > 1) {
        // Nome ambíguo: preserva o serviço sem relacionar automaticamente.
        console.warn(`Migração de serviços: mais de uma obra com o nome "${s.obraNome}" — o serviço "${s.nome}" (id ${s.id}) não foi relacionado automaticamente.`);
      }
    }
  });
  if (alterado) DB.set('servicos', servicos);
}

// Localiza registros de diário antigos com obraNome mas sem obraId e
// preenche o relacionamento, sem duplicar, sem apagar dados e sem
// reinicializar a base.
function migrarRelacionamentosDoDiario() {
  const obras = DB.get('obras');
  if (!obras.length) return;
  const diario = DB.get('diario');
  if (!diario.length) return;
  let alterado = false;
  diario.forEach(d => {
    if (d && (d.obraId === undefined || d.obraId === null || d.obraId === '') && d.obraNome) {
      const correspondentes = obras.filter(o => o.nome === d.obraNome);
      if (correspondentes.length === 1) {
        d.obraId = correspondentes[0].id;
        alterado = true;
      } else if (correspondentes.length > 1) {
        // Nome ambíguo: preserva o registro sem relacionar automaticamente.
        console.warn(`Migração de diário: mais de uma obra com o nome "${d.obraNome}" — o registro "${d.titulo}" (id ${d.id}) não foi relacionado automaticamente.`);
      }
    }
  });
  if (alterado) DB.set('diario', diario);
}

// Localiza atividades de cronograma antigas com obraNome mas sem obraId e
// preenche o relacionamento, sem duplicar, sem apagar dados e sem
// reinicializar a base.
function migrarRelacionamentosDoCronograma() {
  const obras = DB.get('obras');
  if (!obras.length) return;
  const cronograma = obterCronogramas();
  if (!cronograma.length) return;
  let alterado = false;
  cronograma.forEach(c => {
    if (c && (c.obraId === undefined || c.obraId === null || c.obraId === '') && c.obraNome) {
      const correspondentes = obras.filter(o => o.nome === c.obraNome);
      if (correspondentes.length === 1) {
        c.obraId = correspondentes[0].id;
        alterado = true;
      } else if (correspondentes.length > 1) {
        // Nome ambíguo: preserva a atividade sem relacionar automaticamente.
        console.warn(`Migração de cronograma: mais de uma obra com o nome "${c.obraNome}" — a atividade "${c.nome}" (id ${c.id}) não foi relacionada automaticamente.`);
      }
    }
  });
  if (alterado) salvarCronogramas(cronograma);
}

