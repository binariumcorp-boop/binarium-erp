// ============================================================
// assinatura.js
// MINHA ASSINATURA - tela do cliente
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== MINHA ASSINATURA — tela do cliente (Etapa 5 / Asaas) =====
// Segue exatamente o mesmo padrão usado para "Central de IA", "Compras"
// e "Log de Atividades": injeta o item de menu e a página dinamicamente,
// sem tocar no HTML estático das telas originais.
function initMinhaAssinatura() {
  if (!CLOUD_CONFIG.ATIVADO) return; // sem nuvem configurada, não há assinatura pra mostrar
  if (document.querySelector('[data-page="assinatura"]')) return;
  const cfgItem = document.querySelector('.nav-item[data-page="configuracoes"]');
  if (!cfgItem) return;

  const item = document.createElement('div');
  item.className = 'nav-item';
  item.dataset.page = 'assinatura';
  item.onclick = () => goTo('assinatura');
  item.innerHTML = `<svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" stroke-width="2"/><line x1="1" y1="10" x2="23" y2="10" stroke-width="2"/></svg><span>Minha Assinatura</span>`;
  cfgItem.parentElement.insertBefore(item, cfgItem);
  PAGE_TITLES['assinatura'] = 'Minha Assinatura';

  const content = document.getElementById('content');
  const page = document.createElement('div');
  page.className = 'page';
  page.id = 'page-assinatura';
  page.innerHTML = `<div id="assinatura-conteudo" style="padding:4px"><p style="color:var(--gray400);font-size:13px">Carregando dados da assinatura…</p></div>`;
  content.appendChild(page);
}

const ASSINATURA_STATUS_LABEL = {
  proposta: ['Proposta enviada', 'badge-gray'],
  aguardando_aprovacao: ['Aguardando aprovação', 'badge-amber'],
  aguardando_pagamento: ['Aguardando pagamento', 'badge-amber'],
  pagamento_aprovado: ['Pagamento aprovado', 'badge-green'],
  implantacao_em_andamento: ['Implantação em andamento', 'badge-amber'],
  ativa: ['Ativa', 'badge-green'],
  recusada: ['Recusada', 'badge-red'],
  cancelada: ['Cancelada', 'badge-red']
};
const COBRANCA_STATUS_LABEL = {
  pendente: ['Pendente', 'badge-amber'], pago: ['Pago', 'badge-green'],
  atrasado: ['Atrasado', 'badge-red'], estornado: ['Estornado', 'badge-gray'],
  cancelado: ['Cancelado', 'badge-gray']
};

