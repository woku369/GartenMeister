Write-Host "Korrigiere Asset-Pfade für alle Verzeichnisse..." -ForegroundColor Yellow

$outDir = "out"
$htmlFiles = Get-ChildItem -Path $outDir -Recurse -Filter "*.html"

foreach ($file in $htmlFiles) {
    Write-Host "Bearbeite HTML: $($file.FullName)" -ForegroundColor Cyan
    
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Berechne die Verzeichnistiefe relativ zum out-Verzeichnis
    $relativePath = $file.FullName.Replace((Get-Item $outDir).FullName, "").TrimStart('\', '/')
    $pathParts = $relativePath -split '[\\\/]' | Where-Object { $_ -ne "" }
    $directoryDepth = ($pathParts | Measure-Object).Count - 1  # -1 weil die Datei selbst nicht zählt
    
    # Bestimme den korrekten relativen Pfad zu _next
    if ($directoryDepth -eq 0) {
        # Root-Verzeichnis: ./_next/
        $nextPath = "./_next/"
    } else {
        # Unterverzeichnis: ../_next/, ../../_next/, etc.
        $nextPath = ("../" * $directoryDepth) + "_next/"
    }
    
    Write-Host "  Verzeichnistiefe: $directoryDepth, Next-Pfad: $nextPath" -ForegroundColor Gray
    
    # Korrigiere alle _next Pfade
    $content = $content -replace 'href="\./(_next/[^"]+)"', "href=""$nextPath`$1"""
    $content = $content -replace 'src="\./(_next/[^"]+)"', "src=""$nextPath`$1"""
    $content = $content -replace '"\./_next/', """$nextPath"""
    
    Set-Content $file.FullName -Value $content -Encoding UTF8
}

# CSS-Dateien korrigieren (Font-Pfade)
$cssFiles = Get-ChildItem -Path $outDir -Recurse -Filter "*.css"
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
    $fontFiles = Get-ChildItem -Path $mediaDir -Filter "*.ttf", "*.woff", "*.woff2", "*.otf" -Recurse
    foreach ($fontFile in $fontFiles) {
        $targetPath = Join-Path $fontsDir $fontFile.Name
        Copy-Item $fontFile.FullName $targetPath -Force
        Write-Host "Font kopiert: $($fontFile.Name)" -ForegroundColor Green
    }
}

Write-Host "Asset-Pfad-Korrektur für alle Verzeichnisse abgeschlossen!" -ForegroundColor Green
