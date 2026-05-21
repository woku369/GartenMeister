/**
 * Standalone Weather Service für GartenMeister NAS
 * 
 * Eigenständiger Service ohne Electron-Abhängigkeiten
 * Unterstützt mehrere Wetter-APIs: OpenWeatherMap und Meteoblue
 * Läuft auf Synology NAS oder anderen Linux/Windows-Systemen
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const os = require('os');

class StandaloneWeatherService {
  constructor(configPath = null) {
    this.isRunning = false;
    this.intervalId = null;
    this.mutexPath = null;
    this.dataPath = null;
    this.configPath = configPath;
    this.lastFetchTime = null;
    
    // Default-Konfiguration
    this.config = {
      // Primärer Anbieter
      primaryProvider: 'meteoblue', // 'openweathermap' oder 'meteoblue'
      
      // OpenWeatherMap Konfiguration
      openweathermap: {
        apiKey: '27abc31487d9b25c2721ed313b51b619',
        enabled: true
      },
      
      // Meteoblue Konfiguration
      meteoblue: {
        apiKey: 'YOUR_METEOBLUE_API_KEY', // Muss vom Benutzer eingetragen werden
        enabled: false // Wird aktiviert wenn API Key vorhanden
      },
      
      // Allgemeine Einstellungen
      location: {
        name: 'Gurk, Österreich',
        lat: 46.8744,
        lon: 14.1497
      },
      
      // Sammlung-Einstellungen
      intervalHours: 2,
      minIntervalMinutes: 30,
      maxRetries: 3,
      retryDelayMs: 5000,
      
      // Daten-Einstellungen
      maxDataPoints: 1000,
      includeAgriculturalData: true,
      
      // NAS-spezifische Einstellungen
      dataDirectory: null, // Wird automatisch erkannt oder kann gesetzt werden
      logLevel: 'info' // 'debug', 'info', 'warn', 'error'
    };
    
    this.loadConfig();
    this.initializePaths();
  }
  
  /**
   * Lädt Konfiguration aus Datei
   */
  loadConfig() {
    try {
      if (this.configPath && fs.existsSync(this.configPath)) {
        const fileConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        this.config = { ...this.config, ...fileConfig };
        this.log('info', 'Konfiguration geladen aus:', this.configPath);
      } else {
        // Versuche Standard-Konfigurationspfade
        const possiblePaths = [
          path.join(process.cwd(), 'weather-config.json'),
          path.join(os.homedir(), '.gartenmeister', 'weather-config.json'),
          '/etc/gartenmeister/weather-config.json' // Linux/NAS
        ];
        
        for (const configPath of possiblePaths) {
          if (fs.existsSync(configPath)) {
            const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            this.config = { ...this.config, ...fileConfig };
            this.configPath = configPath;
            this.log('info', 'Konfiguration gefunden:', configPath);
            break;
          }
        }
      }
      
      // Meteoblue aktivieren wenn API Key vorhanden
      if (this.config.meteoblue.apiKey && this.config.meteoblue.apiKey !== 'YOUR_METEOBLUE_API_KEY') {
        this.config.meteoblue.enabled = true;
      }
      
    } catch (error) {
      this.log('warn', 'Fehler beim Laden der Konfiguration:', error.message);
    }
  }
  
  /**
   * Speichert aktuelle Konfiguration
   */
  saveConfig() {
    try {
      if (!this.configPath) {
        this.configPath = path.join(process.cwd(), 'weather-config.json');
      }
      
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      this.log('info', 'Konfiguration gespeichert:', this.configPath);
    } catch (error) {
      this.log('error', 'Fehler beim Speichern der Konfiguration:', error.message);
    }
  }
  
  /**
   * Initialisiert Pfade für Daten und Mutex
   */
  initializePaths() {
    // Bestimme Datenverzeichnis
    let dataDir;
    
    if (this.config.dataDirectory) {
      dataDir = this.config.dataDirectory;
    } else {
      // Erkenne Umgebung automatisch
      const possibleDirs = [
        path.join(os.homedir(), 'AppData', 'Roaming', 'GartenMeister', 'data'), // Windows
        path.join(os.homedir(), '.gartenmeister', 'data'), // Linux/Unix
        path.join('/volume1', 'gartenmeister', 'data'), // Synology Standard
        path.join('/share', 'gartenmeister', 'data'), // QNAP Standard
        path.join(process.cwd(), 'data') // Fallback
      ];
      
      for (const dir of possibleDirs) {
        try {
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          dataDir = dir;
          this.log('info', 'Datenverzeichnis:', dataDir);
          break;
        } catch (error) {
          this.log('debug', 'Verzeichnis nicht verfügbar:', dir);
        }
      }
    }
    
    if (!dataDir) {
      throw new Error('Konnte kein Datenverzeichnis erstellen');
    }
    
    this.dataPath = path.join(dataDir, 'weather-data.json');
    this.mutexPath = path.join(dataDir, '.weather-service.lock');
  }
  
  /**
   * Logging-Funktion
   */
  log(level, ...args) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.logLevel] || 1;
    
    if (levels[level] >= configLevel) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${level.toUpperCase()}] [WeatherService]`, ...args);
    }
  }
  
  /**
   * Holt Wetterdaten von OpenWeatherMap
   */
  async fetchFromOpenWeatherMap() {
    const { apiKey } = this.config.openweathermap;
    const { name: location } = this.config.location;
    
    this.log('debug', 'Abrufen von OpenWeatherMap für:', location);
    
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric&lang=de`,
      { timeout: 10000 }
    );
    
    return {
      provider: 'openweathermap',
      location: response.data.name,
      airTemperature: response.data.main.temp,
      soilTemperature: response.data.main.temp - 4.5, // Geschätzt
      humidity: response.data.main.humidity,
      windSpeed: response.data.wind.speed * 3.6, // m/s zu km/h
      precipitation: response.data.rain?.['1h'] || response.data.snow?.['1h'] || 0,
      pressure: response.data.main.pressure,
      condition: response.data.weather[0].description,
      cloudCover: response.data.clouds.all,
      uvIndex: null, // Nicht in Basic API
      visibility: response.data.visibility / 1000, // m zu km
      dewPoint: null // Müsste berechnet werden
    };
  }
  
  /**
   * Holt Wetterdaten von Meteoblue (mit Agrar-Daten)
   */
  async fetchFromMeteoblue() {
    const { apiKey } = this.config.meteoblue;
    const { lat, lon } = this.config.location;
    
    this.log('debug', 'Abrufen von Meteoblue für:', `${lat}, ${lon}`);
    
    // Meteoblue Current Weather API
    const currentResponse = await axios.get(
      `https://my.meteoblue.com/packages/current?lat=${lat}&lon=${lon}&apikey=${apiKey}`,
      { timeout: 15000 }
    );
    
    let soilData = null;
    
    // Zusätzlich: Agrar-Daten abrufen (falls konfiguriert)
    if (this.config.includeAgriculturalData) {
      try {
        // Meteoblue Agro API für Bodentemperatur und mehr
        const agroResponse = await axios.get(
          `https://my.meteoblue.com/packages/agro-day?lat=${lat}&lon=${lon}&apikey=${apiKey}`,
          { timeout: 15000 }
        );
        
        soilData = agroResponse.data;
        this.log('debug', 'Agrar-Daten erhalten');
      } catch (error) {
        this.log('warn', 'Agrar-Daten nicht verfügbar:', error.message);
      }
    }
    
    const current = currentResponse.data;
    
    return {
      provider: 'meteoblue',
      location: `${lat}, ${lon}`,
      airTemperature: current.temperature,
      soilTemperature: soilData?.soiltemperature_0to7cm || (current.temperature - 4.5),
      humidity: current.relativehumidity,
      windSpeed: current.windspeed,
      precipitation: current.precipitation || 0,
      pressure: current.sealevelpressure,
      condition: this.mapMeteoblueCondition(current.pictocode),
      cloudCover: current.totalcloudcover,
      uvIndex: current.uvindex,
      visibility: current.visibility,
      dewPoint: current.dewpoint,
      
      // Zusätzliche Agrar-Daten (falls verfügbar)
      soilMoisture: soilData?.soilmoisture_0to7cm || null,
      evapotranspiration: soilData?.evapotranspiration || null,
      growingDegreeDays: soilData?.growingdegreedays || null,
      leafWetness: soilData?.leafwetness || null
    };
  }
  
  /**
   * Konvertiert Meteoblue Pictocode zu deutscher Beschreibung
   */
  mapMeteoblueCondition(pictocode) {
    const conditions = {
      1: 'Sonnig',
      2: 'Heiter',
      3: 'Teilweise bewölkt',
      4: 'Bewölkt',
      5: 'Regenschauer',
      6: 'Regen',
      7: 'Schneeschauer',
      8: 'Schnee',
      9: 'Gewitter',
      10: 'Nebel'
    };
    
    return conditions[pictocode] || 'Unbekannt';
  }
  
  /**
   * Holt Wetterdaten vom konfigurierten Anbieter
   */
  async fetchWeatherData() {
    const { primaryProvider } = this.config;
    
    // Versuche primären Anbieter
    try {
      if (primaryProvider === 'meteoblue' && this.config.meteoblue.enabled) {
        return await this.fetchFromMeteoblue();
      } else if (primaryProvider === 'openweathermap' && this.config.openweathermap.enabled) {
        return await this.fetchFromOpenWeatherMap();
      }
    } catch (error) {
      this.log('warn', `Primärer Anbieter ${primaryProvider} fehlgeschlagen:`, error.message);
    }
    
    // Fallback zum anderen Anbieter
    try {
      if (primaryProvider !== 'meteoblue' && this.config.meteoblue.enabled) {
        this.log('info', 'Fallback zu Meteoblue');
        return await this.fetchFromMeteoblue();
      } else if (primaryProvider !== 'openweathermap' && this.config.openweathermap.enabled) {
        this.log('info', 'Fallback zu OpenWeatherMap');
        return await this.fetchFromOpenWeatherMap();
      }
    } catch (error) {
      this.log('error', 'Fallback-Anbieter ebenfalls fehlgeschlagen:', error.message);
    }
    
    throw new Error('Alle Wetter-APIs fehlgeschlagen');
  }
  
  /**
   * Führt eine Wetterdatensammlung durch
   */
  async collectWeatherData() {
    try {
      if (!this.shouldFetchWeatherData()) {
        this.log('debug', 'Noch zu früh für nächsten Datenabruf');
        return;
      }
      
      this.log('info', 'Sammle Wetterdaten...');
      
      let retries = 0;
      let weatherData = null;
      
      while (retries < this.config.maxRetries && !weatherData) {
        try {
          const rawData = await this.fetchWeatherData();
          
          weatherData = {
            id: `weather-${Date.now()}`,
            timestamp: new Date().toISOString(),
            ...rawData,
            collectionInfo: {
              retryCount: retries,
              collectionDuration: Date.now() // Wird unten aktualisiert
            }
          };
          
          weatherData.collectionInfo.collectionDuration = Date.now() - parseInt(weatherData.id.split('-')[1]);
          
        } catch (error) {
          retries++;
          this.log('warn', `Versuch ${retries}/${this.config.maxRetries} fehlgeschlagen:`, error.message);
          
          if (retries < this.config.maxRetries) {
            await new Promise(resolve => setTimeout(resolve, this.config.retryDelayMs));
          }
        }
      }
      
      if (!weatherData) {
        throw new Error(`Alle ${this.config.maxRetries} Versuche fehlgeschlagen`);
      }
      
      // Daten speichern
      const existingData = this.loadWeatherData();
      
      // Duplikat-Prüfung
      const hour = new Date(weatherData.timestamp).setMinutes(0, 0, 0);
      const isDuplicate = existingData.some(point => {
        const existingHour = new Date(point.timestamp).setMinutes(0, 0, 0);
        return existingHour === hour;
      });
      
      if (!isDuplicate) {
        existingData.push(weatherData);
        
        // Alte Daten entfernen
        if (existingData.length > this.config.maxDataPoints) {
          existingData.splice(0, existingData.length - this.config.maxDataPoints);
        }
        
        this.saveWeatherData(existingData);
        this.lastFetchTime = new Date();
        
        this.log('info', '✅ Neuer Wetterdatenpunkt gespeichert von:', weatherData.provider);
        this.log('debug', 'Daten:', {
          temp: weatherData.airTemperature,
          humidity: weatherData.humidity,
          provider: weatherData.provider
        });
      } else {
        this.log('info', '⚠️ Datenpunkt bereits vorhanden, überspringe');
      }
      
    } catch (error) {
      this.log('error', 'Fehler bei der Datensammlung:', error.message);
    }
  }
  
  // ... Rest der Methoden (checkMutex, createMutex, etc.) bleiben gleich wie im ursprünglichen Service
  // aber ohne Electron-Abhängigkeiten
  
  checkMutex() {
    try {
      if (fs.existsSync(this.mutexPath)) {
        const lockData = JSON.parse(fs.readFileSync(this.mutexPath, 'utf8'));
        const lockTime = new Date(lockData.timestamp);
        const now = new Date();
        
        if (now - lockTime > 10 * 60 * 1000) {
          this.log('info', 'Veraltetes Lock gefunden, entferne es...');
          fs.unlinkSync(this.mutexPath);
          return false;
        }
        
        this.log('info', 'Andere Instanz läuft bereits, Service nicht gestartet');
        return true;
      }
      return false;
    } catch (error) {
      this.log('warn', 'Fehler beim Prüfen des Mutex:', error.message);
      return false;
    }
  }
  
  createMutex() {
    try {
      const lockData = {
        pid: process.pid,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        hostname: os.hostname(),
        platform: os.platform()
      };
      fs.writeFileSync(this.mutexPath, JSON.stringify(lockData, null, 2));
      this.log('info', 'Mutex erstellt für PID:', process.pid);
      return true;
    } catch (error) {
      this.log('error', 'Fehler beim Erstellen des Mutex:', error.message);
      return false;
    }
  }
  
  removeMutex() {
    try {
      if (fs.existsSync(this.mutexPath)) {
        fs.unlinkSync(this.mutexPath);
        this.log('info', 'Mutex entfernt');
      }
    } catch (error) {
      this.log('warn', 'Fehler beim Entfernen des Mutex:', error.message);
    }
  }
  
  loadWeatherData() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
        return Array.isArray(data) ? data : [];
      }
      return [];
    } catch (error) {
      this.log('error', 'Fehler beim Laden der Wetterdaten:', error.message);
      return [];
    }
  }
  
  saveWeatherData(data) {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
      this.log('info', 'Wetterdaten gespeichert:', data.length, 'Einträge');
      return true;
    } catch (error) {
      this.log('error', 'Fehler beim Speichern der Wetterdaten:', error.message);
      return false;
    }
  }
  
  shouldFetchWeatherData() {
    const existingData = this.loadWeatherData();
    
    if (existingData.length === 0) {
      return true;
    }
    
    const latestEntry = existingData
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    
    const latestTime = new Date(latestEntry.timestamp);
    const now = new Date();
    const minutesSinceLastFetch = (now - latestTime) / (1000 * 60);
    
    return minutesSinceLastFetch >= this.config.minIntervalMinutes;
  }
  
  start() {
    if (this.isRunning) {
      this.log('info', 'Service läuft bereits');
      return;
    }
    
    if (this.checkMutex()) {
      return;
    }
    
    if (!this.createMutex()) {
      return;
    }
    
    this.isRunning = true;
    
    // Erste Sammlung sofort
    this.collectWeatherData();
    
    // Dann regelmäßig
    this.intervalId = setInterval(() => {
      this.collectWeatherData();
    }, this.config.intervalHours * 60 * 60 * 1000);
    
    this.log('info', `✅ Background Service gestartet (alle ${this.config.intervalHours}h)`);
    this.log('info', `📍 Primärer Anbieter: ${this.config.primaryProvider}`);
    this.log('info', `📂 Datenverzeichnis: ${path.dirname(this.dataPath)}`);
  }
  
  stop() {
    if (!this.isRunning) {
      return;
    }
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.removeMutex();
    this.isRunning = false;
    
    this.log('info', '❌ Background Service gestoppt');
  }
  
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastFetchTime: this.lastFetchTime,
      dataPath: this.dataPath,
      mutexExists: fs.existsSync(this.mutexPath),
      dataCount: this.loadWeatherData().length,
      config: {
        primaryProvider: this.config.primaryProvider,
        enabledProviders: {
          openweathermap: this.config.openweathermap.enabled,
          meteoblue: this.config.meteoblue.enabled
        },
        location: this.config.location,
        intervalHours: this.config.intervalHours
      }
    };
  }
}

