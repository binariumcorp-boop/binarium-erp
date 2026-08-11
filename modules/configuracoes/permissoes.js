// ============================================================
// permissoes.js
// FASE 3 (5): PERMISSOES DETALHADAS POR PERFIL
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

// 5. PERMISSÕES DETALHADAS POR PERFIL
// =====================================================================
const PERM_PROFILES = ['Administrador', 'Engenharia', 'Financeiro', 'RH', 'Mestre de Obra', 'Almoxarifado', 'Visualização'];
const PERM_MODULES = [
  ['dashboard','Dashboard'], ['obras','Obras'], ['servicos','Serviços'], ['equipe','Equipe'],
  ['financeiro','Financeiro'], ['estoque','Estoque'], ['diario','Diário de Obra'], ['cronograma','Cronograma'],
  ['contratos','Contratos'], ['documentos','Documentos'], ['mapa','Mapa das Obras'], ['compras','Compras'],
  ['fornecedores','Fornecedores'], ['relatorios','Relatórios'], ['configuracoes','Configurações']
];

function defaultPermFor(perfil) {
  const full = { ver: true, criar: true, editar: true, excluir: true };
  const viewOnly = { ver: true, criar: false, editar: false, excluir: false };
  const none = { ver: false, criar: false, editar: false, excluir: false };
  const map = {};
  PERM_MODULES.forEach(([m]) => map[m] = { ...viewOnly });
  if (perfil === 'Administrador') { PERM_MODULES.forEach(([m]) => map[m] = { ...full }); return map; }
  if (perfil === 'Engenharia') ['obras','servicos','diario','cronograma','equipe','documentos','mapa'].forEach(m => map[m] = { ...full });
  if (perfil === 'Financeiro') ['financeiro','contratos','compras','fornecedores','relatorios'].forEach(m => map[m] = { ...full });
  if (perfil === 'RH') ['equipe'].forEach(m => map[m] = { ...full });
  if (perfil === 'Mestre de Obra') { ['diario','cronograma'].forEach(m => map[m] = { ...full }); map['equipe'] = { ...viewOnly, criar:true, editar:true }; }
  if (perfil === 'Almoxarifado') ['estoque','compras','fornecedores'].forEach(m => map[m] = { ...full });
  map['configuracoes'] = perfil === 'Administrador' ? { ...full } : { ...none };
  if (perfil === 'Visualização') PERM_MODULES.forEach(([m]) => { if (m !== 'configuracoes') map[m] = { ...viewOnly }; });
  return map;
}

function getPermissoes() {
  let all = StorageService.get(DB.KEYS.permissoes, null);
  if (!all) {
    all = {};
    PERM_PROFILES.forEach(p => all[p] = defaultPermFor(p));
    StorageService.set(DB.KEYS.permissoes, all);
  }
  return all;
}
function setPermissoes(all) { StorageService.set(DB.KEYS.permissoes, all); }

const Perm = {
  can(modulo, acao) {
    const session = AuthService.getSession();
    const perfil = session ? session.perfil : 'Visualização';
    if (perfil === 'Administrador') return true;
    const all = getPermissoes();
    const map = all[perfil] || defaultPermFor(perfil);
    const mod = map[modulo];
    if (!mod) return true;
    return !!mod[acao];
  }
};

function initPermissoesTab() {
  const cfgTabs = document.getElementById('cfg-tabs');
  if (!cfgTabs || document.getElementById('ctab-permissoes')) return;
  cfgTabs.insertAdjacentHTML('beforeend', `<div class="tab" onclick="switchConfigTab('permissoes',this)">Permissões</div>`);
  const cfgPage = document.getElementById('page-configuracoes');
  const div = document.createElement('div');
  div.id = 'ctab-permissoes';
  div.className = 'ctab';
  div.style.display = 'none';
  div.innerHTML = `
    <div class="card">
      <div class="section-title mb-16">Permissões por Perfil</div>
      <div class="form-group" style="max-width:280px"><label class="form-label">Selecione o Perfil</label>
        <select class="form-input" id="perm-perfil-select" onchange="renderPermTable()">
          ${PERM_PROFILES.map(p => `<option value="${p}">${p}</option>`).join('')}
        </select>
      </div>
      <div id="perm-table-wrap" class="table-wrap"></div>
      <button class="btn btn-primary" style="margin-top:14px" onclick="salvarPermTable()">💾 Salvar Permissões deste Perfil</button>
      <p style="font-size:11px;color:var(--gray400);margin-top:10px">O perfil <b>Administrador</b> sempre possui acesso completo a todos os módulos.</p>
    </div>`;
  cfgPage.appendChild(div);
  renderPermTable();
}

