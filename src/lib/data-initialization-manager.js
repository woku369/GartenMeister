/**
 * Data Initialization Manager
 * Stellt sicher, dass neue App-Installationen immer vorhandene Daten laden
 * und niemals leere Daten über bestehende Datenbestände schreiben
 */

const fs = require('fs');
const path = require('path');

class DataInitializationManager {
  constructor() {
    this.dataSourcePriority = [
      'remote-nas',      // Höchste Priorität: Remote NAS
      'local-nas',       // Mittlere Priorität: Lokale NAS
      'local-backup',    // Niedrige Priorität: Lokale Backups
      'embedded-seed'    // Letzte Option: Eingebaute Seed-Daten
    ];
    
    this.minimalValidData = {
      beds: [],
      herbVarieties: [],
      segments: [],
      harvestEvents: [],
      harvestContributions: [],
      gartenConfiguration: {
        gartenName: '',
        standort: '',
        groesse: '',
        bodentyp: '',
        ausrichtung: '',
        klimazone: '',
        bewaesserung: '',
        duengung: '',
        notizen: ''
      },
      lastModified: new Date().toISOString(),
      version: '1.0.0',
      dataSource: 'initialization'
    };
  }

  /**
   * Initialisiert Daten für eine neue App-Installation
   * Lädt immer vorhandene Daten und verhindert Überschreibung
   */
  async initializeAppData() {
    console.log('[DataInit] 🚀 Starte Dateninitialisierung...');
    
    try {
      // 1. Prüfe Remote NAS
      const remoteData = await this.loadFromRemoteNAS();
      if (remoteData && this.isValidDataSet(remoteData)) {
        console.log('[DataInit] ✅ Remote-NAS-Daten geladen');
        return await this.finalizeInitialization(remoteData, 'remote-nas');
      }

      // 2. Prüfe lokale NAS
      const localNASData = await this.loadFromLocalNAS();
      if (localNASData && this.isValidDataSet(localNASData)) {
        console.log('[DataInit] ✅ Lokale NAS-Daten geladen');
        return await this.finalizeInitialization(localNASData, 'local-nas');
      }

      // 3. Prüfe lokale Backups
      const backupData = await this.loadFromLocalBackup();
      if (backupData && this.isValidDataSet(backupData)) {
        console.log('[DataInit] ✅ Backup-Daten geladen');
        return await this.finalizeInitialization(backupData, 'local-backup');
      }

      // 4. Verwende Seed-Daten als letzte Option
      console.log('[DataInit] ⚠️ Keine bestehenden Daten gefunden - verwende Seed-Daten');
      const seedData = await this.loadSeedData();
      return await this.finalizeInitialization(seedData, 'embedded-seed');

    } catch (error) {
      console.error('[DataInit] ❌ Fehler bei Dateninitialisierung:', error);
      return this.minimalValidData;
    }
  }

  /**
   * Lädt Daten von Remote-NAS
   */
  async loadFromRemoteNAS() {
    try {
      // Dynamisch Remote NAS Manager laden
      const RemoteNASManager = require('./remote-nas-manager.js');
      const remoteNAS = new RemoteNASManager();
      
      const connection = await remoteNAS.checkConnection();
      if (connection.activeConnection) {
        const dataStr = await remoteNAS.loadFile('data/app-data.json');
        if (dataStr) {
          return JSON.parse(dataStr);
        }
      }
    } catch (error) {
      console.log('[DataInit] Remote-NAS nicht verfügbar:', error.message);
    }
    return null;
  }

