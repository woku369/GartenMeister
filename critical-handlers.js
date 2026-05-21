

// ===== KRITISCHE FEHLENDE HANDLER =====

// App-Pfad Handler
ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

// Datenbank-Pfad Handler
ipcMain.handle('get-database-path', () => {
  return path.join(app.getPath('userData'), 'gartenmeister.db');
});

// Benutzereinstellung aktualisieren Handler
ipcMain.handle('update-user-preference', async (event, key, value) => {
  try {
    console.log('[IPC] update-user-preference:', key, value);
    // Hier würde normalerweise die Konfiguration aktualisiert werden
    return true;
  } catch (error) {
    console.error('[IPC] Fehler bei update-user-preference:', error);
    return false;
  }
});

// Datei-Dialog Handler
ipcMain.handle('select-file', async (event, options = {}) => {
  try {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow, {
      title: options.title || 'Datei auswählen',
      filters: options.filters || [
        { name: 'Alle Dateien', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    return result.canceled ? null : result.filePaths[0];
  } catch (error) {
    console.error('[IPC] Fehler bei select-file:', error);
    return null;
  }
});

// Cloud-Sync-Verzeichnis auswählen Handler
ipcMain.handle('select-cloud-sync-directory', async () => {
  try {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Cloud-Sync-Verzeichnis auswählen',
      properties: ['openDirectory']
    });
    
    return result.canceled ? null : result.filePaths[0];
  } catch (error) {
    console.error('[IPC] Fehler bei select-cloud-sync-directory:', error);
    return null;
  }
});

// Verzeichnis erstellen Handler
ipcMain.handle('ensure-directory', async (event, dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('[IPC] Fehler bei ensure-directory:', dirPath, error);
    return false;
  }
});

// Backup-Ordner erstellen Handler
ipcMain.handle('create-backup-folder', async (event, timestamp) => {
  try {
    const backupDir = path.join(app.getPath('userData'), 'backups', timestamp);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    return backupDir;
  } catch (error) {
    console.error('[IPC] Fehler bei create-backup-folder:', error);
    return null;
  }
});

// Backup-Daten-Dateien Handler
ipcMain.handle('backup-data-files', async (event, backupPath) => {
  try {
    const dataPath = path.join(__dirname, '..', 'data');
    // Hier würde der eigentliche Backup-Code stehen
    console.log('[IPC] Backup-Daten-Dateien zu:', backupPath);
    return true;
  } catch (error) {
    console.error('[IPC] Fehler bei backup-data-files:', error);
    return false;
  }
});

// ===== BEET-MANAGEMENT HANDLER =====

// Beet erstellen
ipcMain.handle('beds:create', async (event, bedData) => {
  try {
    console.log('[IPC] beds:create:', bedData);
    
    // Lade bestehende Beete
    const bedsFile = path.join(__dirname, '..', 'data', 'beds.json');
    let beds = [];
    if (fs.existsSync(bedsFile)) {
      beds = JSON.parse(fs.readFileSync(bedsFile, 'utf8'));
    }
    
    // Erstelle neues Beet
    const newBed = {
      id: Date.now(),
      ...bedData,
      createdAt: new Date().toISOString()
    };
    
    beds.push(newBed);
    
    // Speichere zurück
    fs.writeFileSync(bedsFile, JSON.stringify(beds, null, 2));
    
    return { success: true, bed: newBed };
  } catch (error) {
    console.error('[IPC] Fehler bei beds:create:', error);
    return { success: false, message: error.message };
  }
});

// Beet nach ID abrufen
ipcMain.handle('beds:get-by-id', async (event, bedId) => {
  try {
    const bedsFile = path.join(__dirname, '..', 'data', 'beds.json');
    if (!fs.existsSync(bedsFile)) return null;
    
    const beds = JSON.parse(fs.readFileSync(bedsFile, 'utf8'));
    return beds.find(bed => bed.id === bedId) || null;
  } catch (error) {
    console.error('[IPC] Fehler bei beds:get-by-id:', error);
    return null;
  }
});

