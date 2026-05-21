const puppeteer = require('puppeteer');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// React-Komponenten dynamisch laden
let PDFGardenLayout;
try {
  // Verwende require.resolve um den Pfad zu finden
  const componentPath = path.join(__dirname, 'components', 'pdf', 'pdf-garden-layout');
  PDFGardenLayout = require(componentPath).PDFGardenLayout;
} catch (error) {
  console.error('Fehler beim Laden der PDF-Komponenten:', error);
  // Fallback auf einfache HTML-Generierung
  PDFGardenLayout = null;
}

class AdvancedPdfGenerator {
    static async generateGardenPdf(data, outputPath) {
        let browser;
        
        try {
            console.log('Starte PDF-Generierung...');            // Puppeteer Browser starten
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-first-run',
                    '--disable-default-apps',
                    '--disable-extensions'
                ]
            });

            const page = await browser.newPage();
            
            // Viewport für A4 Querformat setzen
            await page.setViewport({
                width: 1684,  // ~297mm bei 144dpi
                height: 1190, // ~210mm bei 144dpi
                deviceScaleFactor: 2 // Für bessere Qualität
            });            console.log('Generiere HTML mit React...');
            
            let htmlContent;
              if (PDFGardenLayout) {
                // React-Komponente zu HTML rendern
                try {
                    const reactElement = React.createElement(PDFGardenLayout, {
                        beds: data.beds || [],
                        segments: data.segments || [],
                        herbVarieties: data.herbVarieties || [],
                        title: 'Gartenübersicht'
                    });
                    
                    htmlContent = renderToStaticMarkup(reactElement);
                    console.log('React-Komponente erfolgreich gerendert');
                } catch (reactError) {
                    console.warn('React-Rendering fehlgeschlagen, verwende Fallback:', reactError);
                    htmlContent = this.generateFallbackHTML(data);
                }
            } else {
                // Fallback auf einfache HTML-Generierung
                console.log('Verwende Fallback-HTML-Generierung');
                htmlContent = this.generateFallbackHTML(data);
            }
            
            // Vollständiges HTML-Dokument erstellen
            const fullHtml = `
                <!DOCTYPE html>
                <html lang="de">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Gartenübersicht</title>
                    <style>
                        @page {
                            size: A4 landscape;
                            margin: 15mm;
                        }
                        
                        * {
                            box-sizing: border-box;
                        }
                        
                        body {
                            margin: 0;
                            padding: 0;
                            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            background: white;
                            color: #1a1a1a;
                            font-size: 12px;
                            line-height: 1.4;
                        }
                        
                        @media print {
                            .page-break {
                                page-break-before: always;
                            }
                            
                            .no-break {
                                page-break-inside: avoid;
                            }
                        }
                        
                        .container {
                            width: 100%;
                            max-width: none;
                        }
                    </style>
                </head>
                <body>
                    ${htmlContent}
                </body>
                </html>
            `;

            console.log('Lade HTML in Puppeteer...');            // HTML in Puppeteer laden mit optimierten Einstellungen
            await page.setContent(fullHtml, { 
                waitUntil: ['load', 'domcontentloaded'],
                timeout: 15000 
            });

            // Reduzierte Wartezeit für vollständiges Rendering
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log('Generiere PDF...');
            
            // PDF generieren
            const pdfBuffer = await page.pdf({
                path: outputPath,
                format: 'A4',
                landscape: true,
                margin: {
                    top: '15mm',
                    right: '15mm',
                    bottom: '15mm',
                    left: '15mm'
                },
                printBackground: true,
                preferCSSPageSize: true,
                quality: 100
            });

            console.log(`PDF erfolgreich generiert: ${outputPath}`);
            
            return {
                success: true,
                message: 'PDF wurde erfolgreich erstellt',
                path: outputPath,
                size: pdfBuffer.length
            };

        } catch (error) {
            console.error('Fehler bei PDF-Generierung:', error);
            
            return {
                success: false,
                message: `Fehler bei der PDF-Erstellung: ${error.message}`,
                error: error.stack
            };

        } finally {
            if (browser) {
                try {
                    await browser.close();
                } catch (closeError) {
                    console.error('Fehler beim Schließen des Browsers:', closeError);
                }
            }
        }
    }

    /**
     * Hilfsfunktion für Debugging - speichert HTML-Datei
     */
    static async generateDebugHtml(data, outputPath) {
        try {
            const reactElement = React.createElement(PDFGardenLayout, {
                beds: data.beds || [],
                segments: data.segments || [],
                herbVarieties: data.herbVarieties || [],
                title: 'Gartenübersicht (Debug)'
            });
            
            const htmlContent = renderToStaticMarkup(reactElement);
            
            const fullHtml = `
                <!DOCTYPE html>
                <html lang="de">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Gartenübersicht - Debug</title>
                    <style>
                        body {
                            font-family: system-ui, sans-serif;
                            margin: 20px;
                            background: white;
                            color: #1a1a1a;
                        }
                    </style>
                </head>
                <body>
                    ${htmlContent}
                </body>
                </html>
            `;

            await fs.promises.writeFile(outputPath, fullHtml, 'utf8');
            
            return {
                success: true,
                message: 'Debug-HTML wurde erstellt',
                path: outputPath
            };

        } catch (error) {
            return {
                success: false,
                message: `Fehler bei Debug-HTML: ${error.message}`
            };
        }
    }    /**
     * Generiert einfaches HTML als Fallback ohne React
     */
    static generateFallbackHTML(data) {
        const currentYear = new Date().getFullYear();
        const exportDate = new Date().toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
        });

        const herbMap = new Map((data.herbVarieties || []).map(h => [h.id, h]));

        let beetsHTML = '';
        if (data.beds && data.beds.length > 0) {
            beetsHTML = data.beds
                .sort((a, b) => (a.bedNumber || 0) - (b.bedNumber || 0))
                .map(bed => {
                    const bedWidth = (bed.width || 1.5) * 32; // 32px pro Meter
                    const herb = herbMap.get(bed.herbVarietyId);
                    const backgroundColor = herb?.color || bed.color || '#f0f0f0';
                    
                    return `
                        <div style="
                            width: ${bedWidth}px;
                            height: 150px;
                            background-color: ${backgroundColor};
                            border: 1px solid #666;
                            border-radius: 4px;
                            position: relative;
                            margin: 3px;
                            display: inline-block;
                            vertical-align: bottom;
                        ">
                            <div style="
                                position: absolute;
                                top: -18px;
                                width: 100%;
                                text-align: center;
                                font-size: 11px;
                                font-weight: 500;
                                color: #666;
                            ">${bed.bedNumber}</div>
                            <div style="
                                padding: 4px;
                                text-align: center;
                                height: 100%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                flex-direction: column;
                            ">
                                <div style="font-size: 9px; font-weight: 500;">
                                    ${herb?.name || bed.type || 'Unbekannt'}
                                </div>
                                ${bed.length ? `<div style="font-size: 8px; color: #666;">${bed.length}m × ${bed.width}m</div>` : ''}
                            </div>
                        </div>
                    `;
                })
                .join('');
        }

        return `
            <div style="padding: 20px; font-family: system-ui, sans-serif;">
                <!-- Header -->
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #D4B851;
                    padding-bottom: 15px;
                ">
                    <h1 style="
                        font-size: 24px;
                        font-weight: 600;
                        color: #1a1a1a;
                        margin: 0;
                    ">Gartenübersicht - Bewirtschaftungsjahr ${currentYear}</h1>
                    <div style="
                        font-size: 14px;
                        color: #666;
                        text-align: right;
                    ">
                        <div>Exportiert am</div>
                        <div style="font-weight: 500;">${exportDate}</div>
                    </div>
                </div>

                <!-- Visualisierung -->
                <div style="margin-bottom: 30px;">
                    <h2 style="
                        font-size: 18px;
                        font-weight: 500;
                        margin-bottom: 15px;
                        color: #1a1a1a;
                    ">Beetvisualisierung</h2>
                    
                    <div style="
                        background-color: #f8f9fa;
                        border-radius: 8px;
                        padding: 20px;
                    ">
                        <div style="
                            min-height: 170px;
                            padding: 12px;
                            background-color: white;
                            border-radius: 6px;
                            text-align: left;
                        ">
                            ${beetsHTML}
                        </div>
                    </div>
                </div>

                <!-- Zusammenfassung -->
                <div style="
                    margin-top: 30px;
                    padding: 15px;
                    background-color: #f8f9fa;
                    border-radius: 6px;
                    font-size: 12px;
                ">
                    <h3 style="font-size: 14px; margin-bottom: 10px; color: #1a1a1a;">
                        Zusammenfassung
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                        <div><strong>Anzahl Beete:</strong> ${data.beds?.length || 0}</div>
                        <div><strong>Kräutersorten:</strong> ${data.herbVarieties?.length || 0}</div>
                        <div><strong>Versuchssegmente:</strong> ${data.segments?.length || 0}</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Validiert die Eingabedaten
     */
    static validateData(data) {
        const errors = [];

        if (!data) {
            errors.push('Keine Daten bereitgestellt');
            return errors;
        }

        if (!Array.isArray(data.beds)) {
            errors.push('Keine gültigen Beet-Daten');
        }

        if (!Array.isArray(data.herbVarieties)) {
            errors.push('Keine gültigen Kräuter-Daten');
        }

        if (!Array.isArray(data.segments)) {
            errors.push('Keine gültigen Segment-Daten');
        }

        return errors;
    }
}

module.exports = { AdvancedPdfGenerator };
