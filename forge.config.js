const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: "GartenMeister",
    icon: './src/app/favicon.ico',
    appBundleId: 'com.gartenmeister.app',
    name: "GartenMeister",
    productName: "GartenMeister",
    win32metadata: {
      ProductName: "GartenMeister",
      CompanyName: "GartenMeister Team",
      FileDescription: "GartenMeister Verwaltungsanwendung",
      Authors: "GartenMeister Team",
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        authors: 'GartenMeister Team',
        description: 'GartenMeister - Moderne Gartenverwaltung mit Bilderdokumentation',
        name: 'GartenMeister',
        setupExe: 'GartenMeister-Setup.exe',
        setupMsi: 'GartenMeister-Setup.msi',
        iconUrl: 'https://raw.githubusercontent.com/electron/electron/main/docs/images/electron-icon.png',
        setupIcon: './src/app/favicon.ico',
        noMsi: true, // Nur .exe, kein MSI
        remoteReleases: false, // Für lokale Installation
        signWithParams: false, // Für unsigned builds
        certificateFile: undefined, // Kein Code-Signing
        certificatePassword: undefined,
        // Auto-Update URLs (später für Update-System)
        remoteToken: undefined,
        // Installer-Optionen
        loadingGif: undefined, // Optional: Loading-Animation hinzufügen
        setupMsi: undefined, // Deaktiviert MSI
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
      config: {
        // ZIP als Backup-Option
      }
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
