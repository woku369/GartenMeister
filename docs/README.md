# GartenMeisterStudio - Inhaltsübersicht der Entwicklungsdokumentation

## Projektüberblick
- **Basis**: Electron-basierte Windows Desktop-App
- **Frontend**: Next.js mit React und TailwindCSS
- **Persistenz**: In-Memory mit Electron Config-Manager

## Dokumentationsstruktur

1. **[TECHNISCHE_DOKUMENTATION.md](./TECHNISCHE_DOKUMENTATION.md)**
   - Architektur und Systemaufbau
   - Kommunikationsfluss zwischen Komponenten
   - Datenmodell und wichtige Interfaces
   - Entwicklungsworkflow und Best Practices

2. **[ENTWICKLUNG.md](./ENTWICKLUNG.md)**
   - Behobene Fehler und API-Anpassungen
   - Bekannte Einschränkungen und offene Punkte
   - Nächste Entwicklungsschritte

3. **[ROUTINEN_DOKUMENTATION.md](./ROUTINEN_DOKUMENTATION.md)**
   - Detaillierte Beschreibung des Routinen-Systems
   - Datenmodell und API-Endpunkte
   - Benutzeroberfläche und Arbeitsabläufe
   - Technische Details zur Implementierung

4. **[APP_FUNKTIONALITAET.md](./APP_FUNKTIONALITAET.md)**
   - Kernfunktionen der Anwendung
   - Beet- und Segment-Verwaltung
   - Kräutersorten-Datenbank
   - Ernte-Workflow

## Implementierte Features

### Beet-Verwaltung
- Verschiedene Beet-Typen (Standard, Versuchsbeet, Blühstreifen, Brachfläche)
- Segmentierung von Versuchsbeeten
- Zuweisung von Kräutersorten zu Segmenten

### Kräuter-Verwaltung
- Vordefinierte und benutzerdefinierte Kräutersorten
- Farbkodierung für visuelle Darstellung

### Ernte-Workflow
- Globaler Ernte-Workflow über mehrere Beete
- Auswahlmöglichkeiten für Kräutersorten und Zeiträume

### Routinen-System
- Verwaltung wiederkehrender Aufgaben
- Verschiedene Kategorien und Häufigkeiten
- Automatische Berechnung der nächsten Ausführung

## Architektur

### Frontend
- React-Komponenten
- ShadCN/UI für das UI-Framework
- Routing über Next.js App Router

### Backend
- Next.js API-Routen
- Server-Action-Muster
- Electron für native Systemfunktionen

### Datenpersistenz
- In-Memory-Store (`globalThis.__app_store__`)
- Electron Config-Manager für dauerhafte Speicherung
- JSON-basiertes Datenformat

## Aktuelle Bugfixes

1. **Segment API-Route**
   - Fehlerhafte Parameter-Übergabe in `addSegment`-Funktion korrigiert
   - Korrekte Extraktion der `bedId` aus der Anfrage

2. **Electron-Prozess-Management**
   - Verbesserte Prozessbeendigung mit `taskkill`-Befehlen
   - Korrekte Reihenfolge beim Starten von Next.js und Electron

## Nächste Entwicklungsschritte

1. **Persistenz**
   - Robustere Datenbanklösung für dauerhafte Speicherung
   - Backup- und Wiederherstellungsmechanismen

2. **Dashboard & Kalender**
   - Integration der Routinen in Dashboard und Kalender
   - Verbesserte Visualisierung und Interaktion

3. **Benutzeroberfläche**
   - Optimierung für verschiedene Bildschirmgrößen
   - Erweiterte Filtermöglichkeiten für Daten

4. **Exportfunktionen**
   - PDF- und Excel-Export für Berichte
   - Export von Routinen in externe Kalender

5. **Tests**
   - Unit-Tests für kritische Geschäftslogik
   - End-to-End-Tests für Hauptfunktionen
