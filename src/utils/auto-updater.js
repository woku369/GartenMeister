/**
 * Auto-Update System für GartenMeister
 * Ermöglicht automatische Updates ohne Neuinstallation
 */

const { autoUpdater } = require('electron-updater');
const { dialog, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

class AutoUpdateManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.isUpdateDownloaded = false;
    this.isChecking = false;
    
    this.setupAutoUpdater();
    this.setupEventHandlers();
  }

  setupAutoUpdater() {
    // Nur in Production nach Updates suchen
    if (isDev) {
      console.log('[AutoUpdater] Development Mode - Updates deaktiviert');
      return;
    }

    // Update-Server konfigurieren (später für echte Updates)
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: 'https://your-update-server.com/releases', // TODO: Echter Update-Server
      useMultipleRangeRequest: true
    });

    // Update-Verhalten konfigurieren
    autoUpdater.autoDownload = false; // Benutzer fragen vor Download
    autoUpdater.autoInstallOnAppQuit = true; // Auto-Install beim Beenden
    
    console.log('[AutoUpdater] Konfiguriert für Version:', require('../../package.json').version);
  }

  setupEventHandlers() {
    // Update verfügbar
    autoUpdater.on('update-available', (info) => {
      console.log('[AutoUpdater] Update verfügbar:', info.version);
      this.showUpdateAvailableDialog(info);
    });

    // Kein Update verfügbar
    autoUpdater.on('update-not-available', (info) => {
      console.log('[AutoUpdater] Keine Updates verfügbar');
      if (this.manualCheck) {
        this.showNoUpdateDialog();
        this.manualCheck = false;
      }
    });

    // Download-Fortschritt
    autoUpdater.on('download-progress', (progressObj) => {
      const percent = Math.round(progressObj.percent);
      console.log(`[AutoUpdater] Download: ${percent}%`);
      
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-download-progress', {
          percent: percent,
          transferred: progressObj.transferred,
          total: progressObj.total,
          bytesPerSecond: progressObj.bytesPerSecond
        });
      }
    });

    // Download abgeschlossen
    autoUpdater.on('update-downloaded', (info) => {
      console.log('[AutoUpdater] Update heruntergeladen:', info.version);
      this.isUpdateDownloaded = true;
      this.showUpdateReadyDialog(info);
    });

    // Fehler
    autoUpdater.on('error', (error) => {
      console.error('[AutoUpdater] Fehler:', error);
      this.showUpdateErrorDialog(error);
    });
  }

  /**
   * Manuell nach Updates suchen
   */
  async checkForUpdates(manual = false) {
    if (isDev) {
      console.log('[AutoUpdater] Development Mode - Überspringe Update-Check');
      if (manual) {
        this.showNoUpdateDialog('Development Mode aktiv');
      }
      return;
    }

    if (this.isChecking) {
      console.log('[AutoUpdater] Update-Check bereits aktiv');
      return;
    }

    try {
      this.isChecking = true;
      this.manualCheck = manual;
      
      console.log('[AutoUpdater] Suche nach Updates...');
      await autoUpdater.checkForUpdates();
      
    } catch (error) {
      console.error('[AutoUpdater] Fehler beim Update-Check:', error);
      if (manual) {
        this.showUpdateErrorDialog(error);
      }
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Update herunterladen
   */
  async downloadUpdate() {
    try {
      console.log('[AutoUpdater] Starte Update-Download...');
      await autoUpdater.downloadUpdate();
    } catch (error) {
      console.error('[AutoUpdater] Fehler beim Download:', error);
      this.showUpdateErrorDialog(error);
    }
  }

  /**
   * Update installieren und App neustarten
   */
  installUpdate() {
    if (!this.isUpdateDownloaded) {
      console.warn('[AutoUpdater] Kein Update zum Installieren verfügbar');
      return;
    }

    console.log('[AutoUpdater] Installiere Update und starte neu...');
    autoUpdater.quitAndInstall(false, true);
  }

  /**
   * Dialog: Update verfügbar
   */
  showUpdateAvailableDialog(updateInfo) {
    const options = {
      type: 'info',
      title: 'Update verfügbar',
      message: `GartenMeister ${updateInfo.version} ist verfügbar!`,
      detail: `Aktuelle Version: ${require('../../package.json').version}\nNeue Version: ${updateInfo.version}\n\nMöchten Sie das Update jetzt herunterladen?`,
      buttons: ['Ja, herunterladen', 'Später erinnern', 'Überspringen'],
      defaultId: 0,
      cancelId: 1
    };

    dialog.showMessageBox(this.mainWindow, options).then((result) => {
      if (result.response === 0) {
        this.downloadUpdate();
      } else if (result.response === 1) {
        // Später erinnern - in 24h wieder fragen
        setTimeout(() => {
          this.checkForUpdates(false);
        }, 24 * 60 * 60 * 1000); // 24 Stunden
      }
      // Bei Überspringen: nichts tun
    });
  }

  /**
   * Dialog: Update bereit zur Installation
   */
  showUpdateReadyDialog(updateInfo) {
    const options = {
      type: 'info',
      title: 'Update bereit',
      message: `GartenMeister ${updateInfo.version} wurde heruntergeladen!`,
      detail: 'Das Update ist bereit zur Installation. Die App wird kurz neugestartet.\n\nJetzt installieren?',
      buttons: ['Jetzt installieren', 'Beim nächsten Start'],
      defaultId: 0,
      cancelId: 1
    };

    dialog.showMessageBox(this.mainWindow, options).then((result) => {
      if (result.response === 0) {
        this.installUpdate();
      }
      // Bei "Beim nächsten Start": Update wird automatisch beim Beenden installiert
    });
  }

  /**
   * Dialog: Kein Update verfügbar
   */
  showNoUpdateDialog(reason = null) {
    const message = reason || 'Sie verwenden bereits die neueste Version von GartenMeister.';
    
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Keine Updates',
      message: 'Auf dem neuesten Stand',
      detail: message,
      buttons: ['OK']
    });
  }

  /**
   * Dialog: Update-Fehler
   */
  showUpdateErrorDialog(error) {
    dialog.showMessageBox(this.mainWindow, {
      type: 'error',
      title: 'Update-Fehler',
      message: 'Fehler beim Aktualisieren',
      detail: `Es ist ein Fehler beim Update-Prozess aufgetreten:\n\n${error.message}\n\nVersuchen Sie es später erneut oder laden Sie die neueste Version manuell herunter.`,
      buttons: ['OK']
    });
  }

  /**
   * Automatische Update-Checks beim Start
   */
  startPeriodicChecks() {
    if (isDev) return;

    // Beim App-Start nach Updates suchen (nach 30 Sekunden)
    setTimeout(() => {
      this.checkForUpdates(false);
    }, 30000);

    // Dann alle 4 Stunden
    setInterval(() => {
      this.checkForUpdates(false);
    }, 4 * 60 * 60 * 1000);

    console.log('[AutoUpdater] Periodische Update-Checks aktiviert');
  }

  /**
   * Update-Status für Renderer-Prozess
   */
  getUpdateStatus() {
    return {
      isUpdateDownloaded: this.isUpdateDownloaded,
      isChecking: this.isChecking,
      currentVersion: require('../../package.json').version,
      isDev: isDev
    };
  }
}

module.exports = AutoUpdateManager;
