// src/index-production.js
// Simplified Electron main process for production builds

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const { NextServer } = require('./next-server');
const { createAppMenu } = require('./electron-menu');
const configManager = require('./utils/config-manager');
// Auto-Updater System
const AutoUpdateManager = require('./utils/auto-updater');
// Image Management System
const ImageManager = require('./utils/image-manager');
// User Management System
const UserManager = require('./utils/user-manager');
// Document Management System (DB.3)
const DocumentManager = require('./utils/document-manager');
// NAS API Client (DB.5)
const NasApiClient = require('./utils/nas-api-client');

// Global reference to main window
let mainWindow = null;
// Auto-Updater Manager
let updateManager = null;
// Image Manager instance
let imageManager = null;
// User Manager instance
let userManager = null;
// Document Manager instance (DB.3)
let documentManager = null;
// NAS API Client (DB.5)
let nasClient = null;

let nextServer = null;

const createWindow = async () => {
  // Konfiguration initialisieren
  const config = configManager.initConfig();
  
  // Fenstergröße aus der Konfiguration abrufen
  let windowSize = config.defaultWindowSize;
  if (config.rememberWindowSize && config.lastWindowSize) {
    windowSize = config.lastWindowSize;
  }

  // Splash-Screen anzeigen
  const splashWin = new BrowserWindow({
    width: 400,
    height: 340,
    frame: false,
    resizable: false,
    transparent: false,
    alwaysOnTop: true,
    center: true,
    skipTaskbar: true,
    icon: path.join(__dirname, 'app/GartenMeister-icon.ico'),
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });
  await splashWin.loadFile(path.join(__dirname, 'splash.html'));

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: windowSize.width,
    height: windowSize.height,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'app/GartenMeister-icon.ico'),
    show: false // Don't show until ready
  });

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
    
    // Embedded Next.js Server starten
    console.log('Starting embedded Next.js server...');
    nextServer = new NextServer();
    const serverUrl = await nextServer.start();
    
    // Next.js App laden
    console.log(`Loading Next.js app from: ${serverUrl}`);
    await mainWindow.loadURL(serverUrl);
    
    // Splash schließen, Hauptfenster einblenden
    if (!splashWin.isDestroyed()) splashWin.close();
    mainWindow.show();
    
    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
    
  } catch (error) {
    console.error('Error creating window:', error);
    
    // Fallback zur statischen HTML-Seite
    try {
      const staticPath = path.join(__dirname, 'index.html');
      console.log(`Loading fallback static page: ${staticPath}`);
      await mainWindow.loadFile(staticPath);
      if (!splashWin.isDestroyed()) splashWin.close();
      mainWindow.show();
    } catch (fallbackError) {
      console.error('Failed to load fallback page:', fallbackError);
      app.quit();
    }
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  
  // Image Manager initialisieren
  try {
    imageManager = new ImageManager();
    console.log('✅ Image Manager initialisiert');
  } catch (error) {
    console.error('❌ Fehler beim Initialisieren des Image Managers:', error);
  }
  
  // User Manager initialisieren
  try {
    userManager = new UserManager();
    console.log('✅ User Manager initialisiert');
  } catch (error) {
    console.error('❌ Fehler beim Initialisieren des User Managers:', error);
  }

  // Auto-Updater initialisieren (nach Window-Creation)
  setTimeout(() => {
    if (mainWindow && !isDev) {
      updateManager = new AutoUpdateManager(mainWindow);
      updateManager.startPeriodicChecks();
      console.log('✅ Auto-Update System aktiviert');
    }
  }, 3000); // 3 Sekunden nach App-Start

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

// Clean up Next.js server on app quit
app.on('before-quit', async () => {
  if (nextServer) {
    await nextServer.stop();
  }
});

// IPC handlers (same as original)
ipcMain.handle('save-file', async (event, content, filename) => {
  try {
    const fileUtils = require('./utils/file-utils');
    return await fileUtils.saveFile(content, filename);
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
});

ipcMain.handle('load-file', async (event, filename) => {
  try {
    const fileUtils = require('./utils/file-utils');
    return await fileUtils.loadFile(filename);
  } catch (error) {
    console.error('Error loading file:', error);
    throw error;
  }
});

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

// Configuration and database handlers
ipcMain.handle('get-config', () => {
  try {
    return configManager.getConfig();
  } catch (error) {
    console.error('Error getting config:', error);
    throw error;
  }
});

ipcMain.handle('save-config', (event, config) => {
  try {
    const result = configManager.saveConfig(config);
    // NAS-URL an DocumentManager propagieren (DB.5)
    if (documentManager) {
      const cfg = configManager.getConfig();
      documentManager.setNasUrl(cfg?.nasSettings?.enabled ? cfg?.nasSettings?.url : null);
    }
    return result;
  } catch (error) {
    console.error('Error saving config:', error);
    throw error;
  }
});

ipcMain.handle('get-database-path', () => {
  try {
    const dataFileUtils = require('./utils/data-file-utils');
    return dataFileUtils.getDatabasePath();
  } catch (error) {
    console.error('Error getting database path:', error);
    throw error;
  }
});

// ===== DATA FILE HANDLERS =====
const dataFileUtils = require('./utils/data-file-utils');

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

// Für PDF-Export mit Windows Defender Kompatibilität
ipcMain.handle('export-pdf', async (event, data) => {
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
    
    console.log('PDF-Daten vorbereitet für SimplePdfGenerator');
    
    let result;
    try {
      // Versuche normale PDF-Generierung
      result = await SimplePdfGenerator.generateGardenPdf(simplePdfData);
    } catch (pdfError) {
      console.log('🔐 Normale PDF-Generierung blockiert, versuche Safe Mode...');
      
      // Fallback: Safe Mode PDF-Export (HTML)
      const { SimplePdfGeneratorAlternative } = require('./simple-pdf-generator-safe');
      result = await SimplePdfGeneratorAlternative.generateGardenPdfAlternative(simplePdfData);
      
      if (result.success && result.isHtml) {
        console.log('✅ HTML-Export als Fallback erfolgreich');
        
        // Zeige spezielle Nachricht für HTML-Export
        setTimeout(() => {
          const { shell } = require('electron');
          shell.showItemInFolder(result.filePath);
        }, 500);
        
        return {
          success: true,
          filePath: result.filePath,
          message: `Windows Defender Safe Mode: HTML-Export erstellt. Öffnen Sie die Datei und drucken Sie sie als PDF: ${result.filePath}`,
          isHtml: true,
          needsDefenderFix: true
        };
      }
      
      throw pdfError; // Fallback auch fehlgeschlagen
    }
    
    if (result.success) {
      console.log('PDF erfolgreich erstellt:', result.filePath);
      
      // Automatisch Export-Ordner öffnen
      setTimeout(() => {
        const { shell } = require('electron');
        shell.showItemInFolder(result.filePath);
      }, 500);
      
      return {
        success: true,
        filePath: result.filePath,
        message: `PDF wurde erfolgreich erstellt: ${result.filePath}`
      };
    } else {
      console.error('PDF-Erstellung fehlgeschlagen:', result.error);
      return {
        success: false,
        error: result.error || 'Unbekannter Fehler beim PDF-Export'
      };
    }
  } catch (error) {
    console.error('Fehler beim PDF-Export:', error);
    
    // Spezielle Behandlung für Windows Defender Blockierungen
    let errorMessage = error.message || 'Unbekannter Fehler beim PDF-Export';
    let needsDefenderFix = false;
    
    if (error.message && (
      error.message.includes('blocked') || 
      error.message.includes('access denied') ||
      error.message.includes('permission') ||
      error.message.includes('EACCES') ||
      error.message.includes('EPERM') ||
      error.message.includes('spawn') ||
      error.message.includes('ENOENT')
    )) {
      needsDefenderFix = true;
      errorMessage = 'PDF-Export wurde von Windows Defender blockiert.\n\n' +
                   'SCHNELLE LÖSUNG:\n' +
                   '1. Führen Sie scripts/add-defender-exclusions.ps1 als Administrator aus\n' +
                   '2. Oder fügen Sie das GartenMeister-Verzeichnis manuell zu den Windows Defender-Ausnahmen hinzu\n\n' +
                   'ANLEITUNG: Siehe WINDOWS_DEFENDER_LOSUNG.md im Projektordner.';
    }
    
    return {
      success: false,
      error: errorMessage,
      needsDefenderFix: needsDefenderFix
    };
  }
});

// Cloud-Sync-Ordner auswählen  
ipcMain.handle('select-cloud-sync-directory', async () => {
  try {
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
    console.error('Fehler beim Cloud-Sync-Ordner-Dialog:', error);
    return null;
  }
});

// ===== AUTO-UPDATE HANDLERS =====
ipcMain.handle('check-for-updates', async (event, manual = false) => {
  if (updateManager) {
    return await updateManager.checkForUpdates(manual);
  }
  return { error: 'Update-Manager nicht verfügbar' };
});

ipcMain.handle('download-update', async () => {
  if (updateManager) {
    return await updateManager.downloadUpdate();
  }
  return { error: 'Update-Manager nicht verfügbar' };
});

ipcMain.handle('install-update', () => {
  if (updateManager) {
    return updateManager.installUpdate();
  }
  return { error: 'Update-Manager nicht verfügbar' };
});

ipcMain.handle('get-update-status', () => {
  if (updateManager) {
    return updateManager.getUpdateStatus();
  }
  return { 
    isUpdateDownloaded: false, 
    isChecking: false, 
    currentVersion: require('../package.json').version,
    isDev: isDev 
  };
});

ipcMain.handle('get-app-version', () => {
  return require('../package.json').version;
});

// ===== IMAGE MANAGEMENT SYSTEM HANDLERS =====

// Alle Bilder abrufen
ipcMain.handle('images:get-all', async (event, options = {}) => {
  try {
    if (!imageManager) {
      throw new Error('Image Manager nicht initialisiert');
    }
    return await imageManager.getAllImages(options);
  } catch (error) {
    console.error('Fehler beim Abrufen der Bilder:', error);
    throw error;
  }
});

// Einzelnes Bild abrufen
ipcMain.handle('images:get-by-id', async (event, imageId) => {
  try {
    if (!imageManager) {
      throw new Error('Image Manager nicht initialisiert');
    }
    return await imageManager.getImageById(imageId);
  } catch (error) {
    console.error('Fehler beim Abrufen des Bildes:', error);
    throw error;
  }
});

// Bild hochladen
ipcMain.handle('images:upload', async (event, uploadData) => {
  try {
    if (!imageManager) {
      throw new Error('Image Manager nicht initialisiert');
    }
    return await imageManager.uploadImage(uploadData);
  } catch (error) {
    console.error('Fehler beim Hochladen des Bildes:', error);
    throw error;
  }
});

// Bild-URL für lokale Datei abrufen
ipcMain.handle('images:get-file-url', async (event, imageId) => {
  try {
    if (!imageManager) {
      throw new Error('Image Manager nicht initialisiert');
    }
    
    // Zuerst das Bild-Objekt abrufen
    const image = await imageManager.getImageById(imageId);
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
    if (!imageManager) {
      throw new Error('Image Manager nicht initialisiert');
    }
    return await imageManager.updateImageMetadata(imageId, metadata);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Bild-Metadaten:', error);
    throw error;
  }
});

// Bild löschen
ipcMain.handle('images:delete', async (event, imageId) => {
  try {
    if (!imageManager) {
      throw new Error('Image Manager nicht initialisiert');
    }
    return await imageManager.deleteImage(imageId);
  } catch (error) {
    console.error('Fehler beim Löschen des Bildes:', error);
    throw error;
  }
});

// Kommentar hinzufügen
ipcMain.handle('images:add-comment', async (event, imageId, comment) => {
  try {
    if (!imageManager) {
      throw new Error('Image Manager nicht initialisiert');
    }
    return await imageManager.addComment(imageId, comment);
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Kommentars:', error);
    throw error;
  }
});

// Kommentar bearbeiten
ipcMain.handle('images:edit-comment', async (event, imageId, commentId, newText) => {
  try {
    if (!imageManager) {
      throw new Error('Image Manager nicht initialisiert');
    }
    return await imageManager.editComment(imageId, commentId, newText);
  } catch (error) {
    console.error('Fehler beim Bearbeiten des Kommentars:', error);
    throw error;
  }
});

// Kommentar löschen
ipcMain.handle('images:delete-comment', async (event, imageId, commentId) => {
  try {
    if (!imageManager) {
      throw new Error('Image Manager nicht initialisiert');
    }
    return await imageManager.deleteComment(imageId, commentId);
  } catch (error) {
    console.error('Fehler beim Löschen des Kommentars:', error);
    throw error;
  }
});

// Bewertung hinzufügen
ipcMain.handle('images:add-rating', async (event, imageId, rating) => {
  try {
    if (!imageManager) {
      throw new Error('Image Manager nicht initialisiert');
    }
    return await imageManager.addRating(imageId, rating);
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Bewertung:', error);
    throw error;
  }
});

// Favorit-Status togglen
ipcMain.handle('images:toggle-favorite', async (event, imageId) => {
  try {
    if (!imageManager) {
      throw new Error('Image Manager nicht initialisiert');
    }
    return await imageManager.toggleFavorite(imageId);
  } catch (error) {
    console.error('Fehler beim Toggling des Favorit-Status:', error);
    throw error;
  }
});

// View-Count erhöhen
ipcMain.handle('images:increment-view-count', async (event, imageId) => {
  try {
    if (!imageManager) {
      throw new Error('Image Manager nicht initialisiert');
    }
    return await imageManager.incrementViewCount(imageId);
  } catch (error) {
    console.error('Fehler beim Erhöhen des View-Counts:', error);
    throw error;
  }
});

// Batch-Upload
ipcMain.handle('images:batch-upload', async (event, files) => {
  try {
    if (!imageManager) {
      throw new Error('Image Manager nicht initialisiert');
    }
    return await imageManager.batchUpload(files);
  } catch (error) {
    console.error('Fehler beim Batch-Upload:', error);
    throw error;
  }
});

// Statistiken abrufen
ipcMain.handle('images:get-statistics', async () => {
  try {
    if (!imageManager) {
      throw new Error('Image Manager nicht initialisiert');
    }
    return await imageManager.getStatistics();
  } catch (error) {
    console.error('Fehler beim Abrufen der Statistiken:', error);
    throw error;
  }
});

// Datei-Dialog für Bilderauswahl
ipcMain.handle('images:select-files', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      title: 'Bilder auswählen',
      buttonLabel: 'Auswählen',
      filters: [
        { name: 'Bilder', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
        { name: 'Alle Dateien', extensions: ['*'] }
      ]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths;
    }
    return [];
  } catch (error) {
    console.error('Fehler beim Datei-Dialog:', error);
    throw error;
  }
});

