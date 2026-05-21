// Verbesserter Datenspeicherungsmechanismus für Electron-basierte Persistenz
// Diese Datei ergänzt die bestehende Electron-Bridge um Funktionen zur Datenspeicherung

import type { GartenConfiguration, Bed, HerbVariety, KombinationsbeetSegment, HarvestEvent, HarvestContribution } from './definitions';
import { electronAPI } from './electron-bridge';
import { toast } from '@/hooks/use-toast';
import { RemoteNASStorage } from '@/utils/synology-remote-access';

// Remote NAS Manager für erweiterte Funktionalität
const RemoteNASManager = typeof window !== 'undefined' ? null : require('./remote-nas-manager.js');

// Data Initialization Manager für sichere Dateninitialisierung
const DataInitializationManager = typeof window !== 'undefined' ? null : require('./data-initialization-manager.js');

// Simpleres Interface für das Speichern, ohne globalen Store zu importieren
interface SaveAppData {
  beds: Bed[];
  herbVarieties: HerbVariety[];
  segments: KombinationsbeetSegment[];
  harvestEvents: HarvestEvent[];
  harvestContributions: HarvestContribution[];
  gartenConfiguration: GartenConfiguration;
}

// Interface für das Laden - ermöglicht teilweise Daten
interface AppGlobalStore {
  beds?: Bed[];
  herbVarieties?: HerbVariety[];
  segments?: KombinationsbeetSegment[];
  harvestEvents?: HarvestEvent[];
  harvestContributions?: HarvestContribution[];
  gartenConfiguration?: GartenConfiguration;
}

// Dateinamen für persistente Speicherung
const APP_DATA_FILE = 'app-data.json';
const WEATHER_DATA_FILE = 'weather-data.json';

/**
 * Lädt Daten aus einer lokalen Datei im Electron-Kontext
 * @param filename Der Dateiname, aus dem geladen werden soll
 * @returns Die geladenen Daten oder null bei einem Fehler
 */
export async function loadLocalData<T>(filename: string): Promise<T | null> {
  // Prüfe ob wir im Server-Kontext sind (Next.js API Route)
  if (typeof window === 'undefined') {
    console.warn('[storage-manager] Server-Side-Umgebung erkannt, überspringe Dateizugriff');
    return null;
  }
  
  if (!electronAPI.isElectron()) {
    console.warn('Dateizugriff nur in Electron-Umgebung möglich');
    return null;
  }
  try {
    // Verwende die Funktionen aus der electronAPI statt direktem Zugriff auf window.electronAPI
    const filePath = await electronAPI.getDataFilePath(filename);
    if (!filePath) return null;

    const fileExists = await electronAPI.fileExists(filePath);
    if (!fileExists) return null;

    const data = await electronAPI.readJsonFile<T>(filePath);
    
    // Überprüfung, ob die Daten gültig sind
    if (data === undefined || data === null) {
      console.warn(`Warnung: Keine gültigen Daten in ${filename} gefunden.`);
      return null;
    }
    
    // Versuche, die Daten zu validieren, falls möglich
    if (typeof data === 'object') {
      console.log(`[storage-manager] Daten aus ${filename} erfolgreich geladen.`);
    }
    
    return data;
  } catch (error) {
    console.error(`Fehler beim Laden von ${filename}:`, error);
    return null;
  }
}

/**
 * Speichert Daten in einer lokalen Datei im Electron-Kontext
 * @param filename Der Dateiname, in den gespeichert werden soll
 * @param data Die zu speichernden Daten
 * @returns true bei Erfolg, false bei einem Fehler
 */
