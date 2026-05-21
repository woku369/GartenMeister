'use client';

/**
 * DataPersistenceManager - Automatisches Laden und Speichern von Daten
 * Diese Komponente wird in der App eingebunden und überwacht Datenänderungen
 */

import { useEffect, useState } from 'react';
import { loadAppStore, saveAppStore } from '@/lib/data';
import { getCloudSyncInstance } from '@/lib/simple-cloud-sync';
import { electronAPI } from '@/lib/electron-bridge';
import { toast } from '@/hooks/use-toast';

interface DataPersistenceManagerProps {
  // Konfiguration für automatisches Speichern
  autoSaveInterval?: number; // in Minuten
  enableCloudSync?: boolean;
  cloudSyncPath?: string;
  cloudSyncInterval?: number; // in Minuten
}

export default function DataPersistenceManager({
  autoSaveInterval = 15, // Standard: alle 15 Minuten speichern
  enableCloudSync = false,
  cloudSyncPath = '',
  cloudSyncInterval = 60 // Standard: alle 60 Minuten synchronisieren
}: DataPersistenceManagerProps) {
  console.log('[DataPersistenceManager] Komponente wird gerendert');
  // Effekt für Unmount-Logging
  useEffect(() => {
    console.log('[DataPersistenceManager] Komponente gemountet');
    return () => {
      console.log('[DataPersistenceManager] Komponente wird unmounted');
    };
  }, []);

  const [isInitialized, setIsInitialized] = useState(false);
  const [lastSave, setLastSave] = useState<Date | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Initialisierung beim Mount
  useEffect(() => {
    const initializeDataPersistence = async () => {
      console.log('[DataPersistenceManager] Initialisierung gestartet...');
      
      if (!electronAPI.isElectron()) {
        console.log('[DataPersistenceManager] ⚠️ Keine Electron-Umgebung, Persistenz übersprungen');
        return;
      }

      try {
        console.log('[DataPersistenceManager] Lade gespeicherte App-Daten...');
        await loadAppStore();
        
        toast({
          title: 'Daten geladen',
          description: 'Ihre gespeicherten Daten wurden erfolgreich geladen',
        });
        
        // window.dispatchEvent(new CustomEvent('app-data-ready', { 
        //   detail: { 
        //     timestamp: Date.now() 
        //   }
        // }));
        // Das Event wird nur nach tatsächlichen Datenänderungen (z.B. nach Speichern) ausgelöst, nicht nach jedem Laden.
        
        console.log('[DataPersistenceManager] Persistierung aktiviert');
        console.log('[DataPersistenceManager] Daten geladen, keine Reparatur nötig');
        
        // Event-Listener für Datenänderungen registrieren
        const handleDataLoaded = (event: CustomEvent) => {
          console.log('[DataPersistenceManager] Daten aus lokaler Speicherung geladen:', event.detail);
          toast({
            title: 'Daten geladen',
            description: `${event.detail.beds} Beete, ${event.detail.herbs} Kräuter geladen`,
          });
        };

        const handleDataSaved = (event: CustomEvent) => {
          console.log('[DataPersistenceManager] Daten manuell gespeichert:', event.detail);
          setLastSave(new Date(event.detail.timestamp));
        };

        const handleSyncCompleted = (event: CustomEvent) => {
          console.log('[DataPersistenceManager] Cloud-Sync abgeschlossen:', event.detail);
          setLastSync(new Date(event.detail.timestamp));
          toast({
            title: 'Synchronisation abgeschlossen',
            description: 'Ihre Daten wurden erfolgreich synchronisiert',
          });
        };

        window.addEventListener('app-data-ready', handleDataLoaded as EventListener);
        window.addEventListener('data-saved-manually', handleDataSaved as EventListener);
        window.addEventListener('sync-data-updated', handleSyncCompleted as EventListener);

        // Cleanup-Funktion für Event-Listener
        return () => {
          window.removeEventListener('app-data-ready', handleDataLoaded as EventListener);
          window.removeEventListener('data-saved-manually', handleDataSaved as EventListener);
          window.removeEventListener('sync-data-updated', handleSyncCompleted as EventListener);
        };

      } catch (error) {
        console.error('[DataPersistenceManager] Fehler bei der Initialisierung:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeDataPersistence();
  }, []);

  // Automatisches Speichern in Intervallen
  useEffect(() => {
    if (!isInitialized || !electronAPI.isElectron()) {
      return;
    }

    console.log(`[DataPersistenceManager] ⏰ Auto-Save alle ${autoSaveInterval} Minuten aktiviert`);

    const autoSaveIntervalId = setInterval(async () => {
      try {
        console.log('[DataPersistenceManager] 💾 Automatisches Speichern...');
        await saveAppStore();
        
        setLastSave(new Date());
        console.log('[DataPersistenceManager] ✅ Automatisches Speichern erfolgreich');
      } catch (error) {
        console.error('[DataPersistenceManager] ❌ Fehler beim automatischen Speichern:', error);
      }
    }, autoSaveInterval * 60 * 1000);

    return () => {
      clearInterval(autoSaveIntervalId);
    };
  }, [isInitialized, autoSaveInterval]);

  // Automatische Cloud-Synchronisation
  useEffect(() => {
    if (!isInitialized || !enableCloudSync || !cloudSyncPath || !electronAPI.isElectron()) {
      return;
    }

    console.log(`[DataPersistenceManager] ☁️ Auto-Sync alle ${cloudSyncInterval} Minuten aktiviert für: ${cloudSyncPath}`);

    const syncInstance = getCloudSyncInstance(cloudSyncPath);
    
    if (syncInstance.isAvailable()) {
      syncInstance.startAutoSync(cloudSyncInterval);
    } else {
      console.warn('[DataPersistenceManager] ⚠️ Cloud-Sync nicht verfügbar');
    }

  }, [isInitialized, enableCloudSync, cloudSyncPath, cloudSyncInterval]);

  // Speichern beim Verlassen der Seite
  useEffect(() => {
    if (!isInitialized || !electronAPI.isElectron()) {
      return;
    }

    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      // Bei kritischen Änderungen vor dem Schließen speichern
      try {
        console.log('[DataPersistenceManager] 💾 Speichere vor dem Schließen...');
        await saveAppStore();
      } catch (error) {
        console.error('[DataPersistenceManager] ❌ Fehler beim Speichern vor dem Schließen:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isInitialized]);

  // Unsichtbare Komponente - nur für das Management, keine UI
  return null;
}

// Hook für den Status der Persistenz
export function useDataPersistenceStatus() {
  const [status, setStatus] = useState({
    isElectronApp: false,
    lastSave: null as Date | null,
    lastSync: null as Date | null,
    autoSaveEnabled: false,
    cloudSyncEnabled: false
  });

  useEffect(() => {
    setStatus(prevStatus => ({
      ...prevStatus,
      isElectronApp: electronAPI.isElectron(),
      autoSaveEnabled: electronAPI.isElectron(),
      cloudSyncEnabled: electronAPI.isElectron()
    }));

    // Event-Listener für Status-Updates (optional, falls benötigt)
    return () => {};
  }, []);

  return status;
}
