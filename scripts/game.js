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

const STORY_TOWN_LABELS = {
  mansion: 'Guest',
  train: 'Passenger',
  island: 'Survivor',
  space: 'Crewmate'
};

const ROLE_PRESETS = [
  { id: 'classic', name: 'Classic', description: 'Balanced baseline: steady Mafia pressure with dependable doctor and detective support.', mafia: 20, doctor: 10, detective: 10, color: '#22c55e' },
  { id: 'brutal', name: 'Blood Moon', description: 'Higher Mafia pressure and thinner support. Mornings are harsher and mistakes are punished quickly.', mafia: 30, doctor: 8, detective: 6, color: '#f97316' },
  { id: 'chaos', name: 'Crossfire', description: 'Swingy table: stronger Mafia pressure plus extra doctor coverage. Nights create noisy, conflicting intel.', mafia: 28, doctor: 14, detective: 8, color: '#ef4444' },
  { id: 'detective', name: 'Forensics', description: 'Investigation-heavy table: more detective influence and slower Mafia tempo when evidence is managed well.', mafia: 18, doctor: 8, detective: 26, color: '#a855f7' }
];

const KILL_METHODS = [
  {
    id: 'silent_blade',
    name: 'Silent Blade',
    desc: 'Low disturbance. Harder for witnesses to spot, slightly easier to stabilize.',
    noise: 0.25,
    cureDifficulty: 0.72,
    deathLabel: 'deep stab wounds',
    evidenceHint: 'a sharp metallic scrape'
  },
  {
    id: 'stranglehold',
    name: 'Stranglehold',
    desc: 'Moderate disturbance. Balanced visibility and survivability.',
    noise: 0.5,
    cureDifficulty: 0.66,
    deathLabel: 'airway trauma',
    evidenceHint: 'a muffled struggle'
  },
  {
    id: 'toxin',
    name: 'Toxin Dose',
    desc: 'Very low disturbance. Hard to witness directly, easier to miss in real time.',
    noise: 0.18,
    cureDifficulty: 0.58,
    deathLabel: 'acute toxin exposure',
    evidenceHint: 'chemical residue'
  },
  {
    id: 'incendiary',
    name: 'Incendiary Burst',
    desc: 'Extreme disturbance. Easier for others to notice, hardest to survive.',
    noise: 0.92,
    cureDifficulty: 0.86,
    deathLabel: 'severe burn trauma',
    evidenceHint: 'a sudden flash and heat'
  }
];

const STORY_PRESETS = [
  {
    id: 'mansion',
    name: 'Blackwood Estate',
    intro: 'Thunder rolls over the moors...',
    mood: 'A Victorian mansion shrouded in secrets.',
    setting: 'Old guest corridors feed into a foyer, veranda, parlor, kitchen routes, and deep cellar stairs where sound travels strangely.',
    narrationPack: 'gothic'
  },
  {
    id: 'train',
    name: 'Midnight Express',
    intro: 'The train plunges through a blizzard...',
    mood: 'A luxury train with secrets.',
    setting: 'Cabins, linked corridors, lounge traffic, service passages, and exposed exterior platforms create shifting lines of sight.',
    narrationPack: 'noir'
  },
  {
    id: 'island',
    name: 'Coral Bay Resort',
    intro: 'Paradise turns to prison...',
    mood: 'A tropical resort turned nightmare.',
    setting: 'Bungalow rows and porches overlook the beach while trails split toward the dock, clinic, jungle edge, and lighthouse ridge.',
    narrationPack: 'tropical_horror'
  },
  {
    id: 'space',
    name: 'Station Prometheus',
    intro: 'Life support failing...',
    mood: 'A research station at the edge of space.',
    setting: 'Sleep pods and surveillance routes connect through a central hub to medbay, cargo logistics, reactor tunnels, the observation ring, and the airlock.',
    narrationPack: 'sci_fi'
  }
];

const BOT_NAMES = ['Alex', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Quinn', 'Avery', 'Parker', 'Sage', 'Blake', 'Drew', 'Reese'];

const NIGHT_AWARENESS_OPTIONS = [
  {
    id: 'low_profile',
    name: 'Keep a low profile',
    desc: 'Stay quiet and reduce the chance of getting noticed.',
    exposureMod: -0.1
  },
  {
    id: 'listen_posts',
    name: 'Listen at nearby routes',
    desc: 'Moderate awareness with balanced safety and clue quality.',
    exposureMod: 0
  },
  {
    id: 'active_watch',
    name: 'Actively watch movement',
    desc: 'Higher exposure but stronger chance to catch useful clues.',
    exposureMod: 0.12
  }
];

const ENVIRONMENT_PROFILES = [
  {
    id: 'balanced',
    name: 'Balanced Rules',
    desc: 'Default baseline: standard exposure, standard disturbance, and standard doctor stabilization odds.',
    exposureMultiplier: 1,
    disturbanceMultiplier: 1,
    cureDifficultyShift: 0
  },
  {
    id: 'stealth',
    name: 'Midnight Silence',
    desc: 'Quieter nights with softer movement signatures. Players are less exposed, attacks are less disruptive, and doctor saves are slightly easier.',
    exposureMultiplier: 0.92,
    disturbanceMultiplier: 0.78,
    cureDifficultyShift: -0.08
  },
  {
    id: 'chaotic',
    name: 'Panic Spiral',
    desc: 'High-pressure variant: more exposure, louder disturbance, and tougher doctor stabilization. Discussion gets noisier and riskier.',
    exposureMultiplier: 1.12,
    disturbanceMultiplier: 1.26,
    cureDifficultyShift: 0.1
  }
];

const EXPOSURE_BY_NODE_TYPE = {
  private_cluster: 0.2,
  vantage: 0.38,
  investigation: 0.62,
  shared: 0.48,
  isolated: 0.78,
  transit: 0.58,
  utility: 0.45
};

// How much useful information each action KIND tends to yield. Independent of
// exposure: hiding keeps you safe but blind; snooping is informative but loud.
const INFO_BY_ACTION_KIND = {
  snoop: 0.82,
  linger: 0.52,
  routine: 0.3,
  hide: 0.15
};

// Reliability tiers shown on intel lines. These SAME numbers drive generation,
// so the label a player reads is mechanically honest: confirmed = ground truth
// with a tiny error band; likely = details correct ~78% of the time;
// uncertain = barely better than a coin flip.
const INTEL_RELIABILITY = {
  confirmed: 0.97,
  likely: 0.78,
  uncertain: 0.55
};

// Gameplay presets (distinct from ratio presets): rule modifiers that change
// real calculations. They stack multiplicatively with ENVIRONMENT_PROFILES.
const GAMEPLAY_PRESETS = [
  {
    id: 'standard',
    name: 'Standard Rules',
    desc: 'No rule modifiers. Information, exposure, and saves use baseline math.',
    color: '#64748b',
    mods: {}
  },
  {
    id: 'sharp_eyes',
    name: 'Sharp Eyes',
    desc: 'Detectives are more useful: stealthier while snooping, and shadowing a single person returns near-perfect information.',
    color: '#a855f7',
    mods: { detectiveStealth: 0.7, detectiveInfo: 1.2, podSnoopAccuracy: 1.05 }
  },
  {
    id: 'paranoid_house',
    name: 'Paranoid House',
    desc: 'Everyone sleeps lightly: witnesses notice more and every move is more exposed. Loud games, fast accusations.',
    color: '#f59e0b',
    mods: { witness: 1.3, exposure: 1.12 }
  },
  {
    id: 'deep_cover',
    name: 'Deep Cover',
    desc: 'The Mafia operate cleanly: fewer witnesses, and doctors find victims harder to stabilize. Quiet, brutal nights.',
    color: '#ef4444',
    mods: { witness: 0.75, save: 0.85 }
  }
];

// Detective night stances (the detective's role-flavored night turn).
const DETECTIVE_STANCE_OPTIONS = [
  {
    id: 'shadow_target',
    name: '🕵️ Shadow one person',
    desc: 'Watch one person\'s room all night: near-certain truth about what they did. But if any Mafia passes close to that room, they will very likely notice you.',
    requiresTarget: true
  },
  {
    id: 'sweep_routes',
    name: '🧭 Sweep the routes',
    desc: 'Patrol broadly: a decent chance of catching movement near you, with moderate visibility.',
    requiresTarget: false
  },
  {
    id: 'lay_low',
    name: '🫥 Lay low',
    desc: 'Stay put and stay safe. You learn little, but nobody learns about you either.',
    requiresTarget: false
  }
];

const NARRATION_PRESETS = window.NARRATION_PRESETS || {
  gothic: {
    intro: 'Stormlight cuts across old stone walls. Every corridor carries a rumor.',
    day: 'Dust hangs in the light. Choose where to stand before the house chooses for you.',
    night: 'Floorboards complain under unseen weight. Someone is hunting.',
    morning: 'A gray dawn reaches the estate. The truth did not sleep.',
    discussion: 'Voices gather in anxious circles. Compare details before panic wins.',
    vote: 'Every raised hand feels irreversible.'
  },
  noir: {
    intro: 'The train slices through snow and silence. Compartments hide uneasy faces.',
    day: 'Steel rattles beneath your feet. Exposure buys clues, but costs safety.',
    night: 'Between car links and dark glass, the predator moves.',
    morning: 'Cold morning light floods the corridor. Someone did not make it.',
    discussion: 'Everyone has a story. Line them up and find the one that bends.',
    vote: 'A verdict on rails. No one can step off.'
  },
  tropical_horror: {
    intro: 'Warm wind carries salt and fear. Paradise has already curdled.',
    day: 'Waves hide whispers. Higher exposure means bigger clues and bigger danger.',
    night: 'Palm shadows stretch over the sand. The hunter knows the paths.',
    morning: 'Sunrise reveals disturbed footprints and hard truths.',
    discussion: 'Gather under open sky and test every timeline against the map.',
    vote: 'The group chooses who faces the next dawn.'
  },
  sci_fi: {
    intro: 'Station Prometheus hums at the edge of nowhere. Trust is oxygen.',
    day: 'Route choices echo through bulkheads. Every move can uncover clues and invite danger.',
    night: 'Warning lights dim. Mechanical noise masks deliberate footsteps.',
    morning: 'Systems stabilize at shift change, but the crew does not.',
    discussion: 'Cross-check logs, locations, and timing before the vote window closes.',
    vote: 'One name is condemned to keep the station alive.'
  },
  default: {
    intro: 'Tension settles over the map. Nobody is safe.',
    day: 'Choose a location and commit to an action.',
    night: 'Night actions resolve in secret.',
    morning: 'Morning reports are in.',
    discussion: 'Compare intel before voting.',
    vote: 'Vote carefully.'
  }
};

const URL_PARAMS = new URLSearchParams(window.location.search);
const JOIN_CODE_PARAM = URL_PARAMS.get('join');
const ROOM_CODE_PARAM = URL_PARAMS.get('room');
const ROLE_PARAM = String(URL_PARAMS.get('role') || '').trim().toLowerCase();
const SCREEN_PARAM = String(URL_PARAMS.get('screen') || '').trim().toLowerCase();
const PATHNAME = window.location.pathname || '/';
const IS_HOST_PAGE = /\/host\.html$/i.test(PATHNAME);
const IS_JOIN_PAGE = /\/join\.html$/i.test(PATHNAME);
const IS_SOLO_PAGE = /\/solo\.html$/i.test(PATHNAME);
const DEFAULT_REALTIME_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname || 'localhost'}:8765`;
const DEVICE_NAME_STORAGE_KEY = 'mafia_device_name';
const DEVICE_ID_STORAGE_KEY = 'mafia_device_id';
const ROOM_CACHE_PREFIX = 'mafia_room_cache_';

const realtime = {
  socket: null,
  applyingRemoteState: false,
  replayingRemoteAction: false,
  lastBroadcastPayload: '',
  lastPersistedPayload: '',
  connectAttemptId: 0,
  pendingSocket: null,
  pendingTimerId: null,
  ackTimerId: null
};

// Cached room snapshots expire so an old tab cannot restore an ancient game,
// and so secret role data does not linger in localStorage forever.
const ROOM_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const SOLO_CACHE_KEY = 'mafia_solo_cache';
const BACKEND_DEFAULT_PORT = 8000;
const BACKEND_PROBE_TIMEOUT_MS = 1200;
let backendAutoSwitchInFlight = false;

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function randomCodeFromAlphabet(length = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(Math.max(4, length));
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes.slice(0, length), value => alphabet[value % alphabet.length]).join('');
}

function generateRoomCode() {
  return randomCodeFromAlphabet(6);
}

function getStoredDeviceId() {
  try {
    const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (existing && existing.trim()) return existing.trim().slice(0, 40);
  } catch (error) {
    // ignore localStorage read issues
  }
  const created = `dev_${randomCodeFromAlphabet(10).toLowerCase()}`;
  try {
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, created);
  } catch (error) {
    // ignore localStorage write issues
  }
  return created;
}

function toLegacyRisk(exposure) {
  return Math.round(clamp01(exposure) * 5);
}

function inferActionKind(action) {
  const text = `${action.id} ${action.name}`.toLowerCase();
  if (/snoop|search|observe|peek|monitor|records|follow|scan|track/.test(text)) return 'snoop';
  if (/linger|smoke|watch|porch|balcony|bar|drink|listen/.test(text)) return 'linger';
  if (/lock|seal|hide/.test(text)) return 'hide';
  return 'routine';
}

function buildAction(id, name, desc, exposure, options = {}) {
  const normalizedExposure = clamp01(exposure);
  const kind = options.kind || inferActionKind({ id, name });
  // Information value is INDEPENDENT of exposure: driven by what you're doing
  // (kind), nudged by how exposed the spot is (you see more where more happens).
  const baseInfo = INFO_BY_ACTION_KIND[kind] ?? 0.35;
  const info = clamp01(options.info ?? (baseInfo * 0.8 + normalizedExposure * 0.25));
  return {
    id,
    name,
    desc,
    kind,
    exposure: normalizedExposure,
    info,
    intel: info,
    risk: toLegacyRisk(normalizedExposure),
    requiresTarget: Boolean(options.requiresTarget),
    detectivePreferred: Boolean(options.detectivePreferred ?? (kind === 'snoop' || kind === 'linger')),
    mafiaOnly: Boolean(options.mafiaOnly)
  };
}

function getNodeExposure(node) {
  return clamp01(node.exposure ?? EXPOSURE_BY_NODE_TYPE[node.type] ?? 0.5);
}

function buildLocationActions(node, baseExposure) {
  const high = clamp01(baseExposure + 0.12);
  const med = clamp01(baseExposure);
  const low = clamp01(baseExposure - 0.14);

  if (node.type === 'private_cluster') {
    return [
      buildAction('sleep_lock', '🛏️ Sleep and lock', 'Bolt the door. Intruders must break in — they often give up, and the noise wakes neighbors — but if they DO get through, the lock that protected you now traps you: no exit until morning.', low, { kind: 'hide' }),
      buildAction('sleep_unlocked', '🛏️ Sleep without locking', 'Rest lightly and keep a quick exit route. Mafia can slip in quietly if nobody alert is nearby to notice them trying doors — but an unlocked door means you have a real chance to bolt and survive.', med, { kind: 'routine' }),
      buildAction('porch_watch', '🪟 Porch watch', 'Stay half-awake near the porch watching nearby routes. No one can creep up on you quietly, and you may spot late-night movement — at the cost of being clearly visible yourself.', clamp01(baseExposure + 0.08), { kind: 'linger' })
    ];
  }

  if (node.type === 'investigation') {
    return [
      buildAction('snoop_routes', '🕵️ Snoop routes', 'Track movement patterns across connected rooms.', high, { kind: 'snoop', detectivePreferred: true }),
      buildAction('snoop_room', '🕵️ Snoop someone\'s room', 'Shadow one person\'s room all night: near-certain truth about what THEY did — but if any Mafia passes close to that room, they will very likely notice you.', clamp01(high + 0.04), { kind: 'snoop', requiresTarget: true, detectivePreferred: true, info: 0.95 }),
      buildAction('linger_logs', '📒 Linger over clues', 'Stay alert and catalog suspicious details.', med, { kind: 'linger', detectivePreferred: true })
    ];
  }

  if (node.type === 'vantage') {
    return [
      buildAction('overwatch', '👀 Watch from cover', 'Use elevation or angle for better sightlines.', med, { kind: 'linger' }),
      buildAction('smoke_break', '🚬 Smoke and listen', 'Blend in while hearing nearby conversations.', clamp01(med + 0.06), { kind: 'linger' }),
      buildAction('line_of_sight', '🎯 Focus one window', 'Watch one room route for precise movement.', clamp01(med + 0.08), { kind: 'snoop', requiresTarget: true, detectivePreferred: true })
    ];
  }

  if (node.type === 'isolated') {
    return [
      buildAction('deep_search', '🔦 Deep search', 'Push deeper for strong clues at high exposure.', high, { kind: 'snoop' }),
      buildAction('hide_wait', '🫥 Hide and wait', 'Stay concealed and read movement around you.', clamp01(med + 0.03), { kind: 'hide' }),
      buildAction('quick_pass', '🚶 Quick pass', 'Grab what you can and leave fast.', low, { kind: 'routine' })
    ];
  }

  if (node.type === 'transit') {
    return [
      buildAction('patrol', '🚶 Patrol route', 'Walk the route and log who crosses your path.', med, { kind: 'linger' }),
      buildAction('tail_target', '👣 Tail someone', 'Follow one person between nearby nodes.', high, { kind: 'snoop', requiresTarget: true, detectivePreferred: true }),
      buildAction('duck_corner', '🧱 Duck into cover', 'Keep exposure lower while watching movement.', low, { kind: 'hide' })
    ];
  }

  if (node.type === 'utility') {
    return [
      buildAction('check_systems', '🖥️ Check systems', 'Use logs and records to spot anomalies.', clamp01(med + 0.08), { kind: 'snoop', detectivePreferred: true }),
      buildAction('standby', '🔧 Stay on standby', 'Hold position and keep nearby awareness.', med, { kind: 'routine' }),
      buildAction('quiet_corner', '🪤 Quiet corner', 'Wait where you can hear but stay unseen.', low, { kind: 'hide' })
    ];
  }

  return [
    buildAction('mingle', '🗣️ Mingle', 'Blend with traffic and gather baseline clues.', med, { kind: 'routine' }),
    buildAction('eavesdrop', '👂 Eavesdrop', 'Risk extra exposure for better audio clues.', high, { kind: 'snoop' }),
    buildAction('hang_back', '🧍 Hang back', 'Stay near exits and watch who leaves.', low, { kind: 'linger' })
  ];
}

function buildMafiaActions(node, locationExposure) {
  const low = clamp01(locationExposure - 0.12);
  const med = clamp01(locationExposure - 0.02);
  const high = clamp01(locationExposure + 0.14);

  if (node.type === 'private_cluster') {
    return [
      buildAction('plant_alibi', 'Plant an alibi', 'Move quietly through bedroom routes to avoid attention.', low, { mafiaOnly: true, kind: 'hide' }),
      buildAction('doorway_watch', 'Watch doorways', 'Track exits from bedroom lanes before selecting a target.', med, { mafiaOnly: true, kind: 'linger' }),
      buildAction('ambush_window', 'Ambush window', 'Force a close-range opening near private rooms.', high, { mafiaOnly: true, kind: 'snoop' })
    ];
  }

  if (node.id === 'cargo_hold') {
    return [
      buildAction('crate_shadow', 'Crate shadow', 'Use stacked cargo for concealed movement.', low, { mafiaOnly: true, kind: 'hide' }),
      buildAction('manifest_scan', 'Manifest scan', 'Scan routes and identify isolated targets.', med, { mafiaOnly: true, kind: 'linger' }),
      buildAction('freight_crush', 'Freight crush route', 'Risk a violent route that leaves obvious traces.', high, { mafiaOnly: true, kind: 'snoop' })
    ];
  }

  if (node.id === 'reactor_tunnel') {
    return [
      buildAction('coolant_listen', 'Coolant line listen', 'Use machinery noise to mask movement.', low, { mafiaOnly: true, kind: 'hide' }),
      buildAction('power_flicker', 'Trigger power flicker', 'Create confusion and move through blind spots.', med, { mafiaOnly: true, kind: 'linger' }),
      buildAction('containment_breach', 'Containment feint', 'High-risk pressure route with severe fallout.', high, { mafiaOnly: true, kind: 'snoop' })
    ];
  }

  if (node.type === 'investigation') {
    return [
      buildAction('erase_traces', 'Erase traces', 'Clean key clues before sunrise.', low, { mafiaOnly: true, kind: 'hide' }),
      buildAction('false_lead', 'Plant false lead', 'Leave believable but misleading intel.', med, { mafiaOnly: true, kind: 'linger' }),
      buildAction('monitor_snoopers', 'Counter-surveillance', 'Spot townsfolk watching your team\'s rooms tonight.', high, { mafiaOnly: true, kind: 'snoop' })
    ];
  }

  if (node.type === 'vantage') {
    return [
      buildAction('stay_shaded', 'Stay shaded', 'Hold a low profile and watch crossings.', low, { mafiaOnly: true, kind: 'hide' }),
      buildAction('sightline_track', 'Track sightlines', 'Study movement and likely escape paths.', med, { mafiaOnly: true, kind: 'linger' }),
      buildAction('sniper_window', 'High-risk strike window', 'Take a bold route that risks exposure.', high, { mafiaOnly: true, kind: 'snoop' })
    ];
  }

  if (node.type === 'transit') {
    return [
      buildAction('blend_route', 'Blend route', 'Merge with traffic and avoid attention.', low, { mafiaOnly: true, kind: 'hide' }),
      buildAction('crosspath_hunt', 'Crosspath hunt', 'Follow movement between connected nodes.', med, { mafiaOnly: true, kind: 'linger' }),
      buildAction('rail_cutoff', 'Route cutoff', 'Pin targets between exits at higher risk.', high, { mafiaOnly: true, kind: 'snoop' })
    ];
  }

  return [
    buildAction('quiet_scout', 'Quiet scout', 'Track movement with minimal risk.', low, { mafiaOnly: true, kind: 'hide' }),
    buildAction('pressure_route', 'Pressure route', 'Push the area to flush out vulnerable targets.', med, { mafiaOnly: true, kind: 'linger' }),
    buildAction('commit_strike', 'Commit strike route', 'High-risk route built for fast elimination.', high, { mafiaOnly: true, kind: 'snoop' })
  ];
}

function normalizeStoryData() {
  const geoData = window.GEOGRAPHY_DATA || {};

  STORY_PRESETS.forEach(story => {
    const graph = geoData[story.id];
    const graphNodes = Array.isArray(graph?.nodes) ? graph.nodes : [];

    story.locations = graphNodes.map(node => {
      const exposure = getNodeExposure(node);
      const actions = buildLocationActions(node, exposure);
      const mafiaActions = buildMafiaActions(node, exposure);
      const isBedroomZone = node.id === graph?.bedroomHubNode || node.type === 'private_cluster';
      const isSnoopZone = node.id === graph?.detectiveSnoopNode || node.type === 'investigation';

      return {
        id: node.id,
        name: node.name,
        nodeType: node.type,
        tags: Array.isArray(node.tags) ? node.tags : [],
        exposure,
        risk: toLegacyRisk(exposure),
        intel: exposure,
        privateRoom: Boolean(isBedroomZone),
        isBedroomZone: Boolean(isBedroomZone),
        isSnoopZone: Boolean(isSnoopZone),
        actions,
        mafiaActions
      };
    });

    story.mapGraph = graph || { nodes: [], edges: [], bedroomHubNode: null, detectiveSnoopNode: null };
    story.floorplan = graph?.floorplan || null;
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

const INITIAL_JOIN_CODE = String(JOIN_CODE_PARAM || '')
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, '')
  .slice(0, 8);
const INITIAL_ROOM_CODE = String(ROOM_CODE_PARAM || '')
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, '')
  .slice(0, 8);
const INITIAL_CODE = INITIAL_JOIN_CODE || INITIAL_ROOM_CODE || generateRoomCode();
const INITIAL_IS_JOIN_ROLE = IS_JOIN_PAGE || Boolean(INITIAL_JOIN_CODE) || ROLE_PARAM === 'join';
const INITIAL_IS_HOST_ROLE = IS_HOST_PAGE || (!INITIAL_IS_JOIN_ROLE && ROLE_PARAM === 'host');
const INITIAL_MULTI_MODE = (IS_HOST_PAGE || IS_JOIN_PAGE) ? 'realtime' : 'passplay';

const state = {
  screen: 'setup',
  gameCode: INITIAL_CODE,
  joinCode: INITIAL_JOIN_CODE || INITIAL_ROOM_CODE || (IS_HOST_PAGE ? INITIAL_CODE : ''),
  multiplayerMode: INITIAL_MULTI_MODE,
  realtimePanelMode: INITIAL_IS_JOIN_ROLE ? 'join' : 'host',
  entryPage: IS_HOST_PAGE ? 'host' : (IS_JOIN_PAGE ? 'join' : (IS_SOLO_PAGE ? 'solo' : 'index')),
  network: {
    connected: false,
    status: 'offline',
    statusDetail: '',
    isHost: INITIAL_IS_HOST_ROLE,
    hostDeviceId: null,
    deviceId: getStoredDeviceId(),
    deviceName: 'Device 1',
    devices: [],
    deviceOrder: [],
    shareHints: {
      preferredPortalUrl: '',
      alternatePortalUrls: [],
      backendDetected: false,
      lanPortalUrl: '',
      originPortalUrl: '',
      lanAvailable: false
    }
  },
  soloPlayerName: '',
  settings: {
    aiNarrator: true,
    narratorMode: 'auto',
    narratorTone: 'grim',
    networkShareMode: 'lan',
    customShareBaseUrl: '',
    customRelayUrl: '',
    environmentProfile: 'balanced',
    botChat: true,
    deathAnimations: true,
    sounds: true
  },
  players: [],
  bots: [],
  selectedPreset: ROLE_PRESETS[0],
  selectedGameplayPreset: 'standard',
  roleConfig: { mafia: 1, doctor: 1, detective: 0, villager: 0 },
  selectedStory: STORY_PRESETS[0],
  gamePhase: 'reveal',
  gameEpoch: 0,
  dayNumber: 1,
  narrative: '',
  currentPlayerIndex: 0,
  showRole: false,
  nightPlans: {},
  snoopAssignments: {},
  snoopersByTarget: {},
  snoopPrimaryTargets: {},
  mafiaSnooperIntel: {},
  mafiaBriefing: {},
  nightAwareness: {},
  detectiveStances: {},
  nightDefenseOutcome: null,
  nightAttackCounts: {},
  nightAttackMethod: null,
  mafiaVisionMode: {},
  nightTarget: null,
  mafiaVotes: {},
  mafiaKillMethods: {},
  doctorSave: null,
  votes: {},
  intelResults: {},
  chatMessages: [],
  chatDraft: '',
  chatSenderId: null,
  discussionUnlockAt: 0,
  lastNarratorPromptKey: null,
  pendingNarratorPhase: null,
  narrationLog: [],
  lastBotChatDay: null,
  botChatTimerIds: [],
  deathAnimation: null,
  winner: null,
  winReason: null,
  pendingWin: null,
  finalDeath: null,
  announcement: null,
  selectedLocation: null,
  selectedAction: null,
  selectedActionTarget: null,
  selectedTarget: null,
  selectedKillMethod: null,
  selectedAwareness: null,
  selectedStance: null,
  selectedStanceTarget: null,
  selectedSave: null,
  selectedVote: null,
  showInstructions: false,
  showSettings: false,
  showMap: false,
  tutorialStep: null,
  lastNightSummary: null,
  lastVoteSummary: null,
  chatDrawerOpen: false,
  chatSeenCount: 0,
  departedDevices: {},
  hostLostAt: null,
  soloResumeAvailable: false,
  selectedMapFloor: null,
  showBigRoomCode: false,
  autoJoinPending: Boolean(INITIAL_JOIN_CODE || (ROLE_PARAM === 'join' && INITIAL_ROOM_CODE)),
  copyFeedback: {},
  cachedHostSnapshot: null,
  instructionsTab: 'rules',
  nameError: '',
  autoAdvance: { key: null, timerId: null },
  botDelayMs: 1200
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

function getRoleDisplayName(role, story = state.selectedStory) {
  if (role === 'villager') {
    return STORY_TOWN_LABELS[story?.id] || ROLES.villager.name;
  }
  return ROLES[role]?.name || role;
}

function getLocationById(locationId) {
  return state.selectedStory.locations.find(location => location.id === locationId);
}

function getAvailableActionsForPlayer(player, location) {
  if (!player || !location) return [];
  if (player.role === 'mafia') return location.mafiaActions || [];

  const actions = location.actions || [];
  if (player.role !== 'detective') return actions;

  const detectiveActions = actions.filter(action => action.detectivePreferred);
  return detectiveActions.length > 0 ? detectiveActions : actions;
}

function getStoryGraph(story = state.selectedStory) {
  return story?.mapGraph || { nodes: [], edges: [], bedroomHubNode: null, detectiveSnoopNode: null };
}

function buildGraphAdjacency(story = state.selectedStory) {
  const graph = getStoryGraph(story);
  const adjacency = {};
  (graph.nodes || []).forEach(node => {
    adjacency[node.id] = [];
  });

  (graph.edges || []).forEach(edge => {
    if (!adjacency[edge.from]) adjacency[edge.from] = [];
    if (!adjacency[edge.to]) adjacency[edge.to] = [];
    adjacency[edge.from].push({ id: edge.to, distance: edge.distance || 1, hearing: edge.hearing || 0, sight: edge.sight || 0 });
    adjacency[edge.to].push({ id: edge.from, distance: edge.distance || 1, hearing: edge.hearing || 0, sight: edge.sight || 0 });
  });
  return adjacency;
}

function getGraphDistance(fromNodeId, toNodeId, story = state.selectedStory) {
  if (!fromNodeId || !toNodeId) return Infinity;
  if (fromNodeId === toNodeId) return 0;

  const adjacency = buildGraphAdjacency(story);
  const visited = new Set();
  const queue = [{ id: fromNodeId, dist: 0 }];

  while (queue.length > 0) {
    queue.sort((a, b) => a.dist - b.dist);
    const current = queue.shift();
    if (!current || visited.has(current.id)) continue;
    visited.add(current.id);
    if (current.id === toNodeId) return current.dist;

    (adjacency[current.id] || []).forEach(next => {
      if (!visited.has(next.id)) {
        queue.push({
          id: next.id,
          dist: current.dist + Math.max(1, Number(next.distance) || 1)
        });
      }
    });
  }

  return Infinity;
}

function getPlanNodeId(plan, player = null) {
  if (!plan?.location) return null;
  const location = getLocationById(plan.location);
  if (!location) return plan.location;
  if (location.privateRoom) {
    const targetRoomId = plan.actionTarget || player?.id;
    return `${location.id}:${targetRoomId || 'shared'}`;
  }
  return location.id;
}

function resolveNodeBaseId(nodeId) {
  if (!nodeId) return null;
  return String(nodeId).split(':')[0];
}

function getEnvironmentProfile() {
  const selected = String(state.settings.environmentProfile || 'balanced');
  return ENVIRONMENT_PROFILES.find(profile => profile.id === selected) || ENVIRONMENT_PROFILES[0];
}

function getGameplayPreset() {
  const selected = String(state.selectedGameplayPreset || 'standard');
  return GAMEPLAY_PRESETS.find(preset => preset.id === selected) || GAMEPLAY_PRESETS[0];
}

// Multiplier accessor for gameplay-preset rule mods (1 = no change).
function getGameplayMod(key) {
  const mods = getGameplayPreset().mods || {};
  const value = Number(mods[key]);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function getAdjustedDisturbance(method) {
  const profile = getEnvironmentProfile();
  const base = clamp01(method?.noise ?? 0.3);
  return clamp01(base * (profile.disturbanceMultiplier || 1));
}

function getAdjustedCureDifficulty(method) {
  const profile = getEnvironmentProfile();
  const base = clamp01(method?.cureDifficulty ?? 0.6);
  return clamp01(base + (profile.cureDifficultyShift || 0));
}

// Chance a witness-style roll succeeds, with gameplay-preset scaling.
function applyWitnessMods(chance) {
  return clamp01(chance * getGameplayMod('witness'));
}

// Chance a snooper is noticed by mafia: detectives are genuinely stealthier,
// and Sharp Eyes makes them stealthier still (multiplier < 1 reduces detection).
function getSnooperDetectionChance(snooper, { podSnoop = false } = {}) {
  let base = snooper.role === 'detective' ? 0.35 : 0.72;
  // Pod-snooping someone's room is intrusive: dangerous even for detectives.
  if (podSnoop) base = snooper.role === 'detective' ? 0.55 : 0.85;
  if (snooper.role === 'detective') base *= getGameplayMod('detectiveStealth');
  return clamp01(base);
}

function getPlanExposure(player, plan) {
  if (!player || !plan?.action) return 0;
  const location = getLocationById(plan.location);
  const profile = getEnvironmentProfile();
  const locationExposure = clamp01(location?.exposure ?? 0.4);
  const actionExposure = clamp01(plan.action.exposure ?? locationExposure);
  let exposure = clamp01((locationExposure * 0.55) + (actionExposure * 0.45));

  if (plan.action.id === 'sleep_lock') exposure = clamp01(exposure - 0.14);
  if (plan.action.id === 'sleep_unlocked') exposure = clamp01(exposure - 0.03);
  if (plan.action.id === 'porch_watch') exposure = clamp01(exposure + 0.08);

  if (player.role === 'detective') exposure = clamp01(exposure - 0.18);

  return clamp01(exposure * (profile.exposureMultiplier || 1) * getGameplayMod('exposure'));
}

function getPlanIntelChance(player, plan) {
  if (!player || !plan?.action) return 0;
  const location = getLocationById(plan.location);
  // Information now flows from the action's info stat (what you're doing), with
  // the location's traffic as a secondary factor — NOT from exposure directly.
  const actionInfo = clamp01(plan.action.info ?? plan.action.intel ?? 0.35);
  const locationTraffic = clamp01(location?.exposure ?? 0.4);
  let chance = clamp01(0.12 + (actionInfo * 0.62) + (locationTraffic * 0.2));
  if (player.role === 'detective') {
    chance = clamp01((chance + 0.14) * getGameplayMod('detectiveInfo'));
  }
  return chance;
}

function getNightActors(alivePlayers = getAlivePlayers()) {
  // SEATING order only. Grouping turns by role (mafia first, doctors last,
  // etc.) would let pass-and-play players infer roles from who goes when —
  // turn order must carry zero information.
  return alivePlayers.filter(player => player.alive && !player.isBot);
}

function getKillMethodById(methodId) {
  return KILL_METHODS.find(method => method.id === methodId) || KILL_METHODS[0];
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
  // Guard against timers crossing game boundaries: a callback scheduled in one
  // game (e.g. processMorning after a night) must never fire into the next
  // game's reveal. The epoch increments on every game start/reset.
  const epoch = state.gameEpoch;
  setTimeout(() => {
    if (state.gameEpoch !== epoch) return;
    callback();
  }, delay);
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

function getNarratorPhasePrompt(phase = state.gamePhase) {
  const prompts = {
    reveal: 'Narrator turn: set the scene and remind players that role reveals stay private.',
    day: 'Narrator turn: warn players that exposure brings both information and danger.',
    night: 'Narrator turn: describe the night atmosphere without revealing secret role actions.',
    announcement: 'Narrator turn: deliver the public night outcome before discussion begins.',
    discussion: `Narrator turn: open discussion and ask players to compare timelines.${(() => { const e = describeNightEcho(); return e ? ` Suggested flavor: "${e}"` : ''; })()}`,
    vote: 'Narrator turn: call for calm voting and evidence-based choices.',
    vote_announcement: 'Narrator turn: narrate the vote result and consequences.',
    gameover: 'Narrator turn: close the story and summarize the final chain of events.'
  };
  return prompts[phase] || 'Narrator turn: set the mood for this phase.';
}

function shouldUseNarratorTurn(phase = state.gamePhase) {
  if (state.settings.narratorMode !== 'human') return false;
  if (state.screen !== 'game') return false;
  return phase !== 'gameover';
}

function primeNarratorTurn(phase = state.gamePhase) {
  state.pendingNarratorPhase = shouldUseNarratorTurn(phase) ? phase : null;
}

function clearNarratorTurn() {
  state.pendingNarratorPhase = null;
}

function narratorTurnIsActive(phase = state.gamePhase) {
  return shouldUseNarratorTurn(phase) && state.pendingNarratorPhase === phase;
}

function queueNarratorChatPrompt(phase = state.gamePhase) {
  if (state.settings.narratorMode !== 'human') return;
  if (!(isRealtimeMode() && (state.network.devices || []).length > 1)) return;
  const key = `${state.dayNumber}:${phase}`;
  if (state.lastNarratorPromptKey === key) return;
  state.lastNarratorPromptKey = key;

  state.chatMessages.push({
    id: `msg_narrator_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    day: state.dayNumber,
    senderId: 'narrator',
    senderName: 'Narrator',
    text: getNarratorPhasePrompt(phase),
    at: new Date().toISOString()
  });
}

