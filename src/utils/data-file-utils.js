// Dateisystem-Erweiterungen für die Electron-App
// Diese Datei enthält zusätzliche Funktionen für den Dateisystemzugriff im Main-Prozess

const { app } = require('electron');
const fs = require('fs');
const path = require('path');

/**
 * Erweitert die Datei-Hilfsfunktionen um Methoden für die persistente Datenspeicherung
 */
class DataFileUtils {
  /**
   * Gibt das Datenverzeichnis für die App zurück und erstellt es, falls es nicht existiert
   * @returns {string} Pfad zum Datenverzeichnis
   */
  static getDataDirectory() {
    const dataDir = path.join(app.getPath('userData'), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return dataDir;
  }
  
  /**
   * Gibt den vollständigen Pfad zu einer Datendatei zurück
   * @param {string} filename - Name der Datendatei
   * @returns {string} Vollständiger Pfad zur Datendatei
   */
  static getDataFilePath(filename) {
    return path.join(this.getDataDirectory(), filename);
  }
  
  /**
   * Prüft, ob eine Datei existiert
   * @param {string} filePath - Pfad zur Datei
   * @returns {boolean} true, wenn die Datei existiert, sonst false
   */
  static fileExists(filePath) {
    return fs.existsSync(filePath);
  }
  
  /**
   * Liest eine JSON-Datei und gibt den geparsten Inhalt zurück
   * @param {string} filePath - Pfad zur JSON-Datei
   * @returns {object|null} Geparster JSON-Inhalt oder null bei einem Fehler
   */
  static readJsonFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) return null;
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Fehler beim Lesen der JSON-Datei ${filePath}:`, error);
      return null;
    }
  }
  
  /**
   * Schreibt Daten in eine JSON-Datei
   * @param {string} filePath - Pfad zur JSON-Datei
   * @param {object} data - Zu speichernde Daten
   * @returns {boolean} true bei Erfolg, false bei einem Fehler
   */
  static writeJsonFile(filePath, data) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`Fehler beim Schreiben der JSON-Datei ${filePath}:`, error);
      return false;
    }
  }
  
  /**
   * Erstellt ein Backup-Verzeichnis mit Zeitstempel
   * @param {string} timestamp - Zeitstempel für den Backup-Namen
   * @returns {string} Pfad zum erstellten Backup-Verzeichnis oder null bei einem Fehler
   */
  static createBackupFolder(timestamp) {
    try {
      const backupDir = path.join(app.getPath('userData'), 'backups', `backup-${timestamp}`);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      return backupDir;
    } catch (error) {
      console.error('Fehler beim Erstellen des Backup-Verzeichnisses:', error);
      return null;
    }
  }
  
  /**
   * Sichert alle Datendateien in ein Backup-Verzeichnis
   * @param {string} backupPath - Pfad zum Backup-Verzeichnis   * @returns {boolean} true bei Erfolg, false bei einem Fehler
   */
  static backupDataFiles(backupPath) {
    try {
      const dataDir = this.getDataDirectory();
      if (!fs.existsSync(dataDir)) return false;
      
      // Alle Dateien im Datenverzeichnis kopieren
      const files = fs.readdirSync(dataDir);
      for (const file of files) {
        const sourcePath = path.join(dataDir, file);
        const destPath = path.join(backupPath, file);
        fs.copyFileSync(sourcePath, destPath);
      }
      return true;
    } catch (error) {
      console.error('Fehler beim Erstellen des Backups:', error);
      return false;
    }
  }

  /**
   * Gibt den Pfad zur Hauptdatenbank zurück
   * @returns {string} Pfad zur gartenmeister-data.json Datei
   */
  static getDatabasePath() {
    return this.getDataFilePath('gartenmeister-data.json');
  }
}

module.exports = DataFileUtils;
