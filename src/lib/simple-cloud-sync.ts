'use client';

/**
 * Einfache Cloud-Sync-Implementierung für lokale Ordner-Synchronisation
 * Diese Implementation synchronisiert Daten in einen lokalen Ordner (z.B. OneDrive, Google Drive, Dropbox)
 */

import { electronAPI } from './electron-bridge';
import { loadAllAppData, saveAllData } from './storage-manager';
import { getAppStore, loadAppStore } from './data';
import { 
  updateBeds, 
  updateHerbVarieties, 
  updateSegments, 
  updateHarvestEvents, 
  updateHarvestContributions, 
  updateGartenConfiguration 
} from './data-store';
import { toast } from '@/hooks/use-toast';

export interface SimpleSyncResult {
  success: boolean;
  message: string;
  filessynced: number;
  errors: string[];
}

export class SimpleCloudSync {
  private syncPath: string = '';
  private isRunning: boolean = false;
  
  constructor(syncPath: string = '') {
    this.syncPath = syncPath;
  }
  
  /**
   * Setzt den Synchronisationspfad
   */
  setSyncPath(path: string): void {
    this.syncPath = path;
    console.log(`[SimpleCloudSync] Sync-Pfad gesetzt: ${path}`);
  }
  
  /**
   * Überprüft, ob Cloud-Sync verfügbar ist
   */
  isAvailable(): boolean {
    return (
      typeof window !== 'undefined' && 
      electronAPI.isElectron() && 
      this.syncPath.trim() !== ''
    );
  }
  
