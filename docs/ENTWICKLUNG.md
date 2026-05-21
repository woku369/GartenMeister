# GartenMeisterStudio - Entwicklungsdokumentation

## Behobene Fehler und API-Anpassungen (09.06.2025)

### 1. Segment API-Route Korrektur

**Problem:**
Die API-Route für Segmente in `src/app/api/segments/route.ts` hatte falsche Parameter-Übergaben. Die Funktion `addSegmentToBed` (umbenannt zu `addSegment`) erwartete zwei Parameter (`bedId` und `segmentData`), aber die Route übergab nur einen Parameter.

**Lösung:**
- Die POST-Methode wurde aktualisiert, um die `bedId` korrekt aus der Anfrage zu extrahieren und als separaten Parameter zu übergeben
- Eine Validierung für `bedId` wurde hinzugefügt
- Der Code ist nun:
```typescript
export async function POST(request: Request) {
  try {
    const { bedId, ...segmentData } = await request.json() as SegmentFormData & { bedId: string };
    
    if (!bedId) {
      return NextResponse.json({ error: 'bedId is required' }, { status: 400 });
    }
    
    const newSegment = await addSegment(bedId, segmentData);
    return NextResponse.json(newSegment, { status: 201 });
  } catch (error) {
    console.error('Failed to create segment:', error);
    return NextResponse.json({ error: 'Failed to create segment' }, { status: 500 });
  }
}
```

### 2. Routinen-Verwaltungssystem

Ein neues System zur Verwaltung wiederkehrender Routinen wurde implementiert:

**Neue Dateien:**
- `src/lib/routines-manager.ts`: Kern-Bibliothek zur Verwaltung von Routinen
- `src/app/api/routines/route.ts`: API-Endpunkte für CRUD-Operationen
- `src/components/routines/RoutineForm.tsx`: Formular zum Erstellen/Bearbeiten von Routinen
- `src/components/routines/RoutineList.tsx`: Komponente zur Anzeige von Routinen
- `src/app/routines/page.tsx`: Hauptseite für die Routinen-Verwaltung

**Funktionalitäten:**
- Persistente Speicherung von wiederkehrenden Gartenaufgaben
- Kategorisierung nach Typen (Kalender, Beet, Ernte, Kräuter, Sonstiges)
- Verfolgung der letzten und nächsten Ausführung
- Unterstützung verschiedener Frequenzen (täglich, wöchentlich, monatlich, jährlich)

### 3. Electron-Prozess-Management

**Befehlshinweise:**
- Richtiger Startbefehl für Electron-App: `cd C:\Users\WK\GartenMeisterStudio; npm run dev:electron`
- Bei Problemen mit laufenden Prozessen: `taskkill /F /IM node.exe /T; taskkill /F /IM electron.exe /T`

## Architektur und Datenfluss

### API-Struktur

Die Anwendung nutzt einen mehrstufigen Ansatz für Datenoperationen:

1. **API-Routen** (`src/app/api/*/route.ts`)
   - HTTP-Endpunkte für Client-Zugriff
   - Parameter-Validierung
   - Aufrufe der Action-Funktionen

2. **Server-Actions** (`src/lib/actions/*.ts`)
   - Geschäftslogik und Validierung
   - Cache-Invalidierung mit `revalidatePath()`
   - Aufrufe der Datenzugriffsfunktionen

3. **Datenzugriffsschicht** (`src/lib/data.ts`)
   - In-Memory-Speicher mit `globalThis.__app_store__`
   - CRUD-Operationen auf den Daten
   - Datenmodellierung und -transformationen

4. **Electron-Bridge** (`src/lib/electron-bridge.ts`)
   - Schnittstelle zwischen Next.js und Electron
   - Persistenz (Dateisystem-Zugriff, Konfigurationsspeicherung)
   - Systemfunktionen (PDF-Export, Dateipfade etc.)

## Wichtige Datentypen und Schnittstellen

### Beet-Operationen
- `Bed`: Basis-Interface für alle Beet-Typen
- `StandardBed`, `SpecialBed`, `Versuchsbeet`: Spezialisierte Beet-Typen
- `BedFormData`: Für Eingabeformulare optimierter Datentyp

### Segment-Operationen
- `VersuchsbeetSegment`: Interface für Segmente in Versuchsbeeten
- `SegmentFormData`: Für Eingabeformulare optimierter Datentyp

### Routinen-Verwaltung
- `Routine`: Interface für wiederkehrende Aufgaben
```typescript
export interface Routine {
  id: string;
  name: string;
  description?: string;
  type: 'calendar' | 'bed' | 'harvest' | 'herb' | 'other';
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  lastRun?: string; // ISO date string
  nextRun?: string; // ISO date string
  configuration: Record<string, any>; // Spezifische Konfiguration basierend auf dem Typ
}
```

