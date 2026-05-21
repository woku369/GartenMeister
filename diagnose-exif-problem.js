// Test-Tool für EXIF-Problem-Diagnose
// Analysiert spezifische Bild-Upload-Probleme

const ImageManager = require('./src/utils/image-manager');
const ExifExtractor = require('./src/utils/exif-extractor');
const path = require('path');
const fs = require('fs');

async function diagnoseExifProblem() {
  console.log('🧪 EXIF-PROBLEM DIAGNOSE');
  console.log('========================');
  
  // Simuliere ein DSC_0024 Bild
  console.log('\n📸 Analysiere DSC_0024 Problem...');
  
  // Image Manager initialisieren
  const imageManager = new ImageManager('./test-diagnosis');
  
  // Test 1: Dateiname-Extraktion
  console.log('\n1. 🔍 Teste Dateiname-Extraktion...');
  const testFiles = [
    'DSC_0024.jpg',
    'DSC_2024.jpg', 
    'IMG_20240707_091030.jpg',
    '2024-07-07_garden.jpg',
    'P20240707_141500.jpg'
  ];
  
  for (const fileName of testFiles) {
    console.log(`\n📝 Teste: ${fileName}`);
    const extractedDate = imageManager.extractDateFromFileName(fileName);
    if (extractedDate) {
      const readable = new Date(extractedDate).toLocaleDateString('de-DE');
      console.log(`   ✅ Extrahiert: ${readable} (${extractedDate})`);
    } else {
      console.log(`   ❌ Kein Datum extrahiert`);
    }
  }
  
  // Test 2: EXIF-Extraktor direkt testen
  console.log('\n2. 🔬 Teste EXIF-Extraktor...');
  const exifExtractor = new ExifExtractor();
  
  // Erstelle Test-Bild-Buffer (Mock)
  const mockJpegBuffer = Buffer.from([
    0xFF, 0xD8, // JPEG Start
    0xFF, 0xE1, 0x00, 0x16, // EXIF Marker
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // "Exif\0\0"
    // Mock EXIF-Daten mit Datum
    ...Buffer.from('2024:07:05 14:30:22', 'ascii')
  ]);
  
  try {
    const result = await exifExtractor.extractFromBuffer(mockJpegBuffer, 'test.jpg');
    console.log('   📊 EXIF-Test-Ergebnis:', result);
  } catch (error) {
    console.log('   ❌ EXIF-Test fehlgeschlagen:', error.message);
  }
  
  // Test 3: Upload-Simulation
  console.log('\n3. 🚀 Simuliere Upload-Problem...');
  
  // Mock-Datei erstellen
  const testImagePath = path.join('./test-diagnosis', 'DSC_0024_test.jpg');
  
  // Ensure directory exists
  if (!fs.existsSync('./test-diagnosis')) {
    fs.mkdirSync('./test-diagnosis', { recursive: true });
  }
  
  // Schreibe Mock-JPEG
  fs.writeFileSync(testImagePath, mockJpegBuffer);
  
  try {
    console.log('   📁 Test-Datei erstellt:', testImagePath);
    
    // Importiere Bild mit Logging
    const result = await imageManager.importImage(testImagePath, {
      uploadedBy: 'Test-Nutzer',
      title: 'DSC_0024 Test'
    });
    
    console.log('\n   📊 Upload-Simulation Ergebnis:');
    console.log('   - Aufnahmedatum:', result.takenDate);
    console.log('   - Upload-Datum:', result.uploadDate);
    console.log('   - Datum-Quelle:', result.takenDate === result.uploadDate ? 'Upload-Fallback' : 'Extrahiert');
    
    // Cleanup
    fs.unlinkSync(testImagePath);
    
  } catch (error) {
    console.log('   ❌ Upload-Simulation fehlgeschlagen:', error.message);
  }
  
  // Test 4: Browser-EXIF Extraktor
  console.log('\n4. 🌐 Teste Browser-EXIF...');
  try {
    const BrowserExifExtractor = require('./src/utils/browser-exif-extractor');
    const browserExtractor = new BrowserExifExtractor();
    
    const browserResult = await browserExtractor.extractFromBuffer(mockJpegBuffer, 'DSC_0024.jpg');
    console.log('   📱 Browser-EXIF Ergebnis:', browserResult);
    
  } catch (error) {
    console.log('   ❌ Browser-EXIF Test fehlgeschlagen:', error.message);
  }
  
  console.log('\n========================');
  console.log('🧪 DIAGNOSE ABGESCHLOSSEN');
  
  console.log('\n📋 EMPFEHLUNGEN:');
  console.log('1. Wenn DSC-Dateien kein Datum haben: Dateiname-Extraktion verbessern');
  console.log('2. Wenn EXIF fehlt: Prüfen Sie echte JPEG-Dateien');
  console.log('3. Für DSC_0024: Verwenden Sie Dateisystem-Datum oder manuell setzen');
  console.log('4. In der UI: Zeigen Sie an, wenn Aufnahmedatum geschätzt ist');
}

// Führe Diagnose aus
if (require.main === module) {
  diagnoseExifProblem().catch(console.error);
}

module.exports = { diagnoseExifProblem };
