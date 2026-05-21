'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, Users } from 'lucide-react';

interface ImageStatistics {
  totalImages: number;
  totalSize: number;
  categoryCounts: Record<string, number>;
  topUploaders: {
    author: string;
    count: number;
  }[];
  recentUploads: number;
  favoriteCount: number;
  averageRating: number;
}

export default function GalleryStatsCards() {
  const [stats, setStats] = useState<ImageStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        if (typeof window !== 'undefined' && window.electronAPI?.images) {
          const statistics = await window.electronAPI.images.getStatistics();
          setStats(statistics);
        } else {
          // Fallback: Mock-Daten für Entwicklung
          setStats({
            totalImages: 0,
            totalSize: 0,
            categoryCounts: {},
            topUploaders: [],
            recentUploads: 0,
            favoriteCount: 0,
            averageRating: 0
          });
        }
      } catch (error) {
        console.error('Fehler beim Laden der Statistiken:', error);
        setStats({
          totalImages: 0,
          totalSize: 0,
          categoryCounts: {},
          topUploaders: [],
          recentUploads: 0,
          favoriteCount: 0,
          averageRating: 0
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Gesamte Sammlung
          </CardTitle>
          <Camera className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalImages || 0}</div>
          <p className="text-xs text-muted-foreground">
            Bilder • {formatFileSize(stats?.totalSize || 0)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Letzte Uploads
          </CardTitle>
          <Upload className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.recentUploads || 0}</div>
          <p className="text-xs text-muted-foreground">
            Diese Woche hochgeladen
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Mitwirkende
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.topUploaders?.length || 0}</div>
          <p className="text-xs text-muted-foreground">
            Aktive Fotografen
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
