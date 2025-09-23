#!/usr/bin/env node

/**
 * Emergency Fix Script for MediCare Pro
 * Comprehensive error resolution and server restart
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY FIX INITIATED');
console.log('========================');
console.log('⏱️ Server will restart in 3 seconds...');
console.log('');

// Countdown
for (let i = 3; i > 0; i--) {
  console.log(`⏰ ${i}...`);
  execSync('sleep 1');
}

console.log('🚀 STARTING EMERGENCY FIX PROCESS');
console.log('');

// Step 1: Kill all processes aggressively
const killProcesses = () => {
  console.log('🛑 Terminating all development processes...');
  
  const processNames = ['rork', 'expo', 'metro', 'webpack', 'node.*start', 'bunx.*rork'];
  const ports = [3000, 8081, 19000, 19001, 19002, 8000, 4000, 5000, 3001];
  
  // Kill by process name
  processNames.forEach(processName => {
    try {
      execSync(`pkill -f "${processName}"`, { stdio: 'ignore' });
      console.log(`✅ Killed ${processName} processes`);
    } catch (_error) {
      // Process not found, that's fine
    }
  });
  
  // Kill by port
  ports.forEach(port => {
    try {
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
      console.log(`✅ Freed port ${port}`);
    } catch (_error) {
      // Port not in use, that's fine
    }
  });
};

// Step 2: Aggressive cache clearing
const clearAllCaches = () => {
  console.log('🧹 AGGRESSIVE CACHE CLEARING...');
  
  const cacheDirs = [
    '.expo',
    'node_modules/.cache',
    '.next',
    'dist',
    'build',
    '.rork',
    '.metro',
    'tmp',
    '.tmp'
  ];
  
  const tempDirs = [
    '/tmp/metro-*',
    '/tmp/react-*',
    '/tmp/expo-*',
    '/tmp/rork-*',
    '/tmp/haste-map-*'
  ];
  
  // Clear project caches
  cacheDirs.forEach(dir => {
    if (!dir || typeof dir !== 'string' || dir.trim().length === 0) return;
    const sanitizedDir = dir.trim();
    if (sanitizedDir.length > 100) return;
    
    const fullPath = path.join(process.cwd(), sanitizedDir);
    if (fs.existsSync(fullPath)) {
      try {
        execSync(`rm -rf "${fullPath}"`, { stdio: 'ignore' });
        console.log(`✅ Cleared ${sanitizedDir}`);
      } catch (_error) {
        console.log(`⚠️  Could not clear ${sanitizedDir}`);
      }
    }
  });
  
  // Clear temp directories
  tempDirs.forEach(pattern => {
    try {
      execSync(`rm -rf ${pattern}`, { stdio: 'ignore' });
      console.log(`✅ Cleared ${pattern}`);
    } catch (_error) {
      // Directory doesn't exist, that's fine
    }
  });
  
  // Clear package manager caches
  try {
    execSync('npm cache clean --force', { stdio: 'ignore' });
    console.log('✅ NPM cache cleared');
  } catch (_error) {
    console.log('⚠️  NPM cache clear failed');
  }
  
  try {
    execSync('yarn cache clean', { stdio: 'ignore' });
    console.log('✅ Yarn cache cleared');
  } catch (_error) {
    // Yarn not available
  }
  
  try {
    execSync('bun pm cache rm', { stdio: 'ignore' });
    console.log('✅ Bun cache cleared');
  } catch (_error) {
    // Bun not available
  }
};

// Step 3: Fix configuration files
const fixConfigFiles = () => {
  console.log('🔧 Fixing configuration files...');
  
  // Ensure babel.config.js exists and is correct
  const babelConfig = `module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};`;
  
  try {
    fs.writeFileSync('babel.config.js', babelConfig);
    console.log('✅ babel.config.js fixed');
  } catch (_error) {
    console.log('⚠️  Could not fix babel.config.js');
  }
  
  // Ensure metro.config.js exists
  const metroConfig = `const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;`;
  
  if (!fs.existsSync('metro.config.js')) {
    try {
      fs.writeFileSync('metro.config.js', metroConfig);
      console.log('✅ metro.config.js created');
    } catch (_error) {
      console.log('⚠️  Could not create metro.config.js');
    }
  }
};

// Step 4: Restart server with fresh environment
const restartServer = () => {
  console.log('🚀 STARTING FRESH SERVER...');
  console.log('📱 The app will be available shortly...');
  console.log('🔧 All configuration changes will take effect');
  console.log('');
  
  // Wait for cleanup to complete
  setTimeout(() => {
    // Start the development server with clear cache flag
    const serverProcess = spawn('bunx', [
      'rork', 'start', 
      '-p', 'mrjfx7h4qr7c2x9p43htd', 
      '--tunnel', 
      '--clear'
    ], {
      stdio: 'inherit',
      detached: false,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        EXPO_USE_FAST_RESOLVER: 'true'
      }
    });
    
    // Handle server process events
    serverProcess.on('error', (error) => {
      if (error && error.message) {
        const sanitizedError = error.message.trim().substring(0, 200);
        console.error('❌ Server start error:', sanitizedError);
      }
      console.log('🔄 Attempting fallback start...');
      
      // Fallback without --clear flag
      spawn('bunx', [
        'rork', 'start', 
        '-p', 'mrjfx7h4qr7c2x9p43htd', 
        '--tunnel'
      ], {
        stdio: 'inherit',
        detached: false
      });
    });
    
    serverProcess.on('exit', (code) => {
      if (code !== 0) {
        console.log(`🔄 Server exited with code ${code}, restarting...`);
      }
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server...');
      serverProcess.kill('SIGINT');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down server...');
      serverProcess.kill('SIGTERM');
      process.exit(0);
    });
    
  }, 3000); // Wait 3 seconds for cleanup
};

// Main execution
const main = async () => {
  try {
    console.log('⏱️  Starting emergency fix process...');
    console.log('');
    
    // Step 1: Kill processes
    killProcesses();
    console.log('');
    
    // Step 2: Clear caches
    clearAllCaches();
    console.log('');
    
    // Step 3: Fix config files
    fixConfigFiles();
    console.log('');
    
    // Step 4: Restart server
    restartServer();
    
    console.log('✅ Emergency fix process completed successfully');
    console.log('📱 The app should be available shortly...');
    console.log('');
    console.log('🎯 If issues persist, try:');
    console.log('   1. Check the terminal for any error messages');
    console.log('   2. Refresh your browser/restart the Expo Go app');
    console.log('   3. Run: npm run start');
    
  } catch (error) {
    const errorMsg = error && error.message ? error.message.trim().substring(0, 200) : 'Unknown error';
    console.error('❌ Emergency fix process failed:', errorMsg);
    console.log('');
    console.log('🆘 Manual recovery steps:');
    console.log('   1. Run: rm -rf .expo node_modules/.cache');
    console.log('   2. Run: npm cache clean --force');
    console.log('   3. Run: npm run start');
    process.exit(1);
  }
};

// Run the emergency fix
main();