  /**
   * Hauptfunktion für die Synchronisation
   */
  async performSync(): Promise<SimpleSyncResult> {
    if (this.isRunning) {
      return {
        success: false,
        message: 'Synchronisation läuft bereits',
        filessynced: 0,
        errors: ['Sync bereits in Bearbeitung']
      };
    }
    
    if (!this.isAvailable()) {
      return {
        success: false,
        message: 'Cloud-Sync nicht verfügbar oder kein Sync-Pfad konfiguriert',
        filessynced: 0,
        errors: ['Keine Electron-Umgebung oder Sync-Pfad fehlt']
      };
    }
    
    this.isRunning = true;
    console.log('[SimpleCloudSync] 🔄 Starte Synchronisation...');
    
    try {
      const errors: string[] = [];
      let filesSynced = 0;
      
      // 1. Store sicherstellen - erst laden, falls nicht vorhanden
      let localStore;
      try {
        localStore = getAppStore();
      } catch (error) {
        // Store ist nicht geladen, versuche zu laden
        console.log('[SimpleCloudSync] Store nicht geladen, lade App-Daten...');
        try {
          await loadAppStore();
          localStore = getAppStore();
        } catch (loadError) {
          console.error('[SimpleCloudSync] ❌ Synchronisation fehlgeschlagen: AppStore ist nicht geladen!', loadError);
          return {
            success: false,
            message: 'Synchronisation fehlgeschlagen: AppStore ist nicht geladen!',
            filessynced: 0,
            errors: ['Store konnte nicht geladen werden']
          };
        }
      }
      
      // 2. Sync-Ordner vorbereiten
      const syncDataPath = await this.prepareSyncFolder();
      if (!syncDataPath) {
        throw new Error('Sync-Ordner konnte nicht vorbereitet werden');
      }
      
      // 3. ZUERST: Daten aus Sync-Ordner importieren (falls vorhanden)
      console.log('[SimpleCloudSync] 📥 Schritt 1: Prüfe auf Cloud-Daten...');
      const importResult = await this.importDataFromSyncFolder(syncDataPath);
      if (importResult.success && importResult.hasNewData) {
        console.log('[SimpleCloudSync] ✅ Cloud-Daten in lokalen Store importiert');
        
        // Store neu laden nach Import
        await loadAppStore();
        localStore = getAppStore();
        
        // UI benachrichtigen über neue Daten
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sync-data-updated', { 
            detail: { 
              timestamp: new Date().toISOString(),
              source: 'cloud-sync-import'
            }
          }));
        }
      } else if (importResult.success) {
        console.log('[SimpleCloudSync] 📊 Keine neueren Cloud-Daten gefunden');
      } else {
        errors.push('Import aus Cloud fehlgeschlagen');
      }
      
      // 4. DANACH: Lokale Daten in Sync-Ordner exportieren (für andere Geräte)
      console.log('[SimpleCloudSync] 📤 Schritt 2: Exportiere lokale Daten...');
      const exportResult = await this.exportDataToSyncFolder(localStore, syncDataPath);
      if (exportResult.success) {
        filesSynced += exportResult.fileCount;
        console.log(`[SimpleCloudSync] ✅ ${exportResult.fileCount} Dateien in Cloud exportiert`);
      } else {
        errors.push(`Export in Cloud fehlgeschlagen: ${exportResult.error}`);
      }
      
      const success = errors.length === 0;
      const message = success 
        ? `Synchronisation erfolgreich: ${filesSynced} Dateien synchronisiert`
        : `Synchronisation mit Fehlern: ${errors.length} Fehler aufgetreten`;
      
      console.log(`[SimpleCloudSync] ${success ? '✅' : '⚠️'} ${message}`);
      
      return {
        success,
        message,
        filessynced: filesSynced,
        errors
      };
      
    } catch (error) {
      const errorMessage = `Synchronisation fehlgeschlagen: ${(error as Error).message}`;
      console.error('[SimpleCloudSync] ❌', errorMessage);
      
      return {
        success: false,
        message: errorMessage,
        filessynced: 0,
        errors: [errorMessage]
      };
    } finally {
      this.isRunning = false;
    }
  }
  
  /**
   * Bereitet den Sync-Ordner vor und gibt den Pfad zum Daten-Unterordner zurück
   */
  private async prepareSyncFolder(): Promise<string | null> {
    try {
      if (!electronAPI.isElectron() || !electronAPI.ensureDirectory) {
        console.error('[SimpleCloudSync] Electron-API nicht verfügbar für Ordner-Erstellung');
        return null;
      }
      
      // Erstelle Unterordner im Sync-Pfad für GartenMeister-Daten
      const syncDataPath = `${this.syncPath}/GartenMeister-Data`;
      
      console.log(`[SimpleCloudSync] 📁 Erstelle Sync-Datenordner: ${syncDataPath}`);
      
      // Stelle sicher, dass der Ordner existiert
      const success = await electronAPI.ensureDirectory(syncDataPath);
      if (!success) {
        console.error(`[SimpleCloudSync] ❌ Konnte Sync-Ordner nicht erstellen: ${syncDataPath}`);
        return null;
      }
      
      console.log(`[SimpleCloudSync] ✅ Sync-Datenordner bereit: ${syncDataPath}`);
      return syncDataPath;
      
    } catch (error) {
      console.error('[SimpleCloudSync] Fehler beim Vorbereiten des Sync-Ordners:', error);
      return null;
    }
  }
    /**
   * Exportiert lokale Daten in den Sync-Ordner
   */
  private async exportDataToSyncFolder(store: any, syncDataPath: string): Promise<{success: boolean, fileCount: number, error?: string}> {
    try {
      if (!electronAPI.isElectron() || !electronAPI.writeJsonFile) {
        throw new Error('Electron-API nicht verfügbar');
      }
      
      const filesToExport = [
        { name: 'beds.json', data: store.beds },
        { name: 'herbs.json', data: store.herbVarieties },
        { name: 'segments.json', data: store.segments },
        { name: 'harvests.json', data: { 
          harvestEvents: store.harvestEvents, 
          harvestContributions: store.harvestContributions 
        }},
        { name: 'garten-config.json', data: store.gartenConfiguration },
        { name: 'sync-metadata.json', data: {
          lastSync: new Date().toISOString(),
          deviceId: this.getDeviceId(),
          version: 1
        }}
      ];
      
      let exportedCount = 0;
      
      for (const file of filesToExport) {
        try {
          const filePath = `${syncDataPath}/${file.name}`;
          const success = await electronAPI.writeJsonFile(filePath, file.data);
          if (success) {
            console.log(`[SimpleCloudSync] ✅ ${file.name} exportiert (${JSON.stringify(file.data).length} Zeichen)`);
            exportedCount++;
          } else {
            console.warn(`[SimpleCloudSync] ⚠️ Fehler beim Exportieren von ${file.name}`);
          }
        } catch (error) {
          console.warn(`[SimpleCloudSync] ⚠️ Fehler beim Exportieren von ${file.name}:`, error);
        }
      }
      
      return {
        success: exportedCount > 0,
        fileCount: exportedCount
      };
      
    } catch (error) {
      return {
        success: false,
        fileCount: 0,
        error: (error as Error).message
      };
    }
  }
  
  /**
   * Importiert Daten aus dem Sync-Ordner falls vorhanden oder neuere vorhanden sind
   * WICHTIG: Diese Methode lädt IMMER zuerst Cloud-Daten, bevor sie lokale überschreibt
   */
  private async importDataFromSyncFolder(syncDataPath: string): Promise<{success: boolean, hasNewData: boolean}> {
    try {
      if (!electronAPI.isElectron() || !electronAPI.readJsonFile || !electronAPI.fileExists) {
        throw new Error('Electron-API nicht verfügbar');
      }
      
      console.log(`[SimpleCloudSync] 🔍 Prüfe auf Cloud-Daten in: ${syncDataPath}`);
      
      // Prüfe, welche Dateien im Sync-Ordner vorhanden sind
      const filesToCheck = [
        'beds.json',
        'herbs.json', 
        'segments.json',
        'harvests.json',
        'garten-config.json',
        'sync-metadata.json'
      ];
      
      let hasAnyCloudData = false;
      const cloudData: any = {};
      
      // Lade alle verfügbaren Cloud-Dateien
      for (const fileName of filesToCheck) {
        const filePath = `${syncDataPath}/${fileName}`;
        
        try {
          const exists = await electronAPI.fileExists(filePath);
          if (exists) {
            console.log(`[SimpleCloudSync] 📂 Cloud-Datei gefunden: ${fileName}`);
            const data = await electronAPI.readJsonFile(filePath);
            if (data) {
              cloudData[fileName.replace('.json', '')] = data;
              hasAnyCloudData = true;
              console.log(`[SimpleCloudSync] ✅ Cloud-Daten geladen: ${fileName} (${JSON.stringify(data).length} Zeichen)`);
            }
          } else {
            console.log(`[SimpleCloudSync] ❌ Cloud-Datei nicht vorhanden: ${fileName}`);
          }
        } catch (error) {
          console.warn(`[SimpleCloudSync] ⚠️ Fehler beim Lesen von ${fileName}:`, error);
        }
      }
      
      if (!hasAnyCloudData) {
        console.log('[SimpleCloudSync] 📭 Keine Cloud-Daten gefunden');
        return {
          success: true,
          hasNewData: false
        };
      }
      
      // Bestimme, ob Cloud-Daten neuer sind
      let shouldImport = false;
      const localStore = getAppStore();
      
      // Prüfe Sync-Metadata für Zeitstempel-Vergleich
      if (cloudData['sync-metadata']) {
        const cloudLastSync = new Date(cloudData['sync-metadata'].lastSync || 0);
        const localLastSync = new Date(localStore.lastCloudSync || 0);
        
        console.log(`[SimpleCloudSync] Cloud-Sync: ${cloudLastSync.toISOString()}`);
        console.log(`[SimpleCloudSync] Lokal-Sync: ${localLastSync.toISOString()}`);
        
        // Cloud-Daten sind neuer oder lokale Daten sind leer
        shouldImport = cloudLastSync > localLastSync || this.isLocalStoreEmpty(localStore);
      } else {
        // Keine Metadata, aber Cloud-Daten vorhanden - importiere, wenn lokal leer
        shouldImport = this.isLocalStoreEmpty(localStore);
      }
      
      if (shouldImport) {
        console.log('[SimpleCloudSync] 🔄 Importiere Cloud-Daten in lokalen Store...');
        
        // Importiere alle verfügbaren Daten
        if (cloudData.beds) {
          await updateBeds(cloudData.beds);
          console.log(`[SimpleCloudSync] ✅ ${cloudData.beds.length} Beete importiert`);
        }
        
        if (cloudData.herbs) {
          await updateHerbVarieties(cloudData.herbs);
          console.log(`[SimpleCloudSync] ✅ ${cloudData.herbs.length} Kräuter importiert`);
        }
        
        if (cloudData.segments) {
          await updateSegments(cloudData.segments);
          console.log(`[SimpleCloudSync] ✅ ${cloudData.segments.length} Segmente importiert`);
        }
        
        if (cloudData.harvests) {
          if (cloudData.harvests.harvestEvents) {
            await updateHarvestEvents(cloudData.harvests.harvestEvents);
            console.log(`[SimpleCloudSync] ✅ ${cloudData.harvests.harvestEvents.length} Ernten importiert`);
          }
          if (cloudData.harvests.harvestContributions) {
            await updateHarvestContributions(cloudData.harvests.harvestContributions);
            console.log(`[SimpleCloudSync] ✅ ${cloudData.harvests.harvestContributions.length} Ernte-Beiträge importiert`);
          }
        }
        
        if (cloudData['garten-config']) {
          await updateGartenConfiguration(cloudData['garten-config']);
          console.log(`[SimpleCloudSync] ✅ Garten-Konfiguration importiert`);
        }
        
        // Aktualisiere lokalen Sync-Zeitstempel
        const updatedStore = getAppStore();
        updatedStore.lastCloudSync = new Date().toISOString();
        await persistAppStore(updatedStore);
        
        console.log('[SimpleCloudSync] 🎉 Cloud-Daten erfolgreich importiert!');
        
        return {
          success: true,
          hasNewData: true
        };
      } else {
        console.log('[SimpleCloudSync] 📊 Lokale Daten sind aktueller, kein Import nötig');
        return {
          success: true,
          hasNewData: false
        };
      }
      
    } catch (error) {
      console.error('[SimpleCloudSync] Fehler beim Importieren aus Sync-Ordner:', error);
      console.error('[SimpleCloudSync] Fehler beim Importieren von Cloud-Daten:', error);
      return {
        success: false,
        hasNewData: false
      };
    }
  }
  
  /**
   * Prüft, ob der lokale Store leer oder minimal gefüllt ist
   */
  private isLocalStoreEmpty(store: any): boolean {
    if (!store) return true;
    
    const isEmpty = (!store.beds || store.beds.length === 0) &&
                   (!store.herbVarieties || store.herbVarieties.length === 0) &&
                   (!store.segments || store.segments.length === 0) &&
                   (!store.harvestEvents || store.harvestEvents.length === 0);
    
    console.log(`[SimpleCloudSync] Lokaler Store leer: ${isEmpty}`);
    return isEmpty;
  }
  
  /**
   * Generiert oder lädt eine eindeutige Geräte-ID
   */
  private getDeviceId(): string {
    if (typeof window !== 'undefined') {
      let deviceId = localStorage.getItem('gartenmeister-device-id');
      if (!deviceId) {
        deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('gartenmeister-device-id', deviceId);
      }
      return deviceId;
    }
    return 'unknown-device';
  }
  
  /**
   * Startet automatische Synchronisation in Intervallen
   */
  startAutoSync(intervalMinutes: number = 30): void {
    if (!this.isAvailable()) {
      console.warn('[SimpleCloudSync] Auto-Sync nicht verfügbar');
      return;
    }
    
    console.log(`[SimpleCloudSync] Starte Auto-Sync (alle ${intervalMinutes} Minuten)`);
    
    setInterval(async () => {
      if (!this.isRunning) {
        try {
          const result = await this.performSync();
          if (result.success) {
            console.log(`[SimpleCloudSync] Auto-Sync erfolgreich: ${result.message}`);
          } else {
            console.warn(`[SimpleCloudSync] Auto-Sync mit Fehlern: ${result.message}`);
          }
        } catch (error) {
          console.error('[SimpleCloudSync] Auto-Sync Fehler:', error);
        }
      }
    }, intervalMinutes * 60 * 1000);
  }
}

