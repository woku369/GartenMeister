// WINDOWS DEFENDER DIAGNOSE - FINALE VERSION
// ===========================================

const fs = require('fs');
const path = require('path');
const os = require('os');

async function runDiagnosis() {
    const results = [];
    const timestamp = new Date().toISOString();
    
    console.log('🔍 WINDOWS DEFENDER DIAGNOSE GESTARTET');
    console.log('======================================');
    
    // 1. Grundlegende System-Checks
    results.push('=== SYSTEM DIAGNOSE ===');
    results.push(`Timestamp: ${timestamp}`);
    results.push(`OS: ${os.platform()} ${os.release()}`);
    results.push(`Node.js: ${process.version}`);
    results.push(`Arbeitsverzeichnis: ${process.cwd()}`);
    results.push('');
    
    // 2. Projektordner-Test
    results.push('=== PROJEKTORDNER TEST ===');
    try {
        const projectPath = process.cwd();
        const testFile = path.join(projectPath, `defender-test-${Date.now()}.tmp`);
        
        fs.writeFileSync(testFile, 'Defender Test Content');
        const content = fs.readFileSync(testFile, 'utf8');
        fs.unlinkSync(testFile);
        
        results.push('✅ Projektordner Schreib-/Lesezugriff: OK');
        results.push(`   Pfad: ${projectPath}`);
    } catch (error) {
        results.push('❌ Projektordner Zugriff: FEHLER');
        results.push(`   Fehler: ${error.message}`);
    }
    results.push('');
    
    // 3. Export-Ordner Test
    results.push('=== EXPORT-ORDNER TEST ===');
    try {
        const documentsPath = path.join(os.homedir(), 'Documents');
        const exportPath = path.join(documentsPath, 'GartenMeister');
        
        if (!fs.existsSync(exportPath)) {
            fs.mkdirSync(exportPath, { recursive: true });
        }
        
        const testFile = path.join(exportPath, `export-test-${Date.now()}.tmp`);
        fs.writeFileSync(testFile, 'Export Test Content');
        const content = fs.readFileSync(testFile, 'utf8');
        fs.unlinkSync(testFile);
        
        results.push('✅ Export-Ordner Zugriff: OK');
        results.push(`   Pfad: ${exportPath}`);
    } catch (error) {
        results.push('❌ Export-Ordner Zugriff: FEHLER');
        results.push(`   Fehler: ${error.message}`);
    }
    results.push('');
    
    // 4. PDF-Module Test
    results.push('=== PDF-MODULE TEST ===');
    try {
        const pdfkit = require('pdfkit');
        results.push('✅ PDFKit Modul: VERFÜGBAR');
        
        // Teste einfache PDF-Erstellung im Speicher
        const doc = new pdfkit();
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            results.push(`✅ PDF-Erstellung im Speicher: OK (${pdfBuffer.length} bytes)`);
        });
        
        doc.text('Test PDF für Windows Defender Diagnose', 100, 100);
        doc.text(`Erstellt am: ${timestamp}`, 100, 120);
        doc.end();
        
    } catch (error) {
        results.push('❌ PDFKit Modul: FEHLER');
        results.push(`   Fehler: ${error.message}`);
    }
    results.push('');
    
    // 5. Dependencies Check
    results.push('=== DEPENDENCIES CHECK ===');
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        const criticalModules = ['pdfkit', 'sharp', 'canvas', 'electron'];
        
        criticalModules.forEach(module => {
            if (allDeps[module]) {
                try {
                    require(module);
                    results.push(`✅ ${module}: OK (Version: ${allDeps[module]})`);
                } catch (error) {
                    results.push(`❌ ${module}: FEHLER - ${error.message}`);
                }
            } else {
                results.push(`⚠️  ${module}: NICHT IN PACKAGE.JSON`);
            }
        });
        
    } catch (error) {
        results.push('❌ Package.json Check: FEHLER');
        results.push(`   Fehler: ${error.message}`);
    }
    results.push('');
    
    // 6. Schreibe Diagnose-Report
    results.push('=== DIAGNOSE ABGESCHLOSSEN ===');
    results.push('');
    results.push('🔧 EMPFOHLENE AKTIONEN:');
    results.push('1. Falls Fehler bei Dateizugriff: scripts\\add-defender-exclusions.bat als Admin ausführen');
    results.push('2. Falls PDF-Module fehlen: npm install ausführen');
    results.push('3. Nach Defender-Änderungen: System neustarten');
    results.push('4. Dann: npm start ausführen und PDF-Export in der App testen');
    results.push('');
    results.push('📚 Weitere Hilfe: WINDOWS_DEFENDER_LOSUNG.md');
    
    // Schreibe Report in Datei
    const reportPath = path.join(process.cwd(), 'defender-diagnose-report.txt');
    fs.writeFileSync(reportPath, results.join('\n'), 'utf8');
    
    console.log(results.join('\n'));
    console.log('');
    console.log(`📄 Vollständiger Report gespeichert: ${reportPath}`);
    
    return results;
}

// Führe Diagnose aus
runDiagnosis().catch(console.error);
