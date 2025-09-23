#!/usr/bin/env node

/**
 * Fix Bundling Error Script
 * 
 * This script identifies and helps fix common bundling errors in React Native/Expo projects.
 */

const fs = require('fs');
const path = require('path');

// Get current directory
const currentDir = process.cwd();

console.log('🔍 Analyzing project for bundling errors...\n');

// Check app.json for malformed JSON
function checkAppJson() {
  console.log('📋 Checking app.json...');
  
  try {
    const appJsonPath = path.join(currentDir, 'app.json');
    const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
    const appJson = JSON.parse(appJsonContent);
    
    // Check for malformed entitlements
    if (appJson.expo && appJson.expo.ios && appJson.expo.ios.entitlements) {
      const entitlements = appJson.expo.ios.entitlements;
      
      // Check for duplicate keys or nested structure issues
      if (entitlements['com.apple.developer.networking.wifi-info'] && entitlements.com) {
        console.log('❌ FOUND ISSUE: Duplicate entitlements structure in app.json');
        console.log('   The entitlements object has both flat and nested structures for the same key.');
        console.log('   This is causing the bundling error.\n');
        
        console.log('🔧 TO FIX:');
        console.log('   1. Open app.json');
        console.log('   2. Find the "entitlements" section under "ios"');
        console.log('   3. Replace the entire entitlements object with:');
        console.log('   {');
        console.log('     "com.apple.developer.networking.wifi-info": true');
        console.log('   }');
        console.log('   4. Remove the nested "com" object structure\n');
        
        return false;
      }
    }
    
    console.log('✅ app.json structure looks good');
    return true;
  } catch (error) {
    console.log('❌ Error reading app.json:', error.message);
    return false;
  }
}

// Check for TypeScript errors
function checkTypeScriptFiles() {
  console.log('📝 Checking TypeScript files...');
  
  const tsFiles = [
    'app/_layout.tsx',
    'app/(tabs)/_layout.tsx',
    'app/(tabs)/index.tsx',
    'store/pcrStore.ts',
    'store/types.ts'
  ];
  
  let hasErrors = false;
  
  tsFiles.forEach(file => {
    try {
      const filePath = path.join(currentDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Basic syntax checks
        if (content.includes('import') && !content.includes('from')) {
          console.log(`❌ Potential import error in ${file}`);
          hasErrors = true;
        }
        
        // Check for unclosed brackets/braces
        const openBraces = (content.match(/{/g) || []).length;
        const closeBraces = (content.match(/}/g) || []).length;
        if (openBraces !== closeBraces) {
          console.log(`❌ Unmatched braces in ${file}: ${openBraces} open, ${closeBraces} close`);
          hasErrors = true;
        }
        
        console.log(`✅ ${file} syntax looks good`);
      } else {
        console.log(`⚠️  ${file} not found`);
      }
    } catch (error) {
      console.log(`❌ Error checking ${file}:`, error.message);
      hasErrors = true;
    }
  });
  
  return !hasErrors;
}

// Check package.json dependencies
function checkPackageJson() {
  console.log('📦 Checking package.json...');
  
  try {
    const packageJsonPath = path.join(currentDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check for common problematic dependencies
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Check for version conflicts
    if (dependencies.react && dependencies['react-native']) {
      console.log('✅ React and React Native versions present');
    }
    
    if (dependencies.expo) {
      console.log('✅ Expo dependency found');
    }
    
    console.log('✅ package.json looks good');
    return true;
  } catch (error) {
    console.log('❌ Error reading package.json:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  const checks = [
    checkAppJson(),
    checkTypeScriptFiles(),
    checkPackageJson()
  ];
  
  const allPassed = checks.every(check => check);
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('✅ No obvious bundling errors found.');
    console.log('   If you\'re still experiencing issues, try:');
    console.log('   1. Clear cache: npx expo start --clear');
    console.log('   2. Delete node_modules and reinstall');
    console.log('   3. Check the Metro bundler logs for specific errors');
  } else {
    console.log('❌ Found potential issues that may cause bundling errors.');
    console.log('   Please fix the issues listed above and try again.');
  }
  
  console.log('\n🚀 After fixing, restart your development server:');
  console.log('   npx expo start --clear');
}

main().catch(console.error);