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
from dataclasses import dataclass, field
from typing import Any, Dict, Optional, Set

try:
  import websockets
  from websockets.server import WebSocketServerProtocol
except ImportError as exc:
  raise SystemExit(
    "Missing dependency: websockets. Install with `pip install websockets`."
  ) from exc


LOGGER = logging.getLogger("mafia-realtime")


@dataclass
class Room:
  code: str
  clients: Set[WebSocketServerProtocol] = field(default_factory=set)
  host_device_id: Optional[str] = None
  latest_state: Optional[Dict[str, Any]] = None


ROOMS: Dict[str, Room] = {}
CLIENT_INFO: Dict[WebSocketServerProtocol, Dict[str, Any]] = {}


def sanitize_code(raw: Any) -> str:
  code = "".join(ch for ch in str(raw or "").upper() if ch.isalnum())
  return (code[:8] or "ROOM")


async def safe_send(ws: WebSocketServerProtocol, payload: Dict[str, Any]) -> bool:
  try:
    await ws.send(json.dumps(payload))
    return True
  except Exception:
    return False


async def broadcast(room: Room, payload: Dict[str, Any], exclude: Optional[WebSocketServerProtocol] = None) -> None:
  stale: Set[WebSocketServerProtocol] = set()
  for ws in room.clients:
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


async def publish_presence(room: Room) -> None:
  await broadcast(room, {
    "type": "presence",
    "code": room.code,
    "hostDeviceId": room.host_device_id,
    "devices": room_devices(room)
  })


async def handle_join(ws: WebSocketServerProtocol, data: Dict[str, Any]) -> None:
  code = sanitize_code(data.get("code"))
  device_id = str(data.get("deviceId") or f"anon_{id(ws)}")
  device_name = str(data.get("deviceName") or "Device")[:32]
  requested_host = bool(data.get("isHost"))

  room = ROOMS.setdefault(code, Room(code=code))
  room.clients.add(ws)
  CLIENT_INFO[ws] = {
    "room": code,
    "deviceId": device_id,
    "deviceName": device_name
  }

  active_ids = {
    (CLIENT_INFO.get(client) or {}).get("deviceId")
    for client in room.clients
  }
  if room.host_device_id not in active_ids:
    room.host_device_id = device_id
  elif room.host_device_id is None and requested_host:
    room.host_device_id = device_id

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
    replacement = next(iter(room.clients))
    replacement_info = CLIENT_INFO.get(replacement) or {}
    room.host_device_id = str(replacement_info.get("deviceId") or "")
    await broadcast(room, {
      "type": "host_changed",
      "code": room.code,
      "hostDeviceId": room.host_device_id
    })

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

  await safe_send(ws, {"type": "error", "message": f"Unknown type: {message_type}"})


async def server_handler(ws: WebSocketServerProtocol) -> None:
  try:
    async for message in ws:
      await handle_message(ws, message)
  except Exception:
    pass
  finally:
    await cleanup_client(ws)


async def main() -> None:
  parser = argparse.ArgumentParser(description="Mafia realtime WebSocket relay server")
  parser.add_argument("--host", default="0.0.0.0", help="Bind address (default: 0.0.0.0)")
  parser.add_argument("--port", type=int, default=8765, help="Bind port (default: 8765)")
  args = parser.parse_args()

  logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
  LOGGER.info("Starting realtime relay on ws://%s:%s", args.host, args.port)

  async with websockets.serve(server_handler, args.host, args.port, ping_interval=20, ping_timeout=20):
    await asyncio.Future()


if __name__ == "__main__":
  asyncio.run(main())
