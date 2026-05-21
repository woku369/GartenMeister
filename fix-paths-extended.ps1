# Erweiterte Asset-Pfad-Korrektur für Electron
Write-Host "🔧 Fixing asset paths in all files..."

# Finde alle HTML und JS-Dateien im out/ Verzeichnis
$allFiles = Get-ChildItem -Path "out" -Recurse -Include "*.html", "*.js"

foreach ($file in $allFiles) {
    Write-Host "Processing: $($file.Name)"
    
    # Lese Datei-Inhalt
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Ersetze absolute Pfade mit relativen
    $content = $content -replace '/_next/', '_next/'
    $content = $content -replace '/favicon.ico', 'favicon.ico'
    
    # Spezielle Behandlung für JavaScript Chunk-Loading
    $content = $content -replace '"/_next/static/', '"_next/static/'
    $content = $content -replace "'/_next/static/", "'_next/static/"
    $content = $content -replace '/_next/static/', '_next/static/'
    
    # Schreibe zurück mit korrektem Encoding
    [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
}

Write-Host "Asset paths fixed in $($allFiles.Count) files!"
