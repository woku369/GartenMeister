// Füge fehlende Kräuter hinzu
const fs = require('fs');

const dataPath = 'C:\\Users\\WK\\AppData\\Roaming\\GartenMeister\\data\\app-data.json';

console.log('=== FEHLENDE KRÄUTER HINZUFÜGEN ===\n');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Backup erstellen
const backupPath = dataPath + '.backup-add-herbs-' + Date.now();
fs.copyFileSync(dataPath, backupPath);
console.log('Backup erstellt:', backupPath);

// Neue Kräuter hinzufügen (basierend auf den Segment-IDs)
const newHerbs = [
    {
        id: 'herb-100',
        name: 'Zitronengras',
        color: '#E6FF2A',
        isFixed: false
    },
    {
        id: 'herb-101',
        name: 'Schweizer Minze',
        color: '#90EE90',
        isFixed: false
    },
    {
        id: 'herb-102',
        name: 'Zitronenverbene',
        color: '#00FF7F',
        isFixed: false
    }
];

// Prüfe welche Kräuter fehlen
newHerbs.forEach(newHerb => {
    const exists = data.herbVarieties.find(h => h.id === newHerb.id);
    if (!exists) {
        console.log(`Füge hinzu: ${newHerb.name} (${newHerb.color})`);
        data.herbVarieties.push(newHerb);
    } else {
        console.log(`Bereits vorhanden: ${newHerb.name}`);
    }
});

// Aktualisiere nextHerbId falls nötig
const maxHerbId = Math.max(
    ...data.herbVarieties
        .filter(h => h.id.startsWith('herb-'))
        .map(h => parseInt(h.id.replace('herb-', '')))
        .filter(id => !isNaN(id))
);

if (maxHerbId >= (data.nextHerbId || 100)) {
    data.nextHerbId = maxHerbId + 1;
    console.log(`nextHerbId aktualisiert auf: ${data.nextHerbId}`);
}

// Speichere
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log('\n=== FERTIG ===');
console.log('Anzahl Kräuter nach Update:', data.herbVarieties.length);
