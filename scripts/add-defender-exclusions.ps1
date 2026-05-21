# PowerShell-Skript zum Hinzufügen von Windows Defender-Ausnahmen für GartenMeister
# Als Administrator ausführen!

param(
    [string]$AppPath = $PSScriptRoot
)

Write-Host "=== GartenMeister Windows Defender Ausnahmen hinzufügen ===" -ForegroundColor Green
Write-Host ""

# Prüfe Administrator-Rechte
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "FEHLER: Dieses Skript muss als Administrator ausgeführt werden!" -ForegroundColor Red
    Write-Host "Rechtsklick auf PowerShell -> 'Als Administrator ausführen'" -ForegroundColor Yellow
    Read-Host "Drücken Sie Enter zum Beenden"
    exit 1
}

# Ermittle GartenMeister-Pfade
$ProjectPath = Split-Path -Parent $PSScriptRoot
$ElectronExe = Join-Path $ProjectPath "node_modules\.bin\electron.cmd"
$DistPath = Join-Path $ProjectPath "dist"
$ExportsPath = Join-Path ([Environment]::GetFolderPath("MyDocuments")) "GartenMeister"

Write-Host "GartenMeister-Projektordner: $ProjectPath" -ForegroundColor Cyan
Write-Host "Electron-Executable: $ElectronExe" -ForegroundColor Cyan
Write-Host "Build-Ausgabeordner: $DistPath" -ForegroundColor Cyan
Write-Host "Export-Ordner: $ExportsPath" -ForegroundColor Cyan
Write-Host ""

try {
    # Ordner-Ausnahmen hinzufügen
    Write-Host "Füge Ordner-Ausnahmen hinzu..." -ForegroundColor Yellow
    
    Add-MpPreference -ExclusionPath $ProjectPath
    Write-Host "✅ Projektordner hinzugefügt: $ProjectPath" -ForegroundColor Green
    
    if (Test-Path $DistPath) {
        Add-MpPreference -ExclusionPath $DistPath
        Write-Host "✅ Build-Ordner hinzugefügt: $DistPath" -ForegroundColor Green
    }
    
    if (Test-Path $ExportsPath) {
        Add-MpPreference -ExclusionPath $ExportsPath
        Write-Host "✅ Export-Ordner hinzugefügt: $ExportsPath" -ForegroundColor Green
    } else {
        # Erstelle Export-Ordner falls nicht vorhanden
        New-Item -ItemType Directory -Path $ExportsPath -Force | Out-Null
        Add-MpPreference -ExclusionPath $ExportsPath
        Write-Host "✅ Export-Ordner erstellt und hinzugefügt: $ExportsPath" -ForegroundColor Green
    }
    
    # Prozess-Ausnahmen hinzufügen
    Write-Host ""
    Write-Host "Füge Prozess-Ausnahmen hinzu..." -ForegroundColor Yellow
    
    # Node.js und Electron Prozesse
    $ProcessesToExclude = @(
        "node.exe",
        "electron.exe",
        "GartenMeister.exe"
    )
    
    foreach ($Process in $ProcessesToExclude) {
        try {
            Add-MpPreference -ExclusionProcess $Process
            Write-Host "✅ Prozess-Ausnahme hinzugefügt: $Process" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Warnung: Konnte Prozess-Ausnahme nicht hinzufügen: $Process" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "=== ERFOLGREICH ABGESCHLOSSEN ===" -ForegroundColor Green
    Write-Host "Windows Defender-Ausnahmen wurden hinzugefügt." -ForegroundColor Green
    Write-Host "Sie können GartenMeister jetzt ohne Probleme verwenden." -ForegroundColor Green
    Write-Host ""
    Write-Host "WICHTIG: Starten Sie GartenMeister neu, damit die Änderungen wirksam werden." -ForegroundColor Yellow
    
} catch {
    Write-Host ""
    Write-Host "FEHLER: Konnte Defender-Ausnahmen nicht hinzufügen!" -ForegroundColor Red
    Write-Host "Fehlermeldung: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "MANUELLE LÖSUNG:" -ForegroundColor Yellow
    Write-Host "1. Öffnen Sie Windows Sicherheit" -ForegroundColor White
    Write-Host "2. Gehen Sie zu 'Viren- & Bedrohungsschutz'" -ForegroundColor White
    Write-Host "3. Klicken Sie auf 'Einstellungen verwalten' unter 'Einstellungen für Viren- & Bedrohungsschutz'" -ForegroundColor White
    Write-Host "4. Scrollen Sie zu 'Ausschlüsse' und klicken Sie auf 'Ausschlüsse hinzufügen oder entfernen'" -ForegroundColor White
    Write-Host "5. Fügen Sie diese Ordner hinzu:" -ForegroundColor White
    Write-Host "   - $ProjectPath" -ForegroundColor Cyan
    Write-Host "   - $ExportsPath" -ForegroundColor Cyan
}

Write-Host ""
Read-Host "Drücken Sie Enter zum Beenden"
