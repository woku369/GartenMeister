@echo off
echo ========================================
echo PORTABLE EXE TEST - Phase 2 Validation
echo ========================================
echo.
echo Teste die neue portable EXE mit Next.js Static Export...
echo.
echo Starting: GartenMeister-Portable-1.0.0-Portable.exe
echo.
start "" "dist-portable\GartenMeister-Portable-1.0.0-Portable.exe"
echo.
echo EXE gestartet! 
echo.
echo TESTE FOLGENDE PUNKTE:
echo [1] Lädt vollständige GartenMeister UI (nicht Demo-HTML)?
echo [2] Sind alle CSS/Styles korrekt geladen?
echo [3] Funktioniert die Sidebar-Navigation?
echo [4] Ist das Dashboard sichtbar und interaktiv?
echo [5] Reagieren Buttons und Links?
echo.
echo Drücke eine beliebige Taste nach dem Test...
pause
