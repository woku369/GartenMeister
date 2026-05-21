/**
 * Electron-Bridge für die Kommunikation zwischen Next.js und Electron
 */

// Typdefinitionen für die Electron-API
declare global {
  interface Window {
    electronAPI?: {
      getAppPath: () => Promise<string>,
      exportPDF: (data: any) => Promise<{ success: boolean, message: string }>,
      getAppVersion: () => string,
      getPlatform: () => string,
      getConfig: () => Promise<any>,
      saveConfig: (config: any) => Promise<boolean>,
      updateUserPreference: (key: string, value: any) => Promise<boolean>,
      
      // Garten-Konfiguration APIs
      getGartenConfiguration: () => Promise<any>,
      updateGartenConfiguration: (config: any) => Promise<boolean>,
      
      openExportFolder: () => Promise<string>,
      getDatabasePath: () => Promise<string>,
      selectDirectory: () => Promise<string>,
      // Neue Dateioperationen für storage-manager.ts
      getDataFilePath: (filename: string) => Promise<string>,
      fileExists: (path: string) => Promise<boolean>,
      readJsonFile: <T>(path: string) => Promise<T>,
      writeJsonFile: <T>(path: string, data: T) => Promise<boolean>,
      createBackupFolder: (timestamp: string) => Promise<string>,
      backupDataFiles: (backupPath: string) => Promise<boolean>,
      
      // Backup/Restore System
      createBackup: (options?: { description?: string }) => Promise<{ success: boolean, backupPath?: string, timestamp?: string, filesCount?: number, error?: string }>,
      listBackups: () => Promise<BackupInfo[]>,
      restoreBackup: (backupPath: string) => Promise<{ success: boolean, restoredFiles?: number, backupInfo?: any, error?: string }>,
      deleteBackup: (backupPath: string) => Promise<{ success: boolean, error?: string }>,

      // Image Management System APIs
      images: {
        getAll: (options?: any) => Promise<ImageMetadata[]>,
        getById: (imageId: string) => Promise<ImageMetadata | null>,
        upload: (uploadData: any) => Promise<ImageMetadata>,
        updateMetadata: (imageId: string, metadata: any) => Promise<ImageMetadata>,
        delete: (imageId: string) => Promise<boolean>,
        batchUpload: (files: any[]) => Promise<BatchUploadResult>,
        selectFiles: () => Promise<string[]>,
        getStatistics: () => Promise<ImageStatistics>,
        getFileUrl: (filePath: string) => Promise<string>,
        addComment: (imageId: string, comment: CommentData) => Promise<Comment>,
        editComment: (imageId: string, commentId: string, newText: string) => Promise<Comment>,
        deleteComment: (imageId: string, commentId: string) => Promise<boolean>,
        addRating: (imageId: string, rating: RatingData) => Promise<Rating>,
        toggleFavorite: (imageId: string) => Promise<boolean>,
        incrementViewCount: (imageId: string) => Promise<boolean>,
      },

      // Weather API Configuration
      weather: {
        getConfig: () => Promise<any>,
        saveConfig: (config: any) => Promise<{ success: boolean, error?: string }>,
        testProvider: (provider: string, config: any) => Promise<{ success: boolean, message: string }>
      },

      // Harvest Management System APIs
      harvests: {
        create: (harvestData: any) => Promise<any>,
        update: (harvestData: any) => Promise<any>,
        delete: (harvestId: string) => Promise<boolean>,
      },

      // User Management System APIs
      users: {
        getAll: (options?: any) => Promise<UserData[]>,
        getCurrent: () => Promise<UserData | null>,
        add: (userData: any) => Promise<UserData>,
        update: (userId: string, updates: any) => Promise<UserData>,
        delete: (userId: string) => Promise<boolean>,
        setCurrent: (userId: string) => Promise<boolean>,
        getStats: (userId: string) => Promise<any>,
        getAllWithStats: () => Promise<UserData[]>,
      },

      // OneDrive Integration APIs
      onedrive: {
        checkStatus: () => Promise<{ available: boolean, path?: string, error?: string }>,
        syncData: () => Promise<{ success: boolean, message?: string, error?: string }>,
        setCustomPath: (path: string) => Promise<{ success: boolean, message?: string, error?: string }>,
        listBackups: () => Promise<{ backups: any[], error?: string }>,
        restoreBackup: (fileName: string) => Promise<{ success: boolean, message?: string, error?: string }>,
        exportFile: (fileName: string, content: string) => Promise<{ success: boolean, message?: string, error?: string }>,
        getConfiguration: () => Promise<any>,
      },

      // Document Management APIs (DB.3)
      documents: {
        upload: (data: DocumentUploadData) => Promise<DocumentMetadata>,
        getList: (options?: DocumentListOptions) => Promise<DocumentMetadata[]>,
        getFile: (documentId: string) => Promise<DocumentMetadata & { dataUrl: string }>,
        delete: (documentId: string) => Promise<boolean>,
      },
    }
  }
}

