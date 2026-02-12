// =============================================================================
// MAFIA GAME - Main Game Logic
// =============================================================================

// -----------------------------------------------------------------------------
// CONSTANTS & DATA
// -----------------------------------------------------------------------------

const ROLES = {
  villager: { name: 'Villager', color: '#6b8e23', icon: '👤', description: 'Survive and find the Mafia' },
  mafia: { name: 'Mafia', color: '#8b0000', icon: '🎭', description: 'Eliminate villagers without being caught' },
  doctor: { name: 'Doctor', color: '#4169e1', icon: '💉', description: 'Save one person from death each night' },
  detective: { name: 'Detective', color: '#9932cc', icon: '🔍', description: 'Investigate locations to find clues' }
};

const ROLE_PRESETS = [
  { id: 'classic', name: 'Classic', description: 'Balanced gameplay', mafia: 20, doctor: 10, detective: 10, color: '#22c55e' },
  { id: 'brutal', name: 'Brutal', description: 'High mafia ratio', mafia: 30, doctor: 8, detective: 8, color: '#f97316' },
  { id: 'chaos', name: 'Chaos', description: 'Few villagers, many powers', mafia: 30, doctor: 20, detective: 20, color: '#ef4444' },
  { id: 'detective', name: 'Mystery', description: 'No doctor, pure deduction', mafia: 20, doctor: 0, detective: 30, color: '#a855f7' }
];

