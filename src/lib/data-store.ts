/**
 * Sauberer, einfacher Datenstore für GartenMeister
 * - Kein Event-System
 * - Keine Endlosschleifen  
 * - Direkte CRUD-Operationen mit sofortigem Speichern
 */

import type { 
  Bed, 
  HerbVariety, 
  KombinationsbeetSegment, 
  SegmentFormData,
  HarvestEvent, 
  HarvestContribution, 
  GartenConfiguration 
} from './definitions';
import { GARDEN_FIXED_BED_LENGTH, DEFAULT_GARTEN_CONFIG, FIXED_HERB_VARIETIES } from './definitions';
import { electronAPI } from './electron-bridge';

// Einfacher App-Store
export interface AppStore {
  beds: Bed[];
  herbVarieties: HerbVariety[];
  segments: KombinationsbeetSegment[];
  harvestEvents: HarvestEvent[];
  harvestContributions: HarvestContribution[];
  gartenConfiguration: GartenConfiguration;
  nextBedId: number;
  nextHerbId: number;
  nextSegmentId: number;
  nextHarvestEventId: number;
  nextHarvestContributionId: number;
}

// Globaler Store
let store: AppStore | null = null;

// Store-Initialisierung
function createEmptyStore(): AppStore {
  return {
    beds: [],
    herbVarieties: [...FIXED_HERB_VARIETIES],
    segments: [],
    harvestEvents: [],
    harvestContributions: [],
    gartenConfiguration: { ...DEFAULT_GARTEN_CONFIG },
    nextBedId: 1,
    nextHerbId: 100,
    nextSegmentId: 1,
    nextHarvestEventId: 1,
    nextHarvestContributionId: 1,
  };
}

// Store-Getter
export function getStore(): AppStore {
  if (!store) {
    store = createEmptyStore();
  }
  return store;
}

// Store laden
export async function loadStore(): Promise<AppStore> {
  console.log('[data-store] loadStore() aufgerufen');
  
  // Nur in Electron
  if (!electronAPI.isElectron()) {
    console.warn('[data-store] Nicht in Electron, verwende Memory-Store');
    console.warn('[data-store] electronAPI.isElectron() =', electronAPI.isElectron());
    console.warn('[data-store] window.electronAPI =', typeof window !== 'undefined' ? window.electronAPI : 'undefined window');
    
    // ENTWICKLUNGS-FALLBACK: Lade Mock-Daten für Browser-Tests
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('[data-store] Entwicklungsumgebung erkannt, lade Mock-Daten');
      store = await loadMockDataForDevelopment();
      return store;
    }
    
    if (!store) store = createEmptyStore();
    return store;
  }

  console.log('[data-store] Electron erkannt, lade Daten...');

  try {
    const filePath = await electronAPI.getDataFilePath('app-data.json');
    console.log('[data-store] Dateipfad:', filePath);
    
    const exists = await electronAPI.fileExists(filePath);
    console.log('[data-store] Datei existiert:', exists);
    
    if (!exists) {
      console.log('[data-store] Datei existiert nicht, erstelle neuen Store');
      store = createEmptyStore();
      await saveStore();
      return store;
    }

    const data = await electronAPI.readJsonFile<AppStore>(filePath);
    console.log('[data-store] Geladene Daten:', {
      hasData: !!data,
      bedsCount: data?.beds?.length || 0,
      segmentsCount: data?.segments?.length || 0,
      herbsCount: data?.herbVarieties?.length || 0
    });
    
    if (data) {
      store = { ...createEmptyStore(), ...data };
      console.log('[data-store] Store erfolgreich geladen, finale Segmentanzahl:', store.segments.length);
    } else {
      store = createEmptyStore();
      console.log('[data-store] Leere Datei, erstelle neuen Store');
    }
  } catch (error) {
    console.error('[data-store] Fehler beim Laden:', error);
    store = createEmptyStore();
  }

  return store;
}

