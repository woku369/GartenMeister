export const HERB_COLOR_PALETTE = [
  // Gelbgrün bis Hellgrün
  '#E6FF2A', // Neuer Ton: Hellgelbgrün (höherer Gelbanteil)
  '#D4E225', // Neuer Ton: Reiches Gelbgrün (höherer Gelbanteil)
  '#ADFF2F', // GreenYellow
  '#90EE90', // LightGreen
  '#98FB98', // PaleGreen
  '#8FBC8F', // DarkSeaGreen (hat einen leichten Graustich, aber noch grünlich)
  
  // Mittlere Grüntöne
  '#3CB371', // MediumSeaGreen
  '#2E8B57', // SeaGreen
  '#32CD32', // LimeGreen
  '#00FF7F', // SpringGreen
  '#7CFC00', // LawnGreen

  // Dunklere Grüntöne
  '#008000', // Green
  '#228B22', // ForestGreen
  '#006400', // DarkGreen
  '#556B2F', // DarkOliveGreen
  '#6B8E23', // OliveDrab (erdiges Dunkelgrün)

  // Einige der vorherigen, falls sie thematisch noch passen oder für Kontrast
  '#4682B4', // SteelBlue (als Kontrast falls benötigt, eher blau)
  '#6A5ACD', // SlateBlue (als Kontrast falls benötigt, eher lila)
];

export type HerbVariety = {
  id: string;
  isFixed: boolean;
  name: string;
  color?: string; 
  remarks?: string; // Neu: Bemerkungsfeld für Notizen
};

export type BedType = 'Standard' | 'Blühstreifen' | 'Brachfläche' | 'Kombinationsbeet';

export interface BaseBed {
  id: string;
  bedNumber: number;
  type: BedType;
  width: number;
  length: number;
  plantingDate: string;
  remarks?: string;
  name: string;
  color: string;
}

export interface StandardBed extends BaseBed {
  type: 'Standard';
  herbVarietyId: string;
  subVarietyName?: string;
  plantsPerMeter: number;
  productivePlantsPercentage: number; // 0-100 - Aktueller Wert auf dem Beet
}

export interface SpecialBed extends BaseBed {
  type: 'Blühstreifen' | 'Brachfläche';
  expectedHarvestDate?: string;
}

export interface Kombinationsbeet extends BaseBed {
  type: 'Kombinationsbeet';
}

export type Bed = StandardBed | SpecialBed | Kombinationsbeet;

export type KombinationsbeetSegment = {
  id: string;
  bedId: string;
  segmentLength: number;
  herbVarietyId: string;
  subVarietyName?: string;
  plantsPerMeter: number;
  productivePlantsPercentage: number; // 0-100 - Aktueller Wert auf dem Segment
  plantingDate: string;
  remarks?: string;
};

// Rückwärtskompatibilität - Alias für KombinationsbeetSegment
export type VersuchsbeetSegment = KombinationsbeetSegment;

// Alter Harvest-Typ - wird durch HarvestEvent und HarvestContribution ersetzt
// Vorübergehend wieder einkommentiert, um Build-Fehler in bestehenden Komponenten zu beheben
export type Harvest = {
  id: string;
  bedId: string;
  segmentId?: string;
  harvestDate: string;
  herbVarietyId: string; // Kann auch eine generische ID wie 'generic-yield-type' für Blühstreifen etc. sein
  yieldKg: number;
  remarks?: string;
};


// NEUE DATENMODELLE FÜR GLOBALEN ERNTE-WORKFLOW
export type HarvestEvent = {
  id: string;
  herbVarietyId: string;
  harvestDateStart: string; // ISO-Datum
  harvestDateEnd?: string;   // ISO-Datum, optional
  totalYieldKg?: number;   // Wird erst am Ende erfasst
  remarks?: string;
  isFinalized: boolean;   // true, wenn totalYieldKg erfasst wurde
};

export type HarvestContribution = {
  id: string;
  harvestEventId: string;     // ID des zugehörigen HarvestEvent
  bedId: string;              // ID des Beets (StandardBed oder Kombinationsbeet)
  segmentId?: string;        // ID des Segments, falls Ernte von einem Kombinationsbeet-Segment stammt
  productivePlantsPercentageAtHarvestTime: number; // Der für diesen Schnitt spezifische Prozentsatz (0-100)
  // Optional: Speichern des vorherigen Wertes, falls benötigt für Historie oder Undo
  // originalBedProductivePlantsPercentageBeforeThisHarvest?: number; 
  notesOnProductivityChange?: string; // Optionale Notiz zur Änderung der Produktivität
};


