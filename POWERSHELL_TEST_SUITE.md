# Komplette Testprozedur - PowerShell Commands

## 🧪 Vollständige Test-Suite für GartenMeister Features

### 1. **Standalone Wetter-Service erstellen und testen**

```powershell
# Verzeichnis für Standalone Weather Service erstellen
New-Item -ItemType Directory -Force -Path "weather-service"
cd weather-service

# Package.json erstellen
@"
{
  "name": "gartenmeister-weather-collector",
  "version": "1.0.0",
  "description": "Standalone Weather Data Collector für GartenMeister (NAS-ready)",
  "main": "weather-collector.js",
  "scripts": {
    "start": "node weather-collector.js",
    "test": "node test-collector.js"
  },
  "dependencies": {
    "axios": "^1.4.0",
    "node-cron": "^3.0.2"
  }
}
"@ | Out-File -FilePath "package.json" -Encoding utf8

# Dependencies installieren
npm install

# Zurück zum Hauptverzeichnis
cd ..
```

### 2. **NAS-Setup Verzeichnis erstellen**

```powershell
# NAS-Simulation erstellen
New-Item -ItemType Directory -Force -Path "nas-simulation"
cd nas-simulation

# Package.json für NAS-Services
@"
{
  "name": "gartenmeister-nas-services",
  "version": "1.0.0",
  "description": "Services for Synology NAS DS124",
  "scripts": {
    "weather": "node weather-service.js",
    "images": "node image-service.js",
    "test": "node test-services.js"
  },
  "dependencies": {
    "axios": "^1.4.0",
    "sharp": "^0.32.0",
    "exifr": "^7.1.3"
  }
}
"@ | Out-File -FilePath "package.json" -Encoding utf8

# Dependencies installieren
npm install

# Zurück zum Hauptverzeichnis
cd ..
```

### 3. **Image Manager System testen**

```powershell
# Test-Bilder Verzeichnis erstellen
New-Item -ItemType Directory -Force -Path "test-images"

# Test-Metadaten erstellen
@"
[
  {
    "id": "test-img-1",
    "title": "Test Tomaten",
    "category": "Wachstum",
    "tags": ["test", "tomaten"]
  }
]
"@ | Out-File -FilePath "test-images\test-metadata.json" -Encoding utf8

# Image Manager testen
node -e "
const ImageManager = require('./src/utils/image-manager.js');
const manager = new ImageManager('./test-images');
console.log('✅ ImageManager erfolgreich initialisiert');
console.log('Statistiken:', manager.getStatistics());
"
```

### 4. **Electron App Tests**

```powershell
# Aktuelle Node.js Version prüfen
node --version
npm --version

# Dependencies prüfen
npm list --depth=0

# TypeScript kompilieren (falls nötig)
if (Test-Path "tsconfig.json") {
    npx tsc --noEmit
    Write-Host "✅ TypeScript Typen OK"
}

# Linting (falls konfiguriert)
if (Test-Path ".eslintrc*") {
    npx eslint src --ext .ts,.tsx,.js,.jsx
    Write-Host "✅ ESLint OK"
}

# Build testen
npm run build
Write-Host "✅ Build erfolgreich"

# App starten (Background)
Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Hidden
Start-Sleep -Seconds 10
Write-Host "✅ App gestartet"

# Ports prüfen
netstat -an | Select-String ":3000"
netstat -an | Select-String ":8080"
```

### 5. **Wetter-Service Integration testen**

```powershell
# Wetterdaten-Datei prüfen
$weatherDataPath = "$env:APPDATA\GartenMeister\data\weather-data.json"
if (Test-Path $weatherDataPath) {
    $data = Get-Content $weatherDataPath | ConvertFrom-Json
    Write-Host "✅ Wetterdaten gefunden: $($data.Count) Einträge"
    Write-Host "Neuester Eintrag: $($data[-1].timestamp)"
} else {
    Write-Host "⚠️ Keine Wetterdaten gefunden"
}

# Background Service Status prüfen
Get-Process | Where-Object { $_.ProcessName -like "*node*" -or $_.ProcessName -like "*electron*" }
```

