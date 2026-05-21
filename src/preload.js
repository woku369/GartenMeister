// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

// Hier exponieren wir sichere APIs zum Renderer-Prozess
contextBridge.exposeInMainWorld('electronAPI', {
  // Generische IPC-Invoke-Methode
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  
  // Pfad-Operationen
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  
  // PDF-Export
  exportPDF: (data) => ipcRenderer.invoke('export-pdf', data),
  openPDFFile: (filePath) => ipcRenderer.invoke('open-pdf-file', filePath),
  openExportFolder: () => ipcRenderer.invoke('open-export-folder'),
  
  // App-Version
  getAppVersion: () => process.env.npm_package_version || '0.1.0',

  // App-Plattform
  getPlatform: () => process.platform,
  
  // Konfiguration
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  updateUserPreference: (key, value) => ipcRenderer.invoke('update-user-preference', key, value),
  
  // Garten-Konfiguration
  getGartenConfiguration: () => ipcRenderer.invoke('garten-config:get'),
  updateGartenConfiguration: (config) => ipcRenderer.invoke('garten-config:update', config),
  
  // Datei-Operationen
  openExportFolder: () => ipcRenderer.invoke('open-export-folder'),
  getDatabasePath: () => ipcRenderer.invoke('get-database-path'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  selectCloudSyncDirectory: () => ipcRenderer.invoke('select-cloud-sync-directory'),
  
  // Erweiterte Datei-Operationen für storage-manager
  getDataFilePath: (filename) => ipcRenderer.invoke('get-data-file-path', filename),
  fileExists: (path) => ipcRenderer.invoke('file-exists', path),
  readJsonFile: (path) => ipcRenderer.invoke('read-json-file', path),
  writeJsonFile: (path, data) => ipcRenderer.invoke('write-json-file', path, data),
  createBackupFolder: (timestamp) => ipcRenderer.invoke('create-backup-folder', timestamp),
  backupDataFiles: (backupPath) => ipcRenderer.invoke('backup-data-files', backupPath),
  ensureDirectory: (dirPath) => ipcRenderer.invoke('ensure-directory', dirPath),
  
  // Backup/Restore System
  createBackup: (options) => ipcRenderer.invoke('backup:create', options),
  listBackups: () => ipcRenderer.invoke('backup:list'),
  restoreBackup: (backupPath) => ipcRenderer.invoke('backup:restore', backupPath),
  deleteBackup: (backupPath) => ipcRenderer.invoke('backup:delete', backupPath),
  
  // ===== IMAGE MANAGEMENT SYSTEM =====
  
  // Bilder-API
  images: {
    getAll: (options) => ipcRenderer.invoke('images:get-all', options),
    getById: (imageId) => ipcRenderer.invoke('images:get-by-id', imageId),
    upload: (uploadData) => ipcRenderer.invoke('images:upload', uploadData),
    updateMetadata: (imageId, metadata) => ipcRenderer.invoke('images:update-metadata', imageId, metadata),
    delete: (imageId) => ipcRenderer.invoke('images:delete', imageId),
    batchUpload: (files) => ipcRenderer.invoke('images:batch-upload', files),
    selectFiles: () => ipcRenderer.invoke('images:select-files'),
    getStatistics: () => ipcRenderer.invoke('images:get-statistics'),
    
    // Kommentare
    addComment: (imageId, comment) => ipcRenderer.invoke('images:add-comment', imageId, comment),
    editComment: (imageId, commentId, newText) => ipcRenderer.invoke('images:edit-comment', imageId, commentId, newText),
    deleteComment: (imageId, commentId) => ipcRenderer.invoke('images:delete-comment', imageId, commentId),
    
    // Interaktionen
    addRating: (imageId, rating) => ipcRenderer.invoke('images:add-rating', imageId, rating),
    toggleFavorite: (imageId) => ipcRenderer.invoke('images:toggle-favorite', imageId),
    incrementViewCount: (imageId) => ipcRenderer.invoke('images:increment-view-count', imageId),
    getFileUrl: (filePath) => ipcRenderer.invoke('images:get-file-url', filePath)
  },
  
  // ===== USER MANAGEMENT SYSTEM =====
  
  // Benutzer-API
  users: {
    getCurrent: () => ipcRenderer.invoke('users:get-current'),
    getAll: () => ipcRenderer.invoke('users:get-all'),
    add: (userData) => ipcRenderer.invoke('users:add', userData),
    update: (userId, updates) => ipcRenderer.invoke('users:update', userId, updates),
    delete: (userId) => ipcRenderer.invoke('users:delete', userId),
    setCurrent: (userId) => ipcRenderer.invoke('users:setCurrent', userId)
  },

  // ===== CORE GARDEN MANAGEMENT SYSTEM =====
  
  // Beet-Management API
  beds: {
    getAll: () => ipcRenderer.invoke('beds:get-all'),
    getById: (id) => ipcRenderer.invoke('beds:get-by-id', id),
    create: (data) => ipcRenderer.invoke('beds:create', data),
    update: (id, data) => ipcRenderer.invoke('beds:update', id, data),
    delete: (id) => ipcRenderer.invoke('beds:delete', id)
  },

  // Kräuter-Management API
  herbs: {
    getAll: () => ipcRenderer.invoke('herbs:get-all'),
    getById: (id) => ipcRenderer.invoke('herbs:get-by-id', id),
    create: (data) => ipcRenderer.invoke('herbs:create', data),
    update: (id, data) => ipcRenderer.invoke('herbs:update', id, data),
    delete: (id) => ipcRenderer.invoke('herbs:delete', id)
  },

  // Segment-Management API (für Kombinationsbeete)
  segments: {
    getAll: () => ipcRenderer.invoke('segments:get-all'),
    getById: (id) => ipcRenderer.invoke('segments:get-by-id', id),
    create: (data) => ipcRenderer.invoke('segments:create', data),
    update: (id, data) => ipcRenderer.invoke('segments:update', id, data),
    delete: (id) => ipcRenderer.invoke('segments:delete', id)
  },

  // Ernte-Management API
  harvests: {
    getAll: () => ipcRenderer.invoke('harvests:get-all'),
    getEvents: () => ipcRenderer.invoke('harvest-events:get-all'),
    getContributions: () => ipcRenderer.invoke('harvest-contributions:get-all'),
    createEvent: (data) => ipcRenderer.invoke('harvest-events:create', data),
    createContribution: (data) => ipcRenderer.invoke('harvest-contributions:create', data)
  },

  // OneDrive-Integration
  onedrive: {
    checkStatus: () => ipcRenderer.invoke('onedrive:check-status'),
    syncData: () => ipcRenderer.invoke('onedrive:sync-data'),
    exportFile: (fileName, content) => ipcRenderer.invoke('onedrive:export-file', fileName, content),
    listBackups: () => ipcRenderer.invoke('onedrive:list-backups'),
    restoreBackup: (backupFilePath) => ipcRenderer.invoke('onedrive:restore-backup', backupFilePath),
    setCustomPath: (customPath) => ipcRenderer.invoke('onedrive:set-custom-path', customPath),
    getConfiguration: () => ipcRenderer.invoke('onedrive:get-configuration')
  },

  // Weather API Configuration
  weather: {
    getConfig: () => ipcRenderer.invoke('weather:get-config'),
    saveConfig: (config) => ipcRenderer.invoke('weather:save-config', config),
    testProvider: (provider, config) => ipcRenderer.invoke('weather:test-provider', provider, config)
  },

  // ===== DOCUMENT MANAGEMENT SYSTEM (DB.3) =====
  documents: {
    upload:  (data)         => ipcRenderer.invoke('documents:upload',   data),
    getList: (options)      => ipcRenderer.invoke('documents:get-list', options),
    getFile: (documentId)   => ipcRenderer.invoke('documents:get-file', documentId),
    delete:  (documentId)   => ipcRenderer.invoke('documents:delete',   documentId),
  }
});

console.log('Preload-Skript geladen, APIs exponiert.');

// Expose geschützte Methoden vom Main-Prozess zum Renderer-Prozess (Next.js)
contextBridge.exposeInMainWorld('electron', {
  // Pfad-Hilfsfunktionen
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  
  // Konfiguration
  getAppConfig: async () => {
    // Grundkonfiguration für die Desktop-App
    return {
      isDesktopApp: true,
      version: process.env.npm_package_version || '0.1.0',
      platform: process.platform
    };
  },
  
  // PDF-Export
  exportPDF: (data) => ipcRenderer.invoke('export-pdf', data),
  openPDFFile: (filePath) => ipcRenderer.invoke('open-pdf-file', filePath),
  openExportFolder: () => ipcRenderer.invoke('open-export-folder'),
  
  // Datei-Dialog
  selectFile: async (options) => {
    return await ipcRenderer.invoke('select-file', options);
  },
  
  // Ordner-Auswahl
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  selectCloudSyncDirectory: () => ipcRenderer.invoke('select-cloud-sync-directory'),

  // App-Zustand
  minimizeApp: () => ipcRenderer.send('minimize-app'),
  maximizeApp: () => ipcRenderer.send('maximize-app'),
  closeApp: () => ipcRenderer.send('close-app'),
  
  // PORTABLE EXE: Navigation
  navigateTo: (route) => ipcRenderer.invoke('navigate-to', route)
});
