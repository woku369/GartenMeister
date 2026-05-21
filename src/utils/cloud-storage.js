/**
 * Cloud-Storage-Utilities für GartenMeister
 * 
 * Dieses Modul bietet einheitliche Schnittstellen für verschiedene Cloud-Storage-Provider
 * und ermöglicht es, von verschiedenen Rechnern auf dieselben Daten zuzugreifen.
 * 
 * Unterstützte Provider:
 * - Local (lokaler Ordner, z.B. OneDrive/Google Drive/Dropbox Sync-Ordner)
 * - NAS (Synology NAS über SMB/CIFS)
 * - OneDrive (direkte API-Integration + lokaler Sync)
 * - Google Drive (direkte API-Integration)
 * - Firebase (Team-Collaboration)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// OneDrive-Integration importieren
const { getOneDriveStorage } = require('./onedrive-sync');

/**
 * NAS-Konfiguration für DS124-RockingK
 */
const NAS_CONFIG = {
  enabled: true,
  nasHost: 'DS124-RockingK',
  nasIP: '192.168.0.25',
  basePath: 'G:\\gartenmeister',
  networkPath: '\\\\DS124-RockingK\\Gurktaler\\gartenmeister',
  paths: {
    appData: 'G:\\gartenmeister\\data\\app-data.json',
    weatherData: 'G:\\gartenmeister\\weather\\data\\weather-data.json',
    images: 'G:\\gartenmeister\\images',
    backups: 'G:\\gartenmeister\\data\\backups',
    sync: 'G:\\gartenmeister\\sync'
  }
};

/**
 * Cloud-Storage-Provider-Konfiguration
 */
const CLOUD_PROVIDERS = {
  nas: {
    name: 'Synology NAS',
    description: 'DS124-RockingK über Netzlaufwerk G:',
    requiresAuth: false,
    supportsRealtime: true,
    config: NAS_CONFIG
  },
  local: {
    name: 'Lokaler Cloud-Ordner',
    description: 'Nutzt lokalen Sync-Ordner (OneDrive, Google Drive, Dropbox)',
    requiresAuth: false,
    supportsRealtime: false
  },
  onedrive: {
    name: 'Microsoft OneDrive',
    description: 'OneDrive-Integration mit automatischer Ordner-Erkennung',
    requiresAuth: false,  // Nutzt lokalen OneDrive-Sync
    supportsRealtime: true
  },
  googledrive: {
    name: 'Google Drive',
    description: 'Direkte Google Drive-Integration mit Drive API v3',
    requiresAuth: true,
    supportsRealtime: true
  },
  firebase: {
    name: 'Firebase Cloud Firestore',
    description: 'Team-Collaboration mit Echtzeit-Synchronisation',
    requiresAuth: true,
    supportsRealtime: true
  }
};

/**
 * Standard-Pfade für verschiedene Cloud-Provider
 */
const getDefaultCloudPaths = () => {
  const userHome = os.homedir();
  
  return {
    // NAS-Pfade (DS124-RockingK)
    nas: {
      appData: NAS_CONFIG.paths.appData,
      weatherData: NAS_CONFIG.paths.weatherData,
      images: NAS_CONFIG.paths.images,
      backups: NAS_CONFIG.paths.backups,
      basePath: NAS_CONFIG.basePath
    },
    
    // Lokale Cloud-Sync-Ordner
    onedrive: path.join(userHome, 'OneDrive', 'GartenMeister'),
    googledrive: path.join(userHome, 'Google Drive', 'GartenMeister'),
    dropbox: path.join(userHome, 'Dropbox', 'GartenMeister'),
    
    // Lokale Fallback-Pfade
    local: path.join(userHome, 'Documents', 'GartenMeister-Cloud')
  };
};

/**
 * Erkennt automatisch verfügbare Cloud-Provider basierend auf lokalen Ordnern
 */
const detectAvailableCloudProviders = () => {
  const defaultPaths = getDefaultCloudPaths();
  const available = [];
  
  // Prüfe lokale Sync-Ordner
  Object.entries(defaultPaths).forEach(([provider, syncPath]) => {
    try {
      if (fs.existsSync(syncPath)) {
        available.push({
          provider: provider.includes('_') ? provider.split('_')[0] : provider,
          path: syncPath,
          type: 'local-sync',
          available: true
        });
      }
    } catch (error) {
      console.warn(`[CloudStorage] Fehler beim Prüfen von ${provider}:`, error.message);
    }
  });
  
  return available;
};

