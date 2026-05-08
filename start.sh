#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PORT=18473

echo "Starting Praxis Console on port $PORT..."
echo "URL: http://localhost:$PORT"
echo ""

exec npm run dev