// For Bed Forms
export type BedFormData = {
  bedNumber: number;
  type: BedType;
  width: number;
  length?: number;
  plantingDate: string;
  remarks?: string;
  color: string;
  herbVarietyId?: string;
  subVarietyName?: string;
  plantsPerMeter?: number;
  productivePlantsPercentage?: number;
  expectedHarvestDate?: string;
};

export type SegmentFormData = Omit<KombinationsbeetSegment, 'id' | 'bedId'>;

export const GARDEN_TOTAL_WIDTH = 87;
export const GARDEN_FIXED_BED_LENGTH = 43;
export const BED_SPACING = 0.5;

// PHASE 1: Flexible Beetanzahl - Neue Konfiguration
export interface GartenConfiguration {
  currentBeetCount: number;        // Aktuelle Beetanzahl (1-50)
  maxBeetCount: number;           // Maximum verfügbare Beete (derzeit 50)
  activeBeetIds: string[];        // Liste aktiver Beet-IDs
  inactiveBeetIds: string[];      // Liste inaktiver Beet-IDs
  gartenName?: string;            // Optional: Name des Gartens
  lastModified: string;           // ISO-Datum der letzten Änderung
}

// Standard-Konfiguration für neue Installationen
export const DEFAULT_GARTEN_CONFIG: GartenConfiguration = {
  currentBeetCount: 20,              // Standard: 20 Beete (geändert von 6)
  maxBeetCount: 50,                // Erweiterbar bis 50 Beete
  activeBeetIds: Array.from({length: 20}, (_, i) => `bed-${i + 1}`), // Standard-Beet-IDs für 20 Beete (korrigiert: bed- statt beet-)
  inactiveBeetIds: [],             // Wird dynamisch gefüllt
  gartenName: "Hauptgarten",       // Standard-Name
  lastModified: new Date().toISOString()
};

export const FIXED_HERB_VARIETIES: HerbVariety[] = [
  { id: "fixed-herb-1", name: "Thymian", isFixed: true, color: "#8FBC8F" }, // DarkSeaGreen
  { id: "fixed-herb-2", name: "Oregano", isFixed: true, color: "#98FB98" }, // PaleGreen
  { id: "fixed-herb-3", name: "Salbei", isFixed: true, color: "#2E8B57" }, // SeaGreen
  { id: "fixed-herb-4", name: "Zitronenmelisse", isFixed: true, color: "#ADFF2F" }, // GreenYellow
  { id: "fixed-herb-5", name: "Pfefferminze", isFixed: true, color: "#3CB371" }, // MediumSeaGreen
  { id: "fixed-herb-6", name: "Schokominze", isFixed: true, color: "#556B2F" }, // DarkOliveGreen
];

export type WeatherDataPoint = {
  id: string;
  timestamp: string; // ISO date string
  airTemperature: number; // Lufttemperatur in °C
  soilTemperature: number; // Bodentemperatur in °C
  humidity: number; // Luftfeuchtigkeit in %
  windSpeed: number; // Windgeschwindigkeit in km/h
  precipitation: number; // Niederschlag in mm
  condition: string; // Wetterbedingung (z.B. "sunny", "cloudy", "rain")
  pressure?: number; // Luftdruck in hPa (optional)
  visibility?: number; // Sichtweite in km (optional)
  uvIndex?: number; // UV-Index (optional)
};

export type WeatherStatistics = {
  year: number;
  month?: number; // Optional für Monatsstatistiken
  avgAirTemperature: number;
  avgSoilTemperature: number;
  avgHumidity: number;
  totalPrecipitation: number;
  maxAirTemperature: number;
  minAirTemperature: number;
  maxSoilTemperature: number;
  minSoilTemperature: number;
  frostDays: number; // Tage mit Bodentemperatur <= 0°C
  dryDays: number; // Tage mit Niederschlag < 1mm
  rainyDays: number; // Tage mit Niederschlag >= 1mm
  dataPointCount: number; // Anzahl der Messungen
};
