@echo off
echo ===========================================
echo Schneller PDF-Fix Test
echo ===========================================

echo [1] Teste PDF-Module...
node diagnose-pdf-portable.js

echo.
echo [2] Teste aktuellen Build...
if exist "dist-portable" (
    echo ✅ Portable Build gefunden
    for /r "dist-portable" %%f in (*.exe) do (
        echo Portable App: %%f
    )
) else (
    echo ❌ Kein Portable Build gefunden
    echo Führe vollständigen Build aus mit: fix-pdf-portable.bat
)

echo.
echo [3] Prüfe PDF-Generator Konfiguration...
type electron-builder-portable-only.config.js | findstr "simple-pdf"

pause
