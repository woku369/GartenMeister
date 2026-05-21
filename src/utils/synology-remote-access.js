/**
 * 🌐 Synology Remote Access Manager
 * 
 * Ermöglicht echten Remote-Zugriff auf Synology NAS über:
 * - QuickConnect (https://quickconnect.to/diwkaon)
 * - WebAPI (File Station API)
 * - Lokales Netzwerk als Fallback
 * 
 * Version: 1.0.0
 * Datum: 10.07.2025
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

/**
 * Synology NAS Konfiguration
 */
const SYNOLOGY_CONFIG = {
  quickConnect: {
    enabled: true,
    id: 'diwkaon',
    url: 'https://quickconnect.to/diwkaon',
    basePath: '/Gurktaler/gartenmeister'
  },
  local: {
    enabled: true,
    host: 'DS124-RockingK',
    ip: '192.168.0.25',
    port: 5000,
    https: false,
    basePath: '/Gurktaler/gartenmeister'
  },
  auth: {
    // Wird zur Laufzeit konfiguriert
    username: null,
    password: null,
    sessionId: null
  },
  paths: {
    appData: '/data/app-data.json',
    weatherData: '/weather/data/weather-data.json',
    images: '/images',
    backups: '/data/backups',
    sync: '/sync'
  }
};

/**
 * HTTP Request Helper für Synology API
 */
class SynologyAPIClient {
  constructor() {
    this.baseUrl = null;
    this.sessionId = null;
    this.isConnected = false;
  }

  /**
   * Versucht Verbindung über QuickConnect
   */
  async connectViaQuickConnect() {
    try {
      console.log('[SynologyAPI] Verbinde über QuickConnect...');
      
      // Resolves QuickConnect URL to actual server
      const response = await this.makeRequest('GET', 'https://global.quickconnect.to/Serv.php', {
        version: 1,
        command: 'get_server_info',
        stop_when_error: 'false',
        stop_when_success: 'false',
        id: SYNOLOGY_CONFIG.quickConnect.id
      });

      if (response.success && response.data.server) {
        this.baseUrl = `https://${response.data.server.interface[0].ip}:${response.data.server.interface[0].port}`;
        console.log('[SynologyAPI] QuickConnect erfolgreich, Server:', this.baseUrl);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[SynologyAPI] QuickConnect Fehler:', error.message);
      return false;
    }
  }

  /**
   * Versucht lokale Netzwerk-Verbindung
   */
  async connectViaLocal() {
    try {
      console.log('[SynologyAPI] Verbinde über lokales Netzwerk...');
      
      const protocol = SYNOLOGY_CONFIG.local.https ? 'https' : 'http';
      this.baseUrl = `${protocol}://${SYNOLOGY_CONFIG.local.ip}:${SYNOLOGY_CONFIG.local.port}`;
      
      // Test-Request
      const response = await this.makeRequest('GET', `${this.baseUrl}/webapi/query.cgi`, {
        api: 'SYNO.API.Info',
        version: 1,
        method: 'query'
      });

      if (response.success) {
        console.log('[SynologyAPI] Lokale Verbindung erfolgreich');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[SynologyAPI] Lokale Verbindung Fehler:', error.message);
      return false;
    }
  }

  /**
   * Authentifizierung mit Username/Password
   */
  async authenticate(username, password) {
    try {
      if (!this.baseUrl) {
        throw new Error('Keine Verbindung zum Server');
      }

      console.log('[SynologyAPI] Authentifizierung...');
      
      const response = await this.makeRequest('GET', `${this.baseUrl}/webapi/auth.cgi`, {
        api: 'SYNO.API.Auth',
        version: 7,
        method: 'login',
        account: username,
        passwd: password,
        session: 'GartenMeister',
        format: 'cookie'
      });

      if (response.success && response.data.sid) {
        this.sessionId = response.data.sid;
        this.isConnected = true;
        
        // Speichere Credentials für Auto-Login
        SYNOLOGY_CONFIG.auth.username = username;
        SYNOLOGY_CONFIG.auth.password = password;
        SYNOLOGY_CONFIG.auth.sessionId = this.sessionId;
        
        console.log('[SynologyAPI] Authentifizierung erfolgreich');
        return true;
      }

      throw new Error(response.error?.code || 'Authentifizierung fehlgeschlagen');
    } catch (error) {
      console.error('[SynologyAPI] Authentifizierung Fehler:', error.message);
      return false;
    }
  }

  /**
   * Datei von NAS laden
   */
  async downloadFile(remotePath) {
    try {
      if (!this.isConnected) {
        throw new Error('Nicht verbunden');
      }

      const fullPath = SYNOLOGY_CONFIG.quickConnect.basePath + remotePath;
      
      const response = await this.makeRequest('GET', `${this.baseUrl}/webapi/entry.cgi`, {
        api: 'SYNO.FileStation.Download',
        version: 2,
        method: 'download',
        path: fullPath,
        mode: 'open',
        _sid: this.sessionId
      });

      return response;
    } catch (error) {
      console.error('[SynologyAPI] Download Fehler:', error.message);
      return null;
    }
  }

  /**
   * Datei auf NAS hochladen
   */
  async uploadFile(localPath, remotePath, content) {
    try {
      if (!this.isConnected) {
        throw new Error('Nicht verbunden');
      }

      const fullPath = SYNOLOGY_CONFIG.quickConnect.basePath + remotePath;
      
      // Erstelle Verzeichnis falls nicht vorhanden
      await this.createFolder(path.dirname(fullPath));
      
      const response = await this.makeRequest('POST', `${this.baseUrl}/webapi/entry.cgi`, {
        api: 'SYNO.FileStation.Upload',
        version: 3,
        method: 'upload',
        path: path.dirname(fullPath),
        create_parents: true,
        overwrite: true,
        _sid: this.sessionId
      }, {
        file: {
          name: path.basename(fullPath),
          content: content
        }
      });

      return response.success;
    } catch (error) {
      console.error('[SynologyAPI] Upload Fehler:', error.message);
      return false;
    }
  }

  /**
   * Verzeichnis erstellen
   */
  async createFolder(remotePath) {
    try {
      const response = await this.makeRequest('GET', `${this.baseUrl}/webapi/entry.cgi`, {
        api: 'SYNO.FileStation.CreateFolder',
        version: 2,
        method: 'create',
        folder_path: SYNOLOGY_CONFIG.quickConnect.basePath + remotePath,
        name: path.basename(remotePath),
        force_parent: true,
        _sid: this.sessionId
      });

      return response.success;
    } catch (error) {
      console.warn('[SynologyAPI] Ordner erstellen Fehler:', error.message);
      return false;
    }
  }

  /**
   * HTTP Request Helper
   */
  async makeRequest(method, url, params, files = null) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      
      if (method === 'GET' && params) {
        Object.keys(params).forEach(key => {
          urlObj.searchParams.append(key, params[key]);
        });
      }

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'User-Agent': 'GartenMeister/1.0.0',
          'Accept': 'application/json'
        },
        // SSL-Zertifikat-Validierung deaktivieren für Self-Signed Certs
        rejectUnauthorized: false
      };

