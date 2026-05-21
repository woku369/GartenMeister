# Google Calendar API Setup - Schritt-für-Schritt Anleitung

## Übersicht
Sie haben bereits eine **Google Client-ID**, benötigen aber noch einen **API-Key** für die vollständige Google Calendar Integration.

## Ihre aktuellen Credentials:
- ✅ **Client-ID:** `1080907617055-tccaspov5hua5q0qu4u560n1is6gjau3.apps.googleusercontent.com`
- ❌ **API-Key:** Noch benötigt

## Schritt-für-Schritt Anleitung:

### 1. Google Cloud Console öffnen
- Gehen Sie zu: https://console.cloud.google.com/
- Melden Sie sich mit Ihrem Google-Konto an

### 2. Projekt finden/auswählen
- Oben links auf den Projektnamen klicken
- Das Projekt auswählen, das zu Ihrer Client-ID gehört
- (Wahrscheinlich das gleiche Projekt, wo Sie die Client-ID erstellt haben)

### 3. APIs & Services
- Im linken Menü: **"APIs & Services"** → **"Credentials"**
- Hier sollten Sie Ihre bestehende OAuth 2.0 Client-ID sehen

### 4. API-Key erstellen
- Klicken Sie oben auf **"+ CREATE CREDENTIALS"**
- Wählen Sie **"API key"** aus
- Ein neuer API-Key wird generiert

### 5. API-Key konfigurieren (wichtig für Sicherheit)
- Klicken Sie auf den neu erstellten API-Key
- Bei **"Application restrictions"** wählen Sie **"HTTP referrers (web sites)"**
- Fügen Sie diese Referrer hinzu:
  ```
  http://localhost:*
  https://localhost:*
  file://*
  ```
- Bei **"API restrictions"** wählen Sie **"Restrict key"**
- Aktivieren Sie: **"Google Calendar API"**

### 6. Google Calendar API aktivieren
- Gehen Sie zu **"APIs & Services"** → **"Library"**
- Suchen Sie nach **"Google Calendar API"**
- Klicken Sie darauf und dann auf **"Enable"**

### 7. API-Key kopieren
- Gehen Sie zurück zu **"Credentials"**
- Kopieren Sie Ihren neuen API-Key
- Tragen Sie ihn in die GartenMeister Einstellungen ein

## Alternative: Vereinfachter Ansatz

Für eine einfachere Integration können Sie auch nur die **Client-ID** verwenden:

### Modern OAuth-Flow (ohne separaten API-Key)
- Google's moderne APIs unterstützen oft OAuth ohne separaten API-Key
- Die Client-ID allein reicht für viele Calendar-Operationen aus
- Dies ist sicherer, da keine API-Keys in der App gespeichert werden

## Was in GartenMeister passiert:

### Mit API-Key (traditionell):
```javascript
// Direkte API-Aufrufe mit API-Key
fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?key=${apiKey}`)
```

### Nur mit Client-ID (modern, empfohlen):
```javascript
// OAuth-Flow mit Google Identity
google.accounts.oauth2.initTokenClient({
  client_id: '1080907617055-tccaspov5hua5q0qu4u560n1is6gjau3.apps.googleusercontent.com',
  scope: 'https://www.googleapis.com/auth/calendar.readonly'
})
```

## Empfehlung:
1. **Einfachster Weg:** Verwenden Sie nur die Client-ID mit OAuth (moderner Ansatz)
2. **Traditioneller Weg:** Erstellen Sie zusätzlich einen API-Key wie oben beschrieben

## Hilfe bei Problemen:
- Falls Sie das ursprüngliche Projekt nicht finden, können Sie ein neues erstellen
- Die Client-ID funktioniert projekt-übergreifend, solange die Calendar API aktiviert ist
- Bei Fragen zu spezifischen Schritten, lassen Sie es mich wissen!

## Nächste Schritte in GartenMeister:
1. API-Key in den Einstellungen eintragen (falls erstellt)
2. Calendar-Integration in den Einstellungen aktivieren
3. OAuth-Flow testen
4. Erste Kalender-Termine abrufen

---
*Diese Anleitung wurde am 18. Juni 2025 erstellt für die GartenMeister App.*
