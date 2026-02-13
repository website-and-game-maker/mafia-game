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
  { id: 'classic', name: 'Classic', description: 'Balanced, info-rich baseline', mafia: 20, doctor: 10, detective: 10, color: '#22c55e' },
  { id: 'brutal', name: 'Brutal', description: 'Mafia pressure, limited healing', mafia: 30, doctor: 8, detective: 8, color: '#f97316' },
  { id: 'chaos', name: 'Chaos', description: 'Swingy nights and risky intel', mafia: 30, doctor: 20, detective: 20, color: '#ef4444' },
  { id: 'detective', name: 'Mystery', description: 'Investigator-heavy deduction', mafia: 20, doctor: 0, detective: 30, color: '#a855f7' }
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

const PRIVATE_ROOM_IDS = new Set(['bedroom', 'compartment', 'bungalow', 'pod']);

function inferActionKind(action) {
  const text = `${action.id} ${action.name}`.toLowerCase();
  if (/snoop|search|observe|peek|monitor|records|follow|scan|track/.test(text)) return 'snoop';
  if (/linger|smoke|watch|porch|balcony|bar|drink|listen/.test(text)) return 'linger';
  if (/lock|seal|hide/.test(text)) return 'hide';
  return 'routine';
}

function normalizeStoryData() {
  STORY_PRESETS.forEach(story => {
    story.locations = story.locations.map(location => {
      const baseActions = (location.actions || []).map(action => {
        const kind = inferActionKind(action);
        return {
          ...action,
          kind,
          detectivePreferred: kind === 'snoop' || kind === 'linger',
          requiresTarget: Boolean(action.requiresTarget)
        };
      });

      if (!baseActions.some(action => action.requiresTarget)) {
        baseActions.push({
          id: `snoop_target_${location.id}`,
          name: '🕵️ Snoop a specific room',
          intel: Math.min(0.9, 0.45 + (location.risk || 0) * 0.08),
          risk: Math.min(5, (location.risk || 0) + 2),
          desc: 'Shadow one player and monitor their room.',
          kind: 'snoop',
          detectivePreferred: true,
          requiresTarget: true
        });
      }

      // Ensure each location has at least one detective-friendly option.
      if (!baseActions.some(action => action.detectivePreferred)) {
        baseActions.push({
          id: `linger_${location.id}`,
          name: '👀 Linger in the shadows',
          intel: Math.min(0.75, 0.35 + (location.risk || 0) * 0.07),
          risk: Math.min(5, (location.risk || 0) + 1),
          desc: 'Stay nearby and watch for suspicious movement.',
          kind: 'linger',
          detectivePreferred: true,
          requiresTarget: false
        });
      }

      return {
        ...location,
        privateRoom: PRIVATE_ROOM_IDS.has(location.id) || Boolean(location.privateRoom),
        actions: baseActions
      };
    });

    story.mafiaActions = [
      ...(story.mafiaActions || []).map(action => ({ ...action, mafiaOnly: true })),
      {
        id: `${story.id}_coordinate`,
        name: '🗺️ Coordinate strike',
        desc: 'Sync movements with allies to trap targets.',
        mafiaOnly: true
      }
    ];
  });
}

normalizeStoryData();

// -----------------------------------------------------------------------------
// SOUND EFFECTS (Web Audio API)
// -----------------------------------------------------------------------------

const SoundEffects = {
  audioContext: null,

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  },

  isEnabled() {
    return state.settings.sounds;
  },

  // Simple click sound - short high-pitched blip
  playClick() {
    if (!this.isEnabled()) return;
    this.init();

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  },

  // Dramatic death sound - descending ominous tone
  playDeath() {
    if (!this.isEnabled()) return;
    this.init();

    const ctx = this.audioContext;

    // Low rumble
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(150, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.8);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.8);

    // Dissonant overlay
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(200, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.6);
    gain2.gain.setValueAtTime(0.15, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.6);
  },

  // Victory sound - ascending triumphant fanfare
  playVictory() {
    if (!this.isEnabled()) return;
    this.init();

    const ctx = this.audioContext;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 - major chord arpeggio

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const startTime = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  },

  // Defeat sound - descending minor chord
  playDefeat() {
    if (!this.isEnabled()) return;
    this.init();

    const ctx = this.audioContext;
    const notes = [440, 349.23, 293.66, 220]; // A4, F4, D4, A3 - descending minor

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const startTime = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  }
};

// -----------------------------------------------------------------------------
// GAME STATE
// -----------------------------------------------------------------------------

