# Fehlerbehebung - GartenMeisterStudio (09.06.2025)

In dieser Datei werden bekannte Fehler, ihre Lösungen und Hinweise zur Problembehebung dokumentiert.

## Inhaltsverzeichnis
1. [Behobene Fehler](#behobene-fehler)
2. [Bekannte Probleme](#bekannte-probleme)
3. [Häufige Fehlermeldungen](#häufige-fehlermeldungen)
4. [Entwicklungsprobleme](#entwicklungsprobleme)
5. [Leistungsoptimierung](#leistungsoptimierung)
6. [PDF-Export-Probleme](#pdf-export-probleme)

## Behobene Fehler

### 1. Routinen-API-Fehler (500 Internal Server Error)

**Problem:**
Die Routinen-API (`/api/routines`) hat einen Server-Fehler 500 zurückgegeben, wenn eine neue Routine gespeichert wurde. Der Hauptgrund war, dass der Routinen-Manager ausschließlich auf die Electron-API angewiesen war, die im Browser-Modus nicht verfügbar ist.

**Lösung:**
- Die `routines-manager.ts`-Datei wurde um Browser-Unterstützung erweitert
- Ein Fallback zu `localStorage` wurde implementiert, wenn die Anwendung nicht in der Electron-Umgebung läuft
- Die `isElectron()`-Funktion wird nun verwendet, um den Ausführungskontext zu erkennen
- Zusätzliche Fehlerbehandlung eingebaut

```typescript
// Anpassung im routines-manager.ts
public async initialize(): Promise<void> {
  if (this.initialized) return;

  try {
    if (isElectron()) {
      const config = await electronAPI.getConfig();
      if (config && config[ROUTINES_STORAGE_KEY]) {
        this.routines = config[ROUTINES_STORAGE_KEY];
      }
    } else {
      // Im Browser: Aus localStorage laden
      this.routines = getLocalStorage();
    }
    this.initialized = true;
  } catch (error) {
    console.error('Fehler beim Laden der Routinen:', error);
    this.routines = [];
    this.initialized = true;
  }
}
```

### 2. Teams Widget-Initialisierungsfehler

**Problem:**
Die TeamsWidget-Komponente versuchte, das Microsoft Teams SDK zu initialisieren, auch wenn die App nicht innerhalb von Microsoft Teams ausgeführt wurde, was zu einem Fehler führte: `Uncaught (in promise) Error: Initialization Failed. No Parent window found.`

**Lösung:**
- Eine Prüfung hinzugefügt, ob die App in einem iframe ausgeführt wird (typisch für Teams-Integrationen)
- Die SDK-Initialisierung wird übersprungen, wenn die App nicht in einem iframe läuft
- Fehlerbehandlung hinzugefügt, um die Anwendung stabil zu halten

```typescript
// Anpassung im TeamsWidget.tsx
useEffect(() => {
  try {
    // Prüfen, ob wir in einer Teams-Umgebung sind, bevor wir initialisieren
    if ((window as any).parent === window) {
      // Wir sind nicht in einem iframe - vermutlich nicht in Teams
      console.log('Nicht in Teams-Umgebung, SDK-Initialisierung übersprungen.');
    } else {
      // Möglicherweise in Teams - sicherheitshalber versuchen
      microsoftTeams.initialize();
    }
  } catch (error) {
    console.log('Microsoft Teams SDK kann nicht initialisiert werden.');
  }
  
  // Weitere Initialisierungen...
}, [date]);
```

### 3. Google Calendar API-Fehler

**Problem:**
Die Google Calendar API-Integration verwendete Platzhalter-Werte für API-Schlüssel und Client-ID (`< DEIN_API_KEY_HIER >`), die zu einem `400 Bad Request`-Fehler führten.

**Lösung:**
- Platzhalter durch Dummy-Werte ersetzt, die keine API-Anfragen auslösen
- Die Discovery-Dokument-URL auskommentiert, um unnötige API-Aufrufe zu vermeiden
- Eine robuste Fehlerbehandlung für die ApiCalendar-Instanz implementiert
- Ein Dummy-Objekt wird erstellt, wenn die ApiCalendar-Instanz nicht initialisiert werden kann

```typescript
// Anpassung in CalendarWidget.tsx - Konfiguration
const config = {
  clientId: 'dummy-client-id.apps.googleusercontent.com',
  apiKey: 'dummy-api-key',
  scope: 'https://www.googleapis.com/auth/calendar',
  discoveryDocs: [
    // Deaktiviert, um API-Fehler zu vermeiden
  ],
};

// ApiCalendar-Instanz mit Fehlerbehandlung
let apiCalendar;
try {
  apiCalendar = new ApiCalendar(config);
} catch (error) {
  console.log('Fehler beim Erstellen der ApiCalendar-Instanz:', error);
  // Dummy-Objekt erstellen
  apiCalendar = {
    handleAuthClick: () => console.log('Auth-Mock: handleAuthClick aufgerufen'),
    listEvents: () => Promise.resolve([]),
    signOut: () => console.log('Auth-Mock: signOut aufgerufen'),
    listenSign: (callback) => {}
  };
}
```

## Empfehlungen für die Weiterentwicklung

1. **Bessere Umgebungserkennung**: Implementieren Sie einen einheitlichen Service zur Erkennung der Ausführungsumgebung (Electron vs. Browser).

2. **Konfigurierbare externe APIs**: Erstellen Sie ein zentrales Konfigurationssystem für externe API-Schlüssel, das Entwicklungs-, Test- und Produktionswerte unterstützt.

3. **Fallback-Strategie**: Erweitern Sie weitere Module mit Fallback-Mechanismen für unterschiedliche Ausführungsumgebungen.

4. **Besseres Error-Logging**: Implementieren Sie ein strukturiertes Error-Logging-System, das Fehler kategorisiert und bei Bedarf an ein Monitoring-System sendet.

5. **Komponentenisolierung**: Kapseln Sie externe API-Abhängigkeiten besser, um lokale Fehler zu verhindern.

## Verwendete Strategien

- **Umgebungserkennung**: Verwendung der `isElectron()`-Funktion, um die Ausführungsumgebung zu bestimmen
- **Fallback-Mechanismen**: Implementierung von Ersatzspeicherverfahren (localStorage) im Browser-Modus
- **Defensive Programmierung**: Einbau von try/catch-Blöcken um kritischen Code
- **Mocking**: Erstellung von Mock-Objekten für fehlende APIs und Dienste

## Bekannte Probleme

### 1. Abstürze bei gleichzeitigen API-Aufrufen

**Symptom:** Die Anwendung kann einfrieren, wenn mehrere API-Aufrufe gleichzeitig erfolgen, insbesondere beim Laden der Dashboard-Seite.

**Ursache:** Race-Conditions beim gleichzeitigen Zugriff auf den In-Memory-Datenspeicher.

**Workaround:**
- Dashboard-Widgets nach einem kurzen Zeitversatz laden
- Laden der Daten synchronisieren oder cachen

**Geplante Lösung:**
- Implementierung eines besseren State-Management-Systems

### 2. Verzögerte PDF-Generierung bei großen Datensätzen

**Symptom:** Die PDF-Generierung kann bei vielen Beeten und Segmenten mehrere Sekunden dauern.

**Ursache:** Der PDF-Generierungsprozess blockiert den Renderer-Thread.

**Workaround:**
- Optimierte Templates für PDF-Berichte verwenden
- Datenmenge pro Bericht reduzieren

**Geplante Lösung:**
- Verlagerung der PDF-Generierung in einen Worker-Prozess

### 3. Fehlerhafte Darstellung im Windows-Hochkontrastmodus

**Symptom:** Einige UI-Elemente sind im Windows-Hochkontrastmodus schlecht sichtbar.

**Ursache:** Fehlendes Theme für den Hochkontrastmodus.

**Workaround:**
- Windows-Anzeige auf Standard-Kontrastmodus umstellen

**Geplante Lösung:**
- Implementierung eines speziellen Themes für Hochkontrastmodus

## Häufige Fehlermeldungen

### "Failed to load resource: net::ERR_CONNECTION_REFUSED"

**Ursache:** Der Next.js-Server wurde nicht gestartet oder läuft nicht auf Port 9002.

**Lösung:**
1. Überprüfe, ob ein Next.js-Server auf Port 9002 läuft: `netstat -ano | findstr "9002"`
2. Starte den Next.js-Server manuell: `npm run dev`
3. Starte Electron neu: `npm run electron`

### "Error: ENOENT: no such file or directory"

**Ursache:** Fehlende Verzeichnisse für Daten oder Konfigurationsdateien.

**Lösung:**
1. Stelle sicher, dass die nötigen Verzeichnisse existieren:
```powershell
mkdir -Force "$env:APPDATA\gartenmeister-studio\exports"
mkdir -Force "$env:APPDATA\gartenmeister-studio\database"
```

### "Uncaught (in promise) Error: Initialization Failed. No Parent window found."

**Ursache:** Microsoft Teams SDK wird außerhalb der Teams-Umgebung initialisiert.

**Lösung:**
Die fehlerhafte Initialisierung wird nun abgefangen. Keine Aktion erforderlich.

## Entwicklungsprobleme

### Hot-Reload funktioniert nicht

**Ursache:** Next.js und Electron sind nicht korrekt synchronisiert.

**Lösung:**
1. Beende alle laufenden Prozesse: `taskkill /F /IM node.exe /T; taskkill /F /IM electron.exe /T`
2. Starte die Anwendung mit dem kombinierten Befehl: `npm run dev:electron`

### TypeScript-Fehler trotz korrektem Code

**Ursache:** TypeScript-Cache enthält veraltete Definitionen.

**Lösung:**
1. TypeScript-Cache leeren: `rm -r -fo ./node_modules/.cache/typescript`
2. TypeScript neu kompilieren: `npx tsc --noEmit`

### "Error: listen EADDRINUSE: address already in use :::9002"

**Ursache:** Port 9002 ist bereits belegt.

**Lösung:**
1. Prozess auf Port 9002 identifizieren: `netstat -ano | findstr ":9002"`
2. Prozess beenden: `taskkill /F /PID <PID>`

## Leistungsoptimierung

### Langsames Starten der Anwendung

**Optimierungsmaßnahmen:**
1. Next.js-Build optimieren:
   ```
   // next.config.js
   module.exports = {
     experimental: {
       optimizeCss: true,
       optimizeImages: true
     }
   }
   ```

2. Electron-Fenstergestaltung optimieren:
   ```javascript
   mainWindow = new BrowserWindow({
     show: false, // Fenster erst anzeigen, wenn Inhalte geladen sind
     // ...weitere Optionen
   });
   
   mainWindow.once('ready-to-show', () => {
     mainWindow.show();
   });
   ```

### Hohe CPU-Auslastung im Leerlauf

**Optimierungsmaßnahmen:**
1. Polling in UI-Komponenten reduzieren:
   - Intervalle für Datenaktualisierung verlängern
   - Event-basierte Aktualisierung statt regelmäßiger Abfragen nutzen

2. React-Rendering optimieren:
   - `React.memo()` für häufig genutzte Komponenten verwenden
   - `useMemo()` und `useCallback()` für rechenintensive Operationen einsetzen
   - Virtual Scrolling für lange Listen implementieren

## PDF-Export-Probleme

### 1. Fehler beim Laden der PDF-Fonts (09.06.2025)

**Problem:**
Der PDF-Export schlug fehl mit dem Fehler: `TypeError: Cannot read properties of undefined (reading 'vfs')` beim Zugriff auf `pdfFonts.pdfMake.vfs`.

**Ursache:**
Die VFS (Virtual File System)-Struktur für Fonts in pdfMake war nicht wie erwartet verfügbar.

**Lösung:**
- Robuste Font-Initialisierung mit mehreren Fallback-Optionen
- Implementierung einer Standard-Font-Definition für den Fall, dass keine eingebetteten Fonts verfügbar sind
- Umfassende Fehlerbehandlung in allen Phasen des PDF-Erstellungsprozesses

Detaillierte Informationen zur Behebung sind in der [PDF-Export-Fixes Dokumentation](./PDF_EXPORT_FIXES.md) zu finden.

### 2. Grafische Gartenübersicht exportieren (09.06.2025)

**Problem:**
Es fehlte eine Funktion, um die visuelle Darstellung der Gartenübersicht als PDF zu exportieren.

**Ursache:**
Die vorhandene PDF-Export-Funktion unterstützte nur tabellarische Daten von Beeten und Berichten, aber keine grafische Visualisierung.

**Lösung:**
- Implementierung einer neuen Garden-Export-PDF-Button-Komponente
- Nutzung von `html2canvas` zur Umwandlung der HTML-Visualisierung in ein Bild
- Erweiterung der PDF-Export-Funktionalität in der Electron-Hauptprozess-API
- Hinzufügen von umfangreichen Datenstrukturen für Legende und Beetdetails

Die neue Exportfunktion kann über einen Button in der Gartenübersicht aufgerufen werden und erzeugt ein umfassendes PDF mit Visualisierung und allen relevanten Daten.
