// ============================================================
// auth.js
// AUTH SERVICE
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== AUTH SERVICE =====
const AuthService = {
  USERS_KEY: 'gob_users',
  SESSION_KEY: 'gob_session',

  DEFAULT_ADMIN: {
    id: 1, nome: 'Ysmael Q. Nunes', email: 'admin@mbsolucoes.com.br',
    senha: 'mbsolucoes2025', perfil: 'Administrador', status: 'Ativo',
    cargo: 'Engenheiro Responsável', createdAt: new Date().toISOString()
  },

  // Usuário Super Administrador — pertence exclusivamente à BinariumCorp
  // (Alteração 4). Possui acesso total ao sistema, incluindo todas as
  // empresas cadastradas, e não pode ser removido nem editado pelas
  // telas normais de usuários. Nenhum administrador de empresa (perfil
  // "Administrador" e demais) tem acesso às funções de Super Admin.
  SUPER_ADMIN: {
    id: 0, nome: 'BinariumCorp', email: 'superadmin@binariumcorp.com',
    senha: 'binarium@super', perfil: 'Super Admin', status: 'Ativo',
    cargo: 'Administrador Supremo (BinariumCorp)', superAdmin: true, protegido: true,
    createdAt: new Date().toISOString()
  },

  getUsers() {
    let users = StorageService.get(this.USERS_KEY, []);
    // Self-healing: garante que o admin padrão sempre exista e esteja íntegro,
    // mesmo se o localStorage tiver dados antigos/corrompidos de uma versão anterior.
    const hasValidAdmin = Array.isArray(users) && users.some(u =>
      u && u.email && u.senha && u.status &&
      u.email.toLowerCase() === this.DEFAULT_ADMIN.email
    );
    if (!Array.isArray(users) || users.length === 0 || !hasValidAdmin) {
      users = Array.isArray(users) ? users.filter(u => u && u.email && u.email.toLowerCase() !== this.DEFAULT_ADMIN.email) : [];
      users.unshift({ ...this.DEFAULT_ADMIN });
      StorageService.set(this.USERS_KEY, users);
    }
    // Self-healing do Super Admin BinariumCorp: sempre presente e íntegro,
    // não pode ser removido/alterado por telas de usuário (Alteração 4).
    const hasValidSuperAdmin = Array.isArray(users) && users.some(u =>
      u && u.email && u.email.toLowerCase() === this.SUPER_ADMIN.email && u.superAdmin
    );
    if (!hasValidSuperAdmin) {
      users = users.filter(u => !(u && u.email && u.email.toLowerCase() === this.SUPER_ADMIN.email));
      users.unshift({ ...this.SUPER_ADMIN });
      StorageService.set(this.USERS_KEY, users);
    }
    return users;
  },

  isSuperAdmin(session) {
    session = session || this.getSession();
    return !!(session && (session.superAdmin || (session.email && session.email.toLowerCase() === this.SUPER_ADMIN.email)));
  },

  async login(email, senha) {
    const emailLimpo = (email || '').trim().toLowerCase();
    const senhaLimpa = (senha || '').trim();

    // Login do Super Admin BinariumCorp sempre é validado localmente,
    // mesmo com a infraestrutura SaaS/multiempresa ativa — ele não
    // pertence a nenhuma empresa específica.
    if (emailLimpo === this.SUPER_ADMIN.email.toLowerCase()) {
      const su = this.getUsers().find(u => u.email.toLowerCase() === emailLimpo);
      if (!su || su.senha !== senhaLimpa) return { ok: false, motivo: 'senha' };
      const session = { userId: su.id, nome: su.nome, email: su.email, perfil: su.perfil, superAdmin: true, loginAt: new Date().toISOString() };
      StorageService.set(this.SESSION_KEY, session);
      return { ok: true, user: session };
    }

    // Modo SaaS (Etapa 5): autentica de verdade no Supabase Auth,
    // resolve a empresa (multiempresa) e o status da assinatura (Asaas).
    if (CLOUD_CONFIG.ATIVADO && CloudSync.client) {
      const res = await CloudSync.signIn(emailLimpo, senhaLimpa);
      if (!res.ok) {
        const mapa = { credenciais: 'senha', empresa_inativa: 'inativo', offline: 'offline' };
        return { ok: false, motivo: mapa[res.motivo] || 'senha' };
      }
      await CloudSync.hydrate(); // traz os dados da empresa para o cache local

      // Reaproveita o cadastro local de usuários (tela "Usuários", inalterada)
      // só para exibir nome/cargo; quem valida a senha agora é o Supabase.
      const users = this.getUsers();
      const local = users.find(u => u.email.toLowerCase() === emailLimpo);

      const session = {
        userId: local ? local.id : CloudSync.usuarioId,
        nome: (local && local.nome) || res.perfil.nome || email,
        email: emailLimpo,
        perfil: (local && local.perfil) || (res.perfil.role === 'admin_mb' ? 'Administrador' : 'Cliente'),
        empresaId: CloudSync.empresaId,
        assinaturaStatus: res.assinatura ? res.assinatura.status : null,
        loginAt: new Date().toISOString()
      };
      StorageService.set(this.SESSION_KEY, session);
      return { ok: true, user: session };
    }

    // Fallback local/demonstrativo (comportamento original, sem nuvem)
    const users = this.getUsers();
    const porEmail = users.find(u => u.email.toLowerCase() === emailLimpo);
    if (!porEmail) return { ok: false, motivo: 'email' };
    if (porEmail.status !== 'Ativo') return { ok: false, motivo: 'inativo' };
    if (porEmail.senha !== senhaLimpa) return { ok: false, motivo: 'senha' };

    const session = { userId: porEmail.id, nome: porEmail.nome, email: porEmail.email, perfil: porEmail.perfil, loginAt: new Date().toISOString() };
    StorageService.set(this.SESSION_KEY, session);
    return { ok: true, user: session };
  },

  logout() {
    StorageService.remove(this.SESSION_KEY);
    if (CLOUD_CONFIG.ATIVADO) CloudSync.signOut();
  },

  getSession() { return StorageService.get(this.SESSION_KEY, null); },

  isLogged() { return !!this.getSession(); },

  changePassword(atual, nova, confirma) {
    if (nova !== confirma) { showToast('As senhas não coincidem.', 'error'); return false; }
    if (nova.length < 6) { showToast('A nova senha deve ter pelo menos 6 caracteres.', 'error'); return false; }
    const session = this.getSession();
    if (!session) return false;
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === session.userId);
    if (idx < 0) { showToast('Usuário não encontrado.', 'error'); return false; }
    if (users[idx].senha !== atual) { showToast('Senha atual incorreta.', 'error'); return false; }
    users[idx].senha = nova;
    StorageService.set(this.USERS_KEY, users);
    showToast('Senha alterada com sucesso!', 'success');
    return true;
  }
};