function getDeviceNameById(deviceId) {
  if (!deviceId) return state.network.deviceName || 'Host device';
  const found = (state.network.devices || []).find(device => device.deviceId === deviceId);
  if (found?.deviceName) return found.deviceName;
  if (deviceId === state.network.deviceId) return state.network.deviceName || 'This device';
  return 'Device';
}

function refreshPlayerDeviceNames() {
  state.players = state.players.map(player => ({
    ...player,
    deviceName: getDeviceNameById(player.deviceId)
  }));
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

function sanitizeRoomCode(code, fallback = state.gameCode || generateRoomCode()) {
  const cleaned = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleaned) return fallback;
  return cleaned.slice(0, 8);
}

function isHostOnlyPage() {
  return state.entryPage === 'host';
}

function isJoinOnlyPage() {
  return state.entryPage === 'join';
}

function isSoloOnlyPage() {
  return state.entryPage === 'solo';
}

function isDefaultDeviceLabel(name) {
  return /^Device \d+$/i.test(String(name || '').trim());
}

function extractDeviceNumber(name) {
  const match = String(name || '').trim().match(/^Device (\d+)$/i);
  return match ? Number(match[1]) : null;
}

function getNextDeviceNumber(devices = state.network.devices || []) {
  const used = new Set();
  devices.forEach(device => {
    const n = extractDeviceNumber(device.deviceName);
    if (Number.isFinite(n)) used.add(n);
  });
  const selfN = extractDeviceNumber(state.network.deviceName);
  if (Number.isFinite(selfN)) used.add(selfN);
  let candidate = 1;
  while (used.has(candidate)) candidate++;
  return candidate;
}

function maybeAutoAssignDeviceName(devices = state.network.devices || []) {
  if (!isDefaultDeviceLabel(state.network.deviceName)) return;
  const next = getNextDeviceNumber(devices);
  state.network.deviceName = `Device ${next}`;
}

function getSiblingPagePath(filename) {
  const pathname = window.location.pathname || '/';
  if (pathname.endsWith(`/${filename}`)) return pathname;
  if (pathname.endsWith('/')) return `${pathname}${filename}`;
  if (/\/[^/]+\.html$/i.test(pathname)) {
    return pathname.replace(/\/[^/]+\.html$/i, `/${filename}`);
  }
  if (!pathname.includes('.')) return `${pathname}/${filename}`;
  const slash = pathname.lastIndexOf('/');
  if (slash === -1) return `/${filename}`;
  return `${pathname.slice(0, slash + 1)}${filename}`;
}

function getPageUrl(filename) {
  const path = getSiblingPagePath(filename);
  try {
    return new URL(path, window.location.href).toString();
  } catch (error) {
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      return `${window.location.origin}${path}`;
    }
    return filename;
  }
}

function getLocalAssetUrl(filename) {
  try {
    return new URL(filename, window.location.href).toString();
  } catch (error) {
    return filename;
  }
}

function getRoomServiceStarterLinks() {
  const macStarter = {
    label: 'Download Room Service Starter',
    url: getLocalAssetUrl('start_room_service.command')
  };
  const windowsStarter = {
    label: 'Windows Starter',
    url: getLocalAssetUrl('start_room_service.bat')
  };
  const platform = `${navigator.platform || ''} ${navigator.userAgent || ''}`.toLowerCase();
  const prefersWindows = /\bwin/i.test(platform);
  return prefersWindows
    ? { primary: { ...windowsStarter, label: 'Download Room Service Starter' }, secondary: macStarter }
    : { primary: macStarter, secondary: windowsStarter };
}

function getMainIndexPath() {
  return getSiblingPagePath('index.html');
}

function sanitizeHttpUrl(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    if (!parsed.pathname) parsed.pathname = '/';
    if (!parsed.pathname.endsWith('/')) parsed.pathname = `${parsed.pathname}/`;
    parsed.hash = '';
    return parsed.toString();
  } catch (error) {
    return '';
  }
}

function sanitizeWsUrl(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  try {
    const parsed = new URL(value);
    if (!['ws:', 'wss:'].includes(parsed.protocol)) return '';
    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '');
  } catch (error) {
    return '';
  }
}

