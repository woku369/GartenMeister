import { BaseBed, KombinationsbeetSegment, HerbVariety, StandardBed, Kombinationsbeet } from './definitions';

// Konstanten aus der UI für exakte Proportionen
const REFERENCE_WIDTH_UNOCCUPIED_M = 1.5; // Meter (Standardbreite)
const REFERENCE_WIDTH_UNOCCUPIED_PX = 48; // Pixel (w-12 in Tailwind)
const PIXELS_PER_METER = REFERENCE_WIDTH_UNOCCUPIED_PX / REFERENCE_WIDTH_UNOCCUPIED_M;

// Farben für Beete und Segmente
const DEFAULT_SEGMENT_COLOR = 'rgba(220, 220, 220, 0.8)';
const UNOCCUPIED_BED_COLOR = '#f8f9fa'; // Entspricht hsl(var(--card))
const UNOCCUPIED_SEGMENT_COLOR = '#f8f9fa';

interface GardenPDFData {
  beds: BaseBed[];
  segments: KombinationsbeetSegment[];
  herbVarieties: HerbVariety[];
}

export const generateGardenPDF = async (data: GardenPDFData) => {
  const { beds, segments, herbVarieties } = data;
  
  // Maps für schnellen Lookup erstellen
  const herbMap = new Map(herbVarieties.map(herb => [herb.id, herb]));
  const bedMap = new Map(beds.map(bed => [bed.bedNumber, bed]));  const segmentsByBed = segments.reduce((acc, segment) => {
    const bedSegments = acc.get(segment.bedId) || [];
    bedSegments.push(segment);
    acc.set(segment.bedId, bedSegments.sort((a, b) => a.id.localeCompare(b.id)));
    return acc;
  }, new Map<string, KombinationsbeetSegment[]>());

  // HTML Template mit exakter UI-Nachbildung erstellen
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page {
            size: landscape;
            margin: 20mm;
          }
          
          body {
            font-family: 'Roboto', sans-serif;
            margin: 0;
            padding: 0;
            background: white;
            color: #1a1a1a;
          }

          .title {
            font-size: 24px;
            font-weight: 500;
            text-align: center;
            margin-bottom: 30px;
            color: #1a1a1a;
          }

          .visualization-container {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
          }

          .visualization-title {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 15px;
          }

          .beds-container {
            display: flex;
            gap: 6px;
            min-height: 200px;
            padding: 12px;
            background: white;
            border-radius: 6px;
            overflow: visible;
          }

          .bed {
            position: relative;
            display: flex;
            flex-direction: column;
            border: 1px solid rgba(0, 0, 0, 0.4);
            border-radius: 4px;
          }

          .bed-number {
            position: absolute;
            top: -20px;
            width: 100%;
            text-align: center;
            font-size: 12px;
            color: #666;
          }

          .segment {
            width: 100%;
            border-bottom: 1px solid rgba(0, 0, 0, 0.4);
          }

          .segment:last-child {
            border-bottom: none;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }

          th {
            text-align: left;
            padding: 8px;
            background: hsl(40,40%,75%);
            border-bottom: 2px solid #666;
            font-weight: 500;
            color: #1a1a1a;
          }

          td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
          }

          tr:nth-child(even) {
            background: #f5f5f5;
          }

          .empty-bed {
            color: #666;
            font-style: italic;
          }

          .table-container {
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="title">Gartenübersicht Stiftsgarten Gurk - Bewirtschaftungsjahr ${new Date().getFullYear()}</div>
        
        ${generateVisualization(beds, bedMap, segmentsByBed, herbMap)}
        ${generateTableView(beds, bedMap, segmentsByBed, herbMap)}
      </body>
    </html>
  `;

  return { htmlContent };
};

const generateVisualization = (
  beds: BaseBed[],
  bedMap: Map<number, BaseBed>,
  segmentsByBed: Map<string, KombinationsbeetSegment[]>,
  herbMap: Map<string, HerbVariety>
): string => {
  const MAX_BED_NUMBER = 50;
  let html = `
    <div class="visualization-container">
      <div class="visualization-title">Beetvisualisierung</div>
      <div class="beds-container">
  `;

  // Alle möglichen Beetpositionen durchgehen
  for (let i = 1; i <= MAX_BED_NUMBER; i++) {
    const bed = bedMap.get(i);
    
    if (!bed) {
      // Leere Position mit Standardbreite
      html += `
        <div class="bed" style="flex: 0 0 ${REFERENCE_WIDTH_UNOCCUPIED_M * PIXELS_PER_METER}px;">
          <div class="bed-number">${i}</div>
          <div style="flex-grow: 1; background-color: ${UNOCCUPIED_BED_COLOR};"></div>
        </div>
      `;
      continue;
    }

    const width = bed.width * PIXELS_PER_METER;
    
    if (bed.type === 'Kombinationsbeet') {
      const segments = segmentsByBed.get(bed.id) || [];
      const totalLength = bed.length || 0;

      html += `
        <div class="bed" style="flex: 0 0 ${width}px;">
          <div class="bed-number">${i}</div>
          ${segments.map(segment => {
            const herb = herbMap.get(segment.herbVarietyId);
            const heightPercent = (segment.segmentLength / totalLength) * 100;
            return `
              <div class="segment" 
                   style="flex: 0 0 ${heightPercent}%; background-color: ${herb?.color || DEFAULT_SEGMENT_COLOR};"
                   title="${herb?.name || 'Unbekannt'} - ${segment.segmentLength}m">
              </div>
            `;
          }).join('')}
          ${totalLength > 0 && segments.reduce((sum, s) => sum + (s.segmentLength || 0), 0) < totalLength ? `
            <div class="segment" 
                 style="flex: 1; background-color: ${UNOCCUPIED_SEGMENT_COLOR};"
                 title="Unbelegt">
            </div>
          ` : ''}
        </div>
      `;
    } else {
      const standardBed = bed as StandardBed;
      const herb = herbMap.get(standardBed.herbVarietyId);
      html += `
        <div class="bed" 
             style="flex: 0 0 ${width}px; background-color: ${herb?.color || DEFAULT_SEGMENT_COLOR};"
             title="${herb?.name || 'Unbekannt'}">
          <div class="bed-number">${i}</div>
        </div>
      `;
    }
  }

  html += `
      </div>
    </div>
  `;
  
  return html;
}

const generateTableView = (
  beds: BaseBed[],
  bedMap: Map<number, BaseBed>,
  segmentsByBed: Map<string, KombinationsbeetSegment[]>,
  herbMap: Map<string, HerbVariety>
): string => {
  const MAX_BED_NUMBER = 50;
  
  let html = `
    <div class="table-container">
      <div class="visualization-title">Beetübersicht</div>
      <table>
        <thead>
          <tr>
            <th>Nr.</th>
            <th>Typ</th>
            <th>Breite</th>
            <th>Sorte</th>
            <th>Pflanz-datum</th>
            <th>Alter</th>
            <th>Pflanzen bei Besatz</th>
            <th>Pflanzen aktuell</th>
            <th>Bemerkungen</th>
          </tr>
        </thead>
        <tbody>
  `;

  for (let i = 1; i <= MAX_BED_NUMBER; i++) {
    const bed = bedMap.get(i);
    
    if (!bed) {
      html += `
        <tr>
          <td>${i}</td>
          <td colspan="8" class="empty-bed">Position ${i} unbelegt</td>
        </tr>
      `;
      continue;
    }

    if (bed.type === 'Kombinationsbeet') {
      const kombinationsbeet = bed as Kombinationsbeet;
      const segments = segmentsByBed.get(bed.id) || [];
      const herbNames = segments
        .map(s => herbMap.get(s.herbVarietyId)?.name || 'Unbekannt')
        .join(', ');
      
      const totalInitialPlants = segments.reduce((sum, segment) => {
        return sum + Math.floor((segment.segmentLength || 0) * (segment.plantsPerMeter || 0));
      }, 0);

      const totalCurrentPlants = segments.reduce((sum, segment) => {
        const initial = Math.floor((segment.segmentLength || 0) * (segment.plantsPerMeter || 0));
        return sum + Math.floor(initial * ((segment.productivePlantsPercentage || 0) / 100));
      }, 0);

      html += `
        <tr>
          <td>${i}</td>
          <td>Kombinationsbeet</td>
          <td>${kombinationsbeet.width}m</td>
          <td>${herbNames}</td>
          <td>${segments[0]?.plantingDate || '-'}</td>
          <td>${calculateAge(segments[0]?.plantingDate)}</td>
          <td>${totalInitialPlants}</td>
          <td>${totalCurrentPlants}</td>
          <td>${kombinationsbeet.remarks || '-'}</td>
        </tr>
      `;
    } else {
      const standardBed = bed as StandardBed;
      const herb = herbMap.get(standardBed.herbVarietyId);
      const initialPlants = Math.floor((standardBed.length || 0) * (standardBed.plantsPerMeter || 0));
      const currentPlants = Math.floor(initialPlants * ((standardBed.productivePlantsPercentage || 0) / 100));

      html += `
        <tr>
          <td>${i}</td>
          <td>Standard</td>
          <td>${standardBed.width}m</td>
          <td>${herb?.name || 'Unbekannt'}</td>
          <td>${standardBed.plantingDate || '-'}</td>
          <td>${calculateAge(standardBed.plantingDate)}</td>
          <td>${initialPlants}</td>
          <td>${currentPlants}</td>
          <td>${standardBed.remarks || '-'}</td>
        </tr>
      `;
    }
  }

  html += `
        </tbody>
      </table>
    </div>
  `;
  
  return html;
};

const calculateAge = (plantingDate: string | undefined): string => {
  if (!plantingDate) return '-';
  const plantYear = new Date(plantingDate).getFullYear();
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - plantYear);
  return age === 1 ? '1 Jahr' : `${age} Jahre`;
};
