/**
 * Background Weather Service für GartenMeister
 * 
 * Sammelt automatisch Wetterdaten im Hintergrund, auch wenn die App nicht geöffnet ist.
 * Verhindert Konflikte zwischen mehreren App-Instanzen durch Mutex-System.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { app } = require('electron');

class WeatherBackgroundService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.mutexPath = null;
    this.dataPath = null;
    this.lastFetchTime = null;
    
    // Konfiguration
    this.config = {
      apiKey: '27abc31487d9b25c2721ed313b51b619',
      location: 'Gurk, Österreich',
      intervalHours: 2,
      minIntervalMinutes: 30, // Mindestabstand zwischen Sammlungen
    };
    
    this.initializePaths();
  }
  
  initializePaths() {
    // Daten-Ordner bestimmen
    const userDataPath = app.getPath('userData');
    const dataDir = path.join(userDataPath, 'data');
    
    // Stelle sicher, dass der Ordner existiert
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.dataPath = path.join(dataDir, 'weather-data.json');
    this.mutexPath = path.join(dataDir, '.weather-service.lock');
  }
  
  /**
   * Prüft, ob bereits eine andere Instanz läuft
   */
  checkMutex() {
    try {
      if (fs.existsSync(this.mutexPath)) {
        const lockData = JSON.parse(fs.readFileSync(this.mutexPath, 'utf8'));
        const lockTime = new Date(lockData.timestamp);
        const now = new Date();
        
        // Wenn Lock älter als 10 Minuten ist, als veraltet betrachten
        if (now - lockTime > 10 * 60 * 1000) {
          console.log('[WeatherService] Veraltetes Lock gefunden, entferne es...');
          fs.unlinkSync(this.mutexPath);
          return false;
        }
        
        console.log('[WeatherService] Andere Instanz läuft bereits, Service nicht gestartet');
        return true;
      }
      return false;
    } catch (error) {
      console.warn('[WeatherService] Fehler beim Prüfen des Mutex:', error);
      return false;
    }
  }
  
  /**
   * Erstellt einen Mutex-Lock
   */
  createMutex() {
    try {
      const lockData = {
        pid: process.pid,
        timestamp: new Date().toISOString(),
        version: app.getVersion()
      };
      fs.writeFileSync(this.mutexPath, JSON.stringify(lockData, null, 2));
      console.log('[WeatherService] Mutex erstellt für PID:', process.pid);
      return true;
    } catch (error) {
      console.error('[WeatherService] Fehler beim Erstellen des Mutex:', error);
      return false;
    }
  }
  
  /**
   * Entfernt den Mutex-Lock
   */
  removeMutex() {
    try {
      if (fs.existsSync(this.mutexPath)) {
        fs.unlinkSync(this.mutexPath);
        console.log('[WeatherService] Mutex entfernt');
      }
    } catch (error) {
      console.warn('[WeatherService] Fehler beim Entfernen des Mutex:', error);
    }
  }
  
  /**
   * Lädt bestehende Wetterdaten
   */
  loadWeatherData() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
        return Array.isArray(data) ? data : [];
      }
      return [];
    } catch (error) {
      console.error('[WeatherService] Fehler beim Laden der Wetterdaten:', error);
      return [];
    }
  }
  
  /**
   * Speichert Wetterdaten
   */
  saveWeatherData(data) {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
      console.log('[WeatherService] Wetterdaten gespeichert:', data.length, 'Einträge');
      return true;
    } catch (error) {
      console.error('[WeatherService] Fehler beim Speichern der Wetterdaten:', error);
      return false;
    }
  }
  
  /**
   * Prüft, ob ein neuer Datenabruf nötig ist
   */
  shouldFetchWeatherData() {
    const existingData = this.loadWeatherData();
    
    if (existingData.length === 0) {
      return true; // Keine Daten vorhanden
    }
    
    // Finde den neuesten Eintrag
    const latestEntry = existingData
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    
    const latestTime = new Date(latestEntry.timestamp);
    const now = new Date();
    const minutesSinceLastFetch = (now - latestTime) / (1000 * 60);
    
    return minutesSinceLastFetch >= this.config.minIntervalMinutes;
  }
  
  /**
   * Holt aktuelle Wetterdaten von der API
   */
  async fetchWeatherFromAPI() {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${this.config.location}&appid=${this.config.apiKey}&units=metric&lang=de`,
        { timeout: 10000 }
      );
      
      // Bodentemperatur schätzen
      const estimatedSoilTemp = response.data.main.temp - 4.5;
      
      const weatherDataPoint = {
        id: `weather-${Date.now()}`,
        timestamp: new Date().toISOString(),
        airTemperature: response.data.main.temp,
        soilTemperature: estimatedSoilTemp,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed * 3.6, // m/s zu km/h
        precipitation: response.data.rain?.['1h'] || response.data.snow?.['1h'] || 0,
        condition: response.data.weather[0].description
      };
      
      console.log('[WeatherService] Wetterdaten abgerufen:', {
        location: response.data.name,
        temp: weatherDataPoint.airTemperature,
        humidity: weatherDataPoint.humidity
      });
      
      return weatherDataPoint;
    } catch (error) {
      console.error('[WeatherService] Fehler beim Abrufen der Wetterdaten:', error.message);
      throw error;
    }
  }
  
  /**
   * Führt eine Wetterdatensammlung durch
   */
  async collectWeatherData() {
    try {
      if (!this.shouldFetchWeatherData()) {
        console.log('[WeatherService] Noch zu früh für nächsten Datenabruf');
        return;
      }
      
      console.log('[WeatherService] Sammle Wetterdaten...');
      const newDataPoint = await this.fetchWeatherFromAPI();
      
      // Lade bestehende Daten und füge neuen Punkt hinzu
      const existingData = this.loadWeatherData();
      
      // Verhindere Duplikate basierend auf Zeitstempel (gleiche Stunde)
      const hour = new Date(newDataPoint.timestamp).setMinutes(0, 0, 0);
      const isDuplicate = existingData.some(point => {
        const existingHour = new Date(point.timestamp).setMinutes(0, 0, 0);
        return existingHour === hour;
      });
      
      if (!isDuplicate) {
        existingData.push(newDataPoint);
        
        // Behalte nur die letzten 1000 Einträge (ca. 1 Jahr bei 2h Intervall)
        if (existingData.length > 1000) {
          existingData.splice(0, existingData.length - 1000);
        }
        
        this.saveWeatherData(existingData);
        this.lastFetchTime = new Date();
        
        console.log('[WeatherService] ✅ Neuer Wetterdatenpunkt gespeichert');
      } else {
        console.log('[WeatherService] ⚠️ Datenpunkt bereits vorhanden, überspringe');
      }
      
    } catch (error) {
      console.error('[WeatherService] Fehler bei der Datensammlung:', error);
    }
  }
  
  /**
   * Startet den Background Service
   */
  start() {
    if (this.isRunning) {
      console.log('[WeatherService] Service läuft bereits');
      return;
    }
    
    // Prüfe Mutex
    if (this.checkMutex()) {
      return; // Andere Instanz läuft bereits
    }
    
    // Erstelle Mutex
    if (!this.createMutex()) {
      return; // Konnte Mutex nicht erstellen
    }
    
    this.isRunning = true;
    
    // Erste Sammlung sofort
    this.collectWeatherData();
    
    // Dann alle 2 Stunden
    this.intervalId = setInterval(() => {
      this.collectWeatherData();
    }, this.config.intervalHours * 60 * 60 * 1000);
    
    console.log(`[WeatherService] ✅ Background Service gestartet (alle ${this.config.intervalHours}h)`);
  }
  
  /**
   * Stoppt den Background Service
   */
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
    
    console.log('[WeatherService] ❌ Background Service gestoppt');
  }
  
  /**
   * Service-Status abrufen
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastFetchTime: this.lastFetchTime,
      dataPath: this.dataPath,
      mutexExists: fs.existsSync(this.mutexPath),
      dataCount: this.loadWeatherData().length
    };
  }
}

module.exports = WeatherBackgroundService;
