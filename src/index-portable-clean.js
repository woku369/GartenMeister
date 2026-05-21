/**
 * Portable EXE Version - Mit Next.js Static Export
 * Einfache, funktionierende Version ohne komplexe HTTP-Server
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// ========================================
// IPC HANDLERS FÜR DATENPERSISTENZ
// ========================================

// Datei-Pfad Generierung
ipcMain.handle('get-data-file-path', (event, filename) => {
  try {
    const userDataPath = app.getPath('userData');
    const dataDir = path.join(userDataPath, 'data');
    
    // Stelle sicher, dass data/ Verzeichnis existiert
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const filePath = path.join(dataDir, filename);
    console.log(`[IPC] Datei-Pfad generiert: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`[IPC] Fehler beim Generieren des Dateipfads für ${filename}:`, error);
    throw error;
  }
});

// Datei-Existenz prüfen
ipcMain.handle('file-exists', (event, filePath) => {
  try {
    if (!filePath) return false;
    const exists = fs.existsSync(filePath);
    console.log(`[IPC] Datei-Existenz prüfen: ${filePath} -> ${exists}`);
    return exists;
  } catch (error) {
    console.error(`[IPC] Fehler beim Prüfen der Datei-Existenz von ${filePath}:`, error);
    return false;
  }
});

// Datei lesen
ipcMain.handle('read-file', (event, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      console.log(`[IPC] Datei nicht gefunden: ${filePath}`);
      return null;
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    console.log(`[IPC] Datei gelesen: ${filePath} (${data.length} Zeichen)`);
    return data;
  } catch (error) {
    console.error(`[IPC] Fehler beim Lesen der Datei ${filePath}:`, error);
    return null;
  }
});

// Datei schreiben
ipcMain.handle('write-file', (event, filePath, data) => {
  try {
    if (!filePath) {
      throw new Error('Kein Dateipfad angegeben');
    }
    
    // Stelle sicher, dass das Verzeichnis existiert
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, data, 'utf8');
    console.log(`[IPC] Datei geschrieben: ${filePath} (${data.length} Zeichen)`);
    return true;
  } catch (error) {
    console.error(`[IPC] Fehler beim Schreiben der Datei ${filePath}:`, error);
    throw error;
  }
});

// Benutzer-Daten Handler
ipcMain.handle('users:get-all', async () => {
  try {
    console.log('[IPC] users:get-all aufgerufen');
    // Mock-Daten für Benutzer
    return [
      { id: '1', name: 'Haupt-Gärtner', email: 'gaertner@example.com', role: 'admin' }
    ];
  } catch (error) {
    console.error('[IPC] Fehler bei users:get-all:', error);
    return [];
  }
});

// PDF-Export Handler
ipcMain.handle('export-pdf', async (event, data) => {
  try {
    console.log('[IPC] export-pdf aufgerufen mit Daten:', data);
    // Simuliere PDF-Export
    return { success: true, message: 'PDF erfolgreich exportiert (Simuliert)' };
  } catch (error) {
    console.error('[IPC] Fehler bei PDF-Export:', error);
    return { success: false, message: error.message };
  }
});

// Navigation Handler
ipcMain.handle('navigate-to', async (event, route) => {
  try {
    console.log(`[IPC] Navigation zu: ${route}`);
    
    // Route-Mapping für statische HTML-Dateien
    const routeMap = {
      '/': 'index.html',
      '/dashboard': 'dashboard/index.html',
      '/beds': 'index.html', // Weiterleitung zur Hauptseite mit Beeten
      '/herbs': 'herbs/index.html',
      '/routines': 'routines/index.html',
      '/reports': 'reports/index.html',
      '/gallery': 'gallery/index.html',
      '/settings': 'settings/index.html',
      '/help': 'help/index.html',
      '/users': 'users/index.html',
      '/weather': 'weather/index.html'
    };

    // Dynamische Routen
    if (route.startsWith('/beds/') && route.endsWith('/edit')) {
      // Beet-Edit-Seiten
      const bedId = route.split('/')[2];
      const staticFile = `beds/${bedId}/edit/index.html`;
      const staticPath = path.join(__dirname, '..', 'out', staticFile);
      
      if (fs.existsSync(staticPath)) {
        event.sender.loadFile(staticPath);
        return { success: true, route: staticFile };
      }
    } else if (route.startsWith('/beds/new')) {
      // Neues Beet
      const staticFile = 'beds/new/index.html';
      const staticPath = path.join(__dirname, '..', 'out', staticFile);
      
      if (fs.existsSync(staticPath)) {
        event.sender.loadFile(staticPath);
        return { success: true, route: staticFile };
      }
    } else if (routeMap[route]) {
      // Bekannte statische Route
      const staticFile = routeMap[route];
      const staticPath = path.join(__dirname, '..', 'out', staticFile);
      
      if (fs.existsSync(staticPath)) {
        event.sender.loadFile(staticPath);
        return { success: true, route: staticFile };
      }
    }
    
    // Fallback zur Hauptseite
    const mainPath = path.join(__dirname, '..', 'out', 'index.html');
    if (fs.existsSync(mainPath)) {
      event.sender.loadFile(mainPath);
      return { success: true, route: 'index.html' };
    } else {
      console.error(`[IPC] Hauptseite nicht gefunden: ${mainPath}`);
      return { success: false, message: 'Hauptseite nicht gefunden' };
    }
  } catch (error) {
    console.error('[IPC] Fehler bei Navigation:', error);
    return { success: false, message: error.message };
  }
});

console.log('✅ IPC-Handler für Datenpersistenz, Benutzer und PDF-Export registriert');

let mainWindow = null;

const createWindow = async () => {
  console.log('🚀 Starting GartenMeister Portable...');

  // Browser-Fenster erstellen (optimiert für Performance)
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false, // Erst anzeigen wenn geladen
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Wichtig für lokale Dateien
      allowRunningInsecureContent: true
    }
  });

  // Static Export laden (Portable Version)
  const staticExportPath = path.join(__dirname, '..', 'out', 'index.html');
  
  try {
    if (fs.existsSync(staticExportPath)) {
      console.log('📂 Loading Next.js Static Export:', staticExportPath);

      mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        console.log('✅ GartenMeister Portable gestartet!');
      });
      
      await mainWindow.loadFile(staticExportPath);
      
      // DevTools nur für debugging
      if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
      }
      
    } else {
      console.error('❌ Static Export nicht gefunden:', staticExportPath);
      
      // Fallback: Minimale HTML-Seite
      mainWindow.loadURL('data:text/html,<html><body><h1>GartenMeister Portable</h1><p>Static Export nicht gefunden. Bitte führen Sie "npm run build" aus.</p></body></html>');
      mainWindow.show();
    }
  } catch (error) {
    console.error('Fehler beim Laden der App:', error);
    mainWindow.show();
  }
};

// App ready
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
