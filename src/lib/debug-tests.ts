/**
 * Test-Script für Datenpersistenz und Cloud-Sync
 * Führt direkte Tests der kritischen Funktionen durch
 */

// Test 1: Electron-Umgebung prüfen
console.log('=== ELECTRON ENVIRONMENT TEST ===');
console.log('typeof window:', typeof window);
console.log('window.electronAPI exists:', typeof window !== 'undefined' && !!window.electronAPI);

if (typeof window !== 'undefined' && window.electronAPI) {
  console.log('Available electronAPI methods:', Object.keys(window.electronAPI));
}

// Test 2: Datenpersistenz testen
async function testDataPersistence() {
  console.log('\n=== DATA PERSISTENCE TEST ===');
  
  if (typeof window === 'undefined' || !window.electronAPI) {
    console.error('❌ Electron API nicht verfügbar');
    return;
  }
  
  try {
    // Test: Datei-Pfad abrufen
    const testFilePath = await window.electronAPI.getDataFilePath('test.json');
    console.log('✅ getDataFilePath funktioniert:', testFilePath);
    
    // Test: Datei schreiben
    const testData = { test: true, timestamp: new Date().toISOString() };
    const writeSuccess = await window.electronAPI.writeJsonFile(testFilePath, testData);
    console.log('✅ writeJsonFile funktioniert:', writeSuccess);
    
    // Test: Datei lesen
    const readData = await window.electronAPI.readJsonFile(testFilePath);
    console.log('✅ readJsonFile funktioniert:', readData);
    
    // Test: Datei existiert
    const exists = await window.electronAPI.fileExists(testFilePath);
    console.log('✅ fileExists funktioniert:', exists);
    
    return true;
  } catch (error) {
    console.error('❌ Data Persistence Test fehlgeschlagen:', error);
    return false;
  }
}

// Test 3: Cloud-Sync-Pfad testen
async function testCloudSyncPath() {
  console.log('\n=== CLOUD SYNC PATH TEST ===');
  
  if (typeof window === 'undefined' || !window.electronAPI || !window.electronAPI.selectDirectory) {
    console.error('❌ selectDirectory nicht verfügbar');
    return;
  }
  
  try {
    console.log('Öffne Ordner-Auswahl-Dialog...');
    const selectedPath = await window.electronAPI.selectDirectory();
    console.log('✅ Ausgewählter Pfad:', selectedPath);
    return selectedPath;
  } catch (error) {
    console.error('❌ Cloud Sync Path Test fehlgeschlagen:', error);
    return null;
  }
}

// Test 4: Vollständiger Daten-Roundtrip
async function testFullDataRoundtrip() {
  console.log('\n=== FULL DATA ROUNDTRIP TEST ===');
  
  const { saveAllData, loadAllAppData } = await import('./storage-manager');
  const { getAppStore } = await import('./data');
  
  try {
    // Aktuellen Store holen
    const currentStore = getAppStore();
    console.log('Current store beds count:', currentStore.beds.length);
    
    // Test-Beet hinzufügen
    const testBed = {
      id: `test-bed-${Date.now()}`,
      name: 'Test Beet für Persistenz',
      type: 'Standard' as const,
      width: 1.5,
      length: 3,
      plantingDate: new Date().toISOString(),
      isActive: true
    };
    
    currentStore.beds.push(testBed);
    console.log('✅ Test-Beet hinzugefügt');
    
    // Daten speichern
    const saveSuccess = await saveAllData(currentStore);
    console.log('✅ saveAllData Ergebnis:', saveSuccess);
    
    // Daten laden
    const loadedData = await loadAllAppData();
    console.log('✅ loadAllAppData Ergebnis:', Object.keys(loadedData));
    console.log('Loaded beds count:', loadedData.beds?.length || 0);
    
    // Überprüfen ob Test-Beet vorhanden ist
    const foundTestBed = loadedData.beds?.find(bed => bed.id === testBed.id);
    console.log('✅ Test-Beet gefunden:', !!foundTestBed);
    
    return saveSuccess && !!foundTestBed;
  } catch (error) {
    console.error('❌ Full Data Roundtrip Test fehlgeschlagen:', error);
    return false;
  }
}

// Tests ausführen
if (typeof window !== 'undefined') {
  // Client-side Tests
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Starte Datenpersistenz- und Cloud-Sync-Tests...');
    
    const persistenceResult = await testDataPersistence();
    console.log('Data Persistence Test:', persistenceResult ? '✅ BESTANDEN' : '❌ FEHLGESCHLAGEN');
    
    if (persistenceResult) {
      const roundtripResult = await testFullDataRoundtrip();
      console.log('Full Roundtrip Test:', roundtripResult ? '✅ BESTANDEN' : '❌ FEHLGESCHLAGEN');
    }
    
    // Cloud Sync Test nur auf Benutzer-Aktion
    window.testCloudSync = testCloudSyncPath;
    console.log('💡 Führe window.testCloudSync() aus, um Cloud-Sync-Pfad zu testen');
  });
} else {
  console.log('Server-side environment detected');
}

export { testDataPersistence, testCloudSyncPath, testFullDataRoundtrip };
