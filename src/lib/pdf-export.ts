import type { Bed, StandardBed, KombinationsbeetSegment, HerbVariety, GartenConfiguration } from '@/lib/definitions';

// Dynamischer PDF-Import um Font-Probleme zu vermeiden
async function initializePdfMake() {
  const pdfMake = await import('pdfmake/build/pdfmake');
  const pdfFonts = await import('pdfmake/build/vfs_fonts');
  
  // Fonts registrieren - verschiedene Varianten probieren
  try {
    if (pdfFonts.default && pdfFonts.default.pdfMake && pdfFonts.default.pdfMake.vfs) {
      (pdfMake.default as any).vfs = pdfFonts.default.pdfMake.vfs;
    } else if (pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
      (pdfMake.default as any).vfs = pdfFonts.pdfMake.vfs;
    } else {
      // Fallback - verwende pdfFonts direkt
      (pdfMake.default as any).vfs = pdfFonts.default || pdfFonts;
    }
  } catch (error) {
    console.warn('Font-Loading-Problem, verwende Standard-Fonts:', error);
  }
  
  return pdfMake.default;
}

export async function generateGardenPDF(
  beds: Bed[], 
  segments: KombinationsbeetSegment[], 
  herbVarieties: HerbVariety[], 
  config: GartenConfiguration | null
) {
  // PDF-Make dynamisch initialisieren
  const pdfMake = await initializePdfMake();
  
  const currentDate = new Date().toLocaleDateString('de-DE');
  
  // Helper-Funktionen
  const getHerbName = (herbId: string): string => {
    return herbVarieties.find(h => h.id === herbId)?.name || 'Unbekannt';
  };

  const getHerbColor = (herbId: string): string => {
    return herbVarieties.find(h => h.id === herbId)?.color || '#cccccc';
  };

  // Beetvisualisierung erstellen (vereinfacht für bessere PDF-Kompatibilität)
  const createGardenVisualization = () => {
    const maxBeds = config?.currentBeetCount || 20;
    const beetsPerRow = 10; // 10 Beete pro Zeile für bessere Darstellung
    const visualizationRows: any[] = [];
    
    // Header für Visualisierung
    visualizationRows.push([
      { text: 'Beetvisualisierung - Gartenplan', colSpan: beetsPerRow, alignment: 'center', style: 'visualHeader' },
      ...Array(beetsPerRow - 1).fill({})
    ]);
    
    // Beete in Zeilen organisieren
    for (let row = 0; row * beetsPerRow < maxBeds; row++) {
      const rowCells: any[] = [];
      
      for (let col = 0; col < beetsPerRow; col++) {
        const bedNumber = row * beetsPerRow + col + 1;
        
        if (bedNumber <= maxBeds) {
          const bed = beds.find(b => b.bedNumber === bedNumber);
          const isOccupied = !!bed;
          
          let bedColor = '#f0f0f0'; // Leer (hellgrau)
          let cellText = `${bedNumber}\n\nleer`;
          
          if (isOccupied && bed) {
            if (bed.type === 'Standard') {
              const standardBed = bed as StandardBed;
              bedColor = bed.color || getHerbColor(standardBed.herbVarietyId) || '#90EE90';
              const herbName = getHerbName(standardBed.herbVarietyId);
              const shortName = herbName.length > 12 ? herbName.substring(0, 12) + '...' : herbName;
              cellText = `${bedNumber}\n\n${shortName}`;
            } else if (bed.type === 'Kombinationsbeet') {
              const bedSegments = segments.filter(s => s.bedId === bed.id);
              if (bedSegments.length > 0) {
                bedColor = getHerbColor(bedSegments[0].herbVarietyId) || '#FFB347';
              }
              cellText = `${bedNumber}\n\nVersuch`;
            }
          }
          
          rowCells.push({
            text: cellText,
            fillColor: bedColor,
            alignment: 'center',
            style: 'bedCell'
          });
        } else {
          // Leere Zelle für unvollständige Zeilen
          rowCells.push({ text: '', border: [false, false, false, false] });
        }
      }
      
      visualizationRows.push(rowCells);
    }
    
    return {
      table: {
        headerRows: 1,
        widths: Array(beetsPerRow).fill('*'),
        body: visualizationRows
      },
      layout: {
        paddingLeft: () => 3,
        paddingRight: () => 3,
        paddingTop: () => 3,
        paddingBottom: () => 3
      },
      margin: [0, 0, 0, 15]
    };
  };

  // Tabelle für alle Beetpositionen erstellen
  const tableRows: any[] = [
    // Header
    [
      { text: 'Nr.', style: 'tableHeader' },
      { text: 'Typ', style: 'tableHeader' },
      { text: 'Breite', style: 'tableHeader' },
      { text: 'Länge', style: 'tableHeader' },
      { text: 'Kraut/Sorte', style: 'tableHeader' },
      { text: 'Pflanzdatum', style: 'tableHeader' },
      { text: 'Pflanzen', style: 'tableHeader' },
      { text: 'Bemerkungen', style: 'tableHeader' }
    ]
  ];

  // Alle 20 Beetpositionen durchgehen
  for (let slotNumber = 1; slotNumber <= (config?.currentBeetCount || 20); slotNumber++) {
    const bed = beds.find(b => b.bedNumber === slotNumber);
    
    if (!bed) {
      // Unbelegt
      tableRows.push([
        slotNumber.toString(),
        'unbelegt',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-'
      ]);
    } else {
      // Beet ist belegt
      let herbDetails = bed.type;
      let plantingDate = '-';
      let plantsInfo = '-';
      
      if (bed.type === 'Standard') {
        const standardBed = bed as StandardBed;
        const herbName = getHerbName(standardBed.herbVarietyId);
        const subVariety = standardBed.subVarietyName || '';
        herbDetails = `${herbName}${subVariety ? ` (${subVariety})` : ''}`;
        
        if (standardBed.plantingDate) {
          plantingDate = new Date(standardBed.plantingDate).toLocaleDateString('de-DE');
        }
        
        const totalPlants = Math.floor((standardBed.length || 0) * (standardBed.plantsPerMeter || 0));
        const currentPercent = standardBed.productivePlantsPercentage || 100;
        const currentPlants = Math.floor(totalPlants * (currentPercent / 100));
        plantsInfo = `${currentPlants}/${totalPlants} (${currentPercent}%)`;
      } else if (bed.type === 'Kombinationsbeet') {
        const bedSegments = segments.filter(s => s.bedId === bed.id);
        if (bedSegments.length > 0) {
          herbDetails = bedSegments.map(s => {
            const herbName = getHerbName(s.herbVarietyId);
            const subVariety = s.subVarietyName || '';
            return `${herbName}${subVariety ? ` (${subVariety})` : ''} ${s.segmentLength}m`;
          }).join(', ');
          
          const earliestDate = bedSegments.reduce((earliest: string | null, s) => {
            if (!s.plantingDate) return earliest;
            if (!earliest) return s.plantingDate;
            return new Date(s.plantingDate) < new Date(earliest) ? s.plantingDate : earliest;
          }, null);
          
          if (earliestDate) {
            plantingDate = new Date(earliestDate).toLocaleDateString('de-DE');
          }
          
          const totalInitial = bedSegments.reduce((sum, s) => {
            return sum + Math.floor((s.segmentLength || 0) * (s.plantsPerMeter || 0));
          }, 0);
          const totalCurrent = bedSegments.reduce((sum, s) => {
            const segmentPlants = Math.floor((s.segmentLength || 0) * (s.plantsPerMeter || 0));
            const productive = s.productivePlantsPercentage || 100;
            return sum + Math.floor(segmentPlants * (productive / 100));
          }, 0);
          
          plantsInfo = `${totalCurrent}/${totalInitial}`;
        }
      }
      
      tableRows.push([
        bed.bedNumber.toString(),
        bed.type,
        `${bed.width}m`,
        `${bed.length}m`,
        herbDetails,
        plantingDate,
        plantsInfo,
        bed.remarks || '-'
      ]);
    }
  }

  // PDF-Dokument definieren
  const docDefinition = {
    pageSize: 'A4',
    pageOrientation: 'landscape' as const,
    content: [
      // Header
      {
        text: 'GartenMeister - Gartenübersicht',
        style: 'header',
        alignment: 'center' as const
      },
      {
        text: `Erstellt am: ${currentDate}`,
        style: 'subheader',
        alignment: 'center' as const,
        margin: [0, 0, 0, 15]
      },
      
      // Zusammenfassung
      {
        text: `Übersicht: ${beds.length} von ${config?.currentBeetCount || 20} Beeten belegt`,
        style: 'summary',
        margin: [0, 0, 0, 15]
      },
      
      // Beetvisualisierung
      {
        text: 'Gartenplan Visualisierung',
        style: 'sectionHeader',
        margin: [0, 0, 0, 10]
      },
      createGardenVisualization(),
      
      // Legende für Visualisierung
      {
        text: 'Legende: Farbige Bereiche zeigen belegte Beete mit der entsprechenden Kräutersorte. Graue Bereiche sind leere Beetpositionen.',
        style: 'legend',
        margin: [0, 10, 0, 20]
      },
      
      // Tabelle
      {
        text: 'Detailübersicht aller Beetpositionen',
        style: 'sectionHeader',
        margin: [0, 0, 0, 10]
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto', 'auto', '*', 'auto', 'auto', '*'],
          body: tableRows
        },
        layout: {
          fillColor: function(rowIndex: number) {
            return rowIndex === 0 ? '#CCCCCC' : (rowIndex % 2 === 0 ? '#F5F5F5' : null);
          }
        }
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 12,
        italics: true
      },
      summary: {
        fontSize: 14,
        bold: true
      },
      sectionHeader: {
        fontSize: 14,
        bold: true,
        color: '#333333'
      },
      visualizationSubtitle: {
        fontSize: 11,
        italics: true,
        color: '#666666'
      },
      visualHeader: {
        fontSize: 12,
        bold: true,
        color: '#333333'
      },
      bedNumber: {
        fontSize: 10,
        bold: true
      },
      bedCell: {
        fontSize: 9,
        alignment: 'center'
      },
      bedInfo: {
        fontSize: 8,
        color: '#333333'
      },
      legend: {
        fontSize: 10,
        italics: true,
        color: '#666666'
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: 'black'
      }
    },
    defaultStyle: {
      fontSize: 9
    }
  };

  // PDF generieren und herunterladen
  const pdfDoc = pdfMake.createPdf(docDefinition);
  pdfDoc.download(`GartenMeister_Uebersicht_${new Date().toISOString().split('T')[0]}.pdf`);
}
