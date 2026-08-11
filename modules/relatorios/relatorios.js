// ============================================================
// relatorios.js
// RELATORIOS
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== RELATÓRIOS =====
function renderRelatorios() {
  populateSelect('rel-obra', DB.get('obras'), 'id', 'nome', 'Todas as Obras');
}

function gerarRelatorio(tipo) {
  const obras = DB.get('obras');
  const financeiro = DB.get('financeiro');
  const equipe = DB.get('equipe');
  const estoque = DB.get('estoque');
  const contratos = DB.get('contratos');
  const diario = DB.get('diario');

  let html = '';
  const now = new Date().toLocaleDateString('pt-BR');
  const cfg = DB.getConfig();
  const empresa = cfg.empresa || {};

  const header = `<div style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #1a56db;padding-bottom:16px;margin-bottom:24px">
      <div><h1 style="color:#1a56db;font-size:22px;margin:0">${empresa.nome||'MB SOLUÇÕES'}</h1><p style="color:#666;font-size:12px;margin:4px 0">${empresa.slogan||'Serralheria e Funilaria'}</p></div>
      <div style="text-align:right;font-size:12px;color:#666"><div>Gerado em: ${now}</div></div>
    </div>`;

  switch(tipo) {
    case 'financeiro':
      const entradas = financeiro.filter(f => f.tipo==='entrada' && f.status==='Pago').reduce((s,f)=>s+f.valor,0);
      const saidas = financeiro.filter(f => f.tipo==='saida' && f.status==='Pago').reduce((s,f)=>s+f.valor,0);
      html = header + `<h2 style="color:#1f2937">Relatório Financeiro</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:24px">
          <div style="background:#d1fae5;padding:16px;border-radius:8px"><div style="font-size:11px;color:#065f46">ENTRADAS</div><div style="font-size:20px;font-weight:700;color:#065f46">${FormatService.currency(entradas)}</div></div>
          <div style="background:#fee2e2;padding:16px;border-radius:8px"><div style="font-size:11px;color:#991b1b">SAÍDAS</div><div style="font-size:20px;font-weight:700;color:#991b1b">${FormatService.currency(saidas)}</div></div>
          <div style="background:#dbeafe;padding:16px;border-radius:8px"><div style="font-size:11px;color:#1e40af">SALDO</div><div style="font-size:20px;font-weight:700;color:#1e40af">${FormatService.currency(entradas-saidas)}</div></div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <tr style="background:#f3f4f6"><th style="padding:8px;text-align:left">Data</th><th style="padding:8px;text-align:left">Descrição</th><th style="padding:8px;text-align:left">Tipo</th><th style="padding:8px;text-align:right">Valor</th><th style="padding:8px;text-align:left">Status</th></tr>
          ${financeiro.map(f=>`<tr style="border-bottom:1px solid #e5e7eb"><td style="padding:8px">${FormatService.date(f.data)}</td><td style="padding:8px">${f.descricao}</td><td style="padding:8px">${f.tipo}</td><td style="padding:8px;text-align:right;color:${f.tipo==='entrada'?'#059669':'#dc2626'}">${FormatService.currency(f.valor)}</td><td style="padding:8px">${f.status}</td></tr>`).join('')}
        </table></div>`;
      break;
    case 'obras':
      html = header + `<h2 style="color:#1f2937">Relatório de Obras</h2>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <tr style="background:#f3f4f6"><th style="padding:8px;text-align:left">Obra</th><th style="padding:8px;text-align:left">Município</th><th style="padding:8px;text-align:left">Status</th><th style="padding:8px;text-align:right">Progresso</th><th style="padding:8px;text-align:right">Valor</th><th style="padding:8px;text-align:left">Término</th></tr>
          ${obras.map(o=>`<tr style="border-bottom:1px solid #e5e7eb"><td style="padding:8px;font-weight:600">${o.nome}</td><td style="padding:8px">${o.municipio}</td><td style="padding:8px">${o.status}</td><td style="padding:8px;text-align:right">${o.progresso}%</td><td style="padding:8px;text-align:right">${FormatService.currency(o.valor)}</td><td style="padding:8px">${FormatService.date(o.termino)}</td></tr>`).join('')}
        </table></div>`;
      break;
    case 'equipe':
      html = header + `<h2 style="color:#1f2937">Relatório de Equipe</h2>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <tr style="background:#f3f4f6"><th style="padding:8px;text-align:left">Nome</th><th style="padding:8px;text-align:left">Função</th><th style="padding:8px;text-align:left">CPF</th><th style="padding:8px;text-align:left">Obra</th><th style="padding:8px;text-align:left">Status</th><th style="padding:8px;text-align:left">Admissão</th></tr>
          ${equipe.map(e=>`<tr style="border-bottom:1px solid #e5e7eb"><td style="padding:8px;font-weight:600">${e.nome}</td><td style="padding:8px">${e.funcao}</td><td style="padding:8px">${e.cpf}</td><td style="padding:8px">${e.obraNome||'-'}</td><td style="padding:8px">${e.status}</td><td style="padding:8px">${FormatService.date(e.admissao)}</td></tr>`).join('')}
        </table></div>`;
      break;
    case 'estoque':
      html = header + `<h2 style="color:#1f2937">Relatório de Estoque</h2>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <tr style="background:#f3f4f6"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:left">Categoria</th><th style="padding:8px;text-align:right">Qtd.</th><th style="padding:8px;text-align:right">Mínimo</th><th style="padding:8px;text-align:right">Valor Unit.</th><th style="padding:8px;text-align:right">Total</th><th style="padding:8px;text-align:left">Nível</th></tr>
          ${estoque.map(e=>{const nivel=e.qtd===0?'Crítico':e.qtd<=e.minimo?'Baixo':'Normal';return`<tr style="border-bottom:1px solid #e5e7eb"><td style="padding:8px;font-weight:600">${e.nome}</td><td style="padding:8px">${e.categoria}</td><td style="padding:8px;text-align:right">${e.qtd} ${e.unidade}</td><td style="padding:8px;text-align:right">${e.minimo}</td><td style="padding:8px;text-align:right">${FormatService.currency(e.valorUnit)}</td><td style="padding:8px;text-align:right">${FormatService.currency(e.qtd*e.valorUnit)}</td><td style="padding:8px;color:${nivel==='Crítico'?'#dc2626':nivel==='Baixo'?'#d97706':'#059669'}">${nivel}</td></tr>`;}).join('')}
        </table></div>`;
      break;
    case 'contratos':
      html = header + `<h2 style="color:#1f2937">Relatório de Contratos</h2>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <tr style="background:#f3f4f6"><th style="padding:8px;text-align:left">Contrato</th><th style="padding:8px;text-align:left">Fornecedor</th><th style="padding:8px;text-align:right">Valor</th><th style="padding:8px;text-align:right">Executado</th><th style="padding:8px;text-align:right">Saldo</th><th style="padding:8px;text-align:left">Status</th><th style="padding:8px;text-align:left">Término</th></tr>
          ${contratos.map(c=>`<tr style="border-bottom:1px solid #e5e7eb"><td style="padding:8px;font-weight:600">${c.numero}</td><td style="padding:8px">${c.fornecedor}</td><td style="padding:8px;text-align:right">${FormatService.currency(c.valor)}</td><td style="padding:8px;text-align:right">${FormatService.currency(c.valorExecutado||0)}</td><td style="padding:8px;text-align:right">${FormatService.currency((c.valor||0)-(c.valorExecutado||0))}</td><td style="padding:8px">${c.status}</td><td style="padding:8px">${FormatService.date(c.termino)}</td></tr>`).join('')}
        </table></div>`;
      break;
    case 'diario':
      html = header + `<h2 style="color:#1f2937">Diário de Obra</h2>
        ${[...diario].sort((a,b)=>(b.data||'').localeCompare(a.data||'')).map(d=>`<div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px"><strong>${d.titulo}</strong><span style="color:#666;font-size:12px">${FormatService.date(d.data)}</span></div>
          <div style="font-size:12px;color:#666;margin-bottom:8px">${d.obraNome} | ${d.tipo} | ${d.clima||''}</div>
          <div style="font-size:13px">${d.descricao||''}</div>
        </div>`).join('')}</div>`;
      break;
  }

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório – MB Soluções</title><style>@media print{body{margin:0}}</style></head><body>${html}<script>window.print();<\/script></body></html>`);
  win.document.close();
  showToast('Relatório gerado! Use Ctrl+P para salvar como PDF.', 'success');
}

function gerarRelatorioPersonalizado() {
  const tipo = document.getElementById('rel-tipo').value;
  gerarRelatorio(tipo);
}

