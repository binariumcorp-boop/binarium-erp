// ============================================================
// busca-universal.js
// FASE 2: BUSCA UNIVERSAL
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== FASE 2: BUSCA UNIVERSAL =====
function initBuscaUniversal() {
  const topbar = document.querySelector('.topbar');
  if (!topbar || document.getElementById('busca-universal')) return;
  const buscaHTML = `
    <div style="position:relative;flex:1;max-width:400px" id="busca-universal-wrap">
      <div class="search-box" style="background:#f9fafb">
        <span>🔍</span>
        <input type="text" id="busca-universal" placeholder="Buscar em todo o sistema..." oninput="executarBusca(this.value)" autocomplete="off" style="font-size:13px">
      </div>
      <div id="busca-resultados" style="display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid var(--gray200);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.15);z-index:500;max-height:400px;overflow-y:auto;margin-top:4px"></div>
    </div>`;
  const title = topbar.querySelector('.topbar-title').parentElement;
  title.insertAdjacentHTML('afterend', buscaHTML);
  document.addEventListener('click', e => {
    if (!e.target.closest('#busca-universal-wrap')) {
      const res = document.getElementById('busca-resultados');
      if (res) res.style.display = 'none';
    }
  });
}

function executarBusca(q) {
  const res = document.getElementById('busca-resultados');
  if (!q || q.length < 2) { res.style.display = 'none'; return; }
  const term = q.toLowerCase();
  const resultados = [];
  DB.get('obras').filter(o => o.nome.toLowerCase().includes(term) || o.municipio.toLowerCase().includes(term) || o.codigo.toLowerCase().includes(term))
    .slice(0,3).forEach(o => resultados.push({ tipo: '🏗️ Obra', nome: o.nome, sub: o.municipio, action: () => goTo('obras') }));
  DB.get('equipe').filter(e => e.nome.toLowerCase().includes(term) || e.cpf.includes(term) || e.funcao.toLowerCase().includes(term))
    .slice(0,3).forEach(e => resultados.push({ tipo: '👤 Colaborador', nome: e.nome, sub: e.funcao, action: () => goTo('equipe') }));
  DB.get('contratos').filter(c => c.numero.toLowerCase().includes(term) || c.fornecedor.toLowerCase().includes(term))
    .slice(0,3).forEach(c => resultados.push({ tipo: '📄 Contrato', nome: c.numero, sub: c.fornecedor, action: () => goTo('contratos') }));
  DB.get('documentos').filter(d => d.nome.toLowerCase().includes(term))
    .slice(0,3).forEach(d => resultados.push({ tipo: '📁 Documento', nome: d.nome, sub: d.categoria, action: () => goTo('documentos') }));
  DB.get('estoque').filter(e => e.nome.toLowerCase().includes(term))
    .slice(0,2).forEach(e => resultados.push({ tipo: '📦 Estoque', nome: e.nome, sub: e.categoria, action: () => goTo('estoque') }));
  DB.get('financeiro').filter(f => f.descricao.toLowerCase().includes(term))
    .slice(0,2).forEach(f => resultados.push({ tipo: '💰 Financeiro', nome: f.descricao, sub: FormatService.currency(f.valor), action: () => goTo('financeiro') }));
  DB.get('diario').filter(d => d.titulo.toLowerCase().includes(term) || (d.descricao||'').toLowerCase().includes(term))
    .slice(0,2).forEach(d => resultados.push({ tipo: '📋 Diário', nome: d.titulo, sub: d.obraNome, action: () => goTo('diario') }));
  if (resultados.length === 0) {
    res.innerHTML = '<div style="padding:16px;text-align:center;color:var(--gray400);font-size:13px">Nenhum resultado encontrado</div>';
  } else {
    res.innerHTML = resultados.map((r, i) => `<div style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--gray100);display:flex;align-items:center;gap:10px" onmouseover="this.style.background='var(--gray50)'" onmouseout="this.style.background=''" onclick="buscaResultadoClick(${i})">
      <span style="font-size:11px;color:var(--gray400);white-space:nowrap">${r.tipo}</span>
      <div><div style="font-size:13px;font-weight:600">${r.nome}</div><div style="font-size:11px;color:var(--gray400)">${r.sub}</div></div>
    </div>`).join('');
    window._buscaResultados = resultados;
  }
  res.style.display = 'block';
}

function buscaResultadoClick(i) {
  const r = window._buscaResultados[i];
  if (r) {
    r.action();
    document.getElementById('busca-universal').value = '';
    document.getElementById('busca-resultados').style.display = 'none';
  }
}

