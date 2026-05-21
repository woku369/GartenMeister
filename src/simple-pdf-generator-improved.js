const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// Robuster Puppeteer-Import mit Fallback
let puppeteer = null;
try {
    puppeteer = require('puppeteer');
} catch (error) {
    console.warn('Puppeteer nicht verfügbar, verwende Electron-Fallback für PDF-Generierung:', error.message);
    puppeteer = null;
}

/**
 * Verbesserter PDF-Generator für GartenMeister - FINALE VERSION
 * 
 * Diese Klasse generiert pixelgenaue PDF-Exporte der Gartenvisualisierung
 * mit professioneller Formatierung und optimierter Seitenaufteilung.
 * 
 * FINALE FEATURES:
 * ✅ Proportionale Beetdarstellung mit Flexbox-Layout
 * ✅ UI-identische Listenansicht mit Farbindikatoren
 * ✅ Prozentsatz-Anzeige für ertragsfähige Pflanzen
 * ✅ Professionelle Überschriften (Stiftsgarten Gurk)
 * ✅ Automatische Seitennummerierung
 * ✅ Optimierte Page-Breaks (keine leeren Seiten)
 * ✅ Mehrzeilige Segmentdarstellung für Kombinationsbeete
 * 
 * DESIGN-PRINZIPIEN:
 * - Exakte UI-Nachbildung in PDF-Format
 * - A4 Querformat für optimale Beetvisualisierung  
 * - Professionelle Dokumentation für Außenstehende
 * - Wartbare und erweiterbare Architektur
 */
class SimplePdfGenerator {
    static async generateGardenPdf(data, outputPath) {
        try {
            console.log('🔥 SIMPLE PDF GENERATOR IMPROVED - VERSION 2.0 🔥');
            console.log('Starte verbesserte PDF-Generierung...');
            console.log('Debugging PDF-Export-Daten:', {
                type: data.type,
                hasData: !!data.data,
                bedsCount: data.beds?.length || 0,
                segmentsCount: data.segments?.length || 0,
                herbsCount: data.herbVarieties?.length || 0,
                hasConfig: !!data.gartenConfiguration
            });
            
            // Debugging: Beetvisualisierung wird generiert
            console.log('Debugging: Beetvisualisierung wird generiert...');
            console.log('OutputPath beim Aufruf:', outputPath, 'Typ:', typeof outputPath);
            
            // Generiere outputPath falls nicht übergeben
            if (!outputPath || outputPath === null || outputPath === undefined) {
                console.log('Generiere outputPath...');
                const { app } = require('electron');
                const path = require('path');
                const os = require('os');
                
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
                const filename = `gartenmeister-garden-overview-${timestamp}.pdf`;
                const documentsPath = app.getPath('documents');
                console.log('Documents Path:', documentsPath);
                const gartenmeisterDir = path.join(documentsPath, 'GartenMeister');
                console.log('GartenMeister Dir:', gartenmeisterDir);
                
                // Erstelle Ordner falls nicht vorhanden
                const fs = require('fs');
                if (!fs.existsSync(gartenmeisterDir)) {
                    console.log('Erstelle Ordner:', gartenmeisterDir);
                    fs.mkdirSync(gartenmeisterDir, { recursive: true });
                }
                
                outputPath = path.join(gartenmeisterDir, filename);
                console.log('OutputPath generiert:', outputPath);
            } else {
                console.log('OutputPath bereits vorhanden:', outputPath);
            }
            
            // Verwende direkt Electron PDF API (Puppeteer-Probleme umgehen)
            console.log('Verwende Electron PDF API direkt...');
            return await this.generateWithElectronPDF(data, outputPath);
            
        } catch (error) {
            console.error('PDF-Generierung vollständig fehlgeschlagen:', error);
            return {
                success: false,
                message: `PDF-Generierung fehlgeschlagen: ${error.message}`
            };
        }
    }

