// -----------------------------------------------------------------------------
// Mafia web app runtime configuration
// -----------------------------------------------------------------------------
//
// productionRelayUrl
//   The wss:// (or ws://) URL of your deployed realtime relay server.
//   Set this to enable ONLINE multi-device multiplayer when the game is served
//   from a static host such as GitHub Pages — every device just opens the site
//   URL and connects to this relay. Leave it empty ('') for local-only
//   multiplayer (run `python3 server.py` and play over your LAN).
//
//   After deploying scripts/realtime_server.py to a host (see DEPLOYMENT.md),
//   set it to that service's URL, e.g.:
//     productionRelayUrl: 'wss://mafia-relay.onrender.com'
//
// Notes:
//   - On an https:// page the URL must be wss:// (a ws:// URL is auto-upgraded
//     to wss:// to avoid blocked mixed content).
//   - This file is loaded before game.js on every app page.
window.MAFIA_CONFIG = Object.assign({
  productionRelayUrl: ''
}, window.MAFIA_CONFIG || {});
