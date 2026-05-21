const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const { spawn } = require('child_process');
const fs = require('fs');
const { createAppMenu } = require('./electron-menu');
const fileUtils = require('./utils/file-utils');
const dataFileUtils = require('./utils/data-file-utils');
const configManager = require('./utils/config-manager');
const WeatherBackgroundService = require('./utils/weather-background-service');

// Globale Variablen
let mainWindow = null;
let weatherService = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let nextProcess = null;

// Funktion zum Starten des Next.js-Servers im Entwicklungsmodus
function startNextDevServer() {
  // Falls bereits ein Prozess läuft, versuchen, diesen zuerst zu beenden
  if (nextProcess && nextProcess.pid) {
    console.log(`Ein bestehender Next.js-Prozess (PID: ${nextProcess.pid}) wird versucht zu beenden, bevor ein neuer gestartet wird.`);
    try {
      // process.kill ist die direktere Methode, um einen Prozess anhand seiner PID zu beenden.
      process.kill(nextProcess.pid);
    } catch (e) {
      // ESRCH (Error Search) bedeutet, dass der Prozess nicht gefunden wurde (z.B. bereits beendet).
      // Andere Fehler könnten ebenfalls auftreten.
      console.warn(`Fehler oder Warnung beim Versuch, den vorherigen Next.js-Prozess (PID: ${nextProcess.pid}) zu beenden: ${e.message}`);
    }
  }
  nextProcess = null; // Wichtig: nextProcess zurücksetzen, bevor ein neuer gestartet wird.

  console.log('Starte Next.js Entwicklungsserver via "npm run dev"...');
  nextProcess = spawn('npm', ['run', 'dev'], {
    shell: true, // Notwendig für 'npm' unter Windows, um .cmd-Dateien korrekt auszuführen.
    env: { ...process.env }, // Umgebungsvariablen an den Kindprozess weitergeben.
    stdio: 'inherit' // Die Ein-/Ausgabe des Kindprozesses mit dem Hauptprozess verbinden.
  });

  if (nextProcess && nextProcess.pid) {
    console.log(`Next.js Entwicklungsserver gestartet mit PID: ${nextProcess.pid}`);

    nextProcess.on('error', (err) => {
      console.error(`Fehler im Next.js-Prozess (ursprüngliche PID: ${nextProcess ? nextProcess.pid : 'unbekannt'}):`, err);
      // Setze nextProcess auf null, da der Prozess fehlerhaft ist.
      // Es ist wichtig, hier die Referenz zu löschen, um Zombie-Referenzen zu vermeiden.
      if (nextProcess) { // Nur nullen, wenn es noch der aktuelle Prozess ist
          nextProcess = null;
      }
    });

    nextProcess.on('exit', (code, signal) => {
      // Die PID ist hier möglicherweise nicht mehr zuverlässig, wenn der Prozess bereits beendet ist
      // und nextProcess durch einen Fehlerhandler oder Mehrfachaufrufe bereits auf null gesetzt wurde.
      console.log(`Next.js-Prozess wurde beendet mit Code ${code} und Signal ${signal}.`);
      // Setze nextProcess auf null, da der Prozess beendet wurde.
      if (nextProcess) { // Nur nullen, wenn es noch der aktuelle Prozess ist
          nextProcess = null;
      }
    });
  } else {
    // Dieser Fall kann eintreten, wenn spawn() fehlschlägt (z.B. 'npm' nicht gefunden)
    // oder der zurückgegebene Prozess keine PID hat.
    console.error('Fehler: spawn hat keinen gültigen Prozess für Next.js zurückgegeben oder der Prozess hat keine PID.');
    if (nextProcess) { // Falls spawn ein Objekt ohne PID oder einen fehlerhaften Prozess zurückgab
        nextProcess = null;
    }
  }

  // Gibt ein Promise zurück, damit der Aufrufer optional auf den Start warten kann
  // (oder zumindest auf den Versuch und eine initiale Verzögerung).
  return new Promise((resolve) => {
    // Eine Verzögerung, um dem Server Zeit zum Hochfahren zu geben, bevor versucht wird, die URL zu laden.
    // Eine robustere Lösung würde auf eine spezifische Log-Ausgabe des Servers warten.
    setTimeout(() => resolve(), 5000); // Erhöhte Verzögerung
  });
}

