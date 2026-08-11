// ============================================================
// dashboard-executivo.js
// FASE 2: DASHBOARD EXECUTIVO
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== FASE 2: DASHBOARD EXECUTIVO =====
function initDashboardExecutivo() {
  // Adicionar aba no dashboard
  const dashPage = document.getElementById('page-dashboard');
  if (!dashPage || document.getElementById('dash-tabs')) return;
  const tabsHTML = `<div class="tabs mb-20" id="dash-tabs">
    <div class="tab active" onclick="switchDashTab('operacional',this)">Operacional</div>
    <div class="tab" onclick="switchDashTab('executivo',this)">Executivo</div>
  </div>`;
  dashPage.insertAdjacentHTML('afterbegin', tabsHTML);
  const execDiv = document.createElement('div');
  execDiv.id = 'dash-exec';
  execDiv.style.display = 'none';
  execDiv.innerHTML = `
    <div class="stats-row stats-4 mb-16">
      <div class="stat-card"><div class="stat-icon" style="background:#d1fae5">💰</div><div><div class="stat-label">Receita Total</div><div class="stat-value" style="font-size:15px;color:var(--green)" id="exec-receita">R$ 0</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#fee2e2">📤</div><div><div class="stat-label">Custos Totais</div><div class="stat-value" style="font-size:15px" id="exec-custos">R$ 0</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#dbeafe">📈</div><div><div class="stat-label">Lucro</div><div class="stat-value" style="font-size:15px;color:var(--blue)" id="exec-lucro">R$ 0</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#ede9fe">%</div><div><div class="stat-label">Margem</div><div class="stat-value" id="exec-margem">0%</div></div></div>
    </div>
    <div class="stats-row stats-4 mb-16">
      <div class="stat-card"><div class="stat-icon" style="background:#fef3c7">📋</div><div><div class="stat-label">A Receber</div><div class="stat-value" style="font-size:15px" id="exec-receber">R$ 0</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#fee2e2">📤</div><div><div class="stat-label">A Pagar</div><div class="stat-value" style="font-size:15px" id="exec-pagar">R$ 0</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#dbeafe">🏦</div><div><div class="stat-label">Saldo em Caixa</div><div class="stat-value" style="font-size:15px;color:var(--green)" id="exec-saldo">R$ 0</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#ede9fe">🎯</div><div><div class="stat-label">Ticket Médio / Obra</div><div class="stat-value" style="font-size:15px" id="exec-ticket">R$ 0</div></div></div>
    </div>
    <div class="stats-row stats-4 mb-20">
      <div class="stat-card"><div class="stat-icon" style="background:#dbeafe">📑</div><div><div class="stat-label">Valor Total Contratado</div><div class="stat-value" style="font-size:15px" id="exec-valor-contratado">R$ 0</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#d1fae5">📦</div><div><div class="stat-label">Valor em Estoque</div><div class="stat-value" style="font-size:15px" id="exec-valor-estoque">R$ 0</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#fee2e2">🧾</div><div><div class="stat-label">Folha de Pagamento</div><div class="stat-value" style="font-size:15px" id="exec-folha">R$ 0</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#ede9fe">📜</div><div><div class="stat-label">Valor Total em Contratos</div><div class="stat-value" style="font-size:15px" id="exec-valor-contratos">R$ 0</div></div></div>
    </div>
    <div class="stats-row stats-4 mb-20">
      <div class="stat-card"><div><div class="stat-label">Total de Obras</div><div class="stat-value" id="exec-obras-total">0</div></div></div>
      <div class="stat-card"><div><div class="stat-label">Obras Ativas</div><div class="stat-value" id="exec-obras-ativas">0</div></div></div>
      <div class="stat-card"><div><div class="stat-label">Obras Concluídas</div><div class="stat-value" id="exec-obras-conc">0</div></div></div>
      <div class="stat-card"><div><div class="stat-label">Obras Atrasadas</div><div class="stat-value text-red" id="exec-obras-atr">0</div></div></div>
    </div>
    <div class="card">
      <div class="section-title mb-16">Desempenho Individual de Cada Obra</div>
      <div class="table-wrap">
        <table>
          <tr><th>Código</th><th>Obra</th><th>Município</th><th>Valor Contratado</th><th>Custo Executado</th><th>Saldo</th><th>Margem</th><th>Recebido</th><th>A Receber</th><th>Progresso</th><th>Status</th></tr>
          <tbody id="exec-obras-table"></tbody>
        </table>
      </div>
    </div>`;
  dashPage.appendChild(execDiv);
}

let dashExecVisible = false; // true quando a aba "Executivo" do dashboard está visível

