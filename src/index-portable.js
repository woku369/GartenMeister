/**
 * Portable EXE Version - Mit Next.js Static Export
 * Einfache, funktionierende Version ohne komplexe HTTP-Server
 */

const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('node:path');
const fs = require('fs');
const fse = require('fs-extra');
const http = require('http');

// UserManager importieren mit absolutem Pfad
const UserManager = require(path.join(__dirname, 'utils', 'user-manager'));

// UserManager-Instanz
let userManagerInstance = null;

// getUserManager Funktion
function getUserManager() {
  if (!userManagerInstance) {
    userManagerInstance = new UserManager();
  }
  return userManagerInstance;
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// ========================================
// LOKALER HTTP SERVER FÜR ASSETS
// ========================================

let httpServer;
const PORT = 3456; // Fester Port für den lokalen Server

function createHttpServer() {
  const staticDir = path.join(__dirname, '../out');

  // Config-Manager für NAS-Status-Route
  const configManager = require('./utils/config-manager');

  httpServer = http.createServer(async (req, res) => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Parse URL um Query-Parameter zu entfernen
    const url = new URL(req.url, `http://localhost:${PORT}`);

    // ── /api/nas-status ───────────────────────────────────────────
    if (url.pathname === '/api/nas-status') {
      try {
        // Immer frisch aus app-config.json lesen (Single Source of Truth für NAS-Einstellungen)
        let nasEnabled = false;
        let nasUrl = '';
        const appConfigPath = path.join(app.getPath('userData'), 'app-config.json');
        try {
          if (fs.existsSync(appConfigPath)) {
            const appCfg = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));
            nasUrl = (appCfg?.nasSettings?.url ?? '').replace(/\/$/, '');
            // enabled: wenn URL vorhanden und enabled nicht explizit false → gilt als aktiv
            nasEnabled = appCfg?.nasSettings?.enabled ?? (nasUrl.length > 0);
          }
        } catch (e) {
          console.warn('[nas-status] app-config.json lesen fehlgeschlagen, fallback auf configManager');
          const cfg = configManager.getConfig();
          nasEnabled = cfg?.nasSettings?.enabled ?? false;
          nasUrl = (cfg?.nasSettings?.url ?? '').replace(/\/$/, '');
        }

        if (req.method === 'OPTIONS') {
          res.writeHead(200, corsHeaders); res.end(); return;
        }

        if (!nasEnabled || !nasUrl) {
          const ts = new Date().toISOString();
          const failData = { available: false, connected: false, hasData: false, error: 'NAS nicht konfiguriert', overallSuccess: false, message: 'NAS nicht konfiguriert' };
          res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
          if (req.method === 'POST') {
            res.end(JSON.stringify({ success: true, data: { ...failData, testResult: { timestamp: ts, tests: { driveExists: { success: false, message: 'NAS nicht konfiguriert' }, writeTest: { success: false, message: 'NAS nicht konfiguriert' }, directoryStructure: { success: false, directories: {} } } } } }));
          } else {
            res.end(JSON.stringify({ success: true, data: failData }));
          }
          return;
        }

        // Proxy zu NAS /api/health
        const http2 = require('http');
        const isPost = req.method === 'POST';
        const healthUrl = new URL(`${nasUrl}/api/health`);
        const proxyReq = http2.get(healthUrl, { timeout: 5000 }, (proxyRes) => {
          let body = '';
          proxyRes.on('data', chunk => body += chunk);
          proxyRes.on('end', () => {
            try {
              const health = JSON.parse(body);
              const ts = new Date().toISOString();
              const statusData = {
                available: true,
                connected: health.status === 'online',
                hasData: true,
                uptime: health.uptimeFormatted,
                memory: health.memory,
                version: health.version,
                basePath: health.basePath,
                timestamp: ts,
              };
              if (isPost) {
                res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
                res.end(JSON.stringify({
                  success: true,
                  data: {
                    ...statusData,
                    testResult: {
                      timestamp: ts,
                      tests: {
                        driveExists: { success: true, message: 'NAS erreichbar' },
                        writeTest: { success: true, message: 'Health-Endpunkt antwortet' },
                        directoryStructure: { success: true, directories: {} },
                      },
                    },
                    overallSuccess: true,
                    message: `NAS online – ${health.uptimeFormatted} Uptime`,
                  }
                }));
              } else {
                res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
                res.end(JSON.stringify({ success: true, data: statusData }));
              }
            } catch {
              res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
              res.end(JSON.stringify({ success: false, error: 'Ungültige NAS-Antwort' }));
            }
          });
        });
        proxyReq.on('error', (err) => {
          const failData = { available: false, connected: false, hasData: false, error: err.message };
          res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
          if (req.method === 'POST') {
            res.end(JSON.stringify({ success: true, data: { ...failData, testResult: { timestamp: new Date().toISOString(), tests: { driveExists: { success: false, message: err.message }, writeTest: { success: false, message: 'Nicht erreichbar' }, directoryStructure: { success: false, directories: {} } } }, overallSuccess: false, message: err.message } }));
          } else {
            res.end(JSON.stringify({ success: true, data: failData }));
          }
        });
        proxyReq.on('timeout', () => {
          proxyReq.destroy();
          const failData = { available: false, connected: false, hasData: false, error: 'Timeout' };
          res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
          if (req.method === 'POST') {
            res.end(JSON.stringify({ success: true, data: { ...failData, testResult: { timestamp: new Date().toISOString(), tests: { driveExists: { success: false, message: 'Timeout' }, writeTest: { success: false, message: 'Timeout' }, directoryStructure: { success: false, directories: {} } } }, overallSuccess: false, message: 'Verbindungs-Timeout' } }));
          } else {
            res.end(JSON.stringify({ success: true, data: failData }));
          }
        });
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    // ── /api/nas-sync ─────────────────────────────────────────────
    if (url.pathname === '/api/nas-sync') {
      try {
        const cfg2 = configManager.getConfig();
        const syncConfig = cfg2?.nasSync ?? {
          autoSync: false,
          syncInterval: 60,
          conflictResolution: 'local-wins',
          retryAttempts: 3,
          retryDelay: 5,
          enableCompression: false,
          enableEncryption: false,
          maxBackups: 10,
          backupRetentionDays: 30,
          paths: { dataPath: 'database', backupPath: 'backups', logsPath: 'logs', syncPath: 'sync' },
          features: { imageSync: true, weatherSync: false, automaticMigration: false, offlineMode: true, realTimeSync: false },
          monitoring: { enableLogging: true, logLevel: 'info', enableMetrics: false, enableAlerts: false },
        };
        if (req.method === 'OPTIONS') { res.writeHead(200, corsHeaders); res.end(); return; }
        if (req.method === 'POST') {
          let body = '';
          req.on('data', c => body += c);
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              if (parsed.action === 'update-config' && parsed.config) {
                const current = configManager.getConfig();
                configManager.saveConfig({ ...current, nasSync: parsed.config });
              }
              res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
              res.end(JSON.stringify({ success: true }));
            } catch (e) {
              res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
              res.end(JSON.stringify({ success: false, error: e.message }));
            }
          });
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({
          success: true,
          data: {
            config: syncConfig,
            stats: { lastSync: null, pendingChanges: 0, totalSynced: 0 }
          }
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    // ── /api/remote-nas-config ────────────────────────────────────
    if (url.pathname === '/api/remote-nas-config') {
      const appConfigPath = path.join(app.getPath('userData'), 'app-config.json');
      if (req.method === 'OPTIONS') { res.writeHead(200, corsHeaders); res.end(); return; }
      if (req.method === 'GET') {
        try {
          let remoteNasConfig = null;
          if (fs.existsSync(appConfigPath)) {
            const raw = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));
            remoteNasConfig = raw?.remoteNasConfig ?? null;
          }
          const defaults = {
            local: { enabled: true, host: 'DS124-RockingK', ip: '192.168.0.25', path: 'G:\\gartenmeister', share: '\\\\DS124-RockingK\\Gurktaler' },
            remote: { enabled: false, quickconnectId: 'diwkaon', quickconnectUrl: 'https://quickconnect.to/diwkaon', username: '', password: '', sharePath: '/Gurktaler/gartenmeister', sessionId: null, lastConnected: null }
          };
          res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify(remoteNasConfig ?? defaults));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }
      if (req.method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
          try {
            const newRemoteCfg = JSON.parse(body);
            let existing = {};
            if (fs.existsSync(appConfigPath)) {
              try { existing = JSON.parse(fs.readFileSync(appConfigPath, 'utf8')); } catch {}
            }
            fs.writeFileSync(appConfigPath, JSON.stringify({ ...existing, remoteNasConfig: newRemoteCfg }, null, 2), 'utf8');
            res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
        return;
      }
    }

    // ── /api/remote-nas-test ──────────────────────────────────────
    if (url.pathname === '/api/remote-nas-test' && req.method === 'POST') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', async () => {
        try {
          const cfg = JSON.parse(body);
          const nasSettings = (() => {
            try {
              const appConfigPath2 = path.join(app.getPath('userData'), 'app-config.json');
              if (fs.existsSync(appConfigPath2)) {
                const raw = JSON.parse(fs.readFileSync(appConfigPath2, 'utf8'));
                return raw?.nasSettings ?? null;
              }
            } catch {}
            return null;
          })();

          // Versuche Tailscale-NAS zuerst, dann lokale IP
          const tailscaleUrl = nasSettings?.url?.replace(/\/$/, '') ?? '';
          const localIp = cfg?.local?.ip ?? '192.168.0.25';
          const localUrl = `http://${localIp}:3003`;

          const tryHealth = (url) => new Promise((resolve) => {
            const req2 = require('http').get(`${url}/api/health`, { timeout: 4000 }, (r) => {
              let d = ''; r.on('data', c => d += c);
              r.on('end', () => { try { resolve({ ok: true, data: JSON.parse(d) }); } catch { resolve({ ok: false }); } });
            });
            req2.on('error', () => resolve({ ok: false }));
            req2.on('timeout', () => { req2.destroy(); resolve({ ok: false }); });
          });

          const [tailRes, localRes] = await Promise.all([
            tailscaleUrl ? tryHealth(tailscaleUrl) : Promise.resolve({ ok: false }),
            tryHealth(localUrl),
          ]);

          const activeConnection = tailRes.ok ? 'remote' : (localRes.ok ? 'local' : null);
          res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({
            local: localRes.ok,
            remote: tailRes.ok,
            activeConnection,
            error: activeConnection ? null : 'Keine NAS-Verbindung möglich',
          }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ local: false, remote: false, activeConnection: null, error: err.message }));
        }
      });
      return;
    }

    let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
    
    // URL-Dekodierung für korrekte Pfad-Behandlung
    try {
      filePath = decodeURIComponent(filePath);
    } catch (e) {
      console.log(`[HTTP] URL-Dekodierung fehlgeschlagen: ${filePath}`);
    }
    
    // Spezielle Behandlung für Dynamic Route Patterns
    if (filePath.includes('%5Bid%5D')) {
      filePath = filePath.replace(/%5Bid%5D/g, '[id]');
      console.log(`[HTTP] Dynamic Route korrigiert: ${req.url} → ${filePath}`);
    }
    
    // Automatische Pfad-Korrektur für doppelte _next Verzeichnisse
    if (filePath.includes('_next/_next/')) {
      filePath = filePath.replace(/_next\/_next\//g, '_next/');
      console.log(`[HTTP] Pfad korrigiert: ${req.url} → ${filePath}`);
    }
    
    // Entferne Seiten-Präfixe vor _next Assets (für alle Verschachtelungsebenen)
    if (filePath.match(/\/_next\//)) {
      const pathParts = filePath.split('/');
      const nextIndex = pathParts.findIndex(part => part === '_next');
      if (nextIndex > 1) {
        // Entferne alle Pfad-Segmente vor _next
        filePath = '/' + pathParts.slice(nextIndex).join('/');
        console.log(`[HTTP] Multi-Level-Präfix entfernt: ${req.url} → ${filePath}`);
      }
    }
    
    // Spezielle Behandlung für Font-Dateien mit falschen Pfaden
    if (filePath.includes('/_next/static/css/_next/static/media/')) {
      filePath = filePath.replace('/_next/static/css/_next/static/media/', '/_next/static/media/');
      console.log(`[HTTP] Font-Pfad korrigiert: ${req.url} → ${filePath}`);
    }
    
    const fullPath = path.join(staticDir, filePath);
    
    // MIME-Type bestimmen
    const extname = path.extname(fullPath);
    let contentType = 'text/html';
    
    switch (extname) {
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
        contentType = 'image/jpg';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
      case '.ttf':
        contentType = 'font/ttf';
        break;
      case '.woff':
        contentType = 'font/woff';
        break;
      case '.woff2':
        contentType = 'font/woff2';
        break;
    }
    
    // Datei lesen und senden
    fs.readFile(fullPath, (err, content) => {
      if (err) {
        console.log(`[HTTP] Datei nicht gefunden: ${fullPath}`);
        res.writeHead(404, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end('Not Found');
        return;
      }
      
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end(content);
    });
  });

  return new Promise((resolve, reject) => {
    httpServer.listen(PORT, 'localhost', () => {
      console.log(`📡 Lokaler HTTP-Server läuft auf http://localhost:${PORT}`);
      resolve(`http://localhost:${PORT}`);
    });
    httpServer.on('error', reject);
  });
}

