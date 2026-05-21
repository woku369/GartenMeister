# NAS-Setup für GartenMeister Studio

## Übersicht
Diese Anleitung beschreibt die Einrichtung einer **Synology DS124 NAS** für GartenMeister Studio mit automatischer Synchronisation, Bildverwaltung und Backup-Funktionen.

## Hardware-Anforderungen

### **Synology DS124**
- **1 Bay NAS** für bis zu 1x 3.5" oder 2.5" SATA/SSD
- **Realtek RTD1619B** Quad-Core 1.7GHz Prozessor
- **1GB DDR4** RAM (nicht erweiterbar)
- **Gigabit-Ethernet** für schnelle Datenübertragung
- **USB 3.2 Gen 1** für externe Backup-Laufwerke

### **Empfohlene Festplatte**
- **Seagate IronWolf 4TB** (NAS-optimiert)
- **WD Red Plus 4TB** (Alternative)
- **Samsung 980 PRO 2TB** (SSD für maximale Performance)

## Software-Setup

### 1. **DSM (DiskStation Manager) Konfiguration**

#### Grundeinrichtung:
```bash
# NAS IP-Adresse (Beispiel)
NAS_IP: 192.168.1.100
NAS_HOSTNAME: gartenmeister-nas

# Benutzer erstellen
Admin-Benutzer: gartenmeister-admin
App-Benutzer: gartenmeister-app
```

#### Ordnerstruktur:
```
/volume1/
├── GartenMeister/
│   ├── data/                    # Haupt-Datenbank
│   │   ├── app-data.json
│   │   ├── beds.json
│   │   ├── herbs.json
│   │   └── segments.json
│   ├── images/                  # Bildverwaltung
│   │   ├── 2025/
│   │   │   ├── 01-Januar/
│   │   │   ├── 02-Februar/
│   │   │   └── ...
│   │   ├── thumbnails/
│   │   └── metadata/
│   ├── backups/                 # Automatische Backups
│   │   ├── daily/
│   │   ├── weekly/
│   │   └── monthly/
│   ├── exports/                 # PDF-Exporte
│   │   ├── reports/
│   │   └── garden-plans/
│   └── weather/                 # Wetterdaten
│       ├── historical/
│       └── forecasts/
```

### 2. **Netzwerk-Konfiguration**

#### SMB/CIFS Freigabe:
```ini
[GartenMeister]
path = /volume1/GartenMeister
valid users = gartenmeister-app, gartenmeister-admin
read only = no
browseable = yes
create mask = 0664
directory mask = 0775
```

#### NFS Freigabe (Optional):
```bash
# /etc/exports
/volume1/GartenMeister 192.168.1.0/24(rw,sync,no_subtree_check,no_root_squash)
```

### 3. **Synchronisation konfigurieren**

#### Desktop-App Integration:
```javascript
// In GartenMeister Desktop-App
const nasConfig = {
  protocol: 'smb',
  host: '192.168.1.100',
  share: 'GartenMeister',
  username: 'gartenmeister-app',
  password: process.env.NAS_PASSWORD,
  localSyncPath: 'C:\\Users\\%USERNAME%\\AppData\\Roaming\\GartenMeister\\nas-sync',
  autoSync: true,
  syncInterval: 300000 // 5 Minuten
};
```

## Bildverwaltung-Integration

### **Automatischer Upload-Workflow**
1. **Bilder in App hochladen** → Lokaler Cache
2. **Hintergrund-Sync** → NAS-Upload
3. **Thumbnail-Generierung** → Lokale Vorschau
4. **Metadaten-Extraktion** → EXIF, GPS, Zeitstempel
5. **Kategorisierung** → Automatisch nach Datum/Beet

### **Ordnerstruktur für Bilder**
```
/volume1/GartenMeister/images/
├── 2025/
│   ├── 01-Januar/
│   │   ├── Beet-001/
│   │   │   ├── wachstum/
│   │   │   ├── ernte/
│   │   │   └── probleme/
│   │   ├── Beet-002/
│   │   └── allgemein/
│   ├── 02-Februar/
│   └── ...
├── thumbnails/
│   ├── small/     # 150x150px
│   ├── medium/    # 400x400px
│   └── large/     # 800x800px
└── metadata/
    ├── 2025-01.json
    ├── 2025-02.json
    └── index.json
```

## Backup-Strategie

### **3-2-1 Backup-Regel**
- **3 Kopien** der Daten
- **2 verschiedene Medien** (NAS + External HDD)
- **1 Offsite-Backup** (Cloud oder externe Location)

#### Automatische Backups:
```bash
# Täglich: Incremental Backup
0 2 * * * /usr/bin/rsync -av --delete /volume1/GartenMeister/ /volume1/backups/daily/

# Wöchentlich: Vollbackup auf USB
0 3 * * 0 /usr/bin/rsync -av /volume1/GartenMeister/ /volumeUSB1/GartenMeister-Backup/

# Monatlich: Cloud Sync (OneDrive/Google Drive)
0 4 1 * * /usr/bin/rclone sync /volume1/GartenMeister/ onedrive:GartenMeister-Backup/
```

## Performance-Optimierung

### **SSD-Cache (DS124 unterstützt kein Cache)**
- Nutzen Sie eine **SSD als Hauptlaufwerk** für beste Performance
- **Festplatte nur für Archivierung** alter Daten

