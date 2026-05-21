/**
 * Test der PDF-Export-Funktionalität
 * Prüft sowohl die Garden-Overview als auch Reports-PDF-Generation
 */

const { SimplePdfGenerator } = require('./src/simple-pdf-generator-improved');
const path = require('path');
const fs = require('fs');

async function testPDFGeneration() {
    console.log('🧪 Teste PDF-Export-Funktionalität...\n');
    
    // Export-Verzeichnis vorbereiten
    const exportDir = path.join(__dirname, 'export');
    if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
        console.log('✅ Export-Verzeichnis erstellt');
    }
    
    // Test 1: Garden Overview PDF
    console.log('\n1️⃣ Teste Garden Overview PDF...');
    const gardenData = {
        type: 'garden',
        beds: [
            {
                id: 'bed-1',
                number: 1,
                type: 'standard',
                herbVarietyId: 'herb-1',
                status: 'planted'
            }
        ],
        segments: [],
        herbVarieties: [
            {
                id: 'herb-1',
                name: 'Test-Kräuter',
                color: '#22C55E'
            }
        ],
        gartenConfiguration: { currentBeetCount: 20 },
        filename: 'test-garden-overview'
    };
    
    try {
        const gardenFilePath = path.join(exportDir, 'test-garden-overview.pdf');
        const gardenResult = await SimplePdfGenerator.generateGardenPdf(gardenData, gardenFilePath);
        
        if (gardenResult.success) {
            console.log('✅ Garden Overview PDF erfolgreich erstellt');
            console.log(`   📄 Datei: ${gardenFilePath}`);
        } else {
            console.log('❌ Garden Overview PDF Fehler:', gardenResult.message);
        }
    } catch (error) {
        console.log('❌ Garden Overview PDF Exception:', error.message);
    }
    
    // Test 2: Reports PDF
    console.log('\n2️⃣ Teste Reports PDF...');
    const reportsData = {
        type: 'reports',
        data: [
            {
                id: 'harvest-1',
                herbName: 'Test-Kräuter',
                startDate: new Date().toISOString(),
                totalWeight: 250,
                contributionsData: []
            }
        ],
        filename: 'test-harvest-reports'
    };
    
    try {
        const reportsFilePath = path.join(exportDir, 'test-harvest-reports.pdf');
        const reportsResult = await SimplePdfGenerator.generateGardenPdf(reportsData, reportsFilePath);
        
        if (reportsResult.success) {
            console.log('✅ Reports PDF erfolgreich erstellt');
            console.log(`   📄 Datei: ${reportsFilePath}`);
        } else {
            console.log('❌ Reports PDF Fehler:', reportsResult.message);
        }
    } catch (error) {
        console.log('❌ Reports PDF Exception:', error.message);
    }
    
    // Abschließende Übersicht
    console.log('\n📁 Export-Verzeichnis Inhalt:');
    const files = fs.readdirSync(exportDir);
    const pdfFiles = files.filter(f => f.endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
        console.log('   ❌ Keine PDF-Dateien gefunden');
    } else {
        pdfFiles.forEach(file => {
            const fullPath = path.join(exportDir, file);
            const stats = fs.statSync(fullPath);
            console.log(`   📄 ${file} (${Math.round(stats.size / 1024)}KB, ${stats.mtime.toLocaleString()})`);
        });
    }
    
    console.log('\n🎯 Test abgeschlossen!');
}

// Test ausführen
testPDFGeneration().catch(console.error);
