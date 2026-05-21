# GartenMeister Weather Service für Synology DS124

## Übersicht
Standalone Wetter-Service für deine Synology DS124 - sammelt automatisch Wetterdaten 24/7 für GartenMeister.

## Features
- ✅ **Dual-Provider**: OpenWeatherMap + Meteoblue mit automatischem Fallback
- ✅ **Agrar-Daten**: Bodentemperatur, Bodenfeuchtigkeit, Evapotranspiration (Meteoblue)
- ✅ **24/7 Sammlung**: Läuft dauerhaft auf dem NAS, unabhängig von der App
- ✅ **NAS-optimiert**: Automatische Pfaderkennung für Synology, QNAP, etc.
- ✅ **Robust**: Retry-Logic, Mutex-System, Fehlerbehandlung
- ✅ **Flexibel**: CLI-Interface für Setup und Debugging

## Schnellstart

### 1. Meteoblue API Key besorgen (EMPFOHLEN)
1. Gehe zu: https://www.meteoblue.com/en/weather-api
2. Registriere dich (kostenlos)
3. Wähle "weather API" → "Basic Plan" (150 calls/Tag gratis)
4. Kopiere deinen API Key

### 2. Service vorbereiten (auf Windows)
```bash
# In GartenMeisterStudio Ordner
cd nas
npm install

# Konfiguration erstellen
npm run setup

# API Key eintragen (öffne weather-config.json)
# Setze: "apiKey": "DEIN_METEOBLUE_KEY"
# Setze: "enabled": true

# Test durchführen
npm test
```

## Synology DS124 Installation

### Option A: Node.js direkt auf NAS (EMPFOHLEN)

#### 1. Node.js auf Synology installieren
1. **Package Center** öffnen
2. **Node.js** suchen und installieren
3. **SSH** aktivieren (Systemsteuerung → Terminal & SNMP → SSH aktivieren)

#### 2. Service hochladen
```bash
# Per SSH auf NAS verbinden
ssh admin@synology-ip

# Verzeichnis erstellen
sudo mkdir -p /volume1/gartenmeister/weather-service
cd /volume1/gartenmeister/weather-service

# Dateien hochladen (per SFTP oder Synology File Station)
# - standalone-weather-service.js
# - package.json  
# - weather-config.json

# Dependencies installieren
npm install

# API Key konfigurieren
nano weather-config.json
# Meteoblue API Key eintragen und enabled: true setzen
```

#### 3. Als Systemdienst einrichten
```bash
# Systemd Service erstellen
sudo nano /etc/systemd/system/gartenmeister-weather.service
```

**Service-Datei Inhalt:**
```ini
[Unit]
Description=GartenMeister Weather Service
After=network.target

[Service]
Type=simple
User=admin
WorkingDirectory=/volume1/gartenmeister/weather-service
ExecStart=/usr/local/bin/node standalone-weather-service.js start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Service aktivieren und starten
sudo systemctl daemon-reload
sudo systemctl enable gartenmeister-weather.service
sudo systemctl start gartenmeister-weather.service

# Status prüfen
sudo systemctl status gartenmeister-weather.service
```

### Option B: Task Planer (einfacher)

#### 1. Aufgabe erstellen
1. **Systemsteuerung** → **Aufgabenplaner**
2. **Erstellen** → **Geplante Aufgabe** → **Benutzerdefiniertes Script**

#### 2. Aufgabe konfigurieren
- **Name**: GartenMeister Wetter
- **Benutzer**: admin
- **Zeitplan**: Wiederholen alle 2 Stunden
- **Befehl**: 
```bash
cd /volume1/gartenmeister/weather-service && node standalone-weather-service.js test
```

### Option C: Docker Container

#### 1. Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package.json standalone-weather-service.js weather-config.json ./
RUN npm install

VOLUME ["/data"]
ENV DATA_DIRECTORY=/data

CMD ["node", "standalone-weather-service.js", "start"]
```

#### 2. Docker Setup
```bash
# Image bauen
docker build -t gartenmeister-weather .

# Container starten
docker run -d \
  --name gartenmeister-weather \
  --restart unless-stopped \
  -v /volume1/gartenmeister/data:/data \
  gartenmeister-weather