// ========================================
// IPC HANDLERS FÜR DATENPERSISTENZ
// ========================================

// Datei-Pfad Generierung
// Weather API Handler - Erweitert mit Konfigurations-Support
ipcMain.handle('weather:fetch', async (event, city = 'Gurk,AT') => {
  try {
    // Lade Wetter-Konfiguration
    const userDataPath = app.getPath('userData');
    const weatherConfigPath = path.join(userDataPath, 'weather-config.json');
    let weatherConfig = {
      activeProvider: 'openweathermap',
      providers: {
        openweathermap: {
          apiKey: '7c24de0c0b5a6d85a0f84c01eeff96ba',
          enabled: true
        },
        meteoblue: {
          apiKey: '',
          enabled: false
        },
        customStation: {
          endpoint: '',
          apiKey: '',
          enabled: false
        }
      }
    };
    
    // Lade gespeicherte Konfiguration falls verfügbar
    if (fs.existsSync(weatherConfigPath)) {
      try {
        const savedConfig = JSON.parse(fs.readFileSync(weatherConfigPath, 'utf8'));
        weatherConfig = { ...weatherConfig, ...savedConfig };
      } catch (error) {
        console.warn('[IPC] Fehler beim Laden der Wetter-Konfiguration:', error);
      }
    }
    
    console.log('[IPC] Lade Wetterdaten für:', city, 'mit Provider:', weatherConfig.activeProvider);
    
    // Versuche verschiedene Provider in Reihenfolge
    const providers = ['openweathermap', 'meteoblue', 'customStation'];
    let data = null;
    let usedProvider = null;
    
    for (const provider of providers) {
      const providerConfig = weatherConfig.providers[provider];
      if (!providerConfig || !providerConfig.enabled) continue;
      
      try {
        console.log(`[IPC] Versuche Provider: ${provider}`);
        
        if (provider === 'openweathermap') {
          const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${providerConfig.apiKey}&units=metric&lang=de`;
          const response = await fetch(url);
          if (response.ok) {
            data = await response.json();
            usedProvider = 'openweathermap';
            break;
          }
        } else if (provider === 'meteoblue') {
          // Meteoblue API-Integration
          const url = `https://my.meteoblue.com/packages/basic-1h?apikey=${providerConfig.apiKey}&lat=46.7&lon=14.0&format=json`;
          const response = await fetch(url);
          if (response.ok) {
            const meteoblueData = await response.json();
            // Konvertiere Meteoblue-Format zu OpenWeatherMap-Format
            data = {
              name: city.split(',')[0],
              main: {
                temp: meteoblueData.data_1h?.temperature?.[0] || 18,
                feels_like: meteoblueData.data_1h?.felttemperature?.[0] || 18,
                temp_min: Math.min(...(meteoblueData.data_1h?.temperature || [18])),
                temp_max: Math.max(...(meteoblueData.data_1h?.temperature || [18])),
                humidity: meteoblueData.data_1h?.relativehumidity?.[0] || 60
              },
              weather: [{
                main: meteoblueData.data_1h?.pictocode?.[0] > 2 ? "Clouds" : "Clear",
                description: "Meteoblue-Daten"
              }],
              wind: {
                speed: meteoblueData.data_1h?.windspeed?.[0] || 2
              }
            };
            usedProvider = 'meteoblue';
            break;
          }
        } else if (provider === 'customStation') {
          // Eigene Wetterstation
          const response = await fetch(providerConfig.endpoint, {
            headers: providerConfig.apiKey ? { 'Authorization': `Bearer ${providerConfig.apiKey}` } : {}
          });
          if (response.ok) {
            data = await response.json();
            usedProvider = 'customStation';
            break;
          }
        }
      } catch (error) {
        console.warn(`[IPC] Provider ${provider} fehlgeschlagen:`, error.message);
        continue;
      }
    }
    
    if (data) {
      console.log(`[IPC] ✅ Wetterdaten erfolgreich geladen mit Provider: ${usedProvider}`);
      return { success: true, data, isMock: false, provider: usedProvider };
    } else {
      // Fallback auf Mock-Daten
      console.log('[IPC] Alle Provider fehlgeschlagen, verwende Mock-Daten');
      const mockWeatherData = {
        name: city.split(',')[0],
        main: {
          temp: 18.5,
          feels_like: 19.2,
          temp_min: 15.3,
          temp_max: 22.1,
          humidity: 65
        },
        weather: [{
          main: "Clouds",
          description: "Demo-Daten (APIs nicht verfügbar)"
        }],
        wind: {
          speed: 2.3
        }
      };
      return { success: true, data: mockWeatherData, isMock: true };
    }
    
  } catch (error) {
    console.error('[IPC] Fehler beim Laden der Wetterdaten:', error);
    
    // Fallback auf Mock-Daten bei Netzwerkfehlern
    const mockWeatherData = {
      name: city.split(',')[0],
      main: {
        temp: 18.5,
        feels_like: 19.2,
        temp_min: 15.3,
        temp_max: 22.1,
        humidity: 65
      },
      weather: [
        {
          main: "Clouds",
          description: "leicht bewölkt (Offline-Modus)"
        }
      ],
      wind: {
        speed: 2.3
      }
    };
    return { success: true, data: mockWeatherData, isMock: true, error: error.message };
  }
});

// Weather Configuration Handlers
ipcMain.handle('weather:get-config', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const weatherConfigPath = path.join(userDataPath, 'weather-config.json');
    
    const defaultConfig = {
      activeProvider: 'openweathermap',
      providers: {
        openweathermap: {
          apiKey: '7c24de0c0b5a6d85a0f84c01eeff96ba',
          enabled: true
        },
        meteoblue: {
          apiKey: '',
          enabled: false
        },
        customStation: {
          endpoint: '',
          apiKey: '',
          enabled: false
        }
      }
    };
    
    if (fs.existsSync(weatherConfigPath)) {
      const savedConfig = JSON.parse(fs.readFileSync(weatherConfigPath, 'utf8'));
      return { ...defaultConfig, ...savedConfig };
    }
    
    return defaultConfig;
  } catch (error) {
    console.error('[IPC] Fehler beim Laden der Wetter-Konfiguration:', error);
    return null;
  }
});

