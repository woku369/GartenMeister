# GartenMeisterStudio - Kräutergarten-Management

GartenMeisterStudio ist eine Windows Desktop-Anwendung auf Basis von Electron für die professionelle Verwaltung von Kräutergartenbeeten. Die App übernimmt die Funktionalität, das Layout, die Farben und die Logik des ursprünglichen web-basierten GartenMeister-Projekts und erweitert diese mit Desktop-spezifischen Funktionen.

![GartenMeisterStudio Logo](./src/app/favicon.ico)

## Features

- **Beetverwaltung:** Verwaltung von nummerierten Beeten (1-26) mit verschiedenen Typen
  - Standardbeete mit fester Länge (43 Meter)
  - Versuchsbeete mit flexibler Segmentierung und variabler Länge
  - Blühstreifen für ökologische Zwecke
  - Brachflächen für Regenerationsphasen
  
- **Kräuterverwaltung:** Verwaltung von Kräutersorten und Untersorten
  - Standardisierte Kräutersortenliste
  - Benutzerdefinierte Kräutersorten mit Farbkodierung
  - Zuweisung zu Beeten und Segmenten

- **Segmentverwaltung:**
  - Flexible Segmentierung von Versuchsbeeten
  - Detaillierte Informationen zu Bepflanzung, Ertragsfähigkeit und Zeitpunkt
  - Visualisierung der Segmente mit Farbkodierung

- **Ernteverwaltung:** 
  - Globaler Ernte-Workflow über mehrere Beete
  - Produktivitätsmessung und Anpassung
  - Historische Datenerfassung und -analyse

- **Routinen-System (NEU):**
  - Verwaltung wiederkehrender Gartenaufgaben
  - Kategorisierung nach Typ und Frequenz
  - Erinnerung und Fortschrittsverfolgung

- **Reporting und Visualisierung:** 
  - Grafische Übersicht des Kräutergartens
  - Detaillierte Berichte über Ertrag und Bepflanzung
  - Daten-Export und -Import

- **Desktop-Integration:**
  - Native Windows-App mit Electron
  - Anwendungsmenü mit Schnellzugriff auf wichtige Funktionen
  - Persistente Konfiguration und Datenspeicherung
  - Automatisches Speichern der Fenstergröße

## Installation

### Produktionsversion

