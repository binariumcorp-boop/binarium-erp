// ============================================================
// dashboard.js
// DASHBOARD
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== DASHBOARD =====
function renderDashboard() {
  const obras = DB.get('obras');
  const financeiro = DB.get('financeiro');
  const equipe = DB.get('equipe');
  const estoque = DB.get('estoque');
  const contratos = DB.get('contratos');
  const diario = DB.get('diario') || [];
  const cronograma = obterCronogramas();

  const obrasAtivas = obras.filter(o => ['Em Andamento','Concluindo','Atrasada'].includes(o.status));
  const obrasConcluidas = obras.filter(o => o.status === 'Concluída');
  const obrasAtrasadas = obras.filter(o => o.status === 'Atrasada');
  const receita = obras.reduce((s, o) => s + (o.valor || 0), 0);
  const custoExec = financeiro.filter(f => f.tipo === 'saida' && f.status === 'Pago').reduce((s, f) => s + (f.valor || 0), 0);
  const recebido = financeiro.filter(f => f.tipo === 'entrada' && f.status === 'Pago').reduce((s, f) => s + (f.valor || 0), 0);
  const aReceber = financeiro.filter(f => f.tipo === 'entrada' && f.status === 'Pendente').reduce((s, f) => s + (f.valor || 0), 0);
  const lucro = recebido - custoExec;
  const margem = recebido > 0 ? ((lucro / recebido) * 100).toFixed(1) : 0;
  const colaborAtivos = equipe.filter(e => e.status === 'Ativo').length;
  const progressoMedio = obrasAtivas.length ? Math.round(obrasAtivas.reduce((s,o) => s + (o.progresso||0), 0) / obrasAtivas.length) : 0;

  // Alertas
  const hoje = new Date();
  const alertas = [];
  obras.filter(o => o.status === 'Atrasada').forEach(o => alertas.push({ tipo: 'red', titulo: 'Obra em Atraso', desc: o.nome }));
  contratos.filter(c => {
    if (!c.termino) return false;
    const diff = (new Date(c.termino) - hoje) / 86400000;
    return diff > 0 && diff <= 30 && c.status === 'Ativo';
  }).forEach(c => alertas.push({ tipo: 'amber', titulo: 'Contrato a Vencer', desc: c.numero + ' – ' + Math.round((new Date(c.termino) - hoje) / 86400000) + ' dias' }));
  estoque.filter(e => e.qtd <= e.minimo).forEach(e => alertas.push({ tipo: 'amber', titulo: 'Estoque Baixo', desc: e.nome + ' – ' + e.qtd + ' ' + e.unidade }));

  document.getElementById('dash-obras-ativas').textContent = obrasAtivas.length;
  document.getElementById('dash-obras-sub').textContent = obras.length + ' obras no total';
  document.getElementById('dash-obras-concluidas').textContent = obrasConcluidas.length;
  document.getElementById('dash-obras-concluidas-sub').textContent = obras.length ? Math.round(obrasConcluidas.length/obras.length*100) + '% do total' : '0% do total';
  document.getElementById('dash-obras-atrasadas').textContent = obrasAtrasadas.length;
  document.getElementById('dash-progresso-medio').textContent = progressoMedio + '%';
  document.getElementById('dash-receita').textContent = FormatService.currency(receita);
  document.getElementById('dash-custo').textContent = FormatService.currency(custoExec);
  document.getElementById('dash-colaboradores').textContent = colaborAtivos;
  document.getElementById('dash-colab-sub').textContent = equipe.length + ' cadastrados';
  document.getElementById('dash-alertas').textContent = alertas.length;
  document.getElementById('dash-recebido').textContent = FormatService.currency(recebido);
  document.getElementById('dash-areceber').textContent = FormatService.currency(aReceber);
  document.getElementById('dash-lucro').textContent = FormatService.currency(lucro);
  document.getElementById('dash-lucro').style.color = lucro >= 0 ? 'var(--green)' : 'var(--red)';
  document.getElementById('dash-margem-sub').textContent = margem + '% de margem';

  // Obras por status
  const statusCount = {};
  obras.forEach(o => { statusCount[o.status] = (statusCount[o.status]||0) + 1; });
  const statusEl = document.getElementById('dash-status-obras');
  if (statusEl) {
    const maxCount = Math.max(...Object.values(statusCount), 1);
    statusEl.innerHTML = Object.keys(statusCount).map(st => `
      <div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span style="color:var(--gray600)">${st}</span><span style="font-weight:600">${statusCount[st]}</span></div><div class="prog-bar"><div class="prog-fill ${statusColor(st)}" style="width:${(statusCount[st]/maxCount*100)}%"></div></div></div>`).join('');
  }

  // Equipe por função
  const funcaoCount = {};
  equipe.forEach(e => { funcaoCount[e.funcao] = (funcaoCount[e.funcao]||0) + 1; });
  const eqEl = document.getElementById('dash-equipe-funcao');
  if (eqEl) {
    const funcs = Object.keys(funcaoCount);
    eqEl.innerHTML = funcs.length === 0 ? '<div style="color:var(--gray400);font-size:12px;text-align:center;padding:10px">Nenhum colaborador</div>' :
      funcs.map(f => `<div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--gray600)">${f}</span><span style="font-weight:600">${funcaoCount[f]}</span></div>`).join('');
  }

  // Próximos marcos do cronograma
  const cronoEl = document.getElementById('dash-cronograma');
  if (cronoEl) {
    // Ignora concluídas e canceladas; ordena por data final usando o parser
    // local (evita deslocamento de fuso) e mantém ao final os registros sem
    // data válida, em vez de gerar NaN e embaralhar a ordenação.
    const proximos = cronograma
      .filter(c => c.status !== 'Concluída' && c.status !== 'Cancelada')
      .sort((a, b) => {
        const da = criarDataLocal(a.fim), db = criarDataLocal(b.fim);
        if (da && db) return da - db;
        if (da && !db) return -1;
        if (!da && db) return 1;
        return 0;
      })
      .slice(0, 4);
    cronoEl.innerHTML = proximos.length === 0 ? '<div style="color:var(--gray400);font-size:12px;text-align:center;padding:10px">Nenhum marco pendente</div>' :
      proximos.map(c => `<div style="font-size:12px"><div style="display:flex;justify-content:space-between"><span style="font-weight:600">${c.nome}</span><span class="badge ${badgeClass(c.status)}" style="font-size:10px">${c.status}</span></div><div style="color:var(--gray400);font-size:11px">${c.obraNome} – até ${FormatService.date(c.fim)}</div></div>`).join('');
  }

  // Estoque crítico
  const estEl = document.getElementById('dash-estoque-critico');
  if (estEl) {
    const criticos = estoque.filter(e => e.qtd <= e.minimo).sort((a,b) => (a.qtd/a.minimo) - (b.qtd/b.minimo)).slice(0, 5);
    estEl.innerHTML = criticos.length === 0 ? '<div style="color:var(--green);font-size:12px;text-align:center;padding:10px">✅ Estoque normal</div>' :
      criticos.map(e => `<div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--gray600)">${e.nome}</span><span style="font-weight:600;color:${e.qtd===0?'var(--red)':'var(--amber)'}">${e.qtd} ${e.unidade}</span></div>`).join('');
  }

  // Contratos a vencer
  const ctEl = document.getElementById('dash-contratos-vencer');
  if (ctEl) {
    const aVencer = contratos.filter(c => {
      if (!c.termino) return false;
      const diff = (new Date(c.termino) - hoje) / 86400000;
      return c.status === 'Vencido' || (diff > 0 && diff <= 60 && c.status === 'Ativo');
    }).sort((a,b) => new Date(a.termino) - new Date(b.termino)).slice(0, 5);
    ctEl.innerHTML = aVencer.length === 0 ? '<div style="color:var(--green);font-size:12px;text-align:center;padding:10px">✅ Nenhum contrato a vencer</div>' :
      aVencer.map(c => `<div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--gray600)">${c.numero} – ${c.fornecedor.split(' ')[0]}</span><span style="font-weight:600;color:${c.status==='Vencido'?'var(--red)':'var(--amber)'}">${c.status==='Vencido'?'Vencido':FormatService.date(c.termino)}</span></div>`).join('');
  }

  // Diário de obra recente
  const diEl = document.getElementById('dash-diario-recente');
  if (diEl) {
    const recentes = [...diario].sort((a,b) => new Date(b.data) - new Date(a.data)).slice(0, 4);
    diEl.innerHTML = recentes.length === 0 ? '<div style="color:var(--gray400);font-size:12px;text-align:center;padding:10px">Nenhum registro</div>' :
      recentes.map(d => `<div style="font-size:12px"><div style="display:flex;justify-content:space-between"><span style="font-weight:600">${d.titulo.length>28?d.titulo.substring(0,28)+'…':d.titulo}</span><span style="color:var(--gray400);font-size:11px">${FormatService.date(d.data)}</span></div><div style="color:var(--gray400);font-size:11px">${d.obraNome} · ${d.tipo}</div></div>`).join('');
  }

  // Tabela obras
  const tbody = document.getElementById('dash-obras-table');
  const obrasAndamento = obras.filter(o => ['Em Andamento','Concluindo','Atrasada'].includes(o.status)).slice(0, 5);
  if (obrasAndamento.length === 0) {
    tbody.innerHTML = '<tr><th>Escola / Município</th><th>Progresso</th><th>Status</th><th>Valor (R$)</th></tr><tr><td colspan="4" style="text-align:center;color:var(--gray400);padding:20px">Nenhuma obra em andamento</td></tr>';
  } else {
    tbody.innerHTML = '<tr><th>Escola / Município</th><th>Progresso</th><th>Status</th><th>Valor (R$)</th></tr>' + obrasAndamento.map(o => `
      <tr style="cursor:pointer" onclick="abrirObra(${o.id})">
        <td><div style="font-weight:600;font-size:13px">${o.nome}</div><div style="font-size:11px;color:var(--gray400)">${o.municipio}</div></td>
        <td><div style="display:flex;align-items:center;gap:8px"><div class="prog-bar" style="width:80px"><div class="prog-fill ${statusColor(o.status)}" style="width:${o.progresso}%"></div></div><span style="font-size:12px">${o.progresso}%</span></div></td>
        <td><span class="badge ${badgeClass(o.status)}">${o.status}</span></td>
        <td style="font-size:12px;font-weight:600">${FormatService.currency(o.valor)}</td>
      </tr>`).join('');
  }

  // Alertas
  const alertasList = document.getElementById('dash-alertas-list');
  if (alertas.length === 0) {
    alertasList.innerHTML = '<div style="color:var(--green);font-size:12px;text-align:center;padding:10px">✅ Nenhum alerta crítico</div>';
  } else {
    alertasList.innerHTML = alertas.slice(0, 5).map(a => `
      <div style="padding:10px;background:${a.tipo==='red'?'rgba(248,81,73,.10)':'rgba(245,158,11,.10)'};border-radius:8px;border-left:3px solid var(--${a.tipo})">
        <div style="font-size:12px;font-weight:600;color:var(--${a.tipo})">${a.titulo}</div>
        <div style="font-size:11px;color:var(--gray600)">${a.desc}</div>
      </div>`).join('');
  }

  // Vencimentos
  const venc = financeiro.filter(f => f.status === 'Pendente').slice(0, 4);
  document.getElementById('dash-vencimentos').innerHTML = venc.length === 0
    ? '<div style="color:var(--gray400);font-size:12px;text-align:center">Nenhum vencimento pendente</div>'
    : venc.map(v => `<div style="display:flex;justify-content:space-between"><span style="color:var(--gray600)">${FormatService.date(v.data)} – ${v.descricao.substring(0,25)}</span><span style="font-weight:600;color:var(--${v.tipo==='saida'?'red':'green'})">${FormatService.currency(v.valor)}</span></div>`).join('');

  // Gráfico
  const chart = document.getElementById('dash-chart');
  const obrasChart = obras.filter(o => o.valor > 0).slice(0, 6);
  const maxVal = Math.max(...obrasChart.map(o => o.valor));
  chart.innerHTML = obrasChart.map(o => {
    const h = Math.round((o.valor / maxVal) * 100);
    const cor = o.status === 'Atrasada' ? 'var(--amber)' : o.status === 'Concluída' ? 'var(--green)' : 'var(--blue)';
    const label = o.municipio.split('–')[0].trim().split(' ')[0];
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1">
      <div style="font-size:10px;color:var(--gray400);margin-bottom:4px">${FormatService.currency(o.valor/1000).replace('R$ ','R$').replace(',00','K')}</div>
      <div style="width:100%;background:${cor};border-radius:4px 4px 0 0;height:${h}%"></div>
      <div style="font-size:10px;color:var(--gray600);text-align:center">${label}</div>
    </div>`;
  }).join('');

  // Saúde financeira
  const entradas = financeiro.filter(f => f.tipo === 'entrada' && f.status === 'Pago').reduce((s, f) => s + f.valor, 0);
  const saidas = financeiro.filter(f => f.tipo === 'saida' && f.status === 'Pago').reduce((s, f) => s + f.valor, 0);
  const saldo = entradas - saidas;
  document.getElementById('dash-saude').innerHTML = `
    <div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="color:var(--gray600)">Saldo Atual</span><span style="font-weight:700;color:var(--green)">${FormatService.currency(saldo)}</span></div><div class="prog-bar"><div class="prog-fill prog-green" style="width:${Math.min(100, (saldo/receita)*100)}%"></div></div></div>
    <div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="color:var(--gray600)">Custo Executado</span><span style="font-weight:600">${FormatService.currency(saidas)}</span></div><div class="prog-bar"><div class="prog-fill prog-blue" style="width:${Math.min(100, (saidas/receita)*100)}%"></div></div></div>
    <div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="color:var(--gray600)">Lucro Previsto</span><span style="font-weight:700;color:var(--blue)">${FormatService.currency(entradas - saidas)}</span></div><div class="prog-bar"><div class="prog-fill" style="width:${Math.min(100, ((entradas-saidas)/receita)*100)}%;background:var(--blue)"></div></div></div>`;
}

function refreshDashboard() { renderDashboard(); showToast('Dashboard atualizado!', 'success'); }

function exportDashboard() {
  const obras = DB.get('obras');
  const financeiro = DB.get('financeiro');
  const entradas = financeiro.filter(f => f.tipo === 'entrada' && f.status === 'Pago').reduce((s, f) => s + f.valor, 0);
  const saidas = financeiro.filter(f => f.tipo === 'saida' && f.status === 'Pago').reduce((s, f) => s + f.valor, 0);
  const csv = 'Obra,Município,Status,Progresso,Valor\n' + obras.map(o => `"${o.nome}","${o.municipio}","${o.status}","${o.progresso}%","${FormatService.currency(o.valor)}"`).join('\n');
  downloadFile('dashboard_mbsolucoes.csv', csv, 'text/csv');
}

