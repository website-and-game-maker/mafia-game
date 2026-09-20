// =============================================================================
// DEBUG-ONLY: version verification banner
// =============================================================================
// Shows a thin bar at the very top of the page with the current build stamp
// (window.MAFIA_CONFIG.version, set in scripts/config.js) so you can visually
// confirm a deploy actually went live (a stale version after deploying means
// the page didn't update — cache, wrong host, etc).
//
// The "Don't show again" checkbox is checked by default: dismissing with it
// checked hides the banner for THIS build only (stored in localStorage), so
// the next deploy (a new version string) shows it again automatically.
// Unchecking it before dismissing makes the banner reappear on every reload.
// Safe to delete this file (and its <script> tag) once no longer needed.

(function () {
  const VERSION = (window.MAFIA_CONFIG && window.MAFIA_CONFIG.version) || 'dev';
  const STORAGE_KEY = 'mafia_debug_version_dismissed';

  function getDismissedVersion() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function setDismissedVersion(v) {
    try { localStorage.setItem(STORAGE_KEY, v); } catch (e) { /* ignore */ }
  }
  function clearDismissedVersion() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  }

  function injectStyles() {
    if (document.getElementById('debug-version-banner-style')) return;
    const style = document.createElement('style');
    style.id = 'debug-version-banner-style';
    style.textContent = [
      // z-index 1000: above regular content/modals but below full-screen app
      // overlays (tutorial z-index:1100, big room-code view z-index:1200) so
      // this debug bar never sits on top of a flow meant to own the screen.
      '#debug-version-banner{position:fixed;top:0;left:0;right:0;z-index:1000;',
      'display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;',
      'background:repeating-linear-gradient(135deg,#7c2d12,#7c2d12 10px,#9a3412 10px,#9a3412 20px);',
      'color:#fff7ed;font:600 12px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
      'padding:6px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.4);border-bottom:2px solid #431407;}',
      '#debug-version-banner strong{font-weight:800;letter-spacing:.02em}',
      '#debug-version-banner label{display:flex;align-items:center;gap:5px;cursor:pointer;user-select:none}',
      '#debug-version-banner input[type="checkbox"]{width:14px;height:14px;margin:0;cursor:pointer}',
      '#debug-version-banner button{background:rgba(255,255,255,.15);color:#fff7ed;',
      'border:1px solid rgba(255,255,255,.4);border-radius:5px;padding:2px 9px;font:inherit;cursor:pointer}',
      '#debug-version-banner button:hover{background:rgba(255,255,255,.28)}'
    ].join('');
    document.head.appendChild(style);
  }

  function showBanner() {
    injectStyles();
    const bar = document.createElement('div');
    bar.id = 'debug-version-banner';
    bar.innerHTML =
      '<span>🔧 DEBUG BUILD — <strong>' + VERSION + '</strong></span>' +
      '<label><input type="checkbox" id="debug-version-dismiss-checkbox" checked> Don’t show again</label>' +
      '<button type="button" id="debug-version-dismiss-btn">Dismiss</button>';
    document.body.prepend(bar);

    document.getElementById('debug-version-dismiss-btn').addEventListener('click', function () {
      const checked = document.getElementById('debug-version-dismiss-checkbox').checked;
      if (checked) {
        setDismissedVersion(VERSION);
      } else {
        clearDismissedVersion();
      }
      bar.remove();
    });
  }

  function init() {
    if (getDismissedVersion() === VERSION) return;
    showBanner();
  }

  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
