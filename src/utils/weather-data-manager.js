/**
 * 🌤️ Adaptive Weather Data Manager
 * EXE- und NAS-kompatible Wetterdatensammlung mit Multi-Provider Support
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const WeatherStorageConfig = require('./weather-storage-config');

class WeatherDataManager {
  constructor() {
    this.config = null;
    this.storagePaths = null;
    this.initialized = false;
    this.collectingActive = false;
  }

  /**
   * 🚀 Manager initialisieren
   */
  async initialize() {
    try {
      // Adaptive Pfade ermitteln
      this.storagePaths = WeatherStorageConfig.getAdaptiveWeatherPaths();
      
      // Verzeichnisse sicherstellen
      WeatherStorageConfig.ensureDirectories(this.storagePaths.dataPath);
      
      // Konfiguration laden
      this.config = WeatherStorageConfig.loadOrCreateConfig(this.storagePaths.configPath);
      
      console.log('[WeatherDataManager] 🎯 Initialisiert:');
      console.log('  📁 Datenverzeichnis:', this.storagePaths.dataPath);
      console.log('  ⚙️ Konfiguration:', this.storagePaths.configPath);
      console.log('  📦 Portable:', this.storagePaths.isPortable);
      console.log('  📡 NAS:', this.storagePaths.isNAS);
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[WeatherDataManager] ❌ Initialisierung fehlgeschlagen:', error);
      return false;
    }
  }

  /**
   * 🌍 Aktuelle Wetterdaten sammeln
   */
  async collectCurrentWeather() {
    if (!this.initialized) {
      await this.initialize();
    }

    const results = [];
    const timestamp = new Date().toISOString();

    // Primären Provider versuchen
    const primaryResult = await this.tryProvider(this.config.primaryProvider, timestamp);
    if (primaryResult.success) {
      results.push(primaryResult);
    }

    // Fallback-Provider wenn primär fehlschlägt
    if (!primaryResult.success && this.config.fallbackProviders) {
      for (const provider of this.config.fallbackProviders) {
        const fallbackResult = await this.tryProvider(provider, timestamp);
        if (fallbackResult.success) {
          results.push(fallbackResult);
          break; // Nur ersten erfolgreichen Fallback verwenden
        }
      }
    }

    // Daten speichern
    if (results.length > 0) {
      await this.saveWeatherData(results[0]);
      return results[0];
    } else {
      console.error('[WeatherDataManager] ❌ Alle Weather-Provider fehlgeschlagen');
      return { success: false, error: 'Alle Provider fehlgeschlagen' };
    }
  }

  /**
   * 🔄 Provider versuchen
   */
  async tryProvider(providerName, timestamp) {
    try {
      const providerConfig = this.config.providers[providerName];
      
      if (!providerConfig || !providerConfig.enabled) {
        return { 
          success: false, 
          provider: providerName, 
          error: 'Provider nicht aktiviert oder konfiguriert' 
        };
      }

      let weatherData = null;

      switch (providerName) {
        case 'openweathermap':
          weatherData = await this.fetchOpenWeatherMap(providerConfig);
          break;
        case 'meteoblue':
          weatherData = await this.fetchMeteoblue(providerConfig);
          break;
        case 'customStation':
          weatherData = await this.fetchCustomStation(providerConfig);
          break;
        default:
          return { 
            success: false, 
            provider: providerName, 
            error: 'Unbekannter Provider' 
          };
      }

      if (weatherData) {
        return {
          success: true,
          provider: providerName,
          timestamp,
          data: weatherData
        };
      } else {
        return {
          success: false,
          provider: providerName,
          error: 'Keine Daten erhalten'
        };
      }

    } catch (error) {
      console.error(`[WeatherDataManager] ❌ Provider ${providerName} fehlgeschlagen:`, error);
      return {
        success: false,
        provider: providerName,
        error: error.message
      };
    }
  }

  /**
   * 🌍 OpenWeatherMap API
   */
  async fetchOpenWeatherMap(providerConfig) {
    const { lat, lon } = this.config.location;
    const apiKey = providerConfig.apiKey;
    
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=de`;
    
    const data = await this.httpRequest(url);
    
    if (data) {
      return {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: data.wind?.speed || 0,
        windDirection: data.wind?.deg || 0,
        description: data.weather[0]?.description || '',
        icon: data.weather[0]?.icon || '',
        provider: 'openweathermap',
        raw: data
      };
    }
    
    return null;
  }

  /**
   * 🔵 Meteoblue API
   */
  async fetchMeteoblue(providerConfig) {
    const { lat, lon } = this.config.location;
    const apiKey = providerConfig.apiKey;
    
    if (!apiKey || apiKey === 'YOUR_METEOBLUE_API_KEY') {
      throw new Error('Meteoblue API Key nicht konfiguriert');
    }
    
    const url = `https://my.meteoblue.com/packages/current?lat=${lat}&lon=${lon}&apikey=${apiKey}&format=json`;
    
    const data = await this.httpRequest(url);
    
    if (data && data.data_current) {
      const current = data.data_current;
      return {
        temperature: current.temperature,
        humidity: current.relativehumidity,
        pressure: current.sealevelpressure,
        windSpeed: current.windspeed,
        windDirection: current.winddirection,
        description: current.weathercode ? `Weather Code: ${current.weathercode}` : '',
        icon: '',
        provider: 'meteoblue',
        raw: data
      };
    }
    
    return null;
  }

  /**
   * 🏠 Custom Weather Station
   */
  async fetchCustomStation(providerConfig) {
    if (!providerConfig.endpoint) {
      throw new Error('Custom Station Endpoint nicht konfiguriert');
    }
    
    const data = await this.httpRequest(providerConfig.endpoint, {
      'Authorization': providerConfig.apiKey ? `Bearer ${providerConfig.apiKey}` : undefined
    });
    
    // Standardisiertes Format erwarten
    if (data && typeof data.temperature === 'number') {
      return {
        temperature: data.temperature,
        humidity: data.humidity || 0,
        pressure: data.pressure || 0,
        windSpeed: data.windSpeed || 0,
        windDirection: data.windDirection || 0,
        description: data.description || '',
        icon: data.icon || '',
        provider: 'customStation',
        raw: data
      };
    }
    
    return null;
  }

  /**
   * 📡 HTTP Request Helper
   */
  httpRequest(url, headers = {}) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const options = {
        headers: {
          'User-Agent': 'GartenMeister/1.0',
          ...headers
        }
      };

      const req = client.get(url, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(new Error(`JSON Parse Error: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`HTTP Request Error: ${error.message}`));
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request Timeout'));
      });
    });
  }

  /**
   * 💾 Wetterdaten speichern
   */
  async saveWeatherData(weatherResult) {
    try {
      const dataFile = path.join(this.storagePaths.dataPath, 'weather-data.json');
      
      // Bestehende Daten laden
      let allData = [];
      if (fs.existsSync(dataFile)) {
        try {
          const existingData = fs.readFileSync(dataFile, 'utf8');
          allData = JSON.parse(existingData);
        } catch (error) {
          console.warn('[WeatherDataManager] ⚠️ Bestehende Daten nicht lesbar, neu initialisiert');
          allData = [];
        }
      }

      // Neue Daten hinzufügen
      allData.push(weatherResult);

      // Limit einhalten
      if (allData.length > this.config.maxDataPoints) {
        allData = allData.slice(-this.config.maxDataPoints);
      }

      // Speichern
      fs.writeFileSync(dataFile, JSON.stringify(allData, null, 2));
      
      console.log(`[WeatherDataManager] ✅ Wetterdaten gespeichert (${allData.length} Datenpunkte)`);
      
      // Backup erstellen wenn aktiviert
      if (this.config.enableBackups) {
        this.createBackup(allData);
      }

      return true;
    } catch (error) {
      console.error('[WeatherDataManager] ❌ Speichern fehlgeschlagen:', error);
      return false;
    }
  }

  /**
   * 📦 Backup erstellen
   */
  createBackup(data) {
    try {
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const backupFile = path.join(this.storagePaths.backupPath, `weather-backup-${timestamp}.json`);
      
      if (!fs.existsSync(backupFile)) {
        fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
        console.log('[WeatherDataManager] 📦 Backup erstellt:', backupFile);
      }
      
      // Alte Backups löschen (älter als 30 Tage)
      this.cleanupOldBackups();
    } catch (error) {
      console.error('[WeatherDataManager] ⚠️ Backup fehlgeschlagen:', error);
    }
  }

  /**
   * 🧹 Alte Backups löschen
   */
  cleanupOldBackups() {
    try {
      const backupDir = this.storagePaths.backupPath;
      if (!fs.existsSync(backupDir)) return;

      const files = fs.readdirSync(backupDir);
      const now = Date.now();
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 Tage

      files.forEach(file => {
        if (file.startsWith('weather-backup-') && file.endsWith('.json')) {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            fs.unlinkSync(filePath);
            console.log('[WeatherDataManager] 🗑️ Altes Backup gelöscht:', file);
          }
        }
      });
    } catch (error) {
      console.error('[WeatherDataManager] ⚠️ Backup-Cleanup fehlgeschlagen:', error);
    }
  }

  /**
   * 📊 Gespeicherte Wetterdaten abrufen
   */
  getStoredWeatherData(limit = 100) {
    try {
      const dataFile = path.join(this.storagePaths.dataPath, 'weather-data.json');
      
      if (!fs.existsSync(dataFile)) {
        return [];
      }

      const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      return data.slice(-limit); // Neueste X Einträge
    } catch (error) {
      console.error('[WeatherDataManager] ❌ Daten laden fehlgeschlagen:', error);
      return [];
    }
  }

  /**
   * ⚙️ Konfiguration aktualisieren
   */
  updateConfiguration(newConfig) {
    try {
      // Konfiguration mergen
      this.config = { ...this.config, ...newConfig };
      
      // Speichern
      fs.writeFileSync(this.storagePaths.configPath, JSON.stringify(this.config, null, 2));
      
      console.log('[WeatherDataManager] ⚙️ Konfiguration aktualisiert');
      return true;
    } catch (error) {
      console.error('[WeatherDataManager] ❌ Konfiguration Update fehlgeschlagen:', error);
      return false;
    }
  }
}

module.exports = WeatherDataManager;
