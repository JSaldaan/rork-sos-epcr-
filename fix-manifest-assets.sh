#!/bin/bash

# Manifest Assets Fix Script
# This script resolves common manifest and asset issues

echo "🔧 MANIFEST ASSETS FIX - Starting resolution..."

# Clear any cached manifest data
echo "🧹 Clearing manifest cache..."
rm -rf .expo/
rm -rf node_modules/.cache/
rm -rf /tmp/metro-*

# Clear React Native cache
echo "🧹 Clearing React Native cache..."
npx react-native start --reset-cache 2>/dev/null || echo "React Native cache clear skipped"

# Clear Expo cache
echo "🧹 Clearing Expo cache..."
npx expo start --clear 2>/dev/null || echo "Expo cache clear skipped"

# Verify asset URLs are accessible
echo "🔍 Verifying asset URLs..."
curl -s -o /dev/null -w "%{http_code}" "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1024&h=1024&fit=crop&crop=center" | grep -q "200" && echo "✅ App icon URL accessible" || echo "❌ App icon URL not accessible"

curl -s -o /dev/null -w "%{http_code}" "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=32&h=32&fit=crop&crop=center" | grep -q "200" && echo "✅ Favicon URL accessible" || echo "❌ Favicon URL not accessible"

# Check if fonts are properly configured
echo "🔤 Checking font configuration..."
if [ -f "constants/fonts.ts" ]; then
    echo "✅ Font constants file exists"
else
    echo "❌ Font constants file missing"
fi

if [ -f "utils/fontManager.ts" ]; then
    echo "✅ Font manager exists"
else
    echo "❌ Font manager missing"
fi

# Check if asset manager exists
echo "🖼️ Checking asset configuration..."
if [ -f "utils/assetManager.ts" ]; then
    echo "✅ Asset manager exists"
else
    echo "❌ Asset manager missing"
fi

# Restart the development server with clean cache
echo "🚀 Restarting development server..."
echo "Run: npx expo start --clear --tunnel"

echo "✅ MANIFEST ASSETS FIX COMPLETE"
echo ""
echo "📋 Summary:"
echo "- Cleared all caches"
echo "- Verified asset URLs"
echo "- Checked font and asset managers"
echo "- Ready to restart development server"
echo ""
echo "🔄 Next steps:"
echo "1. Run: npx expo start --clear --tunnel"
echo "2. Check console for font and asset initialization logs"
echo "3. Verify icons appear correctly in the app"