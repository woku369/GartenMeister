# Bildersammlung - Feature-Dokumentation

## Übersicht
Das **Image Management System** für GartenMeister ermöglicht es, Gartenfotos zentral zu verwalten, chronologisch zu sortieren und mit Kommentaren zu versehen. Perfekt für die Dokumentation von Pflanzenwachstum, Ernten und Gartenprojekten.

## Features

### 📸 **Bildverwaltung**
- **Multi-Upload**: Mehrere Bilder gleichzeitig hochladen
- **Batch-Import**: Komplette Ordner importieren
- **Automatische Metadaten**: Dateiinfos, EXIF-Daten, Aufnahmedatum
- **Dateiformate**: JPG, PNG, GIF, WebP, BMP, TIFF, SVG
- **Größenlimit**: 50MB pro Bild

### 🗂️ **Organisation**
- **Kategorien**: Wachstum, Ernte, Schädlinge, Allgemein
- **Tags**: Freie Verschlagwortung
- **Beet-Zuordnung**: Verknüpfung mit spezifischen Beeten
- **Chronologische Sortierung**: Nach Aufnahme- oder Upload-Datum
- **Favoriten**: Wichtige Bilder markieren

### 💬 **Kollaboration**
- **Kommentarsystem**: Diskussionen zu jedem Bild
- **Multi-User-Support**: Verschiedene Nutzer können Bilder hochladen
- **Autor-Tracking**: Wer hat welches Bild hochgeladen
- **Bewertungen**: Optional, Sterne-System

### 🔍 **Suche & Filter**
- **Volltext-Suche**: Titel, Beschreibung, Tags, Autor
- **Kategorie-Filter**: Nach Bildkategorien filtern
- **Datums-Filter**: Zeitraum-basierte Suche
- **Beet-Filter**: Nur Bilder eines bestimmten Beets
- **Erweiterte Filter**: Autor, Favoriten, Archivierte

### 📊 **Statistiken**
- **Upload-Statistiken**: Monatliche Uploads, Top-Autoren
- **Kategorie-Verteilung**: Welche Bildtypen am häufigsten
- **Engagement**: Meist angesehene/kommentierte Bilder
- **Speicherverbrauch**: Gesamtgröße der Sammlung

## Technische Architektur

### Backend (Node.js)
```javascript
// ImageManager Klasse
const imageManager = new ImageManager('/path/to/nas/images');

// Bild importieren
const result = await imageManager.importImage(filePath, {
  title: 'Tomatenwachstum',
  category: 'Wachstum',
  bedId: 'bed-1',
  uploadedBy: 'Max Mustermann',
  tags: ['Tomaten', 'Woche4']
});

// Kommentar hinzufügen
await imageManager.addComment(imageId, 'Sehen gesund aus!', 'Anna');

// Bilder abrufen
const images = imageManager.getAllImages({
  category: 'Wachstum',
  bedId: 'bed-1',
  sortBy: 'takenDate',
  sortOrder: 'desc'
});
```

### Frontend (React)
```tsx
// Gallery-Komponente
<GardenImageGallery 
  bedId="bed-1"
  category="Wachstum"
  showUpload={true}
/>
```

### Datenstrukturen

#### Image Metadata
```json
{
  "id": "img-1720234567890-abc123",
  "originalName": "tomaten-wachstum.jpg",
  "fileName": "1720234567890-abc123.jpg",
  "fileSize": 2048576,
  "uploadDate": "2025-07-06T10:30:00Z",
  "takenDate": "2025-07-06T08:15:00Z",
  "uploadedBy": "Max Mustermann",
  "title": "Tomatenwachstum nach 4 Wochen",
  "description": "Erste Blüten sind sichtbar",
  "tags": ["Tomaten", "Wachstum", "Beet1"],
  "bedId": "bed-1",
  "plantType": "Tomaten",
  "category": "Wachstum",
  "location": "Beet 1, Südseite",
  "weather": "Sonnig, 24°C",
  "isFavorite": true,
  "viewCount": 15,
  "comments": [
    {
      "id": "comment-1",
      "text": "Sehen wirklich gesund aus!",
      "author": "Anna Schmidt",
      "timestamp": "2025-07-06T14:20:00Z"
    }
  ]
}
```

## NAS-Integration

### Verzeichnisstruktur
```
/nas/gartenmeister/
├── images/
│   ├── 1720234567890-abc123.jpg
│   ├── 1720234567891-def456.png
│   └── 1720234567892-ghi789.jpg
├── thumbnails/
│   ├── thumb-1720234567890-abc123.jpg
│   └── thumb-1720234567891-def456.jpg
├── image-metadata.json
└── backups/
    └── image-metadata-2025-07-06.json
```

### Sync-Strategie
- **Zentrale Speicherung**: Alle Bilder auf NAS
- **Lokale Thumbnails**: Für schnelle Vorschau
- **Metadaten-Sync**: Regelmäßige Synchronisation
- **Offline-Modus**: Lokaler Cache für Browsing

## UI/UX Features

### 🖼️ **Ansichtsmodi**
- **Grid-Modus**: Übersichtliche Kachel-Ansicht
- **Listen-Modus**: Detaillierte Tabellenansicht
- **Lightbox**: Vollbild-Betrachtung
- **Slideshow**: Automatisches Durchblättern

