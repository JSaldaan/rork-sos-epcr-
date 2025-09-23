#!/bin/bash

echo "🚀 RESTARTING SERVER WITH CACHE CLEAR"
echo "====================================="

# Kill existing processes
echo "🛑 Stopping existing processes..."
pkill -f "expo" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
pkill -f "node.*start" 2>/dev/null || true

# Clear caches including Babel
echo "🧹 Clearing all caches including Babel..."

# Babel cache
rm -rf node_modules/.cache/babel-loader 2>/dev/null || true
rm -rf node_modules/.cache/@babel 2>/dev/null || true
rm -rf ~/.babel-cache 2>/dev/null || true

# Project caches
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/react-* 2>/dev/null || true
rm -rf /tmp/haste-map-* 2>/dev/null || true

# Package manager caches
npm cache clean --force 2>/dev/null || true
bun pm cache rm 2>/dev/null || true

echo "✅ Caches cleared"
echo "🚀 Starting fresh server..."

# Start with expo CLI
exec npx expo start --tunnel --clear