# GartenMeister NAS-Integration — Einrichtungsanleitung

> **Stand: April 2026 · App-Version 2.0.0**  
> NAS-Pfad: `/volume1/Gurktaler/gartenmeister/`  
> Build-Output: `GartenMeister-v2.0-Portable/GartenMeister-Portable-2.x.x-Portable.exe`

## Übersicht: Wie hängt alles zusammen?

```
┌─────────────────────────────────────────────────────────┐
│  Windows-PC: GartenMeister (Electron-App)               │
│                                                         │
│  Einstellungen → NAS-Integration                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │  NAS-URL: http://100.121.103.107:3003             │    │
│  │  [Testen] → /api/health ────────────────────┐   │    │
│  │  QR-Code → /upload.html   ──────────────┐   │   │    │
│  └─────────────────────────────────────────┼───┼───┘    │
└────────────────────────────────────────────┼───┼────────┘
                          Tailscale VPN       │   │
┌───────────────────────────────────────────┐│   │
│  Synology NAS                             ││   │
│                                           ↓↓   │
│  node server-gartenmeister.js (Port 3003) ◄─   │
│  /volume1/Gurktaler/gartenmeister/nas/          │
│  ├── nas/server-gartenmeister.js               │
│  ├── nas/public/upload.html  ← PWA             │
│  ├── images/                                   │
│  ├── documents/                                │
│  ├── database/images-catalog.json              │
│  └── backups/                                  │
└────────────────────────────────────────────────┘
                          Tailscale VPN
┌─────────────────────────────────────────────────┐
│  Android-Smartphone                             │
│  → http://100.121.103.107:3003/upload.html     │◄───────┘
│  Installierbar als App (PWA, standalone)         │
│  Fotos direkt von der Kamera hochladen           │
└─────────────────────────────────────────────────┘
```

---

## Schritt 1: NAS-Server einrichten (Synology)

### 1.1 Dateien auf die NAS kopieren
**SCP ist deaktiviert auf der Synology → SSH-Pipe verwenden:**
```powershell
# PowerShell auf dem PC (Tailscale muss aktiv sein)
Get-Content nas\server-gartenmeister.js -Raw | ssh admin@100.121.103.107 "cat > /volume1/Gurktaler/gartenmeister/nas/server-gartenmeister.js"
Get-Content nas\package.json -Raw | ssh admin@100.121.103.107 "cat > /volume1/Gurktaler/gartenmeister/nas/package.json"
Get-Content nas\public\upload.html -Raw | ssh admin@100.121.103.107 "cat > /volume1/Gurktaler/gartenmeister/nas/public/upload.html"
```

Verzeichnisstruktur auf der NAS:
```
/volume1/Gurktaler/gartenmeister/
├── nas/
│   ├── server-gartenmeister.js    ← Hauptserver
│   ├── package.json
│   ├── node_modules/              ← nach npm install
│   └── public/
│       └── upload.html            ← Smartphone-Upload-PWA
├── images/
├── documents/
├── database/
└── backups/
```

### 1.2 Abhängigkeiten installieren
Per SSH auf der NAS:
```bash
cd /volume1/Gurktaler/gartenmeister/nas
npm install
```
Das installiert `sharp` für automatische Thumbnail-Erstellung (300 px).

### 1.3 Server starten (manuell zum Testen)
```bash
cd /volume1/Gurktaler/gartenmeister/nas
node server-gartenmeister.js
# → GartenMeister NAS-Server läuft auf Port 3003
```

Health-Check: `http://100.121.103.107:3003/api/health`

### 1.4 Server als Autostart einrichten (Synology Task Scheduler)
- DSM → Systemsteuerung → Aufgabenplaner → Erstellen → Getriggert durch Start
- Benutzer: `root`
- Skript:
```bash
cd /volume1/Gurktaler/gartenmeister/nas && node server-gartenmeister.js >> /volume1/Gurktaler/gartenmeister/logs/server.log 2>&1 &
```

---

## Schritt 2: Tailscale verbinden

Tailscale muss auf **PC** und **NAS** installiert und eingeloggt sein.
Die Tailscale-IP der NAS: `100.121.103.107` (NAS: DS124-RockingK)

Verbindungstest im Browser: `http://100.121.103.107:3003/api/health`
→ Erwartetes Ergebnis:
```json
{ "success": true, "status": "online", "basePath": "/volume1/Gurktaler/gartenmeister", "uptimeFormatted": "..." }
```

---

## Schritt 3: GartenMeister-App konfigurieren

1. App öffnen → **Einstellungen** → Tab **NAS-Integration**
2. Ganz oben: Abschnitt **GartenMeister API-Server**
3. Schalter **NAS-Verbindung aktivieren** einschalten
4. URL eingeben: `http://100.121.103.107:3003` (Tailscale-IP der NAS)
5. Klick auf **Testen** → grüner Badge „Online" erscheint
6. **Einstellungen speichern**

Ab jetzt werden:
- neu hochgeladene **Fotos** zusätzlich auf der NAS gespeichert
- **Dokumente** (PDF/JPG) lokal und auf der NAS abgelegt

---

## Schritt 4: Upload-PWA auf Android installieren

### 4.1 Erste Nutzung im Browser
1. Einstellungen → NAS-Integration → QR-Code mit Android-Kamera scannen
2. Chrome öffnet `http://100.121.103.107:3003/upload.html`
3. Kurz warten — Chrome zeigt automatisch den Banner **„App installieren"** oder **„Zum Startbildschirm hinzufügen"**
4. Tippen → App landet im App-Drawer und auf dem Homescreen

