const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const { spawn } = require('child_process');
const fs = require('fs');
const { createAppMenu } = require('./electron-menu');
const fileUtils = require('./utils/file-utils');
const dataFileUtils = require('./utils/data-file-utils');
const configManager = require('./utils/config-manager');

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
  const mainWindow = new BrowserWindow({
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
    
    // Starte im Entwicklungsmodus den Next.js-Server
    if (isDev) {
      console.log("Starte Next.js-Server für Entwicklung...");
      try {
        await startNextDevServer();
        console.log("Next.js-Entwicklungsserver gestartet");
      } catch (err) {
        console.warn("Next.js-Server konnte nicht gestartet werden:", err);
        // Trotzdem weitermachen, der Server könnte bereits laufen
      }
    }

    // Kurze Verzögerung für den Server-Start
    await new Promise(resolve => setTimeout(resolve, isDev ? 3000 : 1000));

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
      
      // Server-Check mit Timeout
      await Promise.race([serverCheck, timeout]).catch(() => {
        console.log('Next.js-Server scheint nicht zu laufen, versuche zu starten...');
        return startNextDevServer();
      });
    } catch (err) {
      console.warn('Server-Check fehlgeschlagen, versuche Server zu starten:', err);
      await startNextDevServer();
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
  if (nextProcess !== null) {
    console.log('Next.js-Server wird beendet...');
    // Unter Windows müssen wir Tree-Kill verwenden oder forciert beenden
    process.kill(nextProcess.pid);
    nextProcess = null;
  }
});

// Daten-Events zwischen Renderer und Main-Prozess
ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

// Konfiguration
ipcMain.handle('get-config', () => {
  return configManager.getConfig();
});

ipcMain.handle('save-config', (event, config) => {
  return configManager.saveConfig(config);
});

ipcMain.handle('update-user-preference', (event, key, value) => {
  return configManager.updateUserPreference(key, value);
});

// Datei-Operationen
ipcMain.handle('open-export-folder', () => {
  const { shell } = require('electron');
  const exportPath = fileUtils.getExportDirectory();
  shell.openPath(exportPath);
  return exportPath;
});

ipcMain.handle('get-database-path', () => {
  return fileUtils.getDatabaseDirectory();
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

// Für PDF-Export
ipcMain.handle('export-pdf', async (event, data) => {
  try {
    console.log('PDF-Export-Anfrage erhalten:', data);
      // Verwende den neuen SimplePdfGenerator für bessere Performance
    const { SimplePdfGenerator } = require('./simple-pdf-generator-improved');
    const fileUtils = require('./utils/file-utils');
      // Validiere die Eingabedaten
    const validationErrors = SimplePdfGenerator.validateData(data);
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
    
    // PDF generieren
    const result = await SimplePdfGenerator.generateGardenPdf(data, filePath);
    
    if (result.success) {
      console.log(`PDF erfolgreich erstellt: ${filePath}`);
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// ===== USER MANAGEMENT SYSTEM HANDLERS =====

// Aktueller Benutzer abrufen
ipcMain.handle('users:get-current', async () => {
  try {
    // Dummy-Implementierung für Kompatibilität
    return {
      id: 'default-user',
      name: 'Standard Benutzer',
      email: 'user@gartenmeister.local',
      role: 'admin',
      created: new Date().toISOString()
    };
  } catch (error) {
    console.error('Fehler beim Abrufen des aktuellen Benutzers:', error);
    throw error;
  }
});

// Alle Benutzer abrufen
ipcMain.handle('users:get-all', async () => {
  try {
    return [{
      id: 'default-user',
      name: 'Standard Benutzer',
      email: 'user@gartenmeister.local',
      role: 'admin',
      created: new Date().toISOString()
    }];
  } catch (error) {
    console.error('Fehler beim Abrufen aller Benutzer:', error);
    throw error;
  }
});

// Benutzer erstellen
ipcMain.handle('users:create', async (event, userData) => {
  try {
    console.log('User creation requested:', userData);
    return { success: true, message: 'Benutzer-Erstellung nicht implementiert' };
  } catch (error) {
    console.error('Fehler beim Erstellen des Benutzers:', error);
    throw error;
  }
});

// Benutzer aktualisieren
ipcMain.handle('users:update', async (event, userId, userData) => {
  try {
    console.log('User update requested:', userId, userData);
    return { success: true, message: 'Benutzer-Update nicht implementiert' };
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Benutzers:', error);
    throw error;
  }
});

// Benutzer löschen
ipcMain.handle('users:delete', async (event, userId) => {
  try {
    console.log('User deletion requested:', userId);
    return { success: true, message: 'Benutzer-Löschung nicht implementiert' };
  } catch (error) {
    console.error('Fehler beim Löschen des Benutzers:', error);
    throw error;
  }
});
