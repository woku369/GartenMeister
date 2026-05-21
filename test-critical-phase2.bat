@echo off
echo.
echo ========================================
echo KRITISCHER TEST: Next.js vs Demo-HTML
echo ========================================
echo.
echo ANLEITUNG:
echo 1. Die portable EXE sollte automatisch starten
echo 2. Wenn sie nicht startet, manuell ausführen:
echo    ^> dist-portable\GartenMeister-Portable-1.0.0-Portable.exe
echo.
echo CHECKPOINTS:
echo [✓] App startet ohne Fehler
echo [✓] NEXT.JS UI wird geladen (NICHT demo-html)
echo [✓] Sidebar mit Menüpunkten sichtbar
echo [✓] CSS/Styling korrekt geladen
echo [✓] "Lade Gartenübersicht..." Spinner sichtbar
echo.
echo KRITISCHER TEST:
echo - Wenn DEMO-HTML geladen wird: PHASE 2 FAILED
echo - Wenn NEXT.JS UI geladen wird: PHASE 2 SUCCESS → PHASE 3
echo.
echo Drücke ENTER um die EXE zu starten...
pause >nul
echo.
echo Starting portable EXE...
start "" "dist-portable\GartenMeister-Portable-1.0.0-Portable.exe"
echo.
echo EXE gestartet! Prüfe das Fenster...
echo.
echo NACH DEM TEST:
echo - Bei ERFOLG: Weiter mit Phase 3 (Feature-für-Feature Parität)
echo - Bei PROBLEMEN: Asset-Pfade/Electron Integration debugging
echo.
pause
