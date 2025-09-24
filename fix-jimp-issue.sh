#!/bin/bash

echo "🔧 Fixing jimp-compact build issue..."

# Clear all caches
echo "📦 Clearing caches..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf /tmp/metro-*
rm -rf /tmp/haste-*

# Clear Expo cache specifically
echo "🧹 Clearing Expo cache..."
npx expo install --fix

# Clear Metro bundler cache
echo "🚇 Clearing Metro cache..."
npx expo start --clear --no-dev --minify

echo "✅ Cache clearing complete!"
echo ""
echo "🚀 Now try running your build command again:"
echo "   bun expo prebuild --no-install --platform ios"
echo ""
echo "If the issue persists, the problem might be with:"
echo "1. Image assets in ./assets/images/"
echo "2. Native dependencies requiring rebuild"
echo "3. Expo SDK version compatibility"