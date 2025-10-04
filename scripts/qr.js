#!/usr/bin/env node
'use strict';

// Generate a terminal QR code for any provided text/URL
// Usage:
//   node scripts/qr.js "https://example.com"
//   npm run qr -- "exp://your-expo-url"
//   EXPO_URL="exp://your-expo-url" npm run qr

const qrcode = require('qrcode-terminal');

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = { small: false, text: '' };
  const textParts = [];

  for (const arg of args) {
    if (arg === '--small' || arg === '-s') {
      result.small = true;
    } else {
      textParts.push(arg);
    }
  }

  result.text = textParts.join(' ').trim();
  return result;
}

function resolveInputText(cliText) {
  if (cliText) return cliText;

  const envKeys = [
    'EXPO_URL',
    'EXPO_TUNNEL_URL',
    'TUNNEL_URL',
    'URL'
  ];
  for (const key of envKeys) {
    if (process.env[key] && String(process.env[key]).trim()) {
      return String(process.env[key]).trim();
    }
  }
  return '';
}

(function main() {
  const { small, text } = parseArgs(process.argv);
  const input = resolveInputText(text);

  if (!input) {
    console.error('[qr] No input provided.');
    console.error('Usage:');
    console.error('  npm run qr -- "exp://your-expo-url"');
    console.error('  node scripts/qr.js --small "https://example.com"');
    console.error('  EXPO_URL="exp://your-expo-url" npm run qr');
    process.exit(1);
  }

  console.log('');
  console.log('Generating QR for:');
  console.log(input);
  console.log('');

  try {
    qrcode.generate(input, { small });
  } catch (error) {
    console.error('[qr] Failed to generate QR:', error && error.message ? error.message : error);
    process.exit(1);
  }
})();
