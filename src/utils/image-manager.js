/**
 * Image Management System für GartenMeister
 * Zentrale Verwaltung von Gartenfotos mit chronologischer Sortierung,
 * Kommentaren und Multi-User-Support
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');
const ExifExtractor = require('./exif-extractor');

class ImageManager {
  constructor(basePath = null) {
    this.basePath = basePath || this.getDefaultBasePath();
    
    // 🎯 NAS-Integration: Optimierte Pfadstruktur
    if (this.basePath.includes('G:\\gartenmeister\\images')) {
      // NAS-Struktur
      this.dataPath = path.join(this.basePath, 'garden');
      this.metadataPath = path.join(this.basePath, 'metadata', 'image-metadata.json');
      this.thumbnailPath = path.join(this.basePath, 'thumbnails');
      console.log('[ImageManager] 📡 NAS-Modus aktiviert');
    } else {
      // Lokale Struktur (Fallback)
      this.dataPath = path.join(this.basePath, 'images');
      this.metadataPath = path.join(this.basePath, 'image-metadata.json');
      this.thumbnailPath = path.join(this.basePath, 'thumbnails');
      console.log('[ImageManager] 💻 Lokaler Modus aktiviert');
    }
    
    // EXIF-Extraktor initialisieren
    this.exifExtractor = new ExifExtractor();
    
    this.ensureDirectories();
    
    // 🚀 Auto-Migration und NAS-Check beim Start
    this.initializeAsync();
  }

  /**
   * 🚀 Asynchrone Initialisierung
   */
  async initializeAsync() {
    try {
      // NAS-Status prüfen
      const nasStatus = await this.checkNASSync();
      console.log('[ImageManager] 📊 NAS-Status:', nasStatus.message);

      // Migration ausführen falls nötig
      if (nasStatus.available && this.basePath.includes('G:\\gartenmeister\\images')) {
        const migrationResult = await this.migrateToNAS();
        if (migrationResult.migrated > 0) {
          console.log(`[ImageManager] 🎉 Migration abgeschlossen: ${migrationResult.migrated} Bilder`);
        }
      }

    } catch (error) {
      console.error('[ImageManager] ⚠️ Async-Initialisierung fehlgeschlagen:', error);
    }
  }

  /**
   * Standard-Basispfad ermitteln
   */
  getDefaultBasePath() {
    try {
      // 🎯 NAS-Integration: Primär NAS verwenden, Fallback zu lokal
      const nasPath = 'G:\\gartenmeister\\images';
      
      // Prüfen ob NAS verfügbar ist
      if (fs.existsSync(nasPath)) {
        console.log(`[ImageManager] 📡 Verwende NAS-Speicher: ${nasPath}`);
        return nasPath;
      }
      
      // Fallback zu lokalem Pfad
      console.log('[ImageManager] ⚠️ NAS nicht verfügbar, verwende lokalen Speicher');
      const userDataPath = app.getPath('userData');
      return path.join(userDataPath, 'garden-images');
    } catch (error) {
      // Fallback für Standalone-Nutzung
      console.log('[ImageManager] 🔄 Fallback zu Projektverzeichnis');
      return path.join(process.cwd(), 'garden-images');
    }
  }

  /**
   * Verzeichnisse erstellen
   */
  ensureDirectories() {
    [this.basePath, this.dataPath, this.thumbnailPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // 🎯 NAS-spezifische Unterordner erstellen
    if (this.basePath.includes('G:\\gartenmeister\\images')) {
      const subDirs = ['diagnosis', 'garden', 'metadata', 'thumbnails'];
      subDirs.forEach(subDir => {
        const subDirPath = path.join(this.basePath, subDir);
        if (!fs.existsSync(subDirPath)) {
          fs.mkdirSync(subDirPath, { recursive: true });
          console.log(`[ImageManager] 📁 NAS-Unterordner erstellt: ${subDir}`);
        }
      });
    }
  }

  /**
   * Metadaten laden
   */
  loadMetadata() {
    try {
      if (fs.existsSync(this.metadataPath)) {
        const data = JSON.parse(fs.readFileSync(this.metadataPath, 'utf8'));
        return Array.isArray(data) ? data : [];
      }
      return [];
    } catch (error) {
      console.error('[ImageManager] Fehler beim Laden der Metadaten:', error);
      return [];
    }
  }

  /**
   * Metadaten speichern
   */
  saveMetadata(metadata) {
    try {
      fs.writeFileSync(this.metadataPath, JSON.stringify(metadata, null, 2));
      return true;
    } catch (error) {
      console.error('[ImageManager] Fehler beim Speichern der Metadaten:', error);
      return false;
    }
  }

  /**
   * Eindeutige Datei-ID generieren
   */
  generateFileId(originalName) {
    const timestamp = Date.now();
    const hash = crypto.createHash('md5').update(originalName + timestamp).digest('hex').substring(0, 8);
    const ext = path.extname(originalName);
    return `${timestamp}-${hash}${ext}`;
  }

  /**
   * Bild importieren
   */
  async importImage(sourceFilePath, metadata = {}) {
    try {
      // Validierung
      if (!fs.existsSync(sourceFilePath)) {
        throw new Error('Quelldatei existiert nicht');
      }

      const stats = fs.statSync(sourceFilePath);
      if (stats.size > 50 * 1024 * 1024) { // 50MB Limit
        throw new Error('Datei ist zu groß (max. 50MB)');
      }

      // Dateiinformationen
      const originalName = path.basename(sourceFilePath);
      const fileId = this.generateFileId(originalName);
      const targetPath = path.join(this.dataPath, fileId);

      // Datei kopieren
      fs.copyFileSync(sourceFilePath, targetPath);

      // EXIF-Daten extrahieren
      let exifData = null;
      try {
        console.log(`[ImageManager] 🔍 Starte EXIF-Extraktion für: ${originalName}`);
        exifData = await this.exifExtractor.extractFromFile(sourceFilePath);
        
        if (exifData && exifData.takenAt) {
          console.log(`[ImageManager] ✅ EXIF-Aufnahmedatum gefunden: ${exifData.takenAt} für ${originalName}`);
        } else {
          console.log(`[ImageManager] ⚠️ Keine EXIF-Aufnahmedaten in ${originalName} gefunden`);
        }
      } catch (error) {
        console.warn(`[ImageManager] ❌ EXIF-Extraktion fehlgeschlagen für ${originalName}:`, error.message);
      }

      // Aufnahmedatum-Fallback-Kette
      let takenDate = null;
      let dateSource = 'unknown';
      let dateEstimated = false;
      
      // 1. Explizit übergebenes Datum
      if (metadata.takenDate) {
        takenDate = metadata.takenDate;
        dateSource = 'explicit';
        console.log(`[ImageManager] 📅 Verwende explizites Aufnahmedatum: ${takenDate}`);
      }
      // 2. EXIF-Daten
      else if (exifData && exifData.takenAt) {
        takenDate = exifData.takenAt;
        dateSource = 'exif';
        console.log(`[ImageManager] 📸 Verwende EXIF-Aufnahmedatum: ${takenDate}`);
      }
      // 3. Dateiname-Extraktion
      else {
        const fileNameDate = this.extractDateFromFileName(originalName);
        if (fileNameDate) {
          takenDate = fileNameDate;
          dateSource = 'filename';
          // Bei DSC-Dateien ist das Datum aus dem Dateinamen oft unzuverlässig
          if (originalName.toLowerCase().startsWith('dsc_')) {
            dateEstimated = true;
            dateSource = 'filename-dsc-estimated';
          }
          console.log(`[ImageManager] 📝 Verwende Dateiname-Datum: ${takenDate} aus ${originalName}`);
        }
      }
      
      // 4. Dateisystem-Datum (mit Warnung für DSC-Dateien)
      if (!takenDate) {
        try {
          const fileSystemDate = await this.extractDateFromFile(sourceFilePath);
          if (fileSystemDate) {
            takenDate = fileSystemDate;
            // Spezielle Warnung für DSC-Dateien
            if (originalName.toLowerCase().startsWith('dsc_')) {
              console.log(`[ImageManager] ⚠️ DSC-Datei ohne EXIF: Verwende Dateisystem-Datum ${takenDate} (möglicherweise ungenau)`);
              // Markiere als geschätzt
              dateEstimated = true;
              dateSource = 'filesystem-dsc-fallback';
            } else {
              console.log(`[ImageManager] 📁 Verwende Dateisystem-Datum: ${takenDate}`);
              dateSource = 'filesystem';
            }
          }
        } catch (error) {
          console.warn(`[ImageManager] Dateisystem-Datum-Extraktion fehlgeschlagen:`, error.message);
        }
      }
      
      // 5. Fallback: Upload-Datum
      if (!takenDate) {
        takenDate = new Date().toISOString();
        console.log(`[ImageManager] ⚠️ Fallback auf Upload-Datum: ${takenDate}`);
        // Markiere Upload-Datum als geschätzt
        dateEstimated = true;
        dateSource = 'upload-fallback';
      }

      // Metadaten erstellen
      const imageMetadata = {
        id: fileId,
        originalName: originalName,
        fileName: fileId,
        filePath: targetPath,
        fileSize: stats.size,
        mimeType: this.getMimeType(originalName),
        uploadDate: new Date().toISOString(),
        takenDate: takenDate,
        
        // Benutzer-Metadaten
        uploadedBy: metadata.uploadedBy || 'Unbekannt',
        title: metadata.title || '',
        description: metadata.description || '',
        tags: metadata.tags || [],
        
        // Garten-spezifische Metadaten
        bedId: metadata.bedId || null,
        plantType: metadata.plantType || '',
        category: metadata.category || 'Allgemein', // 'Wachstum', 'Ernte', 'Schädlinge', 'Allgemein'
        location: metadata.location || '',
        weather: metadata.weather || '',
        
        // Technische Metadaten
        dimensions: exifData && exifData.dimensions || null,
        exifData: exifData || null,   // Vollständige EXIF-Daten
        
        // Datum-Metadaten für UI-Hinweise
        _dateEstimated: dateEstimated,
        _dateSource: dateSource,
        
        // Verwaltung
        isArchived: false,
        isFavorite: false,
        viewCount: 0,
        lastViewed: null,
        
        // Kommentare und Interaktionen
        comments: [],
        ratings: []
      };

      // Zu bestehenden Metadaten hinzufügen
      const allMetadata = this.loadMetadata();
      allMetadata.push(imageMetadata);
      
      // Nach Aufnahmedatum sortieren (neueste zuerst)
      allMetadata.sort((a, b) => new Date(b.takenDate) - new Date(a.takenDate));
      
      this.saveMetadata(allMetadata);

      console.log(`[ImageManager] ✅ Bild importiert: ${originalName} -> ${fileId}`);
      return imageMetadata;

    } catch (error) {
      console.error('[ImageManager] Fehler beim Importieren:', error);
      throw error;
    }
  }

  /**
   * MIME-Type ermitteln
   */
  getMimeType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.tiff': 'image/tiff',
      '.svg': 'image/svg+xml'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Datum aus Datei extrahieren (EXIF oder Dateisystem)
   */
  async extractDateFromFile(filePath) {
    try {
      // Zuerst EXIF-Daten versuchen
      const exifData = await this.exifExtractor.extractFromFile(filePath);
      if (exifData && exifData.takenAt) {
        console.log(`[ImageManager] 📅 EXIF-Aufnahmedatum gefunden: ${exifData.takenAt}`);
        return exifData.takenAt;
      }

      // Fallback auf Dateisystem-Zeitstempel
      const stats = fs.statSync(filePath);
      const dates = [stats.birthtime, stats.mtime, stats.ctime].filter(Boolean);
      if (dates.length > 0) {
        const oldestDate = new Date(Math.min(...dates.map(d => d.getTime()))).toISOString();
        console.log(`[ImageManager] 📁 Dateisystem-Datum verwendet: ${oldestDate}`);
        return oldestDate;
      }
    } catch (error) {
      console.warn('[ImageManager] Konnte Datum nicht extrahieren:', error);
    }
    return null;
  }

  /**
   * Datum aus File Buffer extrahieren (für Upload)
   */
  async extractDateFromFileBuffer(buffer, fileName) {
    try {
      // EXIF-Daten aus Buffer extrahieren
      const exifData = await this.exifExtractor.extractFromBuffer(buffer, fileName);
      if (exifData && exifData.takenAt) {
        console.log(`[ImageManager] 📅 EXIF-Aufnahmedatum aus Buffer: ${exifData.takenAt}`);
        return exifData.takenAt;
      }

      console.log('[ImageManager] ⚠️ Kein EXIF-Aufnahmedatum gefunden, verwende aktuelles Datum');
      return null;
    } catch (error) {
      console.warn('[ImageManager] Konnte EXIF-Datum nicht extrahieren:', error);
      return null;
    }
  }

  /**
   * Kommentar hinzufügen
   */
  addComment(imageId, comment, author = 'Unbekannt') {
    try {
      const metadata = this.loadMetadata();
      const image = metadata.find(img => img.id === imageId);
      
      if (!image) {
        throw new Error('Bild nicht gefunden');
      }

      const newComment = {
        id: `comment-${Date.now()}`,
        text: comment,
        author: author,
        timestamp: new Date().toISOString(),
        isEdited: false,
        editHistory: []
      };

      image.comments.push(newComment);
      
      // Nach Datum sortieren (neueste zuerst)
      image.comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      this.saveMetadata(metadata);
      
      console.log(`[ImageManager] ✅ Kommentar hinzugefügt zu Bild ${imageId}`);
      return newComment;

    } catch (error) {
      console.error('[ImageManager] Fehler beim Hinzufügen des Kommentars:', error);
      throw error;
    }
  }

  /**
   * Favorit-Status umschalten
   */
  async toggleFavorite(imageId) {
    try {
      const metadata = this.loadMetadata();
      const image = metadata.find(img => img.id === imageId);
      
      if (!image) {
        throw new Error('Bild nicht gefunden');
      }

      image.isFavorite = !image.isFavorite;
      this.saveMetadata(metadata);
      
      console.log(`[ImageManager] ✅ Favorit-Status geändert: ${imageId} -> ${image.isFavorite}`);
      return image.isFavorite;

    } catch (error) {
      console.error('[ImageManager] Fehler beim Favorisieren:', error);
      throw error;
    }
  }

  /**
   * View-Count erhöhen
   */
  async incrementViewCount(imageId) {
    try {
      const metadata = this.loadMetadata();
      const image = metadata.find(img => img.id === imageId);
      
      if (!image) {
        throw new Error('Bild nicht gefunden');
      }

      image.viewCount = (image.viewCount || 0) + 1;
      image.lastViewed = new Date().toISOString();
      this.saveMetadata(metadata);
      
      return image.viewCount;

    } catch (error) {
      console.error('[ImageManager] Fehler beim Erhöhen des View-Counts:', error);
      throw error;
    }
  }

  /**
   * Bewertung hinzufügen
   */
  async addRating(imageId, ratingData) {
    try {
      const metadata = this.loadMetadata();
      const image = metadata.find(img => img.id === imageId);
      
      if (!image) {
        throw new Error('Bild nicht gefunden');
      }

      if (!image.ratings) {
        image.ratings = [];
      }

      // Bestehende Bewertung des Nutzers entfernen
      image.ratings = image.ratings.filter(r => r.author !== ratingData.author);
      
      // Neue Bewertung hinzufügen
      const rating = {
        author: ratingData.author,
        rating: ratingData.rating,
        timestamp: new Date().toISOString()
      };
      
      image.ratings.push(rating);
      this.saveMetadata(metadata);
      
      console.log(`[ImageManager] ✅ Bewertung hinzugefügt: ${imageId} -> ${rating.rating}/5 von ${rating.author}`);
      return rating;

    } catch (error) {
      console.error('[ImageManager] Fehler beim Hinzufügen der Bewertung:', error);
      throw error;
    }
  }

  /**
   * Bild-Metadaten aktualisieren
   */
  async updateImageMetadata(imageId, updates) {
    try {
      const metadata = this.loadMetadata();
      const image = metadata.find(img => img.id === imageId);
      
      if (!image) {
        throw new Error('Bild nicht gefunden');
      }

      // Erlaubte Felder für Updates
      const allowedFields = [
        'title', 'description', 'tags', 'category', 'plantType', 
        'location', 'weather', 'bedId', 'isArchived'
      ];

      allowedFields.forEach(field => {
        if (updates.hasOwnProperty(field)) {
          image[field] = updates[field];
        }
      });

      this.saveMetadata(metadata);
      
      console.log(`[ImageManager] ✅ Metadaten aktualisiert: ${imageId}`);
      return image;

    } catch (error) {
      console.error('[ImageManager] Fehler beim Aktualisieren der Metadaten:', error);
      throw error;
    }
  }

  /**
   * Alle Bilder abrufen
   */
  getAllImages(options = {}) {
    try {
      let images = this.loadMetadata();

      // Filter anwenden
      if (options.category) {
        images = images.filter(img => img.category === options.category);
      }
      
      if (options.bedId) {
        images = images.filter(img => img.bedId === options.bedId);
      }
      
      if (options.tags && options.tags.length > 0) {
        images = images.filter(img => 
          options.tags.some(tag => img.tags.includes(tag))
        );
      }
      
      if (options.dateFrom) {
        images = images.filter(img => new Date(img.takenDate) >= new Date(options.dateFrom));
      }
      
      if (options.dateTo) {
        images = images.filter(img => new Date(img.takenDate) <= new Date(options.dateTo));
      }
      
      if (options.author) {
        images = images.filter(img => img.uploadedBy === options.author);
      }

      if (!options.includeArchived) {
        images = images.filter(img => !img.isArchived);
      }

      // Sortierung
      const sortBy = options.sortBy || 'takenDate';
      const sortOrder = options.sortOrder || 'desc';
      
      images.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        
        if (sortBy.includes('Date')) {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }
        
        if (sortOrder === 'desc') {
          return bVal > aVal ? 1 : -1;
        } else {
          return aVal > bVal ? 1 : -1;
        }
      });

      // Paginierung
      if (options.limit) {
        const start = options.offset || 0;
        images = images.slice(start, start + options.limit);
      }

      return images;

    } catch (error) {
      console.error('[ImageManager] Fehler beim Abrufen der Bilder:', error);
      return [];
    }
  }

  /**
   * Einzelnes Bild abrufen
   */
  getImage(imageId) {
    try {
      const metadata = this.loadMetadata();
      const image = metadata.find(img => img.id === imageId);
      
      if (image) {
        // View-Counter erhöhen
        image.viewCount = (image.viewCount || 0) + 1;
        image.lastViewed = new Date().toISOString();
        this.saveMetadata(metadata);
      }
      
      return image || null;

    } catch (error) {
      console.error('[ImageManager] Fehler beim Abrufen des Bildes:', error);
      return null;
    }
  }

  /**
   * Einzelnes Bild anhand der ID abrufen
   */
  getImageById(imageId) {
    try {
      const images = this.loadMetadata();
      return images.find(img => img.id === imageId) || null;
    } catch (error) {
      console.error('[ImageManager] Fehler beim Abrufen des Bildes:', error);
      return null;
    }
  }

  /**
   * Bild löschen
   */
  async deleteImage(imageId) {
    try {
      const metadata = this.loadMetadata();
      const imageIndex = metadata.findIndex(img => img.id === imageId);
      
      if (imageIndex === -1) {
        throw new Error('Bild nicht gefunden');
      }

      const image = metadata[imageIndex];
      
      // Datei löschen
      if (fs.existsSync(image.filePath)) {
        fs.unlinkSync(image.filePath);
      }

      // Thumbnail löschen
      const thumbnailPath = path.join(this.thumbnailPath, `thumb-${image.fileName}`);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }

      // Aus Metadaten entfernen
      metadata.splice(imageIndex, 1);
      this.saveMetadata(metadata);
      
      console.log(`[ImageManager] ✅ Bild gelöscht: ${imageId}`);
      return true;

    } catch (error) {
      console.error('[ImageManager] Fehler beim Löschen des Bildes:', error);
      throw error;
    }
  }

  /**
   * Statistiken abrufen
   */
  getStatistics() {
    try {
      const images = this.loadMetadata();

      // Kategorien zählen
      const categoryCounts = {};
      images.forEach(img => {
        const cat = img.category || 'Allgemein';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });

      // Top-Autoren als Array (für topUploaders im Frontend)
      const authorCounts = {};
      images.forEach(img => {
        const author = img.uploadedBy || 'Unbekannt';
        authorCounts[author] = (authorCounts[author] || 0) + 1;
      });
      const topUploaders = Object.entries(authorCounts)
        .map(([author, count]) => ({ author, count }))
        .sort((a, b) => b.count - a.count);

      // Letzte Uploads (diese Woche)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentUploads = images.filter(img =>
        new Date(img.uploadDate) >= oneWeekAgo
      ).length;

      // Favoriten
      const favoriteCount = images.filter(img => img.isFavorite).length;

      const stats = {
        totalImages: images.length,
        totalSize: images.reduce((sum, img) => sum + (img.fileSize || 0), 0),
        categoryCounts,
        topUploaders,
        recentUploads,
        favoriteCount,
        averageRating: 0
      };

      return stats;

    } catch (error) {
      console.error('[ImageManager] Fehler beim Erstellen der Statistiken:', error);
      return null;
    }
  }

  /**
   * Batch-Import aus Verzeichnis
   */
  async batchImport(sourceDirectory, defaultMetadata = {}) {
    try {
      if (!fs.existsSync(sourceDirectory)) {
        throw new Error('Quellverzeichnis existiert nicht');
      }

      const files = fs.readdirSync(sourceDirectory);
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];
      const imageFiles = files.filter(file => 
        imageExtensions.includes(path.extname(file).toLowerCase())
      );

      const results = {
        successful: [],
        failed: [],
        total: imageFiles.length
      };

      for (const file of imageFiles) {
        try {
          const filePath = path.join(sourceDirectory, file);
          const metadata = {
            ...defaultMetadata,
            title: defaultMetadata.title || path.parse(file).name
          };
          
          const result = await this.importImage(filePath, metadata);
          results.successful.push({ file, result });
          
        } catch (error) {
          console.error(`[ImageManager] Fehler beim Importieren von ${file}:`, error);
          results.failed.push({ file, error: error.message });
        }
      }

      console.log(`[ImageManager] ✅ Batch-Import abgeschlossen: ${results.successful.length}/${results.total} erfolgreich`);
      return results;

    } catch (error) {
      console.error('[ImageManager] Fehler beim Batch-Import:', error);
      throw error;
    }
  }

  /**
   * Bild hochladen (Frontend-API-kompatibel)
   */
  async uploadImage(uploadData) {
    try {
      // Prüfen ob filePath existiert
      if (!uploadData.filePath || !fs.existsSync(uploadData.filePath)) {
        throw new Error('Ungültiger Dateipfad');
      }

      // Upload-Daten in Import-Format konvertieren
      const metadata = {
        uploadedBy: uploadData.uploadedBy || 'Unbekannt',
        title: uploadData.title || path.basename(uploadData.filePath, path.extname(uploadData.filePath)),
        description: uploadData.description || '',
        tags: uploadData.tags || [],
        bedId: uploadData.bedId,
        plantType: uploadData.plantType || '',
        category: uploadData.category || 'Allgemein',
        location: uploadData.location || '',
        weather: uploadData.weather || '',
        takenDate: uploadData.takenDate
      };

      // Import durchführen
      const result = await this.importImage(uploadData.filePath, metadata);
      
      // Frontend-kompatible Antwort
      return result;

    } catch (error) {
      console.error('[ImageManager] Fehler beim Upload:', error);
      throw error;
    }
  }

  /**
   * Bild von Browser hochladen (für Web-Frontend)
   * Arbeitet mit File-Objekten und ArrayBuffers
   */
  async uploadImage(uploadData) {
    try {
      const { fileData, metadata = {} } = uploadData;
      
      // Validierung der Eingabedaten
      if (!fileData || !fileData.buffer || !fileData.name) {
        throw new Error('Ungültige Datei-Daten');
      }

      // Größenprüfung
      if (fileData.buffer.byteLength > 50 * 1024 * 1024) { // 50MB Limit
        throw new Error('Datei ist zu groß (max. 50MB)');
      }

      // Eindeutige Datei-ID generieren
      const originalName = fileData.name;
      const fileId = this.generateFileId(originalName);
      const targetPath = path.join(this.dataPath, fileId);

      // Buffer zu Datei schreiben
      const buffer = Buffer.from(fileData.buffer);
      fs.writeFileSync(targetPath, buffer);

      // EXIF-Daten extrahieren
      let exifData = null;
      try {
        exifData = await this.exifExtractor.extractFromBuffer(buffer, originalName);
        console.log(`[ImageManager] 📸 EXIF-Daten aus Buffer extrahiert für ${originalName}`);
      } catch (error) {
        console.warn(`[ImageManager] Konnte EXIF-Daten nicht aus Buffer extrahieren: ${error.message}`);
      }

      // Aufnahmedatum aus EXIF-Daten oder Fallback
      const takenDate = metadata.takenDate || 
                       (exifData && exifData.takenAt) || 
                       await this.extractDateFromFileBuffer(buffer, originalName) || 
                       new Date().toISOString();

      // Metadaten erstellen
      const imageMetadata = {
        id: fileId,
        originalName: originalName,
        fileName: fileId,
        filePath: targetPath,
        fileSize: fileData.buffer.byteLength,
        mimeType: fileData.type || this.getMimeType(originalName),
        uploadDate: new Date().toISOString(),
        takenDate: takenDate,
        
        // Benutzer-Metadaten
        uploadedBy: metadata.uploadedBy || 'Unbekannt',
        title: metadata.title || '',
        description: metadata.description || '',
        tags: Array.isArray(metadata.tags) ? metadata.tags : [],
        
        // Garten-spezifische Metadaten
        bedId: metadata.bedId || null,
        plantType: metadata.plantType || '',
        category: metadata.category || 'Allgemein',
        location: metadata.location || '',
        weather: metadata.weather || '',
        
        // Technische Metadaten
        dimensions: exifData && exifData.dimensions || null,
        exifData: exifData || null,   // Vollständige EXIF-Daten
        location: metadata.location || '',
        weather: metadata.weather || '',
        
        // Technische Metadaten
        dimensions: null,
        exifData: null,
        
        // Verwaltung
        isArchived: false,
        isFavorite: false,
        viewCount: 0,
        lastViewed: null,
        
        // Kommentare und Interaktionen
        comments: [],
        ratings: []
      };

      // Zu bestehenden Metadaten hinzufügen
      const allMetadata = this.loadMetadata();
      allMetadata.push(imageMetadata);
      
      // Nach Aufnahmedatum sortieren (neueste zuerst)
      allMetadata.sort((a, b) => new Date(b.takenDate) - new Date(a.takenDate));
      
      this.saveMetadata(allMetadata);

      console.log(`[ImageManager] ✅ Bild hochgeladen: ${originalName} -> ${fileId}`);
      return imageMetadata;

    } catch (error) {
      console.error('[ImageManager] Fehler beim Upload:', error);
      throw error;
    }
  }

  /**
   * Datum aus Dateiname extrahieren (verschiedene Formate)
   */
  extractDateFromFileName(fileName) {
    try {
      console.log(`[ImageManager] 🔍 Analysiere Dateiname: ${fileName}`);
      
      const patterns = [
        // Standard-Formate
        { pattern: /(\d{4})-(\d{2})-(\d{2})/, name: 'YYYY-MM-DD' },
        { pattern: /(\d{4})(\d{2})(\d{2})/, name: 'YYYYMMDD' },
        { pattern: /IMG_(\d{4})(\d{2})(\d{2})/, name: 'IMG_YYYYMMDD' },
        { pattern: /(\d{2})(\d{2})(\d{4})/, name: 'DDMMYYYY' },
        // Kamera-spezifische Formate  
        { pattern: /DSC_(\d{4})/, name: 'DSC_YYYY (Jahr wenn > 1999)', validate: true },
        { pattern: /P(\d{4})(\d{2})(\d{2})/, name: 'PYYYYMMDD' },
        { pattern: /(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})(\d{2})/, name: 'YYYY-MM-DD_HHMMSS' }
      ];

      for (const { pattern, name } of patterns) {
        const match = fileName.match(pattern);
        if (match) {
          console.log(`[ImageManager] 🎯 Pattern gefunden: ${name}`);
          
          let year, month, day;
          
          if (name.includes('DSC_YYYY')) {
            // DSC-Dateien: Nur als Jahr verwenden wenn > 1999
            const yearCandidate = parseInt(match[1]);
            if (yearCandidate > 1999 && yearCandidate <= 2030) {
              year = match[1];
              month = '01';
              day = '01';
              console.log(`[ImageManager] ℹ️ DSC-Datei: Verwende ${year}-01-01 als Jahres-Schätzung`);
            } else {
              console.log(`[ImageManager] ⚠️ DSC-Nummer ${match[1]} ist kein Jahr, überspringe DSC-Pattern`);
              continue;
            }
          } else if (name.includes('IMG_') || name.includes('P')) {
            year = match[1];
            month = match[2];
            day = match[3];
          } else if (name.includes('YYYY-MM-DD')) {
            year = match[1];
            month = match[2];
            day = match[3];
          } else if (name.includes('YYYYMMDD')) {
            year = match[1];
            month = match[2];
            day = match[3];
          } else if (name.includes('DDMMYYYY')) {
            day = match[1];
            month = match[2];
            year = match[3];
          }

          // Validierung
          const yearNum = parseInt(year);
          const monthNum = parseInt(month);
          const dayNum = parseInt(day);
          
          if (yearNum >= 2000 && yearNum <= 2030 && 
              monthNum >= 1 && monthNum <= 12 && 
              dayNum >= 1 && dayNum <= 31) {
            
            const date = new Date(yearNum, monthNum - 1, dayNum);
            if (!isNaN(date.getTime())) {
              const isoDate = date.toISOString();
              console.log(`[ImageManager] ✅ Datum aus Dateiname extrahiert: ${isoDate}`);
              return isoDate;
            }
          } else {
            console.log(`[ImageManager] ❌ Ungültiges Datum: ${year}-${month}-${day}`);
          }
        }
      }

      console.log(`[ImageManager] ❌ Kein Datum-Pattern in Dateiname gefunden`);
      return null;
    } catch (error) {
      console.warn(`[ImageManager] Fehler bei Dateiname-Analyse:`, error);
      return null;
    }
  }

  /**
   * 🔄 Migration bestehender Bilder von lokal zu NAS
   */
  async migrateToNAS() {
    try {
      const nasPath = 'G:\\gartenmeister\\images';
      if (!fs.existsSync(nasPath)) {
        throw new Error('NAS nicht verfügbar');
      }

      // Lokaler Pfad prüfen (nur wenn app verfügbar ist)
      let localPath;
      try {
        const { app } = require('electron');
        localPath = path.join(app.getPath('userData'), 'garden-images');
      } catch (error) {
        // Fallback für Standalone-Nutzung
        localPath = path.join(process.cwd(), 'garden-images');
      }

      if (!fs.existsSync(localPath)) {
        console.log('[ImageManager] 💡 Keine lokalen Bilder zum Migrieren gefunden');
        return { migrated: 0, errors: [] };
      }

      const localMetadataPath = path.join(localPath, 'image-metadata.json');
      if (!fs.existsSync(localMetadataPath)) {
        console.log('[ImageManager] 💡 Keine lokalen Metadaten gefunden');
        return { migrated: 0, errors: [] };
      }

      // Lokale Metadaten laden
      const localMetadata = JSON.parse(fs.readFileSync(localMetadataPath, 'utf8'));
      console.log(`[ImageManager] 📊 Migriere ${localMetadata.length} Bilder zu NAS...`);

      const results = { migrated: 0, errors: [] };

      for (const image of localMetadata) {
        try {
          const localImagePath = image.filePath;
          if (!fs.existsSync(localImagePath)) {
            console.warn(`[ImageManager] ⚠️ Lokales Bild nicht gefunden: ${localImagePath}`);
            continue;
          }

          // Neuen NAS-Pfad generieren
          const fileName = path.basename(localImagePath);
          const nasImagePath = path.join(nasPath, 'garden', fileName);

          // Bild kopieren
          fs.copyFileSync(localImagePath, nasImagePath);

          // Metadaten aktualisieren
          image.filePath = nasImagePath;

          console.log(`[ImageManager] ✅ Migriert: ${fileName}`);
          results.migrated++;

        } catch (error) {
          console.error(`[ImageManager] ❌ Fehler bei Migration von ${image.originalName}:`, error);
          results.errors.push({ image: image.originalName, error: error.message });
        }
      }

      // Aktualisierte Metadaten auf NAS speichern
      if (results.migrated > 0) {
        const nasMetadataPath = path.join(nasPath, 'metadata', 'image-metadata.json');
        fs.writeFileSync(nasMetadataPath, JSON.stringify(localMetadata, null, 2));
        console.log(`[ImageManager] 💾 Metadaten auf NAS gespeichert: ${nasMetadataPath}`);
      }

      return results;

    } catch (error) {
      console.error('[ImageManager] 💥 Migration zu NAS fehlgeschlagen:', error);
      throw error;
    }
  }

  /**
   * 📡 NAS-Status prüfen und Auto-Sync
   */
  async checkNASSync() {
    try {
      const nasPath = 'G:\\gartenmeister\\images';
      if (!fs.existsSync(nasPath)) {
        return { available: false, message: 'NAS nicht erreichbar' };
      }

      const nasMetadataPath = path.join(nasPath, 'metadata', 'image-metadata.json');
      if (fs.existsSync(nasMetadataPath)) {
        // NAS-Metadaten als primäre Quelle verwenden
        this.metadataPath = nasMetadataPath;
        console.log('[ImageManager] 📡 Verwende NAS-Metadaten als primäre Quelle');
      }

      return { 
        available: true, 
        message: 'NAS erfolgreich verbunden',
        metadataPath: this.metadataPath,
        basePath: this.basePath
      };

    } catch (error) {
      console.error('[ImageManager] ❌ NAS-Sync-Check fehlgeschlagen:', error);
      return { available: false, message: error.message };
    }
  }
}

module.exports = ImageManager;
