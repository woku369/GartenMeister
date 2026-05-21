// preload-about.js — Preload für das About-Fenster
const { contextBridge } = require('electron');

const appVersion = process.argv.find(a => a.startsWith('--app-version='))?.split('=')[1] || '—';

contextBridge.exposeInMainWorld('aboutInfo', {
  appVersion,
  electronVersion: process.versions.electron,
  nodeVersion:     process.versions.node,
  chromeVersion:   process.versions.chrome,
});
