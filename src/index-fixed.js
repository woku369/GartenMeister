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
let nextProcess = null;
let nextServer = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Next.js Server starten (Production Mode)
async function startNextServer() {
  try {
    // In Production Mode Next.js direkt importieren und starten
    if (!isDev) {
      const next = require('next');
      const nextApp = next({
        dev: false,
        dir: path.join(__dirname, '..'),
        conf: {
          distDir: '.next'
        }
      });
      
      await nextApp.prepare();
      
      const handle = nextApp.getRequestHandler();
      
      const { createServer } = require('http');
      nextServer = createServer((req, res) => {
        handle(req, res);
      });
      
      await new Promise((resolve) => {
        nextServer.listen(9002, () => {
          console.log('Next.js Production Server gestartet auf Port 9002');
          resolve();
        });
      });
    }
  } catch (error) {
    console.error('Fehler beim Starten des Next.js Servers:', error);
    // Fallback: Verwende statische Dateien
    console.log('Fallback: Verwende statische HTML-Dateien');
  }
}

// Funktion zum Starten des Next.js-Servers im Entwicklungsmodus
function startNextDevServer() {
  // Falls bereits ein Prozess läuft, versuchen, diesen zuerst zu beenden
  if (nextProcess && nextProcess.pid) {
    console.log(`Ein bestehender Next.js-Prozess (PID: ${nextProcess.pid}) wird versucht zu beenden, bevor ein neuer gestartet wird.`);
    try {
      process.kill(nextProcess.pid);
    } catch (error) {
      console.error('Fehler beim Beenden des bestehenden Next.js-Prozesses:', error);
    }
  }

  console.log('Starte Next.js-Entwicklungsserver...');
  
  nextProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'development' }
  });

  if (nextProcess && nextProcess.pid) {
    console.log(`Next.js-Entwicklungsserver gestartet mit PID: ${nextProcess.pid}`);
    
    nextProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`Next.js stdout: ${output}`);
    });

    nextProcess.stderr.on('data', (data) => {
      console.log(`Next.js stderr: ${data}`);
    });

    nextProcess.on('close', (code) => {
      console.log(`Next.js-Entwicklungsserver beendet mit Code: ${code}`);
      nextProcess = null;
    });

    nextProcess.on('error', (error) => {
      console.error('Fehler beim Starten des Next.js-Entwicklungsservers:', error);
      nextProcess = null;
    });
  } else {
    console.error('Fehler: spawn hat keinen gültigen Prozess für Next.js zurückgegeben oder der Prozess hat keine PID.');
    if (nextProcess) {
      nextProcess = null;
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => resolve(), 5000);
  });
}

const createWindow = async () => {
  // Konfiguration initialisieren
  const config = configManager.initConfig();
  
  // Next.js Server starten
  if (isDev) {
    await startNextDevServer();
  } else {
    await startNextServer();
  }

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
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      allowRunningInsecureContent: true,
      experimentalFeatures: true
    },
    icon: path.join(__dirname, 'app', 'favicon.ico'),
    show: false,
    titleBarStyle: 'default',
    autoHideMenuBar: false,
    resizable: true,
    maximizable: true
  });

  // Menü setzen
  createAppMenu(mainWindow);

  // Fenster Position wiederherstellen
  if (config.rememberWindowPosition && config.lastWindowPosition) {
    mainWindow.setPosition(config.lastWindowPosition.x, config.lastWindowPosition.y);
  }

  // Fenster zentrieren falls keine Position gespeichert ist
  if (!config.rememberWindowPosition || !config.lastWindowPosition) {
    mainWindow.center();
  }

  // Fenster zeigen wenn bereit
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // URL laden
  const startUrl = isDev ? 'http://localhost:9002' : 'http://localhost:9002';
  
  try {
    await mainWindow.loadURL(startUrl);
    console.log('Hauptfenster geladen');
  } catch (error) {
    console.error('Fehler beim Laden der URL:', error);
    
    // Fallback: Lokale HTML-Datei laden
    const fallbackPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(fallbackPath)) {
      await mainWindow.loadFile(fallbackPath);
      console.log('Fallback HTML-Datei geladen');
    } else {
      console.error('Keine Fallback-Datei gefunden');
    }
  }

  // Fenster Position und Größe speichern
  const saveWindowState = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const bounds = mainWindow.getBounds();
      const position = mainWindow.getPosition();
      
      config.lastWindowSize = { width: bounds.width, height: bounds.height };
      config.lastWindowPosition = { x: position[0], y: position[1] };
      
      configManager.saveConfig(config);
    }
  };

  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);

  // Open the DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Weather Service initialisieren
  weatherService = new WeatherBackgroundService();
  await weatherService.init();

  return mainWindow;
};

// Cleanup-Funktion für das Beenden der App
function cleanup() {
  if (nextProcess && nextProcess.pid) {
    console.log('Beende Next.js-Entwicklungsserver...');
    try {
      process.kill(nextProcess.pid);
    } catch (error) {
      console.error('Fehler beim Beenden des Next.js-Prozesses:', error);
    }
  }
  
  if (nextServer) {
    console.log('Beende Next.js-Production-Server...');
    try {
      nextServer.close();
    } catch (error) {
      console.error('Fehler beim Beenden des Next.js-Servers:', error);
    }
  }
  
  if (weatherService) {
    weatherService.stop();
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  cleanup();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  cleanup();
});

// Weitere Event-Handler und IPC-Implementierungen folgen hier...
// (Rest der Datei bleibt unverändert)
