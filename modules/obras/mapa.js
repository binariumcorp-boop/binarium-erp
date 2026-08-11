// ============================================================
// mapa.js
// FASE 3 (1): MAPA DAS OBRAS
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================



// =====================================================================
// ===== FASE 3 — MÓDULOS COMPLEMENTARES ================================
// Mapa das Obras | Linha do Tempo / Painel Completo da Obra |
// Aditivos de Obra | RH Completo + Ponto | Permissões Detalhadas
// =====================================================================

// ----- Novas chaves de armazenamento -----
if (!DB.KEYS.aditivos) DB.KEYS.aditivos = 'gob_aditivos';
if (!DB.KEYS.rhAso) DB.KEYS.rhAso = 'gob_rh_aso';
if (!DB.KEYS.rhTreinamentos) DB.KEYS.rhTreinamentos = 'gob_rh_treinamentos';
if (!DB.KEYS.rhFerias) DB.KEYS.rhFerias = 'gob_rh_ferias';
if (!DB.KEYS.ponto) DB.KEYS.ponto = 'gob_ponto';
if (!DB.KEYS.rhDocumentos) DB.KEYS.rhDocumentos = 'gob_rh_documentos';
if (!DB.KEYS.rhAdmissao) DB.KEYS.rhAdmissao = 'gob_rh_admissao';
if (!DB.KEYS.permissoes) DB.KEYS.permissoes = 'gob_permissoes';

// Coordenadas aproximadas dos municípios já usados no sistema (RS)
const MUNICIPIO_COORDS = {
  'Santa Rosa – RS': [-27.8709, -54.4818],
  'Cândido Godói – RS': [-27.9482, -54.7419],
  'Santo Ângelo – RS': [-28.2987, -54.2634],
  'Três de Maio – RS': [-27.7909, -54.2394],
  'Horizontina – RS': [-27.6297, -54.3070],
  'Giruá – RS': [-28.0281, -54.3466],
  'Ijuí – RS': [-28.3875, -53.9147],
  'Panambi – RS': [-28.2939, -53.5014]
};
function coordsForObra(o) {
  if (o.lat && o.lng) return [parseFloat(o.lat), parseFloat(o.lng)];
  return MUNICIPIO_COORDS[o.municipio] || [-28.15, -54.0];
}

// =====================================================================
// 1. MAPA DAS OBRAS
// =====================================================================
let gobMapInstance = null, gobMapMarkers = [];

function initMapaObras() {
  if (document.querySelector('[data-page="mapa"]')) return;
  const docItem = document.querySelector('.nav-item[data-page="documentos"]');
  if (!docItem) return;
  const mapaItem = document.createElement('div');
  mapaItem.className = 'nav-item';
  mapaItem.dataset.page = 'mapa';
  mapaItem.onclick = () => goTo('mapa');
  mapaItem.innerHTML = `<svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg><span>Mapa das Obras</span>`;
  docItem.parentElement.insertBefore(mapaItem, docItem.nextSibling);
  PAGE_TITLES['mapa'] = 'Mapa das Obras';

  const content = document.getElementById('content');
  const page = document.createElement('div');
  page.className = 'page';
  page.id = 'page-mapa';
  page.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div><h2 style="font-size:22px;font-weight:700">Mapa das Obras</h2><p style="font-size:13px;color:var(--gray400)">Visualização geográfica das obras em andamento</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 300px;gap:16px;align-items:start">
      <div class="card" style="padding:0;overflow:hidden">
        <div id="gob-map" style="width:100%;height:560px"></div>
      </div>
      <div class="card" style="padding:12px;max-height:560px;overflow-y:auto">
        <div style="font-size:13px;font-weight:600;margin-bottom:10px">Obras no mapa</div>
        <div id="gob-map-list"></div>
      </div>
    </div>`;
  content.appendChild(page);
}

function renderMapaObras() {
  const obras = DB.get('obras');
  const listEl = document.getElementById('gob-map-list');
  if (!listEl) return;

  if (typeof L === 'undefined') {
    listEl.innerHTML = '<div style="font-size:12px;color:var(--gray400)">Não foi possível carregar a biblioteca de mapas (sem conexão com a internet).</div>';
    document.getElementById('gob-map').innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--gray400);font-size:13px">Mapa indisponível offline</div>';
    return;
  }

  if (!gobMapInstance) {
    gobMapInstance = L.map('gob-map').setView([-28.1, -54.3], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 18
    }).addTo(gobMapInstance);
  } else {
    setTimeout(() => gobMapInstance.invalidateSize(), 50);
  }

  gobMapMarkers.forEach(m => gobMapInstance.removeLayer(m));
  gobMapMarkers = [];

  const colorFor = s => ({'Em Andamento':'#1a56db','Concluindo':'#059669','Concluída':'#059669','Atrasada':'#dc2626','Planejada':'#9ca3af'}[s] || '#1a56db');

  const bounds = [];
  obras.forEach(o => {
    const [lat, lng] = coordsForObra(o);
    bounds.push([lat, lng]);
    const icon = L.divIcon({
      className: '', html: `<div style="width:16px;height:16px;border-radius:50%;background:${colorFor(o.status)};border:2px solid #fff;box-shadow:0 0 0 2px ${colorFor(o.status)}55"></div>`,
      iconSize: [16,16], iconAnchor: [8,8]
    });
    const marker = L.marker([lat, lng], { icon }).addTo(gobMapInstance);
    marker.bindPopup(`<div style="font-family:sans-serif;font-size:12px;min-width:170px"><b>${o.nome}</b><br>${o.municipio}<br>Status: ${o.status}<br>Progresso: ${o.progresso}%<br><a href="#" onclick="goTo('mapa');abrirPainelObra(${o.id});return false;">Ver detalhes</a></div>`);
    gobMapMarkers.push(marker);
  });
  if (bounds.length) gobMapInstance.fitBounds(bounds, { padding: [30,30] });

  listEl.innerHTML = obras.map(o => `
    <div style="padding:8px;border-radius:8px;cursor:pointer;margin-bottom:4px" onmouseover="this.style.background='var(--gray50)'" onmouseout="this.style.background='transparent'" onclick="centralizarObraMapa(${o.id})">
      <div style="display:flex;align-items:center;gap:6px">
        <span style="width:8px;height:8px;border-radius:50%;background:${colorFor(o.status)};flex-shrink:0"></span>
        <span style="font-size:12px;font-weight:600">${o.nome}</span>
      </div>
      <div style="font-size:10px;color:var(--gray400);margin-left:14px">${o.municipio} · ${o.progresso}%</div>
    </div>`).join('');
}

function centralizarObraMapa(id) {
  const o = DB.find('obras', id);
  if (!o || !gobMapInstance) return;
  const [lat, lng] = coordsForObra(o);
  gobMapInstance.setView([lat, lng], 13);
  const marker = gobMapMarkers.find(m => {
    const p = m.getLatLng();
    return Math.abs(p.lat - lat) < 0.0001 && Math.abs(p.lng - lng) < 0.0001;
  });
  if (marker) marker.openPopup();
}

// =====================================================================