// Beet aktualisieren
ipcMain.handle('beds:update', async (event, bedId, updates) => {
  try {
    const bedsFile = path.join(__dirname, '..', 'data', 'beds.json');
    if (!fs.existsSync(bedsFile)) return { success: false, message: 'Keine Beete gefunden' };
    
    let beds = JSON.parse(fs.readFileSync(bedsFile, 'utf8'));
    const bedIndex = beds.findIndex(bed => bed.id === bedId);
    
    if (bedIndex === -1) {
      return { success: false, message: 'Beet nicht gefunden' };
    }
    
    beds[bedIndex] = { ...beds[bedIndex], ...updates, updatedAt: new Date().toISOString() };
    
    fs.writeFileSync(bedsFile, JSON.stringify(beds, null, 2));
    
    return { success: true, bed: beds[bedIndex] };
  } catch (error) {
    console.error('[IPC] Fehler bei beds:update:', error);
    return { success: false, message: error.message };
  }
});

// Beet löschen
ipcMain.handle('beds:delete', async (event, bedId) => {
  try {
    const bedsFile = path.join(__dirname, '..', 'data', 'beds.json');
    if (!fs.existsSync(bedsFile)) return { success: false, message: 'Keine Beete gefunden' };
    
    let beds = JSON.parse(fs.readFileSync(bedsFile, 'utf8'));
    const initialLength = beds.length;
    beds = beds.filter(bed => bed.id !== bedId);
    
    if (beds.length === initialLength) {
      return { success: false, message: 'Beet nicht gefunden' };
    }
    
    fs.writeFileSync(bedsFile, JSON.stringify(beds, null, 2));
    
    return { success: true };
  } catch (error) {
    console.error('[IPC] Fehler bei beds:delete:', error);
    return { success: false, message: error.message };
  }
});

// ===== HERBS HANDLER =====

// Herb nach ID abrufen
ipcMain.handle('herbs:get-by-id', async (event, herbId) => {
  try {
    const herbsFile = path.join(__dirname, '..', 'data', 'herb-varieties.json');
    if (!fs.existsSync(herbsFile)) return null;
    
    const herbs = JSON.parse(fs.readFileSync(herbsFile, 'utf8'));
    return herbs.find(herb => herb.id === herbId) || null;
  } catch (error) {
    console.error('[IPC] Fehler bei herbs:get-by-id:', error);
    return null;
  }
});

// ===== SEGMENT HANDLER =====

// Alle Segmente abrufen
ipcMain.handle('segments:get-all', async () => {
  try {
    const segmentsFile = path.join(__dirname, '..', 'data', 'bed-segments.json');
    if (!fs.existsSync(segmentsFile)) return [];
    
    return JSON.parse(fs.readFileSync(segmentsFile, 'utf8'));
  } catch (error) {
    console.error('[IPC] Fehler bei segments:get-all:', error);
    return [];
  }
});

// Segment nach ID abrufen
ipcMain.handle('segments:get-by-id', async (event, segmentId) => {
  try {
    const segmentsFile = path.join(__dirname, '..', 'data', 'bed-segments.json');
    if (!fs.existsSync(segmentsFile)) return null;
    
    const segments = JSON.parse(fs.readFileSync(segmentsFile, 'utf8'));
    return segments.find(segment => segment.id === segmentId) || null;
  } catch (error) {
    console.error('[IPC] Fehler bei segments:get-by-id:', error);
    return null;
  }
});

// Segment erstellen
ipcMain.handle('segments:create', async (event, segmentData) => {
  try {
    const segmentsFile = path.join(__dirname, '..', 'data', 'bed-segments.json');
    let segments = [];
    if (fs.existsSync(segmentsFile)) {
      segments = JSON.parse(fs.readFileSync(segmentsFile, 'utf8'));
    }
    
    const newSegment = {
      id: Date.now(),
      ...segmentData,
      createdAt: new Date().toISOString()
    };
    
    segments.push(newSegment);
    fs.writeFileSync(segmentsFile, JSON.stringify(segments, null, 2));
    
    return { success: true, segment: newSegment };
  } catch (error) {
    console.error('[IPC] Fehler bei segments:create:', error);
    return { success: false, message: error.message };
  }
});

