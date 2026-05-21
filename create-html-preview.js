// Erstelle ein HTML-Preview der PDF-Visualisierung zum Testen
const fs = require('fs');
const path = require('path');
const { SimplePdfGenerator } = require('./src/simple-pdf-generator-improved.js');

async function createHTMLPreview() {
    try {
        // Lade echte App-Daten
        const dataPath = path.join(require('os').homedir(), 'AppData', 'Roaming', 'GartenMeister', 'data', 'app-data.json');
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const appData = JSON.parse(rawData);
        
        const exportData = {
            beds: appData.beds,
            segments: appData.segments,
            herbVarieties: appData.herbVarieties,
            gartenConfiguration: appData.gartenConfiguration
        };
        
        // Generiere HTML-Content (ohne Electron PDF)
        const htmlContent = SimplePdfGenerator.generateImprovedHTML(exportData);
        const css = SimplePdfGenerator.getCSS();
        
        const fullHtml = `
            <!DOCTYPE html>
            <html lang="de">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>PDF Preview - Gartenübersicht</title>
                <style>
                    ${css}
                </style>
            </head>
            <body>
                ${htmlContent}
            </body>
            </html>
        `;
        
        // Speichere HTML Preview
        const outputPath = path.join(__dirname, 'pdf-preview.html');
        fs.writeFileSync(outputPath, fullHtml, 'utf8');
        
        console.log('✅ HTML Preview erstellt:', outputPath);
        console.log('Öffne in Browser um PDF-Layout zu prüfen...');
        
        // Öffne im Browser
        require('child_process').exec(`start "" "${outputPath}"`);
        
    } catch (error) {
        console.error('Fehler:', error);
    }
}

createHTMLPreview();