/**
 * Erstellt Cloud-Ordner-Struktur wenn sie nicht existiert
 */
const ensureCloudDirectory = (cloudPath) => {
  try {
    if (!fs.existsSync(cloudPath)) {
      fs.mkdirSync(cloudPath, { recursive: true });
      console.log(`[CloudStorage] Cloud-Ordner erstellt: ${cloudPath}`);
    }
    
    // Erstelle Unterordner-Struktur
    const subDirs = ['data', 'exports', 'backups', 'webcam'];
    subDirs.forEach(subDir => {
      const subDirPath = path.join(cloudPath, subDir);
      if (!fs.existsSync(subDirPath)) {
        fs.mkdirSync(subDirPath, { recursive: true });
      }
    });
    
    return true;
  } catch (error) {
    console.error(`[CloudStorage] Fehler beim Erstellen des Cloud-Ordners:`, error);
    return false;
  }
};

/**
 * Validiert einen Cloud-Sync-Pfad
 */
const validateCloudPath = (cloudPath) => {
  const validation = {
    valid: false,
    writable: false,
    exists: false,
    error: null,
    suggestions: []
  };
  
  try {
    if (!cloudPath || cloudPath.trim() === '') {
      validation.error = 'Kein Pfad angegeben';
      validation.suggestions = Object.values(getDefaultCloudPaths())
        .filter(p => fs.existsSync(p))
        .map(p => ({ path: p, reason: 'Erkannter Cloud-Sync-Ordner' }));
      return validation;
    }
    
    // Prüfe ob Ordner existiert
    validation.exists = fs.existsSync(cloudPath);
    
    if (!validation.exists) {
      // Versuche Ordner zu erstellen
      const created = ensureCloudDirectory(cloudPath);
      if (created) {
        validation.exists = true;
      } else {
        validation.error = 'Ordner existiert nicht und konnte nicht erstellt werden';
        return validation;
      }
    }
    
    // Prüfe Schreibberechtigung
    const testFile = path.join(cloudPath, '.gartenmeister-test');
    try {
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      validation.writable = true;
    } catch (writeError) {
      validation.error = 'Keine Schreibberechtigung für den Ordner';
      return validation;
    }
    
    validation.valid = validation.exists && validation.writable;
    
  } catch (error) {
    validation.error = error.message;
  }
  
  return validation;
};

/**
 * Synchronisiert Daten zwischen lokalem und Cloud-Speicher
 */
const syncWithCloud = async (localDataPath, cloudSyncPath, strategy = 'incremental') => {
  const result = {
    success: false,
    message: '',
    conflicts: [],
    synced: {
      uploaded: 0,
      downloaded: 0,
      skipped: 0
    }
  };
  
  try {
    // Validiere Cloud-Pfad
    const validation = validateCloudPath(cloudSyncPath);
    if (!validation.valid) {
      result.message = `Cloud-Pfad ungültig: ${validation.error}`;
      return result;
    }
    
    // Erstelle Cloud-Datenordner
    const cloudDataPath = path.join(cloudSyncPath, 'data');
    ensureCloudDirectory(cloudDataPath);
    
    const localFile = path.join(localDataPath, 'app-data.json');
    const cloudFile = path.join(cloudDataPath, 'app-data.json');
    
    // Prüfe welche Dateien existieren
    const localExists = fs.existsSync(localFile);
    const cloudExists = fs.existsSync(cloudFile);
    
    if (!localExists && !cloudExists) {
      result.message = 'Keine Daten zum Synchronisieren gefunden';
      return result;
    }
    
    if (!localExists && cloudExists) {
      // Download von Cloud zu Lokal
      fs.copyFileSync(cloudFile, localFile);
      result.synced.downloaded = 1;
      result.message = 'Daten von Cloud heruntergeladen';
      result.success = true;
      return result;
    }
    
    if (localExists && !cloudExists) {
      // Upload von Lokal zu Cloud
      fs.copyFileSync(localFile, cloudFile);
      result.synced.uploaded = 1;
      result.message = 'Daten in Cloud hochgeladen';
      result.success = true;
      return result;
    }
    
    // Beide Dateien existieren - prüfe Zeitstempel
    const localStats = fs.statSync(localFile);
    const cloudStats = fs.statSync(cloudFile);
    
    if (strategy === 'realtime' || strategy === 'last-write-wins') {
      if (localStats.mtime > cloudStats.mtime) {
        // Lokal ist neuer - upload
        fs.copyFileSync(localFile, cloudFile);
        result.synced.uploaded = 1;
        result.message = 'Lokale Änderungen in Cloud hochgeladen';
      } else if (cloudStats.mtime > localStats.mtime) {
        // Cloud ist neuer - download
        fs.copyFileSync(cloudFile, localFile);
        result.synced.downloaded = 1;
        result.message = 'Cloud-Änderungen heruntergeladen';
      } else {
        result.synced.skipped = 1;
        result.message = 'Dateien sind bereits synchron';
      }
      result.success = true;
    } else if (strategy === 'user-choice') {
      // Bei Konflikten dem Benutzer die Wahl lassen
      result.conflicts.push({
        file: 'app-data.json',
        localTime: localStats.mtime,
        cloudTime: cloudStats.mtime,
        localSize: localStats.size,
        cloudSize: cloudStats.size
      });
      result.message = 'Konflikt erkannt - Benutzerentscheidung erforderlich';
    }
    
  } catch (error) {
    console.error('[CloudStorage] Sync-Fehler:', error);
    result.message = `Sync-Fehler: ${error.message}`;
  }
  
  return result;
};