export async function saveLocalData<T>(filename: string, data: T): Promise<boolean> {
  // Prüfe ob wir im Server-Kontext sind (Next.js API Route)
  if (typeof window === 'undefined') {
    console.warn('[storage-manager] Server-Side-Umgebung erkannt, überspringe Dateizugriff');
    return false;
  }
  
  if (!electronAPI.isElectron()) {
    console.warn('Dateizugriff nur in Electron-Umgebung möglich');
    return false;
  }

  // Überprüfung auf ungültige Daten
  if (data === undefined || data === null) {
    console.error(`Fehler: Es wurde versucht, ungültige Daten in ${filename} zu speichern.`);
    toast({
      title: "Fehler beim Speichern",
      description: `Es wurden ungültige Daten für ${filename} übergeben.`,
      variant: "destructive"
    });
    return false;
  }

  try {
    const filePath = await electronAPI.getDataFilePath(filename);
    if (!filePath) return false;

    // Versuche, die Daten vor dem Speichern zu validieren
    try {
      JSON.stringify(data);
    } catch (jsonError) {
      console.error(`Fehler: Die zu speichernden Daten können nicht in JSON umgewandelt werden:`, jsonError);
      toast({
        title: "Fehler beim Speichern",
        description: `Die Daten für ${filename} sind nicht JSON-serialisierbar.`,
        variant: "destructive"
      });
      return false;
    }

    const success = await electronAPI.writeJsonFile(filePath, data);
    if (success) {
      console.log(`[storage-manager] Daten in ${filename} erfolgreich gespeichert.`);
    }
    return !!success;
  } catch (error) {
    console.error(`Fehler beim Speichern von ${filename}:`, error);
    toast({
      title: "Fehler beim Speichern",
      description: `Die Daten konnten nicht in ${filename} gespeichert werden.`,
      variant: "destructive"
    });
    return false;
  }
}

/**
 * Lädt alle Anwendungsdaten aus der lokalen Datei oder Remote-NAS
 * @returns Die geladenen Daten oder ein leeres Objekt bei einem Fehler
 */
export async function loadAllAppData(): Promise<AppGlobalStore> {
  try {
    console.log('[storage-manager] 🔄 Lade App-Daten...');
    
    // Versuche zuerst Remote-NAS-Daten zu laden
    let remoteData = null;
    try {
      if (RemoteNASManager) {
        const remoteNAS = new RemoteNASManager();
        const connection = await remoteNAS.checkConnection();
        
        if (connection.activeConnection) {
          console.log(`[storage-manager] 🌐 Remote-NAS verfügbar: ${connection.activeConnection}`);
          remoteData = await remoteNAS.loadFile('data/app-data.json');
          
          if (remoteData) {
            remoteData = JSON.parse(remoteData);
            console.log('[storage-manager] 📡 Remote-NAS-Daten geladen');
          }
        }
      }
    } catch (remoteError) {
      console.log('[storage-manager] ⚠️ Remote-NAS nicht verfügbar:', remoteError.message);
    }
    
    // Lade lokale Daten als Fallback
    const localData = await loadLocalData<AppGlobalStore>(APP_DATA_FILE);
    
    // Legacy NAS-Unterstützung (falls RemoteNAS nicht verfügbar)
    let nasData = null;
    try {
      if (typeof window !== 'undefined' && RemoteNASStorage) {
        const remoteStorage = new RemoteNASStorage();
        const nasStatus = await remoteStorage.getStatus();
        
        if (nasStatus.connected) {
          nasData = await remoteStorage.loadAppData();
          if (nasData) {
            console.log('[storage-manager] 📡 Legacy NAS-Daten geladen');
          }
        }
      }
    } catch (nasError) {
      console.log('[storage-manager] ⚠️ Legacy NAS nicht verfügbar:', nasError.message);
    }
    
    // Priorisierung: Remote-NAS > Legacy NAS > Lokale Daten
    if (remoteData) {
      console.log('[storage-manager] 🌐 Verwende Remote-NAS-Daten');
      // Speichere Remote-Daten auch lokal
      await saveLocalData(APP_DATA_FILE, remoteData);
      return remoteData;
    } else if (nasData && localData) {
      // Vergleiche Timestamps zwischen Legacy NAS und lokalen Daten
      const nasTimestamp = new Date(nasData.lastModified || 0);
      const localTimestamp = new Date(localData.lastModified || 0);
      
      if (nasTimestamp > localTimestamp) {
        console.log('[storage-manager] 🔄 Legacy NAS-Daten sind neuer - verwende NAS-Daten');
        // Speichere NAS-Daten auch lokal
        await saveLocalData(APP_DATA_FILE, nasData);
        return nasData;
      } else {
        console.log('[storage-manager] 📱 Lokale Daten sind aktuell');
        return localData;
      }
    } else if (nasData) {
      console.log('[storage-manager] 📥 Nur Legacy NAS-Daten verfügbar');
      // Speichere NAS-Daten auch lokal
      await saveLocalData(APP_DATA_FILE, nasData);
      return nasData;
    } else {
      console.log('[storage-manager] 💾 Verwende lokale Daten');
      return localData || {};
    }
  } catch (error) {
    console.error('[storage-manager] Fehler beim Laden von app-data.json:', error);
    return {};
  }
}

