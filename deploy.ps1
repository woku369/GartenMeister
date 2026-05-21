# GartenMeister - Schnell-Deployment Script

Write-Host "🚀 GartenMeister Deployment gestartet..." -ForegroundColor Green

# 1. Versionsprüfung
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$currentVersion = $packageJson.version
Write-Host "📦 Aktuelle Version: $currentVersion" -ForegroundColor Cyan

# 2. Dependencies prüfen
Write-Host "`n🔍 Prüfe Dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️ Node modules fehlen, installiere..." -ForegroundColor Yellow
    npm install
}

# 3. Build erstellen
Write-Host "`n🏗️ Erstelle Production Build..." -ForegroundColor Yellow
npm run build:electron

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build fehlgeschlagen!" -ForegroundColor Red
    exit 1
}

# 4. Installer erstellen
Write-Host "`n📦 Erstelle Installer..." -ForegroundColor Yellow
npm run make:installer

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Installer-Erstellung fehlgeschlagen!" -ForegroundColor Red
    exit 1
}

# 5. Installer ins Release-Verzeichnis kopieren
Write-Host "`n📁 Kopiere Installer..." -ForegroundColor Yellow
$installerPath = "out/make/squirrel.windows/x64"
$releaseFile = "releases/GartenMeister-v$currentVersion-Setup.exe"

if (Test-Path "$installerPath/*.exe") {
    $installerFile = Get-ChildItem "$installerPath/*.exe" | Select-Object -First 1
    Copy-Item $installerFile.FullName $releaseFile -Force
    Write-Host "✅ Installer kopiert: $releaseFile" -ForegroundColor Green
    
    # Dateigröße anzeigen
    $fileSize = [math]::Round((Get-Item $releaseFile).Length / 1MB, 2)
    Write-Host "📏 Dateigröße: $fileSize MB" -ForegroundColor Cyan
} else {
    Write-Host "❌ Installer nicht gefunden in $installerPath" -ForegroundColor Red
    exit 1
}

# 6. Portable Version erstellen (optional)
Write-Host "`n📦 Erstelle Portable Version..." -ForegroundColor Yellow
npm run make:portable

if ($LASTEXITCODE -eq 0) {
    $portablePath = "out/GartenMeister-win32-x64"
    $portableZip = "releases/GartenMeister-v$currentVersion-Portable.zip"
    
    if (Test-Path $portablePath) {
        # ZIP erstellen
        Compress-Archive -Path "$portablePath/*" -DestinationPath $portableZip -Force
        Write-Host "✅ Portable Version: $portableZip" -ForegroundColor Green
        
        $zipSize = [math]::Round((Get-Item $portableZip).Length / 1MB, 2)
        Write-Host "📏 ZIP-Größe: $zipSize MB" -ForegroundColor Cyan
    }
}

# 7. Zusammenfassung
Write-Host "`n🎉 Deployment abgeschlossen!" -ForegroundColor Green
Write-Host "📂 Release-Dateien:" -ForegroundColor Cyan

Get-ChildItem "releases/" | ForEach-Object {
    $size = [math]::Round($_.Length / 1MB, 2)
    Write-Host "   📄 $($_.Name) ($size MB)" -ForegroundColor White
}

# 8. Installation-Test (optional)
$testInstall = Read-Host "`n🧪 Installation auf Test-Rechner kopieren? (j/n)"
if ($testInstall -eq 'j' -or $testInstall -eq 'y') {
    $targetPath = Read-Host "Ziel-Pfad eingeben (z.B. \\test-pc\shared oder D:\temp)"
    
    if (Test-Path $targetPath) {
        Copy-Item $releaseFile $targetPath -Force
        Write-Host "✅ Installer kopiert nach: $targetPath" -ForegroundColor Green
        Write-Host "💡 Auf Ziel-Rechner: Doppelklick auf $(Split-Path $releaseFile -Leaf)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Ziel-Pfad nicht erreichbar: $targetPath" -ForegroundColor Red
    }
}

# 9. Update-Informationen
Write-Host "`n📋 Update-Informationen:" -ForegroundColor Cyan
Write-Host "   🔢 Version: $currentVersion" -ForegroundColor White
Write-Host "   📅 Build-Zeit: $(Get-Date)" -ForegroundColor White
Write-Host "   💻 Build-System: $env:COMPUTERNAME" -ForegroundColor White
Write-Host "   👤 Build-User: $env:USERNAME" -ForegroundColor White

# 10. Nächste Schritte
Write-Host "`n📌 Nächste Schritte:" -ForegroundColor Yellow
Write-Host "   1. Installer auf Ziel-Rechner testen" -ForegroundColor White
Write-Host "   2. Update-System testen (nach erster Installation)" -ForegroundColor White
Write-Host "   3. Bei Problemen: Logs in AppData\Roaming\GartenMeister\logs\" -ForegroundColor White
Write-Host "   4. Nächste Version: package.json Version erhöhen" -ForegroundColor White

Write-Host "`n🎯 Fertig! GartenMeister v$currentVersion ist bereit." -ForegroundColor Green