    static async generateWithPuppeteer(data, outputPath) {
        let browser;
        
        try {
            console.log('Starte verbesserte PDF-Generierung...');
            console.log('Debugging PDF-Export-Daten:', {
                type: data.type,
                hasData: !!data.data,
                bedsCount: data.beds?.length || 0,
                segmentsCount: data.segments?.length || 0,
                herbsCount: data.herbVarieties?.length || 0,
                hasConfig: !!data.gartenConfiguration
            });
            
            // Debugging: Beetvisualisierung wird generiert
            console.log('Debugging: Beetvisualisierung wird generiert...');
            
            // Prüfe ob Puppeteer verfügbar ist, sonst Electron-Fallback
            if (!puppeteer) {
                console.log('🔄 Puppeteer nicht verfügbar, verwende Electron-Fallback...');
                return await this.generateWithElectronPDF(data, outputPath);
            }
            
            // Puppeteer Browser starten - mit Electron-kompatiblen Einstellungen
            browser = await puppeteer.launch({
                headless: true,
                executablePath: process.execPath, // Verwende Electron's Chromium
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--disable-dev-shm-usage',
                    '--disable-extensions',
                    '--disable-gpu'
                ]
            });

            const page = await browser.newPage();
            
            // Viewport für A4 Querformat setzen
            await page.setViewport({
                width: 1200,
                height: 850,
                deviceScaleFactor: 1
            });            console.log('Generiere verbessertes HTML...');
            
            // Bestimme PDF-Typ und generiere entsprechendes HTML
            let htmlContent;
            if (data.type === 'reports') {
                console.log('🔥 REPORTS PDF ERKANNT! Verarbeite Erntedaten...');
                console.log('Anzahl Ernteereignisse:', data.data?.length || 0);
                console.log('Erste Erntedaten:', JSON.stringify(data.data?.[0], null, 2));
                htmlContent = this.generateReportsHTML(data.data);
            } else {
                console.log('🌿 GARDEN PDF ERKANNT! Verarbeite Gartendaten...');
                console.log('Anzahl Beete:', data.beds?.length || 0);
                // Standard: Gartenübersicht (beds/garden-overview)
                htmlContent = this.generateImprovedHTML(data);
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
                            @bottom-left {
                                content: "Gartenübersicht";
                                font-size: 10px;
                                color: #666;
                            }
                            @bottom-right {
                                content: "Seite " counter(page) " von " counter(pages);
                                font-size: 10px;
                                color: #666;
                            }
                        }
                          body {
                            margin: 0;
                            padding: 20px;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                            background: white;
                            color: #1a1a1a;
                            font-size: 12px;
                            line-height: 1.4;
                            page-break-after: avoid;
                        }
                        
                        .bed-container {
                            background-color: #f8f9fa;
                            border-radius: 8px;
                            padding: 20px;
                            margin-bottom: 20px;
                            page-break-inside: avoid;
                            page-break-after: avoid;
                        }.bed-area {
                            min-height: 170px;
                            padding: 12px;
                            background-color: white;
                            border-radius: 6px;
                            position: relative;
                            display: flex;
                            flex-wrap: nowrap;
                            align-items: flex-end;
                            justify-content: flex-start;
                            gap: 1px;
                            width: 100%;
                            max-width: none;
                            overflow: visible;
                        }

                        .bed {
                            position: relative;
                            border-radius: 4px;
                            border: 1px solid #666;
                            height: 150px;
                            flex-shrink: 0;
                        }.bed-number {
                            position: absolute;
                            top: -18px;
                            width: 100%;
                            text-align: center;
                            font-size: 9px;
                            font-weight: 600;
                            color: #333;
                        }
                          .segment {
                            border-bottom: 1px solid rgba(0,0,0,0.2);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 8px;
                            color: #333;
                            text-align: center;
                            font-weight: 500;
                            min-height: 15px;
                            overflow: hidden;
                            box-sizing: border-box;
                        }
                        
                        .segment:last-child {
                            border-bottom: none;
                        }
                          table {
                            width: 100%;
                            border-collapse: collapse;
                            font-size: 10px;
                            margin-bottom: 20px;
                            background: white;
                        }
                        
                        th {
                            background-color: hsl(40, 40%, 75%);
                            color: #374151;
                            padding: 8px 6px;
                            border: 1px solid #ccc;
                            text-align: left;
                            font-weight: 600;
                            border-bottom: 2px solid #999;
                        }
                        
                        td {
                            padding: 6px;
                            border: 1px solid #ccc;
                            vertical-align: top;
                            line-height: 1.4;
                        }
                        
                        tr:nth-child(even) {
                            background-color: #f9f9f9;
                        }
                        
                        tr:hover {
                            background-color: #f5f5f5;
                        }
                          .header {
                            margin-bottom: 30px;
                            border-bottom: 2px solid #D4B851;
                            padding-bottom: 15px;
                        }
                        
                        .header-main h1 {
                            font-size: 20px;
                            font-weight: 600;
                            color: #1a1a1a;
                            margin: 0 0 10px 0;
                            line-height: 1.2;
                        }
                        
                        .header-subtitle {
                            font-size: 12px;
                            color: #666;
                            line-height: 1.4;
                        }
                          .header-subtitle div {
                            margin-bottom: 3px;
                        }
                        
                        .stats-container {
                            display: flex;
                            justify-content: space-around;
                            margin: 25px 0;
                            padding: 20px;
                            background-color: #f8f9fa;
                            border-radius: 10px;
                            border: 2px solid #e9ecef;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }
                        
                        .stat-box {
                            text-align: center;
                            padding: 15px 20px;
                            background-color: white;
                            border-radius: 8px;
                            border: 1px solid #dee2e6;
                            min-width: 120px;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        }
                        
                        .stat-number {
                            font-size: 28px;
                            font-weight: 700;
                            color: #16a34a;
                            margin-bottom: 8px;
                            display: block;
                        }
                        
                        .stat-label {
                            font-size: 14px;
                            color: #495057;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }
                          h2 {
                            font-size: 18px;
                            font-weight: 500;
                            margin-bottom: 15px;
                            margin-top: 20px;
                            color: #1a1a1a;
                            page-break-after: avoid;
                            page-break-inside: avoid;
                        }
                        
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            font-size: 10px;
                            margin-bottom: 10px;
                            background: white;
                            page-break-inside: auto;
                        }
                        
                        thead {
                            page-break-inside: avoid;
                            page-break-after: avoid;
                        }
                        
                        tbody {
                            page-break-inside: auto;
                        }
                        
                        tr {
                            page-break-inside: avoid;
                            page-break-after: auto;
                        }
                        
                        .year-section {
                            margin-bottom: 30px;
                            page-break-inside: avoid;
                        }
                        
                        .year-section h3 {
                            font-size: 16px;
                            font-weight: 600;
                            color: #1a1a1a;
                            margin: 20px 0 15px 0;
                            border-bottom: 1px solid #D4B851;
                            padding-bottom: 5px;
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
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                },
                printBackground: true,
                displayHeaderFooter: true,
                footerTemplate: `
                    <div style="font-size: 10px; color: #666; width: 100%; text-align: right; padding-right: 15mm;">
                        Seite <span class="pageNumber"></span> von <span class="totalPages"></span>
                    </div>
                `,
                headerTemplate: '<div></div>' // Leerer Header
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
    }    static generateImprovedHTML(data) {
        const currentYear = new Date().getFullYear();
        const exportDate = new Date().toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
        });        // Debug-Logging für Datenanalyse
        console.log('PDF Generator - Empfangene Daten:', {
            bedsCount: (data.beds || data.data?.beds || []).length,
            segmentsCount: (data.segments || data.data?.segments || []).length,
            herbVarietiesCount: (data.herbVarieties || data.data?.herbVarieties || []).length,
            sampleBed: (data.beds || data.data?.beds || [])[0],
            sampleHerb: (data.herbVarieties || data.data?.herbVarieties || [])[0],
            gartenConfiguration: data.data?.gartenConfiguration || data.gartenConfiguration
        });

        // Herb Map für bessere Performance - kann in data.herbVarieties oder data.data.herbVarieties sein
        const herbVarieties = data.herbVarieties || data.data?.herbVarieties || [];
        const herbMap = new Map(herbVarieties.map(h => [h.id, h]));
        console.log('Herb Map erstellt mit', herbMap.size, 'Einträgen');

        // Hilfsfunktionen für Berechnungen (direkt aus der UI übernommen)
        const calculatePlantAge = (plantingDate, inDays = false) => {
            if (!plantingDate) return inDays ? '-' : 0;
            
            if (inDays) {
                // Alter in Tagen berechnen (nur für spezielle Fälle in der App)
                const plantDate = new Date(plantingDate);
                const daysDiff = Math.floor((new Date().getTime() - plantDate.getTime()) / (1000 * 60 * 60 * 24));
                return daysDiff >= 0 ? `${daysDiff} Tage` : 'Zukunft';
            } else {
                // Alter in Jahren (Standard für PDF-Export)
                const plantYear = new Date(plantingDate).getFullYear();
                const currentYear = new Date().getFullYear();
                return Math.max(0, currentYear - plantYear);
            }
        };

        const calculateInitialPlants = (entity) => {
            const length = entity.segmentLength || entity.length || 0;
            return Math.floor(length * (entity.plantsPerMeter || 0));
        };

        const calculateCurrentPlants = (entity) => {
            const initialPlants = calculateInitialPlants(entity);
            return Math.floor(initialPlants * ((entity.productivePlantsPercentage || 0) / 100));
        };

        // Verbesserte Beetvisualisierung
        const beetsHTML = this.generateBeetsVisualization(data, herbMap);
        