// User Data Interface
interface UserData {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'user';
  createdAt: string;
  preferences: {
    defaultCategory: string;
    autoTagging: boolean;
    notifications: boolean;
  };
}

// Backup System Interface
interface BackupInfo {
  path: string;
  folder: string;
  timestamp: string;
  version: string;
  description: string;
  files: string[];
  size: number;
  created: string;
}

// Prüfen, ob wir in Electron laufen
export const isElectron = (): boolean => {
  // Client-Side Check
  if (typeof window === 'undefined') return false;
  
  try {
    // Prüfen, ob das electronAPI-Objekt existiert und zugänglich ist
    return (!!window.electronAPI || 
      // Weitere Erkennungsmethoden für Electron
      window.navigator.userAgent.toLowerCase().indexOf('electron') > -1 ||
      // Process-Check falls verfügbar
      typeof process !== 'undefined' && 
      process?.versions?.hasOwnProperty('electron'));
  } catch (error) {
    console.error('Fehler beim Prüfen der Electron-Umgebung:', error);
    return false;
  }
};

// Electron-API Wrapper
export const electronAPI = {
  // Prüfen, ob wir in einer Electron-Umgebung sind
  isElectron: isElectron,
  
  // App-Pfad abrufen (für lokale Datenspeicherung)
  getAppPath: async (): Promise<string | null> => {
    if (isElectron() && window.electronAPI && typeof window.electronAPI.getAppPath === 'function') {
      try {
        return await window.electronAPI.getAppPath();
      } catch (error) {
        console.error('Fehler beim Abrufen des App-Pfads:', error);
        return null;
      }
    }
    return null;
  },
    // PDF exportieren
  exportPDF: async (data: any): Promise<{ success: boolean, message: string }> => {
    if (isElectron() && window.electronAPI && typeof window.electronAPI.exportPDF === 'function') {
      try {
        return await window.electronAPI.exportPDF(data);
      } catch (error) {
        console.error('Fehler beim PDF-Export:', error);
        return { success: false, message: 'PDF-Export fehlgeschlagen: ' + (error as Error).message };
      }
    }
    return { success: false, message: 'PDF-Export ist nur in der Desktop-App verfügbar' };
  },
    // App-Version abrufen
  getAppVersion: (): string => {
    if (isElectron() && window.electronAPI && typeof window.electronAPI.getAppVersion === 'function') {
      try {
        return window.electronAPI.getAppVersion();
      } catch (error) {
        console.error('Fehler beim Abrufen der App-Version:', error);
        return '0.0.0-web';
      }
    }
    return '0.0.0-web';
  },
  
  // Plattform abrufen
  getPlatform: (): string => {
    if (isElectron() && window.electronAPI && typeof window.electronAPI.getPlatform === 'function') {
      try {
        return window.electronAPI.getPlatform();
      } catch (error) {
        console.error('Fehler beim Abrufen der Plattform:', error);
        return 'web';
      }
    }
    return 'web';
  },
    // Konfiguration abrufen
  getConfig: async (): Promise<any | null> => {
    if (isElectron() && window.electronAPI && typeof window.electronAPI.getConfig === 'function') {
      try {
        return await window.electronAPI.getConfig();
      } catch (error) {
        console.error('Fehler beim Abrufen der Konfiguration:', error);
        return null;
      }
    }
    return null;
  },
    // Konfiguration speichern
  saveConfig: async (config: any): Promise<boolean> => {
    if (isElectron() && window.electronAPI && typeof window.electronAPI.saveConfig === 'function') {
      try {
        return await window.electronAPI.saveConfig(config);
      } catch (error) {
        console.error('Fehler beim Speichern der Konfiguration:', error);
        return false;
      }
    }
    return false;
  },
  
  // Benutzereinstellung aktualisieren
  updateUserPreference: async (key: string, value: any): Promise<boolean> => {
    if (isElectron() && window.electronAPI && typeof window.electronAPI.updateUserPreference === 'function') {
      try {
        return await window.electronAPI.updateUserPreference(key, value);
      } catch (error) {
        console.error('Fehler beim Aktualisieren der Benutzereinstellung:', error);
        return false;
      }
    }
    return false;
  },
    // Export-Ordner öffnen
  openExportFolder: async (): Promise<string | null> => {
    if (isElectron() && window.electronAPI && typeof window.electronAPI.openExportFolder === 'function') {
      try {
        return await window.electronAPI.openExportFolder();
      } catch (error) {
        console.error('Fehler beim Öffnen des Export-Ordners:', error);
        return null;
      }
    }
    return null;
  },
    // Datenbank-Pfad abrufen
  getDatabasePath: async (): Promise<string | null> => {
    if (isElectron() && window.electronAPI && typeof window.electronAPI.getDatabasePath === 'function') {
      try {
        return await window.electronAPI.getDatabasePath();
      } catch (error) {
        console.error('Fehler beim Abrufen des Datenbank-Pfads:', error);
        return null;
      }
    }
    return null;
  },

  // Datei-Pfad für Datenspeicherung generieren
  getDataFilePath: async (filename: string): Promise<string | null> => {
    if (isElectron() && window.electronAPI && typeof window.electronAPI.getDataFilePath === 'function') {
      try {
        return await window.electronAPI.getDataFilePath(filename);
      } catch (error) {
        console.error(`Fehler beim Generieren des Dateipfads für ${filename}:`, error);
        return null;
      }
    }
    return null;
  },

  // Prüfen, ob eine Datei existiert
  fileExists: async (path: string): Promise<boolean> => {
    if (isElectron() && window.electronAPI && typeof window.electronAPI.fileExists === 'function') {
      try {
        return await window.electronAPI.fileExists(path);
      } catch (error) {
        console.error(`Fehler beim Prüfen der Datei-Existenz von ${path}:`, error);
        return false;
      }
    }
    return false;
  },

  // JSON-Datei lesen
  readJsonFile: async <T>(path: string): Promise<T | null> => {
    if (isElectron() && window.electronAPI && typeof window.electronAPI.readJsonFile === 'function') {
      try {
        return await window.electronAPI.readJsonFile<T>(path);
      } catch (error) {
        console.error(`Fehler beim Lesen der JSON-Datei ${path}:`, error);
        return null;
      }
    }
    return null;
  },

  // JSON-Datei schreiben
  writeJsonFile: async <T>(path: string, data: T): Promise<boolean> => {
    if (isElectron() && window.electronAPI && typeof window.electronAPI.writeJsonFile === 'function') {
      try {
        return await window.electronAPI.writeJsonFile(path, data);
      } catch (error) {
        console.error(`Fehler beim Schreiben der JSON-Datei ${path}:`, error);
        return false;
      }
    }
    return false;
  },

  // Backup-Ordner erstellen
  createBackupFolder: async (timestamp: string): Promise<string | null> => {
    if (isElectron() && window.electronAPI && typeof window.electronAPI.createBackupFolder === 'function') {
      try {
        return await window.electronAPI.createBackupFolder(timestamp);
      } catch (error) {
        console.error('Fehler beim Erstellen des Backup-Ordners:', error);
        return null;
      }
    }
    return null;
  },

  // Datei-Backup durchführen
  backupDataFiles: async (backupPath: string): Promise<boolean> => {
    if (isElectron() && window.electronAPI && typeof window.electronAPI.backupDataFiles === 'function') {
      try {
        return await window.electronAPI.backupDataFiles(backupPath);
      } catch (error) {
        console.error('Fehler beim Sichern der Dateien:', error);
        return false;
      }
    }
    return false;
  },

  // Ordner-Auswahl-Dialog öffnen
  selectDirectory: async (): Promise<string | null> => {
    if (isElectron() && window.electronAPI && typeof window.electronAPI.selectDirectory === 'function') {
      try {
        return await window.electronAPI.selectDirectory();
      } catch (error) {
        console.error('Fehler beim Ordner-Auswahl-Dialog:', error);
        return null;
      }
    }
    return null;
  },

  // Image Management APIs
  images: {
    getAll: async (options?: any): Promise<ImageMetadata[]> => {
      if (isElectron() && window.electronAPI?.images?.getAll) {
        try { return await window.electronAPI.images.getAll(options); }
        catch (e) { console.error('[IPC] images:get-all:', e); return []; }
      }
      return [];
    },
    getById: async (imageId: string): Promise<ImageMetadata | null> => {
      if (isElectron() && window.electronAPI?.images?.getById) {
        try { return await window.electronAPI.images.getById(imageId); }
        catch (e) { console.error('[IPC] images:get-by-id:', e); return null; }
      }
      return null;
    },
    upload: async (uploadData: any): Promise<ImageMetadata | null> => {
      if (isElectron() && window.electronAPI?.images?.upload) {
        try { return await window.electronAPI.images.upload(uploadData); }
        catch (e) { console.error('[IPC] images:upload:', e); return null; }
      }
      return null;
    },
    updateMetadata: async (imageId: string, metadata: any): Promise<ImageMetadata | null> => {
      if (isElectron() && window.electronAPI?.images?.updateMetadata) {
        try { return await window.electronAPI.images.updateMetadata(imageId, metadata); }
        catch (e) { console.error('[IPC] images:update-metadata:', e); return null; }
      }
      return null;
    },
    delete: async (imageId: string): Promise<boolean> => {
      if (isElectron() && window.electronAPI?.images?.delete) {
        try { return await window.electronAPI.images.delete(imageId); }
        catch (e) { console.error('[IPC] images:delete:', e); return false; }
      }
      return false;
    },
    batchUpload: async (files: any[]): Promise<BatchUploadResult | null> => {
      if (isElectron() && window.electronAPI?.images?.batchUpload) {
        try { return await window.electronAPI.images.batchUpload(files); }
        catch (e) { console.error('[IPC] images:batch-upload:', e); return null; }
      }
      return null;
    },
    selectFiles: async (): Promise<string[]> => {
      if (isElectron() && window.electronAPI?.images?.selectFiles) {
        try { return await window.electronAPI.images.selectFiles(); }
        catch (e) { console.error('[IPC] images:select-files:', e); return []; }
      }
      return [];
    },
    getStatistics: async (): Promise<ImageStatistics | null> => {
      if (isElectron() && window.electronAPI?.images?.getStatistics) {
        try { return await window.electronAPI.images.getStatistics(); }
        catch (e) { console.error('[IPC] images:get-statistics:', e); return null; }
      }
      return null;
    },
    getFileUrl: async (filePath: string): Promise<string | null> => {
      if (isElectron() && window.electronAPI?.images?.getFileUrl) {
        try { return await window.electronAPI.images.getFileUrl(filePath); }
        catch (e) { console.error('[IPC] images:get-file-url:', e); return null; }
      }
      return null;
    },
    addComment: async (imageId: string, comment: CommentData): Promise<Comment | null> => {
      if (isElectron() && window.electronAPI?.images?.addComment) {
        try { return await window.electronAPI.images.addComment(imageId, comment); }
        catch (e) { console.error('[IPC] images:add-comment:', e); return null; }
      }
      return null;
    },
    editComment: async (imageId: string, commentId: string, newText: string): Promise<Comment | null> => {
      if (isElectron() && window.electronAPI?.images?.editComment) {
        try { return await window.electronAPI.images.editComment(imageId, commentId, newText); }
        catch (e) { console.error('[IPC] images:edit-comment:', e); return null; }
      }
      return null;
    },
    deleteComment: async (imageId: string, commentId: string): Promise<boolean> => {
      if (isElectron() && window.electronAPI?.images?.deleteComment) {
        try { return await window.electronAPI.images.deleteComment(imageId, commentId); }
        catch (e) { console.error('[IPC] images:delete-comment:', e); return false; }
      }
      return false;
    },
    addRating: async (imageId: string, rating: RatingData): Promise<Rating | null> => {
      if (isElectron() && window.electronAPI?.images?.addRating) {
        try { return await window.electronAPI.images.addRating(imageId, rating); }
        catch (e) { console.error('[IPC] images:add-rating:', e); return null; }
      }
      return null;
    },
    toggleFavorite: async (imageId: string): Promise<boolean> => {
      if (isElectron() && window.electronAPI?.images?.toggleFavorite) {
        try { return await window.electronAPI.images.toggleFavorite(imageId); }
        catch (e) { console.error('[IPC] images:toggle-favorite:', e); return false; }
      }
      return false;
    },
    incrementViewCount: async (imageId: string): Promise<boolean> => {
      if (isElectron() && window.electronAPI?.images?.incrementViewCount) {
        try { return await window.electronAPI.images.incrementViewCount(imageId); }
        catch (e) { console.error('[IPC] images:increment-view-count:', e); return false; }
      }
      return false;
    },
  },
  onedrive: {
    checkStatus: async () => {
      console.log('🔍 OneDrive checkStatus aufgerufen');
      console.log('🔍 isElectron():', isElectron());
      console.log('🔍 window.electronAPI:', typeof window !== 'undefined' ? window.electronAPI : 'undefined');
      console.log('🔍 window.electronAPI Keys:', typeof window !== 'undefined' && window.electronAPI ? Object.keys(window.electronAPI) : 'keine Keys');
      
      if (isElectron() && window.electronAPI) {
        try {
          // Direkte IPC-Alternative falls verschachtelte API nicht funktioniert
          if (window.electronAPI.onedrive?.checkStatus) {
            console.log('✅ Verschachtelte OneDrive API verfügbar');
            return await window.electronAPI.onedrive.checkStatus();
          }
          
          // Fallback: Direkte IPC über ipcRenderer (falls verfügbar)
          if (typeof window.require !== 'undefined') {
            console.log('🔄 Fallback: Direkte IPC verwenden');
            const { ipcRenderer } = window.require('electron');
            return await ipcRenderer.invoke('onedrive:check-status');
          }
          
          console.log('❌ Keine OneDrive API verfügbar');
          return { available: false, error: 'OneDrive API nicht gefunden' };
        } catch (error) {
          console.error('❌ Fehler beim Prüfen des OneDrive-Status:', error);
          return { available: false, error: (error as Error).message };
        }
      }
      console.log('❌ Nicht in Electron oder electronAPI nicht verfügbar');
      return { available: false, error: 'OneDrive ist nur in der Desktop-App verfügbar' };
    },

    syncData: async () => {
      if (isElectron() && window.electronAPI?.onedrive?.syncData) {
        try {
          return await window.electronAPI.onedrive.syncData();
        } catch (error) {
          console.error('Fehler beim OneDrive-Sync:', error);
          return { success: false, error: (error as Error).message };
        }
      }
      return { success: false, error: 'OneDrive-Sync ist nur in der Desktop-App verfügbar' };
    },

    setCustomPath: async (path: string) => {
      if (isElectron() && window.electronAPI?.onedrive?.setCustomPath) {
        try {
          return await window.electronAPI.onedrive.setCustomPath(path);
        } catch (error) {
          console.error('Fehler beim Setzen des OneDrive-Pfads:', error);
          return { success: false, error: (error as Error).message };
        }
      }
      return { success: false, error: 'OneDrive-Pfad setzen ist nur in der Desktop-App verfügbar' };
    },

    listBackups: async () => {
      if (isElectron() && window.electronAPI?.onedrive?.listBackups) {
        try {
          return await window.electronAPI.onedrive.listBackups();
        } catch (error) {
          console.error('Fehler beim Laden der OneDrive-Backups:', error);
          return { backups: [], error: (error as Error).message };
        }
      }
      return { backups: [], error: 'OneDrive-Backups sind nur in der Desktop-App verfügbar' };
    },

    restoreBackup: async (fileName: string) => {
      if (isElectron() && window.electronAPI?.onedrive?.restoreBackup) {
        try {
          return await window.electronAPI.onedrive.restoreBackup(fileName);
        } catch (error) {
          console.error('Fehler beim OneDrive-Backup-Restore:', error);
          return { success: false, error: (error as Error).message };
        }
      }
      return { success: false, error: 'OneDrive-Backup-Restore ist nur in der Desktop-App verfügbar' };
    },

    exportFile: async (fileName: string, content: string) => {
      if (isElectron() && window.electronAPI?.onedrive?.exportFile) {
        try {
          return await window.electronAPI.onedrive.exportFile(fileName, content);
        } catch (error) {
          console.error('Fehler beim OneDrive-Export:', error);
          return { success: false, error: (error as Error).message };
        }
      }
      return { success: false, error: 'OneDrive-Export ist nur in der Desktop-App verfügbar' };
    }
  },

  // Document Management APIs (DB.3)
  documents: {
    upload: async (data: DocumentUploadData): Promise<DocumentMetadata | null> => {
      if (isElectron() && window.electronAPI?.documents?.upload) {
        try { return await window.electronAPI.documents.upload(data); }
        catch (e) { console.error('[IPC] documents:upload:', e); return null; }
      }
      return null;
    },
    getList: async (options?: DocumentListOptions): Promise<DocumentMetadata[]> => {
      if (isElectron() && window.electronAPI?.documents?.getList) {
        try { return await window.electronAPI.documents.getList(options); }
        catch (e) { console.error('[IPC] documents:get-list:', e); return []; }
      }
      return [];
    },
    getFile: async (documentId: string): Promise<(DocumentMetadata & { dataUrl: string }) | null> => {
      if (isElectron() && window.electronAPI?.documents?.getFile) {
        try { return await window.electronAPI.documents.getFile(documentId); }
        catch (e) { console.error('[IPC] documents:get-file:', e); return null; }
      }
      return null;
    },
    delete: async (documentId: string): Promise<boolean> => {
      if (isElectron() && window.electronAPI?.documents?.delete) {
        try { return await window.electronAPI.documents.delete(documentId); }
        catch (e) { console.error('[IPC] documents:delete:', e); return false; }
      }
      return false;
    },
  },

  // Weather API Configuration
  weather: {
    getConfig: async () => {
      if (isElectron() && window.electronAPI?.weather?.getConfig) {
        try {
          return await window.electronAPI.weather.getConfig();
        } catch (error) {
          console.error('Fehler beim Laden der Wetter-Konfiguration:', error);
          return null;
        }
      }
      // Mock für Browser
      return {
        activeProvider: 'openweathermap',
        providers: {
          openweathermap: { apiKey: '', enabled: true },
          meteoblue: { apiKey: '', enabled: false },
          customStation: { endpoint: '', apiKey: '', enabled: false }
        }
      };
    },

    saveConfig: async (config: any) => {
      if (isElectron() && window.electronAPI?.weather?.saveConfig) {
        try {
          return await window.electronAPI.weather.saveConfig(config);
        } catch (error) {
          console.error('Fehler beim Speichern der Wetter-Konfiguration:', error);
          return { success: false, error: (error as Error).message };
        }
      }
      return { success: false, error: 'Wetter-Konfiguration ist nur in der Desktop-App verfügbar' };
    },

    testProvider: async (provider: string, config: any) => {
      if (isElectron() && window.electronAPI?.weather?.testProvider) {
        try {
          return await window.electronAPI.weather.testProvider(provider, config);
        } catch (error) {
          console.error('Fehler beim Testen des Wetter-Providers:', error);
          return { success: false, message: (error as Error).message };
        }
      }
      return { success: false, message: 'Provider-Test ist nur in der Desktop-App verfügbar' };
    }
  }
};

