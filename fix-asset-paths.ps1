# Portable EXE Asset-Pfad Korrektur
# Ersetzt absolute /_next/... Pfade mit relativen ./_next/... Pfaden

Write-Host "🔧 Korrigiere Asset-Pfade für Electron-Kompatibilität..." -ForegroundColor Yellow

$outDir = "out"
if (-not (Test-Path $outDir)) {
    Write-Host "❌ out/ Verzeichnis nicht gefunden!" -ForegroundColor Red
    exit 1
}

# Alle HTML-Dateien finden
$htmlFiles = Get-ChildItem -Path $outDir -Recurse -Filter "*.html"

foreach ($file in $htmlFiles) {
    Write-Host "📝 Bearbeite: $($file.FullName)" -ForegroundColor Cyan
    
    # Datei-Inhalt lesen
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Absolute Pfade zu relativen ändern
    $content = $content -replace '="/_next/', '="./_next/'
    $content = $content -replace "='/_next/", "='./_next/"
    $content = $content -replace 'src="/_next/', 'src="./_next/'
    $content = $content -replace "src='/_next/", "src='./_next/"
    $content = $content -replace 'href="/_next/', 'href="./_next/'
    $content = $content -replace "href='/_next/", "href='./_next/"
    
    # Auch in JSON/JavaScript-Strings
    $content = $content -replace '"/_next/', '"./_next/'
    $content = $content -replace "'/_next/", "'./_next/"
    
    # Zurückschreiben
    Set-Content $file.FullName -Value $content -Encoding UTF8
}

Write-Host "✅ Asset-Pfad-Korrektur abgeschlossen!" -ForegroundColor Green
Write-Host "🎯 Alle /_next/ Pfade wurden zu ./_next/ korrigiert" -ForegroundColor Green

Write-Host "✅ Asset-Pfad-Korrektur abgeschlossen!" -ForegroundColor Green
Write-Host "🎯 Alle /_next/ Pfade wurden zu ./_next/ korrigiert" -ForegroundColor Green
