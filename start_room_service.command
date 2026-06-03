#!/bin/bash

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR" || exit 1

PYTHON_BIN=""
if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  echo "Python was not found on this system."
  echo "Install Python, then run this starter again."
  read -r -p "Press Enter to close..."
  exit 1
fi

exec "$PYTHON_BIN" server.py --open-page host