/**
 * Speichert alle Anwendungsdaten in einer lokalen Datei
 * @param data Die zu speichernden Daten
 * @returns true bei Erfolg, false bei einem Fehler
 */
export async function saveAllAppData(data: SaveAppData): Promise<boolean> {
  // Prüfe ob wir im Server-Kontext sind (Next.js API Route)
  if (typeof window === 'undefined') {
    console.warn('[storage-manager] Server-Side-Umgebung erkannt, überspringe Dateizugriff');
    return false;
  }
  
  if (!electronAPI.isElectron()) {
    console.warn('Dateizugriff nur in Electron-Umgebung möglich');
    return false;
  }

  try {
    const dataWithTimestamp = {
      ...data,
      lastModified: new Date().toISOString(),
      version: '1.0.0'
    };

    console.log('[storage-manager] 💾 Speichere App-Daten...');
    const localSuccess = await saveLocalData(APP_DATA_FILE, dataWithTimestamp);

    // Versuche Remote-NAS-Sync
    try {
      if (RemoteNASManager) {
        const remoteNAS = new RemoteNASManager();
        const connection = await remoteNAS.checkConnection();
        
        if (connection.activeConnection) {
          console.log(`[storage-manager] 🌐 Synchronisiere mit Remote-NAS: ${connection.activeConnection}`);
          const syncResult = await remoteNAS.saveFile('data/app-data.json', JSON.stringify(dataWithTimestamp, null, 2));
          
          if (syncResult) {
            console.log('[storage-manager] ✅ Daten erfolgreich auf Remote-NAS gespeichert');
          } else {
            console.warn('[storage-manager] ⚠️ Remote-NAS-Synchronisation fehlgeschlagen');
          }
        }
      }
    } catch (remoteError) {
      console.warn('[storage-manager] Remote-NAS-Sync Fehler (wird ignoriert):', remoteError.message);
    }
    
    // Legacy NAS-Sync als Fallback
    try {
      if (typeof window !== 'undefined' && RemoteNASStorage) {
        const nas = new RemoteNASStorage();
        const nasStatus = await nas.getStatus();
        
        if (nasStatus.connected) {
          console.log('[storage-manager] Synchronisiere mit Legacy NAS...');
          const syncResult = await nas.saveAppData(dataWithTimestamp);
          if (syncResult) {
            console.log('[storage-manager] ✅ Daten erfolgreich auf Legacy NAS gespeichert');
          } else {
            console.warn('[storage-manager] ⚠️ Legacy NAS-Synchronisation fehlgeschlagen');
          }
        }
      }
    } catch (nasError) {
      console.warn('[storage-manager] Legacy NAS-Sync Fehler (wird ignoriert):', nasError.message);
    }
    
    return localSuccess;
  } catch (error) {
    console.error('[storage-manager] Fehler beim Speichern von app-data.json:', error);
    return false;
  }
}

/**
 * Erstellt ein Backup aller Anwendungsdaten mit Zeitstempel
 */
