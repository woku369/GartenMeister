/**
 * NAS API Client — GartenMeister
 * HTTP-Client für den GartenMeister NAS-Server (nas/server-gartenmeister.js, Port 3003).
 * DB.5
 */

class NasApiClient {
  /**
   * @param {string} baseUrl  z. B. "http://100.64.0.1:3003"
   */
  constructor(baseUrl) {
    this.baseUrl = baseUrl?.replace(/\/$/, '') ?? '';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Hilfsmethoden
  // ─────────────────────────────────────────────────────────────────────────

  async _post(endpoint, body) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`NAS ${endpoint}: HTTP ${response.status} — ${text}`);
    }
    return response.json();
  }

  async _get(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      throw new Error(`NAS ${endpoint}: HTTP ${response.status}`);
    }
    return response.json();
  }

  async _delete(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`NAS DELETE ${endpoint}: HTTP ${response.status}`);
    return response.json();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Health
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Verbindungstest. Liefert { status:'ok', ... } oder wirft.
   */
  async health() {
    return this._get('/api/health');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Bilder
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Bild hochladen.
   * @param {{ dataUrl: string, category?: string, bedId?: string, title?: string, tags?: string[] }} payload
   */
  uploadImage(payload) {
    return this._post('/api/image', payload);
  }

  /** Bild-Metadaten abrufen. */
  getImage(imageId) {
    return this._get(`/api/image?id=${encodeURIComponent(imageId)}`);
  }

  /** Bild löschen. */
  deleteImage(imageId) {
    return this._delete(`/api/image?id=${encodeURIComponent(imageId)}`);
  }

  /** Alle Bilder (optional gefiltert). */
  getImages(options = {}) {
    const params = new URLSearchParams();
    if (options.category) params.set('category', options.category);
    if (options.bedId)    params.set('bedId',    options.bedId);
    if (options.limit)    params.set('limit',    String(options.limit));
    const qs = params.toString();
    return this._get(`/api/images${qs ? '?' + qs : ''}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Dokumente
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Dokument hochladen.
   * @param {{ documentType: string, name: string, dataUrl: string }} payload
   */
  uploadDocument(payload) {
    return this._post('/api/document', payload);
  }

  /**
   * Dokument-Liste abrufen (nur Metadaten aus document-catalog).
   */
  getDocuments(opts = {}) {
    const params = new URLSearchParams();
    if (opts.documentType) params.set('type', opts.documentType);
    const qs = params.toString();
    return this._get(`/api/documents${qs ? '?' + qs : ''}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // JSON-Datenverwaltung (generisch)
  // ─────────────────────────────────────────────────────────────────────────

  /** JSON-Datei vom NAS lesen. */
  readJson(key) {
    return this._get(`/api/json?key=${encodeURIComponent(key)}`);
  }

  /** JSON-Datei auf NAS schreiben. */
  writeJson(key, data) {
    return this._post('/api/json', { key, data });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Backup
  // ─────────────────────────────────────────────────────────────────────────

  createBackup() {
    return this._post('/api/backup', {});
  }

  listBackups() {
    return this._get('/api/backups');
  }
}

module.exports = NasApiClient;
