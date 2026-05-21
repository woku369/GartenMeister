const fs = require('fs');
const path = require('path');

const reportsPagePath = path.join(__dirname, 'src', 'app', 'reports', 'page.tsx');

console.log('🔧 Repariere Feldname-Mismatch in Produktivitätsberechnung...');

// Lese die aktuelle Datei
let content = fs.readFileSync(reportsPagePath, 'utf8');

// Ersetze alle Vorkommen von productivePlantsPercentageAtHarvestTime mit productivePlantsPercentage
const fixes = [
  {
    old: 'contribution.productivePlantsPercentageAtHarvestTime',
    new: 'contribution.productivePlantsPercentage'
  }
];

let fixedCount = 0;

fixes.forEach((fix, index) => {
  const regex = new RegExp(fix.old.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'g');
  const matches = content.match(regex);
  if (matches) {
    content = content.replace(regex, fix.new);
    console.log(`✅ Fix ${index + 1}: ${matches.length} Vorkommen ersetzt`);
    fixedCount += matches.length;
  } else {
    console.log(`❌ Fix ${index + 1}: Keine Vorkommen gefunden`);
  }
});

// Schreibe die Datei zurück
fs.writeFileSync(reportsPagePath, content, 'utf8');

console.log(`🎉 ${fixedCount} Feldname-Fixes angewendet!`);
console.log('📄 Produktivitäts-Feldname repariert!');
