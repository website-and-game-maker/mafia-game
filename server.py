#!/usr/bin/env python3
"""
Unified local backend for the Mafia web app.

Starts:
1) static HTTP hosting for the web client
2) realtime WebSocket relay for multi-device rooms

Usage:
  python server.py
  python server.py --host 0.0.0.0 --port 8000 --relay-host 0.0.0.0 --relay-port 8765
"""

from __future__ import annotations

import argparse
import json
import os
import signal
import socket
import subprocess
import sys
import threading
import time
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parent


def normalize_base_url(raw: str) -> str:
  value = str(raw or "").strip()
  if not value:
    return ""
  try:
    parsed = urlsplit(value if "://" in value else f"http://{value}")
  except Exception:
    return ""
  if parsed.scheme not in {"http", "https"} or not parsed.netloc:
    return ""
  path = parsed.path or "/"
  if not path.endswith("/"):
    path = f"{path}/"
  return f"{parsed.scheme}://{parsed.netloc}{path}"


def format_base_url(host: str, port: int, path: str = "/") -> str:
  safe_host = str(host or "").strip()
  if not safe_host:
    safe_host = "127.0.0.1"
  base_path = path if str(path or "/").startswith("/") else f"/{path}"
  if not base_path.endswith("/"):
    base_path = f"{base_path}/"
  return normalize_base_url(f"http://{safe_host}:{int(port)}{base_path}")


def parse_request_host(host_header: str, default_port: int) -> tuple[str, int]:
  value = str(host_header or "").strip()
  if not value:
    return ("", int(default_port))
  try:
    parsed = urlsplit(f"http://{value}")
    host = parsed.hostname or ""
    port = int(parsed.port or default_port)
    return (host, port)
  except Exception:
    return (value.split(":", 1)[0].strip(), int(default_port))


def detect_lan_ip() -> str:
  try:
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as probe:
      probe.connect(("8.8.8.8", 80))
      ip = str(probe.getsockname()[0] or "").strip()
      if ip and not ip.startswith("127."):
        return ip
  except Exception:
    pass

  try:
    host_ip = str(socket.gethostbyname(socket.gethostname()) or "").strip()
    if host_ip and not host_ip.startswith("127."):
      return host_ip
  except Exception:
    pass
  return ""


def build_network_info(
  request_host_header: str,
  bind_host: str,
  port: int,
  lan_ip: str,
  public_base_url: str,
  relay_running: bool = False
) -> dict:
  request_host, request_port = parse_request_host(request_host_header, port)
  current_url = format_base_url(request_host or "127.0.0.1", request_port, "/")
  localhost_url = format_base_url("127.0.0.1", port, "/")
  lan_url = format_base_url(lan_ip, port, "/") if lan_ip else ""
  public_url = normalize_base_url(public_base_url)

  variants: list[dict] = []

  def add_variant(label: str, url: str) -> None:
    normalized = normalize_base_url(url)
    if not normalized:
      return
    if any(item["url"] == normalized for item in variants):
      return
    variants.append({"label": label, "url": normalized})

  add_variant("This device URL", current_url)
  add_variant("Localhost URL", localhost_url)
  add_variant("Local network URL", lan_url)
  add_variant("Public URL", public_url)

  host_lower = (request_host or bind_host or "").lower()
  local_bind = host_lower in {"127.0.0.1", "localhost", "0.0.0.0", "::1", "::"}
  local_request = host_lower.startswith("127.") or host_lower == "localhost"
  if local_bind or local_request:
    preferred = lan_url or public_url or current_url
  else:
    preferred = current_url or public_url or localhost_url
  preferred = normalize_base_url(preferred) or current_url

  alternates = [item for item in variants if item["url"] != preferred]
  return {
    "preferredPortalUrl": preferred,
    "alternatePortalUrls": alternates,
    "originPortalUrl": current_url,
    "lanPortalUrl": lan_url,
    "localhostPortalUrl": localhost_url,
    "publicPortalUrl": public_url,
    "backendDetected": True,
    "relayRunning": bool(relay_running)
  }