const createWindow = async () => {
  // Konfiguration initialisieren
  const config = configManager.initConfig();
  
  // Versuchen wir im Entwicklungsmodus nicht, den Next.js-Server zu starten,
  // da er höchstwahrscheinlich bereits läuft oder durch andere Skripte gestartet wird
  // Kommentar: Electron kann die Next.js-App verwenden, die bereits auf Port 9002 läuft

  // Fenstergröße aus der Konfiguration abrufen
  let windowSize = config.defaultWindowSize;
  if (config.rememberWindowSize && config.lastWindowSize) {
    windowSize = config.lastWindowSize;
  }

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: windowSize.width,
    height: windowSize.height,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'app/favicon.ico')
  });

  // Die Next.js-App laden
  // Im Entwicklungsmodus auf den lokalen Server zugreifen,
  // im Produktionsmodus auf die gehostete Next.js-App
  let appUrl;
  if (isDev) {
    // Da wir Probleme mit dem Port 9002 haben, verwenden wir die out/index.html-Datei
    // statt den Entwicklungsserver, um die PDF-Export-Funktionalität zu testen
    try {
      const outPath = path.join(__dirname, '../out/index.html');
      if (fs.existsSync(outPath)) {
        appUrl = 'file://' + outPath;
        console.log(`Versuche, Next.js-App aus Out-Ordner zu laden: ${appUrl}...`);
      } else {
        // Wenn keine out/index.html existiert, verwenden wir eine Fallback-HTML-Seite
        appUrl = 'file://' + path.join(__dirname, 'index.html');
        console.log(`Verwende Fallback-HTML-Seite: ${appUrl}...`);
      }
    } catch (error) {
      console.log(`Fehler beim Laden der App aus dem Out-Ordner: ${error}`);
      appUrl = 'file://' + path.join(__dirname, 'index.html');
    }
  } else {
    try {
      // Im Produktionsmodus versuchen, die gehostete App zu laden
      // Prüfen, ob out/index.html existiert
      const outPath = path.join(__dirname, '../out/index.html');
      if (fs.existsSync(outPath)) {
        appUrl = 'file://' + outPath;
      } else {
        // Wenn out/index.html nicht existiert, versuche .next/server/app/index.html
        const nextPath = path.join(__dirname, '../.next/server/app/index.html');
        if (fs.existsSync(nextPath)) {
          appUrl = 'file://' + nextPath;
        } else {
          // Fallback zur Standard-Ladeseite
          appUrl = 'file://' + path.join(__dirname, 'index.html');
        }
      }
    } catch (error) {
      console.error('Fehler beim Ermitteln des App-Pfads:', error);
      appUrl = 'file://' + path.join(__dirname, 'index.html');
    }
  }
    
  try {
    // Anwendungsmenü erstellen
    createAppMenu(mainWindow);
    
    // Fenstergröße beim Schließen speichern
    mainWindow.on('close', () => {
      const config = configManager.getConfig();
      if (config.rememberWindowSize) {
        const size = mainWindow.getSize();
        configManager.updateConfigValue('lastWindowSize', { 
          width: size[0], 
          height: size[1] 
        });
      }
    });
      // NICHT mehr automatisch den Next.js-Server starten
    // Der Development-Server sollte bereits manuell mit 'npm run dev' gestartet sein
    if (isDev) {
      console.log("Entwicklungsmodus: Erwarte bereits laufenden Next.js-Server auf Port 9002");
      console.log("Falls nicht gestartet, bitte 'npm run dev' in einem separaten Terminal ausführen");
    }

    // Kurze Verzögerung für den Server-Check
    await new Promise(resolve => setTimeout(resolve, isDev ? 1000 : 1000));

    console.log("Versuche Next.js-App zu laden...");
    
    // Versuche die Next.js-App zu laden
    const loadingSucceeded = await loadNextJsApp(mainWindow);
    
    if (!loadingSucceeded) {
      console.warn("Next.js-App konnte nicht geladen werden, verwende Fallback...");
    }
  } catch (error) {
    console.error('Fehler beim Laden der App:', error);
    // Fallback zur Standard-HTML-Seite
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
  }

  // Open the DevTools.
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
};

