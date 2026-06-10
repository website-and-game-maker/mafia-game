#!/usr/bin/env python3
"""
Lightweight WebSocket relay for Mafia realtime mode.

Run:
  python3 scripts/realtime_server.py --host 0.0.0.0 --port 8765
"""

import argparse
import asyncio
import json
import logging
import os
import re
import secrets
from dataclasses import dataclass, field
from http import HTTPStatus
from typing import Any, Dict, Optional, Set

try:
  import websockets
except ImportError as exc:
  raise SystemExit(
    "Missing dependency: websockets. Install with `pip install websockets`."
  ) from exc

# Protocol class location changed across websockets versions.
# Runtime behavior only needs send/recv methods, so keep typing flexible.
WebSocketServerProtocol = Any


LOGGER = logging.getLogger("mafia-realtime")


HOST_GRACE_SECONDS = 75


@dataclass
class Room:
  code: str
  clients: Set[WebSocketServerProtocol] = field(default_factory=set)
  host_device_id: Optional[str] = None
  latest_state: Optional[Dict[str, Any]] = None
  host_lost_at: Optional[float] = None


ROOMS: Dict[str, Room] = {}
CLIENT_INFO: Dict[WebSocketServerProtocol, Dict[str, Any]] = {}


def sanitize_code(raw: Any) -> str:
  code = "".join(ch for ch in str(raw or "").upper() if ch.isalnum())
  return (code[:8] or "ROOM")


def random_code(length: int = 6) -> str:
  alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return "".join(secrets.choice(alphabet) for _ in range(length))


def generate_unique_room_code(length: int = 6, max_attempts: int = 32) -> str:
  for _ in range(max_attempts):
    candidate = random_code(length)
    room = ROOMS.get(candidate)
    if room is None or len(room.clients) == 0:
      return candidate
  return f"{random_code(4)}{random_code(4)}"


async def safe_send(ws: WebSocketServerProtocol, payload: Dict[str, Any]) -> bool:
  try:
    await ws.send(json.dumps(payload))
    return True
  except Exception:
    return False


async def broadcast(room: Room, payload: Dict[str, Any], exclude: Optional[WebSocketServerProtocol] = None) -> None:
  stale: Set[WebSocketServerProtocol] = set()
  for ws in list(room.clients):
    if exclude is not None and ws == exclude:
      continue
    ok = await safe_send(ws, payload)
    if not ok:
      stale.add(ws)
  for ws in stale:
    await cleanup_client(ws)


def current_host_socket(room: Room) -> Optional[WebSocketServerProtocol]:
  if not room.host_device_id:
    return None
  for ws in room.clients:
    info = CLIENT_INFO.get(ws) or {}
    if info.get("deviceId") == room.host_device_id:
      return ws
  return None


def room_devices(room: Room) -> list[Dict[str, Any]]:
  devices = []
  for ws in room.clients:
    info = CLIENT_INFO.get(ws) or {}
    device_id = str(info.get("deviceId") or "")
    devices.append({
      "deviceId": device_id,
      "deviceName": str(info.get("deviceName") or "Device"),
      "isHost": device_id == room.host_device_id
    })
  devices.sort(key=lambda entry: (not entry["isHost"], entry["deviceName"]))
  return devices


def next_device_name(room: Room) -> str:
  used_numbers: set[int] = set()
  for ws in room.clients:
    info = CLIENT_INFO.get(ws) or {}
    name = str(info.get("deviceName") or "")
    match = re.match(r"^Device\s+(\d+)$", name.strip(), flags=re.IGNORECASE)
    if match:
      used_numbers.add(int(match.group(1)))
  candidate = 1
  while candidate in used_numbers:
    candidate += 1
  return f"Device {candidate}"


async def publish_presence(room: Room) -> None:
  await broadcast(room, {
    "type": "presence",
    "code": room.code,
    "hostDeviceId": room.host_device_id,
    "devices": room_devices(room)
  })


