// ============================================================
// lightbox.js
// LIGHTBOX
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== LIGHTBOX (visualizador de fotos em tela cheia) =====
let lightboxFotos = [];
let lightboxIndex = 0;

function abrirGaleria(fotos, index) {
  if (!fotos || !fotos.length) return;
  lightboxFotos = fotos;
  mostrarFotoLightbox(index);
}

function mostrarFotoLightbox(index) {
  if (!lightboxFotos.length) return;
  if (index < 0) index = lightboxFotos.length - 1;
  if (index >= lightboxFotos.length) index = 0;
  lightboxIndex = index;
  const f = lightboxFotos[index];
  document.getElementById('lightbox-img').src = f.dataUrl;
  document.getElementById('lightbox-caption').textContent = f.nome || '';
  document.getElementById('lightbox-counter').textContent = lightboxFotos.length > 1 ? `${index + 1} / ${lightboxFotos.length}` : '';
  document.getElementById('lightbox-overlay').classList.add('open');
}

function lightboxNav(delta) {
  mostrarFotoLightbox(lightboxIndex + delta);
}

function fecharLightbox() {
  document.getElementById('lightbox-overlay').classList.remove('open');
}

document.addEventListener('keydown', (e) => {
  const lb = document.getElementById('lightbox-overlay');
  if (!lb || !lb.classList.contains('open')) return;
  if (e.key === 'Escape') fecharLightbox();
  if (e.key === 'ArrowLeft') lightboxNav(-1);
  if (e.key === 'ArrowRight') lightboxNav(1);
});