class MafiaRequestHandler(SimpleHTTPRequestHandler):
  root_dir = str(ROOT)
  bind_host = "127.0.0.1"
  http_port = 8000
  lan_ip = ""
  public_base_url = ""
  relay_host = "0.0.0.0"
  relay_port = 8765
  relay_process: subprocess.Popen | None = None
  relay_error = ""
  relay_lock = threading.Lock()

  def __init__(self, *args, **kwargs):  # type: ignore[no-untyped-def]
    super().__init__(*args, directory=self.root_dir, **kwargs)

  @classmethod
  def relay_running(cls) -> bool:
    process = cls.relay_process
    return process is not None and process.poll() is None

  @classmethod
  def ensure_relay_running(cls) -> tuple[bool, str]:
    with cls.relay_lock:
      if cls.relay_running():
        cls.relay_error = ""
        return True, ""
      try:
        cls.relay_process = start_relay(cls.relay_host, cls.relay_port)
        cls.relay_error = ""
        return True, ""
      except Exception as error:  # noqa: BLE001
        cls.relay_process = None
        cls.relay_error = str(error)
        return False, cls.relay_error

  def send_api_json(self, payload: dict, status: int = 200) -> None:
    encoded = json.dumps(payload).encode("utf-8")
    self.send_response(status)
    self.send_header("Content-Type", "application/json; charset=utf-8")
    self.send_header("Cache-Control", "no-store")
    self.send_header("Access-Control-Allow-Origin", "*")
    self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
    self.send_header("Access-Control-Allow-Headers", "Content-Type")
    self.send_header("Content-Length", str(len(encoded)))
    self.end_headers()
    self.wfile.write(encoded)

  def do_OPTIONS(self) -> None:  # type: ignore[override]
    if self.path.split("?", 1)[0].startswith("/api/"):
      self.send_response(204)
      self.send_header("Access-Control-Allow-Origin", "*")
      self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
      self.send_header("Access-Control-Allow-Headers", "Content-Type")
      self.send_header("Cache-Control", "no-store")
      self.end_headers()
      return
    super().do_OPTIONS()

  def do_GET(self) -> None:  # type: ignore[override]
    path = self.path.split("?", 1)[0]

    if path == "/api/network-info":
      payload = build_network_info(
        request_host_header=self.headers.get("Host", ""),
        bind_host=self.bind_host,
        port=self.http_port,
        lan_ip=self.lan_ip,
        public_base_url=self.public_base_url,
        relay_running=self.relay_running()
      )
      if self.relay_error:
        payload["relayError"] = self.relay_error
      self.send_api_json(payload, 200)
      return

    if path == "/api/ensure-backend":
      ok, error = self.ensure_relay_running()
      payload = build_network_info(
        request_host_header=self.headers.get("Host", ""),
        bind_host=self.bind_host,
        port=self.http_port,
        lan_ip=self.lan_ip,
        public_base_url=self.public_base_url,
        relay_running=ok
      )
      payload["relayReady"] = ok
      if error:
        payload["relayError"] = error
      self.send_api_json(payload, 200 if ok else 503)
      return

    if path == "/api/health":
      self.send_api_json({
        "ok": True,
        "backendDetected": True,
        "relayRunning": self.relay_running(),
        "relayError": self.relay_error
      }, 200)
      return
    super().do_GET()


def get_relay_python_executable() -> str:
  candidates = [
    ROOT / "venv" / "bin" / "python3.12",
    ROOT / "venv" / "bin" / "python3",
    ROOT / "venv" / "bin" / "python",
  ]
  for candidate in candidates:
    if candidate.exists():
      return str(candidate)
  return sys.executable


def start_relay(relay_host: str, relay_port: int) -> subprocess.Popen:
  relay_script = ROOT / "scripts" / "realtime_server.py"
  relay_python = get_relay_python_executable()
  cmd = [relay_python, str(relay_script), "--host", relay_host, "--port", str(relay_port)]
  process = subprocess.Popen(cmd, cwd=str(ROOT))
  time.sleep(0.2)
  if process.poll() is not None:
    raise RuntimeError("Realtime relay failed to start. Check scripts/realtime_server.py output.")
  return process


def stop_process(process: subprocess.Popen | None) -> None:
  if process is None or process.poll() is not None:
    return
  process.terminate()
  try:
    process.wait(timeout=3)
  except subprocess.TimeoutExpired:
    process.kill()
    process.wait(timeout=2)


