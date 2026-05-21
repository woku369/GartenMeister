/**
 * 🌤️ NAS-kompatible Weather Storage Configuration
 * Adaptive Pfad-Auflösung für Wetterdatensammlung in EXE und NAS-Umgebungen
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class WeatherStorageConfig {
  
  /**
   * 🎯 Adaptive Pfad-Auflösung für Wetterdaten
   */
  static getAdaptiveWeatherPaths() {
    const config = {
      dataPath: null,
      configPath: null,
      backupPath: null,
      isNAS: false,
      isPortable: false,
      fallbacks: []
    };

    // 1. EXE-Modus: Portable neben der EXE
    if (process.pkg) {
      const exeDir = path.dirname(process.execPath);
      
      const testPaths = [
        path.join(exeDir, 'weather-data'),                          // Neben der EXE
        path.join(exeDir, '..', 'weather-data'),                   // Eine Ebene höher
        path.join(os.homedir(), 'GartenMeister', 'weather-data'),  // User-Verzeichnis
        path.join(os.tmpdir(), 'GartenMeister', 'weather-data')    // Temp-Verzeichnis
      ];

      for (const testPath of testPaths) {
        if (WeatherStorageConfig.testWriteAccess(testPath)) {
          config.dataPath = testPath;
          config.configPath = path.join(testPath, 'weather-config.json');
          config.backupPath = path.join(testPath, 'backups');
          config.isPortable = true;
          console.log('[WeatherStorage] 📦 EXE-Modus: Portable Pfad:', testPath);
          return config;
        }
      }
      
      throw new Error('Kein beschreibbarer Pfad für Weather-Daten in EXE-Modus gefunden');
    }

    // 2. Entwicklungs-Modus: NAS-Erkennung und Fallbacks
    try {
      // NAS-Pfade prüfen
      const potentialNASPaths = [
        'G:\\gartenmeister\\weather',
        'Z:\\gartenmeister\\weather',
        '\\\\nas\\gartenmeister\\weather',
        'G:\\gartenmeister\\data\\weather',
        '/volume1/gartenmeister/weather' // Synology
      ];

      for (const nasPath of potentialNASPaths) {
        if (fs.existsSync(nasPath) && WeatherStorageConfig.testWriteAccess(nasPath)) {
          config.dataPath = nasPath;
          config.configPath = path.join(nasPath, 'weather-config.json');
          config.backupPath = path.join(nasPath, 'backups');
          config.isNAS = true;
          config.fallbacks.push(WeatherStorageConfig.getLocalWeatherPath());
          console.log('[WeatherStorage] 📡 NAS-Modus aktiviert:', nasPath);
          return config;
        }
      }

      // Fallback zu lokalem Pfad
      const localPath = WeatherStorageConfig.getLocalWeatherPath();
      config.dataPath = localPath;
      config.configPath = path.join(localPath, 'weather-config.json');
      config.backupPath = path.join(localPath, 'backups');
      console.log('[WeatherStorage] 💻 Lokaler Modus:', localPath);
      return config;

    } catch (error) {
      console.error('[WeatherStorage] ⚠️ Pfad-Ermittlung fehlgeschlagen:', error);
      const fallbackPath = WeatherStorageConfig.getLocalWeatherPath();
      config.dataPath = fallbackPath;
      config.configPath = path.join(fallbackPath, 'weather-config.json');
      config.backupPath = path.join(fallbackPath, 'backups');
      return config;
    }
  }

  /**
   * 🏠 Lokaler Weather-Pfad ermitteln
   */
  static getLocalWeatherPath() {
    try {
      // Electron verfügbar?
      const { app } = require('electron');
      return path.join(app.getPath('userData'), 'weather-data');
    } catch (error) {
      // Fallback ohne Electron
      return path.join(os.homedir(), 'GartenMeister', 'weather-data');
    }
  }

  /**
   * ✏️ Schreibzugriff testen
   */
  static testWriteAccess(dirPath) {
    try {
      // Verzeichnis erstellen falls nicht vorhanden
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // Schreibtest
      const testFile = path.join(dirPath, 'write-test.tmp');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      
      return true;
    } catch (error) {
      console.warn(`[WeatherStorage] ⚠️ Kein Schreibzugriff auf ${dirPath}:`, error.message);
      return false;
    }
  }

  /**
   * 📁 Verzeichnis-Struktur sicherstellen
   */
  static ensureDirectories(basePath) {
    const dirs = [
      basePath,
      path.join(basePath, 'backups'),
      path.join(basePath, 'logs'),
      path.join(basePath, 'cache')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[WeatherStorage] 📁 Verzeichnis erstellt: ${dir}`);
      }
    });
  }

  /**
   * ⚙️ Standard-Weather-Konfiguration erstellen
   */
  static createDefaultConfig() {
    return {
      // Provider-Konfiguration
      primaryProvider: 'openweathermap', // Default zu OpenWeather
      fallbackProviders: ['meteoblue'],
      
      providers: {
        openweathermap: {
          apiKey: '27abc31487d9b25c2721ed313b51b619',
          enabled: true
        },
        meteoblue: {
          apiKey: '', // Muss vom Benutzer konfiguriert werden
          enabled: false
        },
        customStation: {
          endpoint: '',
          apiKey: '',
          enabled: false
        }
      },

      // Lokation
      location: {
        name: 'Gurk, Österreich',
        lat: 46.8744,
        lon: 14.1497
      },

      // Sammlung-Intervall
      intervalHours: 2,
      minIntervalMinutes: 30,
      maxRetries: 3,
      retryDelayMs: 5000,

      // Datenspeicherung
      maxDataPoints: 1000, // ca. 1 Jahr bei 2h Intervall
      enableBackups: true,
      backupIntervalDays: 7,
      
      // Logging
      logLevel: 'info',
      
      // EXE-spezifisch
      portable: process.pkg || false,
      
      // NAS-spezifisch
      nasSync: {
        enabled: false,
        syncInterval: 24, // Stunden
        retryOnFailure: true
      }
    };
  }

  /**
   * 💾 Konfiguration laden oder erstellen
   */
  static loadOrCreateConfig(configPath) {
    try {
      if (fs.existsSync(configPath)) {
        const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('[WeatherStorage] ✅ Konfiguration geladen:', configPath);
        
        // Meteoblue aktivieren wenn API Key vorhanden
        if (data.providers?.meteoblue?.apiKey && 
            data.providers.meteoblue.apiKey !== 'YOUR_METEOBLUE_API_KEY' &&
            data.providers.meteoblue.apiKey.length > 10) {
          data.providers.meteoblue.enabled = true;
        }
        
        return data;
      } else {
        // Neue Konfiguration erstellen
        const defaultConfig = WeatherStorageConfig.createDefaultConfig();
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        console.log('[WeatherStorage] 📝 Standard-Konfiguration erstellt:', configPath);
        return defaultConfig;
      }
    } catch (error) {
      console.error('[WeatherStorage] ❌ Konfigurationsfehler:', error);
      return WeatherStorageConfig.createDefaultConfig();
    }
  }

  /**
   * 🔄 Migration bestehender Wetterdaten zu NAS
   */
  static async migrateWeatherDataToNAS(fromPath, toPath) {
    try {
      if (!fs.existsSync(fromPath) || !fs.existsSync(toPath)) {
        return { migrated: 0, errors: [] };
      }

      const weatherFiles = [
        'weather-data.json',
        'weather-config.json'
      ];

      let migrated = 0;
      const errors = [];

      for (const file of weatherFiles) {
        try {
          const sourcePath = path.join(fromPath, file);
          const targetPath = path.join(toPath, file);

          if (fs.existsSync(sourcePath) && !fs.existsSync(targetPath)) {
            fs.copyFileSync(sourcePath, targetPath);
            console.log(`[WeatherStorage] ✅ Migriert: ${file}`);
            migrated++;
          }
        } catch (error) {
          errors.push({ file, error: error.message });
          console.error(`[WeatherStorage] ❌ Migration fehlgeschlagen für ${file}:`, error);
        }
      }

      return { migrated, errors };
    } catch (error) {
      console.error('[WeatherStorage] ❌ Migration fehlgeschlagen:', error);
      return { migrated: 0, errors: [{ general: error.message }] };
    }
  }
}

module.exports = WeatherStorageConfig;