ipcMain.handle('weather:save-config', async (event, config) => {
  try {
    const userDataPath = app.getPath('userData');
    const weatherConfigPath = path.join(userDataPath, 'weather-config.json');
    
    fs.writeFileSync(weatherConfigPath, JSON.stringify(config, null, 2));
    console.log('[IPC] Wetter-Konfiguration gespeichert');
    return { success: true };
  } catch (error) {
    console.error('[IPC] Fehler beim Speichern der Wetter-Konfiguration:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('weather:test-provider', async (event, provider, config) => {
  try {
    console.log(`[IPC] Teste Weather Provider: ${provider}`);
    
    if (provider === 'openweathermap') {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=Berlin&appid=${config.apiKey}&units=metric&lang=de`;
      const response = await fetch(url);
      if (response.ok) {
        return { success: true, message: 'OpenWeatherMap API funktioniert' };
      } else {
        return { success: false, message: 'OpenWeatherMap API-Fehler: ' + response.status };
      }
    } else if (provider === 'meteoblue') {
      const url = `https://my.meteoblue.com/packages/basic-1h?apikey=${config.apiKey}&lat=52.5&lon=13.4&format=json`;
      const response = await fetch(url);
      if (response.ok) {
        return { success: true, message: 'Meteoblue API funktioniert' };
      } else {
        return { success: false, message: 'Meteoblue API-Fehler: ' + response.status };
      }
    } else if (provider === 'customStation') {
      const response = await fetch(config.endpoint, {
        headers: config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}
      });
      if (response.ok) {
        return { success: true, message: 'Wetterstation erreichbar' };
      } else {
        return { success: false, message: 'Wetterstation nicht erreichbar: ' + response.status };
      }
    }
    
    return { success: false, message: 'Unbekannter Provider' };
  } catch (error) {
    console.error(`[IPC] Fehler beim Testen von Provider ${provider}:`, error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-data-file-path', (event, filename) => {
  try {
    const userDataPath = app.getPath('userData');
    const dataDir = path.join(userDataPath, 'data');
    
    // Stelle sicher, dass data/ Verzeichnis existiert
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const filePath = path.join(dataDir, filename);
    console.log(`[IPC] Datei-Pfad generiert: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`[IPC] Fehler beim Generieren des Dateipfads für ${filename}:`, error);
    throw error;
  }
});

// Datei-Existenz prüfen
ipcMain.handle('file-exists', (event, filePath) => {
  try {
    if (!filePath) return false;
    const exists = fs.existsSync(filePath);
    console.log(`[IPC] Datei-Existenz prüfen: ${filePath} -> ${exists}`);
    return exists;
  } catch (error) {
    console.error(`[IPC] Fehler beim Prüfen der Datei-Existenz von ${filePath}:`, error);
    return false;
  }
});

// Datei lesen
ipcMain.handle('read-file', (event, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      console.log(`[IPC] Datei nicht gefunden: ${filePath}`);
      return null;
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    console.log(`[IPC] Datei gelesen: ${filePath} (${data.length} Zeichen)`);
    return data;
  } catch (error) {
    console.error(`[IPC] Fehler beim Lesen der Datei ${filePath}:`, error);
    return null;
  }
});

// Datei schreiben
ipcMain.handle('write-file', (event, filePath, data) => {
  try {
    if (!filePath) {
      throw new Error('Kein Dateipfad angegeben');
    }
    
    // Stelle sicher, dass das Verzeichnis existiert
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, data, 'utf8');
    console.log(`[IPC] Datei geschrieben: ${filePath} (${data.length} Zeichen)`);
    return true;
  } catch (error) {
    console.error(`[IPC] Fehler beim Schreiben der Datei ${filePath}:`, error);
    throw error;
  }
});

// Benutzer-Daten Handler
ipcMain.handle('users:get-all', async () => {
  try {
    console.log('[IPC] users:get-all aufgerufen');
    const userManager = getUserManager();
    return userManager.getUsers();
  } catch (error) {
    console.error('[IPC] Fehler bei users:get-all:', error);
    return [];
  }
});

// JSON-Datei lesen (FEHLENDER HANDLER)
ipcMain.handle('read-json-file', (event, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      console.log(`[IPC] JSON-Datei nicht gefunden: ${filePath}`);
      return null;
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    console.log(`[IPC] JSON-Datei gelesen: ${filePath}`);
    return jsonData;
  } catch (error) {
    console.error(`[IPC] Fehler beim Lesen der JSON-Datei ${filePath}:`, error);
    return null;
  }
});

// Konfiguration abrufen (FEHLENDER HANDLER)
ipcMain.handle('get-config', () => {
  try {
    const configFilePath = path.join(app.getPath('userData'), 'app-config.json');
    const configManager = require('./utils/config-manager');

    // Grundkonfiguration
    let config = {
      isDev: false,
      isElectron: true,
      version: app.getVersion(),
      platform: process.platform,
      dataPath: app.getPath('userData'),
      appTheme: 'light',
      exportPath: '',
      settings: {
        theme: 'light',
        language: 'de',
        autoBackup: false,
        weatherProvider: 'openweathermap'
      }
    };

    // 1) app-config.json einlesen (Frontend-Einstellungen)
    if (fs.existsSync(configFilePath)) {
      try {
        const savedConfig = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
        config = { ...config, ...savedConfig };
      } catch (error) {
        console.warn('[IPC] app-config.json konnte nicht geladen werden:', error);
      }
    }

    // 2) configManager (config.json) hat nasSettings als Single Source of Truth
    //    Falls app-config.json eine URL hat, die config.json noch nicht kennt → jetzt synchronisieren
    const cmCfg = configManager.getConfig();
    if (config.nasSettings?.url && !cmCfg.nasSettings?.url) {
      configManager.saveConfig({ ...cmCfg, nasSettings: config.nasSettings });
      console.log('[IPC] get-config: nasSettings aus app-config.json → config.json synchronisiert');
    }
    // configManager-Wert gewinnt falls gesetzt (ist nach save-config immer aktuell)
    if (cmCfg.nasSettings?.url) {
      config.nasSettings = cmCfg.nasSettings;
    }

    console.log('[IPC] Konfiguration abgerufen, nasSettings:', config.nasSettings);
    return config;
  } catch (error) {
    console.error('[IPC] Fehler beim Abrufen der Konfiguration:', error);
    return {
      isDev: false,
      isElectron: true,
      version: '1.0.0',
      platform: process.platform,
      dataPath: app.getPath('userData'),
      appTheme: 'light',
      exportPath: '',
      settings: {}
    };
  }
});

// Konfiguration speichern
ipcMain.handle('save-config', async (event, configData) => {
  try {
    console.log('[IPC] save-config aufgerufen mit:', configData);
    const configFilePath = path.join(app.getPath('userData'), 'app-config.json');
    
    // Lade bestehende Konfiguration oder erstelle neue
    let currentConfig = {};
    if (fs.existsSync(configFilePath)) {
      try {
        currentConfig = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
      } catch (error) {
        console.warn('[IPC] Bestehende Konfiguration konnte nicht geladen werden:', error);
      }
    }
    
    // Merge mit neuen Daten
    const updatedConfig = {
      ...currentConfig,
      ...configData,
      lastModified: new Date().toISOString()
    };
    
    // Speichere die Konfiguration
    fs.writeFileSync(configFilePath, JSON.stringify(updatedConfig, null, 2));
    // Auch configManager aktualisieren, damit /api/nas-status die neuen NAS-Einstellungen liest
    const configManager = require('./utils/config-manager');
    configManager.saveConfig(updatedConfig);
    console.log('[IPC] Konfiguration gespeichert:', updatedConfig);
    return true;
  } catch (error) {
    console.error('[IPC] Fehler beim Speichern der Konfiguration:', error);
    return false;
  }
});

// Ordner auswählen
ipcMain.handle('select-directory', async () => {
  try {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Ordner für Exporte auswählen'
    });
    
    if (result.canceled) {
      return null;
    }
    
    return result.filePaths[0];
  } catch (error) {
    console.error('[IPC] Fehler beim Ordner-Dialog:', error);
    return null;
  }
});

// Garten-Konfiguration abrufen
ipcMain.handle('garten-config:get', async () => {
  try {
    console.log('[IPC] garten-config:get aufgerufen');
    const dataFilePath = path.join(app.getPath('userData'), 'data', 'app-data.json');
    
    if (fs.existsSync(dataFilePath)) {
      const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
      const gartenConfig = data.gartenConfiguration || {
        currentBeetCount: 20,
        maxBeetCount: 50,
        activeBeetIds: Array.from({length: 20}, (_, i) => `bed-${i + 1}`),
        inactiveBeetIds: [],
        gartenName: "Hauptgarten",
        lastModified: new Date().toISOString()
      };
      console.log('[IPC] Garten-Konfiguration aus app-data.json geladen:', gartenConfig);
      return gartenConfig;
    } else {
      // Standard-Konfiguration für neue Installation
      const defaultConfig = {
        currentBeetCount: 20,
        maxBeetCount: 50,
        activeBeetIds: Array.from({length: 20}, (_, i) => `bed-${i + 1}`),
        inactiveBeetIds: [],
        gartenName: "Hauptgarten",
        lastModified: new Date().toISOString()
      };
      console.log('[IPC] Standard-Garten-Konfiguration erstellt:', defaultConfig);
      return defaultConfig;
    }
  } catch (error) {
    console.error('[IPC] Fehler beim Laden der Garten-Konfiguration:', error);
    return {
      currentBeetCount: 20,
      maxBeetCount: 50,
      activeBeetIds: [],
      inactiveBeetIds: [],
      gartenName: "Hauptgarten",
      lastModified: new Date().toISOString()
    };
  }
});

// Garten-Konfiguration aktualisieren
ipcMain.handle('garten-config:update', async (event, updates) => {
  try {
    console.log('[IPC] garten-config:update aufgerufen mit:', updates);
    const dataFilePath = path.join(app.getPath('userData'), 'data', 'app-data.json');
    
    // Lade die bestehende app-data.json
    let appData = {};
    if (fs.existsSync(dataFilePath)) {
      appData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    }
    
    // Stelle sicher, dass die gartenConfiguration existiert
    if (!appData.gartenConfiguration) {
      appData.gartenConfiguration = {
        currentBeetCount: 20,
        maxBeetCount: 50,
        activeBeetIds: Array.from({length: 20}, (_, i) => `bed-${i + 1}`),
        inactiveBeetIds: [],
        gartenName: "Hauptgarten",
        lastModified: new Date().toISOString()
      };
    }
    
    // Aktualisiere die Garten-Konfiguration
    const oldBeetCount = appData.gartenConfiguration.currentBeetCount;
    appData.gartenConfiguration = {
      ...appData.gartenConfiguration,
      ...updates,
      lastModified: new Date().toISOString()
    };
    
    // Bei Änderung der Beet-Anzahl: Aktualisiere auch die Beet-IDs
    if (updates.currentBeetCount && updates.currentBeetCount !== oldBeetCount) {
      const newBeetCount = updates.currentBeetCount;
      appData.gartenConfiguration.activeBeetIds = Array.from({length: newBeetCount}, (_, i) => `bed-${i + 1}`);
      console.log('[IPC] Beet-Anzahl geändert von', oldBeetCount, 'auf', newBeetCount);
      console.log('[IPC] Neue activeBeetIds:', appData.gartenConfiguration.activeBeetIds);
    }
    
    // Speichere die aktualisierte app-data.json
    const dataDir = path.dirname(dataFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(dataFilePath, JSON.stringify(appData, null, 2));
    console.log('[IPC] Garten-Konfiguration in app-data.json gespeichert:', appData.gartenConfiguration);
    return true;
  } catch (error) {
    console.error('[IPC] Fehler beim Aktualisieren der Garten-Konfiguration:', error);
    return false;
  }
});

// JSON-Datei schreiben
ipcMain.handle('write-json-file', (event, filePath, data) => {
  try {
    if (!filePath) {
      throw new Error('Kein Dateipfad angegeben');
    }
    
    // Stelle sicher, dass das Verzeichnis existiert
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonString, 'utf8');
    console.log(`[IPC] JSON-Datei geschrieben: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`[IPC] Fehler beim Schreiben der JSON-Datei ${filePath}:`, error);
    throw error;
  }
});

// Aktueller Benutzer (FEHLENDER HANDLER)
ipcMain.handle('users:get-current', async () => {
  try {
    console.log('[IPC] users:get-current aufgerufen');
    const userManager = getUserManager();
    return userManager.getCurrentUser();
  } catch (error) {
    console.error('[IPC] Fehler bei users:get-current:', error);
    throw error;
  }
});

// Users: Benutzer hinzufügen
ipcMain.handle('users:add', async (event, userData) => {
  try {
    console.log('[IPC] users:add aufgerufen mit:', userData);
    const userManager = getUserManager();
    return userManager.addUser(userData);
  } catch (error) {
    console.error('[IPC] Fehler bei users:add:', error);
    throw error;
  }
});

// Users: Benutzer aktualisieren
ipcMain.handle('users:update', async (event, userId, updates) => {
  try {
    console.log('[IPC] users:update aufgerufen für:', userId, updates);
    const userManager = getUserManager();
    return userManager.updateUser(userId, updates);
  } catch (error) {
    console.error('[IPC] Fehler bei users:update:', error);
    throw error;
  }
});

// Users: Benutzer löschen
ipcMain.handle('users:delete', async (event, userId) => {
  try {
    console.log('[IPC] users:delete aufgerufen für:', userId);
    const userManager = getUserManager();
    return userManager.deleteUser(userId);
  } catch (error) {
    console.error('[IPC] Fehler bei users:delete:', error);
    throw error;
  }
});

// Users: Aktuellen Benutzer setzen
ipcMain.handle('users:setCurrent', async (event, userId) => {
  try {
    console.log('[IPC] users:setCurrent aufgerufen für:', userId);
    const userManager = getUserManager();
    return userManager.setCurrentUser(userId);
  } catch (error) {
    console.error('[IPC] Fehler bei users:setCurrent:', error);
    throw error;
  }
});

// PDF-Export Handler
ipcMain.handle('export-pdf', async (event, data) => {
  try {
    console.log('[IPC] export-pdf aufgerufen mit Daten:', JSON.stringify(data, null, 2));
    
    // Debug: Prüfe den Datentyp
    console.log('[IPC] PDF-Export Typ:', data.type);
    console.log('[IPC] Data keys:', Object.keys(data));
    
    // Robustes PDF-Modul-Loading mit mehreren Fallback-Strategien
    let SimplePdfGenerator = null;
    
    try {
      // Strategie 1: Relativer Pfad
      SimplePdfGenerator = require('./simple-pdf-generator-improved').SimplePdfGenerator;
      console.log('[IPC] PDF-Modul geladen: Relativer Pfad');
    } catch (error1) {
      console.log('[IPC] Relativer Pfad fehlgeschlagen:', error1.message);
      
      try {
        // Strategie 2: ASAR-Unpack Pfad (vorrangig für portable Apps)
        const asarUnpackPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'src', 'simple-pdf-generator-improved.js');
        console.log('[IPC] PDF-Modul-Pfad (ASAR-unpack):', asarUnpackPath);
        SimplePdfGenerator = require(asarUnpackPath).SimplePdfGenerator;
        console.log('[IPC] PDF-Modul geladen: ASAR-unpack Pfad');
      } catch (error2) {
        console.log('[IPC] ASAR-unpack Pfad fehlgeschlagen:', error2.message);
        
        try {
          // Strategie 3: Absoluter Pfad mit __dirname
          const pdfModulePath = path.join(__dirname, 'simple-pdf-generator-improved.js');
          console.log('[IPC] PDF-Modul-Pfad (absolut):', pdfModulePath);
          SimplePdfGenerator = require(pdfModulePath).SimplePdfGenerator;
          console.log('[IPC] PDF-Modul geladen: Absoluter Pfad');
        } catch (error3) {
          console.log('[IPC] Absoluter Pfad fehlgeschlagen:', error3.message);
          
          // Strategie 4: Fallback zu einfachem PDF-Generator
          try {
            SimplePdfGenerator = require('./simple-pdf-generator-safe').SimplePdfGeneratorAlternative;
            console.log('[IPC] PDF-Modul geladen: Safe Fallback');
          } catch (error4) {
            console.log('[IPC] Alle PDF-Modul-Strategien fehlgeschlagen!');
            return {
              success: false,
              message: `PDF-Modul konnte nicht geladen werden. Fehler: ${error4.message}`
            };
          }
        }
      }
    }
    
    // Validiere die Eingabedaten
    const validationErrors = SimplePdfGenerator.validateData(data);
    if (validationErrors.length > 0) {
      console.log('[IPC] Validierungsfehler:', validationErrors);
      return {
        success: false,
        message: `Datenvalidierung fehlgeschlagen: ${validationErrors.join(', ')}`
      };
    }
    
    // Robuste Export-Verzeichnis-Erstellung für Portable Apps
    let exportPath;
    try {
      // Versuche zuerst App-lokales Verzeichnis (bevorzugt für portable Apps)
      const appDirectory = path.dirname(process.execPath);
      exportPath = path.join(appDirectory, 'export');
      
      console.log('[IPC] Versuche App-lokales Export-Verzeichnis:', exportPath);
      
      if (!fs.existsSync(exportPath)) {
        fs.mkdirSync(exportPath, { recursive: true });
      }
    } catch (error1) {
      console.log('[IPC] App-lokales Verzeichnis fehlgeschlagen:', error1.message);
      
      try {
        // Fallback 1: Dokumente-Ordner
        const { app } = require('electron');
        const documentsPath = app.getPath('documents');
        exportPath = path.join(documentsPath, 'GartenMeister', 'export');
        
        console.log('[IPC] Versuche Dokumente-Verzeichnis:', exportPath);
        
        if (!fs.existsSync(exportPath)) {
          fs.mkdirSync(exportPath, { recursive: true });
        }
      } catch (error2) {
        console.log('[IPC] Dokumente-Verzeichnis fehlgeschlagen:', error2.message);
        
        try {
          // Fallback 2: Temp-Verzeichnis
          const tempPath = require('os').tmpdir();
          exportPath = path.join(tempPath, 'GartenMeister-Export');
          
          console.log('[IPC] Versuche Temp-Verzeichnis:', exportPath);
          
          if (!fs.existsSync(exportPath)) {
            fs.mkdirSync(exportPath, { recursive: true });
          }
        } catch (error3) {
          console.log('[IPC] Alle Export-Verzeichnis-Strategien fehlgeschlagen!');
          return {
            success: false,
            message: `Export-Verzeichnis konnte nicht erstellt werden: ${error3.message}`
          };
        }
      }
    }
    
    // Erstelle eindeutigen Dateinamen
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const baseFileName = data.filename || (data.type === 'reports' ? 'gartenmeister-ernteberichte' : 'gartenmeister-document');
    const fileName = `${baseFileName}-${timestamp}.pdf`;
    const filePath = path.join(exportPath, fileName);
    
    console.log(`[IPC] Erstelle PDF: ${fileName} (Typ: ${data.type})`);
    
    // PDF generieren
    const result = await SimplePdfGenerator.generateGardenPdf(data, filePath);
    
    if (result.success) {
      console.log(`[IPC] PDF erfolgreich erstellt: ${filePath}`);
      return {
        success: true,
        message: 'PDF erfolgreich exportiert',
        filePath: filePath,
        fileName: fileName
      };
    } else {
      console.error('[IPC] PDF-Generierung fehlgeschlagen:', result.message);
      return result;
    }
  } catch (error) {
    console.error('[IPC] Fehler bei PDF-Export:', error);
    return { success: false, message: error.message };
  }
});

// PDF-Datei öffnen Handler
ipcMain.handle('open-pdf-file', async (event, filePath) => {
  try {
    console.log('[IPC] Öffne PDF-Datei:', filePath);
    
    const { shell } = require('electron');
    
    // Prüfe ob die Datei existiert
    if (!fs.existsSync(filePath)) {
      console.error('[IPC] PDF-Datei nicht gefunden:', filePath);
      return { 
        success: false, 
        message: `PDF-Datei nicht gefunden: ${filePath}` 
      };
    }
    
    // Öffne die PDF-Datei mit dem Standard-PDF-Viewer
    await shell.openPath(filePath);
    
    console.log('[IPC] PDF-Datei erfolgreich geöffnet');
    return { 
      success: true, 
      message: 'PDF-Datei erfolgreich geöffnet',
      filePath: filePath
    };
    
  } catch (error) {
    console.error('[IPC] Fehler beim Öffnen der PDF-Datei:', error);
    return { 
      success: false, 
      message: `Fehler beim Öffnen der PDF-Datei: ${error.message}` 
    };
  }
});

// Export-Ordner öffnen Handler
ipcMain.handle('open-export-folder', async () => {
  try {
    const { shell } = require('electron');
    const exportPath = path.join(__dirname, '..', 'export');
    
    // Stelle sicher, dass das Verzeichnis existiert
    if (!fs.existsSync(exportPath)) {
      fs.mkdirSync(exportPath, { recursive: true });
    }
    
    console.log(`[IPC] Öffne Export-Verzeichnis: ${exportPath}`);
    await shell.openPath(exportPath);
    
    return { success: true, path: exportPath };
  } catch (error) {
    console.error('[IPC] Fehler beim Öffnen des Export-Verzeichnisses:', error);
    return { success: false, message: error.message };
  }
});

// ── NAS-Bild-Hilfsfunktionen ──────────────────────────────────────────────────

function getNasUrl() {
  try {
    const appConfigPath = path.join(app.getPath('userData'), 'app-config.json');
    if (fs.existsSync(appConfigPath)) {
      const cfg = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));
      const url = (cfg?.nasSettings?.url ?? '').replace(/\/$/, '');
      if (url) return url;
    }
  } catch {}
  return null;
}