def main() -> None:
  parser = argparse.ArgumentParser(description="Run Mafia local backend (HTTP + relay).")
  parser.add_argument("--host", default="0.0.0.0", help="HTTP bind host (default: 0.0.0.0)")
  parser.add_argument("--port", type=int, default=8000, help="HTTP bind port (default: 8000)")
  parser.add_argument("--relay-host", default="0.0.0.0", help="Relay bind host (default: 0.0.0.0)")
  parser.add_argument("--relay-port", type=int, default=8765, help="Relay bind port (default: 8765)")
  parser.add_argument("--public-base-url", default=os.environ.get("MAFIA_PUBLIC_BASE_URL", ""), help="Optional externally reachable base URL (e.g. tunnel URL)")
  parser.add_argument("--no-relay", action="store_true", help="Start only HTTP server")
  parser.add_argument("--open-page", choices=["index", "host", "join", "solo"], default="", help="Open a page in the default browser after startup")
  args = parser.parse_args()

  relay_process: subprocess.Popen | None = None
  relay_error = ""
  try:
    if not args.no_relay:
      try:
        relay_process = start_relay(args.relay_host, args.relay_port)
      except Exception as error:  # noqa: BLE001
        relay_error = str(error)
        relay_process = None

    lan_ip = detect_lan_ip()
    MafiaRequestHandler.root_dir = str(ROOT)
    MafiaRequestHandler.bind_host = args.host
    MafiaRequestHandler.http_port = args.port
    MafiaRequestHandler.lan_ip = lan_ip
    MafiaRequestHandler.public_base_url = normalize_base_url(args.public_base_url)
    MafiaRequestHandler.relay_host = args.relay_host
    MafiaRequestHandler.relay_port = args.relay_port
    MafiaRequestHandler.relay_process = relay_process
    MafiaRequestHandler.relay_error = relay_error

    httpd = ThreadingHTTPServer((args.host, args.port), MafiaRequestHandler)

    local_url = format_base_url("127.0.0.1", args.port, "/")
    lan_url = format_base_url(lan_ip, args.port, "/") if lan_ip else ""
    preferred_info = build_network_info(
      "localhost",
      args.host,
      args.port,
      lan_ip,
      MafiaRequestHandler.public_base_url,
      relay_running=MafiaRequestHandler.relay_running()
    )
    preferred_portal = preferred_info.get("preferredPortalUrl") or local_url

    print(f"[backend] HTTP bind: {args.host}:{args.port}")
    print(f"[backend] Open on this device: {local_url}")
    if lan_url:
      print(f"[backend] Local-network URL: {lan_url}")
    if MafiaRequestHandler.public_base_url:
      print(f"[backend] Public URL: {MafiaRequestHandler.public_base_url}")
    print(f"[backend] Preferred join portal URL: {preferred_portal}")
    print(f"[backend] Main page: {local_url}index.html")
    print(f"[backend] Solo page: {local_url}solo.html")
    print(f"[backend] Host page: {local_url}host.html")
    print(f"[backend] Join page: {local_url}join.html")
    print("[backend] Share hints API: /api/network-info")
    print("[backend] Ensure API: /api/ensure-backend")
    if relay_process:
      print(f"[backend] Realtime relay: ws://{args.relay_host}:{args.relay_port}")
    elif relay_error:
      print(f"[backend] Realtime relay unavailable: {relay_error}")
      print("[backend] Multiplayer relay requires `pip install websockets`.")
    print("[backend] Press Ctrl+C to stop.")

    if args.open_page:
      page_name = "index.html" if args.open_page == "index" else f"{args.open_page}.html"
      webbrowser.open(f"{local_url}{page_name}")

    def handle_term(_signum, _frame):  # type: ignore[no-untyped-def]
      raise KeyboardInterrupt

    signal.signal(signal.SIGTERM, handle_term)

    try:
      httpd.serve_forever()
    except KeyboardInterrupt:
      pass
    finally:
      httpd.server_close()
  finally:
    stop_process(MafiaRequestHandler.relay_process or relay_process)


if __name__ == "__main__":
  main()
