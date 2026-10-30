/* ============================================================
   icon-fallback.js
   إذا تعذر تحميل مكتبة Font Awesome (انقطاع إنترنت أو معاينة محلية)
   يتم استبدال الأيقونات برموز بديلة منحدرة من النظام، حتى لا تظهر
   الأزرار والقوائم بدون أيقونات.
   ============================================================ */
(function () {
  'use strict';

  var GLYPHS = {
    'fa-phone': '📞', 'fa-bolt': '⚡', 'fa-whatsapp': '💬', 'fa-bars': '☰', 'fa-times': '✕',
    'fa-map-marker-alt': '📍', 'fa-envelope': '✉️', 'fa-clock': '🕐', 'fa-plug': '🔌',
    'fa-lightbulb': '💡', 'fa-tools': '🛠️', 'fa-screwdriver-wrench': '🛠️',
    'fa-table-cells-large': '▦', 'fa-shield-halved': '🛡️', 'fa-user-check': '👤', 'fa-user': '👤',
    'fa-hand-holding-usd': '💰', 'fa-headset': '🎧', 'fa-award': '🏅', 'fa-certificate': '📜',
    'fa-thumbs-up': '👍', 'fa-bullseye': '🎯', 'fa-flag': '🚩', 'fa-gem': '💎',
    'fa-arrow-left': '←', 'fa-arrow-right': '→', 'fa-folder': '📁', 'fa-calendar': '📅',
    'fa-check': '✓', 'fa-check-circle': '✅', 'fa-spinner': '⏳', 'fa-external-link-alt': '↗',
    'fa-sign-out-alt': '⎋', 'fa-sign-in-alt': '→', 'fa-download': '⬇️', 'fa-upload': '⬆️',
    'fa-database': '🗄️', 'fa-newspaper': '📰', 'fa-plus': '➕', 'fa-plus-circle': '⊕',
    'fa-edit': '✏️', 'fa-trash': '🗑️', 'fa-images': '🖼️', 'fa-image': '🖼️', 'fa-star': '⭐',
    'fa-sliders-h': '🎚️', 'fa-th-large': '▦', 'fa-save': '💾', 'fa-search': '🔍', 'fa-tag': '🏷️',
    'fa-flask': '🧪', 'fa-circle-exclamation': '⚠️', 'fa-file-circle-question': '❓',
    'fa-facebook': 'f', 'fa-twitter': '✦', 'fa-instagram': '📷', 'fa-code': '⌨️',
    'fa-rotate-left': '↺', 'fa-chart-bar': '📊', 'fa-info-circle': 'ℹ️', 'fa-home': '🏠',
    'fa-map-marked-alt': '🗺️', 'fa-cog': '⚙️', 'fa-eye': '👁️', 'fa-copy': '⧉'
  };

  function fontAwesomeLoaded() {
    var probe = document.createElement('i');
    probe.className = 'fas fa-bolt';
    probe.style.cssText = 'position:absolute;left:-9999px;visibility:hidden;';
    document.body.appendChild(probe);
    var family = window.getComputedStyle(probe).fontFamily || '';
    document.body.removeChild(probe);
    return /font\s*awesome/i.test(family);
  }

  function applyFallback() {
    var css = '.fas,.far,.fab{font-family:inherit!important;font-style:normal!important;font-weight:400!important;}';
    Object.keys(GLYPHS).forEach(function (cls) {
      css += '.' + cls + '::before{content:"' + GLYPHS[cls] + '";}';
    });
    var style = document.createElement('style');
    style.id = 'icon-fallback-styles';
    style.textContent = css;
    document.head.appendChild(style);
    document.documentElement.classList.add('no-fontawesome');
  }

  window.addEventListener('DOMContentLoaded', function () {
    if (!fontAwesomeLoaded()) applyFallback();
  });
})();