function nasEntryToGalleryImage(entry) {
  return {
    id: entry.id,
    originalName: entry.original_name || '',
    fileName: path.basename(entry.file_path || ''),
    filePath: entry.file_path || '',
    fileSize: entry.size_bytes || 0,
    mimeType: entry.mime_type || 'image/jpeg',
    uploadDate: entry.uploaded_at || new Date().toISOString(),
    takenDate: entry.uploaded_at || new Date().toISOString(),
    uploadedBy: entry.entity_id || '',
    title: entry.title || entry.original_name || '',
    description: entry.description || '',
    tags: entry.tags || [],
    bedId: entry.entity_type === 'bed' ? entry.entity_id : undefined,
    plantType: '',
    category: entry.entity_type || 'Allgemein',
    location: '',
    weather: '',
    isArchived: false,
    isFavorite: false,
    viewCount: 0,
    comments: [],
    ratings: [],
  };
}

function fetchNasCatalog(nasUrl, queryString) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${nasUrl}/api/images${queryString ? '?' + queryString : ''}`;
    const req = http.get(fullUrl, { timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch { resolve({ images: [] }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('NAS-Timeout')); });
  });
}

// Image-Handler für Gallery
ipcMain.handle('images:get-statistics', async () => {
  try {
    const nasUrl = getNasUrl();
    if (!nasUrl) return { total: 0, byType: { garden: 0, herbs: 0, harvest: 0 }, byMonth: {}, recentUploads: 0 };
    const response = await fetchNasCatalog(nasUrl);
    const images = response.images || [];
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    return {
      total: images.length,
      byType: images.reduce((acc, img) => { acc[img.entity_type || 'garden'] = (acc[img.entity_type || 'garden'] || 0) + 1; return acc; }, {}),
      byMonth: {},
      recentUploads: images.filter(i => (now - new Date(i.uploaded_at).getTime()) < week).length,
    };
  } catch (error) {
    console.error('[IPC] Fehler bei images:get-statistics:', error.message);
    return { total: 0, byType: {}, byMonth: {}, recentUploads: 0 };
  }
});

ipcMain.handle('images:get-all', async (event, options = {}) => {
  try {
    console.log('[IPC] images:get-all aufgerufen mit Optionen:', options);
    const nasUrl = getNasUrl();
    if (!nasUrl) { console.log('[IPC] images:get-all: kein NAS konfiguriert'); return []; }
    const params = new URLSearchParams();
    if (options.bedId) params.append('entityId', options.bedId);
    if (options.category && options.category !== 'all') params.append('entityType', options.category);
    const response = await fetchNasCatalog(nasUrl, params.toString());
    const images = (response.images || []).map(nasEntryToGalleryImage);
    console.log(`[IPC] images:get-all: ${images.length} Bilder vom NAS geladen`);
    return images;
  } catch (error) {
    console.error('[IPC] Fehler bei images:get-all:', error.message);
    return [];
  }
});

ipcMain.handle('images:get-by-id', async (event, imageId) => {
  try {
    const nasUrl = getNasUrl();
    if (!nasUrl) return null;
    const response = await fetchNasCatalog(nasUrl);
    const entry = (response.images || []).find(e => e.id === imageId);
    return entry ? nasEntryToGalleryImage(entry) : null;
  } catch (error) {
    console.error('[IPC] Fehler bei images:get-by-id:', error.message);
    return null;
  }
});

ipcMain.handle('images:get-file-url', async (event, imageId) => {
  try {
    const nasUrl = getNasUrl();
    if (!nasUrl) return null;
    return `${nasUrl}/api/image?id=${imageId}&thumb=1`;
  } catch (error) {
    console.error('[IPC] Fehler bei images:get-file-url:', error.message);
    return null;
  }
});

ipcMain.handle('images:update-metadata', async (event, imageId, updates) => {
  try {
    const nasUrl = getNasUrl();
    if (!nasUrl) return { success: false, error: 'Kein NAS konfiguriert' };
    const data = JSON.stringify(updates);
    const urlObj = new URL(`${nasUrl}/api/image?id=${imageId}`);
    const response = await new Promise((resolve, reject) => {
      const opts = {
        hostname: urlObj.hostname,
        port: parseInt(urlObj.port) || 80,
        path: urlObj.pathname + urlObj.search,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
        timeout: 5000,
      };
      const req = http.request(opts, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({ success: false }); } });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      req.write(data);
      req.end();
    });
    console.log(`[IPC] images:update-metadata ${imageId}:`, updates);
    return response;
  } catch (error) {
    console.error('[IPC] Fehler bei images:update-metadata:', error.message);
    return { success: false, error: error.message };
  }
});

// Ernte-System Handler
ipcMain.handle('beds:get-all', async () => {
  try {
    console.log('[IPC] beds:get-all aufgerufen');
    
    // Echte Daten aus JSON-Datei laden
    const userDataPath = app.getPath('userData');
    const dataDir = path.join(userDataPath, 'data');
    const dataFilePath = path.join(dataDir, 'app-data.json');
    
    if (!fs.existsSync(dataFilePath)) {
      console.warn('[IPC] Datei nicht gefunden für beds:get-all:', dataFilePath);
      return [];
    }
    
    const jsonData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    const beds = jsonData.beds || [];
    
    console.log('[IPC] Geladene Beete für beds:get-all:', beds.length);
    return beds;
  } catch (error) {
    console.error('[IPC] Fehler bei beds:get-all:', error);
    throw error;
  }
});

ipcMain.handle('herbs:get-all', async () => {
  try {
    console.log('[IPC] herbs:get-all aufgerufen');
    
    // Echte Daten aus JSON-Datei laden
    const userDataPath = app.getPath('userData');
    const dataDir = path.join(userDataPath, 'data');
    const dataFilePath = path.join(dataDir, 'app-data.json');
    
    if (!fs.existsSync(dataFilePath)) {
      console.warn('[IPC] Datei nicht gefunden für herbs:get-all:', dataFilePath);
      return [];
    }
    
    const jsonData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    const herbs = jsonData.herbVarieties || [];
    
    console.log('[IPC] Geladene Kräuter für herbs:get-all:', herbs.length);
    return herbs;
  } catch (error) {
    console.error('[IPC] Fehler bei herbs:get-all:', error);
    throw error;
  }
});

ipcMain.handle('herbs:create', async (event, herbData) => {
  try {
    console.log('[IPC] herbs:create aufgerufen mit Daten:', herbData);
    
    // Echte Daten aus JSON-Datei laden
    const userDataPath = app.getPath('userData');
    const dataDir = path.join(userDataPath, 'data');
    const dataFilePath = path.join(dataDir, 'app-data.json');
    
    if (!fs.existsSync(dataFilePath)) {
      console.warn('[IPC] Datei nicht gefunden für herbs:create:', dataFilePath);
      return { success: false, error: 'Datendatei nicht gefunden' };
    }
    
    const jsonData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    
    // Stelle sicher, dass herbVarieties existiert
    if (!jsonData.herbVarieties) {
      jsonData.herbVarieties = [];
    }
    
    // Prüfe ob Name bereits existiert
    const existingHerb = jsonData.herbVarieties.find(h => h.name.toLowerCase() === herbData.name.toLowerCase());
    if (existingHerb) {
      return { success: false, error: `Kräutersorte "${herbData.name}" existiert bereits` };
    }
    
    // Prüfe ob Farbe bereits verwendet wird
    if (herbData.color) {
      const existingHerbWithColor = jsonData.herbVarieties.find(h => h.color?.toLowerCase() === herbData.color.toLowerCase());
      if (existingHerbWithColor) {
        return { success: false, error: `Farbe "${herbData.color}" wird bereits von "${existingHerbWithColor.name}" verwendet` };
      }
    }
    
    // Neue ID generieren
    const nextId = (jsonData.nextHerbId || 100) + 1;
    jsonData.nextHerbId = nextId;
    
    // Neue Kräutersorte erstellen
    const newHerb = {
      id: `herb-${nextId}`,
      name: herbData.name,
      color: herbData.color || undefined,
      remarks: herbData.remarks || undefined,
      isFixed: false
    };
    
    // Zur Liste hinzufügen
    jsonData.herbVarieties.push(newHerb);
    
    // JSON-Datei speichern
    fs.writeFileSync(dataFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
    
    console.log('[IPC] Neue Kräutersorte erstellt:', newHerb);
    return { success: true, herb: newHerb };
  } catch (error) {
    console.error('[IPC] Fehler bei herbs:create:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('herbs:update', async (event, herbId, herbData) => {
  try {
    console.log('[IPC] herbs:update aufgerufen für ID:', herbId, 'mit Daten:', herbData);
    
    // Echte Daten aus JSON-Datei laden
    const userDataPath = app.getPath('userData');
    const dataDir = path.join(userDataPath, 'data');
    const dataFilePath = path.join(dataDir, 'app-data.json');
    
    if (!fs.existsSync(dataFilePath)) {
      console.warn('[IPC] Datei nicht gefunden für herbs:update:', dataFilePath);
      return { success: false, error: 'Datendatei nicht gefunden' };
    }
    
    const jsonData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    
    if (!jsonData.herbVarieties) {
      jsonData.herbVarieties = [];
      return { success: false, error: 'Kräutersorte nicht gefunden' };
    }
    
    // Finde die zu aktualisierende Kräutersorte
    const herbIndex = jsonData.herbVarieties.findIndex(h => h.id === herbId);
    if (herbIndex === -1) {
      return { success: false, error: 'Kräutersorte nicht gefunden' };
    }
    
    const existingHerb = jsonData.herbVarieties[herbIndex];
    
    // Prüfe ob Name bereits von einer anderen Sorte verwendet wird
    if (herbData.name && herbData.name !== existingHerb.name) {
      const nameExists = jsonData.herbVarieties.find(h => h.id !== herbId && h.name.toLowerCase() === herbData.name.toLowerCase());
      if (nameExists) {
        return { success: false, error: `Name "${herbData.name}" wird bereits verwendet` };
      }
    }
    
    // Verhindere Bearbeitung von festen Sorten (außer Bemerkungen)
    if (existingHerb.isFixed && (herbData.name || herbData.color)) {
      return { success: false, error: 'Feste Standardsorten können nur in den Bemerkungen bearbeitet werden' };
    }
    
    // Aktualisiere die Kräutersorte
    const updatedHerb = {
      ...existingHerb,
      name: herbData.name || existingHerb.name,
      color: herbData.color !== undefined ? herbData.color : existingHerb.color,
      remarks: herbData.remarks !== undefined ? herbData.remarks : existingHerb.remarks
    };
    
    jsonData.herbVarieties[herbIndex] = updatedHerb;
    
    // JSON-Datei speichern
    fs.writeFileSync(dataFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
    
    console.log('[IPC] Kräutersorte aktualisiert:', updatedHerb);
    return { success: true, herb: updatedHerb };
  } catch (error) {
    console.error('[IPC] Fehler bei herbs:update:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('herbs:delete', async (event, herbId) => {
  try {
    console.log('[IPC] herbs:delete aufgerufen für ID:', herbId);
    
    // Echte Daten aus JSON-Datei laden
    const userDataPath = app.getPath('userData');
    const dataDir = path.join(userDataPath, 'data');
    const dataFilePath = path.join(dataDir, 'app-data.json');
    
    if (!fs.existsSync(dataFilePath)) {
      console.warn('[IPC] Datei nicht gefunden für herbs:delete:', dataFilePath);
      return { success: false, error: 'Datendatei nicht gefunden' };
    }
    
    const jsonData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    
    if (!jsonData.herbVarieties) {
      jsonData.herbVarieties = [];
      return { success: false, error: 'Kräutersorte nicht gefunden' };
    }
    
    // Finde die zu löschende Kräutersorte
    const herbIndex = jsonData.herbVarieties.findIndex(h => h.id === herbId);
    if (herbIndex === -1) {
      return { success: false, error: 'Kräutersorte nicht gefunden' };
    }
    
    const herb = jsonData.herbVarieties[herbIndex];
    
    // Verhindere Löschen von festen Sorten
    if (herb.isFixed) {
      return { success: false, error: 'Feste Standardsorten können nicht gelöscht werden' };
    }
    
    // Prüfe ob die Sorte in Beeten verwendet wird
    const usedInBeds = jsonData.beds?.some(bed => bed.herbVarietyId === herbId) || false;
    const usedInSegments = jsonData.segments?.some(segment => segment.herbVarietyId === herbId) || false;
    
    if (usedInBeds || usedInSegments) {
      return { success: false, error: 'Kräutersorte wird noch in Beeten verwendet und kann nicht gelöscht werden' };
    }
    
    // Lösche die Kräutersorte
    jsonData.herbVarieties.splice(herbIndex, 1);
    
    // JSON-Datei speichern
    fs.writeFileSync(dataFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
    
    console.log('[IPC] Kräutersorte gelöscht:', herb.name);
    return { success: true, deletedHerb: herb };
  } catch (error) {
    console.error('[IPC] Fehler bei herbs:delete:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('beds:get-relevant-for-harvest', async (event, filters = {}) => {
  try {
    console.log('[IPC] beds:get-relevant-for-harvest aufgerufen mit Filtern:', filters);
    
    // Echte Daten aus JSON-Datei laden (gleiche Logik wie andere Handler)
    const userDataPath = app.getPath('userData');
    const dataDir = path.join(userDataPath, 'data');
    const dataFilePath = path.join(dataDir, 'app-data.json');
    
    if (!fs.existsSync(dataFilePath)) {
      console.warn('[IPC] Datei nicht gefunden:', dataFilePath);
      return [];
    }
    
    const jsonData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    const allBeds = jsonData.beds || [];
    const allSegments = jsonData.segments || [];
    
    console.log('[IPC] Geladene Beete:', allBeds.length);
    console.log('[IPC] Filter-Variety:', filters.variety);
    
    // Filtere nach herbVarietyId wenn angegeben
    if (filters.variety) {
      const relevantBeds = allBeds.filter(bed => {
        if (bed.type === 'Standard' && bed.herbVarietyId === filters.variety) {
          return true;
        } else if (bed.type === 'Kombinationsbeet') {
          // Prüfe Segmente für Kombinationsbeete
          const bedSegments = allSegments.filter(seg => seg.bedId === bed.id);
          return bedSegments.some(seg => seg.herbVarietyId === filters.variety);
        }
        return false;
      });
      
      // Füge segmentsRelevantToHarvest für Kombinationsbeete hinzu
      const bedsWithSegments = relevantBeds.map(bed => {
        if (bed.type === 'Kombinationsbeet') {
          const bedSegments = allSegments.filter(seg => seg.bedId === bed.id);
          const relevantSegments = bedSegments.filter(seg => seg.herbVarietyId === filters.variety);
          
          return {
            ...bed,
            segmentsRelevantToHarvest: relevantSegments
          };
        }
        return bed;
      });
      
      console.log('[IPC] Gefilterte relevante Beete:', bedsWithSegments.length);
      console.log('[IPC] Beet-Details mit Produktivität:', bedsWithSegments.map(b => ({
        id: b.id,
        type: b.type,
        productivePlantsPercentage: b.productivePlantsPercentage,
        segments: b.segmentsRelevantToHarvest?.map(s => ({
          id: s.id,
          productivePlantsPercentage: s.productivePlantsPercentage
        }))
      })));
      
      return bedsWithSegments;
    }
    
    console.log('[IPC] Alle Beete zurückgegeben:', allBeds.length);
    return allBeds;
  } catch (error) {
    console.error('[IPC] Fehler bei beds:get-relevant-for-harvest:', error);
    throw error;
  }
});

ipcMain.handle('harvests:create', async (event, harvestData) => {
  try {
    console.log('[IPC] harvests:create aufgerufen mit Daten:', harvestData);
    
    // Echte Daten aus JSON-Datei laden
    const userDataPath = app.getPath('userData');
    const dataDir = path.join(userDataPath, 'data');
    const dataFilePath = path.join(dataDir, 'app-data.json');
    
    if (!fs.existsSync(dataFilePath)) {
      console.warn('[IPC] Datei nicht gefunden:', dataFilePath);
      return { success: false, error: 'Datei nicht gefunden' };
    }
    
    const jsonData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    
    // Neue Ernte erstellen
    const newHarvest = {
      id: `harvest-${Date.now()}`,
      ...harvestData,
      createdAt: new Date().toISOString(),
      status: 'completed',
      isFinalized: true,
      totalWeight: harvestData.totalWeight || 0
    };

    // Ernten zur JSON-Datei hinzufügen
    if (!jsonData.harvestEvents) {
      jsonData.harvestEvents = [];
    }
    jsonData.harvestEvents.push(newHarvest);

    // Contributions hinzufügen, falls vorhanden
    if (harvestData.contributions && Array.isArray(harvestData.contributions)) {
      if (!jsonData.harvestContributions) {
        jsonData.harvestContributions = [];
      }
      
      // Füge alle Contributions mit harvestEventId hinzu
      harvestData.contributions.forEach(contribution => {
        jsonData.harvestContributions.push({
          ...contribution,
          harvestEventId: newHarvest.id,
          id: `contribution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });
      });
    }    // JSON-Datei speichern
    fs.writeFileSync(dataFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log('[IPC] Ernte gespeichert:', newHarvest.id);
    
    return { success: true, harvest: newHarvest };
  } catch (error) {
    console.error('[IPC] Fehler bei harvests:create:', error);
    throw error;
  }
});

