// ============================================================
// app.js
// RESPONSIVIDADE + INICIALIZACAO + BOOT
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== RESPONSIVIDADE =====
function checkMobile() {
  const isMobile = window.innerWidth <= 768;
  const mobileBtn = document.getElementById('mobile-menu-btn');
  if (mobileBtn) mobileBtn.style.display = isMobile ? 'flex' : 'none';
  if (isMobile) document.getElementById('sidebar').classList.remove('collapsed');
}

window.addEventListener('resize', checkMobile);

// ===== INICIALIZAÇÃO =====
function initApp() {
  initializeData();
  migrarRelacionamentosDeObras();
  migrarRelacionamentosDeServicos();
  migrarRelacionamentosDaEquipe();
  migrarRelacionamentosFinanceiros();
  migrarRelacionamentosDoDiario();
  migrarRelacionamentosDoCronograma();
  if (typeof migrarContratosFinal === 'function') migrarContratosFinal();
  loadConfig();
  updateObrasSelects();
  goTo('dashboard');
  checkMobile();
}

function loadConfig() {
  const cfg = DB.getConfig();
  applyBranding(cfg);
  popularFormularioIdentidadeVisual(cfg);
}

// Preenche os campos do formulário de Identidade Visual/Empresa com os
// valores atualmente salvos, para que a tela de Configurações sempre
// reflita o estado real (e não apenas os valores padrão do HTML).
function popularFormularioIdentidadeVisual(cfg) {
  cfg = cfg || DB.getConfig();
  const empresa = cfg.empresa || {};
  const erp = cfg.erp || {};
  const set = (id, val) => { const el = document.getElementById(id); if (el && val != null && val !== '') el.value = val; };

  set('cfg-empresa-nome', empresa.nome);
  set('cfg-empresa-slogan', empresa.slogan);
  set('cfg-empresa-razao', empresa.razao);
  set('cfg-empresa-fantasia', empresa.fantasia);
  set('cfg-empresa-cnpj', empresa.cnpj);
  set('cfg-empresa-ie', empresa.ie);
  set('cfg-empresa-email', empresa.email);
  set('cfg-empresa-site', empresa.site);
  set('cfg-empresa-tel', empresa.tel);
  set('cfg-empresa-whatsapp', empresa.whatsapp);
  set('cfg-empresa-responsavel', empresa.responsavel);
  set('cfg-empresa-end', empresa.end);
  set('cfg-empresa-cidade', empresa.cidade);
  set('cfg-empresa-estado', empresa.estado);
  set('cfg-empresa-cep', empresa.cep);

  set('cfg-erp-nome', erp.nome);
  set('cfg-erp-boasvindas', (erp.boasVindas || '').replace(/<br>/g, '\n'));
  set('cfg-erp-desc-login', erp.descLogin);
  set('cfg-erp-tema', erp.tema || 'escuro');
  set('cfg-logo-letra', erp.logoLetra);
  set('cfg-cor-secundaria', erp.corSecundaria);
  set('cfg-cor-botoes', erp.corBotoes);
  set('cfg-cor-topo', erp.corTopo);
  set('cfg-login-img-pos', erp.loginImgPos || 'center');
  const zoomEl = document.getElementById('cfg-login-img-zoom');
  const opEl = document.getElementById('cfg-login-img-opacity');
  if (zoomEl) { zoomEl.value = erp.loginImgZoom || 100; document.getElementById('login-img-zoom-val').textContent = (erp.loginImgZoom || 100) + '%'; }
  if (opEl) { opEl.value = erp.loginImgOpacity != null ? erp.loginImgOpacity : 100; document.getElementById('login-img-opacity-val').textContent = (erp.loginImgOpacity != null ? erp.loginImgOpacity : 100) + '%'; }

  if (erp.logoImg) {
    const wrap = document.getElementById('logo-preview-wrap');
    if (wrap) wrap.innerHTML = `<img src="${erp.logoImg}" style="width:100%;height:100%;object-fit:contain;border-radius:8px">`;
  }
  if (erp.faviconImg) {
    const favPrev = document.getElementById('favicon-preview');
    if (favPrev) favPrev.innerHTML = `<img src="${erp.faviconImg}" style="width:100%;height:100%;object-fit:cover;border-radius:6px">`;
  }
  const curColorTxt = document.getElementById('cur-color-txt');
  if (curColorTxt && cfg.aparencia && cfg.aparencia.cor) {
    curColorTxt.textContent = cfg.aparencia.cor;
    const customColorEl = document.getElementById('custom-color');
    if (customColorEl) customColorEl.value = cfg.aparencia.cor;
  }
}