  /**
   * Lädt Daten von lokaler NAS (G: Laufwerk)
   */
  async loadFromLocalNAS() {
    try {
      const nasPath = 'G:\\gartenmeister\\data\\app-data.json';
      if (fs.existsSync(nasPath)) {
        const data = fs.readFileSync(nasPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.log('[DataInit] Lokale NAS nicht verfügbar:', error.message);
    }
    return null;
  }

  /**
   * Lädt Daten aus lokalen Backups
   */
  async loadFromLocalBackup() {
    try {
      const backupDir = path.join(process.cwd(), 'data-backups');
      if (fs.existsSync(backupDir)) {
        const backupFiles = fs.readdirSync(backupDir)
          .filter(file => file.startsWith('app-data-backup-') && file.endsWith('.json'))
          .sort()
          .reverse(); // Neueste zuerst

        for (const backupFile of backupFiles) {
          try {
            const backupPath = path.join(backupDir, backupFile);
            const data = fs.readFileSync(backupPath, 'utf8');
            const parsedData = JSON.parse(data);
            
            if (this.isValidDataSet(parsedData)) {
              console.log(`[DataInit] Verwende Backup: ${backupFile}`);
              return parsedData;
            }
          } catch (backupError) {
            console.log(`[DataInit] Backup ${backupFile} beschädigt:`, backupError.message);
          }
        }
      }
    } catch (error) {
      console.log('[DataInit] Backup-Laden fehlgeschlagen:', error.message);
    }
    return null;
  }

  /**
   * Lädt eingebaute Seed-Daten (aktueller Datenbestand)
   */
  async loadSeedData() {
    try {
      // Versuche zunächst externes Seed-Data-File zu laden
      const seedPath = path.join(process.cwd(), 'data-backups', 'seed-data.json');
      if (fs.existsSync(seedPath)) {
        const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
        seedData.dataSource = 'seed-file';
        seedData.initializationTimestamp = new Date().toISOString();
        console.log('[DataInit] 📦 Seed-Daten aus Datei geladen');
        return seedData;
      }
    } catch (error) {
      console.log('[DataInit] Seed-Datei nicht verfügbar:', error.message);
    }
    
    // Fallback: Eingebaute Seed-Daten
    return {
      beds: [],
      herbVarieties: [
        {
          id: "basilikum",
          name: "Basilikum",
          scientificName: "Ocimum basilicum",
          category: "Küchenkräuter",
          description: "Aromatisches Küchenkraut aus der Familie der Lippenblütler",
          growingTips: "Benötigt warmen, sonnigen Standort und regelmäßige Bewässerung",
          harvestTime: "Kontinuierlich von Mai bis Oktober",
          uses: ["Kochen", "Tee", "Aromatherapie"]
        },
        {
          id: "thymian",
          name: "Thymian",
          scientificName: "Thymus vulgaris",
          category: "Küchenkräuter",
          description: "Mehrjähriges Kraut mit intensivem Aroma",
          growingTips: "Bevorzugt durchlässigen, kalkhaltigen Boden und viel Sonne",
          harvestTime: "Ganzjährig, beste Zeit vor der Blüte",
          uses: ["Kochen", "Heilkraut", "Tee"]
        },
        {
          id: "rosmarin",
          name: "Rosmarin",
          scientificName: "Rosmarinus officinalis",
          category: "Küchenkräuter",
          description: "Immergrüner Strauch mit nadelförmigen Blättern",
          growingTips: "Benötigt vollsonnigen Standort und gut durchlässigen Boden",
          harvestTime: "Ganzjährig möglich",
          uses: ["Kochen", "Heilkraut", "Zierpflanze"]
        }
      ],
      segments: [],
      harvestEvents: [],
      harvestContributions: [],
      gartenConfiguration: {
        gartenName: 'Mein Kräutergarten',
        standort: 'Gurk, Kärnten, Österreich',
        groesse: '',
        bodentyp: '',
        ausrichtung: '',
        klimazone: 'Gemäßigt kontinental',
        bewaesserung: '',
        duengung: '',
        notizen: 'GartenMeister Studio - Neu initialisiert'
      },
      lastModified: new Date().toISOString(),
      version: '1.0.0',
      dataSource: 'embedded-seed',
      initializationTimestamp: new Date().toISOString()
    };
  }

  /**
   * Prüft ob ein Datensatz gültig und vollständig ist
   */
  isValidDataSet(data) {
    if (!data || typeof data !== 'object') return false;
    
    // Prüfe Mindeststruktur
    const requiredFields = ['beds', 'herbVarieties', 'segments', 'gartenConfiguration'];
    for (const field of requiredFields) {
      if (!Array.isArray(data[field]) && typeof data[field] !== 'object') {
        console.log(`[DataInit] Ungültiger Datensatz: Feld '${field}' fehlt oder ist ungültig`);
        return false;
      }
    }

    // Prüfe ob Daten vorhanden sind (nicht komplett leer)
    const hasData = (
      (data.beds && data.beds.length > 0) ||
      (data.herbVarieties && data.herbVarieties.length > 0) ||
      (data.segments && data.segments.length > 0) ||
      (data.gartenConfiguration && data.gartenConfiguration.gartenName)
    );

    if (!hasData) {
      console.log('[DataInit] Datensatz ist leer - wird als ungültig betrachtet');
      return false;
    }

    return true;
  }

  /**
   * Finalisiert die Initialisierung
   */
  async finalizeInitialization(data, source) {
    // Markiere Datenquelle
    data.dataSource = source;
    data.initializationTimestamp = new Date().toISOString();
    
    // Erstelle Sicherheitskopie der initialisierten Daten
    await this.createInitializationBackup(data, source);
    
    // Speichere auf alle verfügbaren Ziele
    await this.distributeData(data);
    
    console.log(`[DataInit] ✅ Daten erfolgreich initialisiert von: ${source}`);
    return data;
  }

  /**
   * Erstellt ein Backup der initialisierten Daten
   */
  async createInitializationBackup(data, source) {
    try {
      const backupDir = path.join(process.cwd(), 'data-backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupFile = `app-data-initialization-${source}-${timestamp}.json`;
      const backupPath = path.join(backupDir, backupFile);
      
      fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
      console.log(`[DataInit] 💾 Initialisierungs-Backup erstellt: ${backupFile}`);
    } catch (error) {
      console.error('[DataInit] Backup-Erstellung fehlgeschlagen:', error);
    }
  }

  /**
   * Verteilt Daten auf alle verfügbaren Speicherorte
   */
  async distributeData(data) {
    const results = {
      remoteNAS: false,
      localNAS: false,
      localFile: false
    };

    // Speichere auf Remote-NAS
    try {
      const RemoteNASManager = require('./remote-nas-manager.js');
      const remoteNAS = new RemoteNASManager();
      const connection = await remoteNAS.checkConnection();
      
      if (connection.activeConnection) {
        const success = await remoteNAS.saveFile('data/app-data.json', JSON.stringify(data, null, 2));
        results.remoteNAS = success;
        if (success) console.log('[DataInit] ✅ Daten auf Remote-NAS gespeichert');
      }
    } catch (error) {
      console.log('[DataInit] Remote-NAS Speicherung fehlgeschlagen:', error.message);
    }

    // Speichere auf lokale NAS
    try {
      const nasPath = 'G:\\gartenmeister\\data\\app-data.json';
      const nasDir = path.dirname(nasPath);
      
      if (!fs.existsSync(nasDir)) {
        fs.mkdirSync(nasDir, { recursive: true });
      }
      
      fs.writeFileSync(nasPath, JSON.stringify(data, null, 2));
      results.localNAS = true;
      console.log('[DataInit] ✅ Daten auf lokaler NAS gespeichert');
    } catch (error) {
      console.log('[DataInit] Lokale NAS Speicherung fehlgeschlagen:', error.message);
    }

    // Speichere lokal (falls Electron verfügbar)
    try {
      if (typeof window !== 'undefined' || process.versions.electron) {
        const localPath = path.join(process.cwd(), 'data', 'app-data.json');
        const localDir = path.dirname(localPath);
        
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }
        
        fs.writeFileSync(localPath, JSON.stringify(data, null, 2));
        results.localFile = true;
        console.log('[DataInit] ✅ Daten lokal gespeichert');
      }
    } catch (error) {
      console.log('[DataInit] Lokale Speicherung fehlgeschlagen:', error.message);
    }

    return results;
  }

  /**
   * Prüft ob eine App-Installation bereits initialisiert wurde
   */
  async isAppInitialized() {
    try {
      // Prüfe lokale Marker-Datei
      const markerPath = path.join(process.cwd(), 'data', '.initialized');
      if (fs.existsSync(markerPath)) {
        const markerData = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
        return {
          initialized: true,
          timestamp: markerData.timestamp,
          source: markerData.source
        };
      }
      
      return { initialized: false };
    } catch (error) {
      return { initialized: false };
    }
  }

  /**
   * Markiert App als initialisiert
   */
  async markAsInitialized(source) {
    try {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      const markerPath = path.join(dataDir, '.initialized');
      const markerData = {
        timestamp: new Date().toISOString(),
        source: source,
        version: '1.0.0'
      };
      
      fs.writeFileSync(markerPath, JSON.stringify(markerData, null, 2));
      console.log('[DataInit] ✅ App als initialisiert markiert');
    } catch (error) {
      console.error('[DataInit] Marker-Erstellung fehlgeschlagen:', error);
    }
  }

  /**
   * Hauptfunktion für sicheren App-Start
   */
  async safeAppInitialization() {
    console.log('[DataInit] 🔍 Prüfe App-Initialisierung...');
    
    const initStatus = await this.isAppInitialized();
    
    if (initStatus.initialized) {
      console.log(`[DataInit] ✅ App bereits initialisiert (${initStatus.source} - ${initStatus.timestamp})`);
      // Lade vorhandene Daten
      return await this.initializeAppData();
    } else {
      console.log('[DataInit] 🆕 Erste App-Initialisierung...');
      const data = await this.initializeAppData();
      await this.markAsInitialized(data.dataSource);
      return data;
    }
  }
}

module.exports = DataInitializationManager;