const STORY_PRESETS = [
  {
    id: 'mansion',
    name: 'Blackwood Estate',
    intro: 'Thunder rolls over the moors...',
    mood: 'A Victorian mansion shrouded in secrets.',
    setting: 'Ground floor: foyer, parlor, kitchen. Upper floor: bedrooms, library.',
    locations: [
      { id: 'bedroom', name: 'Your Bedroom', risk: 0, canLock: true, actions: [
        { id: 'lock', name: '🔒 Lock door', intel: 0, risk: 0, desc: 'Completely safe.' },
        { id: 'listen', name: '👂 Listen at door', intel: 0.3, risk: 1, desc: 'Hear footsteps.' }
      ]},
      { id: 'hallway', name: 'Hallway', risk: 2, actions: [
        { id: 'walk', name: '🚶 Walk through', intel: 0.3, risk: 2, desc: 'Quick pass.' },
        { id: 'linger', name: '👀 Linger', intel: 0.5, risk: 3, desc: 'Watch who comes.' }
      ]},
      { id: 'library', name: 'Library', risk: 1, actions: [
        { id: 'read', name: '📖 Read', intel: 0.15, risk: 1, desc: 'Notice who enters.' },
        { id: 'search', name: '🔍 Search', intel: 0.6, risk: 3, desc: 'Examine thoroughly.' }
      ]},
      { id: 'kitchen', name: 'Kitchen', risk: 2, actions: [
        { id: 'snack', name: '🍎 Snack', intel: 0.2, risk: 2, desc: 'Note who else visits.' },
        { id: 'cellar', name: '🍷 Cellar', intel: 0.6, risk: 4, desc: 'Dark and isolated.' }
      ]}
    ],
    mafiaActions: [
      { id: 'prowl', name: '🌙 Prowl halls', desc: 'Move silently.' },
      { id: 'ambush', name: '⚔️ Set ambush', desc: 'Wait in dark corner.' }
    ]
  },
  {
    id: 'train',
    name: 'Midnight Express',
    intro: 'The train plunges through a blizzard...',
    mood: 'A luxury train with secrets.',
    setting: 'Compartments, dining car, smoking lounge.',
    locations: [
      { id: 'compartment', name: 'Your Compartment', risk: 0, canLock: true, actions: [
        { id: 'lock', name: '🔒 Lock and sleep', intel: 0, risk: 0, desc: 'Sealed away.' },
        { id: 'peek', name: '👁️ Peek out', intel: 0.4, risk: 2, desc: 'Watch corridor.' }
      ]},
      { id: 'dining', name: 'Dining Car', risk: 1, actions: [
        { id: 'drink', name: '🍷 Nightcap', intel: 0.2, risk: 1, desc: 'Watch who wanders.' },
        { id: 'linger', name: '☕ Linger', intel: 0.4, risk: 2, desc: 'Extended observation.' }
      ]},
      { id: 'lounge', name: 'Lounge', risk: 2, actions: [
        { id: 'smoke', name: '🚬 Smoke', intel: 0.25, risk: 2, desc: 'Good visibility.' },
        { id: 'observe', name: '👀 Observe', intel: 0.55, risk: 3, desc: 'Clear sightlines.' }
      ]},
      { id: 'luggage', name: 'Luggage Car', risk: 3, actions: [
        { id: 'check', name: '🧳 Check trunk', intel: 0.35, risk: 3, desc: 'See who lurks.' },
        { id: 'hide', name: '📦 Hide', intel: 0.6, risk: 4, desc: 'Perfect hiding.' }
      ]}
    ],
    mafiaActions: [
      { id: 'stalk', name: '🌙 Stalk cars', desc: 'Move between carriages.' },
      { id: 'corner', name: '🚪 Corner someone', desc: 'Trap between cars.' }
    ]
  },
  {
    id: 'island',
    name: 'Coral Bay Resort',
    intro: 'Paradise turns to prison...',
    mood: 'A tropical resort turned nightmare.',
    setting: 'Lodge on hill. Bungalows. Jungle path.',
    locations: [
      { id: 'bungalow', name: 'Your Bungalow', risk: 0, canLock: true, actions: [
        { id: 'lock', name: '🔒 Lock up', intel: 0, risk: 0, desc: 'Board windows.' },
        { id: 'porch', name: '🌴 Sit on porch', intel: 0.3, risk: 1, desc: 'Watch beach.' }
      ]},
      { id: 'beach', name: 'Beach Path', risk: 2, actions: [
        { id: 'walk', name: '🏖️ Stroll', intel: 0.35, risk: 2, desc: 'See who else is out.' },
        { id: 'hide', name: '🌴 Hide in palms', intel: 0.55, risk: 3, desc: 'Watch concealed.' }
      ]},
      { id: 'lodge', name: 'Main Lodge', risk: 1, actions: [
        { id: 'bar', name: '🍹 Bar', intel: 0.25, risk: 1, desc: 'See everyone.' },
        { id: 'balcony', name: '🌅 Balcony', intel: 0.45, risk: 2, desc: 'Overlooks resort.' }
      ]},
      { id: 'lighthouse', name: 'Lighthouse', risk: 4, actions: [
        { id: 'climb', name: '🗼 Climb top', intel: 0.7, risk: 4, desc: 'See everything.' },
        { id: 'basement', name: '🔦 Basement', intel: 0.6, risk: 5, desc: 'Dark, isolated.' }
      ]}
    ],
    mafiaActions: [
      { id: 'beach', name: '🌙 Hunt beach', desc: 'Prowl shoreline.' },
      { id: 'jungle', name: '🌴 Ambush jungle', desc: 'Jungle hides sins.' }
    ]
  },
  {
    id: 'space',
    name: 'Station Prometheus',
    intro: 'Life support failing...',
    mood: 'A research station at the edge of space.',
    setting: 'Hub connects to quarters, medical, cargo.',
    locations: [
      { id: 'pod', name: 'Your Sleep Pod', risk: 0, canLock: true, actions: [
        { id: 'seal', name: '🔒 Seal pod', intel: 0, risk: 0, desc: 'Airtight.' },
        { id: 'monitor', name: '📺 Watch cam', intel: 0.35, risk: 0, desc: 'Security feed.' }
      ]},
      { id: 'hub', name: 'Central Hub', risk: 2, actions: [
        { id: 'transit', name: '🚶 Pass through', intel: 0.3, risk: 2, desc: 'Everyone crosses.' },
        { id: 'console', name: '🖥️ Check systems', intel: 0.45, risk: 2, desc: 'Logs show who went where.' }
      ]},
      { id: 'medbay', name: 'Medical Bay', risk: 1, actions: [
        { id: 'rest', name: '🛏️ Rest', intel: 0.2, risk: 1, desc: 'Legitimate reason.' },
        { id: 'records', name: '📋 Check records', intel: 0.45, risk: 2, desc: 'Files reveal much.' }
      ]},
      { id: 'cargo', name: 'Cargo Hold', risk: 3, actions: [
        { id: 'inventory', name: '📦 Inventory', intel: 0.35, risk: 3, desc: 'Isolated area.' },
        { id: 'hide', name: '🫥 Hide', intel: 0.6, risk: 4, desc: 'Perfect concealment.' }
      ]}
    ],
    mafiaActions: [
      { id: 'hunt', name: '🌙 Hunt station', desc: 'Move systematically.' },
      { id: 'sabotage', name: '⚡ Create distraction', desc: 'Trigger alert.' }
    ]
  }
];

