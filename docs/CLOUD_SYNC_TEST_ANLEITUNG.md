# Cloud-Sync Test-Anleitung 🧪

## Test-Szenario: Neue Installation verhindert Datenverlust

### **Vorbereitung:**

1. **Rechner A (Haupt-Rechner):**
   ```
   - GartenMeister installiert und konfiguriert
   - Beete, Kräuter, Segmente angelegt
   - Cloud-Sync-Pfad: z.B. "C:\Users\...\OneDrive\GartenMeister"
   - Synchronisation durchgeführt
   ```

2. **Rechner B (Neu-Installation):**
   ```
   - Frische GartenMeister Installation  
   - Zugriff auf gleichen Cloud-Ordner
   - Cloud-Sync-Pfad: gleicher OneDrive/Google Drive Ordner
   ```

---

## 🧪 **Test-Ablauf:**

### **Schritt 1: Daten auf Rechner A erstellen**
```bash
1. Öffne GartenMeister auf Rechner A
2. Lege mehrere Beete an (Normal + Versuchsbeete)
3. Füge Segmente und Kräuter hinzu
4. Gehe zu Einstellungen → Cloud-Sync
5. Wähle Sync-Ordner (OneDrive/Google Drive)
6. Klicke "Synchronisieren"
7. Bestätige dass Ordner erstellt wurde:
   
   OneDrive/GartenMeister-Data/
   ├── beds.json
   ├── herbs.json  
   ├── segments.json
   ├── garten-config.json
   └── sync-metadata.json
```

### **Schritt 2: Neue Installation auf Rechner B**
```bash
1. Installiere GartenMeister auf Rechner B
2. Starte die App (zeigt leere Übersicht)
3. Gehe zu Einstellungen → Cloud-Sync
4. Wähle GLEICHEN Sync-Ordner wie Rechner A
5. Klicke "Synchronisieren"
6. ERWARTUNG: Cloud-Daten werden automatisch geladen
7. RESULTAT: Übersicht zeigt alle Beete von Rechner A
```

### **Schritt 3: Bidirektionale Synchronisation**
```bash
1. Auf Rechner B: Lege neues Beet an
2. Synchronisiere auf Rechner B
3. Auf Rechner A: Synchronisiere  
4. ERWARTUNG: Rechner A erhält neues Beet von Rechner B
```

---

## 📊 **Erwartete Ergebnisse:**

### **✅ VORHER (Problem):**
```
Rechner B: Neue Installation
Sync-Aktivierung → Leere Daten überschreiben Cloud
Resultat: ❌ Datenverlust
```

### **✅ JETZT (Gelöst):**
```
Rechner B: Neue Installation
Sync-Aktivierung → Cloud-Daten werden importiert
Resultat: ✅ Alle Daten verfügbar
```

---

## 🔍 **Debug-Informationen:**

### **Console-Logs überwachen:**
```javascript
// Öffne Browser DevTools (F12) und prüfe auf:
[SimpleCloudSync] 📥 Schritt 1: Prüfe auf Cloud-Daten...
[SimpleCloudSync] 📂 Cloud-Datei gefunden: beds.json
[SimpleCloudSync] ✅ Cloud-Daten geladen: beds.json (XXX Zeichen)
[SimpleCloudSync] 🔄 Importiere Cloud-Daten in lokalen Store...
[SimpleCloudSync] ✅ X Beete importiert
[SimpleCloudSync] 🎉 Cloud-Daten erfolgreich importiert!
```

### **Datei-System prüfen:**
```bash
# Cloud-Ordner nach Sync:
OneDrive/GartenMeister-Data/
├── beds.json              ← Alle Beete
├── herbs.json             ← Kräutersorten
├── segments.json          ← Segmente  
├── harvests.json          ← Ernten
├── garten-config.json     ← Konfiguration
└── sync-metadata.json     ← Zeitstempel

# Lokaler App-Ordner:
%APPDATA%/GartenMeister/data/
├── app-data.json          ← Synchronisiert mit Cloud
└── backups/               ← Automatische Backups
```

---

## 🐛 **Troubleshooting:**

### **Problem: Keine Cloud-Daten gefunden**
```bash
Lösung:
1. Prüfe Cloud-Ordner-Pfad in Einstellungen
2. Stelle sicher, dass OneDrive/Google Drive synchronisiert
3. Prüfe Dateiberechtigungen
4. Logs in Browser-Konsole prüfen
```

### **Problem: Import schlägt fehl**
```bash
Lösung:
1. Browser DevTools öffnen (F12)
2. Console-Tab → Nach Fehlern suchen
3. Network-Tab → API-Aufrufe prüfen
4. Application-Tab → Local Storage prüfen
```

### **Problem: Daten werden überschrieben**
```bash
Lösung:
1. Zeitstempel in sync-metadata.json prüfen
2. Beide Rechner synchronisieren
3. Bei Konflikten: Neuere Daten gewinnen
4. Backup aus Cloud-Ordner wiederherstellen
```

---

## ⚡ **Schnelltest:**

### **1-Minute Verification:**
```bash
1. Rechner A: Neues Beet "Test-Sync-123" anlegen
2. Rechner A: Synchronisieren
3. Rechner B: Synchronisieren  
4. Rechner B: Sollte "Test-Sync-123" zeigen
5. ✅ Sync funktioniert bidirektional
```

---

## 🎯 **Success Criteria:**

- ✅ Neue Installation lädt automatisch Cloud-Daten
- ✅ Keine leeren .json Dateien überschreiben Cloud
- ✅ Bidirektionale Synchronisation funktioniert
- ✅ Zeitstempel-basierte Konflikt-Lösung  
- ✅ Robuste Fehlerbehandlung
- ✅ UI-Feedback über Sync-Status

**Wenn alle Punkte erfüllt → Cloud-Sync Problem ist gelöst! 🎉**
