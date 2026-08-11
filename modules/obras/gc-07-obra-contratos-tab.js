// ============================================================
// gc-07-obra-contratos-tab.js
// GESTÃO CONTRATUAL — Aba "Contratos" dentro do Painel da Obra
//
// Requisito do usuário: "Dentro de cada Obra deverá existir apenas uma
// aba chamada 'Contratos', exibindo automaticamente somente os
// contratos vinculados àquela obra" e "sem criar um novo cadastro e
// sem duplicação de dados".
//
// Por isso esta aba SÓ FILTRA E EXIBE os mesmos registros de
// DB.get('contratos') que o módulo principal usa — reaproveita
// showContratoDetail (já estendido por aditivos.js + gc-06) para abrir
// o mesmo painel de detalhes, com os mesmos dados, botões e abas.
//
// Não editamos obra-painel-completo.js: envolvemos
// ensurePainelObraModal (para acrescentar o botão da aba, uma única
// vez) e switchPainelObraTab (para atender a nova aba 'contratos' e
// delegar todas as outras exatamente como antes).
// ============================================================

'use strict';

const gcEnsurePainelObraModalAnterior = ensurePainelObraModal;
window.ensurePainelObraModal = function () {
  const jaExistia = !!document.getElementById('modal-painel-obra');
  gcEnsurePainelObraModalAnterior();
  const tabs = document.getElementById('po-tabs');
  if (tabs && !document.getElementById('po-tab-contratos')) {
    tabs.insertAdjacentHTML('beforeend', `<div class="tab" id="po-tab-contratos" onclick="switchPainelObraTab('contratos',this)">Contratos</div>`);
  }
};

const gcSwitchPainelObraTabAnterior = switchPainelObraTab;
window.switchPainelObraTab = function (tab, el) {
  if (tab !== 'contratos') {
    gcSwitchPainelObraTabAnterior(tab, el);
    return;
  }

  painelObraAbaAtual = 'contratos';
  document.querySelectorAll('#po-tabs .tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  else { const t = document.getElementById('po-tab-contratos'); if (t) t.classList.add('active'); }

  const obraId = parseInt(document.getElementById('po-obra-id').value);
  const o = DB.find('obras', obraId);
  const body = document.getElementById('po-body');
  if (!o) return;

  const contratosDaObra = DB.get('contratos').filter(c => String(c.obraId) === String(o.id));
  const valorTotal = contratosDaObra.reduce((s, c) => s + (c.valor || 0), 0);
  const valorAditivadoTotal = contratosDaObra.reduce((s, c) => s + gcImpactoAditivos(c.id, (typeof c.gcValorOriginal === 'number') ? c.gcValorOriginal : c.valor).valorAditivado, 0);

  body.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div style="font-size:13px;color:var(--gray400)">${contratosDaObra.length} contrato(s) · Valor total ${FormatService.currency(valorTotal)}${valorAditivadoTotal ? ' · Aditivado ' + FormatService.currency(valorAditivadoTotal) : ''}</div>
      <button class="btn btn-primary btn-sm" onclick="gcNovoContratoParaObra(${o.id})">+ Novo Contrato</button>
    </div>
    <div class="card" style="padding:0">
      <div class="table-wrap">
        <table>
          <tr><th>Contrato</th><th>Valor (R$)</th><th>Status</th><th>Término</th><th></th></tr>
          <tbody>
            ${contratosDaObra.length === 0 ? `<tr><td colspan="5" style="text-align:center;color:var(--gray400);padding:20px">Nenhum contrato vinculado a esta obra.</td></tr>` : contratosDaObra.map(c => `
              <tr style="cursor:pointer" onclick="gcAbrirContratoNoPainelObra(${c.id})">
                <td><div style="font-weight:600;font-size:12px">${c.numero}</div><div style="font-size:10px;color:var(--gray400)">${c.gcTipoContrato || c.categoria || ''}</div></td>
                <td style="font-weight:600;font-size:12px">${FormatService.currency(c.valor)}</td>
                <td><span class="badge ${badgeClass(c.status)}">${c.status}</span></td>
                <td style="font-size:11px">${FormatService.date(c.termino)}</td>
                <td><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();gcAbrirContratoNoPainelObra(${c.id})">Ver detalhes →</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
};

// Requisito do usuário: "Ao abrir um contrato pela Obra, devo visualizar
// EXATAMENTE o mesmo contrato existente no módulo principal, sem criar
// um novo cadastro e sem duplicação de dados." A forma mais segura de
// garantir isso — sem duplicar o painel de detalhes (e sem duplicar
// ids no DOM, o que quebraria showContratoDetail) — é abrir o MESMO
// painel que o módulo principal usa: fechamos o modal da Obra e
// levamos o usuário até lá, já com o contrato certo selecionado.
function gcAbrirContratoNoPainelObra(contratoId) {
  closeModal();
  goTo('contratos');
  setTimeout(() => showContratoDetail(contratoId), 50);
}

// Mesma ideia para "+ Novo Contrato": abre o formulário oficial (o
// mesmo de sempre, com os campos de Gestão Contratual já injetados por
// gc-01-contrato-form.js), só que com a Obra já pré-selecionada.
function gcNovoContratoParaObra(obraId) {
  closeModal();
  goTo('contratos');
  setTimeout(() => {
    openModal('novo-contrato');
    const sel = document.getElementById('ct-obra');
    if (sel) sel.value = obraId;
  }, 50);
}