      const request = (urlObj.protocol === 'https:' ? https : http).request(options, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            resolve({ success: false, error: 'Invalid JSON response' });
          }
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      if (method === 'POST' && params) {
        const postData = new URLSearchParams(params).toString();
        request.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        request.setHeader('Content-Length', Buffer.byteLength(postData));
        request.write(postData);
      }

      request.end();
    });
  }

  /**
   * Verbindung trennen
   */
  async disconnect() {
    try {
      if (this.isConnected && this.sessionId) {
        await this.makeRequest('GET', `${this.baseUrl}/webapi/auth.cgi`, {
          api: 'SYNO.API.Auth',
          version: 7,
          method: 'logout',
          session: 'GartenMeister',
          _sid: this.sessionId
        });
      }
      
      this.sessionId = null;
      this.isConnected = false;
      console.log('[SynologyAPI] Verbindung getrennt');
    } catch (error) {
      console.error('[SynologyAPI] Disconnect Fehler:', error.message);
    }
  }
}

/**
 * Remote NAS Storage Manager
 */
class RemoteNASStorage {
  constructor() {
    this.client = new SynologyAPIClient();
    this.isConnected = false;
  }

  /**
   * Verbindung herstellen
   */
  async connect(username, password) {
    try {
      // 1. Versuche QuickConnect
      let connected = await this.client.connectViaQuickConnect();
      
      // 2. Fallback auf lokales Netzwerk
      if (!connected) {
        connected = await this.client.connectViaLocal();
      }

      if (!connected) {
        throw new Error('Keine Verbindung zum NAS möglich');
      }

      // 3. Authentifizierung
      const authenticated = await this.client.authenticate(username, password);
      if (!authenticated) {
        throw new Error('Authentifizierung fehlgeschlagen');
      }

      this.isConnected = true;
      console.log('[RemoteNAS] Erfolgreich verbunden');
      return true;
    } catch (error) {
      console.error('[RemoteNAS] Verbindung fehlgeschlagen:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * App-Daten laden
   */
  async loadAppData() {
    try {
      if (!this.isConnected) {
        throw new Error('Nicht verbunden');
      }

      const data = await this.client.downloadFile(SYNOLOGY_CONFIG.paths.appData);
      if (data) {
        console.log('[RemoteNAS] App-Daten geladen');
        return JSON.parse(data);
      }
      
      return null;
    } catch (error) {
      console.error('[RemoteNAS] Fehler beim Laden der App-Daten:', error.message);
      return null;
    }
  }

  /**
   * App-Daten speichern
   */
  async saveAppData(data) {
    try {
      if (!this.isConnected) {
        throw new Error('Nicht verbunden');
      }

      const jsonData = JSON.stringify(data, null, 2);
      const success = await this.client.uploadFile(
        null, 
        SYNOLOGY_CONFIG.paths.appData, 
        jsonData
      );

      if (success) {
        console.log('[RemoteNAS] App-Daten gespeichert');
        
        // Backup erstellen
        const backupPath = `/data/backups/app-data-backup-${Date.now()}.json`;
        await this.client.uploadFile(null, backupPath, jsonData);
      }

      return success;
    } catch (error) {
      console.error('[RemoteNAS] Fehler beim Speichern der App-Daten:', error.message);
      return false;
    }
  }

  /**
   * Status prüfen
   */
  async getStatus() {
    return {
      connected: this.isConnected,
      method: this.client.baseUrl ? (this.client.baseUrl.includes('quickconnect') ? 'QuickConnect' : 'Local') : 'None',
      server: this.client.baseUrl,
      sessionActive: !!this.client.sessionId,
      lastCheck: new Date().toISOString()
    };
  }

  /**
   * Verbindung trennen
   */
  async disconnect() {
    await this.client.disconnect();
    this.isConnected = false;
  }
}

module.exports = {
  SynologyAPIClient,
  RemoteNASStorage,
  SYNOLOGY_CONFIG
};