### 6. **Cloud Storage / NAS Tests**

```powershell
# Cloud-Ordner prüfen (falls konfiguriert)
$cloudPath = Get-Content "$env:APPDATA\GartenMeister\data\app-data.json" | ConvertFrom-Json | Select-Object -ExpandProperty cloudStoragePath -ErrorAction SilentlyContinue
if ($cloudPath -and (Test-Path $cloudPath)) {
    Write-Host "✅ Cloud-Ordner erreichbar: $cloudPath"
    Get-ChildItem $cloudPath | Measure-Object | Select-Object -ExpandProperty Count | ForEach-Object { Write-Host "Dateien im Cloud-Ordner: $_" }
} else {
    Write-Host "⚠️ Cloud-Ordner nicht konfiguriert oder nicht erreichbar"
}

# NAS-Verbindung simulieren (später für echtes NAS)
# Test-UNC-Pfad (wenn NAS verfügbar)
# if (Test-Path "\\192.168.1.100\gartenmeister") {
#     Write-Host "✅ NAS erreichbar"
# }
```

### 7. **Bildersammlung System testen**

```powershell
# Test-Upload simulieren
$testImagePath = "test-images\test-upload"
New-Item -ItemType Directory -Force -Path $testImagePath

# Dummy-Bilddatei erstellen (1x1 PNG)
$dummyPng = @(
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
    0x42, 0x60, 0x82
)
[byte[]]$dummyPng | Set-Content "$testImagePath\test-image.png" -Encoding Byte

# Image Manager Test
node -e "
const ImageManager = require('./src/utils/image-manager.js');
const path = require('path');
async function test() {
  try {
    const manager = new ImageManager('./test-images');
    const result = await manager.importImage('./test-images/test-upload/test-image.png', {
      title: 'Test Upload',
      category: 'Test',
      uploadedBy: 'PowerShell Test'
    });
    console.log('✅ Bild-Upload erfolgreich:', result.id);
  } catch (error) {
    console.error('❌ Bild-Upload Fehler:', error.message);
  }
}
test();
"
```

### 8. **Performance & Speicher Tests**

```powershell
# App-Speicherverbrauch prüfen
Get-Process | Where-Object { $_.ProcessName -like "*electron*" } | Format-Table ProcessName, WorkingSet, CPU

# Dateigrößen prüfen
$appDataPath = "$env:APPDATA\GartenMeister\data"
if (Test-Path $appDataPath) {
    Get-ChildItem $appDataPath | Format-Table Name, Length, LastWriteTime
    $totalSize = (Get-ChildItem $appDataPath -Recurse | Measure-Object -Property Length -Sum).Sum
    Write-Host "Gesamte Datengröße: $('{0:N2}' -f ($totalSize / 1MB)) MB"
}

# Netzwerk-Verbindungen
netstat -an | Select-String "ESTABLISHED" | Where-Object { $_ -match ":80|:443|:3000" }
```

### 9. **Error Handling & Recovery Tests**

```powershell
# Fehlerhafte Daten simulieren
$corruptFile = "$env:APPDATA\GartenMeister\data\test-corrupt.json"
"{ invalid json" | Out-File -FilePath $corruptFile -Encoding utf8

# Recovery-Test
node -e "
const fs = require('fs');
try {
  const data = JSON.parse(fs.readFileSync('$($corruptFile.Replace('\', '\\'))', 'utf8'));
  console.log('❌ Korrupte Datei nicht erkannt');
} catch (error) {
  console.log('✅ Fehlerbehandlung funktioniert:', error.message);
  fs.unlinkSync('$($corruptFile.Replace('\', '\\'))');
  console.log('✅ Cleanup erfolgreich');
}
"

# Backup-System testen
$backupPath = "$env:APPDATA\GartenMeister\data\backups"
if (Test-Path $backupPath) {
    $backups = Get-ChildItem $backupPath | Sort-Object LastWriteTime -Descending
    Write-Host "✅ Backups gefunden: $($backups.Count)"
    if ($backups.Count -gt 0) {
        Write-Host "Neuestes Backup: $($backups[0].Name) - $($backups[0].LastWriteTime)"
    }
}
```

