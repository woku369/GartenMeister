# GartenMeister Datenspeicher-Strategie
# Multi-Tier Cloud-Sync Architektur

## 🎯 **Überblick der Lösung**

### **Tier 1: Lokale SQLite + File Storage (Primär)**
- SQLite-Datenbank für strukturierte Daten
- Lokaler File-Storage für Bilder/PDFs
- Sofortige Verfügbarkeit, offline-fähig

### **Tier 2: Cloud-Synchronisation (Flexibel)**
- **Option A**: OneDrive/Google Drive (Einfach)
- **Option B**: Firebase/Supabase (Professionell)
- **Option C**: Eigener Cloud-Server (Fortgeschritten)

### **Tier 3: Backup & Export (Sicherheit)**
- Automatische Cloud-Backups
- Export zu verschiedenen Formaten
- Disaster Recovery

## 🏗️ **Technische Architektur**

### **1. Lokale Datenbank (SQLite)**
```
gartenmeister.db
├── beds (Beet-Daten)
├── herb_varieties (Kräutersorten)
├── segments (Versuchsbeet-Segmente)
├── harvests (Ernte-Events)
├── weather_data (Wetterdaten)
├── photos (Foto-Metadaten)
├── routines (Routinen/Aufgaben)
├── sync_metadata (Cloud-Sync-Status)
└── settings (App-Konfiguration)
```

### **2. File Storage Struktur**
```
GartenMeister/
├── data/
│   ├── gartenmeister.db
│   └── sync/
│       ├── last_sync.json
│       └── conflict_resolution.json
├── media/
│   ├── photos/
│   │   ├── 2025/
│   │   │   ├── 06/
│   │   │   │   ├── garden_2025-06-18_001.jpg
│   │   │   │   └── harvest_2025-06-18_002.jpg
│   │   └── thumbnails/
│   ├── exports/
│   │   ├── pdf/
│   │   └── data/
│   └── backups/
├── temp/
└── logs/
```

### **3. Cloud-Synchronisation Optionen**

#### **Option A: OneDrive/Google Drive Integration** ⭐ **EMPFOHLEN**
```typescript
// Einfache Ordner-Synchronisation
const CLOUD_FOLDER = "OneDrive/GartenMeister/"
const SYNC_INTERVALS = {
  realtime: ["harvests", "photos"],
  hourly: ["weather_data", "routines"],
  daily: ["full_database_backup"]
}
```

#### **Option B: Firebase/Supabase** (Professionell)
```typescript
// Echtzeit-Datenbank mit Offline-Support
const FIREBASE_CONFIG = {
  collections: ["beds", "harvests", "weather"],
  storage: "photos_and_documents",
  realtime: true,
  offline: true
}
```

#### **Option C: Eigener Server** (Fortgeschritten)
```typescript
// REST API für eigenen Server
const API_ENDPOINTS = {
  sync: "/api/v1/sync",
  upload: "/api/v1/upload",
  download: "/api/v1/download"
}
```

## 🔄 **Synchronisations-Strategien**

### **1. Intelligente Sync (Conflict Resolution)**
```typescript
interface SyncStrategy {
  conflictResolution: "last_write_wins" | "user_choice" | "merge";
  priority: "local" | "cloud" | "timestamp";
  autoSync: boolean;
  syncOnClose: boolean;
}
```

### **2. Incremental Sync (Effizienz)**
```typescript
interface SyncMetadata {
  lastSyncTimestamp: string;
  changeLog: SyncChange[];
  deviceId: string;
  version: number;
}
```

### **3. Multi-Device Management**
```typescript
interface DeviceRegistry {
  devices: Device[];
  primaryDevice: string;
  syncConflicts: ConflictLog[];
}
```

## 📊 **Datentypen & Sync-Prioritäten**

### **Kritische Daten (Echtzeit-Sync)**
- ✅ Ernte-Events
- ✅ Neue Beete/Kräutersorten
- ✅ Wichtige Fotos
- ✅ Routinen-Updates

### **Wichtige Daten (Stündlich)**
- 🔄 Wetterdaten
- 🔄 Foto-Uploads
- 🔄 PDF-Exports
- 🔄 Einstellungen

### **Archiv-Daten (Täglich)**
- 📦 Vollständige DB-Backups
- 📦 Historische Daten
- 📦 Log-Dateien

## 🛡️ **Sicherheit & Datenschutz**

### **Verschlüsselung**
```typescript
const ENCRYPTION = {
  local: "AES-256 für lokale DB",
  transit: "TLS 1.3 für Cloud-Transfer",
  cloud: "Provider-native Encryption"
}
```