const state = {
  screen: 'setup',
  gameCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
  soloPlayerName: '',
  settings: {
    aiNarrator: true,
    narratorMode: 'auto',
    narratorTone: 'grim',
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
  snoopAssignments: {},
  snoopersByTarget: {},
  mafiaSnooperIntel: {},
  nightAttackCounts: {},
  mafiaVisionMode: {},
  nightTarget: null,
  mafiaVotes: {},
  doctorSave: null,
  votes: {},
  intelResults: {},
  chatMessages: [],
  chatDraft: '',
  chatSenderId: null,
  narrationLog: [],
  lastBotChatDay: null,
  botChatTimerIds: [],
  deathAnimation: null,
  winner: null,
  winReason: null,
  finalDeath: null,
  announcement: null,
  selectedLocation: null,
  selectedAction: null,
  selectedActionTarget: null,
  selectedDoorOption: null,
  selectedTarget: null,
  selectedSave: null,
  selectedVote: null,
  showInstructions: false,
  showSettings: false,
  instructionsTab: 'basics',
  nameError: '',
  autoAdvance: { key: null, timerId: null },
  botDelayMs: 900
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

function getLocationById(locationId) {
  return state.selectedStory.locations.find(location => location.id === locationId);
}

function getAvailableActionsForPlayer(player, location) {
  if (!player || !location) return [];
  if (player.role === 'mafia') return state.selectedStory.mafiaActions;

  const actions = location.actions || [];
  if (player.role !== 'detective') return actions;

  const detectiveActions = actions.filter(action => action.detectivePreferred);
  return detectiveActions.length > 0 ? detectiveActions : actions;
}

function getAliveHumans() {
  return getAlivePlayers().filter(player => !player.isBot);
}

function findFirstAliveHumanIndex() {
  return getAllPlayers().findIndex(player => player.alive && !player.isBot);
}

function getNextAliveHumanIndex(startIndex) {
  const players = getAllPlayers();
  for (let i = startIndex + 1; i < players.length; i++) {
    if (players[i].alive && !players[i].isBot) return i;
  }
  return -1;
}

function withBotDelay(callback, delay = state.botDelayMs) {
  setTimeout(callback, delay);
}

function randomChoice(items) {
  if (!items || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function addNarrationLog(text, phase = state.gamePhase) {
  if (!text) return;
  state.narrationLog.push({
    id: `nar_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    day: state.dayNumber,
    phase,
    text,
    at: new Date().toISOString()
  });
  if (state.narrationLog.length > 10) {
    state.narrationLog = state.narrationLog.slice(-10);
  }
}

function clearBotChatTimers() {
  state.botChatTimerIds.forEach(timerId => clearTimeout(timerId));
  state.botChatTimerIds = [];
}

function setDeathAnimation(victimName, roleName, phase) {
  if (!state.settings.deathAnimations || !victimName) {
    state.deathAnimation = null;
    return;
  }
  state.deathAnimation = {
    id: `death_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    victimName,
    roleName,
    phase
  };
}

function clearDeathAnimation() {
  state.deathAnimation = null;
}

function buildBotDiscussionLine(bot, alivePlayers, triggerText = '') {
  const others = alivePlayers.filter(player => player.id !== bot.id);
  const suspects = samplePlayers(others, 2);
  const lead = suspects[0];
  const fallback = suspects[1] || lead;
  const plan = state.nightPlans[bot.id];
  const intel = state.intelResults[bot.id];
  const triggerEcho = triggerText.trim().slice(0, 40);

  const lines = [
    lead ? `I heard movement around ${lead.name}'s area.` : 'I heard footsteps but could not confirm who it was.',
    plan?.locationName ? `I was around ${plan.locationName}. Something felt wrong there.` : 'My route was quiet, but someone still made a move.',
    lead && fallback ? `Let's compare ${lead.name} and ${fallback.name}. Their stories do not line up.` : 'No hard proof yet. Compare timelines before voting.',
    intel?.heard ? `${intel.heard}` : 'I do not have proof, but we should pressure contradictions.',
    triggerEcho ? `On that point ("${triggerEcho}"), we should question who was nearby.` : 'Who had opportunity last night? Start there.'
  ].filter(Boolean);

  return randomChoice(lines) || 'I am still sorting clues. Keep sharing intel.';
}

function queueBotDiscussion(initial = false, triggerText = '') {
  if (state.gamePhase !== 'discussion') return;
  if (!state.settings.botChat) return;

  const alivePlayers = getAlivePlayers();
  const aliveBots = alivePlayers.filter(player => player.isBot);
  if (aliveBots.length === 0) return;

  if (initial) {
    if (state.lastBotChatDay === state.dayNumber) return;
    state.lastBotChatDay = state.dayNumber;
    clearBotChatTimers();

    const queuedDay = state.dayNumber;
    const speakers = samplePlayers(aliveBots, Math.min(2, aliveBots.length));
    speakers.forEach((bot, index) => {
      const delay = Math.max(500, Math.round(state.botDelayMs * (0.9 + index * 0.4)));
      const timerId = setTimeout(() => {
        state.botChatTimerIds = state.botChatTimerIds.filter(id => id !== timerId);
        if (state.gamePhase !== 'discussion' || state.dayNumber !== queuedDay) return;
        state.chatMessages.push({
          id: `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          day: state.dayNumber,
          senderId: bot.id,
          senderName: bot.name,
          text: buildBotDiscussionLine(bot, getAlivePlayers()),
          at: new Date().toISOString()
        });
        render();
      }, delay);
      state.botChatTimerIds.push(timerId);
    });
    return;
  }

  if (Math.random() > 0.55) return;
  const bot = randomChoice(aliveBots);
  if (!bot) return;

  const delay = Math.max(450, Math.round(state.botDelayMs * (0.8 + Math.random() * 0.45)));
  const timerId = setTimeout(() => {
    state.botChatTimerIds = state.botChatTimerIds.filter(id => id !== timerId);
    if (state.gamePhase !== 'discussion') return;
    state.chatMessages.push({
      id: `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      day: state.dayNumber,
      senderId: bot.id,
      senderName: bot.name,
      text: buildBotDiscussionLine(bot, getAlivePlayers(), triggerText),
      at: new Date().toISOString()
    });
    render();
  }, delay);
  state.botChatTimerIds.push(timerId);
}

function scheduleAutoAdvance(key, handlerName, delay = state.botDelayMs) {
  if (state.autoAdvance.key === key) return;
  if (state.autoAdvance.timerId) clearTimeout(state.autoAdvance.timerId);
  state.autoAdvance.key = key;
  state.autoAdvance.timerId = setTimeout(() => {
    state.autoAdvance.key = null;
    state.autoAdvance.timerId = null;
    if (typeof window[handlerName] === 'function') window[handlerName]();
  }, delay);
}

function clearAutoAdvance() {
  if (state.autoAdvance.timerId) clearTimeout(state.autoAdvance.timerId);
  state.autoAdvance.key = null;
  state.autoAdvance.timerId = null;
}

function getPlanRoomKey(player, plan) {
  if (!plan?.location) return 'unknown';
  const location = getLocationById(plan.location);
  if (!location) return `missing:${plan.location}`;

  if (!location.privateRoom) {
    return `${location.id}:shared`;
  }

  // Private rooms are per-player unless the action explicitly targets someone.
  const targetPlayerId = plan.actionTarget || player.id;
  return `${location.id}:${targetPlayerId}`;
}

function getPlanRisk(plan) {
  if (!plan?.action) return 0;
  const location = getLocationById(plan.location);
  let risk = (plan.action.risk || 0) + (location?.risk || 0);
  if (plan.doorOption === 'lock') risk = Math.max(0, risk - 1);
  if (plan.doorOption === 'listen') risk = Math.min(5, risk + 1);
  return risk;
}

function getPlanIntelChance(player, plan) {
  if (!plan?.action) return 0;
  let intelChance = plan.action.intel || 0;

  if (plan.doorOption === 'lock') intelChance = Math.max(0, intelChance - 0.2);
  if (plan.doorOption === 'listen') intelChance = Math.min(1, intelChance + 0.15);

  if (player.role === 'detective') intelChance = Math.min(1, intelChance + 0.2);
  if (plan.action.kind === 'snoop') intelChance = Math.min(1, intelChance + 0.1);
  if (plan.action.kind === 'hide') intelChance = Math.max(0, intelChance - 0.1);

  return intelChance;
}

function samplePlayers(players, count) {
  const copy = [...players];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

function buildSnoopAssignments(alivePlayers) {
  const assignments = {};
  const candidates = alivePlayers.filter(player => player.role !== 'mafia');

  candidates.forEach(player => {
    const plan = state.nightPlans[player.id];
    if (!plan?.action) return;
    const isSnooper = plan.action.kind === 'snoop' || plan.action.kind === 'linger';
    if (!isSnooper) return;

    const sampleSize = player.role === 'detective' ? 5 : 3;
    const pool = alivePlayers.filter(candidate => candidate.id !== player.id);
    const targetIds = samplePlayers(pool, sampleSize).map(candidate => candidate.id);

    if (plan.actionTarget && !targetIds.includes(plan.actionTarget)) {
      targetIds[0] = plan.actionTarget;
    }

    assignments[player.id] = targetIds;
  });

  return assignments;
}

function getVisibleTargetsForMafia(mafiaPlayerId, alivePlayers = getAlivePlayers()) {
  const mafiaPlayer = alivePlayers.find(player => player.id === mafiaPlayerId);
  if (!mafiaPlayer || mafiaPlayer.role !== 'mafia') return { targets: [], mode: 'none' };

  const mafiaPlan = state.nightPlans[mafiaPlayer.id];
  if (!mafiaPlan) {
    return {
      targets: alivePlayers.filter(player => player.role !== 'mafia'),
      mode: 'search'
    };
  }

  const mafiaRoomKey = getPlanRoomKey(mafiaPlayer, mafiaPlan);
  const nonMafia = alivePlayers.filter(player => player.role !== 'mafia');
  const nearby = nonMafia.filter(player => {
    const plan = state.nightPlans[player.id];
    return plan && getPlanRoomKey(player, plan) === mafiaRoomKey;
  });

  if (nearby.length > 0) {
    return { targets: nearby, mode: 'nearby' };
  }

  return { targets: nonMafia, mode: 'search' };
}

function prepareNightContext() {
  const alivePlayers = getAlivePlayers();
  state.snoopAssignments = buildSnoopAssignments(alivePlayers);
  state.snoopersByTarget = {};
  state.mafiaSnooperIntel = {};
  state.mafiaVisionMode = {};

  Object.entries(state.snoopAssignments).forEach(([snooperId, targetIds]) => {
    targetIds.forEach(targetId => {
      if (!state.snoopersByTarget[targetId]) state.snoopersByTarget[targetId] = [];
      if (!state.snoopersByTarget[targetId].includes(snooperId)) {
        state.snoopersByTarget[targetId].push(snooperId);
      }
    });
  });

  alivePlayers
    .filter(player => player.role === 'mafia')
    .forEach(mafiaPlayer => {
      const view = getVisibleTargetsForMafia(mafiaPlayer.id, alivePlayers);
      state.mafiaVisionMode[mafiaPlayer.id] = view.mode;

      state.mafiaSnooperIntel[mafiaPlayer.id] = {};
      Object.entries(state.snoopersByTarget).forEach(([targetId, snooperIds]) => {
        const seen = snooperIds
          .map(id => alivePlayers.find(player => player.id === id))
          .filter(Boolean)
          .filter(snooper => snooper.role !== 'mafia')
          .filter(snooper => {
            const detectChance = snooper.role === 'detective' ? 0.35 : 0.72;
            return Math.random() < detectChance;
          })
          .map(snooper => snooper.name);

        if (seen.length > 0) {
          state.mafiaSnooperIntel[mafiaPlayer.id][targetId] = seen;
        }
      });
    });
}

function getIntelFallback(player) {
  if (player.role === 'detective') {
    return {
      heard: 'No direct hit tonight, but you mapped suspicious movement patterns.',
      saw: null,
      nearby: null
    };
  }
  return {
    heard: 'Nothing conclusive tonight. Keep notes and compare stories.',
    saw: null,
    nearby: null
  };
}

function buildNarration(eventName, context = {}) {
  const tone = state.settings.narratorTone || 'grim';
  const toneStyles = {
    grim: {
      intro: `${state.selectedStory.mood} Everyone watches everyone.`,
      night: `Night settles in. Doors shift. Footsteps fade.`,
      morning: context.attackHappened ? 'Dawn breaks with shaken nerves.' : 'Dawn arrives with uneasy silence.',
      vote: 'The room turns on itself. Every look is a verdict.'
    },
    cinematic: {
      intro: `${state.selectedStory.mood} Tonight, every choice is dramatic.`,
      night: 'Lights dim. Plans collide in the shadows.',
      morning: context.attackHappened ? 'Sunrise exposes the aftermath.' : 'Sunrise reveals an uneasy calm.',
      vote: 'Voices rise and alliances crack at the ballot.'
    },
    neutral: {
      intro: state.selectedStory.mood,
      night: `Night phase: actions resolve across ${state.selectedStory.name}.`,
      morning: context.attackHappened ? 'Morning phase: attack outcome resolved.' : 'Morning phase: no confirmed death.',
      vote: 'Vote phase: players cast elimination votes.'
    }
  };

  const copy = toneStyles[tone] || toneStyles.grim;
  if (eventName === 'intro') return copy.intro;
  if (eventName === 'night') return copy.night;
  if (eventName === 'morning') return copy.morning;
  if (eventName === 'vote') return copy.vote;
  return state.selectedStory.mood;
}

function calculateRolesFromPreset(preset, count) {
  if (count < 3) return { mafia: 0, doctor: 0, detective: 0, villager: 0 };

  let mafia, doctor, detective;

  if (preset.id === 'classic') {
    // Target curve: at 12 players, trend to 5 Mafia / 3 Doctor / 2 Detective.
    if (count <= 4) mafia = 1, doctor = 1, detective = 0;
    else if (count <= 6) mafia = 2, doctor = 1, detective = 1;
    else if (count <= 8) mafia = 3, doctor = 2, detective = 1;
    else if (count <= 10) mafia = 4, doctor = 2, detective = 2;
    else if (count <= 12) mafia = 5, doctor = 3, detective = 2;
    else if (count <= 14) mafia = 5, doctor = 3, detective = 3;
    else mafia = Math.round(count * 0.38), doctor = Math.max(2, Math.round(count * 0.22)), detective = Math.max(1, Math.round(count * 0.14));
  } else if (preset.id === 'brutal') {
    if (count <= 4) mafia = 1, doctor = 0, detective = 1;
    else if (count <= 6) mafia = 2, doctor = 1, detective = 1;
    else if (count <= 8) mafia = 3, doctor = 1, detective = 1;
    else if (count <= 10) mafia = 4, doctor = 1, detective = 2;
    else if (count <= 12) mafia = 5, doctor = 1, detective = 2;
    else if (count <= 14) mafia = 6, doctor = 1, detective = 2;
    else mafia = Math.round(count * 0.42), doctor = Math.max(1, Math.round(count * 0.08)), detective = Math.max(1, Math.round(count * 0.12));
  } else if (preset.id === 'chaos') {
    if (count <= 4) mafia = 1, doctor = 0, detective = 0;
    else if (count <= 6) mafia = 2, doctor = 0, detective = 1;
    else if (count <= 8) mafia = 3, doctor = 0, detective = 1;
    else if (count <= 10) mafia = 4, doctor = 0, detective = 2;
    else if (count <= 12) mafia = 5, doctor = 0, detective = 2;
    else if (count <= 14) mafia = 6, doctor = 1, detective = 2;
    else mafia = Math.round(count * 0.45), doctor = Math.max(0, Math.round(count * 0.05)), detective = Math.max(1, Math.round(count * 0.14));
  } else if (preset.id === 'detective') {
    if (count <= 4) mafia = 1, doctor = 1, detective = 1;
    else if (count <= 6) mafia = 1, doctor = 1, detective = 2;
    else if (count <= 8) mafia = 2, doctor = 1, detective = 3;
    else if (count <= 10) mafia = 2, doctor = 1, detective = 4;
    else if (count <= 12) mafia = 3, doctor = 1, detective = 5;
    else if (count <= 14) mafia = 3, doctor = 2, detective = 5;
    else mafia = Math.max(3, Math.round(count * 0.25)), doctor = Math.max(1, Math.round(count * 0.1)), detective = Math.max(2, Math.round(count * 0.3));
  } else {
    mafia = Math.max(1, Math.round(count * preset.mafia / 100));
    doctor = preset.doctor === 0 ? 0 : Math.max(1, Math.round(count * preset.doctor / 100));
    detective = count >= 5 ? Math.max(0, Math.round(count * preset.detective / 100)) : 0;
  }

  // Clamp to avoid invalid setups for small groups.
  mafia = Math.max(1, Math.min(mafia, count - 2));
  doctor = Math.max(0, Math.min(doctor, count - mafia - 1));
  detective = Math.max(0, Math.min(detective, count - mafia - doctor - 1));

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
  const total = getAllPlayers().length;
  const mafia = state.roleConfig.mafia || 0;
  const town = total - mafia;
  if (state.roleConfig.villager < 0) warnings.push('Not enough villagers!');
  if (state.roleConfig.mafia === 0 && getAllPlayers().length >= 3) warnings.push('No mafia assigned!');
  if (mafia >= town && total >= 3) warnings.push('Mafia currently outnumber or match Town.');
  return warnings;
}

function canStart() {
  const allPlayers = getAllPlayers();
  const humans = state.players.filter(p => !p.isBot);
  const mafia = state.roleConfig.mafia || 0;
  const town = allPlayers.length - mafia;
  if (allPlayers.length < 3) return false;
  if (state.screen === 'multi_lobby' && humans.length === 0) return false;
  if (state.roleConfig.villager < 0) return false;
  if (mafia >= town) return false;
  return true;
}

function getStartBlockReason() {
  const allPlayers = getAllPlayers();
  const humans = state.players.filter(p => !p.isBot);
  const mafia = state.roleConfig.mafia || 0;
  const town = allPlayers.length - mafia;
  if (allPlayers.length < 3) return `Need 3+ players (${allPlayers.length})`;
  if (state.screen === 'solo_lobby' && !state.soloPlayerName.trim()) return 'Enter your name';
  if (state.screen === 'multi_lobby' && humans.length === 0) return 'Need at least 1 human';
  if (state.roleConfig.villager < 0) return 'Too many special roles!';
  if (mafia >= town) return 'Mafia must be fewer than Town';
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

function beginNightPhase() {
  state.gamePhase = 'night';
  state.currentPlayerIndex = 0;
  state.showRole = false;
  state.selectedTarget = null;
  state.selectedSave = null;
  state.narrative = buildNarration('night');
  addNarrationLog(state.narrative, 'night');
  clearBotChatTimers();
  prepareNightContext();

  const allPlayers = getAllPlayers();
  const firstMafia = allPlayers.findIndex(player => player.alive && !player.isBot && player.role === 'mafia');
  state.currentPlayerIndex = firstMafia !== -1 ? firstMafia : 0;

  withBotDelay(() => botMakeDecisions('night'), Math.max(700, state.botDelayMs));
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
  state.narrative = buildNarration('intro');
  state.currentPlayerIndex = 0;
  state.showRole = false;
  state.nightPlans = {};
  state.snoopAssignments = {};
  state.nightAttackCounts = {};
  state.mafiaSnooperIntel = {};
  state.mafiaVotes = {};
  state.doctorSave = null;
  state.votes = {};
  state.intelResults = {};
  state.chatMessages = [];
  state.chatDraft = '';
  state.chatSenderId = null;
  state.narrationLog = [];
  state.lastBotChatDay = null;
  clearBotChatTimers();
  clearDeathAnimation();
  state.winner = null;
  state.winReason = null;
  state.finalDeath = null;
  clearAutoAdvance();
  addNarrationLog(state.narrative, 'reveal');

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
  const alivePlayers = getAlivePlayers();
  const aliveBots = alivePlayers.filter(p => p.isBot);

  if (phase === 'day') {
    aliveBots.forEach(bot => {
      const location = state.selectedStory.locations[Math.floor(Math.random() * state.selectedStory.locations.length)];
      const actions = getAvailableActionsForPlayer(bot, location);
      const action = actions[Math.floor(Math.random() * actions.length)];
      const otherPlayers = alivePlayers.filter(player => player.id !== bot.id);
      const actionTarget = action?.requiresTarget
        ? otherPlayers[Math.floor(Math.random() * otherPlayers.length)]?.id || null
        : null;
      // For lockable locations, bots randomly choose lock or listen (mafia don't get door options)
      let doorOption = null;
      if (location.canLock && bot.role !== 'mafia') {
        if (bot.role === 'detective') {
          doorOption = 'listen';
        } else {
          doorOption = Math.random() > 0.5 ? 'lock' : 'listen';
        }
      }
      state.nightPlans[bot.id] = {
        location: location.id,
        locationName: location.name,
        action,
        actionTarget,
        doorOption
      };
    });
  }

  if (phase === 'night') {
    const mafiaBots = aliveBots.filter(b => b.role === 'mafia');
    mafiaBots.forEach(bot => {
      const view = getVisibleTargetsForMafia(bot.id, alivePlayers);
      const targets = view.targets.length > 0
        ? view.targets
        : alivePlayers.filter(player => player.role !== 'mafia');
      const investigatingTargets = targets.filter(target => {
        const plan = state.nightPlans[target.id];
        return getPlanIntelChance(target, plan) >= 0.55;
      });
      const target = investigatingTargets.length > 0 && Math.random() > 0.35
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
  prepareNightContext();

  const voteCounts = {};
  Object.values(state.mafiaVotes).forEach(targetId => {
    if (targetId) voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });

  const sorted = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
  const targetId = sorted[0]?.[0];
  state.nightAttackCounts = voteCounts;
  state.nightTarget = targetId;

  const alivePlayers = getAlivePlayers();
  const targetPlayer = alivePlayers.find(player => player.id === targetId);
  const targetPlan = targetPlayer ? state.nightPlans[targetPlayer.id] : null;
  const targetRoomKey = targetPlayer && targetPlan ? getPlanRoomKey(targetPlayer, targetPlan) : null;
  const newIntel = {};

  alivePlayers.forEach(player => {
    const plan = state.nightPlans[player.id];
    if (!plan) {
      if (player.role !== 'mafia') newIntel[player.id] = getIntelFallback(player);
      return;
    }

    if (player.role === 'mafia') return;

    const playerRoomKey = getPlanRoomKey(player, plan);
    const effectiveIntel = getPlanIntelChance(player, plan);
    const intel = getIntelFallback(player);
    const roll = Math.random();

    if (targetId && targetRoomKey && player.id !== targetId && playerRoomKey === targetRoomKey) {
      intel.heard = 'You were near the attack zone and heard a violent struggle.';
      if (roll < effectiveIntel) {
        const killers = alivePlayers.filter(candidate => candidate.role === 'mafia');
        const killer = killers[Math.floor(Math.random() * killers.length)];
        intel.saw = player.role === 'detective'
          ? `${killer?.name} moved quickly away from the scene.`
          : 'A shadowy attacker fled before you could be certain.';
      }
    }

    const trackedTargets = state.snoopAssignments[player.id] || [];
    if (targetId && trackedTargets.includes(targetId)) {
      if (roll < effectiveIntel) {
        intel.heard = `Your snoop route passed close to ${targetPlayer?.name}'s room.`;
        if (player.role === 'detective' || roll < effectiveIntel * 0.8) {
          const killers = alivePlayers.filter(candidate => candidate.role === 'mafia');
          const killer = killers[Math.floor(Math.random() * killers.length)];
          intel.saw = `${killer?.name} was seen moving near ${targetPlayer?.name}'s room.`;
        } else {
          intel.saw = `You saw movement around ${targetPlayer?.name}'s room but no clear identity.`;
        }
      } else {
        intel.heard = `You tracked ${targetPlayer?.name}'s room but found no clear proof.`;
      }
    }

    const othersNearby = alivePlayers.filter(candidate => {
      if (candidate.id === player.id) return false;
      const candidatePlan = state.nightPlans[candidate.id];
      if (!candidatePlan) return false;
      return getPlanRoomKey(candidate, candidatePlan) === playerRoomKey;
    });

    if (othersNearby.length > 0) {
      intel.nearby = `Nearby: ${othersNearby.map(candidate => candidate.name).join(', ')}`;
    }

    if (plan.action?.requiresTarget && plan.actionTarget) {
      const target = alivePlayers.find(candidate => candidate.id === plan.actionTarget);
      if (target) {
        intel.tracked = `You focused on ${target.name}'s room tonight.`;
      }
    }

    newIntel[player.id] = intel;
  });

  getAlivePlayers()
    .filter(player => player.role !== 'mafia')
    .forEach(player => {
      if (!newIntel[player.id]) newIntel[player.id] = getIntelFallback(player);
    });

  state.intelResults = newIntel;
  state.narrative = buildNarration('morning', { attackHappened: Boolean(targetId) });
  addNarrationLog(state.narrative, 'morning_doctor');
  state.gamePhase = 'morning_doctor';
  state.showRole = false;
  state.selectedSave = null;

  withBotDelay(() => {
    botMakeDecisions('morning_doctor');
    render();
  }, Math.max(700, state.botDelayMs));
}

// -----------------------------------------------------------------------------
// MORNING PHASE PROCESSING
// -----------------------------------------------------------------------------

function processMorning() {
  const allPlayers = getAllPlayers();
  const target = allPlayers.find(p => p.id === state.nightTarget);
  let deathMessage = '';
  let savedByDoctor = false;

  const attackCount = target ? (state.nightAttackCounts[target.id] || 1) : 0;
  const doctorTriedSave = Boolean(target && state.doctorSave && state.doctorSave === target.id);
  let saveChance = 0;
  if (doctorTriedSave) {
    // Multiple attackers drastically lower save odds.
    saveChance = Math.max(0.15, 0.78 - Math.max(0, attackCount - 1) * 0.28);
    savedByDoctor = Math.random() < saveChance;
  }

  if (target && !savedByDoctor) {
    if (target.isBot) {
      state.bots = state.bots.map(b => b.id === target.id ? { ...b, alive: false } : b);
    } else {
      state.players = state.players.map(p => p.id === target.id ? { ...p, alive: false } : p);
    }
    SoundEffects.playDeath();
    deathMessage = `${target.name} was found dead.\n\nThey were the ${ROLES[target.role].name}.`;
    state.finalDeath = {
      type: 'night',
      victim: target.name,
      role: ROLES[target.role].name,
      saved: false
    };
    setDeathAnimation(target.name, ROLES[target.role].name, 'night');
  } else if (target && savedByDoctor) {
    deathMessage = `${target.name} was attacked but survived.\n\nThe doctor saved them against the odds.`;
    state.finalDeath = {
      type: 'night',
      victim: target.name,
      role: ROLES[target.role].name,
      saved: true
    };
    clearDeathAnimation();
  } else {
    deathMessage = 'The night passed peacefully.';
    state.finalDeath = { type: 'night', victim: null, role: null, saved: false };
    clearDeathAnimation();
  }
  addNarrationLog(deathMessage, 'announcement');

  state.nightTarget = null;
  state.mafiaVotes = {};
  state.nightAttackCounts = {};
  state.doctorSave = null;

  if (!checkWin()) {
    state.announcement = deathMessage;
    state.gamePhase = 'announcement';
    render();
  }
}

function afterAnnouncement() {
  state.announcement = null;
  clearDeathAnimation();
  state.gamePhase = 'discussion';
  const firstHuman = findFirstAliveHumanIndex();
  state.currentPlayerIndex = firstHuman !== -1 ? firstHuman : 0;
  state.showRole = false;
  state.chatDraft = '';
  state.chatSenderId = getAllPlayers()[state.currentPlayerIndex]?.id || null;
  addNarrationLog('Discussion opens. Compare intel before voting.', 'discussion');
  queueBotDiscussion(true);

  render();
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
      state.finalDeath = {
        type: 'vote',
        victim: eliminated.name,
        role: ROLES[eliminated.role].name,
        saved: false
      };
      setDeathAnimation(eliminated.name, ROLES[eliminated.role].name, 'vote');
    }
  } else {
    voteMessage = 'Vote tied. No one eliminated.';
    state.finalDeath = { type: 'vote', victim: null, role: null, saved: false };
    clearDeathAnimation();
  }
  addNarrationLog(voteMessage, 'vote_announcement');

  state.votes = {};
  state.nightPlans = {};
  state.snoopAssignments = {};
  state.snoopersByTarget = {};
  state.mafiaSnooperIntel = {};
  state.intelResults = {};

  if (!checkWin()) {
    state.announcement = voteMessage;
    state.gamePhase = 'vote_announcement';
    render();
  }
}

function afterVoteAnnouncement() {
  state.announcement = null;
  clearDeathAnimation();
  clearBotChatTimers();
  state.gamePhase = 'day';
  state.dayNumber++;
  state.currentPlayerIndex = 0;
  state.showRole = false;
  state.selectedLocation = null;
  state.selectedAction = null;
  state.selectedActionTarget = null;
  state.selectedDoorOption = null;
  state.selectedTarget = null;
  state.chatSenderId = null;
  state.chatDraft = '';
  state.narrative = buildNarration('vote');

  const firstHuman = findFirstAliveHumanIndex();
  if (firstHuman !== -1) state.currentPlayerIndex = firstHuman;

  withBotDelay(() => {
    botMakeDecisions('day');
    render();
  }, Math.max(700, state.botDelayMs));
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
    state.winReason = 'All human-controlled players were eliminated.';
    state.gamePhase = 'gameover';
    SoundEffects.playDefeat();
    render();
    return true;
  }

  // No mafia = town wins
  if (mafiaAlive === 0) {
    state.winner = 'town';
    state.winReason = 'Town removed every Mafia member.';
    state.gamePhase = 'gameover';
    SoundEffects.playVictory();
    render();
    return true;
  }

  // Mafia >= town = mafia wins
  if (mafiaAlive >= townAlive) {
    state.winner = 'mafia';
    state.winReason = 'Mafia reached parity with Town.';
    state.gamePhase = 'gameover';
    SoundEffects.playDefeat();
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
  clearAutoAdvance();
  clearBotChatTimers();
  clearDeathAnimation();
  state.screen = 'setup';
  state.bots = [];
  state.players = [];
  state.chatMessages = [];
  state.chatDraft = '';
  state.chatSenderId = null;
  state.narrationLog = [];
  state.lastBotChatDay = null;
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
  if (key === 'botChat' && !state.settings.botChat) {
    clearBotChatTimers();
  }
  if (key === 'deathAnimations' && !state.settings.deathAnimations) {
    clearDeathAnimation();
  }
  render();
};

window.setNarratorMode = (mode) => {
  state.settings.narratorMode = mode === 'human' ? 'human' : 'auto';
  render();
};

window.setNarratorTone = (tone) => {
  const allowed = new Set(['grim', 'cinematic', 'neutral']);
  state.settings.narratorTone = allowed.has(tone) ? tone : 'grim';
  state.narrative = buildNarration('intro');
  render();
};

window.setBotDelay = (ms) => {
  const value = Number(ms);
  if (Number.isNaN(value)) return;
  state.botDelayMs = Math.max(500, Math.min(2200, Math.round(value)));
  render();
};

window.addBot = addBot;
window.removeBot = removeBot;
window.removePlayer = removePlayer;
window.scheduleAutoAdvance = scheduleAutoAdvance;
window.clearAutoAdvance = clearAutoAdvance;
window.getVisibleTargetsForMafia = getVisibleTargetsForMafia;

window.addPlayerFromInput = () => {
  const input = document.getElementById('newPlayerInput');
  if (!input) return;
  if (addPlayer(input.value)) {
    input.value = '';
  }
  setTimeout(() => {
    const refreshed = document.getElementById('newPlayerInput');
    refreshed?.focus();
  }, 0);
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
  clearAutoAdvance();
  clearBotChatTimers();
  clearDeathAnimation();
  state.screen = 'setup';
  state.players = [];
  state.bots = [];
  state.winner = null;
  state.winReason = null;
  state.finalDeath = null;
  state.gamePhase = 'reveal';
  state.nightPlans = {};
  state.snoopAssignments = {};
  state.snoopersByTarget = {};
  state.mafiaSnooperIntel = {};
  state.mafiaVotes = {};
  state.nightAttackCounts = {};
  state.votes = {};
  state.intelResults = {};
  state.chatMessages = [];
  state.chatDraft = '';
  state.chatSenderId = null;
  state.narrationLog = [];
  state.lastBotChatDay = null;
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
    const firstHuman = findFirstAliveHumanIndex();
    if (firstHuman !== -1) state.currentPlayerIndex = firstHuman;
    withBotDelay(() => botMakeDecisions('day'), Math.max(700, state.botDelayMs));
  }
  render();
};

window.selectLocation = (id) => {
  state.selectedLocation = id;
  state.selectedAction = null;
  state.selectedActionTarget = null;
  state.selectedDoorOption = null;
  render();
};

window.selectAction = (id) => {
  const current = getCurrentPlayer();
  const location = getLocationById(state.selectedLocation);
  const actions = getAvailableActionsForPlayer(current, location);
  state.selectedAction = actions.find(a => a.id === id);
  if (!state.selectedAction?.requiresTarget) state.selectedActionTarget = null;
  state.selectedDoorOption = null;
  render();
};

window.selectActionTarget = (id) => {
  state.selectedActionTarget = id;
  render();
};

window.selectDoorOption = (option) => {
  const current = getCurrentPlayer();
  if (current?.role === 'detective') return;
  state.selectedDoorOption = option;
  render();
};

window.skipBotDay = () => {
  const next = findNextAlive(state.currentPlayerIndex);
  if (next !== -1) {
    state.currentPlayerIndex = next;
    state.showRole = false;
  } else {
    beginNightPhase();
  }
  render();
};

window.confirmDayPlan = () => {
  const current = getCurrentPlayer();
  const location = getLocationById(state.selectedLocation);
  const action = state.selectedAction;
  const actionTarget = action?.requiresTarget ? state.selectedActionTarget : null;
  const doorOption = current.role === 'detective'
    ? 'listen'
    : (location?.canLock ? state.selectedDoorOption : null);

  state.nightPlans[current.id] = {
    location: state.selectedLocation,
    locationName: location?.name,
    action,
    actionTarget,
    doorOption
  };
  state.selectedLocation = null;
  state.selectedAction = null;
  state.selectedActionTarget = null;
  state.selectedDoorOption = null;

  const next = findNextAlive(state.currentPlayerIndex);
  if (next !== -1) {
    state.currentPlayerIndex = next;
    state.showRole = false;
  } else {
    beginNightPhase();
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
    state.selectedTarget = null;
    render();
  } else {
    processNight();
    render();
  }
};

window.confirmMafiaTarget = () => {
  const current = getCurrentPlayer();
  if (!state.selectedTarget) return;
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

window.openDiscussionForCurrent = () => {
  state.showRole = true;
  if (!state.chatSenderId) {
    state.chatSenderId = getCurrentPlayer()?.id || null;
  }
  render();
};

window.advanceDiscussion = () => {
  const nextHuman = getNextAliveHumanIndex(state.currentPlayerIndex);
  if (nextHuman !== -1 && !isSoloDiscussionComplete()) {
    state.currentPlayerIndex = nextHuman;
    state.showRole = false;
    state.chatSenderId = getAllPlayers()[nextHuman]?.id || null;
    state.chatDraft = '';
    render();
    return;
  }
  window.proceedToVote();
};

function isSoloDiscussionComplete() {
  const aliveHumans = getAliveHumans();
  return aliveHumans.length <= 1 && state.players.length <= 1;
}

window.proceedToVote = () => {
  clearBotChatTimers();
  state.gamePhase = 'vote';
  state.currentPlayerIndex = 0;
  state.showRole = false;
  state.narrative = buildNarration('vote');
  addNarrationLog(state.narrative, 'vote');
  state.chatSenderId = null;
  state.chatDraft = '';
  const firstHuman = findFirstAliveHumanIndex();
  if (firstHuman !== -1) state.currentPlayerIndex = firstHuman;
  withBotDelay(() => botMakeDecisions('vote'), Math.max(700, state.botDelayMs));
  render();
};

window.setChatDraft = (value) => {
  state.chatDraft = value;
};

window.setChatSender = (playerId) => {
  state.chatSenderId = playerId;
  render();
};

window.sendDiscussionMessage = () => {
  const text = state.chatDraft.trim();
  if (!text) return;

  const aliveHumans = getAliveHumans();
  const sender = aliveHumans.find(player => player.id === state.chatSenderId)
    || getCurrentPlayer()
    || aliveHumans[0];
  if (!sender) return;

  state.chatMessages.push({
    id: `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    day: state.dayNumber,
    senderId: sender.id,
    senderName: sender.name,
    text,
    at: new Date().toISOString()
  });
  state.chatDraft = '';
  queueBotDiscussion(false, text);
  render();
};

window.selectVote = (id) => {
  state.selectedVote = id;
  render();
};

window.skipBotVote = () => {
  const next = getNextAliveHumanIndex(state.currentPlayerIndex);
  if (next !== -1) {
    state.currentPlayerIndex = next;
    state.showRole = false;
    render();
  } else {
    processVote();
  }
};

window.skipDeadVote = () => {
  const next = getNextAliveHumanIndex(state.currentPlayerIndex);
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

  const next = getNextAliveHumanIndex(state.currentPlayerIndex);
  if (next !== -1) {
    state.currentPlayerIndex = next;
    state.showRole = false;
    render();
  } else {
    processVote();
  }
};

window.processVote = processVote;
