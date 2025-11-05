#!/usr/bin/env node

/**
 * Generate placeholder PWA icons
 * This creates simple colored square icons for PWA installation
 * In production, replace with actual designed icons
 */

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Icon sizes to generate
const sizes = [
  { size: 192, filename: 'icon-192x192.png' },
  { size: 512, filename: 'icon-512x512.png' },
  { size: 180, filename: 'apple-touch-icon.png' },
  { size: 32, filename: 'favicon-32x32.png' },
  { size: 16, filename: 'favicon-16x16.png' },
]

// Create icons directory if it doesn't exist
const iconsDir = join(__dirname, '../public/icons')
try {
  mkdirSync(iconsDir, { recursive: true })
} catch (err) {
  // Directory already exists
}

// Generate SVG icons (can be converted to PNG manually or with a tool)
function generateSVG(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0284c7;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad1)" rx="${size * 0.15}"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="${size * 0.6}" font-weight="bold" fill="white">FM</text>
</svg>`
}

// Generate placeholder icons
sizes.forEach(({ size, filename }) => {
  const svg = generateSVG(size)
  const svgPath = join(iconsDir, filename.replace('.png', '.svg'))

  writeFileSync(svgPath, svg, 'utf8')
  console.log(`✓ Generated ${svgPath}`)
})

console.log('\n📝 Note: SVG icons have been generated.')
console.log('   For production, convert these to PNG using:')
console.log('   - Online tool: https://cloudconvert.com/svg-to-png')
console.log('   - Or use sharp/imagemagick for batch conversion')
console.log('\n   Alternatively, replace with professionally designed icons.\n')
