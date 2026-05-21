/**
 * EXIF Data Extractor für GartenMeister
 * Extrahiert Aufnahmedatum, GPS-Koordinaten und andere Metadaten aus Bildern
 */

const fs = require('fs');
const path = require('path');

class ExifExtractor {
  constructor() {
    this.exifReader = null;
    this.initializeLibraries();
  }

  /**
   * EXIF-Bibliotheken initialisieren
   */
  initializeLibraries() {
    try {
      // Versuche verschiedene EXIF-Bibliotheken zu laden
      try {
        this.exifReader = require('exif-reader');
        console.log('[ExifExtractor] ✅ exif-reader geladen');
      } catch (e) {
        console.log('[ExifExtractor] exif-reader nicht verfügbar');
      }

      try {
        this.piexif = require('piexifjs');
        console.log('[ExifExtractor] ✅ piexifjs geladen');
      } catch (e) {
        console.log('[ExifExtractor] piexifjs nicht verfügbar');
      }

    } catch (error) {
      console.warn('[ExifExtractor] Keine EXIF-Bibliotheken verfügbar, verwende Fallback');
    }
  }

  /**
   * EXIF-Daten aus Bilddatei extrahieren
   */
  async extractFromFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('Datei existiert nicht');
      }

      const fileBuffer = fs.readFileSync(filePath);
      return await this.extractFromBuffer(fileBuffer, path.basename(filePath));

    } catch (error) {
      console.error('[ExifExtractor] Fehler beim Lesen der Datei:', error);
      return this.createFallbackMetadata(filePath);
    }
  }

  /**
   * EXIF-Daten aus Buffer extrahieren
   */
  async extractFromBuffer(buffer, fileName) {
    try {
      const ext = path.extname(fileName).toLowerCase();
      
      // Nur JPEG-Dateien haben EXIF-Daten
      if (ext !== '.jpg' && ext !== '.jpeg') {
        return this.createFallbackMetadata(fileName, buffer);
      }

      // Versuche verschiedene EXIF-Extraktionsmethoden
      let exifData = null;

      if (this.exifReader) {
        exifData = this.extractWithExifReader(buffer);
      }

      if (!exifData && this.piexif) {
        exifData = this.extractWithPiexif(buffer);
      }

      if (!exifData) {
        exifData = this.extractWithManualParsing(buffer);
      }

      if (!exifData) {
        return this.createFallbackMetadata(fileName, buffer);
      }

      return this.processExifData(exifData, fileName);

    } catch (error) {
      console.error('[ExifExtractor] Fehler bei EXIF-Extraktion:', error);
      return this.createFallbackMetadata(fileName, buffer);
    }
  }

  /**
   * EXIF-Extraktion mit exif-reader
   */
  extractWithExifReader(buffer) {
    try {
      // Suche nach EXIF-Marker im JPEG
      const exifMarker = Buffer.from([0xFF, 0xE1]);
      const markerIndex = buffer.indexOf(exifMarker);
      
      if (markerIndex === -1) {
        return null;
      }

      // EXIF-Segment extrahieren
      const exifLength = buffer.readUInt16BE(markerIndex + 2);
      const exifBuffer = buffer.slice(markerIndex + 4, markerIndex + 2 + exifLength);
      
      // Prüfe auf "Exif" Header
      if (!exifBuffer.slice(0, 4).equals(Buffer.from('Exif'))) {
        return null;
      }

      const tiffBuffer = exifBuffer.slice(6);
      return this.exifReader(tiffBuffer);

    } catch (error) {
      console.warn('[ExifExtractor] exif-reader Fehler:', error);
      return null;
    }
  }

  /**
   * EXIF-Extraktion mit piexifjs
   */
  extractWithPiexif(buffer) {
    try {
      const dataUrl = 'data:image/jpeg;base64,' + buffer.toString('base64');
      const exifObj = this.piexif.load(dataUrl);
      return exifObj;
    } catch (error) {
      console.warn('[ExifExtractor] piexifjs Fehler:', error);
      return null;
    }
  }

  /**
   * Manuelle EXIF-Extraktion (Fallback)
   */
  extractWithManualParsing(buffer) {
    try {
      const exifData = {};
      
      // Suche nach DateTime-Strings im Buffer
      const bufferStr = buffer.toString('binary');
      
      // EXIF DateTime Patterns
      const datePatterns = [
        /(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/g,
        /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/g,
        /(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})/g
      ];

      for (const pattern of datePatterns) {
        const matches = [...bufferStr.matchAll(pattern)];
        if (matches.length > 0) {
          const match = matches[0];
          const dateStr = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}`;
          
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            exifData.DateTime = dateStr;
            break;
          }
        }
      }

      return Object.keys(exifData).length > 0 ? exifData : null;

    } catch (error) {
      console.warn('[ExifExtractor] Manuelle Extraktion fehlgeschlagen:', error);
      return null;
    }
  }

  /**
   * EXIF-Daten verarbeiten und normalisieren
   */
  processExifData(exifData, fileName) {
    const result = {
      fileName: fileName,
      takenAt: null,
      camera: null,
      lens: null,
      settings: {},
      gps: null,
      orientation: null,
      dimensions: null,
      rawExif: exifData
    };

    try {
      // Aufnahmedatum extrahieren
      result.takenAt = this.extractDateTime(exifData);

      // Kamera-Informationen
      result.camera = this.extractCameraInfo(exifData);

      // Aufnahme-Einstellungen
      result.settings = this.extractCameraSettings(exifData);

      // GPS-Daten
      result.gps = this.extractGpsData(exifData);

      // Orientierung
      result.orientation = this.extractOrientation(exifData);

      // Bildabmessungen
      result.dimensions = this.extractDimensions(exifData);

      console.log(`[ExifExtractor] ✅ EXIF-Daten extrahiert für ${fileName}`);
      if (result.takenAt) {
        console.log(`[ExifExtractor] 📅 Aufnahmedatum: ${result.takenAt}`);
      }

      return result;

    } catch (error) {
      console.error('[ExifExtractor] Fehler bei der EXIF-Verarbeitung:', error);
      return result;
    }
  }

  /**
   * Aufnahmedatum extrahieren
   */
  extractDateTime(exifData) {
    const dateFields = [
      'DateTimeOriginal',
      'DateTime',
      'DateTimeDigitized'
    ];

    for (const field of dateFields) {
      const value = this.getExifValue(exifData, field);
      if (value) {
        const date = this.parseExifDate(value);
        if (date) {
          return date;
        }
      }
    }

    return null;
  }

  /**
   * Kamera-Informationen extrahieren
   */
  extractCameraInfo(exifData) {
    return {
      make: this.getExifValue(exifData, 'Make'),
      model: this.getExifValue(exifData, 'Model'),
      software: this.getExifValue(exifData, 'Software')
    };
  }

  /**
   * Kamera-Einstellungen extrahieren
   */
  extractCameraSettings(exifData) {
    return {
      iso: this.getExifValue(exifData, 'ISOSpeedRatings'),
      aperture: this.getExifValue(exifData, 'FNumber'),
      shutterSpeed: this.getExifValue(exifData, 'ExposureTime'),
      focalLength: this.getExifValue(exifData, 'FocalLength'),
      flash: this.getExifValue(exifData, 'Flash')
    };
  }

  /**
   * GPS-Daten extrahieren
   */
  extractGpsData(exifData) {
    try {
      const gpsInfo = this.getExifValue(exifData, 'gps') || this.getExifValue(exifData, 'GPS');
      if (!gpsInfo) return null;

      const lat = this.convertGpsCoordinate(
        gpsInfo.GPSLatitude, 
        gpsInfo.GPSLatitudeRef
      );
      const lon = this.convertGpsCoordinate(
        gpsInfo.GPSLongitude, 
        gpsInfo.GPSLongitudeRef
      );

      if (lat !== null && lon !== null) {
        return { latitude: lat, longitude: lon };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Orientierung extrahieren
   */
  extractOrientation(exifData) {
    const orientation = this.getExifValue(exifData, 'Orientation');
    return orientation || 1;
  }

  /**
   * Bildabmessungen extrahieren
   */
  extractDimensions(exifData) {
    const width = this.getExifValue(exifData, 'ExifImageWidth') || 
                  this.getExifValue(exifData, 'ImageWidth');
    const height = this.getExifValue(exifData, 'ExifImageHeight') || 
                   this.getExifValue(exifData, 'ImageHeight');

    if (width && height) {
      return { width, height };
    }

    return null;
  }

  /**
   * EXIF-Wert sicher extrahieren
   */
  getExifValue(exifData, key) {
    try {
      // Verschiedene EXIF-Strukturen unterstützen
      if (exifData[key] !== undefined) {
        return exifData[key];
      }

      if (exifData.exif && exifData.exif[key] !== undefined) {
        return exifData.exif[key];
      }

      if (exifData['0th'] && exifData['0th'][key] !== undefined) {
        return exifData['0th'][key];
      }

      if (exifData.Exif && exifData.Exif[key] !== undefined) {
        return exifData.Exif[key];
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * EXIF-Datum parsen
   */
  parseExifDate(dateStr) {
    try {
      if (typeof dateStr !== 'string') {
        return null;
      }

      // EXIF-Format: "YYYY:MM:DD HH:MM:SS"
      const cleaned = dateStr.replace(/:/g, '-', 2);
      const date = new Date(cleaned);
      
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * GPS-Koordinaten konvertieren
   */
  convertGpsCoordinate(coord, ref) {
    try {
      if (!coord || !Array.isArray(coord) || coord.length !== 3) {
        return null;
      }

      const degrees = coord[0];
      const minutes = coord[1];
      const seconds = coord[2];

      let decimal = degrees + (minutes / 60) + (seconds / 3600);

      if (ref === 'S' || ref === 'W') {
        decimal = -decimal;
      }

      return decimal;
    } catch (error) {
      return null;
    }
  }

  /**
   * Fallback-Metadaten erstellen
   */
  createFallbackMetadata(fileName, buffer = null) {
    const result = {
      fileName: fileName,
      takenAt: null,
      camera: null,
      lens: null,
      settings: {},
      gps: null,
      orientation: 1,
      dimensions: null,
      rawExif: null,
      fallback: true
    };

    // Versuche Datum aus Dateiname zu extrahieren
    const fileDate = this.extractDateFromFileName(fileName);
    if (fileDate) {
      result.takenAt = fileDate;
    }

    return result;
  }

  /**
   * Datum aus Dateiname extrahieren
   */
  extractDateFromFileName(fileName) {
    try {
      const patterns = [
        // IMG_YYYYMMDD_HHMMSS format
        /IMG_(\d{4})(\d{2})(\d{2})_(\d{6})/,
        // YYYYMMDD format
        /(\d{4})(\d{2})(\d{2})/,
        // YYYY-MM-DD format
        /(\d{4})-(\d{2})-(\d{2})/,
        // YYYY_MM_DD format
        /(\d{4})_(\d{2})_(\d{2})/
      ];

      for (const pattern of patterns) {
        const match = fileName.match(pattern);
        if (match) {
          let year, month, day;
          
          if (pattern.source.includes('IMG_')) {
            // IMG_YYYYMMDD_HHMMSS format
            year = match[1];
            month = match[2]; 
            day = match[3];
          } else {
            // Standard YYYY MM DD format
            year = match[1];
            month = match[2];
            day = match[3];
          }

          // Validiere Datum
          const yearNum = parseInt(year);
          const monthNum = parseInt(month);
          const dayNum = parseInt(day);
          
          if (yearNum >= 1990 && yearNum <= 2030 && 
              monthNum >= 1 && monthNum <= 12 && 
              dayNum >= 1 && dayNum <= 31) {
            
            const date = new Date(yearNum, monthNum - 1, dayNum);
            if (!isNaN(date.getTime())) {
              return date.toISOString();
            }
          }
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}

module.exports = ExifExtractor;
