#!/usr/bin/env node

/**
 * Build Resources Script
 * Generates placeholder icons and resources
 */

const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '../build');

// Ensure build directory exists
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Create placeholder icon info
const iconInfo = `
# Icon Files

Place your icon files in this directory:

## Required Files:

### macOS
- icon.icns (1024x1024)

### Windows
- icon.ico (256x256)

### Linux
- icons/16x16.png
- icons/32x32.png
- icons/48x48.png
- icons/64x64.png
- icons/128x128.png
- icons/256x256.png

## Tools to Generate Icons:

- https://icon.kitchen
- https://favicon.io
- electron-icon-builder (npm package)

## Example with electron-icon-builder:

\`\`\`bash
npm install -g electron-icon-builder
electron-icon-builder --input=./assets/logo.png --output=./build --flatten
\`\`\`
`;

fs.writeFileSync(path.join(buildDir, 'README.md'), iconInfo);

// Create icons directory for Linux
const iconsDir = path.join(buildDir, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Build resources structure created.');
console.log('Please add icon files to the build directory.');
