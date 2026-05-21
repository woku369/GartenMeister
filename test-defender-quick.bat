@echo off
echo 🧪 WINDOWS DEFENDER LÖSUNG - BATCH TEST
echo ========================================

echo.
echo 1. 🔍 Prüfe Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js nicht verfügbar
    pause
    exit /b 1
)

echo.
echo 2. 📁 Prüfe Projektordner...
dir package.json >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Nicht im GartenMeister-Projektordner
    pause
    exit /b 1
) else (
    echo ✅ Im korrekten Projektordner
)

echo.
echo 3. 🔧 Teste PDF-Module...
node -e "try{require('pdfkit');console.log('✅ PDFKit verfügbar');}catch(e){console.log('❌ PDFKit fehlt:',e.message);}"

echo.
echo 4. 📄 Führe einfachen PDF-Test aus...
node -e "
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('📂 Erstelle Test-Export-Ordner...');
const exportPath = path.join(os.homedir(), 'Documents', 'GartenMeister');
try {
    if (!fs.existsSync(exportPath)) {
        fs.mkdirSync(exportPath, { recursive: true });
        console.log('✅ Export-Ordner erstellt:', exportPath);
    } else {
        console.log('✅ Export-Ordner existiert:', exportPath);
    }
    
    // Teste Schreibzugriff
    const testFile = path.join(exportPath, 'defender-test.txt');
    fs.writeFileSync(testFile, 'Test von: ' + new Date().toISOString());
    console.log('✅ Schreibzugriff funktioniert');
    fs.unlinkSync(testFile);
    console.log('✅ Löschzugriff funktioniert');
    
} catch (error) {
    console.log('❌ Fehler beim Dateizugriff:', error.message);
    console.log('🔧 Möglicherweise Windows Defender-Blockade!');
}
"

echo.
echo 5. 🚀 Teste GartenMeister-Start...
echo Führe "npm start" für 5 Sekunden aus...
timeout /t 3 >nul
start /B npm start
timeout /t 5 >nul
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM electron.exe >nul 2>&1

echo.
echo ========================================
echo 🧪 BATCH-TEST ABGESCHLOSSEN
echo.
echo 📋 EMPFEHLUNGEN:
echo 1. Falls Fehler auftreten: Führen Sie scripts\add-defender-exclusions.bat als Administrator aus
echo 2. Nach Defender-Ausnahmen: System neustarten
echo 3. Für detaillierte Lösung: Siehe WINDOWS_DEFENDER_LOSUNG.md
echo.
pause