async function renderMinhaAssinatura() {
  const el = document.getElementById('assinatura-conteudo');
  if (!el) return;
  if (!CloudSync.client || !CloudSync.empresaId) {
    el.innerHTML = `<p style="color:var(--gray400);font-size:13px">Não foi possível conectar ao servidor de assinaturas. Tente novamente mais tarde.</p>`;
    return;
  }

  const [{ data: assinatura }, { data: planos }, { data: cobrancas }] = await Promise.all([
    CloudSync.client.from('assinaturas').select('*, planos(nome, valor_mensal, modulos)')
      .eq('empresa_id', CloudSync.empresaId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    CloudSync.client.from('planos').select('*').eq('ativo', true).order('ordem'),
    CloudSync.client.from('cobrancas').select('*').eq('empresa_id', CloudSync.empresaId)
      .order('vencimento', { ascending: false }).limit(12)
  ]);

  const statusInfo = assinatura ? (ASSINATURA_STATUS_LABEL[assinatura.status] || [assinatura.status, 'badge-gray']) : null;

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <div><h2 style="font-size:22px;font-weight:700">Minha Assinatura</h2><p style="font-size:13px;color:var(--gray400)">Plano contratado, cobranças e opções disponíveis</p></div>
    </div>

    <div class="card" style="padding:20px;margin-bottom:20px">
      ${assinatura ? `
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
          <div>
            <div style="font-size:13px;color:var(--gray400)">Plano atual</div>
            <div style="font-size:20px;font-weight:700">${(assinatura.planos && assinatura.planos.nome) || '—'}</div>
            <div style="font-size:13px;color:var(--gray400);margin-top:2px">${assinatura.periodicidade === 'anual' ? 'Cobrança anual' : 'Cobrança mensal'} · Próximo vencimento: ${FormatService.date(assinatura.proximo_vencimento)}</div>
          </div>
          <div style="text-align:right">
            <span class="badge ${statusInfo[1]}">${statusInfo[0]}</span>
            <div style="font-size:20px;font-weight:700;margin-top:6px">${FormatService.currency(assinatura.valor_mensalidade || 0)}<span style="font-size:12px;font-weight:400;color:var(--gray400)">/mês</span></div>
          </div>
        </div>
        ${assinatura.planos && Array.isArray(assinatura.planos.modulos) ? `
          <div style="margin-top:16px;display:flex;flex-wrap:wrap;gap:6px">
            ${assinatura.planos.modulos.map(m => `<span class="badge badge-gray">${m}</span>`).join('')}
          </div>` : ''}
      ` : `<p style="font-size:13px;color:var(--gray400)">Nenhuma assinatura encontrada para esta empresa ainda.</p>`}
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <h3 style="font-size:15px;font-weight:600">Planos disponíveis</h3>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:24px">
      ${(planos || []).map(p => `
        <div class="card" style="padding:16px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-weight:700">${p.nome}</div>
            ${p.selo ? `<span class="badge badge-green">${p.selo}</span>` : ''}
          </div>
          <div style="font-size:22px;font-weight:700;margin:8px 0">${FormatService.currency(p.valor_mensal)}<span style="font-size:12px;font-weight:400;color:var(--gray400)">/mês</span></div>
          <div style="font-size:12px;color:var(--gray400);margin-bottom:12px">Implantação: ${FormatService.currency(p.valor_implantacao)}</div>
          <button class="btn btn-secondary btn-sm" style="width:100%" ${assinatura && assinatura.plano_id === p.id ? 'disabled' : ''}
            onclick="solicitarMudancaPlano('${p.id}', '${p.nome.replace(/'/g, "\\'")}')">
            ${assinatura && assinatura.plano_id === p.id ? 'Plano atual' : 'Solicitar este plano'}
          </button>
        </div>
      `).join('') || '<p style="font-size:13px;color:var(--gray400)">Nenhum plano disponível no momento.</p>'}
    </div>

    <h3 style="font-size:15px;font-weight:600;margin-bottom:10px">Histórico de cobranças</h3>
    <div class="table-wrap">
      <table>
        <tr><th>Descrição</th><th>Vencimento</th><th>Valor</th><th>Status</th><th></th></tr>
        <tbody>
          ${(cobrancas && cobrancas.length) ? cobrancas.map(c => {
            const cs = COBRANCA_STATUS_LABEL[c.status] || [c.status, 'badge-gray'];
            return `<tr>
              <td style="font-size:12px">${c.descricao || '—'}</td>
              <td style="font-size:12px">${FormatService.date(c.vencimento)}</td>
              <td style="font-size:12px;font-weight:600">${FormatService.currency(c.valor)}</td>
              <td><span class="badge ${cs[1]}">${cs[0]}</span></td>
              <td>${c.url_boleto ? `<a href="${c.url_boleto}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">Ver boleto</a>` : ''}</td>
            </tr>`;
          }).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--gray400);padding:12px">Nenhuma cobrança registrada ainda.</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}

// O cliente só pode CRIAR uma proposta ('proposta'/'aguardando_aprovacao');
// quem aprova de fato e dispara a cobrança no Asaas é o admin MB (RLS
// garante isso no banco — ver 01_schema_planos_assinaturas.sql).
async function solicitarMudancaPlano(planoId, nomePlano) {
  confirmAction(
    `Solicitar mudança para o plano ${nomePlano}?`,
    'Um consultor da MB Soluções vai confirmar valores e prazos antes de qualquer cobrança.',
    async () => {
      const { error } = await CloudSync.client.from('assinaturas').insert({
        empresa_id: CloudSync.empresaId,
        plano_id: planoId,
        periodicidade: 'mensal',
        status: 'aguardando_aprovacao'
      });
      if (error) { showToast('Não foi possível enviar a solicitação. Tente novamente.', 'error'); return; }
      showToast('Solicitação enviada! Nossa equipe vai entrar em contato.', 'success');
      renderMinhaAssinatura();
    }
  );
}
