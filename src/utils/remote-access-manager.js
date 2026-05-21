/**
 * 🌐 Remote Access Manager für GartenMeister
 * Verwaltet Bilderzugriff und Uploads für entfernte Clients
 */

const fs = require('fs');
const path = require('path');

class RemoteAccessManager {
  constructor() {
    this.nasBasePath = 'G:\\gartenmeister';
    this.imageBasePath = path.join(this.nasBasePath, 'images');
    this.cacheTimeout = 5 * 60 * 1000; // 5 Minuten Cache
    this.connectionCache = new Map();
  }

  /**
   * 🔍 NAS-Verfügbarkeit prüfen
   */
  async checkNASAvailability() {
    try {
      const startTime = Date.now();
      
      // Test-Datei schreiben/lesen
      const testFile = path.join(this.nasBasePath, 'sync', 'remote-access-test.json');
      const testData = { 
        timestamp: new Date().toISOString(),
        client: 'remote-access-manager',
        test: Math.random()
      };
      
      fs.writeFileSync(testFile, JSON.stringify(testData));
      const readData = JSON.parse(fs.readFileSync(testFile, 'utf8'));
      
      const responseTime = Date.now() - startTime;
      
      return {
        available: true,
        responseTime,
        message: 'NAS erfolgreich erreichbar',
        paths: {
          base: this.nasBasePath,
          images: this.imageBasePath,
          data: path.join(this.nasBasePath, 'data'),
          weather: path.join(this.nasBasePath, 'weather')
        }
      };

    } catch (error) {
      return {
        available: false,
        responseTime: -1,
        message: `NAS nicht erreichbar: ${error.message}`,
        paths: null
      };
    }
  }

  /**
   * 📡 Remote-Client-Konfiguration generieren
   */
  generateRemoteConfig(clientName) {
    const config = {
      client: {
        name: clientName,
        registeredAt: new Date().toISOString(),
        type: 'remote-client'
      },
      nas: {
        share: '\\\\DS124-RockingK\\Gurktaler\\gartenmeister',
        mappedDrive: 'G:', // Für Windows-Clients
        paths: {
          images: 'images/garden',
          metadata: 'images/metadata',
          thumbnails: 'images/thumbnails',
          data: 'data',
          weather: 'weather/data',
          backups: 'data/backups'
        }
      },
      access: {
        allowImageUpload: true,
        allowImageDownload: true,
        allowDataSync: true,
        allowWeatherData: true,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
      },
      fallback: {
        localCache: true,
        offlineMode: true,
        syncOnReconnect: true
      }
    };

    // Konfiguration auf NAS speichern
    const configPath = path.join(this.nasBasePath, 'sync', `remote-client-${clientName}.json`);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    return config;
  }

