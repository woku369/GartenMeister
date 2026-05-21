'use client';

/**
 * FileStorageManager - Verwaltet Dateien (Fotos, PDFs, Dokumente) mit Cloud-Sync
 * Organisiert Files automatisch und verwaltet Thumbnails und Metadaten
 */

import { CloudSyncManager } from './cloud-sync-manager';

export interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  thumbnailPath?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  takenAt?: string;
  description?: string;
  tags: string[];
  gpsLat?: number;
  gpsLon?: number;
  relatedRecordType?: string;
  relatedRecordId?: string;
  cloudSynced: boolean;
  cloudPath?: string;
  checksum: string;
  created_at: string;
  updated_at: string;
}

export interface StorageConfig {
  basePath: string;
  maxFileSize: number; // MB
  supportedFormats: string[];
  generateThumbnails: boolean;
  thumbnailSize: { width: number; height: number };
  enableGpsExtraction: boolean;
  autoTagging: boolean;
  compressionLevel: number; // 0-1
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  metadata?: FileMetadata;
  error?: string;
  thumbnailGenerated?: boolean;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number; // bytes
  byType: { [mimeType: string]: { count: number; size: number } };
  cloudSyncStatus: {
    synced: number;
    pending: number;
    failed: number;
  };
  thumbnailsGenerated: number;
  recentUploads: FileMetadata[];
}

export class FileStorageManager {
  private config: StorageConfig;
  private syncManager?: CloudSyncManager;
  private supportedImageFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  private supportedDocumentFormats = ['application/pdf', 'text/plain', 'application/json'];

  constructor(config: StorageConfig) {
    this.config = config;
    this.ensureDirectoriesExist();
  }

  setSyncManager(syncManager: CloudSyncManager): void {
    this.syncManager = syncManager;
  }

