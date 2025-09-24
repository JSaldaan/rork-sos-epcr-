const fs = require('fs');
const path = require('path');

// Get current directory
const __dirname = process.cwd();

console.log('🔧 Fixing app.json configuration...');

try {
  // Read the current app.json
  const appJsonPath = path.join(__dirname, 'app.json');
  const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
  const appConfig = JSON.parse(appJsonContent);

  // Fix the iOS entitlements structure
  if (appConfig.expo && appConfig.expo.ios && appConfig.expo.ios.entitlements) {
    console.log('📱 Fixing iOS entitlements structure...');
    
    // Replace the nested structure with the correct flat structure
    appConfig.expo.ios.entitlements = {
      "com.apple.developer.networking.wifi-info": true
    };
    
    // Write the fixed configuration back
    fs.writeFileSync(appJsonPath, JSON.stringify(appConfig, null, 2));
    console.log('✅ Fixed app.json entitlements structure');
  }

  // Verify the fix
  const fixedContent = fs.readFileSync(appJsonPath, 'utf8');
  const fixedConfig = JSON.parse(fixedContent);
  
  if (fixedConfig.expo.ios.entitlements["com.apple.developer.networking.wifi-info"] === true) {
    console.log('✅ Verification passed - entitlements are correctly structured');
  } else {
    console.log('❌ Verification failed - manual fix required');
  }

} catch (error) {
  console.error('❌ Error fixing app.json:', error.message);
  console.log('');
  console.log('Manual fix required:');
  console.log('In app.json, change the iOS entitlements from:');
  console.log('"entitlements": {');
  console.log('  "com": {');
  console.log('    "apple": {');
  console.log('      "developer": {');
  console.log('        "networking": {');
  console.log('          "wifi-info": true');
  console.log('        }');
  console.log('      }');
  console.log('    }');
  console.log('  }');
  console.log('}');
  console.log('');
  console.log('To:');
  console.log('"entitlements": {');
  console.log('  "com.apple.developer.networking.wifi-info": true');
  console.log('}');
}