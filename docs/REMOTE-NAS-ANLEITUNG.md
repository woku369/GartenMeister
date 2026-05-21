# 🌐 Remote-NAS-Zugriff: Anleitung

## 📋 Übersicht

Die GartenMeister-App kann jetzt von jedem Gerät aus auf Ihr Synology NAS zugreifen, auch von entfernten Standorten. Dies ermöglicht echte Multi-Device-Unterstützung ohne lokale Netzlaufwerke.

## 🔧 Einrichtung

### 1. QuickConnect konfigurieren

**Synology NAS (einmalig):**
- Gehen Sie zu **Systemsteuerung > QuickConnect**
- Aktivieren Sie QuickConnect
- Merken Sie sich Ihre **QuickConnect-ID**: `diwkaon`
- URL: `https://quickconnect.to/diwkaon`

**GartenMeister-App:**
1. Öffnen Sie **Einstellungen > Remote-Zugriff**
2. Tab **QuickConnect** auswählen
3. QuickConnect-ID eingeben: `diwkaon`
4. QuickConnect aktivieren

### 2. Lokales Netzwerk als Fallback

**Für bessere Performance im lokalen Netzwerk:**
1. Tab **Lokales Netzwerk** auswählen
2. IP-Adresse eingeben: `192.168.0.25`
3. Port: `5000` (Standard)
4. Lokales Netzwerk aktivieren

### 3. Authentifizierung

**Sicherheitsempfehlung:**
- Erstellen Sie einen separaten Benutzer für GartenMeister
- Vergeben Sie nur minimale Berechtigungen
- Verwenden Sie ein starkes Passwort

**Konfiguration:**
1. Tab **Authentifizierung** auswählen
2. Benutzername eingeben
3. Passwort eingeben
4. Optional: "Passwort speichern" aktivieren

### 4. Verbindungstest

1. Klicken Sie auf **"Testen"**
2. Die App versucht automatisch:
   - Zuerst QuickConnect (Internet)
   - Dann lokales Netzwerk (falls im gleichen Netzwerk)
3. Bei Erfolg sehen Sie: ✅ **Verbunden**

## 🔗 Verbindungsarten

### 🌐 QuickConnect (Internet)
- **Vorteil**: Funktioniert von überall
- **Nachteil**: Etwas langsamer
- **Verwendung**: Für entfernte Geräte

### 🏠 Lokales Netzwerk
- **Vorteil**: Sehr schnell
- **Nachteil**: Nur im gleichen Netzwerk
- **Verwendung**: Für Geräte zu Hause

### 📁 Lokales Laufwerk (G:)
- **Vorteil**: Extrem schnell
- **Nachteil**: Nur auf dem Haupt-PC
- **Verwendung**: Für den primären Rechner

## 📊 Automatischer Fallback

Die App verwendet automatisch die beste verfügbare Verbindung:

1. **Lokales Laufwerk** (G:) - falls verfügbar
2. **Lokales Netzwerk** - falls im gleichen Netzwerk
3. **QuickConnect** - für Remote-Zugriff
4. **Lokale Daten** - als letzter Fallback

## 🛠️ Fehlerbehebung

### Verbindung fehlgeschlagen
- Prüfen Sie die QuickConnect-ID
- Stellen Sie sicher, dass QuickConnect am NAS aktiviert ist
- Überprüfen Sie Benutzername und Passwort
- Testen Sie die Verbindung im Browser: `https://quickconnect.to/diwkaon`

### Authentifizierung fehlgeschlagen
- Verwenden Sie einen gültigen Synology-Benutzer
- Prüfen Sie die Berechtigungen des Benutzers
- Stellen Sie sicher, dass das Konto nicht gesperrt ist

### Langsame Verbindung
- Bevorzugen Sie lokales Netzwerk wenn verfügbar
- Prüfen Sie Ihre Internetverbindung
- Stellen Sie sicher, dass das NAS über gute Upload-Geschwindigkeit verfügt

## 🔒 Sicherheit

### Empfohlene Einstellungen
- Erstellen Sie einen separaten Benutzer "gartenmeister"
- Vergeben Sie nur Zugriff auf den Ordner "Gurktaler"
- Verwenden Sie ein starkes, einzigartiges Passwort
- Aktivieren Sie 2FA für den Synology-Account (optional)

### Datenschutz
- Alle Daten bleiben auf Ihrem NAS
- Keine Cloud-Speicherung bei Dritten
- Verbindungen sind verschlüsselt (HTTPS)
- Passwörter werden nur lokal gespeichert

## 📱 Multi-Device-Setup

### Hauptrechner (mit G: Laufwerk)
- Verwendet automatisch das lokale Laufwerk
- Fallback auf Remote-Zugriff bei Bedarf
- Beste Performance

### Weitere Geräte im Netzwerk
- Verwenden lokales Netzwerk (schnell)
- Fallback auf QuickConnect
- Gute Performance

### Entfernte Geräte
- Verwenden QuickConnect
- Funktioniert von überall
- Akzeptable Performance

## 📋 Testen der Einrichtung

### Schritt 1: Verbindungstest
1. Einstellungen > Remote-Zugriff
2. Alle Einstellungen konfigurieren
3. "Testen" klicken
4. Erfolgsmeldung abwarten

### Schritt 2: Daten-Sync-Test
1. Einstellungen > NAS-Integration
2. "Manueller Sync" klicken
3. Prüfen, ob Daten synchronisiert werden

### Schritt 3: Multi-Device-Test
1. App auf zweitem Gerät installieren
2. Remote-Zugriff konfigurieren
3. Daten sollten automatisch geladen werden

## 🎉 Vorteile

### Für Benutzer
- ✅ Zugriff von überall
- ✅ Automatische Synchronisation
- ✅ Keine komplexe VPN-Konfiguration
- ✅ Einmalige Einrichtung

### Für Administratoren
- ✅ Zentrale Datenverwaltung
- ✅ Automatische Backups
- ✅ Skalierbar für multiple Benutzer
- ✅ Sichere Verbindungen

---

**🔗 Weitere Hilfe:**
- Synology QuickConnect: https://quickconnect.to/diwkaon
- GartenMeister Support: Einstellungen > Hilfe
- Diagnose-Tools: Einstellungen > Monitoring

*Die Remote-NAS-Funktionalität macht GartenMeister zu einer echten Multi-Device-Anwendung!*
