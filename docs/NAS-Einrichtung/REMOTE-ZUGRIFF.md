# 🌐 Remote-NAS-Zugriff: Synology QuickConnect

## 🎯 Überblick

Die GartenMeister-App unterstützt jetzt **echten Remote-Zugriff** auf Ihre Synology NAS über das Internet. Dies ermöglicht es, von überall aus auf Ihre Gartendaten zuzugreifen, ohne VPN oder komplizierte Netzwerk-Konfigurationen.

## 🔗 QuickConnect-URL

**Ihre NAS**: https://quickconnect.to/diwkaon
**Verzeichnis**: Gurktaler/gartenmeister

## 🚀 Einrichtung

### 1. Settings aufrufen
- Starten Sie die GartenMeister-App
- Gehen Sie zu `Einstellungen` → `Remote-Zugriff`

### 2. Remote-Konfiguration aktivieren
- Aktivieren Sie den **Remote-Zugriff** Schalter
- Konfigurieren Sie die QuickConnect-Einstellungen:

```
QuickConnect ID: diwkaon
QuickConnect URL: https://quickconnect.to/diwkaon
Benutzername: [Ihr NAS-Benutzername]
Passwort: [Ihr NAS-Passwort]
Share-Pfad: /Gurktaler/gartenmeister
```

### 3. Verbindung testen
- Klicken Sie auf **"Testen"** um die Verbindung zu prüfen
- Bei erfolgreicher Verbindung wird ein grünes Häkchen angezeigt
- Speichern Sie die Konfiguration mit **"Konfiguration speichern"**

## 🔄 Automatisches Umschalten

Die App erkennt automatisch die beste verfügbare Verbindung:

1. **Lokales Netzwerk** (wenn verfügbar) - Beste Performance
2. **Remote-Zugriff** (wenn lokal nicht verfügbar) - Funktioniert überall

## 🛠️ Fehlerbehebung

### Verbindung fehlgeschlagen
- Prüfen Sie Ihre Internetverbindung
- Verifizieren Sie Benutzername und Passwort
- Stellen Sie sicher, dass QuickConnect auf der NAS aktiviert ist

### Langsame Performance
- Remote-Zugriff ist langsamer als lokaler Zugriff
- Große Dateien können längere Ladezeiten haben
- Verwenden Sie lokales Netzwerk wenn möglich

### Session-Timeout
- Die App verwaltet Sessions automatisch
- Bei Verbindungsfehlern wird eine neue Session erstellt
- Längere Inaktivität kann zu Session-Verlust führen

## 🔐 Sicherheit

### Empfehlungen:
- Verwenden Sie starke Passwörter
- Aktivieren Sie 2FA auf Ihrer Synology NAS
- Überprüfen Sie regelmäßig die Verbindungshistorie

### Datenschutz:
- Alle Daten werden verschlüsselt übertragen
- Keine Daten werden auf externen Servern gespeichert
- Nur direkte Verbindung zu Ihrer NAS

## 📊 Monitoring

Die App bietet detailliertes Monitoring:

- **Verbindungsstatus**: Lokal vs. Remote
- **Geschwindigkeit**: Transfer-Raten
- **Fehlerprotokoll**: Verbindungsprobleme
- **Session-Informationen**: Anmeldezeiten

## 🎯 Vorteile

### Für lokale Nutzung:
- ✅ Maximale Geschwindigkeit
- ✅ Keine Internetabhängigkeit
- ✅ Direkter Dateizugriff

### Für Remote-Nutzung:
- ✅ Zugriff von überall
- ✅ Keine VPN-Konfiguration nötig
- ✅ Automatische Synchronisation
- ✅ Gleiche Funktionalität wie lokal

## 🔧 Technische Details

### Verbindungspriorisierung:
1. Lokales Netzwerk (G: Laufwerk)
2. Remote QuickConnect (HTTPS)
3. Offline-Modus (nur lokale Daten)

### API-Endpunkte:
- Authentication: `/webapi/auth.cgi`
- File Operations: `/webapi/entry.cgi`
- Download: `/webapi/entry.cgi?api=SYNO.FileStation.Download`
- Upload: `/webapi/entry.cgi?api=SYNO.FileStation.Upload`

### Unterstützte Operationen:
- ✅ Datei lesen
- ✅ Datei schreiben
- ✅ Ordner erstellen
- ✅ Verbindungstest
- ✅ Session-Management

## 📱 Verwendung

Nach der Einrichtung funktioniert die App transparent:

1. **Daten laden**: Automatisch von der besten verfügbaren Quelle
2. **Daten speichern**: Automatisch zur konfigurierten NAS
3. **Synchronisation**: Bidirektional zwischen allen Geräten
4. **Konfliktlösung**: Neueste Version gewinnt

## 🎉 Ergebnis

Mit der Remote-NAS-Integration können Sie:

- **Zu Hause**: Schnelle lokale Verbindung
- **Unterwegs**: Sichere Remote-Verbindung
- **Mehrere Geräte**: Synchrone Daten überall
- **Keine Einschränkungen**: Vollständige Funktionalität

Die App wählt automatisch die beste Verbindung und stellt sicher, dass Ihre Gartendaten immer verfügbar sind - egal wo Sie sind!

---

**🔗 Ihre QuickConnect-URL**: https://quickconnect.to/diwkaon
**📁 Ihr Verzeichnis**: Gurktaler/gartenmeister
**🎯 Status**: Bereit für Remote-Zugriff!
