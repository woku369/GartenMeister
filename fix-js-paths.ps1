Write-Host "Korrigiere JavaScript-Pfade für Electron..." -ForegroundColor Yellow

$outDir = "out"
$htmlFiles = Get-ChildItem -Path $outDir -Recurse -Filter "*.html"

# Aktuelles Verzeichnis ermitteln
$currentDir = (Get-Location).Path
$outPath = Join-Path $currentDir $outDir

foreach ($file in $htmlFiles) {
    Write-Host "Bearbeite HTML: $($file.FullName)" -ForegroundColor Cyan
    
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Konvertiere alle relativen JavaScript-Pfade zu absoluten file://-URLs
    $content = $content -replace 'src="\./(_next/static/[^"]+)"', "src=""file:///$outPath/`$1"""
    $content = $content -replace 'href="\./(_next/static/[^"]+)"', "href=""file:///$outPath/`$1"""
    
    # Normalisiere Pfad-Separatoren für Windows
    $content = $content -replace 'file:///([A-Za-z]:[^"]*)', { 
        $path = $_.Groups[1].Value -replace '\\', '/'
        "file:///$path"
    }
    
    Set-Content $file.FullName -Value $content -Encoding UTF8
}

Write-Host "JavaScript-Pfad-Korrektur abgeschlossen!" -ForegroundColor Green