## Bekannte Einschränkungen und offene Punkte

1. Die Anwendung nutzt einen In-Memory-Speicher, der beim Neustart der Anwendung zurückgesetzt wird. Eine persistente Speicherlösung wäre eine sinnvolle Erweiterung.

2. Die Google Calendar-Integration in CalendarWidget.tsx zeigt aktuell Demo-Daten an, wenn keine API-Schlüssel konfiguriert sind.

3. Für eine Produktivumgebung sollte eine robustere Fehlerbehandlung implementiert werden, insbesondere für API-Aufrufe.

4. Die Routinen-Integration mit dem Calendar-Widget und Dashboard ist noch nicht vollständig implementiert.

3. Für eine Produktivumgebung sollte eine robustere Fehlerbehandlung implementiert werden, insbesondere für API-Aufrufe.

## Entwicklungs-Workflow

### App starten
```powershell
cd C:\Users\WK\GartenMeisterStudio; npm run dev:electron
```

### Prozesse beenden
```powershell
taskkill /F /IM node.exe /T; taskkill /F /IM electron.exe /T
```

### Wichtige npm-Skripte
- `npm run dev`: Startet nur den Next.js-Server
- `npm run dev:electron`: Startet Next.js und Electron synchronisiert
- `npm run build`: Baut die Next.js-App
- `npm run build:electron`: Baut sowohl Next.js als auch die Electron-App
- `npm run package`: Erstellt ein ausführbares Paket

## Implementierte Module

### 1. Routinen-Manager

Der Routinen-Manager (`src/lib/routines-manager.ts`) implementiert das Singleton-Muster und bietet folgende Funktionen:

```typescript
// Hauptfunktionen des RoutinesManager
public async initialize(): Promise<void> {...}           // Lädt gespeicherte Routinen
private async saveRoutines(): Promise<boolean> {...}     // Speichert Routinen
public async addOrUpdateRoutine(routine: Routine): Promise<boolean> {...} // Hinzufügen/Aktualisieren
public async removeRoutine(id: string): Promise<boolean> {...}           // Entfernen 
public async getAllRoutines(): Promise<Routine[]> {...}                  // Alle abrufen
public async getRoutinesByType(type: Routine['type']): Promise<Routine[]> {...} // Nach Typ filtern
public async getRoutineById(id: string): Promise<Routine | undefined> {...}    // Nach ID suchen
public async updateRoutineTimestamp(id: string): Promise<boolean> {...}        // Zeitstempel aktualisieren
```

### 2. Routinen API-Endpunkte

Die Routinen-API in `src/app/api/routines/route.ts` stellt RESTful-Endpunkte bereit:

- **GET** - Alle Routinen abrufen, optional nach Typ gefiltert
- **POST** - Neue Routine erstellen
- **PUT** - Bestehende Routine aktualisieren
- **PATCH** - Zeitstempel einer Routine aktualisieren (Markierung als ausgeführt)
- **DELETE** - Routine löschen

### 3. Routinen-Benutzeroberfläche

Die Benutzeroberfläche besteht aus:

- **RoutineForm.tsx**: Ein Formular für die Erstellung und Bearbeitung von Routinen
  - Name, Beschreibung, Typ und Häufigkeit werden erfasst
  - Validierung mit Zod Schema
  
- **RoutineList.tsx**: Eine Tabelle zur Anzeige und Verwaltung von Routinen
  - Aktionen: Bearbeiten, Löschen, Als ausgeführt markieren
  - Statusanzeige für letzte und nächste Ausführung
  
- **routines/page.tsx**: Die Hauptseite mit Tabs zur Filterung nach Kategorien

## Nächste Schritte

1. **Dashboard-Integration**: Anzeige anstehender Routinen im Dashboard

2. **Kalender-Integration**: Darstellung von Routinen im Kalender-Widget  

3. **Erweiterte Routinen**: Spezifischere Konfigurationen für verschiedene Routinen-Typen:
   - Beet-spezifische Routinen mit Beet-Auswahl
   - Kräuter-spezifische Routinen mit Kräutersorte-Auswahl

4. **Benachrichtigungssystem**: Erinnerungen für anstehende Routinen

5. **Statistik und Berichte**: Auswertung der Routine-Einhaltung und Erfolgsmessung

6. **Persistenz**: Implementierung einer robusteren persistenten Speicherlösung für alle Datenbereiche

7. **Offline-Modus**: Verbesserung der Offline-Funktionalität

8. **Unit-Tests**: Implementierung von Tests für kritische Geschäftslogik
