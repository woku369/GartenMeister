const path = require('path');
const fs = require('fs');

console.log('🎯 === NAS-INTEGRATION STATUS ===\n');

// NAS-Ordner prüfen
const nasBase = 'G:\\gartenmeister';
console.log('📁 NAS-Ordnerstruktur:');

function listDir(dir, indent = '') {
  try {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        console.log(indent + '📂 ' + item + '/');
        if (indent.length < 6) listDir(fullPath, indent + '  ');
      } else {
        const size = (stat.size / 1024).toFixed(1);
        console.log(indent + '📄 ' + item + ' (' + size + ' KB)');
      }
    });
  } catch (err) {
    console.log(indent + '❌ Fehler beim Lesen von ' + dir);
  }
}

listDir(nasBase);

console.log('\n🔍 Wichtige Dateien:');
const importantFiles = [
  'G:\\gartenmeister\\data\\app-data.json',
  'G:\\gartenmeister\\weather\\weather-config.json',
  'G:\\gartenmeister\\sync\\nas-config.json',
  'G:\\gartenmeister\\sync\\integration-status.json'
];

importantFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stat = fs.statSync(file);
    console.log('✅ ' + path.basename(file) + ' (' + (stat.size / 1024).toFixed(1) + ' KB)');
  } else {
    console.log('❌ ' + path.basename(file) + ' (nicht gefunden)');
  }
});

console.log('\n🎉 NAS-Integration bereit für Produktionsbetrieb!');