// Singleton-Instanz für die Anwendung
let globalSyncInstance: SimpleCloudSync | null = null;

/**
 * Holt die globale Sync-Instanz
 */
export function getCloudSyncInstance(syncPath?: string): SimpleCloudSync {
  if (!globalSyncInstance) {
    globalSyncInstance = new SimpleCloudSync(syncPath || '');
  }
  
  if (syncPath && syncPath !== '') {
    globalSyncInstance.setSyncPath(syncPath);
  }
  
  return globalSyncInstance;
}

/**
 * Führt eine manuelle Synchronisation durch
 */
export async function performManualSync(syncPath?: string): Promise<SimpleSyncResult> {
  const syncInstance = getCloudSyncInstance(syncPath);
  
  if (!syncInstance.isAvailable()) {
    toast({
      title: "Cloud-Sync nicht verfügbar",
      description: "Bitte konfigurieren Sie einen Sync-Pfad in den Einstellungen.",
      variant: "destructive",
    });
    
    return {
      success: false,
      message: 'Cloud-Sync nicht konfiguriert',
      filessynced: 0,
      errors: ['Kein Sync-Pfad konfiguriert']
    };
  }
  
  toast({
    title: "Synchronisation startet",
    description: "Ihre Daten werden synchronisiert...",
  });
  
  const result = await syncInstance.performSync();
  
  if (result.success) {
    toast({
      title: "Synchronisation erfolgreich",
      description: result.message,
    });
  } else {
    toast({
      title: "Synchronisation fehlgeschlagen",
      description: result.message,
      variant: "destructive",
    });
  }
  
  return result;
}
