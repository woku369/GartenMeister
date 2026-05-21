# PowerShell Commands Anleitung für GartenMeister

## ❌ NICHT SO: `&&` funktioniert NICHT in PowerShell

```powershell
# FEHLER - das wird nicht funktionieren:
npm run build && npm start
```

## ✅ SO RICHTIG: Separate Befehle oder `;`

### Option 1: Separate Befehle (EMPFOHLEN)
```powershell
npm run build
npm start
```

### Option 2: Mit Semikolon
```powershell
npm run build; npm start
```

### Option 3: Mit if-Prüfung für Fehlerbehandlung
```powershell
npm run build
if ($LASTEXITCODE -eq 0) { npm start }
```

## Häufige GartenMeister Commands

### Development Mode
```powershell
# Next.js Dev Server starten
npm run dev

# In einem NEUEN Terminal: Electron starten
npm run electron
```

### Build Prozess
```powershell
# Schritt 1: Next.js Build
npm run build

# Schritt 2: Electron Package erstellen
npm run package
```

### Quick Start
```powershell
# Für normale Entwicklung:
npm start
```

## NPM Scripts (diese sind korrekt und verwenden `&&`)

Die npm scripts in `package.json` verwenden `&&` korrekt, da npm diese plattformübergreifend behandelt:

```json
{
  "scripts": {
    "package": "npm run build:electron && electron-forge package",
    "make": "npm run build:electron && electron-forge make"
  }
}
```

## Wichtige Hinweise

1. **NIEMALS** `&&` direkt in PowerShell verwenden
2. **IMMER** entweder separate Zeilen oder `;` verwenden
3. npm scripts mit `npm run <script>` sind sicher und plattformübergreifend
4. .bat Dateien verwenden Windows-Syntax und sind korrekt

## Electron + Next.js Development

### Korrekte Reihenfolge:
1. Terminal 1: `npm run dev` (startet Next.js auf Port 9002)
2. Warten bis "Ready" angezeigt wird
3. Terminal 2: `npm run electron` (startet Electron App)

### NICHT versuchen:
```powershell
# Das funktioniert NICHT in PowerShell:
npm run dev && npm run electron
```

### Stattdessen:
```powershell
# Terminal 1:
npm run dev

# Warten auf "Ready", dann Terminal 2:
npm run electron
```
