/**
 * Browser-kompatible EXIF Data Extractor für GartenMeister
 * Extrahiert Aufnahmedatum und andere Metadaten aus Bildern im Browser
 */

class BrowserExifExtractor {
  constructor() {
    this.isNode = typeof window === 'undefined';
    this.initializeLibraries();
  }

  /**
   * EXIF-Bibliotheken initialisieren (browsertauglich)
   */
  initializeLibraries() {
    // Nur im Browser verfügbare APIs verwenden
    if (!this.isNode) {
      console.log('[BrowserExifExtractor] Browser-Umgebung erkannt');
    } else {
      console.log('[BrowserExifExtractor] Node.js-Umgebung erkannt');
    }
  }

  /**
   * EXIF-Daten aus File-Objekt extrahieren (Browser)
   */
  async extractFromFile(file) {
    try {
      if (!(file instanceof File) && !(file instanceof Blob)) {
        throw new Error('Ungültiges File-Objekt');
      }

      const buffer = await this.fileToArrayBuffer(file);
      return await this.extractFromBuffer(buffer, file.name || 'unknown.jpg');

    } catch (error) {
      console.error('[BrowserExifExtractor] Fehler beim Lesen der Datei:', error);
      return this.createFallbackMetadata(file.name || 'unknown.jpg');
    }
  }

  /**
   * EXIF-Daten aus ArrayBuffer extrahieren
   */
  async extractFromBuffer(buffer, fileName) {
    try {
      const ext = this.getFileExtension(fileName).toLowerCase();
      
      // Nur JPEG-Dateien haben EXIF-Daten
      if (ext !== '.jpg' && ext !== '.jpeg') {
        return this.createFallbackMetadata(fileName, buffer);
      }

      // Browser-basierte EXIF-Extraktion
      const exifData = this.extractWithManualParsing(buffer);

      if (!exifData) {
        return this.createFallbackMetadata(fileName, buffer);
      }

      return this.processExifData(exifData, fileName);

    } catch (error) {
      console.error('[BrowserExifExtractor] Fehler bei EXIF-Extraktion:', error);
      return this.createFallbackMetadata(fileName, buffer);
    }
  }

  /**
   * File zu ArrayBuffer konvertieren
   */
  async fileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Datei-Extension extrahieren
   */
  getFileExtension(fileName) {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot !== -1 ? fileName.substring(lastDot) : '';
  }

  /**
   * Manuelle EXIF-Extraktion (Browser-kompatibel)
   */
  extractWithManualParsing(buffer) {
    try {
      const uint8Array = new Uint8Array(buffer);
      const exifData = {};
      
      // Suche nach EXIF-Marker im JPEG
      let exifStart = -1;
      for (let i = 0; i < uint8Array.length - 4; i++) {
        if (uint8Array[i] === 0xFF && uint8Array[i + 1] === 0xE1) {
          // Prüfe auf "Exif" Header
          if (uint8Array[i + 4] === 0x45 && // E
              uint8Array[i + 5] === 0x78 && // x
              uint8Array[i + 6] === 0x69 && // i
              uint8Array[i + 7] === 0x66) { // f
            exifStart = i + 10; // Nach "Exif\0\0"
            break;
          }
        }
      }

      if (exifStart === -1) {
        return null;
      }

      // Suche nach DateTime-Strings
      const textDecoder = new TextDecoder('ascii', { fatal: false });
      const text = textDecoder.decode(uint8Array.slice(exifStart, exifStart + 1000));
      
      // EXIF DateTime Patterns
      const datePatterns = [
        /(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/g,
        /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/g
      ];

      for (const pattern of datePatterns) {
        const matches = [...text.matchAll(pattern)];
        if (matches.length > 0) {
          const match = matches[0];
          const dateStr = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}`;
          
          const date = new Date(dateStr);
          if (!isNaN(date.getTime()) && date.getFullYear() > 1990 && date.getFullYear() < 2100) {
            exifData.DateTime = dateStr;
            break;
          }
        }
      }

      return Object.keys(exifData).length > 0 ? exifData : null;

    } catch (error) {
      console.warn('[BrowserExifExtractor] Manuelle Extraktion fehlgeschlagen:', error);
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
      rawExif: exifData,
      extractedBy: 'browser'
    };

    try {
      // Aufnahmedatum extrahieren
      result.takenAt = this.extractDateTime(exifData);

      console.log(`[BrowserExifExtractor] ✅ EXIF-Daten extrahiert für ${fileName}`);
      if (result.takenAt) {
        console.log(`[BrowserExifExtractor] 📅 Aufnahmedatum: ${result.takenAt}`);
      }

      return result;

    } catch (error) {
      console.error('[BrowserExifExtractor] Fehler bei der EXIF-Verarbeitung:', error);
      return result;
    }
  }

  /**
   * Aufnahmedatum extrahieren
   */
  extractDateTime(exifData) {
    if (exifData.DateTime) {
      const date = this.parseExifDate(exifData.DateTime);
      if (date) {
        return date;
      }
    }

    return null;
  }

  /**
   * EXIF-Datum parsen
   */
  parseExifDate(dateStr) {
    try {
      if (typeof dateStr !== 'string') {
        return null;
      }

      // EXIF-Format bereits normalisiert
      const date = new Date(dateStr);
      
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }

      return null;
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
      fallback: true,
      extractedBy: 'fallback'
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
        /(\d{4})-(\d{2})-(\d{2})/,        // YYYY-MM-DD
        /(\d{4})(\d{2})(\d{2})/,          // YYYYMMDD
        /IMG_(\d{4})(\d{2})(\d{2})/,      // IMG_YYYYMMDD
        /(\d{2})(\d{2})(\d{4})/           // DDMMYYYY
      ];

      for (const pattern of patterns) {
        const match = fileName.match(pattern);
        if (match) {
          let year, month, day;
          
          if (pattern.source.includes('IMG_')) {
            year = match[1];
            month = match[2];
            day = match[3];
          } else if (pattern.source.includes('(\d{4})')) {
            year = match[1];
            month = match[2];
            day = match[3];
          } else {
            day = match[1];
            month = match[2];
            year = match[3];
          }

          const date = new Date(year, month - 1, day);
          if (!isNaN(date.getTime()) && date.getFullYear() > 1990 && date.getFullYear() < 2100) {
            return date.toISOString();
          }
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}

// Export für beide Umgebungen
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrowserExifExtractor;
} else if (typeof window !== 'undefined') {
  window.BrowserExifExtractor = BrowserExifExtractor;
}

export default BrowserExifExtractor;
