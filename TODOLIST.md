# ✅ GartenMeister – Aktuelle Todo-Liste

**Zuletzt aktualisiert:** April 2026  
**Aktiver Branch:** `feature/quadrant-layout`  
**Stable Branch:** `portable-exe-build` (v1.0 EXE funktional)

---

## 🔴 v2.0 – feature/quadrant-layout (AKTUELLE ARBEIT)

### Schritt 5.1 – Neue Typen in `definitions.ts`
- [ ] `BeetOrientierung`: `'laengs' | 'quer'`
- [ ] `QuadrantPosition`: `'NW' | 'NO' | 'SW' | 'SO'`
- [ ] `QuadrantConfig`: Interface (Position, Orientierung, Wegbreiten, Abmessungen)
- [ ] `WegKonfiguration`: Längsweg + Querweg (Position + Breite, frei verschiebbar)
- [ ] `RondeauConfig`: Radius, Typ, Beschriftung (Platzhalter)
- [ ] `GartenConfiguration` erweitern: `quadranten`, `wege`, `rondeau`, `gartenBreite`, `gartenHoehe`
- [ ] `BaseBed` erweitern: `quadrantId?: string`, `beetGruppe?: string`

### Schritt 5.2 – Datenschicht
- [ ] `data.ts`: `GARDEN_FIXED_BED_LENGTH` (5 Stellen) → `getBeetLaengeForQuadrant()` mit Fallback
- [ ] `data-store.ts`: `GartenConfiguration` speichern/laden mit neuen Feldern
- [ ] Migrations-Funktion: 19 Beete → je 2 Hälften aufteilen (einmaliger Lauf)
- [ ] IPC-Handler: `garden:get-layout`, `garden:update-layout`

### Schritt 5.3 – Quadrant-Konfiguration UI (Einstellungen)
- [ ] Neue Einstellungsseite: Gartenlayout
- [ ] Wegposition (Längs + Quer) als Schieberegler in Metern
- [ ] Wegbreite (Längs + Quer) konfigurierbar
- [ ] Pro Quadrant: Orientierung, Standardbeetbreite
- [ ] Rondeau: Radius + Typ (Platzhalter)
- [ ] IPC-Bridge: `garden:update-layout` in `preload.js`

### Schritt 5.4 – BedForm.tsx
- [ ] Quadrant-Picker (Dropdown)
- [ ] Beetlänge: vorbefüllt aus Quadrant, manuell editierbar
- [ ] `beetGruppe`: optional befüllbar

### Schritt 5.5 – 2D-Draufsicht SVG (Herzstück, Gartenübersichtsseite)
- [ ] SVG-Komponente ersetzt bisherige Streifenansicht
- [ ] Wege als Streifen (hellgrau, proportional)
- [ ] Rondeau als Kreis im Kreuzungspunkt
- [ ] Beete in Sortenfarbe, Hover-Tooltip, Klick → Beetdetail
- [ ] Optional: gestrichelte Linie zwischen `beetGruppe`-Paaren

### Schritt 5.6 – Build + Test v2.0
- [ ] `npm run build` – Static Export testen
- [ ] Migrations-Test: bestehende `app-data.json` korrekt migriert
- [ ] `npm run build:portable` – EXE v2.0 erstellen
- [ ] Visualisierungstest: alle 4 Quadranten, Wege, Rondeau korrekt
- [ ] Regressions-Test: Ernte, PDF-Export, Backup unverändert
- [ ] Merge `feature/quadrant-layout` → `portable-exe-build`

---

## 🟡 v1.0 – Offene Tests (portable-exe-build, nicht blockierend)

- [ ] Praxis-Test auf entferntem Rechner (Beetmanagement + PDF-Export)
- [ ] Dashboard-Widgets: WeatherWidget, CalendarWidget, TodoWidget, TeamsWidget, WebcamWidget
- [ ] Gallery-Test (5 IPC-Handler fehlen noch: add-comment, add-rating, batch-upload, delete, get-by-id)
- [ ] Tools-Test
- [ ] Routines-Test
- [ ] Settings-Test
- [ ] Performance-Test / Stability-Test / Data-Integrity-Test
- [ ] Benutzer-Dokumentation / Anleitung für portable EXE

---

## � v3.0 – CI-Umsetzung (Meister-Suite Identity) — GEPLANT

> **Hintergrund:** GartenMeister ist Teil der 7-App-Meister-Suite. Die CI-Vorgaben aus dem Skill `meister-suite-ci` sind bisher nicht umgesetzt. Alle Dateien liegen in `C:\Users\wolfg\Desktop\CI VS\`.

### Status quo (April 2026)
- ❌ EskapadeFraktur-Font **nicht** in der App eingebunden (`src/index.css` nutzt Systemfonts)
- ❌ Kein GartenMeister-Icon im Glassy-Black-SVG-Stil vorhanden (nur generisches `favicon.ico`)
- ❌ Wortmarke (`GartenMeister` / `Meister` in `#9BA97E`) nicht implementiert
- ❌ CI-Farbe `#9BA97E` nicht als CSS-Token in der App vorhanden
- ✅ CI-Quelldateien vorhanden: `CI VS/fonts/EskapadeFraktur-Regular.ttf`, `CI VS/logos/GartenMeister.svg`, `CI VS/tokens/meister-tokens.css`

