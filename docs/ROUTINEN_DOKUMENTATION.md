# Routinen-System - GartenMeisterStudio

## Übersicht

Das Routinen-System ist ein zentraler Bestandteil des GartenMeisterStudio, der es Benutzern ermöglicht, wiederkehrende Aufgaben im Garten zu planen, zu verfolgen und zu verwalten. Diese Dokumentation beschreibt die Architektur, API-Endpunkte und Benutzeroberfläche des Systems.

## Datenmodell

### Routine-Interface

```typescript
export interface Routine {
  id: string;               // Eindeutige ID
  name: string;             // Name der Routine
  description?: string;     // Optionale Beschreibung
  type: 'calendar' | 'bed' | 'harvest' | 'herb' | 'other';  // Kategorie
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';    // Häufigkeit
  lastRun?: string;         // Zeitstempel der letzten Ausführung (ISO-String)
  nextRun?: string;         // Zeitstempel der nächsten geplanten Ausführung (ISO-String)
  configuration: Record<string, any>; // Typenspezifische Konfiguration
}
```

## Architektur

### 1. RoutinesManager (`src/lib/routines-manager.ts`)

Ein Singleton-Muster zur Verwaltung von Routinen mit folgenden Hauptfunktionen:

- Initialisierung und Laden gespeicherter Routinen
- Hinzufügen/Aktualisieren von Routinen
- Löschen von Routinen
- Abfrage von Routinen (alle, nach Typ, nach ID)
- Aktualisierung von Zeitstempeln für die Ausführung

Die Persistenz erfolgt über den Electron-Konfigurationsspeicher mit dem Schlüssel `garden_routines`.

### 2. API-Endpunkte (`src/app/api/routines/route.ts`)

RESTful-Endpunkte für die Kommunikation zwischen der UI und dem RoutinesManager:

- **GET /api/routines**: Alle Routinen abrufen (optional nach Typ filtern)
- **POST /api/routines**: Neue Routine erstellen
- **PUT /api/routines**: Bestehende Routine aktualisieren
- **PATCH /api/routines**: Zeitstempel einer Routine aktualisieren (zur Markierung als ausgeführt)
- **DELETE /api/routines**: Routine löschen

### 3. UI-Komponenten

- **RoutineList** (`src/components/routines/RoutineList.tsx`): Anzeige aller Routinen in einer Tabelle mit Aktionsmöglichkeiten (Bearbeiten, Löschen, als ausgeführt markieren)
- **RoutineForm** (`src/components/routines/RoutineForm.tsx`): Formular zum Erstellen und Bearbeiten von Routinen
- **Routines Page** (`src/app/routines/page.tsx`): Hauptseite, die die Routinen-Komponenten enthält und nach Kategorien filtert

## Arbeitsablauf

### 1. Routinen erstellen

1. Benutzer öffnet die Routinen-Seite über die Seitenleiste
2. Klickt auf "Neue Routine"
3. Füllt das Formular mit Namen, Beschreibung, Typ und Häufigkeit aus
4. Speichert die Routine

### 2. Routinen verwalten

- Bearbeiten: Klick auf das Bearbeiten-Symbol bei einer Routine
- Löschen: Klick auf das Löschen-Symbol (mit Bestätigungsdialog)
- Als ausgeführt markieren: Klick auf das Häkchen-Symbol

### 3. Automatische Aktualisierung

Das System berechnet automatisch das nächste Ausführungsdatum basierend auf der Häufigkeit:

- Täglich: +1 Tag
- Wöchentlich: +7 Tage
- Monatlich: +1 Monat
- Jährlich: +1 Jahr

## Integration mit anderen Modulen

### 1. Dashboard-Integration

Geplant ist die Anzeige anstehender Routinen im Dashboard-Widget (`TodoWidget.tsx`), sortiert nach Fälligkeit.

### 2. Kalender-Integration

Die Routinen sollen im Kalender-Widget (`CalendarWidget.tsx`) als Termine dargestellt werden, mit Farb-Kodierung je nach Typ und automatischer Aktualisierung.

### 3. Erinnerungen (geplant)

Ein Benachrichtigungssystem soll hinzugefügt werden, das den Benutzer an anstehende Routinen erinnert.

## Technische Details

### Datenpersistenz

Die Routinen werden in der Electron-Konfiguration gespeichert:

1. Im Arbeitsspeicher während der Laufzeit mit `this.routines`
2. Persistent in der Electron-Konfiguration über `electronAPI.saveConfig()`
3. Beim Start werden Daten geladen über `electronAPI.getConfig()`

### Fehlerbehandlung

Alle API-Endpunkte und UI-Aktionen enthalten umfassende Fehlerbehandlung:

1. Try-Catch-Blöcke um alle asynchronen Operationen
2. Toast-Benachrichtigungen für Benutzer-Feedback
3. Konsolen-Logs für Debugging-Zwecke

### Leistungsoptimierung

- Lazy Loading von Komponenten
- Wiederverwendung des RoutinesManager-Singleton

## Zukünftige Erweiterungen

1. **Erweiterte Konfigurationsoptionen** für unterschiedliche Routinen-Typen:
   - Beet-spezifische Routinen mit Beet-Auswahlmöglichkeit
   - Kräuter-spezifische Routinen mit Kräutersorte-Auswahl

2. **Verbesserte Zeitplanung**:
   - Unterstützung für komplexere Wiederholungsmuster
   - Berücksichtigung saisonaler Faktoren (Frühling, Sommer, Herbst, Winter)

3. **Fortschritts-Tracking**:
   - Erfassung von Ausführungsdetails (Dauer, Ergebnis, Notizen)
   - Statistische Auswertung der Routine-Einhaltung

4. **Automatisierung**:
   - Automatische Erinnerungen über Betriebssystem-Benachrichtigungen
   - Export von Routinen in externe Kalender (Google, Outlook, iCal)