// PDF-Export-Funktion für Beete, Berichte und Gartenübersicht
export const exportToPDF = async (
  data: { type: 'beds' | 'reports' | 'garden-overview', [key: string]: any } | 'beds' | 'reports', 
  oldData?: any[]
): Promise<{ success: boolean, message: string, path?: string }> => {
  if (!isElectron()) {
    return { success: false, message: 'PDF-Export ist nur in der Desktop-App verfügbar' };
  }
  
  try {
    // Wenn es der alte Aufruf mit type als separaten Parameter ist, wandeln wir es in das neue Format um
    let exportData: { type: string, [key: string]: any };
    if (typeof data === 'string' && (data === 'beds' || data === 'reports') && oldData) {
      console.warn('Veralteter Aufruf von exportToPDF - bitte aktualisieren');
      exportData = {
        type: data,
        data: oldData,
        timestamp: new Date().toISOString()
      };
    } else {
      exportData = data as { type: 'beds' | 'reports' | 'garden-overview', [key: string]: any };
    }
      const result = await electronAPI.exportPDF(exportData);
    
    console.log('PDF-Export-Ergebnis:', result);
    return result;
  } catch (error) {
    console.error('PDF-Export fehlgeschlagen:', error);
    return { success: false, message: 'PDF-Export fehlgeschlagen: ' + (error as Error).message };
  }
};

