const { execSync } = require('child_process');

function beforePack(context) {
  // Erstelle leere Verzeichnisse für problematische Sharp-Pakete
  try {
    execSync('node scripts/clean-sharp-for-build.js', { stdio: 'inherit' });
  } catch (error) {
    console.log('Warning: Sharp cleanup script failed:', error.message);
  }
  
  return Promise.resolve();
}

module.exports = {
  appId: "de.gartenmeister.desktop",
  productName: "GartenMeister",
  copyright: "Copyright © 2024 GartenMeister",
  directories: {
    output: "dist",
    buildResources: "build"
  },
  files: [
    "src/**/*",
    ".next/**/*",
    "package.json",
    "node_modules/next/**/*",
    "node_modules/react/**/*",
    "node_modules/react-dom/**/*",
    "node_modules/@next/**/*",
    "node_modules/styled-jsx/**/*",
    "data-backups/**/*",
    "!**/node_modules/@swc/**/*",
    "!**/node_modules/sharp/**/*",
    "!**/*.ts",
    "!**/*.map",
    "!.git/**/*",
    "!.next/cache/**/*",
    "!**/test/**/*",
    "!**/*.test.*",
    "!**/*.spec.*"
  ],
  asarUnpack: [
    "node_modules/next/**/*",
    "node_modules/@next/**/*",
    "node_modules/react/**/*",
    "node_modules/react-dom/**/*",
    "node_modules/styled-jsx/**/*",
    ".next/**/*"
  ],
  beforePack: beforePack,
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64"]
      }
    ],
    icon: "src/app/GartenMeister-icon.ico",
    requestedExecutionLevel: "asInvoker",
    signAndEditExecutable: false,
    verifyUpdateCodeSignature: false
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: "src/app/GartenMeister-icon.ico",
    uninstallerIcon: "src/app/GartenMeister-icon.ico",
    artifactName: "GartenMeister-Setup-${version}.exe",
    deleteAppDataOnUninstall: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "GartenMeister"
  },
  mac: {
    target: [
      {
        target: "dmg",
        arch: ["x64", "arm64"]
      }
    ],
    icon: "src/app/GartenMeister-icon-512.png"
  },
  linux: {
    target: [
      {
        target: "AppImage",
        arch: ["x64"]
      }
    ],
    icon: "src/app/GartenMeister-icon-512.png"
  }
};
