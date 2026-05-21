/**
 * 🔧 EXE-kompatible Image Manager Configuration
 * Adaptive Pfad-Auflösung für portable EXE-Builds
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class ImageManagerConfig {
  static getAdaptivePaths() {
    const config = {
      basePath: null,
      isNAS: false,
      isPortable: false,
      fallbacks: []
    };

    // 1. EXE-Modus: Portable neben der EXE
    if (process.pkg) {
      // EXE-Verzeichnis ermitteln
      const exeDir = path.dirname(process.execPath);
      
      // Prüfen ob wir Schreibrechte haben
      const testPaths = [
        path.join(exeDir, 'garden-images'),          // Neben der EXE
        path.join(exeDir, '..', 'garden-images'),    // Eine Ebene höher
        path.join(os.homedir(), 'GartenMeister', 'garden-images'), // User-Verzeichnis
        path.join(os.tmpdir(), 'GartenMeister', 'garden-images')   // Temp-Verzeichnis
      ];

      for (const testPath of testPaths) {
        try {
          // Testen ob Verzeichnis erstellt werden kann
          if (!fs.existsSync(testPath)) {
            fs.mkdirSync(testPath, { recursive: true });
          }
          
          // Schreibtest durchführen
          const testFile = path.join(testPath, 'write-test.tmp');
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
          
          config.basePath = testPath;
          config.isPortable = true;
          console.log('[ImageConfig] 📦 EXE-Modus: Portable Pfad mit Schreibrechten:', testPath);
          return config;
          
        } catch (error) {
          console.warn(`[ImageConfig] ⚠️ Kein Schreibzugriff auf ${testPath}:`, error.message);
          continue;
        }
      }
      
      // Fallback wenn kein Pfad funktioniert
      throw new Error('Kein beschreibbarer Pfad für EXE-Modus gefunden');
    }

    // 2. Entwicklungs-Modus: Erst NAS, dann lokal
    try {
      // NAS-Pfad prüfen (nur wenn verfügbar)
      const potentialNASPaths = [
        'G:\\gartenmeister\\images',
        'Z:\\gartenmeister\\images', // Alternative Laufwerkbuchstaben
        '\\\\nas\\gartenmeister\\images' // UNC-Pfad
      ];

      for (const nasPath of potentialNASPaths) {
        if (fs.existsSync(nasPath)) {
          config.basePath = nasPath;
          config.isNAS = true;
          config.fallbacks.push(ImageManagerConfig.getLocalPath());
          console.log('[ImageConfig] 📡 NAS verfügbar:', nasPath);
          return config;
        }
      }

      // Fallback zu lokalem Pfad
      config.basePath = ImageManagerConfig.getLocalPath();
      console.log('[ImageConfig] 💻 Verwende lokalen Pfad:', config.basePath);
      return config;

    } catch (error) {
      console.error('[ImageConfig] ⚠️ Pfad-Ermittlung fehlgeschlagen:', error);
      config.basePath = ImageManagerConfig.getLocalPath();
      return config;
    }
  }

  static getLocalPath() {
    try {
      // Electron verfügbar?
      const { app } = require('electron');
      return path.join(app.getPath('userData'), 'garden-images');
    } catch (error) {
      // Fallback ohne Electron
      return path.join(os.homedir(), 'GartenMeister', 'garden-images');
    }
  }

  static ensureDirectories(basePath) {
    const dirs = [
      basePath,
      path.join(basePath, 'images'),      // Für lokale/portable Mode
      path.join(basePath, 'garden'),      // Für NAS Mode
      path.join(basePath, 'metadata'),
      path.join(basePath, 'thumbnails'),
      path.join(basePath, 'diagnosis')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[ImageConfig] 📁 Verzeichnis erstellt: ${dir}`);
      }
    });
  }

  static getMetadataPath(basePath, isNAS = false) {
    if (isNAS) {
      return path.join(basePath, 'metadata', 'image-metadata.json');
    } else {
      return path.join(basePath, 'image-metadata.json');
    }
  }

  static getImagePath(basePath, isNAS = false) {
    if (isNAS) {
      return path.join(basePath, 'garden');
    } else {
      return path.join(basePath, 'images');
    }
  }

  static getThumbnailPath(basePath) {
    return path.join(basePath, 'thumbnails');
  }
}

module.exports = ImageManagerConfig;
