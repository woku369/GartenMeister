/**
 * 🔄 OneDrive Sync Manager für GartenMeister
 * 
 * Erweiterte OneDrive-Integration mit lokalem Sync-Ordner
 * und behelfsmäßiger direkter API-Unterstützung
 * 
 * Features:
 * - Automatische OneDrive-Ordner-Erkennung
 * - Lokaler Sync über OneDrive-Client
 * - Fallback auf lokale Ordner
 * - Conflict Resolution
 * 
 * Version: 1.0.0
 * Datum: 11. August 2025
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * OneDrive-Konfiguration
 */
const ONEDRIVE_CONFIG = {
  enabled: true,
  
  // Automatische Pfad-Erkennung
  detectionPaths: [
    path.join(os.homedir(), 'OneDrive'),
    path.join(os.homedir(), 'OneDrive - Personal'), 
    path.join(os.homedir(), 'OneDrive - Privat'),
    path.join(process.env.ONEDRIVE || '', ''), // Umgebungsvariable
    'C:\\Users\\' + os.userInfo().username + '\\OneDrive'
  ],
  
  // Sync-Pfade
  paths: {
    base: '',  // Wird automatisch erkannt
    gartenmeister: '',  // base + 'GartenMeister'
    data: '',  // gartenmeister + 'data'
    backups: '',  // gartenmeister + 'backups'
    exports: ''  // gartenmeister + 'exports'
  },
  
  // Erweiterte Einstellungen
  settings: {
    autoDetectOneDrive: true,
    createFoldersIfMissing: true,
    enableConflictResolution: true,
    syncIntervalMinutes: 10,
    maxBackupFiles: 10
  }
};

/**
 * OneDrive Storage Manager
 */
class OneDriveStorage {
  constructor() {
    this.isInitialized = false;
    this.isConnected = false;
    this.detectedPath = null;
    
    this.initialize();
  }
  
  /**
   * Initialisierung und OneDrive-Erkennung
   */
  async initialize() {
    try {
      console.log('[OneDrive] Initialisiere OneDrive-Integration...');
      
      // OneDrive-Ordner automatisch erkennen
      const detectedPath = this.detectOneDrivePath();
      
      if (detectedPath) {
        this.detectedPath = detectedPath;
        ONEDRIVE_CONFIG.paths.base = detectedPath;
        ONEDRIVE_CONFIG.paths.gartenmeister = path.join(detectedPath, 'GartenMeister');
        ONEDRIVE_CONFIG.paths.data = path.join(detectedPath, 'GartenMeister', 'data');
        ONEDRIVE_CONFIG.paths.backups = path.join(detectedPath, 'GartenMeister', 'backups');
        ONEDRIVE_CONFIG.paths.exports = path.join(detectedPath, 'GartenMeister', 'exports');
        
        // Ordnerstruktur erstellen
        this.ensureDirectoryStructure();
        
        this.isConnected = true;
        this.isInitialized = true;
        
        console.log('[OneDrive] ✅ OneDrive erfolgreich initialisiert:', detectedPath);
        return true;
      } else {
        console.warn('[OneDrive] ⚠️ OneDrive-Ordner nicht gefunden - Fallback auf lokalen Ordner');
        this.setupFallbackPath();
        return false;
      }
      
    } catch (error) {
      console.error('[OneDrive] ❌ Initialisierung fehlgeschlagen:', error);
      this.setupFallbackPath();
      return false;
    }
  }
  
  /**
   * OneDrive-Pfad automatisch erkennen
   */
  detectOneDrivePath() {
    console.log('[OneDrive] 🔍 Suche OneDrive-Ordner...');
    
    for (const testPath of ONEDRIVE_CONFIG.detectionPaths) {
      if (testPath && fs.existsSync(testPath)) {
        try {
          // Prüfe Schreibberechtigung
          const testFile = path.join(testPath, '.gartenmeister-test');
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
          
          console.log('[OneDrive] ✅ OneDrive-Ordner gefunden:', testPath);
          return testPath;
        } catch (error) {
          console.warn('[OneDrive] ⚠️ OneDrive-Ordner ohne Schreibberechtigung:', testPath);
        }
      }
    }
    
    return null;
  }
  
