#!/bin/bash
set -e

echo "🔧 FIXING BABEL CONFIGURATION"
echo "============================="

# Check if babel.config.js exists
if [ ! -f "babel.config.js" ]; then
  if [ -f "babel.config.production.js" ]; then
    echo "📝 Copying babel.config.production.js to babel.config.js..."
    cp babel.config.production.js babel.config.js
    echo "✅ babel.config.js created successfully"
  else
    echo "📝 Creating babel.config.js from scratch..."
    cat > babel.config.js << 'EOF'
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
        },
      ],
    ],
    plugins: [
      // Required for expo-router
      'expo-router/babel',
    ],
  };
};
EOF
    echo "✅ babel.config.js created from template"
  fi
else
  echo "✅ babel.config.js already exists"
fi

# Verify the file was created correctly
if [ -f "babel.config.js" ]; then
  echo "🔍 Verifying babel.config.js syntax..."
  if node -e "require('./babel.config.js')" 2>/dev/null; then
    echo "✅ babel.config.js syntax is valid"
  else
    echo "❌ babel.config.js has syntax errors"
  fi
else
  echo "❌ Failed to create babel.config.js"
fi

echo ""
echo "🚀 Now run: bun run start --clear"
echo "   This should resolve the babel configuration issues"