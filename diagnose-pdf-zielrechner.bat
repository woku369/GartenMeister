@echo off
echo ===========================================
echo GartenMeister PDF-Export Diagnose
echo ===========================================
echo.

echo [1] System-Informationen:
echo Windows Version: %OS%
echo Aktueller Pfad: %CD%
echo Prozess-Architektur: %PROCESSOR_ARCHITECTURE%
echo.

echo [2] Teste Node.js in Electron-App...
if exist "diagnose-pdf-portable.js" (
    echo Führe detaillierte Diagnose aus...
    node diagnose-pdf-portable.js
) else (
    echo ❌ Diagnose-Script nicht gefunden
)

echo.
echo [3] Prüfe PDF-Export-Verzeichnis...
if exist "export" (
    echo ✅ Export-Verzeichnis existiert
    dir export /b
) else (
    echo ℹ️ Export-Verzeichnis wird beim ersten PDF-Export erstellt
)

echo.
echo [4] Teste Electron-Pfade...
echo RESOURCES_PATH: %~dp0resources
echo APP_ASAR_PATH: %~dp0resources\app.asar
echo ASAR_UNPACKED: %~dp0resources\app.asar.unpacked

if exist "%~dp0resources\app.asar.unpacked\src" (
    echo ✅ ASAR-Unpacked src Verzeichnis gefunden
    dir "%~dp0resources\app.asar.unpacked\src" /b | findstr pdf
) else (
    echo ❌ ASAR-Unpacked src Verzeichnis nicht gefunden
)

echo.
echo ===========================================
echo Diagnose abgeschlossen
echo ===========================================
echo.
echo LÖSUNGSSCHRITTE bei PDF-Export Problemen:
echo.
echo 1. Stelle sicher, dass die App als Administrator läuft
echo 2. Deaktiviere Windows Defender temporär für Tests
echo 3. Prüfe, ob alle Abhängigkeiten korrekt gepackt wurden
echo 4. Verwende die HTML-Export Fallback-Option
echo.
pause
