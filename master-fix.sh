#!/bin/bash
set -e

echo "🚀 MASTER APP FIX & RESTART SCRIPT"
echo "=================================="
echo "This script will fix all common app restart issues"
echo ""

# Make scripts executable
chmod +x fix-babel-config.sh 2>/dev/null || true
chmod +x fix-app-restart.sh 2>/dev/null || true
chmod +x diagnose-restart-issues.sh 2>/dev/null || true
chmod +x clear-babel-cache.sh 2>/dev/null || true

echo "🔍 Step 1: Running diagnostics..."
./diagnose-restart-issues.sh

echo ""
echo "🔧 Step 2: Fixing babel configuration..."
./fix-babel-config.sh

echo ""
echo "🧹 Step 3: Clearing all caches..."
./clear-babel-cache.sh

echo ""
echo "🚀 Step 4: Starting app with fresh configuration..."
echo "   The app preview should now restart properly!"
echo ""

# Final restart with all fixes applied
bun run start --clear --reset-cache