// Mock-Daten für Entwicklung (nur für Browser-Tests)
async function loadMockDataForDevelopment(): Promise<AppStore> {
  console.log('[data-store] Lade Mock-Daten für Entwicklung...');
  
  // Erstelle Mock-Store mit den bekannten Testdaten
  const mockStore: AppStore = {
    ...createEmptyStore(),
    beds: [
      {
        id: 'bed-1',
        bedNumber: 1,
        type: 'Kombinationsbeet',
        width: 1.5,
        length: 3,
        color: '#f0f0f0',
        remarks: 'Testbeet für Segmente'
      },
      // Weitere Mock-Beete falls nötig...
    ],
    segments: [
      {
        id: 'segment-1',
        bedId: 'bed-1',
        segmentLength: 1,
        herbVarietyId: 'herb-100',
        subVarietyName: '',
        plantsPerMeter: 5,
        productivePlantsPercentage: 100,
        plantingDate: '2025-07-05',
        remarks: ''
      },
      {
        id: 'segment-2',
        bedId: 'bed-1',
        segmentLength: 1,
        herbVarietyId: 'herb-101',
        subVarietyName: '',
        plantsPerMeter: 2,
        productivePlantsPercentage: 100,
        plantingDate: '2025-07-05',
        remarks: ''
      },
      {
        id: 'segment-3',
        bedId: 'bed-1',
        segmentLength: 1,
        herbVarietyId: 'herb-102',
        subVarietyName: '',
        plantsPerMeter: 3,
        productivePlantsPercentage: 100,
        plantingDate: '2025-07-05',
        remarks: ''
      }
    ],
    herbVarieties: [
      ...FIXED_HERB_VARIETIES,
      {
        id: 'herb-100',
        name: 'Zitronengras',
        color: '#E6FF2A',
        category: 'Kräuter',
        description: 'Test-Kräuter für Mock'
      },
      {
        id: 'herb-101',
        name: 'Schweizer Minze',
        color: '#90EE90',
        category: 'Kräuter',
        description: 'Test-Kräuter für Mock'
      },
      {
        id: 'herb-102',
        name: 'Zitronenverbene',
        color: '#00FF7F',
        category: 'Kräuter',
        description: 'Test-Kräuter für Mock'
      }
    ]
  };
  
  console.log('[data-store] Mock-Store erstellt mit', mockStore.segments.length, 'Segmenten');
  return mockStore;
}

// Store speichern
export async function saveStore(): Promise<boolean> {
  if (!store) {
    console.warn('[data-store] Kein Store zum Speichern');
    return false;
  }

  // Nur in Electron
  if (!electronAPI.isElectron()) {
    console.warn('[data-store] Nicht in Electron, Speichern übersprungen');
    return false;
  }

  try {
    const filePath = await electronAPI.getDataFilePath('app-data.json');
    await electronAPI.writeJsonFile(filePath, store);
    console.log('[data-store] Store erfolgreich gespeichert');
    return true;
  } catch (error) {
    console.error('[data-store] Fehler beim Speichern:', error);
    return false;
  }
}

// === CRUD-Operationen für Beete ===

export async function createBed(bedData: Omit<Bed, 'id' | 'length'> & { length?: number }): Promise<Bed | null> {
  const currentStore = getStore();
  
  try {
    // Prüfe, ob die Beetnummer bereits existiert
    const existingBed = currentStore.beds.find(bed => bed.bedNumber === bedData.bedNumber);
    if (existingBed) {
      throw new Error(`Beetnummer ${bedData.bedNumber} ist bereits vergeben.`);
    }

    const newBed: Bed = {
      ...bedData,
      id: `bed-${currentStore.nextBedId++}`,
      width: bedData.width && bedData.width > 0 ? bedData.width : 1,
      length: bedData.length ?? GARDEN_FIXED_BED_LENGTH,
    } as Bed;

    currentStore.beds.push(newBed);
    await saveStore();
    
    return newBed;
  } catch (error) {
    console.error('[data-store] Fehler beim Erstellen des Beets:', error);
    return null;
  }
}