// IPC-Handler zum Korrigieren/Erweitern einer bestehenden Ernte
ipcMain.handle('harvests:update-with-contributions', async (event, harvestId, updateData) => {
  try {
    console.log('[IPC] harvests:update-with-contributions aufgerufen für:', harvestId, 'mit Daten:', updateData);
    
    const userDataPath = app.getPath('userData');
    const dataDir = path.join(userDataPath, 'data');
    const dataFilePath = path.join(dataDir, 'app-data.json');
    
    if (!fs.existsSync(dataFilePath)) {
      console.warn('[IPC] Datei nicht gefunden:', dataFilePath);
      return { success: false, error: 'Datei nicht gefunden' };
    }
    
    const jsonData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    
    // Finde die zu aktualisierende Ernte
    const harvestIndex = jsonData.harvestEvents.findIndex(h => h.id === harvestId);
    if (harvestIndex === -1) {
      return { success: false, error: 'Ernte nicht gefunden' };
    }
    
    // Aktualisiere die Ernte
    jsonData.harvestEvents[harvestIndex] = {
      ...jsonData.harvestEvents[harvestIndex],
      ...updateData,
      isFinalized: true
    };
    
    // Füge Contributions hinzu, falls vorhanden
    if (updateData.contributions && Array.isArray(updateData.contributions)) {
      if (!jsonData.harvestContributions) {
        jsonData.harvestContributions = [];
      }
      
      // Lösche alte Contributions für diese Ernte
      jsonData.harvestContributions = jsonData.harvestContributions.filter(c => c.harvestEventId !== harvestId);
      
      // Füge neue Contributions hinzu
      updateData.contributions.forEach(contribution => {
        jsonData.harvestContributions.push({
          ...contribution,
          harvestEventId: harvestId,
          id: `contribution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });
      });
    }
    
    // JSON-Datei speichern
    fs.writeFileSync(dataFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log('[IPC] Ernte aktualisiert:', harvestId);
    
    return { success: true, harvest: jsonData.harvestEvents[harvestIndex] };
  } catch (error) {
    console.error('[IPC] Fehler bei harvests:update-with-contributions:', error);
    throw error;
  }
});

ipcMain.handle('harvests:get-all', async () => {
  try {
    console.log('[IPC] harvests:get-all aufgerufen');
    
    // Echte Daten aus JSON-Datei laden
    const userDataPath = app.getPath('userData');
    const dataDir = path.join(userDataPath, 'data');
    const dataFilePath = path.join(dataDir, 'app-data.json');
    
    if (!fs.existsSync(dataFilePath)) {
      console.warn('[IPC] Datei nicht gefunden für harvests:get-all:', dataFilePath);
      return [];
    }
    
    const jsonData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    const harvests = jsonData.harvestEvents || [];
    
    console.log('[IPC] Geladene Ernten:', harvests.length);
    return harvests;
  } catch (error) {
    console.error('[IPC] Fehler bei harvests:get-all:', error);
    throw error;
  }
});

// Harvest löschen - NEU IMPLEMENTIERT
ipcMain.handle('harvests:delete', async (event, harvestId) => {
  try {
    console.log('[IPC] harvests:delete aufgerufen für ID:', harvestId);
    
    const userDataPath = app.getPath('userData');
    const dataDir = path.join(userDataPath, 'data');
    const dataFilePath = path.join(dataDir, 'app-data.json');
    
    if (!fs.existsSync(dataFilePath)) {
      throw new Error('Datendatei nicht gefunden');
    }
    
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    
    if (!data.harvestEvents) {
      throw new Error('Keine Ernten in der Datei gefunden');
    }
    
    // Finde die zu löschende Ernte
    const harvestIndex = data.harvestEvents.findIndex(h => h.id === harvestId);
    if (harvestIndex === -1) {
      throw new Error(`Ernte mit ID ${harvestId} nicht gefunden`);
    }
    
    // Lösche die Ernte
    const deletedHarvest = data.harvestEvents.splice(harvestIndex, 1)[0];
    
    // Lösche auch zugehörige Contributions
    if (data.harvestContributions) {
      const beforeCount = data.harvestContributions.length;
      data.harvestContributions = data.harvestContributions.filter(
        c => c.harvestEventId !== harvestId
      );
      console.log(`[IPC] ${beforeCount - data.harvestContributions.length} Contributions gelöscht`);
    }
    
    // Speichere zurück
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    
    console.log('[IPC] Ernte erfolgreich gelöscht:', harvestId);
    return { success: true, deletedHarvest };
  } catch (error) {
    console.error('[IPC] Fehler bei harvests:delete:', error);
    throw error;
  }
});

// Harvest aktualisieren - NEU IMPLEMENTIERT
ipcMain.handle('harvests:update', async (event, harvestId, updates) => {
  try {
    console.log('[IPC] harvests:update aufgerufen für ID:', harvestId, 'Updates:', updates);
    
    const userDataPath = app.getPath('userData');
    const dataDir = path.join(userDataPath, 'data');
    const dataFilePath = path.join(dataDir, 'app-data.json');
    
    if (!fs.existsSync(dataFilePath)) {
      throw new Error('Datendatei nicht gefunden');
    }
    
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    
    if (!data.harvestEvents) {
      throw new Error('Keine Ernten in der Datei gefunden');
    }
    
    // Finde die zu aktualisierende Ernte
    const harvestIndex = data.harvestEvents.findIndex(h => h.id === harvestId);
    if (harvestIndex === -1) {
      throw new Error(`Ernte mit ID ${harvestId} nicht gefunden`);
    }
    
    // Aktualisiere die Ernte
    data.harvestEvents[harvestIndex] = { ...data.harvestEvents[harvestIndex], ...updates };
    
    // Speichere zurück
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    
    console.log('[IPC] Ernte erfolgreich aktualisiert:', harvestId);
    return { success: true, harvest: data.harvestEvents[harvestIndex] };
  } catch (error) {
    console.error('[IPC] Fehler bei harvests:update:', error);
    throw error;
  }
});

// Navigation Handler
ipcMain.handle('navigate-to', async (event, route) => {
  try {
    console.log(`[IPC] Navigation zu: ${route}`);
    
    // Route-Mapping für statische HTML-Dateien
    const routeMap = {
      '/': 'index.html',
      '/dashboard': 'dashboard/index.html',
      '/beds': 'index.html', // Weiterleitung zur Hauptseite mit Beeten
      '/herbs': 'herbs/index.html',
      '/routines': 'routines/index.html',
      '/reports': 'reports/index.html',
      '/gallery': 'gallery/index.html',
      '/settings': 'settings/index.html',
      '/backup': 'backup/index.html',
      '/help': 'help/index.html',
      '/users': 'users/index.html',
      '/weather': 'weather/index.html'
    };

    // Dynamische Routen
    if (route.startsWith('/beds/') && route.endsWith('/edit')) {
      // Beet-Edit-Seiten
      const bedId = route.split('/')[2];
      const staticFile = `beds/${bedId}/edit/index.html`;
      const staticPath = path.join(__dirname, '..', 'out', staticFile);
      
      if (fs.existsSync(staticPath)) {
        event.sender.loadFile(staticPath);
        return { success: true, route: staticFile };
      }
    } else if (route.startsWith('/beds/new')) {
      // Neues Beet
      const staticFile = 'beds/new/index.html';
      const staticPath = path.join(__dirname, '..', 'out', staticFile);
      
      if (fs.existsSync(staticPath)) {
        event.sender.loadFile(staticPath);
        return { success: true, route: staticFile };
      }
    } else if (routeMap[route]) {
      // Bekannte statische Route
      const staticFile = routeMap[route];
      const staticPath = path.join(__dirname, '..', 'out', staticFile);
      
      if (fs.existsSync(staticPath)) {
        event.sender.loadFile(staticPath);
        return { success: true, route: staticFile };
      }
    }
    
    // Fallback zur Hauptseite
    const mainPath = path.join(__dirname, '..', 'out', 'index.html');
    if (fs.existsSync(mainPath)) {
      event.sender.loadFile(mainPath);
      return { success: true, route: 'index.html' };
    } else {
      console.error(`[IPC] Hauptseite nicht gefunden: ${mainPath}`);
      return { success: false, message: 'Hauptseite nicht gefunden' };
    }
  } catch (error) {
    console.error('[IPC] Fehler bei Navigation:', error);
    return { success: false, message: error.message };
  }
});

// OneDrive-Handler
ipcMain.handle('onedrive:check-status', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const { OneDriveStorageManager } = require('./utils/cloud-storage');
    const status = await OneDriveStorageManager.getStatus();
    console.log('[IPC] OneDrive-Status abgerufen:', status);
    return status;
  } catch (error) {
    console.error('[IPC] Fehler bei OneDrive-Status:', error);
    return { connected: false, error: error.message };
  }
});

ipcMain.handle('onedrive:sync-data', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const { OneDriveStorageManager } = require('./utils/cloud-storage');
    const localData = JSON.parse(fs.readFileSync(path.join(userDataPath, 'data', 'app-data.json'), 'utf8'));
    
    const result = await OneDriveStorageManager.syncAppData(localData);
    console.log('[IPC] OneDrive-Sync abgeschlossen:', result);
    
    // Bei Download: Speichere neue Daten lokal
    if (result.success && result.action === 'download' && result.data) {
      fs.writeFileSync(path.join(userDataPath, 'data', 'app-data.json'), JSON.stringify(result.data, null, 2));
      console.log('[IPC] OneDrive-Daten lokal gespeichert');
    }
    
    return result;
  } catch (error) {
    console.error('[IPC] Fehler bei OneDrive-Sync:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('onedrive:export-file', async (event, fileName, content) => {
  try {
    const userDataPath = app.getPath('userData');
    const { OneDriveStorageManager } = require('./utils/cloud-storage');
    const result = await OneDriveStorageManager.exportFile(fileName, content);
    console.log('[IPC] OneDrive-Export abgeschlossen:', result);
    return result;
  } catch (error) {
    console.error('[IPC] Fehler bei OneDrive-Export:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('onedrive:list-backups', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const { OneDriveStorageManager } = require('./utils/cloud-storage');
    const backups = await OneDriveStorageManager.listBackupFiles();
    console.log('[IPC] OneDrive-Backups aufgelistet:', backups.length, 'Dateien');
    return backups;
  } catch (error) {
    console.error('[IPC] Fehler beim Auflisten von OneDrive-Backups:', error);
    return [];
  }
});

ipcMain.handle('onedrive:restore-backup', async (event, backupFilePath) => {
  try {
    const userDataPath = app.getPath('userData');
    const { OneDriveStorageManager } = require('./utils/cloud-storage');
    const result = await OneDriveStorageManager.restoreFromBackup(backupFilePath);
    console.log('[IPC] OneDrive-Backup-Wiederherstellung:', result);
    
    // Bei erfolgreicher Wiederherstellung: Lokale Daten aktualisieren
    if (result.success && result.data) {
      fs.writeFileSync(path.join(userDataPath, 'data', 'app-data.json'), JSON.stringify(result.data, null, 2));
      console.log('[IPC] Wiederhergestellte Daten lokal gespeichert');
    }
    
    return result;
  } catch (error) {
    console.error('[IPC] Fehler bei OneDrive-Backup-Wiederherstellung:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('onedrive:set-custom-path', async (event, customPath) => {
  try {
    const userDataPath = app.getPath('userData');
    const { OneDriveStorageManager } = require('./utils/cloud-storage');
    const result = await OneDriveStorageManager.setCustomPath(customPath);
    console.log('[IPC] OneDrive-Pfad gesetzt:', result);
    return result;
  } catch (error) {
    console.error('[IPC] Fehler beim Setzen des OneDrive-Pfads:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('onedrive:get-configuration', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const { OneDriveStorageManager } = require('./utils/cloud-storage');
    const config = await OneDriveStorageManager.getConfiguration();
    console.log('[IPC] OneDrive-Konfiguration abgerufen:', config);
    return config;
  } catch (error) {
    console.error('[IPC] Fehler beim Abrufen der OneDrive-Konfiguration:', error);
    return { isInitialized: false, isConnected: false, error: error.message };
  }
});

console.log('✅ IPC-Handler für Datenpersistenz, Benutzer, PDF-Export und OneDrive registriert');

let mainWindow = null;

const createWindow = async () => {
  console.log('🚀 Starting GartenMeister Portable...');

  // Browser-Fenster erstellen (optimiert für Performance)
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false, // Erst anzeigen wenn geladen
    icon: path.join(process.resourcesPath || path.join(__dirname, '..', 'build'), 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Wichtig für lokale Dateien
      allowRunningInsecureContent: true
    }
  });

  // NAVIGATION HANDLER für statische Routen (KRITISCH!)
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    event.preventDefault();
    
    console.log(`[Navigation] Abgefangen: ${navigationUrl}`);
    
    // Route-Mapping für statische HTML-Dateien
    const routeMap = {
      '/dashboard': 'dashboard/index.html',
      '/beds': 'index.html', // Zur Hauptseite mit Beeten
      '/beds/new': 'beds/new/index.html', // Neues Beet erstellen
      '/herbs': 'herbs/index.html',
      '/routines': 'routines/index.html',
      '/reports': 'reports/index.html',
      '/gallery': 'gallery/index.html',
      '/settings': 'settings/index.html',
      '/backup': 'backup/index.html',
      '/help': 'help/index.html',
      '/users': 'users/index.html',
      '/weather': 'weather/index.html'
    };
    
    // HTTP-URL-Pfad-Parsing
    let targetPath;
    try {
      const url = new URL(navigationUrl);
      targetPath = url.pathname;
    } catch (e) {
      // Fallback für file:// URLs oder andere Formate
      const urlPath = navigationUrl.replace(/^file:\/\/\/[C-Z]:/, '').replace(/^file:\/\//, '');
      targetPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
      
      // Windows path parsing fix
      if (targetPath.includes('/C:/') || targetPath.includes('/c:/')) {
        targetPath = targetPath.replace(/\/[C-Zc-z]:/, '');
      }
    }
    
    console.log(`[Navigation] Parsed path: ${targetPath}`);
    
    // HTTP-Server-URL für Navigation verwenden
    const serverUrl = `http://localhost:${PORT}`;
    
    // Prüfe auf dynamische Beet-Edit-Routen
    if (targetPath.match(/^\/beds\/[^\/]+\/edit$/)) {
      // /beds/bed-X/edit → beds/bed-X/edit/index.html
      const bedId = targetPath.split('/')[2];
      const staticFile = `beds/${bedId}/edit/index.html`;
      const targetUrl = `${serverUrl}/${staticFile}`;
      console.log(`[Navigation] Beet-Edit-Route: ${targetPath} → ${staticFile}`);
      mainWindow.loadURL(targetUrl);
      return;
    }
    
    // Prüfe auf /beds/new mit optionalen URL-Parametern
    if (targetPath === '/beds/new' || targetPath.startsWith('/beds/new?')) {
      // Behalte URL-Parameter bei
      const url = new URL(navigationUrl);
      const staticFile = 'beds/new/index.html';
      const targetUrl = `${serverUrl}/${staticFile}${url.search}`;
      console.log(`[Navigation] Neues-Beet-Route: ${targetPath} → ${staticFile}${url.search}`);
      mainWindow.loadURL(targetUrl);
      return;
    }
    
    // Route zu statischer HTML-Datei
    const staticFile = routeMap[targetPath];
    if (staticFile) {
      const targetUrl = `${serverUrl}/${staticFile}`;
      console.log(`[Navigation] Weiterleitung: ${targetPath} → ${staticFile}`);
      mainWindow.loadURL(targetUrl);
    } else {
      // Fallback zur Hauptseite  
      console.log(`[Navigation] Unbekannte Route: ${targetPath}, lade Hauptseite`);
      mainWindow.loadURL(serverUrl);
    }
  });

  // Static Export laden (Portable Version mit HTTP Server)
  try {
    // HTTP-Server starten (async: wartet bis listen() bereit ist)
    const serverUrl = await createHttpServer();

    console.log('📂 Loading Next.js Static Export via HTTP Server');

    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
      console.log('✅ GartenMeister Portable gestartet!');
    });

    await mainWindow.loadURL(serverUrl);

    // DevTools nur für debugging
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }
  } catch (error) {
    console.error('Fehler beim Laden der App:', error);
    mainWindow.show();
  }
};

// App ready
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// ===== BACKUP/RESTORE SYSTEM =====

// Backup erstellen
ipcMain.handle('backup:create', async (event, options = {}) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const userDataPath = app.getPath('userData');
    const backupDir = path.join(userDataPath, 'backups');
    const backupPath = path.join(backupDir, `backup-${timestamp}`);
    
    // Backup-Ordner erstellen
    await fse.ensureDir(backupPath);
    
    // Alle Daten-Dateien sammeln
    const dataDir = path.join(userDataPath, 'data');
    const dataFiles = [
      'app-data.json',
      'beds.json',
      'herbs.json',
      'harvests.json',
      'segments.json',
      'weather-data.json',
      'garten-config.json'
    ];
    
    // Backup-Metadaten erstellen
    const backupInfo = {
      timestamp: new Date().toISOString(),
      version: app.getVersion(),
      description: options.description || 'Automatisches Backup',
      files: []
    };
    
    // Dateien kopieren
    for (const file of dataFiles) {
      const sourcePath = path.join(dataDir, file);
      const targetPath = path.join(backupPath, file);
      
      console.log(`🔍 Checking file: ${sourcePath}`);
      if (await fse.pathExists(sourcePath)) {
        const stats = await fse.stat(sourcePath);
        console.log(`📄 File ${file}: ${stats.size} bytes`);
        await fse.copy(sourcePath, targetPath);
        backupInfo.files.push(file);
        console.log(`📁 Backup: ${file} kopiert (${stats.size} bytes)`);
      } else {
        console.log(`⚠️ File not found: ${sourcePath}`);
      }
    }
    
    // Backup-Info speichern
    await fse.writeJson(path.join(backupPath, 'backup-info.json'), backupInfo, { spaces: 2 });
    
    console.log(`✅ Backup erstellt: ${backupPath}`);
    return {
      success: true,
      backupPath,
      timestamp,
      filesCount: backupInfo.files.length
    };
    
  } catch (error) {
    console.error('❌ Backup-Fehler:', error);
    return { success: false, error: error.message };
  }
});