  /**
   * 🖼️ Remote-Image-Upload verarbeiten
   */
  async handleRemoteImageUpload(imageData, metadata, clientInfo) {
    try {
      // NAS-Verfügbarkeit prüfen
      const nasStatus = await this.checkNASAvailability();
      if (!nasStatus.available) {
        throw new Error('NAS nicht erreichbar für Remote-Upload');
      }

      // Eindeutige Upload-ID generieren
      const uploadId = `remote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Upload-Verzeichnis erstellen
      const uploadDir = path.join(this.imageBasePath, 'remote-uploads', clientInfo.name);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Datei speichern
      const fileName = `${uploadId}-${metadata.originalName}`;
      const filePath = path.join(uploadDir, fileName);
      
      // Buffer oder Base64 zu Datei schreiben
      if (imageData.type === 'buffer') {
        fs.writeFileSync(filePath, Buffer.from(imageData.data));
      } else if (imageData.type === 'base64') {
        const buffer = Buffer.from(imageData.data, 'base64');
        fs.writeFileSync(filePath, buffer);
      } else {
        throw new Error('Unbekannter Bildformat-Typ');
      }

      // Upload-Metadaten speichern
      const uploadMetadata = {
        uploadId,
        originalName: metadata.originalName,
        filePath,
        fileName,
        fileSize: fs.statSync(filePath).size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: clientInfo.name,
        clientInfo,
        metadata,
        status: 'uploaded',
        processed: false
      };

      const metadataPath = path.join(uploadDir, `${uploadId}-metadata.json`);
      fs.writeFileSync(metadataPath, JSON.stringify(uploadMetadata, null, 2));

      console.log(`[RemoteAccess] ✅ Remote-Upload erfolgreich: ${fileName} von ${clientInfo.name}`);

      return {
        success: true,
        uploadId,
        message: 'Upload erfolgreich',
        filePath,
        metadata: uploadMetadata
      };

    } catch (error) {
      console.error('[RemoteAccess] ❌ Remote-Upload fehlgeschlagen:', error);
      return {
        success: false,
        error: error.message,
        uploadId: null
      };
    }
  }

  /**
   * 📥 Remote-Uploads verarbeiten (für Image-Manager)
   */
  async processRemoteUploads() {
    try {
      const remoteUploadDir = path.join(this.imageBasePath, 'remote-uploads');
      if (!fs.existsSync(remoteUploadDir)) {
        return { processed: 0, errors: [] };
      }

      const clientDirs = fs.readdirSync(remoteUploadDir).filter(dir => 
        fs.statSync(path.join(remoteUploadDir, dir)).isDirectory()
      );

      let totalProcessed = 0;
      const errors = [];

      for (const clientDir of clientDirs) {
        const clientPath = path.join(remoteUploadDir, clientDir);
        const files = fs.readdirSync(clientPath);

        // Metadaten-Dateien finden
        const metadataFiles = files.filter(file => file.endsWith('-metadata.json'));

        for (const metadataFile of metadataFiles) {
          try {
            const metadataPath = path.join(clientPath, metadataFile);
            const uploadMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

            if (uploadMetadata.processed) {
              continue; // Bereits verarbeitet
            }

            // Upload an Image-Manager weiterleiten
            const ImageManager = require('./image-manager');
            const imageManager = new ImageManager();

            const importResult = await imageManager.importImage(uploadMetadata.filePath, {
              ...uploadMetadata.metadata,
              uploadedBy: uploadMetadata.uploadedBy,
              title: uploadMetadata.metadata.title || uploadMetadata.originalName.split('.')[0]
            });

            // Als verarbeitet markieren
            uploadMetadata.processed = true;
            uploadMetadata.processedAt = new Date().toISOString();
            uploadMetadata.imageId = importResult.id;
            fs.writeFileSync(metadataPath, JSON.stringify(uploadMetadata, null, 2));

            console.log(`[RemoteAccess] ✅ Remote-Upload verarbeitet: ${uploadMetadata.originalName}`);
            totalProcessed++;

          } catch (error) {
            console.error(`[RemoteAccess] ❌ Fehler beim Verarbeiten von ${metadataFile}:`, error);
            errors.push({ file: metadataFile, error: error.message });
          }
        }
      }

      return { processed: totalProcessed, errors };

    } catch (error) {
      console.error('[RemoteAccess] 💥 Fehler beim Verarbeiten der Remote-Uploads:', error);
      throw error;
    }
  }

  /**
   * 🌐 Remote-Client-Status abrufen
   */
  getRemoteClientStatus() {
    try {
      const syncDir = path.join(this.nasBasePath, 'sync');
      const configFiles = fs.readdirSync(syncDir)
        .filter(file => file.startsWith('remote-client-') && file.endsWith('.json'));

      const clients = configFiles.map(file => {
        const clientConfig = JSON.parse(fs.readFileSync(path.join(syncDir, file), 'utf8'));
        
        // Letzten Upload-Zeitstempel ermitteln
        const clientName = clientConfig.client.name;
        const uploadDir = path.join(this.imageBasePath, 'remote-uploads', clientName);
        let lastActivity = null;
        
        if (fs.existsSync(uploadDir)) {
          const files = fs.readdirSync(uploadDir);
          const metadataFiles = files.filter(f => f.endsWith('-metadata.json'));
          
          if (metadataFiles.length > 0) {
            const latestFile = metadataFiles
              .map(f => {
                const metadata = JSON.parse(fs.readFileSync(path.join(uploadDir, f), 'utf8'));
                return metadata.uploadedAt;
              })
              .sort()
              .pop();
            lastActivity = latestFile;
          }
        }

        return {
          name: clientName,
          registeredAt: clientConfig.client.registeredAt,
          lastActivity,
          status: lastActivity && (Date.now() - new Date(lastActivity).getTime()) < 24 * 60 * 60 * 1000 ? 'active' : 'inactive'
        };
      });

      return clients;

    } catch (error) {
      console.error('[RemoteAccess] ❌ Fehler beim Abrufen des Client-Status:', error);
      return [];
    }
  }
}

module.exports = RemoteAccessManager;
