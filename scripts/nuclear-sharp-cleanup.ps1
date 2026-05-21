# NUCLEAR SHARP CLEANUP - Entfernt ALLE Sharp-bezogenen Pakete
Write-Host "NUCLEAR SHARP CLEANUP - Entfernt ALLE Sharp-Pakete..." -ForegroundColor Red

# Definiere alle möglichen Sharp-Verzeichnisse
$sharpDirs = @(
    "node_modules\@img",
    "node_modules\sharp",
    "node_modules\@emnapi",
    "node_modules\node-addon-api",
    "node_modules\prebuild-install"
)

# Erweiterte Suche nach Sharp-Paketen
$allSharpDirs = Get-ChildItem -Path "node_modules" -Recurse -Directory -ErrorAction SilentlyContinue | 
    Where-Object { 
        $_.Name -like "*sharp*" -or 
        $_.Name -like "*darwin*" -or 
        $_.Name -like "*linux*" -or
        $_.Name -like "*arm64*" -or
        $_.Name -like "*img*" -or
        $_.Name -like "*emnapi*"
    }

Write-Host "Gefundene Sharp-verwandte Verzeichnisse:" -ForegroundColor Yellow
$allSharpDirs | ForEach-Object { Write-Host "  - $($_.FullName)" -ForegroundColor Gray }

# Entferne alle gefundenen Verzeichnisse
$removedCount = 0
foreach ($dir in $allSharpDirs) {
    try {
        Remove-Item -Path $dir.FullName -Recurse -Force -ErrorAction Stop
        Write-Host "Entfernt: $($dir.FullName)" -ForegroundColor Green
        $removedCount++
    } catch {
        Write-Host "Fehler beim Entfernen: $($dir.FullName)" -ForegroundColor Red
    }
}

# Entferne auch vordefinierte Verzeichnisse
foreach ($sharpDir in $sharpDirs) {
    if (Test-Path $sharpDir) {
        try {
            Remove-Item -Path $sharpDir -Recurse -Force -ErrorAction Stop
            Write-Host "Entfernt: $sharpDir" -ForegroundColor Green
            $removedCount++
        } catch {
            Write-Host "Fehler beim Entfernen: $sharpDir" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "NUCLEAR CLEANUP abgeschlossen!" -ForegroundColor Green
Write-Host "Entfernte Verzeichnisse: $removedCount" -ForegroundColor Cyan
Write-Host ""
