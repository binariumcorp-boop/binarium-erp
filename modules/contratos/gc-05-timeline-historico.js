// ============================================================
// gc-05-timeline-historico.js
// GESTÃO CONTRATUAL — Linha do Tempo + Histórico
//
// Histórico: reaproveita o ActivityLog que TODOS os módulos do sistema
// já usam (services/activity-log.js) — não criamos um log paralelo.
// Como o ActivityLog original não guarda o id do registro (só o texto
// do "detalhe"), filtramos pelo número do contrato dentro do detalhe,
// que é exatamente o que aditivos.js, gc-01, gc-02, gc-03 e gc-04 já
// gravam em todo ActivityLog.add(...) relacionado a este contrato.
//
// Linha do Tempo: é derivada 100% dos dados já existentes (contrato +
// aditivos + medições) — não é uma entidade própria, então "nenhuma
// informação pode ser perdida" (ela é sempre recalculada a partir da
// fonte da verdade).
// ============================================================

'use strict';

function gcMontarLinhaDoTempo(contratoId) {
  const c = DB.find('contratos', contratoId);
  if (!c) return [];
  const eventos = [];

  eventos.push({
    data: c.gcDataAssinatura || c.inicio || c.createdAt,
    titulo: 'Contrato Original',
    descricao: `${c.numero} assinado${c.gcResponsavel ? ' · responsável: ' + c.gcResponsavel : ''}`,
    responsavel: c.gcResponsavel || '-',
    documento: c.gcAnexos && c.gcAnexos.pdfContrato ? c.gcAnexos.pdfContrato.nome : null,
    icone: '📝'
  });

  (DB.get('aditivos') || []).filter(a => a.contratoId === contratoId)
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .forEach(a => {
      eventos.push({
        data: a.data,
        titulo: a.numero || 'Aditivo',
        descricao: `${a.tipo}${a.gcValorAditivo ? ' · ' + FormatService.currency(a.gcValorAditivo) : ''}${a.gcDiasAdicionados ? ' · +' + a.gcDiasAdicionados + ' dias' : ''}`,
        responsavel: a.responsavel || '-',
        documento: a.documento ? a.documento.nome : null,
        icone: '📑'
      });
    });

  gcObterMedicoesDoContrato(contratoId).slice().reverse().forEach(m => {
    eventos.push({
      data: m.data,
      titulo: `Medição ${m.numero}`,
      descricao: `${FormatService.currency(m.valor)} (${(m.percentual||0).toFixed(1)}%) · ${m.status}`,
      responsavel: m.responsavel || '-',
      documento: m.documento ? m.documento.nome : null,
      icone: '📏'
    });
  });

  if (c.status === 'Encerrado') {
    eventos.push({
      data: c.updatedAt,
      titulo: 'Encerramento',
      descricao: 'Contrato encerrado.',
      responsavel: '-', documento: null, icone: '🏁'
    });
  }

  return eventos
    .filter(e => e.data)
    .sort((a, b) => new Date(a.data) - new Date(b.data));
}

function gcRenderHistoricoTab(contratoId) {
  const el = document.getElementById('gc-subtab-body');
  if (!el) return;
  const c = DB.find('contratos', contratoId);
  if (!c) return;

  const timeline = gcMontarLinhaDoTempo(contratoId);
  const timelineHtml = `
    <div style="font-size:12px;font-weight:700;margin-bottom:10px">Linha do Tempo</div>
    <div style="position:relative;padding-left:18px;margin-bottom:20px">
      <div style="position:absolute;left:5px;top:4px;bottom:4px;width:2px;background:var(--gray100)"></div>
      ${timeline.map(ev => `
        <div style="position:relative;margin-bottom:14px">
          <div style="position:absolute;left:-18px;top:2px;width:12px;height:12px;border-radius:50%;background:var(--blue);border:2px solid var(--surface)"></div>
          <div style="font-size:11px;color:var(--gray400)">${FormatService.date(ev.data)} ${ev.icone}</div>
          <div style="font-size:12px;font-weight:600">${ev.titulo}</div>
          <div style="font-size:11px;color:var(--gray400)">${ev.descricao}</div>
          <div style="font-size:10px;color:var(--gray400)">Responsável: ${ev.responsavel}${ev.documento ? ' · 📎 ' + ev.documento : ''}</div>
        </div>`).join('')}
    </div>`;

  // Histórico automático (quem criou/alterou, data/hora, o que mudou) —
  // reaproveita ActivityLog.get(), sem duplicar a lógica de log.
  const logs = (typeof ActivityLog !== 'undefined' ? ActivityLog.get() : [])
    .filter(l => l.modulo === 'Contratos' && (l.registro || '').includes(c.numero));

  const historicoHtml = `
    <div style="font-size:12px;font-weight:700;margin-bottom:10px">Histórico de Alterações (${logs.length})</div>
    ${logs.length === 0 ? `<div style="color:var(--gray400);font-size:12px;text-align:center;padding:12px">Nenhum registro de alteração ainda.</div>` : logs.map(l => `
      <div style="padding:8px 0;border-bottom:1px solid var(--gray100);font-size:11px">
        <div style="font-weight:600">${l.acao}</div>
        <div style="color:var(--gray400)">${l.registro}</div>
        <div style="color:var(--gray400)">${l.usuario || 'Sistema'} · ${FormatService.date(l.data)} ${l.hora || ''}</div>
      </div>`).join('')}`;

  el.innerHTML = timelineHtml + historicoHtml;
}
