/**
 * React Komponente für die Bildersammlung
 * Chronologische Verwaltung von Gartenfotos mit Kommentaren
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Calendar, 
  MessageSquare, 
  Heart, 
  Eye, 
  Filter, 
  Grid, 
  List, 
  Search,
  Download,
  Edit,
  Trash2,
  Star,
  Archive,
  Image as ImageIcon,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Image from 'next/image';

interface ImageMetadata {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadDate: string;
  takenDate: string;
  uploadedBy: string;
  title: string;
  description: string;
  tags: string[];
  bedId?: string;
  plantType: string;
  category: string;
  location: string;
  weather: string;
  isArchived: boolean;
  isFavorite: boolean;
  viewCount: number;
  lastViewed?: string;
  comments: Comment[];
  ratings: Rating[];
  // EXIF und Datum-Metadaten
  _dateEstimated?: boolean;
  _dateSource?: string;
}

interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  isEdited: boolean;
  editHistory: any[];
}

interface Rating {
  author: string;
  rating: number;
  timestamp: string;
}

interface GardenImageGalleryProps {
  bedId?: string;
  category?: string;
  showUpload?: boolean;
}

export default function GardenImageGallery({ 
  bedId, 
  category, 
  showUpload = true 
}: GardenImageGalleryProps) {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageMetadata[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPlantType, setEditPlantType] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWeather, setEditWeather] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'takenDate' | 'uploadDate' | 'title' | 'viewCount'>('takenDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState<string>('Lädt...');
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  // Bild-URLs für alle Bilder laden
  const loadImageUrls = async (imageList: ImageMetadata[]) => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI?.images?.getFileUrl) {
        const urlPromises = imageList.map(async (image) => {
          try {
            // Verwende imageId für den IPC-Handler (Backend löst das über getImageById auf)
            const url = await window.electronAPI.images.getFileUrl(image.id);
            return { id: image.id, url };
          } catch (error) {
            console.error(`Fehler beim Laden der URL für Bild ${image.id}:`, error);
            return { id: image.id, url: null };
          }
        });
        
        const urlResults = await Promise.all(urlPromises);
        const urlMap: Record<string, string> = {};
        
        urlResults.forEach(({ id, url }) => {
          if (url) {
            urlMap[id] = url;
          }
        });
        
        setImageUrls(urlMap);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Bild-URLs:', error);
    }
  };

  // Aktuellen Benutzer laden
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        if (typeof window !== 'undefined' && window.electronAPI?.users) {
          const user = await window.electronAPI.users.getCurrent();
          setCurrentUser(user?.name || 'Unbekannter Benutzer');
        } else {
          setCurrentUser('Entwicklungsmodus');
        }
      } catch (error) {
        console.error('Fehler beim Laden des Benutzers:', error);
        setCurrentUser('Fehler beim Laden');
      }
    };
    
    loadCurrentUser();
  }, []);

  // Bilder laden
  const loadImages = useCallback(async () => {
    try {
      // Prüfen ob Electron-API verfügbar ist
      if (typeof window !== 'undefined' && window.electronAPI?.images) {
        const options = {
          bedId,
          category: category !== 'all' ? category : undefined,
          sortBy,
          sortOrder,
          includeArchived: false
        };
        
        const loadedImages = await window.electronAPI.images.getAll(options);
        setImages(loadedImages);
        
        // Bild-URLs für alle geladenen Bilder abrufen
        await loadImageUrls(loadedImages);
        return;
      }
      
      // Fallback: Dummy-Daten für Entwicklung ohne Electron
      const dummyImages: ImageMetadata[] = [
        {
          id: 'img-1',
          originalName: 'tomaten-wachstum.jpg',
          fileName: 'img-1.jpg',
          filePath: '/path/to/img-1.jpg',
          fileSize: 2048576,
          mimeType: 'image/jpeg',
          uploadDate: '2025-07-05T10:30:00Z',
          takenDate: '2025-07-05T08:15:00Z',
          uploadedBy: 'Max Mustermann',
          title: 'Tomatenwachstum nach 4 Wochen',
          description: 'Die Tomaten entwickeln sich prächtig, erste Blüten sind sichtbar.',
          tags: ['Tomaten', 'Wachstum', 'Beet1'],
          bedId: 'bed-1',
          plantType: 'Tomaten',
          category: 'Wachstum',
          location: 'Beet 1, Südseite',
          weather: 'Sonnig, 24°C',
          isArchived: false,
          isFavorite: true,
          viewCount: 15,
          lastViewed: '2025-07-06T09:30:00Z',
          comments: [
            {
              id: 'comment-1',
              text: 'Sehen wirklich gesund aus! Wann denkst du wird die erste Ernte sein?',
              author: 'Anna Schmidt',
              timestamp: '2025-07-05T14:20:00Z',
              isEdited: false,
              editHistory: []
            }
          ],
          ratings: []
        },
        // Weitere Dummy-Bilder...
      ];
      
      setImages(dummyImages);
    } catch (error) {
      console.error('Fehler beim Laden der Bilder:', error);
    }
  }, [bedId, category, sortBy, sortOrder]);

  // Filter und Suche anwenden
  useEffect(() => {
    let filtered = [...images];

    // Textsuche
    if (searchTerm) {
      filtered = filtered.filter(img => 
        img.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        img.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Kategorie-Filter (normalisiert)
    if (filterCategory && filterCategory !== 'all') {
      filtered = filtered.filter(img => normCategory(img.category) === filterCategory);
    }

    setFilteredImages(filtered);
  }, [images, searchTerm, filterCategory]);

  // Initial laden
  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Bild öffnen und Edit-State setzen
  const openImage = (image: ImageMetadata) => {
    setSelectedImage(image);
    setIsEditMode(false);
    setEditTitle(image.title || '');
    setEditDescription(image.description || '');
    setEditTags((image.tags || []).join(', '));
    setEditCategory(normCategory(image.category));
    setEditPlantType(image.plantType || '');
    setEditLocation(image.location || '');
    setEditWeather(image.weather || '');
    setEditError('');
  };

  // Englische Kategorie-Werte auf Deutsche normalisieren
  const normCategory = (cat: string): string => {
    const map: Record<string, string> = {
      garden: 'Allgemein', bed: 'Allgemein', harvest: 'Ernte',
      growth: 'Wachstum', pest: 'Schädlinge'
    };
    return map[cat?.toLowerCase()] ?? cat ?? 'Allgemein';
  };

  // Metadaten speichern
  const saveEdit = async () => {
    if (!selectedImage) return;
    setIsSavingEdit(true);
    setEditError('');
    try {
      const tags = editTags.split(',').map(t => t.trim()).filter(Boolean);
      const updates = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        tags,
        category: editCategory,
        plantType: editPlantType.trim(),
        location: editLocation.trim(),
        weather: editWeather.trim()
      };
      const result = await window.electronAPI?.images?.updateMetadata?.(selectedImage.id, updates);
      if (result?.success === false) throw new Error(result.error ?? 'Unbekannter Fehler');
      // Lokales State-Update
      const updated = { ...selectedImage, ...updates };
      setSelectedImage(updated);
      setImages(prev => prev.map(img => img.id === selectedImage.id ? updated : img));
      setIsEditMode(false);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Datei-Upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      // Prüfen ob Electron-API verfügbar ist
      if (typeof window !== 'undefined' && window.electronAPI?.images) {
        const uploadPromises = Array.from(files).map(async (file) => {
          // Datei zu ArrayBuffer konvertieren
          const buffer = await file.arrayBuffer();
          
          const uploadData = {
            fileData: {
              name: file.name,
              type: file.type,
              size: file.size,
              buffer: buffer
            },
            metadata: {
              title: file.name.split('.')[0],
              description: '',
              category: category || 'Allgemein',
              tags: [],
              bedId,
              plantType: '',
              location: '',
              weather: '',
              uploadedBy: currentUser
            }
          };
          
          return await window.electronAPI.images.upload(uploadData);
        });
        
        await Promise.all(uploadPromises);
      } else {
        // Fallback für Entwicklung
        for (const file of Array.from(files)) {
          console.log('Uploading file (fallback):', file.name);
        }
      }
      
      await loadImages(); // Neu laden
    } catch (error) {
      console.error('Fehler beim Upload:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Einzelne Bild-URL nachladen (für neue Uploads)
  const loadSingleImageUrl = async (imageId: string) => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI?.images?.getFileUrl) {
        const url = await window.electronAPI.images.getFileUrl(imageId);
        if (url) {
          setImageUrls(prev => ({ ...prev, [imageId]: url }));
        }
      }
    } catch (error) {
      console.error(`Fehler beim Laden der URL für Bild ${imageId}:`, error);
    }
  };

  // Bild als Favorit markieren
  const toggleFavorite = async (imageId: string) => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI?.images) {
        await window.electronAPI.images.toggleFavorite(imageId);
      } else {
        console.log('Toggle favorite (fallback):', imageId);
      }
      await loadImages();
    } catch (error) {
      console.error('Fehler beim Favorisieren:', error);
    }
  };

  // Kommentar hinzufügen
  const handleAddComment = async (imageId: string) => {
    if (!newComment.trim()) return;
    
    try {
      if (typeof window !== 'undefined' && window.electronAPI?.images) {
        const commentData = {
          text: newComment.trim(),
          author: currentUser
        };
        await window.electronAPI.images.addComment(imageId, commentData);
      } else {
        console.log('Add comment (fallback):', imageId, newComment);
      }
      
      setNewComment('');
      await loadImages(); // Neu laden
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Kommentars:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Bildersammlung</h2>
          <p className="text-muted-foreground">
            {filteredImages.length} von {images.length} Bildern
          </p>
        </div>
        
        {showUpload && (
          <div className="flex gap-2">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="image-upload"
            />
            <Button 
              asChild 
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="h-4 w-4" />
                {isUploading ? 'Lädt hoch...' : 'Bilder hinzufügen'}
              </label>
            </Button>
          </div>
        )}
      </div>

      {/* Filter und Suche */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Bilder durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                <SelectItem value="Wachstum">Wachstum</SelectItem>
                <SelectItem value="Ernte">Ernte</SelectItem>
                <SelectItem value="Schädlinge">Schädlinge</SelectItem>
                <SelectItem value="Allgemein">Allgemein</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sortieren" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="takenDate">Aufnahmedatum</SelectItem>
                <SelectItem value="uploadDate">Upload-Datum</SelectItem>
                <SelectItem value="title">Titel</SelectItem>
                <SelectItem value="viewCount">Aufrufe</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bilder-Grid/Liste */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((image) => (
            <Card key={image.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <div 
                className="relative aspect-square overflow-hidden rounded-t-lg"
                onClick={() => openImage(image)}
              >
                {imageUrls[image.id] ? (
                  <Image
                    src={imageUrls[image.id]}
                    alt={image.title || image.originalName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                
                {image.isFavorite && (
                  <div className="absolute top-2 right-2">
                    <Heart className="h-5 w-5 text-red-500 fill-current" />
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <div className="text-white text-sm font-medium truncate">
                    {image.title || image.originalName}
                  </div>
                </div>
              </div>
              
              <CardContent className="p-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <div>
                    <div>📸 {new Date(image.takenDate).toLocaleDateString('de-DE')}
                      {image._dateEstimated && <span className="text-orange-600 ml-1">⚠️</span>}
                    </div>
                    {image.uploadDate !== image.takenDate && (
                      <div className="text-xs opacity-75">
                        📤 {new Date(image.uploadDate).toLocaleDateString('de-DE')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{image.viewCount}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {normCategory(image.category)}
                  </Badge>
                  {image.comments.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      {image.comments.length}
                    </Badge>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground truncate">
                  von {image.uploadedBy}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredImages.map((image) => (
            <Card key={image.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div 
                    className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden"
                    onClick={() => openImage(image)}
                  >
                    {imageUrls[image.id] ? (
                      <Image
                        src={imageUrls[image.id]}
                        alt={image.title || image.originalName}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium truncate">
                          {image.title || image.originalName}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {image.description}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div>
                            <span>📸 {new Date(image.takenDate).toLocaleDateString('de-DE')}</span>
                            {image._dateEstimated && <span className="text-orange-600 ml-1">⚠️</span>}
                            {image.uploadDate !== image.takenDate && (
                              <span className="ml-2 text-xs opacity-75">
                                (📤 {new Date(image.uploadDate).toLocaleDateString('de-DE')})
                              </span>
                            )}
                          </div>
                          <span>von {image.uploadedBy}</span>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{image.viewCount}</span>
                          </div>
                          {image.comments.length > 0 && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>{image.comments.length}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(image.id)}
                        >
                          <Heart 
                            className={`h-4 w-4 ${image.isFavorite ? 'text-red-500 fill-current' : ''}`} 
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bild-Detail-Dialog */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => { setSelectedImage(null); setIsEditMode(false); }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between gap-2">
                <DialogTitle className="flex-1">{selectedImage.title || selectedImage.originalName}</DialogTitle>
                <Button
                  variant={isEditMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setIsEditMode(!isEditMode); setEditError(''); }}
                >
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  {isEditMode ? 'Abbrechen' : 'Bearbeiten'}
                </Button>
              </div>
              <DialogDescription>
                Aufgenommen am {new Date(selectedImage.takenDate).toLocaleDateString('de-DE')} um {new Date(selectedImage.takenDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                {selectedImage._dateEstimated && (
                  <span className="text-orange-600"> (geschätzt)</span>
                )}
                {selectedImage.uploadDate !== selectedImage.takenDate && (
                  <> • Hochgeladen am {new Date(selectedImage.uploadDate).toLocaleDateString('de-DE')}</>
                )}
                <> • von {selectedImage.uploadedBy}</>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Bild */}
              <div className="relative aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {imageUrls[selectedImage.id] ? (
                  <Image
                    src={imageUrls[selectedImage.id]}
                    alt={selectedImage.title || selectedImage.originalName}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 80vw"
                  />
                ) : (
                  <ImageIcon className="h-24 w-24 text-muted-foreground" />
                )}
              </div>

              {/* Edit-Formular */}
              {isEditMode && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <h4 className="font-medium text-sm">Metadaten bearbeiten</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Titel</label>
                      <Input
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        placeholder="Bildtitel …"
                        maxLength={200}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Kategorie</label>
                      <Select value={editCategory} onValueChange={setEditCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Wachstum">Wachstum</SelectItem>
                          <SelectItem value="Ernte">Ernte</SelectItem>
                          <SelectItem value="Schädlinge">Schädlinge</SelectItem>
                          <SelectItem value="Allgemein">Allgemein</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Beschreibung</label>
                      <Textarea
                        value={editDescription}
                        onChange={e => setEditDescription(e.target.value)}
                        placeholder="Kurze Beschreibung …"
                        className="min-h-[60px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pflanzentyp</label>
                      <Input
                        value={editPlantType}
                        onChange={e => setEditPlantType(e.target.value)}
                        placeholder="z. B. Tomate, Basilikum …"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Standort</label>
                      <Input
                        value={editLocation}
                        onChange={e => setEditLocation(e.target.value)}
                        placeholder="z. B. Beet 3, Südseite …"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Wetter</label>
                      <Input
                        value={editWeather}
                        onChange={e => setEditWeather(e.target.value)}
                        placeholder="z. B. Sonnig, 22°C …"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tags (kommagetrennt)</label>
                      <Input
                        value={editTags}
                        onChange={e => setEditTags(e.target.value)}
                        placeholder="rose, sommer, beet-3 …"
                      />
                    </div>
                  </div>
                  {editError && <p className="text-sm text-destructive">{editError}</p>}
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setIsEditMode(false)}>Abbrechen</Button>
                    <Button size="sm" onClick={saveEdit} disabled={isSavingEdit}>
                      {isSavingEdit ? 'Speichert …' : 'Speichern'}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Metadaten */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Beschreibung</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedImage.description || 'Keine Beschreibung vorhanden'}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Gartendetails</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Kategorie:</strong> {normCategory(selectedImage.category)}</div>
                    <div><strong>Pflanzentyp:</strong> {selectedImage.plantType || '—'}</div>
                    <div><strong>Standort:</strong> {selectedImage.location || '—'}</div>
                    <div><strong>Wetter:</strong> {selectedImage.weather || '—'}</div>
                    <div><strong>Aufrufe:</strong> {selectedImage.viewCount}</div>
                  </div>
                </div>

                {/* EXIF-Daten und technische Details */}
                <div>
                  <h4 className="font-medium mb-2">Technische Details</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Dateigröße:</strong> {(selectedImage.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                    <div><strong>Format:</strong> {selectedImage.mimeType}</div>
                    
                    {/* Datum-Quelle Anzeige */}
                    <div><strong>Aufnahmedatum:</strong> 
                      {selectedImage._dateSource === 'exif' && <span className="text-green-600 ml-1">📸 EXIF-Daten</span>}
                      {selectedImage._dateSource === 'filename' && <span className="text-blue-600 ml-1">📝 Dateiname</span>}
                      {selectedImage._dateSource === 'filename-dsc-estimated' && <span className="text-orange-600 ml-1">📝 Dateiname (DSC-geschätzt)</span>}
                      {selectedImage._dateSource === 'filesystem' && <span className="text-gray-600 ml-1">📁 Dateisystem</span>}
                      {selectedImage._dateSource === 'filesystem-dsc-fallback' && <span className="text-orange-600 ml-1">📁 Dateisystem (DSC-Fallback)</span>}
                      {selectedImage._dateSource === 'upload-fallback' && <span className="text-red-600 ml-1">📤 Upload-Datum</span>}
                      {selectedImage._dateSource === 'explicit' && <span className="text-purple-600 ml-1">✍️ Manuell gesetzt</span>}
                      {selectedImage._dateEstimated && <span className="text-orange-600 ml-1">⚠️ Geschätzt</span>}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tags */}
              {selectedImage.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedImage.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Kommentare */}
              <div>
                <h4 className="font-medium mb-4">
                  Kommentare ({selectedImage.comments.length})
                </h4>
                
                <div className="space-y-4">
                  {selectedImage.comments.map((comment) => (
                    <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm">{comment.text}</p>
                    </div>
                  ))}
                  
                  {/* Neuer Kommentar */}
                  <div className="border-t pt-4">
                    <div className="flex gap-3">
                      <Textarea
                        placeholder="Kommentar hinzufügen..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <Button 
                        onClick={() => handleAddComment(selectedImage.id)}
                        disabled={!newComment.trim()}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Leerer Zustand */}
      {filteredImages.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Bilder gefunden</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || filterCategory !== 'all' 
                ? 'Versuche andere Suchbegriffe oder Filter'
                : 'Lade deine ersten Gartenfotos hoch, um zu beginnen'
              }
            </p>
            {showUpload && !searchTerm && filterCategory === 'all' && (
              <Button asChild>
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  Erstes Bild hinzufügen
                </label>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
