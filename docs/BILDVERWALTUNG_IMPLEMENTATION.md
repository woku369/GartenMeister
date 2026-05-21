# Bildverwaltung Implementation Plan

## Phase 1: Backend-Erweiterung (1-2 Tage)

### 1.1 **NAS-Storage-Manager erweitern**
```javascript
// src/utils/nas-storage-manager.js
class NasStorageManager {
  constructor(nasConfig) {
    this.nasConfig = nasConfig;
    this.localCachePath = path.join(os.homedir(), 'AppData', 'Roaming', 'GartenMeister', 'image-cache');
  }

  async uploadImage(filePath, metadata) {
    // 1. Lokalen Cache erstellen
    // 2. Thumbnail generieren
    // 3. EXIF-Daten extrahieren
    // 4. NAS-Upload im Hintergrund
    // 5. Metadaten in Datenbank speichern
  }

  async syncWithNAS() {
    // Hintergrund-Synchronisation
  }
}
```

### 1.2 **Image-Metadata-Schema**
```typescript
interface ImageMetadata {
  id: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  takenDate: Date;
  uploadedBy: string;
  title: string;
  description: string;
  tags: string[];
  bedId?: string;
  plantType?: string;
  category: 'Wachstum' | 'Ernte' | 'Schädlinge' | 'Allgemein';
  location?: string;
  weather?: string;
  isFavorite: boolean;
  viewCount: number;
  comments: ImageComment[];
  paths: {
    original: string;
    thumbnail: string;
    medium: string;
    nas: string;
  };
  exif?: ExifData;
}
```

### 1.3 **Electron IPC-Handler erweitern**
```javascript
// In main.js
ipcMain.handle('image:upload', async (event, filePaths, metadata) => {
  return await imageManager.uploadMultiple(filePaths, metadata);
});

ipcMain.handle('image:getAll', async (event, filters) => {
  return await imageManager.getAllImages(filters);
});

ipcMain.handle('image:addComment', async (event, imageId, comment) => {
  return await imageManager.addComment(imageId, comment);
});

ipcMain.handle('image:batchImport', async (event, folderPath) => {
  return await imageManager.batchImportFromFolder(folderPath);
});
```

## Phase 2: Frontend-Komponenten (2-3 Tage)

### 2.1 **Upload-Komponente**
```tsx
// src/components/gallery/ImageUploader.tsx
export function ImageUploader({ bedId, onUploadComplete }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDrop = async (files: FileList) => {
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );
    
    await uploadImages(imageFiles);
  };

  return (
    <div className={`upload-zone ${dragActive ? 'active' : ''}`}>
      {/* Drag & Drop UI */}
      {/* Progress Bar */}
      {/* Preview Grid */}
    </div>
  );
}
```

### 2.2 **Gallery-Komponente erweitern**
```tsx
// src/components/gallery/GardenImageGallery.tsx
export function GardenImageGallery({ 
  bedId, 
  category, 
  showUpload = false,
  viewMode = 'grid' 
}) {
  const [images, setImages] = useState([]);
  const [filters, setFilters] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);

  return (
    <div className="gallery-container">
      {/* Filter Bar */}
      <ImageFilters filters={filters} onChange={setFilters} />
      
      {/* Upload Zone (wenn aktiviert) */}
      {showUpload && (
        <ImageUploader bedId={bedId} onUploadComplete={refreshImages} />
      )}
      
      {/* View Mode Toggle */}
      <ViewModeToggle mode={viewMode} onChange={setViewMode} />
      
      {/* Image Grid/List */}
      {viewMode === 'grid' ? (
        <ImageGrid images={filteredImages} onSelect={openLightbox} />
      ) : (
        <ImageList images={filteredImages} onSelect={openLightbox} />
      )}
      
      {/* Lightbox */}
      {showLightbox && (
        <ImageLightbox 
          image={selectedImage} 
          onClose={() => setShowLightbox(false)}
          onComment={addComment}
        />
      )}
    </div>
  );
}
```