// ===== USER MANAGEMENT SYSTEM HANDLERS =====

// Aktuellen Benutzer abrufen
ipcMain.handle('users:get-current', async () => {
  try {
    if (!userManager) {
      throw new Error('User Manager nicht initialisiert');
    }
    return userManager.getCurrentUser();
  } catch (error) {
    console.error('Fehler beim Abrufen des aktuellen Benutzers:', error);
    throw error;
  }
});

// Alle Benutzer abrufen
ipcMain.handle('users:get-all', async () => {
  try {
    if (!userManager) {
      throw new Error('User Manager nicht initialisiert');
    }
    return userManager.getUsers();
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzer:', error);
    throw error;
  }
});

// Benutzer hinzufügen
ipcMain.handle('users:add', async (event, userData) => {
  try {
    if (!userManager) {
      throw new Error('User Manager nicht initialisiert');
    }
    return userManager.addUser(userData);
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Benutzers:', error);
    throw error;
  }
});

// Aktuellen Benutzer wechseln
ipcMain.handle('users:set-current', async (event, userId) => {
  try {
    if (!userManager) {
      throw new Error('User Manager nicht initialisiert');
    }
    return userManager.setCurrentUser(userId);
  } catch (error) {
    console.error('Fehler beim Wechseln des Benutzers:', error);
    throw error;
  }
});

