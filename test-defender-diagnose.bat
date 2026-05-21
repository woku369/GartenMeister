@echo off
echo.
echo 🧪 WINDOWS DEFENDER DIAGNOSE - EINFACHER TEST
echo =============================================
echo.

echo 📁 Aktuelles Verzeichnis: %CD%
echo.

echo 🔍 1. Teste Node.js Verfügbarkeit...
node --version 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js nicht gefunden oder nicht im PATH
    echo    Bitte Node.js installieren oder PATH prüfen
    goto :ende
) else (
    echo ✅ Node.js verfügbar
)

echo.
echo 🔍 2. Prüfe package.json...
if not exist "package.json" (
    echo ❌ package.json nicht gefunden
    echo    Bitte ins GartenMeister-Projektverzeichnis wechseln
    goto :ende
) else (
    echo ✅ package.json gefunden - sind im Projektverzeichnis
)

echo.
echo 🔍 3. Führe Diagnose-Skript aus...
if exist "defender-diagnose.js" (
    echo    Starte defender-diagnose.js...
    node defender-diagnose.js
    if %errorlevel% equ 0 (
        echo ✅ Diagnose abgeschlossen
    ) else (
        echo ❌ Diagnose-Fehler (Code: %errorlevel%)
    )
) else (
    echo ❌ defender-diagnose.js nicht gefunden
)

echo.
echo 🔍 4. Prüfe Diagnose-Report...
if exist "defender-diagnose-report.txt" (
    echo ✅ Diagnose-Report erstellt: defender-diagnose-report.txt
    echo.
    echo 📄 Report-Inhalt (letzte 10 Zeilen):
    echo ----------------------------------------
    powershell -Command "Get-Content 'defender-diagnose-report.txt' | Select-Object -Last 10"
    echo ----------------------------------------
) else (
    echo ⚠️  Kein Diagnose-Report gefunden
)

:ende
echo.
echo 🏁 DIAGNOSE-TEST ABGESCHLOSSEN
echo.
echo 📋 NÄCHSTE SCHRITTE:
echo    1. Prüfen Sie den Report in defender-diagnose-report.txt
echo    2. Bei Fehlern: scripts\add-defender-exclusions.bat als Admin ausführen
echo    3. System neustarten nach Defender-Änderungen
echo    4. GartenMeister mit 'npm start' testen
echo.
pause
