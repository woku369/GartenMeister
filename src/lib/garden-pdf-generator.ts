import pdfMake from 'pdfmake/build/pdfmake';
import vfs from '../vfs_fonts';
import { TDocumentDefinitions, Content, Style, StyleDictionary } from 'pdfmake/interfaces';
import { BaseBed, KombinationsbeetSegment, HerbVariety, StandardBed, Kombinationsbeet } from './definitions';

// Initialisiere die Fonts
try {
  if (vfs && vfs.pdfMake && vfs.pdfMake.vfs) {
    pdfMake.vfs = vfs.pdfMake.vfs;
    pdfMake.fonts = {
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
      }
    };
  } else {
    throw new Error('VFS nicht gefunden');
  }
} catch (fontError) {
  console.warn('Fehler beim Laden der Fonts:', fontError);
  console.warn('Stelle sicher, dass generate_base64_fonts.js ausgeführt wurde');
  pdfMake.vfs = {};
}

// UI-Konstanten
const REFERENCE_WIDTH_UNOCCUPIED_M = 1.5;
const REFERENCE_WIDTH_UNOCCUPIED_PX = 48;
const PIXELS_PER_METER = REFERENCE_WIDTH_UNOCCUPIED_PX / REFERENCE_WIDTH_UNOCCUPIED_M;

// PDF-spezifische Konstanten
const PDF_SCALE_FACTOR = 0.75; // Skalierungsfaktor für die Umrechnung von UI-Pixeln zu PDF-Punkten
const PDF_MARGIN = 40;
const PDF_PAGE_SIZE = 'A4';

interface GardenPDFData {
  beds: BaseBed[];
  segments: KombinationsbeetSegment[];
  herbVarieties: HerbVariety[];
}

interface PDFBedDimensions {
  width: number;
  height: number;
  x: number;
  y: number;
}

export class GardenPDFGenerator {
  private beds: BaseBed[];
  private segments: KombinationsbeetSegment[];
  private herbVarieties: HerbVariety[];
  private herbMap: Map<string, HerbVariety>;
  private styles: StyleDictionary;

  constructor(data: GardenPDFData) {
    this.beds = data.beds;
    this.segments = data.segments;
    this.herbVarieties = data.herbVarieties;
    this.herbMap = new Map(this.herbVarieties.map(herb => [herb.id, herb]));
    this.styles = this.createStyles();
  }

