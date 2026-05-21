/**
 * Standalone Weather Service für GartenMeister
 * Läuft auf NAS (Synology DS124) oder beliebigem anderen System
 * 
 * Sammelt automatisch Wetterdaten alle 2 Stunden und speichert sie
 * in das konfigurierte Verzeichnis (lokal oder NAS-Share).
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cron = require('node-cron');

class GartenMeisterWeatherService {
  constructor(configPath = './config.json') {
    this.config = this.loadConfig(configPath);
    this.isRunning = false;
    this.lastFetchTime = null;
    this.lockFile = null;
    
    console.log('🌤️ GartenMeister Weather Service v1.0.0');
    console.log('📍 Standort:', this.config.location);
    console.log('💾 Datenpfad:', this.config.dataPath);
    
    this.initializeDataDirectory();
  }
  
  /**
   * Lädt Konfiguration aus JSON-Datei
   */
  loadConfig(configPath) {
    try {
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return { ...this.getDefaultConfig(), ...config };
      } else {
        console.log('⚠️ Keine Konfigurationsdatei gefunden, erstelle Standardkonfiguration...');
        const defaultConfig = this.getDefaultConfig();
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        return defaultConfig;
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Konfiguration:', error);
      return this.getDefaultConfig();
    }
  }
  
  /**
   * Standard-Konfiguration
   */
  getDefaultConfig() {
    return {
      // Wetter-API Konfiguration
      apiKey: '27abc31487d9b25c2721ed313b51b619',
      location: 'Gurk, Österreich',
      
      // Sammlung-Intervall
      cronSchedule: '0 */2 * * *', // Alle 2 Stunden
      minIntervalMinutes: 30,
      
      // Datenspeicherung
      dataPath: './data', // Wird für NAS angepasst: '/volume1/gartenmeister/data'
      weatherDataFile: 'weather-data.json',
      maxDataPoints: 8760, // 1 Jahr bei 1h Intervall
      
      // Backup & Logging
      enableBackups: true,
      backupInterval: 7, // Tage
      logLevel: 'info', // 'debug', 'info', 'warn', 'error'
      
      // NAS-spezifische Einstellungen
      nasMode: false,
      nasPath: '/volume1/gartenmeister', // Synology Standard-Pfad
      
      // Sicherheit
      enableLocking: true,
      lockTimeout: 10 // Minuten
    };
  }
  
  /**
   * Initialisiert Datenverzeichnis
   */
  initializeDataDirectory() {
    try {
      const dataDir = this.config.dataPath;
      
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        this.log('info', `📁 Datenverzeichnis erstellt: ${dataDir}`);
      }
      
      // Lock-Datei Pfad setzen
      this.lockFile = path.join(dataDir, '.weather-service.lock');
      
      this.log('info', '✅ Datenverzeichnis initialisiert');
    } catch (error) {
      this.log('error', `❌ Fehler beim Initialisieren des Datenverzeichnisses: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Logging-Funktion
   */
  log(level, message) {
    const timestamp = new Date().toISOString();
    const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = logLevels[this.config.logLevel] || 1;
    
    if (logLevels[level] >= configLevel) {
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }
  }
  
  /**
   * Prüft Mutex-Lock
   */
  checkLock() {
    if (!this.config.enableLocking) return false;
    
    try {
      if (fs.existsSync(this.lockFile)) {
        const lockData = JSON.parse(fs.readFileSync(this.lockFile, 'utf8'));
        const lockTime = new Date(lockData.timestamp);
        const now = new Date();
        
        // Lock-Timeout prüfen
        if (now - lockTime > this.config.lockTimeout * 60 * 1000) {
          this.log('warn', '⚠️ Veraltetes Lock gefunden, entferne es...');
          fs.unlinkSync(this.lockFile);
          return false;
        }
        
        this.log('info', '🔒 Service läuft bereits auf anderem System');
        return true;
      }
      return false;
    } catch (error) {
      this.log('warn', `⚠️ Fehler beim Prüfen des Locks: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Erstellt Mutex-Lock
   */
  createLock() {
    if (!this.config.enableLocking) return true;
    
    try {
      const lockData = {
        pid: process.pid,
        hostname: require('os').hostname(),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
      
      fs.writeFileSync(this.lockFile, JSON.stringify(lockData, null, 2));
      this.log('info', `🔐 Lock erstellt (PID: ${process.pid})`);
      return true;
    } catch (error) {
      this.log('error', `❌ Fehler beim Erstellen des Locks: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Entfernt Mutex-Lock
   */
  removeLock() {
    if (!this.config.enableLocking) return;
    
    try {
      if (fs.existsSync(this.lockFile)) {
        fs.unlinkSync(this.lockFile);
        this.log('info', '🔓 Lock entfernt');
      }
    } catch (error) {
      this.log('warn', `⚠️ Fehler beim Entfernen des Locks: ${error.message}`);
    }
  }
  
  /**
   * Lädt bestehende Wetterdaten
   */
  loadWeatherData() {
    try {
      const filePath = path.join(this.config.dataPath, this.config.weatherDataFile);
      
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return Array.isArray(data) ? data : [];
      }
      return [];
    } catch (error) {
      this.log('error', `❌ Fehler beim Laden der Wetterdaten: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Speichert Wetterdaten
   */
  saveWeatherData(data) {
    try {
      const filePath = path.join(this.config.dataPath, this.config.weatherDataFile);
      
      // Daten sortieren (neueste zuerst)
      data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Maximale Anzahl Datenpunkte begrenzen
      if (data.length > this.config.maxDataPoints) {
        data = data.slice(0, this.config.maxDataPoints);
        this.log('info', `📊 Daten auf ${this.config.maxDataPoints} Punkte begrenzt`);
      }
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      this.log('info', `💾 Wetterdaten gespeichert: ${data.length} Einträge`);
      
      // Backup erstellen (falls aktiviert)
      if (this.config.enableBackups) {
        this.createBackup(data);
      }
      
      return true;
    } catch (error) {
      this.log('error', `❌ Fehler beim Speichern der Wetterdaten: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Erstellt Backup der Wetterdaten
   */
  createBackup(data) {
    try {
      const backupDir = path.join(this.config.dataPath, 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const today = new Date().toISOString().split('T')[0];
      const backupFile = path.join(backupDir, `weather-data-${today}.json`);
      
      // Nur ein Backup pro Tag erstellen
      if (!fs.existsSync(backupFile)) {
        fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
        this.log('info', `📦 Backup erstellt: ${backupFile}`);
        
        // Alte Backups löschen
        this.cleanupOldBackups(backupDir);
      }
    } catch (error) {
      this.log('warn', `⚠️ Fehler beim Erstellen des Backups: ${error.message}`);
    }
  }
  
  /**
   * Löscht alte Backups
   */
  cleanupOldBackups(backupDir) {
    try {
      const files = fs.readdirSync(backupDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.backupInterval);
      
      files.forEach(file => {
        if (file.startsWith('weather-data-') && file.endsWith('.json')) {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
            this.log('info', `🗑️ Altes Backup gelöscht: ${file}`);
          }
        }
      });
    } catch (error) {
      this.log('warn', `⚠️ Fehler beim Löschen alter Backups: ${error.message}`);
    }
  }
  
  /**
   * Prüft, ob neue Daten abgerufen werden sollen
   */
  shouldFetchData() {
    const existingData = this.loadWeatherData();
    
    if (existingData.length === 0) {
      this.log('info', '📊 Keine Daten vorhanden, erste Sammlung');
      return true;
    }
    
    const latestEntry = existingData[0]; // Daten sind sortiert (neueste zuerst)
    const latestTime = new Date(latestEntry.timestamp);
    const now = new Date();
    const minutesSinceLastFetch = (now - latestTime) / (1000 * 60);
    
    const shouldFetch = minutesSinceLastFetch >= this.config.minIntervalMinutes;
    
    if (!shouldFetch) {
      this.log('debug', `⏱️ Zu früh für nächsten Abruf (${Math.round(minutesSinceLastFetch)}/${this.config.minIntervalMinutes} min)`);
    }
    
    return shouldFetch;
  }
  
  /**
   * Holt aktuelle Wetterdaten von der API
   */
  async fetchWeatherFromAPI() {
    try {
      this.log('info', '🌐 Rufe Wetterdaten von OpenWeatherMap ab...');
      
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${this.config.location}&appid=${this.config.apiKey}&units=metric&lang=de`,
        { timeout: 15000 }
      );
      
      // Bodentemperatur schätzen (4-6°C niedriger als Lufttemperatur)
      const estimatedSoilTemp = response.data.main.temp - 4.5;
      
      const weatherDataPoint = {
        id: `weather-${Date.now()}`,
        timestamp: new Date().toISOString(),
        airTemperature: Math.round(response.data.main.temp * 100) / 100,
        soilTemperature: Math.round(estimatedSoilTemp * 100) / 100,
        humidity: response.data.main.humidity,
        windSpeed: Math.round((response.data.wind?.speed || 0) * 3.6 * 100) / 100, // m/s zu km/h
        precipitation: response.data.rain?.['1h'] || response.data.snow?.['1h'] || 0,
        condition: response.data.weather[0].description,
        location: response.data.name,
        pressure: response.data.main.pressure,
        visibility: response.data.visibility ? Math.round(response.data.visibility / 1000) : null // km
      };
      
      this.log('info', `📊 Wetterdaten erhalten: ${weatherDataPoint.airTemperature}°C, ${weatherDataPoint.humidity}% Luftfeuchtigkeit`);
      
      return weatherDataPoint;
    } catch (error) {
      this.log('error', `❌ Fehler beim Abrufen der Wetterdaten: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Führt eine komplette Datensammlung durch
   */
  async collectWeatherData() {
    try {
      this.log('info', '🚀 Starte Wetterdatensammlung...');
      
      if (!this.shouldFetchData()) {
        return false;
      }
      
      const newDataPoint = await this.fetchWeatherFromAPI();
      const existingData = this.loadWeatherData();
      
      // Duplikate verhindern (gleiche Stunde)
      const hour = new Date(newDataPoint.timestamp).setMinutes(0, 0, 0);
      const isDuplicate = existingData.some(point => {
        const existingHour = new Date(point.timestamp).setMinutes(0, 0, 0);
        return existingHour === hour;
      });
      
      if (!isDuplicate) {
        existingData.unshift(newDataPoint); // Am Anfang hinzufügen (neueste zuerst)
        
        if (this.saveWeatherData(existingData)) {
          this.lastFetchTime = new Date();
          this.log('info', '✅ Neuer Wetterdatenpunkt erfolgreich gespeichert');
          return true;
        }
      } else {
        this.log('warn', '⚠️ Datenpunkt bereits vorhanden, überspringe');
        return false;
      }
      
    } catch (error) {
      this.log('error', `❌ Fehler bei der Datensammlung: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Startet den Service
   */
  start() {
    if (this.isRunning) {
      this.log('warn', '⚠️ Service läuft bereits');
      return false;
    }
    
    // Lock prüfen
    if (this.checkLock()) {
      this.log('error', '❌ Service wird bereits auf anderem System ausgeführt');
      return false;
    }
    
    // Lock erstellen
    if (!this.createLock()) {
      this.log('error', '❌ Konnte Lock nicht erstellen');
      return false;
    }
    
    this.isRunning = true;
    
    // Erste Sammlung sofort
    this.log('info', '🎯 Führe erste Datensammlung durch...');
    this.collectWeatherData();
    
    // Cron-Job starten
    this.cronJob = cron.schedule(this.config.cronSchedule, () => {
      this.collectWeatherData();
    }, {
      scheduled: false,
      timezone: "Europe/Vienna"
    });
    
    this.cronJob.start();
    
    this.log('info', `✅ Weather Service gestartet`);
    this.log('info', `📅 Zeitplan: ${this.config.cronSchedule} (alle 2 Stunden)`);
    this.log('info', `📍 Standort: ${this.config.location}`);
    this.log('info', `💾 Daten: ${this.config.dataPath}`);
    
    // Graceful Shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
    
    return true;
  }
  
  /**
   * Stoppt den Service
   */
  stop() {
    if (!this.isRunning) {
      return;
    }
    
    this.log('info', '🛑 Stoppe Weather Service...');
    
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    
    this.removeLock();
    this.isRunning = false;
    
    this.log('info', '❌ Weather Service gestoppt');
    process.exit(0);
  }
  
  /**
   * Service-Status
   */
  getStatus() {
    const data = this.loadWeatherData();
    
    return {
      isRunning: this.isRunning,
      lastFetchTime: this.lastFetchTime,
      dataPath: this.config.dataPath,
      dataCount: data.length,
      lastDataPoint: data.length > 0 ? data[0] : null,
      lockExists: fs.existsSync(this.lockFile),
      config: {
        location: this.config.location,
        schedule: this.config.cronSchedule,
        nasMode: this.config.nasMode
      }
    };
  }
}

// Service starten, wenn direkt ausgeführt
if (require.main === module) {
  const service = new GartenMeisterWeatherService();
  
  console.log('🌤️ Starte GartenMeister Weather Service...');
  
  if (service.start()) {
    console.log('✅ Service erfolgreich gestartet');
    console.log('⏹️ Zum Beenden: Ctrl+C');
    
    // Keep alive
    setInterval(() => {
      // Service läuft
    }, 60000);
    
  } else {
    console.log('❌ Service konnte nicht gestartet werden');
    process.exit(1);
  }
}

module.exports = GartenMeisterWeatherService;
