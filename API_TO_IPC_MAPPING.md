# 📋 API-ROUTES → IPC-CALLS MAPPING

**Zweck**: Dokumentation aller entfernten API-Routes und deren IPC-Ersatz für Feature-Parität

## 🚀 ÜBERBLICK

**Status**: 18 API-Routes temporär entfernt für Static Export  
**Ersatz**: IPC-Calls über `electronAPI` Bridge  
**Priorität**: Kritisch für vollständige Feature-Parität

---

## 📝 API-ROUTE MAPPING

### 🌱 **BEET-MANAGEMENT**
```typescript
// VORHER: API Routes
POST   /api/beds/           → createBed()
GET    /api/beds/           → getBeds()  
GET    /api/beds/[id]       → getBed(id)
PUT    /api/beds/[id]       → updateBed(id, data)
DELETE /api/beds/[id]       → deleteBed(id)

// NACHHER: IPC Calls
electronAPI.beds.create(bedData)
electronAPI.beds.getAll()
electronAPI.beds.getById(id)
electronAPI.beds.update(id, data)
electronAPI.beds.delete(id)
```

### 🌿 **KRÄUTER-MANAGEMENT**
```typescript
// VORHER: API Routes
POST   /api/herbs/          → createHerb()
GET    /api/herbs/          → getHerbs()
PUT    /api/herbs/[id]      → updateHerb(id, data)
DELETE /api/herbs/[id]      → deleteHerb(id)

// NACHHER: IPC Calls
electronAPI.herbs.create(herbData)
electronAPI.herbs.getAll()
electronAPI.herbs.update(id, data)
electronAPI.herbs.delete(id)
```

### 📊 **ERNTE-SYSTEM**
```typescript
// VORHER: API Routes
POST   /api/harvests/       → createHarvest()
GET    /api/harvests/       → getHarvests()
POST   /api/harvest-events/ → createHarvestEvent()
GET    /api/harvest-events/ → getHarvestEvents()

// NACHHER: IPC Calls
electronAPI.harvests.create(harvestData)
electronAPI.harvests.getAll()
electronAPI.harvestEvents.create(eventData)
electronAPI.harvestEvents.getAll()
```

### 🔧 **SEGMENTE & KOMBINATIONSBEETE**
```typescript
// VORHER: API Routes
POST   /api/segments/       → createSegment()
GET    /api/segments/       → getSegments()
PUT    /api/segments/[id]   → updateSegment(id, data)
DELETE /api/segments/[id]   → deleteSegment(id)

// NACHHER: IPC Calls
electronAPI.segments.create(segmentData)
electronAPI.segments.getAll()
electronAPI.segments.update(id, data)
electronAPI.segments.delete(id)
```

### 📁 **SYSTEM & DATEI-MANAGEMENT**
```typescript
// VORHER: API Routes
POST   /api/backup/         → createBackup()
POST   /api/restore/        → restoreBackup()
GET    /api/export/pdf      → exportPDF()

// NACHHER: IPC Calls
electronAPI.system.createBackup()
electronAPI.system.restoreBackup(filePath)
electronAPI.pdf.export(data)
```

---

## 🔄 IMPLEMENTIERUNGS-STRATEGIE

### Phase 3.1: Core Data Loading
1. **Ersetze alle `fetch('/api/...`** Calls in Components
2. **Implementiere Error Handling** für IPC-Calls
3. **Teste CRUD-Operationen** einzeln

### Phase 3.2: Form Submissions
1. **Server Actions → IPC Actions** konvertieren
2. **Formulare mit IPC** verbinden
3. **Validation & Feedback** implementieren

### Phase 3.3: Real-time Updates
1. **State Management** für IPC-Daten
2. **Re-fetching Strategien** nach Mutations
3. **Optimistic Updates** implementieren

---

## 🧪 VALIDIERUNGS-CHECKLISTE

### Für jede API-Route:
- [ ] **IPC-Equivalent** existiert in `electron-bridge.ts`
- [ ] **Frontend Component** verwendet IPC statt fetch
- [ ] **Error Handling** implementiert
- [ ] **Loading States** funktional
- [ ] **Data Persistence** über IPC validated

### Test-Szenarien:
- [ ] **Create**: Neue Daten erstellen
- [ ] **Read**: Daten laden und anzeigen  
- [ ] **Update**: Bestehende Daten ändern
- [ ] **Delete**: Daten löschen
- [ ] **Edge Cases**: Fehlerbehandlung, leere Daten

---

## 📊 FORTSCHRITT-TRACKING

**Gesamt**: 18 API-Routes → 18 IPC-Calls  
**Status**: 0/18 konvertiert

### Priorität 1 (Sofort nach Phase 2):
- [ ] `/api/beds/` - Beet-Management (5 Routes)
- [ ] `/api/herbs/` - Kräuter-Management (4 Routes)

### Priorität 2 (Core Features):
- [ ] `/api/segments/` - Segmente (4 Routes) 
- [ ] `/api/harvests/` - Ernte-System (4 Routes)

### Priorität 3 (Extended Features):
- [ ] `/api/backup/` - Backup-System (1 Route)

**Ziel**: 100% API → IPC Konvertierung für vollständige Offline-Funktionalität
