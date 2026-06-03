// =============================================================================
// MAFIA GAME - Rendering Functions
// =============================================================================

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

function isSoloMode() {
  return state.players.length === 1 && state.bots.length > 0;
}

function clampExposure(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function getExposurePct(exposure) {
  return Math.round(clampExposure(exposure) * 100);
}

function getExposureColor(exposure) {
  const pct = clampExposure(exposure);
  const hue = Math.round((1 - pct) * 120);
  return `hsl(${hue} 85% 52%)`;
}

function getAliveDiscussionHumans() {
  return getAlivePlayers().filter(player => !player.isBot);
}

function isMultiDeviceChatEnabled() {
  return state.multiplayerMode === 'realtime' && (state.network.devices || []).length > 1;
}

function renderThinkingDots() {
  return `<span class="thinking-dots"><span>.</span><span>.</span><span>.</span></span>`;
}

function captureFocusedInputState() {
  const active = document.activeElement;
  if (!active || !active.id) return null;
  const isInput = typeof HTMLInputElement !== 'undefined' && active instanceof HTMLInputElement;
  const isTextarea = typeof HTMLTextAreaElement !== 'undefined' && active instanceof HTMLTextAreaElement;
  if (!isInput && !isTextarea) return null;
  return {
    id: active.id,
    start: active.selectionStart,
    end: active.selectionEnd
  };
}

function restoreFocusedInputState(snapshot) {
  if (!snapshot?.id) return;
  const next = document.getElementById(snapshot.id);
  if (!next || typeof next.focus !== 'function') return;
  next.focus();
  if (typeof next.setSelectionRange === 'function' && Number.isInteger(snapshot.start) && Number.isInteger(snapshot.end)) {
    const length = String(next.value || '').length;
    const start = Math.max(0, Math.min(snapshot.start, length));
    const end = Math.max(start, Math.min(snapshot.end, length));
    next.setSelectionRange(start, end);
  }
}

function renderMultiDeviceChatPanel({ prominent = false, corner = false } = {}) {
  const aliveHumans = getAliveDiscussionHumans();
  const dayMessages = state.chatMessages.filter(message => message.day === state.dayNumber);
  const chatOpen = state.gamePhase === 'discussion';
  const panelClasses = ['chat-panel'];
  if (prominent) panelClasses.push('chat-panel-prominent');
  if (corner) panelClasses.push('chat-panel-corner');

  return `
    <div class="${panelClasses.join(' ')}">
      <div class="chat-header">🗨️ Multi-device Chat</div>
      ${aliveHumans.length > 1 ? `
        <div class="chat-senders">
          ${aliveHumans.map(player => `
            <button class="chat-sender-btn ${state.chatSenderId === player.id ? 'active' : ''}" onclick="setChatSender('${player.id}')">
              ${player.name}
            </button>
          `).join('')}
        </div>
      ` : ''}
      <div class="chat-messages">
        ${dayMessages.length === 0 ? '<div style="color:var(--text-secondary);font-size:0.9rem">No messages yet this round.</div>' : dayMessages.map(message => `
          <div class="chat-message ${message.senderId?.startsWith('bot') ? 'chat-message-bot' : ''}">
            <span class="chat-author">${message.senderName}:</span> ${message.text}
          </div>
        `).join('')}
      </div>
      <div class="chat-compose">
        <input class="input" type="text" value="${state.chatDraft.replace(/"/g, '&quot;')}"
               oninput="setChatDraft(this.value)"
               onkeydown="if(event.key==='Enter'){event.preventDefault();sendDiscussionMessage();}"
               placeholder="${chatOpen ? 'Type message and press Enter' : 'Chat opens during discussion'}"
               ${chatOpen ? '' : 'disabled'}/>
        <button class="btn btn-secondary btn-small" onclick="sendDiscussionMessage()" ${chatOpen ? '' : 'disabled'}>Send</button>
      </div>
      ${chatOpen ? '' : '<div style="color:var(--text-secondary);font-size:0.8rem;margin-top:8px">Chat is read-only outside discussion.</div>'}
    </div>
  `;
}

function renderNarratorQuickControls() {
  const soloNarratorRestricted = state.entryPage === 'solo';
  const modeHint = soloNarratorRestricted
    ? 'Solo mode uses Auto narrator only.'
    : (state.settings.narratorMode === 'human'
      ? (isMultiDeviceChatEnabled()
        ? 'Human narrator active: narrator turn goes first each phase and the cue is posted in shared chat.'
        : 'Human narrator active: narrator turn goes first each phase and the cue is spoken aloud.')
      : 'Auto narrator active.');

  return `
    <div class="narrator-quick-controls">
      <div class="narrator-quick-label">Narrator</div>
      <div class="narrator-quick-actions">
        <button class="btn btn-small ${state.settings.narratorMode === 'auto' ? 'btn-primary' : 'btn-secondary'}" onclick="setNarratorMode('auto')">Auto</button>
        ${soloNarratorRestricted ? '' : `<button class="btn btn-small ${state.settings.narratorMode === 'human' ? 'btn-primary' : 'btn-secondary'}" onclick="setNarratorMode('human')">Human</button>`}
      </div>
      <div class="narrator-quick-hint">${modeHint}</div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// MAIN RENDER
// -----------------------------------------------------------------------------

function render() {
  const app = document.getElementById('app');
  const focusSnapshot = captureFocusedInputState();
  if (state.screen === 'setup') app.innerHTML = renderSetup();
  else if (state.screen === 'multi_entry') app.innerHTML = renderMultiEntry();
  else if (state.screen === 'join_entry') app.innerHTML = renderJoinEntry();
  else if (state.screen === 'solo_lobby') app.innerHTML = renderSoloLobby();
  else if (state.screen === 'multi_lobby') app.innerHTML = renderMultiLobby();
  else if (state.screen === 'game') app.innerHTML = renderGame();
  attachEventListeners();
  restoreFocusedInputState(focusSnapshot);
  if (typeof window.afterRender === 'function') window.afterRender();
}

// -----------------------------------------------------------------------------
// SETUP SCREEN
// -----------------------------------------------------------------------------

function renderSetup() {
  return `
    <div class="container">
      <div class="header-bar" style="margin-bottom:6px">
        <span></span>
        <div class="header-actions">
          <button class="btn-icon btn-secondary" onclick="showSettings()">⚙️</button>
        </div>
      </div>
      <h1>MAFIA</h1>
      <p class="subtitle">A game of deception and survival</p>
      <button class="btn btn-secondary btn-full" style="margin-bottom:24px" onclick="showInstructions()">
        How to Play
      </button>
      <div class="card">
        <button class="mode-btn" onclick="goToSoloLobby()">
          <div class="mode-btn-title">🎮 Solo (vs Bots)</div>
          <div class="mode-btn-desc">Practice against AI opponents</div>
        </button>
        <button class="mode-btn" onclick="goToMultiLobby()">
          <div class="mode-btn-title">👥 Multiplayer</div>
          <div class="mode-btn-desc">Play with friends</div>
        </button>
      </div>
    </div>
    ${state.showInstructions ? renderInstructionsModal() : ''}
    ${state.showSettings ? renderSettingsModal() : ''}
  `;
}

function renderMultiEntry() {
  return `
    <div class="container">
      <div class="header-bar">
        <button class="btn btn-secondary btn-small" onclick="goToSetup()">← Back</button>
        <div class="header-actions">
          <button class="btn-icon btn-primary" onclick="showInstructions()">?</button>
          <button class="btn-icon btn-secondary" onclick="showSettings()">⚙️</button>
        </div>
      </div>
      <h2 style="color:var(--red-accent)">Multiplayer</h2>
      <p class="subtitle" style="margin-bottom:14px">Choose how this device will join the game.</p>
      <div class="card">
        <button class="mode-btn" onclick="goToHostPage()" style="margin-bottom:14px">
          <div class="mode-btn-title">🛡️ Host Game</div>
          <div class="mode-btn-desc">Create the room, manage devices, and start rounds.</div>
        </button>
        <button class="mode-btn" onclick="goToJoinPage()">
          <div class="mode-btn-title">📱 Join Game</div>
          <div class="mode-btn-desc">Enter a room code and play from this device.</div>
        </button>
      </div>
    </div>
    ${state.showInstructions ? renderInstructionsModal() : ''}
    ${state.showSettings ? renderSettingsModal() : ''}
  `;
}

function renderJoinEntry() {
  const realtimeStatusColor = state.network.status === 'connected'
    ? '#4ade80'
    : state.network.status === 'error'
      ? '#f87171'
      : '#fbbf24';
  const realtimeStatusLabel = state.network.status === 'connected'
    ? 'Connected'
    : state.network.status === 'error'
      ? 'Error'
    : state.network.status === 'connecting'
      ? 'Connecting...'
      : 'Offline';
  const joinCodeValue = String(state.joinCode || state.gameCode || '').trim();
  const canJoin = Boolean(joinCodeValue);
  const statusDetail = state.network.statusDetail
    || (typeof getIdleRealtimeStatusDetail === 'function'
      ? getIdleRealtimeStatusDetail(false)
      : 'Enter room code, then press Join Game.');

  return `
    <div class="container">
      <div class="header-bar">
        <button class="btn btn-secondary btn-small" onclick="goToMultiEntryPage()">← Back</button>
        <div class="header-actions">
          <button class="btn-icon btn-primary" onclick="showInstructions()">?</button>
          <button class="btn-icon btn-secondary" onclick="showSettings()">⚙️</button>
        </div>
      </div>
      <h2 style="color:var(--red-accent)">Join Game</h2>
      <div class="card">
        <div class="section-label">Enter Room Code</div>
        <input id="joinCodeInput" type="text" class="input join-code-input" value="${joinCodeValue}" oninput="setJoinCodeInput(this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();connectAsJoiner();}" maxlength="8" spellcheck="false" placeholder="Enter code"/>
        <button class="btn btn-primary btn-full btn-lg" style="margin-top:12px" onclick="connectAsJoiner()" ${canJoin && state.network.status !== 'connecting' ? '' : 'disabled'}>Join Game</button>
        <div class="footnote" style="margin-top:10px">
          Connection: <span style="color:${realtimeStatusColor}">${realtimeStatusLabel}</span>
        </div>
        <div class="footnote">${statusDetail}</div>
      </div>
    </div>
    ${state.showInstructions ? renderInstructionsModal() : ''}
    ${state.showSettings ? renderSettingsModal() : ''}
  `;
}

// -----------------------------------------------------------------------------
// SOLO LOBBY
// -----------------------------------------------------------------------------

function renderSoloLobby() {
  const allPlayers = getAllPlayers();
  const total = getTotalRoles();
  const warnings = getStartWarnings();
  const blockReason = getStartBlockReason();
  const backAction = state.entryPage === 'solo' ? 'goToHomePage()' : 'goToSetup()';
  const backLabel = state.entryPage === 'solo' ? '← Home' : '← Back';

  return `
    <div class="container">
      <div class="header-bar">
        <button class="btn btn-secondary btn-small" onclick="${backAction}">${backLabel}</button>
        <div class="header-actions">
          <button class="btn-icon btn-primary" onclick="showInstructions()">?</button>
          <button class="btn-icon btn-secondary" onclick="showSettings()">⚙️</button>
        </div>
      </div>
      <h2 style="color:var(--red-accent)">Solo Game</h2>
      ${renderNarratorQuickControls()}

      <div class="card">
        <div class="section-label">Your Name</div>
        <input type="text" class="input" id="soloNameInput" value="${state.soloPlayerName}" placeholder="Enter your name..."/>
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span class="section-label" style="margin-bottom:0">🤖 Bots (${state.bots.length})</span>
          <button class="btn btn-secondary btn-small" onclick="addBot()" ${allPlayers.length >= 16 ? 'disabled' : ''}>+ Add Bot</button>
        </div>
        <div class="bot-list">
          ${state.bots.map(b => `
            <div class="player-item">
              <span class="player-name">🤖</span>
              <div class="player-item-actions" style="margin-left:auto">
                <input type="text" class="input inline-edit" value="${b.name.replace(/"/g, '&quot;')}"
                       onblur="renameBot('${b.id}', this.value)"
                       onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}"/>
                <button class="remove-btn" onclick="removeBot('${b.id}')">×</button>
              </div>
            </div>
          `).join('')}
          ${state.bots.length === 0 ? '<div style="color:var(--text-secondary);text-align:center;padding:12px">No bots yet</div>' : ''}
        </div>
      </div>

      <div class="card">
        <div class="section-label">📖 Setting</div>
        <div class="grid-2">
          ${STORY_PRESETS.map(s => `
            <div class="story-card ${state.selectedStory.id === s.id ? 'selected' : ''}" onclick="selectStory('${s.id}')">
              <div class="story-name">${s.name}</div>
              <div class="story-intro">${s.intro}</div>
              <div class="story-setting">${s.setting}</div>
            </div>
          `).join('')}
        </div>
      </div>

      ${renderRoleConfig(allPlayers, total, warnings)}

      <button class="btn btn-danger btn-full btn-lg" onclick="startGame()" ${blockReason ? 'disabled' : ''}>
        ${blockReason || 'Start Game'}
      </button>
    </div>
    ${state.showInstructions ? renderInstructionsModal() : ''}
    ${state.showSettings ? renderSettingsModal() : ''}
  `;
}

// -----------------------------------------------------------------------------
// MULTIPLAYER LOBBY
// -----------------------------------------------------------------------------

function renderMultiLobby() {
  const allPlayers = getAllPlayers();
  const total = getTotalRoles();
  const warnings = getStartWarnings();
  const blockReason = getStartBlockReason();
  const isRealtime = state.multiplayerMode === 'realtime';
  const orderedDeviceList = isRealtime ? getDeviceGroupedPlayers() : [];
  const waitingForHost = isRealtime && !state.network.isHost;
  const hostOnlyPage = typeof isHostOnlyPage === 'function' ? isHostOnlyPage() : false;
  const joinOnlyPage = state.entryPage === 'join';
  const connectedJoinClient = isRealtime && state.network.connected && !state.network.isHost;
  const readonlySetupView = joinOnlyPage || (isRealtime && !state.network.isHost);
  const fixedMultiPage = hostOnlyPage || joinOnlyPage;
  const isJoinPanel = joinOnlyPage || (!hostOnlyPage && state.realtimePanelMode === 'join');
  const joinCodeValue = String(state.joinCode || state.gameCode || '').trim();
  const joinCodeLocked = isJoinPanel && state.network.connected;
  const realtimeStatusColor = state.network.status === 'connected'
    ? '#4ade80'
    : state.network.status === 'error'
      ? '#f87171'
      : '#fbbf24';
  const realtimeStatusLabel = state.network.status === 'connected'
    ? 'Connected'
    : state.network.status === 'error'
      ? 'Error'
    : state.network.status === 'connecting'
      ? 'Connecting...'
      : 'Offline';
  const joinPortal = isRealtime ? getJoinPortalUrl() : '';
  const shareJoinUrl = isRealtime ? getShareJoinUrl(state.gameCode) : '';
  const qrImageUrl = isRealtime ? getShareQrImageUrl(state.gameCode) : '';
  const connectionGuide = isRealtime ? getConnectionGuideText() : '';
  const addBotBlocked = isRealtime && !state.network.isHost;
  const groupedPlayers = orderedDeviceList;
  const defaultStatusDetail = isRealtime
    ? (typeof getIdleRealtimeStatusDetail === 'function'
      ? getIdleRealtimeStatusDetail(state.network.isHost)
      : (state.network.isHost ? 'Press Host Game to open this room.' : 'Enter room code, then press Join Game.'))
    : '';
  const statusDetail = state.network.statusDetail || defaultStatusDetail;
  const myDevicePlayers = state.players.filter(player => (player.deviceId || state.network.deviceId) === state.network.deviceId);
  const botRoster = state.bots;
  const showNarratorControls = !joinOnlyPage && !connectedJoinClient;
  const backAction = fixedMultiPage ? 'goToMultiEntryPage()' : 'goToSetup()';
  const backLabel = '← Back';
  const roomServiceStarter = typeof getRoomServiceStarterLinks === 'function'
    ? getRoomServiceStarterLinks()
    : null;
  const showRoomServiceStarter = !isJoinPanel
    && !connectedJoinClient
    && typeof shouldShowRoomServiceStarter === 'function'
    && shouldShowRoomServiceStarter();

  return `
    <div class="container wide">
      <div class="header-bar">
        <button class="btn btn-secondary btn-small" onclick="${backAction}">${backLabel}</button>
        <div class="header-actions">
          <button class="btn-icon btn-primary" onclick="showInstructions()">?</button>
          <button class="btn-icon btn-secondary" onclick="showSettings()">⚙️</button>
        </div>
      </div>
      <h2 style="color:var(--red-accent)">Multiplayer Lobby</h2>
      ${showNarratorControls ? renderNarratorQuickControls() : ''}

      ${connectedJoinClient ? '' : `
      <div class="card">
        <div class="section-label">🛰️ Multiplayer Mode</div>
        ${fixedMultiPage ? '' : `
          <div class="mode-switch-row">
            <button class="btn btn-small ${!isRealtime ? 'btn-primary' : 'btn-secondary'}" onclick="setMultiplayerMode('passplay')">Single-device</button>
            <button class="btn btn-small ${isRealtime ? 'btn-primary' : 'btn-secondary'}" onclick="setMultiplayerMode('realtime')">Multi-device</button>
          </div>
        `}
        ${isRealtime ? `
          ${fixedMultiPage ? '' : `
            <div class="mode-switch-row" style="margin:6px 0 10px">
              <button class="btn btn-small ${!isJoinPanel ? 'btn-primary' : 'btn-secondary'}" onclick="setRealtimePanelMode('host')">Host Game</button>
              <button class="btn btn-small ${isJoinPanel ? 'btn-primary' : 'btn-secondary'}" onclick="setRealtimePanelMode('join')">Join Game</button>
            </div>
          `}
          <div class="realtime-meta">
            <div class="realtime-row">
              <div class="realtime-status-line">Connection: <span style="color:${realtimeStatusColor}">${realtimeStatusLabel}</span></div>
              <div class="realtime-status-line">${statusDetail}</div>
            </div>
            ${isJoinPanel ? `
              <div class="realtime-row">
                <label>Join code</label>
                <input id="joinCodeInput" type="text" class="input join-code-input" value="${joinCodeValue}" oninput="setJoinCodeInput(this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();connectAsJoiner();}" maxlength="8" spellcheck="false" placeholder="Enter code" ${joinCodeLocked ? 'readonly' : ''}/>
              </div>
              <div class="multiplayer-action-row">
                <button class="btn btn-small btn-primary" onclick="connectAsJoiner()" ${state.network.connected ? 'disabled' : ''}>${state.network.connected ? 'Joined' : 'Join Game'}</button>
                <button class="btn btn-small btn-secondary" onclick="disconnectRealtime()" ${!state.network.connected ? 'disabled' : ''}>Disconnect</button>
              </div>
              ${joinCodeLocked ? `<div class="footnote" style="margin-top:8px">Connected to room <strong>${state.gameCode}</strong>. Disconnect to enter a different code.</div>` : ''}
            ` : `
              <div class="realtime-row">
                <label>Room code</label>
                <div class="input-row">
                  <input type="text" class="input" readonly value="${state.gameCode}"/>
                  <button class="copy-btn" id="copyRoomCodeBtn" onclick="copyRoomCode()">📋 Copy</button>
                  <button class="btn btn-secondary btn-small" onclick="showBigRoomCode()">Show Large</button>
                </div>
                <div class="portal-copy-row">
                  <label>Join portal URL</label>
                  <div class="input-row">
                    <input type="text" class="input" readonly value="${joinPortal || 'Available after room service starts'}"/>
                    <button class="copy-btn" id="copyPortalBtn" onclick="copyJoinPortal()">📋 Copy</button>
                  </div>
                </div>
              </div>
              <div class="multiplayer-action-row host-action-row">
                <button class="btn btn-primary btn-lg host-action-btn" onclick="connectAsHost()" ${state.network.connected ? 'disabled' : ''}>Host Game</button>
                <button class="btn btn-secondary btn-lg host-action-btn" onclick="disconnectRealtime()" ${!state.network.connected ? 'disabled' : ''}>Disconnect</button>
              </div>
            `}
          </div>
        ` : `
          <div style="color:var(--text-primary);font-size:0.98rem">
            Single-device uses pass-and-play on one screen. No room codes or join links are needed.
          </div>
        `}
      </div>
      `}

      ${isRealtime && !isJoinPanel && !connectedJoinClient ? `
        <div class="card">
          <div class="section-label">🔗 Fast Join Link</div>
          <div class="realtime-row">
            <div class="input-row">
              <input type="text" class="input" readonly value="${shareJoinUrl || 'Available after room service starts'}"/>
              <button class="copy-btn" id="copyFastLinkBtn" onclick="copyLink()">📋 Copy</button>
            </div>
          </div>
          ${qrImageUrl ? `
            <div class="qr-copy-wrap">
              <div class="qr-touch-copy"
                   role="button"
                   tabindex="0"
                   aria-label="Copy room join link"
                   title="Click to copy"
                   onclick="copyQrShortcut()"
                   onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();copyQrShortcut();}"
                   style="background-image:url('${qrImageUrl}')"></div>
            </div>
          ` : ''}
          <div class="footnote" style="margin-top:10px;line-height:1.4">
            <strong>How to join:</strong> ${connectionGuide}
          </div>
        </div>
      ` : ''}

      ${showRoomServiceStarter && roomServiceStarter ? `
        <div class="card">
          <div class="section-label">Room Service Starter</div>
          <div class="support-copy">
            Room hosting needs a local room-service process. Use the starter once and it will open the local host page with hosting ready.
          </div>
          <div class="support-actions">
            <a class="btn btn-primary btn-full btn-lg" href="${roomServiceStarter.primary.url}" download>Download Room Service Starter</a>
            <a class="btn btn-secondary btn-full" href="${roomServiceStarter.secondary.url}" download>${roomServiceStarter.secondary.label}</a>
          </div>
          <div class="footnote" style="margin-top:10px;line-height:1.4">
            After it opens the local host page, press Host Game there and share the join link shown on that page.
          </div>
        </div>
      ` : ''}

      <div class="card">
        <div class="section-label">${isRealtime ? '📱 Your Device' : '👥 Players'}</div>
        ${isRealtime ? `
          ${state.network.isHost ? '<div class="host-device-banner">🛡️ Host device</div>' : ''}
          <div class="footnote" style="margin-bottom:8px">Rename your device here.</div>
          <input id="realtimeDeviceNameInput" type="text" class="device-name-inline" value="${state.network.deviceName.replace(/"/g, '&quot;')}" oninput="setRealtimeDeviceName(this.value)" onblur="commitRealtimeDeviceName()" maxlength="32"/>
          <div style="margin-top:10px;font-weight:600">Players on this device (${myDevicePlayers.length})</div>
          <div class="player-list" style="margin-top:8px">
            ${myDevicePlayers.map(player => `
              <div class="player-item draggable-row" draggable="true"
                   ondragstart="event.dataTransfer.setData('text/player-id','${player.id}');this.classList.add('dragging-row')"
                   ondragend="this.classList.remove('dragging-row')"
                   ondragover="event.preventDefault()"
                   ondrop="event.preventDefault();reorderPlayerByDrop(event.dataTransfer.getData('text/player-id'),'${player.id}')">
                <span class="player-name"><span class="drag-handle" title="Drag to reorder">☰</span> 👤 ${player.name}</span>
                <div class="player-item-actions">
                  <button class="remove-btn" onclick="removePlayer('${player.id}')" title="Remove player">×</button>
                </div>
              </div>
            `).join('')}
            ${myDevicePlayers.length === 0 ? '<div style="color:var(--text-primary);text-align:center;padding:10px">No players on this device yet.</div>' : ''}
          </div>
        ` : `
          <div class="player-list">
            ${state.players.map((p) => `
              <div class="player-item draggable-row" draggable="true"
                   ondragstart="event.dataTransfer.setData('text/player-id','${p.id}');this.classList.add('dragging-row')"
                   ondragend="this.classList.remove('dragging-row')"
                   ondragover="event.preventDefault()"
                   ondrop="event.preventDefault();reorderPlayerByDrop(event.dataTransfer.getData('text/player-id'),'${p.id}')">
                <span class="player-name"><span class="drag-handle" title="Drag to reorder">☰</span> 👤 ${p.name}</span>
                <div class="player-item-actions">
                  <button class="remove-btn" onclick="removePlayer('${p.id}')" title="Remove player">×</button>
                </div>
              </div>
            `).join('')}
            ${state.players.length === 0 ? '<div style="color:var(--text-primary);text-align:center;padding:12px">No players yet</div>' : ''}
          </div>
        `}
        <div class="input-row">
          <input type="text" class="input ${state.nameError ? 'input-error' : ''}" id="newPlayerInput" placeholder="Add player name..."/>
          <button class="btn btn-primary btn-small" onclick="addPlayerFromInput()">Add</button>
        </div>
        ${state.nameError ? `<div class="error-msg">${state.nameError}</div>` : ''}
      </div>

      ${isRealtime ? `
        <div class="card">
          <div class="section-label">🧩 Devices and Players</div>
          <div style="color:var(--text-primary);font-size:0.95rem;margin-bottom:10px">Players are grouped by device.</div>
          <div class="player-list">
            ${groupedPlayers.map(group => `
              <div class="device-player-group">
                <div class="device-group-title">
                  <span>${group.isHost ? '🛡️' : '📱'} ${group.deviceName}</span>
                  <span class="player-item-actions">
                    ${group.deviceId === state.network.deviceId ? '<span class="device-pill">This device</span>' : '<span class="device-pill">Online</span>'}
                    ${state.network.isHost && group.deviceId !== state.network.deviceId ? `<button class="remove-btn" onclick="removeDevice('${group.deviceId}')" title="Remove device">×</button>` : ''}
                  </span>
                </div>
                ${(group.players || []).map(player => `
                  <div class="player-item">
                    <span class="player-name">👤 ${player.name}</span>
                    <div class="player-item-actions">
                      ${state.network.isHost ? `<button class="remove-btn" onclick="removePlayer('${player.id}')" title="Remove player">×</button>` : ''}
                    </div>
                  </div>
                `).join('')}
                ${(group.players || []).length === 0 ? '<div style="color:var(--text-primary);font-size:0.9rem;padding:6px 0 2px 2px">No players on this device yet.</div>' : ''}
              </div>
            `).join('')}
            <div class="device-player-group bot-device-group">
              <div class="device-group-title">🤖 Bots</div>
              ${botRoster.map(bot => `
                <div class="player-item">
                  <span class="player-name">🤖 ${bot.name}</span>
                </div>
              `).join('')}
              ${botRoster.length === 0 ? '<div style="color:var(--text-primary);font-size:0.9rem;padding:6px 0 2px 2px">No bots added.</div>' : ''}
            </div>
          </div>
        </div>
      ` : ''}

      ${readonlySetupView ? `
        <div class="card">
          <div class="section-label">🤖 Bots (${state.bots.length})</div>
          <div style="color:var(--text-primary);font-size:0.95rem;margin-bottom:10px">Host controls bot setup.</div>
          <div class="bot-list">
            ${state.bots.map(bot => `
              <div class="player-item">
                <span class="player-name">🤖 ${bot.name}</span>
              </div>
            `).join('')}
            ${state.bots.length === 0 ? '<div style="color:var(--text-primary);text-align:center;padding:12px">No bots yet</div>' : ''}
          </div>
        </div>
        ${renderJoinReadonlySetup(allPlayers)}
      ` : `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <span class="section-label" style="margin-bottom:0">🤖 Bots (${state.bots.length})</span>
            <button class="btn btn-secondary btn-small" onclick="addBot()" ${(allPlayers.length >= 16 || addBotBlocked) ? 'disabled' : ''}>+ Add Bot</button>
          </div>
          ${addBotBlocked ? '<div class="footnote" style="margin-bottom:8px">Only the host can add or remove bots in multi-device mode.</div>' : ''}
          <div class="bot-list">
            ${state.bots.map(b => `
              <div class="player-item">
                <span class="player-name">🤖</span>
                <div class="player-item-actions" style="margin-left:auto">
                  <input type="text" class="input inline-edit" value="${b.name.replace(/"/g, '&quot;')}"
                         onblur="renameBot('${b.id}', this.value)"
                         onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}"
                         ${addBotBlocked ? 'disabled' : ''}/>
                  <button class="remove-btn" onclick="removeBot('${b.id}')" ${addBotBlocked ? 'disabled' : ''}>×</button>
                </div>
              </div>
            `).join('')}
            ${state.bots.length === 0 ? '<div style="color:var(--text-primary);text-align:center;padding:12px">No bots yet</div>' : ''}
          </div>
        </div>

        <div class="card">
          <div class="section-label">📖 Setting</div>
          <div class="grid-2">
            ${STORY_PRESETS.map(s => `
              <div class="story-card ${state.selectedStory.id === s.id ? 'selected' : ''}" onclick="selectStory('${s.id}')">
                <div class="story-name">${s.name}</div>
                <div class="story-intro">${s.intro}</div>
                <div class="story-setting">${s.setting}</div>
              </div>
            `).join('')}
          </div>
        </div>

        ${renderRoleConfig(allPlayers, total, warnings)}

        <button class="btn btn-danger btn-full btn-lg" onclick="startGame()" ${blockReason || waitingForHost ? 'disabled' : ''}>
          ${waitingForHost ? 'Waiting for Host to Start' : (blockReason || 'Start Game')}
        </button>
      `}
    </div>
    ${state.showInstructions ? renderInstructionsModal() : ''}
    ${state.showSettings ? renderSettingsModal() : ''}
    ${isRealtime && !isJoinPanel && state.showBigRoomCode ? renderBigRoomCodeModal() : ''}
  `;
}

function renderBigRoomCodeModal() {
  const joinPortal = getJoinPortalUrl();
  return `
    <div class="modal-overlay" onclick="hideBigRoomCode()">
      <div class="modal-content big-room-code-modal" onclick="event.stopPropagation()">
        <div style="color:var(--text-primary);font-size:0.96rem;margin-bottom:8px">Room code</div>
        <div class="big-room-code-value">${state.gameCode}</div>
        <div style="margin:10px 0 8px;font-weight:600">Join portal URL</div>
        <div class="input-row" style="margin-bottom:14px">
          <input type="text" class="input" readonly value="${joinPortal || 'Available after room service starts'}"/>
          <button class="copy-btn" id="copyPortalBtnLarge" onclick="copyJoinPortal('copyPortalBtnLarge')">📋 Copy</button>
        </div>
        <button class="btn btn-primary btn-full" onclick="hideBigRoomCode()">Close</button>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// ROLE CONFIG (shared)
