#!/usr/bin/env node

/**
 * Generate placeholder icons for ShortFiles
 */

const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '../build');
const iconsDir = path.join(buildDir, 'icons');

// Ensure directories exist
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Simple SVG icon (Sparkles/File organization theme)
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="url(#gradient)" rx="100"/>
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <path fill="white" d="M256 128 L320 192 L384 128 L320 64 L256 128 Z" opacity="0.9"/>
  <path fill="white" d="M192 192 L128 256 L192 320 L256 256 L192 192 Z" opacity="0.8"/>
  <path fill="white" d="M320 320 L384 256 L320 192 L256 256 L320 320 Z" opacity="0.7"/>
  <circle fill="white" cx="256" cy="256" r="20" opacity="0.9"/>
  <circle fill="white" cx="192" cy="128" r="12" opacity="0.6"/>
  <circle fill="white" cx="384" cy="320" r="16" opacity="0.7"/>
</svg>`;

// Write SVG icon
fs.writeFileSync(path.join(buildDir, 'icon.svg'), svgIcon);

// Create simple placeholder PNG files (empty for now, user can add real ones)
const sizes = [16, 32, 48, 64, 128, 256];
for (const size of sizes) {
  const placeholderPath = path.join(iconsDir, `${size}x${size}.png`);
  // Create a minimal PNG placeholder (1x1 transparent pixel)
  const minimalPNG = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x01, 0x01,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
    0xAE, 0x42, 0x60, 0x82
  ]);
  fs.writeFileSync(placeholderPath, minimalPNG);
}

const icoNotice = `# Icon Files

## Current Status
Placeholder SVG icon created: icon.svg
Placeholder PNG icons created in icons/

## Required Files:

### macOS
- icon.icns (1024x1024)
- Use: iconutil -c icns icon.svg (on macOS)

### Windows
- icon.ico (256x256)
- Use: ImageMagick or online converters

### Linux
- icons/16x16.png through icons/256x256.png (created as placeholders)

## For production builds:

### Using ImageMagick:

bash commands:
iconutil -c icns icon.svg

convert icon.svg -define icon:auto-resize=256,128,96,64,48,32,16 app.ico

for each PNG size use ImageMagick convert command

### Using online tools:
- https://favicon.io
- https://icon.kitchen
- https://www.img2icnsapp.com/
`;

fs.writeFileSync(path.join(buildDir, 'ICON_README.md'), icoNotice);

console.log('✓ Icon placeholders created');
console.log('✓ SVG icon: build/icon.svg');
console.log('✓ PNG icons: build/icons/*.png (placeholders)');
console.log('✓ See build/ICON_README.md for icon generation instructions');
