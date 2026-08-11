// ============================================================
// rh.js
// FASE 3 (4): RH COMPLETO + CONTROLE DE PONTO
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

// 4. RH COMPLETO + CONTROLE DE PONTO
// =====================================================================
const NR_LIST = ['NR-6 (EPI)', 'NR-10 (Elétrica)', 'NR-12 (Máquinas)', 'NR-18 (Construção Civil)', 'NR-33 (Espaços Confinados)', 'NR-35 (Trabalho em Altura)'];

// Categorias de documentos pessoais/trabalhistas aceitas no upload por colaborador
const RH_DOC_CATEGORIAS = ['RG', 'CPF', 'Carteira de Trabalho (CTPS)', 'Comprovante de Residência', 'Título de Eleitor', 'Certificado de Reservista', 'Certidão de Nascimento/Casamento', 'Comprovante de Escolaridade', 'Foto 3x4', 'Exame Admissional (ASO)', 'Contrato de Trabalho Assinado', 'Ficha de Registro', 'Termo de EPI', 'Comprovante de Dados Bancários', 'Outros'];

// Etapas padrão do processo admissional (controle/checklist por colaborador)
const RH_ADMISSAO_ETAPAS = [
  { id: 'documentos', nome: 'Documentação pessoal recebida', desc: 'RG, CPF, CTPS, comprovante de residência etc.' },
  { id: 'exame', nome: 'Exame Admissional (ASO)', desc: 'Realizado e com resultado Apto' },
  { id: 'contrato', nome: 'Contrato de trabalho assinado', desc: 'Assinatura do colaborador e da empresa' },
  { id: 'esocial', nome: 'Cadastro no eSocial / FGTS', desc: 'Admissão registrada nos sistemas do governo' },
  { id: 'epi', nome: 'EPIs entregues e termo assinado', desc: 'Entrega de equipamentos de proteção individual' },
  { id: 'treinamento', nome: 'Treinamento/Integração (NRs)', desc: 'Integração de segurança do trabalho concluída' },
  { id: 'uniforme', nome: 'Uniforme e crachá entregues', desc: 'Identificação e vestuário da empresa' },
  { id: 'obra', nome: 'Alocado na obra/equipe', desc: 'Colaborador direcionado para o local de trabalho' }
];

function ensurePainelRHModal() {
  if (document.getElementById('modal-painel-rh')) return;
  const div = document.createElement('div');
  div.className = 'modal-overlay';
  div.id = 'modal-painel-rh';
  div.addEventListener('click', e => { if (e.target === div) closeModal(); });
  div.innerHTML = `
    <div class="modal" style="max-width:900px;width:96%;max-height:90vh;display:flex;flex-direction:column">
      <div class="modal-header" style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="av">${''}</div>
            <h3 id="rh-title" style="font-size:17px;font-weight:700"></h3>
          </div>
          <div id="rh-sub" style="font-size:12px;color:var(--gray400);margin-top:2px"></div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button>
      </div>
      <input type="hidden" id="rh-colab-id">
      <div class="tabs" id="rh-tabs" style="padding:0 4px;margin-top:10px">
        <div class="tab active" onclick="switchPainelRHTab('dados',this)">Dados</div>
        <div class="tab" onclick="switchPainelRHTab('admissao',this)">Admissão</div>
        <div class="tab" onclick="switchPainelRHTab('documentos',this)">Documentos</div>
        <div class="tab" onclick="switchPainelRHTab('aso',this)">ASO</div>
        <div class="tab" onclick="switchPainelRHTab('treinamentos',this)">Treinamentos / NRs</div>
        <div class="tab" onclick="switchPainelRHTab('ferias',this)">Férias</div>
        <div class="tab" onclick="switchPainelRHTab('ponto',this)">Ponto</div>
      </div>
      <div id="rh-body" style="overflow-y:auto;padding:16px 4px;flex:1"></div>
    </div>`;
  document.body.appendChild(div);
}

function abrirPainelRH(id) {
  const e = DB.find('equipe', id);
  if (!e) return;
  ensurePainelRHModal();
  document.getElementById('rh-title').textContent = e.nome;
  document.getElementById('rh-sub').textContent = `${e.funcao} · ${e.obraNome || 'Sem obra'} · ${e.status}`;
  document.getElementById('rh-colab-id').value = e.id;
  switchPainelRHTab('dados');
  openModal('painel-rh');
}

