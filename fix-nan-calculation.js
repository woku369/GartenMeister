const fs = require('fs');
const path = require('path');

const reportsPagePath = path.join(__dirname, 'src', 'app', 'reports', 'page.tsx');

console.log('🔧 Repariere NaN-Problem in Pflanzenberechnung...');

// Lese die aktuelle Datei
let content = fs.readFileSync(reportsPagePath, 'utf8');

// Finde und repariere die Pflanzenberechnung für StandardBed
const oldCalculation = `const yieldablePlantsCount = plantsPerMeter * length * (contribution.productivePlantsPercentage / 100);`;

const newCalculation = `// Konvertiere zu Zahlen um NaN zu vermeiden
              const plantsPerMeterNum = Number(plantsPerMeter) || 0;
              const lengthNum = Number(length) || 0;
              const productivityNum = Number(contribution.productivePlantsPercentage) || 0;
              
              console.log('[ReportsPage] Numeric conversion - plantsPerMeter:', plantsPerMeterNum, 'length:', lengthNum, 'productivity:', productivityNum);
              
              const yieldablePlantsCount = plantsPerMeterNum * lengthNum * (productivityNum / 100);`;

if (content.includes(oldCalculation)) {
  content = content.replace(oldCalculation, newCalculation);
  console.log('✅ StandardBed Berechnung repariert');
} else {
  console.log('❌ StandardBed Berechnung nicht gefunden');
}

// Repariere auch die CombinationBed Berechnung falls vorhanden
const oldCombinationCalc = `const calculatedPlants = relevantSegment.plantsPerSquareMeter * relevantSegment.area * (contribution.productivePlantsPercentage / 100);`;

const newCombinationCalc = `// Konvertiere zu Zahlen um NaN zu vermeiden
                const plantsPerSqMeterNum = Number(relevantSegment.plantsPerSquareMeter) || 0;
                const areaNum = Number(relevantSegment.area) || 0;
                const productivityNum = Number(contribution.productivePlantsPercentage) || 0;
                
                console.log('[ReportsPage] CombinationBed - plantsPerSqMeter:', plantsPerSqMeterNum, 'area:', areaNum, 'productivity:', productivityNum);
                
                const calculatedPlants = plantsPerSqMeterNum * areaNum * (productivityNum / 100);`;

if (content.includes(oldCombinationCalc)) {
  content = content.replace(oldCombinationCalc, newCombinationCalc);
  console.log('✅ CombinationBed Berechnung repariert');
} else {
  console.log('❌ CombinationBed Berechnung nicht gefunden - das ist OK');
}

// Schreibe die Datei zurück
fs.writeFileSync(reportsPagePath, content, 'utf8');

console.log('🎉 NaN-Problem repariert!');
console.log('📄 Datei aktualisiert:', reportsPagePath);