  /**
   * Hauptfunktion für Datei-Upload
   */
  async uploadFile(
    file: File | Blob,
    metadata: Partial<FileMetadata> = {},
    relatedRecord?: { type: string; id: string }
  ): Promise<UploadResult> {
    try {
      // Validierung
      const validation = await this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Metadaten extrahieren
      const extractedMetadata = await this.extractMetadata(file);
      
      // Eindeutigen Dateinamen generieren
      const fileId = this.generateFileId();
      const fileName = this.generateFileName(fileId, file.type);
      const filePath = this.getFilePath(fileName, file.type);

      // Datei speichern
      await this.saveFile(file, filePath);

      // Thumbnail generieren (für Bilder)
      let thumbnailPath: string | undefined;
      if (this.config.generateThumbnails && this.isImageFile(file.type)) {
        thumbnailPath = await this.generateThumbnail(filePath, fileId);
      }

      // Vollständige Metadaten zusammenstellen
      const completeMetadata: FileMetadata = {
        id: fileId,
        filename: fileName,
        originalName: file instanceof File ? file.name : `blob_${Date.now()}`,
        path: filePath,
        thumbnailPath,
        mimeType: file.type,
        size: file.size,
        width: extractedMetadata.width,
        height: extractedMetadata.height,
        takenAt: extractedMetadata.takenAt,
        gpsLat: extractedMetadata.gpsLat,
        gpsLon: extractedMetadata.gpsLon,
        description: metadata.description,
        tags: metadata.tags || this.generateAutoTags(extractedMetadata),
        relatedRecordType: relatedRecord?.type || metadata.relatedRecordType,
        relatedRecordId: relatedRecord?.id || metadata.relatedRecordId,
        cloudSynced: false,
        checksum: await this.calculateChecksum(file),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Metadaten in Datenbank speichern
      await this.saveMetadata(completeMetadata);

      // Cloud-Sync einleiten
      if (this.syncManager) {
        this.queueForCloudSync(completeMetadata);
      }

      console.log('Datei erfolgreich hochgeladen:', completeMetadata);

      return {
        success: true,
        fileId,
        metadata: completeMetadata,
        thumbnailGenerated: !!thumbnailPath
      };

    } catch (error) {
      console.error('Fehler beim Datei-Upload:', error);
      return {
        success: false,
        error: `Upload fehlgeschlagen: ${(error as Error).message}`
      };
    }
  }

  /**
   * Datei aus Storage abrufen
   */
  async getFile(fileId: string): Promise<{ blob: Blob; metadata: FileMetadata } | null> {
    try {
      const metadata = await this.getMetadata(fileId);
      if (!metadata) return null;

      const blob = await this.loadFile(metadata.path);
      return { blob, metadata };
    } catch (error) {
      console.error('Fehler beim Laden der Datei:', error);
      return null;
    }
  }

  /**
   * Thumbnail abrufen
   */
  async getThumbnail(fileId: string): Promise<Blob | null> {
    try {
      const metadata = await this.getMetadata(fileId);
      if (!metadata?.thumbnailPath) return null;

      return await this.loadFile(metadata.thumbnailPath);
    } catch (error) {
      console.error('Fehler beim Laden des Thumbnails:', error);
      return null;
    }
  }

  /**
   * Mehrere Dateien gleichzeitig hochladen
   */
  async uploadMultipleFiles(
    files: File[],
    relatedRecord?: { type: string; id: string }
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    const maxConcurrent = 3; // Gleichzeitige Uploads begrenzen

    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(file => 
        this.uploadFile(file, {}, relatedRecord)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Dateien nach Kriterien suchen
   */
  async searchFiles(criteria: {
    mimeType?: string;
    tags?: string[];
    relatedRecordType?: string;
    relatedRecordId?: string;
    dateRange?: { from: string; to: string };
    size?: { min?: number; max?: number };
    hasGps?: boolean;
  }): Promise<FileMetadata[]> {
    // In echter Implementation: SQL-Query auf Metadaten-Tabelle
    console.log('Suche Dateien mit Kriterien:', criteria);
    return [];
  }

  /**
   * Datei löschen (soft delete)
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const metadata = await this.getMetadata(fileId);
      if (!metadata) return false;

      // Soft delete in Datenbank
      await this.markAsDeleted(fileId);

      // Cloud-Sync für Löschung
      if (this.syncManager) {
        await this.syncManager.addChange({
          id: this.generateId(),
          table: 'photos',
          operation: 'delete',
          timestamp: new Date().toISOString(),
          deviceId: this.getDeviceId(),
          data: { id: fileId }
        });
      }

      return true;
    } catch (error) {
      console.error('Fehler beim Löschen der Datei:', error);
      return false;
    }
  }

  /**
   * Speicher-Statistiken abrufen
   */
  async getStorageStats(): Promise<StorageStats> {
    // In echter Implementation: Aus Datenbank aggregieren
    return {
      totalFiles: 0,
      totalSize: 0,
      byType: {},
      cloudSyncStatus: {
        synced: 0,
        pending: 0,
        failed: 0
      },
      thumbnailsGenerated: 0,
      recentUploads: []
    };
  }

  /**
   * Automatische Aufräumung (Garbage Collection)
   */
  async cleanup(): Promise<{ deletedFiles: number; freedSpace: number }> {
    let deletedFiles = 0;
    let freedSpace = 0;

    try {
      // Gelöschte Dateien physisch entfernen (nach Aufbewahrungszeit)
      const expiredFiles = await this.getExpiredDeletedFiles();
      
      for (const file of expiredFiles) {
        await this.physicallyDeleteFile(file.path);
        if (file.thumbnailPath) {
          await this.physicallyDeleteFile(file.thumbnailPath);
        }
        deletedFiles++;
        freedSpace += file.size;
      }

      // Orphaned Thumbnails entfernen
      await this.cleanupOrphanedThumbnails();

      console.log(`Cleanup abgeschlossen: ${deletedFiles} Dateien, ${freedSpace} Bytes freigegeben`);
      
    } catch (error) {
      console.error('Fehler beim Cleanup:', error);
    }

    return { deletedFiles, freedSpace };
  }

  /**
   * Cloud-Synchronisation für alle Files
   */
  async syncAllFiles(): Promise<{ uploaded: number; downloaded: number; errors: number }> {
    let uploaded = 0;
    let downloaded = 0;
    let errors = 0;

    try {
      // Unsynced local files to cloud
      const unsyncedFiles = await this.getUnsyncedFiles();
      
      for (const file of unsyncedFiles) {
        try {
          await this.uploadToCloud(file);
          uploaded++;
        } catch (error) {
          console.error(`Fehler beim Cloud-Upload von ${file.filename}:`, error);
          errors++;
        }
      }

      // Check for new files in cloud
      if (this.syncManager) {
        // Download new files from cloud
        // Implementation depends on cloud provider
      }

    } catch (error) {
      console.error('Fehler bei der Datei-Synchronisation:', error);
    }

    return { uploaded, downloaded, errors };
  }

  /**
   * Private Hilfsfunktionen
   */

  private async validateFile(file: File | Blob): Promise<{ valid: boolean; error?: string }> {
    // Größe prüfen
    const maxSizeBytes = this.config.maxFileSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return { 
        valid: false, 
        error: `Datei zu groß (${Math.round(file.size / 1024 / 1024)}MB > ${this.config.maxFileSize}MB)` 
      };
    }

    // MIME-Type prüfen
    if (!this.config.supportedFormats.includes(file.type)) {
      return { 
        valid: false, 
        error: `Dateityp nicht unterstützt: ${file.type}` 
      };
    }

    return { valid: true };
  }

  private async extractMetadata(file: File | Blob): Promise<Partial<FileMetadata>> {
    const metadata: Partial<FileMetadata> = {};

    try {
      if (this.isImageFile(file.type)) {
        // Bild-Metadaten extrahieren
        const imageData = await this.getImageMetadata(file);
        metadata.width = imageData.width;
        metadata.height = imageData.height;
        
        if (this.config.enableGpsExtraction) {
          const exifData = await this.extractExifData(file);
          metadata.gpsLat = exifData.gpsLat;
          metadata.gpsLon = exifData.gpsLon;
          metadata.takenAt = exifData.takenAt;
        }
      }
    } catch (error) {
      console.warn('Fehler beim Extrahieren der Metadaten:', error);
    }

    return metadata;
  }

  private async getImageMetadata(file: File | Blob): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private async extractExifData(file: File | Blob): Promise<{ gpsLat?: number; gpsLon?: number; takenAt?: string }> {
    // EXIF-Daten extrahieren (vereinfacht)
    // In echter Implementation: EXIF.js oder ähnliche Library verwenden
    return {};
  }

  private generateAutoTags(metadata: Partial<FileMetadata>): string[] {
    const tags: string[] = [];

    // Automatische Tags basierend auf Metadaten
    if (metadata.gpsLat && metadata.gpsLon) {
      tags.push('mit-gps');
    }

    if (metadata.takenAt) {
      const date = new Date(metadata.takenAt);
      tags.push(`jahr-${date.getFullYear()}`);
      tags.push(`monat-${date.getMonth() + 1}`);
    }

    return tags;
  }

  private generateFileId(): string {
    return 'file_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private generateFileName(fileId: string, mimeType: string): string {
    const extension = this.getExtensionFromMimeType(mimeType);
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
    
    return `${dateStr}_${fileId}.${extension}`;
  }

  private getFilePath(fileName: string, mimeType: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    let subDir = 'other';
    if (this.isImageFile(mimeType)) {
      subDir = 'photos';
    } else if (mimeType === 'application/pdf') {
      subDir = 'documents';
    }
    
    return `${this.config.basePath}/media/${subDir}/${year}/${month}/${fileName}`;
  }

  private async generateThumbnail(originalPath: string, fileId: string): Promise<string> {
    // Thumbnail generieren (vereinfacht)
    const thumbnailPath = `${this.config.basePath}/media/thumbnails/${fileId}.webp`;
    
    // In echter Implementation: Canvas oder Image-Processing-Library verwenden
    console.log(`Generiere Thumbnail: ${originalPath} -> ${thumbnailPath}`);
    
    return thumbnailPath;
  }

  private isImageFile(mimeType: string): boolean {
    return this.supportedImageFormats.includes(mimeType);
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const extensions: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'application/pdf': 'pdf',
      'text/plain': 'txt',
      'application/json': 'json'
    };
    
    return extensions[mimeType] || 'bin';
  }

  private async saveFile(file: File | Blob, path: string): Promise<void> {
    // In Electron: fs.writeFile
    // Im Browser: IndexedDB oder File System Access API
    console.log(`Speichere Datei: ${path}`);
  }

  private async loadFile(path: string): Promise<Blob> {
    // In Electron: fs.readFile
    // Im Browser: IndexedDB
    console.log(`Lade Datei: ${path}`);
    return new Blob();
  }

  private async saveMetadata(metadata: FileMetadata): Promise<void> {
    // In Datenbank speichern
    console.log('Speichere Metadaten:', metadata);
  }

  private async getMetadata(fileId: string): Promise<FileMetadata | null> {
    // Aus Datenbank laden
    console.log('Lade Metadaten für:', fileId);
    return null;
  }

  private async calculateChecksum(file: File | Blob): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto) {
      const arrayBuffer = await file.arrayBuffer();
      const hash = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    return 'checksum_placeholder';
  }

