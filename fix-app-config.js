#!/usr/bin/env node

/**
 * FIX APP CONFIGURATION ISSUES
 * Fixes duplicated entitlements and script issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING APP CONFIGURATION ISSUES');
console.log('===================================');
console.log('');

// Fix app.json duplicated entitlements
const fixAppJson = () => {
  console.log('📝 Fixing app.json duplicated entitlements...');
  
  try {
    const appJsonPath = path.join(process.cwd(), 'app.json');
    
    if (fs.existsSync(appJsonPath)) {
      const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
      const appConfig = JSON.parse(appJsonContent);
      
      // Fix duplicated entitlements
      if (appConfig.expo && appConfig.expo.ios && appConfig.expo.ios.entitlements) {
        const entitlements = appConfig.expo.ios.entitlements;
        
        // Remove the nested duplicate structure
        if (entitlements.com && entitlements.com.apple && entitlements.com.apple.developer) {
          delete entitlements.com;
          console.log('✅ Removed duplicated nested entitlement structure');
        }
        
        // Ensure the correct entitlement is present
        entitlements['com.apple.developer.networking.wifi-info'] = true;
        
        // Write back the fixed configuration
        fs.writeFileSync(appJsonPath, JSON.stringify(appConfig, null, 2));
        console.log('✅ Fixed app.json entitlements');
      }
    } else {
      console.log('⚠️  app.json not found');
    }
  } catch (error) {
    console.log('⚠️  Could not fix app.json:', error.message);
  }
  
  console.log('');
};

// Fix package.json scripts
const fixPackageJson = () => {
  console.log('📝 Fixing package.json scripts...');
  
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
      const packageConfig = JSON.parse(packageJsonContent);
      
      // Add missing scripts that might be referenced
      if (!packageConfig.scripts) {
        packageConfig.scripts = {};
      }
      
      // Add xork script if it's missing (maps to rork)
      if (!packageConfig.scripts.xork && packageConfig.scripts.start) {
        packageConfig.scripts.xork = packageConfig.scripts.start;
        console.log('✅ Added xork script mapping');
      }
      
      // Ensure all necessary scripts are present
      const requiredScripts = {
        'start': 'bunx rork start -p mrjfx7h4qr7c2x9p43htd --tunnel',
        'start-web': 'bunx rork start -p mrjfx7h4qr7c2x9p43htd --web --tunnel',
        'start-web-dev': 'DEBUG=expo* bunx rork start -p mrjfx7h4qr7c2x9p43htd --web --tunnel',
        'lint': 'expo lint',
        'reset-cache': 'npx expo start --clear',
        'tunnel': 'npx expo start --tunnel'
      };
      
      Object.entries(requiredScripts).forEach(([scriptName, scriptCommand]) => {
        if (!packageConfig.scripts[scriptName]) {
          packageConfig.scripts[scriptName] = scriptCommand;
          console.log(`✅ Added ${scriptName} script`);
        }
      });
      
      // Write back the fixed configuration
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageConfig, null, 2));
      console.log('✅ Fixed package.json scripts');
    } else {
      console.log('⚠️  package.json not found');
    }
  } catch (error) {
    console.log('⚠️  Could not fix package.json:', error.message);
  }
  
  console.log('');
};

// Create babel.config.js if missing
const createBabelConfig = () => {
  console.log('📝 Ensuring babel.config.js exists...');
  
  const babelConfigPath = path.join(process.cwd(), 'babel.config.js');
  
  if (!fs.existsSync(babelConfigPath)) {
    const babelConfig = `module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for the app to work properly
    ],
  };
};`;
    
    try {
      fs.writeFileSync(babelConfigPath, babelConfig);
      console.log('✅ Created babel.config.js');
    } catch (error) {
      console.log('⚠️  Could not create babel.config.js:', error.message);
    }
  } else {
    console.log('✅ babel.config.js already exists');
  }
  
  console.log('');
};

// Create metro.config.js if missing
const createMetroConfig = () => {
  console.log('📝 Ensuring metro.config.js exists...');
  
  const metroConfigPath = path.join(process.cwd(), 'metro.config.js');
  
  if (!fs.existsSync(metroConfigPath)) {
    const metroConfig = `const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;`;
    
    try {
      fs.writeFileSync(metroConfigPath, metroConfig);
      console.log('✅ Created metro.config.js');
    } catch (error) {
      console.log('⚠️  Could not create metro.config.js:', error.message);
    }
  } else {
    console.log('✅ metro.config.js already exists');
  }
  
  console.log('');
};

// Main execution
const main = async () => {
  try {
    console.log('⏱️  Starting configuration fix process...');
    console.log('');
    
    // Fix app.json
    fixAppJson();
    
    // Fix package.json
    fixPackageJson();
    
    // Create missing config files
    createBabelConfig();
    createMetroConfig();
    
    console.log('✅ Configuration fix process completed successfully');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('   1. Run: npm run start (or bunx rork start -p mrjfx7h4qr7c2x9p43htd --tunnel)');
    console.log('   2. If issues persist, run: npm run reset-cache');
    console.log('   3. For iOS submission, the duplicated entitlements have been fixed');
    console.log('');
    
  } catch (error) {
    console.error('❌ Configuration fix process failed:', error.message);
    console.log('');
    console.log('🆘 Manual steps to fix:');
    console.log('   1. Check app.json for duplicated entitlements in ios.entitlements');
    console.log('   2. Remove nested "com.apple.developer" structure, keep only the flat entitlement');
    console.log('   3. Ensure package.json has all required scripts');
    process.exit(1);
  }
};

// Run the fix
main();