### Schritt CI.1 – Font einbinden
- [ ] `EskapadeFraktur-Regular.ttf` → `public/fonts/` kopieren
- [ ] CSS-`@font-face` in `src/app/globals.css` eintragen
- [ ] Wortmarken-Komponente: `Garten` (schwarz/dunkel) + `Meister` (`#9BA97E`) mit EskapadeFraktur
- [ ] Sidebar + About-Dialog mit Wortmarke versehen

### Schritt CI.2 – App-Icon (Glassy Black SVG)
- [ ] GartenMeister-Icon SVG 512×512 nach CI-Vorgabe erstellen (6-Schichten-Architektur):
  - Layer 1–3: schwarzer Basisverlauf, Boden-Reflex, Rand-Gradient
  - Layer 4: Monogramm `G` (weiß 93%) + `M` (`#9BA97E`)
  - Layer 5–6: Glasspitzlicht + feiner Außenrand
- [ ] SVG als 256×256 PNG exportieren → in `public/` ablegen
- [ ] `public/favicon.ico` ersetzen (via svg2ico.com oder sharp)
- [ ] `electron-builder.config.js`: Icon-Pfad auf neues PNG setzen

### Schritt CI.3 – CSS-Tokens
- [ ] `CI VS/tokens/meister-tokens.css` → GartenMeister-relevante Tokens in `src/app/globals.css` integrieren
- [ ] `--color-garten` (`#9BA97E`) als CSS Custom Property in allen relevanten Komponenten verwenden
- [ ] Sidebar-Akzentfarbe, Badge-Farbe, aktive Nav-Farbe auf `#9BA97E` umstellen

### Schritt CI.4 – Splash / About-Dialog
- [ ] About-Dialog: Icon (96px), Wortmarke, Version-Info CI-konform gestalten
- [ ] Electron-Splash (Ladeschirm): Icon zentriert auf schwarzem Hintergrund

---

## 🟣 v4.0 – Bilddatenbank neu (NAS + Tailscale + PWA-Upload) — GEPLANT

> **Hintergrund:** Langfristiger Aufbau eines chronologischen Bild- und Dokumenten-Katalogs des Kräutergartens. Bilder sollen direkt vom Smartphone hochgeladen werden können. Vorbild: `zweipunktnullVS` (Synology NAS via Tailscale, Node.js API-Server mit `sharp`, PWA-Upload).

### Status quo (April 2026)

**Was vorhanden ist:**
- ✅ `src/utils/image-manager.js` – Lokale Bildverwaltung + NAS-Fallback (`G:\gartenmeister\images`)
- ✅ `src/components/gallery/GardenImageGallery.tsx` – UI (Grid/List, Filter, Tags, Kommentare, Ratings)
- ✅ IPC-Handler vorhanden: `images:get-all`, `images:upload`, `images:get-file-url`, `images:get-stats`
- ✅ EXIF-Extraktor vorhanden (`src/utils/exif-extractor.js`)
- ✅ Metadata-Schema vollständig (`title`, `tags`, `bedId`, `plantType`, `category`, `takenDate`, etc.)
- ❌ 5 IPC-Handler fehlen noch: `images:add-comment`, `images:add-rating`, `images:batch-upload`, `images:delete`, `images:get-by-id`
- ❌ Kein NAS-API-Server (kein `server.js` auf dem Synology)
- ❌ Kein Smartphone-Upload (kein Tailscale-Endpunkt, keine Web-App)
- ❌ Kein Dokumenten-Typ (Rechnungen, Lieferscheine)
- ❌ Thumbnail-Generierung via `sharp` nicht vorhanden (nur lokale Kopie)

**Vorbild zweipunktnullVS (`C:\Users\wolfg\Desktop\zweipunktnullVS\server.js`):**
- Node.js HTTP-Server auf Synology: `/volume1/Gurktaler/zweipunktnull/`, Port 3002
- Endpunkte: `POST /api/image` (Upload + Thumbnail mit `sharp` 200×200), `GET /api/image`, `DELETE /api/image`
- Tailscale-IP `100.121.103.107` → überall erreichbar (Büro, Feld, Smartphone)
- PWA: jedes Gerät kann via Browser uploaden → kein App-Store nötig
- Datenverlustschutz beim JSON-Schreiben (leeres Array blockiert Überschreiben)
- Inkrementelle Backups vor jedem Schreibvorgang

