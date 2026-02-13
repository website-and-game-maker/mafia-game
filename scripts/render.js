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

function getRiskPctLabel(risk) {
  return `${Math.round((Math.max(0, Math.min(5, risk || 0)) / 5) * 100)}%`;
}

function getAliveDiscussionHumans() {
  return getAlivePlayers().filter(player => !player.isBot);
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
          <input type="text" class="input ${state.nameError ? 'input-error' : ''}" id="newPlayerInput" placeholder="Add player name..."/>
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
          <span class="stat-display">Assigned: ${total}/${allPlayers.length}</span>
        </div>
        ${state.selectedPreset?.id === 'classic' ? '<div style="color:var(--text-secondary);font-size:0.85rem;margin-top:8px">Classic target at 12 players: 5 Mafia / 3 Doctor / 2 Detective.</div>' : ''}
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
        <div style="color:var(--text-secondary);margin-bottom:12px">🤖 ${current.name} is reviewing their role...</div>
        <div style="color:var(--text-secondary);font-size:0.9rem">Auto-continuing...</div>
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
        <div style="color:var(--text-secondary);margin-bottom:12px">🤖 ${current.name} is planning...</div>
        <div style="color:var(--text-secondary);font-size:0.9rem">Auto-continuing...</div>
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
  const targetCandidates = allPlayers.filter(player => player.alive && player.id !== current.id);

  const sortedLocations = [...state.selectedStory.locations].sort((x, y) => (x.risk || 0) - (y.risk || 0));
  const actionNeedsTarget = Boolean(state.selectedAction?.requiresTarget);
  const doorChoiceRequired = Boolean(location?.canLock && !isMafia && current.role !== 'detective');
  const canConfirm = Boolean(
    state.selectedLocation
      && state.selectedAction
      && (!actionNeedsTarget || state.selectedActionTarget)
      && (!doorChoiceRequired || state.selectedDoorOption)
  );

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
                <span class="risk-badge risk-${l.risk || 0}">Risk ${getRiskPctLabel(l.risk || 0)}</span>
              </div>
              ${l.canLock ? '<span style="font-size:0.8rem;color:#4ade80">🔒 Private room option</span>' : ''}
            </div>
          `).join('')}
      </div>

      ${location ? `
        <div class="section-label ${isMafia ? 'mafia-section-label' : ''}">
          ${isMafia ? '2. Mafia-only planning options' : '2. What will you do there?'}
        </div>
        <div class="action-list">
          ${actions.map(ac => `
            <div class="action-card ${isMafia ? 'mafia-action-card' : ''} ${state.selectedAction?.id === ac.id ? 'selected' : ''}" onclick="selectAction('${ac.id}')">
              <div class="action-header">
                <span class="action-name">${ac.name}</span>
                ${!isMafia ? `
                  <div class="action-stats">
                    <span class="${getIntelClass(ac.intel || 0)}">Intel ${Math.round((ac.intel || 0) * 100)}%</span>
                    <span class="${getRiskClass(ac.risk || 0)}">Risk ${getRiskPctLabel(ac.risk || 0)}</span>
                  </div>
                ` : `<span style="color:#fca5a5;font-size:0.8rem">Mafia</span>`}
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

      ${location && location.canLock && state.selectedAction && !isMafia && current.role !== 'detective' ? `
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

      ${location && location.canLock && state.selectedAction && current.role === 'detective' ? `
        <div class="card detective-lock-note">
          <strong>Detective rule:</strong> detectives stay in snoop/linger posture and never fully lock in.
        </div>
      ` : ''}

      <button class="btn btn-primary btn-full btn-lg" onclick="confirmDayPlan()" ${!canConfirm ? 'disabled' : ''}>
        ${isMafia ? 'Lock In Mafia Plan' : 'Confirm Plan'}
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
    scheduleAutoAdvance(`night_${current.id}_${state.currentPlayerIndex}`, 'continueNight');
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:8px">🌙 Night falls...</div>
        <div style="color:var(--text-secondary);margin-bottom:16px">
          ${current.role === 'mafia' ? 'The shadows move...' : 'You settle in.'}
        </div>
        <div style="color:var(--text-secondary);font-size:0.9rem">Auto-continuing...</div>
      </div>
    `;
  }
  clearAutoAdvance();

  // In solo mode, skip the turn prompt - go straight to target selection
  if (!state.showRole && !isSoloMode()) {
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:8px">📲 Pass to <strong>${current.name}</strong></div>
        <p style="color:var(--text-secondary);margin-bottom:16px">Night action is private.</p>
        <button class="btn btn-danger btn-lg" onclick="showCurrentRole()">Open Mafia Night Console</button>
      </div>
    `;
  }

  const mafiaView = getVisibleTargetsForMafia(current.id, alivePlayers);
  const targets = mafiaView.targets || [];
  const visionNote = mafiaView.mode === 'nearby'
    ? 'You only see people currently around your area.'
    : 'No one nearby, so your search spread wider across the map.';
  const snooperIntel = state.mafiaSnooperIntel[current.id] || {};

  return `
    <div class="card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <span style="color:${ROLES.mafia.color}">${ROLES.mafia.icon}</span>
        <span>${current.name}</span>
        <span style="color:#f87171;font-size:0.85rem">(Mafia)</span>
      </div>

      <div class="section-label" style="color:#f87171">🎯 Choose your target</div>
      <div class="mafia-intel">
        <div class="mafia-intel-header">Mafia visibility</div>
        <div style="font-size:0.9rem;color:#fecaca">${visionNote}</div>
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
                ${snoopers.length > 0 ? `<div class="target-snoopers">👀 Spotted snoopers nearby: ${snoopers.join(', ')}</div>` : ''}
              </div>
              <div class="target-kill-btn">🎯 Kill</div>
            </div>
          `;
        }).join('')}
      </div>
      ` : `
      <div class="card" style="margin-bottom:16px;text-align:center">
        <div style="color:var(--text-secondary)">No eligible targets visible.</div>
      </div>
      `}

      <button class="btn btn-danger btn-full btn-lg" onclick="confirmMafiaTarget()" ${!state.selectedTarget ? 'disabled' : ''}>
        Confirm Target
      </button>
    </div>
  `;
}

