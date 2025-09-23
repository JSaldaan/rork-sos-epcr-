# Bundling Error Fix Guide

## 🔍 Identified Issue

Based on your app.json file, the bundling error is caused by **malformed entitlements structure** in the iOS configuration.

## ❌ Current Problem

Your `app.json` has this malformed structure:

```json
"entitlements": {
  "com.apple.developer.networking.wifi-info": true,
  "com": {
    "apple": {
      "developer": {
        "networking": {
          "wifi-info": true
        }
      }
    }
  }
}
```

This creates a **duplicate key conflict** - the same entitlement is defined both as a flat key and as a nested object structure.

## ✅ Solution

**Step 1: Fix app.json**

Open your `app.json` file and find the `entitlements` section under `expo.ios`. Replace the entire entitlements object with:

```json
"entitlements": {
  "com.apple.developer.networking.wifi-info": true
}
```

**Step 2: Clear cache and restart**

After fixing the app.json:

```bash
# Clear Expo cache
npx expo start --clear

# Or if that doesn't work, clear everything:
rm -rf node_modules
npm install
npx expo start --clear
```

## 🛠️ Alternative Solutions

If the above doesn't work, try these steps in order:

### 1. Reset Metro Cache
```bash
npx expo start --clear
npx react-native start --reset-cache
```

### 2. Clean Install
```bash
rm -rf node_modules
rm -rf .expo
npm install
```

### 3. Check for TypeScript Errors
Run the diagnostic script:
```bash
node fix-bundling-error.js
```

### 4. Verify Dependencies
Make sure all your dependencies are compatible:
- React Native 0.79.1
- Expo SDK 53
- All other packages should be compatible with these versions

## 🔧 Manual Fix Instructions

If you can't edit app.json directly:

1. **Backup your current app.json**
2. **Create a new app.json** with the correct structure
3. **Copy all other configurations** except the malformed entitlements
4. **Test the build**

## 📱 Expected Result

After fixing, your app should:
- ✅ Bundle successfully
- ✅ Start without errors
- ✅ Run on both iOS and Android
- ✅ Maintain all existing functionality

## 🚨 If Still Having Issues

1. **Check Metro logs** for specific error messages
2. **Verify all imports** are correct
3. **Check for circular dependencies**
4. **Ensure all required files exist**

## 📞 Need Help?

If you're still experiencing issues after trying these solutions:
1. Share the exact error message from Metro bundler
2. Check if any recent changes were made to configuration files
3. Verify that all team members have the same Node.js version

---

**Quick Fix Summary:**
The main issue is in your `app.json` file - remove the nested `"com"` object from the entitlements and keep only the flat structure.