### **Netzwerk-Optimierung**
```bash
# Gigabit-Ethernet optimal nutzen
echo 'net.core.rmem_max = 67108864' >> /etc/sysctl.conf
echo 'net.core.wmem_max = 67108864' >> /etc/sysctl.conf
echo 'net.core.netdev_max_backlog = 5000' >> /etc/sysctl.conf
```

### **Bildkomprimierung**
```javascript
// Automatische Komprimierung für große Bilder
const imageOptimization = {
  maxWidth: 4096,
  maxHeight: 4096,
  quality: 85,
  format: 'jpeg',
  progressive: true,
  keepOriginal: true // Original im "originals/" Ordner behalten
};
```

## Sicherheit

### **Firewall-Regeln**
```bash
# Nur lokales Netzwerk
iptables -A INPUT -s 192.168.1.0/24 -p tcp --dport 445 -j ACCEPT  # SMB
iptables -A INPUT -s 192.168.1.0/24 -p tcp --dport 5000 -j ACCEPT # DSM
iptables -A INPUT -s 192.168.1.0/24 -p tcp --dport 5001 -j ACCEPT # DSM HTTPS
```

### **Benutzer-Berechtigungen**
```bash
# App-Benutzer: Nur Lese-/Schreibzugriff auf GartenMeister-Ordner
# Admin-Benutzer: Vollzugriff für Wartung
# Gast-Benutzer: Nur Lesezugriff auf Bilder (für Familie/Freunde)
```

### **SSL/TLS Verschlüsselung**
- **Let's Encrypt** Zertifikat für HTTPS-Zugriff
- **VPN-Zugang** für Remote-Access

## Überwachung & Wartung

### **Monitoring**
```bash
# Festplatten-Gesundheit
smartctl -a /dev/sda

# Speicherplatz überwachen
df -h /volume1/GartenMeister

# Netzwerk-Traffic
iftop -i eth0
```

### **Automatische Reports**
```javascript
// Wöchentlicher Status-Report per Email
const weeklyReport = {
  storage: '85% belegt (3.4TB von 4TB)',
  images: '2,847 neue Bilder diese Woche',
  backups: 'Alle Backups erfolgreich',
  sync: '99.8% Uptime',
  errors: 'Keine kritischen Fehler'
};
```

## Troubleshooting

### **Häufige Probleme**

#### Verbindungsprobleme:
```bash
# NAS Erreichbarkeit testen
ping 192.168.1.100

# SMB-Verbindung testen
smbclient -L //192.168.1.100 -U gartenmeister-app

# Mount-Test
mount -t cifs //192.168.1.100/GartenMeister /mnt/nas
```

#### Performance-Probleme:
```bash
# Netzwerk-Geschwindigkeit testen
iperf3 -c 192.168.1.100

# Festplatten-Performance
hdparm -tT /dev/sda
```

#### Backup-Probleme:
```bash
# Backup-Log prüfen
tail -f /var/log/backup.log

# Freier Speicherplatz prüfen
du -sh /volume1/backups/*
```

## Integration mit GartenMeister Studio

### **Desktop-App Konfiguration**
1. **Settings** → **NAS-Integration**
2. **NAS-IP eingeben:** `192.168.1.100`
3. **Anmeldedaten:** `gartenmeister-app` / `[Passwort]`
4. **Auto-Sync aktivieren:** Alle 5 Minuten
5. **Bildkomprimierung:** 85% Qualität
6. **Thumbnail-Generierung:** Automatisch

### **Cloud-Hybrid-Setup**
- **NAS:** Primärer Speicher (lokales Netzwerk)
- **OneDrive:** Sekundärer Speicher (Internet-Backup)
- **Desktop:** Cache für schnellen Zugriff

## Kosten-Nutzen-Analyse

### **Hardware-Kosten (einmalig)**
- **Synology DS124:** ~200€
- **4TB NAS-Festplatte:** ~120€
- **USB-Backup-Laufwerk:** ~80€
- **Gesamt:** ~400€

### **Vorteile**
- ✅ **Unbegrenzter lokaler Speicher**
- ✅ **Keine monatlichen Cloud-Kosten**
- ✅ **Vollständige Datenkontrolle**
- ✅ **Schneller lokaler Zugriff**
- ✅ **Automatische Backups**
- ✅ **Multi-User-Zugriff**

### **ROI (Return on Investment)**
- **Cloud-Storage 2TB:** ~10€/Monat = 120€/Jahr
- **NAS amortisiert sich in:** ~3.3 Jahren
- **Langfristige Einsparungen:** 120€/Jahr nach Amortisation

## Nächste Schritte

1. **Hardware bestellen** (DS124 + Festplatte)
2. **Netzwerk vorbereiten** (IP-Adresse reservieren)
3. **DSM installieren** und konfigurieren
4. **Ordnerstruktur erstellen**
5. **GartenMeister App konfigurieren**
6. **Bildverwaltung testen**
7. **Backup-Strategie implementieren**

---

**Geschätzte Setup-Zeit:** 4-6 Stunden
**Schwierigkeitsgrad:** Mittel (gute Dokumentation verfügbar)
**Langfristige Wartung:** ~30 Minuten/Monat
