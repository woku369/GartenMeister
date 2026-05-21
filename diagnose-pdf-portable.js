const fs = require('fs');
const path = require('path');

console.log('🔍 PDF-Export Diagnose für Portable Version');
console.log('='.repeat(50));

// 1. Überprüfe Electron-Umgebung
console.log('\n[1] Electron-Umgebung:');
console.log('process.resourcesPath:', process.resourcesPath);
console.log('__dirname:', __dirname);
console.log('process.cwd():', process.cwd());

// 2. Überprüfe verfügbare PDF-Module
console.log('\n[2] PDF-Module verfügbar:');
const possiblePaths = [
    './simple-pdf-generator-improved.js',
    path.join(__dirname, 'simple-pdf-generator-improved.js'),
    path.join(process.resourcesPath, 'app.asar.unpacked', 'src', 'simple-pdf-generator-improved.js'),
    './simple-pdf-generator-safe.js'
];

for (const modulePath of possiblePaths) {
    try {
        const resolved = require.resolve(modulePath);
        console.log(`✅ ${modulePath} → ${resolved}`);
    } catch (error) {
        console.log(`❌ ${modulePath} → ${error.message}`);
    }
}

// 3. Überprüfe ASAR-Unpack Verzeichnis
console.log('\n[3] ASAR-Unpack Verzeichnis:');
if (process.resourcesPath) {
    const asarUnpackPath = path.join(process.resourcesPath, 'app.asar.unpacked');
    console.log('ASAR-Unpack Pfad:', asarUnpackPath);
    
    if (fs.existsSync(asarUnpackPath)) {
        console.log('✅ ASAR-Unpack Verzeichnis existiert');
        
        const srcPath = path.join(asarUnpackPath, 'src');
        if (fs.existsSync(srcPath)) {
            console.log('✅ src Verzeichnis existiert');
            
            const files = fs.readdirSync(srcPath).filter(f => f.includes('pdf'));
            console.log('PDF-Dateien in src:', files);
        } else {
            console.log('❌ src Verzeichnis nicht gefunden');
        }
    } else {
        console.log('❌ ASAR-Unpack Verzeichnis nicht gefunden');
    }
}

// 4. Teste PDF-Modul-Loading
console.log('\n[4] PDF-Modul Loading Test:');
let SimplePdfGenerator = null;

const strategies = [
    {
        name: 'Relativer Pfad',
        loader: () => require('./simple-pdf-generator-improved').SimplePdfGenerator
    },
    {
        name: 'ASAR-Unpack Pfad',
        loader: () => {
            const asarPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'src', 'simple-pdf-generator-improved.js');
            return require(asarPath).SimplePdfGenerator;
        }
    },
    {
        name: 'Absoluter Pfad',
        loader: () => {
            const absPath = path.join(__dirname, 'simple-pdf-generator-improved.js');
            return require(absPath).SimplePdfGenerator;
        }
    },
    {
        name: 'Safe Fallback',
        loader: () => require('./simple-pdf-generator-safe').SimplePdfGeneratorAlternative
    }
];

for (const strategy of strategies) {
    try {
        SimplePdfGenerator = strategy.loader();
        console.log(`✅ ${strategy.name}: Erfolgreich geladen`);
        break;
    } catch (error) {
        console.log(`❌ ${strategy.name}: ${error.message}`);
    }
}

// 5. Teste PDF-Generierung
if (SimplePdfGenerator) {
    console.log('\n[5] PDF-Generator Test:');
    
    const testData = {
        beds: [
            { id: 1, bedNumber: 1, width: 2, herbVarietyId: 1, plantDate: new Date() }
        ],
        segments: [],
        herbVarieties: [
            { id: 1, name: 'Test Kraut', color: '#00ff00' }
        ],
        gartenConfiguration: { totalBeds: 1 }
    };
    
    try {
        // Erstelle Test-Export-Verzeichnis
        const testExportPath = path.join(__dirname, '..', 'test-export');
        if (!fs.existsSync(testExportPath)) {
            fs.mkdirSync(testExportPath, { recursive: true });
        }
        
        const testOutputPath = path.join(testExportPath, 'test-pdf-export.pdf');
        console.log('Test-PDF Pfad:', testOutputPath);
        
        // Prüfe ob generateGardenPdf Methode verfügbar ist
        if (typeof SimplePdfGenerator.generateGardenPdf === 'function') {
            console.log('✅ generateGardenPdf Methode verfügbar');
            console.log('📄 PDF-Test kann durchgeführt werden');
        } else {
            console.log('❌ generateGardenPdf Methode nicht verfügbar');
            console.log('Verfügbare Methoden:', Object.getOwnPropertyNames(SimplePdfGenerator));
        }
        
    } catch (error) {
        console.log('❌ PDF-Test Fehler:', error.message);
    }
} else {
    console.log('\n[5] ❌ Kein PDF-Generator verfügbar für Test');
}

console.log('\n' + '='.repeat(50));
console.log('Diagnose abgeschlossen');

// Ausgabe in Datei speichern
const diagnosisOutput = `PDF-Export Diagnose - ${new Date().toISOString()}
Weitere Details siehe Konsole.
`;

try {
    fs.writeFileSync('pdf-diagnosis.txt', diagnosisOutput);
    console.log('📄 Diagnose-Datei erstellt: pdf-diagnosis.txt');
} catch (error) {
    console.log('❌ Diagnose-Datei konnte nicht erstellt werden:', error.message);
}
