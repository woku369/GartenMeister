@echo off
echo ===========================================
echo Test der neuen Portable Version
echo ===========================================
echo.

echo [1] Suche nach erstellter Portable App...
if exist "dist-portable\*.exe" (
    for %%f in (dist-portable\*.exe) do (
        echo ✅ Portable App gefunden: %%f
        set "PORTABLE_APP=%%f"
    )
) else (
    echo ❌ Keine Portable App gefunden
    echo Führe zuerst den Build aus: fix-pdf-portable.bat
    pause
    exit /b 1
)

echo.
echo [2] Prüfe Größe der Portable App...
for %%f in (dist-portable\*.exe) do (
    echo Dateigröße: %%~zf Bytes
)

echo.
echo [3] Teste Export-Verzeichnis-Strategien...
echo Die App sollte Export-Verzeichnisse in folgender Reihenfolge versuchen:
echo   1. App-lokales Verzeichnis (neben der .exe)
echo   2. Dokumente/GartenMeister/export
echo   3. Temp-Verzeichnis/GartenMeister-Export

echo.
echo [4] Kopiere Diagnose-Tools in App-Verzeichnis...
if exist "dist-portable\" (
    copy "diagnose-pdf-portable.js" "dist-portable\" >nul 2>&1
    copy "diagnose-pdf-zielrechner.bat" "dist-portable\" >nul 2>&1
    copy "PDF_EXPORT_FIX_ANLEITUNG.md" "dist-portable\" >nul 2>&1
    echo ✅ Diagnose-Tools kopiert
)

echo.
echo [5] Starte Portable App zum Testen...
set /p choice="Möchten Sie die App jetzt starten? (J/N): "
if /i "%choice%"=="J" (
    echo Starte Portable App...
    echo.
    echo WICHTIG: Teste den PDF-Export der Gartenübersicht!
    echo.
    start "" "%PORTABLE_APP%"
    
    echo.
    echo Überwache die Konsole auf Fehlermeldungen...
    echo Nach dem Test:
    echo 1. Prüfe ob Export-Verzeichnis erstellt wurde
    echo 2. Teste PDF-Export der Gartenübersicht
    echo 3. Kopiere die App auf den Zielrechner zum finalen Test
)

echo.
echo ===========================================
echo Test-Setup abgeschlossen
echo ===========================================
pause
