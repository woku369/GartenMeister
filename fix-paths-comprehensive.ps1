Write-Host "Umfassende Pfad-Korrektur für alle HTML-Dateien..."

# Hole alle HTML-Dateien
$htmlFiles = Get-ChildItem -Path "out" -Name "*.html" -Recurse

foreach ($htmlFile in $htmlFiles) {
    $fullPath = Join-Path "out" $htmlFile
    Write-Host "Bearbeite: $fullPath"
    
    # Berechne Verzeichnistiefe relativ zu 'out'
    $relativePath = $htmlFile
    $depth = ($relativePath.Split([IO.Path]::DirectorySeparatorChar) | Where-Object { $_ -ne "" }).Length - 1
    
    # Bestimme korrekten Pfad basierend auf Tiefe
    if ($depth -eq 0) {
        $nextPath = "./_next/"
    } else {
        $nextPath = ("../" * $depth) + "_next/"
    }
    
    Write-Host "  Tiefe: $depth, Next-Pfad: $nextPath"
    
    # Lese Datei-Inhalt
    $content = Get-Content $fullPath -Raw -Encoding UTF8
    
    # Korrigiere verschiedene Pfad-Probleme
    $content = $content -replace '\.\/_next\/', $nextPath
    $content = $content -replace '\"static/chunks/', ('"' + $nextPath + 'static/chunks/')
    $content = $content -replace '\"static/css/', ('"' + $nextPath + 'static/css/')
    $content = $content -replace '\\\\"static/chunks/', ('\\\"' + $nextPath + 'static/chunks/')
    $content = $content -replace '\\\\"static/css/', ('\\\"' + $nextPath + 'static/css/')
    
    # Schreibe korrigierten Inhalt zurück
    $content | Set-Content $fullPath -Encoding UTF8
}

Write-Host "Umfassende Pfad-Korrektur abgeschlossen!"
