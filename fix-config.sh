#!/bin/bash

echo "🔧 FIXING APP CONFIGURATION ISSUES"
echo "=================================="
echo ""

# Make the script executable
chmod +x fix-app-config.js

# Run the configuration fix
node fix-app-config.js

echo ""
echo "✅ Configuration fix completed!"
echo ""
echo "🚀 You can now run:"
echo "   npm run start"
echo "   or"
echo "   bunx rork start -p mrjfx7h4qr7c2x9p43htd --tunnel"
echo ""