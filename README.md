# Zeiterfassung

Arbeitszeiterfassung für **Android** und **Windows** mit NAS-Synchronisation via Tailscale.

Inspiriert von *Stempeluhr 2.1* von Matthias Lenkeit.

---

## Projektstruktur

```
├── app/          # Flutter-App (Android + Windows)
└── backend/      # Next.js API-Server (läuft auf Synology NAS)
```

---

## Features

- **Einstempeln / Ausstempeln** per Knopfdruck mit Timer
- **Manuelle Einträge** (vergangene Zeiten nachtragen)
- **Tätigkeitsarten:** Homeoffice, Telefonat, Außer-Haus-Termin, Fahrt, Büro, Sonstiges
- **Tagtypen:** Werktag, Samstag, Sonntag, Feiertag (manuell – keine automatischen Zuschläge)
- **Fahrtstrecken** in km erfassbar
- **GPS-Erfassung** auf Android (Koordinaten für Fahrtbeginn/-ende)
- **Österreichische Feiertage** vorberechnet und angezeigt
- **XLSX-Export** (monatlich, mit Wochen-Subtotalen)
- **XLSX-Import** aus Stempeluhr 2.1 und kompatiblen Formaten
- **NAS-Sync** via Tailscale + Next.js REST-API
- **Offline-fähig** (lokale SQLite-Datenbank)

---

## App einrichten (Flutter)

### Voraussetzungen
- Flutter SDK ≥ 3.2
- Android Studio oder VS Code mit Flutter-Extension
- Für Windows-Build: Visual Studio mit C++-Workload

### Installation

```bash
cd app
flutter pub get
flutter run                    # Android (Gerät angeschlossen)
flutter run -d windows         # Windows
flutter build apk --release    # Android APK
flutter build windows --release
```

---

## Backend einrichten (Synology NAS)

### Option A: Docker Compose (empfohlen)

```bash
cd backend

# Optional: API-Key in docker-compose.yml setzen
# API_KEY: mein-geheimer-key

docker-compose up -d
```

Die API läuft auf Port **3000**. Über Tailscale ist sie unter `http://<tailscale-ip>:3000` erreichbar.

### Option B: Direkt (Node.js auf NAS)

```bash
cd backend
npm install
npm run build
npm start
```

### API-Endpunkte

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/api/health` | Verbindungstest |
| GET | `/api/entries` | Alle Einträge abrufen |
| GET | `/api/entries?year=2025&month=1` | Monatsfilter |
| POST | `/api/entries/sync` | Einträge hochladen (Upsert) |
| PUT | `/api/entries/[id]` | Einzelnen Eintrag aktualisieren |
| DELETE | `/api/entries/[id]` | Eintrag löschen |

Authentifizierung via Header: `x-api-key: <key>` (optional).

---

## App-Einstellungen

In der App unter **Einstellungen**:
1. Arbeitgeber anlegen (Name + Wochenstunden)
2. NAS-URL eintragen: `http://<tailscale-ip>:3000`
3. API-Key (falls konfiguriert)
4. Verbindung testen

---

## XLSX-Import aus Stempeluhr 2.1

Die App erkennt automatisch Spalten nach Bezeichnung (Datum, Beginn, Ende, Pause, Notiz). 
Unterfttzte Datumsformate: `DD.MM.YYYY`, `YYYY-MM-DD`, `DD/MM/YYYY`.
Pausenformat: Minuten (z.B. `30`) oder `HH:MM`.

Import unter **Berichte → XLSX importieren**.

---

## Feiertage (Österreich)

Alle bundesweiten Feiertage sind vorberechnet. Der **Tagtyp wird niemals automatisch gesetzt** – immer manuell beim Erstellen/Bearbeiten eines Eintrags wählen. Keine automatischen Zuschläge für Wochenenden, Feiertage oder Nachtstunden.

---

## Datenpfade

| Plattform | Datenbankpfad |
|-----------|---------------|
| Android | App-internes Verzeichnis (SQLite) |
| Windows | `%APPDATA%\zeiterfassung\zeiterfassung.db` |
| NAS (Docker) | `./backend/data/zeiterfassung.db` |
