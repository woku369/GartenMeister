const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class PdfGenerator {
    static async generateGardenPdf(data, outputPath) {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox']
        });

        try {
            const page = await browser.newPage();
            
            // Setze die Viewport-Größe auf A4 Querformat
            await page.setViewport({
                width: 1684,  // ~297mm bei 144dpi
                height: 1190  // ~210mm bei 144dpi
            });

            // Lade die Tailwind Styles
            const tailwindPath = path.join(app.getAppPath(), 'src', 'app', 'globals.css');
            const tailwindContent = await fs.promises.readFile(tailwindPath, 'utf8');
            
            // HTML Template mit den Styles
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        ${tailwindContent}
                        @page {
                            size: A4 landscape;
                            margin: 20mm;
                        }
                        body {
                            margin: 0;
                            padding: 20px;
                            font-family: 'Roboto', system-ui, sans-serif;
                        }
                        .print-only {
                            display: block !important;
                        }
                    </style>
                </head>
                <body class="bg-white">
                    <div class="container mx-auto">
                        <div class="flex items-center justify-between mb-8">
                            <h1 class="text-2xl font-medium">Gartenübersicht</h1>
                            <div class="text-sm text-gray-500">
                                ${new Date().toLocaleDateString('de-DE')}
                            </div>
                        </div>

                        <!-- Beet-Visualisierung -->
                        <div class="mb-8">
                            <h2 class="text-xl font-medium mb-4">Beetvisualisierung</h2>
                            <div class="flex flex-wrap gap-4 items-stretch bg-muted/20 rounded-lg p-4">
                                ${data.beds.map(bed => {
                                    const isKombinationsbeet = bed.type === 'Kombinationsbeet';
                                    const bedSegments = isKombinationsbeet ? data.segments.filter(s => s.bedId === bed.id) : [];
                                    const style = `
                                        width: ${bed.width * 50}px;
                                        background-color: ${bed.color || '#f0f0f0'};
                                        border: 1px solid #666;
                                    `;

                                    let content = '';
                                    if (isKombinationsbeet) {
                                        const totalLength = bed.length || 0;
                                        content = bedSegments.map(segment => {
                                            const heightPercent = (segment.segmentLength / totalLength) * 100;
                                            const herb = data.herbVarieties.find(h => h.id === segment.herbVarietyId);
                                            return `
                                                <div 
                                                    style="height: ${heightPercent}%; background-color: ${herb?.color || '#ddd'};"
                                                    class="w-full border-b last:border-b-0"
                                                    title="${herb?.name || 'Unbekannt'} (${segment.segmentLength}m)"
                                                ></div>
                                            `;
                                        }).join('');
                                    }

                                    return `
                                        <div class="rounded-md shadow-sm print:shadow-none" style="${style}">
                                            <div class="h-full flex flex-col">
                                                ${content}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <!-- Listen -->
                        <div class="grid grid-cols-2 gap-8">
                            <!-- Kräuter -->
                            <div>
                                <h2 class="text-xl font-medium mb-4">Kräuter</h2>
                                <table class="w-full">
                                    <thead class="bg-muted/30">
                                        <tr>
                                            <th class="text-left p-2">Name</th>
                                            <th class="text-left p-2">Markierung</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.herbVarieties.map(herb => `
                                            <tr class="border-b">
                                                <td class="p-2">${herb.name}</td>
                                                <td class="p-2">
                                                    <div class="w-4 h-4 rounded-full" style="background-color: ${herb.color || '#ddd'}"></div>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>

                            <!-- Beete -->
                            <div>
                                <h2 class="text-xl font-medium mb-4">Beete</h2>
                                <table class="w-full">
                                    <thead class="bg-muted/30">
                                        <tr>
                                            <th class="text-left p-2">Name</th>
                                            <th class="text-left p-2">Typ</th>
                                            <th class="text-left p-2">Maße</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.beds.map(bed => `
                                            <tr class="border-b">
                                                <td class="p-2">${bed.name || '-'}</td>
                                                <td class="p-2">${bed.type}</td>
                                                <td class="p-2">${bed.width}m x ${bed.length || '?'}m</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            // Setze den HTML-Content
            await page.setContent(html, {
                waitUntil: 'networkidle0'
            });

            // Generiere das PDF
            await page.pdf({
                path: outputPath,
                format: 'a4',
                landscape: true,
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '20mm',
                    bottom: '20mm',
                    left: '20mm'
                }
            });

        } finally {
            await browser.close();
        }
    }
}

module.exports = PdfGenerator;