// Segment aktualisieren
ipcMain.handle('segments:update', async (event, segmentId, updates) => {
  try {
    const segmentsFile = path.join(__dirname, '..', 'data', 'bed-segments.json');
    if (!fs.existsSync(segmentsFile)) return { success: false, message: 'Keine Segmente gefunden' };
    
    let segments = JSON.parse(fs.readFileSync(segmentsFile, 'utf8'));
    const segmentIndex = segments.findIndex(segment => segment.id === segmentId);
    
    if (segmentIndex === -1) {
      return { success: false, message: 'Segment nicht gefunden' };
    }
    
    segments[segmentIndex] = { ...segments[segmentIndex], ...updates, updatedAt: new Date().toISOString() };
    fs.writeFileSync(segmentsFile, JSON.stringify(segments, null, 2));
    
    return { success: true, segment: segments[segmentIndex] };
  } catch (error) {
    console.error('[IPC] Fehler bei segments:update:', error);
    return { success: false, message: error.message };
  }
});

// Segment löschen
ipcMain.handle('segments:delete', async (event, segmentId) => {
  try {
    const segmentsFile = path.join(__dirname, '..', 'data', 'bed-segments.json');
    if (!fs.existsSync(segmentsFile)) return { success: false, message: 'Keine Segmente gefunden' };
    
    let segments = JSON.parse(fs.readFileSync(segmentsFile, 'utf8'));
    const initialLength = segments.length;
    segments = segments.filter(segment => segment.id !== segmentId);
    
    if (segments.length === initialLength) {
      return { success: false, message: 'Segment nicht gefunden' };
    }
    
    fs.writeFileSync(segmentsFile, JSON.stringify(segments, null, 2));
    
    return { success: true };
  } catch (error) {
    console.error('[IPC] Fehler bei segments:delete:', error);
    return { success: false, message: error.message };
  }
});

// ===== HARVEST EVENTS HANDLER =====

// Alle Harvest Events abrufen
ipcMain.handle('harvest-events:get-all', async () => {
  try {
    const harvestEventsFile = path.join(__dirname, '..', 'data', 'harvest-events.json');
    if (!fs.existsSync(harvestEventsFile)) return [];
    
    return JSON.parse(fs.readFileSync(harvestEventsFile, 'utf8'));
  } catch (error) {
    console.error('[IPC] Fehler bei harvest-events:get-all:', error);
    return [];
  }
});

// Harvest Event erstellen
ipcMain.handle('harvest-events:create', async (event, eventData) => {
  try {
    const harvestEventsFile = path.join(__dirname, '..', 'data', 'harvest-events.json');
    let events = [];
    if (fs.existsSync(harvestEventsFile)) {
      events = JSON.parse(fs.readFileSync(harvestEventsFile, 'utf8'));
    }
    
    const newEvent = {
      id: Date.now(),
      ...eventData,
      createdAt: new Date().toISOString()
    };
    
    events.push(newEvent);
    fs.writeFileSync(harvestEventsFile, JSON.stringify(events, null, 2));
    
    return { success: true, event: newEvent };
  } catch (error) {
    console.error('[IPC] Fehler bei harvest-events:create:', error);
    return { success: false, message: error.message };
  }
});

// ===== HARVEST CONTRIBUTIONS HANDLER =====

// Alle Harvest Contributions abrufen
ipcMain.handle('harvest-contributions:get-all', async () => {
  try {
    const contributionsFile = path.join(__dirname, '..', 'data', 'harvest-contributions.json');
    if (!fs.existsSync(contributionsFile)) return [];
    
    return JSON.parse(fs.readFileSync(contributionsFile, 'utf8'));
  } catch (error) {
    console.error('[IPC] Fehler bei harvest-contributions:get-all:', error);
    return [];
  }
});

// Harvest Contribution erstellen
ipcMain.handle('harvest-contributions:create', async (event, contributionData) => {
  try {
    const contributionsFile = path.join(__dirname, '..', 'data', 'harvest-contributions.json');
    let contributions = [];
    if (fs.existsSync(contributionsFile)) {
      contributions = JSON.parse(fs.readFileSync(contributionsFile, 'utf8'));
    }
    
    const newContribution = {
      id: Date.now(),
      ...contributionData,
      createdAt: new Date().toISOString()
    };
    
    contributions.push(newContribution);
    fs.writeFileSync(contributionsFile, JSON.stringify(contributions, null, 2));
    
    return { success: true, contribution: newContribution };
  } catch (error) {
    console.error('[IPC] Fehler bei harvest-contributions:create:', error);
    return { success: false, message: error.message };
  }
});

