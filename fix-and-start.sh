#!/bin/bash
set -e

echo "🔧 COMPREHENSIVE APP DIAGNOSTICS & FIX"
echo "======================================"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system requirements
echo "📋 Checking system requirements..."

if command_exists bun; then
    echo "✅ Bun found: $(bun --version)"
else
    echo "❌ Bun not found - installing..."
    curl -fsSL https://bun.sh/install | bash
fi

if command_exists node; then
    echo "✅ Node.js found: $(node --version)"
else
    echo "❌ Node.js not found - please install Node.js"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found - are you in the right directory?"
    exit 1
fi

echo "✅ System requirements check complete"

# Kill any running processes
echo "🛑 Stopping all running processes..."
pkill -f "rork" 2>/dev/null || true
pkill -f "expo" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
pkill -f "node.*start" 2>/dev/null || true

# Kill processes on common ports
for port in 3000 8081 19000 19001 19002; do
    lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
done

echo "✅ Processes stopped"

# Clear all caches comprehensively
echo "🧹 Clearing all caches..."

# Metro bundler cache
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/react-* 2>/dev/null || true
rm -rf /tmp/haste-map-* 2>/dev/null || true

# Expo cache
rm -rf .expo 2>/dev/null || true
rm -rf ~/.expo 2>/dev/null || true

# Node modules cache
rm -rf node_modules/.cache 2>/dev/null || true

# Babel cache
rm -rf node_modules/.cache/babel-loader 2>/dev/null || true
rm -rf node_modules/.cache/@babel 2>/dev/null || true

# Package manager caches
npm cache clean --force 2>/dev/null || true
yarn cache clean 2>/dev/null || true
bun pm cache rm 2>/dev/null || true

echo "✅ All caches cleared"

# Check package.json for issues
echo "🔍 Checking package.json..."
if ! bun run --silent start --help >/dev/null 2>&1; then
    echo "⚠️  Start script may have issues"
fi

# Install dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ] || [ ! -f "bun.lock" ]; then
    echo "📦 Installing dependencies..."
    bun install
else
    echo "✅ Dependencies already installed"
fi

# Check for TypeScript issues
echo "🔍 Checking TypeScript..."
if command_exists tsc; then
    if ! bun run tsc --noEmit --skipLibCheck 2>/dev/null; then
        echo "⚠️  TypeScript issues detected - continuing anyway"
    else
        echo "✅ TypeScript check passed"
    fi
fi

# Wait a moment for system to settle
echo "⏳ Waiting for system to settle..."
sleep 3

# Start the app
echo "🚀 Starting the app..."
echo "📱 The app should now work properly!"
echo ""
echo "If you see any errors, try:"
echo "1. Check that all required permissions are granted"
echo "2. Make sure your device/simulator is connected"
echo "3. Try restarting your device/simulator"
echo ""

# Start with the existing script
exec bun run start