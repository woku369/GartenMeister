/**
 * 🔗 EXE-kompatible Image URL Resolution
 * Stellt sicher, dass Bildpfade in portablen EXEs korrekt aufgelöst werden
 */

const fs = require('fs');
const path = require('path');

class ImageUrlResolver {
  
  /**
   * File-URL für EXE-kompatible Darstellung erstellen
   */
  static async createFileUrl(imageId, imageManager) {
    try {
      const image = imageManager.getImageById(imageId);
      if (!image || !image.filePath) {
        throw new Error('Bild oder Pfad nicht gefunden');
      }

      // Prüfen ob Datei existiert
      if (!fs.existsSync(image.filePath)) {
        throw new Error('Bilddatei existiert nicht');
      }

      // EXE-Modus: file:// URLs für lokale Dateien
      if (process.pkg || imageManager.isPortable) {
        const absolutePath = path.resolve(image.filePath);
        const fileUrl = `file:///${absolutePath.replace(/\\/g, '/')}`;
        console.log(`[ImageUrlResolver] 📦 EXE-URL: ${fileUrl}`);
        return fileUrl;
      }

      // Development-Modus: Relative URLs
      const relativePath = path.relative(process.cwd(), image.filePath);
      const devUrl = `/${relativePath.replace(/\\/g, '/')}`;
      console.log(`[ImageUrlResolver] 🔧 Dev-URL: ${devUrl}`);
      return devUrl;

    } catch (error) {
      console.error('[ImageUrlResolver] ❌ URL-Erstellung fehlgeschlagen:', error);
      return null;
    }
  }

  /**
   * Bild als Base64 Data-URL erstellen (Fallback für EXEs)
   */
  static async createDataUrl(imageId, imageManager) {
    try {
      const image = imageManager.getImageById(imageId);
      if (!image || !image.filePath) {
        throw new Error('Bild oder Pfad nicht gefunden');
      }

      // Datei lesen
      const fileBuffer = fs.readFileSync(image.filePath);
      const mimeType = image.mimeType || 'image/jpeg';
      
      // Data-URL erstellen
      const base64 = fileBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;
      
      console.log(`[ImageUrlResolver] 📊 Data-URL erstellt: ${Math.round(base64.length / 1024)}KB`);
      return dataUrl;

    } catch (error) {
      console.error('[ImageUrlResolver] ❌ Data-URL-Erstellung fehlgeschlagen:', error);
      return null;
    }
  }

  /**
   * Optimale URL-Strategie basierend auf Umgebung wählen
   */
  static async getBestUrl(imageId, imageManager) {
    try {
      // Für kleine Bilder (<100KB): Data-URL
      const image = imageManager.getImageById(imageId);
      if (image && image.fileSize && image.fileSize < 100 * 1024) {
        const dataUrl = await ImageUrlResolver.createDataUrl(imageId, imageManager);
        if (dataUrl) return dataUrl;
      }

      // Sonst: File-URL
      return await ImageUrlResolver.createFileUrl(imageId, imageManager);

    } catch (error) {
      console.error('[ImageUrlResolver] ❌ URL-Auflösung fehlgeschlagen:', error);
      return null;
    }
  }

  /**
   * Thumbnail-URL erstellen
   */
  static async createThumbnailUrl(imageId, imageManager) {
    try {
      const image = imageManager.getImageById(imageId);
      if (!image) return null;

      const thumbnailPath = path.join(imageManager.thumbnailPath, `thumb-${image.fileName}`);
      
      // Thumbnail existiert?
      if (fs.existsSync(thumbnailPath)) {
        if (process.pkg || imageManager.isPortable) {
          const absolutePath = path.resolve(thumbnailPath);
          return `file:///${absolutePath.replace(/\\/g, '/')}`;
        } else {
          const relativePath = path.relative(process.cwd(), thumbnailPath);
          return `/${relativePath.replace(/\\/g, '/')}`;
        }
      }

      // Fallback: Original-Bild verwenden
      return await ImageUrlResolver.createFileUrl(imageId, imageManager);

    } catch (error) {
      console.error('[ImageUrlResolver] ❌ Thumbnail-URL-Erstellung fehlgeschlagen:', error);
      return null;
    }
  }
}

module.exports = ImageUrlResolver;
