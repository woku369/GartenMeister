/**
 * Datei-Utility für Electron
 * Diese Datei enthält Hilfsfunktionen für Dateioperationen in Electron
 */

const { app } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * Gibt den Pfad zum Anwendungsdaten-Verzeichnis zurück
 * @returns {string} Der Pfad zum Anwendungsdaten-Verzeichnis
 */
const getAppDataPath = () => {
  return app.getPath('userData');
};

/**
 * Erstellt ein Verzeichnis, wenn es nicht existiert
 * @param {string} dirPath - Der zu erstellende Verzeichnispfad
 * @returns {Promise<boolean>} true wenn erfolgreich, false sonst
 */
const ensureDirectoryExists = async (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('Fehler beim Erstellen des Verzeichnisses:', error);
    return false;
  }
};

/**
 * Gibt den Pfad zum Export-Verzeichnis zurück
 * @returns {string} Der Pfad zum Export-Verzeichnis
 */
const getExportDirectory = () => {
  const exportDir = path.join(getAppDataPath(), 'exports');
  ensureDirectoryExists(exportDir);
  return exportDir;
};

/**
 * Gibt den Pfad zur lokalen Datenbank zurück
 * @returns {string} Der Pfad zur lokalen Datenbank
 */
const getDatabaseDirectory = () => {
  const dbDir = path.join(getAppDataPath(), 'database');
  ensureDirectoryExists(dbDir);
  return dbDir;
};

/**
 * Gibt den Pfad zu einer lokalen Konfigurationsdatei zurück
 * @returns {string} Der Pfad zur lokalen Konfigurationsdatei
 */
const getConfigFilePath = () => {
  return path.join(getAppDataPath(), 'config.json');
};

/**
 * Erzeugt einen eindeutigen Dateinamen mit Zeitstempel
 * @param {string} prefix - Präfix für den Dateinamen
 * @param {string} extension - Dateiendung (ohne Punkt)
 * @returns {string} Eindeutiger Dateiname
 */
const createUniqueFilename = (prefix, extension) => {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
  return `${prefix}-${timestamp}.${extension}`;
};

/**
 * Generiert ein PDF aus den übergebenen Daten
 * @param {Object} data - Die zu exportierenden Daten
 * @returns {Promise<Object>} Ergebnis mit success und filePath oder error
 */
const generatePdf = async (data) => {
  try {
    console.log('PDF-Export-Anfrage erhalten:', data);
      // PDF-Generator laden
    const { SimplePdfGenerator } = require('../simple-pdf-generator-improved');
    
    // Ausgabepfad erstellen
    const exportDir = getExportDirectory();
    const filename = createUniqueFilename('gartenubersicht', 'pdf');
    const outputPath = path.join(exportDir, filename);
    
    console.log('Generiere PDF nach:', outputPath);
    
    // PDF generieren
    const result = await SimplePdfGenerator.generateGardenPdf(data, outputPath);
    
    if (result && result.success) {
      console.log('PDF erfolgreich generiert:', result.filePath);
      return {
        success: true,
        filePath: result.filePath,
        message: 'PDF erfolgreich erstellt'
      };
    } else {
      console.error('PDF-Generierung fehlgeschlagen:', result?.error);
      return {
        success: false,
        error: result?.error || 'Unbekannter Fehler bei PDF-Generierung'
      };
    }
  } catch (error) {
    console.error('Fehler bei PDF-Generierung:', error);
    return {
      success: false,
      error: error.message || 'Fehler bei PDF-Generierung'
    };
  }
};

module.exports = {
  getAppDataPath,
  ensureDirectoryExists,
  getExportDirectory,
  getDatabaseDirectory,
  getConfigFilePath,
  createUniqueFilename,
  generatePdf
};
