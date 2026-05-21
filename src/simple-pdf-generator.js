const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class SimplePdfGenerator {
    static async generateGardenPdf(data, outputPath) {
        let browser;
        
        try {
            console.log('Starte vereinfachte PDF-Generierung...');
            
            // Puppeteer Browser starten
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ]
            });

            const page = await browser.newPage();
            
            // Viewport für A4 Querformat setzen
            await page.setViewport({
                width: 1200,
                height: 850,
                deviceScaleFactor: 1
            });

            console.log('Generiere vereinfachtes HTML...');
            
            // Einfaches HTML für Test
            const htmlContent = this.generateSimpleHTML(data);
            
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
                        
                        body {
                            margin: 0;
                            padding: 20px;
                            font-family: Arial, sans-serif;
                            background: white;
                            color: #1a1a1a;
                            font-size: 12px;
                        }
                    </style>
                </head>
                <body>
                    ${htmlContent}
                </body>
                </html>
            `;

            console.log('Lade HTML in Puppeteer...');
            
            // HTML in Puppeteer laden
            await page.setContent(fullHtml, { 
                waitUntil: ['load'],
                timeout: 10000 
            });

            console.log('Generiere PDF...');
            
            // PDF generieren
            await page.pdf({
                path: outputPath,
                format: 'A4',
                landscape: true,
                margin: {
                    top: '15mm',
                    right: '15mm',
                    bottom: '15mm',
                    left: '15mm'
                },
                printBackground: true
            });

            console.log(`PDF erfolgreich generiert: ${outputPath}`);
            
            return {
                success: true,
                message: 'PDF wurde erfolgreich erstellt',
                path: outputPath
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
    }    static generateSimpleHTML(data) {
        const currentYear = new Date().getFullYear();
        const exportDate = new Date().toLocaleDateString('de-DE');

        const herbMap = new Map((data.herbVarieties || []).map(h => [h.id, h]));

        // Hilfsfunktionen für Berechnungen (aus der UI übernommen)
        const calculatePlantAge = (plantingDate) => {
            if (!plantingDate) return 0;
            const plantYear = new Date(plantingDate).getFullYear();
            const currentYear = new Date().getFullYear();
            return Math.max(0, currentYear - plantYear);
        };

        const calculateInitialPlants = (entity) => {
            const length = entity.segmentLength || entity.length || 0;
            return Math.floor(length * (entity.plantsPerMeter || 0));
        };

        const calculateCurrentPlants = (entity) => {
            const initialPlants = calculateInitialPlants(entity);
            return Math.floor(initialPlants * ((entity.productivePlantsPercentage || 0) / 100));
        };

        // Beetvisualisierung mit korrekten Proportionen
        let beetsHTML = '';
        if (data.beds && data.beds.length > 0) {
            const PIXELS_PER_METER = 32; // Wie in der UI
            
            beetsHTML = data.beds
                .sort((a, b) => (a.bedNumber || 0) - (b.bedNumber || 0))
                .map(bed => {
                    const bedWidth = (bed.width || 1.5) * PIXELS_PER_METER;
                    const bedHeight = 150; // Feste Höhe
                    
                    if (bed.type === 'Kombinationsbeet') {
                        // Kombinationsbeet mit Segmenten
                        const bedSegments = (data.segments || []).filter(s => s.bedId === bed.id);
                        const totalLength = bed.length || 0;
                        
                        let segmentsHTML = '';
                        if (bedSegments.length > 0) {
                            segmentsHTML = bedSegments.map(segment => {
                                const segmentHeight = (segment.segmentLength / totalLength) * bedHeight;
                                const herb = herbMap.get(segment.herbVarietyId);
                                
                                return `
                                    <div style="
                                        height: ${segmentHeight}px;
                                        background-color: ${herb?.color || '#ddd'};
                                        border-bottom: 1px solid rgba(0,0,0,0.2);
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-size: 8px;
                                        color: #333;
                                        text-align: center;
                                    ">
                                        ${segmentHeight > 15 ? (herb?.name || 'Unbekannt') : ''}
                                    </div>
                                `;
                            }).join('');
                        }
                        
                        return `
                            <div style="
                                width: ${bedWidth}px;
                                height: ${bedHeight}px;
                                position: relative;
                                border: 1px solid #666;
                                border-radius: 4px;
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
                                <div style="height: 100%; display: flex; flex-direction: column;">
                                    ${segmentsHTML}
                                </div>
                            </div>
                        `;
                    } else {
                        // Standard-, Blühstreifen-, Brachflächen-Beete
                        const herb = herbMap.get(bed.herbVarietyId);
                        const backgroundColor = herb?.color || bed.color || '#f0f0f0';
                        
                        return `
                            <div style="
                                width: ${bedWidth}px;
                                height: ${bedHeight}px;
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
                    }
                })
                .join('');
        }

        // Detaillierte Tabelle wie in der UI
        let tableHTML = '';
        if (data.beds && data.beds.length > 0) {
            const tableRows = [];
            
            data.beds
                .sort((a, b) => (a.bedNumber || 0) - (b.bedNumber || 0))
                .forEach(bed => {
                    if (bed.type === 'Kombinationsbeet') {
                        const bedSegments = (data.segments || []).filter(s => s.bedId === bed.id);
                        
                        bedSegments.forEach((segment, index) => {
                            const herb = herbMap.get(segment.herbVarietyId);
                            const initialPlants = calculateInitialPlants(segment);
                            const currentPlants = calculateCurrentPlants(segment);
                            
                            tableRows.push(`
                                <tr>
                                    <td style="padding: 6px; border: 1px solid #ccc;">${index === 0 ? bed.bedNumber : ''}</td>
                                    <td style="padding: 6px; border: 1px solid #ccc;">${index === 0 ? 'Kombinationsbeet' : ''}</td>
                                    <td style="padding: 6px; border: 1px solid #ccc;">${herb?.name || '-'}</td>
                                    <td style="padding: 6px; border: 1px solid #ccc;">${segment.subVarietyName || '-'}</td>
                                    <td style="padding: 6px; border: 1px solid #ccc;">${segment.segmentLength}m × ${bed.width}m</td>
                                    <td style="padding: 6px; border: 1px solid #ccc;">${calculatePlantAge(segment.plantingDate)} Jahre</td>
                                    <td style="padding: 6px; border: 1px solid #ccc;">${segment.plantsPerMeter || '-'}</td>
                                    <td style="padding: 6px; border: 1px solid #ccc;">${segment.productivePlantsPercentage || '-'}%</td>
                                    <td style="padding: 6px; border: 1px solid #ccc;">${currentPlants > 0 ? `${currentPlants}/${initialPlants}` : '-'}</td>
                                    <td style="padding: 6px; border: 1px solid #ccc;">${segment.remarks || '-'}</td>
                                </tr>
                            `);
                        });
                    } else {
                        const herb = herbMap.get(bed.herbVarietyId);
                        const initialPlants = calculateInitialPlants(bed);
                        const currentPlants = calculateCurrentPlants(bed);
                        
                        tableRows.push(`
                            <tr>
                                <td style="padding: 6px; border: 1px solid #ccc;">${bed.bedNumber}</td>
                                <td style="padding: 6px; border: 1px solid #ccc;">${bed.type}</td>
                                <td style="padding: 6px; border: 1px solid #ccc;">${herb?.name || '-'}</td>
                                <td style="padding: 6px; border: 1px solid #ccc;">${bed.subVarietyName || '-'}</td>
                                <td style="padding: 6px; border: 1px solid #ccc;">${bed.length ? `${bed.length}m × ${bed.width}m` : `${bed.width}m breit`}</td>
                                <td style="padding: 6px; border: 1px solid #ccc;">${calculatePlantAge(bed.plantingDate)} Jahre</td>
                                <td style="padding: 6px; border: 1px solid #ccc;">${bed.plantsPerMeter || '-'}</td>
                                <td style="padding: 6px; border: 1px solid #ccc;">${bed.productivePlantsPercentage || '-'}%</td>
                                <td style="padding: 6px; border: 1px solid #ccc;">${currentPlants > 0 ? `${currentPlants}/${initialPlants}` : '-'}</td>
                                <td style="padding: 6px; border: 1px solid #ccc;">${bed.remarks || '-'}</td>
                            </tr>
                        `);
                    }
                });

            tableHTML = `
                <table style="
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 10px;
                    margin-bottom: 20px;
                ">
                    <thead>
                        <tr style="background-color: #D4B851; color: white;">
                            <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Nr.</th>
                            <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Typ</th>
                            <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Kräuterart</th>
                            <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Sorte</th>
                            <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Größe</th>
                            <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Alter</th>
                            <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Pfl./m</th>
                            <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Ertrag %</th>
                            <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Pflanzen</th>
                            <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Bemerkungen</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows.join('')}
                    </tbody>
                </table>
            `;
        }

        return `
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
                margin-bottom: 30px;
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

            <h2 style="
                font-size: 18px;
                font-weight: 500;
                margin-bottom: 15px;
                color: #1a1a1a;
            ">Beet-Details</h2>
            
            ${tableHTML}
        `;
    }

    static validateData(data) {
        const errors = [];
        if (!data) errors.push('Keine Daten bereitgestellt');
        return errors;
    }
}

module.exports = { SimplePdfGenerator };
