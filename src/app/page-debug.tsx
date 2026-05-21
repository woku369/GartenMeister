'use client';

import { useBeds, useHerbVarieties, useSegments, useGartenConfiguration } from '@/lib/data-hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function GardenOverviewPageDebug() {
  const { toast } = useToast();
  
  // Alle Daten über die neuen, sauberen Hooks laden
  const bedsHook = useBeds();
  const herbsHook = useHerbVarieties();
  const segmentsHook = useSegments();
  const configHook = useGartenConfiguration();

  // Absolut sichere Werte
  const beds = bedsHook?.beds;
  const herbVarieties = herbsHook?.herbVarieties;
  const segments = segmentsHook?.segments;
  const gartenConfig = configHook?.config;

  const bedsLoading = bedsHook?.loading ?? true;
  const herbsLoading = herbsHook?.loading ?? true;
  const segmentsLoading = segmentsHook?.loading ?? true;
  const configLoading = configHook?.loading ?? true;

  const bedsError = bedsHook?.error;
  const herbsError = herbsHook?.error;
  const segmentsError = segmentsHook?.error;
  const configError = configHook?.error;

  const loading = bedsLoading || herbsLoading || segmentsLoading || configLoading;
  const error = bedsError || herbsError || segmentsError || configError;

  // Debug-Informationen
  const debugInfo = {
    bedsHook: {
      exists: !!bedsHook,
      beds: beds,
      bedsType: typeof beds,
      bedsIsArray: Array.isArray(beds),
      bedsLength: Array.isArray(beds) ? beds.length : 'N/A',
      loading: bedsLoading,
      error: bedsError
    },
    herbsHook: {
      exists: !!herbsHook,
      herbVarieties: herbVarieties,
      herbVarietiesType: typeof herbVarieties,
      herbVarietiesIsArray: Array.isArray(herbVarieties),
      herbVarietiesLength: Array.isArray(herbVarieties) ? herbVarieties.length : 'N/A',
      loading: herbsLoading,
      error: herbsError
    },
    segmentsHook: {
      exists: !!segmentsHook,
      segments: segments,
      segmentsType: typeof segments,
      segmentsIsArray: Array.isArray(segments),
      segmentsLength: Array.isArray(segments) ? segments.length : 'N/A',
      loading: segmentsLoading,
      error: segmentsError
    },
    configHook: {
      exists: !!configHook,
      config: gartenConfig,
      configType: typeof gartenConfig,
      loading: configLoading,
      error: configError
    }
  };

  console.log('[DEBUG] GartenOverview Debug Info:', debugInfo);

  // Refresh-Funktion
  const handleRefresh = async () => {
    try {
      if (bedsHook?.refetch) await bedsHook.refetch();
      if (herbsHook?.refetch) await herbsHook.refetch();
      if (segmentsHook?.refetch) await segmentsHook.refetch();
      if (configHook?.refetch) await configHook.refetch();
      
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

  // Sichere Arrays für Berechnungen
  const safeBeds = Array.isArray(beds) ? beds : [];
  const safeHerbVarieties = Array.isArray(herbVarieties) ? herbVarieties : [];
  const safeSegments = Array.isArray(segments) ? segments : [];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Lade Gartendaten... (Debug-Modus)</span>
        </div>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Debug-Informationen (Loading)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-destructive mb-4">Fehler: {error}</p>
          <Button onClick={handleRefresh} className="mt-4">
            <RotateCcw className="mr-2 h-4 w-4" />
            Neu laden
          </Button>
        </div>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Debug-Informationen (Error)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gartenübersicht (Debug-Modus)</h1>
          <p className="text-muted-foreground">
            {safeBeds.length} Beete geladen
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Debug-Informationen */}
      <Card>
        <CardHeader>
          <CardTitle>Debug-Informationen</CardTitle>
          <CardDescription>
            Interne Zustandsinformationen der Hooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold">Beete</h4>
              <p>Anzahl: {safeBeds.length}</p>
              <p>Typ: {typeof beds}</p>
              <p>Array: {Array.isArray(beds) ? 'Ja' : 'Nein'}</p>
              <p>Loading: {bedsLoading ? 'Ja' : 'Nein'}</p>
              <p>Error: {bedsError || 'Keiner'}</p>
            </div>
            <div>
              <h4 className="font-semibold">Kräutersorten</h4>
              <p>Anzahl: {safeHerbVarieties.length}</p>
              <p>Typ: {typeof herbVarieties}</p>
              <p>Array: {Array.isArray(herbVarieties) ? 'Ja' : 'Nein'}</p>
              <p>Loading: {herbsLoading ? 'Ja' : 'Nein'}</p>
              <p>Error: {herbsError || 'Keiner'}</p>
            </div>
            <div>
              <h4 className="font-semibold">Segmente</h4>
              <p>Anzahl: {safeSegments.length}</p>
              <p>Typ: {typeof segments}</p>
              <p>Array: {Array.isArray(segments) ? 'Ja' : 'Nein'}</p>
              <p>Loading: {segmentsLoading ? 'Ja' : 'Nein'}</p>
              <p>Error: {segmentsError || 'Keiner'}</p>
            </div>
            <div>
              <h4 className="font-semibold">Konfiguration</h4>
              <p>Config: {gartenConfig ? 'Geladen' : 'Fehlt'}</p>
              <p>Typ: {typeof gartenConfig}</p>
              <p>Loading: {configLoading ? 'Ja' : 'Nein'}</p>
              <p>Error: {configError || 'Keiner'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sichere Beete-Anzeige */}
      <Card>
        <CardHeader>
          <CardTitle>Beete (Sichere Anzeige)</CardTitle>
          <CardDescription>
            Übersicht aller Beete ohne .map() auf undefined
          </CardDescription>
        </CardHeader>
        <CardContent>
          {safeBeds.length > 0 ? (
            <div className="space-y-2">
              {safeBeds.map((bed, index) => (
                <div key={bed?.id || index} className="p-4 border rounded">
                  <h4 className="font-semibold">
                    Beet {bed?.bedNumber || 'Unbekannt'} ({bed?.type || 'Unbekannt'})
                  </h4>
                  <p>ID: {bed?.id || 'Keine ID'}</p>
                  <p>Größe: {bed?.width || 0}m × {bed?.length || 0}m</p>
                  {bed?.plantingDate && (
                    <p>Pflanzdatum: {new Date(bed.plantingDate).toLocaleDateString('de-DE')}</p>
                  )}
                  {bed?.remarks && <p>Bemerkungen: {bed.remarks}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Keine Beete gefunden oder Daten noch nicht geladen.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raw Debug Output */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Debug Output</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
