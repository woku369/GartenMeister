# Installation & Update-System - Dokumentation

## 🚀 **Installation (.exe)**

### **Neue Installation**
1. **Download**: Lade `GartenMeister-Setup.exe` herunter
2. **Installation**: Doppelklick auf die .exe-Datei
3. **Setup**: Folge dem Installations-Assistenten
4. **Fertig**: GartenMeister ist installiert und startklar

### **Installationsoptionen**
- **Zielverzeichnis**: Wählbar (Standard: `C:\Users\[Name]\AppData\Local\gartenmeister-desktop`)
- **Desktop-Verknüpfung**: Automatisch erstellt
- **Startmenü-Eintrag**: Automatisch erstellt
- **Deinstallation**: Über Windows "Programme & Features"

## 🔄 **Auto-Update System**

### **Automatische Updates**
GartenMeister prüft automatisch nach Updates:
- **Beim Start**: 30 Sekunden nach App-Start
- **Periodisch**: Alle 4 Stunden im Hintergrund
- **Manuell**: Über Menü "Hilfe" → "Nach Updates suchen"

### **Update-Prozess**
```
1. Update gefunden → Benutzer-Dialog
2. Download starten → Fortschrittsanzeige  
3. Installation → Automatischer Neustart
4. Fertig → Neue Version läuft
```

### **Update-Strategien**

#### **Automatische Updates (Empfohlen)**
- ✅ **Sicherheit**: Immer neueste Sicherheits-Patches
- ✅ **Features**: Neue Funktionen sofort verfügbar
- ✅ **Bugfixes**: Probleme werden automatisch behoben
- ⚠️ **Kontrolle**: Weniger Benutzer-Kontrolle

#### **Manuelle Updates**
- ✅ **Kontrolle**: Benutzer entscheidet wann
- ✅ **Stabilität**: Updates nur bei Bedarf
- ⚠️ **Sicherheit**: Verpasste Sicherheits-Updates
- ⚠️ **Support**: Ältere Versionen schwerer zu supporten

## 🛠️ **Build-Prozess für Entwickler**

### **Normale Installation erstellen**
```powershell
# Vollständiger Build mit Installer
npm run release

# Nur Installer (ohne Kopieren)
npm run make:installer

# Portable Version (ohne Installation)
npm run make:portable
```

### **Versionierung**
```json
// package.json
{
  "version": "1.0.0" // Semantic Versioning (Major.Minor.Patch)
}
```

### **Update-Releases vorbereiten**
```powershell
# 1. Version erhöhen
# package.json: "version": "1.0.1"

# 2. Changelog erstellen
# CHANGELOG.md aktualisieren

# 3. Build erstellen
npm run release

# 4. Update-Server aktualisieren (später)
# releases/GartenMeister-Setup.exe → Update-Server
```

## 📁 **Verzeichnisstruktur**

### **Development**
```
GartenMeisterStudio/
├── src/                          # Quellcode
├── releases/                     # Fertige Installer
│   ├── GartenMeister-Setup.exe   # Aktuelle Version
│   └── archive/                  # Alte Versionen
├── out/                          # Build-Ausgabe
│   ├── make/                     # Installationsdateien
│   └── GartenMeister-win32-x64/  # Portable Version
└── package.json                  # Version & Metadaten
```

### **Installation (Benutzer)**
```
C:\Users\[Name]\AppData\Local\gartenmeister-desktop\
├── GartenMeister.exe             # Haupt-Anwendung
├── resources/                    # App-Ressourcen
├── Update.exe                    # Auto-Updater
└── app-update.yml                # Update-Konfiguration

C:\Users\[Name]\AppData\Roaming\GartenMeister\
├── data/                         # Benutzerdaten
│   ├── app-data.json            # Garten-Daten
│   ├── weather-data.json        # Wetter-Daten
│   └── backups/                 # Automatische Backups
└── logs/                        # App-Logs
```

## 🔧 **Update-Server Setup (Zukunft)**

### **GitHub Releases (Kostenlos)**
```javascript
// forge.config.js
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'gartenmeister',
  repo: 'gartenmeister-releases',
  private: false
});
```

### **Eigener Server**
```javascript
// forge.config.js
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://updates.gartenmeister.com/releases',
  useMultipleRangeRequest: true
});
```

### **NAS-basierter Update-Server**
```javascript
// Lokaler Update-Server auf NAS
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'http://192.168.1.100:8080/gartenmeister-updates',
  useMultipleRangeRequest: false
});
```

## 🧪 **Testing & Deployment**

### **Test-Installation**
```powershell
# 1. Installer erstellen
npm run make:installer

# 2. Auf Test-Rechner kopieren
Copy-Item "out/make/squirrel.windows/x64/GartenMeister-Setup.exe" "\\test-pc\shared\"

# 3. Auf Test-Rechner installieren
# Remote: Doppelklick auf GartenMeister-Setup.exe

# 4. Funktionalität testen
# - App startet
# - Daten werden geladen
# - Alle Features funktionieren
```

