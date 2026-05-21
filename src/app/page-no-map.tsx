'use client';

import { useBeds, useHerbVarieties, useSegments, useGartenConfiguration } from '@/lib/data-hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RotateCcw, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function GardenOverviewPageSafe() {
  const { toast } = useToast();
  
  // Sichere Hook-Zugriffe
  const bedsHook = useBeds() || {};
  const herbsHook = useHerbVarieties() || {};
  const segmentsHook = useSegments() || {};
  const configHook = useGartenConfiguration() || {};

  // Absolut sichere Zugriffe
  const beds = bedsHook?.beds;
  const herbVarieties = herbsHook?.herbVarieties;
  const segments = segmentsHook?.segments;
  const config = configHook?.config;
  
  const bedsArray = Array.isArray(beds) ? beds : [];
  const herbsArray = Array.isArray(herbVarieties) ? herbVarieties : [];
  const segmentsArray = Array.isArray(segments) ? segments : [];
  
  const currentBeetCount = config?.currentBeetCount || 20;
  const loading = bedsHook?.loading || herbsHook?.loading || segmentsHook?.loading || configHook?.loading || false;
  const error = bedsHook?.error || herbsHook?.error || segmentsHook?.error || configHook?.error || null;

  console.log('[SafeOverview] State:', {
    bedsArrayLength: bedsArray.length,
    herbsArrayLength: herbsArray.length,
    segmentsArrayLength: segmentsArray.length,
    loading,
    error
  });

  const handleRefresh = async () => {
    try {
      if (bedsHook?.refetch) {
        await bedsHook.refetch();
      }
      toast({
        title: 'Erfolg!',
        description: 'Daten wurden aktualisiert.',
      });
    } catch (err) {
      toast({
        title: 'Fehler',
        description: 'Daten konnten nicht aktualisiert werden.',
        variant: 'destructive',
      });
    }
  };

  // Render
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
        <Button onClick={handleRefresh} className="mt-4">
          <RotateCcw className="mr-2 h-4 w-4" />
          Neu laden
        </Button>
      </div>
    );
  }

  // KEINE .map() AUFRUFE - Manueller Render der ersten 10 Beete
  const renderBeds = () => {
    const bedElements = [];
    const maxDisplay = Math.min(bedsArray.length, 10);
    
    for (let i = 0; i < maxDisplay; i++) {
      const bed = bedsArray[i];
      if (bed && bed.id) {
        bedElements.push(
          <div key={bed.id} className="p-4 border rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Beet #{bed.bedNumber}</h3>
                <p className="text-sm text-gray-600">{bed.type}</p>
                <p className="text-xs text-gray-500">{bed.width}m × {bed.length}m</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/beds/${bed.id}`}>
                  <Button variant="outline" size="sm">
                    Bearbeiten
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        );
      }
    }
    
    return bedElements;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gartenübersicht (Sicher)</h1>
          <p className="text-muted-foreground">
            {bedsArray.length} von {currentBeetCount} Beeten belegt
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
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

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Beete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bedsArray.length}</div>
            <p className="text-xs text-muted-foreground">Aktive Beete</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Kräutersorten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{herbsArray.length}</div>
            <p className="text-xs text-muted-foreground">Verfügbare Sorten</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Segmente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{segmentsArray.length}</div>
            <p className="text-xs text-muted-foreground">Versuchsbeet-Segmente</p>
          </CardContent>
        </Card>
      </div>

      {/* Beete-Liste ohne .map() */}
      <Card>
        <CardHeader>
          <CardTitle>Aktive Beete</CardTitle>
          <CardDescription>
            Übersicht der ersten {Math.min(bedsArray.length, 10)} Beete
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bedsArray.length > 0 ? (
            <div className="space-y-4">
              {renderBeds()}
              {bedsArray.length > 10 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    ... und {bedsArray.length - 10} weitere Beete
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Noch keine Beete angelegt.
              </p>
              <Link href="/beds/new">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Erstes Beet anlegen
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