const BOT_NAMES = ['Alex', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Quinn', 'Avery', 'Parker', 'Sage', 'Blake', 'Drew', 'Reese'];

// -----------------------------------------------------------------------------
// GAME STATE
// -----------------------------------------------------------------------------

const state = {
  screen: 'setup',
  gameCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
  soloPlayerName: '',
  settings: {
    aiNarrator: true,
    botChat: true,
    deathAnimations: true,
    sounds: true
  },
  players: [],
  bots: [],
  selectedPreset: ROLE_PRESETS[0],
  roleConfig: { mafia: 1, doctor: 1, detective: 0, villager: 0 },
  selectedStory: STORY_PRESETS[0],
  gamePhase: 'reveal',
  dayNumber: 1,
  narrative: '',
  currentPlayerIndex: 0,
  showRole: false,
  nightPlans: {},
  nightTarget: null,
  mafiaVotes: {},
  doctorSave: null,
  votes: {},
  intelResults: {},
  winner: null,
  announcement: null,
  selectedLocation: null,
  selectedAction: null,
  selectedDoorOption: null,
  selectedTarget: null,
  selectedSave: null,
  selectedVote: null,
  showInstructions: false,
  showSettings: false,
  instructionsTab: 'basics',
  nameError: ''
};

// -----------------------------------------------------------------------------
// UTILITY FUNCTIONS
// -----------------------------------------------------------------------------

function getAllPlayers() {
  // In solo lobby, include the solo player name as a player
  if (state.screen === 'solo_lobby' && state.soloPlayerName.trim() && state.players.length === 0) {
    return [{ name: state.soloPlayerName.trim(), isBot: false }, ...state.bots];
  }
  return [...state.players, ...state.bots];
}

function getAlivePlayers() {
  return getAllPlayers().filter(p => p.alive);
}

function getCurrentPlayer() {
  return getAllPlayers()[state.currentPlayerIndex];
}

function calculateRolesFromPreset(preset, count) {
  if (count < 3) return { mafia: 0, doctor: 0, detective: 0, villager: 0 };
  const mafia = Math.max(1, Math.round(count * preset.mafia / 100));
  // Doctor can be 0 if preset explicitly sets it to 0, otherwise at least 1
  const doctor = preset.doctor === 0 ? 0 : Math.max(1, Math.round(count * preset.doctor / 100));
  const detective = count >= 5 ? Math.max(0, Math.round(count * preset.detective / 100)) : 0;
  return {
    mafia,
    doctor,
    detective,
    villager: Math.max(0, count - mafia - doctor - detective)
  };
}

function updateRoleConfig() {
  // Only recalculate from preset if one is selected
  if (state.selectedPreset) {
    state.roleConfig = calculateRolesFromPreset(state.selectedPreset, getAllPlayers().length);
  } else {
    // Keep current role config but update villager count based on player count
    const count = getAllPlayers().length;
    state.roleConfig.villager = Math.max(0, count - state.roleConfig.mafia - state.roleConfig.doctor - state.roleConfig.detective);
  }
}

function getTotalRoles() {
  return state.roleConfig.mafia + state.roleConfig.doctor + state.roleConfig.detective + (state.roleConfig.villager || 0);
}

function getStartWarnings() {
  const warnings = [];
  if (state.roleConfig.villager < 0) warnings.push('Not enough villagers!');
  if (state.roleConfig.mafia === 0 && getAllPlayers().length >= 3) warnings.push('No mafia assigned!');
  return warnings;
}

function canStart() {
  const allPlayers = getAllPlayers();
  const humans = state.players.filter(p => !p.isBot);
  if (allPlayers.length < 3) return false;
  if (state.screen === 'multi_lobby' && humans.length === 0) return false;
  if (state.roleConfig.villager < 0) return false;
  return true;
}

function getStartBlockReason() {
  const allPlayers = getAllPlayers();
  const humans = state.players.filter(p => !p.isBot);
  if (allPlayers.length < 3) return `Need 3+ players (${allPlayers.length})`;
  if (state.screen === 'solo_lobby' && !state.soloPlayerName.trim()) return 'Enter your name';
  if (state.screen === 'multi_lobby' && humans.length === 0) return 'Need at least 1 human';
  if (state.roleConfig.villager < 0) return 'Too many special roles!';
  return null;
}

function validateName(name) {
  if (!name.trim()) return 'Enter a name';
  if (getAllPlayers().some(p => p.name.toLowerCase() === name.trim().toLowerCase())) return 'Name already taken';
  return null;
}

// -----------------------------------------------------------------------------
// PLAYER/BOT MANAGEMENT
// -----------------------------------------------------------------------------

function addBot() {
  const allPlayers = getAllPlayers();
  const usedNames = allPlayers.map(p => p.name);
  const available = BOT_NAMES.filter(n => !usedNames.includes(n));
  if (!available.length || allPlayers.length >= 16) return;

  state.bots.push({
    id: 'bot' + Date.now(),
    name: available[Math.floor(Math.random() * available.length)],
    isBot: true,
    alive: true
  });
  updateRoleConfig();
  render();

  setTimeout(() => {
    const list = document.querySelector('.bot-list');
    if (list) list.scrollTop = list.scrollHeight;
  }, 50);
}

function removeBot(id) {
  state.bots = state.bots.filter(b => b.id !== id);
  updateRoleConfig();
  render();
}

function addPlayer(name) {
  const error = validateName(name);
  if (error) {
    state.nameError = error;
    render();
    return false;
  }
  state.players.push({
    id: 'p' + Date.now(),
    name: name.trim(),
    isBot: false,
    alive: true
  });
  state.nameError = '';
  updateRoleConfig();
  render();
  return true;
}

function removePlayer(id) {
  state.players = state.players.filter(p => p.id !== id);
  updateRoleConfig();
  render();
}

function adjustRole(role, delta) {
  const newValue = Math.max(0, (state.roleConfig[role] || 0) + delta);
  const allPlayers = getAllPlayers();
  const otherTotal = getTotalRoles() - (state.roleConfig[role] || 0);
  const newTotal = otherTotal + newValue;

  if (delta > 0 && newTotal > allPlayers.length && state.roleConfig.villager <= 0) return;

  state.roleConfig[role] = newValue;
  state.roleConfig.villager = Math.max(0, allPlayers.length - state.roleConfig.mafia - state.roleConfig.doctor - state.roleConfig.detective);

  // Clear preset when manually adjusting roles
  state.selectedPreset = null;

  render();
}

function isPlusDisabled(role) {
  const allPlayers = getAllPlayers();
  const total = getTotalRoles();
  return total >= allPlayers.length && state.roleConfig.villager <= 0;
}

// -----------------------------------------------------------------------------
// TURN MANAGEMENT
// -----------------------------------------------------------------------------

function findNextHuman(startIndex, filter = null) {
  const allPlayers = getAllPlayers();
  for (let i = startIndex + 1; i < allPlayers.length; i++) {
    if (allPlayers[i].alive && !allPlayers[i].isBot && (!filter || filter(allPlayers[i]))) return i;
  }
  return -1;
}

function findNextAlive(startIndex) {
  const allPlayers = getAllPlayers();
  for (let i = startIndex + 1; i < allPlayers.length; i++) {
    if (allPlayers[i].alive && !allPlayers[i].isBot) return i;
  }
  return -1;
}

// -----------------------------------------------------------------------------
// GAME START
// -----------------------------------------------------------------------------

function startGame() {
  if (!canStart()) return;

  if (state.screen === 'solo_lobby') {
    state.players = [{
      id: 'p_solo',
      name: state.soloPlayerName.trim(),
      isBot: false,
      alive: true
    }];
  }

  const allPlayers = getAllPlayers();
  const roles = [];

  roles.push(...Array(state.roleConfig.mafia).fill('mafia'));
  roles.push(...Array(state.roleConfig.doctor).fill('doctor'));
  roles.push(...Array(state.roleConfig.detective).fill('detective'));
  while (roles.length < allPlayers.length) roles.push('villager');

  // Shuffle roles
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  state.players = state.players.map((p, i) => ({ ...p, role: roles[i], alive: true }));
  state.bots = state.bots.map((b, i) => ({ ...b, role: roles[state.players.length + i], alive: true }));

  state.screen = 'game';
  state.gamePhase = 'reveal';
  state.dayNumber = 1;
  state.narrative = state.selectedStory.mood;
  state.currentPlayerIndex = 0;
  state.showRole = false;

  const allPlayers2 = getAllPlayers();
  let firstHuman = allPlayers2.findIndex(p => !p.isBot);
  if (firstHuman === -1) firstHuman = 0;
  state.currentPlayerIndex = firstHuman;

  render();
}

// -----------------------------------------------------------------------------
// BOT AI
// -----------------------------------------------------------------------------

function botMakeDecisions(phase) {
  const allPlayers = getAllPlayers();
  const alivePlayers = getAlivePlayers();
  const aliveBots = alivePlayers.filter(p => p.isBot);

  if (phase === 'day') {
    aliveBots.forEach(bot => {
      const location = state.selectedStory.locations[Math.floor(Math.random() * state.selectedStory.locations.length)];
      const action = location.actions[Math.floor(Math.random() * location.actions.length)];
      state.nightPlans[bot.id] = { location: location.id, locationName: location.name, action };
    });
  }

  if (phase === 'night') {
    const mafiaBots = aliveBots.filter(b => b.role === 'mafia');
    const targets = alivePlayers.filter(p => p.role !== 'mafia');
    const investigatingTargets = targets.filter(t => state.nightPlans[t.id]?.action?.intel >= 0.5);

    mafiaBots.forEach(bot => {
      const target = investigatingTargets.length && Math.random() > 0.3
        ? investigatingTargets[Math.floor(Math.random() * investigatingTargets.length)]
        : targets[Math.floor(Math.random() * targets.length)];
      if (target) state.mafiaVotes[bot.id] = target.id;
    });
  }

  if (phase === 'morning_doctor') {
    const doctorBot = aliveBots.find(b => b.role === 'doctor');
    if (doctorBot) {
      state.doctorSave = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]?.id;
    }
  }

  if (phase === 'vote') {
    aliveBots.forEach(bot => {
      const targets = alivePlayers.filter(p =>
        p.id !== bot.id && (bot.role === 'mafia' ? p.role !== 'mafia' : true)
      );
      const target = targets[Math.floor(Math.random() * targets.length)];
      if (target) state.votes[bot.id] = target.id;
    });
  }
}

