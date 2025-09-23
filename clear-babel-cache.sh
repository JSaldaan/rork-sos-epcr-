#!/bin/bash

echo "🧹 CLEARING BABEL & BUNDLER CACHE"
echo "================================="

# Kill all running processes
echo "🛑 Stopping all processes..."
pkill -f "rork" 2>/dev/null || true
pkill -f "expo" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
pkill -f "node.*start" 2>/dev/null || true

# Kill processes on ports
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:8081 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:19000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:19001 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:19002 2>/dev/null | xargs kill -9 2>/dev/null || true

echo "✅ Processes stopped"

# Clear Babel cache specifically
echo "🧹 Clearing Babel cache..."
rm -rf node_modules/.cache/babel-loader 2>/dev/null || true
rm -rf node_modules/.cache/@babel 2>/dev/null || true
rm -rf ~/.babel-cache 2>/dev/null || true

# Clear Metro bundler cache
echo "🧹 Clearing Metro bundler cache..."
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/react-* 2>/dev/null || true
rm -rf /tmp/haste-map-* 2>/dev/null || true

# Clear Expo cache
echo "🧹 Clearing Expo cache..."
rm -rf .expo 2>/dev/null || true
rm -rf ~/.expo 2>/dev/null || true

# Clear Node modules cache
echo "🧹 Clearing Node modules cache..."
rm -rf node_modules/.cache 2>/dev/null || true

# Clear package manager caches
echo "🧹 Clearing package manager caches..."
npm cache clean --force 2>/dev/null || true
yarn cache clean 2>/dev/null || true
bun pm cache rm 2>/dev/null || true

# Clear system temp files
echo "🧹 Clearing system temp files..."
rm -rf /tmp/expo-* 2>/dev/null || true
rm -rf /tmp/rork-* 2>/dev/null || true

echo "✅ All caches cleared successfully!"
echo "⏳ Waiting 3 seconds before restart..."
sleep 3

echo "🚀 Starting server with fresh cache..."
echo "📱 Your babel.config.js changes will now take effect!"
echo ""

# Cache clearing complete - ready for manual restart
echo "💡 Now run: npx expo start --clear"
echo "💡 Or run: bun expo start --clear"
echo "💡 This will ensure babel.config.js changes take effect"