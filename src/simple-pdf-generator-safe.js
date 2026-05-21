// Alternative PDF-Generierung ohne Browser-Window für Windows Defender Kompatibilität
const fs = require('fs');
const path = require('path');

/**
 * Einfacher HTML-zu-PDF Generator ohne Electron BrowserWindow
 * Weniger verdächtig für Windows Defender
 */
class SimplePdfGeneratorAlternative {
    
    static async generateGardenPdfAlternative(data, outputPath) {
        try {
            console.log('🔐 WINDOWS DEFENDER SAFE MODE - Alternative PDF Generation');
            
            if (!outputPath) {
                const { app } = require('electron');
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
                const filename = `gartenmeister-garden-overview-${timestamp}.pdf`;
                const documentsPath = app.getPath('documents');
                const gartenmeisterDir = path.join(documentsPath, 'GartenMeister');
                
                // Erstelle Ordner falls nicht vorhanden
                if (!fs.existsSync(gartenmeisterDir)) {
                    fs.mkdirSync(gartenmeisterDir, { recursive: true });
                }
                
                outputPath = path.join(gartenmeisterDir, filename);
            }
            
            // Generiere HTML-Content
            const htmlContent = this.generateAlternativeHTML(data);
            
            // Speichere HTML-Datei als Fallback
            const htmlPath = outputPath.replace('.pdf', '.html');
            fs.writeFileSync(htmlPath, htmlContent, 'utf8');
            
            console.log('✅ HTML-Export erfolgreich erstellt:', htmlPath);
            console.log('ℹ️ Öffnen Sie die HTML-Datei und drucken Sie sie als PDF');
            
            return {
                success: true,
                filePath: htmlPath,
                message: 'HTML-Export erstellt. Bitte als PDF drucken.',
                isHtml: true
            };
            
        } catch (error) {
            console.error('Alternative PDF-Generierung fehlgeschlagen:', error);
            return {
                success: false,
                message: `Alternative PDF-Generierung fehlgeschlagen: ${error.message}`
            };
        }
    }
    
    static generateAlternativeHTML(data) {
        const beds = data.beds || data.data?.beds || [];
        const segments = data.segments || data.data?.segments || [];
        const herbVarieties = data.herbVarieties || data.data?.herbVarieties || [];
        const config = data.gartenConfiguration || data.data?.gartenConfiguration || {};
        
        // Herb Map erstellen
        const herbMap = new Map();
        herbVarieties.forEach(herb => {
            herbMap.set(herb.id, herb);
        });
        
        // HTML generieren
        let html = `
            <!DOCTYPE html>
            <html lang="de">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>GartenMeister - Gartenübersicht</title>
                <style>
                    ${this.getAlternativeCSS()}
                </style>
            </head>
            <body>
                <div class="container">
                    <header>
                        <h1>🌱 GartenMeister - Gartenübersicht</h1>
                        <p>Erstellt am: ${new Date().toLocaleDateString('de-DE')}</p>
                        <p>Gesamtanzahl Beete: ${beds.length}</p>
                    </header>
                    
                    <div class="content">
                        ${this.generateBedVisualization(beds, config)}
                        ${this.generateBedTable(beds, segments, herbMap)}
                    </div>
                    
                    <footer>
                        <p>Erstellt mit GartenMeister Desktop</p>
                        <p><strong>Zum Drucken:</strong> Strg+P → "Als PDF speichern"</p>
                    </footer>
                </div>
            </body>
            </html>
        `;
        
        return html;
    }
    
    static generateBedVisualization(beds, config) {
        const currentBeetCount = config.currentBeetCount || 20;
        let visualization = `
            <section class="visualization">
                <h2>📊 Beetvisualisierung</h2>
                <div class="garden-layout">
        `;
        
        for (let i = 1; i <= currentBeetCount; i++) {
            const bed = beds.find(b => b.bedNumber === i);
            const width = bed ? (bed.width || 1) : 1;
            const color = bed ? (bed.color || '#f0f0f0') : '#f8f8f8';
            const type = bed ? bed.type : 'Leer';
            
            visualization += `
                <div class="bed-visual" style="width: ${width * 30}px; background-color: ${color};">
                    <span class="bed-number">${i}</span>
                    <span class="bed-type">${type}</span>
                </div>
            `;
        }
        
        visualization += `
                </div>
            </section>
        `;
        
        return visualization;
    }
    