  /**
   * Fallback auf lokalen Ordner
   */
  setupFallbackPath() {
    const fallbackPath = path.join(os.homedir(), 'Documents', 'GartenMeister-OneDrive');
    
    ONEDRIVE_CONFIG.paths.base = fallbackPath;
    ONEDRIVE_CONFIG.paths.gartenmeister = fallbackPath;
    ONEDRIVE_CONFIG.paths.data = path.join(fallbackPath, 'data');
    ONEDRIVE_CONFIG.paths.backups = path.join(fallbackPath, 'backups');
    ONEDRIVE_CONFIG.paths.exports = path.join(fallbackPath, 'exports');
    
    this.ensureDirectoryStructure();
    this.isConnected = true;
    this.isInitialized = true;
    
    console.log('[OneDrive] 📁 Fallback-Ordner erstellt:', fallbackPath);
  }
  
  /**
   * Ordnerstruktur erstellen
   */
  ensureDirectoryStructure() {
    const dirsToCreate = [
      ONEDRIVE_CONFIG.paths.gartenmeister,
      ONEDRIVE_CONFIG.paths.data,
      ONEDRIVE_CONFIG.paths.backups,
      ONEDRIVE_CONFIG.paths.exports
    ];
    
    dirsToCreate.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log('[OneDrive] 📁 Ordner erstellt:', dir);
      }
    });
  }
  
  /**
   * Verbindung prüfen
   */
  async checkConnection() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      const testFile = path.join(ONEDRIVE_CONFIG.paths.data, '.connection-test');
      fs.writeFileSync(testFile, new Date().toISOString());
      fs.unlinkSync(testFile);
      
      return true;
    } catch (error) {
      console.error('[OneDrive] Verbindungstest fehlgeschlagen:', error);
      return false;
    }
  }
  
  /**
   * App-Daten in OneDrive speichern
   */
  async saveAppData(appData) {
    try {
      if (!this.isConnected) {
        const connected = await this.checkConnection();
        if (!connected) {
          throw new Error('OneDrive nicht verfügbar');
        }
      }
      
      // Backup erstellen
      this.createBackup();
      
      // Daten speichern
      const dataFile = path.join(ONEDRIVE_CONFIG.paths.data, 'app-data.json');
      const dataWithMetadata = {
        ...appData,
        lastModified: new Date().toISOString(),
        syncSource: 'onedrive',
        deviceId: this.getDeviceId()
      };
      
      fs.writeFileSync(dataFile, JSON.stringify(dataWithMetadata, null, 2));
      
      console.log('[OneDrive] ✅ App-Daten in OneDrive gespeichert');
      return true;
      
    } catch (error) {
      console.error('[OneDrive] ❌ Fehler beim Speichern:', error);
      return false;
    }
  }
  
  /**
   * App-Daten aus OneDrive laden
   */
  async loadAppData() {
    try {
      if (!this.isConnected) {
        const connected = await this.checkConnection();
        if (!connected) {
          return null;
        }
      }
      
      const dataFile = path.join(ONEDRIVE_CONFIG.paths.data, 'app-data.json');
      
      if (!fs.existsSync(dataFile)) {
        console.log('[OneDrive] 📂 Keine OneDrive-Daten gefunden');
        return null;
      }
      
      const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      console.log('[OneDrive] ✅ App-Daten aus OneDrive geladen');
      
      return data;
      
    } catch (error) {
      console.error('[OneDrive] ❌ Fehler beim Laden:', error);
      return null;
    }
  }
  
  /**
   * Synchronisation mit lokalen Daten
   */
  async syncAppData(localData) {
    try {
      console.log('[OneDrive] 🔄 Starte OneDrive-Synchronisation...');
      
      const oneDriveData = await this.loadAppData();
      
      if (!oneDriveData) {
        // Keine OneDrive-Daten - Upload der lokalen Daten
        const uploaded = await this.saveAppData(localData);
        return {
          success: uploaded,
          action: 'upload',
          message: 'Lokale Daten in OneDrive hochgeladen'
        };
      }
      
      // Vergleiche Zeitstempel für Konfliktlösung
      const localTimestamp = new Date(localData.lastModified || 0);
      const oneDriveTimestamp = new Date(oneDriveData.lastModified || 0);
      
      if (oneDriveTimestamp > localTimestamp) {
        // OneDrive ist neuer - Download
        console.log('[OneDrive] ⬇️ OneDrive-Daten sind neuer, lade herunter...');
        return {
          success: true,
          action: 'download',
          data: oneDriveData,
          message: 'Neuere OneDrive-Daten heruntergeladen'
        };
      } else if (localTimestamp > oneDriveTimestamp) {
        // Lokale Daten sind neuer - Upload
        console.log('[OneDrive] ⬆️ Lokale Daten sind neuer, lade hoch...');
        const uploaded = await this.saveAppData(localData);
        return {
          success: uploaded,
          action: 'upload',
          message: 'Neuere lokale Daten in OneDrive hochgeladen'
        };
      } else {
        // Dateien sind synchron
        return {
          success: true,
          action: 'sync',
          message: 'Daten sind bereits synchron'
        };
      }
      
    } catch (error) {
      console.error('[OneDrive] ❌ Sync-Fehler:', error);
      return {
        success: false,
        message: 'OneDrive-Synchronisation fehlgeschlagen: ' + error.message
      };
    }
  }
  
  /**
   * Backup erstellen
   */
  createBackup() {
    try {
      const dataFile = path.join(ONEDRIVE_CONFIG.paths.data, 'app-data.json');
      
      if (fs.existsSync(dataFile)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(ONEDRIVE_CONFIG.paths.backups, `app-data-backup-${timestamp}.json`);
        
        fs.copyFileSync(dataFile, backupFile);
        
        // Alte Backups löschen (nur die neuesten behalten)
        this.cleanupOldBackups();
        
        console.log('[OneDrive] 💾 Backup erstellt:', backupFile);
      }
    } catch (error) {
      console.warn('[OneDrive] ⚠️ Backup-Fehler:', error);
    }
  }
  
  /**
   * Alte Backups aufräumen
   */
  cleanupOldBackups() {
    try {
      const backupDir = ONEDRIVE_CONFIG.paths.backups;
      const files = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('app-data-backup-') && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(backupDir, file),
          mtime: fs.statSync(path.join(backupDir, file)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime);
      
      // Nur die neuesten X Backups behalten
      const maxBackups = ONEDRIVE_CONFIG.settings.maxBackupFiles;
      if (files.length > maxBackups) {
        const filesToDelete = files.slice(maxBackups);
        filesToDelete.forEach(file => {
          fs.unlinkSync(file.path);
          console.log('[OneDrive] 🗑️ Altes Backup gelöscht:', file.name);
        });
      }
    } catch (error) {
      console.warn('[OneDrive] ⚠️ Backup-Cleanup-Fehler:', error);
    }
  }
  
  /**
   * Lade verfügbare Backup-Dateien aus OneDrive
   */
  async listBackupFiles() {
    try {
      console.log('[OneDrive] Suche nach Backup-Dateien...');
      
      const backupLocations = [];
      
      // 1. OneDrive Backup-Ordner (falls initialisiert)
      if (this.isConnected && ONEDRIVE_CONFIG.paths.backups) {
        backupLocations.push({
          path: ONEDRIVE_CONFIG.paths.backups,
          label: 'OneDrive'
        });
      }
      
      // 2. Lokaler Backup-Ordner (Standard-Backups der App)
      const os = require('os');
      const { app } = require('electron');
      const userDataPath = app.getPath('userData');
      const localBackupDir = path.join(userDataPath, 'backups');
      backupLocations.push({
        path: localBackupDir,
        label: 'Lokal'
      });
      
      // 3. Auch in data-Ordner suchen (falls dort Backups liegen)
      const localDataDir = path.join(userDataPath, 'data');
      backupLocations.push({
        path: localDataDir,
        label: 'Lokale Daten'
      });
      
      const allBackups = [];
      
      // Alle Backup-Orte durchsuchen
      for (const location of backupLocations) {
        if (fs.existsSync(location.path)) {
          console.log(`[OneDrive] Suche in ${location.label}: ${location.path}`);
          
          const files = fs.readdirSync(location.path)
            .filter(file => file.endsWith('.json') && (file.includes('backup') || file.includes('gartenmeister')))
            .map(file => {
              const filePath = path.join(location.path, file);
              const stats = fs.statSync(filePath);
              return {
                fileName: file,
                fullPath: filePath,
                modifiedDate: stats.mtime.toISOString(),
                size: stats.size,
                isBackup: file.includes('backup'),
                location: location.label
              };
            });
          
          allBackups.push(...files);
          console.log(`[OneDrive] ${location.label}: ${files.length} Backup-Dateien gefunden`);
        } else {
          console.log(`[OneDrive] ${location.label}: Ordner existiert nicht: ${location.path}`);
        }
      }
      
      // Nach Datum sortieren (neueste zuerst)
      const sortedBackups = allBackups.sort((a, b) => new Date(b.modifiedDate) - new Date(a.modifiedDate));
      
      console.log(`[OneDrive] Insgesamt ${sortedBackups.length} Backup-Dateien gefunden`);
      return sortedBackups;
      
    } catch (error) {
      console.error('[OneDrive] Fehler beim Auflisten von Backups:', error);
      return [];
    }
  }
  
  /**
   * Backup-Datei als Anfangsbestand übernehmen
   */
  async restoreFromBackup(backupFilePath) {
    try {
      console.log('[OneDrive] Stelle Daten aus Backup wieder her:', backupFilePath);
      
      if (!fs.existsSync(backupFilePath)) {
        throw new Error('Backup-Datei nicht gefunden: ' + backupFilePath);
      }
      
      // Backup-Daten laden
      const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
      
      // Validiere Backup-Daten
      if (!backupData || typeof backupData !== 'object') {
        throw new Error('Ungültige Backup-Daten');
      }
      
      // Aktuelles Backup der bestehenden Daten erstellen
      this.createBackup();
      
      // Backup-Daten als neue App-Daten speichern
      const restoredData = {
        ...backupData,
        lastModified: new Date().toISOString(),
        syncSource: 'onedrive-backup-restore',
        deviceId: this.getDeviceId(),
        restoredFrom: {
          backupFile: path.basename(backupFilePath),
          restoredAt: new Date().toISOString()
        }
      };
      
      const success = await this.saveAppData(restoredData);
      
      if (success) {
        console.log('[OneDrive] ✅ Backup erfolgreich als Anfangsbestand übernommen');
        return {
          success: true,
          data: restoredData,
          message: `Backup erfolgreich wiederhergestellt: ${path.basename(backupFilePath)}`
        };
      } else {
        throw new Error('Fehler beim Speichern der wiederhergestellten Daten');
      }
      
    } catch (error) {
      console.error('[OneDrive] ❌ Fehler beim Wiederherstellen:', error);
      return {
        success: false,
        message: 'Backup-Wiederherstellung fehlgeschlagen: ' + error.message
      };
    }
  }
  
  /**
   * OneDrive-Pfad manuell setzen
   */
  setCustomOneDrivePath(customPath) {
    try {
      console.log('[OneDrive] Setze benutzerdefinierten OneDrive-Pfad:', customPath);
      
      // Pfad validieren
      if (!customPath || !path.isAbsolute(customPath)) {
        throw new Error('Ungültiger Pfad: Muss ein absoluter Pfad sein');
      }
      
      if (!fs.existsSync(customPath)) {
        throw new Error('Pfad existiert nicht: ' + customPath);
      }
      
      // Schreibberechtigung testen
      const testFile = path.join(customPath, '.gartenmeister-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      
      // Pfade aktualisieren
      this.detectedPath = customPath;
      ONEDRIVE_CONFIG.paths.base = customPath;
      ONEDRIVE_CONFIG.paths.gartenmeister = path.join(customPath, 'GartenMeister');
      ONEDRIVE_CONFIG.paths.data = path.join(customPath, 'GartenMeister', 'data');
      ONEDRIVE_CONFIG.paths.backups = path.join(customPath, 'GartenMeister', 'backups');
      ONEDRIVE_CONFIG.paths.exports = path.join(customPath, 'GartenMeister', 'exports');
      
      // Ordnerstruktur erstellen
      this.ensureDirectoryStructure();
      
      this.isConnected = true;
      this.isInitialized = true;
      
      console.log('[OneDrive] ✅ Benutzerdefinierter OneDrive-Pfad erfolgreich gesetzt');
      return {
        success: true,
        message: 'OneDrive-Pfad erfolgreich aktualisiert',
        paths: ONEDRIVE_CONFIG.paths
      };
      
    } catch (error) {
      console.error('[OneDrive] ❌ Fehler beim Setzen des benutzerdefinierten Pfads:', error);
      return {
        success: false,
        message: 'Pfad konnte nicht gesetzt werden: ' + error.message
      };
    }
  }
  
  /**
   * Geräte-ID generieren
   */
  getDeviceId() {
    try {
      return `${os.hostname()}-${os.userInfo().username}`;
    } catch (error) {
      return 'unknown-device';
    }
  }
  
  /**
   * OneDrive-Status abrufen
   */
  async getStatus() {
    const isConnected = await this.checkConnection();
    const hasAppData = fs.existsSync(path.join(ONEDRIVE_CONFIG.paths.data, 'app-data.json'));
    
    return {
      connected: isConnected,
      oneDrivePath: this.detectedPath || 'Fallback-Ordner',
      gartenmeisterPath: ONEDRIVE_CONFIG.paths.gartenmeister,
      hasAppData,
      isRealOneDrive: !!this.detectedPath,
      lastCheck: new Date().toISOString()
    };
  }
  
  /**
   * Datei-Export nach OneDrive
   */
  async exportFile(fileName, content) {
    try {
      const filePath = path.join(ONEDRIVE_CONFIG.paths.exports, fileName);
      fs.writeFileSync(filePath, content);
      
      console.log('[OneDrive] 📤 Datei exportiert:', fileName);
      return {
        success: true,
        filePath,
        message: `Datei erfolgreich nach OneDrive exportiert: ${fileName}`
      };
    } catch (error) {
      console.error('[OneDrive] ❌ Export-Fehler:', error);
      return {
        success: false,
        message: 'Export nach OneDrive fehlgeschlagen: ' + error.message
      };
    }
  }
  /**
   * Aktuelle OneDrive-Konfiguration abrufen
   */
  getConfiguration() {
    try {
      return {
        isInitialized: this.isInitialized,
        isConnected: this.isConnected,
        detectedPath: this.detectedPath,
        oneDrivePath: this.detectedPath,
        gartenmeisterPath: ONEDRIVE_CONFIG.paths.gartenmeister,
        customPath: this.customPath,
        lastSync: this.lastSync,
        error: this.lastError,
        paths: {
          data: ONEDRIVE_CONFIG.paths.data,
          backups: ONEDRIVE_CONFIG.paths.backups,
          exports: ONEDRIVE_CONFIG.paths.exports
        },
        settings: ONEDRIVE_CONFIG.settings
      };
    } catch (error) {
      console.error('[OneDriveStorage] Fehler beim Abrufen der Konfiguration:', error);
      return {
        isInitialized: false,
        isConnected: false,
        error: error.message
      };
    }
  }
}

// Singleton-Instanz
let oneDriveInstance = null;

/**
 * OneDrive-Instanz abrufen
 */
const getOneDriveStorage = () => {
  if (!oneDriveInstance) {
    oneDriveInstance = new OneDriveStorage();
  }
  return oneDriveInstance;
};

module.exports = {
  OneDriveStorage,
  getOneDriveStorage,
  ONEDRIVE_CONFIG
};
