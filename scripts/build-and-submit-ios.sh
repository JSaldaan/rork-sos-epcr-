#!/usr/bin/env bash
set -euo pipefail

# Build and submit iOS via EAS
# Prereqs: npm i -g @expo/eas-cli, login to EAS, configured credentials

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$ROOT_DIR"

if ! command -v eas >/dev/null 2>&1; then
  echo "EAS CLI not found. Install with: npm i -g @expo/eas-cli" >&2
  exit 1
fi

# Clear babel cache if script exists
if [ -f "./clear-babel-cache.sh" ]; then
  ./clear-babel-cache.sh || true
fi

# Start Expo once to hydrate caches (optional, non-blocking)
if command -v bun >/dev/null 2>&1; then
  (bun expo start --clear >/dev/null 2>&1 &) && sleep 5 && pkill -f "expo start" || true
else
  (npx expo start --clear >/dev/null 2>&1 &) && sleep 5 && pkill -f "expo start" || true
fi

# Configure and build
npm run eas:configure || true
npm run build:ios

# Submit to App Store Connect (requires configured credentials)
npm run submit:ios
