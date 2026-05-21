// Browser-kompatible PDF-Generierung mit jsPDF
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export async function generatePdfSimple(beds, segments, herbVarieties, gartenConfiguration) {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  
  // Titel hinzufügen
  doc.setFontSize(20);
  doc.text('Stiftsgarten Gurk - Gartenübersicht', 20, 20);
  
  const exportDate = new Date().toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  doc.setFontSize(12);
  doc.text(`Erstellt am: ${exportDate}`, 20, 30);
  
  // Statistiken
  const totalBeds = beds ? beds.length : 0;
  const currentBeetCount = gartenConfiguration?.currentBeetCount || 20;
  
  doc.setFontSize(14);
  doc.text(`Beete: ${totalBeds} von ${currentBeetCount} belegt`, 20, 45);
  
  // Tabelle mit Beetdaten
  const tableData = [];
  
  // Alle Positionen 1-20 durchlaufen
  for (let i = 1; i <= currentBeetCount; i++) {
    const bed = beds?.find(b => b.bedNumber === i);
    
    if (bed) {
      // Beet belegt
      const herbName = herbVarieties?.find(h => h.id === bed.herbVarietyId)?.name || 'Unbekannt';
      const plantingDate = bed.plantingDate ? new Date(bed.plantingDate).toLocaleDateString('de-DE') : '-';
      const ageInDays = bed.plantingDate ? 
        Math.floor((new Date().getTime() - new Date(bed.plantingDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const age = ageInDays > 0 ? `${ageInDays} Tage` : '-';
      
      tableData.push([
        i.toString(),
        bed.type || 'Standard',
        `${bed.bedWidth || bed.width || 0}m`,
        herbName,
        plantingDate,
        age,
        (bed.numberOfPlants || 0).toString(),
        bed.remarks || '-'
      ]);
    } else {
      // Position frei
      tableData.push([
        i.toString(),
        'frei',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-'
      ]);
    }
  }
  
  // Tabelle erstellen
  doc.autoTable({
    head: [['Nr.', 'Typ', 'Breite', 'Sorte', 'Pflanzung', 'Alter', 'Pflanzen', 'Bemerkungen']],
    body: tableData,
    startY: 55,
    styles: {
      fontSize: 8,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [180, 160, 120], // Braun-beige Farbe
      textColor: [60, 60, 60],
      fontSize: 9,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { cellWidth: 25 },
      2: { halign: 'center', cellWidth: 20 },
      3: { cellWidth: 40 },
      4: { halign: 'center', cellWidth: 25 },
      5: { halign: 'center', cellWidth: 25 },
      6: { halign: 'center', cellWidth: 20 },
      7: { cellWidth: 50 }
    }
  });
  
  // PDF speichern
  const filename = `Gartenübersicht_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
  
  return filename;
}

export default { generatePdfSimple };
