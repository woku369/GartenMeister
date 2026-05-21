'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, ImageIcon, FileImage, Loader2 } from 'lucide-react';
import { electronAPI, UploadData, ImageMetadata } from '@/lib/electron-bridge';
import BrowserExifExtractor from '@/utils/browser-exif-extractor';

interface ImageUploadProps {
  bedId?: string;
  onUploadComplete?: (results: any) => void;
  onClose?: () => void;
}

export function ImageUploader({ bedId, onUploadComplete, onClose }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    category: 'Allgemein',
    tags: [] as string[],
    bedId: bedId || '',
    plantType: '',
    location: '',
    weather: '',
    uploadedBy: 'User'
  });
  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const imageFiles = droppedFiles.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== droppedFiles.length) {
      toast({
        title: "Warnung",
        description: `${droppedFiles.length - imageFiles.length} nicht-Bilddateien wurden ignoriert.`,
        variant: "destructive",
      });
    }

    setFiles(prev => [...prev, ...imageFiles]);
  }, [toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const addTag = useCallback(() => {
    if (tagInput.trim() && !metadata.tags.includes(tagInput.trim())) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  }, [tagInput, metadata.tags]);

  const removeTag = useCallback((tag: string) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  }, []);

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "Keine Dateien",
        description: "Bitte wählen Sie mindestens eine Datei aus.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // EXIF-Extraktor initialisieren
      const exifExtractor = new BrowserExifExtractor();

      // Prüfen ob Electron-API verfügbar ist
      if (typeof window !== 'undefined' && window.electronAPI?.images) {
        
        // Für jeden File ein Upload-Data-Objekt erstellen
        const uploadPromises = files.map(async (file, index) => {
          setProgress((index / files.length) * 100);
          
          // EXIF-Daten extrahieren
          let takenDate = null;
          try {
            console.log(`[ImageUploader] 📸 Extrahiere EXIF-Daten für ${file.name}...`);
            const exifData = await exifExtractor.extractFromFile(file);
            takenDate = exifData?.takenAt;
            if (takenDate) {
              console.log(`[ImageUploader] ✅ Aufnahmedatum gefunden: ${takenDate}`);
            } else {
              console.log(`[ImageUploader] ⚠️ Kein EXIF-Aufnahmedatum für ${file.name}`);
            }
          } catch (error) {
            console.warn(`[ImageUploader] EXIF-Extraktion fehlgeschlagen für ${file.name}:`, error);
          }
          
          const uploadData: UploadData = {
            filePath: file.name, // In echtem Szenario würde das der vollständige Pfad sein
            title: metadata.title || file.name.split('.')[0],
            description: metadata.description,
            category: metadata.category,
            tags: metadata.tags,
            bedId: metadata.bedId,
            plantType: metadata.plantType,
            location: metadata.location,
            weather: metadata.weather,
            uploadedBy: metadata.uploadedBy,
            takenDate: takenDate // EXIF-Aufnahmedatum hinzufügen
          };
          
          return await window.electronAPI.images.upload(uploadData);
        });
        
        const results = await Promise.all(uploadPromises);
        setProgress(100);

        toast({
          title: "Upload erfolgreich",
          description: `${results.length} Bild(er) erfolgreich hochgeladen.`,
        });
        
        // Reset
        setFiles([]);
        setMetadata(prev => ({
          ...prev,
          title: '',
          description: '',
          tags: []
        }));
        
        if (onUploadComplete) {
          onUploadComplete(results);
        }
        
      } else {
        // Fallback für Entwicklung
        setProgress(100);
        toast({
          title: "Upload simuliert",
          description: `${files.length} Datei(en) würden hochgeladen werden.`,
        });
      }
          description: '',
          tags: []
        }));
        
        onUploadComplete?.(result);
        
      } else {
        throw new Error(result.error || 'Upload fehlgeschlagen');
      }

    } catch (error) {
      console.error('Upload-Fehler:', error);
      toast({
        title: "Upload fehlgeschlagen",
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Bilder hochladen
            </CardTitle>
            <CardDescription>
              Laden Sie Gartenfotos hoch und kategorisieren Sie diese
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Drag & Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Bilder hierher ziehen</h3>
          <p className="text-muted-foreground mb-4">
            oder klicken Sie hier, um Dateien auszuwählen
          </p>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <FileImage className="w-4 h-4 mr-2" />
            Dateien auswählen
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Ausgewählte Dateien */}
        {files.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Ausgewählte Dateien ({files.length})</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {files.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {file.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadaten-Eingabe */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={metadata.title}
              onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
              placeholder="z.B. Tomatenwachstum Woche 4"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategorie</Label>
            <Select
              value={metadata.category}
              onValueChange={(value) => setMetadata(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Wachstum">Wachstum</SelectItem>
                <SelectItem value="Ernte">Ernte</SelectItem>
                <SelectItem value="Schädlinge">Schädlinge</SelectItem>
                <SelectItem value="Allgemein">Allgemein</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plantType">Pflanzenart</Label>
            <Input
              id="plantType"
              value={metadata.plantType}
              onChange={(e) => setMetadata(prev => ({ ...prev, plantType: e.target.value }))}
              placeholder="z.B. Tomaten, Gurken, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Standort</Label>
            <Input
              id="location"
              value={metadata.location}
              onChange={(e) => setMetadata(prev => ({ ...prev, location: e.target.value }))}
              placeholder="z.B. Beet 1, Gewächshaus"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={metadata.description}
              onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Beschreiben Sie, was auf den Bildern zu sehen ist..."
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Tag hinzufügen..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Hinzufügen
              </Button>
            </div>
            {metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {metadata.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer">
                    {tag}
                    <X 
                      className="w-3 h-3 ml-1" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Hochladen...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={uploading}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Hochladen...
              </>
            ) : (
              `${files.length} Bild(er) hochladen`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ImageUploader;