// Helper-Funktion zum Laden der Next.js-App
async function loadNextJsApp(window) {
  console.log("Versuche Next.js-App zu laden...");
  
  // Liste möglicher URLs in Prioritätsreihenfolge mit verbesserten Pfaden
  const urlsToTry = [
    'http://localhost:9002',                                     // Development (Next.js Dev Server)
    'http://localhost:3000',                                     // Alternative Dev Port
    'file://' + path.join(__dirname, '../out/index.html'),       // Production (Static Export)
    'file://' + path.join(__dirname, '../.next/server/app/page.html'),   // App Router
    'file://' + path.join(__dirname, '../.next/server/pages/index.html'), // Pages Router
    'file://' + path.join(__dirname, '../.next/server/index.html')       // Root index
  ];
    // Prüfen, ob wir den Next.js-Entwicklungsserver starten müssen
  if (isDev) {
    try {
      // Versuche erst, zu prüfen, ob der Server bereits läuft
      const checkUrl = 'http://localhost:9002';
      const http = require('http');
      
      // Timeout-Promise für den Fall, dass der Server nicht antwortet
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 1000);
      });
      
      // Promise, das auf die Antwort des Servers wartet
      const serverCheck = new Promise((resolve, reject) => {
        const req = http.get(checkUrl, (res) => {
          if (res.statusCode === 200) {
            resolve(true);
          } else {
            reject(new Error(`Server responded with status code: ${res.statusCode}`));
          }
        });
        
        req.on('error', (err) => {
          reject(err);
        });
        
        req.end();
      });
      
      // Server-Check mit Timeout - ABER KEINEN EIGENEN SERVER STARTEN
      await Promise.race([serverCheck, timeout]).catch(() => {
        console.log('Next.js-Server ist nicht erreichbar auf Port 9002.');
        console.log('Bitte starten Sie den Development-Server manuell mit: npm run dev');
        // NICHT startNextDevServer() aufrufen - das verursacht Port-Konflikte
      });
    } catch (err) {
      console.warn('Server-Check fehlgeschlagen:', err);
      // AUCH HIER KEINEN EIGENEN SERVER STARTEN
    }
  }
  
  // Versuche jede URL nacheinander mit Verzögerung zwischen den Versuchen
  for (const url of urlsToTry) {
    try {
      console.log(`Versuche URL: ${url}`);
      // Kurze Verzögerung vor jedem Versuch
      await new Promise(resolve => setTimeout(resolve, 500));
      await window.loadURL(url);
      console.log(`URL erfolgreich geladen: ${url}`);
      
      // Überprüfen, ob Seite tatsächlich vollständig geladen ist
      try {
        const hasContent = await window.webContents.executeJavaScript(
          `document.body && document.body.children.length > 1`
        );
        
        if (!hasContent) {
          console.warn('Seite scheint leer zu sein, versuche nächste URL');
          continue;
        }
      } catch (contentErr) {
        console.warn('Fehler beim Prüfen des Seiteninhalts:', contentErr);
        // Trotzdem fortfahren, da die Seite geladen wurde
      }
      
      return true; // Erfolgreiche Ladung
    } catch (err) {
      console.warn(`Fehler beim Laden von ${url}:`, err);
      // Weiter mit der nächsten URL
    }
  }
  
  // Wenn keine URL funktioniert hat, lade die einfache HTML-Seite
  console.error("Konnte keine Next.js-App laden, verwende Fallback-HTML");
  try {
    await window.loadFile(path.join(__dirname, 'index.html'));
    
    // Nach dem Laden der Fallback-Seite setzen wir einen Timer, um später
    // nochmal zu versuchen, die eigentliche App zu laden
    setTimeout(() => {
      console.log("Erneuter Versuch, die App zu laden...");
      loadNextJsApp(window);
    }, 5000);
    
    return false; // Fallback verwendet
  } catch (fallbackErr) {
    console.error("Selbst Fallback fehlgeschlagen:", fallbackErr);
    return false;
  }
}

