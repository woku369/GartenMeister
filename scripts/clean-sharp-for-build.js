// scripts/clean-sharp-for-build.js
const fs = require('fs');
const path = require('path');

// Problematische Sharp-Pakete für Windows-Build entfernen
const problematicSharpPatterns = [
  'node_modules/@img/sharp-darwin-*',
  'node_modules/@img/sharp-linux-*', 
  'node_modules/@img/sharp-libvips-*',
  'node_modules/next/node_modules/@img/sharp-darwin-*',
  'node_modules/next/node_modules/@img/sharp-linux-*',
  'node_modules/next/node_modules/@img/sharp-libvips-*'
];

function removeSharpPackages() {
  console.log('🧹 Cleaning problematic Sharp packages for Windows build...');
  
  const glob = require('glob');
  
  problematicSharpPatterns.forEach(pattern => {
    try {
      const matches = glob.sync(pattern);
      matches.forEach(match => {
        if (fs.existsSync(match)) {
          console.log(`  Removing: ${match}`);
          fs.rmSync(match, { recursive: true, force: true });
        }
      });
    } catch (error) {
      console.warn(`⚠️  Could not process pattern ${pattern}:`, error.message);
    }
  });
  
  console.log('✅ Sharp cleanup completed');
}

if (require.main === module) {
  removeSharpPackages();
}

module.exports = { removeSharpPackages };