function looksLikeLanHost(hostname) {
  const host = String(hostname || '').trim().toLowerCase();
  if (!host) return false;
  if (/^192\.168\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  const private172 = host.match(/^172\.(\d{1,3})\./);
  if (private172) {
    const second = Number(private172[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

function looksLikeLanUrl(rawUrl) {
  try {
    const parsed = new URL(String(rawUrl || '').trim());
    return looksLikeLanHost(parsed.hostname);
  } catch (error) {
    return false;
  }
}

function getNetworkingShareMode() {
  const value = String(state.settings.networkShareMode || 'lan').trim().toLowerCase();
  if (value === 'origin' || value === 'custom' || value === 'lan') return value;
  return 'lan';
}

function isLanShareModeAvailable() {
  return Boolean(sanitizeHttpUrl(state.network.shareHints?.lanPortalUrl || ''));
}

function relayUrlFromPortal(portalUrl) {
  try {
    const parsed = new URL(String(portalUrl || '').trim());
    const relayProtocol = parsed.protocol === 'https:' ? 'wss' : 'ws';
    const host = parsed.hostname || '';
    if (!host) return '';
    return `${relayProtocol}://${host}:8765`;
  } catch (error) {
    return '';
  }
}

function getPortalBasePath() {
  const pathname = window.location.pathname || '/';
  if (pathname.endsWith('/')) return pathname;
  if (/\/[^/]+\.html$/i.test(pathname)) {
    return pathname.replace(/\/[^/]+\.html$/i, '/');
  }
  return pathname;
}

function getCurrentPortalUrl() {
  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    return sanitizeHttpUrl(`${window.location.origin}${getPortalBasePath()}`);
  }
  return '';
}

function getCurrentEntryFilename() {
  if (state.entryPage === 'host') return 'host.html';
  if (state.entryPage === 'join') return 'join.html';
  if (state.entryPage === 'solo') return 'solo.html';
  return 'index.html';
}

function buildShareHintsFromPayload(payload, { defaultOriginUrl = '', backendDetected = true } = {}) {
  const preferredPortalUrl = sanitizeHttpUrl(payload?.preferredPortalUrl || '');
  const alternatePortalUrls = Array.isArray(payload?.alternatePortalUrls)
    ? payload.alternatePortalUrls
      .map(entry => ({
        label: String(entry?.label || '').trim(),
        url: sanitizeHttpUrl(entry?.url || '')
      }))
      .filter(entry => entry.label && entry.url)
    : [];
  const originPortalUrl = sanitizeHttpUrl(
    payload?.originPortalUrl
    || payload?.currentPortalUrl
    || defaultOriginUrl
    || getCurrentPortalUrl()
  );
  let lanPortalUrl = sanitizeHttpUrl(payload?.lanPortalUrl || '');
  if (!lanPortalUrl && looksLikeLanUrl(preferredPortalUrl)) {
    lanPortalUrl = preferredPortalUrl;
  }
  if (!lanPortalUrl) {
    const lanAlt = alternatePortalUrls.find(entry => looksLikeLanUrl(entry.url));
    lanPortalUrl = sanitizeHttpUrl(lanAlt?.url || '');
  }
  const lanAvailable = Boolean(lanPortalUrl);
  return {
    preferredPortalUrl,
    alternatePortalUrls,
    backendDetected: Boolean(backendDetected),
    lanPortalUrl,
    originPortalUrl,
    lanAvailable
  };
}

function applyShareHints(nextHints) {
  const previous = JSON.stringify(state.network.shareHints || {});
  state.network.shareHints = nextHints;
  if (!nextHints.lanAvailable && getNetworkingShareMode() === 'lan') {
    state.settings.networkShareMode = 'origin';
  }
  if (
    JSON.stringify(state.network.shareHints) !== previous
    && (state.screen === 'multi_lobby' || state.screen === 'join_entry' || state.showSettings)
  ) {
    render();
  }
}

function isLocalHostAddress(hostname) {
  const host = String(hostname || '').trim().toLowerCase();
  if (!host) return false;
  if (host === 'localhost' || host === '::1') return true;
  if (host === '127.0.0.1' || /^127\./.test(host)) return true;
  return looksLikeLanHost(host);
}

function isLoopbackHost(hostname) {
  const host = String(hostname || '').trim().toLowerCase();
  if (!host) return false;
  if (host === 'localhost' || host === '::1' || host === '[::1]') return true;
  if (host === '127.0.0.1' || /^127\./.test(host)) return true;
  return false;
}

function isPortalShareableUrl(rawUrl) {
  try {
    const parsed = new URL(String(rawUrl || '').trim());
    const host = String(parsed.hostname || '').trim().toLowerCase();
    if (!host) return false;
    if (isLoopbackHost(host)) return false;
    if (host === '0.0.0.0' || host === '::' || host === '[::]') return false;
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch (error) {
    return false;
  }
}

// The configured online relay (set in scripts/config.js). Used so a static host
// (e.g. GitHub Pages) can host/join multi-device rooms without a local backend.
function getConfiguredRelayUrl() {
  const raw = (typeof window !== 'undefined' && window.MAFIA_CONFIG && window.MAFIA_CONFIG.productionRelayUrl) || '';
  let url = sanitizeWsUrl(raw);
  if (!url) return '';
  // Never allow blocked mixed content: an https page must use wss://
  if (window.location.protocol === 'https:' && url.indexOf('ws://') === 0) {
    url = `wss://${url.slice('ws://'.length)}`;
  }
  return url;
}

// True when served from a public static host (e.g. GitHub Pages): http(s) and
// not a localhost/LAN address. Such hosts have no same-origin Python backend,
// so we must not probe /api/* and instead rely on the configured online relay.
function isPublicStaticHost() {
  if (!['http:', 'https:'].includes(window.location.protocol)) return false;
  return !isLocalHostAddress(window.location.hostname);
}

// Best-effort wake of a configured relay before the WebSocket dial. Free hosting
// tiers cold-start, so we ping the relay's HTTP /health first (no-cors: we only
// need to trigger the wake, not read the response).
async function warmUpConfiguredRelay() {
  const relay = getConfiguredRelayUrl();
  if (!relay) return;
  let healthUrl = '';
  try {
    const parsed = new URL(relay);
    parsed.protocol = parsed.protocol === 'wss:' ? 'https:' : 'http:';
    parsed.pathname = '/health';
    healthUrl = parsed.toString();
  } catch (error) {
    return;
  }
  state.network.statusDetail = 'Waking up the online room service (first connect can take ~30s)...';
  render();
  try {
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => {
      try { controller.abort(); } catch (error) { /* ignore */ }
    }, 55000) : null;
    await fetch(healthUrl, {
      mode: 'no-cors',
      cache: 'no-store',
      ...(controller ? { signal: controller.signal } : {})
    });
    if (timer) clearTimeout(timer);
  } catch (error) {
    // best-effort only; proceed to the WebSocket dial regardless
  }
}

function shouldAttemptLocalBackendRecovery() {
  if (window.location.protocol === 'file:') return true;
  if (!['http:', 'https:'].includes(window.location.protocol)) return false;
  return isLocalHostAddress(window.location.hostname);
}

function shouldShowRoomServiceStarter() {
  // The local room-service starter (.command/.bat) is meaningless on a public
  // static host — online play uses the configured relay instead.
  if (isPublicStaticHost()) return false;
  if (!isRealtimeMode() || !state.network.isHost) return false;
  if (state.network.connected || state.network.status !== 'error') return false;
  const detail = String(state.network.statusDetail || '').trim();
  if (!detail) return !Boolean(state.network.shareHints?.backendDetected);
  return /Could not start room service automatically|Could not start room connection from this URL|Room service not ready/i.test(detail);
}

function getLocalBackendPortalCandidates() {
  const candidates = [];
  const addCandidate = (raw) => {
    const normalized = sanitizeHttpUrl(raw);
    if (!normalized) return;
    if (!candidates.includes(normalized)) candidates.push(normalized);
  };

  const host = String(window.location.hostname || '').trim();
  if (host) {
    addCandidate(`http://${host}:${BACKEND_DEFAULT_PORT}/`);
  }
  addCandidate(`http://127.0.0.1:${BACKEND_DEFAULT_PORT}/`);
  addCandidate(`http://localhost:${BACKEND_DEFAULT_PORT}/`);

  return candidates;
}

function buildBackendRedirectUrl(basePortalUrl) {
  const normalizedBase = sanitizeHttpUrl(basePortalUrl);
  if (!normalizedBase) return '';
  try {
    const target = new URL(getCurrentEntryFilename(), normalizedBase);
    const params = new URLSearchParams(window.location.search || '');
    if (state.entryPage === 'index' && state.screen === 'multi_entry' && !params.get('screen')) {
      params.set('screen', 'multi_entry');
    }
    target.search = params.toString();
    return target.toString();
  } catch (error) {
    return '';
  }
}

async function fetchNetworkInfoPayload(basePortalUrl, timeoutMs = BACKEND_PROBE_TIMEOUT_MS) {
  const normalizedBase = sanitizeHttpUrl(basePortalUrl);
  if (!normalizedBase) return null;
  let requestUrl = '';
  try {
    requestUrl = new URL('api/network-info', normalizedBase).toString();
  } catch (error) {
    return null;
  }

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => {
      try {
        controller.abort();
      } catch (error) {
        // ignore abort errors
      }
    }, timeoutMs)
    : null;

  try {
    const response = await fetch(requestUrl, {
      cache: 'no-store',
      mode: 'cors',
      ...(controller ? { signal: controller.signal } : {})
    });
    if (!response.ok) return null;
    const payload = await response.json();
    if (!payload || typeof payload !== 'object') return null;
    return { basePortalUrl: normalizedBase, payload };
  } catch (error) {
    return null;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function fetchEnsureBackendPayload(basePortalUrl, timeoutMs = BACKEND_PROBE_TIMEOUT_MS) {
  const normalizedBase = sanitizeHttpUrl(basePortalUrl);
  if (!normalizedBase) return null;
  let requestUrl = '';
  try {
    requestUrl = new URL('api/ensure-backend', normalizedBase).toString();
  } catch (error) {
    return null;
  }

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => {
      try {
        controller.abort();
      } catch (error) {
        // ignore abort errors
      }
    }, timeoutMs)
    : null;

  try {
    const response = await fetch(requestUrl, {
      cache: 'no-store',
      mode: 'cors',
      ...(controller ? { signal: controller.signal } : {})
    });
    const payload = await response.json().catch(() => null);
    if (!payload || typeof payload !== 'object') return null;
    return { basePortalUrl: normalizedBase, payload, ok: response.ok };
  } catch (error) {
    return null;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function getBackendProbePortalCandidates() {
  const candidates = [];
  const addCandidate = (raw) => {
    const normalized = sanitizeHttpUrl(raw);
    if (!normalized) return;
    if (!candidates.includes(normalized)) candidates.push(normalized);
  };
  addCandidate(getCurrentPortalUrl());
  getLocalBackendPortalCandidates().forEach(addCandidate);
  return candidates;
}

function getFirstShareableAlternatePortal(primaryUrl = '') {
  const primaryNormalized = sanitizeHttpUrl(primaryUrl);
  const source = Array.isArray(state.network.shareHints?.alternatePortalUrls)
    ? state.network.shareHints.alternatePortalUrls
    : [];
  for (const entry of source) {
    const url = sanitizeHttpUrl(entry?.url || '');
    if (!url || url === primaryNormalized) continue;
    if (!isPortalShareableUrl(url)) continue;
    return url;
  }
  return '';
}

async function ensureBackendForHostClick() {
  const currentOrigin = (window.location.protocol === 'http:' || window.location.protocol === 'https:')
    ? window.location.origin
    : '';
  const candidates = getBackendProbePortalCandidates();

  for (const candidate of candidates) {
    const ensured = await fetchEnsureBackendPayload(candidate, 2200);
    if (!ensured) continue;

    const hints = buildShareHintsFromPayload(ensured.payload, {
      defaultOriginUrl: ensured.basePortalUrl,
      backendDetected: true
    });
    applyShareHints(hints);

    const relayReady = Boolean(ensured.payload?.relayReady ?? ensured.payload?.relayRunning);
    if (!relayReady) continue;

    let candidateOrigin = '';
    try {
      candidateOrigin = new URL(ensured.basePortalUrl).origin;
    } catch (error) {
      candidateOrigin = '';
    }

    if (candidateOrigin && candidateOrigin !== currentOrigin) {
      const redirectUrl = buildBackendRedirectUrl(ensured.basePortalUrl);
      if (redirectUrl && redirectUrl !== window.location.href) {
        state.network.status = 'connecting';
        state.network.statusDetail = 'Room service found. Switching to host URL...';
        render();
        window.location.replace(redirectUrl);
        return false;
      }
    }
    return true;
  }

  const recovered = await maybeRecoverViaLocalBackend();
  if (recovered) return true;
  await refreshShareHints();
  return Boolean(state.network.shareHints?.backendDetected);
}

async function maybeRecoverViaLocalBackend() {
  if (!shouldAttemptLocalBackendRecovery()) return false;
  if (backendAutoSwitchInFlight) return false;
  backendAutoSwitchInFlight = true;
  try {
    const candidates = getLocalBackendPortalCandidates();
    const currentOrigin = (window.location.protocol === 'http:' || window.location.protocol === 'https:')
      ? window.location.origin
      : '';

    for (const candidate of candidates) {
      const result = await fetchNetworkInfoPayload(candidate);
      if (!result) continue;

      const hints = buildShareHintsFromPayload(result.payload, {
        defaultOriginUrl: result.basePortalUrl,
        backendDetected: true
      });
      applyShareHints(hints);

      let candidateOrigin = '';
      try {
        candidateOrigin = new URL(result.basePortalUrl).origin;
      } catch (error) {
        candidateOrigin = '';
      }
      if (candidateOrigin && candidateOrigin !== currentOrigin) {
        const redirectUrl = buildBackendRedirectUrl(result.basePortalUrl);
        if (redirectUrl && redirectUrl !== window.location.href) {
          state.network.status = 'connecting';
          state.network.statusDetail = `Local multiplayer backend detected at ${result.basePortalUrl}. Switching now...`;
          render();
          window.location.replace(redirectUrl);
          return true;
        }
      }
      return true;
    }
    return false;
  } finally {
    backendAutoSwitchInFlight = false;
  }
}

function getJoinPortalUrl() {
  const mode = getNetworkingShareMode();
  const customPortal = sanitizeHttpUrl(state.settings.customShareBaseUrl || '');
  const lanPortal = sanitizeHttpUrl(state.network.shareHints?.lanPortalUrl || '');
  const hinted = sanitizeHttpUrl(state.network.shareHints?.preferredPortalUrl || '');
  const originPortal = sanitizeHttpUrl(state.network.shareHints?.originPortalUrl || '') || getCurrentPortalUrl();
  let selected = '';

  if (mode === 'custom' && customPortal) selected = customPortal;
  else if (mode === 'origin') selected = originPortal;
  else if (mode === 'lan' && lanPortal) selected = lanPortal;
  else if (hinted) selected = hinted;
  else if (customPortal) selected = customPortal;
  else selected = originPortal;

  if (isPortalShareableUrl(selected)) return selected;
  return getFirstShareableAlternatePortal(selected);
}

function getJoinPortalAlternates() {
  const primary = getJoinPortalUrl();
  const primaryNormalized = sanitizeHttpUrl(primary);
  const source = Array.isArray(state.network.shareHints?.alternatePortalUrls)
    ? state.network.shareHints.alternatePortalUrls
    : [];
  const unique = [];
  source.forEach(entry => {
    const label = String(entry?.label || '').trim();
    const url = sanitizeHttpUrl(entry?.url || '');
    if (!label || !url) return;
    if (!isPortalShareableUrl(url)) return;
    if (url === primaryNormalized) return;
    if (unique.some(item => item.url === url)) return;
    unique.push({ label, url });
  });
  return unique;
}

async function refreshShareHints() {
  // Solo play never needs multiplayer share hints or any backend probing.
  if (IS_SOLO_PAGE) {
    applyShareHints(buildShareHintsFromPayload({}, {
      defaultOriginUrl: getCurrentPortalUrl(),
      backendDetected: false
    }));
    return;
  }
  // Public static host (e.g. GitHub Pages): there is no same-origin backend, so
  // probing /api/network-info would 404 noisily. Online multiplayer uses the
  // configured relay; the join portal is simply this page's URL.
  if (isPublicStaticHost()) {
    applyShareHints(buildShareHintsFromPayload(
      { preferredPortalUrl: getCurrentPortalUrl() },
      { defaultOriginUrl: getCurrentPortalUrl(), backendDetected: Boolean(getConfiguredRelayUrl()) }
    ));
    return;
  }
  if (!['http:', 'https:'].includes(window.location.protocol)) {
    applyShareHints(buildShareHintsFromPayload({}, { defaultOriginUrl: '', backendDetected: false }));
    await maybeRecoverViaLocalBackend();
    return;
  }
  try {
    const response = await fetch('/api/network-info', { cache: 'no-store' });
    if (!response.ok) throw new Error(`network-info status ${response.status}`);
    const payload = await response.json();
    if (!payload || typeof payload !== 'object') throw new Error('network-info payload invalid');
    applyShareHints(buildShareHintsFromPayload(payload, {
      defaultOriginUrl: getCurrentPortalUrl(),
      backendDetected: true
    }));
  } catch (error) {
    const recovered = await maybeRecoverViaLocalBackend();
    if (!recovered) {
      applyShareHints(buildShareHintsFromPayload({}, {
        defaultOriginUrl: getCurrentPortalUrl(),
        backendDetected: false
      }));
    }
  }
}

function getShareJoinUrl(code = state.gameCode) {
  const joinPortal = getJoinPortalUrl();
  if (!joinPortal) return '';
  const roomCode = sanitizeRoomCode(code, '');
  if (!roomCode) return joinPortal;
  const connector = joinPortal.includes('?') ? '&' : '?';
  return `${joinPortal}${connector}join=${encodeURIComponent(roomCode)}&role=join&screen=multi`;
}

function getShareQrImageUrl(code = state.gameCode, size = 180) {
  const shareUrl = getShareJoinUrl(code);
  if (!shareUrl) return '';
  const px = Math.max(120, Math.min(720, Number(size) || 180));
  return `https://api.qrserver.com/v1/create-qr-code/?size=${px}x${px}&data=${encodeURIComponent(shareUrl)}`;
}

function getRelayCandidates() {
  const configuredRelay = getConfiguredRelayUrl();
  // On a public static host (e.g. GitHub Pages) there is no LAN/origin relay to
  // reach; only the configured online relay can work. Avoid wasting connect
  // attempts on unreachable ws://<that-host>:8765 candidates.
  if (isPublicStaticHost()) {
    return configuredRelay ? [configuredRelay] : [];
  }
  const protocol = window.location.protocol;
  const wsProto = protocol === 'https:' ? 'wss' : 'ws';
  const hostname = window.location.hostname || 'localhost';
  const candidates = new Set();
  if (configuredRelay) candidates.add(configuredRelay);
  const customRelay = sanitizeWsUrl(state.settings.customRelayUrl || '');
  const shareMode = getNetworkingShareMode();
  const selectedPortalRelay = relayUrlFromPortal(getJoinPortalUrl());
  const lanRelay = relayUrlFromPortal(state.network.shareHints?.lanPortalUrl || '');
  const originRelay = relayUrlFromPortal(state.network.shareHints?.originPortalUrl || getCurrentPortalUrl());

  if (shareMode === 'custom' && customRelay) candidates.add(customRelay);
  if (selectedPortalRelay) candidates.add(selectedPortalRelay);
  if (lanRelay) candidates.add(lanRelay);
  if (originRelay) candidates.add(originRelay);
  candidates.add(`${wsProto}://${hostname}:8765`);
  if (hostname === 'localhost') candidates.add(`${wsProto}://127.0.0.1:8765`);
  if (hostname === '127.0.0.1') candidates.add(`${wsProto}://localhost:8765`);
  if (protocol === 'file:') {
    candidates.add('ws://localhost:8765');
    candidates.add('ws://127.0.0.1:8765');
  }
  let list = [...candidates];
  // An https page cannot open an insecure ws:// socket (blocked mixed content),
  // so drop any non-wss candidate to avoid SecurityError noise and wasted slots.
  if (protocol === 'https:') {
    list = list.filter(url => url.indexOf('wss://') === 0);
  }
  return list;
}

function getConnectionGuideText() {
  const backendDetected = Boolean(state.network.shareHints?.backendDetected);
  const mode = getNetworkingShareMode();
  const protocol = window.location.protocol;
  if (isPublicStaticHost()) {
    return getConfiguredRelayUrl()
      ? 'Share this page link with your friends, then everyone enters the same room code to play online.'
      : 'Online multiplayer is not set up for this site yet. Solo and single-device pass-and-play work right now.';
  }
  if (protocol === 'file:') {
    return 'Tap Host Game to start the room service. The join link appears once it is ready.';
  }
  if (!backendDetected) {
    return 'Tap Host Game to start room service. Share links appear after it is ready.';
  }
  if (mode === 'custom') {
    return 'Custom networking is on. Share your custom URL and room code.';
  }
  if (mode === 'origin') {
    return 'Share this exact page URL on each device, then join with the room code.';
  }
  if (/^(localhost|127\.|192\.168\.|10\.)/.test(window.location.hostname || '')) {
    return 'Open this site URL on each device in the same network, then join with the room code.';
  }
  return 'Share this URL and enter the room code if prompted.';
}

function getRealtimeConnectionFailureMessage(isHostAttempt) {
  const backendDetected = Boolean(state.network.shareHints?.backendDetected);
  const mode = getNetworkingShareMode();
  if (isPublicStaticHost()) {
    if (!getConfiguredRelayUrl()) {
      return 'Online multiplayer is not set up for this site yet (no relay configured). Solo and single-device pass-and-play still work.';
    }
    return isHostAttempt
      ? 'Could not reach the online room service. It may be waking up — wait a few seconds and try Host Game again.'
      : 'Could not reach the room. Make sure the host started it, the room service is awake, and the code is correct.';
  }
  if (!backendDetected) {
    return isHostAttempt
      ? 'Could not start room service automatically from this page. Use the room service starter below, then press Host Game on the local host page.'
      : 'Room is not ready yet. Ask the host to start the room, then rejoin with the code.';
  }
  if (mode === 'custom') {
    return isHostAttempt
      ? 'Could not start room with current custom networking settings. Verify custom portal and relay URLs in Settings > Networking.'
      : 'Could not join room with current custom networking settings. Verify custom relay URL and room code.';
  }
  return isHostAttempt
    ? 'Could not start room connection from this URL. Confirm the backend is running on your network and try again.'
    : 'Could not reach this room yet. Confirm host started the room and check the room code.';
}

function getIdleRealtimeStatusDetail(isHostMode) {
  const backendDetected = Boolean(state.network.shareHints?.backendDetected);
  if (!backendDetected) {
    return isHostMode
      ? 'Room service not ready yet. Press Host Game to start it.'
      : 'Waiting for host room service. Enter code and join when host is ready.';
  }
  return isHostMode
    ? 'Press Host Game to open this room.'
    : 'Enter room code, then press Join Game.';
}

function applyEntryScreenDefaults() {
  if (state.entryPage === 'host') {
    state.screen = 'multi_lobby';
    state.multiplayerMode = 'realtime';
    state.realtimePanelMode = 'host';
    state.network.isHost = true;
    state.joinCode = state.joinCode || state.gameCode;
    state.autoJoinPending = false;
    return;
  }
  if (state.entryPage === 'join') {
    state.screen = 'join_entry';
    state.multiplayerMode = 'realtime';
    state.realtimePanelMode = 'join';
    state.network.isHost = false;
    state.showBigRoomCode = false;
    return;
  }
  if (state.entryPage === 'solo') {
    state.screen = 'solo_lobby';
    state.multiplayerMode = 'passplay';
    state.showBigRoomCode = false;
    return;
  }
  state.screen = 'setup';
}

function getRoomCacheKey(code = state.gameCode) {
  const normalized = sanitizeRoomCode(code, '');
  if (!normalized) return '';
  return `${ROOM_CACHE_PREFIX}${normalized}`;
}

function clearRoomCache(code = state.gameCode) {
  const key = getRoomCacheKey(code);
  if (!key) return;
  try {
    localStorage.removeItem(key);
    if (localStorage.getItem('mafia_last_room_code') === sanitizeRoomCode(code, '')) {
      localStorage.removeItem('mafia_last_room_code');
    }
  } catch (error) {
    // ignore localStorage issues
  }
}

function loadCachedRoomState(code = state.gameCode) {
  const key = getRoomCacheKey(code);
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    // Discard stale snapshots so an old tab can't restore an ancient game.
    if (parsed.savedAt && (Date.now() - Number(parsed.savedAt)) > ROOM_CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
}

function persistRoomStateCache() {
  if (!isRealtimeMode()) return;
  // No need to keep a finished game cached (and it holds every secret role).
  if (state.gamePhase === 'gameover') return;
  const roomCode = sanitizeRoomCode(state.gameCode, '');
  if (!roomCode) return;
  const key = getRoomCacheKey(roomCode);
  if (!key) return;
  const payload = {
    version: 1,
    savedAt: Date.now(),
    code: roomCode,
    role: state.network.isHost ? 'host' : 'join',
    deviceId: state.network.deviceId,
    deviceName: state.network.deviceName,
    snapshot: state.network.isHost ? buildRealtimeStateSnapshot() : null
  };
  // Skip redundant writes on every render: compare everything except the
  // timestamp so an unchanged game state doesn't re-serialize each frame.
  const dedupeKey = JSON.stringify({ ...payload, savedAt: 0 });
  if (dedupeKey === realtime.lastPersistedPayload) return;
  realtime.lastPersistedPayload = dedupeKey;
  try {
    localStorage.setItem(key, JSON.stringify(payload));
    localStorage.setItem('mafia_last_room_code', roomCode);
  } catch (error) {
    // ignore localStorage write issues
  }
}

function tryRestoreCachedRoomFromParams() {
  const requestedCode = sanitizeRoomCode(INITIAL_JOIN_CODE || INITIAL_ROOM_CODE, '');
  if (!requestedCode) return;
  const cached = loadCachedRoomState(requestedCode);
  if (!cached) return;
  if (cached.deviceId && String(cached.deviceId).trim()) {
    state.network.deviceId = String(cached.deviceId).trim();
  }
  if (cached.deviceName && String(cached.deviceName).trim()) {
    state.network.deviceName = String(cached.deviceName).trim().slice(0, 32);
  }
  state.gameCode = requestedCode;
  state.joinCode = requestedCode;
  if ((cached.role === 'host' || INITIAL_IS_HOST_ROLE) && !INITIAL_IS_JOIN_ROLE) {
    state.multiplayerMode = 'realtime';
    state.realtimePanelMode = 'host';
    state.network.isHost = true;
    if (cached.snapshot && typeof cached.snapshot === 'object') {
      state.cachedHostSnapshot = cached.snapshot;
    }
  }
}

function syncUrlState() {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;
  const url = new URL(window.location.href);
  const params = url.searchParams;
  ['screen', 'join', 'room', 'role'].forEach(key => params.delete(key));

  if (state.screen === 'multi_lobby') {
    params.set('screen', 'multi');
  } else if (state.screen === 'multi_entry') {
    params.set('screen', 'multi_entry');
  }
  if (isRealtimeMode() && ['multi_lobby', 'game'].includes(state.screen)) {
    const code = sanitizeRoomCode(state.gameCode, '');
    if (code) {
      if (state.network.isHost) {
        params.set('room', code);
        params.set('role', 'host');
      } else {
        params.set('join', code);
        params.set('role', 'join');
      }
    }
  }

  const nextSearch = params.toString();
  const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ''}${url.hash || ''}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextUrl !== currentUrl) {
    window.history.replaceState({}, '', nextUrl);
  }
}

function isRealtimeMode() {
  return state.multiplayerMode === 'realtime';
}

function isRealtimeClient() {
  return isRealtimeMode() && state.network.connected && !state.network.isHost;
}

function sendRealtimeMessage(payload) {
  if (!realtime.socket || realtime.socket.readyState !== WebSocket.OPEN) return false;
  try {
    realtime.socket.send(JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error('Realtime send failed:', error);
    return false;
  }
}

function buildRealtimeStateSnapshot() {
  const clone = JSON.parse(JSON.stringify(state));
  clone._networkDeviceOrder = [...(state.network.deviceOrder || [])];
  delete clone.network;
  return clone;
}

function applyRealtimeStateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return;
  realtime.applyingRemoteState = true;
  try {
    const keepNetwork = state.network;
    const keepJoinCode = state.joinCode;
    const keepMode = state.multiplayerMode;
    const keepPanelMode = state.realtimePanelMode;
    const keepEntryPage = state.entryPage;
    const keepInstructions = state.showInstructions;
    const keepSettings = state.showSettings;
    // Tutorial progress is per-device UI state, never synced from the host.
    const keepTutorialStep = state.tutorialStep;
    const keepChatDrawer = state.chatDrawerOpen;
    const keepChatSeen = state.chatSeenCount;
    const keepDeparted = state.departedDevices;
    const keepHostLostAt = state.hostLostAt;
    const incomingDeviceOrder = Array.isArray(snapshot._networkDeviceOrder) ? [...snapshot._networkDeviceOrder] : null;

    Object.keys(snapshot).forEach(key => {
      if (key === 'network') return;
      if (key === '_networkDeviceOrder') return;
      state[key] = snapshot[key];
    });

    state.network = keepNetwork;
    if (incomingDeviceOrder) {
      state.network.deviceOrder = incomingDeviceOrder;
    }
    state.joinCode = keepJoinCode || state.gameCode;
    state.multiplayerMode = keepMode;
    state.realtimePanelMode = keepPanelMode;
    state.entryPage = keepEntryPage;
    state.showInstructions = keepInstructions;
    state.showSettings = keepSettings;
    state.tutorialStep = keepTutorialStep;
    state.chatDrawerOpen = keepChatDrawer;
    state.chatSeenCount = keepChatSeen;
    state.departedDevices = keepDeparted;
    state.hostLostAt = keepHostLostAt;
  } finally {
    realtime.applyingRemoteState = false;
  }
}

function reconcileDeviceOrder(devices) {
  const incomingIds = (devices || []).map(device => device.deviceId);
  const existing = state.network.deviceOrder || [];
  const kept = existing.filter(deviceId => incomingIds.includes(deviceId));
  const missing = incomingIds.filter(deviceId => !kept.includes(deviceId));
  state.network.deviceOrder = [...kept, ...missing];
}

function updateRealtimePresence(devices, hostDeviceId = null) {
  const previousDevices = state.network.devices || [];
  state.network.devices = Array.isArray(devices) ? devices : [];
  maybeAutoAssignDeviceName(state.network.devices);
  const selfDevice = state.network.devices.find(device => device.deviceId === state.network.deviceId);
  if (selfDevice?.deviceName) state.network.deviceName = selfDevice.deviceName;
  reconcileDeviceOrder(state.network.devices);
  const wasHost = state.network.isHost;
  state.network.hostDeviceId = hostDeviceId || null;
  if (hostDeviceId) state.network.isHost = hostDeviceId === state.network.deviceId;
  refreshPlayerDeviceNames();

  if (state.screen === 'game' && state.gamePhase !== 'gameover') {
    trackDeviceDepartures(previousDevices, state.network.devices, hostDeviceId);
    // A device promoted mid-game announces the host hand-off.
    if (!wasHost && state.network.isHost) {
      addNarrationLog(`${state.network.deviceName} took over hosting after the previous host dropped.`, state.gamePhase);
      state.hostLostAt = null;
    }
  } else {
    state.departedDevices = {};
    state.hostLostAt = null;
  }
}

// Host-side: watch which devices vanish mid-game; give the host a Wait /
// Remove choice (with an auto-remove deadline so a stuck game self-heals).
const DEPARTURE_GRACE_MS = 90 * 1000;

function deviceOwnsAlivePlayers(deviceId) {
  return state.players.some(player => player.deviceId === deviceId && player.alive);
}

function trackDeviceDepartures(previousDevices, currentDevices, hostDeviceId) {
  const currentIds = new Set(currentDevices.map(device => device.deviceId));

  // Returning devices clear their pending departure.
  Object.keys(state.departedDevices).forEach(deviceId => {
    if (currentIds.has(deviceId)) {
      addNarrationLog(`${state.departedDevices[deviceId]?.name || 'A device'} reconnected.`, state.gamePhase);
      delete state.departedDevices[deviceId];
    }
  });

  // Host absence is tracked by every client (grace banner; the relay holds the
  // host seat for a while so an accidental refresh can reclaim it).
  if (hostDeviceId && !currentIds.has(hostDeviceId)) {
    if (!state.hostLostAt) state.hostLostAt = Date.now();
  } else {
    state.hostLostAt = null;
  }

  if (!state.network.isHost) return;

  previousDevices.forEach(device => {
    if (currentIds.has(device.deviceId)) return;
    if (device.deviceId === state.network.deviceId) return;
    if (!deviceOwnsAlivePlayers(device.deviceId)) return;
    if (state.departedDevices[device.deviceId]) return;
    state.departedDevices[device.deviceId] = {
      name: device.deviceName || 'A device',
      deadline: Date.now() + DEPARTURE_GRACE_MS
    };
    addNarrationLog(`${device.deviceName || 'A device'} disconnected. Waiting for them to return...`, state.gamePhase);
    const epoch = state.gameEpoch;
    setTimeout(() => {
      if (state.gameEpoch !== epoch) return;
      if (!state.departedDevices[device.deviceId]) return;
      window.removeDepartedDevice?.(device.deviceId);
    }, DEPARTURE_GRACE_MS + 500);
  });
}

// Remove a departed device's players from the running game. The story
// continues naturally if it is still viable (win conditions re-checked).
window.removeDepartedDevice = (deviceId) => {
  if (!state.network.isHost) return;
  const entry = state.departedDevices[deviceId];
  delete state.departedDevices[deviceId];
  const leaving = state.players.filter(player => player.deviceId === deviceId && player.alive);
  if (leaving.length === 0) {
    render();
    return;
  }
  state.players = state.players.map(player =>
    player.deviceId === deviceId && player.alive
      ? { ...player, alive: false, leftGame: true }
      : player
  );
  const names = leaving.map(player => player.name).join(', ');
  const note = `${names} left the story (${entry?.name || 'device'} disconnected).`;
  addNarrationLog(note, state.gamePhase);
  state.chatMessages.push({
    id: `msg_sys_${Date.now()}`,
    day: state.dayNumber,
    senderId: 'narrator',
    senderName: 'Narrator',
    text: note,
    at: new Date().toISOString()
  });
  state.pendingWin = evaluateWinCondition();
  if (state.pendingWin && ['day', 'night', 'discussion', 'vote'].includes(state.gamePhase)) {
    finalizeGameOver();
    return;
  }
  render();
};

// Host chooses to keep waiting: extend the deadline.
window.waitForDepartedDevice = (deviceId) => {
  if (!state.departedDevices[deviceId]) return;
  state.departedDevices[deviceId].deadline = Date.now() + DEPARTURE_GRACE_MS;
  const epoch = state.gameEpoch;
  setTimeout(() => {
    if (state.gameEpoch !== epoch) return;
    if (!state.departedDevices[deviceId]) return;
    window.removeDepartedDevice?.(deviceId);
  }, DEPARTURE_GRACE_MS + 500);
  render();
};

function broadcastRealtimeState(force = false) {
  if (!isRealtimeMode()) return;
  if (!state.network.connected || !state.network.isHost) return;
  if (realtime.applyingRemoteState) return;

  const snapshot = buildRealtimeStateSnapshot();
  const serialized = JSON.stringify(snapshot);
  if (!force && serialized === realtime.lastBroadcastPayload) return;
  realtime.lastBroadcastPayload = serialized;

  sendRealtimeMessage({
    type: 'state_update',
    code: state.gameCode,
    state: snapshot
  });
}

function closeSocketSilently(socket) {
  if (!socket) return;
  try {
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
  } catch (error) {
    // ignore socket handler cleanup errors
  }
  try {
    socket.close();
  } catch (error) {
    // ignore socket close errors
  }
}

function clearRealtimeAckTimer() {
  if (realtime.ackTimerId) {
    clearTimeout(realtime.ackTimerId);
    realtime.ackTimerId = null;
  }
}

function clearPendingRealtimeConnect() {
  clearRealtimeAckTimer();
  if (realtime.pendingTimerId) {
    clearTimeout(realtime.pendingTimerId);
    realtime.pendingTimerId = null;
  }
  if (realtime.pendingSocket && realtime.pendingSocket !== realtime.socket) {
    closeSocketSilently(realtime.pendingSocket);
  }
  realtime.pendingSocket = null;
}

function cancelRealtimeConnectAttempt() {
  realtime.connectAttemptId += 1;
  clearPendingRealtimeConnect();
}

function disconnectRealtimeSession({ keepMode = true } = {}) {
  cancelRealtimeConnectAttempt();
  clearBotChatTimers();
  if (realtime.socket) {
    try {
      realtime.socket.close();
    } catch (error) {
      console.error('Realtime close failed:', error);
    }
  }
  realtime.socket = null;
  realtime.lastBroadcastPayload = '';
  state.network.connected = false;
  state.network.status = 'offline';
  state.network.statusDetail = '';
  state.network.relayUrl = null;
  state.network.devices = [];
  state.network.deviceOrder = [];
  state.network.hostDeviceId = null;
  realtime.lastPersistedPayload = '';
  // Explicitly leaving the room (not a transient reconnect): drop its cached
  // snapshot so secret roles don't linger and a stale game can't be restored.
  if (!keepMode) {
    clearRoomCache(state.gameCode);
    state.multiplayerMode = 'passplay';
  }
}

function handleRealtimeMessage(message) {
  if (!message || typeof message !== 'object') return;

  // Any reply from the relay means it is alive and acknowledging us; stop the
  // post-open join watchdog.
  clearRealtimeAckTimer();

  if (message.type === 'joined_room') {
    if (message.code) {
      const code = sanitizeRoomCode(message.code);
      state.gameCode = code;
      state.joinCode = code;
    }
    state.network.connected = true;
    state.network.status = 'connected';
    state.network.statusDetail = state.network.isHost
      ? 'Room created. Share the room code or fast link.'
      : 'Joined room. Waiting for host sync.';
    if (!state.network.isHost && state.entryPage === 'join' && state.screen === 'join_entry') {
      state.screen = 'multi_lobby';
    }
    if (state.network.isHost) {
      broadcastRealtimeState(true);
    } else {
      sendRealtimeMessage({ type: 'request_state', code: state.gameCode });
    }
    if (state.network.isHost && state.cachedHostSnapshot) {
      applyRealtimeStateSnapshot(state.cachedHostSnapshot);
      state.cachedHostSnapshot = null;
      state.network.status = 'connected';
      state.network.statusDetail = 'Room restored from cache. Sharing latest state.';
      broadcastRealtimeState(true);
      render();
    }
    return;
  }

  if (message.type === 'kicked') {
    disconnectRealtimeSession({ keepMode: true });
    state.network.status = 'error';
    state.network.statusDetail = message.message ? String(message.message) : 'Host removed this device from the room.';
    state.realtimePanelMode = 'join';
    render();
    return;
  }

  if (message.type === 'presence') {
    updateRealtimePresence(message.devices, message.hostDeviceId);
    render();
    return;
  }

  if (message.type === 'state_update') {
    if (state.network.isHost) return;
    applyRealtimeStateSnapshot(message.state);
    render();
    return;
  }

  if (message.type === 'action_request') {
    if (!state.network.isHost) return;
    const action = message.action;
    const args = Array.isArray(message.args) ? message.args : [];
    const handler = window[action];
    if (typeof handler !== 'function') return;
    realtime.replayingRemoteAction = true;
    try {
      handler(...args);
    } finally {
      realtime.replayingRemoteAction = false;
    }
    return;
  }

  if (message.type === 'request_state') {
    if (state.network.isHost) broadcastRealtimeState(true);
    return;
  }

  if (message.type === 'host_changed') {
    updateRealtimePresence(state.network.devices, message.hostDeviceId || null);
    if (state.network.isHost) broadcastRealtimeState(true);
    render();
    return;
  }

  if (message.type === 'error') {
    cancelRealtimeConnectAttempt();
    const activeSocket = realtime.socket;
    realtime.socket = null;
    closeSocketSilently(activeSocket);
    state.network.connected = false;
    state.network.status = 'error';
    state.network.statusDetail = message.message ? String(message.message) : 'Room service rejected this request.';
    if (!state.network.isHost) {
      state.network.hostDeviceId = null;
      state.network.devices = [];
      state.network.deviceOrder = [];
    }
    render();
  }
}

function connectRealtimeSession() {
  if (!isRealtimeMode()) return;
  if (state.network.connected) return;

  cancelRealtimeConnectAttempt();
  const connectAttemptId = realtime.connectAttemptId;
  const isStaleAttempt = () => connectAttemptId !== realtime.connectAttemptId;
  const roomCode = sanitizeRoomCode(state.joinCode || state.gameCode);
  state.gameCode = roomCode;
  state.joinCode = roomCode;
  state.network.status = 'connecting';
  state.network.statusDetail = state.network.isHost
    ? 'Starting room connection...'
    : 'Joining room...';
  render();
  const relayCandidates = getRelayCandidates();
  let candidateIndex = 0;

  const tryNextCandidate = () => {
    if (isStaleAttempt()) return;
    if (candidateIndex >= relayCandidates.length) {
      state.network.status = 'offline';
      state.network.connected = false;
      state.network.statusDetail = getRealtimeConnectionFailureMessage(state.network.isHost);
      realtime.socket = null;
      render();
      return;
    }

    const relayUrl = relayCandidates[candidateIndex++];
    let socket;
    try {
      socket = new WebSocket(relayUrl);
    } catch (error) {
      tryNextCandidate();
      return;
    }
    realtime.pendingSocket = socket;

    let opened = false;
    let advanced = false;
    // A configured online relay (e.g. on a free tier) may cold-start, so give
    // the initial dial more time on a public static host.
    const dialTimeoutMs = isPublicStaticHost() ? 9000 : 1800;
    const timeoutId = setTimeout(() => {
      if (isStaleAttempt()) return;
      if (opened || advanced) return;
      advanced = true;
      clearPendingRealtimeConnect();
      try {
        socket.close();
      } catch (error) {
        // no-op
      }
      tryNextCandidate();
    }, dialTimeoutMs);
    realtime.pendingTimerId = timeoutId;

    const advanceIfNeeded = () => {
      if (isStaleAttempt()) return;
      if (opened || advanced) return;
      advanced = true;
      clearTimeout(timeoutId);
      if (realtime.pendingSocket === socket) realtime.pendingSocket = null;
      if (realtime.pendingTimerId === timeoutId) realtime.pendingTimerId = null;
      try {
        socket.close();
      } catch (error) {
        // no-op
      }
      tryNextCandidate();
    };

    socket.onopen = () => {
      if (isStaleAttempt()) {
        closeSocketSilently(socket);
        return;
      }
      opened = true;
      advanced = true;
      clearTimeout(timeoutId);
      if (realtime.pendingSocket === socket) realtime.pendingSocket = null;
      if (realtime.pendingTimerId === timeoutId) realtime.pendingTimerId = null;
      realtime.socket = socket;
      state.network.connected = false;
      state.network.status = 'connecting';
      state.network.statusDetail = state.network.isHost
        ? 'Opening room...'
        : 'Validating room code...';
      state.network.relayUrl = relayUrl;
      sendRealtimeMessage({
        type: 'join_room',
        code: roomCode,
        deviceId: state.network.deviceId,
        deviceName: state.network.deviceName,
        isHost: state.network.isHost
      });
      // Watchdog: if the relay accepts the socket but never replies with
      // joined_room / error, don't hang on "Validating room code..." forever.
      clearRealtimeAckTimer();
      realtime.ackTimerId = setTimeout(() => {
        realtime.ackTimerId = null;
        if (isStaleAttempt() || socket !== realtime.socket) return;
        if (state.network.connected) return;
        closeSocketSilently(socket);
        if (realtime.socket === socket) realtime.socket = null;
        state.network.status = 'error';
        state.network.connected = false;
        state.network.statusDetail = getRealtimeConnectionFailureMessage(state.network.isHost);
        render();
      }, 7000);
      render();
    };

    socket.onmessage = (event) => {
      if (isStaleAttempt() || socket !== realtime.socket) return;
      let parsed;
      try {
        parsed = JSON.parse(event.data);
      } catch (error) {
        return;
      }
      handleRealtimeMessage(parsed);
    };

    socket.onerror = () => {
      if (isStaleAttempt()) return;
      advanceIfNeeded();
    };

    socket.onclose = (event) => {
      clearTimeout(timeoutId);
      if (realtime.pendingSocket === socket) realtime.pendingSocket = null;
      if (realtime.pendingTimerId === timeoutId) realtime.pendingTimerId = null;
      if (isStaleAttempt()) return;
      if (!opened) {
        advanceIfNeeded();
        return;
      }
      if (socket !== realtime.socket) return;
      disconnectRealtimeSession();
      const kickedByHost = Number(event?.code) === 4001 || /kicked/i.test(String(event?.reason || ''));
      if (kickedByHost) {
        state.network.status = 'error';
        state.network.statusDetail = 'Host removed this device from the room.';
        state.realtimePanelMode = 'join';
      }
      render();
    };
  };

  tryNextCandidate();
}

function forwardRealtimeAction(action, args = []) {
  if (!isRealtimeClient()) return false;
  return sendRealtimeMessage({
    type: 'action_request',
    code: state.gameCode,
    action,
    args
  });
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
    intelItemText(intel?.heard) || 'I do not have proof, but we should pressure contradictions.',
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
  if (isRealtimeClient()) return;
  if (state.autoAdvance.key === key) return;
  if (state.autoAdvance.timerId) clearTimeout(state.autoAdvance.timerId);
  state.autoAdvance.key = key;
  const epoch = state.gameEpoch;
  state.autoAdvance.timerId = setTimeout(() => {
    state.autoAdvance.key = null;
    state.autoAdvance.timerId = null;
    if (state.gameEpoch !== epoch) return;
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

  if (location.privateRoom) {
    const targetPlayerId = plan.actionTarget || player?.id || 'shared';
    return `${location.id}:${targetPlayerId}`;
  }

  return `${location.id}:shared`;
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
  const primaryTargets = {};
  const candidates = alivePlayers.filter(player => player.role !== 'mafia');

  candidates.forEach(player => {
    const plan = state.nightPlans[player.id];

    // A detective shadowing one person (night stance) is a dedicated pod-snoop
    // regardless of their evening action.
    const stance = state.detectiveStances?.[player.id];
    if (player.role === 'detective' && stance?.id === 'shadow_target' && stance.target) {
      assignments[player.id] = [stance.target];
      primaryTargets[player.id] = stance.target;
      return;
    }

    if (!plan?.action) return;
    const location = getLocationById(plan.location);
    const isSnoopZone = Boolean(location?.isSnoopZone || location?.nodeType === 'investigation');
    const isSnooper = plan.action.kind === 'snoop' || (isSnoopZone && plan.action.kind === 'linger');
    if (!isSnooper) return;

    // Targeted snoop = dedicated watch on ONE person (the whole point of it).
    if (plan.action.requiresTarget && plan.actionTarget) {
      assignments[player.id] = [plan.actionTarget];
      primaryTargets[player.id] = plan.actionTarget;
      return;
    }

    // Route snooping spreads attention across a few random people.
    const sampleSize = player.role === 'detective' ? 5 : 3;
    const pool = alivePlayers.filter(candidate => candidate.id !== player.id);
    assignments[player.id] = samplePlayers(pool, sampleSize).map(candidate => candidate.id);
  });

  state.snoopPrimaryTargets = primaryTargets;
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

  const mafiaNode = resolveNodeBaseId(getPlanNodeId(mafiaPlan, mafiaPlayer));
  const nonMafia = alivePlayers.filter(player => player.role !== 'mafia');
  const nearby = nonMafia.filter(player => {
    const plan = state.nightPlans[player.id];
    if (!plan) return false;
    const node = resolveNodeBaseId(getPlanNodeId(plan, player));
    return getGraphDistance(mafiaNode, node) <= 1;
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
  state.mafiaBriefing = {};
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
      state.mafiaBriefing[mafiaPlayer.id] = [];

      state.mafiaSnooperIntel[mafiaPlayer.id] = {};
      const mafiaPlan = state.nightPlans[mafiaPlayer.id];
      const mafiaNode = mafiaPlan ? resolveNodeBaseId(getPlanNodeId(mafiaPlan, mafiaPlayer)) : null;
      Object.entries(state.snoopersByTarget).forEach(([targetId, snooperIds]) => {
        // Mafia only notice snoopers around rooms they actually pass near:
        // detection is gated on this mafia member being within one step of the
        // watched person's location ("if the mafia is anywhere near the pods").
        const watchedPlayer = alivePlayers.find(player => player.id === targetId);
        const watchedPlan = watchedPlayer ? state.nightPlans[watchedPlayer.id] : null;
        const watchedNode = watchedPlan ? resolveNodeBaseId(getPlanNodeId(watchedPlan, watchedPlayer)) : null;
        const mafiaIsNear = Boolean(
          mafiaNode && watchedNode && getGraphDistance(mafiaNode, watchedNode) <= 1
        ) || watchedPlayer?.role === 'mafia';
        if (!mafiaIsNear) return;

        const seen = snooperIds
          .map(id => alivePlayers.find(player => player.id === id))
          .filter(Boolean)
          .filter(snooper => snooper.role !== 'mafia')
          .filter(snooper => {
            const podSnoop = state.snoopPrimaryTargets?.[snooper.id] === targetId;
            return Math.random() < getSnooperDetectionChance(snooper, { podSnoop });
          })
          .map(snooper => snooper.name);

        if (seen.length > 0) {
          state.mafiaSnooperIntel[mafiaPlayer.id][targetId] = seen;
          const targetPlayer = alivePlayers.find(player => player.id === targetId);
          if (targetPlayer) {
            state.mafiaBriefing[mafiaPlayer.id].push(
              `${targetPlayer.name}'s room drew snoopers: ${seen.join(', ')}.`
            );
          }
        }
      });

      if (view.mode === 'nearby') {
        state.mafiaBriefing[mafiaPlayer.id].push('Only nearby targets are currently visible from your route.');
      } else {
        state.mafiaBriefing[mafiaPlayer.id].push('No close targets; search widened across the map.');
      }
    });
}

// Intel lines carry the probability they are true; the renderer shows the tier
// and the generation code uses the SAME number, so labels are honest.
function makeIntelItem(text, confidence) {
  return { text: String(text || ''), confidence: clamp01(confidence) };
}

// Tolerate both shapes: new {text, confidence} items and legacy plain strings
// (realtime peers may briefly run different versions).
function intelItemText(item) {
  if (!item) return '';
  return typeof item === 'string' ? item : String(item.text || '');
}

function intelItemConfidence(item) {
  if (!item || typeof item === 'string') return null;
  return Number.isFinite(item.confidence) ? clamp01(item.confidence) : null;
}

// Pick a reported name with tier-honest accuracy: returns the true name with
// probability `confidence`, otherwise a random other living player's name.
function reportNameWithConfidence(truePlayer, confidence, alivePlayers, excludeIds = []) {
  if (!truePlayer) return null;
  if (Math.random() < confidence) return truePlayer.name;
  const decoys = alivePlayers.filter(p => p.id !== truePlayer.id && !excludeIds.includes(p.id));
  const decoy = decoys[Math.floor(Math.random() * decoys.length)];
  return (decoy || truePlayer).name;
}

// Resolve what happens when the mafia reach the victim's door. The victim's
// evening choice finally matters mechanically (and exactly as described):
//  - locked: break-in can fail outright (loud either way); if they get in, the
//    victim is trapped (harder save).
//  - unlocked: silent entry, but the victim keeps an exit route — a real
//    escape chance, better when someone alert is close enough to stir.
//  - porch_watch: no quiet approach; big witness boost.
function resolveBedroomDefense(targetPlayer, targetPlan, alivePlayers) {
  if (!targetPlayer || !targetPlan?.action) {
    return { outcome: 'proceed', noiseDelta: 0, victimLocked: false };
  }
  const actionId = targetPlan.action.id;

  if (actionId === 'sleep_lock') {
    if (Math.random() < 0.3) {
      return { outcome: 'blocked', noiseDelta: 0.25, victimLocked: true };
    }
    return { outcome: 'proceed', noiseDelta: 0.25, victimLocked: true };
  }

  if (actionId === 'sleep_unlocked') {
    const targetNode = resolveNodeBaseId(getPlanNodeId(targetPlan, targetPlayer));
    const alertNeighbor = alivePlayers.some(candidate => {
      if (candidate.id === targetPlayer.id || candidate.role === 'mafia') return false;
      const plan = state.nightPlans[candidate.id];
      if (!plan) return false;
      const node = resolveNodeBaseId(getPlanNodeId(plan, candidate));
      if (getGraphDistance(targetNode, node) > 1) return false;
      const awareness = getNightAwarenessChoice(candidate.id);
      return awareness.id === 'active_watch' || plan.action?.kind === 'linger';
    });
    const escapeChance = clamp01(0.22 + (alertNeighbor ? 0.15 : 0));
    if (Math.random() < escapeChance) {
      return { outcome: 'escaped', noiseDelta: -0.12, victimLocked: false };
    }
    return { outcome: 'proceed', noiseDelta: -0.12, victimLocked: false };
  }

  if (actionId === 'porch_watch') {
    return { outcome: 'proceed', noiseDelta: 0.2, victimLocked: false };
  }

  return { outcome: 'proceed', noiseDelta: 0, victimLocked: false };
}

function getIntelFallback(player) {
  const base = player.role === 'detective'
    ? 'Inconclusive: your route was quiet, but your notes may matter later.'
    : 'Inconclusive: no clear evidence from your position tonight.';
  return {
    heard: makeIntelItem(base, 0.3),
    saw: null,
    nearby: null,
    tracked: null,
    cause: null,
    awareness: null
  };
}

function getNightAwarenessChoice(playerId) {
  const selectedId = state.nightAwareness?.[playerId];
  return NIGHT_AWARENESS_OPTIONS.find(option => option.id === selectedId) || NIGHT_AWARENESS_OPTIONS[1];
}

function buildNarration(eventName, context = {}) {
  const packId = state.selectedStory.narrationPack || 'default';
  const pack = NARRATION_PRESETS[packId] || NARRATION_PRESETS.default;
  const tone = state.settings.narratorTone || 'grim';
  const dramaticSuffix = tone === 'cinematic'
    ? ' Keep your story consistent.'
    : tone === 'neutral'
      ? ' Use concrete timing and location details.'
      : ' Fear and confidence are both useful masks.';

  if (eventName === 'intro') {
    const backstory = pack.backstory ? `${pack.backstory} ` : '';
    return `${backstory}${pack.intro} ${state.selectedStory.mood}`;
  }
  if (eventName === 'day') {
    const echo = describeNightEcho();
    return `${pack.day}${echo ? ` ${echo}` : ''}${dramaticSuffix}`;
  }
  if (eventName === 'night') return `${pack.night}${dramaticSuffix}`;
  if (eventName === 'morning') {
    if (context.attackHappened && context.saved) {
      return `${pack.morning} Someone survived by a narrow margin.`;
    }
    if (context.attackHappened) {
      return `${pack.morning} A body tells part of the story.`;
    }
    return `${pack.morning} No confirmed kill, but danger remains.`;
  }
  if (eventName === 'discussion') {
    const echo = describeNightEcho();
    return `${pack.discussion}${echo ? ` ${echo}` : ''}`;
  }
  if (eventName === 'vote') {
    const voteEcho = describeVoteStakes();
    return `${pack.vote}${voteEcho ? ` ${voteEcho}` : ''}`;
  }
  return `${state.selectedStory.mood}`;
}

// One public sentence about last night, woven into day/discussion narration.
function describeNightEcho() {
  const s = state.lastNightSummary;
  if (!s) return '';
  if (s.type === 'death') return `The ${s.role}'s death — ${s.method} — hangs over every conversation: ${s.victim} is gone.`;
  if (s.type === 'saved') return `${s.victim} survived the night by a thread; someone was there when it counted.`;
  if (s.type === 'escaped') return `${s.victim} bolted from their own room in the dark and lived — their story matters now.`;
  if (s.type === 'blocked') return `Somewhere, a bolted door held against a midnight break-in. The would-be killer walked away empty-handed.`;
  if (s.type === 'quiet') return `The night passed without blood — which means somebody is being patient.`;
  return '';
}

function describeVoteStakes() {
  const alive = getAlivePlayers().length;
  return alive <= 4 ? `Only ${alive} remain. There is no room left for a wrong guess.` : '';
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
    // Blood Moon: aggressive but should not auto-trigger parity warnings in normal lobbies.
    if (count <= 4) mafia = 1, doctor = 1, detective = 0;
    else if (count <= 6) mafia = 2, doctor = 1, detective = 0;
    else if (count <= 8) mafia = 3, doctor = 1, detective = 1;
    else if (count <= 10) mafia = 4, doctor = 1, detective = 1;
    else if (count <= 12) mafia = 4, doctor = 2, detective = 1;
    else if (count <= 14) mafia = 5, doctor = 2, detective = 1;
    else mafia = Math.round(count * 0.34), doctor = Math.max(1, Math.round(count * 0.14)), detective = Math.max(1, Math.round(count * 0.1));
  } else if (preset.id === 'chaos') {
    // Crossfire: volatile but not pure mafia; more doctors than Blood Moon.
    if (count <= 4) mafia = 1, doctor = 1, detective = 0;
    else if (count <= 6) mafia = 2, doctor = 1, detective = 1;
    else if (count <= 8) mafia = 3, doctor = 2, detective = 1;
    else if (count <= 10) mafia = 4, doctor = 2, detective = 1;
    else if (count <= 12) mafia = 5, doctor = 2, detective = 2;
    else if (count <= 14) mafia = 6, doctor = 3, detective = 2;
    else mafia = Math.round(count * 0.36), doctor = Math.max(2, Math.round(count * 0.2)), detective = Math.max(1, Math.round(count * 0.11));
  } else if (preset.id === 'detective') {
    // Forensics: information-heavy town side.
    if (count <= 4) mafia = 1, doctor = 1, detective = 1;
    else if (count <= 6) mafia = 1, doctor = 1, detective = 2;
    else if (count <= 8) mafia = 2, doctor = 1, detective = 3;
    else if (count <= 10) mafia = 2, doctor = 2, detective = 4;
    else if (count <= 12) mafia = 3, doctor = 2, detective = 4;
    else if (count <= 14) mafia = 3, doctor = 2, detective = 5;
    else mafia = Math.max(3, Math.round(count * 0.24)), doctor = Math.max(2, Math.round(count * 0.14)), detective = Math.max(2, Math.round(count * 0.28));
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
  const minPlayers = state.screen === 'multi_lobby' ? 2 : 3;
  if (isRealtimeMode() && !state.network.connected) return false;
  if (isRealtimeMode() && !state.network.isHost) return false;
  if (allPlayers.length < minPlayers) return false;
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
  const minPlayers = state.screen === 'multi_lobby' ? 2 : 3;
  if (isRealtimeMode() && !state.network.connected) return 'Connect multi-device first';
  if (isRealtimeMode() && !state.network.isHost) return 'Waiting for host to start';
  if (allPlayers.length < minPlayers) return `Need ${minPlayers}+ players (${allPlayers.length})`;
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

function canHostManageBots() {
  return !isRealtimeMode() || state.network.isHost;
}

function canEditLobbySetup() {
  if (!isRealtimeMode()) return true;
  return state.network.isHost;
}

function sortPlayersByDeviceOrder() {
  const orderedDevices = state.network.deviceOrder || [];
  if (!isRealtimeMode() || orderedDevices.length === 0) return;

  const grouped = {};
  state.players.forEach(player => {
    const key = player.deviceId || 'unknown';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(player);
  });

  const reordered = [];
  orderedDevices.forEach(deviceId => {
    if (grouped[deviceId]) reordered.push(...grouped[deviceId]);
    delete grouped[deviceId];
  });

  Object.values(grouped).forEach(group => reordered.push(...group));
  state.players = reordered;
}

// -----------------------------------------------------------------------------
// PLAYER/BOT MANAGEMENT
// -----------------------------------------------------------------------------

function addBot() {
  if (!canHostManageBots()) return;
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
  if (!canHostManageBots()) return;
  state.bots = state.bots.filter(b => b.id !== id);
  updateRoleConfig();
  render();
}

function renameBot(id, value) {
  if (!canHostManageBots()) return;
  const nextName = String(value || '').trim();
  if (!nextName) return;
  const duplicate = getAllPlayers().some(player => player.id !== id && player.name.toLowerCase() === nextName.toLowerCase());
  if (duplicate) {
    state.nameError = 'Name already taken';
    render();
    return;
  }
  state.bots = state.bots.map(bot => bot.id === id ? { ...bot, name: nextName } : bot);
  state.nameError = '';
  render();
}

function addPlayer(name, deviceId = null) {
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
    alive: true,
    deviceId: deviceId || state.network.deviceId,
    deviceName: getDeviceNameById(deviceId || state.network.deviceId)
  });
  state.nameError = '';
  updateRoleConfig();
  render();
  setTimeout(() => {
    const list = document.querySelector('.player-list');
    if (list) list.scrollTop = list.scrollHeight;
  }, 50);
  return true;
}

function removePlayer(id) {
  if (isRealtimeMode() && !state.network.isHost) {
    const target = state.players.find(player => player.id === id);
    if (!target) return;
    const deviceId = target.deviceId || state.network.deviceId;
    if (deviceId !== state.network.deviceId) return;
  }
  state.players = state.players.filter(p => p.id !== id);
  updateRoleConfig();
  render();
}

function movePlayer(id, direction) {
  const index = state.players.findIndex(player => player.id === id);
  if (index === -1) return;
  const targetIndex = index + Number(direction || 0);
  if (targetIndex < 0 || targetIndex >= state.players.length) return;
  const reordered = [...state.players];
  [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
  state.players = reordered;
  render();
}

function moveDevice(deviceId, direction) {
  const order = [...(state.network.deviceOrder || [])];
  const index = order.indexOf(deviceId);
  if (index === -1) return;
  const targetIndex = index + Number(direction || 0);
  if (targetIndex < 0 || targetIndex >= order.length) return;
  [order[index], order[targetIndex]] = [order[targetIndex], order[index]];
  state.network.deviceOrder = order;

  // Keep player ordering grouped by device order while preserving within-device order.
  sortPlayersByDeviceOrder();
  render();
}

function movePlayerToIndex(playerId, targetIndex) {
  const sourceIndex = state.players.findIndex(player => player.id === playerId);
  if (sourceIndex === -1) return;
  const boundedTarget = Math.max(0, Math.min(targetIndex, state.players.length - 1));
  if (boundedTarget === sourceIndex) return;

  const reordered = [...state.players];
  const [item] = reordered.splice(sourceIndex, 1);
  reordered.splice(boundedTarget, 0, item);
  state.players = reordered;
  render();
}

function movePlayerWithinDevice(playerId, targetPlayerId) {
  const player = state.players.find(item => item.id === playerId);
  const target = state.players.find(item => item.id === targetPlayerId);
  if (!player || !target) return;
  if ((player.deviceId || '') !== (target.deviceId || '')) return;

  const sourceIndex = state.players.findIndex(item => item.id === playerId);
  const targetIndex = state.players.findIndex(item => item.id === targetPlayerId);
  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;

  const reordered = [...state.players];
  const [item] = reordered.splice(sourceIndex, 1);
  reordered.splice(targetIndex, 0, item);
  state.players = reordered;
  render();
}

function moveDeviceToIndex(deviceId, targetDeviceId) {
  const order = [...(state.network.deviceOrder || [])];
  const sourceIndex = order.indexOf(deviceId);
  const targetIndex = order.indexOf(targetDeviceId);
  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;
  const [item] = order.splice(sourceIndex, 1);
  order.splice(targetIndex, 0, item);
  state.network.deviceOrder = order;
  sortPlayersByDeviceOrder();
  render();
}

function removeDevice(deviceId) {
  if (!isRealtimeMode()) return;
  if (!state.network.isHost) return;
  if (!deviceId || deviceId === state.network.deviceId) return;

  state.players = state.players.filter(player => player.deviceId !== deviceId);
  state.network.deviceOrder = (state.network.deviceOrder || []).filter(id => id !== deviceId);
  state.network.devices = (state.network.devices || []).filter(device => device.deviceId !== deviceId);
  sendRealtimeMessage({
    type: 'kick_device',
    code: state.gameCode,
    deviceId
  });
  state.network.statusDetail = 'Device removed from room by host.';
  updateRoleConfig();
  render();
}

function adjustRole(role, delta) {
  if (!canEditLobbySetup()) return;
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
  state.selectedKillMethod = null;
  state.selectedAwareness = null;
  state.selectedStance = null;
  state.selectedStanceTarget = null;
  state.selectedSave = null;
  state.mafiaKillMethods = {};
  state.nightAwareness = {};
  state.detectiveStances = {};
  state.snoopPrimaryTargets = {};
  state.doctorSave = null;
  state.nightDefenseOutcome = null;
  state.nightAttackMethod = null;
  state.narrative = buildNarration('night');
  addNarrationLog(state.narrative, 'night');
  primeNarratorTurn('night');
  queueNarratorChatPrompt('night');
  clearBotChatTimers();
  prepareNightContext();

  const allPlayers = getAllPlayers();
  const nightActors = getNightActors();
  if (nightActors.length > 0) {
    const firstActorId = nightActors[0].id;
    const actorIndex = allPlayers.findIndex(player => player.id === firstActorId);
    state.currentPlayerIndex = actorIndex !== -1 ? actorIndex : 0;
  } else {
    const firstHuman = findFirstAliveHumanIndex();
    state.currentPlayerIndex = firstHuman !== -1 ? firstHuman : 0;
  }

  withBotDelay(() => botMakeDecisions('night'), Math.max(700, state.botDelayMs));
}

// -----------------------------------------------------------------------------
// GAME START
// -----------------------------------------------------------------------------

function startGame() {
  if (!canEditLobbySetup()) return;
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
  state.gameEpoch = (state.gameEpoch || 0) + 1;
  state.dayNumber = 1;
  state.narrative = buildNarration('intro');
  state.currentPlayerIndex = 0;
  state.showRole = false;
  // First game on this device: walk through the features once.
  try {
    if (!localStorage.getItem('mafia_tutorial_done')) state.tutorialStep = 0;
  } catch (error) {
    // localStorage unavailable; skip the tutorial gate
  }
  state.nightPlans = {};
  state.snoopAssignments = {};
  state.snoopPrimaryTargets = {};
  state.detectiveStances = {};
  state.nightDefenseOutcome = null;
  state.nightAttackCounts = {};
  state.nightAttackMethod = null;
  state.mafiaSnooperIntel = {};
  state.mafiaBriefing = {};
  state.nightAwareness = {};
  state.mafiaVotes = {};
  state.mafiaKillMethods = {};
  state.doctorSave = null;
  state.votes = {};
  state.intelResults = {};
  state.chatMessages = [];
  state.chatDraft = '';
  state.chatSenderId = null;
  state.selectedLocation = null;
  state.selectedAction = null;
  state.selectedActionTarget = null;
  state.selectedTarget = null;
  state.selectedKillMethod = null;
  state.selectedAwareness = null;
  state.selectedSave = null;
  state.selectedVote = null;
  state.discussionUnlockAt = 0;
  state.showBigRoomCode = false;
  state.selectedMapFloor = null;
  state.nightPlans = {};
  state.snoopAssignments = {};
  state.snoopPrimaryTargets = {};
  state.detectiveStances = {};
  state.nightDefenseOutcome = null;
  state.snoopersByTarget = {};
  state.mafiaSnooperIntel = {};
  state.mafiaBriefing = {};
  state.nightAwareness = {};
  state.mafiaVotes = {};
  state.mafiaKillMethods = {};
  state.nightAttackCounts = {};
  state.nightAttackMethod = null;
  state.intelResults = {};
  state.lastNarratorPromptKey = null;
  state.pendingNarratorPhase = null;
  state.narrationLog = [];
  state.lastBotChatDay = null;
  clearBotChatTimers();
  clearDeathAnimation();
  state.winner = null;
  state.winReason = null;
  state.pendingWin = null;
  state.finalDeath = null;
  clearAutoAdvance();
  addNarrationLog(state.narrative, 'reveal');
  primeNarratorTurn('reveal');
  queueNarratorChatPrompt('reveal');

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
  // Ignore a stale deferred call after the phase has already advanced (e.g. a
  // human finished voting and processVote ran before this timer fired). Without
  // this guard, late bot writes could leak into the next round.
  if (state.gamePhase !== phase) return;
  const alivePlayers = getAlivePlayers();
  const aliveBots = alivePlayers.filter(p => p.isBot);

  if (phase === 'day') {
    aliveBots.forEach(bot => {
      const location = state.selectedStory.locations[Math.floor(Math.random() * state.selectedStory.locations.length)];
      const actions = getAvailableActionsForPlayer(bot, location);
      const action = actions[Math.floor(Math.random() * actions.length)];
      const otherPlayers = alivePlayers.filter(player =>
        player.id !== bot.id && (bot.role === 'mafia' ? player.role !== 'mafia' : true)
      );
      const actionTarget = action?.requiresTarget
        ? otherPlayers[Math.floor(Math.random() * otherPlayers.length)]?.id || null
        : null;
      state.nightPlans[bot.id] = {
        location: location.id,
        locationName: location.name,
        action,
        actionTarget
      };
    });
  }

  if (phase === 'night') {
    const mafiaBots = aliveBots.filter(b => b.role === 'mafia');
    mafiaBots.forEach(bot => {
      if (state.mafiaVotes[bot.id]) return; // already chose a target this night
      const view = getVisibleTargetsForMafia(bot.id, alivePlayers);
      const targets = view.targets.length > 0
        ? view.targets
        : alivePlayers.filter(player => player.role !== 'mafia');
      const investigatingTargets = targets.filter(target => {
        const plan = state.nightPlans[target.id];
        return getPlanIntelChance(target, plan) >= 0.5;
      });
      const target = investigatingTargets.length > 0 && Math.random() > 0.35
        ? investigatingTargets[Math.floor(Math.random() * investigatingTargets.length)]
        : targets[Math.floor(Math.random() * targets.length)];
      if (target) {
        state.mafiaVotes[bot.id] = target.id;
        const methodPool = [...KILL_METHODS].sort((a, b) => b.noise - a.noise);
        const preferred = Math.random() > 0.5 ? methodPool[0] : randomChoice(KILL_METHODS);
        state.mafiaKillMethods[bot.id] = preferred?.id || KILL_METHODS[0].id;
      }
    });
    aliveBots
      .filter(bot => bot.role !== 'mafia')
      .forEach(bot => {
        if (state.nightAwareness[bot.id]) return; // already chose a stance this night
        const pick = randomChoice(NIGHT_AWARENESS_OPTIONS) || NIGHT_AWARENESS_OPTIONS[1];
        state.nightAwareness[bot.id] = pick.id;
      });

    // Bot doctor chooses who to protect as their night stance (no separate
    // morning turn anymore). Without knowing the target, prefer protecting
    // players whose plans look the most exposed.
    aliveBots
      .filter(bot => bot.role === 'doctor')
      .forEach(bot => {
        if (state.doctorSave) return;
        const candidates = alivePlayers.filter(player => player.id !== bot.id);
        const ranked = [...candidates].sort((a, b) => {
          const ea = getPlanExposure(a, state.nightPlans[a.id]);
          const eb = getPlanExposure(b, state.nightPlans[b.id]);
          return eb - ea;
        });
        const pick = Math.random() < 0.6 ? ranked[0] : randomChoice(candidates);
        state.doctorSave = pick?.id || null;
      });

    // Bot detective chooses a night stance; shadowing one person is their
    // strongest play, so they favor it.
    aliveBots
      .filter(bot => bot.role === 'detective')
      .forEach(bot => {
        if (state.detectiveStances[bot.id]) return;
        const roll = Math.random();
        if (roll < 0.5) {
          const targets = alivePlayers.filter(player => player.id !== bot.id);
          const target = randomChoice(targets);
          if (target) {
            state.detectiveStances[bot.id] = { id: 'shadow_target', target: target.id };
            state.nightAwareness[bot.id] = 'active_watch';
            return;
          }
        }
        if (roll < 0.8) {
          state.detectiveStances[bot.id] = { id: 'sweep_routes', target: null };
          state.nightAwareness[bot.id] = 'listen_posts';
        } else {
          state.detectiveStances[bot.id] = { id: 'lay_low', target: null };
          state.nightAwareness[bot.id] = 'low_profile';
        }
      });
  }

  if (phase === 'vote') {
    aliveBots.forEach(bot => {
      if (state.votes[bot.id]) return; // already voted this round
      const targets = alivePlayers.filter(p =>
        p.id !== bot.id && (bot.role === 'mafia' ? p.role !== 'mafia' : true)
      );
      const target = targets[Math.floor(Math.random() * targets.length)];
      if (target) state.votes[bot.id] = target.id;
    });
  }
}

// Make sure every alive bot has a vote for the current round. The normal path
// schedules bot votes on a timer, but a human can confirm the final vote before
// that timer fires; calling this synchronously before tallying prevents bot
// votes from being silently dropped.
function ensureBotVotes() {
  if (state.gamePhase === 'vote') botMakeDecisions('vote');
}

// Same race as ensureBotVotes, for the night phase: a human night actor can
// finish before the deferred bot timer fires, so guarantee bot Mafia targets
// and stances are recorded before processNight tallies the kill.
function ensureBotNightDecisions() {
  if (state.gamePhase === 'night') botMakeDecisions('night');
}

// -----------------------------------------------------------------------------
// NIGHT PHASE PROCESSING
// -----------------------------------------------------------------------------

function processNight() {
  ensureBotNightDecisions();
  prepareNightContext();

  const voteCounts = {};
  const methodCountsByTarget = {};

  Object.entries(state.mafiaVotes).forEach(([mafiaId, targetId]) => {
    if (!targetId) return;
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    const methodId = state.mafiaKillMethods[mafiaId] || KILL_METHODS[0].id;
    if (!methodCountsByTarget[targetId]) methodCountsByTarget[targetId] = {};
    methodCountsByTarget[targetId][methodId] = (methodCountsByTarget[targetId][methodId] || 0) + 1;
  });

  const sorted = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
  const targetId = sorted[0]?.[0];
  const methodCounts = targetId ? methodCountsByTarget[targetId] || {} : {};
  const sortedMethodCounts = Object.entries(methodCounts).sort((a, b) => b[1] - a[1]);
  const resolvedMethodId = sortedMethodCounts[0]?.[0] || KILL_METHODS[0].id;
  const resolvedMethod = getKillMethodById(resolvedMethodId);

  state.nightAttackCounts = voteCounts;
  state.nightTarget = targetId;
  state.nightAttackMethod = resolvedMethod.id;

  const alivePlayers = getAlivePlayers();
  const targetPlayer = alivePlayers.find(player => player.id === targetId);
  const targetPlan = targetPlayer ? state.nightPlans[targetPlayer.id] : null;
  const targetNode = targetPlan ? resolveNodeBaseId(getPlanNodeId(targetPlan, targetPlayer)) : null;

  // The victim's evening choice (lock / unlocked exit / porch) shapes the attack.
  const defense = resolveBedroomDefense(targetPlayer, targetPlan, alivePlayers);
  state.nightDefenseOutcome = targetId ? { ...defense, targetId } : null;
  const attackHappens = Boolean(targetId) && defense.outcome === 'proceed';

  // The mafia members who actually voted for the resolved target — sightings
  // name THESE people (never a random uninvolved mafia), so confidence labels
  // stay mechanically honest.
  const attackers = alivePlayers.filter(player =>
    player.role === 'mafia' && state.mafiaVotes[player.id] === targetId
  );
  const pickAttacker = () => attackers[Math.floor(Math.random() * attackers.length)] || null;

  const newIntel = {};

  alivePlayers.forEach(player => {
    const plan = state.nightPlans[player.id];
    if (player.role === 'mafia') return;
    if (!plan) {
      newIntel[player.id] = getIntelFallback(player);
      return;
    }

    const playerNode = resolveNodeBaseId(getPlanNodeId(plan, player));
    const awarenessChoice = getNightAwarenessChoice(player.id);
    const awarenessBoost = Number(awarenessChoice?.exposureMod || 0);
    const effectiveIntel = clamp01(getPlanIntelChance(player, plan) + awarenessBoost);
    const intel = getIntelFallback(player);
    const noiseWeight = clamp01(getAdjustedDisturbance(resolvedMethod) + (targetId ? defense.noiseDelta : 0));
    const distanceToAttack = targetNode ? getGraphDistance(playerNode, targetNode) : Infinity;
    const witnessedFromNearby = targetId && player.id !== targetId && distanceToAttack <= 1;

    // Channel 1 — you were physically near the attack (or the failed break-in).
    if (witnessedFromNearby) {
      if (defense.outcome === 'blocked') {
        intel.heard = makeIntelItem('In the night you heard someone forcing a lock close by — then hurried footsteps leaving.', INTEL_RELIABILITY.confirmed);
      } else {
        intel.heard = makeIntelItem(`You were nearby during the attack and heard ${resolvedMethod.evidenceHint}.`, INTEL_RELIABILITY.confirmed);
        intel.cause = makeIntelItem(`Likely method: ${resolvedMethod.name}.`, INTEL_RELIABILITY.likely);
      }
      const witnessChance = applyWitnessMods(clamp01(
        (player.role === 'detective' ? 0.62 : 0.34) + (noiseWeight * 0.42) + (awarenessBoost * 0.45)
      ));
      if (attackers.length > 0 && Math.random() < witnessChance) {
        const attacker = pickAttacker();
        if (player.role === 'detective') {
          const name = reportNameWithConfidence(attacker, INTEL_RELIABILITY.confirmed, alivePlayers, [player.id, targetId]);
          intel.saw = makeIntelItem(`${name} fled from ${targetPlayer?.name}'s area right after the strike.`, INTEL_RELIABILITY.confirmed);
        } else {
          const name = reportNameWithConfidence(attacker, INTEL_RELIABILITY.likely, alivePlayers, [player.id, targetId]);
          intel.saw = makeIntelItem(`You glimpsed a fleeing figure near ${targetPlayer?.name}'s area — it looked like ${name}.`, INTEL_RELIABILITY.likely);
        }
      }
    }

    // Channel 2 — dedicated pod-snoop: near-certain truth about ONE person.
    const primaryTargetId = state.snoopPrimaryTargets?.[player.id] || null;
    if (primaryTargetId) {
      const watched = alivePlayers.find(candidate => candidate.id === primaryTargetId);
      if (watched) {
        const baseAccuracy = player.role === 'detective' ? 0.97 : 0.9;
        const accuracy = Math.min(0.99, baseAccuracy * getGameplayMod('podSnoopAccuracy'));
        if (Math.random() < accuracy) {
          const watchedPlan = state.nightPlans[watched.id];
          const watchedLocation = watchedPlan ? (getLocationById(watchedPlan.location)?.name || 'their spot') : 'their room';
          const isAttacker = attackers.some(a => a.id === watched.id);
          // The killer physically went out regardless of how the attack ended
          // (killed / blocked / victim escaped) — the watcher sees the movement.
          if (isAttacker && targetId && defense.outcome === 'blocked') {
            intel.tracked = makeIntelItem(`${watched.name} left in the dark, struggled with a door somewhere near ${targetPlayer?.name}'s room, and returned in a hurry.`, INTEL_RELIABILITY.confirmed);
          } else if (isAttacker && targetId) {
            intel.tracked = makeIntelItem(`${watched.name} slipped out mid-night toward ${targetPlayer?.name}'s area — and came back moving quietly.`, INTEL_RELIABILITY.confirmed);
          } else if (watched.id === targetId) {
            intel.tracked = makeIntelItem(
              defense.outcome === 'escaped'
                ? `${watched.name} was attacked in the night — you watched them bolt through their exit route.`
                : `${watched.name}'s room was entered during the night by someone else.`,
              INTEL_RELIABILITY.confirmed
            );
          } else if (watched.role === 'mafia') {
            intel.tracked = makeIntelItem(`${watched.name} drifted along the back routes at odd hours instead of staying put.`, INTEL_RELIABILITY.confirmed);
          } else {
            intel.tracked = makeIntelItem(`${watched.name} stayed at ${watchedLocation} all night. Their story should check out.`, INTEL_RELIABILITY.confirmed);
          }
        } else {
          intel.tracked = makeIntelItem(`You lost sight of ${watched.name} for long stretches; nothing reliable.`, INTEL_RELIABILITY.uncertain);
        }
      }
    } else {
      // Route snooping: pays out if anyone you tracked was the victim.
      const trackedTargets = state.snoopAssignments[player.id] || [];
      if (targetId && trackedTargets.includes(targetId)) {
        if (Math.random() < effectiveIntel) {
          intel.heard = makeIntelItem(`Your snoop route passed close to ${targetPlayer?.name}'s room.`, INTEL_RELIABILITY.confirmed);
          if (attackers.length > 0) {
            const attacker = pickAttacker();
            if (player.role === 'detective') {
              const name = reportNameWithConfidence(attacker, INTEL_RELIABILITY.likely, alivePlayers, [player.id, targetId]);
              intel.saw = makeIntelItem(`${name} was moving near ${targetPlayer?.name}'s room in the dark.`, INTEL_RELIABILITY.likely);
            } else {
              const name = reportNameWithConfidence(attacker, INTEL_RELIABILITY.uncertain, alivePlayers, [player.id, targetId]);
              intel.saw = makeIntelItem(`You half-saw someone near ${targetPlayer?.name}'s room — possibly ${name}, but you can't be sure.`, INTEL_RELIABILITY.uncertain);
            }
          }
        } else {
          intel.heard = makeIntelItem(`You tracked ${targetPlayer?.name}'s room but found no clear proof.`, INTEL_RELIABILITY.uncertain);
        }
      }
    }

    // Channel 3 — watchful players can catch attacker MOVEMENT even away from
    // the kill itself (killers cross the map; alert people notice).
    if (!intel.saw && attackHappensOrBlocked(defense, targetId) && attackers.length > 0) {
      const watchful = awarenessChoice.id === 'active_watch'
        || plan.action?.kind === 'linger'
        || plan.action?.id === 'porch_watch';
      if (watchful) {
        const sawMovement = attackers.some(attacker => {
          const attackerPlan = state.nightPlans[attacker.id];
          const attackerNode = attackerPlan ? resolveNodeBaseId(getPlanNodeId(attackerPlan, attacker)) : null;
          const nearRouteStart = attackerNode && getGraphDistance(playerNode, attackerNode) <= 1;
          const nearRouteEnd = targetNode && getGraphDistance(playerNode, targetNode) <= 1;
          return nearRouteStart || nearRouteEnd;
        });
        const movementChance = applyWitnessMods(clamp01(0.3 + awarenessBoost + (player.role === 'detective' ? 0.15 : 0)));
        if (sawMovement && Math.random() < movementChance) {
          const attacker = pickAttacker();
          const name = reportNameWithConfidence(attacker, INTEL_RELIABILITY.likely, alivePlayers, [player.id, targetId]);
          intel.saw = makeIntelItem(`Late in the night you noticed ${name} crossing toward ${targetPlayer ? `${targetPlayer.name}'s area` : 'the private rooms'}.`, INTEL_RELIABILITY.likely);
        }
      }
    }

    // Ground truth: who shared your area (always reliable).
    const othersNearby = alivePlayers.filter(candidate => {
      if (candidate.id === player.id) return false;
      const candidatePlan = state.nightPlans[candidate.id];
      if (!candidatePlan) return false;
      const candidateNode = resolveNodeBaseId(getPlanNodeId(candidatePlan, candidate));
      return getGraphDistance(playerNode, candidateNode) <= 1;
    });
    intel.nearby = othersNearby.length > 0
      ? makeIntelItem(`Nearby: ${othersNearby.map(candidate => candidate.name).join(', ')}`, INTEL_RELIABILITY.confirmed)
      : makeIntelItem('Nearby: no one in your immediate area.', INTEL_RELIABILITY.confirmed);
    intel.awareness = makeIntelItem(`Night stance: ${describeNightStance(player)}.`, 1);

    // Personal outcome lines for the victim's own night.
    if (player.id === targetId) {
      if (defense.outcome === 'blocked') {
        intel.heard = makeIntelItem('Someone tried to force YOUR lock in the night. The bolt held — but they were at your door.', INTEL_RELIABILITY.confirmed);
      } else if (defense.outcome === 'escaped') {
        const attacker = pickAttacker();
        const name = reportNameWithConfidence(attacker, INTEL_RELIABILITY.uncertain, alivePlayers, [player.id]);
        intel.heard = makeIntelItem(`Someone slipped into your room — you bolted through your exit route. In the scramble you think you saw ${name}.`, INTEL_RELIABILITY.uncertain);
      }
    } else if (plan.action?.id === 'sleep_lock' && !intel.saw && !intel.tracked) {
      intel.heard = makeIntelItem('You slept behind a locked door; little reached you.', INTEL_RELIABILITY.confirmed);
    }

    newIntel[player.id] = intel;
  });

  // Mafia false leads: a planted decoy reaches players near the planting site,
  // honestly labeled uncertain (it may well be wrong — that is the point).
  alivePlayers
    .filter(player => player.role === 'mafia' && state.nightPlans[player.id]?.action?.id === 'false_lead')
    .forEach(planter => {
      const planterNode = resolveNodeBaseId(getPlanNodeId(state.nightPlans[planter.id], planter));
      const innocents = alivePlayers.filter(candidate => candidate.role !== 'mafia' && candidate.id !== targetId);
      const framed = innocents[Math.floor(Math.random() * innocents.length)];
      if (!framed || !planterNode) return;
      alivePlayers.forEach(receiver => {
        if (receiver.role === 'mafia' || !newIntel[receiver.id]) return;
        const receiverPlan = state.nightPlans[receiver.id];
        const receiverNode = receiverPlan ? resolveNodeBaseId(getPlanNodeId(receiverPlan, receiver)) : null;
        if (!receiverNode || getGraphDistance(receiverNode, planterNode) > 1) return;
        if (newIntel[receiver.id].saw) return;
        newIntel[receiver.id].saw = makeIntelItem(`Scuffed tracks near ${getLocationById(state.nightPlans[planter.id].location)?.name || 'your area'} suggest ${framed.name} passed through late.`, INTEL_RELIABILITY.uncertain);
      });
    });

  getAlivePlayers()
    .filter(player => player.role !== 'mafia')
    .forEach(player => {
      if (!newIntel[player.id]) newIntel[player.id] = getIntelFallback(player);
    });

  state.intelResults = newIntel;
  state.narrative = buildNarration('morning', { attackHappened: attackHappens, saved: false });
  addNarrationLog(state.narrative, 'announcement');
  state.showRole = false;
  state.selectedSave = null;
  state.selectedAwareness = null;
  // The doctor already chose who to protect during their night stance turn, so
  // the morning resolves immediately — no doctor-only phase to leak identity.
  withBotDelay(() => {
    if (state.gamePhase !== 'night') return;
    processMorning();
  }, Math.max(700, state.botDelayMs));
}

function attackHappensOrBlocked(defense, targetId) {
  return Boolean(targetId) && (defense.outcome === 'proceed' || defense.outcome === 'blocked');
}

// Human-readable description of what this player chose to do at night.
function describeNightStance(player) {
  if (player.role === 'detective') {
    const stance = state.detectiveStances?.[player.id];
    if (stance) {
      const option = DETECTIVE_STANCE_OPTIONS.find(item => item.id === stance.id);
      return option ? option.name.replace(/^[^ ]+ /, '') : 'Sweep the routes';
    }
  }
  if (player.role === 'doctor' && state.doctorSave) {
    return 'Kept watch, ready to help';
  }
  return getNightAwarenessChoice(player.id).name;
}

// -----------------------------------------------------------------------------
// MORNING PHASE PROCESSING
// -----------------------------------------------------------------------------

function processMorning() {
  const allPlayers = getAllPlayers();
  const target = allPlayers.find(p => p.id === state.nightTarget);
  const method = getKillMethodById(state.nightAttackMethod || KILL_METHODS[0].id);
  const defense = state.nightDefenseOutcome || { outcome: 'proceed', victimLocked: false };
  let deathMessage = '';
  let savedByDoctor = false;

  const attackCount = target ? (state.nightAttackCounts[target.id] || 1) : 0;

  if (target && defense.outcome === 'blocked') {
    // The locked door held: the break-in failed outright.
    deathMessage = 'A door was forced in the night — but the bolt held.\n\nNo one died. Someone in this room walked away from a failed break-in.';
    state.finalDeath = { type: 'night', victim: null, role: null, saved: false, method: null };
    clearDeathAnimation();
  } else if (target && defense.outcome === 'escaped') {
    // The unlocked exit route paid off: the victim fled the attack.
    deathMessage = `${target.name} was attacked in the night — and escaped through their exit route.\n\nAttack method: ${method.name}. They are shaken, but alive.`;
    state.finalDeath = {
      type: 'night',
      victim: target.name,
      role: getRoleDisplayName(target.role),
      saved: true,
      method: method.name
    };
    clearDeathAnimation();
  } else {
    const doctorTriedSave = Boolean(target && state.doctorSave && state.doctorSave === target.id);
    let saveChance = 0;
    if (doctorTriedSave) {
      saveChance = getDoctorSaveChance(method, attackCount, { victimLocked: Boolean(defense.victimLocked) });
      savedByDoctor = Math.random() < saveChance;
    }

    if (target && !savedByDoctor) {
      if (target.isBot) {
        state.bots = state.bots.map(b => b.id === target.id ? { ...b, alive: false } : b);
      } else {
        state.players = state.players.map(p => p.id === target.id ? { ...p, alive: false } : p);
      }
      SoundEffects.playDeath();
      const trappedLine = defense.victimLocked ? '\nTheir own locked door left them cornered.' : '';
      deathMessage = `${target.name} was found dead.\n\nCause of death: ${method.deathLabel} (${method.name}).\nDisturbance level: ${Math.round(getAdjustedDisturbance(method) * 100)}%.${trappedLine}\n\nThey were the ${getRoleDisplayName(target.role)}.`;
      state.finalDeath = {
        type: 'night',
        victim: target.name,
        role: getRoleDisplayName(target.role),
        saved: false,
        method: method.name
      };
      setDeathAnimation(target.name, getRoleDisplayName(target.role), 'night');
    } else if (target && savedByDoctor) {
      const methodLine = `Attack method: ${method.name}.`;
      deathMessage = `${target.name} was attacked but survived.\n\n${methodLine}\nSomeone watched over them tonight — stabilization chance was ${Math.round(saveChance * 100)}%.`;
      state.finalDeath = {
        type: 'night',
        victim: target.name,
        role: getRoleDisplayName(target.role),
        saved: true,
        method: method.name
      };
      clearDeathAnimation();
    } else {
      deathMessage = 'The night passed peacefully.';
      state.finalDeath = { type: 'night', victim: null, role: null, saved: false, method: null };
      clearDeathAnimation();
    }
  }
  addNarrationLog(deathMessage, 'announcement');

  // Public summary for narration (no secret info: only what morning revealed).
  if (target && defense.outcome === 'blocked') {
    state.lastNightSummary = { type: 'blocked' };
  } else if (target && defense.outcome === 'escaped') {
    state.lastNightSummary = { type: 'escaped', victim: target.name };
  } else if (target && savedByDoctor) {
    state.lastNightSummary = { type: 'saved', victim: target.name, method: method.name };
  } else if (target) {
    state.lastNightSummary = { type: 'death', victim: target.name, role: getRoleDisplayName(target.role), method: method.deathLabel };
  } else {
    state.lastNightSummary = { type: 'quiet' };
  }

  state.nightTarget = null;
  state.nightAttackMethod = null;
  state.mafiaVotes = {};
  state.mafiaKillMethods = {};
  state.nightAttackCounts = {};
  state.doctorSave = null;
  state.nightDefenseOutcome = null;
  state.detectiveStances = {};
  state.snoopPrimaryTargets = {};
  state.pendingWin = evaluateWinCondition();
  state.announcement = deathMessage;
  state.gamePhase = 'announcement';
  primeNarratorTurn('announcement');
  state.narrative = buildNarration('morning', {
    attackHappened: Boolean(target),
    saved: Boolean(target && savedByDoctor)
  });
  queueNarratorChatPrompt('announcement');
  render();
}

function afterAnnouncement() {
  state.announcement = null;
  clearDeathAnimation();
  if (state.pendingWin) {
    finalizeGameOver();
    return;
  }
  state.gamePhase = 'discussion';
  const firstHuman = findFirstAliveHumanIndex();
  state.currentPlayerIndex = firstHuman !== -1 ? firstHuman : 0;
  state.showRole = false;
  state.chatDraft = '';
  state.chatSenderId = getAllPlayers()[state.currentPlayerIndex]?.id || null;
  state.discussionUnlockAt = isSoloMode() ? 0 : Date.now() + 5000;
  primeNarratorTurn('discussion');
  state.narrative = buildNarration('discussion');
  addNarrationLog(state.narrative, 'discussion');
  queueNarratorChatPrompt('discussion');
  queueBotDiscussion(true);

  render();
}

// -----------------------------------------------------------------------------
// VOTE PROCESSING
// -----------------------------------------------------------------------------

function processVote() {
  ensureBotVotes();
  const allPlayers = getAllPlayers();
  const voteCounts = {};

  Object.values(state.votes).forEach(targetId => {
    if (targetId) voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });

  const sorted = Object.entries(voteCounts).sort((x, y) => y[1] - x[1]);
  const tallyLines = sorted
    .map(([targetId, count]) => {
      const player = allPlayers.find(candidate => candidate.id === targetId);
      if (!player) return null;
      return `${player.name}: ${count}`;
    })
    .filter(Boolean);
  let voteMessage = '';

  if (sorted.length > 0 && (sorted.length === 1 || sorted[0][1] > (sorted[1]?.[1] || 0))) {
    const eliminated = allPlayers.find(p => p.id === sorted[0][0]);
    if (eliminated) {
      if (eliminated.isBot) {
        state.bots = state.bots.map(b => b.id === eliminated.id ? { ...b, alive: false } : b);
      } else {
        state.players = state.players.map(p => p.id === eliminated.id ? { ...p, alive: false } : p);
      }
      voteMessage = `Vote decided.\n\n${eliminated.name} eliminated.\n\nThey were the ${getRoleDisplayName(eliminated.role)}.`;
      state.finalDeath = {
        type: 'vote',
        victim: eliminated.name,
        role: getRoleDisplayName(eliminated.role),
        saved: false
      };
      setDeathAnimation(eliminated.name, getRoleDisplayName(eliminated.role), 'vote');
    }
  } else {
    voteMessage = 'Vote tied. No one eliminated.';
    state.finalDeath = { type: 'vote', victim: null, role: null, saved: false };
    clearDeathAnimation();
  }
  if (tallyLines.length > 0) {
    voteMessage += `\n\nVote tally:\n${tallyLines.join('\n')}`;
  }
  addNarrationLog(voteMessage, 'vote_announcement');
  state.lastVoteSummary = (() => {
    const eliminatedId = (sorted.length > 0 && (sorted.length === 1 || sorted[0][1] > (sorted[1]?.[1] || 0))) ? sorted[0][0] : null;
    if (!eliminatedId) return { type: 'tie' };
    const eliminated = allPlayers.find(p => p.id === eliminatedId);
    return eliminated ? { type: 'elim', victim: eliminated.name, role: getRoleDisplayName(eliminated.role) } : { type: 'tie' };
  })();

  state.votes = {};
  state.nightPlans = {};
  state.snoopAssignments = {};
  state.snoopPrimaryTargets = {};
  state.detectiveStances = {};
  state.nightDefenseOutcome = null;
  state.snoopersByTarget = {};
  state.mafiaSnooperIntel = {};
  state.mafiaBriefing = {};
  state.mafiaVotes = {};
  state.mafiaKillMethods = {};
  state.nightAttackCounts = {};
  state.nightAttackMethod = null;
  state.doctorSave = null;
  state.intelResults = {};
  state.pendingWin = evaluateWinCondition();
  state.announcement = voteMessage;
  state.gamePhase = 'vote_announcement';
  primeNarratorTurn('vote_announcement');
  queueNarratorChatPrompt('vote_announcement');
  render();
}

function afterVoteAnnouncement() {
  state.announcement = null;
  clearDeathAnimation();
  clearBotChatTimers();
  if (state.pendingWin) {
    finalizeGameOver();
    return;
  }
  state.gamePhase = 'day';
  state.dayNumber++;
  state.currentPlayerIndex = 0;
  state.showRole = false;
  state.selectedLocation = null;
  state.selectedAction = null;
  state.selectedActionTarget = null;
  state.selectedTarget = null;
  state.selectedKillMethod = null;
  state.selectedAwareness = null;
  state.chatSenderId = null;
  state.chatDraft = '';
  state.discussionUnlockAt = 0;
  primeNarratorTurn('day');
  queueNarratorChatPrompt('day');
  state.narrative = buildNarration('day');

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

function evaluateWinCondition() {
  const alivePlayers = getAlivePlayers();
  const mafiaAlive = alivePlayers.filter(p => p.role === 'mafia').length;
  const townAlive = alivePlayers.filter(p => p.role !== 'mafia').length;

  // The game is decided ONLY by faction outcome. A human player dying (e.g. the
  // solo player) does not end the game — they spectate while the remaining
  // players (bots) play it out to a real Town or Mafia win. This avoids the
  // illogical "Mafia wins" when a townsperson is simply killed.
  if (mafiaAlive === 0) {
    return {
      winner: 'town',
      reason: 'Town removed every Mafia member.'
    };
  }

  if (mafiaAlive > townAlive) {
    return {
      winner: 'mafia',
      reason: 'Mafia now outnumber Town.'
    };
  }

  return null;
}

function finalizeGameOver() {
  if (!state.pendingWin) return;
  state.winner = state.pendingWin.winner;
  state.winReason = state.pendingWin.reason;
  state.pendingWin = null;
  state.gamePhase = 'gameover';
  if (isRealtimeMode()) clearRoomCache(state.gameCode);
  clearNarratorTurn();
  addNarrationLog(`Final outcome: ${state.winReason}`, 'gameover');
  if (state.winner === 'town') SoundEffects.playVictory();
  else SoundEffects.playDefeat();
  render();
}

function checkWin() {
  state.pendingWin = evaluateWinCondition();
  if (!state.pendingWin) return false;
  finalizeGameOver();
  return true;
}

function hasDoctorAlive() {
  return getAlivePlayers().some(player => player.role === 'doctor');
}

function getDoctorSaveChance(method, attackCount = 1, { victimLocked = false } = {}) {
  const attackerPenalty = Math.max(0, attackCount - 1) * 0.23;
  const methodPenalty = getAdjustedCureDifficulty(method) * 0.3;
  // A locked room that was breached leaves the victim cornered: harder to reach
  // and stabilize in time (the flip side of the lock's break-in protection).
  const trappedPenalty = victimLocked ? 0.08 : 0;
  return clamp01((0.74 - methodPenalty - attackerPenalty - trappedPenalty) * getGameplayMod('save'));
}

function getNightAwarenessById(id) {
  return NIGHT_AWARENESS_OPTIONS.find(option => option.id === id) || NIGHT_AWARENESS_OPTIONS[1];
}

function confirmNightAwarenessForCurrent() {
  const current = getCurrentPlayer();
  if (!current || current.role === 'mafia') return;
  const selected = getNightAwarenessById(state.selectedAwareness);
  state.nightAwareness[current.id] = selected.id;
  state.selectedAwareness = null;
}

function advanceNightActor() {
  const allPlayers = getAllPlayers();
  const nightActors = getNightActors();
  const currentActor = getCurrentPlayer();
  const currentActorIndex = nightActors.findIndex(actor => actor.id === currentActor?.id);
  const nextActor = currentActorIndex !== -1 ? nightActors[currentActorIndex + 1] : null;
  if (nextActor) {
    const nextIndex = allPlayers.findIndex(player => player.id === nextActor.id);
    state.currentPlayerIndex = nextIndex !== -1 ? nextIndex : state.currentPlayerIndex;
    state.showRole = false;
    render();
    return;
  }
  processNight();
  render();
}

// The doctor's protect choice is made during their NIGHT stance turn (so no
// separate doctor-only phase can leak who the doctor is).
function confirmDoctorProtectForCurrent() {
  const current = getCurrentPlayer();
  if (!current || current.role !== 'doctor') return;
  state.doctorSave = state.selectedSave || null;
  // Doctors keep their head down while standing ready.
  state.nightAwareness[current.id] = 'low_profile';
  state.selectedSave = null;
}

function confirmDetectiveStanceForCurrent() {
  const current = getCurrentPlayer();
  if (!current || current.role !== 'detective') return;
  const option = DETECTIVE_STANCE_OPTIONS.find(item => item.id === state.selectedStance) || DETECTIVE_STANCE_OPTIONS[1];
  const target = option.requiresTarget ? (state.selectedStanceTarget || null) : null;
  state.detectiveStances[current.id] = { id: option.id, target };
  // Stances map onto the shared awareness model so exposure math stays unified.
  state.nightAwareness[current.id] = option.id === 'shadow_target'
    ? 'active_watch'
    : option.id === 'sweep_routes' ? 'listen_posts' : 'low_profile';
  state.selectedStance = null;
  state.selectedStanceTarget = null;
}

function normalizeCodeFromInput(raw) {
  const cleaned = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  if (!cleaned) {
    state.gameCode = '';
    state.joinCode = '';
    return;
  }
  state.gameCode = cleaned;
  state.joinCode = cleaned;
}

function applyRealtimePanelMode(mode) {
  const normalizedMode = isHostOnlyPage()
    ? 'host'
    : isJoinOnlyPage()
      ? 'join'
      : (mode === 'join' ? 'join' : 'host');
  state.realtimePanelMode = normalizedMode;
  state.network.isHost = state.realtimePanelMode !== 'join';
  if (state.realtimePanelMode === 'host' && !state.joinCode) {
    state.joinCode = state.gameCode;
  }
  if (state.realtimePanelMode === 'join') {
    state.showBigRoomCode = false;
  }
  if (!state.network.connected) {
    state.network.statusDetail = getIdleRealtimeStatusDetail(state.network.isHost);
  }
}

function applyJoinCodeInput(value) {
  if (state.network.connected && !state.network.isHost) return;
  normalizeCodeFromInput(value);
}

async function hostRealtimeRoom() {
  applyRealtimePanelMode('host');
  state.multiplayerMode = 'realtime';
  state.network.isHost = true;
  if (realtime.socket || state.network.status === 'connecting') disconnectRealtimeSession({ keepMode: true });
  state.network.status = 'connecting';
  state.network.statusDetail = 'Preparing room service...';
  render();
  // On a public static host (e.g. GitHub Pages) there is no local backend to
  // start; connect straight to the configured online relay.
  if (isPublicStaticHost()) {
    if (!getConfiguredRelayUrl()) {
      state.network.status = 'error';
      state.network.statusDetail = 'Online multiplayer is not set up for this site yet (no relay configured). Solo and single-device pass-and-play still work.';
      render();
      return;
    }
    state.network.statusDetail = 'Connecting to online room service...';
    render();
    await warmUpConfiguredRelay();
    connectRealtimeSession();
    return;
  }
  const backendReady = await ensureBackendForHostClick();
  if (!backendReady) {
    state.network.status = 'error';
    state.network.statusDetail = getRealtimeConnectionFailureMessage(true);
    render();
    return;
  }
  connectRealtimeSession();
}

function joinRealtimeRoom() {
  applyRealtimePanelMode('join');
  state.multiplayerMode = 'realtime';
  state.network.isHost = false;
  const joinCode = sanitizeRoomCode(state.joinCode || state.gameCode, '');
  if (!joinCode) {
    state.network.status = 'error';
    state.network.statusDetail = 'Enter a room code, then press Join Game.';
    return;
  }
  if (isPublicStaticHost() && !getConfiguredRelayUrl()) {
    state.network.status = 'error';
    state.network.statusDetail = 'Online multiplayer is not set up for this site yet (no relay configured). Solo and single-device pass-and-play still work.';
    render();
    return;
  }
  state.gameCode = joinCode;
  state.joinCode = joinCode;
  if (realtime.socket || state.network.status === 'connecting') disconnectRealtimeSession({ keepMode: true });
  if (isPublicStaticHost() && getConfiguredRelayUrl()) {
    state.network.status = 'connecting';
    render();
    warmUpConfiguredRelay().then(() => connectRealtimeSession());
    return;
  }
  connectRealtimeSession();
}

function applyRealtimeDeviceName(value) {
  const next = String(value || '').trim();
  if (!next) return;
  state.network.deviceName = next.slice(0, 32);
  try {
    localStorage.setItem(DEVICE_NAME_STORAGE_KEY, state.network.deviceName);
  } catch (error) {
    // ignore
  }
}

function setNightAwareness(value) {
  const option = getNightAwarenessById(value);
  state.selectedAwareness = option.id;
  render();
}

function renamePlayer(id, value) {
  const nextName = String(value || '').trim();
  if (!nextName) return;
  if (state.players.some(player => player.id !== id && player.name.toLowerCase() === nextName.toLowerCase())) {
    state.nameError = 'Name already taken';
    render();
    return;
  }
  state.players = state.players.map(player => player.id === id ? { ...player, name: nextName } : player);
  state.nameError = '';
  render();
}

function toggleMap() {
  const nextVisible = !state.showMap;
  state.showMap = nextVisible;
  if (nextVisible) {
    try {
      localStorage.setItem('mafia_map_hint_seen', '1');
    } catch (error) {
      // ignore
    }
  }
  if (!nextVisible) {
    state.selectedMapFloor = null;
  } else {
    const floors = state.selectedStory?.floorplan?.floors;
    if (Array.isArray(floors) && floors.length > 0) {
      const hasExisting = floors.some(floor => floor.id === state.selectedMapFloor);
      if (!hasExisting) state.selectedMapFloor = floors[0].id;
    } else {
      state.selectedMapFloor = null;
    }
  }
  render();
}

function closeMap() {
  state.showMap = false;
  state.selectedMapFloor = null;
  render();
}

function setMapFloor(floorId) {
  const floors = state.selectedStory?.floorplan?.floors || [];
  if (!floors.some(floor => floor.id === floorId)) return;
  state.selectedMapFloor = floorId;
  render();
}

function showBigRoomCode() {
  if (!state.gameCode) return;
  state.showBigRoomCode = true;
  render();
}

function hideBigRoomCode() {
  state.showBigRoomCode = false;
  render();
}

function getDeviceGroupedPlayers() {
  const devices = state.network.devices || [];
  const order = state.network.deviceOrder || [];
  const byDevice = {};
  state.players.forEach(player => {
    const key = player.deviceId || state.network.deviceId;
    if (!byDevice[key]) byDevice[key] = [];
    byDevice[key].push(player);
  });
  const ordered = order.length > 0 ? order : devices.map(device => device.deviceId);
  const mapped = ordered.map(deviceId => {
    const device = devices.find(item => item.deviceId === deviceId) || {
      deviceId,
      deviceName: deviceId === state.network.deviceId ? state.network.deviceName : getDeviceNameById(deviceId),
      isHost: deviceId === state.network.hostDeviceId
    };
    return {
      ...device,
      players: byDevice[deviceId] || []
    };
  });
  Object.entries(byDevice).forEach(([deviceId, players]) => {
    if (mapped.some(item => item.deviceId === deviceId)) return;
    mapped.push({
      deviceId,
      deviceName: getDeviceNameById(deviceId),
      isHost: deviceId === state.network.hostDeviceId,
      players
    });
  });
  return mapped;
}

function reorderPlayerByDrop(sourcePlayerId, targetPlayerId) {
  if (!sourcePlayerId || !targetPlayerId || sourcePlayerId === targetPlayerId) return;
  const source = state.players.find(player => player.id === sourcePlayerId);
  const target = state.players.find(player => player.id === targetPlayerId);
  if (!source || !target) return;
  if (isRealtimeMode() && (source.deviceId || '') !== (target.deviceId || '')) return;
  if (isRealtimeMode()) {
    movePlayerWithinDevice(sourcePlayerId, targetPlayerId);
  } else {
    const targetIndex = state.players.findIndex(player => player.id === targetPlayerId);
    movePlayerToIndex(sourcePlayerId, targetIndex);
  }
}

function reorderDeviceByDrop(sourceDeviceId, targetDeviceId) {
  if (!sourceDeviceId || !targetDeviceId || sourceDeviceId === targetDeviceId) return;
  moveDeviceToIndex(sourceDeviceId, targetDeviceId);
}

function initializeDeviceNameFromContext() {
  try {
    const stored = localStorage.getItem(DEVICE_NAME_STORAGE_KEY);
    if (stored && stored.trim()) {
      state.network.deviceName = stored.trim().slice(0, 32);
    }
  } catch (error) {
    // localStorage unavailable
  }
}

initializeDeviceNameFromContext();
tryRestoreCachedRoomFromParams();
refreshShareHints();
if (!state.network.deviceName.trim()) state.network.deviceName = 'Device 1';
state.network.deviceName = state.network.deviceName.slice(0, 32);
if (IS_SOLO_PAGE) {
  state.screen = 'solo_lobby';
  state.multiplayerMode = 'passplay';
  state.autoJoinPending = false;
  state.soloResumeAvailable = Boolean(loadSoloStateCache());
} else if (IS_JOIN_PAGE) {
  if (INITIAL_JOIN_CODE) normalizeCodeFromInput(INITIAL_JOIN_CODE);
  state.screen = 'join_entry';
  state.multiplayerMode = 'realtime';
  state.realtimePanelMode = 'join';
  state.network.isHost = false;
  state.autoJoinPending = Boolean(INITIAL_JOIN_CODE);
  if (!INITIAL_JOIN_CODE) {
    state.gameCode = '';
    state.joinCode = '';
  }
} else if (IS_HOST_PAGE || (INITIAL_IS_HOST_ROLE && INITIAL_ROOM_CODE && !INITIAL_IS_JOIN_ROLE)) {
  if (INITIAL_ROOM_CODE) normalizeCodeFromInput(INITIAL_ROOM_CODE);
  state.screen = 'multi_lobby';
  state.multiplayerMode = 'realtime';
  state.realtimePanelMode = 'host';
  state.network.isHost = true;
  state.autoJoinPending = false;
} else if (INITIAL_IS_JOIN_ROLE || INITIAL_JOIN_CODE) {
  if (INITIAL_JOIN_CODE) normalizeCodeFromInput(INITIAL_JOIN_CODE);
  state.screen = 'multi_lobby';
  state.multiplayerMode = 'realtime';
  state.realtimePanelMode = 'join';
  state.network.isHost = false;
  state.autoJoinPending = Boolean(INITIAL_JOIN_CODE);
} else if (SCREEN_PARAM === 'multi') {
  state.screen = 'multi_lobby';
  state.multiplayerMode = 'passplay';
} else if (SCREEN_PARAM === 'multi_entry') {
  state.screen = 'multi_entry';
}
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    try {
      localStorage.setItem(DEVICE_NAME_STORAGE_KEY, state.network.deviceName || 'Device 1');
      localStorage.setItem(DEVICE_ID_STORAGE_KEY, state.network.deviceId || getStoredDeviceId());
      persistRoomStateCache();
    } catch (error) {
      // ignore
    }
  });
}

// -----------------------------------------------------------------------------
// RENDERING (imported from render.js)
// -----------------------------------------------------------------------------

// Main render function is defined in render.js

// -----------------------------------------------------------------------------
// EVENT HANDLERS (Global)
// -----------------------------------------------------------------------------

window.goToHomePage = () => {
  const homeUrl = getPageUrl('index.html') || 'index.html';
  window.location.href = homeUrl;
};

window.goToMultiEntryPage = () => {
  const base = getPageUrl('index.html') || 'index.html';
  try {
    const target = new URL(base, window.location.href);
    target.searchParams.set('screen', 'multi_entry');
    window.location.href = target.toString();
  } catch (error) {
    window.location.href = 'index.html?screen=multi_entry';
  }
};

window.goToHostPage = () => {
  window.location.href = getPageUrl('host.html');
};

window.goToJoinPage = () => {
  window.location.href = getPageUrl('join.html');
};

window.goToSetup = () => {
  state.gameEpoch = (state.gameEpoch || 0) + 1;
  clearAutoAdvance();
  clearBotChatTimers();
  clearDeathAnimation();
  disconnectRealtimeSession({ keepMode: Boolean(state.joinCode) });
  if (!state.joinCode) state.multiplayerMode = 'passplay';
  applyEntryScreenDefaults();
  state.bots = [];
  state.players = [];
  state.chatMessages = [];
  state.chatDraft = '';
  state.chatSenderId = null;
  state.selectedLocation = null;
  state.selectedAction = null;
  state.selectedActionTarget = null;
  state.selectedTarget = null;
  state.selectedKillMethod = null;
  state.selectedAwareness = null;
  state.selectedSave = null;
  state.selectedVote = null;
  state.discussionUnlockAt = 0;
  state.showMap = false;
  state.selectedMapFloor = null;
  state.showBigRoomCode = false;
  state.lastNarratorPromptKey = null;
  state.pendingNarratorPhase = null;
  state.narrationLog = [];
  state.lastBotChatDay = null;
  state.pendingWin = null;
  render();
};

window.goToSoloLobby = () => {
  if (isHostOnlyPage()) {
    window.goToHomePage();
    return;
  }
  if (state.entryPage === 'index') {
    window.location.href = getPageUrl('solo.html');
    return;
  }
  disconnectRealtimeSession({ keepMode: false });
  state.multiplayerMode = 'passplay';
  state.showBigRoomCode = false;
  state.screen = 'solo_lobby';
  updateRoleConfig();
  render();
};

window.goToMultiLobby = () => {
  refreshShareHints();
  if (state.entryPage === 'index') {
    state.screen = 'multi_entry';
    state.showBigRoomCode = false;
    render();
    return;
  }
  state.screen = 'multi_lobby';
  if (isJoinOnlyPage()) {
    state.multiplayerMode = 'realtime';
    state.realtimePanelMode = 'join';
    state.network.isHost = false;
    if (state.joinCode) {
      state.gameCode = sanitizeRoomCode(state.joinCode, state.gameCode || '');
    }
  } else if (isHostOnlyPage()) {
    state.multiplayerMode = 'realtime';
    state.realtimePanelMode = 'host';
    state.network.isHost = true;
    state.joinCode = state.joinCode || state.gameCode;
  } else if (state.autoJoinPending && state.joinCode) {
    state.multiplayerMode = 'realtime';
    state.realtimePanelMode = 'join';
    state.network.isHost = false;
    state.gameCode = sanitizeRoomCode(state.joinCode, state.gameCode);
  } else {
    state.multiplayerMode = 'realtime';
    state.realtimePanelMode = 'host';
    state.network.isHost = true;
    state.joinCode = state.joinCode || state.gameCode;
  }
  state.showBigRoomCode = false;
  maybeAutoAssignDeviceName(state.network.devices);
  updateRoleConfig();
  if (isRealtimeMode() && !state.network.connected && state.realtimePanelMode === 'join' && state.joinCode && state.autoJoinPending) {
    connectRealtimeSession();
  }
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
  const requested = mode === 'human' ? 'human' : 'auto';
  state.settings.narratorMode = (requested === 'human' && isSoloOnlyPage()) ? 'auto' : requested;
  state.lastNarratorPromptKey = null;
  if (state.settings.narratorMode === 'human') {
    primeNarratorTurn(state.gamePhase);
  } else {
    clearNarratorTurn();
  }
  queueNarratorChatPrompt(state.gamePhase);
  render();
};

window.setNarratorTone = (tone) => {
  const allowed = new Set(['grim', 'cinematic', 'neutral']);
  state.settings.narratorTone = allowed.has(tone) ? tone : 'grim';
  state.narrative = buildNarration('intro');
  render();
};

window.setEnvironmentProfile = (profileId) => {
  const selected = ENVIRONMENT_PROFILES.find(profile => profile.id === profileId);
  if (!selected) return;
  state.settings.environmentProfile = selected.id;
  render();
};

window.setBotDelay = (ms) => {
  const value = Number(ms);
  if (Number.isNaN(value)) return;
  state.botDelayMs = Math.max(700, Math.min(2600, Math.round(value)));
  render();
};

window.setNetworkingMode = (mode) => {
  const normalized = String(mode || '').trim().toLowerCase();
  if (normalized === 'lan') {
    if (!isLanShareModeAvailable()) return;
    state.settings.networkShareMode = 'lan';
  } else if (normalized === 'custom') {
    state.settings.networkShareMode = 'custom';
  } else {
    state.settings.networkShareMode = 'origin';
  }
  render();
};

window.setCustomShareBaseUrl = (value) => {
  state.settings.customShareBaseUrl = String(value || '').trim();
};

window.setCustomRelayUrl = (value) => {
  state.settings.customRelayUrl = String(value || '').trim();
};

window.setMultiplayerMode = (mode) => {
  if (isHostOnlyPage() || isJoinOnlyPage()) {
    state.multiplayerMode = 'realtime';
    applyRealtimePanelMode(isHostOnlyPage() ? 'host' : 'join');
    render();
    return;
  }
  const nextMode = mode === 'realtime' ? 'realtime' : 'passplay';
  state.multiplayerMode = nextMode;
  if (nextMode === 'realtime') {
    if (isHostOnlyPage()) {
      applyRealtimePanelMode('host');
      state.network.isHost = true;
      state.joinCode = state.joinCode || state.gameCode;
    } else if (!state.realtimePanelMode) {
      state.realtimePanelMode = 'host';
      state.network.isHost = true;
    } else {
      state.network.isHost = state.realtimePanelMode !== 'join';
    }
  } else {
    state.showBigRoomCode = false;
    disconnectRealtimeSession({ keepMode: true });
  }
  render();
};

window.setRealtimeDeviceName = (value) => {
  applyRealtimeDeviceName(value);
};

window.commitRealtimeDeviceName = () => {
  if (isRealtimeMode() && state.network.connected) {
    sendRealtimeMessage({
      type: 'join_room',
      code: state.gameCode,
      deviceId: state.network.deviceId,
      deviceName: state.network.deviceName,
      isHost: state.network.isHost
    });
  }
  render();
};

window.setRealtimePanelMode = (mode) => {
  if (isHostOnlyPage() || isJoinOnlyPage()) {
    applyRealtimePanelMode(isHostOnlyPage() ? 'host' : 'join');
    render();
    return;
  }
  applyRealtimePanelMode(mode);
  render();
};

window.setJoinCodeInput = (value) => {
  applyJoinCodeInput(value);
  render();
};

window.connectAsHost = async () => {
  await hostRealtimeRoom();
  render();
};

window.connectAsJoiner = () => {
  joinRealtimeRoom();
  render();
};

window.disconnectRealtime = () => {
  disconnectRealtimeSession({ keepMode: true });
  render();
};

window.addBot = addBot;
window.removeBot = removeBot;
window.renameBot = renameBot;
window.removeDevice = removeDevice;
window.removePlayer = removePlayer;
window.renamePlayer = renamePlayer;
window.movePlayer = movePlayer;
window.moveDevice = moveDevice;
window.reorderPlayerByDrop = reorderPlayerByDrop;
window.reorderDeviceByDrop = reorderDeviceByDrop;
window.scheduleAutoAdvance = scheduleAutoAdvance;
window.clearAutoAdvance = clearAutoAdvance;
window.getVisibleTargetsForMafia = getVisibleTargetsForMafia;
window.toggleMap = toggleMap;
window.closeMap = closeMap;
window.setMapFloor = setMapFloor;
window.showBigRoomCode = showBigRoomCode;
window.hideBigRoomCode = hideBigRoomCode;

// --- First-run tutorial (per-device UI state; never synced) ---
const TUTORIAL_STEPS_TOTAL = 5;

function markTutorialDone() {
  try {
    localStorage.setItem('mafia_tutorial_done', '1');
  } catch (error) {
    // ignore
  }
  state.tutorialStep = null;
}

window.tutorialNext = () => {
  if (state.tutorialStep === null) return;
  if (state.tutorialStep >= TUTORIAL_STEPS_TOTAL - 1) {
    markTutorialDone();
  } else {
    state.tutorialStep += 1;
  }
  render();
};

window.tutorialBack = () => {
  if (state.tutorialStep === null) return;
  state.tutorialStep = Math.max(0, state.tutorialStep - 1);
  render();
};

window.tutorialSkip = () => {
  markTutorialDone();
  render();
};

window.replayTutorial = () => {
  state.showInstructions = false;
  state.tutorialStep = 0;
  render();
};

// One-time "check the map" pointer after the tutorial / at game start.
window.toggleChatDrawer = () => {
  state.chatDrawerOpen = !state.chatDrawerOpen;
  if (state.chatDrawerOpen) {
    state.chatSeenCount = state.chatMessages.filter(message => message.day === state.dayNumber).length;
  }
  render();
};

window.dismissMapHint = () => {
  try {
    localStorage.setItem('mafia_map_hint_seen', '1');
  } catch (error) {
    // ignore
  }
  render();
};

window.addPlayerFromInput = (nameOverride = null, deviceIdOverride = null) => {
  const input = document.getElementById('newPlayerInput');
  const candidateName = typeof nameOverride === 'string'
    ? nameOverride
    : (input?.value || '');
  if (!candidateName.trim()) return;

  if (addPlayer(candidateName, deviceIdOverride || state.network.deviceId) && input) {
    input.value = '';
    const ensureFocus = () => {
      const refreshed = document.getElementById('newPlayerInput');
      if (refreshed) refreshed.focus();
    };
    requestAnimationFrame(ensureFocus);
    setTimeout(ensureFocus, 24);
  }
};

window.selectPreset = (id) => {
  if (!canEditLobbySetup()) return;
  state.selectedPreset = ROLE_PRESETS.find(p => p.id === id) || ROLE_PRESETS[0];
  updateRoleConfig();
  render();
};

// Gameplay presets are orthogonal to ratio presets: they change rule math, not
// role counts, so both can be active at once.
window.selectGameplayPreset = (id) => {
  if (!canEditLobbySetup()) return;
  state.selectedGameplayPreset = (GAMEPLAY_PRESETS.find(p => p.id === id) || GAMEPLAY_PRESETS[0]).id;
  render();
};

window.selectStory = (id) => {
  if (!canEditLobbySetup()) return;
  state.selectedStory = STORY_PRESETS.find(s => s.id === id) || STORY_PRESETS[0];
  state.selectedMapFloor = null;
  render();
};

window.adjustRole = adjustRole;

function fallbackCopyText(text) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  } catch (error) {
    return false;
  }
}

async function copyTextWithFeedback(text, buttonId = '', successText = '✓ Copied!') {
  const value = String(text || '').trim();
  if (!value) return false;
  let copied = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      copied = true;
    }
  } catch (error) {
    copied = fallbackCopyText(value);
  }
  if (!copied) {
    copied = fallbackCopyText(value);
  }
  const btn = buttonId ? document.getElementById(buttonId) : null;
  if (btn) {
    btn.textContent = copied ? successText : 'Copy failed';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = '📋 Copy';
      btn.classList.remove('copied');
    }, 2000);
  }
  return copied;
}