### **Update-Test**
```powershell
# 1. Version 1.0.0 installieren
# 2. Version auf 1.0.1 erhöhen
# 3. Neuen Build erstellen
# 4. Update-Server aktualisieren
# 5. In App: "Nach Updates suchen"
# 6. Update-Prozess testen
```

## 📋 **Deployment Checklist**

### **Vor dem Release**
- [ ] **Version erhöht** in package.json
- [ ] **Tests bestanden** (alle Features funktionieren)
- [ ] **Changelog erstellt** (neue Features dokumentiert)
- [ ] **Build erfolgreich** (keine Fehler)
- [ ] **Installer getestet** (Installation funktioniert)
- [ ] **Backup der alten Version** erstellt

### **Release-Prozess**
- [ ] **Build erstellen**: `npm run release`
- [ ] **Installer testen**: Auf sauberem System installieren
- [ ] **Update-Test**: Von vorheriger Version updaten
- [ ] **Dokumentation**: README und Docs aktualisieren
- [ ] **Distribution**: Installer bereitstellen

### **Nach dem Release**
- [ ] **Monitoring**: Logs auf Fehler prüfen
- [ ] **Feedback sammeln**: Benutzer-Rückmeldungen
- [ ] **Hotfixes**: Kritische Bugs sofort beheben
- [ ] **Planung**: Nächste Version planen

## ⚙️ **Konfiguration**

### **Auto-Update deaktivieren**
```javascript
// In src/utils/auto-updater.js
const AUTO_UPDATE_ENABLED = false; // Für Enterprise-Umgebungen
```

### **Update-Intervall anpassen**
```javascript
// Prüfung alle 24 Stunden statt 4 Stunden
setInterval(() => {
  this.checkForUpdates(false);
}, 24 * 60 * 60 * 1000);
```

### **Update-Kanal wählen**
```javascript
// Stable, Beta, oder Alpha Channel
autoUpdater.allowPrerelease = false; // Nur stabile Updates
autoUpdater.channel = 'latest';      // Release-Kanal
```

## 🔒 **Sicherheit**

### **Code-Signing (Empfohlen)**
```powershell
# Zertifikat für Windows Code-Signing
# - Verhindert "Unbekannter Publisher" Warnung
# - Benutzer vertrauen der Software mehr
# - Weniger false-positive Antivirus-Erkennungen
```

### **Update-Verifikation**
```javascript
// Automatische Signatur-Prüfung
autoUpdater.verifySignature = true;
autoUpdater.requestHeaders = { 'User-Agent': 'GartenMeister/1.0.0' };
```

## 📊 **Monitoring & Analytics**

### **Update-Statistiken**
- **Update-Erfolgsrate**: Wie viele Updates erfolgreich
- **Versions-Verteilung**: Welche Versionen im Einsatz
- **Fehler-Tracking**: Update-Probleme identifizieren
- **Performance**: Update-Download-Zeiten

### **Logging**
```javascript
// Update-Events protokollieren
autoUpdater.on('update-available', (info) => {
  console.log(`Update verfügbar: ${info.version}`);
  // Analytics: Update-Verfügbarkeit tracken
});

autoUpdater.on('update-downloaded', (info) => {
  console.log(`Update heruntergeladen: ${info.version}`);
  // Analytics: Download-Erfolg tracken
});
```

## 🎯 **Best Practices**

### **Versionierung**
- **Major** (1.0.0 → 2.0.0): Breaking Changes
- **Minor** (1.0.0 → 1.1.0): Neue Features (backward compatible)
- **Patch** (1.0.0 → 1.0.1): Bugfixes

### **Release-Strategie**
- **Frequent Small Updates**: Weniger Risiko, schnellere Fixes
- **Feature Toggles**: Neue Features schrittweise aktivieren
- **Rollback-Plan**: Schnell zur vorherigen Version zurück

### **Benutzer-Erfahrung**
- **Minimal Disruption**: Updates im Hintergrund
- **Clear Communication**: Was ist neu, was ändert sich
- **Quick Installation**: Wenige Sekunden für Update

## 🔄 **Migration zwischen Versionen**

### **Daten-Migration**
```javascript
// Automatische Datenformat-Updates
const migrateData = (oldVersion, newVersion) => {
  if (oldVersion < '1.1.0' && newVersion >= '1.1.0') {
    // Neue Felder hinzufügen
    // Datenstruktur anpassen
  }
};
```

### **Konfigurations-Migration**
```javascript
// Settings zwischen Versionen migrieren
const migrateSettings = (settings) => {
  // Alte Einstellungen zu neuem Format konvertieren
  return updatedSettings;
};
```

---

## 🚀 **Fazit**

Das **GartenMeister Update-System** bietet:

- ✅ **Einfache Installation** (Ein Installer für alles)
- ✅ **Automatische Updates** (Immer auf dem neuesten Stand)
- ✅ **Minimal-Aufwand** (Updates ohne Neuinstallation)
- ✅ **Benutzer-Kontrolle** (Manuelle Update-Optionen)
- ✅ **Sicherheit** (Signierte Updates, Verifikation)
- ✅ **Enterprise-Ready** (Deaktivierbare Auto-Updates)

**Perfect für**: Produktive Garten-Apps, die regelmäßig neue Features und Bugfixes erhalten sollen!
