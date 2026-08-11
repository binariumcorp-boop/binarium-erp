// ============================================================
// database.js
// DATABASE SERVICE (DB)
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== DATABASE SERVICE =====
const DB = {
  KEYS: {
    obras: 'gob_obras', servicos: 'gob_servicos', equipe: 'gob_equipe',
    financeiro: 'gob_financeiro', estoque: 'gob_estoque', diario: 'gob_diario',
    cronograma: 'gob_cronograma', contratos: 'gob_contratos', documentos: 'gob_documentos',
    config: 'gob_config', initialized: 'gob_initialized',
    fornecedores: 'gob_fornecedores', compras: 'gob_compras'
  },

  get(entity) { return StorageService.get(this.KEYS[entity], []); },
  set(entity, data) {
    const ok = StorageService.set(this.KEYS[entity], data);
    document.dispatchEvent(new CustomEvent('db:change', { detail: { entity } }));
    return ok;
  },

  nextId(entity) {
    const data = this.get(entity);
    return data.length > 0 ? Math.max(...data.map(d => d.id || 0)) + 1 : 1;
  },

  add(entity, item) {
    const data = this.get(entity);
    item.id = this.nextId(entity);
    item.createdAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    data.push(item);
    this.set(entity, data);
    return item;
  },

  update(entity, id, updates) {
    const data = this.get(entity);
    const idx = data.findIndex(d => d.id === id);
    if (idx < 0) return null;
    data[idx] = { ...data[idx], ...updates, updatedAt: new Date().toISOString() };
    this.set(entity, data);
    return data[idx];
  },

  delete(entity, id) {
    const data = this.get(entity).filter(d => d.id !== id);
    this.set(entity, data);
  },

  find(entity, id) { return this.get(entity).find(d => d.id === id) || null; },

  getConfig() { return StorageService.get(this.KEYS.config, {}); },
  setConfig(cfg) { StorageService.set(this.KEYS.config, cfg); }
};

