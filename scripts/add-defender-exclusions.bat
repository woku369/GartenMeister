@echo off
:: Einfache Windows Defender-Ausnahmen für GartenMeister
:: Als Administrator ausführen!

echo.
echo === GartenMeister Windows Defender Ausnahmen hinzufügen ===
echo.

:: Prüfe Administrator-Rechte
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Administrator-Rechte erkannt. Fahre fort...
    echo.
) else (
    echo FEHLER: Dieses Skript muss als Administrator ausgeführt werden!
    echo Rechtsklick auf diese Datei und "Als Administrator ausführen" wählen.
    echo.
    pause
    exit /b 1
)

:: Ermittle GartenMeister-Pfade
set "PROJECT_PATH=%~dp0.."
set "EXPORTS_PATH=%USERPROFILE%\Documents\GartenMeister"

echo GartenMeister-Projektordner: %PROJECT_PATH%
echo Export-Ordner: %EXPORTS_PATH%
echo.

:: Erstelle Export-Ordner falls nicht vorhanden
if not exist "%EXPORTS_PATH%" (
    mkdir "%EXPORTS_PATH%"
    echo Export-Ordner erstellt: %EXPORTS_PATH%
)

echo Füge Windows Defender-Ausnahmen hinzu...
echo.

:: Projekt-Ordner als Ausnahme hinzufügen
powershell -Command "Add-MpPreference -ExclusionPath '%PROJECT_PATH%'"
if %errorLevel% == 0 (
    echo ✓ Projektordner hinzugefügt: %PROJECT_PATH%
) else (
    echo ✗ Konnte Projektordner nicht hinzufügen
)

:: Export-Ordner als Ausnahme hinzufügen
powershell -Command "Add-MpPreference -ExclusionPath '%EXPORTS_PATH%'"
if %errorLevel% == 0 (
    echo ✓ Export-Ordner hinzugefügt: %EXPORTS_PATH%
) else (
    echo ✗ Konnte Export-Ordner nicht hinzufügen
)

:: Prozess-Ausnahmen hinzufügen
echo.
echo Füge Prozess-Ausnahmen hinzu...

powershell -Command "Add-MpPreference -ExclusionProcess 'node.exe'"
if %errorLevel% == 0 (
    echo ✓ Prozess-Ausnahme hinzugefügt: node.exe
) else (
    echo ⚠ Warnung: Konnte node.exe nicht hinzufügen
)

powershell -Command "Add-MpPreference -ExclusionProcess 'electron.exe'"
if %errorLevel% == 0 (
    echo ✓ Prozess-Ausnahme hinzugefügt: electron.exe
) else (
    echo ⚠ Warnung: Konnte electron.exe nicht hinzufügen
)

powershell -Command "Add-MpPreference -ExclusionProcess 'GartenMeister.exe'"
if %errorLevel% == 0 (
    echo ✓ Prozess-Ausnahme hinzugefügt: GartenMeister.exe
) else (
    echo ⚠ Warnung: Konnte GartenMeister.exe nicht hinzufügen
)

echo.
echo === ABGESCHLOSSEN ===
echo Windows Defender-Ausnahmen wurden hinzugefügt.
echo Starten Sie GartenMeister neu, damit die Änderungen wirksam werden.
echo.
echo Bei Problemen: Siehe WINDOWS_DEFENDER_LOSUNG.md
echo.
pause