### 2.3 **Image-Card-Komponente**
```tsx
// src/components/gallery/ImageCard.tsx
export function ImageCard({ image, onClick, showMetadata = true }) {
  return (
    <div className="image-card" onClick={() => onClick(image)}>
      <div className="image-container">
        <img 
          src={image.paths.thumbnail} 
          alt={image.title}
          loading="lazy"
        />
        {image.isFavorite && <StarIcon className="favorite-icon" />}
      </div>
      
      {showMetadata && (
        <div className="image-metadata">
          <h4>{image.title}</h4>
          <p className="description">{image.description}</p>
          <div className="tags">
            {image.tags.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
          <div className="stats">
            <span>{formatDate(image.takenDate)}</span>
            <span>{image.viewCount} Aufrufe</span>
            <span>{image.comments.length} Kommentare</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Phase 3: Such- und Filter-System (1-2 Tage)

### 3.1 **Advanced Search**
```tsx
// src/components/gallery/ImageSearch.tsx
export function ImageSearch({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    bedId: 'all',
    dateRange: { start: null, end: null },
    tags: [],
    uploadedBy: 'all',
    favorites: false
  });

  return (
    <div className="search-container">
      {/* Text Search */}
      <Input 
        placeholder="Suche nach Titel, Beschreibung, Tags..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      {/* Advanced Filters */}
      <Collapsible>
        <CollapsibleTrigger>Erweiterte Filter</CollapsibleTrigger>
        <CollapsibleContent>
          {/* Category Filter */}
          <Select value={filters.category} onValueChange={updateCategory}>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            <SelectItem value="Wachstum">Wachstum</SelectItem>
            <SelectItem value="Ernte">Ernte</SelectItem>
            <SelectItem value="Schädlinge">Schädlinge</SelectItem>
            <SelectItem value="Allgemein">Allgemein</SelectItem>
          </Select>
          
          {/* Date Range */}
          <DateRangePicker 
            value={filters.dateRange}
            onChange={updateDateRange}
          />
          
          {/* Bed Filter */}
          <BedSelector 
            value={filters.bedId}
            onChange={updateBed}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
```

### 3.2 **Smart Tagging**
```typescript
// Auto-Tagging basierend auf Metadaten
const generateAutoTags = (image: ImageMetadata): string[] => {
  const tags: string[] = [];
  
  // Datum-basierte Tags
  const date = new Date(image.takenDate);
  tags.push(
    `jahr-${date.getFullYear()}`,
    `monat-${date.getMonth() + 1}`,
    `saison-${getSeason(date)}`
  );
  
  // Beet-basierte Tags
  if (image.bedId) {
    tags.push(`beet-${image.bedId}`);
  }
  
  // Pflanzen-basierte Tags
  if (image.plantType) {
    tags.push(image.plantType.toLowerCase());
  }
  
  // Wetter-basierte Tags
  if (image.weather) {
    tags.push(...parseWeatherTags(image.weather));
  }
  
  // EXIF-basierte Tags
  if (image.exif) {
    if (image.exif.camera) tags.push(`kamera-${image.exif.camera}`);
    if (image.exif.lens) tags.push(`objektiv-${image.exif.lens}`);
  }
  
  return tags;
};
```

## Phase 4: Kommentar- und Bewertungs-System (1 Tag)

### 4.1 **Comment-System**
```tsx
// src/components/gallery/CommentSystem.tsx
export function CommentSystem({ imageId, comments, onAddComment }) {
  const [newComment, setNewComment] = useState('');
  const [author, setAuthor] = useState(getCurrentUser());

  return (
    <div className="comments-section">
      <h3>Kommentare ({comments.length})</h3>
      
      {/* Add Comment */}
      <div className="add-comment">
        <Textarea 
          placeholder="Kommentar hinzufügen..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button onClick={handleAddComment}>
          Kommentar hinzufügen
        </Button>
      </div>
      
      {/* Comments List */}
      <div className="comments-list">
        {comments.map(comment => (
          <CommentCard key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}
```

### 4.2 **Rating System (Optional)**
```tsx
// src/components/gallery/ImageRating.tsx
export function ImageRating({ imageId, currentRating, onRate }) {
  return (
    <div className="rating-system">
      <span>Bewertung:</span>
      {[1, 2, 3, 4, 5].map(star => (
        <Star 
          key={star}
          filled={star <= currentRating}
          onClick={() => onRate(star)}
        />
      ))}
    </div>
  );
}
```

## Phase 5: NAS-Integration (2-3 Tage)

### 5.1 **Background Sync Service**
```javascript
// src/services/image-sync-service.js
class ImageSyncService {
  constructor() {
    this.syncQueue = [];
    this.isRunning = false;
    this.syncInterval = 30000; // 30 Sekunden
  }

  async startAutoSync() {
    setInterval(async () => {
      if (!this.isRunning && this.syncQueue.length > 0) {
        await this.processSyncQueue();
      }
    }, this.syncInterval);
  }

  async processSyncQueue() {
    this.isRunning = true;
    
    while (this.syncQueue.length > 0) {
      const task = this.syncQueue.shift();
      try {
        await this.processSyncTask(task);
      } catch (error) {
        console.error('Sync task failed:', error);
        // Retry logic hier
      }
    }
    
    this.isRunning = false;
  }
}
```

### 5.2 **Thumbnail Generation**
```javascript
// src/utils/thumbnail-generator.js
const sharp = require('sharp');

class ThumbnailGenerator {
  static async generateThumbnails(imagePath) {
    const baseName = path.basename(imagePath, path.extname(imagePath));
    const outputDir = path.join(CACHE_DIR, 'thumbnails');
    
    const sizes = {
      small: { width: 150, height: 150 },
      medium: { width: 400, height: 400 },
      large: { width: 800, height: 800 }
    };
    
    const thumbnails = {};
    
    for (const [size, dimensions] of Object.entries(sizes)) {
      const outputPath = path.join(outputDir, `${baseName}-${size}.jpg`);
      
      await sharp(imagePath)
        .resize(dimensions.width, dimensions.height, { 
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toFile(outputPath);
      
      thumbnails[size] = outputPath;
    }
    
    return thumbnails;
  }
}
```

## Phase 6: Performance-Optimierung (1 Tag)

### 6.1 **Virtual Scrolling**
```tsx
// src/components/gallery/VirtualizedImageGrid.tsx
import { FixedSizeGrid as Grid } from 'react-window';

export function VirtualizedImageGrid({ images, onImageClick }) {
  const itemSize = 250; // Größe der Image-Cards
  const columnCount = Math.floor(containerWidth / itemSize);
  
  const ImageGridItem = ({ columnIndex, rowIndex, style }) => {
    const imageIndex = rowIndex * columnCount + columnIndex;
    const image = images[imageIndex];
    
    if (!image) return null;
    
    return (
      <div style={style}>
        <ImageCard image={image} onClick={onImageClick} />
      </div>
    );
  };
  
  return (
    <Grid
      columnCount={columnCount}
      columnWidth={itemSize}
      height={600}
      rowCount={Math.ceil(images.length / columnCount)}
      rowHeight={itemSize}
      width={containerWidth}
    >
      {ImageGridItem}
    </Grid>
  );
}
```

### 6.2 **Lazy Loading & Caching**
```typescript
// src/hooks/useImageCache.ts
export function useImageCache() {
  const [cache, setCache] = useState(new Map());
  
  const loadImage = useCallback(async (imagePath: string) => {
    if (cache.has(imagePath)) {
      return cache.get(imagePath);
    }
    
    const imageBlob = await fetch(imagePath).then(r => r.blob());
    const imageUrl = URL.createObjectURL(imageBlob);
    
    setCache(prev => new Map(prev).set(imagePath, imageUrl));
    return imageUrl;
  }, [cache]);
  
  return { loadImage, clearCache: () => setCache(new Map()) };
}
```

## Zeitplan & Ressourcen

### **Entwicklungsplan (7-10 Tage)**
- **Tag 1-2:** Backend-Erweiterung + NAS-Manager
- **Tag 3-5:** Frontend-Komponenten (Upload, Gallery, Search)
- **Tag 6-7:** NAS-Integration + Sync-Service
- **Tag 8-9:** Performance-Optimierung + Testing
- **Tag 10:** Dokumentation + Deployment

### **Testing-Strategie**
- **Unit Tests:** Jede Komponente einzeln testen
- **Integration Tests:** NAS-Kommunikation testen
- **Performance Tests:** Große Bildmengen (1000+ Bilder)
- **User Testing:** Upload-Workflow mit echten Nutzern

### **Deployment-Vorbereitung**
- **Electron-Build erweitern** um Image-Management
- **NAS-Konfiguration** als Setup-Wizard
- **Migration-Skript** für bestehende Installationen

**Soll ich mit der Implementierung beginnen oder haben Sie spezielle Prioritäten?**