/**
 * Erstellt Backup der aktuellen Daten vor Sync
 */
const createBackup = (dataPath, backupReason = 'auto') => {
  try {
    const backupDir = path.join(path.dirname(dataPath), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `app-data-backup-${backupReason}-${timestamp}.json`;
    const backupPath = path.join(backupDir, backupFileName);
    
    const sourceFile = path.join(dataPath, 'app-data.json');
    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, backupPath);
      console.log(`[CloudStorage] Backup erstellt: ${backupPath}`);
      return backupPath;
    }
    
  } catch (error) {
    console.error('[CloudStorage] Backup-Fehler:', error);
  }
  return null;
};

/**
 * Überwacht Cloud-Ordner auf Änderungen (für Realtime-Sync)
 */
const watchCloudDirectory = (cloudPath, callback) => {
  try {
    const cloudDataPath = path.join(cloudPath, 'data');
    if (!fs.existsSync(cloudDataPath)) {
      console.warn('[CloudStorage] Cloud-Datenordner existiert nicht für Überwachung');
      return null;
    }
    
    const watcher = fs.watch(cloudDataPath, { recursive: true }, (eventType, filename) => {
      if (filename === 'app-data.json' && eventType === 'change') {
        console.log('[CloudStorage] Cloud-Datei geändert:', filename);
        if (callback && typeof callback === 'function') {
          callback({
            type: 'file-changed',
            filename,
            path: path.join(cloudDataPath, filename)
          });
        }
      }
    });
    
    console.log(`[CloudStorage] Überwachung gestartet für: ${cloudDataPath}`);
    return watcher;
    
  } catch (error) {
    console.error('[CloudStorage] Fehler beim Starten der Ordner-Überwachung:', error);
    return null;
  }
};

/**
 * Prüft NAS-Verfügbarkeit
 */
const checkNASAvailability = () => {
  try {
    if (!NAS_CONFIG.enabled) return false;
    
    // Prüfe ob Netzlaufwerk G: verfügbar ist
    return fs.existsSync(NAS_CONFIG.basePath);
  } catch (error) {
    console.error('[CloudStorage] NAS-Verfügbarkeitsprüfung fehlgeschlagen:', error);
    return false;
  }
};

/**
 * Testet NAS-Schreibzugriff
 */
const testNASWriteAccess = () => {
  try {
    const testFile = path.join(NAS_CONFIG.paths.sync, '.write-test');
    const testData = { test: true, timestamp: new Date().toISOString() };
    
    fs.writeFileSync(testFile, JSON.stringify(testData));
    const readData = JSON.parse(fs.readFileSync(testFile, 'utf8'));
    
    // Cleanup
    fs.unlinkSync(testFile);
    
    return readData.test === true;
  } catch (error) {
    console.error('[CloudStorage] NAS-Schreibtest fehlgeschlagen:', error);
    return false;
  }
};