// Sichere IPC-Handler-Registrierung (verhindert doppelte Registrierung)
const registeredHandlers = new Set();

function safeRegisterHandler(channel, handler) {
  if (registeredHandlers.has(channel)) {
    console.warn(`Handler für '${channel}' ist bereits registriert. Überspringe.`);
    return;
  }
  
  try {
    ipcMain.handle(channel, handler);
    registeredHandlers.add(channel);
    console.log(`Handler für '${channel}' erfolgreich registriert.`);
  } catch (error) {
    console.error(`Fehler beim Registrieren des Handlers für '${channel}':`, error);
  }
}

// Cleanup-Funktion für Handler
function cleanupHandlers() {
  registeredHandlers.forEach(channel => {
    try {
      ipcMain.removeHandler(channel);
    } catch (error) {
      console.warn(`Fehler beim Entfernen des Handlers für '${channel}':`, error);
    }
  });
  registeredHandlers.clear();
}

// Electron Event-Handler für die Ladeseite
ipcMain.on('load-next-app', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    await loadNextJsApp(window);
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Starte Weather Background Service
  weatherService = new WeatherBackgroundService();
  weatherService.start();
  
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Beim Beenden der App sicherstellen, dass auch der Next.js-Server beendet wird
app.on('before-quit', () => {
  // Cleanup IPC-Handler
  cleanupHandlers();
  
  // Stoppe Weather Background Service
  if (weatherService) {
    weatherService.stop();
    weatherService = null;
  }
  
  if (nextProcess !== null) {
    console.log('Next.js-Server wird beendet...');
    // Unter Windows müssen wir Tree-Kill verwenden oder forciert beenden
    process.kill(nextProcess.pid);
    nextProcess = null;
  }
});

// Daten-Events zwischen Renderer und Main-Prozess
safeRegisterHandler('get-app-path', () => {
  console.log('IPC Handler get-app-path aufgerufen');
  return app.getPath('userData');
});

console.log('=== IPC-Handler werden registriert ===');

// Konfiguration
safeRegisterHandler('get-config', () => {
  console.log('IPC Handler get-config aufgerufen');
  try {
    const config = configManager.getConfig();
    console.log('Konfiguration erfolgreich abgerufen:', !!config);
    return config;
  } catch (error) {
    console.error('Fehler beim Abrufen der Konfiguration in IPC Handler:', error);
    throw error;
  }
});

safeRegisterHandler('save-config', (event, config) => {
  console.log('IPC Handler save-config aufgerufen');
  try {
    return configManager.saveConfig(config);
  } catch (error) {
    console.error('Fehler beim Speichern der Konfiguration in IPC Handler:', error);
    throw error;
  }
});

safeRegisterHandler('update-user-preference', (event, key, value) => {
  console.log('IPC Handler update-user-preference aufgerufen:', key, value);
  try {
    return configManager.updateUserPreference(key, value);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Benutzereinstellung in IPC Handler:', error);
    throw error;
  }
});

// Datei-Operationen
// Note: Handler für open-export-folder wird weiter unten registriert

ipcMain.handle('get-database-path', () => {
  console.log('IPC Handler get-database-path aufgerufen');
  try {
    const dbPath = fileUtils.getDatabaseDirectory();
    console.log('Datenbank-Pfad erfolgreich abgerufen:', dbPath);
    return dbPath;
  } catch (error) {
    console.error('Fehler beim Abrufen des Datenbank-Pfads in IPC Handler:', error);
    throw error;
  }
});

// Dateizugriff für persistente Datenspeicherung
ipcMain.handle('get-data-file-path', (event, filename) => {
  return dataFileUtils.getDataFilePath(filename);
});

ipcMain.handle('file-exists', async (event, filePath) => {
  return dataFileUtils.fileExists(filePath);
});

ipcMain.handle('read-json-file', async (event, filePath) => {
  return dataFileUtils.readJsonFile(filePath);
});

ipcMain.handle('write-json-file', async (event, filePath, data) => {
  return dataFileUtils.writeJsonFile(filePath, data);
});

ipcMain.handle('create-backup-folder', async (event, timestamp) => {
  return dataFileUtils.createBackupFolder(timestamp);
});

ipcMain.handle('backup-data-files', async (event, backupPath) => {
  return dataFileUtils.backupDataFiles(backupPath);
});

// Ordner-Erstellung für Cloud-Sync
ipcMain.handle('ensure-directory', async (event, dirPath) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`[IPC] Ordner erstellt: ${dirPath}`);
    }
    
    return fs.existsSync(dirPath);
  } catch (error) {
    console.error(`[IPC] Fehler beim Erstellen von Ordner ${dirPath}:`, error);
    return false;
  }
});

