// ============================================================
// central-ia.js
// FASE 2: CENTRAL DE IA
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== FASE 2: CENTRAL DE IA =====
function initCentralIA() {
  // Adicionar item na sidebar
  const navGestao = document.querySelector('.nav-item[data-page="configuracoes"]');
  if (!navGestao || document.querySelector('[data-page="ia"]')) return;
  const iaItem = document.createElement('div');
  iaItem.className = 'nav-item';
  iaItem.dataset.page = 'ia';
  iaItem.onclick = () => goTo('ia');
  iaItem.innerHTML = `<svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 0v20M2 12h20"/></svg><span>Central de IA</span>`;
  navGestao.parentElement.insertBefore(iaItem, navGestao);
  PAGE_TITLES['ia'] = 'Central de Inteligência Artificial';
  // Adicionar página
  const content = document.getElementById('content');
  const iaPage = document.createElement('div');
  iaPage.className = 'page';
  iaPage.id = 'page-ia';
  iaPage.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div><h2 style="font-size:22px;font-weight:700">Central de IA</h2><p style="font-size:13px;color:var(--gray400)">Consulte dados do sistema com inteligência artificial</p></div>
      <button class="btn btn-ghost btn-sm" onclick="openModal('cfg-ia')">⚙️ Configurar API</button>
    </div>
    <div class="alert alert-info mb-20" id="ia-mode-alert">
      ℹ️ <strong>Modo Demonstrativo:</strong> Configure uma chave de API OpenAI nas configurações para respostas reais.
    </div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:20px">
      <div>
        <div class="card mb-16">
          <div class="section-title mb-12">Perguntas Sugeridas</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${['Quanto gastamos nesta obra?','Qual obra está mais atrasada?','Quais contratos estão vencendo?','Quais materiais precisam ser comprados?','Qual foi o lucro desta obra?','Gere um resumo financeiro.','Compare orçamento e custo real.','Quais colaboradores estão ativos?'].map(q => `<button class="btn btn-ghost btn-sm" style="text-align:left;justify-content:flex-start" onclick="perguntarIA('${q}')">${q}</button>`).join('')}
          </div>
        </div>
      </div>
      <div class="card" style="display:flex;flex-direction:column;height:500px">
        <div class="section-title mb-12">Conversa</div>
        <div id="ia-chat" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:12px;padding:4px"></div>
        <div style="display:flex;gap:10px;margin-top:12px;padding-top:12px;border-top:1px solid var(--gray200)">
          <input class="form-input" id="ia-input" placeholder="Digite sua pergunta..." onkeydown="if(event.key==='Enter')enviarIA()" style="flex:1">
          <button class="btn btn-primary" onclick="enviarIA()">Enviar</button>
        </div>
      </div>
    </div>`;
  content.appendChild(iaPage);
}

function perguntarIA(q) {
  document.getElementById('ia-input').value = q;
  enviarIA();
}

function enviarIA() {
  const input = document.getElementById('ia-input');
  const q = input.value.trim();
  if (!q) return;
  input.value = '';
  const chat = document.getElementById('ia-chat');
  // Mensagem do usuário
  chat.innerHTML += `<div style="display:flex;justify-content:flex-end"><div style="background:var(--blue);color:#fff;padding:10px 14px;border-radius:12px 12px 2px 12px;max-width:80%;font-size:13px">${q}</div></div>`;
  // Resposta da IA
  const apiKey = StorageService.get('gob_ia_key', '');
  if (apiKey) {
    chat.innerHTML += `<div id="ia-loading" style="color:var(--gray400);font-size:13px">⏳ Consultando IA...</div>`;
    chat.scrollTop = chat.scrollHeight;
    callOpenAI(q, apiKey).then(resp => {
      document.getElementById('ia-loading')?.remove();
      chat.innerHTML += `<div style="display:flex;gap:10px"><div style="width:32px;height:32px;border-radius:50%;background:var(--blue-light);display:flex;align-items:center;justify-content:center;flex-shrink:0">🤖</div><div style="background:var(--gray50);padding:10px 14px;border-radius:2px 12px 12px 12px;max-width:80%;font-size:13px;line-height:1.6">${resp}</div></div>`;
      chat.scrollTop = chat.scrollHeight;
    }).catch(() => {
      document.getElementById('ia-loading')?.remove();
      chat.innerHTML += `<div style="color:var(--red);font-size:13px">❌ Erro ao consultar a IA. Verifique a chave de API.</div>`;
    });
  } else {
    const resp = gerarRespostaDemo(q);
    setTimeout(() => {
      chat.innerHTML += `<div style="display:flex;gap:10px"><div style="width:32px;height:32px;border-radius:50%;background:var(--blue-light);display:flex;align-items:center;justify-content:center;flex-shrink:0">🤖</div><div style="background:var(--gray50);padding:10px 14px;border-radius:2px 12px 12px 12px;max-width:80%;font-size:13px;line-height:1.6">${resp}</div></div>`;
      chat.scrollTop = chat.scrollHeight;
    }, 800);
  }
  chat.scrollTop = chat.scrollHeight;
}

async function callOpenAI(q, apiKey) {
  const obras = DB.get('obras');
  const fin = DB.get('financeiro');
  const equipe = DB.get('equipe');
  const contratos = DB.get('contratos');
  const context = `Sistema MB Soluções. Obras: ${JSON.stringify(obras.map(o=>({nome:o.nome,status:o.status,progresso:o.progresso,valor:o.valor})))}. Financeiro: entradas=${fin.filter(f=>f.tipo==='entrada').reduce((s,f)=>s+f.valor,0)}, saídas=${fin.filter(f=>f.tipo==='saida').reduce((s,f)=>s+f.valor,0)}. Equipe: ${equipe.length} colaboradores. Contratos: ${contratos.length} contratos.`;
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({ model: 'gpt-3.5-turbo', messages: [{ role: 'system', content: 'Você é um assistente de gestão de obras. Responda em português brasileiro de forma concisa e útil. Contexto: ' + context }, { role: 'user', content: q }], max_tokens: 500 })
  });
  const data = await resp.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}

function gerarRespostaDemo(q) {
  const obras = DB.get('obras');
  const fin = DB.get('financeiro');
  const estoque = DB.get('estoque');
  const contratos = DB.get('contratos');
  const ql = q.toLowerCase();
  if (ql.includes('atrasad')) {
    const atrasadas = obras.filter(o => o.status === 'Atrasada');
    return atrasadas.length > 0 ? `As obras em atraso são: ${atrasadas.map(o => `<strong>${o.nome}</strong> (${o.progresso}%)`).join(', ')}.` : 'Nenhuma obra está em atraso no momento. ✅';
  }
  if (ql.includes('gasto') || ql.includes('custo')) {
    const saidas = fin.filter(f => f.tipo === 'saida').reduce((s,f) => s+f.valor, 0);
    return `O total de saídas registradas é de <strong>${FormatService.currency(saidas)}</strong>. Isso inclui folha de pagamento, materiais e outros custos operacionais.`;
  }
  if (ql.includes('lucro')) {
    const ent = fin.filter(f => f.tipo === 'entrada' && f.status === 'Pago').reduce((s,f) => s+f.valor, 0);
    const sai = fin.filter(f => f.tipo === 'saida' && f.status === 'Pago').reduce((s,f) => s+f.valor, 0);
    return `Lucro atual: <strong>${FormatService.currency(ent - sai)}</strong> (Entradas: ${FormatService.currency(ent)} − Saídas: ${FormatService.currency(sai)}).`;
  }
  if (ql.includes('contrato') && (ql.includes('venc') || ql.includes('prazo'))) {
    const hoje = new Date();
    const vencendo = contratos.filter(c => { if(!c.termino) return false; const d=(new Date(c.termino)-hoje)/86400000; return d>0&&d<=30; });
    return vencendo.length > 0 ? `Contratos vencendo em 30 dias: ${vencendo.map(c => `<strong>${c.numero}</strong> (${FormatService.date(c.termino)})`).join(', ')}.` : 'Nenhum contrato vencendo nos próximos 30 dias.';
  }
  if (ql.includes('material') || ql.includes('compra') || ql.includes('estoque')) {
    const criticos = estoque.filter(e => e.qtd <= e.minimo);
    return criticos.length > 0 ? `Materiais que precisam ser comprados: ${criticos.map(e => `<strong>${e.nome}</strong> (${e.qtd} ${e.unidade} — mínimo: ${e.minimo})`).join(', ')}.` : 'Todos os materiais estão com estoque adequado. ✅';
  }
  if (ql.includes('colaborador') || ql.includes('equipe')) {
    const equipe = DB.get('equipe');
    const ativos = equipe.filter(e => e.status === 'Ativo');
    return `A equipe possui <strong>${equipe.length} colaboradores</strong>, sendo <strong>${ativos.length} ativos</strong>. Funções: ${[...new Set(ativos.map(e => e.funcao))].join(', ')}.`;
  }
  if (ql.includes('resumo') || ql.includes('financeiro')) {
    const ent = fin.filter(f => f.tipo === 'entrada' && f.status === 'Pago').reduce((s,f) => s+f.valor, 0);
    const sai = fin.filter(f => f.tipo === 'saida' && f.status === 'Pago').reduce((s,f) => s+f.valor, 0);
    return `<strong>Resumo Financeiro:</strong><br>• Entradas: ${FormatService.currency(ent)}<br>• Saídas: ${FormatService.currency(sai)}<br>• Saldo: ${FormatService.currency(ent-sai)}<br>• Obras ativas: ${obras.filter(o=>['Em Andamento','Concluindo'].includes(o.status)).length}`;
  }
  return `Entendi sua pergunta: "${q}". Em modo demonstrativo, posso responder perguntas sobre obras atrasadas, gastos, lucros, contratos vencendo, materiais em falta e equipe. Configure uma chave de API OpenAI para respostas completas.`;
}

