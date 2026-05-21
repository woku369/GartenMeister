/**
 * Datenmigration für existierende app-data.json Dateien
 * Behebt ID-Inkonsistenzen zwischen Bed-IDs und activeBeetIds
 */

import type { AppGlobalStore } from './data';
import { electronAPI } from './electron-bridge';

const APP_DATA_FILE = 'app-data.json';

/**
 * Migriert eine geladene AppGlobalStore Instanz
 * Behebt bekannte Inkonsistenzen und korrupte Daten
 */
export function migrateAppStore(store: AppGlobalStore): AppGlobalStore {
  console.log('[data-migration] Starte Datenmigration...');
  
  const migrated = { ...store };
  
  // 1. ID-Format-Korrektur: beet-X -> bed-X
  if (migrated.gartenConfiguration?.activeBeetIds) {
    const oldIds = migrated.gartenConfiguration.activeBeetIds;
    const newIds = oldIds.map(id => {
      if (id.startsWith('beet-')) {
        return id.replace('beet-', 'bed-');
      }
      return id;
    });
    
    if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
      console.log('[data-migration] Korrigiere activeBeetIds Format:', {
        vorher: oldIds.slice(0, 3),
        nachher: newIds.slice(0, 3)
      });
      migrated.gartenConfiguration.activeBeetIds = newIds;
    }
  }
  
  if (migrated.gartenConfiguration?.inactiveBeetIds) {
    const oldIds = migrated.gartenConfiguration.inactiveBeetIds;
    const newIds = oldIds.map(id => {
      if (id.startsWith('beet-')) {
        return id.replace('beet-', 'bed-');
      }
      return id;
    });
    
    if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
      console.log('[data-migration] Korrigiere inactiveBeetIds Format:', {
        vorher: oldIds.slice(0, 3),
        nachher: newIds.slice(0, 3)
      });
      migrated.gartenConfiguration.inactiveBeetIds = newIds;
    }
  }
  
  // 2. Array-Validierung und Reparatur
  if (!Array.isArray(migrated.beds)) {
    console.warn('[data-migration] beds ist kein Array, repariere...');
    migrated.beds = [];
  }
  
  if (!Array.isArray(migrated.herbVarieties)) {
    console.warn('[data-migration] herbVarieties ist kein Array, repariere...');
    migrated.herbVarieties = [];
  }
  
  if (!Array.isArray(migrated.segments)) {
    console.warn('[data-migration] segments ist kein Array, repariere...');
    migrated.segments = [];
  }
  
  if (!Array.isArray(migrated.harvestEvents)) {
    console.warn('[data-migration] harvestEvents ist kein Array, repariere...');
    migrated.harvestEvents = [];
  }
  
  if (!Array.isArray(migrated.harvestContributions)) {
    console.warn('[data-migration] harvestContributions ist kein Array, repariere...');
    migrated.harvestContributions = [];
  }
  
  // 3. Garten-Konfiguration validieren
  if (!migrated.gartenConfiguration || typeof migrated.gartenConfiguration !== 'object') {
    console.warn('[data-migration] gartenConfiguration ist invalid, verwende Standard...');
    migrated.gartenConfiguration = {
      currentBeetCount: 20,
      maxBeetCount: 50,
      activeBeetIds: Array.from({length: 20}, (_, i) => `bed-${i + 1}`),
      inactiveBeetIds: [],
      gartenName: "Hauptgarten",
      lastModified: new Date().toISOString()
    };
  }
  
  // 4. activeBeetIds validieren und reparieren
  if (!Array.isArray(migrated.gartenConfiguration.activeBeetIds)) {
    console.warn('[data-migration] activeBeetIds ist kein Array, repariere...');
    migrated.gartenConfiguration.activeBeetIds = Array.from(
      {length: migrated.gartenConfiguration.currentBeetCount || 20}, 
      (_, i) => `bed-${i + 1}`
    );
  }
  
  if (!Array.isArray(migrated.gartenConfiguration.inactiveBeetIds)) {
    console.warn('[data-migration] inactiveBeetIds ist kein Array, repariere...');
    migrated.gartenConfiguration.inactiveBeetIds = [];
  }
  
  // 5. ID-Zähler validieren
  if (typeof migrated.nextBedId !== 'number' || migrated.nextBedId < 1) {
    const maxBedId = Math.max(
      ...migrated.beds.map(bed => {
        const match = bed.id?.match(/^bed-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      }),
      0
    );
    migrated.nextBedId = maxBedId + 1;
    console.log('[data-migration] nextBedId korrigiert auf:', migrated.nextBedId);
  }
  
  if (typeof migrated.nextHerbId !== 'number' || migrated.nextHerbId < 100) {
    migrated.nextHerbId = 100;
  }
  
  if (typeof migrated.nextSegmentId !== 'number' || migrated.nextSegmentId < 1) {
    migrated.nextSegmentId = 1;
  }
  
  if (typeof migrated.nextHarvestEventId !== 'number' || migrated.nextHarvestEventId < 1) {
    migrated.nextHarvestEventId = 1;
  }
  
  if (typeof migrated.nextHarvestContributionId !== 'number' || migrated.nextHarvestContributionId < 1) {
    migrated.nextHarvestContributionId = 1;
  }
  
  // 6. "Versuchsbeet" → "Kombinationsbeet" Migration
  if (Array.isArray(migrated.beds)) {
    let migratedBeetsCount = 0;
    migrated.beds = migrated.beds.map(bed => {
      if (bed.type === 'Versuchsbeet') {
        migratedBeetsCount++;
        return {
          ...bed,
          type: 'Kombinationsbeet' as const
        };
      }
      return bed;
    });
    
    if (migratedBeetsCount > 0) {
      console.log(`[data-migration] ✅ ${migratedBeetsCount} Beete von "Versuchsbeet" zu "Kombinationsbeet" migriert`);
    }
  }
  
  console.log('[data-migration] Migration abgeschlossen');
  
  return migrated;
}

/**
 * Führt eine Backup-und-Migration der existierenden app-data.json durch
 */
export async function migrateAppDataFile(): Promise<void> {
  try {
    if (!electronAPI.isElectron()) {
      console.log('[data-migration] Nicht in Electron, überspringe Migration');
      return;
    }
    
    const filePath = await electronAPI.getDataFilePath(APP_DATA_FILE);
    const exists = await electronAPI.fileExists(filePath);
    
    if (!exists) {
      console.log('[data-migration] Keine app-data.json gefunden, überspringe Migration');
      return;
    }
    
    console.log('[data-migration] Starte App-Datei Migration:', filePath);
    
    // Backup erstellen
    const backupPath = filePath.replace('.json', '.backup.json');
    const data = await electronAPI.readJsonFile(filePath);
    await electronAPI.writeJsonFile(backupPath, data);
    console.log('[data-migration] Backup erstellt:', backupPath);
    
    // Migration durchführen
    const migrated = migrateAppStore(data);
    
    // Migrierte Daten speichern
    await electronAPI.writeJsonFile(filePath, migrated);
    console.log('[data-migration] Migration gespeichert:', filePath);
    
  } catch (error) {
    console.error('[data-migration] Fehler bei App-Datei Migration:', error);
    throw error;
  }
}
