#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PARENT_DIR="$(dirname "$ROOT_DIR")"
PROJECT_NAME="$(basename "$ROOT_DIR")"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUTPUT_PATH="${PARENT_DIR}/${PROJECT_NAME}-backup-${STAMP}.tar.gz"

tar \
  --exclude='.git' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  -czf "$OUTPUT_PATH" \
  -C "$PARENT_DIR" \
  "$PROJECT_NAME"

echo "Backup created: $OUTPUT_PATH"
