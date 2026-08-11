// ============================================================
// gc-06-detalhe-tabs.js
// GESTÃO CONTRATUAL — Monta a aba "Contrato Principal" (KPIs pedidos:
// valor contratado/aditivado/executado, saldo, prazo restante, %
// executado) e o strip de sub-abas (Medições / Documentos /
// Histórico) dentro do MESMO painel de detalhes que aditivos.js já usa.
//
// Não redefine showContratoDetail do zero: guarda a versão que
// aditivos.js já deixou em window.showContratoDetail e SÓ ACRESCENTA
// conteúdo depois (nunca substitui o innerHTML que aditivos.js gerou —
// a lista de Aditivos continua exatamente onde estava).
// ============================================================

'use strict';

let gcAbaAtual = 'medicoes';

function gcRenderResumoKPIs(c) {
  const valorOriginal = (typeof c.gcValorOriginal === 'number') ? c.gcValorOriginal : c.valor;
  const impacto = gcImpactoAditivos(c.id, valorOriginal);
  const saldo = (c.valor || 0) - (c.valorExecutado || 0);
  const execPct = c.valor > 0 ? Math.round((c.valorExecutado || 0) / c.valor * 100) : 0;
  const hoje = new Date();
  const prazoRestante = c.termino ? Math.round((new Date(c.termino) - hoje) / 86400000) : null;

  return `
    <div style="margin:14px 0;padding:12px;background:var(--gray50);border-radius:10px">
      <div style="font-size:11px;font-weight:700;color:var(--gray400);text-transform:uppercase;margin-bottom:8px">Impacto Financeiro dos Aditivos</div>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="color:var(--gray400)">Valor Contratado:</span><span style="font-weight:600">${FormatService.currency(impacto.valorOriginal)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="color:var(--gray400)">Valor dos Aditivos:</span><span style="font-weight:600;color:${impacto.valorAditivado<0?'var(--red)':'var(--amber)'}">${impacto.valorAditivado>=0?'+ ':''}${FormatService.currency(impacto.valorAditivado)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--gray400)">Percentual de Aditivos:</span><span style="font-weight:700">${impacto.percentual.toFixed(1)}%</span></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px;font-size:12px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between"><span style="color:var(--gray400)">Valor Executado:</span><span style="font-weight:600">${FormatService.currency(c.valorExecutado||0)} (${execPct}%)</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--gray400)">Saldo do Contrato:</span><span style="font-weight:600">${FormatService.currency(saldo)}</span></div>
      ${prazoRestante !== null ? `<div style="display:flex;justify-content:space-between"><span style="color:var(--gray400)">Prazo Restante:</span><span style="font-weight:600;color:${prazoRestante<0?'var(--red)':prazoRestante<30?'var(--amber)':'inherit'}">${prazoRestante<0?'Vencido há '+Math.abs(prazoRestante)+' dias':prazoRestante+' dias'}</span></div>` : ''}
    </div>
    ${(c.gcCliente || c.gcContratante || c.gcResponsavel) ? `
    <div style="font-size:11px;color:var(--gray400);margin-bottom:10px">
      ${c.gcCliente ? `Cliente: <b style="color:inherit">${c.gcCliente}</b><br>` : ''}
      ${c.gcContratante ? `Contratante: <b style="color:inherit">${c.gcContratante}</b><br>` : ''}
      ${c.gcResponsavel ? `Responsável: <b style="color:inherit">${c.gcResponsavel}</b>` : ''}
    </div>` : ''}
    <div class="tabs" id="gc-subtabs" style="margin:10px 0 8px">
      <div class="tab ${gcAbaAtual==='medicoes'?'active':''}" onclick="gcSwitchSubTab('medicoes',${c.id},this)">Medições</div>
      <div class="tab ${gcAbaAtual==='documentos'?'active':''}" onclick="gcSwitchSubTab('documentos',${c.id},this)">Documentos</div>
      <div class="tab ${gcAbaAtual==='historico'?'active':''}" onclick="gcSwitchSubTab('historico',${c.id},this)">Histórico</div>
    </div>
    <div id="gc-subtab-body"></div>`;
}

function gcSwitchSubTab(tab, contratoId, el) {
  gcAbaAtual = tab;
  document.querySelectorAll('#gc-subtabs .tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  if (tab === 'medicoes') gcRenderMedicoesTab(contratoId);
  else if (tab === 'documentos') gcRenderDocumentosTab(contratoId);
  else if (tab === 'historico') gcRenderHistoricoTab(contratoId);
}

const gcShowContratoDetailAnterior = showContratoDetail; // versão já estendida por aditivos.js
window.showContratoDetail = function (id) {
  gcShowContratoDetailAnterior(id); // renderiza Contrato Principal + Aditivos, sem alterações
  const c = DB.find('contratos', id);
  const painel = document.getElementById('contrato-detail-panel');
  if (!c || !painel) return;
  painel.insertAdjacentHTML('beforeend', gcRenderResumoKPIs(c));
  gcSwitchSubTab(gcAbaAtual, id);
};
