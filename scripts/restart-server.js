#!/usr/bin/env node

/**
 * Server Restart and Cache Clear Script for MediCare Pro
 * This script handles comprehensive server restart with cache clearing
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 MediCare Pro - Server Restart & Cache Clear');
console.log('================================================');

// Function to clear various cache directories
const clearCaches = () => {
  console.log('🧹 Clearing caches...');
  
  const cacheDirs = [
    '.expo',
    'node_modules/.cache',
    '.next',
    'dist',
    'build',
    '.rork'
  ];
  
  cacheDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      try {
        execSync(`rm -rf "${fullPath}"`, { stdio: 'inherit' });
        console.log(`✅ Cleared ${dir}`);
      } catch (error) {
        console.log(`⚠️  Could not clear ${dir}: ${error.message}`);
      }
    }
  });
};

// Function to clear npm/yarn cache
const clearPackageCache = () => {
  console.log('📦 Clearing package manager cache...');
  
  try {
    // Clear npm cache
    execSync('npm cache clean --force', { stdio: 'inherit' });
    console.log('✅ NPM cache cleared');
  } catch (error) {
    console.log('⚠️  NPM cache clear failed:', error.message);
  }
  
  try {
    // Clear yarn cache if available
    execSync('yarn cache clean', { stdio: 'inherit' });
    console.log('✅ Yarn cache cleared');
  } catch (error) {
    // Yarn might not be available, that's okay
  }
  
  try {
    // Clear bun cache if available
    execSync('bun pm cache rm', { stdio: 'inherit' });
    console.log('✅ Bun cache cleared');
  } catch (error) {
    // Bun might not be available, that's okay
  }
};

// Function to restart the development server
const restartServer = () => {
  console.log('🔄 Restarting development server...');
  
  // Kill any existing processes on common ports
  const ports = [3000, 8081, 19000, 19001, 19002];
  
  ports.forEach(port => {
    try {
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
      console.log(`✅ Killed processes on port ${port}`);
    } catch (error) {
      // No processes on this port, that's fine
    }
  });
  
  // Wait a moment for processes to fully terminate
  setTimeout(() => {
    console.log('🚀 Starting fresh server...');
    
    // Start the development server
    const serverProcess = spawn('bunx', ['rork', 'start', '-p', 'mrjfx7h4qr7c2x9p43htd', '--tunnel'], {
      stdio: 'inherit',
      detached: false
    });
    
    // Handle server process events
    serverProcess.on('error', (error) => {
      console.error('❌ Server start error:', error);
      process.exit(1);
    });
    
    serverProcess.on('exit', (code) => {
      console.log(`🔄 Server exited with code ${code}`);
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
    
  }, 2000);
};

// Main execution
const main = () => {
  try {
    console.log('⏱️  Starting comprehensive restart process...');
    
    // Step 1: Clear caches
    clearCaches();
    
    // Step 2: Clear package manager cache
    clearPackageCache();
    
    // Step 3: Restart server
    restartServer();
    
    console.log('✅ Restart process initiated successfully');
    console.log('📱 The app should be available shortly...');
    
  } catch (error) {
    console.error('❌ Restart process failed:', error);
    process.exit(1);
  }
};

// Run the script
main();