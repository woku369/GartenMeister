# Windows Defender Lösung für GartenMeister

## 🔒 Problem
Windows Defender blockiert den PDF-Export von GartenMeister, da Electron-Apps als potentiell verdächtig eingestuft werden können.

## ⚡ Schnelle Automatische Lösung

### 🧪 Schritt 1: Diagnose ausführen
**Führen Sie zuerst den Diagnose-Test aus:**
```cmd
node defender-diagnose.js
```

Dieser Test erstellt einen detaillierten Report (`defender-diagnose-report.txt`) und prüft:
- ✅ Dateizugriff im Projektordner  
- ✅ Export-Ordner-Zugriff
- ✅ PDF-Module-Verfügbarkeit
- ✅ Dependencies-Status

### 🔧 Schritt 2: Defender-Ausnahmen hinzufügen

### Option 1: Batch-Datei (Einfach)
1. **Als Administrator** ausführen: `scripts/add-defender-exclusions.bat`
2. GartenMeister neu starten

### Option 2: PowerShell-Skript (Erweitert)
1. PowerShell **als Administrator** öffnen
2. Ausführen: `scripts/add-defender-exclusions.ps1`
3. GartenMeister neu starten

## 🛠️ Manuelle Lösung

### Windows 11/10:
1. **Windows Sicherheit** öffnen (Windows-Taste + I → Update & Sicherheit → Windows-Sicherheit)
2. **"Viren- & Bedrohungsschutz"** auswählen
3. **"Einstellungen verwalten"** unter "Einstellungen für Viren- & Bedrohungsschutz"
4. **"Ausschlüsse hinzufügen oder entfernen"** unter "Ausschlüsse"
5. **"Ausschluss hinzufügen"** → **"Ordner"**
6. Diese Ordner hinzufügen:
   - `C:\Users\WK\Desktop\GartenMeisterStudio` (Projektordner)
   - `C:\Users\WK\Documents\GartenMeister` (Export-Ordner)

### Prozess-Ausschlüsse (Optional):
1. **"Ausschluss hinzufügen"** → **"Prozess"**
2. Diese Prozesse hinzufügen:
   - `node.exe`
   - `electron.exe`
   - `GartenMeister.exe`

## 🔄 Safe Mode (HTML-Export)

Falls Defender-Ausnahmen nicht möglich sind:
1. GartenMeister erkennt automatisch Blockierungen
2. Erstellt HTML-Export als Fallback
3. HTML-Datei öffnen → **Drucken** → **Als PDF speichern**

## 🧪 Test nach Lösung

```bash
# GartenMeister starten
npm start

# PDF-Export testen
# In der App: PDF-Export Button klicken
```

## 🔍 Weitere Problembehebung

### Electron-spezifische Probleme:
```bash
# Dependencies neu installieren
npm install

# Electron neu builden
npm run build

# Cache leeren
npm run clean
```

### Wenn nichts hilft:
1. **Komplett-Neuinstallation**:
   ```bash
   # Projekt-Ordner komplett löschen
   # Neu herunterladen/klonen
   npm install
   npm start
   ```

2. **Alternative: Portable Version**:
   - Siehe `GartenMeister-Portable-Direct/` Ordner
   - Läuft ohne Installation

## 📝 Technische Details

**Warum blockiert Defender?**
- Electron-Apps verwenden Node.js-Prozesse
- Dateisystem-Zugriff für PDF-Export
- Dynamische Executable-Erstellung

**Was machen die Ausnahmen?**
- Erlauben Dateizugriff im Projektordner
- Erlauben PDF-Generierung im Export-Ordner
- Vertrauen Node.js/Electron-Prozessen

## 🆘 Support

Bei weiteren Problemen:
1. Siehe `docs/FEHLERBEHEBUNG.md`
2. Logs prüfen: Developer Tools → Console
3. Issue auf GitHub erstellen

---

**Wichtig**: Nach Hinzufügen der Ausnahmen muss GartenMeister **neu gestartet** werden!

### 5. Optional - Dokumente-Ordner:
```
C:\Users\WK\Documents\GartenMeister
```

## Temporäre Lösung:
1. Windows Defender Real-Time-Schutz temporär deaktivieren
2. PDF-Export durchführen
3. Real-Time-Schutz wieder aktivieren

## Dauerhafte Lösung:
- Electron-App signieren (für Produktionsversion)
- Alternative PDF-Generierung implementieren
