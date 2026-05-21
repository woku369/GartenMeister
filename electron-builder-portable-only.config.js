module.exports = {
  appId: "de.gartenmeister.portable",
  productName: "GartenMeister-Portable",
  copyright: "Copyright © 2025 GartenMeister",
  icon: "build/icon.ico",
  asar: true, // ASAR aktivieren für bessere Performance
  asarUnpack: [
    "src/preload.js", // Preloader MUSS ausgepackt bleiben
    "out/**/*", // Next.js Static Export muss ausgepackt bleiben
    "data/**/*", // Daten-Dateien ausgepackt lassen
    "src/simple-pdf-generator*.js", // PDF-Generator Module ausgepackt lassen
    "src/pdf-generator.js",
    "src/advanced-pdf-generator.js",
    "src/vfs_fonts.js"
    // Puppeteer NICHT im asarUnpack – zu groß (Chromium ~400MB), Electron-Fallback wird verwendet
  ],
  directories: {
    output: "GartenMeister-v2.0-Portable"
  },
  files: [
    "src/index-portable.js", // NEXT.JS VERSION FÜR PRODUCTION
    "src/preload.js",
    "src/portable-app.html", // Fallback Test-Seite
    "src/garten-overview.html", // Hauptanwendung: Gartenübersicht
    "src/electron-menu.js",
    "src/utils/**/*",
    // PDF-Generator Module explizit einschließen
    "src/simple-pdf-generator-improved.js",
    "src/simple-pdf-generator-safe.js",
    "src/simple-pdf-generator.js",
    "src/pdf-generator.js",
    "src/advanced-pdf-generator.js",
    "src/vfs_fonts.js",
    "package.json",
    "data/**/*",
    "out/**/*", // Next.js Static Export einschließen
    // ── BUILD-TIME-ONLY: Wurden nach devDependencies verschoben → werden von
    // electron-builder automatisch ignoriert. Nur noch native Module ausschließen.
    // ── SHARP: native Bildverarbeitung, nicht für Portable benötigt ──────────
    "!**/node_modules/sharp/**/*",
    "!**/node_modules/@img/**/*",
    "!**/node_modules/@emnapi/**/*",
    "!**/node_modules/**/*darwin*/**/*",
    "!**/node_modules/**/*linux*/**/*",
    "!**/node_modules/**/*arm64*/**/*",
    "!**/*darwin*",
    "!**/*linux*",
    "!**/*arm64*",
    // ── Puppeteer/Cache ausschließen (falls noch in node_modules/.cache) ─────
    "!**/node_modules/.cache/**/*",
    // ── Quell-Dateien ausschließen ───────────────────────────────────────────
    "!src/index.js",
    "!src/index-debug.js",
    "!src/index-old-*.js",
    "!src/index-production.js",
    "!.next/**/*",
    "!src/app/**/*",
    "!**/*.ts",
    "!**/*.map",
    "!.git/**/*",
    "!debug-*.js",
    "!test-*.js",
    "!fix-*.js",
    "!check-*.js",
    "!migrate-*.js",
    "!*.md",
    "!*.bat",
    "!*.ps1"
  ],
  extraResources: [
    {
      from: 'data-backups/',
      to: 'data-backups/',
      filter: ['**/*']
    },
    {
      from: 'build/icon.ico',
      to: 'icon.ico'
    }
  ],
  win: {
    target: [
      {
        target: "portable",
        arch: ["x64"]
      }
    ],
    artifactName: "${productName}-${version}-Portable.${ext}",
    forceCodeSigning: false,
    signAndEditExecutable: false
  },
  portable: {
    artifactName: "${productName}-${version}-Portable.${ext}"
  },
  // "store" = kein 7-zip → schnellster Build (größere EXE); "normal" für Distribution
  compression: "normal",
  
  // Code-Signing komplett deaktivieren
  afterSign: null,
  afterAllArtifactBuild: null,
  
  // SHARP-HOOK: Prüfe ob Sharp fälschlicherweise ins App-Verzeichnis kopiert wurde
  // WICHTIG: Löscht NICHT aus node_modules (würde npm install erfordern)
  beforePack: async (context) => {
    console.log('🧹 beforePack: Sharp/Puppeteer werden per files-Exclude-Regeln herausgefiltert.');
    // Kein manuelles Löschen nötig – die !-Regeln in files[] erledigen das zuverlässiger
  }
};