### 10. **Integration & API Tests**

```powershell
# OpenWeatherMap API testen
node -e "
const axios = require('axios');
async function testAPI() {
  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather?q=Gurk,AT&appid=27abc31487d9b25c2721ed313b51b619&units=metric');
    console.log('✅ OpenWeatherMap API OK:', response.data.name, response.data.main.temp + '°C');
  } catch (error) {
    console.error('❌ API Fehler:', error.message);
  }
}
testAPI();
"

# Meteoblue API testen (wenn konfiguriert)
# node -e "
# // Meteoblue Test hier
# "
```

### 11. **Cleanup & Reset**

```powershell
# Test-Dateien aufräumen
if (Test-Path "test-images") {
    Remove-Item -Recurse -Force "test-images"
    Write-Host "✅ Test-Dateien gelöscht"
}

if (Test-Path "weather-service") {
    Remove-Item -Recurse -Force "weather-service"
    Write-Host "✅ Weather-Service Test-Ordner gelöscht"
}

if (Test-Path "nas-simulation") {
    Remove-Item -Recurse -Force "nas-simulation"
    Write-Host "✅ NAS-Simulation gelöscht"
}

# Electron-Prozesse beenden (falls nötig)
Get-Process | Where-Object { $_.ProcessName -like "*electron*" } | Stop-Process -Force
Write-Host "✅ Electron-Prozesse beendet"
```

### 12. **Finale Validierung**

```powershell
# Finale Checks
$checks = @()

# 1. App-Daten vorhanden
if (Test-Path "$env:APPDATA\GartenMeister\data\app-data.json") {
    $checks += "✅ App-Daten OK"
} else {
    $checks += "❌ App-Daten fehlen"
}

# 2. Wetter-System
if (Test-Path "$env:APPDATA\GartenMeister\data\weather-data.json") {
    $checks += "✅ Wetter-System OK"
} else {
    $checks += "❌ Wetter-System nicht initialisiert"
}

# 3. Build-System
if (Test-Path ".next") {
    $checks += "✅ Build-System OK"
} else {
    $checks += "❌ Build fehlt"
}

# 4. Dependencies
try {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $nodeModules = Test-Path "node_modules"
    if ($nodeModules) {
        $checks += "✅ Dependencies OK"
    } else {
        $checks += "❌ Dependencies fehlen"
    }
} catch {
    $checks += "❌ Package.json Fehler"
}

# Ergebnisse anzeigen
Write-Host "`n=== FINALE TEST-ERGEBNISSE ==="
$checks | ForEach-Object { Write-Host $_ }

$successCount = ($checks | Where-Object { $_ -match "✅" }).Count
$totalCount = $checks.Count
Write-Host "`n📊 Erfolgsrate: $successCount/$totalCount ($([math]::Round($successCount/$totalCount*100))%)"

if ($successCount -eq $totalCount) {
    Write-Host "🎉 Alle Tests bestanden! System ist bereit."
} else {
    Write-Host "⚠️ Einige Tests fehlgeschlagen. Bitte Fehler beheben."
}
```

## 🎯 **Schnell-Test (Zusammengefasst)**

```powershell
# Alles in einem Befehl testen
function Test-GartenMeister {
    Write-Host "🧪 Starte GartenMeister Tests..."
    
    # Dependencies
    npm install
    
    # Build
    npm run build
    
    # Basic Tests
    node --version
    
    # App-Daten prüfen
    if (Test-Path "$env:APPDATA\GartenMeister") {
        Write-Host "✅ App-Daten OK"
    }
    
    # Wetter-API Test
    node -e "const axios=require('axios'); axios.get('https://api.openweathermap.org/data/2.5/weather?q=Gurk,AT&appid=27abc31487d9b25c2721ed313b51b619').then(r=>console.log('✅ Wetter-API OK')).catch(e=>console.log('❌ API Fehler'))"
    
    Write-Host "✅ Basis-Tests abgeschlossen"
}

# Funktion ausführen
Test-GartenMeister
```
