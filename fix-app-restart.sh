#!/bin/bash
set -e

echo "🔧 COMPREHENSIVE APP RESTART & CACHE CLEAR"
echo "=========================================="

# Kill all running processes aggressively
echo "🛑 Stopping all processes..."
pkill -f "rork" 2>/dev/null || true
pkill -f "expo" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
pkill -f "node.*start" 2>/dev/null || true
pkill -f "bun.*start" 2>/dev/null || true

# Kill processes on all possible ports
for port in 3000 8081 19000 19001 19002 19003 19004 19005; do
  lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
done

echo "✅ All processes stopped"

# Clear ALL possible caches
echo "🧹 Clearing comprehensive cache..."

# Node modules cache
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf node_modules/.cache/babel-loader 2>/dev/null || true
rm -rf node_modules/.cache/@babel 2>/dev/null || true

# Expo caches
rm -rf .expo 2>/dev/null || true
rm -rf ~/.expo 2>/dev/null || true

# Metro bundler caches
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/react-* 2>/dev/null || true
rm -rf /tmp/haste-map-* 2>/dev/null || true

# Babel caches
rm -rf ~/.babel-cache 2>/dev/null || true

# System temp files
rm -rf /tmp/expo-* 2>/dev/null || true
rm -rf /tmp/rork-* 2>/dev/null || true

# Package manager caches
npm cache clean --force 2>/dev/null || true
yarn cache clean 2>/dev/null || true
bun pm cache rm 2>/dev/null || true

echo "✅ All caches cleared"

# Wait for system to settle
echo "⏳ Waiting 5 seconds for system to settle..."
sleep 5

# Create babel.config.js if missing (copy from production)
if [ ! -f "babel.config.js" ] && [ -f "babel.config.production.js" ]; then
  echo "📝 Creating babel.config.js from production config..."
  cp babel.config.production.js babel.config.js
  echo "✅ babel.config.js created"
fi

echo "🚀 Starting app with completely fresh cache..."
echo "📱 This should resolve the restart issues!"
echo ""

# Start with maximum cache clearing
echo "💡 Running: bun run start --clear --reset-cache"
bun run start --clear --reset-cache