// ============================================================
// alertas.js
// FASE 2: ALERTAS INTELIGENTES
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== FASE 2: ALERTAS INTELIGENTES =====
function initAlertasInteligentes() {
  const notifBtn = document.getElementById('notif-btn');
  if (!notifBtn || document.getElementById('alertas-panel')) return;
  const panel = document.createElement('div');
  panel.id = 'alertas-panel';
  panel.style.cssText = 'display:none;position:fixed;top:70px;right:24px;width:360px;background:#fff;border:1px solid var(--gray200);border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.15);z-index:800;max-height:500px;overflow-y:auto';
  panel.innerHTML = `<div style="padding:16px;border-bottom:1px solid var(--gray200);display:flex;justify-content:space-between;align-items:center"><div style="font-weight:600">Alertas Inteligentes</div><button class="btn btn-ghost btn-sm" onclick="document.getElementById('alertas-panel').style.display='none'">✕</button></div><div id="alertas-lista" style="padding:12px;display:flex;flex-direction:column;gap:8px"></div>`;
  document.body.appendChild(panel);
  notifBtn.onclick = () => {
    const p = document.getElementById('alertas-panel');
    p.style.display = p.style.display === 'none' ? 'block' : 'none';
    if (p.style.display === 'block') renderAlertas();
  };
}

function renderAlertas() {
  const obras = DB.get('obras');
  const contratos = DB.get('contratos');
  const estoque = DB.get('estoque');
  const fin = DB.get('financeiro');
  const hoje = new Date();
  const alertas = [];
  obras.filter(o => o.status === 'Atrasada').forEach(o => alertas.push({ nivel: 'red', titulo: 'Obra em Atraso', desc: o.nome, modulo: 'obras' }));
  contratos.filter(c => { if(!c.termino) return false; const d=(new Date(c.termino)-hoje)/86400000; return d>0&&d<=30&&c.status==='Ativo'; }).forEach(c => alertas.push({ nivel: 'amber', titulo: 'Contrato a Vencer', desc: `${c.numero} – ${Math.round((new Date(c.termino)-hoje)/86400000)} dias`, modulo: 'contratos' }));
  contratos.filter(c => c.status === 'Vencido').forEach(c => alertas.push({ nivel: 'red', titulo: 'Contrato Vencido', desc: c.numero, modulo: 'contratos' }));
  estoque.filter(e => e.qtd === 0).forEach(e => alertas.push({ nivel: 'red', titulo: 'Estoque Zerado', desc: e.nome, modulo: 'estoque' }));
  estoque.filter(e => e.qtd > 0 && e.qtd <= e.minimo).forEach(e => alertas.push({ nivel: 'amber', titulo: 'Estoque Baixo', desc: `${e.nome} – ${e.qtd} ${e.unidade}`, modulo: 'estoque' }));
  fin.filter(f => f.status === 'Pendente' && f.tipo === 'saida' && f.data < hoje.toISOString().split('T')[0]).forEach(f => alertas.push({ nivel: 'red', titulo: 'Conta Vencida', desc: f.descricao, modulo: 'financeiro' }));
  const lista = document.getElementById('alertas-lista');
  const count = document.getElementById('notif-count');
  if (count) count.textContent = alertas.length;
  if (alertas.length === 0) {
    lista.innerHTML = '<div style="text-align:center;color:var(--green);padding:20px">✅ Nenhum alerta crítico</div>';
  } else {
    lista.innerHTML = alertas.map(a => `<div style="padding:10px;background:${a.nivel==='red'?'#fff5f5':'#fffbeb'};border-radius:8px;border-left:3px solid var(--${a.nivel});cursor:pointer" onclick="goTo('${a.modulo}');document.getElementById('alertas-panel').style.display='none'">
      <div style="font-size:12px;font-weight:600;color:var(--${a.nivel})">${a.titulo}</div>
      <div style="font-size:11px;color:var(--gray600)">${a.desc}</div>
    </div>`).join('');
  }
}