function renderPermTable() {
  const perfil = document.getElementById('perm-perfil-select').value;
  const all = getPermissoes();
  const map = all[perfil] || defaultPermFor(perfil);
  const isAdmin = perfil === 'Administrador';
  document.getElementById('perm-table-wrap').innerHTML = `
    <table>
      <tr><th>Módulo</th><th>Ver</th><th>Criar</th><th>Editar</th><th>Excluir</th></tr>
      ${PERM_MODULES.map(([m, label]) => `
        <tr>
          <td>${label}</td>
          ${['ver','criar','editar','excluir'].map(acao => `<td style="text-align:center"><input type="checkbox" data-mod="${m}" data-acao="${acao}" ${map[m] && map[m][acao] ? 'checked' : ''} ${isAdmin ? 'disabled' : ''}></td>`).join('')}
        </tr>`).join('')}
    </table>`;
}

function salvarPermTable() {
  const perfil = document.getElementById('perm-perfil-select').value;
  if (perfil === 'Administrador') { showToast('O perfil Administrador não pode ser alterado.', 'info'); return; }
  const all = getPermissoes();
  const map = {};
  PERM_MODULES.forEach(([m]) => map[m] = { ver:false, criar:false, editar:false, excluir:false });
  document.querySelectorAll('#perm-table-wrap input[type=checkbox]').forEach(cb => {
    map[cb.dataset.mod][cb.dataset.acao] = cb.checked;
  });
  all[perfil] = map;
  setPermissoes(all);
  showToast('Permissões do perfil "' + perfil + '" salvas!', 'success');
  applyPermissoes();
}

// Aplica as permissões na interface: esconde navegação, botões de criar/editar/excluir
function applyPermissoes() {
  const session = AuthService.getSession();
  if (!session) return;
  const perfil = session.perfil;
  if (perfil === 'Administrador') return; // acesso total

  const all = getPermissoes();
  const map = all[perfil] || defaultPermFor(perfil);

  // Navegação
  document.querySelectorAll('.nav-item[data-page]').forEach(nav => {
    const mod = nav.dataset.page;
    const perm = map[mod];
    nav.style.display = (perm && perm.ver === false) ? 'none' : '';
  });

  // Se a página atual não é permitida, redireciona ao dashboard
  if (currentPage && map[currentPage] && map[currentPage].ver === false) {
    showToast('Você não tem permissão para acessar este módulo.', 'error');
    goTo('dashboard');
    return;
  }

  // Botões "+ Novo/Nova" (criação) na página ativa
  const perm = map[currentPage];
  const activePage = document.getElementById('page-' + currentPage);
  if (activePage && perm) {
    if (perm.criar === false) {
      activePage.querySelectorAll('.btn-primary').forEach(btn => {
        const t = btn.textContent.trim();
        if (t.startsWith('+') || t.includes('Nova') || t.includes('Novo') || t.includes('Solicitação')) btn.style.display = 'none';
      });
    }
    if (perm.editar === false) {
      activePage.querySelectorAll('button[title="Editar"], button[onclick*="editar"]').forEach(btn => btn.style.display = 'none');
    }
    if (perm.excluir === false) {
      activePage.querySelectorAll('button[title="Excluir"], button[onclick*="excluir"]').forEach(btn => btn.style.display = 'none');
    }
  }
}
