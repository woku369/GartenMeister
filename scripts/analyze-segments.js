// Debug-Script für Segmentanalyse
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(
  process.env.APPDATA || process.env.HOME || '.',
  'GartenMeister',
  'data',
  'app-data.json'
);

function analyzeSegments() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error('Datei nicht gefunden:', DATA_PATH);
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  
  console.log('=== SEGMENT-ANALYSE ===');
  console.log('Datei-Struktur:');
  console.log('- beds:', Array.isArray(data.beds) ? data.beds.length : 'nicht gefunden');
  console.log('- segments:', Array.isArray(data.segments) ? data.segments.length : 'nicht gefunden');
  console.log('- herbVarieties:', Array.isArray(data.herbVarieties) ? data.herbVarieties.length : 'nicht gefunden');
  
  if (!Array.isArray(data.segments)) {
    console.error('❌ Keine segments gefunden!');
    return;
  }
  
  if (data.segments.length === 0) {
    console.error('❌ segments-Array ist leer!');
    return;
  }
  
  console.log('\n=== SEGMENTE ===');
  data.segments.forEach((segment, i) => {
    console.log(`${i + 1}. ${segment.id}:`);
    console.log(`   - bedId: ${segment.bedId}`);
    console.log(`   - herbVarietyId: ${segment.herbVarietyId}`);
    console.log(`   - segmentLength: ${segment.segmentLength}m`);
    console.log(`   - plantsPerMeter: ${segment.plantsPerMeter}`);
    console.log(`   - plantingDate: ${segment.plantingDate}`);
  });
  
  console.log('\n=== VERSUCHSBEETE ===');
  if (Array.isArray(data.beds)) {
    const versuchsbeete = data.beds.filter(bed => bed.type === 'Versuchsbeet');
    versuchsbeete.forEach(bed => {
      const bedSegments = data.segments.filter(s => s.bedId === bed.id);
      console.log(`Beet ${bed.bedNumber} (${bed.id}): ${bedSegments.length} Segmente`);
      bedSegments.forEach((seg, i) => {
        console.log(`  ${i + 1}. ${seg.id} - ${seg.herbVarietyId} (${seg.segmentLength}m)`);
      });
    });
  }
  
  console.log('\n=== KRÄUTER ===');
  if (Array.isArray(data.herbVarieties)) {
    data.herbVarieties.forEach(herb => {
      console.log(`${herb.id}: ${herb.name} (${herb.color})`);
    });
  }
}

analyzeSegments();
