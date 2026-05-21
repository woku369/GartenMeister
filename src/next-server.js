// src/next-server.js
// Embedded Next.js Server für Electron

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

class NextServer {
  constructor() {
    this.server = null;
    this.port = 9003; // Anderer Port als Dev-Server
    this.app = null;
    this.handle = null;
  }

  async start() {
    try {
      console.log('Starting embedded Next.js server...');
      
      // Next.js App erstellen
      this.app = next({ 
        dev: false, 
        dir: path.join(__dirname, '..'),
        quiet: true
      });
      
      this.handle = this.app.getRequestHandler();
      
      // App vorbereiten
      await this.app.prepare();
      
      // HTTP Server erstellen
      this.server = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        this.handle(req, res, parsedUrl);
      });
      
      // Server starten
      await new Promise((resolve, reject) => {
        this.server.listen(this.port, (err) => {
          if (err) {
            reject(err);
          } else {
            console.log(`> Ready on http://localhost:${this.port}`);
            resolve();
          }
        });
      });
      
      return `http://localhost:${this.port}`;
    } catch (error) {
      console.error('Failed to start Next.js server:', error);
      throw error;
    }
  }

  async stop() {
    if (this.server) {
      console.log('Stopping embedded Next.js server...');
      this.server.close();
      this.server = null;
    }
    if (this.app) {
      await this.app.close();
      this.app = null;
    }
  }

  getUrl() {
    return `http://localhost:${this.port}`;
  }
}

module.exports = { NextServer };
