# Asset-Pfad-Korrektur-Skript für Electron Build
# Korrigiert relative Pfade in HTML/JS/CSS Dateien

Write-Host "🔧 Asset-Pfad-Korrektur wird gestartet..." -ForegroundColor Green

$outDir = "out"

if (-not (Test-Path $outDir)) {
    Write-Host "❌ $outDir Verzeichnis nicht gefunden!" -ForegroundColor Red
    exit 1
}

# Funktion zum Berechnen der relativen Pfadtiefe
function Get-RelativePrefix {
    param($FilePath, $OutDir)
    
    $relativePath = $FilePath.Substring($OutDir.Length + 1)
    $depth = ($relativePath -split [regex]::Escape([IO.Path]::DirectorySeparatorChar)).Length - 1
    
    if ($depth -eq 0) {
        return "./"
    } else {
        return ("../" * $depth)
    }
}

# Funktion zum Korrigieren von Pfaden in Dateien
function Repair-AssetPaths {
    param($FilePath, $FileType)
    
    $content = Get-Content $FilePath -Raw -Encoding UTF8
    $originalContent = $content
    
    # Berechne den korrekten relativen Pfad
    $relativePrefix = Get-RelativePrefix $FilePath (Resolve-Path $outDir).Path
    
    # HTML-spezifische Korrekturen
    if ($FileType -eq "html") {
        # href="/_next" → href="../_next" (je nach Tiefe)
        $content = $content -replace 'href="/_next', "href=`"$relativePrefix`_next"
        # src="/_next" → src="../_next" (je nach Tiefe)  
        $content = $content -replace 'src="/_next', "src=`"$relativePrefix`_next"
        # "/_next/" → "../_next/" (je nach Tiefe)
        $content = $content -replace '"/_next/', "`"$relativePrefix`_next/"
        
        # Weitere Asset-Korrekturen für verschachtelte Pfade
        $content = $content -replace "'/_next/", "'$relativePrefix`_next/"
    }
    
    # JavaScript-spezifische Korrekturen
    if ($FileType -eq "js") {
        # "/_next/" → "../_next/" (je nach Tiefe)
        $content = $content -replace '"/_next/', "`"$relativePrefix`_next/"
        # '/_next/' → '../_next/' (je nach Tiefe)
        $content = $content -replace "'/_next/", "'$relativePrefix`_next/"
        # /_next/ (ohne Anführungszeichen) - vorsichtiger
        $content = $content -replace '([^a-zA-Z0-9])/_next/', "`$1$relativePrefix`_next/"
        
        # Spezifische Korrekturen für doppelte _next Pfade
        $content = $content -replace '_next/_next/', '_next/'
        $content = $content -replace '\.\./_next/\.\./\.\./_next/', '../_next/'
    }
    
    # CSS-spezifische Korrekturen
    if ($FileType -eq "css") {
        # url(/_next/) → url(../_next/) (je nach Tiefe)
        $content = $content -replace 'url\(/_next/', "url($relativePrefix`_next/"
        # "/_next/" → "../_next/" (je nach Tiefe)
        $content = $content -replace '"/_next/', "`"$relativePrefix`_next/"
    }
    
    # Clean up: Entferne doppelte Pfad-Segmente
    $content = $content -replace '(_next/)+', '_next/'
    $content = $content -replace '(\.\./)+(\.\./)+(\.\./_next/)', '../_next/'
    
    if ($content -ne $originalContent) {
        Set-Content $FilePath -Value $content -Encoding UTF8 -NoNewline
        Write-Host "✅ Korrigiert: $FilePath (Tiefe: $depth, Prefix: $relativePrefix)" -ForegroundColor Yellow
        return $true
    }
    
    return $false
}

# Zähler für korrigierte Dateien
$correctedFiles = 0

# HTML-Dateien korrigieren
Write-Host "📄 Korrigiere HTML-Dateien..." -ForegroundColor Cyan
Get-ChildItem -Path $outDir -Filter "*.html" -Recurse | ForEach-Object {
    if (Repair-AssetPaths $_.FullName "html") {
        $correctedFiles++
    }
}

# JavaScript-Dateien korrigieren
Write-Host "📜 Korrigiere JavaScript-Dateien..." -ForegroundColor Cyan
Get-ChildItem -Path $outDir -Filter "*.js" -Recurse | ForEach-Object {
    if (Repair-AssetPaths $_.FullName "js") {
        $correctedFiles++
    }
}

# CSS-Dateien korrigieren
Write-Host "🎨 Korrigiere CSS-Dateien..." -ForegroundColor Cyan
Get-ChildItem -Path $outDir -Filter "*.css" -Recurse | ForEach-Object {
    if (Repair-AssetPaths $_.FullName "css") {
        $correctedFiles++
    }
}

Write-Host "Asset-Pfad-Korrektur abgeschlossen!" -ForegroundColor Green
Write-Host "$correctedFiles Dateien wurden korrigiert." -ForegroundColor Green
