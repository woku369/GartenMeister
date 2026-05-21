// =============================================================================
// GartenMeister NAS API Server — server-gartenmeister.js
// Port 3003 | /volume1/GartenMeister/ | Tailscale-Zugang
//
// Basiert auf dem bewährten zweipunktnullVS-Muster (Gurktaler, Port 3002).
// Deployment: /volume1/GartenMeister/server-gartenmeister.js
// =============================================================================

const http  = require('http');
const fs    = require('fs').promises;
const fssync = require('fs');
const path  = require('path');
const sharp = require('sharp');
const crypto = require('crypto');

const BASE_PATH      = process.env.GARTENMEISTER_BASE || '/volume1/Gurktaler/gartenmeister';
const PORT           = 3003;
const THUMBNAIL_SIZE = 300;  // px, quadratisch, cover

// ------------------------------------------------------------------
// Verzeichnisstruktur (wird beim Start angelegt)
// ------------------------------------------------------------------
const DIRS = [
  'images/garden',
  'images/bed',
  'images/harvest',
  'images/thumbnails',
  'documents/invoice',
  'documents/delivery-note',
  'documents/other',
  'database',
  'backups',
  'public',
];

async function ensureDirs() {
  for (const dir of DIRS) {
    await fs.mkdir(path.join(BASE_PATH, dir), { recursive: true });
  }
}

// ------------------------------------------------------------------
// Datenverlustschutz — bewährt aus zweipunktnullVS
// ------------------------------------------------------------------
async function safeWriteJson(filePath, newData) {
  let existing = [];
  try {
    existing = JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch {
    // Datei existiert noch nicht — OK
  }

  if (Array.isArray(existing) && existing.length > 0 &&
      Array.isArray(newData)  && newData.length === 0) {
    throw new Error(
      `DATENVERLUST-SCHUTZ: Leeres Array blockiert (${existing.length} Einträge vorhanden)`
    );
  }

  // Warnung bei drastischem Datenverlust (>50%)
  if (existing.length > 10 && newData.length < existing.length * 0.5) {
    console.warn(`⚠️ Warn: ${path.basename(filePath)} ${existing.length} → ${newData.length} Einträge`);
  }

  // Inkrementelles Backup vor Schreibvorgang
  if (Array.isArray(existing) && existing.length > 0) {
    const ts = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupDir = path.join(BASE_PATH, 'backups', `incremental_${ts}`);
    await fs.mkdir(backupDir, { recursive: true });
    await fs.writeFile(
      path.join(backupDir, path.basename(filePath)),
      JSON.stringify(existing),
      'utf8'
    );
    console.log(`💾 Backup: ${path.basename(filePath)} (${existing.length} Einträge)`);
  }

  await fs.writeFile(filePath, JSON.stringify(newData, null, 2), 'utf8');
}

// ------------------------------------------------------------------
// Katalog-Hilfsfunktionen (images-catalog.json auf NAS)
// ------------------------------------------------------------------
const CATALOG_PATH = path.join(BASE_PATH, 'database', 'images-catalog.json');

async function loadCatalog() {
  try {
    return JSON.parse(await fs.readFile(CATALOG_PATH, 'utf8'));
  } catch {
    return [];
  }
}

async function saveCatalog(catalog) {
  await safeWriteJson(CATALOG_PATH, catalog);
}

async function addToCatalog(entry) {
  const catalog = await loadCatalog();
  const idx = catalog.findIndex(e => e.id === entry.id);
  if (idx >= 0) catalog[idx] = entry;
  else catalog.push(entry);
  await saveCatalog(catalog);
}

async function removeFromCatalog(imageId) {
  const catalog = await loadCatalog();
  await saveCatalog(catalog.filter(e => e.id !== imageId));
}

// ------------------------------------------------------------------
// Body-Lese-Helfer
// ------------------------------------------------------------------
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function readBodyBuffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ------------------------------------------------------------------
// HTTP-Server
// ------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  console.log(`${new Date().toISOString()} ${req.method} ${url.pathname}`);

  try {
    await router(req, res, url);
  } catch (error) {
    console.error('❌ Unbehandleter Fehler:', error.message);
    json(res, 500, { success: false, error: error.message });
  }
});