export async function updateBed(id: string, updateData: Partial<Omit<Bed, 'id'>>): Promise<Bed | null> {
  const currentStore = getStore();
  
  try {
    const bedIndex = currentStore.beds.findIndex(b => b.id === id);
    if (bedIndex === -1) return null;

    // Prüfe bei Beetnummer-Änderung, ob die neue Nummer bereits vergeben ist
    if (updateData.bedNumber !== undefined) {
      const existingBed = currentStore.beds.find(bed => 
        bed.bedNumber === updateData.bedNumber && bed.id !== id
      );
      if (existingBed) {
        throw new Error(`Beetnummer ${updateData.bedNumber} ist bereits vergeben.`);
      }
    }

    currentStore.beds[bedIndex] = { ...currentStore.beds[bedIndex], ...updateData };
    await saveStore();
    
    return currentStore.beds[bedIndex];
  } catch (error) {
    console.error('[data-store] Fehler beim Aktualisieren des Beets:', error);
    return null;
  }
}

export async function deleteBed(id: string): Promise<boolean> {
  const currentStore = getStore();
  
  try {
    const bedIndex = currentStore.beds.findIndex(b => b.id === id);
    if (bedIndex === -1) return false;

    currentStore.beds.splice(bedIndex, 1);
    
    // Zugehörige Segmente löschen
    currentStore.segments = currentStore.segments.filter(s => s.bedId !== id);
    
    await saveStore();
    
    console.log('[data-store] Beet gelöscht:', id);
    return true;
  } catch (error) {
    console.error('[data-store] Fehler beim Löschen des Beets:', error);
    return false;
  }
}

export function getAllBeds(): Bed[] {
  return getStore().beds;
}

export function getBedById(id: string): Bed | undefined {
  return getStore().beds.find(b => b.id === id);
}

// === CRUD-Operationen für Kräuter ===

export async function createHerbVariety(name: string, color?: string): Promise<HerbVariety | null> {
  const currentStore = getStore();
  
  try {
    const newHerb: HerbVariety = {
      id: `herb-${currentStore.nextHerbId++}`,
      name,
      color: color || '#22c55e',
      isFixed: false,
    };

    currentStore.herbVarieties.push(newHerb);
    await saveStore();
    
    console.log('[data-store] Kräutersorte erstellt:', newHerb.id);
    return newHerb;
  } catch (error) {
    console.error('[data-store] Fehler beim Erstellen der Kräutersorte:', error);
    return null;
  }
}

export function getAllHerbVarieties(): HerbVariety[] {
  return getStore().herbVarieties;
}

// === CRUD-Operationen für Segmente ===

export async function createSegment(bedId: string, segmentData: SegmentFormData): Promise<KombinationsbeetSegment | null> {
  const currentStore = getStore();
  
  try {
    console.log('[data-store] Versuche Segment zu erstellen für bedId:', bedId);
    
    // Prüfe ob das Beet existiert und ein Kombinationsbeet ist
    const bed = currentStore.beds.find(b => b.id === bedId);
    console.log('[data-store] Gefundenes Beet:', bed ? `${bed.id} (${bed.type})` : 'nicht gefunden');
    
    if (!bed) {
      console.error('[data-store] Beet nicht gefunden:', bedId);
      throw new Error('Beet nicht gefunden');
    }
    
    if (bed.type !== 'Kombinationsbeet') {
      console.error('[data-store] Beet ist kein Kombinationsbeet:', bed.type);
      throw new Error('Segment kann nur zu einem Kombinationsbeet hinzugefügt werden');
    }
    
    console.log('[data-store] ✅ Typ-Check erfolgreich - Beet ist ein Kombinationsbeet');
    
    const newSegment: KombinationsbeetSegment = {
      id: `segment-${currentStore.nextSegmentId++}`,
      bedId,
      ...segmentData,
    };

    currentStore.segments.push(newSegment);
    await saveStore();
    
    console.log('[data-store] Segment erfolgreich erstellt:', newSegment.id);
    return newSegment;
  } catch (error) {
    console.error('[data-store] Fehler beim Erstellen des Segments:', error);
    return null;
  }
}

