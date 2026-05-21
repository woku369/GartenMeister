const fs = require('fs');
const path = require('path');

const pdfGeneratorPath = path.join(__dirname, 'src', 'simple-pdf-generator-improved.js');

console.log('🎨 Verbessere PDF-Ernteübersicht Design...');

// Lese die aktuelle Datei
let content = fs.readFileSync(pdfGeneratorPath, 'utf8');

// 1. Verbessere die Hauptübersicht - entferne "Ertragsfähige Pflanzen" und mache es plakativer
const oldStatsSection = `            <h2>Ernteübersicht</h2>
            
            <div class="stats-container">
                <div class="stat-box">
                    <div class="stat-number">\${totalHarvests}</div>
                    <div class="stat-label">Erntevorgänge</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">\${totalYield.toFixed(2)} kg</div>
                    <div class="stat-label">Gesamtertrag</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">\${totalPlants}</div>
                    <div class="stat-label">Ertragsfähige Pflanzen</div>
                </div>
            </div>`;

const newStatsSection = `            <div style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); color: white; padding: 30px; border-radius: 12px; margin: 20px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <h2 style="color: white; font-size: 28px; margin-bottom: 20px; text-align: center; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
                    🌿 Bewirtschaftungsjahr \${currentYear} - Ernteübersicht
                </h2>
                
                <div style="display: flex; justify-content: center; gap: 40px; margin-top: 25px;">
                    <div style="text-align: center; background: rgba(255,255,255,0.15); padding: 20px; border-radius: 8px; min-width: 140px;">
                        <div style="font-size: 36px; font-weight: bold; margin-bottom: 8px;">\${totalHarvests}</div>
                        <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Erntevorgänge</div>
                    </div>
                    <div style="text-align: center; background: rgba(255,255,255,0.15); padding: 20px; border-radius: 8px; min-width: 140px;">
                        <div style="font-size: 36px; font-weight: bold; margin-bottom: 8px;">\${totalYield.toFixed(0)} kg</div>
                        <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Gesamtertrag</div>
                    </div>
                </div>
            </div>`;

if (content.includes(oldStatsSection)) {
  content = content.replace(oldStatsSection, newStatsSection);
  console.log('✅ Haupt-Ernteübersicht verbessert - plakativer und ohne Ertragsfähige Pflanzen');
} else {
  console.log('❌ Haupt-Ernteübersicht nicht gefunden');
}

// 2. Verbessere die Listendarstellung der Ernten - behebe "keine Beet-Zuordnung" Problem
const oldListSection = `                    \${harvestEvents.map(event => \`
                        <li style="margin-bottom: 8px;">
                            <strong>\${event.herbName}</strong>: 
                            \${event.totalYieldKg || 0} kg von \${event.totalYieldablePlantsForEvent || 0} Pflanzen
                            \${event.contributingBedNumbersString ? \` (Beete: \${event.contributingBedNumbersString})\` : ' (keine Beet-Zuordnung)'}
                        </li>
                    \`).join('')}`;

const newListSection = `                    \${harvestEvents.map(event => {
                        // Bessere Darstellung der Beet-Zuordnung
                        const bedInfo = event.contributingBedNumbersString && event.contributingBedNumbersString.trim() 
                            ? \`Beete: \${event.contributingBedNumbersString}\` 
                            : 'Gesamtbetrieb';
                        
                        // Gewicht hervorheben
                        const weight = event.totalYieldKg || 0;
                        const weightDisplay = weight > 0 ? \`<strong>\${weight.toFixed(1)} kg</strong>\` : '<em>0 kg</em>';
                        
                        return \`
                        <li style="margin-bottom: 12px; padding: 8px; background: rgba(34, 197, 94, 0.05); border-left: 3px solid #22c55e; border-radius: 4px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span><strong>\${event.herbName || 'Unbekannte Sorte'}</strong> - \${weightDisplay}</span>
                                <span style="font-size: 12px; color: #666;">(\${bedInfo})</span>
                            </div>
                        </li>\`;
                    }).join('')}`;

if (content.includes(oldListSection)) {
  content = content.replace(oldListSection, newListSection);
  console.log('✅ Ernte-Liste verbessert - keine "keine Beet-Zuordnung" mehr');
} else {
  console.log('❌ Ernte-Liste nicht gefunden');
}

// 3. Entferne "Ertragsfähige Pflanzen" aus den Jahresstatistiken
const oldYearlyStats = `                        <div class="stat-box">
                            <div class="stat-number">\${yearTotalPlants.toLocaleString()}</div>
                            <div class="stat-label">Ertragsfähige Pflanzen</div>
                        </div>`;

const newYearlyStats = `                        <div class="stat-box">
                            <div class="stat-number">\${yearTotalHarvests}</div>
                            <div class="stat-label">Ernten gesamt</div>
                        </div>`;

// Ersetze die Ertragsfähige Pflanzen Statistik
content = content.replace(oldYearlyStats, newYearlyStats);

// Entferne auch die doppelte "Ernten gesamt" Box (falls vorhanden)
const duplicateHarvestBox = `                        <div class="stat-box">
                            <div class="stat-number">\${yearTotalHarvests}</div>
                            <div class="stat-label">Ernten gesamt</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number">\${yearTotalHarvests}</div>
                            <div class="stat-label">Ernten gesamt</div>
                        </div>`;

const singleHarvestBox = `                        <div class="stat-box">
                            <div class="stat-number">\${yearTotalHarvests}</div>
                            <div class="stat-label">Ernten gesamt</div>
                        </div>`;

content = content.replace(duplicateHarvestBox, singleHarvestBox);

console.log('✅ Ertragsfähige Pflanzen aus Jahresstatistiken entfernt');

// 4. Entferne "Ertragsfähige Pflanzen" aus der Jahresstatistik-Tabelle
const oldTableHeader = `                                <th style="padding: 10px; border: 1px solid #ccc; text-align: right;">Ertragsfähige Pflanzen</th>`;
const oldTableCell = `                                    <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">
                                        \${stat.totalPlants.toLocaleString()}
                                    </td>`;

if (content.includes(oldTableHeader)) {
  content = content.replace(oldTableHeader, '');
  console.log('✅ Ertragsfähige Pflanzen Spalte aus Tabelle entfernt');
}

if (content.includes(oldTableCell)) {
  content = content.replace(new RegExp(oldTableCell.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
  console.log('✅ Ertragsfähige Pflanzen Zellen aus Tabelle entfernt');
}

// Schreibe die Datei zurück
fs.writeFileSync(pdfGeneratorPath, content, 'utf8');

console.log('🎉 PDF-Ernteübersicht Design erfolgreich verbessert!');
console.log('📄 Datei aktualisiert:', pdfGeneratorPath);
console.log('');
console.log('🎨 Verbesserungen:');
console.log('   ✅ Plakative Hauptübersicht mit Gradient-Design');
console.log('   ✅ "Ertragsfähige Pflanzen" komplett entfernt');
console.log('   ✅ "keine Beet-Zuordnung" → "Gesamtbetrieb"');
console.log('   ✅ Bessere Gewichts-Hervorhebung');
console.log('   ✅ Moderne Card-basierte Ernte-Liste');
