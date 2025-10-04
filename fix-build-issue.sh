#!/bin/bash

echo "🔧 Fixing Expo build issues..."

# Step 1: Clear all caches
echo "📦 Clearing caches..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf /tmp/metro-*
rm -rf /tmp/haste-*
rm -rf ~/.expo/cache

# Step 2: Clear Metro cache
echo "🚇 Clearing Metro cache..."
npx expo start --clear --no-dev --minify 2>/dev/null || true
pkill -f "expo start" 2>/dev/null || true

# Step 3: Clear React Native cache
echo "⚛️ Clearing React Native cache..."
npx react-native start --reset-cache 2>/dev/null || true
pkill -f "react-native start" 2>/dev/null || true

# Step 4: Reinstall dependencies
echo "📦 Reinstalling dependencies..."
rm -rf node_modules
bun install

# Step 5: Fix Expo installation
echo "🔧 Fixing Expo installation..."
npx expo install --fix

# Step 6: Set environment variable to skip problematic image processing
echo "🖼️ Setting environment variables..."
export EXPO_IMAGE_UTILS_NO_SHARP=1
export EXPO_NO_DOTENV=1

# Step 7: Try prebuild with clear flag
echo "🏗️ Running prebuild..."
bun expo prebuild --no-install --platform ios --clear

echo "✅ Build fix complete!"
echo ""
echo "Next steps:"
echo "1. Try running: bun expo start"
echo "2. If still having issues, the app.json entitlements need to be fixed manually"
echo "3. The nested 'com' object in iOS entitlements should be flattened"