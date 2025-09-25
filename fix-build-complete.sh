#!/bin/bash

echo "🔧 Fixing Expo build issues..."

# Step 1: Clean all caches and dependencies
echo "📦 Cleaning dependencies and caches..."
rm -rf node_modules
rm -rf .expo
rm -rf dist
rm -rf .next
rm -f bun.lockb
rm -f package-lock.json
rm -f yarn.lock

# Step 2: Clear Expo and Metro caches
echo "🧹 Clearing Expo caches..."
npx expo install --fix
npx expo r -c

# Step 3: Reinstall dependencies
echo "📥 Reinstalling dependencies..."
bun install

# Step 4: Create backup of current app.json
echo "💾 Creating backup of app.json..."
cp app.json app.json.backup

echo "✅ Build fix complete!"
echo ""
echo "🔧 MANUAL STEP REQUIRED:"
echo "Please update your app.json with the following image URLs to fix the Jimp errors:"
echo ""
echo "Replace these lines in app.json:"
echo '  "icon": "./assets/images/icon.png",'
echo "With:"
echo '  "icon": "https://r2-pub.rork.com/generated-images/3af20b6b-1cc8-4fe7-b4b8-a15ea0a12cc4.png",'
echo ""
echo '  "image": "./assets/images/splash-icon.png",'
echo "With:"
echo '  "image": "https://r2-pub.rork.com/generated-images/3fc92ae6-d4e2-4a33-8b35-2fd217d88b92.png",'
echo ""
echo '  "foregroundImage": "./assets/images/adaptive-icon.png",'
echo "With:"
echo '  "foregroundImage": "https://r2-pub.rork.com/generated-images/759a0880-99c8-469e-8462-c0279ef3d7c0.png",'
echo ""
echo '  "favicon": "./assets/images/favicon.png"'
echo "With:"
echo '  "favicon": "https://r2-pub.rork.com/generated-images/c243373a-d381-4a0a-a630-6cfb76f49a96.png"'
echo ""
echo "After making these changes, run: bun start"