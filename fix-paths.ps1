# Asset-Pfad-Fix für Electron static export
Write-Host "🔧 Fixing asset paths for Electron..."

# Finde alle HTML-Dateien im out/ Verzeichnis
$htmlFiles = Get-ChildItem -Path "out" -Recurse -Filter "*.html"

foreach ($file in $htmlFiles) {
    Write-Host "Processing: $($file.Name)"
    
    # Lese Datei-Inhalt
    $content = Get-Content $file.FullName -Raw
    
    # Ersetze absolute Pfade mit relativen
    $content = $content -replace '/_next/', '_next/'
    $content = $content -replace '/favicon.ico', 'favicon.ico'
    
    # Schreibe zurück
    Set-Content -Path $file.FullName -Value $content -NoNewline
}

Write-Host "✅ Asset paths fixed!"
