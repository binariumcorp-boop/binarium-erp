// ============================================================
// storage.js
// STORAGE SERVICE
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== STORAGE SERVICE =====
const StorageService = {
  get(key, def = null) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch { return false; }
  },
  remove(key) { localStorage.removeItem(key); },
  clear() { localStorage.clear(); }
};

// =====================================================================
