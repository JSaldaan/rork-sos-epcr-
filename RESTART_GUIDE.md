# Development Server Restart Guide

## How to Restart the Development Server

### Method 1: Terminal Commands
1. **Stop the current server**: Press `Ctrl + C` (or `Cmd + C` on Mac) in the terminal
2. **Clear cache and restart**: Run one of these commands:
   ```bash
   # Clear cache and restart
   bun start --clear
   
   # Or use the existing start command
   bun start
   
   # For web development
   bun run start-web
   ```

### Method 2: Using Expo CLI
1. **Stop the server**: Press `Ctrl + C`
2. **Clear Expo cache**: 
   ```bash
   npx expo start --clear
   ```

### Method 3: Full Reset (if issues persist)
1. **Stop the server**: Press `Ctrl + C`
2. **Clear all caches**:
   ```bash
   # Clear npm/bun cache
   bun install --force
   
   # Clear Expo cache
   npx expo start --clear
   
   # Clear React Native cache (if needed)
   npx react-native start --reset-cache
   ```

### Method 4: Complete Clean Restart
If you're experiencing persistent issues:
```bash
# Stop server
# Delete node_modules and reinstall
rm -rf node_modules
bun install

# Clear all caches and restart
npx expo start --clear
```

## Common Issues and Solutions

### Issue: "Only logo is popping out in TestFlight"
This has been fixed with the recent updates to:
- Simplified app initialization for iOS
- Reduced memory usage in the store
- Optimized splash screen handling
- Better error handling for iOS

### Issue: App crashes on iOS
The following optimizations have been implemented:
- Reduced React Query cache times
- Simplified auto-save logic
- Better timeout handling for async operations
- iOS-specific initialization paths

## Development Tips

1. **For iOS testing**: Use the iOS simulator or TestFlight
2. **For web testing**: Use `bun run start-web`
3. **For debugging**: Check the console logs for any errors
4. **For performance**: The app now has iOS-optimized initialization

## Quick Commands Reference
```bash
# Standard restart
bun start

# Web development
bun run start-web

# Clear cache restart
npx expo start --clear

# Force reinstall and restart
rm -rf node_modules && bun install && bun start
```