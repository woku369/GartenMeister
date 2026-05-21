import { HtmlPdfGenerator } from './html-pdf-generator';
import { BaseBed, HerbVariety, KombinationsbeetSegment } from './definitions';

interface GartenPDFOptions {
    beds: BaseBed[];
    segments: KombinationsbeetSegment[];
    herbVarieties: HerbVariety[];
}

export class GardenHtmlPdfGenerator extends HtmlPdfGenerator {
    /**
     * Generiert ein PDF aus der aktuellen React-Komponente
     */
    public async generatePdf(options: GartenPDFOptions, outputPath: string): Promise<void> {
        const htmlContent = this.generateHtml(options);
        await HtmlPdfGenerator.generatePdf(htmlContent, outputPath);
    }

    private generateHtml(options: GartenPDFOptions): string {
        const { beds, segments, herbVarieties } = options;

        const bedElements = beds.map(bed => {
            const isKombinationsbeet = bed.type === 'Kombinationsbeet';
            const bedSegments = isKombinationsbeet ? segments.filter(s => s.bedId === bed.id) : [];
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
                    const herb = herbVarieties.find(h => h.id === segment.herbVarietyId);                    return `
                        <div 
                            style="height: ${heightPercent}%; background-color: ${herb?.color || '#ddd'};"
                            class="w-full border-b last:border-b-0"
                            title="${herb?.name || 'Unbekannt'} (${segment.segmentLength}m)"
                        ></div>
                    `;
                }).join('');
            }            return `
                <div class="rounded-md shadow-sm print:shadow-none" style="${style}">
                    <div class="h-full flex flex-col">
                        ${content}
                    </div>
                </div>
            `;
        }).join('');        return `
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
                        ${bedElements}
                    </div>
                </div>

                <!-- Listen -->
                <div class="grid grid-cols-2 gap-8">
                    <!-- Kräuter -->
                    <div>
                        <h2 class="text-xl font-medium mb-4">Kräuter</h2>
                        <table class="w-full">                            <thead class="bg-muted/30">
                                <tr>
                                    <th class="text-left p-2">Name</th>
                                    <th class="text-left p-2">Markierung</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${herbVarieties.map(herb => `
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
                                ${beds.map(bed => `
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
        `;
    }
}
