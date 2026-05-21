/**
 * Datenreparatur-Funktion für GartenMeister
 * Behebt Inkonsistenzen zwischen Garten-Konfiguration und tatsächlichen Beete-Daten
 */

import { getAppStore, modifyStoreAndPersist } from './data';
import type { Bed } from './definitions';

/**
 * Repariert Dateninkonsistenzen im Store
 * - Erstellt fehlende Beete basierend auf der Garten-Konfiguration
 * - Entfernt verwaiste Beet-IDs aus der Konfiguration
 */
export async function repairDataConsistency(): Promise<{
  success: boolean;
  message: string;
  details: {
    beetsCreated: number;
    beetIdsRemoved: number;
    inconsistenciesFound: boolean;
  };
}> {
  console.log('[data-repair] 🔧 Starte Datenreparatur...');
  
  try {
    const store = getAppStore();
    const config = store.gartenConfiguration;
    const existingBeds = store.beds || [];
    
    console.log(`[data-repair] Analyse: ${config.activeBeetIds.length} Beet-IDs in Konfiguration, ${existingBeds.length} tatsächliche Beete`);
    
    let beetsCreated = 0;
    let beetIdsRemoved = 0;
    let inconsistenciesFound = false;
    
    // 1. Prüfe auf fehlende Beete und erstelle sie
    const missingBeetIds = config.activeBeetIds.filter(
      beetId => !existingBeds.find(bed => bed.id === beetId)
    );
    
    if (missingBeetIds.length > 0) {
      console.log(`[data-repair] ⚠️ ${missingBeetIds.length} fehlende Beete gefunden:`, missingBeetIds);
      inconsistenciesFound = true;
      
      // Erstelle fehlende Beete
      const newBeds: Bed[] = missingBeetIds.map((beetId, index) => {
        const beetNumber = parseInt(beetId.split('-')[1]) || (index + 1);
        return {
          id: beetId,
          name: `Beet ${beetNumber}`,
          type: 'Standard' as const,
          width: 1.5,
          length: 3.0,
          plantingDate: new Date().toISOString(),
          isActive: true
        };
      });
      
      // Füge neue Beete zum Store hinzu
      await modifyStoreAndPersist(() => {
        store.beds.push(...newBeds);
      });
      
      beetsCreated = newBeds.length;
      console.log(`[data-repair] ✅ ${beetsCreated} Beete erstellt`);
    }
    
    // 2. Prüfe auf verwaiste Beet-IDs in der Konfiguration
    const existingBeetIds = existingBeds.map(bed => bed.id);
    const orphanedIds = config.activeBeetIds.filter(
      beetId => !existingBeetIds.includes(beetId) && !missingBeetIds.includes(beetId)
    );
    
    if (orphanedIds.length > 0) {
      console.log(`[data-repair] ⚠️ ${orphanedIds.length} verwaiste Beet-IDs gefunden:`, orphanedIds);
      inconsistenciesFound = true;
      
      // Entferne verwaiste IDs aus der Konfiguration
      await modifyStoreAndPersist(() => {
        store.gartenConfiguration.activeBeetIds = store.gartenConfiguration.activeBeetIds.filter(
          id => !orphanedIds.includes(id)
        );
        store.gartenConfiguration.currentBeetCount = store.gartenConfiguration.activeBeetIds.length;
        store.gartenConfiguration.lastModified = new Date().toISOString();
      });
      
      beetIdsRemoved = orphanedIds.length;
      console.log(`[data-repair] ✅ ${beetIdsRemoved} verwaiste Beet-IDs entfernt`);
    }
    
    if (!inconsistenciesFound) {
      console.log('[data-repair] ✅ Keine Dateninkonsistenzen gefunden');
      return {
        success: true,
        message: 'Daten sind konsistent',
        details: { beetsCreated: 0, beetIdsRemoved: 0, inconsistenciesFound: false }
      };
    }
    
    console.log('[data-repair] ✅ Datenreparatur abgeschlossen');
    return {
      success: true,
      message: `Datenreparatur erfolgreich: ${beetsCreated} Beete erstellt, ${beetIdsRemoved} verwaiste IDs entfernt`,
      details: { beetsCreated, beetIdsRemoved, inconsistenciesFound: true }
    };
    
  } catch (error) {
    console.error('[data-repair] ❌ Fehler bei der Datenreparatur:', error);
    return {
      success: false,
      message: `Datenreparatur fehlgeschlagen: ${error}`,
      details: { beetsCreated: 0, beetIdsRemoved: 0, inconsistenciesFound: false }
    };
  }
}

/**
 * Prüft auf Dateninkonsistenzen ohne sie zu reparieren
 */
export function checkDataConsistency(): {
  isConsistent: boolean;
  issues: string[];
  missingBeetsCount: number;
  orphanedIdsCount: number;
} {
  const store = getAppStore();
  const config = store.gartenConfiguration;
  const existingBeds = store.beds || [];
  const issues: string[] = [];
  
  // Prüfe auf fehlende Beete
  const missingBeetIds = config.activeBeetIds.filter(
    beetId => !existingBeds.find(bed => bed.id === beetId)
  );
  
  // Prüfe auf verwaiste Beet-IDs
  const existingBeetIds = existingBeds.map(bed => bed.id);
  const orphanedIds = config.activeBeetIds.filter(
    beetId => !existingBeetIds.includes(beetId)
  );
  
  if (missingBeetIds.length > 0) {
    issues.push(`${missingBeetIds.length} Beete in Konfiguration referenziert, aber nicht vorhanden`);
  }
  
  if (orphanedIds.length > 0) {
    issues.push(`${orphanedIds.length} verwaiste Beet-IDs in Konfiguration`);
  }
  
  if (config.currentBeetCount !== config.activeBeetIds.length) {
    issues.push(`Beet-Anzahl (${config.currentBeetCount}) stimmt nicht mit ID-Liste überein (${config.activeBeetIds.length})`);
  }
  
  return {
    isConsistent: issues.length === 0,
    issues,
    missingBeetsCount: missingBeetIds.length,
    orphanedIdsCount: orphanedIds.length
  };
}