async def handle_join(ws: WebSocketServerProtocol, data: Dict[str, Any]) -> None:
  requested_code = sanitize_code(data.get("code"))
  device_id = str(data.get("deviceId") or f"anon_{id(ws)}")
  requested_name = str(data.get("deviceName") or "").strip()
  requested_host = bool(data.get("isHost"))

  code = requested_code
  existing_room = ROOMS.get(requested_code)
  if not requested_host and (existing_room is None or len(existing_room.clients) == 0):
    await safe_send(ws, {
      "type": "error",
      "message": "Room code not found. Ask the host to start the room, then try again."
    })
    return
  if requested_host and existing_room and len(existing_room.clients) > 0:
    active_ids = {
      (CLIENT_INFO.get(client) or {}).get("deviceId")
      for client in existing_room.clients
    }
    if existing_room.host_device_id and existing_room.host_device_id != device_id and device_id not in active_ids:
      code = generate_unique_room_code()

  room = ROOMS.setdefault(code, Room(code=code))
  room.clients.add(ws)
  default_like = re.match(r"^Device(\s+\d+)?$", requested_name, flags=re.IGNORECASE)
  if not requested_name or default_like:
    device_name = next_device_name(room)
  else:
    device_name = requested_name[:32]
  CLIENT_INFO[ws] = {
    "room": code,
    "deviceId": device_id,
    "deviceName": device_name
  }

  active_ids = {
    (CLIENT_INFO.get(client) or {}).get("deviceId")
    for client in room.clients
  }
  import time as _time
  if room.host_device_id is None:
    room.host_device_id = device_id
  elif device_id == room.host_device_id:
    # The host (e.g. after an accidental refresh) reclaims their seat.
    room.host_lost_at = None
  elif room.host_device_id not in active_ids:
    # Host is absent: hold the seat through a grace window so a returning
    # host isn't usurped by whoever happens to join next.
    grace_over = room.host_lost_at is not None and (_time.time() - room.host_lost_at) > HOST_GRACE_SECONDS
    if grace_over:
      room.host_device_id = device_id
      room.host_lost_at = None

  await safe_send(ws, {
    "type": "joined_room",
    "code": code,
    "hostDeviceId": room.host_device_id
  })
  await publish_presence(room)

  if room.latest_state:
    await safe_send(ws, {
      "type": "state_update",
      "code": code,
      "state": room.latest_state
    })

  host_ws = current_host_socket(room)
  if host_ws and host_ws != ws:
    await safe_send(host_ws, {"type": "request_state", "code": code})


async def handle_state_update(ws: WebSocketServerProtocol, data: Dict[str, Any]) -> None:
  info = CLIENT_INFO.get(ws)
  if not info:
    return
  room = ROOMS.get(str(info.get("room")))
  if not room:
    return

  device_id = str(info.get("deviceId") or "")
  if device_id != room.host_device_id:
    return

  room.latest_state = data.get("state") if isinstance(data.get("state"), dict) else None
  await broadcast(room, {
    "type": "state_update",
    "code": room.code,
    "state": room.latest_state
  }, exclude=ws)


async def handle_action_request(ws: WebSocketServerProtocol, data: Dict[str, Any]) -> None:
  info = CLIENT_INFO.get(ws)
  if not info:
    return
  room = ROOMS.get(str(info.get("room")))
  if not room:
    return

  host_ws = current_host_socket(room)
  if not host_ws or host_ws == ws:
    return

  await safe_send(host_ws, {
    "type": "action_request",
    "code": room.code,
    "action": data.get("action"),
    "args": data.get("args") if isinstance(data.get("args"), list) else []
  })


async def handle_request_state(ws: WebSocketServerProtocol) -> None:
  info = CLIENT_INFO.get(ws)
  if not info:
    return
  room = ROOMS.get(str(info.get("room")))
  if not room:
    return
  host_ws = current_host_socket(room)
  if host_ws:
    await safe_send(host_ws, {"type": "request_state", "code": room.code})


async def handle_kick_device(ws: WebSocketServerProtocol, data: Dict[str, Any]) -> None:
  info = CLIENT_INFO.get(ws)
  if not info:
    return
  room = ROOMS.get(str(info.get("room")))
  if not room:
    return

  host_device_id = str(info.get("deviceId") or "")
  if host_device_id != room.host_device_id:
    return

  target_device_id = str(data.get("deviceId") or "").strip()
  if not target_device_id or target_device_id == room.host_device_id:
    return

  target_ws: Optional[WebSocketServerProtocol] = None
  for client in list(room.clients):
    client_info = CLIENT_INFO.get(client) or {}
    if str(client_info.get("deviceId") or "") == target_device_id:
      target_ws = client
      break

  if not target_ws:
    return

  await safe_send(target_ws, {
    "type": "kicked",
    "message": "Host removed this device from the room."
  })
  try:
    await target_ws.close(code=4001, reason="kicked_by_host")
  except Exception:
    await cleanup_client(target_ws)