```

## Konfiguration

### weather-config.json
```json
{
  "primaryProvider": "meteoblue",
  
  "meteoblue": {
    "apiKey": "DEIN_API_KEY_HIER",
    "enabled": true
  },
  
  "openweathermap": {
    "apiKey": "27abc31487d9b25c2721ed313b51b619",
    "enabled": true
  },
  
  "location": {
    "name": "Gurk, Österreich",
    "lat": 46.8744,
    "lon": 14.1497
  },
  
  "intervalHours": 2,
  "includeAgriculturalData": true,
  "dataDirectory": "/volume1/gartenmeister/data"
}
```

### Standort anpassen
1. Gehe zu: https://www.latlong.net/
2. Suche deinen Standort
3. Kopiere Latitude/Longitude
4. Aktualisiere `weather-config.json`

## Verwaltung

### CLI-Befehle
```bash
# Service starten
node standalone-weather-service.js start

# Status prüfen  
node standalone-weather-service.js status

# Test-Sammlung
node standalone-weather-service.js test

# Konfiguration anzeigen
node standalone-weather-service.js config
```

### Logs prüfen
```bash
# Systemd Service Logs
sudo journalctl -u gartenmeister-weather.service -f

# Manuelle Logs
tail -f /volume1/gartenmeister/weather-service/weather.log
```

### Troubleshooting

#### Service läuft nicht
```bash
# Status prüfen
sudo systemctl status gartenmeister-weather.service

# Neustart
sudo systemctl restart gartenmeister-weather.service

# Manueller Test
cd /volume1/gartenmeister/weather-service
node standalone-weather-service.js test
```

#### Keine Daten
1. **API Keys prüfen**: Meteoblue + OpenWeatherMap gültig?
2. **Internetverbindung**: Kann NAS APIs erreichen?
3. **Dateiberechtigungen**: Kann Service in Datenverzeichnis schreiben?
4. **Logs analysieren**: Was sagen die Fehlermeldungen?

#### Meteoblue API Limits
- **Free Plan**: 150 calls/Tag
- **Bei 2h-Intervall**: 12 calls/Tag → perfekt!
- **Upgrade**: Wenn mehr Daten gewünscht

## Integration mit GartenMeister App

### 1. App-Konfiguration anpassen
```javascript
// In GartenMeister App: src/lib/data-hooks-safe.ts
const WEATHER_DATA_FILE = '/volume1/gartenmeister/data/weather-data.json';
// oder über Netzlaufwerk: //synology-ip/gartenmeister/data/weather-data.json
```

### 2. Netzlaufwerk einrichten (Windows)
1. **Dieser PC** → **Netzlaufwerk verbinden**
2. **Laufwerk**: Z:
3. **Ordner**: `\\synology-ip\gartenmeister`
4. **Anmeldedaten**: NAS Benutzer/Passwort
5. **In App**: `Z:\data\weather-data.json`

## Datenformat

### Meteoblue Erweiterte Daten
```json
{
  "id": "weather-1720267200000",
  "timestamp": "2025-07-06T12:00:00.000Z",
  "provider": "meteoblue",
  
  "airTemperature": 24.5,
  "soilTemperature": 18.2,
  "humidity": 65,
  "windSpeed": 8.3,
  "precipitation": 0,
  "pressure": 1013.2,
  "condition": "Teilweise bewölkt",
  "cloudCover": 45,
  "uvIndex": 6,
  "visibility": 15.0,
  "dewPoint": 17.8,
  
  "soilMoisture": 23.5,
  "evapotranspiration": 4.2,
  "growingDegreeDays": 12.3,
  "leafWetness": 2
}
```

## Vorteile gegenüber lokaler Sammlung

### ✅ 24/7 Verfügbarkeit
- NAS läuft dauerhaft → keine verpassten Daten
- Unabhängig von PC-Nutzung

### ✅ Zentrale Datenhaltung  
- Alle GartenMeister-Instanzen nutzen dieselben Daten
- Keine Konflikte zwischen mehreren PCs

### ✅ Bessere Datenqualität
- Meteoblue Agrar-APIs speziell für Gartenbau
- Redundante APIs (Fallback-System)

### ✅ Skalierbarkeit
- Einfach auf andere NAS-Systeme übertragbar
- Docker-ready für professionelle Setups

## Nächste Schritte

1. **✅ Meteoblue API Key besorgen**
2. **✅ Service auf Windows testen** 
3. **⏳ DS124 Setup abwarten**
4. **⏳ Service auf NAS installieren**
5. **⏳ GartenMeister Apps auf NAS-Daten umstellen**
6. **⏳ Vollmigration aller Daten aufs NAS** (später)

**Nach 1-2 Wochen hast du perfekte, kontinuierliche Wetterdaten für aussagekräftige Statistiken!** 📊🌱