// -----------------------------------------------------------------------------

function renderJoinReadonlySetup(allPlayers) {
  const story = state.selectedStory || STORY_PRESETS[0];
  const locations = Array.isArray(story?.locations) ? story.locations : [];
  const floorplan = story?.floorplan || {};
  const floors = Array.isArray(floorplan.floors) ? floorplan.floors : [];
  const primaryFloor = floors[0] || null;
  const connectionCount = Array.isArray(story?.mapGraph?.edges) ? story.mapGraph.edges.length : 0;
  const environmentProfile = ENVIRONMENT_PROFILES.find(profile => profile.id === state.settings.environmentProfile) || ENVIRONMENT_PROFILES[0];
  const signedPct = (value) => {
    const pct = Math.round((Number(value || 0)) * 100);
    if (pct === 0) return 'No change';
    return `${pct > 0 ? '+' : ''}${pct}%`;
  };
  const exposureValues = locations.map(location => clampExposure(location.exposure ?? 0.5));
  const minExposure = exposureValues.length ? getExposurePct(Math.min(...exposureValues)) : 0;
  const maxExposure = exposureValues.length ? getExposurePct(Math.max(...exposureValues)) : 0;
  const avgExposure = exposureValues.length
    ? getExposurePct(exposureValues.reduce((sum, value) => sum + value, 0) / exposureValues.length)
    : 0;
  const disturbanceValues = KILL_METHODS.map(method => clampExposure(method.noise ?? 0));
  const minDisturbance = disturbanceValues.length ? getExposurePct(Math.min(...disturbanceValues)) : 0;
  const maxDisturbance = disturbanceValues.length ? getExposurePct(Math.max(...disturbanceValues)) : 0;
  const cureDifficultyValues = KILL_METHODS.map(method => clampExposure(method.cureDifficulty ?? 0.6));
  const minCureDifficulty = cureDifficultyValues.length ? getExposurePct(Math.min(...cureDifficultyValues)) : 0;
  const maxCureDifficulty = cureDifficultyValues.length ? getExposurePct(Math.max(...cureDifficultyValues)) : 0;
  const preset = state.selectedPreset;
  const mafiaCount = state.roleConfig.mafia || 0;
  const doctorCount = state.roleConfig.doctor || 0;
  const detectiveCount = state.roleConfig.detective || 0;
  const villagerCount = Math.max(0, allPlayers.length - mafiaCount - doctorCount - detectiveCount);
  const assigned = mafiaCount + doctorCount + detectiveCount + villagerCount;

  return `
    <div class="card">
      <div class="section-label">📖 Selected Setting</div>
      <div class="setting-box" style="margin-bottom:12px">
        <div class="setting-name">${story.name}</div>
        <div class="setting-desc">${story.setting}</div>
      </div>
      <div style="color:var(--text-primary);font-size:0.95rem;line-height:1.45">
        <div><strong>Theme:</strong> ${story.mood}</div>
        <div><strong>Map scope:</strong> ${locations.length} playable locations in this setting.</div>
        <div><strong>Exposure range:</strong> ${minExposure}% to ${maxExposure}% (average ${avgExposure}%). Higher exposure gives better clue quality but raises witness/risk pressure.</div>
        <div><strong>Disturbance range:</strong> ${minDisturbance}% to ${maxDisturbance}%. Louder attacks increase witness likelihood during night resolution.</div>
        <div><strong>Doctor difficulty:</strong> cure difficulty spans ${minCureDifficulty}% to ${maxCureDifficulty}%. Harder methods reduce stabilization odds.</div>
      </div>
    </div>
    <div class="card">
      <div class="section-label">🗺️ Map Snapshot</div>
      <div class="setting-box" style="margin-bottom:12px">
        <div class="setting-name">${primaryFloor?.name || 'Map overview'}</div>
        <div class="setting-desc">
          ${primaryFloor
            ? 'Top floorplan preview for this setting. Full map and room notes are available from the map button during gameplay.'
            : 'No floorplan image is available yet for this setting.'}
        </div>
      </div>
      ${primaryFloor?.image
        ? `<img src="${primaryFloor.image}" alt="${story.name} map preview" class="readonly-map-preview"/>`
        : '<div class="readonly-map-missing">No map image available.</div>'}
      <div class="readonly-map-meta">
        <div><strong>Floors:</strong> ${floors.length}</div>
        <div><strong>Rooms:</strong> ${locations.length}</div>
        <div><strong>Connections:</strong> ${connectionCount}</div>
      </div>
    </div>
    <div class="card">
      <div class="section-label">🌡️ Selected Environment Rules</div>
      <div class="setting-box" style="margin-bottom:12px">
        <div class="setting-name">${environmentProfile.name}</div>
        <div class="setting-desc">${environmentProfile.desc}</div>
      </div>
      <div style="color:var(--text-primary);font-size:0.95rem;line-height:1.45">
        <div><strong>Exposure impact:</strong> ${signedPct((environmentProfile.exposureMultiplier || 1) - 1)} to player exposure checks.</div>
        <div><strong>Disturbance impact:</strong> ${signedPct((environmentProfile.disturbanceMultiplier || 1) - 1)} to night attack disturbance.</div>
        <div><strong>Doctor save impact:</strong> ${signedPct(-(environmentProfile.cureDifficultyShift || 0))} effective save pressure shift.</div>
      </div>
    </div>
    ${preset ? `
      <div class="card">
        <div class="section-label">🎛️ Selected Preset</div>
        <div class="preset-card selected" style="border-color:${preset.color};background:${preset.color}20;cursor:default">
          <div class="preset-name" style="color:${preset.color}">${preset.name}</div>
          <div class="preset-desc">${preset.description}</div>
        </div>
      </div>
    ` : ''}
    <div class="card">
      <div class="section-label">⚖️ Role Counts (Read-only)</div>
      <div style="border-top:1px solid var(--border-color);padding-top:12px">
        <div class="role-row">
          <div class="role-info"><span>${ROLES.mafia.icon}</span><span>${ROLES.mafia.name}</span></div>
          <div class="role-count">${mafiaCount}</div>
        </div>
        <div class="role-row">
          <div class="role-info"><span>${ROLES.doctor.icon}</span><span>${ROLES.doctor.name}</span></div>
          <div class="role-count">${doctorCount}</div>
        </div>
        <div class="role-row">
          <div class="role-info"><span>${ROLES.detective.icon}</span><span>${ROLES.detective.name}</span></div>
          <div class="role-count">${detectiveCount}</div>
        </div>
        <div class="role-row">
          <div class="role-info"><span>${ROLES.villager.icon}</span><span>${getRoleDisplayName('villager')}s</span></div>
          <div class="role-count">${villagerCount}</div>
        </div>
      </div>
      <div class="role-summary">
        <span class="stat-display">Assigned: ${assigned}/${allPlayers.length}</span>
      </div>
      <div style="color:var(--text-primary);font-size:0.93rem;margin-top:10px">Host controls setup changes and starts the game.</div>
    </div>
  `;
}