### 4.2 Foto hochladen
1. App öffnen (startet im Standalone-Modus, ohne Browser-Adressleiste)
2. Tippen auf den Foto-Bereich → Kamera öffnet sich direkt
3. Kategorie, Beet-ID (optional) und Titel eingeben
4. **Foto hochladen** — Fortschrittsbalken läuft durch
5. Erfolgsmeldung mit Bildgröße und Auflösung

Das Foto landet sofort in:
- `/volume1/Gurktaler/gartenmeister/images/[Kategorie]/`
- Thumbnail (300 px) unter `/volume1/Gurktaler/gartenmeister/thumbnails/`
- Eintrag in `database/images-catalog.json`

### 4.3 Offline-Verhalten
Die App-Shell (`upload.html`, `manifest.json`) wird vom Service Worker gecacht.
- App öffnet sich auch ohne Netzwerk
- Upload-Button ist erst aktiv wenn die NAS erreichbar ist (Tailscale-Verbindung nötig)

> **Hinweis:** Die NAS-URL wird im `localStorage` des Browsers gespeichert und muss nur
> einmal eingegeben werden.

---

## Schritt 5: Dokumente verwalten (DB.3)

Die Dokument-API ist im Code verfügbar:

```typescript
// Dokument hochladen (PDF oder Bild als Base64)
await electronAPI.documents.upload({
  documentType: 'invoice',        // 'invoice' | 'delivery-note' | 'other'
  name: 'Rechnung-April.pdf',
  dataUrl: 'data:application/pdf;base64,...',
  description: 'Saatgut-Rechnung',
  tags: ['saatgut', '2026'],
});

// Alle Dokumente auflisten
const docs = await electronAPI.documents.getList({ documentType: 'invoice' });

// Dokument abrufen (mit Base64-Inhalt zum Anzeigen/Herunterladen)
const doc = await electronAPI.documents.getFile(documentId);
// doc.dataUrl → im Browser anzeigbar

// Dokument löschen
await electronAPI.documents.delete(documentId);
```

**Speicherorte:**
- Lokal: `%APPDATA%\GartenMeister-Portable\`
- NAS (wenn aktiviert): `/volume1/Gurktaler/gartenmeister/documents/`

---

## NAS-API Endpunkte (Übersicht)

| Methode | Pfad | Funktion |
|---------|------|----------|
| GET | `/api/health` | Verbindungstest |
| POST | `/api/image` | Bild hochladen (Base64) |
| GET | `/api/image?id=...` | Bild-Metadaten abrufen |
| DELETE | `/api/image?id=...` | Bild löschen |
| GET | `/api/images` | Alle Bilder (gefiltert) |
| POST | `/api/document` | Dokument hochladen |
| GET | `/` `/upload.html` | Upload-PWA |
| GET | `/manifest.json` | PWA-Manifest |
| GET | `/sw.js` | Service Worker |
| GET | `/icons/*.png` | PWA-Icons |
| GET/POST | `/api/json?key=...` | Generische JSON-Daten (mit Datenverlustschutz) |
| POST | `/api/backup` | Backup erstellen |
| GET | `/api/backups` | Backup-Liste |

---

## Sicherheitshinweise

- Der NAS-Server läuft **nur im Tailscale-VPN** (keine öffentliche IP)
- Alle Dateipfade werden gegen **Path-Traversal** (`../`) geschützt
- **Datenverlustschutz**: JSON-Dateien werden nur überschrieben, wenn die neue Version nicht leer ist
- Backups werden bei jedem JSON-Schreibvorgang automatisch angelegt

---

## Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Badge bleibt „Nicht erreichbar" | Tailscale-Verbindung prüfen; `node server.js` auf NAS laufen? |
| QR-Code erscheint nicht | NAS-URL muss gespeichert sein (erst speichern, dann QR sichtbar) |
| Fotos landen nicht auf NAS | Schalter „NAS aktivieren" + speichern; Verbindungstest erfolgreich? |
| `sharp` install schlägt fehl | Node-Version auf NAS prüfen: `node --version` (min. v18) |
| Chrome zeigt kein „Installieren"-Banner | Seite mind. 30 Sek. offen lassen; `manifest.json` + `sw.js` erreichbar? |
| Service Worker veraltet | Chrome DevTools → Application → Service Workers → „Update" klicken |
| `EACCES mkdir /volume1/GartenMeister` | Falscher BASE_PATH — korrekt: `/volume1/Gurktaler/gartenmeister` |

---

## Build-Anleitung (Windows EXE)

### Neue Portable EXE erstellen
```powershell
cd C:\Users\wolfg\Desktop\GartenMeisterStudio
npm run build:portable
```

**Output-Verzeichnis:** `GartenMeister-v2.0-Portable\`  
**Dateiname:** `GartenMeister-Portable-2.x.x-Portable.exe`  
**Größe:** ~114 MB

### Versionsnummer erhöhen
In `package.json` → Feld `"version"` auf neue `2.x.x` setzen → Build neu starten.  
Der EXE-Dateiname aktualisiert sich automatisch.

### Build-Konfiguration
`electron-builder-portable-only.config.js`
- `directories.output`: `"GartenMeister-v2.0-Portable"` (fester Ordner, versionsunabhängig)
- `artifactName`: `"${productName}-${version}-Portable.${ext}"` (Version aus package.json)
- Icon: `build/icon.ico` (per `git add -f build/icon.ico` im Repo tracken)
