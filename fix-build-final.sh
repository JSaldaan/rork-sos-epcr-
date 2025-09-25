#!/bin/bash

echo "🔧 Final build fix - cleaning everything..."

# Remove all cache directories
echo "🗑️  Clearing all caches..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf dist
rm -rf .next
rm -rf .metro

# Clear npm/yarn/bun cache
echo "🗑️  Clearing package manager cache..."
if command -v bun &> /dev/null; then
    bun pm cache rm
elif command -v yarn &> /dev/null; then
    yarn cache clean
else
    npm cache clean --force
fi

# Clear Metro bundler cache
echo "🗑️  Clearing Metro cache..."
npx expo r -c || npx react-native start --reset-cache || echo "Metro cache clear attempted"

# Reinstall dependencies
echo "📦 Reinstalling dependencies..."
rm -rf node_modules
if command -v bun &> /dev/null; then
    bun install
elif command -v yarn &> /dev/null; then
    yarn install
else
    npm install
fi

echo "✅ Build fix complete!"
echo ""
echo "Now try running:"
echo "  expo start --clear"
echo "  or"
echo "  npx expo prebuild --platform ios --clean"