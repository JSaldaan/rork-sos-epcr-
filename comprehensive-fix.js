#!/usr/bin/env node

/**
 * COMPREHENSIVE BUNDLING ERROR FIX
 * Fixes all common Expo/React Native bundling issues
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 COMPREHENSIVE BUNDLING ERROR FIX');
console.log('===================================');
console.log('');

// Step 1: Create missing configuration files
const createConfigFiles = () => {
  console.log('📝 Creating missing configuration files...');
  
  // Create babel.config.js
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
    console.log('✅ babel.config.js created');
  } catch (_error) {
    console.log('⚠️  Could not create babel.config.js');
  }

  // Create metro.config.js
  const metroConfig = `const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;`;

  try {
    fs.writeFileSync('metro.config.js', metroConfig);
    console.log('✅ metro.config.js created');
  } catch (_error) {
    console.log('⚠️  Could not create metro.config.js');
  }

  // Create app.config.js if it doesn't exist
  if (!fs.existsSync('app.config.js') && !fs.existsSync('app.json')) {
    const appConfig = `export default {
  expo: {
    name: "MediCare Pro",
    slug: "medicare-pro",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "medicare-pro",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.medicare.pro"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.medicare.pro"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router"
    ],
    experiments: {
      typedRoutes: true
    }
  }
};`;

    try {
      fs.writeFileSync('app.config.js', appConfig);
      console.log('✅ app.config.js created');
    } catch (_error) {
      console.log('⚠️  Could not create app.config.js');
    }
  }

  console.log('');
};

// Step 2: Kill all processes
const killProcesses = () => {
  console.log('🛑 Terminating all development processes...');
  
  const processNames = ['expo', 'metro', 'webpack', 'node.*start', 'bunx', 'rork'];
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

  console.log('');
};

// Step 3: Aggressive cache clearing
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

  console.log('');
};

// Step 4: Start server with proper configuration
const startServer = () => {
  console.log('🚀 STARTING FRESH SERVER...');
  console.log('📱 The app will be available shortly...');
  console.log('');
  
  // Wait for cleanup to complete
  setTimeout(() => {
    // Start the development server
    const serverProcess = spawn('npx', [
      'expo', 'start', 
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
      console.error('❌ Server start error:', error.message);
      console.log('🔄 Attempting fallback start...');
      
      // Fallback without --clear flag
      spawn('npx', [
        'expo', 'start', 
        '--tunnel'
      ], {
        stdio: 'inherit',
        detached: false
      });
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\\n🛑 Shutting down server...');
      serverProcess.kill('SIGINT');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\\n🛑 Shutting down server...');
      serverProcess.kill('SIGTERM');
      process.exit(0);
    });
    
  }, 2000); // Wait 2 seconds for cleanup
};

// Main execution
const main = async () => {
  try {
    console.log('⏱️  Starting comprehensive fix process...');
    console.log('');
    
    // Step 1: Create config files
    createConfigFiles();
    
    // Step 2: Kill processes
    killProcesses();
    
    // Step 3: Clear caches
    clearAllCaches();
    
    // Step 4: Start server
    startServer();
    
    console.log('✅ Comprehensive fix process completed successfully');
    console.log('📱 The app should be available shortly...');
    console.log('');
    console.log('🎯 If issues persist, try:');
    console.log('   1. Check the terminal for any error messages');
    console.log('   2. Refresh your browser/restart the Expo Go app');
    console.log('   3. Run: npx expo start --tunnel');
    
  } catch (error) {
    console.error('❌ Comprehensive fix process failed:', error.message);
    console.log('');
    console.log('🆘 Manual recovery steps:');
    console.log('   1. Run: rm -rf .expo node_modules/.cache');
    console.log('   2. Run: npm cache clean --force');
    console.log('   3. Run: npx expo start --tunnel');
    process.exit(1);
  }
};

// Run the comprehensive fix
main();