// Für PDF-Export
safeRegisterHandler('export-pdf', async (event, data) => {
  try {
    console.log('PDF-Export-Anfrage erhalten:', data);
    console.log('Erhaltene Beete:', data.beds?.length || 0);
    console.log('Erhaltene Segmente:', data.segments?.length || 0);
    console.log('Erhaltene Kräuter:', data.herbVarieties?.length || 0);
    
      // Verwende den neuen SimplePdfGenerator für bessere Performance
    const { SimplePdfGenerator } = require('./simple-pdf-generator-improved');
    const fileUtils = require('./utils/file-utils');
    
    // Datenstruktur für SimplePdfGenerator anpassen
    const simplePdfData = {
      // Type für SimplePdfGenerator
      type: 'garden-overview',
      // Daten in der erwarteten Struktur
      beds: data.beds || [],
      segments: data.segments || [],
      herbVarieties: data.herbVarieties || [],
      gartenConfiguration: data.gartenConfiguration || null,
      // Auch als data.data für Kompatibilität
      data: {
        beds: data.beds || [],
        segments: data.segments || [],
        herbVarieties: data.herbVarieties || [],
        gartenConfiguration: data.gartenConfiguration || null
      }
    };
    
    console.log('Strukturierte Daten für SimplePdfGenerator:', {
      type: simplePdfData.type,
      bedsCount: simplePdfData.beds.length,
      segmentsCount: simplePdfData.segments.length,
      herbsCount: simplePdfData.herbVarieties.length,
      hasConfig: !!simplePdfData.gartenConfiguration
    });
    
      // Validiere die Eingabedaten
    const validationErrors = SimplePdfGenerator.validateData(simplePdfData);
    if (validationErrors.length > 0) {
      return {
        success: false,
        message: `Datenvalidierung fehlgeschlagen: ${validationErrors.join(', ')}`
      };
    }
    
    // Erstelle eindeutigen Dateinamen
    const exportPath = fileUtils.getExportDirectory();
    const baseFileName = data.filename || 'gartenmeister-garden-overview';
    const fileName = fileUtils.createUniqueFilename(baseFileName, 'pdf');
    const filePath = path.join(exportPath, fileName);
    
    console.log(`Erstelle PDF mit SimplePdfGenerator: ${fileName}`);
    
    // PDF generieren mit korrigierter Datenstruktur
    const result = await SimplePdfGenerator.generateGardenPdf(simplePdfData, filePath);
    
    if (result.success) {
      console.log(`PDF erfolgreich erstellt: ${filePath}`);
      // Dateipfad zur Antwort hinzufügen
      result.filePath = filePath;
    } else {
      console.error('PDF-Generierung fehlgeschlagen:', result.message);
    }
    
    return result;  } catch (error) {
    console.error('Fehler bei der PDF-Erstellung:', error);
    return { 
      success: false, 
      message: `Fehler bei der PDF-Erstellung: ${error.message}` 
    };
  }
});

// PDF-Datei öffnen
ipcMain.handle('open-pdf-file', async (event, filePath) => {
  try {
    const { shell } = require('electron');
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    console.error('Fehler beim Öffnen der PDF-Datei:', error);
    return { 
      success: false, 
      message: `Fehler beim Öffnen der PDF-Datei: ${error.message}` 
    };
  }
});

// Export-Ordner öffnen
safeRegisterHandler('open-export-folder', async (event) => {
  try {
    const { shell } = require('electron');
    const fileUtils = require('./utils/file-utils');
    const exportPath = fileUtils.getExportDirectory();
    await shell.openPath(exportPath);
    return { success: true, path: exportPath };
  } catch (error) {
    console.error('Fehler beim Öffnen des Export-Ordners:', error);
    return { 
      success: false, 
      message: `Fehler beim Öffnen des Export-Ordners: ${error.message}` 
    };
  }
});

