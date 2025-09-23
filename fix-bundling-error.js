#!/usr/bin/env node

/**
 * Emergency Bundling Error Fix for MediCare Pro
 * Comprehensive cache clear and server restart
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY BUNDLING ERROR FIX');
console.log('================================');
console.log('Detected babel.config.js changes requiring restart');
console.log('');

// Step 1: Kill all processes immediately
console.log('🛑 Killing all related processes...');
const processesToKill = [
  'rork',
  'expo',
  'metro',
  'node.*start',
  'bunx.*rork'
];

processesToKill.forEach(processName => {
  try {
    execSync(`pkill -f "${processName}"`, { stdio: 'ignore' });
    console.log(`✅ Killed ${processName} processes`);
  } catch (_error) {
    // Process might not be running, that's fine
  }
});

// Kill processes on specific ports
const ports = [3000, 8081, 19000, 19001, 19002, 8000, 4000];
ports.forEach(port => {
  try {
    execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
    console.log(`✅ Killed processes on port ${port}`);
  } catch (_error) {
    // No processes on this port
  }
});

// Step 2: Aggressive cache clearing
console.log('\n🧹 AGGRESSIVE CACHE CLEARING...');

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
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    try {
      execSync(`rm -rf "${fullPath}"`, { stdio: 'inherit' });
      console.log(`✅ Cleared ${dir}`);
    } catch (_error) {
      console.log(`⚠️  Could not clear ${dir?.trim() || 'unknown'}`);
    }
  }
});

// Clear system temp directories
const tempDirs = [
  '/tmp/metro-*',
  '/tmp/react-*',
  '/tmp/expo-*',
  '/tmp/rork-*'
];

tempDirs.forEach(pattern => {
  try {
    execSync(`rm -rf ${pattern}`, { stdio: 'ignore' });
    console.log(`✅ Cleared ${pattern}`);
  } catch (_error) {
    // Might not exist, that's fine
  }
});

// Step 3: Clear package manager caches
console.log('\n📦 CLEARING PACKAGE MANAGER CACHES...');

try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('✅ NPM cache cleared');
} catch (_error) {
  console.log('⚠️  NPM cache clear failed');
}

try {
  execSync('yarn cache clean', { stdio: 'inherit' });
  console.log('✅ Yarn cache cleared');
} catch (_error) {
  // Yarn might not be available
}

try {
  execSync('bun pm cache rm', { stdio: 'inherit' });
  console.log('✅ Bun cache cleared');
} catch (_error) {
  // Bun might not be available
}

// Step 4: Wait for cleanup
console.log('\n⏳ Waiting for cleanup to complete...');
setTimeout(() => {
  console.log('\n🚀 STARTING FRESH SERVER...');
  console.log('📱 The app will be available shortly...');
  console.log('🔧 All babel.config.js changes should now take effect');
  console.log('');
  
  // Start fresh server
  const serverProcess = spawn('bunx', ['rork', 'start', '-p', 'mrjfx7h4qr7c2x9p43htd', '--tunnel', '--clear'], {
    stdio: 'inherit',
    detached: false
  });
  
  serverProcess.on('error', (error) => {
    const errorMessage = error?.message?.trim() || 'Unknown error';
    console.error('❌ Server start error:', errorMessage);
    process.exit(1);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    serverProcess.kill('SIGINT');
    process.exit(0);
  });
  
}, 3000);

console.log('\n✅ BUNDLING ERROR FIX INITIATED');
console.log('⏱️  Server will restart in 3 seconds...');