// -----------------------------------------------------------------------------
// NIGHT PHASE PROCESSING
// -----------------------------------------------------------------------------

function processNight() {
  const voteCounts = {};
  Object.values(state.mafiaVotes).forEach(targetId => {
    if (targetId) voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });

  const sorted = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
  const targetId = sorted[0]?.[0];
  state.nightTarget = targetId;

  const alivePlayers = getAlivePlayers();
  const targetLocation = state.nightPlans[targetId]?.location;
  const newIntel = {};

  alivePlayers.forEach(player => {
    if (player.role === 'mafia' || player.id === targetId) return;

    const plan = state.nightPlans[player.id];
    if (!plan) return;

    const action = plan.action;
    const sameLocation = plan.location === targetLocation;
    let intel = null;
    const roll = Math.random();

    if (action.intel === 0) {
      intel = { heard: 'nothing (secured)', saw: null };
    } else if (sameLocation && roll < action.intel) {
      const killers = alivePlayers.filter(x => x.role === 'mafia');
      if (roll < action.intel * 0.7) {
        const seenKiller = killers[Math.floor(Math.random() * killers.length)];
        intel = { heard: 'violent struggle', saw: `${seenKiller?.name} fleeing` };
      } else {
        intel = { heard: 'screams', saw: 'shadowy figure' };
      }
    } else if (sameLocation) {
      intel = { heard: 'disturbing sounds', saw: null };
    }

    const othersAtLocation = alivePlayers.filter(x =>
      x.id !== player.id && state.nightPlans[x.id]?.location === plan.location
    );
    if (othersAtLocation.length > 0 && action.intel > 0) {
      intel = intel || {};
      intel.nearby = `Also at ${plan.locationName}: ${othersAtLocation.map(x => x.name).join(', ')}`;
    }

    if (intel) newIntel[player.id] = intel;
  });

  state.intelResults = newIntel;
  state.gamePhase = 'morning_doctor';

  setTimeout(() => {
    botMakeDecisions('morning_doctor');
    render();
  }, 300);
}

