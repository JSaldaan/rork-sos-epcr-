#!/bin/bash

# EMERGENCY FIX - Immediate Server Restart
echo "🚨 EMERGENCY FIX INITIATED"
echo "========================"
echo "⏱️ Server will restart in 3 seconds..."
echo ""

# Countdown
for i in 3 2 1; do
  echo "⏰ $i..."
  sleep 1
done

echo "🚀 STARTING EMERGENCY FIX PROCESS"
echo ""

# Step 1: Kill all processes
echo "🛑 Terminating all development processes..."
pkill -f "rork" 2>/dev/null || true
pkill -f "expo" 2>/dev/null || true  
pkill -f "metro" 2>/dev/null || true
pkill -f "webpack" 2>/dev/null || true
pkill -f "node.*start" 2>/dev/null || true
pkill -f "bunx.*rork" 2>/dev/null || true

# Kill processes on ports
for port in 3000 8081 19000 19001 19002 8000 4000 5000 3001; do
  lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
  echo "✅ Freed port $port"
done

echo "✅ All processes terminated"
echo ""

# Step 2: Clear caches aggressively
echo "🧹 AGGRESSIVE CACHE CLEARING..."

# Project caches
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

echo "✅ Project caches cleared"

# Package manager caches
npm cache clean --force 2>/dev/null && echo "✅ NPM cache cleared" || echo "⚠️  NPM cache clear failed"
yarn cache clean 2>/dev/null && echo "✅ Yarn cache cleared" || true
bun pm cache rm 2>/dev/null && echo "✅ Bun cache cleared" || true

echo "✅ Package manager caches cleared"
echo ""

# Step 3: Wait for cleanup
echo "⏳ Waiting for cleanup to complete..."
sleep 3

# Step 4: Start fresh server
echo "🚀 STARTING FRESH SERVER..."
echo "📱 The app will be available shortly..."
echo "🔧 All configuration changes will take effect"
echo ""

# Start the server with maximum cache clearing
exec bunx rork start -p mrjfx7h4qr7c2x9p43htd --tunnel --clear