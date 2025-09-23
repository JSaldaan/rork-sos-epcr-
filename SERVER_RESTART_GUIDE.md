# 🚀 MediCare Pro - Server Restart & Cache Clear Guide

## Quick Fix Commands

### 1. Emergency Restart (Recommended)
```bash
# Kill all processes and clear cache
pkill -f "rork\|expo\|metro" && rm -rf .expo node_modules/.cache .next dist build .rork && bunx rork start -p mrjfx7h4qr7c2x9p43htd --tunnel
```

### 2. Manual Step-by-Step Restart

#### Step 1: Kill Running Processes
```bash
# Kill all related processes
pkill -f "rork"
pkill -f "expo"
pkill -f "metro"

# Or kill by port (if you know the ports)
lsof -ti:3000 | xargs kill -9
lsof -ti:8081 | xargs kill -9
lsof -ti:19000 | xargs kill -9
```

#### Step 2: Clear All Caches
```bash
# Clear project caches
rm -rf .expo
rm -rf node_modules/.cache
rm -rf .next
rm -rf dist
rm -rf build
rm -rf .rork

# Clear npm cache
npm cache clean --force

# Clear system temp (optional)
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/react-* 2>/dev/null || true
```

#### Step 3: Restart Server
```bash
# Start fresh server
bunx rork start -p mrjfx7h4qr7c2x9p43htd --tunnel
```

### 3. Nuclear Option (Complete Reset)
```bash
# Complete reset - use only if above doesn't work
rm -rf node_modules
rm -rf .expo
rm -rf node_modules/.cache
npm cache clean --force
npm install
bunx rork start -p mrjfx7h4qr7c2x9p43htd --tunnel
```

## 🔧 Troubleshooting Navigation Issues

### Common Navigation Mounting Errors

The app has been updated with comprehensive fixes for navigation mounting issues:

1. **Proper Navigation Initialization**: Navigation now waits for proper mounting before executing
2. **Enhanced Error Boundaries**: Better error handling with recovery mechanisms  
3. **Comprehensive Cache Management**: Automatic cache clearing on errors
4. **Improved Timing**: Better delays and timeouts for iOS stability

### If Navigation Still Fails

1. **Clear Browser Cache** (for web):
   - Open DevTools (F12)
   - Right-click refresh button → "Empty Cache and Hard Reload"

2. **Reset App State**:
   - Close all browser tabs/app instances
   - Clear cache using commands above
   - Restart server
   - Open fresh browser tab

3. **Check Console Logs**:
   - Look for navigation-related errors
   - Check for "Navigation system ready" message
   - Verify authentication state logs

## 📱 Platform-Specific Instructions

### Web Development
```bash
# For web-only development
bunx rork start -p mrjfx7h4qr7c2x9p43htd --web --tunnel

# With debug logs
DEBUG=expo* bunx rork start -p mrjfx7h4qr7c2x9p43htd --web --tunnel
```

### Mobile Development
```bash
# For mobile + web
bunx rork start -p mrjfx7h4qr7c2x9p43htd --tunnel
```

## 🚨 Emergency Recovery

If the app is completely broken:

1. **Stop everything**:
   ```bash
   pkill -f "node\|expo\|metro\|rork"
   ```

2. **Nuclear cache clear**:
   ```bash
   rm -rf node_modules .expo .next dist build .rork node_modules/.cache
   npm cache clean --force
   ```

3. **Reinstall dependencies**:
   ```bash
   npm install
   ```

4. **Fresh start**:
   ```bash
   bunx rork start -p mrjfx7h4qr7c2x9p43htd --tunnel
   ```

## ✅ Verification Steps

After restart, verify:

1. **Server starts without errors**
2. **QR code appears for mobile testing**
3. **Web interface loads at provided URL**
4. **Navigation works properly** (login → tabs)
5. **No console errors** in browser DevTools

## 🔍 Monitoring

Watch for these success indicators:

```
✅ Navigation system ready
✅ App initialization complete  
✅ Splash screen hidden
✅ Comprehensive cache clear completed
```

## 📞 Support

If issues persist after following this guide:

1. Check the console logs for specific error messages
2. Verify all processes are killed before restart
3. Ensure no other development servers are running on conflicting ports
4. Try the nuclear option as a last resort

---

**Note**: The app now includes automatic cache clearing and better error recovery, so manual intervention should be needed less frequently.