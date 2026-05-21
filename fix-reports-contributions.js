const fs = require('fs');
const path = require('path');

const reportsPagePath = path.join(__dirname, 'src', 'app', 'reports', 'page.tsx');

console.log('🔧 Repariere Reports-Contributions-Loading...');

// Lese die aktuelle Datei
let content = fs.readFileSync(reportsPagePath, 'utf8');

// Ersetze die harvestContributions-Ladung durch Extraktion aus harvestEvents
const oldCode = `const contributions = jsonData?.harvestContributions || [];`;

const newCode = `// Extract contributions from harvestEvents instead of using old harvestContributions
          const extractedContributions: HarvestContribution[] = [];
          if (harvestsData && Array.isArray(harvestsData)) {
            harvestsData.forEach(harvestEvent => {
              if (harvestEvent.contributions && Array.isArray(harvestEvent.contributions)) {
                harvestEvent.contributions.forEach(contribution => {
                  extractedContributions.push({
                    ...contribution,
                    id: contribution.id || \`\${harvestEvent.id}-\${contribution.bedId}\`,
                    harvestEventId: harvestEvent.id
                  });
                });
              }
            });
          }`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  console.log('✅ harvestContributions-Ladung ersetzt');
} else {
  console.log('❌ harvestContributions-Ladung nicht gefunden');
}

// Ersetze auch die setAllContributions-Zeile
const oldSetCode = `setAllContributions(contributions || []); // Lade echte Contributions aus JSON`;
const newSetCode = `setAllContributions(extractedContributions); // Use extracted contributions from harvestEvents`;

if (content.includes(oldSetCode)) {
  content = content.replace(oldSetCode, newSetCode);
  console.log('✅ setAllContributions-Aufruf angepasst');
} else {
  console.log('❌ setAllContributions-Aufruf nicht gefunden');
}

// Aktualisiere auch die Debug-Logs
const oldDebugCode = `console.log('[Reports] Geladene Contributions:', contributions?.length || 0);
          console.log('[Reports] Debug - Contributions:', JSON.stringify(contributions, null, 2));`;

const newDebugCode = `console.log('[Reports] Extrahierte Contributions aus HarvestEvents:', extractedContributions?.length || 0);
          console.log('[Reports] Debug - Extracted Contributions:', JSON.stringify(extractedContributions, null, 2));`;

if (content.includes(oldDebugCode)) {
  content = content.replace(oldDebugCode, newDebugCode);
  console.log('✅ Debug-Logs angepasst');
} else {
  console.log('❌ Debug-Logs nicht gefunden - das ist OK');
}

// Schreibe die Datei zurück
fs.writeFileSync(reportsPagePath, content, 'utf8');

console.log('🎉 Reports-Contributions-Loading repariert!');
console.log('📄 Datei aktualisiert:', reportsPagePath);
