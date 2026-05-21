# PowerShell Commands - Quick Reference

## ✅ Korrekte PowerShell Syntax für GartenMeister

### Development
```powershell
# Entwicklung starten (EMPFOHLEN)
npm run dev
# In neuem Terminal:
npm run electron

# Build und Test
npm run build
npm run package

# Cleanup bei Problemen
taskkill /F /IM node.exe /T
taskkill /F /IM electron.exe /T
```

### Alternative mit Semikolon
```powershell
npm run build; npm run package
taskkill /F /IM node.exe /T; taskkill /F /IM electron.exe /T
```

## ❌ NIEMALS in PowerShell
```powershell
# DAS FUNKTIONIERT NICHT:
npm run build && npm run package
npm run dev && npm run electron
```

## ✅ NPM Scripts (package.json) sind korrekt
```json
{
  "scripts": {
    "package": "npm run build:electron && electron-forge package"
  }
}
```
NPM behandelt `&&` plattformübergreifend korrekt.

## Schnelltest
```powershell
# Teste ob App läuft:
npm start

# Bei Fehlern:
npm run typecheck
npm run lint
```