// Typdefinitionen für das Image Management System
export interface ImageMetadata {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadDate: string;
  takenDate: string;
  uploadedBy: string;
  title: string;
  description: string;
  tags: string[];
  bedId?: string;
  plantType: string;
  category: 'Wachstum' | 'Ernte' | 'Schädlinge' | 'Allgemein';
  location: string;
  weather: string;
  isArchived: boolean;
  isFavorite: boolean;
  viewCount: number;
  lastViewed?: string;
  comments: Comment[];
  ratings: Rating[];
  
  // Datum-Metadaten für UI-Hinweise
  _dateEstimated?: boolean;
  _dateSource?: 'exif' | 'filename' | 'filename-dsc-estimated' | 'filesystem' | 'filesystem-dsc-fallback' | 'upload-fallback' | 'explicit' | 'unknown';
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  isEdited: boolean;
  editHistory: any[];
}

export interface Rating {
  author: string;
  rating: number;
  timestamp: string;
}

export interface UploadData {
  filePath: string;
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  bedId?: string;
  plantType?: string;
  location?: string;
  weather?: string;
  uploadedBy: string;
  takenDate?: string; // EXIF-Aufnahmedatum
}

export interface CommentData {
  text: string;
  author: string;
}

export interface RatingData {
  rating: number;
  author: string;
}

