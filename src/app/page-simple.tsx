'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RotateCcw, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import * as dataApi from '@/lib/data';

export default function GardenOverviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [beds, setBeds] = useState([]);
  const [herbVarieties, setHerbVarieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[Page] Lade Daten über alte API...');
      
      const [bedsData, herbsData] = await Promise.all([
        dataApi.getBeds(),
        dataApi.getHerbVarieties()
      ]);
      
      console.log('[Page] Beds geladen:', bedsData?.length || 0);
      console.log('[Page] Herbs geladen:', herbsData?.length || 0);
      
      setBeds(bedsData || []);
      setHerbVarieties(herbsData || []);
    } catch (err) {
      console.error('[Page] Fehler beim Laden:', err);
      setError(err.message || 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Lade Gartendaten...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-destructive mb-4">Fehler: {error}</p>
        <Button onClick={loadData}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gartenübersicht</h1>
          <p className="text-muted-foreground">
            {beds.length} Beete gefunden
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Aktualisieren
          </Button>
          <Link href="/beds/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Neues Beet
            </Button>
          </Link>
        </div>
      </div>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Beete:</strong> {beds.length} (Array: {Array.isArray(beds) ? 'ja' : 'nein'})</p>
            <p><strong>Kräuter:</strong> {herbVarieties.length} (Array: {Array.isArray(herbVarieties) ? 'ja' : 'nein'})</p>
            <p><strong>Loading:</strong> {loading ? 'ja' : 'nein'}</p>
            <p><strong>Error:</strong> {error || 'keiner'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Beete-Liste */}
      <Card>
        <CardHeader>
          <CardTitle>Beete</CardTitle>
          <CardDescription>
            Einfache Liste der vorhandenen Beete
          </CardDescription>
        </CardHeader>
        <CardContent>
          {beds.length > 0 ? (
            <div className="space-y-2">
              {beds.map((bed, index) => (
                <div key={bed.id || index} className="p-3 border rounded">
                  <p><strong>Beet {bed.bedNumber || 'N/A'}:</strong> {bed.type || 'Unbekannt'}</p>
                  <p className="text-sm text-muted-foreground">
                    {bed.width || 0}m × {bed.length || 0}m
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Keine Beete gefunden.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