// Benutzer bearbeiten
ipcMain.handle('users:update', async (event, userId, updates) => {
  try {
    if (!userManager) {
      throw new Error('User Manager nicht initialisiert');
    }
    return userManager.updateUser(userId, updates);
  } catch (error) {
    console.error('Fehler beim Bearbeiten des Benutzers:', error);
    throw error;
  }
});

// Benutzer löschen
ipcMain.handle('users:delete', async (event, userId) => {
  try {
    if (!userManager) {
      throw new Error('User Manager nicht initialisiert');
    }
    return userManager.deleteUser(userId);
  } catch (error) {
    console.error('Fehler beim Löschen des Benutzers:', error);
    throw error;
  }
});

// Benutzer-Statistiken abrufen
ipcMain.handle('users:get-stats', async (event, userId) => {
  try {
    if (!userManager) {
      throw new Error('User Manager nicht initialisiert');
    }
    return userManager.getUserStats(userId);
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzer-Statistiken:', error);
    throw error;
  }
});

// Alle Benutzer mit Statistiken abrufen
ipcMain.handle('users:get-all-with-stats', async (event) => {
  try {
    if (!userManager) {
      throw new Error('User Manager nicht initialisiert');
    }
    return userManager.getAllUserStats();
  } catch (error) {
    console.error('Fehler beim Abrufen aller Benutzer-Statistiken:', error);
    throw error;
  }
});


  // In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// ===== DOCUMENT MANAGEMENT SYSTEM HANDLERS (DB.3) =====