window.copyJoinPortal = async (buttonId = 'copyPortalBtn') => {
  return copyTextWithFeedback(getJoinPortalUrl(), buttonId, '✓ Copied!');
};

window.copyLink = async (buttonId = 'copyFastLinkBtn') => {
  const shareUrl = getShareJoinUrl(state.gameCode);
  const fallbackCode = sanitizeRoomCode(state.gameCode);
  return copyTextWithFeedback(shareUrl || fallbackCode, buttonId, shareUrl ? '✓ Link Copied!' : '✓ Code Copied!');
};

window.copyRoomCode = async (buttonId = 'copyRoomCodeBtn') => {
  return copyTextWithFeedback(sanitizeRoomCode(state.gameCode), buttonId, '✓ Code Copied!');
};

window.copyQrShortcut = async () => {
  const shareUrl = getShareJoinUrl(state.gameCode);
  const fallbackCode = sanitizeRoomCode(state.gameCode);
  return copyTextWithFeedback(shareUrl || fallbackCode, '', shareUrl ? '✓ Link Copied!' : '✓ Code Copied!');
};

window.copyTextValue = async (text, buttonId = 'copyPortalBtn') => {
  return copyTextWithFeedback(text, buttonId, '✓ Copied!');
};

window.startGame = startGame;

