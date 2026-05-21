import React from 'react';
import { BaseBed, KombinationsbeetSegment, HerbVariety, StandardBed, Kombinationsbeet } from '../../lib/definitions';

// Konstanten aus der UI übernehmen
const REFERENCE_WIDTH_UNOCCUPIED_M = 1.5;
const REFERENCE_WIDTH_UNOCCUPIED_PX = 48;
const PIXELS_PER_METER = REFERENCE_WIDTH_UNOCCUPIED_PX / REFERENCE_WIDTH_UNOCCUPIED_M;
const DEFAULT_SEGMENT_COLOR = 'rgba(220, 220, 220, 0.8)';
const UNOCCUPIED_BED_COLOR = '#f8f9fa';

interface PDFGardenVisualizationProps {
  beds: BaseBed[];
  segments: KombinationsbeetSegment[];
  herbVarieties: HerbVariety[];
}

export const PDFGardenVisualization: React.FC<PDFGardenVisualizationProps> = ({
  beds,
  segments,
  herbVarieties
}) => {
  const herbMap = new Map(herbVarieties.map(herb => [herb.id, herb]));
  
  const renderBed = (bed: BaseBed) => {
    const bedWidth = bed.width * PIXELS_PER_METER;
    const bedHeight = 200; // Feste Höhe für PDF
    
    if (bed.type === 'Kombinationsbeet') {
      const kombinationsbeet = bed as Kombinationsbeet;
      const bedSegments = segments.filter(s => s.bedId === bed.id);
      const totalLength = kombinationsbeet.length || 0;
      
      return (
        <div
          key={bed.id}
          style={{
            width: `${bedWidth}px`,
            height: `${bedHeight}px`,
            position: 'relative',
            border: '1px solid rgba(0, 0, 0, 0.4)',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Beet-Nummer */}
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              width: '100%',
              textAlign: 'center',
              fontSize: '12px',
              color: '#666',
              fontWeight: '500'
            }}
          >
            {bed.bedNumber}
          </div>
          
          {/* Segmente */}
          {bedSegments.map((segment, index) => {
            const segmentHeight = (segment.segmentLength / totalLength) * bedHeight;
            const herb = herbMap.get(segment.herbVarietyId);
            
            return (
              <div
                key={segment.id}
                style={{
                  height: `${segmentHeight}px`,
                  backgroundColor: herb?.color || DEFAULT_SEGMENT_COLOR,
                  borderBottom: index < bedSegments.length - 1 ? '1px solid rgba(0,0,0,0.2)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: '#333',
                  padding: '2px'
                }}
              >
                {herb?.name && segmentHeight > 20 && (
                  <span style={{ textAlign: 'center', lineHeight: '1.2' }}>
                    {herb.name}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      );
    } else {
      // Standard-, Blühstreifen-, Brachflächen-Beete
      const standardBed = bed as StandardBed;
      const herb = herbMap.get(standardBed.herbVarietyId || '');
      
      return (
        <div
          key={bed.id}
          style={{
            width: `${bedWidth}px`,
            height: `${bedHeight}px`,
            position: 'relative',
            backgroundColor: herb?.color || bed.color || UNOCCUPIED_BED_COLOR,
            border: '1px solid rgba(0, 0, 0, 0.4)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Beet-Nummer */}
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              width: '100%',
              textAlign: 'center',
              fontSize: '12px',
              color: '#666',
              fontWeight: '500'
            }}
          >
            {bed.bedNumber}
          </div>
          
          {/* Beet-Inhalt */}
          <div style={{ textAlign: 'center', padding: '4px' }}>
            <div style={{ fontSize: '11px', fontWeight: '500' }}>
              {herb?.name || bed.type}
            </div>
            {bed.length && (
              <div style={{ fontSize: '9px', color: '#666' }}>
                {bed.length}m × {bed.width}m
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div style={{ marginBottom: '30px' }}>
      <h2 style={{ 
        fontSize: '18px', 
        fontWeight: '500', 
        marginBottom: '15px',
        color: '#1a1a1a'
      }}>
        Beetvisualisierung
      </h2>
      
      <div style={{
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <div style={{
          display: 'flex',
          gap: '6px',
          minHeight: '240px',
          padding: '12px',
          backgroundColor: 'white',
          borderRadius: '6px',
          alignItems: 'flex-end',
          flexWrap: 'wrap'
        }}>
          {beds
            .sort((a, b) => a.bedNumber - b.bedNumber)
            .map(renderBed)}
        </div>
      </div>
    </div>
  );
};

interface PDFTableProps {
  beds: BaseBed[];
  segments: KombinationsbeetSegment[];
  herbVarieties: HerbVariety[];
}

export const PDFBedTable: React.FC<PDFTableProps> = ({ beds, segments, herbVarieties }) => {
  const herbMap = new Map(herbVarieties.map(herb => [herb.id, herb]));
  
  const calculatePlantAge = (plantingDate: string): number => {
    const plantYear = new Date(plantingDate).getFullYear();
    const currentYear = new Date().getFullYear();
    return Math.max(0, currentYear - plantYear);
  };

  const calculateInitialPlants = (entity: StandardBed | KombinationsbeetSegment): number => {
    const length = 'segmentLength' in entity ? entity.segmentLength : entity.length;
    return Math.floor((length || 0) * (entity.plantsPerMeter || 0));
  };

  const calculateCurrentPlants = (entity: StandardBed | KombinationsbeetSegment): number => {
    const initialPlants = calculateInitialPlants(entity);
    return Math.floor(initialPlants * ((entity.productivePlantsPercentage || 0) / 100));
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '10px',
    marginBottom: '20px'
  };

  const thStyle: React.CSSProperties = {
    backgroundColor: '#D4B851',
    color: 'white',
    padding: '8px 6px',
    textAlign: 'left',
    border: '1px solid #ccc',
    fontWeight: '500'
  };

  const tdStyle: React.CSSProperties = {
    padding: '6px',
    border: '1px solid #ccc',
    textAlign: 'left'
  };

  return (
    <div style={{ pageBreakInside: 'avoid' }}>
      <h3 style={{ 
        fontSize: '16px', 
        fontWeight: '500', 
        marginBottom: '15px',
        color: '#1a1a1a'
      }}>
        Beet-Details
      </h3>
      
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Nr.</th>
            <th style={thStyle}>Typ</th>
            <th style={thStyle}>Kräuterart</th>
            <th style={thStyle}>Sorte</th>
            <th style={thStyle}>Größe</th>
            <th style={thStyle}>Alter</th>
            <th style={thStyle}>Pfl./m</th>
            <th style={thStyle}>Ertrag %</th>
            <th style={thStyle}>Pflanzen</th>
            <th style={thStyle}>Bemerkungen</th>
          </tr>
        </thead>
        <tbody>
          {beds
            .sort((a, b) => a.bedNumber - b.bedNumber)
            .map(bed => {
              if (bed.type === 'Kombinationsbeet') {
                const kombinationsbeet = bed as Kombinationsbeet;
                const bedSegments = segments.filter(s => s.bedId === bed.id);
                
                return bedSegments.map((segment, index) => {
                  const herb = herbMap.get(segment.herbVarietyId);
                  const initialPlants = calculateInitialPlants(segment);
                  const currentPlants = calculateCurrentPlants(segment);
                  
                  return (
                    <tr key={`${bed.id}-${segment.id}`}>
                      <td style={tdStyle}>
                        {index === 0 ? bed.bedNumber : ''}
                      </td>
                      <td style={tdStyle}>
                        {index === 0 ? 'Kombinationsbeet' : ''}
                      </td>
                      <td style={tdStyle}>{herb?.name || '-'}</td>
                      <td style={tdStyle}>{segment.subVarietyName || '-'}</td>
                      <td style={tdStyle}>
                        {segment.segmentLength}m × {bed.width}m
                      </td>
                      <td style={tdStyle}>
                        {calculatePlantAge(segment.plantingDate)} Jahre
                      </td>
                      <td style={tdStyle}>{segment.plantsPerMeter || '-'}</td>
                      <td style={tdStyle}>{segment.productivePlantsPercentage || '-'}%</td>
                      <td style={tdStyle}>
                        {currentPlants > 0 ? `${currentPlants}/${initialPlants}` : '-'}
                      </td>
                      <td style={tdStyle}>{segment.remarks || '-'}</td>
                    </tr>
                  );
                });
              } else {
                const standardBed = bed as StandardBed;
                const herb = herbMap.get(standardBed.herbVarietyId || '');
                const initialPlants = calculateInitialPlants(standardBed);
                const currentPlants = calculateCurrentPlants(standardBed);
                
                return (
                  <tr key={bed.id}>
                    <td style={tdStyle}>{bed.bedNumber}</td>
                    <td style={tdStyle}>{bed.type}</td>
                    <td style={tdStyle}>{herb?.name || '-'}</td>
                    <td style={tdStyle}>{standardBed.subVarietyName || '-'}</td>
                    <td style={tdStyle}>
                      {bed.length ? `${bed.length}m × ${bed.width}m` : `${bed.width}m breit`}
                    </td>
                    <td style={tdStyle}>
                      {calculatePlantAge(bed.plantingDate)} Jahre
                    </td>
                    <td style={tdStyle}>{standardBed.plantsPerMeter || '-'}</td>
                    <td style={tdStyle}>{standardBed.productivePlantsPercentage || '-'}%</td>
                    <td style={tdStyle}>
                      {currentPlants > 0 ? `${currentPlants}/${initialPlants}` : '-'}
                    </td>
                    <td style={tdStyle}>{bed.remarks || '-'}</td>
                  </tr>
                );
              }
            })}
        </tbody>
      </table>
    </div>
  );
};

interface PDFGardenLayoutProps {
  beds: BaseBed[];
  segments: KombinationsbeetSegment[];
  herbVarieties: HerbVariety[];
  title?: string;
}

export const PDFGardenLayout: React.FC<PDFGardenLayoutProps> = ({
  beds,
  segments,
  herbVarieties,
  title = 'Gartenübersicht'
}) => {
  const currentYear = new Date().getFullYear();
  const exportDate = new Date().toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px',
      backgroundColor: 'white',
      color: '#1a1a1a',
      lineHeight: '1.4'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        borderBottom: '2px solid #D4B851',
        paddingBottom: '15px'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#1a1a1a',
          margin: '0'
        }}>
          {title} - Bewirtschaftungsjahr {currentYear}
        </h1>
        <div style={{
          fontSize: '14px',
          color: '#666',
          textAlign: 'right'
        }}>
          <div>Exportiert am</div>
          <div style={{ fontWeight: '500' }}>{exportDate}</div>
        </div>
      </div>

      {/* Visualisierung */}
      <PDFGardenVisualization 
        beds={beds}
        segments={segments}
        herbVarieties={herbVarieties}
      />

      {/* Tabelle */}
      <PDFBedTable 
        beds={beds}
        segments={segments}
        herbVarieties={herbVarieties}
      />

      {/* Zusammenfassung */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        fontSize: '12px'
      }}>
        <h3 style={{ fontSize: '14px', marginBottom: '10px', color: '#1a1a1a' }}>
          Zusammenfassung
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
          <div>
            <strong>Anzahl Beete:</strong> {beds.length}
          </div>
          <div>
            <strong>Kräutersorten:</strong> {new Set(herbVarieties.map(h => h.id)).size}
          </div>
          <div>
            <strong>Versuchssegmente:</strong> {segments.length}
          </div>
        </div>
      </div>
    </div>
  );
};
