@echo off
echo ===========================================
echo PDF Export Fix für Portable Version
echo ===========================================
echo.

echo [1] Reinige Build-Verzeichnisse...
if exist "dist-portable" rmdir /s /q "dist-portable"
if exist "out" rmdir /s /q "out"

echo [2] Prüfe Node.js Module...
call npm list puppeteer >nul 2>&1
if errorlevel 1 (
    echo [WARNUNG] Puppeteer nicht installiert, installiere...
    call npm install puppeteer
)

echo [3] Baue Next.js Export...
call npm run build
if errorlevel 1 (
    echo [FEHLER] Next.js Build fehlgeschlagen!
    pause
    exit /b 1
)

echo [4] Teste PDF-Generator-Module...
node test-pdf-module.js
if errorlevel 1 (
    echo [FEHLER] PDF-Generator-Test fehlgeschlagen!
    pause
    exit /b 1
)

echo [5] Baue Portable Version...
call npx electron-builder --config electron-builder-portable-only.config.js --win portable
if errorlevel 1 (
    echo [FEHLER] Portable Build fehlgeschlagen!
    pause
    exit /b 1
)

echo [6] Finde und starte Portable App...
for /r "dist-portable" %%f in (*.exe) do (
    echo ✅ Portable App erstellt: %%f
    echo.
    echo Möchten Sie die App jetzt testen? (J/N)
    set /p choice=
    if /i "!choice!"=="J" (
        echo Starte App zum Testen...
        start "" "%%f"
    )
    goto :found
)

:found
echo.
echo ===========================================
echo PDF Export Fix abgeschlossen!
echo ===========================================
echo.
echo Nächste Schritte:
echo 1. Portable App auf Zielrechner kopieren
echo 2. PDF-Export der Gartenübersicht testen
echo 3. Konsole-Output auf Fehler prüfen
echo.
pause
