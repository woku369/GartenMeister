// Menuü-Konfiguration für die Electron-Anwendung
const { Menu, app, shell, dialog, BrowserWindow } = require('electron');
const path = require('path');

/**
 * Erstellt das Anwendungsmenü für die Electron-App
 * @param {BrowserWindow} mainWindow - Die Hauptfenster-Instanz
 */
function createAppMenu(mainWindow) {
  const isMac = process.platform === 'darwin';

  // Das Template für das Menü
  const template = [
    // App-Menü (nur macOS)
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about', label: 'Über ' + app.name },
        { type: 'separator' },
        { role: 'services', label: 'Dienste' },
        { type: 'separator' },
        { role: 'hide', label: 'Ausblenden' },
        { role: 'hideOthers', label: 'Andere ausblenden' },
        { role: 'unhide', label: 'Alle einblenden' },
        { type: 'separator' },
        { role: 'quit', label: 'Beenden' }
      ]
    }] : []),
    
    // Datei-Menü
    {
      label: 'Datei',
      submenu: [
        {
          label: 'Neu',
          submenu: [
            {
              label: 'Neues Beet anlegen',
              click: async () => {
                mainWindow.loadURL('http://localhost:9002/beds/new');
              }
            },
            {
              label: 'Neue Kräutersorte anlegen',
              click: async () => {
                mainWindow.loadURL('http://localhost:9002/herbs');
              }
            }
          ]
        },
        { type: 'separator' },
        {
          label: 'Als PDF exportieren',
          submenu: [
            {
              label: 'Gartenübersicht',
              click: async () => {
                // Zur Hauptseite navigieren und PDF-Export auslösen
                mainWindow.loadURL('http://localhost:9002');
                // Kleine Verzögerung für das Laden der Seite
                setTimeout(() => {
                  mainWindow.webContents.executeJavaScript(`
                    if (document.querySelector('button:contains("PDF")')) {
                      document.querySelector('button:contains("PDF")').click();
                    } else {
                      console.log('PDF-Export-Button nicht gefunden');
                    }
                  `).catch(err => console.error('Fehler beim Export:', err));
                }, 1000);
              }
            },
            {
              label: 'Berichte',
              click: async () => {
                // Zur Berichtsseite navigieren und PDF-Export auslösen
                mainWindow.loadURL('http://localhost:9002/reports');
                // Kleine Verzögerung für das Laden der Seite
                setTimeout(() => {
                  mainWindow.webContents.executeJavaScript(`
                    if (document.querySelector('button:contains("PDF")')) {
                      document.querySelector('button:contains("PDF")').click();
                    } else {
                      console.log('PDF-Export-Button nicht gefunden');
                    }
                  `).catch(err => console.error('Fehler beim Export:', err));
                }, 1000);
              }
            }
          ]
        },
        { type: 'separator' },
        isMac ? { role: 'close', label: 'Schließen' } : { role: 'quit', label: 'Beenden' }
      ]
    },
    
    // Bearbeiten-Menü
    {
      label: 'Bearbeiten',
      submenu: [
        { role: 'undo', label: 'Rückgängig' },
        { role: 'redo', label: 'Wiederherstellen' },
        { type: 'separator' },
        { role: 'cut', label: 'Ausschneiden' },
        { role: 'copy', label: 'Kopieren' },
        { role: 'paste', label: 'Einfügen' },
        { role: 'delete', label: 'Löschen' },
        { type: 'separator' },
        { role: 'selectAll', label: 'Alles auswählen' }
      ]
    },
    
    // Ansicht-Menü
    {
      label: 'Ansicht',
      submenu: [
        { role: 'reload', label: 'Neu laden' },
        { role: 'forceReload', label: 'Neu laden erzwingen' },
        { role: 'toggleDevTools', label: 'Entwicklertools umschalten' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom zurücksetzen' },
        { role: 'zoomIn', label: 'Vergrößern' },
        { role: 'zoomOut', label: 'Verkleinern' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Vollbild umschalten' }
      ]
    },
      // Navigation-Menü
    {
      label: 'Navigation',
      submenu: [
        {
          label: 'Startseite',
          click: async () => {
            mainWindow.loadURL('http://localhost:9002');
          }
        },
        {
          label: 'Kräuterverwaltung',
          click: async () => {
            mainWindow.loadURL('http://localhost:9002/herbs');
          }
        },
        {
          label: 'Berichte',
          click: async () => {
            mainWindow.loadURL('http://localhost:9002/reports');
          }
        },
        { type: 'separator' },
        {
          label: 'Einstellungen',
          click: async () => {
            mainWindow.loadURL('http://localhost:9002/settings');
          }
        }
      ]
    },
    
    // Hilfe-Menü
    {
      role: 'help',
      label: 'Hilfe',
      submenu: [
        {
          label: 'Hilfe & Benutzerhandbuch',
          click: async () => {
            mainWindow.loadURL('http://localhost:9002/help');
          }
        },
        {
          label: 'Erste Schritte',
          click: async () => {
            mainWindow.loadURL('http://localhost:9002/help/getting-started');
          }
        },
        {
          label: 'Benutzerhandbuch',
          click: async () => {
            mainWindow.loadURL('http://localhost:9002/help/user-guide');
          }
        },
        {
          label: 'FAQ',
          click: async () => {
            mainWindow.loadURL('http://localhost:9002/help/faq');
          }
        },
        {
          label: 'Fehlerbehebung',
          click: async () => {
            mainWindow.loadURL('http://localhost:9002/help/troubleshooting');
          }
        },
        { type: 'separator' },
        {
          label: 'PowerShell Anleitungen',
          click: async () => {
            const powershellDocsPath = require('path').join(__dirname, '../POWERSHELL_QUICK_REFERENCE.md');
            shell.openPath(powershellDocsPath);
          }
        },
        {
          label: 'Technische Dokumentation',
          click: async () => {
            const techDocsPath = require('path').join(__dirname, '../docs/TECHNISCHE_DOKUMENTATION.md');
            shell.openPath(techDocsPath);
          }
        },
        { type: 'separator' },
        {
          label: 'Über GartenMeister',
          click: async () => {
            const aboutWin = new BrowserWindow({
              width: 380,
              height: 420,
              resizable: false,
              minimizable: false,
              maximizable: false,
              parent: mainWindow,
              modal: false,
              frame: false,
              transparent: false,
              show: false,
              icon: path.join(__dirname, 'app/GartenMeister-icon.ico'),
              webPreferences: {
                preload: path.join(__dirname, 'preload-about.js'),
                nodeIntegration: false,
                contextIsolation: true,
                additionalArguments: [`--app-version=${app.getVersion()}`],
              }
            });
            await aboutWin.loadFile(path.join(__dirname, 'about.html'));
            aboutWin.show();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

module.exports = { createAppMenu };