// DocumentManager lazy-init mit NAS-URL aus Config
function getDocumentManager() {
  if (!documentManager) {
    documentManager = new DocumentManager();
    const cfg = configManager.getConfig();
    if (cfg?.nasSettings?.enabled && cfg?.nasSettings?.url) {
      documentManager.setNasUrl(cfg.nasSettings.url);
    }
  }
  return documentManager;
}

ipcMain.handle('documents:upload', async (event, data) => {
  try {
    return await getDocumentManager().upload(data);
  } catch (error) {
    console.error('[IPC] documents:upload:', error);
    throw error;
  }
});

ipcMain.handle('documents:get-list', async (event, options = {}) => {
  try {
    return getDocumentManager().getList(options);
  } catch (error) {
    console.error('[IPC] documents:get-list:', error);
    throw error;
  }
});

ipcMain.handle('documents:get-file', async (event, documentId) => {
  try {
    return getDocumentManager().getFile(documentId);
  } catch (error) {
    console.error('[IPC] documents:get-file:', error);
    throw error;
  }
});

ipcMain.handle('documents:delete', async (event, documentId) => {
  try {
    return getDocumentManager().delete(documentId);
  } catch (error) {
    console.error('[IPC] documents:delete:', error);
    throw error;
  }
});

// Wenn Konfiguration gespeichert wird, NAS-URL im DocumentManager aktualisieren
// (Bereits oben im save-config Handler integriert)