// -----------------------------------------------------------------------------
// MORNING PHASE PROCESSING
// -----------------------------------------------------------------------------

function processMorning() {
  const allPlayers = getAllPlayers();
  const target = allPlayers.find(p => p.id === state.nightTarget);
  const saved = allPlayers.find(p => p.id === state.doctorSave);
  let deathMessage = '';

  if (target && state.nightTarget !== state.doctorSave) {
    if (target.isBot) {
      state.bots = state.bots.map(b => b.id === target.id ? { ...b, alive: false } : b);
    } else {
      state.players = state.players.map(p => p.id === target.id ? { ...p, alive: false } : p);
    }
    deathMessage = `${target.name} was found dead.\n\nThey were the ${ROLES[target.role].name}.`;
  } else if (state.nightTarget && state.doctorSave && state.nightTarget === state.doctorSave) {
    deathMessage = `${saved?.name} was attacked but survived!\n\nThe doctor saved them.`;
  } else {
    deathMessage = 'The night passed peacefully.';
  }

  state.nightTarget = null;
  state.mafiaVotes = {};
  state.doctorSave = null;

  if (!checkWin()) {
    state.announcement = deathMessage;
    state.gamePhase = 'announcement';
    render();
  }
}

function afterAnnouncement() {
  state.announcement = null;
  state.gamePhase = 'discussion';
  state.currentPlayerIndex = 0;
  state.showRole = false;

  setTimeout(() => {
    botMakeDecisions('discussion');
    render();
  }, 500);
}

