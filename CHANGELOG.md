# Änderungsprotokoll - GartenMeisterStudio

Alle wichtigen Änderungen am GartenMeisterStudio-Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

## [Unreleased]

### Geplant
- Erweiterte Datenbank-Integration für verbesserte Persistenz
- Export von Routinen zu externen Kalendern
- Verbesserte Visualisierung der Gartenbeete mit interaktiver 3D-Ansicht
- Mobiler Modus für kompakte Bildschirme

## [1.2.0] - 2025-06-09

### Hinzugefügt
- Neues Routinen-Verwaltungssystem für wiederkehrende Gartenaufgaben
  - Verschiedene Kategorien (Kalender, Beet, Ernte, Kräuter, Sonstiges)
  - Verschiedene Frequenzen (täglich, wöchentlich, monatlich, jährlich)
  - Persistente Speicherung über Electron-Config oder localStorage
  - Vollständige UI-Integration mit Liste und Formular
- Erweiterter PDF-Export für Gartenübersicht
  - Visualisierung des Gartenplans als PDF mit farbkodierten Beeten
  - Integration mit HTML-zu-Canvas-Konvertierung für hochwertige Grafiken
  - Automatische Legende für Kräutersorten
  - Detaillierte Tabellen für Beetinformationen und Versuchsbeete

### Verbessert
- PDF-Export für Gartenübersicht korrigiert und optimiert:
  - Präzisere Erfassung des Visualisierungsbereichs für höhere Qualität
  - Robuste Fehlerbehandlung mit detailliertem Logging
  - Automatische Erstellung des Exportverzeichnisses falls nicht vorhanden
  - Konsistente Dateinamen mit "gartenmeister-gartenplan-[Datum]"
  - Verbesserte Darstellung der Visualisierung im PDF
- Verbesserte Dokumentation
  - Neue technische Dokumentation
  - Spezifische Routinen-Dokumentation
  - Dokumentation zur PDF-Export-Funktion
  - Verbesserte Fehlerbehebungsdokumentation
  - Mitwirkungsrichtlinien

### Behoben
- Fehler in der Segment-API-Route bei der Übergabe der `bedId`
- Probleme mit der Teams-Widget-Initialisierung
- PDF-Font-Fehler bei `Cannot read properties of undefined (reading 'vfs')`
- TypeScript-Fehler in der exportToPDF-Funktion bei unterschiedlichen Aufrufformaten
- Fehler beim Google Calendar API-Aufruf
- Verbesserte Browser-Kompatibilität durch Fallback-Mechanismen

### Geändert
- Bessere Fehlerbehandlung in API-Routen
- Optimierte Ladezeiten durch verbesserte Datenstrukturierung
- Überarbeitete README mit detaillierteren Informationen

## [1.1.0] - 2025-04-15

### Hinzugefügt
- Dashboard mit Widget-System
  - Kalender-Widget mit Google Calendar-Integration
  - Wetter-Widget für standortbezogene Gartenwetterdaten
  - ToDo-Widget für anstehende Aufgaben
  - Teams-Widget für Microsoft Teams-Integration
- PDF-Export für Beetpläne und Ernteberichte
- Erweiterte Datenvisualisierung im Bericht-Bereich

### Behoben
- Probleme beim Laden von Segmentdaten in Versuchsbeeten
- Fehlerhafte Berechnung der Beet-Produktivität
- UI-Rendering-Probleme in der Ernte-Ansicht

### Geändert
- Verbesserte UI mit optimierter Navigation
- Überarbeitete Beet-Detailansicht

## [1.0.0] - 2025-02-01

### Hinzugefügt
- Initiale Veröffentlichung der Desktop-App
- Grundlegende Beetverwaltung
  - Standard-Beete
  - Versuchsbeete mit Segmenten
  - Blühstreifen
  - Brachflächen
- Kräuterverwaltung
  - Standard-Kräutersorten
  - Benutzerdefinierte Sorten
  - Farbkodierung
- Ernte-Workflow
  - Auswahl der Beete und Kräutersorten
  - Zeitraumbasierte Erfassung
  - Ertragsberechnung
- Einstellungen und Konfiguration
- Grundlegende Berichterstellung

[Unreleased]: https://github.com/username/GartenMeisterStudio/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/username/GartenMeisterStudio/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/username/GartenMeisterStudio/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/username/GartenMeisterStudio/releases/tag/v1.0.0