function renderRoleConfig(allPlayers, total, warnings) {
  return `
    <div class="card">
      <div class="section-label">⚖️ Role Balance</div>
      <div style="color:var(--text-secondary);font-size:0.84rem;margin:-4px 0 12px">Role presets only adjust role counts. Story atmosphere and other behavior settings are configured separately.</div>
      <div class="grid-2" style="margin-bottom:16px">
        ${ROLE_PRESETS.map(p => `
          <div class="preset-card ${state.selectedPreset?.id === p.id ? 'selected' : ''}"
               style="${state.selectedPreset?.id === p.id ? `border-color:${p.color};background:${p.color}20` : ''}"
               onclick="selectPreset('${p.id}')">
            <div class="preset-name" style="color:${p.color}">${p.name}</div>
            <div class="preset-desc">${p.description}</div>
          </div>
        `).join('')}
      </div>
      <div style="border-top:1px solid var(--border-color);padding-top:12px">
        ${['mafia', 'doctor', 'detective'].map(r => `
          <div class="role-row">
            <div class="role-info">
              <span>${ROLES[r].icon}</span>
              <span>${ROLES[r].name}</span>
            </div>
            <div class="role-controls">
              <button class="btn btn-secondary btn-adjust" onclick="adjustRole('${r}',-1)" ${state.roleConfig[r] <= 0 ? 'disabled' : ''}>−</button>
              <span class="role-count">${state.roleConfig[r] || 0}</span>
              <button class="btn btn-secondary btn-adjust" onclick="adjustRole('${r}',1)" ${isPlusDisabled(r) ? 'disabled' : ''}>+</button>
            </div>
          </div>
        `).join('')}
        <div class="role-summary">
          <span class="stat-display">👤 ${getRoleDisplayName('villager')}s: ${Math.max(0, allPlayers.length - state.roleConfig.mafia - state.roleConfig.doctor - state.roleConfig.detective)}</span>
          <span class="stat-display">Assigned: ${total}/${allPlayers.length}</span>
        </div>
        ${warnings.length > 0 ? `<div class="warning-msg">${warnings.join(' ')}</div>` : ''}
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// GAME SCREEN
// -----------------------------------------------------------------------------

function renderGame() {
  const allPlayers = getAllPlayers();
  const alivePlayers = getAlivePlayers();
  const current = getCurrentPlayer();
  const showCornerChat = isMultiDeviceChatEnabled() && state.gamePhase !== 'gameover';
  const narratorCue = state.settings.narratorMode === 'human' ? getNarratorPhasePrompt(state.gamePhase) : '';
  const currentDeviceId = current?.deviceId || state.network.deviceId;
  const currentDeviceName = current?.deviceName || state.network.deviceName || 'Host device';
  const showDeviceTurnBanner = isMultiDeviceChatEnabled()
    && current
    && !['announcement', 'vote_announcement', 'gameover'].includes(state.gamePhase);
  const myDeviceTurn = currentDeviceId === state.network.deviceId;

  const phaseColors = {
    reveal: '#a855f7',
    day: '#eab308',
    night: '#6366f1',
    morning_doctor: '#f97316',
    announcement: '#ef4444',
    discussion: '#f97316',
    vote: '#eab308',
    vote_announcement: '#ef4444',
    gameover: '#ef4444'
  };

  const phaseLabels = {
    reveal: 'ROLE REVEAL',
    day: 'DAY',
    night: 'NIGHT',
    morning_doctor: 'MORNING',
    announcement: 'NEWS',
    discussion: 'DISCUSSION',
    vote: 'VOTE',
    vote_announcement: 'VERDICT',
    gameover: 'GAME OVER'
  };

  let content = '';
  const narratorTurnBlocking = typeof narratorTurnIsActive === 'function'
    ? narratorTurnIsActive(state.gamePhase)
    : false;

  if (narratorTurnBlocking) {
    const deliveryNote = isMultiDeviceChatEnabled()
      ? 'Narrator first turn: post this cue in chat, then continue.'
      : 'Narrator first turn: read this cue aloud, then continue.';
    content = `
      <div class="card narrator-turn-card">
        <div class="narrator-turn-title">🎙️ Narrator Turn</div>
        <div class="narrator-turn-text">${narratorCue || getNarratorPhasePrompt(state.gamePhase)}</div>
        <div class="narrator-turn-note">${deliveryNote}</div>
        <button class="btn btn-warning btn-lg" style="margin-top:12px" onclick="completeNarratorTurn()">Continue to Player Turns</button>
      </div>
    `;
  } else {
    // Announcement modal
    if ((state.gamePhase === 'announcement' || state.gamePhase === 'vote_announcement') && state.announcement) {
      content = `
        <div class="modal-overlay">
          <div class="modal-content">
            ${renderDeathAnimationCard()}
            <div class="modal-text">${state.announcement}</div>
            <button class="btn btn-danger btn-lg" onclick="${state.gamePhase === 'announcement' ? 'afterAnnouncement' : 'afterVoteAnnouncement'}()">Continue</button>
          </div>
        </div>
      `;
    }

    // Game over
    if (state.gamePhase === 'gameover') {
      // Build the final death message
      let finalDeathMessage = '';
      if (state.finalDeath) {
        if (state.finalDeath.type === 'night') {
          if (state.finalDeath.saved) {
            finalDeathMessage = `${state.finalDeath.victim} was attacked but saved by the Doctor.${state.finalDeath.method ? ` Attack method: ${state.finalDeath.method}.` : ''}`;
          } else if (state.finalDeath.victim) {
            finalDeathMessage = `${state.finalDeath.victim} (${state.finalDeath.role}) was killed during the night.${state.finalDeath.method ? ` Method: ${state.finalDeath.method}.` : ''}`;
          } else {
            finalDeathMessage = 'The night passed peacefully.';
          }
        } else if (state.finalDeath.type === 'vote') {
          if (state.finalDeath.victim) {
            finalDeathMessage = `${state.finalDeath.victim} (${state.finalDeath.role}) was eliminated by vote.`;
          } else {
            finalDeathMessage = 'The vote was tied. No one was eliminated.';
          }
        }
      }

      content = `
        <div class="gameover-container card">
          <div class="gameover-icon">${state.winner === 'town' ? '🎉' : '💀'}</div>
          <div class="gameover-title">${state.winner === 'town' ? 'Town Wins!' : 'Mafia Wins!'}</div>
          ${finalDeathMessage ? `
            <div class="gameover-death" style="color:var(--text-secondary);margin-bottom:12px;font-size:0.95rem">
              ${finalDeathMessage}
            </div>
          ` : ''}
          ${state.winReason ? `
            <div class="gameover-reason" style="color:${state.winner === 'town' ? '#4ade80' : '#f87171'};margin-bottom:16px;font-weight:500;text-align:center;padding:12px;background:rgba(0,0,0,0.2);border-radius:8px">
              ${state.winReason}
            </div>
          ` : ''}
          <div class="gameover-roles">
            ${allPlayers.map(p => `
              <span class="gameover-role" style="background:${ROLES[p.role]?.color}40">${ROLES[p.role]?.icon} ${p.name}</span>
            `).join('')}
          </div>
          <button class="btn btn-primary btn-lg" onclick="newGame()">New Game</button>
        </div>
      `;
    }

    // Phase-specific content
    if (state.gamePhase === 'reveal') content = renderRevealPhase(current);
    if (state.gamePhase === 'day') content = renderDayPhase(current, allPlayers);
    if (state.gamePhase === 'night') content = renderNightPhase(current, alivePlayers);
    if (state.gamePhase === 'morning_doctor') content = renderDoctorPhase(alivePlayers);
    if (state.gamePhase === 'discussion') content = renderDiscussionPhase(current);
    if (state.gamePhase === 'vote') content = renderVotePhase(current, alivePlayers);
  }

  return `
    <div class="container wide">
      <div class="header-bar" style="margin-bottom:8px">
        <span></span>
        <div class="header-actions">
          <button class="btn-icon btn-secondary" onclick="toggleMap()" title="Open map">🗺️</button>
          <button class="btn-icon btn-primary" onclick="showInstructions()">?</button>
        </div>
      </div>
      <div class="phase-header">
        <div class="phase-title" style="color:${phaseColors[state.gamePhase]}">${phaseLabels[state.gamePhase]}</div>
        ${!['reveal', 'gameover', 'announcement', 'vote_announcement'].includes(state.gamePhase)
          ? `<div class="phase-subtitle">Round ${state.dayNumber}</div>`
          : ''}
      </div>

      ${renderNarratorQuickControls()}

      ${showDeviceTurnBanner ? `
        <div class="device-turn-banner ${myDeviceTurn ? 'device-turn-local' : 'device-turn-remote'}">
          ${myDeviceTurn ? `Your device (${currentDeviceName}) is going now.` : `${currentDeviceName} is going now.`}
        </div>
      ` : ''}

      <div class="role-counter">
        ${Object.keys(ROLES).map(r => {
          const alive = alivePlayers.filter(p => p.role === r).length;
          const dead = allPlayers.filter(p => p.role === r && !p.alive).length;
          if (alive + dead === 0) return '';
          return `
            <div class="role-counter-item">
              <span>${ROLES[r].icon}</span>
              <span class="alive-count">${alive}</span>
              ${dead > 0 ? `<span class="dead-count">+${dead}☠</span>` : ''}
            </div>
          `;
        }).join('')}
      </div>

      ${!['gameover', 'announcement', 'vote_announcement'].includes(state.gamePhase) ? `
        <div class="setting-box">
          <div class="setting-name">📍 ${state.selectedStory.name}</div>
          <div class="setting-desc">${state.selectedStory.setting}</div>
        </div>
      ` : ''}

      ${state.narrative && !['announcement', 'vote_announcement'].includes(state.gamePhase) ? `
        <div class="narrative-box">
          <p class="narrative-text">${state.narrative}</p>
        </div>
      ` : ''}

      ${state.settings.narratorMode === 'human' ? renderNarratorConsole(allPlayers, alivePlayers) : ''}

      <div class="player-grid">
        ${allPlayers.map(p => `
          <div class="player-cell ${p.alive ? '' : 'dead'} ${current?.id === p.id && state.showRole ? 'current' : ''}">
            <div class="player-cell-icon">${p.alive ? (p.isBot ? '🤖' : '👤') : '💀'}</div>
            <div class="player-cell-name">${p.name}</div>
            ${!p.alive ? `<div style="color:var(--text-secondary);font-size:0.75rem">${ROLES[p.role]?.icon}</div>` : ''}
          </div>
        `).join('')}
      </div>

      ${content}
    </div>
    ${state.showMap ? renderMapModal() : ''}
    ${showCornerChat ? renderMultiDeviceChatPanel({ prominent: true, corner: true }) : ''}
  `;
}

function renderMapModal() {
  const graph = state.selectedStory?.mapGraph || { nodes: [], edges: [] };
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const nodesById = Object.fromEntries(nodes.map(node => [node.id, node]));
  const floorplan = state.selectedStory?.floorplan || {};
  const floors = Array.isArray(floorplan.floors) ? floorplan.floors : [];
  const exposureByNodeId = Object.fromEntries((state.selectedStory.locations || []).map(location => [location.id, location.exposure || 0.5]));
  const activeFloor = floors.find(floor => floor.id === state.selectedMapFloor) || floors[0] || null;
  const roomItems = Array.isArray(activeFloor?.rooms) ? activeFloor.rooms : [];
  const roomNodeIds = new Set(roomItems.map(room => room.nodeId));
  const roomCards = [...roomItems]
    .map(room => {
      const node = nodesById[room.nodeId] || { id: room.nodeId, name: room.nodeId, type: 'room' };
      const exposure = exposureByNodeId[room.nodeId] ?? 0.5;
      return {
        ...room,
        node,
        exposure
      };
    })
    .sort((a, b) => (a.exposure || 0) - (b.exposure || 0));

  const connectionNotes = (floorplan.connectionNotes || [])
    .filter(note => roomNodeIds.has(note.from) || roomNodeIds.has(note.to))
    .map(note => {
      const fromName = nodesById[note.from]?.name || note.from;
      const toName = nodesById[note.to]?.name || note.to;
      return {
        title: `${fromName} ↔ ${toName}`,
        note: note.note || ''
      };
    });

  const fallbackCards = nodes
    .map(node => ({
      node,
      exposure: exposureByNodeId[node.id] ?? 0.5,
      note: 'Floorplan note pending for this node.'
    }))
    .sort((a, b) => (a.exposure || 0) - (b.exposure || 0));
  const displayCards = roomCards.length > 0 ? roomCards : fallbackCards;
  const activeTitle = activeFloor?.name || 'Map';

  return `
    <div class="modal-overlay" onclick="closeMap()">
      <div class="map-modal" onclick="event.stopPropagation()">
        <div class="map-modal-header">
          <div>
            <div class="section-label" style="margin-bottom:4px">🗺️ ${state.selectedStory.name} Floorplan</div>
            <div style="color:var(--text-secondary);font-size:0.86rem">Exposure = your exposure to information and threats.</div>
          </div>
          <button class="btn btn-secondary btn-small" onclick="closeMap()">Close</button>
        </div>

        ${floors.length > 0 ? `
          <div class="floorplan-tabs">
            ${floors.map(floor => `
              <button class="btn btn-small ${activeFloor?.id === floor.id ? 'btn-primary' : 'btn-secondary'}"
                      onclick="setMapFloor('${floor.id}')">
                ${floor.name}
              </button>
            `).join('')}
          </div>
        ` : ''}

        <div class="floorplan-layout">
          <div class="floorplan-image-card">
            <div class="floorplan-image-label">${activeTitle}</div>
            ${activeFloor?.image
              ? `<img src="${activeFloor.image}" alt="${activeTitle} floorplan" class="floorplan-image"/>`
              : '<div class="floorplan-image-missing">No floorplan image available for this floor.</div>'}
          </div>
          <div class="floorplan-room-column">
            <div class="floorplan-room-title">Room Notes</div>
            ${displayCards.map(item => `
              <div class="floorplan-room-card">
                <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
                  <span class="map-node-name">${item.node.name}</span>
                  <span class="exposure-badge" style="color:${getExposureColor(item.exposure || 0)};border-color:${getExposureColor(item.exposure || 0)}">
                    Exposure ${getExposurePct(item.exposure || 0)}%
                  </span>
                </div>
                <div class="map-node-type">${item.node.type.replace(/_/g, ' ')}</div>
                <div class="floorplan-room-note">${item.note || 'No additional room note.'}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="floorplan-connections">
          <div class="floorplan-room-title">Connection Notes</div>
          ${connectionNotes.length > 0 ? connectionNotes.map(connection => `
            <div class="floorplan-connection-item">
              <strong>${connection.title}</strong>
              <div>${connection.note || 'Connection exists in the route graph.'}</div>
            </div>
          `).join('') : '<div class=\"floorplan-connection-item\">No cross-room notes listed for this floor.</div>'}
        </div>
      </div>
    </div>
  `;
}

function renderDeathAnimationCard() {
  if (!state.settings.deathAnimations || !state.deathAnimation) return '';

  const phaseLabel = state.deathAnimation.phase === 'vote' ? 'the vote' : 'the night';
  return `
    <div class="death-animation-card" data-death-animation="${state.deathAnimation.id}">
      <div class="death-animation-icon">💀</div>
      <div class="death-animation-title">${state.deathAnimation.victimName} was lost during ${phaseLabel}.</div>
      <div class="death-animation-subtitle">Role revealed: ${state.deathAnimation.roleName}</div>
    </div>
  `;
}

function renderNarratorConsole(allPlayers, alivePlayers) {
  const aliveCount = alivePlayers.length;
  const deadCount = allPlayers.length - aliveCount;
  const plannedCount = Object.keys(state.nightPlans || {}).length;
  const votesCast = Object.keys(state.votes || {}).length;
  const recentNarration = (state.narrationLog || []).slice(-4).reverse();

  return `
    <div class="card narrator-panel">
      <div class="narrator-title">🎙️ Human Narrator Console (No Secret Roles)</div>
      <div class="narrator-grid">
        <div><strong>Day:</strong> ${state.dayNumber}</div>
        <div><strong>Phase:</strong> ${state.gamePhase.replace('_', ' ')}</div>
        <div><strong>Alive:</strong> ${aliveCount}</div>
        <div><strong>Dead:</strong> ${deadCount}</div>
        <div><strong>Plans Locked:</strong> ${plannedCount}</div>
        <div><strong>Votes Cast:</strong> ${votesCast}</div>
      </div>
      <div class="narrator-feed">
        ${recentNarration.length === 0 ? `
          <div class="narrator-feed-item">No narrator updates yet.</div>
        ` : recentNarration.map(item => `
          <div class="narrator-feed-item">
            <span class="narrator-feed-phase">Day ${item.day} • ${item.phase.replace('_', ' ')}</span>
            <span>${item.text}</span>
          </div>
        `).join('')}
      </div>
      <div class="narrator-note">
        This panel is safe for moderation: it avoids role identities and team secrets.
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// PHASE RENDERERS
// -----------------------------------------------------------------------------

function renderRevealPhase(current) {
  if (!current) return '';

  if (current.isBot) {
    scheduleAutoAdvance(`reveal_${current.id}`, 'nextReveal');
    return `
      <div class="card" style="text-align:center">
        <div style="color:var(--text-secondary);margin-bottom:12px">🤖 ${current.name} is reviewing their role ${renderThinkingDots()}</div>
        <div style="color:var(--text-secondary);font-size:0.9rem">Continuing in ~${state.botDelayMs}ms</div>
      </div>
    `;
  }
  clearAutoAdvance();

  // In solo mode, skip the turn prompt - go straight to role reveal
  if (!state.showRole && !isSoloMode()) {
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:8px">📲 Pass to <strong>${current.name}</strong></div>
        <p style="color:var(--text-secondary);margin-bottom:16px">Only ${current.name} should look at this screen.</p>
        <button class="btn btn-primary btn-lg" onclick="showCurrentRole()">Reveal My Role</button>
      </div>
    `;
  }

  // In solo mode, auto-show the role
  if (!state.showRole && isSoloMode()) {
    state.showRole = true;
  }

  const teammates = current.role === 'mafia'
    ? getAllPlayers().filter(p => p.role === 'mafia' && p.id !== current.id)
    : [];

  return `
    <div class="card role-reveal">
      <div class="role-icon">${ROLES[current.role]?.icon}</div>
      <div class="role-name" style="color:${ROLES[current.role]?.color}">${ROLES[current.role]?.name}</div>
      <div class="role-desc">${ROLES[current.role]?.description}</div>
      ${teammates.length > 0 ? `
        <div class="teammates-box">
          <div class="teammates-label">Your allies:</div>
          <div>${teammates.map(t => t.name).join(', ')}</div>
        </div>
      ` : ''}
      <button class="btn btn-primary btn-lg" onclick="nextReveal()">Got it!</button>
    </div>
  `;
}

function renderDayPhase(current, allPlayers) {
  if (!current) return '';

  if (current.isBot) {
    scheduleAutoAdvance(`day_${current.id}_${state.dayNumber}`, 'skipBotDay');
    return `
      <div class="card" style="text-align:center">
        <div style="color:var(--text-secondary);margin-bottom:12px">🤖 ${current.name} is planning ${renderThinkingDots()}</div>
        <div style="color:var(--text-secondary);font-size:0.9rem">Continuing in ~${state.botDelayMs}ms</div>
      </div>
    `;
  }
  clearAutoAdvance();

  // In solo mode, skip the turn prompt - go straight to planning
  if (!state.showRole && !isSoloMode()) {
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:8px">📲 Pass to <strong>${current.name}</strong></div>
        <p style="color:var(--text-secondary);margin-bottom:16px">Plan privately before passing again.</p>
        <button class="btn btn-warning btn-lg" onclick="showCurrentRole()">Plan My Night</button>
      </div>
    `;
  }

  const isMafia = current.role === 'mafia';
  const location = getLocationById(state.selectedLocation);
  const actions = getAvailableActionsForPlayer(current, location);
  const targetCandidates = allPlayers.filter(player =>
    player.alive
    && player.id !== current.id
    && (isMafia ? player.role !== 'mafia' : true)
  );

  const sortedLocations = [...state.selectedStory.locations].sort((x, y) => (x.exposure || 0) - (y.exposure || 0));
  const actionNeedsTarget = Boolean(state.selectedAction?.requiresTarget);
  const canConfirm = Boolean(
    state.selectedLocation
      && state.selectedAction
      && (!actionNeedsTarget || state.selectedActionTarget)
  );

  return `
    <div class="card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <span style="color:${ROLES[current.role]?.color}">${ROLES[current.role]?.icon}</span>
        <span>${current.name}</span>
      </div>

      <div class="section-label">1. Where will you be tonight?</div>
      <div style="color:var(--text-secondary);font-size:0.84rem;margin-bottom:10px">
        ${isMafia
          ? 'Risk reflects how exposed your route is to witnesses.'
          : 'Exposure means your exposure to information and threats.'}
      </div>
      <div class="location-grid">
        ${sortedLocations.map(l => `
            <div class="location-card ${state.selectedLocation === l.id ? 'selected' : ''}" onclick="selectLocation('${l.id}')">
              <div class="location-header">
                <span class="location-name">${l.name}</span>
                <span class="exposure-badge" style="color:${getExposureColor(l.exposure || 0)};border-color:${getExposureColor(l.exposure || 0)}">
                  ${isMafia ? 'Risk' : 'Exposure'} ${getExposurePct(l.exposure || 0)}%
                </span>
              </div>
              <span style="font-size:0.8rem;color:var(--text-secondary)">${(l.tags || []).join(' • ') || l.nodeType || ''}</span>
            </div>
          `).join('')}
      </div>

      ${location ? `
        <div class="section-label">
          ${isMafia ? '2. Route options (low risk → high risk)' : '2. Choose your action (low exposure → high exposure)'}
        </div>
        ${!isMafia ? '<div style="color:#fde68a;font-size:0.84rem;margin-bottom:8px">Tip: actions tagged "Snoop" are the quickest way to gather stronger clues.</div>' : ''}
        <div class="action-list">
          ${[...actions].sort((a, b) => (a.exposure || 0) - (b.exposure || 0)).map(ac => `
            <div class="action-card ${state.selectedAction?.id === ac.id ? 'selected' : ''}" onclick="selectAction('${ac.id}')">
              <div class="action-header">
                <span class="action-name">${ac.name} ${ac.kind === 'snoop' ? '<span class="action-tag">Snoop</span>' : ''}</span>
                <div class="action-stats">
                  <span class="exposure-chip" style="color:${getExposureColor(ac.exposure || 0)};border-color:${getExposureColor(ac.exposure || 0)}">
                    ${isMafia ? 'Risk' : 'Exposure'} ${getExposurePct(ac.exposure || 0)}%
                  </span>
                </div>
              </div>
              <div class="action-desc">${ac.desc}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${location && state.selectedAction && actionNeedsTarget ? `
        <div class="section-label">3. Who are you tracking?</div>
        <div class="target-grid">
          ${targetCandidates.map(player => `
            <button class="target-btn ${state.selectedActionTarget === player.id ? 'selected' : ''}"
                    onclick="selectActionTarget('${player.id}')">
              ${player.isBot ? '🤖 ' : '👤 '}${player.name}
            </button>
          `).join('')}
        </div>
      ` : ''}

      ${current.role === 'detective' ? `
        <div class="card detective-lock-note">
          <strong>Detective rule:</strong> detectives are always alert and never fully doze off, so they stay stealthier than most roles.
        </div>
      ` : ''}

      <button class="btn btn-primary btn-full btn-lg" onclick="confirmDayPlan()" ${!canConfirm ? 'disabled' : ''}>
        ${isMafia ? 'Confirm Route' : 'Confirm Plan'}
      </button>
    </div>
  `;
}

function renderNightPhase(current, alivePlayers) {
  if (!current) {
    return `
      <div class="card" style="text-align:center">
        <button class="btn btn-secondary" onclick="processNight()">Continue</button>
      </div>
    `;
  }

  const nightActors = getNightActors(alivePlayers);
  const isNightActor = nightActors.some(actor => actor.id === current.id);

  if (current.isBot || !isNightActor) {
    scheduleAutoAdvance(`night_${current.id}_${state.currentPlayerIndex}`, 'continueNight');
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:8px">🌙 Night falls...</div>
        <div style="color:var(--text-secondary);margin-bottom:16px">
          ${current.role === 'mafia' ? 'The shadows move...' : 'Everyone stays alert through the night.'}
        </div>
        <div style="color:var(--text-secondary);font-size:0.9rem">Continuing ${renderThinkingDots()}</div>
      </div>
    `;
  }
  clearAutoAdvance();

  // In solo mode, skip the turn prompt.
  if (!state.showRole && !isSoloMode()) {
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:8px">📲 Pass to <strong>${current.name}</strong></div>
        <p style="color:var(--text-secondary);margin-bottom:16px">Night action is private.</p>
        <button class="btn btn-warning btn-lg" onclick="showCurrentRole()">Open Night Console</button>
      </div>
    `;
  }

  if (current.role === 'mafia') {
    const mafiaView = getVisibleTargetsForMafia(current.id, alivePlayers);
    const targets = mafiaView.targets || [];
    const visionNote = mafiaView.mode === 'nearby'
      ? 'Visible targets are currently near your area.'
      : 'No nearby targets were visible, so your search widened across the map.';
    const snooperIntel = state.mafiaSnooperIntel[current.id] || {};
    const briefing = state.mafiaBriefing[current.id] || [];
    const sortedMethods = [...KILL_METHODS].sort((a, b) => (a.noise || 0) - (b.noise || 0));

    return `
      <div class="card">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
          <span style="color:${ROLES.mafia.color}">${ROLES.mafia.icon}</span>
          <span>${current.name}</span>
          <span style="font-size:0.85rem;color:var(--text-secondary)">(Night strike)</span>
        </div>

        <div class="section-label">🎯 Choose your target</div>
        <div class="mafia-intel">
          <div class="mafia-intel-header">Night visibility</div>
          <div style="font-size:0.95rem;color:#e2e8f0">${visionNote}</div>
          ${briefing.map(line => `<div style="font-size:0.84rem;color:#e2e8f0;margin-top:5px">• ${line}</div>`).join('')}
        </div>

        ${targets.length > 0 ? `
        <div class="target-list">
          ${targets.map(p => {
            const plan = state.nightPlans[p.id];
            const snoopers = snooperIntel[p.id] || [];
            const trackedTargetName = plan?.actionTarget
              ? getAllPlayers().find(player => player.id === plan.actionTarget)?.name
              : null;
            return `
              <div class="target-card ${state.selectedTarget === p.id ? 'selected' : ''}" onclick="selectTarget('${p.id}')">
                <div class="target-info">
                  <div class="target-name">${p.isBot ? '🤖' : '👤'} ${p.name}</div>
                  <div class="target-details">
                    <span class="target-location">📍 ${plan?.locationName || 'Unknown'}</span>
                    ${plan?.action?.name ? `<span class="target-action">→ ${plan.action.name}</span>` : ''}
                    ${trackedTargetName ? `<span class="target-action">Tracking: ${trackedTargetName}</span>` : ''}
                  </div>
                  ${snoopers.length > 0 ? `<div class="target-snoopers">👀 Snoopers spotted around ${p.name}'s bedroom zone: ${snoopers.join(', ')}</div>` : ''}
                </div>
                <div class="target-kill-btn">🎯 Mark</div>
              </div>
            `;
          }).join('')}
        </div>
        ` : `
        <div class="card" style="margin-bottom:16px;text-align:center">
          <div style="color:var(--text-secondary)">No eligible targets visible.</div>
        </div>
        `}

        <div class="section-label">Choose attack method (low disturbance to high disturbance):</div>
        <div class="action-list">
          ${sortedMethods.map(method => `
            <div class="action-card ${state.selectedKillMethod === method.id ? 'selected' : ''}" onclick="selectKillMethod('${method.id}')">
              <div class="action-header">
                <span class="action-name">${method.name}</span>
                <span class="exposure-chip" style="color:${getExposureColor(method.noise || 0)};border-color:${getExposureColor(method.noise || 0)}">
                  Disturbance ${getExposurePct(method.noise || 0)}%
                </span>
              </div>
              <div class="action-desc">${method.desc}</div>
            </div>
          `).join('')}
        </div>

        <button class="btn btn-primary btn-full btn-lg" onclick="confirmMafiaTarget()" ${(!state.selectedTarget || !state.selectedKillMethod) ? 'disabled' : ''}>
          Confirm Night Strike
        </button>
      </div>
    `;
  }

  const selectedAwareness = state.selectedAwareness
    || state.nightAwareness[current.id]
    || NIGHT_AWARENESS_OPTIONS[1].id;
  const awarenessChoices = [...NIGHT_AWARENESS_OPTIONS].sort((a, b) => (a.exposureMod || 0) - (b.exposureMod || 0));
  const rolePrompt = current.role === 'doctor'
    ? 'Pick your night stance. In the morning, you will choose who to save.'
    : current.role === 'detective'
      ? 'Pick your night stance. Detectives stay alert and naturally harder to notice.'
      : 'Pick your night stance. Your choice affects how much you might notice.';

  return `
    <div class="card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <span style="color:${ROLES[current.role]?.color}">${ROLES[current.role]?.icon}</span>
        <span>${current.name}</span>
        <span style="font-size:0.85rem;color:var(--text-secondary)">(Night awareness turn)</span>
      </div>

      <div style="color:var(--text-secondary);margin-bottom:12px">${rolePrompt}</div>
      <div class="section-label">Night stance (low exposure to high exposure)</div>
      <div class="action-list">
        ${awarenessChoices.map(option => {
          const exposure = clampExposure(0.5 + (option.exposureMod || 0));
          return `
            <div class="action-card ${selectedAwareness === option.id ? 'selected' : ''}" onclick="selectNightAwareness('${option.id}')">
              <div class="action-header">
                <span class="action-name">${option.name}</span>
                <span class="exposure-chip" style="color:${getExposureColor(exposure)};border-color:${getExposureColor(exposure)}">
                  Exposure ${getExposurePct(exposure)}%
                </span>
              </div>
              <div class="action-desc">${option.desc}</div>
            </div>
          `;
        }).join('')}
      </div>

      <button class="btn btn-primary btn-full btn-lg" onclick="confirmNightAwareness()">
        Confirm Night Stance
      </button>
    </div>
  `;
}

function renderDoctorPhase(alivePlayers) {
  const doctor = alivePlayers.find(p => p.role === 'doctor' && !p.isBot);
  const method = getKillMethodById(state.nightAttackMethod || KILL_METHODS[0].id);
  const targetId = state.nightTarget;
  const likelyVictim = targetId ? alivePlayers.find(player => player.id === targetId) : null;
  const attackCount = targetId ? (state.nightAttackCounts[targetId] || 1) : 1;
  const saveChance = getDoctorSaveChance(method, attackCount);

  if (!doctor) {
    scheduleAutoAdvance(`doctor_auto_${state.dayNumber}`, 'skipDoctor');
    return `
      <div class="card" style="text-align:center">
        <div style="color:var(--text-secondary);margin-bottom:12px">💉 The doctor makes their choice ${renderThinkingDots()}</div>
        <div style="color:var(--text-secondary);font-size:0.9rem">Continuing in ~${state.botDelayMs}ms</div>
      </div>
    `;
  }
  clearAutoAdvance();

  if (!state.showRole && !isSoloMode()) {
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:8px">📲 Pass to <strong>${doctor.name}</strong></div>
        <p style="color:var(--text-secondary);margin-bottom:16px">Doctor choice is private.</p>
        <button class="btn btn-lg" style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);color:white" onclick="showCurrentRole()">
          Choose Who to Save
        </button>
      </div>
    `;
  }

  if (!state.showRole && isSoloMode()) state.showRole = true;

  return `
    <div class="card" style="border-color:#2563eb">
      <div class="section-label" style="color:#60a5fa">💉 Save one person from death tonight</div>
      <p style="color:var(--text-secondary);margin-bottom:6px">Save chance is never guaranteed and drops when multiple attackers focus one target.</p>
      <p style="color:var(--text-primary);margin-bottom:12px">Current likely attack profile: <strong style="color:#93c5fd">${method.name}</strong> (disturbance ${getExposurePct(method.noise || 0)}%). Estimated save chance against this profile: <strong style="color:#7dd3fc">${Math.round(saveChance * 100)}%</strong>.</p>
      ${likelyVictim ? `<p style="color:#bfdbfe;margin-bottom:10px">Most likely target by mafia vote pattern: <strong>${likelyVictim.name}</strong></p>` : ''}
      <div class="target-grid">
        ${alivePlayers.map(p => `
          <button class="target-btn ${state.selectedSave === p.id ? 'selected' : ''}"
                  style="${state.selectedSave === p.id ? 'background:rgba(37,99,235,0.4);border-color:#2563eb' : ''}"
                  onclick="selectSave('${p.id}')">
            ${p.isBot ? '🤖 ' : ''}${p.name}
            ${state.intelResults[p.id]?.heard ? `<div style="font-size:0.74rem;color:#cbd5e1;margin-top:3px">${state.intelResults[p.id].heard}</div>` : ''}
          </button>
        `).join('')}
      </div>
      <button class="btn btn-full btn-lg" style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);color:white"
              onclick="confirmDoctorSave()" ${!state.selectedSave ? 'disabled' : ''}>
        Confirm Save
      </button>
    </div>
  `;
}

function renderDiscussionPhase(current) {
  const isMultiDevice = isMultiDeviceChatEnabled();
  const remainingMs = Math.max(0, (state.discussionUnlockAt || 0) - Date.now());
  const timerLocked = !isSoloMode() && remainingMs > 0;
  if (timerLocked) {
    const waitMs = Math.min(600, remainingMs + 20);
    scheduleAutoAdvance(`discussion_tick_${Math.ceil(remainingMs / 400)}`, 'refreshDiscussion', waitMs);
  } else {
    clearAutoAdvance();
  }

  const hostBlocked = isMultiDevice && !state.network.isHost;
  const buttonLabel = hostBlocked
    ? 'Waiting for Host'
    : timerLocked
      ? `Continue in ${Math.ceil(remainingMs / 1000)}s`
      : 'Proceed to Voting';

  const myIntel = current ? (state.intelResults[current.id] || {
    heard: 'Nothing conclusive tonight. Compare stories before voting.',
    saw: null,
    nearby: null
  }) : null;

  return `
    <div class="card">
      <div style="font-size:1.5rem;margin-bottom:12px">💬 Discussion Time</div>
      <p style="color:var(--text-secondary);margin-bottom:14px">
        ${isMultiDevice
          ? 'Use the corner chat to compare clues. Narrator (if human mode) should set mood first, then host advances to voting.'
          : (isSoloMode()
            ? 'Review your intel, then continue into voting.'
            : 'Talk out loud for a few seconds, then continue to private voting turns.')}
      </p>

      ${isSoloMode() && myIntel ? `
        <div class="intel-box" style="text-align:left">
          <div class="intel-header">🔍 Your intel recap:</div>
          ${myIntel.heard ? `<div class="intel-item">👂 ${myIntel.heard}</div>` : ''}
          ${myIntel.saw ? `<div class="intel-item" style="font-weight:600">👁️ ${myIntel.saw}</div>` : ''}
          ${myIntel.nearby ? `<div class="intel-item" style="color:var(--text-secondary)">${myIntel.nearby}</div>` : ''}
          ${myIntel.tracked ? `<div class="intel-item" style="color:var(--text-secondary)">${myIntel.tracked}</div>` : ''}
          ${myIntel.cause ? `<div class="intel-item" style="color:var(--text-secondary)">${myIntel.cause}</div>` : ''}
        </div>
      ` : ''}

      <button class="btn btn-warning btn-lg" onclick="advanceDiscussion()" ${timerLocked || hostBlocked ? 'disabled' : ''}>
        ${buttonLabel}
      </button>
    </div>
  `;
}

function renderVotePhase(current, alivePlayers) {
  if (!current) {
    return `
      <div class="card" style="text-align:center">
        <div style="color:var(--text-secondary);margin-bottom:12px">⚖️ Tallying votes...</div>
        <button class="btn btn-secondary" onclick="processVote()">See Results</button>
      </div>
    `;
  }

  if (current.isBot) {
    scheduleAutoAdvance(`vote_bot_${current.id}_${state.dayNumber}`, 'skipBotVote');
    return `
      <div class="card" style="text-align:center">
        <div style="color:var(--text-secondary);margin-bottom:12px">🤖 ${current.name} is voting ${renderThinkingDots()}</div>
        <div style="color:var(--text-secondary);font-size:0.9rem">Continuing in ~${state.botDelayMs}ms</div>
      </div>
    `;
  }
  clearAutoAdvance();

  if (!current.alive) {
    scheduleAutoAdvance(`vote_dead_${current.id}_${state.dayNumber}`, 'skipDeadVote');
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:8px">💀 You are dead</div>
        <div style="color:var(--text-secondary);margin-bottom:16px">The dead cannot vote.</div>
        <div style="color:var(--text-secondary);font-size:0.9rem">Continuing ${renderThinkingDots()}</div>
      </div>
    `;
  }

  // In solo mode, skip the turn prompt - go straight to voting
  if (!state.showRole && !isSoloMode()) {
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:8px">📲 Pass to <strong>${current.name}</strong></div>
        <p style="color:var(--text-secondary);margin-bottom:16px">Cast your vote privately.</p>
        <button class="btn btn-warning btn-lg" onclick="showCurrentRole()">Cast My Vote</button>
      </div>
    `;
  }

  const isMafia = current.role === 'mafia';
  const myIntel = !isMafia ? (state.intelResults[current.id] || {
    heard: 'No strong clue from last night.',
    saw: null,
    nearby: null,
    awareness: null
  }) : null;
  const mafiaNotes = isMafia ? (state.mafiaBriefing[current.id] || []) : [];
  const otherPlayers = alivePlayers.filter(p => p.id !== current.id);

  return `
    <div class="card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="color:${ROLES[current.role]?.color}">${current.role !== 'mafia' ? ROLES[current.role]?.icon : '👤'}</span>
        <span>${current.name}</span>
      </div>

      ${!isMafia ? `
        <div class="intel-box" style="margin-bottom:16px">
          <div class="intel-header" style="font-size:0.8rem">Your intel:</div>
          ${myIntel.heard ? `<div style="font-size:0.9rem">👂 ${myIntel.heard}</div>` : ''}
          ${myIntel.saw ? `<div style="font-size:0.9rem;font-weight:600">👁️ ${myIntel.saw}</div>` : ''}
          ${myIntel.nearby ? `<div style="font-size:0.9rem;color:var(--text-secondary)">${myIntel.nearby}</div>` : ''}
          ${myIntel.awareness ? `<div style="font-size:0.9rem;color:var(--text-secondary)">${myIntel.awareness}</div>` : ''}
          ${myIntel.cause ? `<div style="font-size:0.9rem;color:var(--text-secondary)">${myIntel.cause}</div>` : ''}
        </div>
      ` : `
        <div class="mafia-intel" style="margin-bottom:16px">
          <div class="mafia-intel-header">Mafia tactical notes</div>
          ${mafiaNotes.length === 0
            ? '<div style="font-size:0.9rem;color:#e2e8f0">No special sightings were confirmed this night.</div>'
            : mafiaNotes.map(note => `<div style="font-size:0.88rem;color:#e2e8f0;margin-top:4px">• ${note}</div>`).join('')}
        </div>
      `}

      <div class="section-label">Vote to eliminate:</div>
      <div class="target-grid">
        ${otherPlayers.map(p => `
          <button class="target-btn ${state.selectedVote === p.id ? 'selected' : ''}"
                  style="${state.selectedVote === p.id ? 'background:rgba(202,138,4,0.4);border-color:var(--yellow-accent)' : ''}"
                  onclick="selectVote('${p.id}')">
            ${p.isBot ? '🤖 ' : ''}${p.name}
          </button>
        `).join('')}
      </div>

      <button class="btn btn-warning btn-full btn-lg" onclick="confirmVote()" ${!state.selectedVote ? 'disabled' : ''}>
        Submit Vote
      </button>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// MODALS
// -----------------------------------------------------------------------------

function renderInstructionsModal() {
  const tabs = [
    { id: 'rules', label: '📘 Rules + Gameplay' },
    { id: 'modes', label: '👥 Modes' }
  ];
  const activeTab = tabs.some(tab => tab.id === state.instructionsTab) ? state.instructionsTab : 'rules';

  let content = '';
  if (activeTab === 'rules') {
    content = `
      <h3 style="color:var(--purple-accent);margin-bottom:8px">Instructions</h3>
      <p style="margin-bottom:10px;color:var(--text-primary)"><strong>Read this fully before play:</strong> this is a Mafia variant, not standard Mafia. Location choices, exposure, disturbance, map proximity, and narrator rules all change how you should play.</p>

      <div style="margin-top:12px">
        <h4 style="margin-bottom:6px">Start With Core Win Rules</h4>
        <p style="color:var(--text-primary)">Town wins by eliminating every Mafia. Mafia wins only when living Mafia are greater than living Town. Equality is <strong>not</strong> enough for Mafia.</p>
        <p class="footnote" style="margin-top:6px">Town means everyone who is not Mafia: Villager/Guest/Passenger/Survivor/Crewmate, Doctor, and Detective.</p>
      </div>

      <div style="margin-top:12px">
        <h4 style="margin-bottom:6px">How This Variant Changes Classic Mafia</h4>
        <p style="color:var(--text-primary)">Classic Mafia often treats night as mostly hidden role actions. This variant adds structured location planning and probability tradeoffs. You choose where to be, how risky to act, and what information to pursue. This means your choices create evidence patterns even when no one openly confesses.</p>
        <p style="color:var(--text-primary);margin-top:6px">If you play this like pure social bluffing without tracking location timing, you will miss most useful clues.</p>
      </div>

      <div style="margin-top:12px">
        <h4 style="margin-bottom:6px">Exposure (Most Important Concept)</h4>
        <p style="color:var(--text-primary)">Exposure = your exposure to information and threats. High exposure increases the chance of useful clues, but also increases the chance of being seen, tracked, or implicated. Low exposure is safer but often yields weaker or inconclusive info.</p>
        <p style="color:var(--text-primary);margin-top:6px">Action lists are sorted from low to high percentage so you can intentionally choose safer vs riskier routes.</p>
      </div>

      <div style="margin-top:12px">
        <h4 style="margin-bottom:6px">Roles In Practical Terms</h4>
        <p style="color:var(--text-primary)"><strong>Mafia:</strong> chooses location routes by risk and at night chooses both target and attack method (disturbance level matters).</p>
        <p style="color:var(--text-primary)"><strong>Detective:</strong> better clue reliability and lower notice risk; strongest role for contradiction checks.</p>
        <p style="color:var(--text-primary)"><strong>Doctor:</strong> no medicine loadout in this version; doctor chooses who to save in morning based on likely victim + method profile.</p>
        <p style="color:var(--text-primary)"><strong>Town role (setting-named):</strong> still active at night with stance decisions that influence awareness quality.</p>
      </div>

      <div style="margin-top:12px">
        <h4 style="margin-bottom:6px">Phase Loop (What You Actually Do)</h4>
        <p style="color:var(--text-primary)"><strong>1) Reveal:</strong> private role view only. Never read role text aloud.</p>
        <p style="color:var(--text-primary)"><strong>2) Day Planning:</strong> choose location + action (+ optional target if action requires one). Snoop-tagged actions are clue-focused.</p>
        <p style="color:var(--text-primary)"><strong>3) Night:</strong> Mafia chooses kill target + method. Non-mafia choose night stance.</p>
        <p style="color:var(--text-primary)"><strong>4) Morning Doctor:</strong> if needed, doctor chooses save target.</p>
        <p style="color:var(--text-primary)"><strong>5) Announcement:</strong> public outcome appears before final winner resolution.</p>
        <p style="color:var(--text-primary)"><strong>6) Discussion:</strong> compare timelines and contradictions before voting.</p>
        <p style="color:var(--text-primary)"><strong>7) Vote:</strong> one vote per living voter, with tally shown in result phase.</p>
      </div>

      <div style="margin-top:12px">
        <h4 style="margin-bottom:6px">Disturbance And Survival</h4>
        <p style="color:var(--text-primary)">Attack methods display disturbance percentages. Lower disturbance is generally quieter (fewer witnesses, often better stabilization chance). Higher disturbance is louder (more witness potential, generally harder stabilization).</p>
      </div>

      <div style="margin-top:12px">
        <h4 style="margin-bottom:6px">How To Read Intel Correctly</h4>
        <p style="color:var(--text-primary)">Morning intel is not always definitive. Treat each line as evidence weight, not truth. Strong lines are useful, inconclusive lines still matter when cross-referenced with map proximity and player claims.</p>
        <p style="color:var(--text-primary);margin-top:6px">Best practice: build a shortlist of two suspects and test every statement against timing + nearby presence + role incentives.</p>
      </div>

      <div style="margin-top:12px">
        <h4 style="margin-bottom:6px">Discussion Discipline (Critical)</h4>
        <p style="color:var(--text-primary)">A spoken claim is not proof. Players can tell truth, lie as Mafia, or troll. Ask for specifics: location, route timing, who was nearby, and what exactly was observed. Contradictions across these details are often stronger than dramatic accusations.</p>
      </div>

      <div style="margin-top:12px">
        <h4 style="margin-bottom:6px">Narrator Expectations</h4>
        <p style="color:var(--text-primary)">If narrator mode is Human, narrator gets first phase turn and must deliver cue before player actions continue. In single-device games this cue is read aloud. In multi-device games this cue is posted in chat.</p>
      </div>
    `;
  } else {
    content = `
      <h3 style="color:var(--purple-accent);margin-bottom:8px">Mode Guide</h3>
      <p style="color:var(--text-primary)"><strong>Solo:</strong> one human + bots. Great for learning the evidence model, exposure tradeoffs, and voting rhythm.</p>
      <p style="color:var(--text-primary);margin-top:8px"><strong>Single-device multiplayer:</strong> pass-and-play on one screen. Use this for couch/local sessions.</p>
      <p style="color:var(--text-primary);margin-top:8px"><strong>Multi-device multiplayer:</strong> each device joins the same room code. Host controls room start and device-level ordering.</p>

      <div style="margin-top:12px">
        <h4 style="margin-bottom:6px">Host vs Join Flow</h4>
        <p style="color:var(--text-primary)">Host creates/opens the room and shares the fast link or room code. Joiners enter code and then add their local players. Every device can rename itself so turn flow is readable.</p>
      </div>

      <div style="margin-top:12px">
        <h4 style="margin-bottom:6px">Device + Player Grouping</h4>
        <p style="color:var(--text-primary)">Players are grouped by device in the lobby. This matters because turn progression and discussions are easier to manage when everyone can see which players belong to each connected device.</p>
      </div>

      <div style="margin-top:12px">
        <h4 style="margin-bottom:6px">Bots In Multiplayer</h4>
        <p style="color:var(--text-primary)">Bots are global to the room and host-managed. Joiners cannot add/remove bots. This prevents conflicting bot state from multiple clients.</p>
      </div>

      <div style="margin-top:12px">
        <h4 style="margin-bottom:6px">Map + Chat Usage</h4>
        <p style="color:var(--text-primary)">Use the map button during play to review floorplan context, then bring evidence into discussion chat. In multi-device sessions, chat is part of pre-vote analysis, not just flavor text.</p>
      </div>

      <div style="margin-top:12px">
        <h4 style="margin-bottom:6px">Practical First Game Setup</h4>
        <p style="color:var(--text-primary)">Recommended for first run: 4-6 players, one doctor, one detective, and a balanced preset. Keep narrator mode on Human if someone is facilitating live, or Auto if no facilitator is available.</p>
      </div>
    `;
  }

  return `
    <div class="modal-overlay" onclick="hideInstructions()">
      <div class="instructions-modal" onclick="event.stopPropagation()">
        <div style="padding:14px 20px 8px;border-bottom:1px solid var(--border-color)">
          <div style="font-size:1.22rem;font-weight:700">Instructions</div>
          <div class="footnote" style="margin-top:4px">Read these before starting. This game is a Mafia variant with custom systems and phase rules.</div>
        </div>
        <div class="instructions-tabs">
          ${tabs.map(t => `
            <button class="instructions-tab ${activeTab === t.id ? 'active' : ''}" onclick="setInstructionsTab('${t.id}')">
              ${t.label}
            </button>
          `).join('')}
        </div>
        <div class="instructions-body">${content}</div>
        <div class="instructions-footer">
          <button class="btn btn-primary btn-full" onclick="hideInstructions()">Got it!</button>
        </div>
      </div>
    </div>
  `;
}

function renderSettingsModal() {
  const soloNarratorRestricted = state.entryPage === 'solo';
  const readonlySetupClient = state.multiplayerMode === 'realtime' && state.network.connected && !state.network.isHost;
  const networkingMode = String(state.settings.networkShareMode || 'origin');
  const lanAvailable = typeof isLanShareModeAvailable === 'function' ? isLanShareModeAvailable() : false;
  const backendDetected = Boolean(state.network.shareHints?.backendDetected);
  const lanPortal = String(state.network.shareHints?.lanPortalUrl || '').trim();
  const originPortal = String(state.network.shareHints?.originPortalUrl || '').trim();
  const preferredPortal = String(state.network.shareHints?.preferredPortalUrl || '').trim();
  const customPortal = String(state.settings.customShareBaseUrl || '').trim();
  const customRelay = String(state.settings.customRelayUrl || '').trim();

  if (readonlySetupClient) {
    return `
      <div class="modal-overlay" onclick="hideSettings()">
        <div class="modal-content" style="text-align:left;border-color:var(--border-color);max-height:85vh;overflow:auto" onclick="event.stopPropagation()">
          <h2 style="margin-bottom:12px">⚙️ Current Game Setup</h2>
          <div class="footnote" style="margin-bottom:12px">Only the host can change setup. This view shows the active selection and rule details.</div>
          ${renderJoinReadonlySetup(getAllPlayers())}
          <button class="btn btn-primary btn-full" style="margin-top:8px" onclick="hideSettings()">Close</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="modal-overlay" onclick="hideSettings()">
      <div class="modal-content" style="text-align:left;border-color:var(--border-color)" onclick="event.stopPropagation()">
        <h2 style="margin-bottom:16px">⚙️ Settings</h2>
        <div class="settings-row">
          <span>AI Narrator</span>
          <input type="checkbox" class="checkbox" ${state.settings.aiNarrator ? 'checked' : ''} onchange="toggleSetting('aiNarrator')"/>
        </div>
        <div class="settings-row">
          <span>Bot Chat (AI)</span>
          <input type="checkbox" class="checkbox" ${state.settings.botChat ? 'checked' : ''} onchange="toggleSetting('botChat')"/>
        </div>
        <div class="settings-row">
          <span>Death Animations</span>
          <input type="checkbox" class="checkbox" ${state.settings.deathAnimations ? 'checked' : ''} onchange="toggleSetting('deathAnimations')"/>
        </div>
        <div class="settings-row">
          <span>Sound Effects</span>
          <input type="checkbox" class="checkbox" ${state.settings.sounds ? 'checked' : ''} onchange="toggleSetting('sounds')"/>
        </div>
        <div class="settings-row" style="display:block">
          <div style="margin-bottom:8px">Narrator Mode</div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-small ${state.settings.narratorMode === 'auto' ? 'btn-primary' : 'btn-secondary'}" onclick="setNarratorMode('auto')">Auto</button>
            ${soloNarratorRestricted ? '' : `<button class="btn btn-small ${state.settings.narratorMode === 'human' ? 'btn-primary' : 'btn-secondary'}" onclick="setNarratorMode('human')">Human</button>`}
          </div>
          ${soloNarratorRestricted ? `<div class="footnote" style="margin-top:8px">Solo mode uses Auto narrator only.</div>` : ''}
        </div>
        <div class="settings-row" style="display:block">
          <div style="margin-bottom:8px">Narrator Tone</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${['grim', 'cinematic', 'neutral'].map(tone => `
              <button class="btn btn-small ${state.settings.narratorTone === tone ? 'btn-primary' : 'btn-secondary'}"
                      onclick="setNarratorTone('${tone}')">
                ${tone.charAt(0).toUpperCase() + tone.slice(1)}
              </button>
            `).join('')}
          </div>
        </div>
        <div class="settings-row" style="display:block">
          <div style="margin-bottom:8px">Networking (multi-device)</div>
          <div class="mode-switch-row" style="margin-bottom:8px">
            <button class="btn btn-small ${networkingMode === 'lan' ? 'btn-primary' : 'btn-secondary'} ${lanAvailable ? '' : 'network-option-disabled'}"
                    onclick="setNetworkingMode('lan')"
                    ${lanAvailable ? '' : 'disabled'}
                    title="${lanAvailable ? 'Prefer LAN backend URL' : 'LAN URL unavailable on this host'}">
              LAN Host URL
            </button>
            <button class="btn btn-small ${networkingMode === 'origin' ? 'btn-primary' : 'btn-secondary'}" onclick="setNetworkingMode('origin')">Same URL</button>
            <button class="btn btn-small ${networkingMode === 'custom' ? 'btn-primary' : 'btn-secondary'}" onclick="setNetworkingMode('custom')">Custom</button>
          </div>
          <div class="footnote">
            ${backendDetected
              ? (lanAvailable ? 'Backend detected. LAN mode shares http://<LAN_IP>:8000 style links.' : 'Backend detected, but no LAN IP was detected. Using Same URL mode.')
              : 'Room service is not ready on this page yet. Press Host Game to start it.'}
          </div>
          ${networkingMode === 'custom' ? `
            <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px">
              <label style="font-size:0.86rem;color:var(--text-primary)">Custom portal URL (http/https)</label>
              <input type="text" class="input" value="${customPortal.replace(/"/g, '&quot;')}" oninput="setCustomShareBaseUrl(this.value)" placeholder="https://example.com/"/>
              <label style="font-size:0.86rem;color:var(--text-primary)">Custom relay URL (ws/wss)</label>
              <input type="text" class="input" value="${customRelay.replace(/"/g, '&quot;')}" oninput="setCustomRelayUrl(this.value)" placeholder="wss://example.com:8765"/>
            </div>
          ` : ''}
          <details style="margin-top:10px">
            <summary style="cursor:pointer;color:var(--text-secondary);font-size:0.84rem">Advanced networking details</summary>
            <div style="margin-top:8px;font-size:0.84rem;color:var(--text-primary);line-height:1.5">
              <div><strong>Backend API:</strong> ${backendDetected ? 'Detected' : 'Not detected'}</div>
              <div><strong>Preferred portal URL:</strong> ${preferredPortal || 'Unavailable'}</div>
              <div><strong>LAN portal URL:</strong> ${lanPortal || 'Unavailable'}</div>
              <div><strong>Same-origin portal URL:</strong> ${originPortal || 'Unavailable'}</div>
            </div>
          </details>
        </div>
        <div class="settings-row" style="display:block">
          <div style="margin-bottom:8px">Bot Turn Pace: ${state.botDelayMs}ms</div>
          <input type="range" min="700" max="2600" step="100" value="${state.botDelayMs}" oninput="setBotDelay(this.value)" style="width:100%"/>
        </div>
        <button class="btn btn-primary btn-full" style="margin-top:20px" onclick="hideSettings()">Done</button>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// EVENT LISTENERS
// -----------------------------------------------------------------------------

function attachEventListeners() {
  const soloInput = document.getElementById('soloNameInput');
  if (soloInput) {
    soloInput.addEventListener('input', e => {
      const hadName = state.soloPlayerName.trim().length > 0;
      state.soloPlayerName = e.target.value;
      const hasName = state.soloPlayerName.trim().length > 0;
      // Update role config when name presence changes (affects player count)
      if (hadName !== hasName) {
        updateRoleConfig();
        render();
      }
    });
    soloInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') e.target.blur();
    });
  }

  const newPlayerInput = document.getElementById('newPlayerInput');
  if (newPlayerInput) {
    newPlayerInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addPlayerFromInput();
      }
    });
  }
}

// Initialize on load
render();