// Backups auflisten
ipcMain.handle('backup:list', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const backupDir = path.join(userDataPath, 'backups');
    
    if (!await fse.pathExists(backupDir)) {
      return [];
    }
    
    const backupFolders = await fse.readdir(backupDir);
    const backups = [];
    
    for (const folder of backupFolders) {
      const backupPath = path.join(backupDir, folder);
      const infoPath = path.join(backupPath, 'backup-info.json');
      
      if (await fse.pathExists(infoPath)) {
        const info = await fse.readJson(infoPath);
        const stats = await fse.stat(backupPath);
        
        // Berechne die tatsächliche Größe aller Backup-Dateien
        let totalSize = 0;
        for (const file of info.files || []) {
          const filePath = path.join(backupPath, file);
          if (await fse.pathExists(filePath)) {
            const fileStats = await fse.stat(filePath);
            totalSize += fileStats.size;
          }
        }
        
        backups.push({
          path: backupPath,
          folder: folder,
          ...info,
          size: totalSize,
          created: stats.birthtime
        });
      }
    }
    
    // Nach Datum sortieren (neueste zuerst)
    backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return backups;
    
  } catch (error) {
    console.error('❌ Backup-Listen-Fehler:', error);
    return [];
  }
});

// Backup wiederherstellen
ipcMain.handle('backup:restore', async (event, backupPath) => {
  try {
    const infoPath = path.join(backupPath, 'backup-info.json');
    
    if (!await fse.pathExists(infoPath)) {
      throw new Error('Backup-Info nicht gefunden');
    }
    
    const backupInfo = await fse.readJson(infoPath);
    const userDataPath = app.getPath('userData');
    const dataDir = path.join(userDataPath, 'data');
    let restoredFiles = 0;
    
    // Dateien wiederherstellen
    for (const file of backupInfo.files) {
      const sourcePath = path.join(backupPath, file);
      const targetPath = path.join(dataDir, file);
      
      if (await fse.pathExists(sourcePath)) {
        // Backup der aktuellen Datei erstellen
        if (await fse.pathExists(targetPath)) {
          await fse.copy(targetPath, `${targetPath}.backup-before-restore`);
        }
        
        await fse.copy(sourcePath, targetPath);
        restoredFiles++;
        console.log(`🔄 Restored: ${file}`);
      }
    }
    
    console.log(`✅ Backup wiederhergestellt: ${restoredFiles} Dateien`);
    return {
      success: true,
      restoredFiles,
      backupInfo
    };
    
  } catch (error) {
    console.error('❌ Restore-Fehler:', error);
    return { success: false, error: error.message };
  }
});

