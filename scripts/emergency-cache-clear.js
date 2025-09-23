#!/usr/bin/env node

/**
 * Emergency Cache Clear and Server Restart Script
 * Comprehensive solution for clearing all caches and restarting the development server
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY CACHE CLEAR & SERVER RESTART');
console.log('==========================================');

// Step 1: Kill all related processes
console.log('\n🛑 Terminating all development processes...');
const processesToKill = [
  'rork',
  'expo',
  'metro',
  'webpack',
  'node.*start',
  'bunx.*rork'
];

processesToKill.forEach(processName => {
  try {
    execSync(`pkill -f "${processName}"`, { stdio: 'ignore' });
    console.log(`✅ Terminated ${processName} processes`);
  } catch (error) {
    // Process might not be running, which is fine
  }
});

// Kill processes on common ports
const ports = [3000, 8081, 19000, 19001, 19002, 8000, 4000, 5000, 3001];
ports.forEach(port => {
  try {
    execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
    console.log(`✅ Cleared port ${port}`);
  } catch (error) {
    // Port might not be in use, which is fine
  }
});

// Step 2: Clear project caches
console.log('\n🧹 Clearing project caches...');
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

cacheDirs.forEach(dir => {
  try {
    if (fs.existsSync(dir)) {
      execSync(`rm -rf ${dir}`, { stdio: 'ignore' });
      console.log(`✅ Cleared ${dir}`);
    }
  } catch (error) {
    console.log(`⚠️  Could not clear ${dir}:`, error.message);
  }
});

// Step 3: Clear system temp directories
console.log('\n🗑️  Clearing system temp directories...');
const tempDirs = [
  '/tmp/metro-*',
  '/tmp/react-*',
  '/tmp/expo-*',
  '/tmp/rork-*',
  '/tmp/haste-map-*'
];

tempDirs.forEach(pattern => {
  try {
    execSync(`rm -rf ${pattern}`, { stdio: 'ignore' });
    console.log(`✅ Cleared ${pattern}`);
  } catch (error) {
    // Temp files might not exist, which is fine
  }
});

// Step 4: Clear package manager caches
console.log('\n📦 Clearing package manager caches...');

// NPM cache
try {
  execSync('npm cache clean --force', { stdio: 'ignore' });
  console.log('✅ NPM cache cleared');
} catch (error) {
  console.log('⚠️  NPM cache clear failed');
}

// Yarn cache
try {
  execSync('yarn cache clean', { stdio: 'ignore' });
  console.log('✅ Yarn cache cleared');
} catch (error) {
  // Yarn might not be installed
}

// Bun cache
try {
  execSync('bun pm cache rm', { stdio: 'ignore' });
  console.log('✅ Bun cache cleared');
} catch (error) {
  // Bun might not be installed
}

// Step 5: Clear user-specific caches
console.log('\n🏠 Clearing user caches...');
const os = require('os');
const platform = os.platform();

if (platform === 'darwin') {
  // macOS
  const macCacheDirs = [
    `${os.homedir()}/Library/Caches/Expo`,
    `${os.homedir()}/Library/Caches/Metro`,
    `${os.homedir()}/.babel-cache`,
    `${os.homedir()}/.metro-cache`
  ];
  
  macCacheDirs.forEach(dir => {
    try {
      if (fs.existsSync(dir)) {
        execSync(`rm -rf "${dir}"`, { stdio: 'ignore' });
        console.log(`✅ Cleared ${path.basename(dir)} cache`);
      }
    } catch (error) {
      // Cache might not exist
    }
  });
} else if (platform === 'linux') {
  // Linux
  const linuxCacheDirs = [
    `${os.homedir()}/.cache/expo`,
    `${os.homedir()}/.cache/metro`,
    `${os.homedir()}/.babel-cache`,
    `${os.homedir()}/.metro-cache`
  ];
  
  linuxCacheDirs.forEach(dir => {
    try {
      if (fs.existsSync(dir)) {
        execSync(`rm -rf "${dir}"`, { stdio: 'ignore' });
        console.log(`✅ Cleared ${path.basename(dir)} cache`);
      }
    } catch (error) {
      // Cache might not exist
    }
  });
}

// Step 6: Wait for cleanup to complete
console.log('\n⏳ Waiting for cleanup to complete...');
setTimeout(() => {
  console.log('\n🚀 Starting fresh development server...');
  console.log('📱 The app will be available shortly with cleared caches');
  
  // Start the server with fresh cache
  const serverProcess = spawn('bunx', ['rork', 'start', '-p', 'mrjfx7h4qr7c2x9p43htd', '--tunnel', '--clear'], {
    stdio: 'inherit',
    detached: false
  });
  
  // Handle server process events
  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
  
  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Server exited with code ${code}`);
      process.exit(code);
    }
  });
  
  // Handle process termination
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
  
}, 3000);