// -----------------------------------------------------------------------------
// VOTE PROCESSING
// -----------------------------------------------------------------------------

function processVote() {
  const allPlayers = getAllPlayers();
  const voteCounts = {};

  Object.values(state.votes).forEach(targetId => {
    if (targetId) voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });

  const sorted = Object.entries(voteCounts).sort((x, y) => y[1] - x[1]);
  let voteMessage = '';

  if (sorted.length > 0 && (sorted.length === 1 || sorted[0][1] > (sorted[1]?.[1] || 0))) {
    const eliminated = allPlayers.find(p => p.id === sorted[0][0]);
    if (eliminated) {
      if (eliminated.isBot) {
        state.bots = state.bots.map(b => b.id === eliminated.id ? { ...b, alive: false } : b);
      } else {
        state.players = state.players.map(p => p.id === eliminated.id ? { ...p, alive: false } : p);
      }
      voteMessage = `Vote decided.\n\n${eliminated.name} eliminated.\n\nThey were the ${ROLES[eliminated.role].name}.`;
    }
  } else {
    voteMessage = 'Vote tied. No one eliminated.';
  }

  state.votes = {};
  state.nightPlans = {};
  state.intelResults = {};

  if (!checkWin()) {
    state.announcement = voteMessage;
    state.gamePhase = 'vote_announcement';
    render();
  }
}

function afterVoteAnnouncement() {
  state.announcement = null;
  state.gamePhase = 'day';
  state.dayNumber++;
  state.currentPlayerIndex = 0;
  state.showRole = false;
  state.selectedLocation = null;
  state.selectedAction = null;

  const allPlayers = getAllPlayers();
  let firstHuman = allPlayers.findIndex(p => p.alive && !p.isBot);
  if (firstHuman !== -1) state.currentPlayerIndex = firstHuman;

  setTimeout(() => {
    botMakeDecisions('day');
    render();
  }, 300);
}

// -----------------------------------------------------------------------------
// WIN CONDITION
// -----------------------------------------------------------------------------

function checkWin() {
  const alivePlayers = getAlivePlayers();
  const mafiaAlive = alivePlayers.filter(p => p.role === 'mafia').length;
  const townAlive = alivePlayers.filter(p => p.role !== 'mafia').length;
  const humansAlive = alivePlayers.filter(p => !p.isBot).length;

  // All humans dead = mafia wins
  if (state.screen === 'game' && humansAlive === 0) {
    state.winner = 'mafia';
    state.gamePhase = 'gameover';
    render();
    return true;
  }

  // No mafia = town wins
  if (mafiaAlive === 0) {
    state.winner = 'town';
    state.gamePhase = 'gameover';
    render();
    return true;
  }

  // Mafia >= town = mafia wins
  if (mafiaAlive >= townAlive) {
    state.winner = 'mafia';
    state.gamePhase = 'gameover';
    render();
    return true;
  }

  return false;
}

