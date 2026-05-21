const { app, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

// Funktion zum Korrigieren der Ernte-Daten
async function fixHarvestData() {
  try {
    // Verwende den korrekten GartenMeister-Pfad
    const dataFilePath = 'C:\\Users\\wolfg\\AppData\\Roaming\\GartenMeister\\data\\app-data.json';
    
    if (!fs.existsSync(dataFilePath)) {
      console.error('Datei nicht gefunden:', dataFilePath);
      return;
    }
    
    console.log('Lade Daten von:', dataFilePath);
    const jsonData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    
    // Finde die vorhandene Ernte (harvest-1754425736667)
    const harvestIndex = jsonData.harvestEvents.findIndex(h => h.id === 'harvest-1754425736667');
    if (harvestIndex === -1) {
      console.error('Ernte harvest-1754425736667 nicht gefunden');
      return;
    }
    
    console.log('Gefundene Ernte:', jsonData.harvestEvents[harvestIndex]);
    
    // Erweitere die Ernte mit den korrekten Daten
    jsonData.harvestEvents[harvestIndex] = {
      ...jsonData.harvestEvents[harvestIndex],
      isFinalized: true,
      totalWeight: 99, // 99kg Thymian
      harvestDateEnd: '2025-08-05'
    };
    
    // Füge die Contributions hinzu
    if (!jsonData.harvestContributions) {
      jsonData.harvestContributions = [];
    }
    
    // Lösche alte Contributions für diese Ernte (falls vorhanden)
    jsonData.harvestContributions = jsonData.harvestContributions.filter(c => c.harvestEventId !== 'harvest-1754425736667');
    
    // Füge die Contributions hinzu (ohne individuelle Gewichte pro Beet)
    const contributions = [
      {
        id: 'contribution-beet7-thymian',
        harvestEventId: 'harvest-1754425736667',
        bedId: 'bed-7',
        segmentId: null,
        weight: 0, // Kein individuelles Gewicht pro Beet
        productivePlantsPercentageAtHarvestTime: 70,
        notes: 'Beet 7 - Teil der Thymian-Ernte'
      },
      {
        id: 'contribution-beet18-thymian',
        harvestEventId: 'harvest-1754425736667',
        bedId: 'bed-18',
        segmentId: null,
        weight: 0, // Kein individuelles Gewicht pro Beet
        productivePlantsPercentageAtHarvestTime: 95,
        notes: 'Beet 18 - Teil der Thymian-Ernte'
      }
    ];
    
    jsonData.harvestContributions.push(...contributions);
    
    // Speichere die aktualisierten Daten
    fs.writeFileSync(dataFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log('Ernte-Daten erfolgreich korrigiert!');
    console.log('Aktualisierte Ernte:', jsonData.harvestEvents[harvestIndex]);
    console.log('Hinzugefügte Contributions:', contributions.length);
    
  } catch (error) {
    console.error('Fehler beim Korrigieren der Ernte-Daten:', error);
  }
}

// Starte die App und führe die Korrektur durch
app.whenReady().then(() => {
  fixHarvestData().then(() => {
    console.log('Korrektur abgeschlossen, beende App...');
    app.quit();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
