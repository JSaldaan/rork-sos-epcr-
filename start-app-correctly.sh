#!/bin/bash

# Clear any existing cache
echo "Clearing cache..."
npx expo start --clear

# If that doesn't work, try with bun
echo "Starting with bun..."
bun run start

# Alternative: Start web version
echo "If mobile doesn't work, try web version:"
echo "bun run start-web"