# GartenMeister — Roadmap

> Zuletzt aktualisiert: 12. April 2026  
> Branch: `feature/quadrant-layout`  
> Version: 2.0.1

---

## ✅ Erledigt

### Infrastruktur & Build
- [x] Electron Portable EXE — Grundstruktur (Next.js → Electron)
- [x] IPC-Layer vollständig (preload.js → index-portable.js), ~53 Handler
- [x] Build-Zeit von 89 Minuten auf ~9 Minuten reduziert  
      _Ursache war: alle UI-Pakete lagen in `dependencies` statt `devDependencies` — electron-builder scannte sie alle_
- [x] `compression: "normal"` (7-zip) für kleinere EXE-Größe
- [x] Electron-Builder-Konfiguration (`electron-builder-portable-only.config.js`) bereinigt

### Kernfunktionen
- [x] Beete verwalten (CRUD, Quadrant-Zuweisung, Kombinationsbeete)
- [x] Kräutersorten (CRUD, Beet-Zuweisung, Suchfunktion)
- [x] Ernte erfassen (CRUD, Contributions, Produktivitätswerte)
- [x] Ernteberichte mit PDF-Export (Gartenübersicht + Erntestatistik)
- [x] Bildersammlung (Upload, EXIF-Auslesen, NAS-Bilder)
- [x] Routinen & Aufgaben (wiederkehrende Gartenarbeiten)
- [x] Datensicherung / Backup-Restore (JSON-ZIP-Format)
- [x] Benutzerverwaltung (mehrere Benutzer, Umschalter in Sidebar)
- [x] Dashboard mit Statistiken und Schnellzugriff

### NAS-Integration
- [x] NAS-Server (`server-gartenmeister.js`) auf Synology DS124
- [x] Tailscale-Zugang (IP: `100.121.103.107:3003`)
- [x] Smartphone-Upload via `upload.html` (PWA, QR-Code)
- [x] EXIF-Aufnahmedatum aus DSC-Fotos korrekt ausgelesen
- [x] NAS-Settings in der App (URL, Toggle, Verbindungstest, QR-Code)
- [x] `/api/nas-status` Proxy (prüft NAS-Health-Endpunkt)

### Wetter
- [x] Wetter-API-Konfiguration (OpenWeatherMap, Meteostat)
- [x] Gartenwerkzeuge-Bereich (Wetter + Hilfsmittel)

### OneDrive
- [x] OneDrive-Integration (Backup-Upload)

### Lageplan / Visualisierung
- [x] 2D-Gartendraufsicht (SVG, Quadranten, Wege, Beete, Rondeau)
- [x] Lageplan-Konfiguration (Quadranten, Wege, Maßstab) in Einstellungen
- [x] Beete klickbar → Detailansicht

### UI-Bereinigung (April 2026)
- [x] `NASSyncConfiguration` entfernt (kein funktionierendes Backend)
- [x] `NASStatusDashboard` entfernt (zeigte immer "nicht konfiguriert")
- [x] `NASMonitoringDashboard` Tab entfernt (kein Backend)
- [x] `DataInitializationDashboard` Tab entfernt (Endlosschleife, kein Nutzen)
- [x] `RemoteClientManagement` Tab entfernt (`/api/remote-clients` nicht implementiert)
- [x] `RemoteNASConfiguration` Tab entfernt (nur Konfiguration ohne echten Sync)
- [x] Settings hat jetzt 5 sinnvolle Tabs: Allgemein, OneDrive, Wetter-API, NAS-Integration, Lageplan
- [x] Handbuch aktualisiert (Einstellungs-Tabs, Bereiche-Zähler, Datum)
- [x] EXE-Größe: **79.9 MB** (war 311 MB mit `compression: "store"`, jetzt `compression: "normal"`)
- [x] NAS-Verbindungstest in `NasImageSettings` funktioniert (direkter Fetch auf NAS `/api/health`)
- [x] DSM-Aufgabenplaner: NAS-Server-User von `root` auf `admin` umgestellt

---

## 🔄 Offen / Geplant

### Mittel

- [ ] **Pflanzkalender** — einfache saisonale Übersicht (Aussaat/Ernte-Zeitfenster je Kraut)  
  Zeigt für jede Kräutersorte: wann aussäen, wann ernten (Monats-Grid)  
  _Aufwand: mittel (~1–2 Tage)_

- [ ] **Notizen-Funktion je Beet** — freies Textfeld pro Beet für saisonale Beobachtungen  
  _Aufwand: klein (~halber Tag)_

- [ ] **Wetterdaten-Verlauf** — gespeicherte Wetterdaten pro Tag/Woche anzeigen (Niederschlag, Temp)  
  _Aufwand: mittel (~1 Tag)_

### Niedrig

- [ ] **Beet-Anzahl flexibel** — Anzahl der Beete direkt in der Gartenübersicht (Lageplan) einstellbar machen.  
  Statische Routen `bed-1` bis `bed-50` sind bereits im Build. Fehlend: Eingabefeld/Slider in der Gartenübersicht + dynamische Lageplan-Anpassung  
  _Aufwand: mittel (~1 Tag)_

- [ ] **Offline-Badge in Sidebar** — kleines Indikator-Icon wenn NAS nicht erreichbar  
  _Aufwand: klein (~2h)_

- [ ] **Dark Mode** — Theme-Umschalter (Hell/Dunkel) in Allgemein-Einstellungen  
  _Aufwand: klein (~halber Tag, Tailwind dark: bereits vorbereitet)_

---

## 💡 Sinnvolle Erweiterungen (Ideen)

| Feature | Beschreibung | Aufwand | Priorität |  
|---|---|---|---|
| **Foto-Tagging** | Fotos direkt Beet/Kraut zuordnen beim Upload, Tags vergeben | klein | mittel |
| **Ernte-Ziel setzen** | Pro Beet Soll-Menge definieren, Fortschrittsanzeige | klein | mittel |
| **Jahresvergleich im Bericht** | Ernten 2024 vs. 2025 vs. 2026 nebeneinander im PDF | mittel | hoch |
| **Druck-Ansicht Beete** | Druckbares A4-Blatt mit Beetplan + aktueller Belegung | mittel | mittel |
| **Wachstums-Tracking** | Fotos zeitlich sortiert = Zeitraffer-Galerie je Beet | mittel | niedrig |
| **Erinnerungen / Benachrichtigungen** | Windows-Notification wenn Routine fällig | mittel | niedrig |
| **Import aus altem GartenMeister** | Datenmigration aus Vorgänger-System | klein | hoch (wenn nötig) |
| **Mehrjährige Kräuter-Erkennung** | Kräuter als "mehrjährig" markieren → andere Pflanz-Logik | klein | niedrig |
| **Barcode/Label-Druck** | Beet-Etiketten mit QR-Code für Kräutersorten drucken | klein | niedrig |

---

*Diese Roadmap wird mit jeder Konversation aktualisiert.*