function switchDashTab(tab, el) {
  document.querySelectorAll('#dash-tabs .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const exec = document.getElementById('dash-exec');
  dashExecVisible = (tab === 'executivo');
  if (tab === 'executivo') {
    if (exec) exec.style.display = 'block';
    document.getElementById('dash-kpis').style.display = 'none';
    document.querySelectorAll('#page-dashboard > div:not(#dash-tabs):not(#dash-exec)').forEach(d => d.style.display = 'none');
    renderDashboardExecutivo();
  } else {
    if (exec) exec.style.display = 'none';
    document.getElementById('dash-kpis').style.display = '';
    document.querySelectorAll('#page-dashboard > div:not(#dash-tabs):not(#dash-exec)').forEach(d => d.style.display = '');
  }
}

function renderDashboardExecutivo() {
  const obras = DB.get('obras');
  const fin = DB.get('financeiro');
  const estoque = DB.get('estoque') || [];
  const equipe = DB.get('equipe') || [];
  const contratos = DB.get('contratos') || [];

  const receita = fin.filter(f => f.tipo === 'entrada' && f.status === 'Pago').reduce((s,f) => s+f.valor, 0);
  const custos = fin.filter(f => f.tipo === 'saida' && f.status === 'Pago').reduce((s,f) => s+f.valor, 0);
  const lucro = receita - custos;
  const margem = receita > 0 ? (lucro/receita*100).toFixed(1) : 0;
  const aReceber = fin.filter(f => f.tipo==='entrada' && f.status==='Pendente').reduce((s,f)=>s+f.valor,0);
  const aPagar = fin.filter(f => f.tipo==='saida' && f.status==='Pendente').reduce((s,f)=>s+f.valor,0);
  const valorContratadoTotal = obras.reduce((s,o) => s + (o.valor||0), 0);
  const ticketMedio = obras.length ? valorContratadoTotal / obras.length : 0;
  const valorEstoque = estoque.reduce((s,e) => s + (e.qtd||0) * (e.valorUnit||0), 0);
  const folhaPagamento = equipe.filter(e => e.status === 'Ativo').reduce((s,e) => s + (e.salario||0), 0);
  const valorContratos = contratos.reduce((s,c) => s + (c.valor||0), 0);

  document.getElementById('exec-receita').textContent = FormatService.currency(receita);
  document.getElementById('exec-custos').textContent = FormatService.currency(custos);
  document.getElementById('exec-lucro').textContent = FormatService.currency(lucro);
  document.getElementById('exec-margem').textContent = margem + '%';
  document.getElementById('exec-receber').textContent = FormatService.currency(aReceber);
  document.getElementById('exec-pagar').textContent = FormatService.currency(aPagar);
  document.getElementById('exec-saldo').textContent = FormatService.currency(receita - custos);
  document.getElementById('exec-ticket').textContent = FormatService.currency(ticketMedio);
  document.getElementById('exec-valor-contratado').textContent = FormatService.currency(valorContratadoTotal);
  document.getElementById('exec-valor-estoque').textContent = FormatService.currency(valorEstoque);
  document.getElementById('exec-folha').textContent = FormatService.currency(folhaPagamento);
  document.getElementById('exec-valor-contratos').textContent = FormatService.currency(valorContratos);
  document.getElementById('exec-obras-total').textContent = obras.length;
  document.getElementById('exec-obras-ativas').textContent = obras.filter(o => ['Em Andamento','Concluindo'].includes(o.status)).length;
  document.getElementById('exec-obras-conc').textContent = obras.filter(o => o.status === 'Concluída').length;
  document.getElementById('exec-obras-atr').textContent = obras.filter(o => o.status === 'Atrasada').length;

  document.getElementById('exec-obras-table').innerHTML = obras.map(o => {
    const obrafin = fin.filter(f => f.obraId === o.id);
    const custoExec = obrafin.filter(f => f.tipo==='saida' && f.status==='Pago').reduce((s,f)=>s+f.valor,0);
    const recebido = obrafin.filter(f => f.tipo==='entrada' && f.status==='Pago').reduce((s,f)=>s+f.valor,0);
    const receberObra = obrafin.filter(f => f.tipo==='entrada' && f.status==='Pendente').reduce((s,f)=>s+f.valor,0);
    const saldoObra = o.valor - custoExec;
    const margObra = o.valor > 0 ? ((o.valor - custoExec)/o.valor*100).toFixed(1) : 0;
    return `<tr style="cursor:pointer" onclick="abrirObra(${o.id})">
      <td style="font-size:12px;color:var(--gray400)">${o.codigo}</td>
      <td style="font-weight:600;font-size:12px">${o.nome}</td>
      <td style="font-size:12px;color:var(--gray400)">${o.municipio}</td>
      <td style="font-size:12px">${FormatService.currency(o.valor)}</td>
      <td style="font-size:12px">${FormatService.currency(custoExec)}</td>
      <td style="font-size:12px;color:${saldoObra>=0?'var(--green)':'var(--red)'}">${FormatService.currency(saldoObra)}</td>
      <td style="font-size:12px;color:${margObra>=0?'var(--green)':'var(--red)'}">${margObra}%</td>
      <td style="font-size:12px">${FormatService.currency(recebido)}</td>
      <td style="font-size:12px">${FormatService.currency(receberObra)}</td>
      <td style="font-size:12px">${o.progresso}%</td>
      <td><span class="badge ${badgeClass(o.status)}">${o.status}</span></td>
    </tr>`;
  }).join('');
}

