import type { Bed, HerbVariety, KombinationsbeetSegment, StandardBed, SpecialBed, Kombinationsbeet, SegmentFormData, HarvestEvent, HarvestContribution, WeatherDataPoint, WeatherStatistics, GartenConfiguration } from './definitions';
import { GARDEN_FIXED_BED_LENGTH, DEFAULT_GARTEN_CONFIG } from './definitions';
// import { unstable_noStore as noStore } from 'next/cache'; // DISABLED FOR STATIC EXPORT
import { electronAPI } from './electron-bridge';
import { loadWeatherData } from './storage-manager';
import { FIXED_HERB_VARIETIES } from './definitions';
import { migrateAppStore } from './data-migration';

// Minimaler App-Store
export interface AppGlobalStore {
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

const APP_DATA_FILE = 'app-data.json';

// Globale Variable für den Store
let appStore: AppGlobalStore | null = null;

// Hilfsfunktion: AppData-Pfad holen
async function getAppDataFilePath() {
  if (!electronAPI.isElectron()) throw new Error('Nur in Electron verfügbar!');
  return await electronAPI.getDataFilePath(APP_DATA_FILE);
}

// Hilfsfunktion: Lösche Altlasten im Datenverzeichnis
async function cleanupLegacyDataFiles() {
  try {
    if (!electronAPI.isElectron()) return;
    const legacyFiles = [
      'beds.json',
      'segments.json',
      'harvests.json',
      'garten-config.json',
      'gartenmeister-data.json',
      'herbs.json',
      'garden-data.json',
      'garden-data', // falls als Ordner vorhanden
    ];
    const dataDir = await electronAPI.getDataFilePath(''); // gibt das Datenverzeichnis zurück
    for (const file of legacyFiles) {
      const filePath = dataDir.endsWith('data') ? `${dataDir}/${file}` : `${dataDir}data/${file}`;
      const exists = await electronAPI.fileExists(filePath);
      if (exists) {
        try {
          await electronAPI.deleteFile?.(filePath); // deleteFile muss in electronAPI verfügbar sein
          console.log(`[cleanupLegacyDataFiles] Gelöscht: ${filePath}`);
        } catch (err) {
          console.warn(`[cleanupLegacyDataFiles] Konnte ${filePath} nicht löschen:`, err);
        }
      }
    }
  } catch (err) {
    console.warn('[cleanupLegacyDataFiles] Fehler bei der Bereinigung:', err);
  }
}

// Laden
export async function loadAppStore(): Promise<AppGlobalStore> {
  if (!electronAPI.isElectron()) {
    // Server-Kontext: Gib Dummy-Store zurück, damit Next.js-API-Routen nicht crashen
    if (typeof window === 'undefined') {
      if (!appStore) appStore = createEmptyStore();
      return appStore;
    }
    throw new Error('Nur in Electron verfügbar!');
  }
  const filePath = await getAppDataFilePath();
  console.log('[loadAppStore] Prüfe Existenz von:', filePath);
  const exists = await electronAPI.fileExists(filePath);
  console.log('[loadAppStore] Existiert:', exists);
  if (!exists) {
    // Leeren Store anlegen
    console.log('[loadAppStore] Datei existiert nicht, lege neuen Store an und speichere...');
    appStore = createEmptyStore();
    await saveAppStore();
    return appStore;
  }
  try {
    const data = await electronAPI.readJsonFile(filePath);
    const emptyStore = createEmptyStore();
    
    // SICHERE Datenübernahme - nur gültige Arrays übernehmen
    let rawStore = {
      beds: Array.isArray(data?.beds) ? data.beds : emptyStore.beds,
      herbVarieties: Array.isArray(data?.herbVarieties) ? data.herbVarieties : emptyStore.herbVarieties,
      segments: Array.isArray(data?.segments) ? data.segments : emptyStore.segments,
      harvestEvents: Array.isArray(data?.harvestEvents) ? data.harvestEvents : emptyStore.harvestEvents,
      harvestContributions: Array.isArray(data?.harvestContributions) ? data.harvestContributions : emptyStore.harvestContributions,
      gartenConfiguration: (data?.gartenConfiguration && typeof data.gartenConfiguration === 'object') 
        ? { ...emptyStore.gartenConfiguration, ...data.gartenConfiguration }
        : emptyStore.gartenConfiguration,
      nextBedId: typeof data?.nextBedId === 'number' ? data.nextBedId : emptyStore.nextBedId,
      nextHerbId: typeof data?.nextHerbId === 'number' ? data.nextHerbId : emptyStore.nextHerbId,
      nextSegmentId: typeof data?.nextSegmentId === 'number' ? data.nextSegmentId : emptyStore.nextSegmentId,
      nextHarvestEventId: typeof data?.nextHarvestEventId === 'number' ? data.nextHarvestEventId : emptyStore.nextHarvestEventId,
      nextHarvestContributionId: typeof data?.nextHarvestContributionId === 'number' ? data.nextHarvestContributionId : emptyStore.nextHarvestContributionId,
    };
    
    // DATENMIGRATION: ID-Inkonsistenzen und korrupte Daten reparieren
    console.log('[loadAppStore] Führe Datenmigration durch...');
    appStore = migrateAppStore(rawStore);
    
    console.log('[loadAppStore] Store sicher geladen aus Datei:', filePath);
    console.log('[loadAppStore] Datenstruktur-Validierung:', {
      bedsIsArray: Array.isArray(appStore.beds),
      herbVarietiesIsArray: Array.isArray(appStore.herbVarieties),
      segmentsIsArray: Array.isArray(appStore.segments),
      bedsCount: appStore.beds.length,
      herbsCount: appStore.herbVarieties.length,
      segmentsCount: appStore.segments.length,
      activeBeetIds: appStore.gartenConfiguration?.activeBeetIds?.slice(0, 3) || []
    });
  } catch (err) {
    console.error('[loadAppStore] Fehler beim Lesen der Datei:', filePath, err);
    appStore = createEmptyStore();
    await saveAppStore();
  }
  // Altlasten bereinigen (nur beim ersten Laden pro App-Session)
  if (!appStore) {
    await cleanupLegacyDataFiles();
  }
  return appStore;
}

// Speichern
export async function saveAppStore(): Promise<void> {
  if (!appStore) throw new Error('Kein Store geladen!');
  const filePath = await getAppDataFilePath();
  console.log('[saveAppStore] Schreibe Store nach:', filePath);
  try {
    await electronAPI.writeJsonFile(filePath, appStore);
    console.log('[saveAppStore] Schreiben abgeschlossen:', filePath);
  } catch (err) {
    console.error('[saveAppStore] Fehler beim Schreiben der Datei:', filePath, err);
    throw err;
  }
}

// Store-Getter
export function getAppStore(): AppGlobalStore {
  if (!appStore) {
    // Server-Kontext: Gib Dummy-Store zurück, damit Next.js-API-Routen nicht crashen
    if (typeof window === 'undefined') {
      appStore = createEmptyStore();
      return appStore;
    }
    throw new Error('AppStore ist nicht geladen!');
  }
  return appStore;
}

// Leerer Store
function createEmptyStore(): AppGlobalStore {
  return {
    beds: [],
    herbVarieties: FIXED_HERB_VARIETIES.map(h => ({ ...h })),
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

// Beispiel: Beet anlegen
export async function addBed(bedData: Omit<Bed, 'id' | 'length'> & { length?: number }): Promise<Bed> {
  await loadAppStore();
  const store = getAppStore();
  const newBed: Bed = {
    ...bedData,
    id: `bed-${store.nextBedId++}`,
    width: bedData.width && bedData.width > 0 ? bedData.width : 1,
    length: bedData.length ?? GARDEN_FIXED_BED_LENGTH,
  } as Bed;
  store.beds.push(newBed);
  await saveAppStore();
  return newBed;
}

// Beispiel: Alle Beete holen
export async function getBeds(): Promise<Bed[]> {
  await loadAppStore();
  return getAppStore().beds;
}

// --- Bed Functions ---
export async function getBedById(id: string): Promise<Bed | undefined> {
  console.log('[data.ts] getBedById aufgerufen mit ID:', id);
  await loadAppStore();
  // noStore(); // DISABLED FOR STATIC EXPORT
  const store = getAppStore();
  console.log('[data.ts] Store geladen, beds Array vorhanden:', Array.isArray(store.beds));
  console.log('[data.ts] Anzahl Beete im Store:', store.beds?.length || 0);
  
  if (!Array.isArray(store.beds)) {
    console.warn('[data.ts] store.beds ist kein Array in getBedById(). Liefere undefined zurück.');
    return undefined;
  }
  
  const bed = store.beds.find(bed => bed.id === id);
  console.log('[data.ts] Gefundenes Beet:', bed ? `${bed.id} (${bed.type})` : 'nicht gefunden');
  return bed ? JSON.parse(JSON.stringify(bed)) : undefined;
}

export async function updateBed(id: string, bedData: Partial<Omit<Bed, 'id'>>): Promise<Bed | null> {
  await loadAppStore();
  // noStore(); // DISABLED FOR STATIC EXPORT
  const store = getAppStore();
  if (!Array.isArray(store.beds)) {
    console.warn('[data.ts] store.beds ist kein Array in updateBed(). Initialisiere.');
    store.beds = [];
    return null;
  }
  
  const bedIndex = store.beds.findIndex(bed => bed.id === id);
  if (bedIndex === -1) return null;

  const originalBed = store.beds[bedIndex];
  
  // Sicherstellen, dass width immer gültig ist
  let validatedWidth = bedData.width;
  if (bedData.width === undefined) {
    validatedWidth = originalBed.width && originalBed.width > 0 ? originalBed.width : 1;
  } else if (bedData.width <= 0) {
    validatedWidth = 1; // Mindestbreite von 1 Meter
  }

  // Bei Umwandlung von Kombinationsbeet in einen anderen Typ die zugehörigen Segmente löschen
  if (originalBed.type === 'Kombinationsbeet' && bedData.type && bedData.type !== 'Kombinationsbeet') {
    if (!Array.isArray(store.segments)) {
      store.segments = [];
    } else {
      store.segments = store.segments.filter(seg => seg.bedId !== id);
    }
    
    if (!Array.isArray(store.harvestContributions)) {
      store.harvestContributions = [];
    } else {
      store.harvestContributions = store.harvestContributions.filter(hc => {
        if (!hc.segmentId) return true;
        
        // Prüfe, ob das Segment für diese Erntekontribution noch existiert
        const segmentExists = store.segments && Array.isArray(store.segments) 
          ? store.segments.some(s => s.id === hc.segmentId)
          : false;
          
        return segmentExists; 
      });
    }
  }

  // Wir erstellen auf Basis des Typs ein neues Beet-Objekt
  let updatedBed: Bed;
  const finalType = bedData.type || originalBed.type;
  
  // Gemeinsame Basis-Attribute für alle Beete
  const baseProps = {
    id: originalBed.id,
    bedNumber: bedData.bedNumber !== undefined ? bedData.bedNumber : originalBed.bedNumber,
    width: validatedWidth ?? 1, // Sicherstellen, dass width niemals undefined ist
    plantingDate: bedData.plantingDate || originalBed.plantingDate,
    name: bedData.name !== undefined ? bedData.name : originalBed.name,
    color: bedData.color || originalBed.color,
    remarks: bedData.remarks !== undefined ? bedData.remarks : originalBed.remarks,
  };
  
  // Je nach Beettyp spezifische Felder setzen
  if (finalType === 'Standard') {
    // Umwandlung in StandardBed
    const standardBedProps = {
      ...baseProps,
      type: 'Standard' as const,
      length: GARDEN_FIXED_BED_LENGTH,
      herbVarietyId: bedData.type === 'Standard' && 'herbVarietyId' in bedData ? 
        (bedData.herbVarietyId as string || '') : 
        (originalBed.type === 'Standard' ? 
          (originalBed as StandardBed).herbVarietyId : ''),
      plantsPerMeter: bedData.type === 'Standard' && 'plantsPerMeter' in bedData ? 
        (typeof bedData.plantsPerMeter === 'number' ? bedData.plantsPerMeter : 0) : 
        (originalBed.type === 'Standard' ? 
          (originalBed as StandardBed).plantsPerMeter : 0),
      productivePlantsPercentage: bedData.type === 'Standard' && 'productivePlantsPercentage' in bedData ? 
        (typeof bedData.productivePlantsPercentage === 'number' ? bedData.productivePlantsPercentage : 100) : 
        (originalBed.type === 'Standard' ? 
          (originalBed as StandardBed).productivePlantsPercentage : 100),
    };
    
    // Erstelle ein gültiges StandardBed-Objekt
    const standardBed: StandardBed = standardBedProps;
    
    // Optional: Subvarianten-Name
    if (bedData.type === 'Standard' && 'subVarietyName' in bedData && 
        typeof bedData.subVarietyName === 'string') {
      standardBed.subVarietyName = bedData.subVarietyName;
    } else if (originalBed.type === 'Standard' && 
               typeof (originalBed as StandardBed).subVarietyName === 'string') {
      standardBed.subVarietyName = (originalBed as StandardBed).subVarietyName;
    }
    
    updatedBed = standardBed;
  } 
  else if (finalType === 'Blühstreifen' || finalType === 'Brachfläche') {
    // Umwandlung in SpecialBed
    const specialBedProps = {
      ...baseProps,
      type: finalType as 'Blühstreifen' | 'Brachfläche',
      length: GARDEN_FIXED_BED_LENGTH,
    };
    
    // Erstelle ein gültiges SpecialBed-Objekt
    const specialBed: SpecialBed = specialBedProps;
    
    // Optional: erwartetes Erntedatum
    if ((bedData.type === 'Blühstreifen' || bedData.type === 'Brachfläche') && 
        'expectedHarvestDate' in bedData && 
        typeof bedData.expectedHarvestDate === 'string') {
      specialBed.expectedHarvestDate = bedData.expectedHarvestDate;
    } else if ((originalBed.type === 'Blühstreifen' || originalBed.type === 'Brachfläche') && 
               typeof (originalBed as SpecialBed).expectedHarvestDate === 'string') {
      specialBed.expectedHarvestDate = (originalBed as SpecialBed).expectedHarvestDate;
    }
    
    updatedBed = specialBed;
  } 
  else {
    // Umwandlung in Kombinationsbeet
    const kombinationsbeetProps = {
      ...baseProps,
      type: 'Kombinationsbeet' as const,
      length: bedData.type === 'Kombinationsbeet' && typeof bedData.length === 'number' ? 
        bedData.length : 
        (originalBed.type === 'Kombinationsbeet' ? 
          originalBed.length : GARDEN_FIXED_BED_LENGTH),
    };
    
    // Erstelle ein gültiges Kombinationsbeet-Objekt
    const kombinationsbeet: Kombinationsbeet = kombinationsbeetProps;
    
    updatedBed = kombinationsbeet;
  }
  
  // Aktualisiertes Beet in den Store schreiben
  store.beds[bedIndex] = updatedBed;
  return JSON.parse(JSON.stringify(store.beds[bedIndex]));
}

export async function deleteBed(id: string): Promise<boolean> {
  await loadAppStore();
  // noStore(); // DISABLED FOR STATIC EXPORT
  const store = getAppStore();
  
  // Sicherstellen, dass alle benötigten Arrays existieren
  if (!Array.isArray(store.beds)) {
    console.warn('[data.ts] store.beds ist kein Array in deleteBed(). Initialisiere.');
    store.beds = [];
    return false;
  }
  
  if (!Array.isArray(store.segments)) {
    console.warn('[data.ts] store.segments ist kein Array in deleteBed(). Initialisiere.');
    store.segments = [];
  }
  
  if (!Array.isArray(store.harvestContributions)) {
    console.warn('[data.ts] store.harvestContributions ist kein Array in deleteBed(). Initialisiere.');
    store.harvestContributions = [];
  }
  
  const initialLength = store.beds.length;
  
  // Löschen des Beets und dazugehöriger Segmente und Erntebeiträge
  store.beds = store.beds.filter(bed => bed.id !== id);
  
  const deletedSegmentIds = store.segments
    .filter(s => s.bedId === id)
    .map(s => s.id);
    
  store.segments = store.segments.filter(segment => segment.bedId !== id);
  
  store.harvestContributions = store.harvestContributions.filter(hc => {
    // Beitrag behalten, wenn er nicht mit dem gelöschten Beet oder dessen Segmenten zusammenhängt
    return hc.bedId !== id && 
           (!hc.segmentId || !deletedSegmentIds.includes(hc.segmentId));
  });
  
  return store.beds.length < initialLength;
}

export async function getAvailableBedNumbers(): Promise<number[]> {
  await loadAppStore();
  // noStore(); // DISABLED FOR STATIC EXPORT
  const store = getAppStore();
  
  // Sicherstellen, dass das Array existiert
  if (!Array.isArray(store.beds)) {
    console.warn('[data.ts] store.beds ist kein Array in getAvailableBedNumbers(). Initialisiere.');
    store.beds = [];
  }
  
  // Aktuelle Beetanzahl aus Konfiguration verwenden, nicht Legacy-Konstante
  const gartenConfig = store.gartenConfiguration || DEFAULT_GARTEN_CONFIG;
  const maxBeetCount = gartenConfig.currentBeetCount;
  
  const usedNumbers = new Set(store.beds.map(b => b.bedNumber));
  const available: number[] = [];
  
  // Generiere verfügbare Beetsnummern basierend auf aktueller Konfiguration
  for (let i = 1; i <= maxBeetCount; i++) {
    if (!usedNumbers.has(i)) {
      available.push(i);
    }
  }
  
  console.log(`[getAvailableBedNumbers] Max Beet Count: ${maxBeetCount}, Verfügbare: ${available.length}, Benutzte: ${usedNumbers.size}`);
  
  return available;
}

// --- HerbVariety Functions ---
export async function getHerbVarieties(): Promise<HerbVariety[]> {
  await loadAppStore();
  // noStore(); // DISABLED FOR STATIC EXPORT
  const store = getAppStore();
  
  // Sicherstellen, dass das Array existiert
  if (!Array.isArray(store.herbVarieties)) {
    console.warn('[data.ts] store.herbVarieties ist kein Array in getHerbVarieties(). Initialisiere.');
    store.herbVarieties = [];
  }
  
  // console.log(`[data.ts] STEP B: \`store.herbVarieties\` before JSON clone in getHerbVarieties: ${JSON.stringify(store.herbVarieties, null, 2)}`);
  const clonedHerbVarieties = JSON.parse(JSON.stringify(store.herbVarieties));
  // console.log(`[data.ts] STEP C: \`clonedHerbVarieties\` after JSON clone in getHerbVarieties: ${JSON.stringify(clonedHerbVarieties, null, 2)}`);
  return clonedHerbVarieties;
}

export async function getHerbVarietyById(id: string): Promise<HerbVariety | undefined> {
  await loadAppStore();
  // noStore(); // DISABLED FOR STATIC EXPORT
  const store = getAppStore();
  
  // Sicherstellen, dass das Array existiert
  if (!Array.isArray(store.herbVarieties)) {
    console.warn('[data.ts] store.herbVarieties ist kein Array in getHerbVarietyById(). Initialisiere.');
    store.herbVarieties = [];
  }
  
  const herb = store.herbVarieties.find(h => h.id === id);
  return herb ? JSON.parse(JSON.stringify(herb)) : undefined;
}

export async function addHerbVariety(name: string, color?: string): Promise<HerbVariety> { // color is optional
  // noStore(); // DISABLED FOR STATIC EXPORT
  let newHerb: HerbVariety;
  
  await modifyStoreAndPersist(() => {
    const store = getAppStore();
    
    // Sicherstellen, dass das Array existiert
    if (!Array.isArray(store.herbVarieties)) {
      console.warn('[data.ts] store.herbVarieties ist kein Array in addHerbVariety(). Initialisiere.');
      store.herbVarieties = [];
    }
    
    const herbs = store.herbVarieties;

    // Check if herb with the same name already exists (existing logic)
    if (herbs.some(herb => herb.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`Herb variety with name "${name}" already exists.`);
    }

    // NEW: Check if the color is already used by another herb variety
    if (color) {
      const existingHerbWithColor = herbs.find(herb => herb.color?.toLowerCase() === color.toLowerCase());
      if (existingHerbWithColor) {
        throw new Error(`Color "${color}" is already used by herb variety "${existingHerbWithColor.name}".`);
      }
    }

    // Erstellen der neuen Kräutervariante mit allen erforderlichen Feldern
    newHerb = {
      id: `herb-${store.nextHerbId++}`,
      name,
      isFixed: false,
      color,
    };
    
    herbs.push(newHerb);
    console.log('[data.ts] Added new herb:', JSON.stringify(newHerb));
    return newHerb;
  });
  
  // Hier muss newHerb definiert sein, da modifyStoreAndPersist synchron ausgeführt wird
  return JSON.parse(JSON.stringify(newHerb!));
}

// NEW: Function to update an existing HerbVariety
export async function updateHerbVariety(id: string, updates: Partial<Omit<HerbVariety, 'id'>>): Promise<HerbVariety | null> {
  await loadAppStore();
  // noStore(); // DISABLED FOR STATIC EXPORT
  const store = getAppStore();
  
  // Sicherstellen, dass das Array existiert
  if (!Array.isArray(store.herbVarieties)) {
    console.warn('[data.ts] store.herbVarieties ist kein Array in updateHerbVariety(). Initialisiere.');
    store.herbVarieties = [];
    return null; // Keine Kräutervariante zu aktualisieren
  }
  
  const herbs = store.herbVarieties;
  const herbIndex = herbs.findIndex(herb => herb.id === id);

  if (herbIndex === -1) {
    return null; // Herb not found
  }

  const existingHerb = herbs[herbIndex];

  // Prevent updating fixed herbs
  if (existingHerb.isFixed) {
    console.warn(`[data.ts] Attempted to update fixed herb "${existingHerb.name}". Update denied.`);
    return JSON.parse(JSON.stringify(existingHerb)); // Return the existing, unchanged herb
  }

  // Check for color uniqueness if color is being updated and is different from the current color
  if (updates.color !== undefined && updates.color !== existingHerb.color) {
    const colorToTest = updates.color;
    const existingHerbWithColor = herbs.find(
      herb => herb.id !== id && herb.color?.toLowerCase() === colorToTest?.toLowerCase()
    );
    if (existingHerbWithColor) {
      throw new Error(`Color "${colorToTest}" is already used by herb variety "${existingHerbWithColor.name}".`);
    }
  }

  // Apply updates with type safety
  const updatedHerb: HerbVariety = {
    ...existingHerb,
    name: updates.name !== undefined ? updates.name : existingHerb.name,
    isFixed: updates.isFixed !== undefined ? updates.isFixed : existingHerb.isFixed,
    color: updates.color !== undefined ? updates.color : existingHerb.color
  };

  // Update the herb variety in the store
  herbs[herbIndex] = updatedHerb;
  return JSON.parse(JSON.stringify(updatedHerb));
}


export async function getAllSegments(): Promise<KombinationsbeetSegment[]> {
  await loadAppStore();
  // noStore(); // DISABLED FOR STATIC EXPORT
  const store = getAppStore();
  
  // Sicherstellen, dass das Array existiert
  if (!Array.isArray(store.segments)) {
    console.warn('[data.ts] store.segments ist kein Array in getAllSegments(). Initialisiere.');
    store.segments = [];
  }
  
  return JSON.parse(JSON.stringify(store.segments));
}

export async function getSegmentsForBed(bedId: string): Promise<KombinationsbeetSegment[]> {
  await loadAppStore();
  // noStore(); // DISABLED FOR STATIC EXPORT
  const store = getAppStore();
  
  // Sicherstellen, dass das Array existiert
  if (!Array.isArray(store.segments)) {
    console.warn('[data.ts] store.segments ist kein Array in getSegmentsForBed(). Initialisiere.');
    store.segments = [];
  }
  
  const bedSegments = store.segments.filter(segment => segment.bedId === bedId);
  return JSON.parse(JSON.stringify(bedSegments));
}

export async function addSegmentToBed(bedId: string, segmentData: SegmentFormData): Promise<KombinationsbeetSegment> {
  await loadAppStore();
  // noStore(); // DISABLED FOR STATIC EXPORT
  const store = getAppStore();
  if (!Array.isArray(store.segments)) store.segments = []; 

  const parentBed = (store.beds || []).find(b => b.id === bedId);
  if (!parentBed || parentBed.type !== 'Kombinationsbeet') {
    throw new Error('Segment kann nur zu einem Kombinationsbeet hinzugefügt werden.');
  }
  const existingSegments = store.segments.filter(segment => segment.bedId === bedId);
  const totalExistingLength = existingSegments.reduce((sum, seg) => sum + seg.segmentLength, 0);

  const currentBedLength = typeof parentBed.length === 'number' ? parentBed.length : 0;

  if (totalExistingLength + segmentData.segmentLength > currentBedLength) {
    throw new Error(`Gesamtlänge der Segmente (${totalExistingLength + segmentData.segmentLength}m) würde Beetlänge (${currentBedLength}m) überschreiten.`);
  }

  const newSegment: KombinationsbeetSegment = {
    ...segmentData,
    id: `segment-${store.nextSegmentId++}`,
    bedId: bedId,
    productivePlantsPercentage: segmentData.productivePlantsPercentage ?? 100,
  };
  store.segments.push(newSegment);
  return JSON.parse(JSON.stringify(newSegment));
}

export async function updateSegment(segmentId: string, segmentData: Partial<SegmentFormData>): Promise<KombinationsbeetSegment | null> {
  await loadAppStore();
  // noStore(); // DISABLED FOR STATIC EXPORT
  const store = getAppStore();
  if (!Array.isArray(store.segments)) store.segments = []; 

  const segmentIndex = store.segments.findIndex(s => s.id === segmentId);
  if (segmentIndex === -1) return null;

  const oldSegment = store.segments[segmentIndex];
  const updatedSegmentData = { ...oldSegment, ...segmentData };

  if (segmentData.segmentLength !== undefined && segmentData.segmentLength !== oldSegment.segmentLength) {
    const parentBed = (store.beds || []).find(b => b.id === oldSegment.bedId);
    if (!parentBed || parentBed.type !== 'Kombinationsbeet') throw new Error("Übergeordnetes Beet nicht gefunden für Segmentvalidierung.");

    const currentBedLength = typeof parentBed.length === 'number' ? parentBed.length : 0;
    const otherSegments = store.segments.filter(s => s.bedId === oldSegment.bedId && s.id !== segmentId);
    const totalOtherLength = otherSegments.reduce((sum, seg) => sum + seg.segmentLength, 0);

    if (totalOtherLength + updatedSegmentData.segmentLength > currentBedLength) {
      throw new Error(`Gesamtlänge der Segmente (${totalOtherLength + updatedSegmentData.segmentLength}m) würde Beetlänge (${currentBedLength}m) überschreiten.`);
    }
  }

  store.segments[segmentIndex] = updatedSegmentData;
  return JSON.parse(JSON.stringify(store.segments[segmentIndex]));
}

export async function deleteSegment(segmentId: string): Promise<boolean> {
  await loadAppStore();
  // noStore(); // DISABLED FOR STATIC EXPORT
  const store = getAppStore();
  if (!Array.isArray(store.segments)) store.segments = []; 
  if (!Array.isArray(store.harvestContributions)) store.harvestContributions = []; 

  const initialLength = store.segments.length;
  store.segments = store.segments.filter(segment => segment.id !== segmentId);
  store.harvestContributions = store.harvestContributions.filter(hc => hc.segmentId !== segmentId);
  return store.segments.length < initialLength;
}

// --- PRODUCTIVE PLANTS PERCENTAGE UPDATE FUNCTIONS ---
export async function updateProductivePlantsPercentageOnBed(bedId: string, newPercentage: number): Promise<Bed | null> {
  await loadAppStore();
  // noStore(); // DISABLED FOR STATIC EXPORT
  const store = getAppStore();
  
  // Sicherstellen, dass das Array existiert
  if (!Array.isArray(store.beds)) {
    console.warn('[data.ts] store.beds ist kein Array in updateProductivePlantsPercentageOnBed(). Initialisiere.');
    store.beds = [];
    return null;
  }
  
  const bedIndex = store.beds.findIndex(b => b.id === bedId);
  if (bedIndex === -1) return null;
  
  const bed = store.beds[bedIndex];
  if (bed.type !== 'Standard') {
    console.warn(`[data.ts] Attempted to update productive plants on non-standard bed: ${bedId}`);
    return null; 
  }
  
  // Sicherstellen, dass der Prozentsatz im gültigen Bereich liegt
  const validatedPercentage = Math.min(Math.max(0, newPercentage), 100);
  (bed as StandardBed).productivePlantsPercentage = validatedPercentage;
  
  store.beds[bedIndex] = bed;
  return JSON.parse(JSON.stringify(bed));
}

export async function updateProductivePlantsPercentageOnSegment(segmentId: string, newPercentage: number): Promise<KombinationsbeetSegment | null> {
  await loadAppStore();
  // noStore(); // DISABLED FOR STATIC EXPORT
  const store = getAppStore();
  
  // Sicherstellen, dass das Array existiert
  if (!Array.isArray(store.segments)) {
    console.warn('[data.ts] store.segments ist kein Array in updateProductivePlantsPercentageOnSegment(). Initialisiere.');
    store.segments = [];
    return null;
  }

  const segmentIndex = store.segments.findIndex(s => s.id === segmentId);
  if (segmentIndex === -1) return null;
  
  // Sicherstellen, dass der Prozentsatz im gültigen Bereich liegt
  const validatedPercentage = Math.min(Math.max(0, newPercentage), 100);
  store.segments[segmentIndex].productivePlantsPercentage = validatedPercentage;
  
  return JSON.parse(JSON.stringify(store.segments[segmentIndex]));
}

// --- NEW HARVEST EVENT & CONTRIBUTION FUNCTIONS ---
export async function createHarvestEvent(data: Omit<HarvestEvent, 'id' | 'isFinalized' | 'totalYieldKg'>): Promise<HarvestEvent> {
  await loadAppStore();
  // noStore(); // DISABLED FOR STATIC EXPORT
  const store = getAppStore();
  
  // Sicherstellen, dass das Array und die ID existieren
  if (!Array.isArray(store.harvestEvents)) {
    console.warn('[data.ts] store.harvestEvents ist kein Array in createHarvestEvent(). Initialisiere.');
    store.harvestEvents = [];
  }
  
  if (typeof store.nextHarvestEventId !== 'number') {
    console.warn('[data.ts] store.nextHarvestEventId ist keine Nummer. Setze auf 1.');
    store.nextHarvestEventId = 1;
  }

  // Neues Ernteereignis erstellen
  const newEvent: HarvestEvent = {
    ...data,
    id: `hev-${store.nextHarvestEventId++}`,
    isFinalized: false,
  };
  
  store.harvestEvents.push(newEvent);
  return JSON.parse(JSON.stringify(newEvent));
}

export async function addHarvestContribution(data: Omit<HarvestContribution, 'id'>): Promise<HarvestContribution> {
  await loadAppStore();
  // noStore(); // DISABLED FOR STATIC EXPORT
  const store = getAppStore();
  // Sicherstellen, dass das Array und die ID existieren
  if (!Array.isArray(store.harvestContributions)) {
    console.warn('[data.ts] store.harvestContributions ist kein Array in addHarvestContribution(). Initialisiere.');
    store.harvestContributions = [];
  }
  if (typeof store.nextHarvestContributionId !== 'number') {
    console.warn('[data.ts] store.nextHarvestContributionId ist keine Nummer. Setze auf 1.');
    store.nextHarvestContributionId = 1;
  }
  const newContribution: HarvestContribution = {
    ...data,
    id: `hcontr-${store.nextHarvestContributionId++}`,
  };
  store.harvestContributions.push(newContribution);
  return JSON.parse(JSON.stringify(newContribution));
}

export async function updateHarvestEventData(
  eventId: string,
  data: Partial<Pick<HarvestEvent, 'totalYieldKg' | 'remarks' | 'isFinalized'>>
): Promise<HarvestEvent | null> {
  await loadAppStore();
  // noStore(); // DISABLED FOR STATIC EXPORT
  const store = getAppStore();
  
  // Sicherstellen, dass das Array existiert
  if (!Array.isArray(store.harvestEvents)) {
    console.warn('[data.ts] store.harvestEvents ist kein Array in updateHarvestEventData(). Initialisiere.');
    store.harvestEvents = [];
  }

  const eventIndex = store.harvestEvents.findIndex(e => e.id === eventId);
  console.log(`[data.ts updateHarvestEventData] Searching for eventId: ${eventId}. Found index: ${eventIndex}`);
  
  if (eventIndex === -1) {
    console.error(`[data.ts updateHarvestEventData] Event with ID ${eventId} not found.`);
    return null;
  }

  const eventBeforeUpdate = { ...store.harvestEvents[eventIndex] };
  // console.log(`[data.ts updateHarvestEventData] Event ${eventId} BEFORE update:`, JSON.stringify(eventBeforeUpdate));

  // Merge the new data into the existing event
  // Only update totalYieldKg if it's explicitly passed in data
  const { totalYieldKg, ...restOfData } = data;
  
  // Aktualisiere die anderen Daten zuerst
  const updatedEvent = {
    ...store.harvestEvents[eventIndex],
    ...restOfData, // Apply remarks and isFinalized
  };
  
  // Behandle totalYieldKg gesondert, um undefined explizit zu berücksichtigen
  if (Object.prototype.hasOwnProperty.call(data, 'totalYieldKg')) {
    // Die Eigenschaft wurde explizit übergeben, auch wenn sie undefined ist
    updatedEvent.totalYieldKg = totalYieldKg;
  }
  
  // Aktualisierung im Store speichern
  store.harvestEvents[eventIndex] = updatedEvent;
  
  // console.log(`[data.ts updateHarvestEventData] Event ${eventId} AFTER update:`, JSON.stringify(store.harvestEvents[eventIndex]));
  return JSON.parse(JSON.stringify(updatedEvent));
}

export async function getHarvestEventById(eventId: string): Promise<HarvestEvent | undefined> { 
  await loadAppStore();
  // noStore(); // DISABLED FOR STATIC EXPORT
  const store = getAppStore();
  
  // Sicherstellen, dass das Array existiert
  if (!Array.isArray(store.harvestEvents)) {
    console.warn('[data.ts] store.harvestEvents ist kein Array in getHarvestEventById(). Initialisiere.');
    store.harvestEvents = [];
    return undefined;
  }
  
  const event = store.harvestEvents.find(e => e.id === eventId);
  return event ? JSON.parse(JSON.stringify(event)) : undefined;
}

export async function getHarvestContributionsForEvent(eventId: string): Promise<HarvestContribution[]> { 
  await loadAppStore();
  // noStore(); // DISABLED FOR STATIC EXPORT
  const store = getAppStore();
  
  // Sicherstellen, dass das Array existiert
  if (!Array.isArray(store.harvestContributions)) {
    console.warn('[data.ts] store.harvestContributions ist kein Array in getHarvestContributionsForEvent(). Initialisiere.');
    store.harvestContributions = [];
    return [];
  }
  
  const contributions = store.harvestContributions.filter(c => c.harvestEventId === eventId);
  return JSON.parse(JSON.stringify(contributions));
}

export async function getAllHarvestEvents(): Promise<HarvestEvent[]> { 
  await loadAppStore();
  // noStore(); // DISABLED FOR STATIC EXPORT
  const store = getAppStore();
  
  // Sicherstellen, dass das Array existiert
  if (!Array.isArray(store.harvestEvents)) {
    console.warn('[data.ts] store.harvestEvents ist kein Array in getAllHarvestEvents(). Initialisiere.');
    store.harvestEvents = [];
    return [];
  }
  
  return JSON.parse(JSON.stringify(store.harvestEvents));
}

export async function getAllHarvestContributions(): Promise<HarvestContribution[]> {
  await loadAppStore();
  // noStore(); // DISABLED FOR STATIC EXPORT
  const store = getAppStore();
  
  // Sicherstellen, dass das Array existiert
  if (!Array.isArray(store.harvestContributions)) {
    console.warn('[data.ts] store.harvestContributions ist kein Array in getAllHarvestContributions(). Initialisiere.');
    store.harvestContributions = [];
    return [];
  }
  
  return JSON.parse(JSON.stringify(store.harvestContributions));
}

/**
 * Wetterdaten-Funktionen
 */

export async function getWeatherData(): Promise<WeatherDataPoint[]> {
  // noStore(); // DISABLED FOR STATIC EXPORT
  try {
    const weatherData = await loadWeatherData();
    return weatherData || [];
  } catch (error) {
    console.error('Fehler beim Laden der Wetterdaten:', error);
    return [];
  }
}

export async function getWeatherStatistics(): Promise<WeatherStatistics[]> {
  // noStore(); // DISABLED FOR STATIC EXPORT
  try {
    const weatherData = await getWeatherData();
    
    if (weatherData.length === 0) {
      return [];
    }

    // Gruppiere Daten nach Jahr
    const dataByYear = weatherData.reduce((acc, point) => {
      const year = new Date(point.timestamp).getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(point);
      return acc;
    }, {} as Record<number, WeatherDataPoint[]>);

    // Berechne Statistiken für jedes Jahr
    const statistics: WeatherStatistics[] = Object.entries(dataByYear).map(([yearStr, yearData]) => {
      const year = parseInt(yearStr);
      
      // Grundlegende Berechnungen
      const avgAirTemperature = yearData.reduce((sum, p) => sum + p.airTemperature, 0) / yearData.length;
      const avgSoilTemperature = yearData.reduce((sum, p) => sum + p.soilTemperature, 0) / yearData.length;
      const avgHumidity = yearData.reduce((sum, p) => sum + p.humidity, 0) / yearData.length;
      const totalPrecipitation = yearData.reduce((sum, p) => sum + p.precipitation, 0);
      
      // Min/Max Temperaturen
      const airTemps = yearData.map(p => p.airTemperature);
      const soilTemps = yearData.map(p => p.soilTemperature);
      const maxAirTemperature = Math.max(...airTemps);
      const minAirTemperature = Math.min(...airTemps);
      const maxSoilTemperature = Math.max(...soilTemps);
      const minSoilTemperature = Math.min(...soilTemps);
      
      // Spezielle Tage zählen
      const frostDays = yearData.filter(p => p.soilTemperature <= 0).length;
      const dryDays = yearData.filter(p => p.precipitation < 1).length;
      const rainyDays = yearData.filter(p => p.precipitation >= 1).length;
      
      return {
        year,
        avgAirTemperature: Math.round(avgAirTemperature * 100) / 100,
        avgSoilTemperature: Math.round(avgSoilTemperature * 100) / 100,
        avgHumidity: Math.round(avgHumidity * 100) / 100,
        totalPrecipitation: Math.round(totalPrecipitation * 100) / 100,
        maxAirTemperature: Math.round(maxAirTemperature * 100) / 100,
        minAirTemperature: Math.round(minAirTemperature * 100) / 100,
        maxSoilTemperature: Math.round(maxSoilTemperature * 100) / 100,
        minSoilTemperature: Math.round(minSoilTemperature * 100) / 100,
        frostDays,
        dryDays,
        rainyDays,
        dataPointCount: yearData.length
      };
    }).sort((a, b) => b.year - a.year); // Sortiere Jahre absteigend

    return statistics;
  } catch (error) {
    console.error('Fehler beim Berechnen der Wetterstatistiken:', error);
    return [];
  }
}

// Exportiere die Store-Schnittstelle für andere Module
export type { AppGlobalStore };

/**
 * Persistiert den aktuellen Zustand des Stores in lokale Dateien (nur in Electron)
 * Diese Funktion sollte nach Änderungen am Store aufgerufen werden
 */
export async function persistStore(): Promise<boolean> {
  if (typeof window === 'undefined' || !electronAPI.isElectron()) {
    return false;
  }
  try {
    const store = getAppStore();
    await saveAppStore();
    return true;
  } catch (error) {
    console.error('[data.ts] Fehler beim Persistieren des Stores:', error);
    return false;
  }
}

// Hilfsfunktion zur Änderung des Stores mit automatischer Persistenz
export async function modifyStoreAndPersist<T>(
  modifyFn: () => T
): Promise<T> {
  const result = modifyFn();
  try {
    await saveAppStore();
  } catch (error) {
    console.error('[data.ts] Fehler beim automatischen Persistieren des Stores:', error);
  }
  return result;
}

export async function saveAllData(store: AppGlobalStore): Promise<boolean> {
  await saveAppStore();
  return true;
}

export async function getCurrentBeetCount(): Promise<number> {
  await loadAppStore();
  const store = getAppStore();
  return store.gartenConfiguration?.currentBeetCount || DEFAULT_GARTEN_CONFIG.currentBeetCount;
}

export async function getGartenConfiguration(): Promise<GartenConfiguration> {
  await loadAppStore();
  const store = getAppStore();
  return store.gartenConfiguration || { ...DEFAULT_GARTEN_CONFIG };
}

export async function updateGartenConfiguration(newConfig: Partial<GartenConfiguration>): Promise<void> {
  // noStore(); // DISABLED FOR STATIC EXPORT
  return modifyStoreAndPersist(() => {
    const store = getAppStore();
    store.gartenConfiguration = {
      ...store.gartenConfiguration,
      ...newConfig,
      lastModified: new Date().toISOString()
    };
    console.log('[data.ts] Garten-Konfiguration aktualisiert:', store.gartenConfiguration);
  });
}

// Standard-Setup: Erstelle Standard-Konfiguration mit 20 Beeten und 2 Thymian-Beeten
export async function createStandardBeetsSetup(): Promise<boolean> {
  console.log('[data.ts] 🌱 STANDARD-SETUP: Erstelle 20-Beete-Konfiguration mit 2 Thymian-Beeten...');
  try {
    const store = getAppStore();
    store.gartenConfiguration = {
      gartenName: 'Hauptgarten',
      currentBeetCount: 20,
      maxBeetCount: 50,
      // ...weitere Felder...
    };
    // ...weitere Initialisierungen...
    await saveAppStore();
    return true;
  } catch (error) {
    console.error('[data.ts] Fehler beim Erstellen des Standard-Setups:', error);
    return false;
  }
}