export interface BatchUploadResult {
  successful: ImageMetadata[];
  failed: {
    filePath: string;
    error: string;
  }[];
  totalCount: number;
  successCount: number;
  failedCount: number;
}

export interface ImageStatistics {
  totalImages: number;
  totalSize: number;
  categoryCounts: Record<string, number>;
  topUploaders: {
    author: string;
    count: number;
  }[];
  recentUploads: number;
  favoriteCount: number;
  averageRating: number;
}

// Typdefinitionen für das User Management System
export interface UserData {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'user';
  createdAt: string;
  preferences: {
    defaultCategory: string;
    autoTagging: boolean;
    notifications: boolean;
  };
}

// Backup System Interface
export interface BackupInfo {
  path: string;
  folder: string;
  timestamp: string;
  version: string;
  description: string;
  files: string[];
  size: number;
  created: string;
}

// Document Management Interfaces (DB.3)
export interface DocumentMetadata {
  id: string;
  documentType: string;
  name: string;
  originalName: string;
  filePath: string;
  mimeType: string;
  fileExt: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedBy: string;
  description: string;
  tags: string[];
  isNas: boolean;
  nasFilePath: string | null;
}

export interface DocumentUploadData {
  documentType: string;
  name: string;
  dataUrl: string;
  description?: string;
  tags?: string[];
  uploadedBy?: string;
}

export interface DocumentListOptions {
  documentType?: string;
  uploadedBy?: string;
}