### **Backup-Strategien**
```typescript
const BACKUP_SCHEDULE = {
  incremental: "täglich",
  full: "wöchentlich", 
  archive: "monatlich",
  retention: "2 Jahre"
}
```

## 🎛️ **Konfigurierbare Sync-Optionen**

### **Benutzer-Einstellungen**
```typescript
interface CloudSyncSettings {
  provider: "onedrive" | "googledrive" | "firebase" | "custom";
  autoSync: boolean;
  syncInterval: number; // Minuten
  conflictResolution: ConflictStrategy;
  bandwidthLimit: number; // MB/Tag
  wifiOnly: boolean;
  compressionLevel: number;
}
```

## 🚀 **Implementierungs-Roadmap**

### **Phase 1: Lokale Basis** ✅
- SQLite-Integration
- File-Management
- Export-Funktionen

### **Phase 2: OneDrive-Sync** ⏳ **NÄCHSTER SCHRITT**
- Microsoft Graph API
- Ordner-Synchronisation
- Conflict Resolution

### **Phase 3: Multi-Provider** ⏳
- Google Drive-Support
- Provider-Auswahl in Settings
- Advanced Sync-Features

### **Phase 4: Enterprise** ⏳
- Firebase/Supabase-Integration
- Team-Kollaboration
- Web-Dashboard

## 💡 **Überraschungs-Features**

### **1. Intelligente Foto-Organisation**
```typescript
// AI-basierte Foto-Kategorisierung
const PHOTO_AI = {
  autoTagging: ["Kräutersorte", "Wachstumsstadium", "Krankheiten"],
  smartAlbums: ["Ernten 2025", "Wachstums-Zeitraffer", "Probleme"],
  duplicateDetection: true
}
```

### **2. Kollaborations-Features**
```typescript
// Mehrere Gärtner, ein Garten
const COLLABORATION = {
  sharedGardens: true,
  userRoles: ["Owner", "Editor", "Viewer"],
  commentSystem: true,
  changeTracking: true
}
```

### **3. Zeitreise-Funktion**
```typescript
// Garten-Historie durchblättern
const TIME_TRAVEL = {
  snapshotView: "Garten zu jedem Zeitpunkt",
  changeVisualization: "Was hat sich geändert",
  trendsAnalysis: "Entwicklungen über Zeit"
}
```

### **4. Smart Sync**
```typescript
// Intelligente Synchronisation
const SMART_SYNC = {
  predictiveSync: "Vorhersage welche Daten benötigt werden",
  adaptiveBandwidth: "Anpassung an Netzwerk-Bedingungen",
  offlineQueueing: "Automatischer Sync bei Verbindung"
}
```

## 🔧 **Empfohlene Lösung: OneDrive + SQLite**

### **Warum OneDrive?**
- ✅ **Einfache Integration** über Microsoft Graph API
- ✅ **Automatische Versionierung** durch OneDrive
- ✅ **Große Speicher-Kapazität** (Standard 5GB+)
- ✅ **Offline-Sync** durch OneDrive-Client
- ✅ **Plattform-übergreifend** (Windows/Mac/Linux)
- ✅ **Bereits bei vielen vorhanden**

### **Implementation**
```typescript
// OneDrive-Sync-Manager
class OneDriveSyncManager {
  async syncDatabase(): Promise<SyncResult>
  async uploadPhotos(): Promise<UploadResult>
  async resolveConflicts(): Promise<ConflictResult>
  async createBackup(): Promise<BackupResult>
}
```

## 📈 **Skalierbarkeit**

Das System kann stufenweise erweitert werden:
1. **Hobby-Gärtner**: OneDrive + lokale SQLite
2. **Gemeinschaftsgärten**: Firebase + Kollaboration
3. **Professionelle Betriebe**: Eigener Server + API

## 💰 **Kosten-Analyse**

| Lösung | Kosten | Komplexität | Features |
|--------|--------|-------------|----------|
| OneDrive | €2-7/Monat | Niedrig | Basis-Sync |
| Google Drive | €2-10/Monat | Niedrig | Basis-Sync |
| Firebase | €0-25/Monat | Mittel | Echtzeit |
| Eigener Server | €5-50/Monat | Hoch | Vollkontrolle |

Soll ich mit der **OneDrive-Integration** als nächstem Schritt beginnen? Das wäre die perfekte Balance zwischen Einfachheit und Funktionalität!
