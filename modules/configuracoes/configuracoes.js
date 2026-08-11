// ============================================================
// configuracoes.js
// CONFIGURACOES
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== CONFIGURAÇÕES =====
function renderConfiguracoes() {
  const cfg = DB.getConfig();
  if (cfg.empresa) {
    document.getElementById('cfg-empresa-nome').value = cfg.empresa.nome || 'MB SOLUÇÕES';
    document.getElementById('cfg-empresa-slogan').value = cfg.empresa.slogan || 'Serralheria e Funilaria';
    document.getElementById('cfg-empresa-cnpj').value = cfg.empresa.cnpj || '';
    document.getElementById('cfg-empresa-email').value = cfg.empresa.email || '';
    document.getElementById('cfg-empresa-tel').value = cfg.empresa.tel || '';
    document.getElementById('cfg-empresa-site').value = cfg.empresa.site || '';
    document.getElementById('cfg-empresa-end').value = cfg.empresa.end || '';
  }
  renderUsuariosTable();
}

function renderUsuariosTable() {
  // O Super Admin BinariumCorp nunca aparece na lista de usuários da
  // empresa — ele não pode ser visualizado, editado ou removido por
  // administradores de empresa (Alteração 4).
  const users = AuthService.getUsers().filter(u => !u.superAdmin);
  const tbody = document.getElementById('usuarios-table-body');
  tbody.innerHTML = users.map(u => `
    <tr>
      <td><div style="display:flex;align-items:center;gap:10px"><div class="av">${FormatService.initials(u.nome)}</div><div><div style="font-weight:600">${u.nome}</div><div style="font-size:11px;color:var(--gray400)">${u.cargo||u.perfil}</div></div></div></td>
      <td>${u.email}</td>
      <td><span class="badge badge-blue">${u.perfil}</span></td>
      <td><span class="badge ${u.status==='Ativo'?'badge-green':'badge-red'}">${u.status}</span></td>
      <td><button class="btn btn-ghost btn-sm" onclick="editarUsuario(${u.id})">✏️ Editar</button></td>
    </tr>`).join('');
}

function editarUsuario(id) {
  const users = AuthService.getUsers();
  const u = users.find(u => u.id === id);
  if (!u) return;
  if (u.protegido) { showToast('Este usuário é protegido e não pode ser editado.', 'error'); return; }
  document.getElementById('usr-modal-title').textContent = 'Editar Usuário';
  document.getElementById('usr-edit-id').value = u.id;
  document.getElementById('usr-nome').value = u.nome;
  document.getElementById('usr-email').value = u.email;
  document.getElementById('usr-perfil').value = u.perfil;
  document.getElementById('usr-status').value = u.status;
  document.getElementById('usr-senha').value = '';
  openModal('novo-usuario');
}

function salvarUsuario() {
  const nome = document.getElementById('usr-nome').value.trim();
  const email = document.getElementById('usr-email').value.trim();
  const perfil = document.getElementById('usr-perfil').value;
  const status = document.getElementById('usr-status').value;
  const senha = document.getElementById('usr-senha').value;
  if (!ValidationService.required(nome, 'Nome')) return;
  if (!ValidationService.required(email, 'E-mail')) return;
  if (!ValidationService.email(email)) { showToast('E-mail inválido.', 'error'); return; }
  if (email.toLowerCase() === AuthService.SUPER_ADMIN.email.toLowerCase()) {
    showToast('Este e-mail é reservado ao Super Admin BinariumCorp.', 'error'); return;
  }
  const editIdRaw = document.getElementById('usr-edit-id').value;
  const editId = editIdRaw === '' ? null : parseInt(editIdRaw);
  const users = AuthService.getUsers();
  if (editId !== null) {
    const idx = users.findIndex(u => u.id === editId);
    if (idx >= 0) {
      if (users[idx].protegido) { showToast('Este usuário é protegido e não pode ser editado.', 'error'); return; }
      users[idx] = { ...users[idx], nome, email, perfil, status };
      if (senha && senha.length >= 6) users[idx].senha = senha;
      StorageService.set(AuthService.USERS_KEY, users);
      showToast('Usuário atualizado!', 'success');
    }
  } else {
    if (!senha || senha.length < 6) { showToast('Senha deve ter pelo menos 6 caracteres.', 'error'); return; }
    const dupEmail = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (dupEmail) { showToast('E-mail já cadastrado.', 'error'); return; }
    const newUser = { id: Date.now(), nome, email, senha, perfil, status, createdAt: new Date().toISOString() };
    users.push(newUser);
    StorageService.set(AuthService.USERS_KEY, users);
    showToast('Usuário cadastrado!', 'success');
  }
  closeModal();
  renderUsuariosTable();
}

