/**
 * Test-Script für den GartenMeister Weather Service
 * Prüft alle Funktionen vor dem NAS-Deployment
 */

const GartenMeisterWeatherService = require('./weather-service-standalone');
const fs = require('fs');
const path = require('path');

class WeatherServiceTester {
  constructor() {
    this.testResults = [];
  }
  
  async runTest(name, testFunction) {
    console.log(`\n🧪 Test: ${name}`);
    try {
      const result = await testFunction();
      if (result) {
        console.log(`✅ ${name} - ERFOLGREICH`);
        this.testResults.push({ name, status: 'PASS', result });
      } else {
        console.log(`❌ ${name} - FEHLGESCHLAGEN`);
        this.testResults.push({ name, status: 'FAIL', result });
      }
    } catch (error) {
      console.log(`❌ ${name} - FEHLER: ${error.message}`);
      this.testResults.push({ name, status: 'ERROR', error: error.message });
    }
  }
  
  async testConfiguration() {
    // Test 1: Konfiguration laden
    const service = new GartenMeisterWeatherService('./config.json');
    return service.config && service.config.apiKey && service.config.location;
  }
  
  async testDataDirectory() {
    // Test 2: Datenverzeichnis erstellen
    const testDir = './test-data';
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    
    const service = new GartenMeisterWeatherService();
    service.config.dataPath = testDir;
    service.initializeDataDirectory();
    
    const exists = fs.existsSync(testDir);
    
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    
    return exists;
  }
  
  async testWeatherAPI() {
    // Test 3: Wetter-API abrufen
    const service = new GartenMeisterWeatherService();
    try {
      const data = await service.fetchWeatherFromAPI();
      return data && data.airTemperature && data.humidity && data.timestamp;
    } catch (error) {
      console.log(`API-Fehler: ${error.message}`);
      return false;
    }
  }
  
  async testDataStorage() {
    // Test 4: Daten speichern und laden
    const testDir = './test-data';
    const service = new GartenMeisterWeatherService();
    service.config.dataPath = testDir;
    service.initializeDataDirectory();
    
    const testData = [{
      id: 'test-1',
      timestamp: new Date().toISOString(),
      airTemperature: 22.5,
      soilTemperature: 18.0,
      humidity: 65,
      windSpeed: 12.3,
      precipitation: 0,
      condition: 'Test-Wetter'
    }];
    
    const saved = service.saveWeatherData(testData);
    const loaded = service.loadWeatherData();
    
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    
    return saved && loaded.length === 1 && loaded[0].id === 'test-1';
  }
  
  async testLocking() {
    // Test 5: Mutex-System
    const testDir = './test-data';
    const service = new GartenMeisterWeatherService();
    service.config.dataPath = testDir;
    service.config.enableLocking = true;
    service.initializeDataDirectory();
    
    const lockCreated = service.createLock();
    const lockExists = service.checkLock();
    service.removeLock();
    const lockRemoved = !service.checkLock();
    
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    
    return lockCreated && lockExists && lockRemoved;
  }
  
  async testBackup() {
    // Test 6: Backup-System
    const testDir = './test-data';
    const service = new GartenMeisterWeatherService();
    service.config.dataPath = testDir;
    service.config.enableBackups = true;
    service.initializeDataDirectory();
    
    const testData = [{
      id: 'backup-test',
      timestamp: new Date().toISOString(),
      airTemperature: 20.0
    }];
    
    service.saveWeatherData(testData);
    
    const backupDir = path.join(testDir, 'backups');
    const backupExists = fs.existsSync(backupDir);
    const backupFiles = backupExists ? fs.readdirSync(backupDir) : [];
    
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    
    return backupExists && backupFiles.length > 0;
  }
  
  async runAllTests() {
    console.log('🚀 Starte GartenMeister Weather Service Tests...\n');
    
    await this.runTest('Konfiguration laden', () => this.testConfiguration());
    await this.runTest('Datenverzeichnis erstellen', () => this.testDataDirectory());
    await this.runTest('Wetter-API abrufen', () => this.testWeatherAPI());
    await this.runTest('Daten speichern/laden', () => this.testDataStorage());
    await this.runTest('Mutex-Locking', () => this.testLocking());
    await this.runTest('Backup-System', () => this.testBackup());
    
    this.printResults();
  }
  
  printResults() {
    console.log('\n📊 TEST ERGEBNISSE:');
    console.log('==================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const errors = this.testResults.filter(r => r.status === 'ERROR').length;
    
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : 
                   result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} ${result.name}`);
      if (result.error) {
        console.log(`   Fehler: ${result.error}`);
      }
    });
    
    console.log('\n📈 ZUSAMMENFASSUNG:');
    console.log(`✅ Erfolgreich: ${passed}`);
    console.log(`❌ Fehlgeschlagen: ${failed}`);
    console.log(`⚠️ Fehler: ${errors}`);
    
    if (failed === 0 && errors === 0) {
      console.log('\n🎉 ALLE TESTS BESTANDEN!');
      console.log('🚀 Der Service ist bereit für das NAS-Deployment!');
    } else {
      console.log('\n⚠️ Einige Tests sind fehlgeschlagen.');
      console.log('🔧 Bitte behebe die Probleme vor dem NAS-Deployment.');
    }
  }
}

// Tests ausführen
if (require.main === module) {
  const tester = new WeatherServiceTester();
  tester.runAllTests().catch(error => {
    console.error('❌ Fehler beim Ausführen der Tests:', error);
    process.exit(1);
  });
}

module.exports = WeatherServiceTester;