1. Lade die neueste Version von [GitHub Releases](https://github.com/username/GartenMeisterStudio/releases) herunter
2. Führe die `GartenMeisterStudio-Setup-x.y.z.exe` Datei aus
3. Folge den Anweisungen im Setup-Assistenten
4. Starte die Anwendung über das Desktop-Symbol oder das Startmenü

### Entwicklungsumgebung

1. Stelle sicher, dass Node.js (v18+) und npm (v9+) installiert sind
2. Klone dieses Repository:
   ```powershell
   git clone https://github.com/username/GartenMeisterStudio.git
   cd GartenMeisterStudio
   ```
3. Installiere alle Abhängigkeiten:
   ```powershell
   npm install
   ```
4. Starte die App im Entwicklungsmodus:
   ```powershell
   npm run dev:electron
   ```

### Andere wichtige Skripte:
- `npm run dev` - Startet nur den Next.js-Server ohne Electron
- `npm run build` - Erstellt einen optimierten Build der Next.js-App
- `npm run package` - Erstellt ein Electron-Paket für die aktuelle Plattform
- `npm run make` - Erstellt eine installierbare Anwendung für die aktuelle Plattform

## Entwicklung

### Voraussetzungen
- Node.js v18 oder höher
- npm v9 oder höher
- Windows 10/11 (für vollständige Funktionalität)

### Empfohlene Entwicklungsumgebung
- Visual Studio Code mit folgenden Erweiterungen:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets

### Entwicklung starten

#### Option 1: Separate Terminals (EMPFOHLEN für Development)
```powershell
# Terminal 1: Next.js Dev Server starten
npm run dev

# Terminal 2: Warten bis "Ready" angezeigt wird, dann Electron starten
npm run electron
```

#### Option 2: Automatisiert (kann bei Problemen schwieriger zu debuggen sein)
```powershell
npm run dev:electron  # Startet sowohl Next.js als auch Electron synchronisiert
```

#### Bei Problemen mit laufenden Prozessen
```powershell
# Alle Node- und Electron-Prozesse beenden (PowerShell korrekt mit ;)
taskkill /F /IM node.exe /T; taskkill /F /IM electron.exe /T

# Alternative: Separate Befehle
taskkill /F /IM node.exe /T
taskkill /F /IM electron.exe /T
```

#### ⚠️ PowerShell Hinweis
**NIEMALS** `&&` in PowerShell verwenden! Verwende stattdessen `;` oder separate Befehle.

## Projektstruktur

```
GartenMeisterStudio/
├── docs/                    # Technische Dokumentation
├── src/
│   ├── app/                 # Next.js App Router Struktur
│   │   ├── api/             # API-Routen (Serverless Functions)
│   │   ├── beds/            # Beete-Verwaltung UI
│   │   ├── dashboard/       # Dashboard-Seite
│   │   ├── herbs/           # Kräuter-Verwaltung UI
│   │   ├── reports/         # Berichte und Statistiken
│   │   ├── routines/        # Routinen-Verwaltung UI
│   │   └── settings/        # App-Einstellungen
│   │
│   ├── components/          # React-Komponenten
│   │   ├── beds/            # Beet-bezogene Komponenten
│   │   ├── dashboard/       # Dashboard-Widgets
│   │   ├── harvests/        # Ernte-bezogene Komponenten
│   │   ├── herbs/           # Kräuter-bezogene Komponenten
│   │   ├── layout/          # Layout-Komponenten (Sidebar, etc.)
│   │   ├── routines/        # Routinen-Komponenten
│   │   └── ui/              # Wiederverwendbare UI-Komponenten
│   │
│   ├── lib/                 # Kernbibliotheken und Utilities
│   │   ├── actions/         # Server-Actions für Datenoperationen
│   │   ├── data.ts          # Datenzugriffsschicht
│   │   ├── definitions.ts   # TypeScript-Definitionen
│   │   ├── electron-bridge.ts # Brücke zwischen Next.js und Electron
│   │   ├── routines-manager.ts # Routinen-Verwaltung
│   │   └── utils.ts         # Allgemeine Hilfsfunktionen
│   │
│   ├── utils/               # Electron-spezifische Utilities
│   │   ├── config-manager.js # Konfigurationsmanagement
│   │   └── file-utils.js    # Dateisystem-Operationen
│   │
│   ├── index.js             # Electron-Hauptprozess
│   ├── preload.js           # Electron-Preload-Skript
│   └── electron-menu.js     # Electron-Anwendungsmenü
│
├── package.json             # Projektabhängigkeiten und Skripte
├── next.config.ts           # Next.js-Konfiguration
├── tailwind.config.ts       # Tailwind-CSS-Konfiguration
└── forge.config.js          # Electron-Forge-Konfiguration
```

### Paketierung

```powershell
# Schritt-für-Schritt Build Prozess
npm run build      # Baut die Next.js-App
npm run package    # Erstellt ein ungebundenes Paket der App

# Vollständiger Build mit Installer
npm run make       # Erstellt ausführbare Installer für die Distribution

# Manuelle Einzelschritte (bei Problemen)
npm run build
npm run export     # Exportiert statische Dateien (falls verwendet)
npm run electron   # Startet Electron mit der gebauten App
```

#### ⚠️ PowerShell Hinweis
Alle npm scripts in `package.json` verwenden `&&` korrekt (npm behandelt das plattformübergreifend).
**Direkt in PowerShell** sollte `&&` NIEMALS verwendet werden - verwende `;` oder separate Befehle.

## Architektur und Datenstruktur

### Architektonischer Überblick

GartenMeisterStudio verwendet eine hybride Architektur:

1. **Frontend-Layer (Renderer-Prozess)**
   - Next.js und React für die Benutzeroberfläche
   - API-Routen für serverseitige Logik
   - Tailwind CSS für das Styling

2. **Backend-Layer (Main-Prozess)**
   - Electron als Desktop-Container
   - Node.js für Dateisystem- und Betriebssystemzugriffe
   - IPC (Inter-Process Communication) für die Kommunikation zwischen den Prozessen

3. **Daten-Layer**
   - In-Memory-Datenspeicher während der Laufzeit
   - JSON-basierte Persistenz über den Electron-Konfigurationsmanager
   - Dateibasierte Speicherung für exportierte Berichte und PDFs

### Kommunikationsfluss

```
+------------------+        +------------------+        +------------------+
|                  |        |                  |        |                  |
|   UI-Komponenten |  --->  |    API-Routen    |  --->  |  Datenmanager &  |
|    (React)       |  <---  | (Next.js Server) |  <---  |     Actions      |
|                  |        |                  |        |                  |
+------------------+        +------------------+        +------------------+
         ^                                                      ^
         |                                                      |
         v                                                      v
+------------------+                                   +------------------+
|                  |                                   |                  |
|  Electron-Bridge |  <---------------------------->   | Electron-Prozess |
|      (API)       |                                   |  & Dateisystem   |
|                  |                                   |                  |
+------------------+                                   +------------------+
```

### Hauptdatenstrukturen

Die App verwendet folgende Hauptdatentypen und -schnittstellen:

- **Beete (Beds):**
  ```typescript
  interface Bed {
    id: string;
    number: number;         // Nummer des Beets (1-26)
    type: BedType;          // Standard, Versuchsbeet, Blühstreifen, Brachfläche
    width: number;          // Breite in Metern
    length: number;         // Länge in Metern
    plantingDate?: string;  // Pflanzungsdatum
    notes?: string;         // Bemerkungen
    color?: string;         // Farbe für Visualisierung
  }
  ```

- **Segmente (nur für Versuchsbeete):**
  ```typescript
  interface VersuchsbeetSegment {
    id: string;
    position: number;       // Position im Beet
    length: number;         // Länge des Segments in Metern
    herbId: string;         // Zugeordnete Kräutersorte
    subvariety?: string;    // Untersorte
    plantsPerMeter: number; // Pflanzen pro Laufmeter
    productivePercentage: number; // % ertragsfähiger Pflanzen
    plantingDate?: string;  // Pflanzungsdatum des Segments
    notes?: string;         // Bemerkungen
  }
  ```

- **Kräutersorten:**
  ```typescript
  interface Herb {
    id: string;
    name: string;           // Name der Kräutersorte
    latinName?: string;     // Lateinischer Name
    isStandard: boolean;    // Standard oder benutzerdefiniert
    color?: string;         // Farbe für Visualisierung
    subvarieties?: string[]; // Liste von Untersorten
  }
  ```

- **Routinen (NEU):**
  ```typescript
  interface Routine {
    id: string;
    name: string;
    description?: string;
    type: 'calendar' | 'bed' | 'harvest' | 'herb' | 'other';
    frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    lastRun?: string;       // ISO date string
    nextRun?: string;       // ISO date string
    configuration: Record<string, any>;
    isActive?: boolean;
  }
  ```

## Technologie-Stack

- **Frontend:** 
  - Next.js 14 mit App Router
  - React 18
  - Tailwind CSS 3
  - shadcn/ui als Komponenten-Framework
  
- **Backend:**
  - Electron 27+
  - Node.js 18+
  
- **Datenmanagement:**
  - In-Memory-Store mit JSON-Serialisierung
  - Electron-Config für Persistenz
  
- **Berichterstellung:**
  - pdfmake für PDF-Generierung
  - Recharts für Datenvisualisierung

## Speicherorte

- **App-Daten:** `%APPDATA%\gartenmeister-studio\`
- **PDF-Exports:** `%APPDATA%\gartenmeister-studio\exports\`
- **Datenbank:** `%APPDATA%\gartenmeister-studio\database\`
- **Konfiguration:** `%APPDATA%\gartenmeister-studio\config.json`

Die Speicherorte können über die Einstellungsseite in der App eingesehen werden.

## Dokumentation

Umfassende Entwicklungs- und Benutzerdokumentation ist im `docs`-Verzeichnis verfügbar:

- `ENTWICKLUNG.md` - Allgemeine Entwicklungsdokumentation
- `ROUTINEN_DOKUMENTATION.md` - Spezifische Dokumentation des Routinen-Systems
- `TECHNISCHE_DOKUMENTATION.md` - Detaillierte technische Architektur
- `FEHLERBEHEBUNG.md` - Häufige Probleme und deren Lösungen
- `APP_FUNKTIONALITAET.md` - Funktionale Beschreibung der Anwendung

## Bekannte Probleme und Einschränkungen

1. Die Anwendung nutzt einen In-Memory-Speicher, der beim Neustart zurückgesetzt wird. Eine robustere Datenbank-Integration ist geplant.

2. Die Google Calendar-Integration im CalendarWidget zeigt derzeit Demo-Daten an, wenn keine API-Schlüssel konfiguriert sind.

3. Die Microsoft Teams-Integration funktioniert nur, wenn die App innerhalb einer Teams-Umgebung ausgeführt wird.

4. Die Routinen-Erinnerungsfunktion ist noch nicht vollständig implementiert.

## Support und Mitwirkung

- **Issue Tracker:** [GitHub Issues](https://github.com/username/GartenMeisterStudio/issues)
- **Fragen:** Für Fragen wende dich an den Projektentwickler
- **Mitwirken:** Pull Requests sind willkommen. Bitte lies vorher die Datei CONTRIBUTING.md

## Lizenz

Copyright (c) 2025 GartenMeisterStudio-Entwickler.

Diese Software ist intern lizenziert und darf ohne ausdrückliche Genehmigung nicht weitergegeben werden.
