#!/bin/bash
set -e

echo "🚀 RESTARTING EXPO APP WITH CACHE CLEAR"
echo "======================================="

# Kill all running processes
echo "🛑 Stopping all processes..."
pkill -f "rork" 2>/dev/null || true
pkill -f "expo" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
pkill -f "node.*start" 2>/dev/null || true

# Kill processes on common ports
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:8081 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:19000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:19001 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:19002 2>/dev/null | xargs kill -9 2>/dev/null || true

echo "✅ Processes stopped"

# Clear all caches
echo "🧹 Clearing all caches..."
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .expo 2>/dev/null || true
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/react-* 2>/dev/null || true
rm -rf /tmp/haste-map-* 2>/dev/null || true

echo "✅ Caches cleared"

# Wait a moment
echo "⏳ Waiting 2 seconds..."
sleep 2

# Start the app with cache clear
echo "🚀 Starting app with fresh cache..."
echo "📱 The app should now work properly!"

# Use the existing start script from package.json
bun run start --clear