// ============================================================
// sync.js
// CLOUD SYNC - sincronizacao
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

const CloudSync = {
  client: null,
  empresaId: null,
  usuarioId: null,
  online: false,

  init() {
    if (!CLOUD_CONFIG.ATIVADO || typeof supabase === 'undefined') return;
    if (CLOUD_CONFIG.SUPABASE_URL.includes('SEU_PROJECT_REF')) {
      console.warn('[CloudSync] Preencha CLOUD_CONFIG com as credenciais do seu projeto Supabase.');
      return;
    }
    this.client = supabase.createClient(CLOUD_CONFIG.SUPABASE_URL, CLOUD_CONFIG.SUPABASE_ANON_KEY);
  },

  // Autentica no Supabase Auth (Etapa 5) e descobre a empresa (multiempresa)
  async signIn(email, senha) {
    if (!this.client) return { ok: false, motivo: 'offline' };
    const { data, error } = await this.client.auth.signInWithPassword({ email, password: senha });
    if (error || !data.session) return { ok: false, motivo: 'credenciais', error };

    const { data: perfil, error: perfilErro } = await this.client
      .from('usuarios')
      .select('id, empresa_id, nome, email, role, empresas ( id, nome, ativo )')
      .eq('id', data.user.id)
      .maybeSingle();

    if (perfilErro || !perfil || !perfil.empresas || perfil.empresas.ativo === false) {
      await this.client.auth.signOut();
      return { ok: false, motivo: 'empresa_inativa' };
    }

    this.usuarioId = perfil.id;
    this.empresaId = perfil.empresa_id;
    this.online = true;

    const assinatura = await this.getStatusAssinatura();
    return { ok: true, perfil, assinatura };
  },

  async signOut() {
    if (this.client) { try { await this.client.auth.signOut(); } catch (e) {} }
    this.online = false;
    this.empresaId = null;
    this.usuarioId = null;
  },

  // Consulta o status de licenciamento/assinatura (Asaas) da empresa logada
  async getStatusAssinatura() {
    if (!this.client || !this.empresaId) return null;
    const { data } = await this.client
      .from('assinaturas')
      .select('status, proximo_vencimento')
      .eq('empresa_id', this.empresaId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data || null;
  },

  // Baixa todos os dados da empresa da nuvem para o localStorage (cache
  // local) ANTES do app renderizar qualquer tela — por isso as telas
  // continuam lendo do StorageService de forma síncrona, sem mudanças.
  async hydrate() {
    if (!this.client || !this.empresaId) return;
    const { data, error } = await this.client
      .from('erp_dados')
      .select('chave, valor')
      .eq('empresa_id', this.empresaId);
    if (error || !data) return;
    data.forEach(row => {
      if (CLOUD_SYNC_KEYS.has(row.chave)) {
        localStorage.setItem(row.chave, JSON.stringify(row.valor));
      }
    });
  },

  // Espelha uma escrita local para a nuvem (fire-and-forget; a tela não
  // espera essa chamada, então nada no restante do ERP precisa mudar).
  push(key, val) {
    if (!this.client || !this.empresaId || !CLOUD_SYNC_KEYS.has(key)) return;
    this.client.from('erp_dados').upsert({
      empresa_id: this.empresaId,
      chave: key,
      valor: val,
      atualizado_em: new Date().toISOString()
    }, { onConflict: 'empresa_id,chave' }).then(({ error }) => {
      if (error) console.warn('[CloudSync] Falha ao sincronizar', key, error.message);
    });
  }
};
CloudSync.init();

// StorageService.set/remove agora também espelham para a nuvem (quando
// CloudSync está ativo). A leitura (get) continua 100% local/síncrona.
const _storageSetLocal = StorageService.set.bind(StorageService);
StorageService.set = function (key, val) {
  const ok = _storageSetLocal(key, val);
  CloudSync.push(key, val);
  return ok;
};

