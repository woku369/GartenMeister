/**
 * Test-Skript für beide PDF-Export-Funktionen
 * 1. Gartenübersicht (Dashboard)
 * 2. Erntestatistik (Reports)
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Pfad für Export-Verzeichnis
const exportDir = path.join(__dirname, 'export');

console.log('🧪 PDF-Export Test startet...');
console.log('📁 Export-Verzeichnis:', exportDir);

// Stelle sicher, dass Export-Verzeichnis existiert
if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
    console.log('✅ Export-Verzeichnis erstellt');
}

async function testPDFExports() {
    console.log('\n🔍 Prüfe aktuelle PDF-Dateien im Export-Verzeichnis...');
    
    const files = fs.readdirSync(exportDir);
    const pdfFiles = files.filter(f => f.endsWith('.pdf'));
    
    console.log('📄 Aktuelle PDF-Dateien:');
    if (pdfFiles.length === 0) {
        console.log('   ❌ Keine PDF-Dateien gefunden');
    } else {
        pdfFiles.forEach(file => {
            const fullPath = path.join(exportDir, file);
            const stats = fs.statSync(fullPath);
            console.log(`   📄 ${file} (${Math.round(stats.size / 1024)}KB, ${stats.mtime.toLocaleString()})`);
        });
    }
    
    console.log('\n📋 Test-Checkliste für PDF-Exports:');
    console.log('1. 🌿 Dashboard: Gartenübersicht-PDF exportieren');
    console.log('   - Dashboard öffnen');
    console.log('   - PDF-Export-Button klicken');
    console.log('   - Datei sollte im Export-Verzeichnis landen');
    console.log('');
    console.log('2. 📊 Reports: Erntestatistik-PDF exportieren');
    console.log('   - Reports-Seite öffnen');
    console.log('   - PDF-Export-Button klicken');
    console.log('   - Datei sollte im Export-Verzeichnis landen');
    console.log('');
    console.log('💡 Tipp: Nach jedem Export dieses Skript erneut ausführen, um neue Dateien zu sehen.');
}

// Test ausführen
testPDFExports().catch(console.error);