function switchPainelRHTab(tab, el) {
  document.querySelectorAll('#rh-tabs .tab').forEach(t => t.classList.remove('active'));
  const idx = ['dados','admissao','documentos','aso','treinamentos','ferias','ponto'].indexOf(tab);
  if (el) el.classList.add('active');
  else { const t = document.querySelectorAll('#rh-tabs .tab')[idx]; if (t) t.classList.add('active'); }
  const colabId = parseInt(document.getElementById('rh-colab-id').value);
  const e = DB.find('equipe', colabId);
  const body = document.getElementById('rh-body');
  if (!e) return;

  if (tab === 'dados') {
    body.innerHTML = `
      <div class="card">
        <div class="section-title mb-16">Dados Cadastrais</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
          <div><span style="color:var(--gray400)">CPF:</span> ${e.cpf}</div>
          <div><span style="color:var(--gray400)">Função:</span> ${e.funcao}</div>
          <div><span style="color:var(--gray400)">Telefone:</span> ${e.telefone||'-'}</div>
          <div><span style="color:var(--gray400)">Admissão:</span> ${FormatService.date(e.admissao)}</div>
          <div><span style="color:var(--gray400)">Obra:</span> ${e.obraNome||'-'}</div>
          <div><span style="color:var(--gray400)">Salário:</span> ${FormatService.currency(e.salario||0)}</div>
          <div style="grid-column:1/3"><span style="color:var(--gray400)">Observações:</span> ${e.obs||'-'}</div>
        </div>
      </div>`;
  } else if (tab === 'admissao') {
    const registros = (DB.get('rhAdmissao') || []).filter(a => a.colabId === colabId);
    const total = RH_ADMISSAO_ETAPAS.length;
    const concluidas = RH_ADMISSAO_ETAPAS.filter(et => {
      const r = registros.find(x => x.etapa === et.id);
      return r && r.concluida;
    }).length;
    const pct = Math.round((concluidas / total) * 100);
    body.innerHTML = `
      <div class="card mb-16">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div class="section-title">Progresso da Admissão</div>
          <div style="font-size:13px;font-weight:700;color:${pct===100?'var(--green)':'var(--blue)'}">${concluidas}/${total} etapas · ${pct}%</div>
        </div>
        <div style="background:var(--gray100);border-radius:6px;height:8px;overflow:hidden">
          <div style="background:${pct===100?'var(--green)':'var(--blue)'};height:100%;width:${pct}%;transition:width .3s"></div>
        </div>
        ${pct===100?'<div style="margin-top:8px;font-size:12px;color:var(--green);font-weight:600">✅ Processo admissional concluído</div>':''}
      </div>
      <div class="card">
        <div class="section-title mb-16">Etapas / Controle do Processo</div>
        ${RH_ADMISSAO_ETAPAS.map(et => {
          const r = registros.find(x => x.etapa === et.id);
          const done = r && r.concluida;
          return `<div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid var(--gray100)">
            <input type="checkbox" ${done?'checked':''} onchange="toggleEtapaAdmissao(${colabId},'${et.id}',this.checked)" style="margin-top:3px;width:16px;height:16px;flex-shrink:0;cursor:pointer">
            <div style="flex:1">
              <div style="font-size:13px;font-weight:600;${done?'color:var(--green);text-decoration:line-through':''}">${et.nome}</div>
              <div style="font-size:11px;color:var(--gray400)">${et.desc}</div>
              ${done && r.data ? `<div style="font-size:11px;color:var(--gray400);margin-top:2px">Concluída em ${FormatService.date(r.data)}</div>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>`;
  } else if (tab === 'documentos') {
    const items = (DB.get('rhDocumentos') || []).filter(d => d.colabId === colabId).sort((a,b)=>new Date(b.uploadAt)-new Date(a.uploadAt));
    const hoje = new Date();
    body.innerHTML = `
      <div class="upload-area" style="margin-bottom:14px" onclick="document.getElementById('rh-doc-file-input').click()" ondragover="event.preventDefault();this.classList.add('drag')" ondragleave="this.classList.remove('drag')" ondrop="this.classList.remove('drag');handleRHDocDrop(event, ${colabId})">
        <div style="font-size:24px">📤</div>
        <p>Arraste e solte o arquivo aqui ou <strong style="color:var(--blue)">clique para selecionar</strong></p>
        <p style="font-size:11px">PDF, DOC, DOCX, JPG, PNG – Máx. 10MB por arquivo</p>
      </div>
      <input type="file" id="rh-doc-file-input" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif" style="display:none" onchange="handleRHDocUpload(event, ${colabId})">
      ${items.length ? `<div class="table-wrap"><table><tr><th>Arquivo</th><th>Categoria</th><th>Validade</th><th>Tamanho</th><th>Status</th><th>Ações</th></tr>
      ${items.map(d => {
        const venc = d.validade && new Date(d.validade) < hoje;
        return `<tr>
        <td><div style="display:flex;align-items:center;gap:8px"><span style="font-size:18px">${docIcon(d.tipo||'pdf')}</span><div><div style="font-weight:600;font-size:12px">${d.nome}</div><div style="font-size:11px;color:var(--gray400)">Enviado em ${FormatService.date(d.uploadAt)}</div></div></div></td>
        <td><span class="badge badge-gray">${d.categoria}</span></td>
        <td style="font-size:12px;color:${venc?'var(--red)':'inherit'}">${d.validade ? FormatService.date(d.validade) + (venc?' (vencido)':'') : '-'}</td>
        <td style="font-size:12px">${d.tamanho||'-'}</td>
        <td><span class="badge ${d.status==='Aprovado'?'badge-green':d.status==='Rejeitado'?'badge-red':'badge-amber'}">${d.status}</span></td>
        <td style="white-space:nowrap">
          ${d.fileData?`<button class="btn btn-ghost btn-sm" onclick="downloadRHDoc(${d.id})" title="Baixar">⬇️</button>`:''}
          ${d.status!=='Aprovado'?`<button class="btn btn-ghost btn-sm" onclick="atualizarStatusRHDoc(${d.id},'Aprovado')" title="Aprovar">✅</button>`:''}
          ${d.status!=='Rejeitado'?`<button class="btn btn-ghost btn-sm" onclick="atualizarStatusRHDoc(${d.id},'Rejeitado')" title="Rejeitar">🚫</button>`:''}
          <button class="btn btn-ghost btn-sm" onclick="excluirRH('rhDocumentos',${d.id},'documentos',${colabId})" title="Excluir">🗑️</button>
        </td>
      </tr>`; }).join('')}</table></div>` : emptyState('Nenhum documento enviado para este colaborador ainda.')}`;
  } else if (tab === 'aso') {
    const items = (DB.get('rhAso') || []).filter(a => a.colabId === colabId).sort((a,b)=>new Date(b.data)-new Date(a.data));
    const hoje = new Date();
    body.innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn btn-primary btn-sm" onclick="abrirNovoASO(${colabId})">+ Novo ASO</button></div>
      ${items.length ? `<div class="table-wrap"><table><tr><th>Tipo</th><th>Data</th><th>Validade</th><th>Médico</th><th>Resultado</th><th>Ações</th></tr>
      ${items.map(a => { const venc = a.validade && new Date(a.validade) < hoje; return `<tr>
        <td>${a.tipo}</td><td>${FormatService.date(a.data)}</td>
        <td style="color:${venc?'var(--red)':'inherit'}">${FormatService.date(a.validade)}${venc?' (vencido)':''}</td>
        <td>${a.medico||'-'}</td>
        <td><span class="badge ${a.resultado==='Apto'?'badge-green':a.resultado==='Inapto'?'badge-red':'badge-amber'}">${a.resultado}</span></td>
        <td><button class="btn btn-ghost btn-sm" onclick="excluirRH('rhAso',${a.id},'aso',${colabId})">🗑️</button></td>
      </tr>`; }).join('')}</table></div>` : emptyState('Nenhum ASO registrado.')}`;
  } else if (tab === 'treinamentos') {
    const items = (DB.get('rhTreinamentos') || []).filter(t => t.colabId === colabId).sort((a,b)=>new Date(b.dataRealizacao)-new Date(a.dataRealizacao));
    const hoje = new Date();
    body.innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn btn-primary btn-sm" onclick="abrirNovoTreinamento(${colabId})">+ Novo Treinamento</button></div>
      ${items.length ? `<div class="table-wrap"><table><tr><th>Curso/NR</th><th>Realização</th><th>Validade</th><th>Carga Horária</th><th>Ações</th></tr>
      ${items.map(t => { const venc = t.validade && new Date(t.validade) < hoje; return `<tr>
        <td>${t.curso}</td><td>${FormatService.date(t.dataRealizacao)}</td>
        <td style="color:${venc?'var(--red)':'inherit'}">${FormatService.date(t.validade)}${venc?' (vencido)':''}</td>
        <td>${t.cargaHoraria||'-'}h</td>
        <td><button class="btn btn-ghost btn-sm" onclick="excluirRH('rhTreinamentos',${t.id},'treinamentos',${colabId})">🗑️</button></td>
      </tr>`; }).join('')}</table></div>` : emptyState('Nenhum treinamento registrado.')}`;
  } else if (tab === 'ferias') {
    const items = (DB.get('rhFerias') || []).filter(f => f.colabId === colabId).sort((a,b)=>new Date(b.inicio)-new Date(a.inicio));
    body.innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn btn-primary btn-sm" onclick="abrirNovaFerias(${colabId})">+ Programar Férias</button></div>
      ${items.length ? `<div class="table-wrap"><table><tr><th>Período Aquisitivo</th><th>Início</th><th>Fim</th><th>Dias</th><th>Status</th><th>Ações</th></tr>
      ${items.map(f => `<tr>
        <td style="font-size:11px">${FormatService.date(f.periodoAquisitivoInicio)} a ${FormatService.date(f.periodoAquisitivoFim)}</td>
        <td>${FormatService.date(f.inicio)}</td><td>${FormatService.date(f.fim)}</td><td>${f.dias}</td>
        <td><span class="badge ${f.status==='Concluída'?'badge-green':f.status==='Em Gozo'?'badge-blue':'badge-amber'}">${f.status}</span></td>
        <td><button class="btn btn-ghost btn-sm" onclick="excluirRH('rhFerias',${f.id},'ferias',${colabId})">🗑️</button></td>
      </tr>`).join('')}</table></div>` : emptyState('Nenhuma férias programada.')}`;
  } else if (tab === 'ponto') {
    const items = (DB.get('ponto') || []).filter(p => p.colabId === colabId).sort((a,b)=>new Date(b.data)-new Date(a.data)).slice(0,20);
    const hoje = new Date().toISOString().split('T')[0];
    const registroHoje = (DB.get('ponto') || []).find(p => p.colabId === colabId && p.data === hoje);
    body.innerHTML = `
      <div class="card mb-16" style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:12px;color:var(--gray400)">Registro de hoje: ${registroHoje ? `Entrada ${registroHoje.entrada||'-'} · Almoço ${registroHoje.saidaAlmoco||'-'}/${registroHoje.voltaAlmoco||'-'} · Saída ${registroHoje.saida||'-'}` : 'Nenhum ponto registrado hoje'}</div>
        <button class="btn btn-primary btn-sm" onclick="baterPonto(${colabId})">⏱️ Bater Ponto Agora</button>
      </div>
      ${items.length ? `<div class="table-wrap"><table><tr><th>Data</th><th>Entrada</th><th>Saída Almoço</th><th>Volta Almoço</th><th>Saída</th><th>Local</th></tr>
      ${items.map(p => `<tr>
        <td>${FormatService.date(p.data)}</td><td>${p.entrada||'-'}</td><td>${p.saidaAlmoco||'-'}</td><td>${p.voltaAlmoco||'-'}</td><td>${p.saida||'-'}</td>
        <td>${p.geo ? '📍 Registrado' : '-'}</td>
      </tr>`).join('')}</table></div>` : emptyState('Nenhum ponto registrado ainda.')}`;
  }
}

function excluirRH(entity, id, tab, colabId) {
  confirmAction('Excluir registro?', 'Este registro será removido permanentemente.', () => {
    DB.delete(entity, id);
    showToast('Registro excluído.', 'success');
    switchPainelRHTab(tab);
  }, '🗑️');
}

// --- Modais rápidos de RH (ASO, Treinamento, Férias) ---
function ensureRHFormModal() {
  if (document.getElementById('modal-rh-form')) return;
  const div = document.createElement('div');
  div.className = 'modal-overlay';
  div.id = 'modal-rh-form';
  div.addEventListener('click', e => { if (e.target === div) closeModal(); });
  div.innerHTML = `<div class="modal" style="max-width:460px"><div class="modal-header"><h3 id="rhf-title" style="font-size:16px;font-weight:700"></h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
    <input type="hidden" id="rhf-colab-id"><input type="hidden" id="rhf-kind">
    <div id="rhf-fields"></div>
    <button class="btn btn-primary" style="width:100%;margin-top:6px" onclick="salvarRHForm()">Salvar</button>
    </div>`;
  document.body.appendChild(div);
}

function abrirNovoASO(colabId) {
  ensureRHFormModal();
  document.getElementById('rhf-title').textContent = 'Novo ASO';
  document.getElementById('rhf-colab-id').value = colabId;
  document.getElementById('rhf-kind').value = 'aso';
  document.getElementById('rhf-fields').innerHTML = `
    <div class="form-group"><label class="form-label">Tipo</label><select class="form-input" id="rhf-tipo"><option>Admissional</option><option>Periódico</option><option>Retorno ao Trabalho</option><option>Mudança de Função</option><option>Demissional</option></select></div>
    <div class="form-group"><label class="form-label">Data do Exame</label><input type="date" class="form-input" id="rhf-data"></div>
    <div class="form-group"><label class="form-label">Validade</label><input type="date" class="form-input" id="rhf-validade"></div>
    <div class="form-group"><label class="form-label">Médico Responsável</label><input class="form-input" id="rhf-medico"></div>
    <div class="form-group"><label class="form-label">Resultado</label><select class="form-input" id="rhf-resultado"><option>Apto</option><option>Apto com restrições</option><option>Inapto</option></select></div>`;
  openModal('rh-form');
}
function abrirNovoTreinamento(colabId) {
  ensureRHFormModal();
  document.getElementById('rhf-title').textContent = 'Novo Treinamento / NR';
  document.getElementById('rhf-colab-id').value = colabId;
  document.getElementById('rhf-kind').value = 'treinamentos';
  document.getElementById('rhf-fields').innerHTML = `
    <div class="form-group"><label class="form-label">Curso / Norma</label><select class="form-input" id="rhf-curso">${NR_LIST.map(n=>`<option>${n}</option>`).join('')}<option>Outro</option></select></div>
    <div class="form-group"><label class="form-label">Data de Realização</label><input type="date" class="form-input" id="rhf-data"></div>
    <div class="form-group"><label class="form-label">Validade</label><input type="date" class="form-input" id="rhf-validade"></div>
    <div class="form-group"><label class="form-label">Carga Horária (h)</label><input type="number" class="form-input" id="rhf-carga"></div>
    <div class="form-group"><label class="form-label">Instituição</label><input class="form-input" id="rhf-instituicao"></div>`;
  openModal('rh-form');
}
function abrirNovaFerias(colabId) {
  ensureRHFormModal();
  document.getElementById('rhf-title').textContent = 'Programar Férias';
  document.getElementById('rhf-colab-id').value = colabId;
  document.getElementById('rhf-kind').value = 'ferias';
  document.getElementById('rhf-fields').innerHTML = `
    <div class="form-group"><label class="form-label">Período Aquisitivo - Início</label><input type="date" class="form-input" id="rhf-pai"></div>
    <div class="form-group"><label class="form-label">Período Aquisitivo - Fim</label><input type="date" class="form-input" id="rhf-paf"></div>
    <div class="form-group"><label class="form-label">Início das Férias</label><input type="date" class="form-input" id="rhf-inicio"></div>
    <div class="form-group"><label class="form-label">Fim das Férias</label><input type="date" class="form-input" id="rhf-fim"></div>
    <div class="form-group"><label class="form-label">Status</label><select class="form-input" id="rhf-status"><option>Programada</option><option>Em Gozo</option><option>Concluída</option></select></div>`;
  openModal('rh-form');
}
function salvarRHForm() {
  const colabId = parseInt(document.getElementById('rhf-colab-id').value);
  const kind = document.getElementById('rhf-kind').value;
  if (kind === 'aso') {
    const data = document.getElementById('rhf-data').value;
    if (!ValidationService.required(data, 'Data do exame')) return;
    DB.add('rhAso', { colabId, tipo: document.getElementById('rhf-tipo').value, data, validade: document.getElementById('rhf-validade').value, medico: document.getElementById('rhf-medico').value.trim(), resultado: document.getElementById('rhf-resultado').value });
  } else if (kind === 'treinamentos') {
    const data = document.getElementById('rhf-data').value;
    if (!ValidationService.required(data, 'Data de realização')) return;
    DB.add('rhTreinamentos', { colabId, curso: document.getElementById('rhf-curso').value, dataRealizacao: data, validade: document.getElementById('rhf-validade').value, cargaHoraria: parseInt(document.getElementById('rhf-carga').value) || 0, instituicao: document.getElementById('rhf-instituicao').value.trim() });
  } else if (kind === 'ferias') {
    const inicio = document.getElementById('rhf-inicio').value, fim = document.getElementById('rhf-fim').value;
    if (!ValidationService.required(inicio, 'Início das férias')) return;
    if (!ValidationService.required(fim, 'Fim das férias')) return;
    const dias = Math.round((new Date(fim) - new Date(inicio)) / 86400000) + 1;
    DB.add('rhFerias', { colabId, periodoAquisitivoInicio: document.getElementById('rhf-pai').value, periodoAquisitivoFim: document.getElementById('rhf-paf').value, inicio, fim, dias, status: document.getElementById('rhf-status').value });
  }
  if (typeof ActivityLog !== 'undefined') ActivityLog.add('Registrou ' + kind, 'Equipe (RH)', 'Colaborador #' + colabId);
  showToast('Registro salvo com sucesso!', 'success');
  closeModal();
  switchPainelRHTab(kind === 'aso' ? 'aso' : kind === 'treinamentos' ? 'treinamentos' : 'ferias');
}

// --- Documentos de RH (upload por colaborador) ---
function handleRHDocUpload(event, colabId) {
  const file = event.target.files[0];
  event.target.value = '';
  if (file) processRHDocFile(file, colabId);
}

function handleRHDocDrop(event, colabId) {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (file) processRHDocFile(file, colabId);
}

function processRHDocFile(file, colabId) {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowed = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif'];
  const ext = file.name.split('.').pop().toLowerCase();
  if (!allowed.includes(ext)) { showToast(`Tipo não suportado: .${ext}`, 'error'); return; }
  if (file.size > maxSize) { showToast(`Arquivo muito grande: ${file.name} (máx. 10MB)`, 'error'); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    window._rhDocPendente = {
      colabId, fileName: file.name, tipo: ext,
      tamanho: formatFileSize(file.size), fileData: e.target.result
    };
    abrirRHDocCategoriaModal();
  };
  reader.readAsDataURL(file);
}

function ensureRHDocFormModal() {
  if (document.getElementById('modal-rh-doc-form')) return;
  const div = document.createElement('div');
  div.className = 'modal-overlay';
  div.id = 'modal-rh-doc-form';
  div.addEventListener('click', e => { if (e.target === div) closeModal(); });
  div.innerHTML = `<div class="modal" style="max-width:460px">
    <div class="modal-header"><h3 style="font-size:16px;font-weight:700">Enviar Documento</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
    <div id="rhdoc-file-info" style="font-size:12px;color:var(--gray400);margin-bottom:12px"></div>
    <div class="form-group"><label class="form-label">Nome do Documento</label><input class="form-input" id="rhdoc-nome"></div>
    <div class="form-group"><label class="form-label">Categoria</label><select class="form-input" id="rhdoc-categoria">${RH_DOC_CATEGORIAS.map(c => `<option>${c}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Validade (opcional)</label><input type="date" class="form-input" id="rhdoc-validade"></div>
    <button class="btn btn-primary" style="width:100%;margin-top:6px" onclick="salvarRHDoc()">💾 Salvar Documento</button>
  </div>`;
  document.body.appendChild(div);
}

function abrirRHDocCategoriaModal() {
  const pend = window._rhDocPendente;
  if (!pend) return;
  ensureRHDocFormModal();
  document.getElementById('rhdoc-file-info').textContent = `Arquivo: ${pend.fileName} (${pend.tamanho})`;
  document.getElementById('rhdoc-nome').value = pend.fileName.replace(/\.[^/.]+$/, '');
  document.getElementById('rhdoc-categoria').value = 'Outros';
  document.getElementById('rhdoc-validade').value = '';
  openModal('rh-doc-form');
}

function salvarRHDoc() {
  const pend = window._rhDocPendente;
  if (!pend) { closeModal(); return; }
  const nome = document.getElementById('rhdoc-nome').value.trim();
  if (!ValidationService.required(nome, 'Nome do documento')) return;
  DB.add('rhDocumentos', {
    colabId: pend.colabId,
    nome,
    categoria: document.getElementById('rhdoc-categoria').value,
    validade: document.getElementById('rhdoc-validade').value || null,
    tipo: pend.tipo,
    tamanho: pend.tamanho,
    fileName: pend.fileName,
    fileData: pend.fileData,
    status: 'Pendente',
    uploadAt: new Date().toISOString().split('T')[0]
  });
  if (typeof ActivityLog !== 'undefined') ActivityLog.add('Enviou documento', 'Equipe (RH)', 'Colaborador #' + pend.colabId);
  window._rhDocPendente = null;
  showToast('Documento enviado com sucesso!', 'success');
  closeModal();
  if (document.getElementById('rh-colab-id')) switchPainelRHTab('documentos');
  if (typeof renderRHPage === 'function' && currentPage === 'rh') renderRHPage();
}

function downloadRHDoc(id) {
  const d = DB.find('rhDocumentos', id);
  if (!d || !d.fileData) { showToast('Arquivo não disponível para download.', 'warning'); return; }
  const a = document.createElement('a');
  a.href = d.fileData;
  a.download = d.fileName || d.nome;
  a.click();
}

function atualizarStatusRHDoc(id, status) {
  const d = DB.find('rhDocumentos', id);
  if (!d) return;
  DB.update('rhDocumentos', id, { status });
  showToast(`Documento marcado como "${status}".`, 'success');
  switchPainelRHTab('documentos');
}

// --- Controle de etapas do processo admissional ---
function toggleEtapaAdmissao(colabId, etapaId, concluida) {
  const registros = DB.get('rhAdmissao') || [];
  const existente = registros.find(r => r.colabId === colabId && r.etapa === etapaId);
  if (existente) {
    DB.update('rhAdmissao', existente.id, { concluida, data: concluida ? new Date().toISOString().split('T')[0] : null });
  } else {
    DB.add('rhAdmissao', { colabId, etapa: etapaId, concluida, data: concluida ? new Date().toISOString().split('T')[0] : null });
  }
  if (typeof ActivityLog !== 'undefined') ActivityLog.add(concluida ? 'Concluiu etapa de admissão' : 'Reabriu etapa de admissão', 'Equipe (RH)', 'Colaborador #' + colabId);
  switchPainelRHTab('admissao');
}

function baterPonto(colabId) {
  const now = new Date();
  const hoje = now.toISOString().split('T')[0];
  const hora = now.toTimeString().substring(0,5);
  const registrar = (geo) => {
    const pontos = DB.get('ponto');
    let reg = pontos.find(p => p.colabId === colabId && p.data === hoje);
    if (!reg) {
      reg = { colabId, data: hoje, entrada: hora, geo };
      DB.add('ponto', reg);
      showToast('Entrada registrada às ' + hora, 'success');
    } else if (!reg.saidaAlmoco) {
      DB.update('ponto', reg.id, { saidaAlmoco: hora });
      showToast('Saída para almoço registrada às ' + hora, 'success');
    } else if (!reg.voltaAlmoco) {
      DB.update('ponto', reg.id, { voltaAlmoco: hora });
      showToast('Retorno do almoço registrado às ' + hora, 'success');
    } else if (!reg.saida) {
      DB.update('ponto', reg.id, { saida: hora });
      showToast('Saída registrada às ' + hora, 'success');
    } else {
      showToast('Todos os registros de hoje já foram feitos.', 'info');
    }
    switchPainelRHTab('ponto');
  };
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => registrar({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => registrar(null),
      { timeout: 4000 }
    );
  } else {
    registrar(null);
  }
}

// (renderEquipeTable já foi unificada em uma única definição no módulo
// Equipe, incluindo o botão de RH — a duplicata que existia aqui foi removida.)

// =====================================================================
