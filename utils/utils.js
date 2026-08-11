// ============================================================
// utils.js
// VALIDATION SERVICE + FORMAT SERVICE
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== VALIDATION SERVICE =====
const ValidationService = {
  required(val, label) {
    if (!val || !String(val).trim()) { showToast(`${label} é obrigatório.`, 'error'); return false; }
    return true;
  },
  cpf(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let s = 0;
    for (let i = 0; i < 9; i++) s += parseInt(cpf[i]) * (10 - i);
    let r = (s * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    if (r !== parseInt(cpf[9])) return false;
    s = 0;
    for (let i = 0; i < 10; i++) s += parseInt(cpf[i]) * (11 - i);
    r = (s * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    return r === parseInt(cpf[10]);
  },
  email(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); },
  cnpj(cnpj) {
    cnpj = String(cnpj || '').replace(/\D/g, '');
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
    const calc = (base) => {
      let pesos = base.length === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2];
      let soma = 0;
      for (let i = 0; i < base.length; i++) soma += parseInt(base[i]) * pesos[i];
      const r = soma % 11;
      return r < 2 ? 0 : 11 - r;
    };
    const d1 = calc(cnpj.substring(0, 12));
    if (d1 !== parseInt(cnpj[12])) return false;
    const d2 = calc(cnpj.substring(0, 13));
    return d2 === parseInt(cnpj[13]);
  }
};

// ===== FORMAT SERVICE =====
const FormatService = {
  currency(cents) {
    const v = typeof cents === 'number' ? cents : parseFloat(cents) || 0;
    return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },
  date(d) {
    if (!d) return '-';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  },
  percent(v) { return `${parseFloat(v || 0).toFixed(1)}%`; },
  initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  }
};

