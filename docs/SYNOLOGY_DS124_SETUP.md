# Synology DS124 Setup für GartenMeister Weather Service

## Übersicht
Diese Anleitung führt dich durch die komplette Einrichtung deiner Synology DS124 für den GartenMeister Weather Service.

## 🔧 Grundeinrichtung DS124

### 1. Erste Einrichtung
1. **Festplatte einbauen**
   - Empfehlung: WD Red Plus oder Seagate IronWolf (2-8TB)
   - NAS-optimierte Festplatten für 24/7 Betrieb

2. **DSM Installation**
   - Browser: `http://find.synology.com`
   - DSM 7.2 oder neuer installieren
   - Admin-Benutzer erstellen

3. **Grundkonfiguration**
   - Netzwerk: Statische IP empfohlen (z.B. `192.168.1.100`)
   - QuickConnect: Optional aktivieren für Fernzugriff
   - 2FA: Für Sicherheit aktivieren

### 2. Ordnerstruktur erstellen
```
/volume1/
├── gartenmeister/
│   ├── data/
│   │   ├── weather-data.json
│   │   └── backups/
│   ├── config/
│   │   └── weather-config.json
│   ├── logs/
│   └── service/
│       ├── weather-service-standalone.js
│       ├── package.json
│       └── config-nas.json
```

### 3. Benutzer & Berechtigungen
1. **Benutzer "gartenmeister" erstellen**
   - Gruppe: users
   - Berechtigung: Lesen/Schreiben auf "gartenmeister" Ordner

2. **SMB/CIFS Share einrichten**
   - Name: "gartenmeister"
   - Pfad: `/volume1/gartenmeister`
   - Zugriff: gartenmeister Benutzer

## 🚀 Node.js Installation

### Option A: Docker (Empfohlen) ⭐⭐⭐
```bash
# 1. Docker über Package Center installieren
# 2. Container Registry hinzufügen
# 3. Node.js Image herunterladen: node:18-alpine
```

### Option B: SSH + Manual Installation
```bash
# SSH aktivieren (Systemsteuerung > Terminal & SNMP)
ssh admin@192.168.1.100

# Node.js installieren
sudo su -
cd /opt
wget https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-x64.tar.xz
tar -xf node-v18.19.0-linux-x64.tar.xz
ln -s /opt/node-v18.19.0-linux-x64/bin/node /usr/local/bin/node
ln -s /opt/node-v18.19.0-linux-x64/bin/npm /usr/local/bin/npm

# Verifizieren
node --version
npm --version
```

## 📦 Weather Service Installation

### 1. Dateien auf NAS kopieren
```bash
# Von Windows PC per SMB:
\\192.168.1.100\gartenmeister\service\

# Kopiere:
- weather-service-standalone.js
- package.json
- config-nas.json (als config.json)
```

### 2. Dependencies installieren
```bash
# SSH zum NAS
ssh admin@192.168.1.100

# Zum Service-Verzeichnis
cd /volume1/gartenmeister/service

# Dependencies installieren
npm install
```

### 3. Service konfigurieren
```bash
# config.json anpassen
nano config.json

# Pfade für NAS setzen:
{
  "dataPath": "/volume1/gartenmeister/data",
  "nasMode": true,
  "nasPath": "/volume1/gartenmeister"
}
```

## ⚙️ Automatischer Start

### Option A: DSM Task Scheduler ⭐⭐⭐
1. **Systemsteuerung > Aufgabenplaner**
2. **Erstellen > Ausgelöste Aufgabe > Benutzerdefiniertes Script**
3. **Konfiguration:**
   ```
   Aufgabe: GartenMeister Weather Service
   Benutzer: root
   Ereignis: Systemstart
   Script:
   #!/bin/bash
   cd /volume1/gartenmeister/service
   /usr/local/bin/node weather-service-standalone.js &
   ```

### Option B: systemd Service (Advanced)
```bash
# Service-Datei erstellen
sudo nano /etc/systemd/system/gartenmeister-weather.service

[Unit]
Description=GartenMeister Weather Service
After=network.target

[Service]
Type=simple
User=gartenmeister
WorkingDirectory=/volume1/gartenmeister/service
ExecStart=/usr/local/bin/node weather-service-standalone.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# Service aktivieren
sudo systemctl enable gartenmeister-weather.service
sudo systemctl start gartenmeister-weather.service
```