// Backup löschen
ipcMain.handle('backup:delete', async (event, backupPath) => {
  try {
    await fse.remove(backupPath);
    console.log(`🗑️ Backup gelöscht: ${backupPath}`);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Backup-Lösch-Fehler:', error);
    return { success: false, error: error.message };
  }
});

// ===== KRITISCHE FEHLENDE HANDLER =====

// App-Pfad Handler
ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

// Datenbank-Pfad Handler
ipcMain.handle('get-database-path', () => {
  return path.join(app.getPath('userData'), 'gartenmeister.db');
});

// Benutzereinstellung aktualisieren Handler
ipcMain.handle('update-user-preference', async (event, key, value) => {
  try {
    console.log('[IPC] update-user-preference:', key, value);
    // Hier würde normalerweise die Konfiguration aktualisiert werden
    return true;
  } catch (error) {
    console.error('[IPC] Fehler bei update-user-preference:', error);
    return false;
  }
});

// Datei-Dialog Handler
ipcMain.handle('select-file', async (event, options = {}) => {
  try {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow, {
      title: options.title || 'Datei auswählen',
      filters: options.filters || [
        { name: 'Alle Dateien', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    return result.canceled ? null : result.filePaths[0];
  } catch (error) {
    console.error('[IPC] Fehler bei select-file:', error);
    return null;
  }
});

// Cloud-Sync-Verzeichnis auswählen Handler
ipcMain.handle('select-cloud-sync-directory', async () => {
  try {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Cloud-Sync-Verzeichnis auswählen',
      properties: ['openDirectory']
    });
    
    return result.canceled ? null : result.filePaths[0];
  } catch (error) {
    console.error('[IPC] Fehler bei select-cloud-sync-directory:', error);
    return null;
  }
});

// Verzeichnis erstellen Handler
ipcMain.handle('ensure-directory', async (event, dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('[IPC] Fehler bei ensure-directory:', dirPath, error);
    return false;
  }
});