/**
 * NAS-spezifische Funktionen
 */
const NASStorage = {
  /**
   * Prüft die NAS-Verbindung
   */
  async checkConnection() {
    try {
      const testPath = path.join(NAS_CONFIG.paths.sync, '.connection-test');
      const testData = {
        test: true,
        timestamp: new Date().toISOString(),
        from: 'gartenmeister-app'
      };
      
      // Schreibtest
      fs.writeFileSync(testPath, JSON.stringify(testData, null, 2));
      
      // Lesetest
      const readData = JSON.parse(fs.readFileSync(testPath, 'utf8'));
      
      return readData.test === true;
    } catch (error) {
      console.error('[NAS] Verbindungstest fehlgeschlagen:', error);
      return false;
    }
  },

  /**
   * Lädt App-Daten von der NAS
   */
  async loadAppData() {
    try {
      const nasDataPath = NAS_CONFIG.paths.appData;
      if (fs.existsSync(nasDataPath)) {
        console.log('[NAS] Lade App-Daten von NAS:', nasDataPath);
        const data = JSON.parse(fs.readFileSync(nasDataPath, 'utf8'));
        return data;
      }
      return null;
    } catch (error) {
      console.error('[NAS] Fehler beim Laden der App-Daten:', error);
      return null;
    }
  },

  /**
   * Speichert App-Daten auf die NAS
   */
  async saveAppData(data) {
    try {
      const nasDataPath = NAS_CONFIG.paths.appData;
      const backupPath = path.join(NAS_CONFIG.paths.backups, `app-data-backup-${Date.now()}.json`);
      
      // Backup erstellen falls Datei existiert
      if (fs.existsSync(nasDataPath)) {
        fs.copyFileSync(nasDataPath, backupPath);
        console.log('[NAS] Backup erstellt:', backupPath);
      }
      
      // Neue Daten speichern
      fs.writeFileSync(nasDataPath, JSON.stringify(data, null, 2));
      console.log('[NAS] App-Daten gespeichert auf NAS');
      
      return true;
    } catch (error) {
      console.error('[NAS] Fehler beim Speichern der App-Daten:', error);
      return false;
    }
  },

  /**
   * Synchronisiert Daten zwischen lokal und NAS
   */
  async syncAppData(localData) {
    try {
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        console.warn('[NAS] Keine Verbindung - Sync übersprungen');
        return { success: false, reason: 'no-connection' };
      }

      const nasData = await this.loadAppData();
      
      if (!nasData) {
        // Keine NAS-Daten vorhanden - Upload der lokalen Daten
        const uploaded = await this.saveAppData(localData);
        return { 
          success: uploaded, 
          action: 'upload', 
          message: 'Lokale Daten auf NAS hochgeladen' 
        };
      }
      
      // Vergleiche Zeitstempel für Konfliktlösung
      const localTimestamp = new Date(localData.lastModified || 0);
      const nasTimestamp = new Date(nasData.lastModified || 0);
      
      if (nasTimestamp > localTimestamp) {
        // NAS-Daten sind neuer
        return { 
          success: true, 
          action: 'download', 
          data: nasData,
          message: 'Neuere Daten von NAS geladen' 
        };
      } else if (localTimestamp > nasTimestamp) {
        // Lokale Daten sind neuer
        const uploaded = await this.saveAppData(localData);
        return { 
          success: uploaded, 
          action: 'upload',
          message: 'Lokale Änderungen auf NAS gespeichert' 
        };
      } else {
        // Daten sind identisch
        return { 
          success: true, 
          action: 'none',
          message: 'Daten sind bereits synchron' 
        };
      }
    } catch (error) {
      console.error('[NAS] Sync-Fehler:', error);
      return { success: false, reason: 'sync-error', error };
    }
  },

  /**
   * Status der NAS-Integration
   */
  async getStatus() {
    const isConnected = await this.checkConnection();
    const hasAppData = fs.existsSync(NAS_CONFIG.paths.appData);
    const hasWeatherData = fs.existsSync(NAS_CONFIG.paths.weatherData);
    
    return {
      connected: isConnected,
      nasHost: NAS_CONFIG.nasHost,
      nasPath: NAS_CONFIG.basePath,
      hasAppData,
      hasWeatherData,
      lastCheck: new Date().toISOString()
    };
  }
};

