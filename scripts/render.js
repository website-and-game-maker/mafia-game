// =============================================================================
// MAFIA GAME - Rendering Functions
// =============================================================================

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

function isSoloMode() {
  return state.players.length === 1 && state.bots.length > 0;
}

function getRiskClass(risk) {
  // Risk is 0-5 scale, convert to percentage for class determination
  const pct = (risk / 5) * 100;
  if (pct <= 30) return 'risk-low';
  if (pct <= 60) return 'risk-medium';
  return 'risk-high';
}

function getIntelClass(intel) {
  // Intel is 0-1 scale (percentage as decimal)
  const pct = intel * 100;
  if (pct <= 30) return 'intel-low';
  if (pct <= 60) return 'intel-medium';
  return 'intel-high';
}

// -----------------------------------------------------------------------------
// MAIN RENDER
// -----------------------------------------------------------------------------

function render() {
  const app = document.getElementById('app');
  if (state.screen === 'setup') app.innerHTML = renderSetup();
  else if (state.screen === 'solo_lobby') app.innerHTML = renderSoloLobby();
  else if (state.screen === 'multi_lobby') app.innerHTML = renderMultiLobby();
  else if (state.screen === 'game') app.innerHTML = renderGame();
  attachEventListeners();
}

// -----------------------------------------------------------------------------
// SETUP SCREEN
// -----------------------------------------------------------------------------

