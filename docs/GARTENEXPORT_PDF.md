# Gartenübersicht PDF-Export (Aktualisiert Juni 2025)

Diese Dokumentation beschreibt die verbesserte PDF-Exportfunktion für die visuelle Gartenübersicht im GartenMeisterStudio.

## Funktionsübersicht

Mit dieser Funktion können Benutzer die aktuelle Gartenübersicht als umfassendes PDF-Dokument exportieren. Dies ist besonders nützlich für:

- Dokumentation des aktuellen Gartenzustands
- Ausdrucke für die Feldarbeit
- Präsentationen und Besprechungen
- Archivierung von Gartenplänen für spätere Vergleiche
- Dienstleistungsnachweise für Kunden

## Inhalt des exportierten PDFs

Das generierte PDF enthält folgende Elemente:

1. **Titelseite mit Metadaten**
   - Titel: "Gartenplan - Übersicht"
   - Erstellungsdatum
   - Allgemeine Gartenbeschreibung

2. **Visuelle Darstellung des Gartens**
   - Maßstabsgetreue Visualisierung aller Beete
   - Farbkodierung entsprechend der Kräutersorten
   - Darstellung von Versuchsbeeten mit Segmenten

3. **Kräuterlegende**
   - Übersicht aller verwendeten Kräutersorten mit Farbzuordnung
   - Farbquadrate mit zugehörigem Kräuternamen

4. **Beet-Details (Tabelle)**
   - Nummer, Typ und Maße jedes Beets
   - Angepflanzte Kräuter
   - Pflanzungsdatum

5. **Versuchsbeete mit Segmentdetails**
   - Auflistung aller Versuchsbeete mit deren Segmenten
   - Details zu Kräutersorten, Pflanzendichte und Produktivität pro Segment

## Anwendung

1. **Zugriff**: Die Funktion ist über den grünen Button "Gartenplan als PDF exportieren" in der Gartenübersichtsseite verfügbar
2. **Voraussetzungen**: Es müssen Beete angelegt sein, damit ein PDF exportiert werden kann
3. **Export-Prozess**:
   - Button "Gartenplan als PDF exportieren" klicken
   - Die HTML-Visualisierung wird präzise in ein hochauflösendes Bild umgewandelt (nur der relevante Visualisierungsbereich)
   - Alle notwendigen Daten werden gesammelt und aufbereitet (inkl. Kräuterzuordnungen, Farbcodes und Dimensionen)
   - Das PDF wird erstellt und im konfigurierten Export-Verzeichnis gespeichert (mit eindeutigem Namen "gartenmeister-gartenplan-[Datum].pdf")
   - Eine Erfolgsmeldung mit dem Pfad wird angezeigt

## Technische Details (Aktualisiert Juni 2025)

Die verbesserte Funktion verwendet folgende Technologien:

- **HTML2Canvas**: Konvertiert die HTML-Visualisierung präzise in ein Bild, unter Ausblendung von UI-Elementen
- **PDFMake**: Generiert das PDF-Dokument mit allen Inhalten und stabiler Font-Behandlung
- **Electron IPC**: Kommuniziert zwischen der React-UI und dem Electron-Hauptprozess mit verbessertem Error-Handling

### Datenstruktur

```typescript
// Daten, die an den PDF-Generator übergeben werden
{
  type: 'garden-overview',
  visualization: string,              // Base64-kodiertes Bild
  beds: Array<{                       // Beetdaten für die Tabelle
    number: number,
    type: string,
    herbs: string[],
    plantingDate: string,
    width: number,
    length: number
  }>,
  herbVarieties: Array<{              // Kräutersorten für die Legende
    id: string,
    name: string,
    color: string
  }>,
  versuchsbeete: Array<{              // Versuchsbeete mit Segmentinformationen
    number: number,
    length: number,
    segments: Array<{
      length: number,
      herbName: string,
      plantsPerMeter: number,
      productivePercentage: number
    }>
  }>
}
```

### Datenstruktur (Aktualisiert Juni 2025)

```typescript
// Daten, die an den PDF-Generator übergeben werden
{
  type: 'garden-overview',
  visualization: string,              // Base64-kodiertes Bild
  filename: string,                   // Vorschlag für den Dateinamen (neu in Version 2025)
  title: string,                      // Expliziter Titel für das PDF (neu in Version 2025)
  beds: Array<{                       // Beetdaten für die Tabelle
    id: string,                       // ID des Beets für eindeutige Identifikation
    number: number,
    type: string,
    herbs: string[],
    plantingDate: string,
    width: number,
    length: number
  }>,
  herbVarieties: Array<{              // Kräutersorten für die Legende
    id: string,
    name: string,
    color: string                     // Immer mit Fallback-Farbe (#CCCCCC)
  }>,
  versuchsbeete: Array<{              // Versuchsbeete mit Segmentinformationen
    id: string,
    number: number,
    length: number,
    segments: Array<{
      id: string,
      length: number,
      herbName: string,
      plantsPerMeter: number,
      productivePercentage: number
    }>
  }>
}
```

## Fehlerbehebung

### Häufige Probleme und Lösungen (Aktualisiert Juni 2025)

1. **Leeres oder unvollständiges Bild im PDF**
   - Problem: Die HTML2Canvas-Konvertierung erfasst nicht den korrekten Inhalt
   - Lösung: Der Export verwendet jetzt präzise DOM-Selektoren (`#garden-visualization-card .p-4`), um nur den relevanten Visualisierungsbereich zu erfassen
   
2. **Fehlerhafte Darstellung der Farben**
   - Problem: Farben werden im PDF anders angezeigt als in der Anwendung
   - Lösung: Verwenden Sie RGB-Farbwerte statt HSL/HSLA für bessere Kompatibilität. Fehlende Farbwerte werden jetzt automatisch mit #CCCCCC ergänzt.

3. **PDF-Generierung schlägt fehl**
   - Problem: Der PDF-Export-Prozess wird nicht abgeschlossen oder erzeugt keine Datei
   - Lösung: 
     - Verbesserte Fehlerbehandlung mit detaillierter Logging
     - Automatische Erstellung des Export-Verzeichnisses, falls es nicht existiert
     - Robuste Font-Behandlung mit Fallback-Lösungen

4. **PDF wird nicht im Export-Ordner gefunden**
   - Problem: Datei wird nicht wie erwartet benannt
   - Lösung: Explizite Benennung der Datei mit "gartenmeister-gartenplan-[Datum]" und verbesserte Dateinamensgenerierung

## Zukünftige Erweiterungen

- Exportoptionen (A4/A3, Hoch-/Querformat)
- Anpassbare Inhalte (nur Visualisierung, nur Tabelle)
- Export in andere Formate (PNG, SVG)
- Integrierte Druckfunktion
- Statistiken und Zusammenfassungen im PDF
- Interaktive PDFs mit verlinkten Beeten (geplant für 2026)
- QR-Codes für mobile Ansichten der einzelnen Beete