### Schritt DB.1 – Fehlende IPC-Handler (kurzfristig, in v1.0/v2.0 erledigen)
- [ ] `images:get-by-id` implementieren
- [ ] `images:delete` implementieren (Datei + Thumbnail + Metadaten)
- [ ] `images:add-comment` implementieren
- [ ] `images:add-rating` implementieren
- [ ] `images:batch-upload` implementieren
- [ ] Gallery-Test vollständig durchführen

### Schritt DB.2 – NAS-Server für GartenMeister
> Infrastruktur analog zu `zweipunktnullVS/server.js`, aber eigenständig für GartenMeister
- [ ] `server-gartenmeister.js` erstellen
  - Basispfad: `/volume1/GartenMeister/` (eigener NAS-Ordner)
  - Port: **3003** (reserviert für GartenMeister, kein Konflikt mit Gurktaler 3002)
  - Endpunkte: `POST /api/image`, `GET /api/image`, `DELETE /api/image`
  - Endpunkte: `POST /api/document`, `GET /api/document` (NEU: Dokumente/Rechnungen)
  - `sharp` für Thumbnails (200×200 Cover)
  - MIME-Typen: JPEG, PNG, WEBP für Bilder; PDF, JPG für Dokumente
  - Datenverlustschutz + inkrementelle Backups (wie zweipunktnullVS)
- [ ] `sharp` als Dependency in `package.json` (Synology installiert via npm)
- [ ] Synology Task-Scheduler: Server als Boot-Dienst einrichten (analog `SYNOLOGY_SERVER_SETUP.md`)
- [ ] Tailscale auf Synology: GartenMeister-Endpunkt freigeben

### Schritt DB.3 – Datenmodell erweitern (Dokumente)
- [ ] `ImageMetadata` Interface um `documentType?: 'invoice' | 'delivery-note' | 'other'` erweitern
- [ ] Kategorie `'document'` in `category`-Enum hinzufügen
- [ ] Upload-UI: Typ-Auswahl (Foto / Dokument / Rechnung / Lieferschein)
- [ ] Galerie-Filter: Tab "Fotos" / Tab "Dokumente"

### Schritt DB.4 – Smartphone-Upload (PWA)
> Einfache Web-Seite, die via Tailscale vom Smartphone erreichbar ist
- [ ] `public/upload.html` (standalone, kein React, kein Build-Prozess nötig)
  - Camera-Input (`capture="environment"`)
  - Felder: Datum, Beschreibung, Kategorie, Beet-Zuordnung
  - `fetch` → `POST http://[Tailscale-IP]:3003/api/image`
- [ ] Tailscale-URL in Einstellungen konfigurierbar machen
- [ ] QR-Code in Einstellungen: direkter Link zur Upload-Seite (NAS-IP:Port)
- [ ] Test: iPhone/Android → Bild aufnehmen → in GartenMeister-Galerie sichtbar

### Schritt DB.5 – GartenMeister App: NAS-Verbindung
- [ ] Einstellungsseite: Tailscale-IP + Port konfigurierbar
- [ ] `image-manager.js`: NAS-API-Server als primärer Speicher (statt G:\ Drive)
- [ ] Auto-Fallback: NAS nicht erreichbar → lokaler Cache, späterer Sync
- [ ] Sync-Status-Anzeige in Einstellungen (analog `nas-status-dashboard.tsx`)

### Schritt DB.6 – Integration in bestehende Bereiche
- [ ] Beetdetail-Seite: Bilder direkt einem Beet zuordnen und anzeigen
- [ ] Ernte-Bericht: Fotos einer Ernte zuordnen (im PDF exportierbar)
- [ ] Jahres-Katalog-Export: PDF mit allen Fotos eines Jahres, chronologisch

---

## �🟢 Erledigt (Auswahl)

- [x] Portable EXE v1.0 (`GartenMeister-Portable-1.0.0-Portable.exe`, 114 MB)
- [x] Beet-Management CRUD inkl. Kombinationsbeete
- [x] Ernte-System + Reports
- [x] PDF-Export (Dashboard + Ernteberichte)
- [x] Backup/Restore
- [x] User-System (Admin, CRUD, Switcher)
- [x] OneDrive-Sync-Integration
- [x] IPC-Bridge (48/53 Handler)
- [x] Branch `feature/quadrant-layout` angelegt
- [x] v2.0 Konzept vollständig dokumentiert (`VISUALISIERUNG_NEU_ANALYSE.md`)

---

## 📌 Noch offen (v2.0 Planungsdetails)
- Genaue Wegbreite (Längs + Quer) – nach Bau festlegbar
- Genaue Position des Querwegs (aktuell ca. 21m, exakt noch offen)
- Rondeau: Radius und Typ (Planungshorizont 2 Saisonen)
