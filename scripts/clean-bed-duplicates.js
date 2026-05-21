// Skript zur Bereinigung von doppelten Beetnummern und IDs in app-data.json
// Legt eine bereinigte Datei app-data.cleaned.json an

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(
  process.env.APPDATA || process.env.HOME || '.',
  'GartenMeister',
  'data',
  'app-data.json'
);
const OUTPUT_PATH = path.join(
  process.env.APPDATA || process.env.HOME || '.',
  'GartenMeister',
  'data',
  'app-data.cleaned.json'
);

function cleanBeds(beds) {
  const seenNumbers = new Set();
  const seenIds = new Set();
  const cleaned = [];
  for (const bed of beds) {
    if (typeof bed.bedNumber !== 'number' || typeof bed.id !== 'string') continue;
    if (seenNumbers.has(bed.bedNumber) || seenIds.has(bed.id)) {
      // Duplikat, überspringen
      continue;
    }
    seenNumbers.add(bed.bedNumber);
    seenIds.add(bed.id);
    cleaned.push(bed);
  }
  return cleaned;
}

function main() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error('Datei nicht gefunden:', DATA_PATH);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  if (!Array.isArray(data.beds)) {
    console.error('Keine "beds"-Liste gefunden!');
    process.exit(1);
  }
  const cleanedBeds = cleanBeds(data.beds);
  const cleaned = { ...data, beds: cleanedBeds };
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(cleaned, null, 2), 'utf-8');
  console.log('Bereinigung abgeschlossen. Neue Datei:', OUTPUT_PATH);
}

main();