        // Vollständige Tabelle (keine Zusammenfassung)
        const tableHTML = this.generateDetailedTable(data, herbMap, calculatePlantAge, calculateInitialPlants, calculateCurrentPlants);        return `
            <div class="header">
                <div class="header-main">
                    <h1>Gartenübersicht Stiftsgarten Gurk – Bewirtschaftungsjahr ${currentYear}</h1>
                    <div class="header-subtitle">
                        <div><strong>Aktuelle Ansicht Stand:</strong> ${exportDate}</div>
                        <div><strong>erstellt von:</strong> Dipl.-Ing. Wolfgang Kulmitzer</div>
                        <div style="font-size: 10px; color: #666; margin-top: 5px;"><em>Generiert mit GartenMeister v2.0 - Gefixte Segmentvisualisierung</em></div>
                    </div>
                </div>
            </div>

            <h2>Beetvisualisierung</h2>
            
            <div class="bed-container">
                <div class="bed-area">
                    ${beetsHTML}
                </div>
            </div>

            <h2>Angelegte Beete (Listenansicht)</h2>
            
            ${tableHTML}
        `;
    }    /**
     * Generiert die Beetvisualisierung mit korrekten Proportionen
     * 
     * LÖSUNG: Verwendung von flex-grow anstatt fester Pixelbreiten
     * - Jedes Beet erhält flex-grow entsprechend seiner realen Breite in Metern
     * - Leere Beetplätze erhalten flex-grow = REFERENCE_WIDTH_UNOCCUPIED_M (1.5)
     * - Dadurch automatische proportionale Verteilung wie in der UI
     * 
     * @param {Object} data - Gartendaten (Beete, Segmente, Kräuter)
     * @param {Map} herbMap - Map für schnellen Zugriff auf Kräuterdaten
     * @returns {string} HTML-String für Beetvisualisierung     */
    static generateBeetsVisualization(data, herbMap) {
        // PHASE 1: Dynamische Beetanzahl aus GartenConfiguration verwenden
        // Datenstruktur ist: data.data.gartenConfiguration oder direktes data.gartenConfiguration
        const gartenConfig = data.data?.gartenConfiguration || data.gartenConfiguration;        const currentBeetCount = gartenConfig?.currentBeetCount || 26; // Fallback auf 26
        const REFERENCE_WIDTH_UNOCCUPIED_M = 1.5; // Meter für leere Beete (aus UI)
        const MAX_PROPORTION_RATIO = 8; // Maximales Verhältnis zwischen größtem und kleinstem Beet für PDF
        
        // Erstelle Map der vorhandenen Beete nach Nummer
        const bedMap = new Map();
        // Beete können in data.beds oder data.data.beds sein
        const beds = data.beds || data.data?.beds || [];
        beds.forEach(bed => {
            if (bed.bedNumber) {
                bedMap.set(bed.bedNumber, bed);
            }        });
        
        // Sammle alle flex-grow Werte zunächst
        const flexGrowValues = [];
        for (let slotNumber = 1; slotNumber <= currentBeetCount; slotNumber++) {
            const bed = bedMap.get(slotNumber);
            const rawFlexGrow = bed ? (bed.width || 1) : REFERENCE_WIDTH_UNOCCUPIED_M;
            flexGrowValues.push(rawFlexGrow);
        }
        
        // Finde Min/Max für Proportions-Anpassung
        const minFlexGrow = Math.min(...flexGrowValues);
        const maxFlexGrow = Math.max(...flexGrowValues);
        const currentRatio = maxFlexGrow / minFlexGrow;
        
        // Wenn das Verhältnis zu extrem ist, skaliere es runter
        let scalingFactor = 1;
        if (currentRatio > MAX_PROPORTION_RATIO) {
            scalingFactor = MAX_PROPORTION_RATIO / currentRatio;
            console.log(`PDF-Proportions-Anpassung: ${currentRatio.toFixed(1)}:1 → ${MAX_PROPORTION_RATIO}:1 (Faktor: ${scalingFactor.toFixed(3)})`);
        }
        
        // Generiere alle Beetplätze von 1 bis currentBeetCount mit angepassten flexGrow
        const beetsHTML = [];
        for (let slotNumber = 1; slotNumber <= currentBeetCount; slotNumber++) {
            const bed = bedMap.get(slotNumber);
            const bedHeight = 150;
            
            // Berechne adjustierte flexGrow Werte für PDF-kompatible Proportionen
            const rawFlexGrow = bed ? (bed.width || 1) : REFERENCE_WIDTH_UNOCCUPIED_M;
            const adjustedFlexGrow = minFlexGrow + (rawFlexGrow - minFlexGrow) * scalingFactor;
            
            if (bed) {
                // Vorhandenes Beet
                if (bed.type === 'Kombinationsbeet') {
                    // Segmente können in data.segments oder data.data.segments sein
                    const segments = data.segments || data.data?.segments || [];
                    beetsHTML.push(this.generateExperimentalBed(bed, adjustedFlexGrow, bedHeight, slotNumber, segments, herbMap));
                } else {
                    beetsHTML.push(this.generateStandardBed(bed, adjustedFlexGrow, bedHeight, slotNumber, herbMap));
                }
            } else {
                // Leerer Beetplatz
                beetsHTML.push(this.generateEmptyBedSlot(adjustedFlexGrow, bedHeight, slotNumber));
            }        }
        
        return beetsHTML.join('');
    }    static generateExperimentalBed(bed, flexGrow, bedHeight, bedNumber, segments, herbMap) {
        const bedSegments = (segments || []).filter(s => s.bedId === bed.id);
        const totalBedLength = bed.length || 3; // Gesamte Beetlänge
        
        let segmentsHTML = '';
        if (bedSegments.length > 0) {
            const totalSegmentLength = bedSegments.reduce((sum, seg) => sum + (seg.segmentLength || 0), 0);
            
            // Erstelle Segmente exakt wie in der App - proportional zur Gesamtlänge
            segmentsHTML = bedSegments.map((segment, segIndex) => {
                const segmentHeightPercent = (segment.segmentLength || 0) / totalBedLength * 100; // Prozent der Gesamtlänge
                const herb = herbMap.get(segment.herbVarietyId);
                const backgroundColor = herb?.color || '#ddd';
                const segmentName = herb?.name || 'Unbekannt';
                
                return `
                    <div class="segment" style="
                        width: 100%;
                        height: ${segmentHeightPercent}%;
                        min-height: 8px;
                        background-color: ${backgroundColor};
                        border: 1px solid rgba(255,255,255,0.4);
                        border-radius: 1px;
                        margin: 0.5px 0;
                        box-sizing: border-box;
                    " title="Segment ${segIndex + 1}: ${segmentName} (${segment.segmentLength || 0}m von ${totalBedLength}m)">
                    </div>
                `;
            }).join('');
            
            // Füge unbelegte Fläche hinzu falls Segmente < Gesamtlänge (exakt wie in der App)
            if (totalSegmentLength < totalBedLength) {
                const emptyHeightPercent = (totalBedLength - totalSegmentLength) / totalBedLength * 100;
                segmentsHTML += `
                    <div class="segment empty-space" style="
                        width: 100%;
                        height: ${emptyHeightPercent}%;
                        min-height: 8px;
                        background-color: ${bed.color || '#f0f0f0'};
                        border: 1px solid rgba(0,0,0,0.1);
                        border-radius: 1px;
                        margin: 0.5px 0;
                        box-sizing: border-box;
                    " title="Unbelegte Fläche: ${(totalBedLength - totalSegmentLength).toFixed(1)}m von ${totalBedLength}m">
                    </div>
                `;
            }
        } else {
            // Fallback für Kombinationsbeete ohne Segmente
            segmentsHTML = `
                <div class="segment empty-bed" style="
                    width: 100%;
                    height: 100%;
                    background-color: ${bed.color || '#f0f0f0'};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #666;
                    font-size: 10px;
                    border: 1px solid rgba(0,0,0,0.1);
                ">
                    Keine Segmente
                </div>
            `;
        }
        
        return `
            <div class="bed experimental-bed" style="
                flex-grow: ${flexGrow};
                display: flex;
                flex-direction: column;
                border: 1px solid rgba(0, 0, 0, 0.2);
                border-radius: 3px;
                overflow: hidden;
                min-height: 150px;
                max-height: 150px;
                height: 150px;
            ">
                <div class="bed-number">${bedNumber}</div>
                <div class="bed-content">
                    ${segmentsHTML}
                </div>
            </div>
        `;
    }    static generateStandardBed(bed, flexGrow, bedHeight, bedNumber, herbMap) {        
        const herb = herbMap.get(bed.herbVarietyId);
        const backgroundColor = herb?.color || bed.color || '#f0f0f0';
        
        return `
            <div class="bed standard-bed" style="
                flex-grow: ${flexGrow};
                background-color: ${backgroundColor};
                border: 1px solid rgba(0, 0, 0, 0.2);
                border-radius: 3px;
                display: flex;
                flex-direction: column;
                min-height: 150px;
                max-height: 150px;
                height: 150px;
                overflow: hidden;
            ">
                <div class="bed-number">${bedNumber}</div>
                <div class="bed-content" style="
                    flex-grow: 1;
                    background-color: ${backgroundColor};
                "></div>
            </div>
        `;
    }

    static generateEmptyBedSlot(flexGrow, bedHeight, slotNumber) {
        return `
            <div class="bed empty-bed" style="
                flex-grow: ${flexGrow};
                background-color: #f8fafc;
                border: 1px solid rgba(0, 0, 0, 0.2);
                border-radius: 3px;
                display: flex;
                flex-direction: column;
                min-height: 150px;
                max-height: 150px;
                height: 150px;
                overflow: hidden;
            ">
                <div class="bed-number">${slotNumber}</div>
                <div class="bed-content" style="
                    flex-grow: 1;
                    background-color: #f8fafc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #666;
                    font-size: 9px;
                ">
                    Verfügbar
                </div>
            </div>
        `;
    }

    static generateDetailedTable(data, herbMap, calculatePlantAge, calculateInitialPlants, calculateCurrentPlants) {
        // PHASE 1: Dynamische Beetanzahl aus GartenConfiguration verwenden
        const gartenConfig = data.data?.gartenConfiguration || data.gartenConfiguration;        const currentBeetCount = gartenConfig?.currentBeetCount || 26; // Fallback auf 26
        
        // Erstelle Map der vorhandenen Beete nach Nummer
        const bedMap = new Map();
        const beds = data.beds || data.data?.beds || [];
        beds.forEach(bed => {
            if (bed.bedNumber) {
                bedMap.set(bed.bedNumber, bed);
            }
        });

        // Erstelle Segment-Map für Kombinationsbeete (wie in UI)
        const segmentMapByBedId = new Map();
        const segments = data.segments || data.data?.segments || [];
        segments.forEach(segment => {
            if (!segmentMapByBedId.has(segment.bedId)) {
                segmentMapByBedId.set(segment.bedId, []);
            }
            segmentMapByBedId.get(segment.bedId).push(segment);
        });

        const tableRows = [];
        
        // Moderne Tabellenzeilen für alle Beetplätze von 1 bis currentBeetCount
        for (let slotNumber = 1; slotNumber <= currentBeetCount; slotNumber++) {
            const bed = bedMap.get(slotNumber);
            
            if (!bed) {
                // Leerer Beetplatz - moderne Darstellung
                tableRows.push(`
                    <tr class="empty-bed-row">
                        <td class="bed-cell">
                            <div class="bed-info-card">
                                <div class="bed-number-badge empty">${slotNumber}</div>
                                <div class="bed-details">
                                    <div class="bed-type">Position verfügbar</div>
                                    <div class="bed-meta">Bereit für Neupflanzung</div>
                                </div>
                            </div>
                        </td>
                        <td class="dimensions-cell">-</td>
                        <td class="herb-cell">-</td>
                        <td class="date-cell">-</td>
                        <td class="plants-cell">-</td>
                        <td class="status-cell">
                            <span class="status-badge available">Verfügbar</span>
                        </td>
                    </tr>
                `);
                continue;
            }

            const standardBed = bed.type === 'Standard' ? bed : null;
            const versuchsBed = bed.type === 'Kombinationsbeet' ? bed : null;

            let initialPlantsTotal = 0;
            let currentPlantsTotal = 0;
            let productivePlantsPercentageDisplay = '-';
            let herbDetails = bed.type;
            let bedColorIndicator = bed.color || '#f0f0f0';            if (standardBed) {
                // Standard-Beet Logik - moderne Darstellung
                const herb = herbMap.get(standardBed.herbVarietyId);
                herbDetails = `${herb?.name || 'Unbekannt'}${standardBed.subVarietyName ? ` (${standardBed.subVarietyName})` : ''}`;
                initialPlantsTotal = calculateInitialPlants(standardBed);
                currentPlantsTotal = calculateCurrentPlants(standardBed);
                productivePlantsPercentageDisplay = `${standardBed.productivePlantsPercentage || 0}%`;
                bedColorIndicator = standardBed.color || herb?.color || '#90EE90';
            } else if (versuchsBed) {
                // Kombinationsbeet Logik (wie in UI mit Zeilenumbrüchen)
                const segments = segmentMapByBedId.get(bed.id) || [];
                if (segments.length > 0) {
                    // Segmente mit Zeilenumbrüchen anzeigen (wie in UI)
                    herbDetails = segments.map(s => {
                        const herb = herbMap.get(s.herbVarietyId);
                        return `${herb?.name || 'Unbek.'}${s.subVarietyName ? ` (${s.subVarietyName})` : ''} ${s.segmentLength}m`;
                    }).join('<br>');
                    
                    initialPlantsTotal = segments.reduce((sum, s) => sum + calculateInitialPlants(s), 0);
                    currentPlantsTotal = segments.reduce((sum, s) => sum + calculateCurrentPlants(s), 0);
                    
                    if (segments.length === 1 && segments[0].productivePlantsPercentage !== undefined) {
                        productivePlantsPercentageDisplay = `${segments[0].productivePlantsPercentage}%`;
                    } else if (segments.length > 1) {
                        const firstSegmentPercentage = segments[0].productivePlantsPercentage;
                        const allSamePercentage = segments.every(s => s.productivePlantsPercentage === firstSegmentPercentage);
                        if (allSamePercentage && firstSegmentPercentage !== undefined) {
                            productivePlantsPercentageDisplay = `${firstSegmentPercentage}%`;
                        } else {
                            productivePlantsPercentageDisplay = 'siehe Seg.';
                        }
                    }
                } else {
                    herbDetails = "Kombinationsbeet (leer)";
                }
                bedColorIndicator = bed.color || '#f0f0f0';
            }

            // Berechne Pflanzungsdatum und Alter (wie in App-Logik)
            let plantingDate = '-';
            let plantAge = '-';
            
            if (standardBed && standardBed.plantingDate) {
                plantingDate = new Date(standardBed.plantingDate).toLocaleDateString('de-DE');
                plantAge = calculatePlantAge(standardBed.plantingDate, false); // Zeige Jahre statt Tage im PDF
            } else if (versuchsBed) {
                // Für Kombinationsbeete: Verwende das älteste Pflanzungsdatum (wie in der App)
                const segments = segmentMapByBedId.get(bed.id) || [];
                const earliestDate = segments.reduce((earliest, s) => {
                    if (!s.plantingDate) return earliest;
                    if (!earliest) return s.plantingDate;
                    return new Date(s.plantingDate) < new Date(earliest) ? s.plantingDate : earliest;
                }, null);
                
                if (earliestDate) {
                    plantingDate = new Date(earliestDate).toLocaleDateString('de-DE');
                    plantAge = calculatePlantAge(earliestDate, false); // Zeige Jahre statt Tage im PDF
                }
            }

            // Formatiere "Pflanzen aktuell" mit Prozentsatz in Klammern
            let currentPlantsDisplay = '-';
            let initialPlantsDisplay = '-';

            if (standardBed) {
                initialPlantsDisplay = initialPlantsTotal > 0 ? initialPlantsTotal.toString() : '-';
                currentPlantsDisplay = currentPlantsTotal > 0 ? `${currentPlantsTotal} (${standardBed.productivePlantsPercentage || 0}%)` : '-';
            } else if (versuchsBed) {
                const segments = segmentMapByBedId.get(bed.id) || [];
                if (segments.length > 0) {
                    // Für Kombinationsbeete: Zeige jedes Segment einzeln mit Zeilenumbrüchen
                    initialPlantsDisplay = segments.map(s => calculateInitialPlants(s)).join('<br>');
                    currentPlantsDisplay = segments.map(s => {
                        const currentPlants = calculateCurrentPlants(s);
                        const percentage = s.productivePlantsPercentage || 0;
                        return currentPlants > 0 ? `${currentPlants} (${percentage}%)` : '-';
                    }).join('<br>');
                } else {
                    initialPlantsDisplay = '-';
                    currentPlantsDisplay = '-';
                }
            }            tableRows.push(`
                <tr>
                    <td style="padding: 6px;">
                        <span style="display: inline-block; width: 12px; height: 12px; background-color: ${bedColorIndicator}; border: 1px solid rgba(0,0,0,0.2); border-radius: 2px; margin-right: 6px; vertical-align: middle;"></span>
                        ${slotNumber}
                    </td>
                    <td style="padding: 6px;">${bed.type}</td>
                    <td style="padding: 6px;">${bed.width}m</td>
                    <td style="padding: 6px; max-width: 150px; line-height: 1.3;">${herbDetails}</td>
                    <td style="padding: 6px;">${plantingDate}</td>
                    <td style="padding: 6px;">${plantAge} Jahre</td>
                    <td style="padding: 6px; text-align: center; line-height: 1.3;">${initialPlantsDisplay}</td>
                    <td style="padding: 6px; text-align: center; line-height: 1.3;">${currentPlantsDisplay}</td>
                    <td style="padding: 6px;">${bed.remarks || '-'}</td>
                </tr>
            `);
        }        return `
            <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 5px;">
                <thead>
                    <tr style="background-color: hsl(40, 40%, 75%); border-bottom: 2px solid #999;">
                        <th style="padding: 8px 6px; border: 1px solid #ccc; text-align: left; font-weight: 600; color: #374151; width: 60px;">Nr.</th>
                        <th style="padding: 8px 6px; border: 1px solid #ccc; text-align: left; font-weight: 600; color: #374151;">Typ</th>
                        <th style="padding: 8px 6px; border: 1px solid #ccc; text-align: left; font-weight: 600; color: #374151;">Breite</th>
                        <th style="padding: 8px 6px; border: 1px solid #ccc; text-align: left; font-weight: 600; color: #374151;">
                            <span style="display: block;">Sorte</span>
                            <span style="font-size: 8px; font-weight: normal; color: #6b7280;">(Untersorte)</span>
                        </th>
                        <th style="padding: 8px 6px; border: 1px solid #ccc; text-align: left; font-weight: 600; color: #374151;">
                            <span style="display: block;">Pflanz-</span>
                            <span style="display: block;">datum</span>
                        </th>
                        <th style="padding: 8px 6px; border: 1px solid #ccc; text-align: left; font-weight: 600; color: #374151;">Alter</th>
                        <th style="padding: 8px 6px; border: 1px solid #ccc; text-align: center; font-weight: 600; color: #374151;">
                            <span style="display: block;">Pflanzen</span>
                            <span style="display: block;">bei Besatz</span>
                        </th>
                        <th style="padding: 8px 6px; border: 1px solid #ccc; text-align: center; font-weight: 600; color: #374151;">
                            <span style="display: block;">Pflanzen</span>
                            <span style="display: block;">aktuell</span>
                        </th>
                        <th style="padding: 8px 6px; border: 1px solid #ccc; text-align: left; font-weight: 600; color: #374151;">Bemerkungen</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows.join('')}
                </tbody>
            </table>
        `;
    }    static validateData(data) {
        const errors = [];
        if (!data) {
            errors.push('Keine Daten bereitgestellt');
            return errors;
        }
        
        // Prüfe ob es sich um Reports handelt
        if (data.type === 'reports') {
            if (!data.data || !Array.isArray(data.data)) {
                errors.push('Keine gültigen Erntebericht-Daten gefunden');
            }
            // Reports benötigen keine Beete oder Kräuter-Daten
            return errors;
        }
        
        // Originale Validierung für Garten-Daten (beds/garden-overview)
        const gardenData = data.data || data; // Unterstütze beide Formate
        
        if (!gardenData.beds || !Array.isArray(gardenData.beds)) {
            errors.push('Keine gültigen Beet-Daten gefunden');
        }
        
        if (!gardenData.herbVarieties || !Array.isArray(gardenData.herbVarieties)) {
            errors.push('Keine Kräuterarten-Daten gefunden');
        }
        
        return errors;
    }

    /**
     * Generiert HTML für Ernteberichte
     * 
     * @param {Array} harvestEvents - Array der Ernteereignisse
     * @returns {string} HTML-String für Ernteberichte
     */
    static generateReportsHTML(harvestEvents) {
        const currentYear = new Date().getFullYear();
        const exportDate = new Date().toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
        });

        console.log('Generiere Reports HTML für', harvestEvents?.length || 0, 'Ernteereignisse');

        if (!harvestEvents || harvestEvents.length === 0) {
            return `
                <div class="header">
                    <div class="header-main">
                        <h1>Ernteberichte Stiftsgarten Gurk – Bewirtschaftungsjahr ${currentYear}</h1>
                        <div class="header-subtitle">
                            <div><strong>Aktuelle Ansicht Stand:</strong> ${exportDate}</div>
                            <div><strong>erstellt von:</strong> Dipl.-Ing. Wolfgang Kulmitzer</div>
                        </div>
                    </div>
                </div>

                <div style="text-align: center; padding: 50px; color: #666;">
                    <h2>Keine abgeschlossenen Erntevorgänge vorhanden</h2>
                    <p>Es wurden noch keine Erntevorgänge erfasst und abgeschlossen.</p>
                </div>
            `;
        }

        // Berechne Gesamtstatistiken
        const totalHarvests = harvestEvents.length;
        const totalYield = harvestEvents.reduce((sum, event) => sum + (event.totalYieldKg || 0), 0);
        const totalPlants = harvestEvents.reduce((sum, event) => sum + (event.totalYieldablePlantsForEvent || 0), 0);

        // Erstelle Übersichtstabelle
        const overviewTableHTML = this.generateHarvestOverviewTable(harvestEvents);
        
        // Erstelle Detailtabellen für jedes Event
        const detailTablesHTML = harvestEvents.map(event => 
            this.generateHarvestDetailTable(event)
        ).join('');

        // Erstelle Jahresstatistiken
        const yearlyStatsHTML = this.generateYearlyStatsHTML(harvestEvents);

        return `
            <div class="header">
                <div class="header-main">
                    <h1>Ernteberichte Stiftsgarten Gurk – Bewirtschaftungsjahr ${currentYear}</h1>
                    <div class="header-subtitle">
                        <div><strong>Aktuelle Ansicht Stand:</strong> ${exportDate}</div>
                        <div><strong>erstellt von:</strong> Dipl.-Ing. Wolfgang Kulmitzer</div>
                    </div>
                </div>
            </div>

            <div style="background: #f8f9fa; color: #2d3748; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #2d3748; font-size: 24px; margin-bottom: 20px; text-align: center; border-bottom: 1px solid #cbd5e0; padding-bottom: 12px;">
                    🌿 Bewirtschaftungsjahr ${currentYear} - Ernteübersicht
                </h2>
                
                <div style="display: flex; justify-content: center; gap: 30px; margin-top: 20px;">
                    <div style="text-align: center; background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 6px; min-width: 130px;">
                        <div style="font-size: 32px; font-weight: bold; margin-bottom: 8px; color: #2d3748;">${totalHarvests}</div>
                        <div style="font-size: 12px; color: #4a5568; text-transform: uppercase; letter-spacing: 0.5px;">Erntevorgänge</div>
                    </div>
                    <div style="text-align: center; background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 6px; min-width: 130px;">
                        <div style="font-size: 32px; font-weight: bold; margin-bottom: 8px; color: #2d3748;">${totalYield.toFixed(0)} kg</div>
                        <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Gesamtertrag</div>
                    </div>
                </div>
            </div>
            
            <div style="margin: 20px 0; padding: 15px; background-color: #f0f9f0; border-radius: 8px; border-left: 4px solid #16a34a;">
                <p><strong>Übersicht der erfassten Ernten:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    ${harvestEvents.map(event => {
                        // Bessere Darstellung der Beet-Zuordnung
                        const bedInfo = event.contributingBedNumbersString && event.contributingBedNumbersString.trim() 
                            ? `${event.contributingBedNumbersString}` 
                            : 'Beete unbekannt';
                        
                        // Gewicht hervorheben
                        const weight = event.totalYieldKg || 0;
                        const weightDisplay = weight > 0 ? `${weight.toFixed(1)} kg` : '0 kg';
                        
                        return `
                        <li style="margin-bottom: 8px; padding: 6px; border-bottom: 1px solid #e2e8f0;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span><strong>${event.herbName || 'Unbekannte Sorte'}</strong> - ${weightDisplay}</span>
                                <span style="font-size: 11px; color: #64748b;">Beet: ${bedInfo}</span>
                            </div>
                        </li>`;
                    }).join('')}
                </ul>
            </div>            ${overviewTableHTML}

            ${yearlyStatsHTML}

            <h2 style="page-break-before: always;">Erntedetails</h2>
            
            ${detailTablesHTML}
        `;
    }

    /**
     * Generiert Jahresstatistiken für Ernteberichte
     */
    static generateYearlyStatsHTML(harvestEvents) {
        // Gruppiere Events nach Jahr
        const eventsByYear = harvestEvents.reduce((acc, event) => {
            const year = new Date(event.harvestDateStart).getFullYear();
            if (!acc[year]) acc[year] = [];
            acc[year].push(event);
            return acc;
        }, {});

        const years = Object.keys(eventsByYear).sort((a, b) => parseInt(b) - parseInt(a));

        if (years.length === 0) return '';

        let yearlyStatsHTML = '<h2 style="page-break-before: always;">Jahresstatistiken nach Sorten</h2>';

        years.forEach(year => {
            const yearEvents = eventsByYear[year];
            
            // Gruppiere nach Sorte
            const eventsByVariety = yearEvents.reduce((acc, event) => {
                const varietyKey = event.herbVarietyId || 'unknown';
                if (!acc[varietyKey]) acc[varietyKey] = [];
                acc[varietyKey].push(event);
                return acc;
            }, {});

            // Berechne Sortenstatistiken
            const varietyStats = Object.entries(eventsByVariety).map(([varietyId, varietyEvents]) => {
                const totalKg = varietyEvents.reduce((sum, event) => sum + (event.totalYieldKg || 0), 0);
                const totalPlants = varietyEvents.reduce((sum, event) => sum + (event.totalYieldablePlantsForEvent || 0), 0);
                const harvestCount = varietyEvents.length;
                const avgKgPerHarvest = harvestCount > 0 ? totalKg / harvestCount : 0;
                const avgKgPerPlant = totalPlants > 0 ? totalKg / totalPlants : 0;

                return {
                    varietyId,
                    varietyName: varietyEvents[0].herbName || 'Unbekannte Sorte',
                    varietyColor: varietyEvents[0].herbColor,
                    totalKg,
                    totalPlants,
                    harvestCount,
                    avgKgPerHarvest,
                    avgKgPerPlant
                };
            }).sort((a, b) => b.totalKg - a.totalKg);

            const yearTotalKg = varietyStats.reduce((sum, stat) => sum + stat.totalKg, 0);
            const yearTotalPlants = varietyStats.reduce((sum, stat) => sum + stat.totalPlants, 0);
            const yearTotalHarvests = varietyStats.reduce((sum, stat) => sum + stat.harvestCount, 0);

            yearlyStatsHTML += `
                <div class="year-section">
                    <h3>Bewirtschaftungsjahr ${year}</h3>
                    
                    <div class="stats-container">
                        <div class="stat-box">
                            <div class="stat-number">${yearTotalKg.toFixed(2)} kg</div>
                            <div class="stat-label">Gesamtertrag ${year}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number">${yearTotalPlants.toLocaleString()}</div>
                            <div class="stat-label">Gesamtpflanzen</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number">${yearTotalHarvests}</div>
                            <div class="stat-label">Ernten gesamt</div>
                        </div>
                    </div>

                    <table style="width: 100%; margin: 20px 0; border-collapse: collapse; font-size: 11px;">
                        <thead>
                            <tr style="background-color: #f5f5f5;">
                                <th style="padding: 10px; border: 1px solid #ccc; text-align: left;">Sorte</th>
                                <th style="padding: 10px; border: 1px solid #ccc; text-align: center;">Ernten</th>
                                <th style="padding: 10px; border: 1px solid #ccc; text-align: right;">Gesamtertrag</th>
                                <th style="padding: 10px; border: 1px solid #ccc; text-align: right;">Ø kg/Ernte</th>
                                <th style="padding: 10px; border: 1px solid #ccc; text-align: right;">Ø g/Pflanze</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${varietyStats.map(stat => `
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #ccc;">
                                        <div style="display: flex; align-items: center;">
                                            <span style="display: inline-block; width: 12px; height: 12px; background-color: ${stat.varietyColor || '#f0f0f0'}; border: 1px solid rgba(0,0,0,0.2); border-radius: 2px; margin-right: 8px;"></span>
                                            ${stat.varietyName}
                                        </div>
                                    </td>
                                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">
                                        <span style="background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${stat.harvestCount}</span>
                                    </td>
                                    <td style="padding: 8px; border: 1px solid #ccc; text-align: right; font-weight: bold;">
                                        ${stat.totalKg.toFixed(2)} kg
                                    </td>
                                    <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">
                                        ${stat.avgKgPerHarvest.toFixed(2)} kg
                                    </td>
                                    <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">
                                        ${stat.avgKgPerPlant > 0 ? (stat.avgKgPerPlant * 1000).toFixed(1) + ' g' : '-'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        });

        return yearlyStatsHTML;
    }

    /**
     * Generiert Übersichtstabelle der Ernten
     */
    static generateHarvestOverviewTable(harvestEvents) {
        const tableRows = harvestEvents.map(event => {
            const startDate = new Date(event.harvestDateStart).toLocaleDateString('de-DE');
            const endDate = event.harvestDateEnd ? new Date(event.harvestDateEnd).toLocaleDateString('de-DE') : '-';
            const period = endDate !== '-' ? `${startDate} - ${endDate}` : startDate;
            
            return `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ccc;">
                        <div style="display: flex; align-items: center;">
                            <span style="display: inline-block; width: 12px; height: 12px; background-color: ${event.herbColor || '#f0f0f0'}; border: 1px solid rgba(0,0,0,0.2); border-radius: 2px; margin-right: 8px; vertical-align: middle;"></span>
                            ${event.herbName || 'Unbekannt'}
                        </div>
                    </td>
                    <td style="padding: 8px; border: 1px solid #ccc;">${period}</td>
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${event.contributingBedNumbersString || '-'}</td>
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: right; font-weight: 600;">${(event.totalYieldKg || 0).toFixed(2)} kg</td>
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${event.totalYieldablePlantsForEvent || '-'}</td>
                    <td style="padding: 8px; border: 1px solid #ccc; font-size: 10px;">${event.remarks || '-'}</td>
                </tr>
            `;
        }).join('');

        return `
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
                <thead>
                    <tr style="background-color: hsl(40, 40%, 75%); border-bottom: 2px solid #999;">
                        <th style="padding: 10px 8px; border: 1px solid #ccc; text-align: left; font-weight: 600; color: #374151;">Kräuterart</th>
                        <th style="padding: 10px 8px; border: 1px solid #ccc; text-align: left; font-weight: 600; color: #374151;">Erntezeitraum</th>
                        <th style="padding: 10px 8px; border: 1px solid #ccc; text-align: center; font-weight: 600; color: #374151;">Beete</th>
                        <th style="padding: 10px 8px; border: 1px solid #ccc; text-align: center; font-weight: 600; color: #374151;">Ertrag (kg)</th>
                        <th style="padding: 10px 8px; border: 1px solid #ccc; text-align: center; font-weight: 600; color: #374151;">Pflanzen</th>
                        <th style="padding: 10px 8px; border: 1px solid #ccc; text-align: left; font-weight: 600; color: #374151;">Bemerkungen</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        `;
    }

    /**
     * Generiert Detailtabelle für ein Ernteereignis
     */
    static generateHarvestDetailTable(event) {
        if (!event.contributionsData || event.contributionsData.length === 0) {
            return `
                <div style="margin-bottom: 25px; page-break-inside: avoid;">
                    <h3 style="color: #374151; margin-bottom: 10px; font-size: 16px;">
                        ${event.herbName} - ${new Date(event.harvestDateStart).toLocaleDateString('de-DE')}
                    </h3>
                    <p style="color: #666; font-style: italic;">Keine Detaildaten für Beet-/Segmentbeiträge verfügbar.</p>
                </div>
            `;
        }

        const contributionRows = event.contributionsData.map(contrib => `
            <tr>
                <td style="padding: 6px; border: 1px solid #ccc; text-align: center;">${contrib.bedNumber || 'N/A'}</td>
                <td style="padding: 6px; border: 1px solid #ccc; font-size: 10px;">${contrib.segmentName || '-'}</td>
                <td style="padding: 6px; border: 1px solid #ccc; text-align: center;">${contrib.productivePlantsPercentage}%</td>
                <td style="padding: 6px; border: 1px solid #ccc; text-align: center;">${contrib.yieldablePlantsAtHarvestTimeCount || '-'}</td>
            </tr>
        `).join('');

        return `
            <div style="margin-bottom: 25px; page-break-inside: avoid;">
                <h3 style="color: #374151; margin-bottom: 10px; font-size: 16px; display: flex; align-items: center;">
                    <span style="display: inline-block; width: 14px; height: 14px; background-color: ${event.herbColor || '#f0f0f0'}; border: 1px solid rgba(0,0,0,0.2); border-radius: 2px; margin-right: 8px;"></span>
                    ${event.herbName} - ${new Date(event.harvestDateStart).toLocaleDateString('de-DE')}
                    <span style="margin-left: auto; font-size: 14px; font-weight: 600; color: #16a34a;">${(event.totalYieldKg || 0).toFixed(2)} kg</span>
                </h3>
                
                <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 15px;">
                    <thead>
                        <tr style="background-color: #f8f9fa; border-bottom: 1px solid #999;">
                            <th style="padding: 6px; border: 1px solid #ccc; text-align: center; font-weight: 600;">Beet Nr.</th>
                            <th style="padding: 6px; border: 1px solid #ccc; text-align: left; font-weight: 600;">Segment Details</th>
                            <th style="padding: 6px; border: 1px solid #ccc; text-align: center; font-weight: 600;">Produktivität (%)</th>
                            <th style="padding: 6px; border: 1px solid #ccc; text-align: center; font-weight: 600;">Pflanzen</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${contributionRows}
                    </tbody>
                </table>
                
                ${event.remarks ? `<p style="font-size: 10px; color: #666; font-style: italic; border-left: 3px solid #16a34a; padding-left: 8px; margin: 0;">Bemerkung: ${event.remarks}</p>` : ''}
            </div>
        `;
    }

    /**
     * Fallback PDF-Generierung mit Electron's nativer PDF-API
     */
    static async generateWithElectronPDF(data, outputPath) {
        const { BrowserWindow } = require('electron');
        const fs = require('fs');
        
        try {
            console.log('Verwende Electron PDF API Fallback...');
            console.log('OutputPath erhalten:', outputPath);
            
            if (!outputPath) {
                throw new Error('OutputPath ist undefined oder leer');
            }
            
            // Erstelle unsichtbares Browser-Fenster
            const win = new BrowserWindow({
                width: 1200,
                height: 850,
                show: false,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                }
            });

            // Bestimme PDF-Typ und generiere entsprechendes HTML (SAME LOGIC AS PUPPETEER!)
            let htmlContent;
            if (data.type === 'reports') {
                console.log('🔥 ELECTRON API: REPORTS PDF ERKANNT! Verarbeite Erntedaten...');
                console.log('Anzahl Ernteereignisse:', data.data?.length || 0);
                htmlContent = this.generateReportsHTML(data.data);
            } else {
                console.log('🌿 ELECTRON API: GARDEN PDF ERKANNT! Verarbeite Gartendaten...');
                console.log('Anzahl Beete:', data.beds?.length || 0);
                // Standard: Gartenübersicht (beds/garden-overview)
                htmlContent = this.generateImprovedHTML(data);
            }
            
            // Vollständiges HTML mit CSS
            const fullHtml = `
                <!DOCTYPE html>>
                <html lang="de">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${data.type === 'reports' ? 'Ernteberichte' : 'Gartenübersicht'}</title>
                    <style>
                        ${data.type === 'reports' ? this.getReportsCSS() : this.getCSS()}
                    </style>
                </head>
                <body>
                    ${htmlContent}
                </body>
                </html>
            `;

            // Lade HTML in das Fenster
            await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`);
            
            // Warte kurz, damit das Rendering abgeschlossen ist
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Generiere PDF
            const pdfBuffer = await win.webContents.printToPDF({
                pageSize: 'A4',
                landscape: true,
                margins: {
                    top: 0.6,
                    bottom: 0.6,
                    left: 0.6,
                    right: 0.6
                },
                printBackground: true
            });

            // Speichere PDF
            fs.writeFileSync(outputPath, pdfBuffer);
            
            // Schließe Fenster
            win.close();

            console.log(`PDF erfolgreich mit Electron API erstellt: ${outputPath}`);
            return {
                success: true,
                message: 'PDF erfolgreich erstellt (Electron API)',
                filePath: outputPath
            };

        } catch (error) {
            console.error('Electron PDF API Fehler:', error);
            throw error;
        }
    }

    /**
     * Extrahiert CSS für standalone HTML
     */
    static getCSS() {
        return `
            @page {
                size: A4 landscape;
                margin: 15mm;
                @bottom-left {
                    content: "Gartenübersicht";
                    font-size: 10px;
                    color: #666;
                }
                @bottom-right {
                    content: "Seite " counter(page) " von " counter(pages);
                    font-size: 10px;
                    color: #666;
                }
            }
              body {
                margin: 0;
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                background: white;
                color: #1a1a1a;
                font-size: 12px;
                line-height: 1.4;
                page-break-after: avoid;
            }
            
            .bed-container {
                background-color: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
                page-break-inside: avoid;
                page-break-after: avoid;
            }

            .bed-area {
                min-height: 170px;
                padding: 12px;
                background-color: rgba(241, 245, 249, 0.3);
                border-radius: 8px;
                border: 1px solid rgba(0, 0, 0, 0.1);
                display: flex;
                flex-direction: row;
                align-items: stretch;
                gap: 4px;
                overflow-x: auto;
                width: 100%;
                box-sizing: border-box;
            }

            .bed {
                border: 1px solid rgba(0, 0, 0, 0.3);
                border-radius: 4px;
                position: relative;
                display: flex;
                flex-direction: column;
                min-width: 35px;
                min-height: 150px;
                max-height: 150px;
                height: 150px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                /* flex-grow wird inline gesetzt basierend auf Beetbreite */
            }

            .bed-number {
                font-weight: bold;
                text-align: center;
                font-size: 10px;
                padding: 2px;
                background: rgba(255,255,255,0.9);
                border-bottom: 1px solid rgba(0,0,0,0.1);
                flex-shrink: 0;
                color: #1f2937;
                z-index: 10;
                height: 18px;
                line-height: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .bed-content {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                height: calc(150px - 18px);
                min-height: calc(150px - 18px);
            }

            .segment {
                /* width und height werden inline gesetzt für proportionale Darstellung */
                border: 1px solid rgba(255,255,255,0.4);
                border-radius: 1px;
                margin: 0.5px 0;
                box-sizing: border-box;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 9px;
                color: #1f2937;
                font-weight: 500;
                flex-shrink: 0;
            }

            .segment.empty-space {
                border: 1px solid rgba(0,0,0,0.1);
            }

            .segment.empty-bed {
                color: #666;
                font-size: 9px;
                height: 100%;
                margin: 0;
            }

            .table-container {
                margin-top: 30px;
                page-break-inside: avoid;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 10px;
                margin-top: 10px;
            }

            th, td {
                border: 1px solid #d1d5db;
                padding: 8px 6px;
                text-align: left;
                vertical-align: top;
            }

            th {
                background-color: #f3f4f6;
                font-weight: bold;
                color: #374151;
                font-size: 10px;
            }

            .header {
                text-align: center;
                margin-bottom: 30px;
                page-break-after: avoid;
            }

            .header h1 {
                font-size: 20px;
                color: #1f2937;
                margin: 0 0 10px 0;
                font-weight: bold;
            }

            .header-subtitle {
                font-size: 12px;
                color: #6b7280;
                margin-bottom: 20px;
            }

            h2 {
                font-size: 16px;
                color: #374151;
                margin: 25px 0 15px 0;
                font-weight: bold;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 5px;
            }

            /* Moderne Tabellen-Styles */
            .modern-table-container {
                margin-top: 20px;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }

            .modern-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 10px;
                background: white;
            }

            .modern-header {
                background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
                border-bottom: 2px solid #d1d5db;
            }

            .modern-header th {
                padding: 12px 8px;
                text-align: left;
                font-weight: 600;
                color: #374151;
                font-size: 10px;
                border-right: 1px solid #d1d5db;
            }

            .bed-row {
                border-bottom: 1px solid #f3f4f6;
            }

            .bed-row:nth-child(even) {
                background-color: #fafafa;
            }

            .bed-row:hover {
                background-color: #f0f9ff;
            }

            .empty-bed-row {
                background-color: #f8f9fa;
                border-bottom: 1px solid #e9ecef;
            }

            .bed-info-card {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px;
            }

            .bed-number-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                border-radius: 4px;
                color: white;
                font-weight: bold;
                font-size: 10px;
                border: 1px solid rgba(0, 0, 0, 0.2);
            }

            .bed-number-badge.empty {
                background-color: #e5e7eb;
                color: #6b7280;
            }

            .bed-details {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .bed-type {
                font-weight: 600;
                color: #374151;
                font-size: 10px;
            }

            .bed-meta {
                font-size: 8px;
                color: #6b7280;
            }

            .herb-info {
                padding: 6px;
            }

            .herb-name {
                font-weight: 500;
                color: #374151;
                font-size: 10px;
                margin-bottom: 2px;
            }

            .herb-meta {
                font-size: 8px;
                color: #6b7280;
            }

            .plants-info {
                text-align: center;
                padding: 6px;
            }

            .plants-current {
                font-weight: 600;
                color: #059669;
                font-size: 11px;
            }

            .plants-total {
                font-size: 8px;
                color: #6b7280;
            }

            .status-badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 8px;
                font-weight: 500;
                text-align: center;
            }

            .status-badge.excellent {
                background-color: #d1fae5;
                color: #065f46;
                border: 1px solid #a7f3d0;
            }

            .status-badge.good {
                background-color: #dbeafe;
                color: #1e40af;
                border: 1px solid #93c5fd;
            }

            .status-badge.fair {
                background-color: #fef3c7;
                color: #92400e;
                border: 1px solid #fcd34d;
            }

            .status-badge.poor {
                background-color: #fee2e2;
                color: #991b1b;
                border: 1px solid #fca5a5;
            }

            .status-badge.inactive {
                background-color: #f3f4f6;
                color: #6b7280;
                border: 1px solid #d1d5db;
            }

            .status-badge.available {
                background-color: #ecfdf5;
                color: #166534;
                border: 1px solid #bbf7d0;
            }

            .bed-cell, .dimensions-cell, .herb-cell, .date-cell, .plants-cell, .status-cell {
                padding: 8px;
                border-right: 1px solid #f3f4f6;
                vertical-align: top;
            }
        `;
    }

    /**
     * Extrahiert CSS für Reports (Ernteberichte) mit spezifischer Fußzeile
     */
    static getReportsCSS() {
        return `
            @page {
                size: A4 landscape;
                margin: 15mm;
                @bottom-left {
                    content: "Ernteberichte";
                    font-size: 10px;
                    color: #666;
                }
                @bottom-right {
                    content: "Seite " counter(page) " von " counter(pages);
                    font-size: 10px;
                    color: #666;
                }
            }
              body {
                margin: 0;
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                background: white;
                color: #1a1a1a;
                font-size: 12px;
                line-height: 1.4;
                page-break-after: avoid;
            }
              h1, h2, h3 {
                color: #2d5a27;
                margin: 10px 0;
                line-height: 1.2;
            }
              h1 {
                font-size: 24px;
                font-weight: 700;
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 3px solid #4ade80;
                padding-bottom: 10px;
            }
              h2 {
                font-size: 18px;
                font-weight: 600;
                margin-top: 25px;
                margin-bottom: 15px;
                border-left: 4px solid #22c55e;
                padding-left: 15px;
            }
              h3 {
                font-size: 14px;
                font-weight: 600;
                margin-top: 20px;
                margin-bottom: 10px;
            }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                background: white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                border-radius: 8px;
                overflow: hidden;
            }
              th {
                background: #f8f9fa;
                color: #2d3748;
                padding: 12px 8px;
                text-align: left;
                font-weight: 600;
                font-size: 11px;
                border: 1px solid #e2e8f0;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
              td {
                padding: 10px 8px;
                border-bottom: 1px solid #f0f0f0;
                font-size: 11px;
                vertical-align: top;
            }
              tr:nth-child(even) {
                background-color: #f8fffe;
            }
              tr:hover {
                background-color: #f0fdf4;
            }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 20px;
            }
              .header-main h1 {
                color: #16a34a;
                font-size: 28px;
                margin-bottom: 15px;
                font-weight: 700;
            }
              .header-subtitle {
                color: #6b7280;
                font-size: 12px;
                line-height: 1.6;
            }
              .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 25px 0;
            }
              .stat-card {
                background: linear-gradient(135deg, #f0fdf4, #dcfce7);
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                border: 1px solid #bbf7d0;
                box-shadow: 0 2px 8px rgba(34, 197, 94, 0.1);
            }
              .stat-number {
                font-size: 32px;
                font-weight: 700;
                color: #16a34a;
                margin-bottom: 8px;
                display: block;
            }
              .stat-label {
                font-size: 12px;
                color: #166534;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 500;
            }
              .harvest-detail {
                page-break-before: auto;
                margin-top: 40px;
                padding: 25px;
                background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                border-radius: 12px;
                border: 1px solid #e2e8f0;
            }
              .harvest-detail h3 {
                background: linear-gradient(135deg, #16a34a, #22c55e);
                color: white;
                padding: 15px 20px;
                margin: -25px -25px 20px -25px;
                border-radius: 12px 12px 0 0;
                font-size: 16px;
                font-weight: 600;
                text-align: center;
            }
              .page-break {
                page-break-before: always;
            }
              .no-break {
                page-break-inside: avoid;
            }
              @media print {
                body { font-size: 10px; }
                h1 { font-size: 20px; }
                h2 { font-size: 16px; }
                h3 { font-size: 12px; }
                .stat-number { font-size: 24px; }
                table { margin: 15px 0; }
                th, td { padding: 6px 4px; font-size: 9px; }
            }
              .contribution-table {
                margin-top: 15px;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
              .contribution-table th {
                background: #f1f5f9;
                color: #334155;
                font-size: 10px;
                padding: 8px 6px;
                border: 1px solid #cbd5e0;
            }
              .contribution-table td {
                font-size: 10px;
                padding: 6px;
                text-align: center;
                vertical-align: top;
            }
        `;
    }

    // Alias für Rückwärtskompatibilität
    static async generatePdf(data, outputPath) {
        return await this.generateGardenPdf(data, outputPath);
    }
}

module.exports = { SimplePdfGenerator };
