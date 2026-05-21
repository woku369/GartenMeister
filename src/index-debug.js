/**
 * MINIMAL DEBUG VERSION - Nur Fenster öffnen
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  console.log('🚀 Starting debug window...');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Lade einfache HTML-Seite
  mainWindow.loadURL('data:text/html,<html><body><h1>DEBUG TEST - FENSTER FUNKTIONIERT!</h1><p>Wenn du das siehst, funktioniert Electron grundsätzlich.</p></body></html>');
  
  mainWindow.webContents.openDevTools();
  
  console.log('✅ Debug window created');
}

app.whenReady().then(() => {
  console.log('📱 App ready, creating window...');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