// -----------------------------------------------------------------------------
// RENDERING (imported from render.js)
// -----------------------------------------------------------------------------

// Main render function is defined in render.js

// -----------------------------------------------------------------------------
// EVENT HANDLERS (Global)
// -----------------------------------------------------------------------------

window.goToSetup = () => {
  state.screen = 'setup';
  state.bots = [];
  state.players = [];
  render();
};

window.goToSoloLobby = () => {
  state.screen = 'solo_lobby';
  updateRoleConfig();
  render();
};

window.goToMultiLobby = () => {
  state.screen = 'multi_lobby';
  updateRoleConfig();
  render();
};

window.showInstructions = () => {
  state.showInstructions = true;
  render();
};

window.hideInstructions = () => {
  state.showInstructions = false;
  render();
};

window.setInstructionsTab = (tab) => {
  state.instructionsTab = tab;
  render();
};

window.showSettings = () => {
  state.showSettings = true;
  render();
};

window.hideSettings = () => {
  state.showSettings = false;
  render();
};

window.toggleSetting = (key) => {
  state.settings[key] = !state.settings[key];
  render();
};

window.addBot = addBot;
window.removeBot = removeBot;
window.removePlayer = removePlayer;

window.addPlayerFromInput = () => {
  const input = document.getElementById('newPlayerInput');
  if (input && addPlayer(input.value)) input.value = '';
};

window.selectPreset = (id) => {
  state.selectedPreset = ROLE_PRESETS.find(p => p.id === id) || ROLE_PRESETS[0];
  updateRoleConfig();
  render();
};

window.selectStory = (id) => {
  state.selectedStory = STORY_PRESETS.find(s => s.id === id) || STORY_PRESETS[0];
  render();
};

window.adjustRole = adjustRole;

window.copyLink = () => {
  navigator.clipboard?.writeText(`${window.location.origin}?join=${state.gameCode}`);
  const btn = document.getElementById('copyBtn');
  if (btn) {
    btn.textContent = '✓ Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = '📋 Copy';
      btn.classList.remove('copied');
    }, 2000);
  }
};

window.startGame = startGame;

window.newGame = () => {
  state.screen = 'setup';
  state.players = [];
  state.bots = [];
  state.winner = null;
  state.gamePhase = 'reveal';
  state.nightPlans = {};
  state.votes = {};
  state.intelResults = {};
  render();
};

window.showCurrentRole = () => {
  state.showRole = true;
  render();
};

window.nextReveal = () => {
  const next = findNextHuman(state.currentPlayerIndex);
  if (next !== -1) {
    state.currentPlayerIndex = next;
    state.showRole = false;
  } else {
    state.gamePhase = 'day';
    state.currentPlayerIndex = 0;
    state.showRole = false;
    const allPlayers = getAllPlayers();
    let firstHuman = allPlayers.findIndex(p => p.alive && !p.isBot);
    if (firstHuman !== -1) state.currentPlayerIndex = firstHuman;
    setTimeout(() => botMakeDecisions('day'), 300);
  }
  render();
};

window.selectLocation = (id) => {
  state.selectedLocation = id;
  state.selectedAction = null;
  render();
};

window.selectAction = (id) => {
  const current = getCurrentPlayer();
  const isMafia = current?.role === 'mafia';
  const location = state.selectedStory.locations.find(l => l.id === state.selectedLocation);
  const actions = isMafia ? state.selectedStory.mafiaActions : (location?.actions || []);
  state.selectedAction = actions.find(a => a.id === id);
  render();
};

window.skipBotDay = () => {
  const next = findNextAlive(state.currentPlayerIndex);
  if (next !== -1) {
    state.currentPlayerIndex = next;
    state.showRole = false;
  } else {
    state.gamePhase = 'night';
    state.currentPlayerIndex = 0;
    state.showRole = false;
    state.narrative = 'Night falls over ' + state.selectedStory.name + '...';
    const allPlayers = getAllPlayers();
    const firstMafia = allPlayers.findIndex(p => p.alive && !p.isBot && p.role === 'mafia');
    state.currentPlayerIndex = firstMafia !== -1 ? firstMafia : 0;
    setTimeout(() => botMakeDecisions('night'), 300);
  }
  render();
};

