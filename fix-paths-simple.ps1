Write-Host "Korrigiere Asset-Pfade..." -ForegroundColor Yellow

$outDir = "out"
$htmlFiles = Get-ChildItem -Path $outDir -Recurse -Filter "*.html"
$cssFiles = Get-ChildItem -Path $outDir -Recurse -Filter "*.css"

# HTML-Dateien korrigieren
foreach ($file in $htmlFiles) {
    Write-Host "Bearbeite HTML: $($file.FullName)" -ForegroundColor Cyan
    
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    $content = $content -replace 'href="/_next/', 'href="./_next/'
    $content = $content -replace 'src="/_next/', 'src="./_next/'
    $content = $content -replace '"/_next/', '"./_next/'
    
    Set-Content $file.FullName -Value $content -Encoding UTF8
}

# CSS-Dateien korrigieren (Font-Pfade)
foreach ($file in $cssFiles) {
    Write-Host "Bearbeite CSS: $($file.FullName)" -ForegroundColor Cyan
    
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Font-Pfade korrigieren - _next/static/media → ./fonts
    $content = $content -replace 'url\(_next/static/media/([^)]+)\)', 'url(./fonts/$1)'
    
    Set-Content $file.FullName -Value $content -Encoding UTF8
}

# Font-Dateien kopieren falls vorhanden
$fontsDir = "$outDir/fonts"
if (-not (Test-Path $fontsDir)) {
    New-Item -ItemType Directory -Path $fontsDir -Force | Out-Null
    Write-Host "Font-Verzeichnis erstellt: $fontsDir" -ForegroundColor Green
}

# Kopiere Font-Dateien von _next/static/media nach fonts
$mediaDir = "$outDir/_next/static/media"
if (Test-Path $mediaDir) {
    $fontFiles = Get-ChildItem -Path $mediaDir -Filter "*.ttf"
    foreach ($fontFile in $fontFiles) {
        Copy-Item $fontFile.FullName "$fontsDir/$($fontFile.Name)" -Force
        Write-Host "Font kopiert: $($fontFile.Name)" -ForegroundColor Green
    }
}

Write-Host "Asset-Pfad-Korrektur abgeschlossen!" -ForegroundColor Green
