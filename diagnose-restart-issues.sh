#!/bin/bash
set -e

echo "🔍 APP RESTART DIAGNOSTICS"
echo "========================="

# Check for common issues
echo "📋 Checking for common restart issues..."

# Check if babel.config.js exists
if [ -f "babel.config.js" ]; then
  echo "✅ babel.config.js exists"
else
  echo "❌ babel.config.js missing"
  if [ -f "babel.config.production.js" ]; then
    echo "📝 Found babel.config.production.js - will copy to babel.config.js"
  fi
fi

# Check app.json syntax
echo "🔍 Checking app.json syntax..."
if node -e "JSON.parse(require('fs').readFileSync('app.json', 'utf8'))" 2>/dev/null; then
  echo "✅ app.json syntax is valid"
else
  echo "❌ app.json has syntax errors"
fi

# Check for duplicate entitlements in app.json
echo "🔍 Checking for duplicate entitlements..."
if grep -q '"com.apple.developer.networking.wifi-info": true' app.json && grep -q '"com": {' app.json; then
  echo "❌ Found duplicate entitlements in app.json"
  echo "   This can prevent the app from restarting properly"
else
  echo "✅ No duplicate entitlements found"
fi

# Check for running processes
echo "🔍 Checking for running processes..."
if pgrep -f "rork\|expo\|metro" > /dev/null; then
  echo "❌ Found running processes that might interfere:"
  pgrep -f "rork\|expo\|metro" | while read pid; do
    ps -p $pid -o pid,command
  done
else
  echo "✅ No interfering processes found"
fi

# Check for locked ports
echo "🔍 Checking for locked ports..."
for port in 3000 8081 19000 19001 19002; do
  if lsof -ti:$port > /dev/null 2>&1; then
    echo "❌ Port $port is in use"
  else
    echo "✅ Port $port is available"
  fi
done

# Check cache directories
echo "🔍 Checking cache directories..."
cache_dirs=("node_modules/.cache" ".expo" "/tmp/metro-*" "/tmp/react-*")
for dir in "${cache_dirs[@]}"; do
  if ls $dir > /dev/null 2>&1; then
    echo "❌ Cache directory exists: $dir"
  else
    echo "✅ Cache directory clean: $dir"
  fi
done

echo ""
echo "🔧 RECOMMENDED ACTIONS:"
echo "1. Run: ./fix-app-restart.sh"
echo "2. If app.json has duplicate entitlements, manually fix them"
echo "3. Ensure babel.config.js exists in root directory"
echo "4. Clear all caches before restarting"
echo ""