/**
 * Test-Skript für OneDrive Backup-Wiederherstellung
 * Simuliert die Verwendung von echten Daten als Anfangsbestand
 */
const { getOneDriveStorage } = require('./src/utils/onedrive-sync.js');

async function testBackupRestore() {
  console.log('🧪 Teste OneDrive Backup-Wiederherstellung...\n');
  
  const oneDrive = getOneDriveStorage();
  
  try {
    // OneDrive initialisieren
    await oneDrive.initialize();
    console.log('✅ OneDrive initialisiert\n');
    
    // Verfügbare Backups anzeigen
    console.log('🔍 Suche verfügbare Backup-Dateien...');
    const backups = await oneDrive.listBackupFiles();
    
    if (backups.length === 0) {
      console.log('❌ Keine Backup-Dateien gefunden');
      console.log('💡 Tipp: Kopieren Sie Ihre Backup-Dateien in den OneDrive-Ordner:');
      console.log(`   ${oneDrive.getConfiguration().paths.backups}`);
      return;
    }
    
    console.log(`📦 ${backups.length} Backup-Datei(en) gefunden:\n`);
    
    backups.forEach((backup, index) => {
      const date = new Date(backup.modifiedDate).toLocaleString('de-DE');
      const size = (backup.size / 1024).toFixed(1);
      
      console.log(`  ${index + 1}. ${backup.fileName}`);
      console.log(`     📅 Datum: ${date}`);
      console.log(`     📊 Größe: ${size} KB`);
      console.log(`     📍 Pfad: ${backup.fullPath}\n`);
    });
    
    // Erstes Backup als Test verwenden
    const firstBackup = backups[0];
    console.log(`🔄 Teste Wiederherstellung von: ${firstBackup.fileName}`);
    
    // Simulation: Backup wiederherstellen (nur Test, nicht wirklich ausführen)
    console.log('⚠️ SIMULATION: Backup-Wiederherstellung würde folgende Schritte ausführen:');
    console.log('  1. Aktuelles Backup der bestehenden Daten erstellen');
    console.log('  2. Backup-Datei laden und validieren');
    console.log('  3. Backup-Daten als neue App-Daten speichern');
    console.log('  4. Zeitstempel und Metadaten aktualisieren');
    
    // Echte Wiederherstellung nur bei expliziter Bestätigung
    console.log('\n💡 Um die Wiederherstellung wirklich auszuführen, verwenden Sie:');
    console.log('   await oneDrive.restoreFromBackup(backupPath)');
    
    console.log('\n✅ Backup-Test erfolgreich abgeschlossen');
    
  } catch (error) {
    console.error('❌ Fehler beim Backup-Test:', error);
  }
}

// Hilfsfunktion: Erstelle Test-Backup für Demo
async function createTestBackup() {
  console.log('🛠️ Erstelle Test-Backup für Demo...\n');
  
  const testData = {
    lastModified: new Date().toISOString(),
    deviceId: 'test-device',
    syncSource: 'test-backup',
    version: '1.0.0',
    data: {
      gardens: [
        {
          id: 1,
          name: 'Hauptgarten',
          location: 'Hinterhof',
          size: 50,
          createdAt: new Date().toISOString()
        }
      ],
      plants: [
        {
          id: 1,
          name: 'Tomaten',
          variety: 'Cherry-Tomaten',
          plantedAt: new Date().toISOString(),
          gardenId: 1
        }
      ]
    }
  };
  
  const oneDrive = getOneDriveStorage();
  await oneDrive.initialize();
  
  // Test-Backup speichern
  const backupCreated = await oneDrive.createBackup(testData);
  
  if (backupCreated) {
    console.log('✅ Test-Backup erfolgreich erstellt');
    console.log('📂 Backup-Verzeichnis:', oneDrive.getConfiguration().paths.backups);
  } else {
    console.log('❌ Fehler beim Erstellen des Test-Backups');
  }
}

// Hauptfunktion
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--create-test-backup')) {
    await createTestBackup();
  } else {
    await testBackupRestore();
  }
}

main().catch(console.error);
