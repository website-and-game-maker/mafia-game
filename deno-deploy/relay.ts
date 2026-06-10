// Mafia realtime relay — Deno Deploy entry (self-contained).
//
// Deno Deploy supports server-side WebSockets natively (Deno.upgradeWebSocket),
// so this is a host-authoritative WebSocket relay for multi-device Mafia rooms.
// Same protocol as scripts/realtime_server.py. Self-contained (no imports) so it
// deploys as a single file.
//
//   - GET (no Upgrade) / and /health -> 200 health check
//   - WebSocket: join_room / state_update / action_request / request_state /
//     kick_device, with presence + host migration.

interface ClientInfo {
  room: string;
  deviceId: string;
  deviceName: string;
}

interface Room {
  code: string;
  clients: Set<WebSocket>;
  hostDeviceId: string | null;
  latestState: unknown | null;
  hostLostAt: number | null;
}

const HOST_GRACE_MS = 75 * 1000;

const ROOMS = new Map<string, Room>();
const CLIENT_INFO = new Map<WebSocket, ClientInfo>();
let anonCounter = 0;

function sanitizeCode(raw: unknown): string {
  const code = String(raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return code.slice(0, 8) || "ROOM";
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCode(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

function generateUniqueRoomCode(length = 6, maxAttempts = 32): string {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = randomCode(length);
    const room = ROOMS.get(candidate);
    if (!room || room.clients.size === 0) return candidate;
  }
  return `${randomCode(4)}${randomCode(4)}`;
}

function safeSend(ws: WebSocket, payload: unknown): boolean {
  try {
    if (ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

function broadcast(room: Room, payload: unknown, exclude?: WebSocket): void {
  const stale: WebSocket[] = [];
  for (const ws of [...room.clients]) {
    if (exclude && ws === exclude) continue;
    if (!safeSend(ws, payload)) stale.push(ws);
  }
  for (const ws of stale) cleanupClient(ws);
}

function currentHostSocket(room: Room): WebSocket | null {
  if (!room.hostDeviceId) return null;
  for (const ws of room.clients) {
    if ((CLIENT_INFO.get(ws)?.deviceId ?? "") === room.hostDeviceId) return ws;
  }
  return null;
}

function roomDevices(room: Room): Array<Record<string, unknown>> {
  const devices: Array<{ deviceId: string; deviceName: string; isHost: boolean }> = [];
  for (const ws of room.clients) {
    const info = CLIENT_INFO.get(ws) ?? ({} as ClientInfo);
    const deviceId = String(info.deviceId ?? "");
    devices.push({
      deviceId,
      deviceName: String(info.deviceName ?? "Device"),
      isHost: deviceId === room.hostDeviceId,
    });
  }
  devices.sort((a, b) => {
    if (a.isHost !== b.isHost) return a.isHost ? -1 : 1;
    return a.deviceName.localeCompare(b.deviceName);
  });
  return devices;
}

function nextDeviceName(room: Room): string {
  const used = new Set<number>();
  for (const ws of room.clients) {
    const name = String(CLIENT_INFO.get(ws)?.deviceName ?? "").trim();
    const m = name.match(/^Device\s+(\d+)$/i);
    if (m) used.add(Number(m[1]));
  }
  let candidate = 1;
  while (used.has(candidate)) candidate++;
  return `Device ${candidate}`;
}

function publishPresence(room: Room): void {
  broadcast(room, {
    type: "presence",
    code: room.code,
    hostDeviceId: room.hostDeviceId,
    devices: roomDevices(room),
  });
}

function handleJoin(ws: WebSocket, data: Record<string, unknown>): void {
  const requestedCode = sanitizeCode(data.code);
  const deviceId = String(data.deviceId ?? "") || `anon_${++anonCounter}`;
  const requestedName = String(data.deviceName ?? "").trim();
  const requestedHost = Boolean(data.isHost);

  let code = requestedCode;
  const existingRoom = ROOMS.get(requestedCode);
  if (!requestedHost && (!existingRoom || existingRoom.clients.size === 0)) {
    safeSend(ws, {
      type: "error",
      message: "Room code not found. Ask the host to start the room, then try again.",
    });
    return;
  }
  if (requestedHost && existingRoom && existingRoom.clients.size > 0) {
    const activeIds = new Set(
      [...existingRoom.clients].map((c) => CLIENT_INFO.get(c)?.deviceId),
    );
    if (
      existingRoom.hostDeviceId &&
      existingRoom.hostDeviceId !== deviceId &&
      !activeIds.has(deviceId)
    ) {
      code = generateUniqueRoomCode();
    }
  }

  let room = ROOMS.get(code);
  if (!room) {
    room = { code, clients: new Set(), hostDeviceId: null, latestState: null, hostLostAt: null };
    ROOMS.set(code, room);
  }
  room.clients.add(ws);

  const defaultLike = /^Device(\s+\d+)?$/i.test(requestedName);
  const deviceName = !requestedName || defaultLike ? nextDeviceName(room) : requestedName.slice(0, 32);
  CLIENT_INFO.set(ws, { room: code, deviceId, deviceName });

  const activeIds = new Set([...room.clients].map((c) => CLIENT_INFO.get(c)?.deviceId));
  if (!room.hostDeviceId) {
    room.hostDeviceId = deviceId;
  } else if (deviceId === room.hostDeviceId) {
    // The host (e.g. after an accidental refresh) reclaims their seat.
    room.hostLostAt = null;
  } else if (!activeIds.has(room.hostDeviceId)) {
    // Host absent: hold the seat through a grace window so a returning host
    // isn't usurped by whoever joins next; hand it over only after the grace.
    const graceOver = room.hostLostAt !== null && (Date.now() - room.hostLostAt) > HOST_GRACE_MS;
    if (graceOver) {
      room.hostDeviceId = deviceId;
      room.hostLostAt = null;
    }
  }

  safeSend(ws, { type: "joined_room", code, hostDeviceId: room.hostDeviceId });
  publishPresence(room);

  if (room.latestState) {
    safeSend(ws, { type: "state_update", code, state: room.latestState });
  }

  const hostWs = currentHostSocket(room);
  if (hostWs && hostWs !== ws) {
    safeSend(hostWs, { type: "request_state", code });
  }
}

function handleStateUpdate(ws: WebSocket, data: Record<string, unknown>): void {
  const info = CLIENT_INFO.get(ws);
  if (!info) return;
  const room = ROOMS.get(info.room);
  if (!room) return;
  if (info.deviceId !== room.hostDeviceId) return;

  room.latestState = data.state && typeof data.state === "object" ? data.state : null;
  broadcast(room, { type: "state_update", code: room.code, state: room.latestState }, ws);
}

function handleActionRequest(ws: WebSocket, data: Record<string, unknown>): void {
  const info = CLIENT_INFO.get(ws);
  if (!info) return;
  const room = ROOMS.get(info.room);
  if (!room) return;
  const hostWs = currentHostSocket(room);
  if (!hostWs || hostWs === ws) return;
  safeSend(hostWs, {
    type: "action_request",
    code: room.code,
    action: data.action,
    args: Array.isArray(data.args) ? data.args : [],
  });
}

function handleRequestState(ws: WebSocket): void {
  const info = CLIENT_INFO.get(ws);
  if (!info) return;
  const room = ROOMS.get(info.room);
  if (!room) return;
  const hostWs = currentHostSocket(room);
  if (hostWs) safeSend(hostWs, { type: "request_state", code: room.code });
}

function handleKickDevice(ws: WebSocket, data: Record<string, unknown>): void {
  const info = CLIENT_INFO.get(ws);
  if (!info) return;
  const room = ROOMS.get(info.room);
  if (!room) return;
  if (String(info.deviceId ?? "") !== room.hostDeviceId) return;

  const targetDeviceId = String(data.deviceId ?? "").trim();
  if (!targetDeviceId || targetDeviceId === room.hostDeviceId) return;

  let targetWs: WebSocket | null = null;
  for (const client of [...room.clients]) {
    if (String(CLIENT_INFO.get(client)?.deviceId ?? "") === targetDeviceId) {
      targetWs = client;
      break;
    }
  }
  if (!targetWs) return;

  safeSend(targetWs, { type: "kicked", message: "Host removed this device from the room." });
  try {
    targetWs.close(4001, "kicked_by_host");
  } catch {
    cleanupClient(targetWs);
  }
}

function cleanupClient(ws: WebSocket): void {
  const info = CLIENT_INFO.get(ws);
  CLIENT_INFO.delete(ws);
  if (!info) return;
  const room = ROOMS.get(info.room);
  if (!room) return;

  room.clients.delete(ws);
  if (room.clients.size === 0) {
    ROOMS.delete(room.code);
    return;
  }

  if (info.deviceId === room.hostDeviceId) {
    // Grace window before promotion: an accidental refresh should let the
    // host come back and keep hosting.
    room.hostLostAt = Date.now();
    const codeSnapshot = room.code;
    setTimeout(() => {
      const current = ROOMS.get(codeSnapshot);
      if (!current || current.clients.size === 0) return;
      const active = new Set([...current.clients].map((c) => CLIENT_INFO.get(c)?.deviceId));
      if (current.hostDeviceId && active.has(current.hostDeviceId)) return; // host returned
      const replacement = current.clients.values().next().value as WebSocket;
      current.hostDeviceId = String(CLIENT_INFO.get(replacement)?.deviceId ?? "");
      current.hostLostAt = null;
      broadcast(current, { type: "host_changed", code: current.code, hostDeviceId: current.hostDeviceId });
      publishPresence(current);
    }, HOST_GRACE_MS);
  }
  publishPresence(room);
}

function handleMessage(ws: WebSocket, raw: string): void {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    safeSend(ws, { type: "error", message: "Invalid JSON" });
    return;
  }
  switch (String(data.type ?? "")) {
    case "join_room": return handleJoin(ws, data);
    case "state_update": return handleStateUpdate(ws, data);
    case "action_request": return handleActionRequest(ws, data);
    case "request_state": return handleRequestState(ws);
    case "kick_device": return handleKickDevice(ws, data);
    default:
      safeSend(ws, { type: "error", message: `Unknown type: ${String(data.type ?? "")}` });
  }
}

function handler(req: Request): Response {
  if ((req.headers.get("upgrade") ?? "").toLowerCase() !== "websocket") {
    return new Response("Mafia realtime relay is running.\n", {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  const { socket, response } = Deno.upgradeWebSocket(req);
  socket.onmessage = (event) => {
    if (typeof event.data === "string") handleMessage(socket, event.data);
  };
  socket.onclose = () => cleanupClient(socket);
  socket.onerror = () => cleanupClient(socket);
  return response;
}

const port = Number(Deno.env.get("PORT") ?? 8787);
Deno.serve({ port }, handler);