// ===== BOOT =====
document.addEventListener('DOMContentLoaded', async () => {
  // Verificar sessão existente (local) e, se a infraestrutura SaaS
  // estiver ativa, revalidar/restaurar a sessão na nuvem também.
  let session = AuthService.getSession();

  if (session && CLOUD_CONFIG.ATIVADO && CloudSync.client) {
    const { data } = await CloudSync.client.auth.getSession();
    if (data && data.session) {
      const { data: perfil } = await CloudSync.client
        .from('usuarios').select('id, empresa_id').eq('id', data.session.user.id).maybeSingle();
      if (perfil) {
        CloudSync.usuarioId = perfil.id;
        CloudSync.empresaId = perfil.empresa_id;
        CloudSync.online = true;
        await CloudSync.hydrate();
        session = AuthService.getSession(); // relê com os dados recém-sincronizados
      }
    } else {
      // Sessão local existia mas a sessão da nuvem expirou/não existe mais.
      AuthService.logout();
      session = null;
    }
  }

  if (session) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-shell').classList.add('visible');
    updateSidebarUser(session);
    renderLicencaBanner(session.assinaturaStatus);
    initApp();
  } else {
    loadConfig(); // Carregar config mesmo na tela de login
  }

  // Login listeners
  document.getElementById('login-email').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('login-password').focus();
  });
  document.getElementById('login-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });

  // Modal nova obra: preencher selects
  document.getElementById('modal-nova-obra').addEventListener('click', () => {});

  checkMobile();
});