function renderSetup() {
  return `
    <div class="container">
      <h1>MAFIA</h1>
      <p class="subtitle">A game of deception and survival</p>
      <button class="btn btn-secondary btn-full" style="margin-bottom:24px" onclick="showInstructions()">
        <span class="help-btn">?</span> How to Play
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

  return `
    <div class="container">
      <div class="header-bar">
        <button class="btn btn-secondary btn-small" onclick="goToSetup()">← Back</button>
        <div class="header-actions">
          <button class="btn-icon btn-primary" onclick="showInstructions()">?</button>
          <button class="btn-icon btn-secondary" onclick="showSettings()">⚙️</button>
        </div>
      </div>
      <h2 style="color:var(--red-accent)">Solo Game</h2>

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
              <span class="player-name">🤖 ${b.name}</span>
              <button class="remove-btn" onclick="removeBot('${b.id}')">×</button>
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

  return `
    <div class="container wide">
      <div class="header-bar">
        <button class="btn btn-secondary btn-small" onclick="goToSetup()">← Back</button>
        <div class="header-actions">
          <button class="btn-icon btn-primary" onclick="showInstructions()">?</button>
          <button class="btn-icon btn-secondary" onclick="showSettings()">⚙️</button>
        </div>
      </div>
      <h2 style="color:var(--red-accent)">Multiplayer Lobby</h2>

      <div class="card">
        <div style="color:var(--text-secondary);margin-bottom:8px">Share to add devices</div>
        <div class="input-row">
          <input type="text" class="input" readonly value="${window.location.origin}?join=${state.gameCode}"/>
          <button class="copy-btn" id="copyBtn" onclick="copyLink()">📋 Copy</button>
        </div>
      </div>

      <div class="card">
        <div class="section-label">👥 Players (${state.players.length})</div>
        <div class="player-list">
          ${state.players.map(p => `
            <div class="player-item">
              <span class="player-name">👤 ${p.name} ✏️</span>
              <button class="remove-btn" onclick="removePlayer('${p.id}')">×</button>
            </div>
          `).join('')}
          ${state.players.length === 0 ? '<div style="color:var(--text-secondary);text-align:center;padding:12px">No players yet</div>' : ''}
        </div>
        <div class="input-row">
          <input type="text" class="input ${state.nameError ? 'input-error' : ''}" id="newPlayerInput" placeholder="Add player name..." onkeypress="if(event.key==='Enter')addPlayerFromInput()"/>
          <button class="btn btn-primary btn-small" onclick="addPlayerFromInput()">Add</button>
        </div>
        ${state.nameError ? `<div class="error-msg">${state.nameError}</div>` : ''}
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span class="section-label" style="margin-bottom:0">🤖 Bots (${state.bots.length})</span>
          <button class="btn btn-secondary btn-small" onclick="addBot()" ${allPlayers.length >= 16 ? 'disabled' : ''}>+ Add Bot</button>
        </div>
        <div class="bot-list">
          ${state.bots.map(b => `
            <div class="player-item">
              <span class="player-name">🤖 ${b.name}</span>
              <button class="remove-btn" onclick="removeBot('${b.id}')">×</button>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="section-label">📖 Setting</div>
        <div class="grid-2">
          ${STORY_PRESETS.map(s => `
            <div class="story-card ${state.selectedStory.id === s.id ? 'selected' : ''}" onclick="selectStory('${s.id}')">
              <div class="story-name">${s.name}</div>
              <div class="story-intro">${s.intro}</div>
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
// ROLE CONFIG (shared)
// -----------------------------------------------------------------------------

function renderRoleConfig(allPlayers, total, warnings) {
  return `
    <div class="card">
      <div class="section-label">⚖️ Role Balance</div>
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
          <span class="stat-display">👤 Villagers: ${Math.max(0, allPlayers.length - state.roleConfig.mafia - state.roleConfig.doctor - state.roleConfig.detective)}</span>
          <span class="stat-display">Total: ${total}/${allPlayers.length}</span>
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

  // Announcement modal
  if ((state.gamePhase === 'announcement' || state.gamePhase === 'vote_announcement') && state.announcement) {
    content = `
      <div class="modal-overlay">
        <div class="modal-content">
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
          finalDeathMessage = `${state.finalDeath.victim} was attacked but saved by the Doctor.`;
        } else if (state.finalDeath.victim) {
          finalDeathMessage = `${state.finalDeath.victim} (${state.finalDeath.role}) was killed during the night.`;
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

  return `
    <div class="container wide">
      <div class="phase-header">
        <div class="phase-title" style="color:${phaseColors[state.gamePhase]}">${phaseLabels[state.gamePhase]}</div>
        ${!['reveal', 'gameover', 'announcement', 'vote_announcement'].includes(state.gamePhase)
          ? `<div class="phase-subtitle">Round ${state.dayNumber}</div>`
          : ''}
      </div>

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
  `;
}

// -----------------------------------------------------------------------------
// PHASE RENDERERS
// -----------------------------------------------------------------------------

function renderRevealPhase(current) {
  if (!current) return '';

  if (current.isBot) {
    return `
      <div class="card" style="text-align:center">
        <div style="color:var(--text-secondary);margin-bottom:12px">🤖 ${current.name} is ready...</div>
        <button class="btn btn-secondary" onclick="nextReveal()">Continue</button>
      </div>
    `;
  }

  // In solo mode, skip the turn prompt - go straight to role reveal
  if (!state.showRole && !isSoloMode()) {
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:8px">📲 <strong>${current.name}</strong>'s turn</div>
        <p style="color:var(--text-secondary);margin-bottom:16px">Pass device to ${current.name}</p>
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
    return `
      <div class="card" style="text-align:center">
        <div style="color:var(--text-secondary);margin-bottom:12px">🤖 ${current.name} is planning...</div>
        <button class="btn btn-secondary" onclick="skipBotDay()">Continue</button>
      </div>
    `;
  }

  // In solo mode, skip the turn prompt - go straight to planning
  if (!state.showRole && !isSoloMode()) {
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:16px">📲 <strong>${current.name}</strong>'s turn</div>
        <button class="btn btn-warning btn-lg" onclick="showCurrentRole()">Plan My Night</button>
      </div>
    `;
  }

  const isMafia = current.role === 'mafia';
  const location = state.selectedStory.locations.find(l => l.id === state.selectedLocation);

  const sortedLocations = [...state.selectedStory.locations].sort((x, y) => (x.risk || 0) - (y.risk || 0));

  return `
    <div class="card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <span style="color:${ROLES[current.role]?.color}">${ROLES[current.role]?.icon}</span>
        <span>${current.name}</span>
      </div>

      <div class="section-label">1. Where will you be tonight?</div>
      <div class="location-grid">
        ${sortedLocations.map(l => `
            <div class="location-card ${state.selectedLocation === l.id ? 'selected' : ''}" onclick="selectLocation('${l.id}')">
              <div class="location-header">
                <span class="location-name">${l.name}</span>
                <span class="risk-badge risk-${l.risk || 0}">Risk ${l.risk || 0}</span>
              </div>
              ${l.canLock ? '<span style="font-size:0.8rem;color:#4ade80">🔒 Can lock</span>' : ''}
            </div>
          `).join('')}
      </div>

      ${location ? `
        <div class="section-label">2. What will you do there?</div>
        <div class="action-list">
          ${(isMafia ? state.selectedStory.mafiaActions : location.actions).map(ac => `
            <div class="action-card ${state.selectedAction?.id === ac.id ? 'selected' : ''}" onclick="selectAction('${ac.id}')">
              <div class="action-header">
                <span class="action-name">${ac.name}</span>
                ${!isMafia ? `
                  <div class="action-stats">
                    <span class="${getIntelClass(ac.intel || 0)}">Intel ${Math.round((ac.intel || 0) * 100)}%</span>
                    <span class="${getRiskClass(ac.risk || 0)}">Risk ${ac.risk || 0}</span>
                  </div>
                ` : ''}
              </div>
              <div class="action-desc">${ac.desc}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${location && location.canLock && state.selectedAction && !isMafia ? `
        <div class="section-label">3. What about your door?</div>
        <div class="door-options">
          <div class="door-option ${state.selectedDoorOption === 'lock' ? 'selected' : ''}" onclick="selectDoorOption('lock')">
            <div class="door-option-header">
              <span class="door-option-name">🔒 Lock door</span>
              <div class="door-option-stats">
                <span class="intel-low">-20% Intel</span>
                <span class="risk-low">-1 Risk</span>
              </div>
            </div>
            <div class="door-option-desc">Safer, but you might miss important sounds</div>
          </div>
          <div class="door-option ${state.selectedDoorOption === 'listen' ? 'selected' : ''}" onclick="selectDoorOption('listen')">
            <div class="door-option-header">
              <span class="door-option-name">👂 Leave open to listen</span>
              <div class="door-option-stats">
                <span class="intel-high">+15% Intel</span>
                <span class="risk-high">+1 Risk</span>
              </div>
            </div>
            <div class="door-option-desc">Risky, but you might hear something useful</div>
          </div>
        </div>
      ` : ''}

      <button class="btn btn-primary btn-full btn-lg" onclick="confirmDayPlan()" ${!state.selectedLocation || !state.selectedAction || (location?.canLock && !isMafia && !state.selectedDoorOption) ? 'disabled' : ''}>
        Confirm Plan
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

  const aliveHumans = alivePlayers.filter(p => !p.isBot);
  const humanMafia = aliveHumans.some(p => p.role === 'mafia');

  if (current.isBot || current.role !== 'mafia' || !humanMafia) {
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:8px">🌙 Night falls...</div>
        <div style="color:var(--text-secondary);margin-bottom:16px">
          ${current.role === 'mafia' ? 'The shadows move...' : 'You settle in.'}
        </div>
        <button class="btn btn-secondary btn-lg" onclick="continueNight()">Continue</button>
      </div>
    `;
  }

  // In solo mode, skip the turn prompt - go straight to target selection
  if (!state.showRole && !isSoloMode()) {
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:8px">🎭 <strong>${current.name}</strong> (Mafia)</div>
        <button class="btn btn-danger btn-lg" onclick="showCurrentRole()">Choose Target</button>
      </div>
    `;
  }

  const targets = alivePlayers.filter(p => p.role !== 'mafia');

  return `
    <div class="card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <span style="color:${ROLES.mafia.color}">${ROLES.mafia.icon}</span>
        <span>${current.name}</span>
        <span style="color:#f87171;font-size:0.85rem">(Mafia)</span>
      </div>

      <div class="section-label" style="color:#f87171">🎯 Choose your target</div>

      <div class="target-list">
        ${targets.map(p => {
          const plan = state.nightPlans[p.id];
          return `
            <div class="target-card ${state.selectedTarget === p.id ? 'selected' : ''}" onclick="selectTarget('${p.id}')">
              <div class="target-info">
                <div class="target-name">${p.isBot ? '🤖' : '👤'} ${p.name}</div>
                <div class="target-details">
                  <span class="target-location">📍 ${plan?.locationName || 'Unknown'}</span>
                  ${plan?.action?.name ? `<span class="target-action">→ ${plan.action.name}</span>` : ''}
                </div>
              </div>
              <div class="target-kill-btn">🎯 Kill</div>
            </div>
          `;
        }).join('')}
      </div>

      <button class="btn btn-danger btn-full btn-lg" onclick="confirmMafiaTarget()" ${!state.selectedTarget ? 'disabled' : ''}>
        Confirm Target
      </button>
    </div>
  `;
}

function renderDoctorPhase(alivePlayers) {
  const doctor = alivePlayers.find(p => p.role === 'doctor' && !p.isBot);

  if (!doctor) {
    return `
      <div class="card" style="text-align:center">
        <div style="color:var(--text-secondary);margin-bottom:12px">💉 The doctor makes their choice...</div>
        <button class="btn btn-secondary" onclick="skipDoctor()">Continue</button>
      </div>
    `;
  }

  if (!state.showRole) {
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:16px">💉 <strong>${doctor.name}</strong> (Doctor)</div>
        <button class="btn btn-lg" style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);color:white" onclick="showCurrentRole()">
          Choose Who to Save
        </button>
      </div>
    `;
  }

  return `
    <div class="card" style="border-color:#2563eb">
      <div class="section-label" style="color:#60a5fa">💉 Save one person from death tonight</div>
      <div class="target-grid">
        ${alivePlayers.map(p => `
          <button class="target-btn ${state.selectedSave === p.id ? 'selected' : ''}"
                  style="${state.selectedSave === p.id ? 'background:rgba(37,99,235,0.4);border-color:#2563eb' : ''}"
                  onclick="selectSave('${p.id}')">
            ${p.isBot ? '🤖 ' : ''}${p.name}
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
  const player = state.players.find(x => !x.isBot && x.alive);
  const myIntel = player ? state.intelResults[player.id] : null;

  return `
    <div class="card" style="text-align:center">
      <div style="font-size:1.5rem;margin-bottom:16px">💬 Discussion Time</div>
      ${myIntel ? `
        <div class="intel-box" style="text-align:left">
          <div class="intel-header">🔍 What you learned last night:</div>
          ${myIntel.heard ? `<div class="intel-item">👂 ${myIntel.heard}</div>` : ''}
          ${myIntel.saw ? `<div class="intel-item" style="font-weight:600">👁️ ${myIntel.saw}</div>` : ''}
          ${myIntel.nearby ? `<div class="intel-item" style="color:var(--text-secondary)">${myIntel.nearby}</div>` : ''}
        </div>
      ` : ''}
      <p style="color:var(--text-secondary);margin-bottom:16px">
        Discuss what happened. Share info, make accusations, defend yourself.
      </p>
      <button class="btn btn-warning btn-lg" onclick="proceedToVote()">Proceed to Vote</button>
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
    return `
      <div class="card" style="text-align:center">
        <div style="color:var(--text-secondary);margin-bottom:12px">🤖 ${current.name} is voting...</div>
        <button class="btn btn-secondary" onclick="skipBotVote()">Continue</button>
      </div>
    `;
  }

  if (!current.alive) {
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:8px">💀 You are dead</div>
        <div style="color:var(--text-secondary);margin-bottom:16px">The dead cannot vote.</div>
        <button class="btn btn-secondary" onclick="skipDeadVote()">Continue</button>
      </div>
    `;
  }

  // In solo mode, skip the turn prompt - go straight to voting
  if (!state.showRole && !isSoloMode()) {
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:16px">⚖️ <strong>${current.name}</strong>'s turn</div>
        <button class="btn btn-warning btn-lg" onclick="showCurrentRole()">Cast My Vote</button>
      </div>
    `;
  }

  const myIntel = state.intelResults[current.id];
  const otherPlayers = alivePlayers.filter(p => p.id !== current.id);

  return `
    <div class="card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="color:${ROLES[current.role]?.color}">${current.role !== 'mafia' ? ROLES[current.role]?.icon : '👤'}</span>
        <span>${current.name}</span>
      </div>

      ${myIntel ? `
        <div class="intel-box" style="margin-bottom:16px">
          <div class="intel-header" style="font-size:0.8rem">Your intel:</div>
          ${myIntel.heard ? `<div style="font-size:0.9rem">👂 ${myIntel.heard}</div>` : ''}
          ${myIntel.saw ? `<div style="font-size:0.9rem;font-weight:600">👁️ ${myIntel.saw}</div>` : ''}
        </div>
      ` : ''}

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
    { id: 'basics', label: '🎮 Basics' },
    { id: 'variant', label: '🔍 This Version' },
    { id: 'multiplayer', label: '👥 Multiplayer' }
  ];

  let content = '';
  if (state.instructionsTab === 'basics') {
    content = `
      <h3 style="color:var(--purple-accent);margin-bottom:12px">🎮 Mafia Basics</h3>
      <p><strong>Setup:</strong> Players get secret roles. Most are Villagers, some are Mafia.</p>
      <p style="margin-top:12px"><strong>Mafia</strong> know each other and eliminate one person each night. Win when they equal or outnumber town.</p>
      <p style="margin-top:12px"><strong>Town</strong> must find and vote out Mafia. Discussion and deduction are your weapons.</p>
      <p style="margin-top:12px"><strong>Cycle:</strong> Day → Night → Morning → Vote → repeat.</p>
    `;
  } else if (state.instructionsTab === 'variant') {
    content = `
      <h3 style="color:var(--purple-accent);margin-bottom:12px">🔍 This Version</h3>
      <div style="margin-bottom:16px">
        <h4 style="margin-bottom:4px">Location-Based Gameplay</h4>
        <p style="color:var(--text-secondary)">Choose WHERE to be and WHAT to do. Different risks and rewards.</p>
      </div>
      <div style="margin-bottom:16px">
        <h4 style="margin-bottom:4px">Intel System</h4>
        <p style="color:var(--text-secondary)">Actions give you intel. Higher risk = more intel.</p>
      </div>
      <div>
        <h4 style="margin-bottom:4px">Proximity Matters</h4>
        <p style="color:var(--text-secondary)">Being near the murder scene means you might see something.</p>
      </div>
    `;
  } else {
    content = `
      <h3 style="color:var(--purple-accent);margin-bottom:12px">👥 Multiplayer</h3>
      <p><strong>Devices:</strong> Share link to add devices. Each sees only what its players should see.</p>
      <p style="margin-top:12px"><strong>Turn Privacy:</strong> Others should look away during your turn.</p>
    `;
  }

  return `
    <div class="modal-overlay" onclick="hideInstructions()">
      <div class="instructions-modal" onclick="event.stopPropagation()">
        <div class="instructions-tabs">
          ${tabs.map(t => `
            <button class="instructions-tab ${state.instructionsTab === t.id ? 'active' : ''}" onclick="setInstructionsTab('${t.id}')">
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
      if (e.key === 'Enter') addPlayerFromInput();
    });
  }
}

// Initialize on load
render();
