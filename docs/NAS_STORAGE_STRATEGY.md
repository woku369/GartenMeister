# NAS Storage Strategy für GartenMeister

## Übersicht
Strategische Überlegungen zur Verlagerung der gesamten Datenspeicherung auf ein NAS-System.

## Architektur-Optionen

### Option 1: NAS als zentraler Datenspeicher ⭐⭐⭐ (Empfohlen)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PC 1          │    │   PC 2          │    │   PC 3          │
│ GartenMeister   │◄──►│ GartenMeister   │◄──►│ GartenMeister   │
│ (nur UI)        │    │ (nur UI)        │    │ (nur UI)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │        NAS-System         │
                    │ ┌─────────────────────────┐ │
                    │ │  GartenMeister-Daten    │ │
                    │ │ • app-data.json         │ │
                    │ │ • weather-data.json     │ │
                    │ │ • backups/              │ │
                    │ │ • exports/              │ │
                    │ └─────────────────────────┘ │
                    │ ┌─────────────────────────┐ │
                    │ │ Wetter-Service (Node.js)│ │
                    │ │ • Läuft als Docker      │ │
                    │ │ • Sammelt alle 2h       │ │
                    │ │ • Schreibt direkt ins   │ │
                    │ │   lokale NAS-Dateisystem│ │
                    │ └─────────────────────────┘ │
                    └───────────────────────────────┘
```

### Option 2: Hybrid (Current + NAS-Wetter-Service)
- Apps bleiben wie bisher (lokale Daten + Cloud-Sync)
- NUR Wetterdatensammlung läuft auf NAS
- Einfacherer Übergang

## Technische Umsetzung

### NAS-Kompatibilität
**Funktioniert mit praktisch allen NAS-Systemen:**
- ✅ Synology DiskStation (DSM)
- ✅ QNAP
- ✅ Unraid
- ✅ FreeNAS/TrueNAS
- ✅ Einfache USB-Festplatte am Router
- ✅ Raspberry Pi mit externer Festplatte

### Wetter-Service auf NAS (3 Varianten)

#### Variante A: Docker Container (Synology/QNAP) ⭐⭐⭐
```bash
# Dockerfile für NAS-Wetter-Service
FROM node:18-alpine
WORKDIR /app
COPY weather-collector.js package.json ./
RUN npm install
CMD ["node", "weather-collector.js"]
```

#### Variante B: Native Node.js (wenn NAS Node.js unterstützt)
```bash
# Direkt auf NAS installieren
npm install -g gartenmeister-weather-collector
# Cron-Job auf NAS einrichten
```

#### Variante C: Externe Sammlung + NAS-Sync
```bash
# PC sammelt Daten, synct sofort aufs NAS
# Alle anderen PCs lesen nur vom NAS
```

## Konfiguration

### NAS-Zugriff in GartenMeister
```javascript
// Neue Konfiguration für NAS-Zugriff
const nasConfig = {
  enabled: true,
  path: "//nas-ip/gartenmeister/", // SMB/CIFS
  // oder
  path: "/mnt/nas/gartenmeister/", // Gemountetes Laufwerk
  fallbackToLocal: true, // Falls NAS nicht erreichbar
  syncInterval: 60000 // Sync alle 60 Sekunden
};
```

### Verzeichnisstruktur auf NAS
```
/gartenmeister/
├── data/
│   ├── app-data.json
│   ├── weather-data.json
│   └── backups/
│       ├── app-data-2025-07-06.json
│       └── weather-data-2025-07-06.json
├── exports/
│   ├── 2025-07-06-garten-export.pdf
│   └── statistics/
├── config/
│   ├── weather-config.json
│   └── app-settings.json
└── logs/
    ├── weather-service.log
    └── app-access.log
```

## Vorteile NAS-Lösung

### Speicherplatz
- ✅ **Unbegrenzt** (nur durch NAS-Kapazität begrenzt)
- ✅ **Kostengünstig** (einmalige Anschaffung vs. monatliche Cloud-Kosten)
- ✅ **Erweiterbar** (zusätzliche Festplatten)

### Performance
- ✅ **Schneller Zugriff** (Gigabit LAN vs. Internet)
- ✅ **Keine Upload-Limits** der Cloud-Anbieter
- ✅ **Offline-Verfügbarkeit** im lokalen Netz

### Datenschutz & Kontrolle
- ✅ **100% lokale Kontrolle** über Daten
- ✅ **Keine Cloud-Abhängigkeit** 
- ✅ **Eigene Backup-Strategie**
- ✅ **DSGVO-konform** (keine Datenübertragung an Dritte)

### Zuverlässigkeit
- ✅ **RAID-Systeme** für Datensicherheit
- ✅ **Automatische Backups**
- ✅ **24/7 Verfügbarkeit** (NAS läuft dauerhaft)

## Nachteile & Lösungen

### Fernzugriff
- ❌ **Problem**: Kein Zugriff von außerhalb
- ✅ **Lösung**: VPN-Zugang zum NAS oder Hybrid-Ansatz

### Komplexität
- ❌ **Problem**: Netzwerk-Setup erforderlich
- ✅ **Lösung**: Moderne NAS-Systeme sind benutzerfreundlich

### Single Point of Failure
- ❌ **Problem**: Wenn NAS ausfällt, keine Daten
- ✅ **Lösung**: RAID + regelmäßige Backups + lokaler Fallback-Modus

## Migrationsstrategie

### Phase 1: Vorbereitung
1. NAS-System einrichten und testen
2. Netzwerkzugriff von allen PCs sicherstellen
3. Backup der aktuellen Daten erstellen

### Phase 2: Wetter-Service Migration
1. Wetter-Service auf NAS implementieren
2. Alle Apps auf NAS-Wetterdaten umstellen
3. Lokale Wetterdatensammlung deaktivieren

### Phase 3: Vollmigration (Optional)
1. Alle Gartendaten aufs NAS verschieben
2. Apps auf NAS-Zugriff umstellen
3. Cloud-Sync deaktivieren
4. Lokale Daten als Fallback behalten

## Empfehlung

**Start mit Wetter-Service auf NAS:**
1. ✅ Geringes Risiko
2. ✅ Sofortige Vorteile (24/7 Datensammlung)
3. ✅ Erfahrungen sammeln
4. ✅ Bei Erfolg: Vollmigration möglich

**Hardware-Empfehlung:**
- **Einsteiger**: Synology DS220+ (2-Bay, ~300€)
- **Profi**: Synology DS423+ (4-Bay, ~500€)
- **Budget**: Raspberry Pi 4 + USB-HDD (ab ~150€)

## Fazit

Die NAS-Lösung ist für GartenMeister **strategisch sinnvoll** und löst mehrere aktuelle Probleme:
- ✅ Cloud-Speicherplatz-Limits
- ✅ 24/7 Wetterdatensammlung
- ✅ Zentrale Datenhaltung
- ✅ Bessere Performance
- ✅ Datenschutz

**Empfohlenes Vorgehen**: Start mit Wetter-Service auf NAS, dann schrittweise Vollmigration.
