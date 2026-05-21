/**
 * Document Manager — GartenMeister
 * Verwaltet Dokumente (PDF, JPG) lokal und auf dem NAS-Server.
 * DB.3
 */

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');

class DocumentManager {
  constructor(basePath = null) {
    this.basePath     = basePath || this.getDefaultBasePath();
    this.catalogPath  = path.join(this.basePath, 'document-catalog.json');
    this.docsPath     = path.join(this.basePath, 'documents');
    this.nasApiUrl    = null; // wird von außen gesetzt via setNasUrl()
    this.ensureDirs();
  }

  getDefaultBasePath() {
    try {
      return path.join(app.getPath('userData'), 'gartenmeister-docs');
    } catch {
      return path.join(process.cwd(), 'gartenmeister-docs');
    }
  }

  ensureDirs() {
    [this.basePath, this.docsPath,
     path.join(this.docsPath, 'invoice'),
     path.join(this.docsPath, 'delivery-note'),
     path.join(this.docsPath, 'other'),
    ].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });
  }

  setNasUrl(url) {
    this.nasApiUrl = url || null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Katalog
  // ─────────────────────────────────────────────────────────────────────────

  loadCatalog() {
    try {
      if (fs.existsSync(this.catalogPath)) {
        return JSON.parse(fs.readFileSync(this.catalogPath, 'utf8'));
      }
    } catch { /* leer */ }
    return [];
  }

  saveCatalog(catalog) {
    const existing = this.loadCatalog();
    if (existing.length > 0 && catalog.length === 0) {
      throw new Error('DATENVERLUST-SCHUTZ: Katalog-Löschung blockiert');
    }
    fs.writeFileSync(this.catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Dokument hochladen.
   * uploadData: { documentType, name, dataUrl, description?, tags?, uploadedBy? }
   */
  async upload(uploadData) {
    const { documentType = 'other', name = 'dokument', dataUrl, description = '', tags = [], uploadedBy = 'Benutzer' } = uploadData;

    if (!dataUrl) throw new Error('dataUrl fehlt');

    const mimeMatch = dataUrl.match(/^data:([^;]+);/);
    const mime = mimeMatch?.[1] ?? 'application/pdf';
    const extMap = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png' };
    const ext = extMap[mime] ?? 'pdf';

    const safeName = name.replace(/[^a-zA-Z0-9_\-äöüÄÖÜß .]/g, '_').substring(0, 80);
    const id = crypto.randomUUID();
    const filename = `${Date.now()}_${id.slice(0, 8)}_${safeName}.${ext}`;
    const relPath   = `${documentType}/${filename}`;
    const fullPath  = path.join(this.docsPath, relPath);

    const buffer = Buffer.from(dataUrl.replace(/^data:[^;]+;base64,/, ''), 'base64');
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, buffer);

    /** @type {DocumentMetadataEntry} */
    const entry = {
      id,
      documentType,
      name: safeName,
      originalName: name,
      filePath: relPath,
      mimeType: mime,
      fileExt: ext,
      sizeBytes: buffer.length,
      uploadedAt: new Date().toISOString(),
      uploadedBy,
      description,
      tags,
      isNas: false,
      nasFilePath: null,
    };

    // NAS-Upload (parallel, non-blocking – Fehler ignoriert)
    if (this.nasApiUrl) {
      try {
        const res = await fetch(`${this.nasApiUrl}/api/document`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentType, name, dataUrl }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            entry.isNas = true;
            entry.nasFilePath = data.file_path;
          }
        }
      } catch (e) {
        console.warn('[DocumentManager] NAS-Upload fehlgeschlagen (Fallback lokal):', e.message);
      }
    }

    const catalog = this.loadCatalog();
    catalog.push(entry);
    this.saveCatalog(catalog);

    console.log(`[DocumentManager] ✅ Dokument gespeichert: ${relPath}`);
    return entry;
  }

  /**
   * Alle Dokumente (optional gefiltert).
   */
  getList(options = {}) {
    let catalog = this.loadCatalog();
    if (options.documentType) catalog = catalog.filter(d => d.documentType === options.documentType);
    if (options.uploadedBy)   catalog = catalog.filter(d => d.uploadedBy   === options.uploadedBy);
    catalog.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    return catalog;
  }

  /**
   * Einzelnes Dokument als Base64-Buffer abrufen.
   */
  getFile(documentId) {
    const catalog = this.loadCatalog();
    const entry = catalog.find(d => d.id === documentId);
    if (!entry) throw new Error(`Dokument ${documentId} nicht gefunden`);

    const fullPath = path.join(this.docsPath, entry.filePath);
    if (!fs.existsSync(fullPath)) throw new Error(`Datei nicht gefunden: ${entry.filePath}`);

    const buffer = fs.readFileSync(fullPath);
    return {
      ...entry,
      dataUrl: `data:${entry.mimeType};base64,${buffer.toString('base64')}`,
    };
  }

  /**
   * Dokument löschen.
   */
  delete(documentId) {
    const catalog = this.loadCatalog();
    const idx = catalog.findIndex(d => d.id === documentId);
    if (idx < 0) throw new Error(`Dokument ${documentId} nicht gefunden`);

    const entry = catalog[idx];
    const fullPath = path.join(this.docsPath, entry.filePath);
    try { fs.unlinkSync(fullPath); } catch { /* ignorieren */ }

    catalog.splice(idx, 1);
    this.saveCatalog(catalog);
    return true;
  }
}

module.exports = DocumentManager;
