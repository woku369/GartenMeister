const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  console.log('Creating main window...');
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'app', 'favicon.ico')
  });

  // Load the app (static HTML file)
  const indexPath = path.join(__dirname, 'index.html');
  console.log('Loading static file:', indexPath);
  
  mainWindow.loadFile(indexPath)
    .then(() => {
      console.log('HTML file loaded successfully');
    })
    .catch((err) => {
      console.error('Failed to load HTML file:', err);
    });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  console.log('Electron app ready, creating window...');
  createWindow();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Basic IPC handlers for compatibility
ipcMain.handle('open-export-folder', async () => {
  console.log('Export folder requested');
  return { success: true };
});

console.log('Electron app starting...');
