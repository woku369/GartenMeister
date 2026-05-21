const fs = require('fs');
const path = require('path');

const reportsPagePath = path.join(__dirname, 'src', 'app', 'reports', 'page.tsx');

console.log('🔍 Füge Debug-Logs für HarvestEvents hinzu...');

// Lese die aktuelle Datei
let content = fs.readFileSync(reportsPagePath, 'utf8');

// Füge Debug-Logs vor der Contributions-Extraktion hinzu
const insertPoint = `// Extract contributions from harvestEvents instead of using old harvestContributions`;

const debugCode = `// Debug: Schaue was in harvestsData drin steht
          console.log('[Reports] harvestsData:', harvestsData);
          console.log('[Reports] harvestsData ist Array?', Array.isArray(harvestsData));
          if (harvestsData && Array.isArray(harvestsData)) {
            harvestsData.forEach((event, index) => {
              console.log(\`[Reports] HarvestEvent \${index}:\`, event.id, 'contributions:', event.contributions);
            });
          }
          
          // Extract contributions from harvestEvents instead of using old harvestContributions`;

if (content.includes(insertPoint)) {
  content = content.replace(insertPoint, debugCode);
  console.log('✅ Debug-Logs hinzugefügt');
} else {
  console.log('❌ Insertionspunkt nicht gefunden');
}

// Schreibe die Datei zurück
fs.writeFileSync(reportsPagePath, content, 'utf8');

console.log('🎉 Debug-Logs für HarvestEvents hinzugefügt!');
console.log('📄 Datei aktualisiert:', reportsPagePath);