// Backup-Ordner erstellen Handler
ipcMain.handle('create-backup-folder', async (event, timestamp) => {
  try {
    const backupDir = path.join(app.getPath('userData'), 'backups', timestamp);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    return backupDir;
  } catch (error) {
    console.error('[IPC] Fehler bei create-backup-folder:', error);
    return null;
  }
});

// Backup-Daten-Dateien Handler
ipcMain.handle('backup-data-files', async (event, backupPath) => {
  try {
    const dataPath = path.join(__dirname, '..', 'data');
    // Hier würde der eigentliche Backup-Code stehen
    console.log('[IPC] Backup-Daten-Dateien zu:', backupPath);
    return true;
  } catch (error) {
    console.error('[IPC] Fehler bei backup-data-files:', error);
    return false;
  }
});

// ===== BEET-MANAGEMENT HANDLER =====

// Beet erstellen
ipcMain.handle('beds:create', async (event, bedData) => {
  try {
    console.log('[IPC] beds:create:', bedData);
    
    // Lade bestehende Beete
    const bedsFile = path.join(__dirname, '..', 'data', 'beds.json');
    let beds = [];
    if (fs.existsSync(bedsFile)) {
      beds = JSON.parse(fs.readFileSync(bedsFile, 'utf8'));
    }
    
    // Erstelle neues Beet
    const newBed = {
      id: Date.now(),
      ...bedData,
      createdAt: new Date().toISOString()
    };
    
    beds.push(newBed);
    
    // Speichere zurück
    fs.writeFileSync(bedsFile, JSON.stringify(beds, null, 2));
    
    return { success: true, bed: newBed };
  } catch (error) {
    console.error('[IPC] Fehler bei beds:create:', error);
    return { success: false, message: error.message };
  }
});

// Beet nach ID abrufen
ipcMain.handle('beds:get-by-id', async (event, bedId) => {
  try {
    const bedsFile = path.join(__dirname, '..', 'data', 'beds.json');
    if (!fs.existsSync(bedsFile)) return null;
    
    const beds = JSON.parse(fs.readFileSync(bedsFile, 'utf8'));
    return beds.find(bed => bed.id === bedId) || null;
  } catch (error) {
    console.error('[IPC] Fehler bei beds:get-by-id:', error);
    return null;
  }
});

// Beet aktualisieren
ipcMain.handle('beds:update', async (event, bedId, updates) => {
  try {
    const bedsFile = path.join(__dirname, '..', 'data', 'beds.json');
    if (!fs.existsSync(bedsFile)) return { success: false, message: 'Keine Beete gefunden' };
    
    let beds = JSON.parse(fs.readFileSync(bedsFile, 'utf8'));
    const bedIndex = beds.findIndex(bed => bed.id === bedId);
    
    if (bedIndex === -1) {
      return { success: false, message: 'Beet nicht gefunden' };
    }
    
    beds[bedIndex] = { ...beds[bedIndex], ...updates, updatedAt: new Date().toISOString() };
    
    fs.writeFileSync(bedsFile, JSON.stringify(beds, null, 2));
    
    return { success: true, bed: beds[bedIndex] };
  } catch (error) {
    console.error('[IPC] Fehler bei beds:update:', error);
    return { success: false, message: error.message };
  }
});

// Beet löschen
ipcMain.handle('beds:delete', async (event, bedId) => {
  try {
    const bedsFile = path.join(__dirname, '..', 'data', 'beds.json');
    if (!fs.existsSync(bedsFile)) return { success: false, message: 'Keine Beete gefunden' };
    
    let beds = JSON.parse(fs.readFileSync(bedsFile, 'utf8'));
    const initialLength = beds.length;
    beds = beds.filter(bed => bed.id !== bedId);
    
    if (beds.length === initialLength) {
      return { success: false, message: 'Beet nicht gefunden' };
    }
    
    fs.writeFileSync(bedsFile, JSON.stringify(beds, null, 2));
    
    return { success: true };
  } catch (error) {
    console.error('[IPC] Fehler bei beds:delete:', error);
    return { success: false, message: error.message };
  }
});

// ===== HERBS HANDLER =====

// Herb nach ID abrufen
ipcMain.handle('herbs:get-by-id', async (event, herbId) => {
  try {
    const herbsFile = path.join(__dirname, '..', 'data', 'herb-varieties.json');
    if (!fs.existsSync(herbsFile)) return null;
    
    const herbs = JSON.parse(fs.readFileSync(herbsFile, 'utf8'));
    return herbs.find(herb => herb.id === herbId) || null;
  } catch (error) {
    console.error('[IPC] Fehler bei herbs:get-by-id:', error);
    return null;
  }
});

// ===== SEGMENT HANDLER =====

// Alle Segmente abrufen
ipcMain.handle('segments:get-all', async () => {
  try {
    const segmentsFile = path.join(__dirname, '..', 'data', 'bed-segments.json');
    if (!fs.existsSync(segmentsFile)) return [];
    
    return JSON.parse(fs.readFileSync(segmentsFile, 'utf8'));
  } catch (error) {
    console.error('[IPC] Fehler bei segments:get-all:', error);
    return [];
  }
});

// Segment nach ID abrufen
ipcMain.handle('segments:get-by-id', async (event, segmentId) => {
  try {
    const segmentsFile = path.join(__dirname, '..', 'data', 'bed-segments.json');
    if (!fs.existsSync(segmentsFile)) return null;
    
    const segments = JSON.parse(fs.readFileSync(segmentsFile, 'utf8'));
    return segments.find(segment => segment.id === segmentId) || null;
  } catch (error) {
    console.error('[IPC] Fehler bei segments:get-by-id:', error);
    return null;
  }
});

// Segment erstellen
ipcMain.handle('segments:create', async (event, segmentData) => {
  try {
    const segmentsFile = path.join(__dirname, '..', 'data', 'bed-segments.json');
    let segments = [];
    if (fs.existsSync(segmentsFile)) {
      segments = JSON.parse(fs.readFileSync(segmentsFile, 'utf8'));
    }
    
    const newSegment = {
      id: Date.now(),
      ...segmentData,
      createdAt: new Date().toISOString()
    };
    
    segments.push(newSegment);
    fs.writeFileSync(segmentsFile, JSON.stringify(segments, null, 2));
    
    return { success: true, segment: newSegment };
  } catch (error) {
    console.error('[IPC] Fehler bei segments:create:', error);
    return { success: false, message: error.message };
  }
});

// Segment aktualisieren
ipcMain.handle('segments:update', async (event, segmentId, updates) => {
  try {
    const segmentsFile = path.join(__dirname, '..', 'data', 'bed-segments.json');
    if (!fs.existsSync(segmentsFile)) return { success: false, message: 'Keine Segmente gefunden' };
    
    let segments = JSON.parse(fs.readFileSync(segmentsFile, 'utf8'));
    const segmentIndex = segments.findIndex(segment => segment.id === segmentId);
    
    if (segmentIndex === -1) {
      return { success: false, message: 'Segment nicht gefunden' };
    }
    
    segments[segmentIndex] = { ...segments[segmentIndex], ...updates, updatedAt: new Date().toISOString() };
    fs.writeFileSync(segmentsFile, JSON.stringify(segments, null, 2));
    
    return { success: true, segment: segments[segmentIndex] };
  } catch (error) {
    console.error('[IPC] Fehler bei segments:update:', error);
    return { success: false, message: error.message };
  }
});

// Segment löschen
ipcMain.handle('segments:delete', async (event, segmentId) => {
  try {
    const segmentsFile = path.join(__dirname, '..', 'data', 'bed-segments.json');
    if (!fs.existsSync(segmentsFile)) return { success: false, message: 'Keine Segmente gefunden' };
    
    let segments = JSON.parse(fs.readFileSync(segmentsFile, 'utf8'));
    const initialLength = segments.length;
    segments = segments.filter(segment => segment.id !== segmentId);
    
    if (segments.length === initialLength) {
      return { success: false, message: 'Segment nicht gefunden' };
    }
    
    fs.writeFileSync(segmentsFile, JSON.stringify(segments, null, 2));
    
    return { success: true };
  } catch (error) {
    console.error('[IPC] Fehler bei segments:delete:', error);
    return { success: false, message: error.message };
  }
});

// ===== HARVEST EVENTS HANDLER =====

// Alle Harvest Events abrufen
ipcMain.handle('harvest-events:get-all', async () => {
  try {
    const harvestEventsFile = path.join(__dirname, '..', 'data', 'harvest-events.json');
    if (!fs.existsSync(harvestEventsFile)) return [];
    
    return JSON.parse(fs.readFileSync(harvestEventsFile, 'utf8'));
  } catch (error) {
    console.error('[IPC] Fehler bei harvest-events:get-all:', error);
    return [];
  }
});

// Harvest Event erstellen
ipcMain.handle('harvest-events:create', async (event, eventData) => {
  try {
    const harvestEventsFile = path.join(__dirname, '..', 'data', 'harvest-events.json');
    let events = [];
    if (fs.existsSync(harvestEventsFile)) {
      events = JSON.parse(fs.readFileSync(harvestEventsFile, 'utf8'));
    }
    
    const newEvent = {
      id: Date.now(),
      ...eventData,
      createdAt: new Date().toISOString()
    };
    
    events.push(newEvent);
    fs.writeFileSync(harvestEventsFile, JSON.stringify(events, null, 2));
    
    return { success: true, event: newEvent };
  } catch (error) {
    console.error('[IPC] Fehler bei harvest-events:create:', error);
    return { success: false, message: error.message };
  }
});

// ===== HARVEST CONTRIBUTIONS HANDLER =====

// Alle Harvest Contributions abrufen
ipcMain.handle('harvest-contributions:get-all', async () => {
  try {
    const contributionsFile = path.join(__dirname, '..', 'data', 'harvest-contributions.json');
    if (!fs.existsSync(contributionsFile)) return [];
    
    return JSON.parse(fs.readFileSync(contributionsFile, 'utf8'));
  } catch (error) {
    console.error('[IPC] Fehler bei harvest-contributions:get-all:', error);
    return [];
  }
});

// Harvest Contribution erstellen
ipcMain.handle('harvest-contributions:create', async (event, contributionData) => {
  try {
    const contributionsFile = path.join(__dirname, '..', 'data', 'harvest-contributions.json');
    let contributions = [];
    if (fs.existsSync(contributionsFile)) {
      contributions = JSON.parse(fs.readFileSync(contributionsFile, 'utf8'));
    }
    
    const newContribution = {
      id: Date.now(),
      ...contributionData,
      createdAt: new Date().toISOString()
    };
    
    contributions.push(newContribution);
    fs.writeFileSync(contributionsFile, JSON.stringify(contributions, null, 2));
    
    return { success: true, contribution: newContribution };
  } catch (error) {
    console.error('[IPC] Fehler bei harvest-contributions:create:', error);
    return { success: false, message: error.message };
  }
});

// ===== APP LIFECYCLE =====

app.on('window-all-closed', () => {
  // HTTP-Server schließen
  if (httpServer) {
    httpServer.close();
    console.log('📡 HTTP-Server beendet');
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