// Ordner-Auswahl-Dialog für Cloud-Sync
ipcMain.handle('select-directory', async () => {
  try {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Cloud-Sync-Ordner auswählen',
      buttonLabel: 'Auswählen'
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  } catch (error) {
    console.error('Fehler beim Ordner-Auswahl-Dialog:', error);
    return null;
  }
});

// ===== IMAGE MANAGEMENT SYSTEM HANDLERS =====

// Image Manager für Development-Modus
let imageManager = null;

// Image Manager laden
const loadImageManager = () => {
  if (!imageManager) {
    try {
      const ImageManager = require('./utils/image-manager');
      imageManager = new ImageManager();
    } catch (error) {
      console.error('Fehler beim Laden des Image Managers:', error);
    }
  }
  return imageManager;
};

// Alle Bilder abrufen
ipcMain.handle('images:get-all', async (event, options = {}) => {
  try {
    const manager = loadImageManager();
    if (!manager) {
      throw new Error('Image Manager nicht verfügbar');
    }
    return await manager.getAllImages(options);
  } catch (error) {
    console.error('Fehler beim Abrufen der Bilder:', error);
    throw error;
  }
});

// Einzelnes Bild abrufen
ipcMain.handle('images:get-by-id', async (event, imageId) => {
  try {
    const manager = loadImageManager();
    if (!manager) {
      throw new Error('Image Manager nicht verfügbar');
    }
    return await manager.getImageById(imageId);
  } catch (error) {
    console.error('Fehler beim Abrufen des Bildes:', error);
    throw error;
  }
});

// Bild hochladen
ipcMain.handle('images:upload', async (event, uploadData) => {
  try {
    const manager = loadImageManager();
    if (!manager) {
      throw new Error('Image Manager nicht verfügbar');
    }
    return await manager.uploadImage(uploadData);
  } catch (error) {
    console.error('Fehler beim Hochladen des Bildes:', error);
    throw error;
  }
});

// Bild-URL für lokale Datei abrufen (Base64 für Browser)
ipcMain.handle('images:get-file-url', async (event, imageId) => {
  try {
    const manager = loadImageManager();
    if (!manager) {
      throw new Error('Image Manager nicht verfügbar');
    }
    
    // Zuerst das Bild-Objekt abrufen
    const image = await manager.getImageById(imageId);
    if (!image) {
      throw new Error('Bild nicht gefunden');
    }
    
    const fs = require('fs');
    const path = require('path');
    const filePath = image.filePath;
    
    if (!fs.existsSync(filePath)) {
      throw new Error('Datei nicht gefunden: ' + filePath);
    }
    
    // Datei als Base64 zurückgeben für Browser-Anzeige
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString('base64');
    const mimeType = getMimeTypeFromPath(filePath);
    
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Fehler beim Abrufen der Bild-URL:', error);
    throw error;
  }
});