function renderDoctorPhase(alivePlayers) {
  const doctor = alivePlayers.find(p => p.role === 'doctor' && !p.isBot);

  if (!doctor) {
    scheduleAutoAdvance(`doctor_auto_${state.dayNumber}`, 'skipDoctor');
    return `
      <div class="card" style="text-align:center">
        <div style="color:var(--text-secondary);margin-bottom:12px">💉 The doctor makes their choice...</div>
        <div style="color:var(--text-secondary);font-size:0.9rem">Auto-continuing...</div>
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
      <p style="color:var(--text-secondary);margin-bottom:12px">Save chance is not guaranteed and drops when multiple attackers focus one target.</p>
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
  if (!current) {
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.5rem;margin-bottom:16px">💬 Discussion Time</div>
        <button class="btn btn-warning btn-lg" onclick="proceedToVote()">Proceed to Vote</button>
      </div>
    `;
  }

  const aliveHumans = getAliveDiscussionHumans();
  const nextHuman = getNextAliveHumanIndex(state.currentPlayerIndex);

  if (!state.showRole && !isSoloMode()) {
    clearAutoAdvance();
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:8px">📲 Pass to <strong>${current.name}</strong></div>
        <p style="color:var(--text-secondary);margin-bottom:16px">Discussion notes are private until you share them.</p>
        <button class="btn btn-warning btn-lg" onclick="openDiscussionForCurrent()">Open Discussion Notes</button>
      </div>
    `;
  }

  if (!state.showRole && isSoloMode()) {
    state.showRole = true;
  }

  const myIntel = state.intelResults[current.id] || {
    heard: 'Nothing conclusive tonight. Compare stories before voting.',
    saw: null,
    nearby: null
  };
  const dayMessages = state.chatMessages.filter(message => message.day === state.dayNumber);
  const chatIsProminent = aliveHumans.length > 1 || state.players.length > 1;

  return `
    <div class="card">
      <div style="font-size:1.5rem;margin-bottom:16px">💬 Discussion Time</div>

      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="color:${ROLES[current.role]?.color}">${ROLES[current.role]?.icon}</span>
        <strong>${current.name}</strong>
      </div>

      <div class="intel-box" style="text-align:left">
        <div class="intel-header">🔍 What you learned last night:</div>
        ${myIntel.heard ? `<div class="intel-item">👂 ${myIntel.heard}</div>` : ''}
        ${myIntel.saw ? `<div class="intel-item" style="font-weight:600">👁️ ${myIntel.saw}</div>` : ''}
        ${myIntel.nearby ? `<div class="intel-item" style="color:var(--text-secondary)">${myIntel.nearby}</div>` : ''}
        ${myIntel.tracked ? `<div class="intel-item" style="color:var(--text-secondary)">${myIntel.tracked}</div>` : ''}
      </div>

      <div class="chat-panel ${chatIsProminent ? 'chat-panel-prominent' : ''}">
        <div class="chat-header">🗨️ Discussion Chat</div>
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
                 placeholder="Type message and press Enter"/>
          <button class="btn btn-secondary btn-small" onclick="sendDiscussionMessage()">Send</button>
        </div>
      </div>

      <p style="color:var(--text-secondary);margin-bottom:16px">
        Discuss what happened. Share info, make accusations, defend yourself.
      </p>
      <button class="btn btn-warning btn-lg" onclick="advanceDiscussion()">
        ${nextHuman !== -1 && !isSoloMode() ? 'Pass to Next Player' : 'Proceed to Vote'}
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
        <div style="color:var(--text-secondary);margin-bottom:12px">🤖 ${current.name} is voting...</div>
        <div style="color:var(--text-secondary);font-size:0.9rem">Auto-continuing...</div>
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
        <div style="color:var(--text-secondary);font-size:0.9rem">Auto-continuing...</div>
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

  const myIntel = state.intelResults[current.id] || {
    heard: 'No strong clue from last night.',
    saw: null,
    nearby: null
  };
  const otherPlayers = alivePlayers.filter(p => p.id !== current.id);

  return `
    <div class="card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="color:${ROLES[current.role]?.color}">${current.role !== 'mafia' ? ROLES[current.role]?.icon : '👤'}</span>
        <span>${current.name}</span>
      </div>

      <div class="intel-box" style="margin-bottom:16px">
        <div class="intel-header" style="font-size:0.8rem">Your intel:</div>
        ${myIntel.heard ? `<div style="font-size:0.9rem">👂 ${myIntel.heard}</div>` : ''}
        ${myIntel.saw ? `<div style="font-size:0.9rem;font-weight:600">👁️ ${myIntel.saw}</div>` : ''}
        ${myIntel.nearby ? `<div style="font-size:0.9rem;color:var(--text-secondary)">${myIntel.nearby}</div>` : ''}
      </div>

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
    { id: 'variant', label: '🧩 Gameplay' },
    { id: 'multiplayer', label: '👥 Modes' }
  ];

  let content = '';
  if (state.instructionsTab === 'basics') {
    content = `
      <h3 style="color:var(--purple-accent);margin-bottom:12px">🎮 Mafia Basics</h3>
      <p><strong>Town wins:</strong> all Mafia eliminated.</p>
      <p style="margin-top:8px"><strong>Mafia wins:</strong> living Mafia are equal to or greater than living Town.</p>
      <p style="margin-top:12px"><strong>Roles:</strong></p>
      <p style="color:var(--text-secondary)">Villager: gather intel and vote.</p>
      <p style="color:var(--text-secondary)">Mafia: coordinate kills secretly.</p>
      <p style="color:var(--text-secondary)">Doctor: try to save one target (not guaranteed).</p>
      <p style="color:var(--text-secondary)">Detective: stronger snoop intel, harder to notice.</p>
      <p style="margin-top:12px"><strong>Cycle:</strong> Reveal → Day Plan → Night → Morning → Discussion → Vote.</p>
    `;
  } else if (state.instructionsTab === 'variant') {
    content = `
      <h3 style="color:var(--purple-accent);margin-bottom:12px">🧩 This Version</h3>
      <div style="margin-bottom:16px">
        <h4 style="margin-bottom:4px">1) Day Planning</h4>
        <p style="color:var(--text-secondary)">Pick a location, action, and (if available) door stance. Riskier plays usually produce better intel.</p>
      </div>
      <div style="margin-bottom:16px">
        <h4 style="margin-bottom:4px">2) Night Resolution</h4>
        <p style="color:var(--text-secondary)">Mafia picks a kill target from what they can see nearby. If no one is nearby, they search wider.</p>
      </div>
      <div style="margin-bottom:16px">
        <h4 style="margin-bottom:4px">3) Morning Intel</h4>
        <p style="color:var(--text-secondary)">Everyone gets intel text, even if it is inconclusive. Detectives get stronger clues.</p>
      </div>
      <div>
        <h4 style="margin-bottom:4px">4) Discussion Then Vote</h4>
        <p style="color:var(--text-secondary)">Each player reviews intel, discusses, then everyone votes to eliminate one person.</p>
      </div>
    `;
  } else {
    content = `
      <h3 style="color:var(--purple-accent);margin-bottom:12px">👥 Modes</h3>
      <p><strong>Solo:</strong> no pass prompts, bot turns auto-advance with readable pacing.</p>
      <p style="margin-top:8px"><strong>Pass-and-Play:</strong> prompts say "Pass to [name]" for private turns.</p>
      <p style="margin-top:8px"><strong>Discussion chat:</strong> if multiple players share one device, messages show sender names.</p>
      <p style="margin-top:8px"><strong>Bot chat:</strong> when enabled, bots can add short discussion lines during debate.</p>
      <p style="margin-top:8px"><strong>Multi-device:</strong> lobby/chat/sync support is designed to stay compatible with this same phase flow.</p>
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
        <div class="settings-row" style="display:block">
          <div style="margin-bottom:8px">Narrator Mode</div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-small ${state.settings.narratorMode === 'auto' ? 'btn-primary' : 'btn-secondary'}" onclick="setNarratorMode('auto')">Auto</button>
            <button class="btn btn-small ${state.settings.narratorMode === 'human' ? 'btn-primary' : 'btn-secondary'}" onclick="setNarratorMode('human')">Human</button>
          </div>
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
          <div style="margin-bottom:8px">Bot Turn Pace: ${state.botDelayMs}ms</div>
          <input type="range" min="500" max="2200" step="100" value="${state.botDelayMs}" oninput="setBotDelay(this.value)" style="width:100%"/>
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
