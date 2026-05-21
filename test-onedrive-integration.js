/**
 * 🧪 OneDrive-Integration Tester
 * 
 * Testet die OneDrive-Synchronisation-Funktionalität
 * 
 * Datum: 11. August 2025
 */

const path = require('path');
const fs = require('fs');

async function testOneDriveIntegration() {
  console.log('🔍 Teste OneDrive-Integration...\n');

  try {
    // 1. Test OneDrive-Modul laden
    console.log('1️⃣ Lade OneDrive-Modul...');
    const { getOneDriveStorage, ONEDRIVE_CONFIG } = require('./src/utils/onedrive-sync');
    console.log('✅ OneDrive-Modul erfolgreich geladen\n');

    // 2. OneDrive-Instanz erstellen
    console.log('2️⃣ Erstelle OneDrive-Instanz...');
    const oneDrive = getOneDriveStorage();
    console.log('✅ OneDrive-Instanz erstellt\n');

    // 3. Status prüfen
    console.log('3️⃣ Prüfe OneDrive-Status...');
    const status = await oneDrive.getStatus();
    console.log('📊 OneDrive-Status:', JSON.stringify(status, null, 2));
    console.log('');

    // 4. Verbindung testen
    console.log('4️⃣ Teste Verbindung...');
    const isConnected = await oneDrive.checkConnection();
    console.log(`📡 Verbindung: ${isConnected ? '✅ Erfolgreich' : '❌ Fehlgeschlagen'}\n`);

    if (isConnected) {
      // 5. Test-Daten erstellen
      console.log('5️⃣ Erstelle Test-Daten...');
      const testData = {
        beds: [
          { id: 'test-bed-1', name: 'Test-Beet 1', type: 'Standard' }
        ],
        herbVarieties: [
          { id: 'test-herb-1', name: 'Test-Kräuter', color: '#00ff00' }
        ],
        harvestEvents: [],
        lastModified: new Date().toISOString(),
        testMode: true
      };
      console.log('✅ Test-Daten erstellt\n');

      // 6. Daten speichern
      console.log('6️⃣ Speichere Test-Daten in OneDrive...');
      const saveResult = await oneDrive.saveAppData(testData);
      console.log(`💾 Speichern: ${saveResult ? '✅ Erfolgreich' : '❌ Fehlgeschlagen'}\n`);

      if (saveResult) {
        // 7. Daten wieder laden
        console.log('7️⃣ Lade Daten aus OneDrive...');
        const loadedData = await oneDrive.loadAppData();
        console.log('📥 Geladene Daten:', loadedData ? '✅ Erfolgreich' : '❌ Fehlgeschlagen');
        if (loadedData) {
          console.log('   🔍 Daten-Vergleich:', 
            loadedData.beds?.length === testData.beds.length ? '✅ Übereinstimmend' : '❌ Unterschiedlich'
          );
        }
        console.log('');

        // 8. Sync-Test
        console.log('8️⃣ Teste Synchronisation...');
        const syncTestData = {
          ...testData,
          lastModified: new Date(Date.now() + 1000).toISOString(), // 1 Sekunde später
          beds: [
            ...testData.beds,
            { id: 'test-bed-2', name: 'Test-Beet 2', type: 'Kombinationsbeet' }
          ]
        };

        const syncResult = await oneDrive.syncAppData(syncTestData);
        console.log('🔄 Sync-Ergebnis:', JSON.stringify(syncResult, null, 2));
        console.log('');

        // 9. Export-Test
        console.log('9️⃣ Teste Datei-Export...');
        const exportContent = JSON.stringify({
          test: 'OneDrive Export Test',
          timestamp: new Date().toISOString()
        }, null, 2);
        
        const exportResult = await oneDrive.exportFile('test-export.json', exportContent);
        console.log('📤 Export-Ergebnis:', JSON.stringify(exportResult, null, 2));
        console.log('');
      }
    }

    // 10. Cloud-Storage-Manager testen
    console.log('🔟 Teste Cloud-Storage-Manager...');
    try {
      const { OneDriveStorageManager } = require('./src/utils/cloud-storage');
      
      const managerStatus = await OneDriveStorageManager.getStatus();
      console.log('📊 Manager-Status:', JSON.stringify(managerStatus, null, 2));
      
      console.log('✅ Cloud-Storage-Manager funktioniert\n');
    } catch (error) {
      console.log('❌ Cloud-Storage-Manager Fehler:', error.message);
      console.log('');
    }

    // 11. Konfiguration anzeigen
    console.log('1️⃣1️⃣ OneDrive-Konfiguration:');
    console.log('📁 Basis-Pfad:', ONEDRIVE_CONFIG.paths.base || 'Nicht gesetzt');
    console.log('🗂️ GartenMeister-Pfad:', ONEDRIVE_CONFIG.paths.gartenmeister || 'Nicht gesetzt');
    console.log('💾 Daten-Pfad:', ONEDRIVE_CONFIG.paths.data || 'Nicht gesetzt');
    console.log('💿 Backup-Pfad:', ONEDRIVE_CONFIG.paths.backups || 'Nicht gesetzt');
    console.log('📤 Export-Pfad:', ONEDRIVE_CONFIG.paths.exports || 'Nicht gesetzt');
    console.log('');

    console.log('🎉 OneDrive-Integration Test abgeschlossen!');
    
  } catch (error) {
    console.error('❌ Test fehlgeschlagen:', error);
    console.error('Fehler-Details:', error.stack);
  }
}

// Test ausführen
if (require.main === module) {
  testOneDriveIntegration();
}

module.exports = { testOneDriveIntegration };
