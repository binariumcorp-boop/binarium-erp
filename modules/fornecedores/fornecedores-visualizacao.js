// ============================================================
// fornecedores-visualizacao.js
// VISUALIZACAO DE FORNECEDOR
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== VISUALIZAÇÃO DE FORNECEDOR =====
function initModalVerFornecedor() {
  if (document.getElementById('modal-ver-fornecedor')) return;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'modal-ver-fornecedor';
  modal.innerHTML = `<div class="modal modal-lg">
    <div class="modal-header"><h3 style="font-size:16px;font-weight:600" id="ver-forn-title">Detalhes do Fornecedor</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
    <div class="modal-body" id="ver-forn-content"></div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Fechar</button>
    </div>
  </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.body.appendChild(modal);
}

function verFornecedor(id) {
  const f = obterFornecedorPorId(id);
  if (!f) { showToast('Fornecedor não encontrado.', 'error'); return; }

  const compras = (DB.KEYS.compras ? DB.get('compras') : []).filter(c => String(c.fornecedorId) === String(f.id));
  const comprasValidas = compras.filter(c => c.status !== 'Cancelada');
  const totalComprado = comprasValidas.reduce((s, c) => s + (c.total ?? c.valor ?? 0), 0);
  const totalPendente = comprasValidas.filter(c => c.status !== 'Recebida').reduce((s, c) => s + (c.total ?? c.valor ?? 0), 0);
  const hoje = new Date().toISOString().split('T')[0];
  const atrasadas = comprasValidas.filter(c => c.status !== 'Recebida' && c.dataPrevisaoEntrega && c.dataPrevisaoEntrega < hoje).length;

  const financeiro = DB.get('financeiro').filter(m => String(m.fornecedorId) === String(f.id));
  const totalPagar = financeiro.filter(m => m.tipo === 'saida' && m.status !== 'Cancelado').reduce((s, m) => s + (m.valor || 0), 0);
  const totalPago = financeiro.filter(m => m.tipo === 'saida' && m.status === 'Pago').reduce((s, m) => s + (m.valor || 0), 0);
  const totalPendenteFin = financeiro.filter(m => m.tipo === 'saida' && m.status === 'Pendente').reduce((s, m) => s + (m.valor || 0), 0);
  const totalVencido = financeiro.filter(m => m.tipo === 'saida' && m.status === 'Pendente' && m.data && m.data < hoje).reduce((s, m) => s + (m.valor || 0), 0);

  const obrasAtendidas = Array.from(new Set(compras.map(c => c.obraNome).filter(Boolean)));

  document.getElementById('ver-forn-title').textContent = 'Detalhes – ' + (f.fantasia || f.razao);
  document.getElementById('ver-forn-content').innerHTML = `
    <div class="form-row">
      <div><div style="font-size:11px;color:var(--gray400)">Razão Social</div><div style="font-size:13px;font-weight:600">${f.razao || '-'}</div></div>
      <div><div style="font-size:11px;color:var(--gray400)">Nome Fantasia</div><div style="font-size:13px;font-weight:600">${f.fantasia || '-'}</div></div>
    </div>
    <div class="form-row" style="margin-top:10px">
      <div><div style="font-size:11px;color:var(--gray400)">CNPJ / CPF</div><div style="font-size:13px">${f.cnpj || f.cpf || '-'}</div></div>
      <div><div style="font-size:11px;color:var(--gray400)">Categoria</div><div style="font-size:13px">${f.categoria || '-'}</div></div>
    </div>
    <div class="form-row" style="margin-top:10px">
      <div><div style="font-size:11px;color:var(--gray400)">Contato</div><div style="font-size:13px">${f.contato || '-'}</div></div>
      <div><div style="font-size:11px;color:var(--gray400)">Telefone / WhatsApp</div><div style="font-size:13px">${f.tel || '-'} ${f.whatsapp ? '• ' + f.whatsapp : ''}</div></div>
    </div>
    <div class="form-row" style="margin-top:10px">
      <div><div style="font-size:11px;color:var(--gray400)">E-mail</div><div style="font-size:13px">${f.email || '-'}</div></div>
      <div><div style="font-size:11px;color:var(--gray400)">Cidade/Estado</div><div style="font-size:13px">${[f.cidade, f.estado].filter(Boolean).join(' – ') || '-'}</div></div>
    </div>
    <div class="form-row" style="margin-top:10px">
      <div><div style="font-size:11px;color:var(--gray400)">Condição de Pagamento</div><div style="font-size:13px">${f.condicaoPagamento || '-'}</div></div>
      <div><div style="font-size:11px;color:var(--gray400)">Prazo de Entrega</div><div style="font-size:13px">${f.prazoEntrega ? f.prazoEntrega + ' dia(s)' : '-'}</div></div>
    </div>
    <div class="form-row" style="margin-top:10px">
      <div><div style="font-size:11px;color:var(--gray400)">Status</div><div><span class="badge ${f.status==='Ativo'?'badge-green':'badge-red'}">${f.status}</span></div></div>
      <div><div style="font-size:11px;color:var(--gray400)">Obras Atendidas</div><div style="font-size:13px">${obrasAtendidas.join(', ') || '-'}</div></div>
    </div>
    ${f.obs ? `<div style="margin-top:10px"><div style="font-size:11px;color:var(--gray400)">Observações</div><div style="font-size:13px">${f.obs}</div></div>` : ''}

    <div style="margin-top:18px;border-top:1px solid var(--gray200);padding-top:12px">
      <div style="font-size:13px;font-weight:600;margin-bottom:8px">Resumo de Compras</div>
      <div class="form-row-3">
        <div><div style="font-size:11px;color:var(--gray400)">Total Comprado</div><div style="font-size:13px;font-weight:600">${FormatService.currency(totalComprado)}</div></div>
        <div><div style="font-size:11px;color:var(--gray400)">Pendente de Recebimento</div><div style="font-size:13px;font-weight:600;color:var(--amber)">${FormatService.currency(totalPendente)}</div></div>
        <div><div style="font-size:11px;color:var(--gray400)">Entregas Atrasadas</div><div style="font-size:13px;font-weight:600;color:${atrasadas ? 'var(--red)' : 'inherit'}">${atrasadas}</div></div>
      </div>
    </div>

    <div style="margin-top:14px">
      <div style="font-size:13px;font-weight:600;margin-bottom:8px">Resumo Financeiro</div>
      <div class="form-row-3">
        <div><div style="font-size:11px;color:var(--gray400)">Total a Pagar</div><div style="font-size:13px;font-weight:600">${FormatService.currency(totalPagar)}</div></div>
        <div><div style="font-size:11px;color:var(--gray400)">Total Pago</div><div style="font-size:13px;font-weight:600;color:var(--green)">${FormatService.currency(totalPago)}</div></div>
        <div><div style="font-size:11px;color:var(--gray400)">Pendente / Vencido</div><div style="font-size:13px;font-weight:600;color:var(--amber)">${FormatService.currency(totalPendenteFin)} ${totalVencido ? '(' + FormatService.currency(totalVencido) + ' vencido)' : ''}</div></div>
      </div>
    </div>

    <div style="margin-top:14px">
      <div style="font-size:13px;font-weight:600;margin-bottom:8px">Compras Relacionadas</div>
      <div class="table-wrap">
        <table>
          <tr><th>Compra</th><th>Obra</th><th>Data</th><th>Status</th><th>Total</th></tr>
          <tbody>
            ${compras.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:var(--gray400);padding:12px">Nenhuma compra registrada para este fornecedor.</td></tr>' :
              compras.slice().sort((a,b) => String(b.data||'').localeCompare(String(a.data||''))).map(c => `<tr>
                <td style="font-size:12px">${c.numero ? c.numero + ' – ' : ''}${c.descricao}</td>
                <td style="font-size:12px">${c.obraNome || 'Geral'}</td>
                <td style="font-size:12px">${FormatService.date(c.data)}</td>
                <td><span class="badge ${(c.status==='Aprovada'||c.status==='Recebida')?'badge-green':c.status==='Pendente'?'badge-amber':c.status==='Cancelada'?'badge-red':'badge-gray'}">${c.status}</span></td>
                <td style="font-size:12px;font-weight:600">${FormatService.currency(c.total ?? c.valor ?? 0)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  openModal('ver-fornecedor');
}