export async function updateSegment(id: string, updateData: Partial<SegmentFormData>): Promise<KombinationsbeetSegment | null> {
  const currentStore = getStore();
  
  try {
    const segmentIndex = currentStore.segments.findIndex(s => s.id === id);
    if (segmentIndex === -1) return null;

    currentStore.segments[segmentIndex] = { ...currentStore.segments[segmentIndex], ...updateData };
    await saveStore();
    
    console.log('[data-store] Segment aktualisiert:', id);
    return currentStore.segments[segmentIndex];
  } catch (error) {
    console.error('[data-store] Fehler beim Aktualisieren des Segments:', error);
    return null;
  }
}

export async function deleteSegment(id: string): Promise<boolean> {
  const currentStore = getStore();
  
  try {
    const segmentIndex = currentStore.segments.findIndex(s => s.id === id);
    if (segmentIndex === -1) return false;

    currentStore.segments.splice(segmentIndex, 1);
    await saveStore();
    
    console.log('[data-store] Segment gelöscht:', id);
    return true;
  } catch (error) {
    console.error('[data-store] Fehler beim Löschen des Segments:', error);
    return false;
  }
}

export function getSegmentsByBedId(bedId: string): KombinationsbeetSegment[] {
  return getStore().segments.filter(s => s.bedId === bedId);
}

export function getAllSegments(): KombinationsbeetSegment[] {
  return getStore().segments;
}

// === Garten-Konfiguration ===

export async function updateGartenConfiguration(config: Partial<GartenConfiguration>): Promise<boolean> {
  const currentStore = getStore();
  
  try {
    currentStore.gartenConfiguration = {
      ...currentStore.gartenConfiguration,
      ...config,
      lastModified: new Date().toISOString(),
    };
    
    await saveStore();
    console.log('[data-store] Gartenkonfiguration aktualisiert');
    return true;
  } catch (error) {
    console.error('[data-store] Fehler beim Aktualisieren der Gartenkonfiguration:', error);
    return false;
  }
}

export function getGartenConfiguration(): GartenConfiguration {
  return getStore().gartenConfiguration;
}

// Batch-Update-Funktionen für Cloud-Sync
export async function updateBeds(beds: Bed[]): Promise<boolean> {
  try {
    const currentStore = getStore();
    currentStore.beds = beds;
    return await saveStore();
  } catch (error) {
    console.error('[DataStore] Fehler beim Batch-Update der Beete:', error);
    return false;
  }
}

export async function updateHerbVarieties(herbs: HerbVariety[]): Promise<boolean> {
  try {
    const currentStore = getStore();
    currentStore.herbVarieties = herbs;
    return await saveStore();
  } catch (error) {
    console.error('[DataStore] Fehler beim Batch-Update der Kräuter:', error);
    return false;
  }
}

export async function updateSegments(segments: KombinationsbeetSegment[]): Promise<boolean> {
  try {
    const currentStore = getStore();
    currentStore.segments = segments;
    return await saveStore();
  } catch (error) {
    console.error('[DataStore] Fehler beim Batch-Update der Segmente:', error);
    return false;
  }
}

export async function updateHarvestEvents(events: HarvestEvent[]): Promise<boolean> {
  try {
    const currentStore = getStore();
    currentStore.harvestEvents = events;
    return await saveStore();
  } catch (error) {
    console.error('[DataStore] Fehler beim Batch-Update der Ernte-Events:', error);
    return false;
  }
}

export async function updateHarvestContributions(contributions: HarvestContribution[]): Promise<boolean> {
  try {
    const currentStore = getStore();
    currentStore.harvestContributions = contributions;
    return await saveStore();
  } catch (error) {
    console.error('[DataStore] Fehler beim Batch-Update der Ernte-Beiträge:', error);
    return false;
  }
}
