#!/bin/bash

# MediCare Pro - Emergency Cache Clear & Server Restart
# Run this script when experiencing navigation or mounting issues

echo "🚀 MediCare Pro - Emergency Restart"
echo "=================================="

# Step 1: Kill all related processes
echo "🛑 Stopping all running processes..."
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

# Step 2: Clear all caches including Babel
echo "🧹 Clearing all caches including Babel..."

# Babel cache
rm -rf node_modules/.cache/babel-loader 2>/dev/null || true
rm -rf node_modules/.cache/@babel 2>/dev/null || true
rm -rf ~/.babel-cache 2>/dev/null || true

# Project caches
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .next 2>/dev/null || true
rm -rf dist 2>/dev/null || true
rm -rf build 2>/dev/null || true
rm -rf .rork 2>/dev/null || true

# Metro bundler cache
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/react-* 2>/dev/null || true
rm -rf /tmp/expo-* 2>/dev/null || true
rm -rf /tmp/haste-map-* 2>/dev/null || true

# Package manager caches
npm cache clean --force 2>/dev/null || true
yarn cache clean 2>/dev/null || true
bun pm cache rm 2>/dev/null || true

echo "✅ Caches cleared"

# Step 3: Wait for cleanup
echo "⏳ Waiting for cleanup to complete..."
sleep 3

# Step 4: Restart server
echo "🚀 Starting fresh server..."
echo "📱 The app will be available shortly..."
echo ""

# Start the server
bunx rork start -p mrjfx7h4qr7c2x9p43htd --tunnel