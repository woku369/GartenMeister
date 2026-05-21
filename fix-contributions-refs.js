const fs = require('fs');
const path = require('path');

const reportsPagePath = path.join(__dirname, 'src', 'app', 'reports', 'page.tsx');

console.log('🔧 Repariere verbleibende contributions-Referenzen...');

// Lese die aktuelle Datei
let content = fs.readFileSync(reportsPagePath, 'utf8');

// Ersetze die verbleibenden contributions-Referenzen
const fixes = [
  {
    old: `console.log('[Reports] Geladene Contributions:', contributions?.length || 0);`,
    new: `console.log('[Reports] Extrahierte Contributions aus HarvestEvents:', extractedContributions?.length || 0);`
  },
  {
    old: `console.log('[Reports] Debug - Contributions:', JSON.stringify(contributions, null, 2));`,
    new: `console.log('[Reports] Debug - Extracted Contributions:', JSON.stringify(extractedContributions, null, 2));`
  }
];

let fixedCount = 0;

fixes.forEach((fix, index) => {
  if (content.includes(fix.old)) {
    content = content.replace(fix.old, fix.new);
    console.log(`✅ Fix ${index + 1} angewendet`);
    fixedCount++;
  } else {
    console.log(`❌ Fix ${index + 1} nicht gefunden`);
  }
});

// Schreibe die Datei zurück
fs.writeFileSync(reportsPagePath, content, 'utf8');

console.log(`🎉 ${fixedCount} Fixes angewendet!`);
console.log('📄 Reports-Contributions-Referenzen repariert!');