// Abrir modal nova obra com selects preenchidos
const origOpenModal = openModal;
window.openModal = function(id) {
  if (id === 'nova-obra') {
    const editId = document.getElementById('obra-edit-id').value;
    if (!editId) {
      document.getElementById('obra-modal-title').textContent = 'Nova Obra';
      ['obra-nome','obra-codigo','obra-municipio','obra-objeto'].forEach(fid => document.getElementById(fid).value = '');
      document.getElementById('obra-responsavel').value = 'Ysmael Q. Nunes';
      document.getElementById('obra-progresso').value = '0';
      document.getElementById('obra-valor').value = '';
      document.getElementById('obra-inicio').value = '';
      document.getElementById('obra-termino').value = '';
      document.getElementById('obra-status').value = 'Em Andamento';
      document.getElementById('obra-edit-id').value = '';
    }
  }
  if (id === 'novo-servico') {
    const editId = document.getElementById('servico-edit-id').value;
    if (!editId) {
      document.getElementById('servico-modal-title').textContent = 'Novo Serviço';
      ['serv-nome','serv-etapa','serv-responsavel','serv-valor-cont','serv-custo-orc','serv-lucro-prev','serv-margem-prev','serv-inicio','serv-prazo','serv-inicio-real','serv-fim-real'].forEach(fid => document.getElementById(fid).value = '');
      document.getElementById('serv-progresso').value = '0';
      document.getElementById('serv-status').value = 'Pendente';
      document.getElementById('servico-edit-id').value = '';
    }
    populateSelect('serv-obra', DB.get('obras'), 'id', 'nome', 'Selecione a obra');
    // Reabilita o campo obra por padrão; apenas o cadastro contextual
    // (novoServicoParaObra) o bloqueia, logo em seguida a esta chamada.
    document.getElementById('serv-obra').disabled = false;
    // Um novo serviço nunca deve iniciar com uma obra pré-selecionada por
    // acidente (populateSelect preserva a última seleção do select, que pode
    // ter sido herdada de uma obra escolhida anteriormente por outro fluxo).
    if (!editId) document.getElementById('serv-obra').value = '';
  }
  if (id === 'novo-colaborador') {
    const editId = document.getElementById('colab-edit-id').value;
    if (!editId) {
      document.getElementById('colab-modal-title').textContent = 'Novo Colaborador';
      ['colab-nome','colab-cpf','colab-funcao','colab-tel','colab-salario','colab-obs'].forEach(fid => document.getElementById(fid).value = '');
      document.getElementById('colab-admissao').value = new Date().toISOString().split('T')[0];
      document.getElementById('colab-status').value = 'Ativo';
      document.getElementById('colab-edit-id').value = '';
    }
    populateSelect('colab-obra', DB.get('obras'), 'id', 'nome', 'Sem obra');
    document.getElementById('colab-obra').disabled = false;
    // Um novo colaborador nunca deve iniciar com uma obra pré-selecionada
    // por acidente (populateSelect preserva a última seleção do select).
    if (!editId) document.getElementById('colab-obra').value = '';
  }
  if (id === 'nova-movimentacao') {
    const editId = document.getElementById('mov-edit-id').value;
    if (!editId) {
      document.getElementById('mov-modal-title').textContent = 'Nova Movimentação';
      ['mov-descricao','mov-valor','mov-obs'].forEach(fid => document.getElementById(fid).value = '');
      document.getElementById('mov-data').value = new Date().toISOString().split('T')[0];
      document.getElementById('mov-tipo').value = 'entrada';
      document.getElementById('mov-categoria').value = 'Medição';
      document.getElementById('mov-status').value = 'Pago';
      document.getElementById('mov-edit-id').value = '';
    }
    document.getElementById('mov-comprovante').value = '';
    movComprovanteAtual = null;
    renderMovComprovantePreview();
    populateSelect('mov-obra', DB.get('obras'), 'id', 'nome', 'Geral');
    // Reabilita o campo obra por padrão; apenas o cadastro contextual
    // (novaMovimentacaoParaObra) o bloqueia, logo em seguida a esta chamada.
    document.getElementById('mov-obra').disabled = false;
    // Uma nova movimentação nunca deve iniciar com uma obra pré-selecionada
    // por acidente (populateSelect preserva a última seleção do select, que
    // pode ter sido herdada de uma obra escolhida anteriormente).
    if (!editId) document.getElementById('mov-obra').value = '';
  }
  if (id === 'novo-item-estoque') {
    const editId = document.getElementById('est-edit-id').value;
    if (!editId) {
      document.getElementById('est-modal-title').textContent = 'Novo Item – Estoque';
      ['est-nome','est-qtd','est-minimo','est-valor-unit'].forEach(fid => document.getElementById(fid).value = '');
      document.getElementById('est-edit-id').value = '';
    }
    populateSelect('est-obra', DB.get('obras'), 'id', 'nome', 'Geral');
    // Reabilita o campo obra por padrão; apenas o cadastro contextual
    // (novoItemParaObra) o bloqueia, logo em seguida a esta chamada.
    document.getElementById('est-obra').disabled = false;
    // Um novo item nunca deve iniciar com uma obra pré-selecionada por
    // acidente (populateSelect preserva a última seleção do select).
    if (!editId) document.getElementById('est-obra').value = '';
  }
  if (id === 'movimentacao-estoque') {
    document.getElementById('mov-est-data').value = new Date().toISOString().split('T')[0];
    document.getElementById('mov-est-qtd').value = '';
    document.getElementById('mov-est-obs').value = '';
    document.getElementById('mov-est-tipo').value = 'entrada';
    const estItems = DB.get('estoque');
    document.getElementById('mov-est-item').innerHTML = '<option value="">Selecione um item</option>' + estItems.map(e => `<option value="${e.id}">${e.nome} (${e.qtd} ${e.unidade})</option>`).join('');
    populateSelect('mov-est-obra', DB.get('obras'), 'id', 'nome', 'Geral');
    document.getElementById('mov-est-obra').value = '';
  }
  if (id === 'novo-diario') {
    const editId = document.getElementById('diario-edit-id').value;
    if (!editId) {
      document.getElementById('diario-modal-title').textContent = 'Novo Registro – Diário de Obra';
      ['diario-titulo','diario-descricao','diario-equipamentos','diario-materiais','diario-servicos','diario-hora-inicio','diario-hora-fim','diario-acao-tomada'].forEach(fid => document.getElementById(fid).value = '');
      document.getElementById('diario-data').value = new Date().toISOString().split('T')[0];
      document.getElementById('diario-colaboradores').value = '0';
      document.getElementById('diario-tipo').value = 'Atividade';
      document.getElementById('diario-gravidade').value = 'Baixa';
      document.getElementById('diario-edit-id').value = '';
      toggleDiarioOcorrencia();
      document.getElementById('diario-horas-resultado').style.display = 'none';
      // Pré-preenche o responsável com o usuário logado, sem travar o campo,
      // para agilizar o registro do dia a dia.
      const sessao = (typeof AuthService !== 'undefined') ? AuthService.getSession() : null;
      document.getElementById('diario-responsavel').value = sessao ? sessao.nome : '';
    }
    populateSelect('diario-obra', DB.get('obras'), 'id', 'nome', 'Selecione a obra');
    // Reabilita o campo obra por padrão; apenas o cadastro contextual
    // (novoDiarioParaObra) o bloqueia, logo em seguida a esta chamada.
    document.getElementById('diario-obra').disabled = false;
    // Um novo registro nunca deve iniciar com uma obra pré-selecionada por
    // acidente (populateSelect preserva a última seleção do select, que pode
    // ter sido herdada de uma obra escolhida anteriormente por outro fluxo).
    if (!editId) document.getElementById('diario-obra').value = '';
  }
  if (id === 'nova-atividade') {
    const editId = document.getElementById('crono-edit-id').value;
    if (!editId) {
      document.getElementById('crono-modal-title').textContent = 'Nova Atividade';
      ['crono-nome','crono-etapa','crono-inicio','crono-fim','crono-responsavel'].forEach(fid => document.getElementById(fid).value = '');
      document.getElementById('crono-progresso').value = '0';
      document.getElementById('crono-status').value = 'Não Iniciada';
      document.getElementById('crono-edit-id').value = '';
    }
    populateSelect('crono-obra', DB.get('obras'), 'id', 'nome', 'Selecione a obra');
    // Reabilita o campo obra por padrão; apenas o cadastro contextual
    // (novaAtividadeParaObra) o bloqueia, logo em seguida a esta chamada.
    document.getElementById('crono-obra').disabled = false;
    // Uma nova atividade nunca deve iniciar com uma obra pré-selecionada por
    // acidente (populateSelect preserva a última seleção do select, que pode
    // ter sido herdada de uma obra escolhida anteriormente por outro fluxo).
    if (!editId) document.getElementById('crono-obra').value = '';
  }
  if (id === 'nova-compra') {
    const editId = document.getElementById('comp-edit-id') ? document.getElementById('comp-edit-id').value : '';
    if (!editId) {
      document.getElementById('comp-modal-title').textContent = 'Nova Solicitação de Compra';
      document.getElementById('comp-numero').value = '';
      ['comp-desc', 'comp-previsao', 'comp-prazo', 'comp-justif'].forEach(fid => { const el = document.getElementById(fid); if (el) el.value = ''; });
      document.getElementById('comp-prioridade').value = 'Normal';
      document.getElementById('comp-status').value = 'Pendente';
      document.getElementById('comp-condicao').value = '';
      document.getElementById('comp-frete').value = '';
      document.getElementById('comp-desconto').value = '';
      document.getElementById('comp-edit-id').value = '';
      comprasItensAtual = [];
      adicionarItemCompra();
    }
    populateSelect('comp-obra', DB.get('obras'), 'id', 'nome', 'Geral');
    populateSelect('comp-fornecedor', DB.KEYS.fornecedores ? DB.get('fornecedores') : [], 'id', 'razao', 'Selecione o fornecedor');
    // Reabilita o campo obra por padrão; apenas o cadastro contextual
    // (novaCompraParaObra) o bloqueia, logo em seguida a esta chamada.
    document.getElementById('comp-obra').disabled = false;
    if (!editId) document.getElementById('comp-obra').value = '';
    renderItensCompraRows();
    recalcularTotaisCompra();
  }
  if (id === 'novo-contrato') {
    const editId = document.getElementById('ct-edit-id').value;
    if (!editId) {
      document.getElementById('ct-modal-title').textContent = 'Novo Contrato';
      ['ct-numero','ct-fornecedor','ct-cnpj','ct-objeto','ct-valor','ct-inicio','ct-termino'].forEach(fid => document.getElementById(fid).value = '');
      document.getElementById('ct-status').value = 'Ativo';
      document.getElementById('ct-edit-id').value = '';
    }
    populateSelect('ct-obra', DB.get('obras'), 'id', 'nome', 'Geral');
  }
  if (id === 'novo-doc') {
    const editId = document.getElementById('doc-edit-id').value;
    if (!editId) {
      document.getElementById('doc-modal-title').textContent = 'Novo Documento';
      ['doc-nome','doc-obs'].forEach(fid => document.getElementById(fid).value = '');
      document.getElementById('doc-versao').value = 'v1.0';
      document.getElementById('doc-status').value = 'Pendente';
      document.getElementById('doc-modal-file-name').textContent = '';
      document.getElementById('doc-modal-file').value = '';
      document.getElementById('doc-edit-id').value = '';
    }
    populateSelect('doc-obra', DB.get('obras'), 'id', 'nome', 'Geral');
  }
  if (id === 'novo-usuario') {
    const editId = document.getElementById('usr-edit-id').value;
    if (!editId) {
      document.getElementById('usr-modal-title').textContent = 'Novo Usuário';
      ['usr-nome','usr-email','usr-senha'].forEach(fid => document.getElementById(fid).value = '');
      document.getElementById('usr-perfil').value = 'Visualização';
      document.getElementById('usr-status').value = 'Ativo';
      document.getElementById('usr-edit-id').value = '';
    }
  }
  origOpenModal(id);
};

