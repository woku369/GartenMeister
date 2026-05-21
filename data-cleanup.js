// Datenbereinigung für GartenMeister - entfernt Duplikate
const fs = require('fs');
const path = require('path');

const dataPath = 'C:\\Users\\WK\\AppData\\Roaming\\GartenMeister\\data\\app-data.json';

// Lade Daten
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('Ursprüngliche Beete:', data.beds.length);
console.log('Beetnummern:', data.beds.map(bed => `${bed.id}: Beet ${bed.bedNumber}`));

// Finde Duplikate
const bedNumbers = {};
data.beds.forEach(bed => {
  if (!bedNumbers[bed.bedNumber]) {
    bedNumbers[bed.bedNumber] = [];
  }
  bedNumbers[bed.bedNumber].push(bed);
});

console.log('\nDuplikate gefunden:');
Object.keys(bedNumbers).forEach(num => {
  if (bedNumbers[num].length > 1) {
    console.log(`Beetnummer ${num}: ${bedNumbers[num].length} Beete`);
    bedNumbers[num].forEach(bed => {
      console.log(`  - ${bed.id}: ${bed.type}, ${bed.width}m, ${bed.herbVarietyId || 'keine Sorte'}`);
    });
  }
});

// Bereinigung: Behalte nur das neueste Beet pro Nummer (höchste ID)
const cleanedBeds = [];
Object.keys(bedNumbers).forEach(num => {
  const bedsForNumber = bedNumbers[num];
  if (bedsForNumber.length === 1) {
    cleanedBeds.push(bedsForNumber[0]);
  } else {
    // Sortiere nach ID und nimm das letzte (neueste)
    const sorted = bedsForNumber.sort((a, b) => {
      const aNum = parseInt(a.id.split('-')[1]);
      const bNum = parseInt(b.id.split('-')[1]);
      return aNum - bNum;
    });
    const kept = sorted[sorted.length - 1];
    cleanedBeds.push(kept);
    console.log(`\nFür Beetnummer ${num} wird ${kept.id} behalten (${kept.type}, ${kept.width}m)`);
  }
});

// Backup erstellen
const backupPath = dataPath + '.backup-' + Date.now();
fs.copyFileSync(dataPath, backupPath);
console.log(`\nBackup erstellt: ${backupPath}`);

// Bereinigte Daten speichern
data.beds = cleanedBeds;
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log(`\nBereinigung abgeschlossen:`);
console.log(`Ursprünglich: ${data.beds.length + (Object.keys(bedNumbers).length - cleanedBeds.length)} Beete`);
console.log(`Bereinigt: ${cleanedBeds.length} Beete`);
console.log(`Entfernt: ${Object.keys(bedNumbers).reduce((sum, num) => sum + (bedNumbers[num].length - 1), 0)} Duplikate`);
