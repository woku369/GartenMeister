// Test-Script für DataStore-Funktionen
const fs = require('fs');
const path = require('path');

// Mock der Node.js-spezifischen Module die in DataStore verwendet werden
const mockStore = {
  beds: [],
  herbVarieties: [],
  segments: [],
  gartenConfiguration: { currentBeetCount: 20 }
};

// Simuliere das Laden der Daten
const DATA_PATH = path.join(
  process.env.APPDATA || process.env.HOME || '.',
  'GartenMeister',
  'data',
  'app-data.json'
);

console.log('=== DATASTORE TEST ===');

if (fs.existsSync(DATA_PATH)) {
  const rawData = fs.readFileSync(DATA_PATH, 'utf-8');
  const data = JSON.parse(rawData);
  
  console.log('✅ Datei erfolgreich gelesen');
  console.log('Raw Data Keys:', Object.keys(data));
  
  // Simuliere was der DataStore macht
  const store = {
    beds: Array.isArray(data.beds) ? data.beds : [],
    herbVarieties: Array.isArray(data.herbVarieties) ? data.herbVarieties : [],
    segments: Array.isArray(data.segments) ? data.segments : [],
    gartenConfiguration: data.gartenConfiguration || { currentBeetCount: 20 }
  };
  
  console.log('Store nach Load:', {
    beds: store.beds.length,
    herbVarieties: store.herbVarieties.length,
    segments: store.segments.length,
    hasConfig: !!store.gartenConfiguration
  });
  
  // Simuliere getAllSegments()
  console.log('\\n=== getAllSegments() ===');
  console.log('Segments:', store.segments);
  
  // Simuliere getSegmentsByBedId('bed-1')
  console.log('\\n=== getSegmentsByBedId("bed-1") ===');
  const bed1Segments = store.segments.filter(s => s.bedId === 'bed-1');
  console.log('Segments für bed-1:', bed1Segments);
  
} else {
  console.error('❌ Datei nicht gefunden:', DATA_PATH);
}
