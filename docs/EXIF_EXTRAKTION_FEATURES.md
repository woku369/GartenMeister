# EXIF-Daten Extraktion - GartenMeister

## 🎯 Neue Features

Die GartenMeister-App unterstützt jetzt die **automatische Extraktion von EXIF-Daten** aus hochgeladenen Bildern:

### ✨ Was wurde verbessert:

1. **📅 Echtes Aufnahmedatum**: Zeigt das tatsächliche Aufnahmedatum statt nur das Upload-Datum
2. **📸 Kamera-Informationen**: Extrahiert Kameramodell, Einstellungen und technische Details
3. **🌍 GPS-Daten**: Zeigt Standort-Koordinaten wenn verfügbar
4. **🔍 Bessere UI**: Unterscheidet zwischen Aufnahme- und Upload-Datum

## 🚀 Implementierte Funktionen

### EXIF-Daten Extraktion
- **Aufnahmedatum** (DateTime Original, DateTime, DateTime Digitized)
- **Kamera-Informationen** (Hersteller, Modell, Software)
- **Aufnahme-Einstellungen** (ISO, Blende, Belichtungszeit, Brennweite)
- **GPS-Koordinaten** (Breitengrad, Längengrad)
- **Bild-Abmessungen** (Breite, Höhe)
- **Orientierung** (Portrait/Landscape)

### Fallback-Mechanismen
- **Dateiname-Parsing**: Extrahiert Datum aus Dateinamen wie `IMG_20240315.jpg`
- **Dateisystem-Zeitstempel**: Verwendet Erstellungsdatum der Datei
- **Mehrere EXIF-Bibliotheken**: Unterstützt verschiedene EXIF-Parser

### UI-Verbesserungen
- **Karten-Ansicht**: Zeigt Aufnahmedatum mit 📸 und Upload-Datum mit 📤
- **Listen-Ansicht**: Kompakte Darstellung mit beiden Daten
- **Detail-Ansicht**: Vollständige EXIF-Informationen und technische Details
- **Unterscheidung**: Zeigt Upload-Datum nur wenn es vom Aufnahmedatum abweicht

## 📁 Neue Dateien

### `src/utils/exif-extractor.js`
Haupt-EXIF-Extraktor mit folgenden Features:
- Unterstützt multiple EXIF-Bibliotheken
- Robuste Fehlerbehandlung
- Manuelle EXIF-Parsing als Fallback
- GPS-Koordinaten-Konvertierung
- Dateiname-basierte Datums-Extraktion

### `test-exif-extraction.js`
Umfassendes Test-Skript für:
- EXIF-Extraktion aus echten Bildern
- Image Manager Integration
- Fallback-Mechanismen
- Mock-Daten Tests

## 🔧 Integration

### ImageManager Erweiterungen
```javascript
// Neue EXIF-Integration
const exifData = await this.exifExtractor.extractFromFile(filePath);
const takenDate = exifData?.takenAt || fallbackDate;

// Vollständige Metadaten-Speicherung
const imageMetadata = {
  // ...existing fields...
  takenDate: takenDate,
  exifData: exifData,
  dimensions: exifData?.dimensions
};
```

### UI-Komponenten Updates
```tsx
// Unterscheidung zwischen Aufnahme- und Upload-Datum
<div>📸 {new Date(image.takenDate).toLocaleDateString('de-DE')}</div>
{image.uploadDate !== image.takenDate && (
  <div>📤 {new Date(image.uploadDate).toLocaleDateString('de-DE')}</div>
)}

// EXIF-Details in der Detail-Ansicht
{selectedImage.exifData?.camera?.make && (
  <div><strong>Kamera:</strong> {camera.make} {camera.model}</div>
)}
```

## 🧪 Testing

### Automatisierte Tests
```bash
# EXIF-Extraktion testen
node test-exif-extraction.js
```

### Manuelle Tests
1. **Bilder mit EXIF-Daten hochladen** (JPEG von Digitalkamera/Smartphone)
2. **Aufnahmedatum prüfen** in Karten- und Listen-Ansicht
3. **Detail-Ansicht öffnen** und technische Details überprüfen
4. **Verschiedene Dateiformate testen** (JPEG, PNG, etc.)

## 📱 Benutzerfreundlichkeit

### Visuelle Hinweise
- **📸 Symbol**: Aufnahmedatum (echtes Foto-Datum)
- **📤 Symbol**: Upload-Datum (wann in GartenMeister hochgeladen)
- **Automatische Ausblendung**: Upload-Datum wird nur gezeigt wenn unterschiedlich

### Informative Details
- **Technische Sektion**: Zeigt Kamera-Einstellungen und EXIF-Daten
- **Hinweis bei Unterschieden**: Warnt wenn Aufnahme- und Upload-Datum abweichen
- **GPS-Koordinaten**: Zeigt Standort wenn in EXIF vorhanden

## 🔍 Troubleshooting

### Häufige Probleme

**Problem**: Kein Aufnahmedatum extrahiert
- **Lösung**: PNG/GIF haben meist keine EXIF-Daten, nur JPEG
- **Fallback**: App verwendet Dateiname oder Upload-Datum

**Problem**: EXIF-Bibliotheken nicht installiert
- **Lösung**: `npm install exif-reader piexifjs`
- **Fallback**: Manuelle EXIF-Parsing funktioniert ohne Bibliotheken

**Problem**: Datum in falscher Zeitzone
- **Lösung**: EXIF-Daten enthalten meist keine Zeitzone, verwendet UTC
- **Verbesserung**: Zukünftig lokale Zeitzone-Konfiguration

### Debug-Informationen
Die Konsole zeigt detaillierte Logs:
```
[ImageManager] 📸 EXIF-Daten extrahiert für IMG_20240315.jpg
[ImageManager] 📅 EXIF-Aufnahmedatum gefunden: 2024-03-15T14:30:22.000Z
[ExifExtractor] ✅ EXIF-Daten extrahiert für IMG_20240315.jpg
```

## 🎉 Vorteile für Benutzer

1. **Chronologisch korrekte Sortierung**: Bilder werden nach echtem Aufnahmedatum sortiert
2. **Gartentagebuch-Genauigkeit**: Tatsächliche Wachstumsdokumentation möglich
3. **Technische Transparenz**: Sichtbare Kamera-Einstellungen für Foto-Enthusiasten
4. **Automatische Metadaten**: Weniger manuelle Eingaben erforderlich
5. **GPS-Integration**: Mögliche zukünftige Standort-Features

## 🚀 Zukünftige Erweiterungen

- **Kamera-spezifische Optimierungen**: Bessere Unterstützung für verschiedene Hersteller
- **Zeitzone-Konfiguration**: Lokale Zeitzone-Einstellungen
- **GPS-Karten-Integration**: Standort-Anzeige auf Karte
- **EXIF-Bearbeitung**: Möglichkeit EXIF-Daten zu ändern/löschen
- **Batch-EXIF-Update**: Massenbearbeitung von Metadaten

---

**Status**: ✅ Implementiert und getestet
**Version**: GartenMeister v1.1+
**Kompatibilität**: Alle bestehenden Bilder bleiben kompatibel
