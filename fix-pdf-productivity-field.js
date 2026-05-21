const fs = require('fs');
const path = require('path');

const pdfGeneratorPath = path.join(__dirname, 'src', 'simple-pdf-generator-improved.js');

console.log('🔧 Repariere Produktivitätswerte im PDF-Generator...');

// Lese die aktuelle Datei
let content = fs.readFileSync(pdfGeneratorPath, 'utf8');

// Ersetze das falsche Feld mit dem korrekten
const oldField = 'contrib.productivePlantsPercentageAtHarvestTime';
const newField = 'contrib.productivePlantsPercentage';

console.log('Suche nach:', oldField);
console.log('Ersetze mit:', newField);

if (content.includes(oldField)) {
  content = content.replace(new RegExp(oldField, 'g'), newField);
  console.log('✅ Feldname im PDF-Generator korrigiert');
} else {
  console.log('❌ Feldname nicht gefunden');
}

// Schreibe die Datei zurück
fs.writeFileSync(pdfGeneratorPath, content, 'utf8');

console.log('🎉 PDF-Generator-Feldname repariert!');
console.log('📄 Datei aktualisiert:', pdfGeneratorPath);
