// Korrigiert Beet-IDs und -Nummerierung für GartenMeister
const fs = require('fs');
const path = require('path');

const dataPath = 'C:\\Users\\WK\\AppData\\Roaming\\GartenMeister\\data\\app-data.json';

console.log('=== BEET-ID UND NUMMERIERUNG KORREKTUR ===\n');

// Lade Daten
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('Vorher:');
console.log(`Anzahl Beete: ${data.beds.length}`);
data.beds.forEach((bed, index) => {
  console.log(`  ${bed.id} -> bedNumber: ${bed.bedNumber}, number: ${bed.number || 'undefined'}, name: "${bed.name}"`);
});

// Backup erstellen
const backupPath = dataPath + '.backup-fix-ids-' + Date.now();
fs.copyFileSync(dataPath, backupPath);
console.log(`\nBackup erstellt: ${backupPath}`);

// Sortiere Beete nach ihrer aktuellen bedNumber (falls vorhanden) oder Index
data.beds.sort((a, b) => {
  const numA = a.bedNumber || a.number || 0;
  const numB = b.bedNumber || b.number || 0;
  return numA - numB;
});

// Korrigiere IDs und Nummerierung (1-basiert)
data.beds.forEach((bed, index) => {
  const correctNumber = index + 1;
  const correctId = `bed-${correctNumber}`;
  
  console.log(`\nKorrigiere Beet ${index + 1}:`);
  console.log(`  Alte ID: ${bed.id} -> Neue ID: ${correctId}`);
  console.log(`  Alte bedNumber: ${bed.bedNumber} -> Neue bedNumber: ${correctNumber}`);
  
  bed.id = correctId;
  bed.bedNumber = correctNumber;
  bed.number = correctNumber; // Auch number-Feld setzen falls vorhanden
  bed.name = `Beet ${correctNumber}`;
});

// Speichere korrigierte Daten
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log('\n=== NACHHER ===');
data.beds.forEach((bed, index) => {
  console.log(`  ${bed.id} -> bedNumber: ${bed.bedNumber}, number: ${bed.number || 'undefined'}, name: "${bed.name}"`);
});

console.log(`\nKorrektur abgeschlossen! Alle ${data.beds.length} Beete haben jetzt korrekte IDs (bed-1 bis bed-${data.beds.length}).`);