// CLI-Interface für direkten Aufruf
if (require.main === module) {
  const service = new StandaloneWeatherService();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      console.log('🚀 Starte Wetter-Service...');
      service.start();
      
      // Graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n🛑 Stopping service...');
        service.stop();
        process.exit(0);
      });
      
      process.on('SIGTERM', () => {
        console.log('\n🛑 Stopping service...');
        service.stop();
        process.exit(0);
      });
      
      break;
      
    case 'status':
      console.log('📊 Service Status:');
      console.log(JSON.stringify(service.getStatus(), null, 2));
      break;
      
    case 'test':
      console.log('🧪 Teste Datensammlung...');
      service.collectWeatherData().then(() => {
        console.log('✅ Test abgeschlossen');
        process.exit(0);
      }).catch(error => {
        console.error('❌ Test fehlgeschlagen:', error.message);
        process.exit(1);
      });
      break;
      
    case 'config':
      if (process.argv[3] === 'create') {
        console.log('⚙️ Erstelle Beispiel-Konfiguration...');
        service.saveConfig();
        console.log('✅ Konfiguration erstellt:', service.configPath);
      } else {
        console.log('📋 Aktuelle Konfiguration:');
        console.log(JSON.stringify(service.config, null, 2));
      }
      break;
      
    default:
      console.log(`
🌤️ GartenMeister Standalone Weather Service

Verwendung: node standalone-weather-service.js <command>

Befehle:
  start          Startet den Service (läuft dauerhaft)
  status         Zeigt Service-Status
  test           Führt einen Test-Datenabruf durch
  config         Zeigt aktuelle Konfiguration
  config create  Erstellt Beispiel-Konfiguration

Beispiele:
  node standalone-weather-service.js start
  node standalone-weather-service.js test
  node standalone-weather-service.js config create
      `);
      break;
  }
}

module.exports = StandaloneWeatherService;