## 🔍 Monitoring & Logs

### 1. Service Status prüfen
```bash
# SSH zum NAS
ssh admin@192.168.1.100

# Prozess prüfen
ps aux | grep weather-service

# Log-Dateien anzeigen
tail -f /volume1/gartenmeister/logs/weather-service.log
```

### 2. Web-Interface für Monitoring (Optional)
```javascript
// Einfaches Status-Dashboard erstellen
// HTTP-Server für Service-Status auf Port 3000
```

## 🌐 Netzwerk-Zugriff von GartenMeister Apps

### 1. SMB-Zugriff konfigurieren
```javascript
// In GartenMeister App (data-persistence.ts):
const nasConfig = {
  enabled: true,
  host: '192.168.1.100',
  share: 'gartenmeister',
  username: 'gartenmeister',
  password: 'dein-passwort',
  dataPath: '/data/weather-data.json'
};
```

### 2. Fallback-Modus
```javascript
// Apps prüfen zuerst NAS, dann lokal
async function getWeatherData() {
  try {
    // Versuche NAS-Zugriff
    return await loadFromNAS();
  } catch {
    // Fallback zu lokalen Daten
    return await loadFromLocal();
  }
}
```

## 🔧 Fehlerbehebung

### Häufige Probleme:
1. **Node.js nicht gefunden**
   ```bash
   which node
   ln -s /opt/node-v18.19.0-linux-x64/bin/node /usr/local/bin/node
   ```

2. **Berechtigungsfehler**
   ```bash
   chown -R gartenmeister:users /volume1/gartenmeister
   chmod -R 755 /volume1/gartenmeister
   ```

3. **Service startet nicht**
   ```bash
   cd /volume1/gartenmeister/service
   node weather-service-standalone.js
   # Debug-Output prüfen
   ```

## 📊 Erfolgskontrolle

### Service läuft erfolgreich wenn:
- ✅ `/volume1/gartenmeister/data/weather-data.json` wird alle 2h aktualisiert
- ✅ Neue Wetterdatenpunkte werden hinzugefügt
- ✅ Backups werden täglich erstellt
- ✅ Lock-Datei existiert: `/volume1/gartenmeister/data/.weather-service.lock`

### Test-Commands:
```bash
# Aktuelle Daten prüfen
cat /volume1/gartenmeister/data/weather-data.json | head -20

# Service-Status
ps aux | grep weather-service

# Letzte Log-Einträge
tail -10 /volume1/gartenmeister/logs/weather-service.log
```

## 🎯 Nächste Schritte nach NAS-Setup

1. **GartenMeister Apps anpassen**
   - Wetter-Widget auf NAS-Daten umstellen
   - Lokale Wetterdatensammlung deaktivieren

2. **Vollmigration vorbereiten**
   - Alle app-data.json Dateien auf NAS zentralisieren
   - Cloud-Sync durch NAS-Sync ersetzen

3. **Backup-Strategie**
   - Externe USB-Festplatte für NAS-Backups
   - Automatische Snapshots einrichten

4. **Monitoring erweitern**
   - E-Mail-Benachrichtigungen bei Service-Fehlern
   - Web-Dashboard für Service-Status

## 💡 Tipps & Best Practices

1. **Stromausfall-Schutz**: USV für NAS empfohlen
2. **Fernzugriff**: VPN oder QuickConnect für externen Zugriff
3. **Backups**: Regelmäßige Backups auf externe Festplatte
4. **Updates**: DSM und Service regelmäßig aktualisieren
5. **Monitoring**: SMART-Status der Festplatte überwachen

## 🆘 Support

Bei Problemen:
1. **Logs prüfen**: `/volume1/gartenmeister/logs/`
2. **Service neu starten**: `sudo systemctl restart gartenmeister-weather`
3. **NAS neu starten**: Über DSM Web-Interface
4. **Community**: Synology Community Forum

---

**Geschätzte Setup-Zeit**: 2-3 Stunden  
**Voraussetzungen**: Grundkenntnisse Linux/SSH empfohlen  
**Schwierigkeit**: Mittel (durch detaillierte Anleitung machbar)
