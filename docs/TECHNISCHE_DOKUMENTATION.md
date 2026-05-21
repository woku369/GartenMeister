# GartenMeisterStudio - Technische Dokumentation

## Überblick und Architektur

GartenMeisterStudio ist eine Electron-basierte Desktop-Anwendung für Windows, die auf der Next.js-Framework aufbaut. Diese Dokumentation beschreibt die technische Architektur, die wichtigsten Komponenten und die Implementierung der wichtigsten Features.

### Referenzprojekt und Vorgänger

Das GartenMeisterStudio ist eine Neuentwicklung des ursprünglichen GartenMeister-Projekts. Das alte Projekt dient als Referenz und Vorlage für Funktionalitäten und Design:

- **Speicherort des alten Projekts**: 
  - `C:\Users\WK\OneDrive - edrmg\Desktop\Neuer Ordner\garten-meister firebase`
  - Dieses Verzeichnis enthält den Quellcode des ursprünglichen Firebase-basierten GartenMeister-Projekts
  - Bei Bedarf kann auf diesen Code zugegriffen werden, um Spezifikationen und Implementierungsdetails zu vergleichen

### Technologie-Stack

- **Frontend**: Next.js, React, TailwindCSS, Shadcn/UI
- **Backend**: Node.js (Electron-Prozess)
- **Datenbank**: In-Memory-Speicher mit Dateisystem-Persistenz über Electron
- **Packaging**: Electron-Forge

## Systemarchitektur

Das System besteht aus folgenden Hauptkomponenten:

### 1. Electron-Hauptprozess (`src/index.js`)

- Verantwortlich für die Erstellung des Anwendungsfensters
- Verwaltet Lebenszyklus der Anwendung
- Stellt native Systemfunktionen bereit (Dateisystemzugriff, Konfigurationsmanagement)
- Kommuniziert mit dem Renderer-Prozess über IPC (Inter-Process Communication)

### 2. Next.js-Anwendung (React)

- Bildet die Benutzeroberfläche und Anwendungslogik
- Kommuniziert mit dem Electron-Hauptprozess über die Electron-Bridge
- Verwendet API-Routen für CRUD-Operationen
- Implementiert Client-seitige Validierung und Geschäftslogik

### 3. Datenpersistenz

- Primärer Speicher: In-Memory-Store (`globalThis.__app_store__`)
- Sekundärer Speicher: JSON-Dateien im Anwendungsverzeichnis
- Konfigurationsmanagement über `config-manager.js`

## Kommunikationsfluss

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

## Datenmodell

### Hauptentitäten

1. **Beete (Beds)**
   - Standard-Beete mit fester Länge (43m)
   - Versuchsbeete mit variabler Länge und Segmenten
   - Blühstreifen und Brachflächen als Spezialtypen

2. **Segmente (Segments)**
   - Untereinheiten von Versuchsbeeten
   - Beinhalten spezifische Kräuterbepflanzungen

3. **Kräutersorten (Herbs)**
   - Standardsorten (vordefiniert)
   - Benutzerdefinierte Sorten

4. **Ernteberichte (Harvests)**
   - Erfassen von Erntemengen pro Beet/Segment und Kräutersorte

5. **Routinen (Routines)**
   - Wiederkehrende Aufgaben/Erinnerungen
   - Kategorisiert nach Typ und Frequenz

## Feature-Implementierungen

### 1. Routinen-Verwaltungssystem

#### Datenmodell (`src/lib/routines-manager.ts`)

```typescript
export interface Routine {
  id: string;
  name: string;
  description?: string;
  type: 'calendar' | 'bed' | 'harvest' | 'herb' | 'other';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  lastRun?: string; // ISO String
  nextRun?: string; // ISO String
  configuration?: {
    dayOfWeek?: number; // 0-6, 0 = Sonntag
    dayOfMonth?: number; // 1-31
    month?: number; // 0-11, 0 = Januar
    customDays?: number; // Benutzerdefinierte Tage
    customOption?: string; // Benutzerdefinierte Option
  };
  isActive: boolean;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}
```

#### Persistenz

Routinen werden dauerhaft gespeichert über:
1. In-Memory-Cache (`__app_store__.routines`)
2. JSON-Datei im Anwendungsverzeichnis über den Config-Manager

#### API-Endpunkte (`src/app/api/routines/route.ts`)

- `GET /api/routines` - Alle Routinen abrufen
- `GET /api/routines/:id` - Einzelne Routine abrufen
- `POST /api/routines` - Neue Routine erstellen
- `PATCH /api/routines/:id` - Bestehende Routine aktualisieren
- `DELETE /api/routines/:id` - Routine löschen

#### UI-Komponenten

- `RoutineForm.tsx` - Formular zum Erstellen/Bearbeiten von Routinen
- `RoutineList.tsx` - Listenansicht aller Routinen mit Statusanzeige
- `RoutineCard.tsx` - Einzeldarstellung einer Routine

### 2. Segment-API-Verbesserungen

Die API-Endpunkte für Segmente wurden korrigiert, um Segmente korrekt mit einer Beet-ID zu verknüpfen. Die wichtigste Änderung war die Extraktion der `bedId` aus den Request-Daten und die korrekte Weitergabe an die Datenmanager-Funktionen.