async def cleanup_client(ws: WebSocketServerProtocol) -> None:
  info = CLIENT_INFO.pop(ws, None)
  if not info:
    return

  room_code = str(info.get("room"))
  room = ROOMS.get(room_code)
  if not room:
    return

  room.clients.discard(ws)

  if len(room.clients) == 0:
    ROOMS.pop(room.code, None)
    return

  if info.get("deviceId") == room.host_device_id:
    # Don't promote immediately: give the host a grace window to reconnect
    # (accidental refresh / tab close). Promote only if they stay gone.
    import time as _time
    room.host_lost_at = _time.time()
    code_snapshot = room.code

    async def promote_after_grace() -> None:
      await asyncio.sleep(HOST_GRACE_SECONDS)
      current = ROOMS.get(code_snapshot)
      if current is None or len(current.clients) == 0:
        return
      active = {
        (CLIENT_INFO.get(client) or {}).get("deviceId")
        for client in current.clients
      }
      if current.host_device_id in active:
        return  # host returned
      replacement = next(iter(current.clients))
      replacement_info = CLIENT_INFO.get(replacement) or {}
      current.host_device_id = str(replacement_info.get("deviceId") or "")
      current.host_lost_at = None
      await broadcast(current, {
        "type": "host_changed",
        "code": current.code,
        "hostDeviceId": current.host_device_id
      })
      await publish_presence(current)

    asyncio.create_task(promote_after_grace())

  await publish_presence(room)


async def handle_message(ws: WebSocketServerProtocol, raw: str) -> None:
  try:
    data = json.loads(raw)
  except json.JSONDecodeError:
    await safe_send(ws, {"type": "error", "message": "Invalid JSON"})
    return

  message_type = str(data.get("type") or "")
  if message_type == "join_room":
    await handle_join(ws, data)
    return
  if message_type == "state_update":
    await handle_state_update(ws, data)
    return
  if message_type == "action_request":
    await handle_action_request(ws, data)
    return
  if message_type == "request_state":
    await handle_request_state(ws)
    return
  if message_type == "kick_device":
    await handle_kick_device(ws, data)
    return

  await safe_send(ws, {"type": "error", "message": f"Unknown type: {message_type}"})


async def server_handler(ws: WebSocketServerProtocol) -> None:
  try:
    async for message in ws:
      await handle_message(ws, message)
  except Exception:
    pass
  finally:
    await cleanup_client(ws)


async def health_check(connection: Any, request: Any) -> Any:
  """Answer plain HTTP probes (cloud health checks / browser visits) with 200.

  Returning None lets genuine WebSocket upgrade requests proceed to the handshake.
  """
  try:
    upgrade = request.headers.get("Upgrade", "")
  except Exception:
    upgrade = ""
  if str(upgrade or "").lower() == "websocket":
    return None
  try:
    return connection.respond(HTTPStatus.OK, "Mafia realtime relay is running.\n")
  except Exception:
    return None


async def main() -> None:
  # Cloud hosts (Render, Railway, Fly, etc.) inject the bind port via $PORT.
  default_port = int(os.environ.get("PORT") or 8765)
  default_host = os.environ.get("HOST", "0.0.0.0")
  parser = argparse.ArgumentParser(description="Mafia realtime WebSocket relay server")
  parser.add_argument("--host", default=default_host, help="Bind address (default: 0.0.0.0 or $HOST)")
  parser.add_argument("--port", type=int, default=default_port, help="Bind port (default: 8765 or $PORT)")
  args = parser.parse_args()

  logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
  LOGGER.info("Starting realtime relay on ws://%s:%s", args.host, args.port)

  async with websockets.serve(
    server_handler,
    args.host,
    args.port,
    process_request=health_check,
    ping_interval=20,
    ping_timeout=20,
  ):
    await asyncio.Future()


if __name__ == "__main__":
  asyncio.run(main())
