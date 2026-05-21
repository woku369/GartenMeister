/**
 * Remote NAS Manager für Synology QuickConnect Integration
 * Unterstützt sowohl lokale Netzwerk-Verbindungen als auch Remote-Zugriff
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class RemoteNASManager {
  constructor() {
    this.config = {
      // Lokale Netzwerk-Konfiguration (Fallback)
      local: {
        enabled: true,
        host: 'DS124-RockingK',
        ip: '192.168.0.25',
        path: 'G:\\gartenmeister',
        share: '\\\\DS124-RockingK\\Gurktaler'
      },
      // Remote QuickConnect-Konfiguration
      remote: {
        enabled: false,
        quickconnectId: 'diwkaon',
        quickconnectUrl: 'https://quickconnect.to/diwkaon',
        username: '',
        password: '',
        sharePath: '/Gurktaler/gartenmeister',
        sessionId: null,
        lastConnected: null
      }
    };
    
    this.loadConfiguration();
  }

  /**
   * Lade gespeicherte Konfiguration
   */
  loadConfiguration() {
    try {
      const configPath = path.join(process.cwd(), 'nas-remote-config.json');
      if (fs.existsSync(configPath)) {
        const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        this.config = { ...this.config, ...savedConfig };
      }
    } catch (error) {
      console.warn('[RemoteNAS] Konfiguration konnte nicht geladen werden:', error.message);
    }
  }

  /**
   * Speichere Konfiguration
   */
  saveConfiguration() {
    try {
      const configPath = path.join(process.cwd(), 'nas-remote-config.json');
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('[RemoteNAS] Konfiguration konnte nicht gespeichert werden:', error.message);
    }
  }

  /**
   * Prüfe Verbindung (lokal oder remote)
   */
  async checkConnection() {
    const results = {
      local: false,
      remote: false,
      activeConnection: null,
      error: null
    };

    try {
      // Zuerst lokale Verbindung prüfen
      if (this.config.local.enabled) {
        results.local = await this.checkLocalConnection();
        if (results.local) {
          results.activeConnection = 'local';
        }
      }

      // Dann remote Verbindung prüfen
      if (this.config.remote.enabled && this.config.remote.username && this.config.remote.password) {
        results.remote = await this.checkRemoteConnection();
        if (results.remote && !results.activeConnection) {
          results.activeConnection = 'remote';
        }
      }

      return results;
    } catch (error) {
      results.error = error.message;
      return results;
    }
  }

  /**
   * Prüfe lokale Netzwerk-Verbindung
   */
  async checkLocalConnection() {
    return new Promise((resolve) => {
      try {
        // Prüfe ob G: Laufwerk existiert
        if (fs.existsSync(this.config.local.path)) {
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (error) {
        resolve(false);
      }
    });
  }

  /**
   * Prüfe Remote-Verbindung über QuickConnect
   */
  async checkRemoteConnection() {
    return new Promise((resolve) => {
      try {
        const url = `${this.config.remote.quickconnectUrl}/webapi/auth.cgi?api=SYNO.API.Auth&version=3&method=login&account=${encodeURIComponent(this.config.remote.username)}&passwd=${encodeURIComponent(this.config.remote.password)}&session=FileStation&format=sid`;
        
        const request = https.get(url, (response) => {
          let data = '';
          response.on('data', (chunk) => data += chunk);
          response.on('end', () => {
            try {
              const result = JSON.parse(data);
              if (result.success) {
                this.config.remote.sessionId = result.data.sid;
                this.config.remote.lastConnected = new Date().toISOString();
                this.saveConfiguration();
                resolve(true);
              } else {
                resolve(false);
              }
            } catch (error) {
              resolve(false);
            }
          });
        });

        request.on('error', () => resolve(false));
        request.setTimeout(10000, () => {
          request.destroy();
          resolve(false);
        });
      } catch (error) {
        resolve(false);
      }
    });
  }

  /**
   * Lade Datei (lokal oder remote)
   */
  async loadFile(relativePath) {
    const connection = await this.checkConnection();
    
    if (connection.activeConnection === 'local') {
      return await this.loadLocalFile(relativePath);
    } else if (connection.activeConnection === 'remote') {
      return await this.loadRemoteFile(relativePath);
    } else {
      throw new Error('Keine NAS-Verbindung verfügbar');
    }
  }

  /**
   * Lade lokale Datei
   */
  async loadLocalFile(relativePath) {
    const fullPath = path.join(this.config.local.path, relativePath);
    return new Promise((resolve, reject) => {
      fs.readFile(fullPath, 'utf8', (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   * Lade Remote-Datei über Synology File Station API
   */
  async loadRemoteFile(relativePath) {
    return new Promise((resolve, reject) => {
      if (!this.config.remote.sessionId) {
        reject(new Error('Keine aktive Remote-Session'));
        return;
      }

      const encodedPath = encodeURIComponent(path.posix.join(this.config.remote.sharePath, relativePath));
      const url = `${this.config.remote.quickconnectUrl}/webapi/entry.cgi?api=SYNO.FileStation.Download&version=2&method=download&path=${encodedPath}&mode=download&_sid=${this.config.remote.sessionId}`;

      const request = https.get(url, (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => {
          if (response.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`Remote-Datei konnte nicht geladen werden: ${response.statusCode}`));
          }
        });
      });

      request.on('error', (error) => reject(error));
      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error('Remote-Datei-Download Timeout'));
      });
    });
  }

  /**
   * Speichere Datei (lokal oder remote)
   */
  async saveFile(relativePath, content) {
    const connection = await this.checkConnection();
    
    if (connection.activeConnection === 'local') {
      return await this.saveLocalFile(relativePath, content);
    } else if (connection.activeConnection === 'remote') {
      return await this.saveRemoteFile(relativePath, content);
    } else {
      throw new Error('Keine NAS-Verbindung verfügbar');
    }
  }

  /**
   * Speichere lokale Datei
   */
  async saveLocalFile(relativePath, content) {
    const fullPath = path.join(this.config.local.path, relativePath);
    const dir = path.dirname(fullPath);
    
    return new Promise((resolve, reject) => {
      // Erstelle Verzeichnis falls nötig
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFile(fullPath, content, 'utf8', (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * Speichere Remote-Datei über Synology File Station API
   */
  async saveRemoteFile(relativePath, content) {
    return new Promise((resolve, reject) => {
      if (!this.config.remote.sessionId) {
        reject(new Error('Keine aktive Remote-Session'));
        return;
      }

      // Für Remote-Upload müssen wir ein Temp-File erstellen
      const tempPath = path.join(process.cwd(), 'temp_upload.tmp');
      fs.writeFileSync(tempPath, content);

      const FormData = require('form-data');
      const form = new FormData();
      form.append('api', 'SYNO.FileStation.Upload');
      form.append('version', '2');
      form.append('method', 'upload');
      form.append('path', this.config.remote.sharePath);
      form.append('create_parents', 'true');
      form.append('overwrite', 'true');
      form.append('_sid', this.config.remote.sessionId);
      form.append('file', fs.createReadStream(tempPath), {
        filename: path.basename(relativePath)
      });

      const url = `${this.config.remote.quickconnectUrl}/webapi/entry.cgi`;
      
      form.submit(url, (error, response) => {
        // Temp-Datei löschen
        try {
          fs.unlinkSync(tempPath);
        } catch (e) {}

        if (error) {
          reject(error);
        } else {
          let data = '';
          response.on('data', (chunk) => data += chunk);
          response.on('end', () => {
            try {
              const result = JSON.parse(data);
              if (result.success) {
                resolve(true);
              } else {
                reject(new Error(`Remote-Upload fehlgeschlagen: ${result.error.code}`));
              }
            } catch (parseError) {
              reject(parseError);
            }
          });
        }
      });
    });
  }

  /**
   * Aktualisiere Remote-Konfiguration
   */
  updateRemoteConfig(config) {
    this.config.remote = { ...this.config.remote, ...config };
    this.saveConfiguration();
  }

  /**
   * Erhalte aktuelle Konfiguration
   */
  getConfig() {
    return {
      ...this.config,
      remote: {
        ...this.config.remote,
        password: this.config.remote.password ? '***' : '' // Passwort verbergen
      }
    };
  }

  /**
   * Erhalte detaillierten Status
   */
  async getStatus() {
    const connection = await this.checkConnection();
    
    return {
      ...connection,
      config: this.getConfig(),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = RemoteNASManager;
