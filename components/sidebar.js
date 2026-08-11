// ============================================================
// sidebar.js
// SIDEBAR TOGGLE
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== SIDEBAR TOGGLE =====
function toggleSidebar() {
  const s = document.getElementById('sidebar');
  s.classList.toggle('collapsed');
}

function openMobileSidebar() {
  document.getElementById('sidebar').classList.add('mobile-open');
  document.getElementById('sidebar-overlay').classList.add('show');
}

function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('sidebar-overlay').classList.remove('show');
}

