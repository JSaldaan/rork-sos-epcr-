#!/usr/bin/env node

/**
 * Emergency Status and Fix Report for SOS ePCR
 * Comprehensive system check and automatic recovery
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY STATUS REPORT');
console.log('==========================');
console.log('📊 Checking system status...');
console.log('');

// System status checks
const checkSystemStatus = () => {
  const status = {
    processes: [],
    ports: [],
    caches: [],
    config: [],
    errors: []
  };

  // Check for running processes
  const processNames = ['rork', 'expo', 'metro', 'webpack'];
  processNames.forEach(processName => {
    try {
      const result = execSync(`pgrep -f "${processName}"`, { encoding: 'utf8' });
      if (result.trim()) {
        status.processes.push(`${processName}: RUNNING`);
      }
    } catch (error) {
      status.processes.push(`${processName}: NOT RUNNING`);
    }
  });

  // Check ports
  const ports = [3000, 8081, 19000, 19001, 19002];
  ports.forEach(port => {
    try {
      execSync(`lsof -ti:${port}`, { stdio: 'ignore' });
      status.ports.push(`Port ${port}: IN USE`);
    } catch (error) {
      status.ports.push(`Port ${port}: FREE`);
    }
  });

  // Check cache directories
  const cacheDirs = ['.expo', 'node_modules/.cache', '.next', 'dist', 'build', '.rork'];
  cacheDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const stats = fs.statSync(dir);
      status.caches.push(`${dir}: EXISTS (${stats.isDirectory() ? 'DIR' : 'FILE'})`);
    } else {
      status.caches.push(`${dir}: NOT FOUND`);
    }
  });

  // Check config files
  const configFiles = ['package.json', 'app.json', 'tsconfig.json', 'babel.config.js', 'metro.config.js'];
  configFiles.forEach(file => {
    if (fs.existsSync(file)) {
      status.config.push(`${file}: EXISTS`);
    } else {
      status.config.push(`${file}: MISSING`);
      status.errors.push(`Missing config file: ${file}`);
    }
  });

  return status;
};

// Generate fix recommendations
const generateRecommendations = (status) => {
  const recommendations = [];

  // Check for stuck processes
  const runningProcesses = status.processes.filter(p => p.includes('RUNNING'));
  if (runningProcesses.length > 0) {
    recommendations.push('🛑 Kill stuck development processes');
  }

  // Check for occupied ports
  const occupiedPorts = status.ports.filter(p => p.includes('IN USE'));
  if (occupiedPorts.length > 0) {
    recommendations.push('🔓 Free occupied development ports');
  }

  // Check for cache buildup
  const existingCaches = status.caches.filter(c => c.includes('EXISTS'));
  if (existingCaches.length > 2) {
    recommendations.push('🧹 Clear accumulated cache directories');
  }

  // Check for missing config
  if (status.errors.length > 0) {
    recommendations.push('🔧 Fix missing configuration files');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ System appears healthy - restart server only');
  }

  return recommendations;
};

// Main execution
const main = () => {
  try {
    console.log('🔍 SYSTEM STATUS CHECK');
    console.log('=====================');
    
    const status = checkSystemStatus();
    
    console.log('📊 PROCESSES:');
    status.processes.forEach(p => console.log(`   ${p}`));
    console.log('');
    
    console.log('🔌 PORTS:');
    status.ports.forEach(p => console.log(`   ${p}`));
    console.log('');
    
    console.log('💾 CACHES:');
    status.caches.forEach(c => console.log(`   ${c}`));
    console.log('');
    
    console.log('⚙️  CONFIG:');
    status.config.forEach(c => console.log(`   ${c}`));
    console.log('');
    
    if (status.errors.length > 0) {
      console.log('❌ ERRORS DETECTED:');
      status.errors.forEach(e => console.log(`   ${e}`));
      console.log('');
    }
    
    const recommendations = generateRecommendations(status);
    console.log('💡 RECOMMENDATIONS:');
    recommendations.forEach(r => console.log(`   ${r}`));
    console.log('');
    
    console.log('🚀 EMERGENCY FIX OPTIONS:');
    console.log('   1. Run: node scripts/emergency-fix.js');
    console.log('   2. Run: ./emergency-fix.sh');
    console.log('   3. Manual: rm -rf .expo node_modules/.cache && npm run start');
    console.log('');
    
    console.log('✅ Status report complete');
    console.log('📱 Choose an option above to fix the issues');
    
  } catch (error) {
    console.error('❌ Status check failed:', error.message);
    console.log('');
    console.log('🆘 EMERGENCY RECOVERY:');
    console.log('   Run: ./emergency-fix.sh');
  }
};

// Run the status check
main();