// MIME-Type helper
function getMimeTypeFromPath(filePath) {
  const ext = require('path').extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.svg': 'image/svg+xml'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Bild-Metadaten aktualisieren
ipcMain.handle('images:update-metadata', async (event, imageId, metadata) => {
  try {
    const manager = loadImageManager();
    if (!manager) {
      throw new Error('Image Manager nicht verfügbar');
    }
    return await manager.updateImageMetadata(imageId, metadata);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Bild-Metadaten:', error);
    throw error;
  }
});

// Kommentar hinzufügen
ipcMain.handle('images:add-comment', async (event, imageId, comment) => {
  try {
    const manager = loadImageManager();
    if (!manager) {
      throw new Error('Image Manager nicht verfügbar');
    }
    return await manager.addComment(imageId, comment);
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Kommentars:', error);
    throw error;
  }
});

// Favorit togglen
ipcMain.handle('images:toggle-favorite', async (event, imageId) => {
  try {
    const manager = loadImageManager();
    if (!manager) {
      throw new Error('Image Manager nicht verfügbar');
    }
    return await manager.toggleFavorite(imageId);
  } catch (error) {
    console.error('Fehler beim Favorisieren:', error);
    throw error;
  }
});

// Bild löschen
ipcMain.handle('images:delete', async (event, imageId) => {
  try {
    const manager = loadImageManager();
    if (!manager) {
      throw new Error('Image Manager nicht verfügbar');
    }
    return await manager.deleteImage(imageId);
  } catch (error) {
    console.error('Fehler beim Löschen des Bildes:', error);
    throw error;
  }
});

// Statistiken abrufen
ipcMain.handle('images:get-statistics', async (event) => {
  try {
    const manager = loadImageManager();
    if (!manager) {
      throw new Error('Image Manager nicht verfügbar');
    }
    return await manager.getStatistics();
  } catch (error) {
    console.error('Fehler beim Abrufen der Statistiken:', error);
    throw error;
  }
});

// ===== USER MANAGEMENT HANDLERS =====

// User Manager für Development-Modus
let userManager = null;

// User Manager laden
const loadUserManager = () => {
  if (!userManager) {
    try {
      const UserManager = require('./utils/user-manager');
      userManager = new UserManager();
    } catch (error) {
      console.error('Fehler beim Laden des User Managers:', error);
    }
  }
  return userManager;
};

// Aktuellen Benutzer abrufen
ipcMain.handle('users:get-current', async (event) => {
  try {
    const manager = loadUserManager();
    if (!manager) {
      throw new Error('User Manager nicht verfügbar');
    }
    return await manager.getCurrentUser();
  } catch (error) {
    console.error('Fehler beim Abrufen des aktuellen Benutzers:', error);
    throw error;
  }
});

// Alle Benutzer abrufen
ipcMain.handle('users:get-all', async (event) => {
  try {
    const manager = loadUserManager();
    if (!manager) {
      throw new Error('User Manager nicht verfügbar');
    }
    return await manager.getUsers();
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzer:', error);
    throw error;
  }
});

// Benutzer hinzufügen
ipcMain.handle('users:add', async (event, userData) => {
  try {
    const manager = loadUserManager();
    if (!manager) {
      throw new Error('User Manager nicht verfügbar');
    }
    return await manager.addUser(userData);
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Benutzers:', error);
    throw error;
  }
});

// Aktuellen Benutzer wechseln
ipcMain.handle('users:set-current', async (event, userId) => {
  try {
    const manager = loadUserManager();
    if (!manager) {
      throw new Error('User Manager nicht verfügbar');
    }
    return await manager.setCurrentUser(userId);
  } catch (error) {
    console.error('Fehler beim Wechseln des Benutzers:', error);
    throw error;
  }
});

// Benutzer bearbeiten
ipcMain.handle('users:update', async (event, userId, updates) => {
  try {
    const manager = loadUserManager();
    if (!manager) {
      throw new Error('User Manager nicht verfügbar');
    }
    return await manager.updateUser(userId, updates);
  } catch (error) {
    console.error('Fehler beim Bearbeiten des Benutzers:', error);
    throw error;
  }
});

// Benutzer löschen
ipcMain.handle('users:delete', async (event, userId) => {
  try {
    const manager = loadUserManager();
    if (!manager) {
      throw new Error('User Manager nicht verfügbar');
    }
    return await manager.deleteUser(userId);
  } catch (error) {
    console.error('Fehler beim Löschen des Benutzers:', error);
    throw error;
  }
});

// Benutzer-Statistiken abrufen
ipcMain.handle('users:get-stats', async (event, userId) => {
  try {
    const manager = loadUserManager();
    if (!manager) {
      throw new Error('User Manager nicht verfügbar');
    }
    return await manager.getUserStats(userId);
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzer-Statistiken:', error);
    throw error;
  }
});

// Alle Benutzer mit Statistiken abrufen
ipcMain.handle('users:get-all-with-stats', async (event) => {
  try {
    const manager = loadUserManager();
    if (!manager) {
      throw new Error('User Manager nicht verfügbar');
    }
    return await manager.getAllUserStats();
  } catch (error) {
    console.error('Fehler beim Abrufen aller Benutzer-Statistiken:', error);
    throw error;
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
