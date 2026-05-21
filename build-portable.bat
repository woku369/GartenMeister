@echo off
echo ========================================
echo    GartenMeister Portable Build
echo ========================================
echo.

REM 1. Stoppe laufende Prozesse
echo Stoppe laufende Prozesse...
taskkill /f /im "electron.exe" 2>nul
taskkill /f /im "node.exe" 2>nul

REM 2. Warte kurz
timeout /t 3 /nobreak

REM 3. Baue Next.js
echo.
echo 📦 Building Next.js...
call npm run build

if errorlevel 1 (
    echo ❌ Next.js Build fehlgeschlagen!
    pause
    exit /b 1
)

REM 4. Erstelle Electron Package
echo.
echo ⚡ Creating Electron Package...
echo Das kann 5-10 Minuten dauern...
call npm run package

if errorlevel 1 (
    echo ❌ Electron Package fehlgeschlagen!
    pause
    exit /b 1
)

echo.
echo ✅ BUILD ERFOLGREICH!
echo.
echo 📁 Portable App in: out\
dir out\

echo.
echo 🎯 Zum Testen auf anderen Geräten:
echo 1. Kompletten "out" Ordner kopieren
echo 2. GartenMeister.exe auf Zielgerät ausführen
echo.
pause