window.confirmDayPlan = () => {
  const current = getCurrentPlayer();
  const location = state.selectedStory.locations.find(l => l.id === state.selectedLocation);
  state.nightPlans[current.id] = {
    location: state.selectedLocation,
    locationName: location?.name,
    action: state.selectedAction
  };
  state.selectedLocation = null;
  state.selectedAction = null;

  const next = findNextAlive(state.currentPlayerIndex);
  if (next !== -1) {
    state.currentPlayerIndex = next;
    state.showRole = false;
  } else {
    state.gamePhase = 'night';
    state.currentPlayerIndex = 0;
    state.showRole = false;
    state.narrative = 'Night falls over ' + state.selectedStory.name + '...';
    const allPlayers = getAllPlayers();
    const firstMafia = allPlayers.findIndex(p => p.alive && !p.isBot && p.role === 'mafia');
    state.currentPlayerIndex = firstMafia !== -1 ? firstMafia : 0;
    setTimeout(() => botMakeDecisions('night'), 300);
  }
  render();
};

window.selectTarget = (id) => {
  state.selectedTarget = id;
  render();
};

window.continueNight = () => {
  const allPlayers = getAllPlayers();
  const nextMafia = allPlayers.findIndex((p, i) =>
    i > state.currentPlayerIndex && p.alive && !p.isBot && p.role === 'mafia'
  );
  if (nextMafia !== -1) {
    state.currentPlayerIndex = nextMafia;
    state.showRole = false;
    render();
  } else {
    processNight();
    render();
  }
};

window.confirmMafiaTarget = () => {
  const current = getCurrentPlayer();
  state.mafiaVotes[current.id] = state.selectedTarget;
  state.selectedTarget = null;

  const allPlayers = getAllPlayers();
  const nextMafia = allPlayers.findIndex((p, i) =>
    i > state.currentPlayerIndex && p.alive && !p.isBot && p.role === 'mafia'
  );
  if (nextMafia !== -1) {
    state.currentPlayerIndex = nextMafia;
    state.showRole = false;
    render();
  } else {
    processNight();
    render();
  }
};

window.selectSave = (id) => {
  state.selectedSave = id;
  render();
};

window.skipDoctor = () => {
  processMorning();
};

window.confirmDoctorSave = () => {
  state.doctorSave = state.selectedSave;
  state.selectedSave = null;
  processMorning();
};

window.afterAnnouncement = afterAnnouncement;
window.afterVoteAnnouncement = afterVoteAnnouncement;

window.proceedToVote = () => {
  state.gamePhase = 'vote';
  state.currentPlayerIndex = 0;
  state.showRole = false;
  const allPlayers = getAllPlayers();
  let firstHuman = allPlayers.findIndex(p => p.alive && !p.isBot);
  if (firstHuman !== -1) state.currentPlayerIndex = firstHuman;
  setTimeout(() => botMakeDecisions('vote'), 300);
  render();
};

window.selectVote = (id) => {
  state.selectedVote = id;
  render();
};

window.skipBotVote = () => {
  const allPlayers = getAllPlayers();
  const next = allPlayers.findIndex((p, i) => i > state.currentPlayerIndex && p.alive && !p.isBot);
  if (next !== -1) {
    state.currentPlayerIndex = next;
    state.showRole = false;
    render();
  } else {
    processVote();
  }
};

window.skipDeadVote = () => {
  const allPlayers = getAllPlayers();
  const next = allPlayers.findIndex((p, i) => i > state.currentPlayerIndex && p.alive && !p.isBot);
  if (next !== -1) {
    state.currentPlayerIndex = next;
    state.showRole = false;
    render();
  } else {
    processVote();
  }
};

window.confirmVote = () => {
  const current = getCurrentPlayer();
  state.votes[current.id] = state.selectedVote;
  state.selectedVote = null;

  const allPlayers = getAllPlayers();
  const next = allPlayers.findIndex((p, i) => i > state.currentPlayerIndex && p.alive && !p.isBot);
  if (next !== -1) {
    state.currentPlayerIndex = next;
    state.showRole = false;
    render();
  } else {
    processVote();
  }
};

window.processVote = processVote;