    static generateBedTable(beds, segments, herbMap) {
        let table = `
            <section class="table-section">
                <h2>📋 Detailübersicht</h2>
                <table class="bed-table">
                    <thead>
                        <tr>
                            <th>Nr.</th>
                            <th>Typ</th>
                            <th>Breite</th>
                            <th>Sorte</th>
                            <th>Pflanzdatum</th>
                            <th>Alter</th>
                            <th>Pflanzen aktuell</th>
                            <th>Bemerkungen</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        const maxBeds = Math.max(20, beds.length);
        for (let i = 1; i <= maxBeds; i++) {
            const bed = beds.find(b => b.bedNumber === i);
            
            if (!bed) {
                table += `
                    <tr class="empty-bed">
                        <td>${i}</td>
                        <td colspan="7">Position ${i} unbelegt</td>
                    </tr>
                `;
                continue;
            }
            
            // Berechne Alter in Jahren
            let ageDisplay = '-';
            if (bed.plantingDate) {
                const plantDate = new Date(bed.plantingDate);
                const daysDiff = Math.floor((new Date().getTime() - plantDate.getTime()) / (1000 * 60 * 60 * 24));
                const yearsDiff = daysDiff / 365.25;
                ageDisplay = daysDiff >= 0 ? `${yearsDiff.toFixed(1)} Jahre` : 'Zukunft';
            }
            
            // Sorteninformation
            let varietyInfo = bed.type;
            if (bed.type === 'Standard' && bed.herbVarietyId) {
                const herb = herbMap.get(bed.herbVarietyId);
                varietyInfo = herb ? herb.name : 'Unbekannt';
                if (bed.subVarietyName) {
                    varietyInfo += ` (${bed.subVarietyName})`;
                }
            } else if (bed.type === 'Kombinationsbeet') {
                const bedSegments = segments.filter(s => s.bedId === bed.id);
                if (bedSegments.length > 0) {
                    varietyInfo = bedSegments.map(s => {
                        const herb = herbMap.get(s.herbVarietyId);
                        const herbName = herb ? herb.name : 'Unbekannt';
                        return `${herbName} ${s.segmentLength}m`;
                    }).join(', ');
                }
            }
            
            // Pflanzenanzahl
            let plantCount = '-';
            if (bed.type === 'Standard' && bed.plantsPerMeter && bed.length) {
                const total = Math.floor(bed.length * bed.plantsPerMeter);
                const productive = Math.floor(total * (bed.productivePlantsPercentage || 100) / 100);
                plantCount = `${productive} (${bed.productivePlantsPercentage || 100}%)`;
            } else if (bed.type === 'Kombinationsbeet') {
                const bedSegments = segments.filter(s => s.bedId === bed.id);
                const totalPlants = bedSegments.reduce((sum, s) => {
                    const segmentPlants = Math.floor((s.segmentLength || 0) * (s.plantsPerMeter || 0));
                    return sum + Math.floor(segmentPlants * (s.productivePlantsPercentage || 100) / 100);
                }, 0);
                plantCount = totalPlants.toString();
            }
            
            table += `
                <tr>
                    <td class="bed-number-cell">
                        <div class="color-indicator" style="background-color: ${bed.color || '#ccc'};"></div>
                        ${bed.bedNumber}
                    </td>
                    <td>${bed.type}</td>
                    <td>${bed.width}m</td>
                    <td class="variety-cell">${varietyInfo}</td>
                    <td>${bed.plantingDate ? new Date(bed.plantingDate).toLocaleDateString('de-DE') : '-'}</td>
                    <td>${ageDisplay}</td>
                    <td class="plants-cell">${plantCount}</td>
                    <td class="remarks-cell">${bed.remarks || '-'}</td>
                </tr>
            `;
        }
        
        table += `
                    </tbody>
                </table>
            </section>
        `;
        
        return table;
    }
    
    static getAlternativeCSS() {
        return `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #333;
                background: white;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }
            
            header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #4a90e2;
                padding-bottom: 20px;
            }
            
            header h1 {
                color: #4a90e2;
                font-size: 24px;
                margin-bottom: 10px;
            }
            
            .visualization {
                margin-bottom: 30px;
            }
            
            .garden-layout {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                padding: 20px;
                background: #f9f9f9;
                border-radius: 8px;
                border: 1px solid #ddd;
            }
            
            .bed-visual {
                min-height: 80px;
                border: 1px solid #ccc;
                border-radius: 4px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 5px;
            }
            
            .bed-number {
                font-weight: bold;
                font-size: 14px;
            }
            
            .bed-type {
                font-size: 10px;
                margin-top: 5px;
            }
            
            .table-section {
                margin-top: 30px;
            }
            
            .bed-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
            }
            
            .bed-table th,
            .bed-table td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
                vertical-align: top;
            }
            
            .bed-table th {
                background-color: #f0f0f0;
                font-weight: bold;
                font-size: 11px;
            }
            
            .bed-table td {
                font-size: 10px;
            }
            
            .bed-number-cell {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .color-indicator {
                width: 12px;
                height: 12px;
                border-radius: 2px;
                border: 1px solid #999;
            }
            
            .variety-cell {
                max-width: 200px;
                word-wrap: break-word;
            }
            
            .remarks-cell {
                max-width: 150px;
                word-wrap: break-word;
            }
            
            .empty-bed {
                background-color: #f9f9f9;
                color: #666;
                font-style: italic;
            }
            
            footer {
                margin-top: 40px;
                text-align: center;
                border-top: 1px solid #ddd;
                padding-top: 20px;
                color: #666;
            }
            
            @media print {
                .container {
                    padding: 10px;
                }
                
                body {
                    font-size: 10px;
                }
                
                .garden-layout {
                    page-break-inside: avoid;
                }
                
                .bed-table {
                    page-break-inside: auto;
                }
                
                .bed-table tr {
                    page-break-inside: avoid;
                }
            }
        `;
    }
}

module.exports = { SimplePdfGeneratorAlternative };
