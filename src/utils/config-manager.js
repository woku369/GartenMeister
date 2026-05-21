/**
 * Konfigurations-Manager für die Electron-App
 * Verwaltet Benutzereinstellungen und App-Konfiguration
 */

const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const fileUtils = require('./file-utils');

// Default-Konfiguration
const defaultConfig = {
  appTheme: 'light',
  exportPath: null, // Wird automatisch auf den Download-Ordner gesetzt
  autoStartNextServer: true,
  rememberWindowSize: true,
  defaultWindowSize: { width: 1200, height: 800 },
  lastWindowSize: { width: 1200, height: 800 },
  zoomLevel: 0,
  userPreferences: {
    defaultBeetType: 'Standard',
    defaultBeetWidth: 1.5,
    defaultProductivePercentage: 95,
    showBeetNumbers: true,
    showPlantAge: true,
  },
  // NAS HTTP-API Einstellungen (DB.5)
  nasSettings: {
    enabled: false,
    url: '',      // z. B. "http://100.x.y.z:3003"
  },
  // Lageplan-Ansicht (Schritt 5)
  gardenView: 'classic', // 'classic' | 'quadrant'
  gardenLayout: {
    gartenBreite: 85,
    gartenHoehe:  43,
    weg: {
      xPosition: 41,
      xBreite:    3,
      yPosition: 20,
      yBreite:    3,
    },
    rondeau: {
      radius: 3.5,
      aktiv:  true,
    },
    quadranten: [
      { id: 'NW', orientierung: 'ns', standardBeetBreite: 1.5, abstandZwischenBeeten: 0.5 },
      { id: 'NO', orientierung: 'wo', standardBeetBreite: 1.5, abstandZwischenBeeten: 0.5 },
      { id: 'SW', orientierung: 'ns', standardBeetBreite: 1.5, abstandZwischenBeeten: 0.5 },
      { id: 'SO', orientierung: 'wo', standardBeetBreite: 1.5, abstandZwischenBeeten: 0.5 },
    ],
    beetZuordnung: [],
  },
};

let configCache = null;

/**
 * Liest die Konfigurationsdatei
 * @returns {Object} Die aktuelle Konfiguration
 */
function getConfig() {
  if (configCache) return configCache;
  
  const configPath = fileUtils.getConfigFilePath();
  
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      configCache = { ...defaultConfig, ...JSON.parse(configData) };
      return configCache;
    }
  } catch (error) {
    console.error('Fehler beim Lesen der Konfigurationsdatei:', error);
  }
  
  // Wenn keine Konfiguration existiert oder ein Fehler auftritt, Standard-Konfiguration verwenden
  configCache = { ...defaultConfig };
  return configCache;
}

/**
 * Speichert die Konfiguration
 * @param {Object} newConfig - Die zu speichernde Konfiguration
 * @returns {boolean} true wenn erfolgreich, false sonst
 */
function saveConfig(newConfig) {
  try {
    const configPath = fileUtils.getConfigFilePath();
    const mergedConfig = { ...getConfig(), ...newConfig };
    fs.writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2));
    configCache = mergedConfig;
    return true;
  } catch (error) {
    console.error('Fehler beim Speichern der Konfigurationsdatei:', error);
    return false;
  }
}

/**
 * Aktualisiert einen einzelnen Konfigurationswert
 * @param {string} key - Der Schlüssel des zu aktualisierenden Werts
 * @param {any} value - Der neue Wert
 * @returns {boolean} true wenn erfolgreich, false sonst
 */
function updateConfigValue(key, value) {
  const currentConfig = getConfig();
  currentConfig[key] = value;
  return saveConfig(currentConfig);
}

/**
 * Aktualisiert eine Benutzereinstellung
 * @param {string} key - Der Schlüssel der zu aktualisierenden Einstellung
 * @param {any} value - Der neue Wert
 * @returns {boolean} true wenn erfolgreich, false sonst
 */
function updateUserPreference(key, value) {
  const currentConfig = getConfig();
  if (!currentConfig.userPreferences) {
    currentConfig.userPreferences = {};
  }
  currentConfig.userPreferences[key] = value;
  return saveConfig(currentConfig);
}

/**
 * Initialisiert die Konfiguration
 */
function initConfig() {
  const config = getConfig();
  
  // Wenn exportPath nicht gesetzt ist, Download-Ordner verwenden
  if (!config.exportPath) {
    config.exportPath = app.getPath('downloads');
    saveConfig(config);
  }
  
  return config;
}

module.exports = {
  getConfig,
  saveConfig,
  updateConfigValue,
  updateUserPreference,
  initConfig
};
