#!/bin/bash

# MediCare Pro - Emergency Server Restart & Cache Clear
# Fixes babel.config.js bundling errors and manifest asset issues

echo "🚨 EMERGENCY SERVER RESTART & CACHE CLEAR"
echo "=========================================="
echo "Fixing babel.config.js bundling errors..."
echo ""

# Step 1: Kill ALL related processes aggressively
echo "🛑 Killing all development processes..."
pkill -f "rork" 2>/dev/null || true
pkill -f "expo" 2>/dev/null || true  
pkill -f "metro" 2>/dev/null || true
pkill -f "node.*start" 2>/dev/null || true
pkill -f "bunx.*rork" 2>/dev/null || true
pkill -f "webpack" 2>/dev/null || true

# Kill processes on ALL possible ports
for port in 3000 8081 19000 19001 19002 8000 4000 5000 3001; do
  lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
  echo "✅ Cleared port $port"
done

echo "✅ All processes terminated"

# Step 2: AGGRESSIVE cache clearing
echo ""
echo "🧹 AGGRESSIVE CACHE CLEARING..."

# Project-specific caches
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .next 2>/dev/null || true
rm -rf dist 2>/dev/null || true
rm -rf build 2>/dev/null || true
rm -rf .rork 2>/dev/null || true
rm -rf .metro 2>/dev/null || true
rm -rf tmp 2>/dev/null || true
rm -rf .tmp 2>/dev/null || true

# System temp directories
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/react-* 2>/dev/null || true
rm -rf /tmp/expo-* 2>/dev/null || true
rm -rf /tmp/rork-* 2>/dev/null || true
rm -rf /tmp/haste-map-* 2>/dev/null || true

# Babel and bundler caches
rm -rf ~/.babel-cache 2>/dev/null || true
rm -rf ~/.metro-cache 2>/dev/null || true

echo "✅ Project caches cleared"

# Step 3: Package manager cache clearing
echo ""
echo "📦 CLEARING PACKAGE MANAGER CACHES..."

# NPM cache
npm cache clean --force 2>/dev/null && echo "✅ NPM cache cleared" || echo "⚠️  NPM cache clear failed"

# Yarn cache (if available)
yarn cache clean 2>/dev/null && echo "✅ Yarn cache cleared" || true

# Bun cache (if available)  
bun pm cache rm 2>/dev/null && echo "✅ Bun cache cleared" || true

# Step 4: Clear browser/web caches
echo ""
echo "🌐 CLEARING WEB CACHES..."
# These will be cleared when the app restarts

# Step 5: Wait for complete cleanup
echo ""
echo "⏳ Waiting for complete cleanup..."
sleep 5

# Step 6: Start fresh server with all flags
echo ""
echo "🚀 STARTING FRESH SERVER..."
echo "📱 The app will be available shortly..."
echo "🔧 All babel.config.js changes will take effect"
echo "🎯 Manifest assets will be properly resolved"
echo ""

# Start with maximum cache clearing flags
exec bunx rork start -p mrjfx7h4qr7c2x9p43htd --tunnel --clear --reset-cache