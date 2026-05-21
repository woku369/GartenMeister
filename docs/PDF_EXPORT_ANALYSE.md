# PDF-Export Analyse und Implementierungskonzept

## 1. UI-Analyse

### 1.1 Konstanten und Maßeinheiten
```typescript
// Breiten und Maße
const REFERENCE_WIDTH_UNOCCUPIED_M = 1.5;  // Standardbreite in Metern
const REFERENCE_WIDTH_UNOCCUPIED_PX = 48;  // w-12 in Tailwind (48px)
const PIXELS_PER_METER = 32;               // 48px / 1.5m = 32px/m

// Farben
const DEFAULT_SEGMENT_COLOR = 'rgba(220, 220, 220, 0.8)';
const UNOCCUPIED_BED_COLOR = 'hsl(var(--card))';
const UNOCCUPIED_SEGMENT_COLOR = 'hsl(var(--card))';
```

### 1.2 Berechnungslogik

#### Beetbreiten
1. Standardbeete
   - Breite basiert auf REFERENCE_WIDTH_UNOCCUPIED_M (1.5m)
   - Pixelbreite = Breite_in_Metern * PIXELS_PER_METER
   - Tailwind-Klassen: w-12 für 1.5m (48px)

2. Versuchsbeete
   - Segmentierung basiert auf position und segmentLength
   - Jedes Segment hat eigene Breite und Farbe
   - Gesamtbreite = Summe der Segmentbreiten

#### Pflanzenberechnung
```typescript
const calculateInitialPlants = (entity) => {
  const length = 'segmentLength' in entity ? entity.segmentLength : entity.length;
  return Math.floor(length * entity.plantsPerMeter);
};

const calculateCurrentPlants = (entity) => {
  const initialPlants = calculateInitialPlants(entity);
  return Math.floor(initialPlants * (entity.productivePlantsPercentage / 100));
};
```

### 1.3 Layout-Struktur

1. Container
   ```html
   <div className="grid gap-8 pb-8">
     <BeeteVisualisierung />
     <BeetTabelle />
   </div>
   ```

2. Beetvisualisierung
   ```html
   <div className="flex flex-wrap gap-4 items-start">
     {/* Beete 1-26 */}
   </div>
   ```

3. Einzelnes Beet
   ```html
   <div className="relative rounded-lg" style={{
     width: `${width}px`,
     backgroundColor: color
   }}>
     <div className="absolute inset-0 border border-gray-300"></div>
     {/* Beet-Inhalt */}
   </div>
   ```

### 1.4 Tabellendarstellung

1. Struktur
   ```html
   <Table>
     <TableHeader>
       <TableRow>
         <TableHead>Nr.</TableHead>
         <TableHead>Typ</TableHead>
         <TableHead>Kräuter</TableHead>
         <TableHead>Details</TableHead>
       </TableRow>
     </TableHeader>
     <TableBody>
       {/* Beetdaten */}
     </TableBody>
   </Table>
   ```

2. Datenfelder pro Zeile
   - Beetnummer (1-26)
   - Beettyp (Standard/Versuch)
   - Kräutersorten
   - Pflanzdatum
   - Pflanzenanzahl (initial/aktuell)
   - Bemerkungen

### 1.5 Farbsystem

1. Kräuterfarben
   - Aus HerbVariety.color
   - Fallback: DEFAULT_SEGMENT_COLOR

2. Status-Indikation
   - Unbesetzt: UNOCCUPIED_BED_COLOR
   - Segment: color oder UNOCCUPIED_SEGMENT_COLOR
   - Border: border-gray-300

## 2. Technische Anforderungen

### 2.1 PDF-Generierung
1. Verwendung von pdfmake (bewährt im alten Projekt)
2. Exakte Übertragung der UI-Maße und Farben
3. Querformat (landscape) mit korrekten Margins

### 2.2 Komponenten
1. PDFGenerator Klasse
   - Initialisierung mit Beetdaten
   - Methoden für Layout und Styling
   - Separate Methoden für Visualisierung und Tabelle

2. Export-Button Komponente
   - Datenaufbereitung
   - Progress-Indikator
   - Fehlerbehandlung

### 2.3 Datenstrukturen
```typescript
interface GardenPDFData {
  beds: BaseBed[];
  segments: VersuchsbeetSegment[];
  herbVarieties: HerbVariety[];
}
```

## 3. Nächste Schritte

1. [x] UI-Analyse und Dokumentation
2. [ ] PDF-Generator mit pdfmake implementieren
   - [ ] Grundstruktur und Styling
   - [ ] Beetvisualisierung
   - [ ] Tabellendarstellung
3. [ ] Visuelles Testsystem entwickeln
   - [ ] UI-Screenshot vs. PDF-Vergleich
   - [ ] Maßgenauigkeit prüfen
   - [ ] Druckqualität validieren