/**
 * OneDrive Storage Manager - nutzt die erweiterte OneDrive-Integration
 */
const OneDriveStorageManager = {
  /**
   * Verbindung prüfen
   */
  async checkConnection() {
    try {
      const oneDrive = getOneDriveStorage();
      return await oneDrive.checkConnection();
    } catch (error) {
      console.error('[OneDriveManager] Verbindungsfehler:', error);
      return false;
    }
  },

  /**
   * App-Daten laden
   */
  async loadAppData() {
    try {
      const oneDrive = getOneDriveStorage();
      return await oneDrive.loadAppData();
    } catch (error) {
      console.error('[OneDriveManager] Fehler beim Laden:', error);
      return null;
    }
  },

  /**
   * App-Daten speichern
   */
  async saveAppData(appData) {
    try {
      const oneDrive = getOneDriveStorage();
      return await oneDrive.saveAppData(appData);
    } catch (error) {
      console.error('[OneDriveManager] Fehler beim Speichern:', error);
      return false;
    }
  },

  /**
   * Synchronisiert Daten zwischen lokal und OneDrive
   */
  async syncAppData(localData) {
    try {
      const oneDrive = getOneDriveStorage();
      return await oneDrive.syncAppData(localData);
    } catch (error) {
      console.error('[OneDriveManager] Sync-Fehler:', error);
      return { 
        success: false, 
        message: 'OneDrive-Synchronisation fehlgeschlagen: ' + error.message 
      };
    }
  },

  /**
   * Status der OneDrive-Integration
   */
  async getStatus() {
    try {
      const oneDrive = getOneDriveStorage();
      return await oneDrive.getStatus();
    } catch (error) {
      console.error('[OneDriveManager] Status-Fehler:', error);
      return {
        connected: false,
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  },

  /**
   * Datei nach OneDrive exportieren
   */
  async exportFile(fileName, content) {
    try {
      const oneDrive = getOneDriveStorage();
      return await oneDrive.exportFile(fileName, content);
    } catch (error) {
      console.error('[OneDriveManager] Export-Fehler:', error);
      return {
        success: false,
        message: 'OneDrive-Export fehlgeschlagen: ' + error.message
      };
    }
  },

  /**
   * Verfügbare Backup-Dateien auflisten
   */
  async listBackupFiles() {
    try {
      const oneDrive = getOneDriveStorage();
      return await oneDrive.listBackupFiles();
    } catch (error) {
      console.error('[OneDriveManager] Fehler beim Auflisten von Backups:', error);
      return [];
    }
  },

  /**
   * Backup-Datei als Anfangsbestand wiederherstellen
   */
  async restoreFromBackup(backupFilePath) {
    try {
      const oneDrive = getOneDriveStorage();
      return await oneDrive.restoreFromBackup(backupFilePath);
    } catch (error) {
      console.error('[OneDriveManager] Restore-Fehler:', error);
      return {
        success: false,
        message: 'Backup-Wiederherstellung fehlgeschlagen: ' + error.message
      };
    }
  },

  /**
   * OneDrive-Pfad manuell setzen
   */
  async setCustomPath(customPath) {
    try {
      const oneDrive = getOneDriveStorage();
      return oneDrive.setCustomOneDrivePath(customPath);
    } catch (error) {
      console.error('[OneDriveManager] Pfad-Fehler:', error);
      return {
        success: false,
        message: 'Pfad konnte nicht gesetzt werden: ' + error.message
      };
    }
  },

  /**
   * OneDrive-Konfiguration abrufen
   */
  async getConfiguration() {
    try {
      const oneDrive = getOneDriveStorage();
      return oneDrive.getConfiguration();
    } catch (error) {
      console.error('[OneDriveManager] Konfiguration-Fehler:', error);
      return {
        isInitialized: false,
        isConnected: false,
        error: error.message
      };
    }
  }
};

module.exports = {
  CLOUD_PROVIDERS,
  getDefaultCloudPaths,
  detectAvailableCloudProviders,
  ensureCloudDirectory,
  validateCloudPath,
  syncWithCloud,
  createBackup,
  watchCloudDirectory,
  checkNASAvailability,
  testNASWriteAccess,
  NASStorage,
  OneDriveStorageManager  // Neue OneDrive-Integration
};