window.newGame = () => {
  state.gameEpoch = (state.gameEpoch || 0) + 1;
  clearSoloStateCache();
  clearAutoAdvance();
  clearBotChatTimers();
  clearDeathAnimation();
  disconnectRealtimeSession({ keepMode: Boolean(state.joinCode) });
  if (!state.joinCode) state.multiplayerMode = 'passplay';
  applyEntryScreenDefaults();
  state.players = [];
  state.bots = [];
  state.winner = null;
  state.winReason = null;
  state.finalDeath = null;
  state.gamePhase = 'reveal';
  state.nightPlans = {};
  state.snoopAssignments = {};
  state.snoopPrimaryTargets = {};
  state.detectiveStances = {};
  state.nightDefenseOutcome = null;
  state.snoopersByTarget = {};
  state.mafiaSnooperIntel = {};
  state.mafiaBriefing = {};
  state.mafiaVotes = {};
  state.mafiaKillMethods = {};
  state.nightAwareness = {};
  state.nightAttackCounts = {};
  state.nightAttackMethod = null;
  state.doctorSave = null;
  state.votes = {};
  state.intelResults = {};
  state.chatMessages = [];
  state.chatDraft = '';
  state.chatSenderId = null;
  state.selectedLocation = null;
  state.selectedAction = null;
  state.selectedActionTarget = null;
  state.selectedTarget = null;
  state.selectedKillMethod = null;
  state.selectedAwareness = null;
  state.selectedSave = null;
  state.selectedVote = null;
  state.pendingWin = null;
  state.showMap = false;
  state.selectedMapFloor = null;
  state.showBigRoomCode = false;
  state.discussionUnlockAt = 0;
  state.lastNarratorPromptKey = null;
  state.pendingNarratorPhase = null;
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
    state.narrative = buildNarration('day');
    primeNarratorTurn('day');
    const firstHuman = findFirstAliveHumanIndex();
    if (firstHuman !== -1) state.currentPlayerIndex = firstHuman;
    queueNarratorChatPrompt('day');
    withBotDelay(() => botMakeDecisions('day'), Math.max(700, state.botDelayMs));
  }
  render();
};