### 📱 **Responsive Design**
- **Mobile-optimiert**: Touch-freundliche Bedienung
- **Tablet-Layout**: Optimierte Grid-Größen
- **Desktop**: Maximale Übersichtlichkeit

### ⚡ **Performance**
- **Lazy Loading**: Bilder werden bei Bedarf geladen
- **Thumbnail-System**: Schnelle Vorschau-Generierung
- **Virtuelle Scrolling**: Für große Sammlungen
- **Caching**: Intelligente Browser-Zwischenspeicherung

## Anwendungsfälle

### 🌱 **Pflanzenwachstum dokumentieren**
```javascript
// Wöchentliche Fortschritte
const metadata = {
  title: `Tomaten - Woche ${weekNumber}`,
  category: 'Wachstum',
  bedId: 'greenhouse-bed-2',
  plantType: 'Tomaten',
  tags: [`woche${weekNumber}`, 'gewächshaus'],
  description: 'Höhe: 45cm, erste Blütenstände sichtbar'
};
```

### 🥕 **Ernte-Dokumentation**
```javascript
const harvestMetadata = {
  title: 'Karottenernte Juli 2025',
  category: 'Ernte',
  bedId: 'bed-3',
  plantType: 'Karotten',
  tags: ['ernte', 'juli', 'rekord'],
  description: 'Größte Karotten der Saison: 28cm!'
};
```

### 🐛 **Schädlings-/Krankheits-Monitoring**
```javascript
const problemMetadata = {
  title: 'Blattläuse an Rosen',
  category: 'Schädlinge',
  location: 'Rosenbeet Nord',
  tags: ['blattläuse', 'rosen', 'behandlung'],
  description: 'Starker Befall, Neem-Behandlung eingeleitet'
};
```

## Erweiterte Features (Zukunft)

### 🤖 **KI-Integration**
- **Auto-Tagging**: Automatische Erkennung von Pflanzen/Schädlingen
- **Wachstums-Analyse**: KI analysiert Entwicklung über Zeit
- **Problem-Erkennung**: Früherkennung von Krankheiten

### 📈 **Analytics**
- **Zeitraffer**: Automatische Zeitraffer-Videos
- **Wachstums-Statistiken**: Messungen über Zeit
- **Vergleichs-Tools**: Verschiedene Sorten/Jahre vergleichen

### 🔄 **Backup & Sync**
- **Cloud-Backup**: Automatische Sicherung
- **Multi-NAS-Sync**: Replikation zwischen Standorten
- **Export-Funktionen**: PDF-Reports mit Bildern

## Setup & Installation

### 1. **ImageManager initialisieren**
```javascript
// In Electron Main Process
const ImageManager = require('./src/utils/image-manager.js');
const imageManager = new ImageManager('/nas/gartenmeister/images');
```

### 2. **IPC-Handler registrieren**
```javascript
// In main.js
ipcMain.handle('image:upload', async (event, filePath, metadata) => {
  return await imageManager.importImage(filePath, metadata);
});

ipcMain.handle('image:getAll', async (event, options) => {
  return imageManager.getAllImages(options);
});

ipcMain.handle('image:addComment', async (event, imageId, comment, author) => {
  return await imageManager.addComment(imageId, comment, author);
});
```

### 3. **Frontend einbinden**
```tsx
// In der App
import GardenImageGallery from '@/components/gallery/GardenImageGallery';

// Allgemeine Galerie
<GardenImageGallery />

// Beet-spezifische Galerie
<GardenImageGallery bedId="bed-1" category="Wachstum" />
```

## Dateisystem-Anforderungen

### NAS-Setup
- **Mindest-Speicher**: 100GB für Start
- **Empfohlener Speicher**: 1TB+ für langfristige Nutzung
- **RAID**: Empfohlen für Datensicherheit
- **Backup**: Regelmäßige externe Sicherung

### Performance-Optimierung
- **SSD-Cache**: Für häufig zugegriffene Thumbnails
- **Gigabit-LAN**: Für flüssige Uploads/Downloads
- **Thumbnail-Cache**: Lokal auf jedem Client

## Migration & Daten-Import

### Bestehende Bilder importieren
```javascript
// Batch-Import aus Ordner
const results = await imageManager.batchImport('/path/to/photos', {
  category: 'Archiv',
  uploadedBy: 'Migration',
  tags: ['import-2025']
});

console.log(`${results.successful.length} Bilder erfolgreich importiert`);
```

### EXIF-Daten nutzen
```javascript
// Datum aus EXIF extrahieren
const exifDate = imageManager.extractDateFromFile(filePath);
```

## Fazit

Das **Image Management System** macht GartenMeister zu einem vollständigen Garten-Dokumentations-Tool. Die Kombination aus:

- ✅ **Einfacher Bedienung** (Drag & Drop Upload)
- ✅ **Mächtiger Organisation** (Tags, Kategorien, Suche)
- ✅ **Kollaborativen Features** (Kommentare, Multi-User)
- ✅ **NAS-Integration** (Unbegrenzter Speicher)
- ✅ **Chronologischer Verwaltung** (Wachstum über Zeit)

...ermöglicht es Gärtnern, ihre Projekte professionell zu dokumentieren und über Jahre hinweg zu verfolgen.

**Perfekt für**: Hobbygärtner, Gemeinschaftsgärten, Gartenbau-Betriebe, Forschungsprojekte