// ------------------------------------------------------------------
// Router
// ------------------------------------------------------------------
async function router(req, res, url) {

  // ── GET /api/health ───────────────────────────────────────────────
  if (req.method === 'GET' && url.pathname === '/api/health') {
    const uptime = process.uptime();
    json(res, 200, {
      success: true,
      status: 'online',
      uptime: Math.floor(uptime),
      uptimeFormatted: formatUptime(uptime),
      memory: {
        rss:       Math.round(process.memoryUsage().rss       / 1024 / 1024) + ' MB',
        heapUsed:  Math.round(process.memoryUsage().heapUsed  / 1024 / 1024) + ' MB',
      },
      version: process.version,
      basePath: BASE_PATH,
    });
    return;
  }

  // ── POST /api/image — Bild hochladen (base64 dataUrl) ────────────
  if (req.method === 'POST' && url.pathname === '/api/image') {
    const body = await readBody(req);
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (parseErr) {
      return json(res, 400, { success: false, error: 'Ungültiger JSON-Body — Upload möglicherweise abgebrochen' });
    }
    const { entityType = 'garden', entityId = 'mobile', dataUrl, index, metadata = {} } = parsed;

    if (!dataUrl) throw new Error('dataUrl fehlt');

    const mimeMatch = dataUrl.match(/^data:([^;]+);/);
    const mime = mimeMatch?.[1] ?? 'image/jpeg';
    const extMap = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    const ext = extMap[mime] ?? 'jpg';

    const id       = crypto.randomUUID();
    const ts       = index ?? Date.now();
    const filename = `${entityId}_${ts}_${id.slice(0, 8)}.${ext}`;
    const thumbName = filename.replace(`.${ext}`, `_thumb.jpg`);

    const relPath   = `images/${entityType}/${filename}`;
    const relThumb  = `images/thumbnails/${thumbName}`;
    const fullPath  = path.join(BASE_PATH, relPath);
    const thumbPath = path.join(BASE_PATH, relThumb);

    const buffer = Buffer.from(dataUrl.replace(/^data:[^;]+;base64,/, ''), 'base64');

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.mkdir(path.dirname(thumbPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);

    // Thumbnail-Erstellung — non-fatal (HEIC/AVIF können auf ARM scheitern)
    let imgWidth = null, imgHeight = null;
    try {
      await sharp(buffer)
        .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 82 })
        .toFile(thumbPath);

      const imgMeta = await sharp(buffer).metadata();
      imgWidth = imgMeta.width;
      imgHeight = imgMeta.height;
    } catch (sharpErr) {
      console.warn(`⚠️ Thumbnail konnte nicht erstellt werden (${mime}): ${sharpErr.message}`);
    }

    const catalogEntry = {
      id,
      file_path:       relPath,
      thumbnail_path:  relThumb,
      entity_type:     entityType,
      entity_id:       entityId,
      mime_type:       mime,
      size_bytes:      buffer.length,
      width:           imgWidth,
      height:          imgHeight,
      uploaded_at:     new Date().toISOString(),
      original_name:   metadata.originalName ?? filename,
      title:           metadata.title ?? '',
      description:     metadata.description ?? '',
      tags:            metadata.tags ?? [],
    };

    await addToCatalog(catalogEntry);

    console.log(`✅ Bild gespeichert: ${relPath} (${Math.round(buffer.length / 1024)} KB)`);
    json(res, 200, {
      success: true,
      id,
      file_path:      relPath,
      thumbnail_path: relThumb,
      width:          imgWidth,
      height:         imgHeight,
      size_bytes:     buffer.length,
    });
    return;
  }

  // ── GET /api/image?id=UUID[&thumb=1] — Bild per ID ───────────────
  if (req.method === 'GET' && url.pathname === '/api/image' && url.searchParams.has('id')) {
    const id = url.searchParams.get('id');
    const wantThumb = url.searchParams.get('thumb') === '1';
    const catalog = await loadCatalog();
    const entry = catalog.find(e => e.id === id);
    if (!entry) { json(res, 404, { error: 'Bild nicht gefunden' }); return; }

    const relativePath = wantThumb ? (entry.thumbnail_path || entry.file_path) : entry.file_path;
    const fullPath = path.resolve(BASE_PATH, relativePath);
    if (!fullPath.startsWith(path.resolve(BASE_PATH))) {
      json(res, 403, { error: 'Ungültiger Pfad' }); return;
    }

    let buffer;
    try {
      buffer = await fs.readFile(fullPath);
    } catch {
      // Thumbnail fehlt → Fallback auf Original
      if (wantThumb && entry.thumbnail_path !== entry.file_path) {
        const origPath = path.resolve(BASE_PATH, entry.file_path);
        buffer = await fs.readFile(origPath);
      } else {
        json(res, 404, { error: 'Datei nicht gefunden' }); return;
      }
    }

    const mimeTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
    const mimeType = mimeTypes[path.extname(fullPath).toLowerCase()] ?? 'image/jpeg';
    res.writeHead(200, { 'Content-Type': mimeType, 'Cache-Control': 'public, max-age=31536000', 'Content-Length': buffer.length });
    res.end(buffer);
    return;
  }

  // ── GET /api/image?path=images/garden/xyz.jpg ────────────────────
  if (req.method === 'GET' && url.pathname === '/api/image') {
    const relativePath = url.searchParams.get('path') ?? '';
    if (!relativePath) throw new Error('path-Parameter fehlt');

    // Path-Traversal verhindern
    const fullPath = path.resolve(BASE_PATH, relativePath);
    if (!fullPath.startsWith(path.resolve(BASE_PATH))) {
      json(res, 403, { error: 'Ungültiger Pfad' });
      return;
    }

    const buffer = await fs.readFile(fullPath);
    const mimeTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
    const mimeType = mimeTypes[path.extname(fullPath).toLowerCase()] ?? 'image/jpeg';

    res.writeHead(200, {
      'Content-Type':   mimeType,
      'Cache-Control':  'public, max-age=31536000',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
    return;
  }

  // ── PATCH /api/image?id=uuid — Metadaten aktualisieren ──────────
  if (req.method === 'PATCH' && url.pathname === '/api/image') {
    const id = url.searchParams.get('id');
    if (!id) { json(res, 400, { error: 'id-Parameter fehlt' }); return; }
    const catalog = await loadCatalog();
    const idx = catalog.findIndex(e => e.id === id);
    if (idx < 0) { json(res, 404, { error: 'Bild nicht gefunden' }); return; }

    const body = JSON.parse(await readBody(req));
    // Nur editierbare Felder übernehmen
    if (body.title       !== undefined) catalog[idx].title       = String(body.title).substring(0, 200);
    if (body.description !== undefined) catalog[idx].description = String(body.description).substring(0, 1000);
    if (Array.isArray(body.tags))       catalog[idx].tags        = body.tags.map(t => String(t).trim()).filter(Boolean).slice(0, 20);

    await saveCatalog(catalog);
    console.log(`✏️  Metadaten aktualisiert: ${id} → title="${catalog[idx].title}" tags=[${catalog[idx].tags}]`);
    json(res, 200, { success: true, entry: catalog[idx] });
    return;
  }

  // ── DELETE /api/image?id=uuid ────────────────────────────────────
  if (req.method === 'DELETE' && url.pathname === '/api/image') {
    const id = url.searchParams.get('id');
    const catalog = await loadCatalog();
    const entry = catalog.find(e => e.id === id);
    if (!entry) { json(res, 404, { success: false, error: 'Bild nicht gefunden' }); return; }

    const fullPath  = path.join(BASE_PATH, entry.file_path);
    const thumbPath = path.join(BASE_PATH, entry.thumbnail_path);

    await fs.unlink(fullPath).catch(() => {});
    await fs.unlink(thumbPath).catch(() => {});
    await removeFromCatalog(id);

    console.log(`🗑️ Bild gelöscht: ${entry.file_path}`);
    json(res, 200, { success: true });
    return;
  }

  // ── GET /api/images — Katalog abrufen ───────────────────────────
  if (req.method === 'GET' && url.pathname === '/api/images') {
    const entityType = url.searchParams.get('entityType');
    const entityId   = url.searchParams.get('entityId');
    let catalog = await loadCatalog();

    if (entityType) catalog = catalog.filter(e => e.entity_type === entityType);
    if (entityId)   catalog = catalog.filter(e => e.entity_id   === entityId);

    json(res, 200, { success: true, images: catalog, total: catalog.length });
    return;
  }

  // ── POST /api/document — Dokument hochladen (PDF / JPG) ──────────
  if (req.method === 'POST' && url.pathname === '/api/document') {
    const body = await readBody(req);
    const { documentType = 'other', name = 'dokument', dataUrl } = JSON.parse(body);

    if (!dataUrl) throw new Error('dataUrl fehlt');

    const mimeMatch = dataUrl.match(/^data:([^;]+);/);
    const mime = mimeMatch?.[1] ?? 'application/pdf';
    const extMap = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' };
    const ext = extMap[mime] ?? 'pdf';

    const safeName = name.replace(/[^a-zA-Z0-9_\-äöüÄÖÜß .]/g, '_').substring(0, 80);
    const filename = `${Date.now()}_${safeName}.${ext}`;
    const relPath  = `documents/${documentType}/${filename}`;
    const fullPath = path.join(BASE_PATH, relPath);

    const buffer = Buffer.from(dataUrl.replace(/^data:[^;]+;base64,/, ''), 'base64');
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);

    console.log(`📄 Dokument gespeichert: ${relPath} (${Math.round(buffer.length / 1024)} KB)`);
    json(res, 200, { success: true, file_path: relPath, size_bytes: buffer.length });
    return;
  }

  // ── GET /api/document?path=documents/invoice/xyz.pdf ────────────
  if (req.method === 'GET' && url.pathname === '/api/document') {
    const relativePath = url.searchParams.get('path') ?? '';
    const fullPath = path.resolve(BASE_PATH, relativePath);
    if (!fullPath.startsWith(path.resolve(BASE_PATH))) {
      json(res, 403, { error: 'Ungültiger Pfad' });
      return;
    }

    const buffer = await fs.readFile(fullPath);
    const mimeTypes = { '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
    const mimeType = mimeTypes[path.extname(fullPath).toLowerCase()] ?? 'application/octet-stream';
    const filename = path.basename(fullPath);

    res.writeHead(200, {
      'Content-Type':        mimeType,
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length':      buffer.length,
    });
    res.end(buffer);
    return;
  }

  // ── GET /api/json?path=database/xyz.json ─────────────────────────
  if (req.method === 'GET' && url.pathname === '/api/json') {
    const relPath  = url.searchParams.get('path') ?? '';
    const fullPath = path.resolve(BASE_PATH, relPath);
    if (!fullPath.startsWith(path.resolve(BASE_PATH))) {
      json(res, 403, { error: 'Ungültiger Pfad' });
      return;
    }
    const data = await fs.readFile(fullPath, 'utf8');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(data);
    return;
  }

  // ── POST /api/json?path=database/xyz.json ────────────────────────
  if (req.method === 'POST' && url.pathname === '/api/json') {
    const relPath  = url.searchParams.get('path') ?? '';
    const fullPath = path.resolve(BASE_PATH, relPath);
    if (!fullPath.startsWith(path.resolve(BASE_PATH))) {
      json(res, 403, { error: 'Ungültiger Pfad' });
      return;
    }

    const body = await readBody(req);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    if (relPath.includes('database/') && relPath.endsWith('.json')) {
      await safeWriteJson(fullPath, JSON.parse(body));
    } else {
      await fs.writeFile(fullPath, body, 'utf8');
    }

    json(res, 200, { success: true });
    return;
  }

  // ── DELETE /api/json?path=database/xyz.json ───────────────────────
  if (req.method === 'DELETE' && url.pathname === '/api/json') {
    const relPath  = url.searchParams.get('path') ?? '';
    const fullPath = path.resolve(BASE_PATH, relPath);
    if (!fullPath.startsWith(path.resolve(BASE_PATH))) {
      json(res, 403, { error: 'Ungültiger Pfad' });
      return;
    }
    await fs.unlink(fullPath);
    json(res, 200, { success: true });
    return;
  }

  // ── POST /api/backup — manuelles Backup ──────────────────────────
  if (req.method === 'POST' && url.pathname === '/api/backup') {
    const ts = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupDir = path.join(BASE_PATH, 'backups', `backup_${ts}`);
    await fs.mkdir(backupDir, { recursive: true });

    const dbDir = path.join(BASE_PATH, 'database');
    try {
      const files = await fs.readdir(dbDir);
      for (const f of files.filter(f => f.endsWith('.json'))) {
        await fs.copyFile(path.join(dbDir, f), path.join(backupDir, f));
      }
    } catch { /* DB-Verzeichnis leer */ }

    console.log(`💾 Manuelles Backup: ${backupDir}`);
    json(res, 200, { success: true, backup_path: backupDir, timestamp: ts });
    return;
  }

  // ── GET /api/backups ──────────────────────────────────────────────
  if (req.method === 'GET' && url.pathname === '/api/backups') {
    const backupPath = path.join(BASE_PATH, 'backups');
    try {
      const entries = await fs.readdir(backupPath);
      const list = [];
      for (const name of entries) {
        if (!name.startsWith('backup_') && !name.startsWith('incremental_')) continue;
        const stat = await fs.stat(path.join(backupPath, name));
        list.push({ name, created: stat.mtime, size: stat.size });
      }
      list.sort((a, b) => b.created - a.created);
      json(res, 200, { success: true, backups: list });
    } catch {
      json(res, 200, { success: true, backups: [] });
    }
    return;
  }

  // ── GET / oder /upload — Upload-PWA ausliefern ───────────────────
  if (req.method === 'GET' &&
      (url.pathname === '/' || url.pathname === '/upload' || url.pathname === '/upload.html')) {
    const htmlPath = path.join(__dirname, 'public', 'upload.html');
    try {
      const html = await fs.readFile(htmlPath, 'utf8');
      // URL-Auto-Erkennung läuft client-seitig via window.location.origin — kein Server-Inject nötig.
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch {
      json(res, 404, { error: 'upload.html nicht gefunden – bitte public/upload.html deployen' });
    }
    return;
  }

  // ── GET /public/* — Statische PWA-Ressourcen (manifest, sw, icons) ──
  if (req.method === 'GET') {
    const MIME = {
      '.json': 'application/json',
      '.js':   'application/javascript; charset=utf-8',
      '.png':  'image/png',
      '.svg':  'image/svg+xml',
      '.ico':  'image/x-icon',
      '.webp': 'image/webp',
      '.ttf':  'font/truetype',
      '.woff': 'font/woff',
      '.woff2':'font/woff2',
    };
    const ext  = path.extname(url.pathname).toLowerCase();
    const mime = MIME[ext];
    if (mime) {
      // Pfad auf public/ beschränken (kein Path-Traversal)
      const rel  = url.pathname.replace(/^\/+/, '');
      const abs  = path.resolve(path.join(__dirname, 'public', rel));
      const base = path.resolve(path.join(__dirname, 'public'));
      if (abs.startsWith(base + path.sep) || abs === base) {
        try {
          const data = await fs.readFile(abs);
          const cacheCtl = ext === '.js' ? 'no-cache' : 'public, max-age=86400';
          res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': cacheCtl });
          res.end(data);
          return;
        } catch { /* nicht gefunden → 404 unten */ }
      }
    }
  }

  // ── 404 ───────────────────────────────────────────────────────────
  json(res, 404, { error: `Kein Handler für ${req.method} ${url.pathname}` });
}

// ------------------------------------------------------------------
// Hilfsfunktionen
// ------------------------------------------------------------------
function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ------------------------------------------------------------------
// Start
// ------------------------------------------------------------------
(async () => {
  await ensureDirs();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🌿 GartenMeister API Server  → Port ${PORT}`);
    console.log(`📁 Basispfad                 → ${BASE_PATH}`);
    console.log(`📷 Bild-Upload               → POST /api/image`);
    console.log(`🖼️  Bild-Abruf               → GET  /api/image?path=...`);
    console.log(`📋 Katalog                   → GET  /api/images`);
    console.log(`📄 Dokument-Upload           → POST /api/document`);
    console.log(`💾 Backup                    → POST /api/backup`);
    console.log(`💚 Health                    → GET  /api/health`);
    console.log(`📱 PWA Upload                → GET  /upload.html`);
  });
})();