### 3. Elektronisches Konfigurationssystem

Das System nutzt eine JSON-basierte Konfigurationsdatei, die über den `config-manager.js` verwaltet wird. Diese speichert:

- Fenstergröße und -position
- Benutzereinstellungen
- Exportpfade
- Themenpräferenzen
- Datenbankpfade

## Entwicklungsworkflow

### Anwendung starten

```bash
cd C:\Users\WK\GartenMeisterStudio
npm run dev:electron
```

### Problembehebung

Bei Problemen mit laufenden Prozessen:

```bash
taskkill /F /IM node.exe /T
taskkill /F /IM electron.exe /T
```

### Hauptentwicklungsdateien

- **Electron-Hauptprozess**: `src/index.js`
- **Preload-Skript**: `src/preload.js`
- **Konfigurationsmanager**: `src/utils/config-manager.js`
- **Electron-Bridge**: `src/lib/electron-bridge.ts`
- **Datenmanager**: `src/lib/data.ts`
- **API-Routen**: `src/app/api/*/route.ts`

## Best Practices

1. **Kommunikation**: Verwende immer die Electron-Bridge für die Kommunikation zwischen dem Renderer- und dem Hauptprozess.

2. **Daten-Validierung**: Validiere Daten sowohl client- als auch serverseitig.

3. **Fehlerbehandlung**: Implementiere try/catch-Blöcke um alle asynchronen Operationen.

4. **Electron-Sicherheit**: Halte dich an das Prinzip der Kontextisolierung und deaktiviere nodeIntegration.

5. **Datenpersistenz**: Speichere wichtige Daten regelmäßig und implementiere Backup-Mechanismen.

## Bekannte Einschränkungen und ToDos

1. **Datenpersistenz**: Die In-Memory-Speicherung wird beim Neustart zurückgesetzt. Eine robustere Datenbank-Integration (z.B. SQLite) könnte implementiert werden.

2. **Fehlerbehandlung**: Verbesserte Fehlerbehandlung und Benutzerrückmeldungen implementieren.

3. **Tests**: Automatisierte Tests für kritische Funktionen hinzufügen.

4. **Performance**: Optimieren der Datenladeprozesse für größere Datensätze.

## Datensynchronisierung und Backup

### OneDrive als bevorzugte Synchronisationslösung

Für die Synchronisierung und Datensicherung von GartenMeisterStudio wird OneDrive als bevorzugte Lösung empfohlen. Diese Entscheidung basiert auf folgenden Vorteilen:

1. **Nahtlose Windows-Integration**: OneDrive ist in Windows vorinstalliert und bietet tiefe Integration mit dem Betriebssystem.
2. **Automatische Synchronisierung**: Änderungen werden automatisch zwischen Geräten synchronisiert, ohne zusätzliche Software.
3. **Versionskontrolle**: OneDrive speichert ältere Versionen von Dateien, was bei versehentlichen Änderungen hilfreich ist.
4. **Kosteneffizienz**: In vielen Microsoft 365-Abonnements bereits enthalten oder mit 5 GB kostenlosem Speicher nutzbar.
5. **Datensicherheit**: Verschlüsselung der Daten sowohl bei der Übertragung als auch im Ruhezustand.

### Einrichtung der OneDrive-Synchronisierung

Um GartenMeisterStudio mit OneDrive zu synchronisieren:

1. **Anwendungspfad in OneDrive platzieren**:
   - Option A: GartenMeisterStudio direkt im OneDrive-Ordner installieren
   - Option B: Das Datenverzeichnis der Anwendung auf einen OneDrive-Pfad umleiten

2. **Für Option B - Konfigurationsänderung**:
   ```json
   {
     "dataPath": "C:\\Users\\[Username]\\OneDrive\\GartenMeisterStudio\\Data"
   }
   ```

3. **Bei Verwendung mehrerer Geräte**:
   - Stellen Sie sicher, dass die OneDrive-Synchronisierung abgeschlossen ist, bevor Sie die Anwendung starten
   - Vermeiden Sie gleichzeitiges Bearbeiten von mehreren Geräten aus

### Alternative Synchronisationsmethoden

Falls OneDrive nicht verfügbar ist, können auch folgende Alternativen genutzt werden:

1. **Google Drive oder Dropbox**: Ähnliche Funktionalität, erfordert jedoch Installation zusätzlicher Software
2. **Manuelle Backups**: Regelmäßiges Kopieren des Datenverzeichnisses
3. **PowerShell-basierte Backup-Skripte**: Automatisierung von Backups zu bestimmten Zeitpunkten

## Weiterentwicklung und Roadmap

Zukünftige Verbesserungen könnten folgende Punkte umfassen:

1. Integration eines vollständigen Kalenders für Routinen und Aufgabenplanung
2. Erweiterte Statistik- und Berichterstellung
3. Robustere Datenbanklösung (SQLite oder ähnliches)
4. Erweitertes Exportformat (Excel, CSV)
5. Erweiterte Cloud-Synchronisationsfunktionen und automatisches Backup
