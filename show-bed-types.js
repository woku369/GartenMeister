// Zeige aktuelle Beet-Typen
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:\\Users\\WK\\AppData\\Roaming\\GartenMeister\\data\\app-data.json', 'utf8'));

console.log('=== AKTUELLE BEET-TYPEN ===');
data.beds.forEach(bed => {
  console.log(`${bed.id}: ${bed.type} (bedNumber: ${bed.bedNumber})`);
});

console.log('\n=== TYP-STATISTIK ===');
const typeCount = {};
data.beds.forEach(bed => {
  typeCount[bed.type] = (typeCount[bed.type] || 0) + 1;
});

Object.keys(typeCount).forEach(type => {
  console.log(`${type}: ${typeCount[type]} Beete`);
});