  private createStyles(): StyleDictionary {
    return {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 20]
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      table: {
        margin: [0, 5, 0, 15]
      },
      tableHeader: {
        bold: true,
        fontSize: 11,
        color: 'black'
      }
    };
  }

  private calculateBedDimensions(bed: BaseBed | KombinationsbeetSegment): PDFBedDimensions {
    const width = 'segmentLength' in bed ? 
      bed.segmentLength * PIXELS_PER_METER * PDF_SCALE_FACTOR :
      bed.width * PIXELS_PER_METER * PDF_SCALE_FACTOR;

    return {
      width,
      height: 30 * PDF_SCALE_FACTOR,
      x: 0, // wird später berechnet
      y: 0  // wird später berechnet
    };
  }

  private createBedVisualization(): Content[] {
    const bedVisuals: Content[] = [];
    let currentX = PDF_MARGIN;
    let currentY = PDF_MARGIN;
    let maxHeightInRow = 0;
    const pageWidth = 595.28; // A4 Querformat Breite in Punkten

    this.beds.forEach((bed) => {
      const dims = this.calculateBedDimensions(bed);
      
      // Neue Zeile beginnen wenn nötig
      if (currentX + dims.width > pageWidth - PDF_MARGIN) {
        currentX = PDF_MARGIN;
        currentY += maxHeightInRow + 10;
        maxHeightInRow = 0;
      }

      dims.x = currentX;
      dims.y = currentY;
      maxHeightInRow = Math.max(maxHeightInRow, dims.height);      if ('isKombinationsbeet' in bed && bed.isKombinationsbeet) {
        // Kombinationsbeet mit Segmenten
        const segments = this.segments
          .filter(s => s.bedId === bed.id)
          .sort((a, b) => a.id.localeCompare(b.id));

        segments.forEach(segment => {
          const segDims = this.calculateBedDimensions(segment);
          const herb = this.herbMap.get(segment.herbVarietyId);
          
          bedVisuals.push({
            canvas: [{
              type: 'rect',
              x: dims.x,
              y: dims.y,
              w: segDims.width,
              h: dims.height,
              color: herb?.color || 'rgb(220, 220, 220)',
              lineWidth: 1,
              lineColor: '#666'
            }]
          });
          
          dims.x += segDims.width;
        });
      } else {
        // Standardbeet
        const standardBed = bed as StandardBed;
        const herb = standardBed.herbVarietyId ? this.herbMap.get(standardBed.herbVarietyId) : null;
        
        bedVisuals.push({
          canvas: [{
            type: 'rect',
            x: dims.x,
            y: dims.y,
            w: dims.width,
            h: dims.height,
            color: herb?.color || '#f8f9fa',
            lineWidth: 1,
            lineColor: '#666'
          }]
        });
      }

      currentX += dims.width + 5;
    });

    return bedVisuals;
  }

  private createBedTable(): Content {
    const tableBody = [
      [
        { text: 'Nr.', style: 'tableHeader' },
        { text: 'Typ', style: 'tableHeader' },
        { text: 'Kräuter', style: 'tableHeader' },
        { text: 'Details', style: 'tableHeader' }
      ]
    ];

    // Sortiere Beete nach Nummer
    const sortedBeds = [...this.beds].sort((a, b) => a.bedNumber - b.bedNumber);

    sortedBeds.forEach(bed => {      if ('isKombinationsbeet' in bed && bed.isKombinationsbeet) {
        const segments = this.segments
          .filter(s => s.bedId === bed.id)
          .sort((a, b) => a.id.localeCompare(b.id));

        const herbNames = segments
          .map((s, index) => {
            const herb = this.herbMap.get(s.herbVarietyId);
            return herb ? `${index + 1}: ${herb.name}` : `-`;
          })
          .join('\n');

        tableBody.push([
          { text: bed.bedNumber.toString(), style: 'tableRow' },
          { text: 'Kombinationsbeet', style: 'tableRow' },
          { text: herbNames, style: 'tableRow' },
          { 
            text: `${segments.length} Segmente\n` +
                  segments.map((s, index) => 
                    `Segment ${index + 1}: ${s.plantsPerMeter} Pflanzen/m, ${s.productivePlantsPercentage}% produktiv`
                  ).join('\n'),
            style: 'tableRow' 
          }
        ]);
      } else {
        const standardBed = bed as StandardBed;
        const herb = standardBed.herbVarietyId ? 
          this.herbMap.get(standardBed.herbVarietyId) : null;

        tableBody.push([
          { text: bed.bedNumber.toString(), style: 'tableRow' },
          { text: 'Standardbeet', style: 'tableRow' },
          { text: herb?.name || '-', style: 'tableRow' },
          { 
            text: [
              standardBed.plantsPerMeter ? `${standardBed.plantsPerMeter} Pflanzen/m` : '-',
              standardBed.productivePlantsPercentage ? `${standardBed.productivePlantsPercentage}% produktiv` : '',
              standardBed.remarks || ''
            ].filter(Boolean).join('\n'),
            style: 'tableRow' 
          }
        ]);
      }
    });

    return {
      table: {
        headerRows: 1,
        widths: ['auto', 'auto', '*', '*'],
        body: tableBody
      },
      style: 'table'
    };
  }

  public async generatePDF(): Promise<Uint8Array> {
    const documentDefinition: TDocumentDefinitions = {
      pageSize: PDF_PAGE_SIZE,
      pageOrientation: 'landscape',
      content: [
        { text: 'Gartenübersicht', style: 'header' },
        { text: 'Beetvisualisierung', style: 'subheader' },
        ...this.createBedVisualization(),
        { text: 'Beetdetails', style: 'subheader' },
        this.createBedTable()
      ],
      styles: this.styles
    };

    return new Promise((resolve, reject) => {
      try {
        const pdfDocGenerator = pdfMake.createPdf(documentDefinition);
        pdfDocGenerator.getBuffer((buffer) => {
          resolve(new Uint8Array(buffer));
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
