#!/usr/bin/env node
/**
 * Extension Packaging Script
 * Creates a properly structured ZIP for Volt extension releases.
 *
 * Usage: node scripts/package-extension.js <extension-folder>
 * Example: node scripts/package-extension.js password-generator
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const extensionName = process.argv[2];

if (!extensionName) {
  console.error('Usage: node scripts/package-extension.js <extension-folder>');
  console.error('Example: node scripts/package-extension.js password-generator');
  process.exit(1);
}

const extensionDir = path.join(__dirname, '..', 'examples', extensionName);
const distDir = path.join(__dirname, '..', 'dist');
const manifestPath = path.join(extensionDir, 'manifest.json');

// Check if extension exists
if (!fs.existsSync(extensionDir)) {
  console.error(`Extension folder not found: ${extensionDir}`);
  process.exit(1);
}

// Check if manifest.json exists
if (!fs.existsSync(manifestPath)) {
  console.error(`manifest.json not found in ${extensionDir}`);
  process.exit(1);
}

// Read version from manifest
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = manifest.version || '1.0.0';
const zipName = `${extensionName}-v${version}.zip`;

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const outputPath = path.join(distDir, zipName);

// Remove existing zip if it exists
if (fs.existsSync(outputPath)) {
  fs.unlinkSync(outputPath);
}

console.log(`Packaging ${extensionName} v${version}...`);

// Create ZIP using PowerShell (Windows) or zip command (Unix)
try {
  if (process.platform === 'win32') {
    // Use PowerShell Compress-Archive on Windows
    const psCommand = `Compress-Archive -Path "${extensionDir}\\*" -DestinationPath "${outputPath}" -Force`;
    execSync(`powershell -Command "${psCommand}"`, { stdio: 'inherit' });
  } else {
    // Use zip command on Unix
    execSync(`cd "${extensionDir}" && zip -r "${outputPath}" .`, { stdio: 'inherit' });
  }

  console.log(`\nSuccess! Created: ${outputPath}`);
  console.log(`\nNext steps:`);
  console.log(`1. Create a GitHub release with tag: ${extensionName}-v${version}`);
  console.log(`2. Upload ${zipName} to the release`);
  console.log(`3. The downloadUrl should be:`);
  console.log(`   https://github.com/VoltLaunchr/volt-extensions/releases/download/${extensionName}-v${version}/${zipName}`);
} catch (error) {
  console.error('Error creating ZIP:', error.message);
  process.exit(1);
}