export async function createDataBackup(): Promise<boolean> {
  // Prüfe ob wir im Server-Kontext sind (Next.js API Route)
  if (typeof window === 'undefined') {
    console.warn('[storage-manager] Server-Side-Umgebung erkannt, überspringe Backup');
    return false;
  }
  
  if (!electronAPI.isElectron()) return false;
  
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupPath = await electronAPI.createBackupFolder(timestamp);
    if (!backupPath) return false;
    
    const backupSuccess = await electronAPI.backupDataFiles(backupPath);
    
    if (backupSuccess) {
      toast({
        title: "Backup erstellt",
        description: `Alle Daten wurden erfolgreich gesichert (${timestamp}).`,
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('[storage-manager] Fehler beim Erstellen des Backups:', error);
    return false;
  }
}

/**
 * Wetterdaten-spezifische Funktionen
 */

export async function loadWeatherData(): Promise<import('./definitions').WeatherDataPoint[] | null> {
  const data = await loadLocalData<import('./definitions').WeatherDataPoint[]>(WEATHER_DATA_FILE);
  return data || [];
}

export async function saveWeatherData(weatherData: import('./definitions').WeatherDataPoint[]): Promise<boolean> {
  return await saveLocalData(WEATHER_DATA_FILE, weatherData);
}

export async function addWeatherDataPoint(dataPoint: import('./definitions').WeatherDataPoint): Promise<boolean> {
  const existingData = await loadWeatherData() || [];
  
  // Verhindere Duplikate basierend auf Zeitstempel (gleiche Stunde)
  const hour = new Date(dataPoint.timestamp).setMinutes(0, 0, 0);
  const existingIndex = existingData.findIndex(point => {
    const existingHour = new Date(point.timestamp).setMinutes(0, 0, 0);
    return existingHour === hour;
  });
  
  if (existingIndex >= 0) {
    // Überschreibe existierenden Datenpunkt
    existingData[existingIndex] = dataPoint;
  } else {
    // Füge neuen Datenpunkt hinzu
    existingData.push(dataPoint);
  }
  
  // Sortiere nach Zeitstempel (neueste zuerst)
  existingData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  // Begrenze auf maximal 10000 Datenpunkte (etwa 1 Jahr bei stündlichen Messungen)
  if (existingData.length > 10000) {
    existingData.splice(10000);
  }
  
  return await saveWeatherData(existingData);
}

/**
 * Gibt den aktuellen NAS-Status zurück
 */
export async function getNASStatus(): Promise<{
  available: boolean;
  connected: boolean;
  hasData: boolean;
  lastSync?: string;
  error?: string;
}> {
  try {
    const nas = await initializeNASStorage();
    if (!nas) {
      return {
        available: false,
        connected: false,
        hasData: false,
        error: 'NAS-Storage nicht verfügbar'
      };
    }
    
    const status = await nas.getStatus();
    return {
      available: true,
      connected: status.connected,
      hasData: status.hasAppData,
      lastSync: status.lastCheck
    };
  } catch (error) {
    return {
      available: false,
      connected: false,
      hasData: false,
      error: error.message
    };
  }
}

/**
 * Erzwingt eine manuelle Synchronisation mit der NAS
 */
export async function forceSyncWithNAS(): Promise<{
  success: boolean;
  action: string;
  message: string;
}> {
  try {
    const nas = await initializeNASStorage();
    if (!nas) {
      return {
        success: false,
        action: 'none',
        message: 'NAS-Storage nicht verfügbar'
      };
    }
    
    // Lade lokale Daten
    const localData = await loadLocalData<Partial<AppGlobalStore>>(APP_DATA_FILE);
    if (!localData) {
      return {
        success: false,
        action: 'none',
        message: 'Keine lokalen Daten zum Synchronisieren'
      };
    }
    
    // Führe Synchronisation durch
    const syncResult = await nas.syncAppData(localData);
    
    if (syncResult.success && syncResult.action === 'download') {
      // NAS-Daten sind neuer - aktualisiere lokale Daten
      await saveLocalData(APP_DATA_FILE, syncResult.data);
    }
    
    return {
      success: syncResult.success,
      action: syncResult.action,
      message: syncResult.message || 'Synchronisation abgeschlossen'
    };
  } catch (error) {
    return {
      success: false,
      action: 'error',
      message: error.message
    };
  }
}

// NAS-Integration für automatische Synchronisation
let NASStorage: any = null;

// Dynamischer Import für NAS-Storage (Server- und Client-kompatibel)
async function initializeNASStorage() {
  if (!NASStorage) {
    try {
      // Server-seitig (Next.js API-Routes)
      if (typeof window === 'undefined') {
        try {
          const cloudStorage = require('../utils/cloud-storage.js');
          NASStorage = cloudStorage.NASStorage;
          console.log('[StorageManager] NAS-Storage initialisiert (Server)');
        } catch (error) {
          console.warn('[StorageManager] NAS-Storage konnte nicht geladen werden (Server):', error.message);
          NASStorage = null;
        }
      } 
      // Client-seitig (Electron)
      else if (window.require) {
        const cloudStorage = window.require('../../utils/cloud-storage.js');
        NASStorage = cloudStorage.NASStorage;
        console.log('[StorageManager] NAS-Storage initialisiert (Client)');
      }
    } catch (error) {
      console.warn('[StorageManager] NAS-Storage nicht verfügbar:', error.message);
    }
  }
  return NASStorage;
}

/**
 * Remote-NAS-Konfiguration aus den Einstellungen laden
 */
const getRemoteNASConfig = () => {
  try {
    const saved = localStorage.getItem('remoteNASConfig');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('Fehler beim Laden der Remote-NAS-Konfiguration:', error);
  }
  return null;
};

/**
 * Storage-Manager-Klasse mit Remote-NAS-Unterstützung
 */
class StorageManager {
  private remoteNAS: RemoteNASStorage | null = null;
  private remoteNASConnected = false;

  /**
   * Versucht Remote-NAS-Verbindung herzustellen
   */
  private async connectRemoteNAS(): Promise<boolean> {
    try {
      const config = getRemoteNASConfig();
      if (!config || !config.auth?.username || !config.auth?.password) {
        console.log('[StorageManager] Keine Remote-NAS-Konfiguration verfügbar');
        return false;
      }

      if (!this.remoteNAS) {
        this.remoteNAS = new RemoteNASStorage();
      }

      const connected = await this.remoteNAS.connect(
        config.auth.username,
        config.auth.password
      );

      this.remoteNASConnected = connected;
      
      if (connected) {
        console.log('[StorageManager] Remote-NAS erfolgreich verbunden');
      } else {
        console.warn('[StorageManager] Remote-NAS-Verbindung fehlgeschlagen');
      }

      return connected;
    } catch (error) {
      console.error('[StorageManager] Remote-NAS-Verbindung Fehler:', error);
      this.remoteNASConnected = false;
      return false;
    }
  }

  /**
   * Lädt App-Daten mit Remote-NAS-Fallback
   */
  async loadAllAppData(): Promise<AppData> {
    try {
      // 1. Versuche lokales NAS (G: Laufwerk)
      if (this.isNASEnabled()) {
        const { NASStorage } = await import('@/utils/cloud-storage');
        const nasData = await NASStorage.loadAppData();
        if (nasData) {
          console.log('[StorageManager] Daten von lokalem NAS geladen');
          return nasData;
        }
      }

      // 2. Versuche Remote-NAS
      if (await this.connectRemoteNAS() && this.remoteNAS) {
        const remoteData = await this.remoteNAS.loadAppData();
        if (remoteData) {
          console.log('[StorageManager] Daten von Remote-NAS geladen');
          return remoteData;
        }
      }

      // 3. Fallback auf lokale Daten
      console.log('[StorageManager] Fallback auf lokale Daten');
      return this.loadLocalAppData();
    } catch (error) {
      console.error('[StorageManager] Fehler beim Laden der App-Daten:', error);
      return this.loadLocalAppData();
    }
  }

  /**
   * Speichert App-Daten mit Remote-NAS-Sync
   */
  async saveAllAppData(data: AppData): Promise<boolean> {
    try {
      // 1. Lokale Daten immer speichern
      const localSaved = await this.saveLocalAppData(data);

      // 2. Versuche lokales NAS
      let nasSaved = false;
      if (this.isNASEnabled()) {
        try {
          const { NASStorage } = await import('@/utils/cloud-storage');
          nasSaved = await NASStorage.saveAppData(data);
          if (nasSaved) {
            console.log('[StorageManager] Daten auf lokalem NAS gespeichert');
          }
        } catch (error) {
          console.warn('[StorageManager] Lokales NAS-Speichern fehlgeschlagen:', error);
        }
      }

      // 3. Versuche Remote-NAS als Backup
      if (!nasSaved && (this.remoteNASConnected || await this.connectRemoteNAS())) {
        try {
          if (this.remoteNAS) {
            const remoteSaved = await this.remoteNAS.saveAppData(data);
            if (remoteSaved) {
              console.log('[StorageManager] Daten auf Remote-NAS gespeichert');
              nasSaved = true;
            }
          }
        } catch (error) {
          console.warn('[StorageManager] Remote-NAS-Speichern fehlgeschlagen:', error);
        }
      }

      return localSaved;
    } catch (error) {
      console.error('[StorageManager] Fehler beim Speichern der App-Daten:', error);
      return false;
    }
  }

  /**
   * Erweiterte NAS-Status-Informationen
   */
  async getNASStatus(): Promise<{
    local: any;
    remote: any;
    activeConnection: 'local' | 'remote' | 'none';
  }> {
    const status = {
      local: null,
      remote: null,
      activeConnection: 'none' as 'local' | 'remote' | 'none'
    };

    try {
      // Lokales NAS prüfen
      if (this.isNASEnabled()) {
        try {
          const { NASStorage } = await import('@/utils/cloud-storage');
          status.local = await NASStorage.getStatus();
          if (status.local?.connected) {
            status.activeConnection = 'local';
          }
        } catch (error) {
          console.warn('[StorageManager] Lokaler NAS-Status Fehler:', error);
        }
      }

      // Remote-NAS prüfen
      if (this.remoteNASConnected || await this.connectRemoteNAS()) {
        try {
          if (this.remoteNAS) {
            status.remote = await this.remoteNAS.getStatus();
            if (status.remote?.connected && status.activeConnection === 'none') {
              status.activeConnection = 'remote';
            }
          }
        } catch (error) {
          console.warn('[StorageManager] Remote-NAS-Status Fehler:', error);
        }
      }

      return status;
    } catch (error) {
      console.error('[StorageManager] NAS-Status Fehler:', error);
      return status;
    }
  }

  /**
   * Force-Sync mit bevorzugter Remote-Methode
   */
  async forceSyncWithNAS(): Promise<{ success: boolean; method: string; message: string }> {
    try {
      const localData = await this.loadLocalAppData();
      
      // 1. Versuche OneDrive-Sync (neu)
      try {
        const { OneDriveStorageManager } = await import('@/utils/cloud-storage');
        const result = await OneDriveStorageManager.syncAppData(localData);
        if (result.success) {
          // Bei OneDrive-Download: Speichere neue Daten lokal
          if (result.action === 'download' && result.data) {
            await this.saveLocalAppData(result.data);
          }
          return {
            success: true,
            method: 'OneDrive',
            message: result.message || 'OneDrive-Synchronisation erfolgreich'
          };
        }
      } catch (error) {
        console.warn('[StorageManager] OneDrive-Sync fehlgeschlagen:', error);
      }
      
      // 2. Versuche lokales NAS
      if (this.isNASEnabled()) {
        try {
          const { NASStorage } = await import('@/utils/cloud-storage');
          const result = await NASStorage.syncAppData(localData);
          if (result.success) {
            return {
              success: true,
              method: 'Local NAS',
              message: result.message || 'Lokale NAS-Synchronisation erfolgreich'
            };
          }
        } catch (error) {
          console.warn('[StorageManager] Lokaler NAS-Sync fehlgeschlagen:', error);
        }
      }

      // 3. Versuche Remote-NAS
      if (await this.connectRemoteNAS() && this.remoteNAS) {
        try {
          // Lade Remote-Daten
          const remoteData = await this.remoteNAS.loadAppData();
          
          if (!remoteData) {
            // Keine Remote-Daten - Upload der lokalen Daten
            const uploaded = await this.remoteNAS.saveAppData(localData);
            return {
              success: uploaded,
              method: 'Remote NAS',
              message: uploaded ? 'Lokale Daten auf Remote-NAS hochgeladen' : 'Upload fehlgeschlagen'
            };
          }
          
          // Vergleiche Zeitstempel
          const localTimestamp = new Date(localData.lastModified || 0);
          const remoteTimestamp = new Date(remoteData.lastModified || 0);
          
          if (remoteTimestamp > localTimestamp) {
            // Remote-Daten sind neuer - speichere sie lokal
            await this.saveLocalAppData(remoteData);
            return {
              success: true,
              method: 'Remote NAS',
              message: 'Neuere Daten von Remote-NAS geladen'
            };
          } else if (localTimestamp > remoteTimestamp) {
            // Lokale Daten sind neuer - upload auf Remote
            const uploaded = await this.remoteNAS.saveAppData(localData);
            return {
              success: uploaded,
              method: 'Remote NAS',
              message: uploaded ? 'Lokale Änderungen auf Remote-NAS gespeichert' : 'Upload fehlgeschlagen'
            };
          } else {
            return {
              success: true,
              method: 'Remote NAS',
              message: 'Daten sind bereits synchron'
            };
          }
        } catch (error) {
          console.error('[StorageManager] Remote-NAS-Sync Fehler:', error);
        }
      }

      return {
        success: false,
        method: 'None',
        message: 'Keine NAS-Verbindung verfügbar'
      };
    } catch (error) {
      console.error('[StorageManager] Force-Sync Fehler:', error);
      return {
        success: false,
        method: 'Error',
        message: 'Sync-Fehler: ' + error.message
      };
    }
  }
}

/**
 * Sichere Dateninitialisierung für neue App-Installationen
 * Lädt immer vorhandene Daten und verhindert Überschreibung
 */
export async function safeLoadAppData(): Promise<AppGlobalStore> {
  try {
    console.log('[storage-manager] 🛡️ Sichere Dateninitialisierung...');
    
    // Verwende Data Initialization Manager für sichere Initialisierung
    if (DataInitializationManager) {
      const dataInit = new DataInitializationManager();
      const initData = await dataInit.safeAppInitialization();
      
      if (initData && typeof initData === 'object') {
        console.log(`[storage-manager] ✅ Daten sicher initialisiert von: ${initData.dataSource}`);
        return initData;
      }
    }
    
    // Fallback zur normalen Ladung
    console.log('[storage-manager] ⚠️ Fallback zur Standard-Datenladung');
    return await loadAllAppData();
    
  } catch (error) {
    console.error('[storage-manager] ❌ Sichere Initialisierung fehlgeschlagen:', error);
    return await loadAllAppData();
  }
}

/**
 * Erweiterte Speicherfunktion mit Überschreibungsschutz
 * Prüft vor dem Speichern, ob Daten nicht leer sind
 */
export async function safeSaveAppData(data: SaveAppData): Promise<boolean> {
  try {
    // Validiere Daten vor dem Speichern
    if (!data || typeof data !== 'object') {
      console.error('[storage-manager] ❌ Ungültige Daten - Speicherung abgebrochen');
      return false;
    }
    
    // Prüfe ob Daten nicht leer sind
    const hasSignificantData = (
      (data.beds && data.beds.length > 0) ||
      (data.herbVarieties && data.herbVarieties.length > 0) ||
      (data.segments && data.segments.length > 0) ||
      (data.gartenConfiguration && data.gartenConfiguration.gartenName)
    );
    
    if (!hasSignificantData) {
      console.warn('[storage-manager] ⚠️ Leere Daten erkannt - prüfe auf bestehende Daten');
      
      // Lade bestehende Daten
      const existingData = await loadAllAppData();
      const hasExistingData = (
        (existingData.beds && existingData.beds.length > 0) ||
        (existingData.herbVarieties && existingData.herbVarieties.length > 0) ||
        (existingData.segments && existingData.segments.length > 0)
      );
      
      if (hasExistingData) {
        console.error('[storage-manager] 🛡️ VERHINDERE ÜBERSCHREIBUNG: Bestehende Daten gefunden, leere Daten werden NICHT gespeichert');
        toast({
          title: "Datenschutz aktiviert",
          description: "Leere Daten werden nicht über bestehende Daten gespeichert.",
          variant: "default"
        });
        return false;
      }
    }
    
    // Normale Speicherung fortsetzen
    return await saveAllAppData(data);
    
  } catch (error) {
    console.error('[storage-manager] ❌ Sichere Speicherung fehlgeschlagen:', error);
    return false;
  }
}