window.selectLocation = (id) => {
  state.selectedLocation = id;
  state.selectedAction = null;
  state.selectedActionTarget = null;
  render();
};

window.selectAction = (id) => {
  const current = getCurrentPlayer();
  const location = getLocationById(state.selectedLocation);
  const actions = getAvailableActionsForPlayer(current, location);
  state.selectedAction = actions.find(a => a.id === id);
  if (!state.selectedAction?.requiresTarget) state.selectedActionTarget = null;
  render();
};

window.selectActionTarget = (id) => {
  state.selectedActionTarget = id;
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

  state.nightPlans[current.id] = {
    location: state.selectedLocation,
    locationName: location?.name,
    action,
    actionTarget
  };
  state.selectedLocation = null;
  state.selectedAction = null;
  state.selectedActionTarget = null;

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

window.selectKillMethod = (methodId) => {
  state.selectedKillMethod = methodId;
  render();
};

window.selectNightAwareness = (awarenessId) => {
  setNightAwareness(awarenessId);
};

window.confirmNightAwareness = () => {
  confirmNightAwarenessForCurrent();
  advanceNightActor();
};

window.skipNightAwareness = () => {
  const fallback = getNightAwarenessById('listen_posts');
  state.selectedAwareness = fallback.id;
  confirmNightAwarenessForCurrent();
  advanceNightActor();
};

window.selectSave = (id) => {
  state.selectedSave = id;
  render();
};

window.continueNight = () => {
  advanceNightActor();
};

window.confirmMafiaTarget = () => {
  const current = getCurrentPlayer();
  if (!state.selectedTarget || !state.selectedKillMethod) return;
  state.mafiaVotes[current.id] = state.selectedTarget;
  state.mafiaKillMethods[current.id] = state.selectedKillMethod;
  state.selectedTarget = null;
  state.selectedKillMethod = null;
  advanceNightActor();
};

// Doctor night-stance turn: pick who to watch over tonight.
window.confirmDoctorProtect = () => {
  confirmDoctorProtectForCurrent();
  advanceNightActor();
};

// Detective night-stance turn.
window.selectNightStance = (stanceId) => {
  state.selectedStance = stanceId;
  const option = DETECTIVE_STANCE_OPTIONS.find(item => item.id === stanceId);
  if (!option?.requiresTarget) state.selectedStanceTarget = null;
  render();
};

window.selectStanceTarget = (id) => {
  state.selectedStanceTarget = id;
  render();
};

window.confirmDetectiveStance = () => {
  const option = DETECTIVE_STANCE_OPTIONS.find(item => item.id === state.selectedStance);
  if (option?.requiresTarget && !state.selectedStanceTarget) return;
  confirmDetectiveStanceForCurrent();
  advanceNightActor();
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
  const remainingMs = Math.max(0, (state.discussionUnlockAt || 0) - Date.now());
  const isMultiDevice = state.multiplayerMode === 'realtime' && (state.network.devices || []).length > 1;
  if (remainingMs > 0) {
    render();
    return;
  }
  if (isMultiDevice && !state.network.isHost) {
    render();
    return;
  }
  window.proceedToVote();
};

window.proceedToVote = () => {
  clearBotChatTimers();
  state.discussionUnlockAt = 0;
  state.gamePhase = 'vote';
  state.currentPlayerIndex = 0;
  state.showRole = false;
  state.narrative = buildNarration('vote');
  primeNarratorTurn('vote');
  addNarrationLog(state.narrative, 'vote');
  queueNarratorChatPrompt('vote');
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

// Lobby chat: lets connected devices talk while waiting for the game to start.
// Senders are devices (players may not be added yet). On forwarded actions the
// client's device name rides along as the second arg so the host attributes
// the message correctly.
window.sendLobbyMessage = (textOverride = null, senderNameOverride = null) => {
  if (state.screen !== 'multi_lobby' || !isRealtimeMode() || !state.network.connected) return;
  const source = typeof textOverride === 'string' ? textOverride : state.chatDraft;
  const text = source.trim().slice(0, 240);
  if (!text) return;
  const senderName = String(senderNameOverride || state.network.deviceName || 'Device').slice(0, 32);

  state.chatMessages.push({
    id: `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    day: 0,
    lobby: true,
    senderId: `device_${senderName}`,
    senderName,
    text,
    at: new Date().toISOString()
  });
  if (state.chatMessages.length > 120) {
    state.chatMessages = state.chatMessages.slice(-120);
  }
  state.chatDraft = '';
  render();
};

window.sendDiscussionMessage = (textOverride = null) => {
  // Multi-device chat is open through the whole game (it is the table talk);
  // only bots restrict their replies to discussion time.
  const chatAllowed = state.gamePhase === 'discussion'
    || (state.screen === 'game' && isMultiDeviceChatEnabled() && state.gamePhase !== 'gameover');
  if (!chatAllowed) return;
  const source = typeof textOverride === 'string' ? textOverride : state.chatDraft;
  const text = source.trim();
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
  if (state.gamePhase === 'discussion') queueBotDiscussion(false, text);
  render();
};

window.refreshDiscussion = () => {
  if (state.gamePhase !== 'discussion') return;
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

window.completeNarratorTurn = () => {
  if (!narratorTurnIsActive(state.gamePhase)) return;
  clearNarratorTurn();
  render();
};

const REALTIME_FORWARD_ACTIONS = new Set([
  'goToSetup',
  'goToMultiLobby',
  'removePlayer',
  'renamePlayer',
  'movePlayer',
  'moveDevice',
  'reorderPlayerByDrop',
  'reorderDeviceByDrop',
  'addPlayerFromInput',
  'addBot',
  'removeBot',
  'renameBot',
  'selectPreset',
  'selectStory',
  'adjustRole',
  'startGame',
  'newGame',
  'showCurrentRole',
  'nextReveal',
  'selectLocation',
  'selectAction',
  'selectActionTarget',
  'confirmDayPlan',
  'selectTarget',
  'selectKillMethod',
  'selectNightAwareness',
  'confirmNightAwareness',
  'skipNightAwareness',
  'continueNight',
  'confirmMafiaTarget',
  'selectSave',
  'confirmDoctorProtect',
  'selectNightStance',
  'selectStanceTarget',
  'confirmDetectiveStance',
  'selectGameplayPreset',
  'completeNarratorTurn',
  'afterAnnouncement',
  'afterVoteAnnouncement',
  'openDiscussionForCurrent',
  'advanceDiscussion',
  'proceedToVote',
  'setChatSender',
  'setChatDraft',
  'sendDiscussionMessage',
  'sendLobbyMessage',
  'selectVote',
  'confirmVote'
]);

const REALTIME_ARG_MAPPERS = {
  addPlayerFromInput: (args) => {
    if (typeof args[0] === 'string') {
      return [args[0], args[1] || state.network.deviceId];
    }
    const input = document.getElementById('newPlayerInput');
    return [input?.value || '', state.network.deviceId];
  },
  sendDiscussionMessage: (args) => {
    if (typeof args[0] === 'string') return args;
    return [state.chatDraft];
  },
  sendLobbyMessage: (args) => {
    const text = typeof args[0] === 'string' ? args[0] : state.chatDraft;
    return [text, state.network.deviceName];
  }
};

let realtimeWrappersInstalled = false;

function installRealtimeActionWrappers() {
  if (realtimeWrappersInstalled) return;
  realtimeWrappersInstalled = true;

  REALTIME_FORWARD_ACTIONS.forEach(actionName => {
    const original = window[actionName];
    if (typeof original !== 'function') return;

    window[actionName] = (...args) => {
      if (isRealtimeClient() && !realtime.replayingRemoteAction) {
        const mapper = REALTIME_ARG_MAPPERS[actionName];
        const mappedArgs = mapper ? mapper(args) : args;
        const forwarded = forwardRealtimeAction(actionName, mappedArgs);
        if (forwarded) return;
      }
      return original(...args);
    };
  });
}

installRealtimeActionWrappers();

function persistSoloStateCache() {
  if (state.entryPage !== 'solo' || state.screen !== 'game') return;
  if (state.gamePhase === 'gameover') {
    clearSoloStateCache();
    return;
  }
  try {
    localStorage.setItem(SOLO_CACHE_KEY, JSON.stringify({
      version: 1,
      savedAt: Date.now(),
      snapshot: buildRealtimeStateSnapshot()
    }));
  } catch (error) {
    // ignore quota/availability issues
  }
}

function clearSoloStateCache() {
  try {
    localStorage.removeItem(SOLO_CACHE_KEY);
  } catch (error) {
    // ignore
  }
}

function loadSoloStateCache() {
  try {
    const raw = localStorage.getItem(SOLO_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.snapshot || typeof parsed.snapshot !== 'object') return null;
    if (parsed.savedAt && (Date.now() - Number(parsed.savedAt)) > ROOM_CACHE_TTL_MS) {
      clearSoloStateCache();
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
}

// Resume an interrupted solo game (tab closed / accidental refresh).
window.resumeSoloGame = () => {
  const cached = loadSoloStateCache();
  if (!cached) {
    state.soloResumeAvailable = false;
    render();
    return;
  }
  applyRealtimeStateSnapshot(cached.snapshot);
  state.soloResumeAvailable = false;
  state.multiplayerMode = 'passplay';
  state.screen = 'game';
  render();
};

window.discardSoloGame = () => {
  clearSoloStateCache();
  state.soloResumeAvailable = false;
  render();
};

function finalizeAfterRender() {
  if (state.chatDrawerOpen && state.screen === 'game') {
    state.chatSeenCount = state.chatMessages.filter(message => message.day === state.dayNumber).length;
  }
  syncUrlState();
  if (isRealtimeMode()) persistRoomStateCache();
  persistSoloStateCache();
}

let autoHostAttempted = false;

window.afterRender = () => {
  // Hosting should be one click from the entry page: when the host page loads,
  // open the room automatically so QR/code joiners find it live.
  if (IS_HOST_PAGE && !autoHostAttempted && state.screen === 'multi_lobby'
      && isRealtimeMode() && state.network.isHost
      && !state.network.connected && state.network.status !== 'connecting') {
    autoHostAttempted = true;
    if (typeof window.connectAsHost === 'function') window.connectAsHost();
  }
  if (state.autoJoinPending && state.joinCode) {
    state.autoJoinPending = false;
    if (state.screen !== 'multi_lobby') {
      if (typeof window.goToMultiLobby === 'function') {
        window.goToMultiLobby();
      } else {
        state.screen = 'multi_lobby';
        state.multiplayerMode = 'realtime';
        state.realtimePanelMode = 'join';
        state.network.isHost = false;
        updateRoleConfig();
        render();
      }
      finalizeAfterRender();
      return;
    }
    if (isRealtimeMode() && !state.network.connected && state.realtimePanelMode === 'join') {
      connectRealtimeSession();
      finalizeAfterRender();
      return;
    }
  }
  if (isRealtimeMode() && state.network.connected && state.network.isHost && !realtime.applyingRemoteState) {
    broadcastRealtimeState();
  }
  finalizeAfterRender();
};
