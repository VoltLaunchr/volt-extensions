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
const { execFileSync, execSync } = require('child_process');

const extensionName = process.argv[2];

if (!extensionName) {
  console.error('Usage: node scripts/package-extension.js <extension-folder>');
  console.error('Example: node scripts/package-extension.js password-generator');
  process.exit(1);
}

// Look in the official store first, then community submissions and examples.
const sourceRoots = ['extensions', 'community', 'examples'];
let extensionDir = null;
for (const sourceRoot of sourceRoots) {
  const candidate = path.join(__dirname, '..', sourceRoot, extensionName);
  if (fs.existsSync(candidate)) {
    extensionDir = candidate;
    break;
  }
}
const distDir = path.join(__dirname, '..', 'dist');

// Check if extension exists
if (!extensionDir) {
  console.error(`Extension folder not found in extensions/, community/, or examples/: ${extensionName}`);
  process.exit(1);
}

const manifestPath = path.join(extensionDir, 'manifest.json');

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
    // Use PowerShell Compress-Archive on Windows.
    const escapedExtensionDir = extensionDir.replace(/'/g, "''");
    const escapedOutputPath = outputPath.replace(/'/g, "''");
    const psCommand = [
      "$excluded = @('node_modules', 'dist', '.volt-publish', '.volt-store', 'package-lock.json')",
      `$items = Get-ChildItem -LiteralPath '${escapedExtensionDir}' -Force | Where-Object { $excluded -notcontains $_.Name -and $_.Name -notlike '*.zip' -and $_.Name -notlike '*.tar.gz' }`,
      `Compress-Archive -Path $items.FullName -DestinationPath '${escapedOutputPath}' -Force`,
    ].join('; ');
    execFileSync('powershell', ['-NoProfile', '-Command', psCommand], {
      stdio: 'inherit',
    });
  } else {
    // Use zip command on Unix
    execSync(
      `cd "${extensionDir}" && zip -r "${outputPath}" . -x "node_modules/*" "dist/*" ".volt-publish/*" ".volt-store/*" "package-lock.json" "*.zip" "*.tar.gz"`,
      { stdio: 'inherit' }
    );
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