  private ensureDirectoriesExist(): void {
    // Verzeichnisstruktur erstellen
    console.log('Erstelle Verzeichnisstruktur:', this.config.basePath);
  }

  private queueForCloudSync(metadata: FileMetadata): void {
    // Für Cloud-Sync einreihen
    console.log('Reihe für Cloud-Sync ein:', metadata.filename);
  }

  private async uploadToCloud(metadata: FileMetadata): Promise<void> {
    // Cloud-Upload implementieren
    console.log('Lade zu Cloud hoch:', metadata.filename);
  }

  private async getUnsyncedFiles(): Promise<FileMetadata[]> {
    // Unsynced files aus DB
    return [];
  }

  private async markAsDeleted(fileId: string): Promise<void> {
    // Soft delete in DB
    console.log('Markiere als gelöscht:', fileId);
  }

  private async getExpiredDeletedFiles(): Promise<FileMetadata[]> {
    // Abgelaufene gelöschte Dateien
    return [];
  }

  private async physicallyDeleteFile(path: string): Promise<void> {
    // Datei physisch löschen
    console.log('Lösche Datei physisch:', path);
  }

  private async cleanupOrphanedThumbnails(): Promise<void> {
    // Orphaned thumbnails aufräumen
    console.log('Räume verwaiste Thumbnails auf');
  }

  private generateId(): string {
    return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private getDeviceId(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gartenmeister-device-id') || 'unknown';
    }
    return 'server_device';
  }
}
