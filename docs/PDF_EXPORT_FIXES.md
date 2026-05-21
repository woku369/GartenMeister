# PDF-Export Fehlerbehebung

## Problem
Der PDF-Export in GartenMeisterStudio schlug fehl mit dem Fehler:
`TypeError: Cannot read properties of undefined (reading 'vfs')` beim Zugriff auf `pdfFonts.pdfMake.vfs`

## Ursache
Die Implementierung des PDF-Exports versuchte auf die VFS (Virtual File System) für Schriftarten über `pdfFonts.pdfMake.vfs` zuzugreifen, aber diese Struktur war nicht verfügbar oder undefiniert.

## Lösung
Die Lösung umfasst mehrere Verbesserungen:

1. **Robuste Font-Initialisierung**:
   ```javascript
   try {
     const pdfFonts = require('pdfmake/build/vfs_fonts');
     
     if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
       pdfMake.vfs = pdfFonts.pdfMake.vfs;
     } else if (pdfFonts && pdfFonts.vfs) {
       pdfMake.vfs = pdfFonts.vfs;
     } else {
       throw new Error('VFS nicht gefunden');
     }
   } catch (fontError) {
     console.warn('Fehler beim Laden der Fonts:', fontError);
     pdfMake.vfs = {}; 
   }
   ```

2. **Fallback für Schriften**:
   Falls keine eingebetteten Schriften geladen werden können, wird eine eigene Font-Definition mit Standard-PDF-Schriften erstellt:
   ```javascript
   docDefinition.fonts = {
     Roboto: {
       normal: 'Helvetica',
       bold: 'Helvetica-Bold',
       italics: 'Helvetica-Oblique',
       bolditalics: 'Helvetica-BoldOblique'
     }
   };
   
   docDefinition.defaultStyle.font = 'Roboto';
   ```

3. **Umfassende Fehlerbehandlung**:
   Jeder Schritt im PDF-Erstellungsprozess wird mit try/catch-Blöcken abgesichert, um robuste Fehlerbehandlung zu gewährleisten.

## Ergebnis
Der PDF-Export funktioniert jetzt zuverlässig, auch wenn keine eingebetteten Schriften geladen werden können. In diesem Fall werden Standard-PDF-Schriften (Helvetica) verwendet, um ein ansprechendes PDF zu erzeugen.

## Implementierung
Die Änderungen wurden in der `export-pdf` Handler-Funktion in `src/index.js` implementiert.

## Update: 09. Juni 2025
Der Fix wurde getestet und funktioniert wie erwartet. PDFs werden erfolgreich im AppData-Ordner unter dem Pfad `%APPDATA%\GartenMeister\exports\` gespeichert.

## Update: 09. Juni 2025 (Gartenübersicht PDF-Export-Fix)
Die Gartenübersicht-PDF-Exportfunktion wurde weiter verbessert. Diese Änderungen lösen das Problem, dass keine PDFs mit "garden-overview" im Namen generiert wurden.

### Behobene Probleme:

1. **Visualisierungserfassung**: Die HTML2Canvas-Erfassung wurde überarbeitet, um genau den richtigen Teil des Visualisierungselements zu erfassen:
   ```javascript
   // Vor dem Fix: Erfasst das gesamte Element inkl. Header-Bereich
   const visualizationElement = document.getElementById('garden-visualization-card');
   
   // Nach dem Fix: Erfasst nur den Content-Bereich ohne Header
   const visualizationElement = document.querySelector('#garden-visualization-card .p-4');
   ```

2. **Temporäre Style-Anpassungen**: Während der Erfassung werden nun temporäre Styles hinzugefügt, um Header und Buttons auszublenden:
   ```javascript
   const printStyles = document.createElement('style');
   printStyles.innerHTML = `
     .print\\:hidden { display: none !important; }
     #garden-visualization-card { background-color: white; }
   `;
   document.head.appendChild(printStyles);
   
   // Nach der Erfassung wieder entfernen
   document.head.removeChild(printStyles);
   ```

3. **Explizite Dateinamen**: Der Dateiname wird nun explizit festgelegt:
   ```javascript
   const result = await exportToPDF({
     // ...
     title: "Gartenplan - Übersicht",
     filename: "gartenmeister-gartenplan"
   });
   ```

4. **Verbessertes Error-Handling**: Vollständige Fehlerbehandlung und detailliertes Logging für bessere Fehlerdiagnose:
   ```javascript
   console.log("PDF-Export vorbereitet mit:");
   console.log("- Anzahl Beete:", bedsForExport.length);
   console.log("- Anzahl Versuchsbeete:", versuchsbeete.length);
   console.log("- Visualisierung vorhanden:", !!visualization);
   ```

5. **Verbesserte Behandlung des Export-Verzeichnisses**: Automatische Erstellung des Exportordners, falls dieser nicht existiert:
   ```javascript
   const exportDir = path.dirname(filePath);
   if (!fs.existsSync(exportDir)) {
     fs.mkdirSync(exportDir, { recursive: true });
     console.log(`Exportverzeichnis erstellt: ${exportDir}`);
   }
   ```

## Export der Gartenübersicht
Die PDF-Export-Funktionalität wurde um eine neue Exportoption für die grafische Gartenübersicht erweitert. Diese Funktion ermöglicht es, die visuelle Darstellung der Beete zusammen mit detaillierten Informationen zu exportieren:

1. **Visualisierung der Gartenanlage**:
   - Beete werden maßstabsgetreu dargestellt
   - Farbkodierung entsprechend den Kräutersorten
   - Versuchsbeete mit Segmentierung

2. **Detaillierte Daten**:
   - Legende mit den verwendeten Kräutersorten und Farbzuordnungen
   - Tabelle mit Beetdetails (Nummer, Typ, Bepflanzung, Maße)
   - Versuchsbeete mit Segmentinformationen
   
3. **Technische Implementierung**:
   - HTML-zu-Canvas-Konvertierung mit `html2canvas`
   - Base64-Bilddaten werden an den PDF-Generator übergeben
   - Responsive Layout mit automatischer Anpassung an die Beetgrößen
   - Strukturierte Tabellenansicht für Beetdetails
   - Spezielle Darstellung für Versuchsbeete mit Segmentübersicht

Die Funktion wurde in der Garden-Export-PDF-Button-Komponente implementiert und ist nahtlos in die Gartenübersichtsseite integriert. Eine ausführliche Dokumentation ist in [GARTENEXPORT_PDF.md](./GARTENEXPORT_PDF.md) zu finden.
