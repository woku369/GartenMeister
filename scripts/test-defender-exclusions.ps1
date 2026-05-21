# Teste Windows Defender Ausnahmen für GartenMeister
Write-Host "🧪 WINDOWS DEFENDER AUSNAHMEN - TEST" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Yellow

# Hole aktuelle Defender-Ausnahmen
try {
    $exclusions = Get-MpPreference | Select-Object -ExpandProperty ExclusionPath
    $processes = Get-MpPreference | Select-Object -ExpandProperty ExclusionProcess
    
    Write-Host "✅ Windows Defender Zugriff OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Kein Zugriff auf Windows Defender-Einstellungen" -ForegroundColor Red
    Write-Host "Möglicherweise keine Admin-Rechte oder Defender deaktiviert" -ForegroundColor Yellow
    exit 1
}

Write-Host

# Teste Projekt-Ordner
$projectPath = Split-Path -Parent $PSScriptRoot
Write-Host "📂 Projekt-Ordner: $projectPath" -ForegroundColor Cyan
if ($exclusions -contains $projectPath) {
    Write-Host "  ✅ Ausnahme vorhanden" -ForegroundColor Green
} else {
    Write-Host "  ❌ Keine Ausnahme gefunden" -ForegroundColor Red
    Write-Host "  👉 Führe add-defender-exclusions.ps1 als Administrator aus" -ForegroundColor Yellow
}

# Teste Export-Ordner
$documentsPath = "$env:USERPROFILE\Documents\GartenMeister"
Write-Host "📂 Export-Ordner: $documentsPath" -ForegroundColor Cyan
if ($exclusions -contains $documentsPath) {
    Write-Host "  ✅ Ausnahme vorhanden" -ForegroundColor Green
} else {
    Write-Host "  ❌ Keine Ausnahme gefunden" -ForegroundColor Red
}

# Teste Daten-Ordner
$appDataPath = "$env:APPDATA\GartenMeister"
Write-Host "📂 Daten-Ordner: $appDataPath" -ForegroundColor Cyan
if ($exclusions -contains $appDataPath) {
    Write-Host "  ✅ Ausnahme vorhanden" -ForegroundColor Green
} else {
    Write-Host "  ❌ Keine Ausnahme gefunden" -ForegroundColor Red
}

Write-Host

# Teste Prozesse
Write-Host "🔧 Prozess-Ausnahmen:" -ForegroundColor Cyan
@("node.exe", "electron.exe") | ForEach-Object {
    if ($processes -contains $_) {
        Write-Host "  ✅ $_ ausgenommen" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $_ nicht ausgenommen" -ForegroundColor Red
    }
}

Write-Host

# Zusammenfassung
$missing = @()
if ($exclusions -notcontains $projectPath) { $missing += "Projekt-Ordner" }
if ($exclusions -notcontains $documentsPath) { $missing += "Export-Ordner" }
if ($exclusions -notcontains $appDataPath) { $missing += "Daten-Ordner" }
if ($processes -notcontains "node.exe") { $missing += "node.exe" }
if ($processes -notcontains "electron.exe") { $missing += "electron.exe" }

if ($missing.Count -eq 0) {
    Write-Host "🎉 ALLE AUSNAHMEN KONFIGURIERT!" -ForegroundColor Green
    Write-Host "GartenMeister sollte ohne Defender-Probleme laufen." -ForegroundColor Green
} else {
    Write-Host "⚠️ FEHLENDE AUSNAHMEN:" -ForegroundColor Yellow
    $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host
    Write-Host "👉 Führe add-defender-exclusions.ps1 als Administrator aus" -ForegroundColor Yellow
}

Write-Host

# PDF-Export Test-Hinweis
Write-Host "🧪 NÄCHSTER SCHRITT - PDF-Export testen:" -ForegroundColor Cyan
Write-Host "1. GartenMeister starten: npm start" -ForegroundColor Gray
Write-Host "2. PDF-Export-Button klicken" -ForegroundColor Gray
Write-Host "3. Bei Problemen: Siehe WINDOWS_DEFENDER_LOSUNG.md" -ForegroundColor Gray

Read-Host "`nDrücke Enter zum Beenden"