function switchConfigTab(tab, el) {
  document.querySelectorAll('.ctab').forEach(t => t.style.display = 'none');
  document.querySelectorAll('#cfg-tabs .tab').forEach(t => t.classList.remove('active'));
  const target = document.getElementById('ctab-' + tab);
  if (target) target.style.display = 'block';
  el.classList.add('active');
}

function salvarConfiguracoes() {
  const cfg = DB.getConfig();
  const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };

  cfg.empresa = {
    nome: val('cfg-empresa-nome') || 'MB SOLUÇÕES',
    slogan: val('cfg-empresa-slogan'),
    razao: val('cfg-empresa-razao'),
    fantasia: val('cfg-empresa-fantasia'),
    cnpj: val('cfg-empresa-cnpj'),
    ie: val('cfg-empresa-ie'),
    email: val('cfg-empresa-email'),
    site: val('cfg-empresa-site'),
    tel: val('cfg-empresa-tel'),
    whatsapp: val('cfg-empresa-whatsapp'),
    responsavel: val('cfg-empresa-responsavel'),
    end: val('cfg-empresa-end'),
    cidade: val('cfg-empresa-cidade'),
    estado: val('cfg-empresa-estado').toUpperCase(),
    cep: val('cfg-empresa-cep')
  };

  // Identidade Visual (namespace "erp") — nunca inclui a marca BinariumCorp,
  // que permanece fixa como desenvolvedora/administradora suprema.
  cfg.erp = cfg.erp || {};
  cfg.erp.nome = val('cfg-erp-nome');
  cfg.erp.boasVindas = val('cfg-erp-boasvindas') || cfg.erp.boasVindas;
  cfg.erp.descLogin = val('cfg-erp-desc-login') || cfg.erp.descLogin;
  const temaEl = document.getElementById('cfg-erp-tema');
  if (temaEl) cfg.erp.tema = temaEl.value;
  cfg.erp.corSecundaria = document.getElementById('cfg-cor-secundaria') ? document.getElementById('cfg-cor-secundaria').value : cfg.erp.corSecundaria;
  cfg.erp.corBotoes = document.getElementById('cfg-cor-botoes') ? document.getElementById('cfg-cor-botoes').value : cfg.erp.corBotoes;
  cfg.erp.corTopo = document.getElementById('cfg-cor-topo') ? document.getElementById('cfg-cor-topo').value : cfg.erp.corTopo;
  cfg.erp.logoLetra = val('cfg-logo-letra') || 'G';

  DB.setConfig(cfg);
  applyBranding(cfg);
  showToast('Configurações salvas com sucesso!', 'success');
}

function previewEmpresa() {
  const nome = document.getElementById('cfg-empresa-nome').value || 'MB SOLUÇÕES';
  const slogan = document.getElementById('cfg-empresa-slogan').value || 'Serralheria e Funilaria';
  document.getElementById('prev-nome').textContent = nome;
  document.getElementById('prev-slogan').textContent = slogan;
  document.getElementById('prev-initial').textContent = nome[0];
  const erpNomeEl = document.getElementById('cfg-erp-nome');
  const nomeSistema = (erpNomeEl && erpNomeEl.value.trim()) || nome;
  document.getElementById('login-brand-name').textContent = nome;
  document.getElementById('login-brand-sub').textContent = slogan;
  const brNameR = document.getElementById('login-brand-name-right');
  const brSubR = document.getElementById('login-brand-sub-right');
  if (brNameR) brNameR.textContent = nome;
  if (brSubR) brSubR.textContent = slogan;
  document.getElementById('page-title').textContent = nomeSistema + (nomeSistema.toLowerCase().includes('erp') ? '' : ' – ERP');
}

