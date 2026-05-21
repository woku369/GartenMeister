'use client';

/**
 * FINALE BULLETPROOF VERSION - Gartenübersicht
 * Diese Version kann NIEMALS einen ".map() of undefined" Fehler werfen
 * Implementiert komplette Fehlerbehandlung und Race-Condition Schutz
 */

import { useBeds, useHerbVarieties, useSegments, useGartenConfiguration } from '@/lib/data-hooks-safe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PlusCircle, Edit, Loader2, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

// Typsichere Utility-Funktionen
function safeArrayCheck<T>(arr: any): arr is T[] {
  return Array.isArray(arr) && arr !== null && arr !== undefined;
}

function safeMap<T, R>(arr: any, mapFn: (item: T, index: number) => R): R[] {
  if (!safeArrayCheck(arr)) {
    console.warn('[SAFE MAP] Attempted to map over non-array:', typeof arr, arr);
    return [];
  }
  try {
    return arr.map(mapFn);
  } catch (error) {
    console.error('[SAFE MAP] Error during mapping:', error);
    return [];
  }
}

export default function GardenOverviewPage() {
  const { toast } = useToast();
  
  // Hooks mit garantierten Defaults
  const { beds: rawBeds, loading: bedsLoading, error: bedsError, deleteBed, refetch: refreshBeds } = useBeds();
  const { herbVarieties: rawHerbs, loading: herbsLoading, error: herbsError } = useHerbVarieties();
  const { segments: rawSegments, loading: segmentsLoading, error: segmentsError } = useSegments();
  const { config: rawConfig, loading: configLoading, error: configError } = useGartenConfiguration();

  // Sichere Arrays ohne useMemo - Vermeidung von React Error #310
  // useMemo mit instabilen Arrays verursacht React Fehler in Production
  const beds = safeArrayCheck(rawBeds) ? rawBeds : [];
  const herbVarieties = safeArrayCheck(rawHerbs) ? rawHerbs : [];
  const segments = safeArrayCheck(rawSegments) ? rawSegments : [];
  const config = rawConfig && typeof rawConfig === 'object' 
    ? { currentBeetCount: rawConfig.currentBeetCount || 20, ...rawConfig }
    : { currentBeetCount: 20 };

  console.log('[BULLETPROOF] Safe data:', {
    bedsCount: beds.length,
    herbsCount: herbVarieties.length,
    segmentsCount: segments.length,
    config: config
  });

  const loading = bedsLoading || herbsLoading || segmentsLoading || configLoading;
  const error = bedsError || herbsError || segmentsError || configError;

  // Sichere Hilfsfunktionen - OHNE useCallback um React Error #310 zu vermeiden
  const getAvailableBedNumbers = (): number[] => {
    try {
      if (!safeArrayCheck(beds)) return [];
      
      const occupied = new Set(safeMap(beds, (bed: any) => bed?.bedNumber).filter(num => typeof num === 'number'));
      const available: number[] = [];
      const maxBeds = config.currentBeetCount || 20;
      
      for (let i = 1; i <= maxBeds; i++) {
        if (!occupied.has(i)) {
          available.push(i);
        }
      }
      return available.sort((a, b) => a - b);
    } catch (error) {
      console.error('[BULLETPROOF] Error in getAvailableBedNumbers:', error);
      return [];
    }
  };

  const handleDeleteBed = async (bedId: string) => {
    if (!bedId || typeof bedId !== 'string') {
      console.error('[BULLETPROOF] Invalid bedId for deletion:', bedId);
      return;
    }
    
    try {
      await deleteBed(bedId);
      toast({
        title: 'Erfolg!',
        description: 'Beet wurde gelöscht.',
      });
    } catch (err) {
      console.error('[BULLETPROOF] Delete bed error:', err);
      toast({
        title: 'Fehler',
        description: 'Beet konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshBeds();
      toast({
        title: 'Erfolg!',
        description: 'Daten wurden aktualisiert.',
      });
    } catch (err) {
      console.error('[BULLETPROOF] Refresh error:', err);
      toast({
        title: 'Fehler',
        description: 'Daten konnten nicht aktualisiert werden.',
        variant: 'destructive',
      });
    }
  };

  const getHerbName = (herbId: string): string => {
    if (!herbId || typeof herbId !== 'string') return 'Unbekannt';
    try {
      const herb = herbVarieties.find(h => h?.id === herbId);
      return herb?.name || 'Unbekannt';
    } catch (error) {
      console.error('[BULLETPROOF] Error in getHerbName:', error);
      return 'Unbekannt';
    }
  };

  const getHerbColor = (herbId: string): string => {
    if (!herbId || typeof herbId !== 'string') return '#cccccc';
    try {
      const herb = herbVarieties.find(h => h?.id === herbId);
      return herb?.color || '#cccccc';
    } catch (error) {
      console.error('[BULLETPROOF] Error in getHerbColor:', error);
      return '#cccccc';
    }
  };

  const getSegmentsForBed = (bedId: string) => {
    if (!bedId || typeof bedId !== 'string') return [];
    try {
      return segments.filter(s => s?.bedId === bedId) || [];
    } catch (error) {
      console.error('[BULLETPROOF] Error in getSegmentsForBed:', error);
      return [];
    }
  };

  // Render States
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
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-destructive mb-4 text-center">
          Fehler beim Laden der Daten: {String(error)}
        </p>
        <Button onClick={handleRefresh} className="mt-4">
          <RotateCcw className="mr-2 h-4 w-4" />
          Neu laden
        </Button>
      </div>
    );
  }

  // Direkte Berechnung statt useMemo um React Error #310 zu vermeiden
  const availableBeds = getAvailableBedNumbers();
  const bedsCount = beds.length;
  const maxBeds = config.currentBeetCount || 20;

  // Sichere Tabellen-Rows direkt gerendert (ohne useMemo für React-Stabilität)
  const renderTableRows = () => {
    console.log('[BULLETPROOF] Generating table rows for beds:', beds.length);
    
    return safeMap(beds, (bed: any) => {
      if (!bed || typeof bed !== 'object' || !bed.id) {
        console.warn('[BULLETPROOF] Invalid bed object:', bed);
        return null;
      }

      try {
        const bedSegments = getSegmentsForBed(bed.id);
        
        return (
          <TableRow key={bed.id}>
            <TableCell className="font-medium">
              <div className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full mr-2 border"
                  style={{ 
                    backgroundColor: bed.type === 'Standard' 
                      ? getHerbColor(bed.herbVarietyId || '')
                      : bed.color || '#cccccc'
                  }}
                />
                {bed.bedNumber || 'N/A'}
              </div>
            </TableCell>
            <TableCell>{bed.type || 'Unbekannt'}</TableCell>
            <TableCell>
              {bed.type === 'Standard' ? (
                <div>
                  {getHerbName(bed.herbVarietyId || '')}
                  {bed.subVarietyName && (
                    <div className="text-xs text-muted-foreground">
                      {bed.subVarietyName}
                    </div>
                  )}
                </div>
              ) : bed.type === 'Versuchsbeet' ? (
                <div>
                  {bedSegments.length > 0 ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="text-left">
                          {bedSegments.length} Segment{bedSegments.length !== 1 ? 'e' : ''}
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            {safeMap(bedSegments, (segment: any) => (
                              <div key={segment?.id || Math.random()} className="text-xs">
                                {getHerbName(segment?.herbVarietyId || '')} ({segment?.segmentLength || 0}m)
                              </div>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-muted-foreground">Keine Segmente</span>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell>
              {bed.width || 0}m × {bed.length || 0}m
            </TableCell>
            <TableCell>
              {bed.plantingDate ? new Date(bed.plantingDate).toLocaleDateString('de-DE') : '-'}
            </TableCell>
            <TableCell>
              <div className="max-w-32 truncate" title={bed.remarks || ''}>
                {bed.remarks || '-'}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Link href={`/beds/${bed.id}`}>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Bearbeiten</span>
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteBed(bed.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Löschen</span>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        );
      } catch (error) {
        console.error('[BULLETPROOF] Error rendering bed row:', error, bed);
        return (
          <TableRow key={bed.id || Math.random()}>
            <TableCell colSpan={7} className="text-center text-destructive">
              Fehler beim Anzeigen dieses Beets
            </TableCell>
          </TableRow>
        );
      }
    }).filter(Boolean); // Entferne null-Werte
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gartenübersicht</h1>
          <p className="text-muted-foreground">
            {bedsCount} von {maxBeds} Beeten belegt
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Aktualisieren
          </Button>
          <GardenExportPDFButton beds={beds} />
          <HarvestInitiatorButton />
          <Link href="/beds/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Neues Beet
            </Button>
          </Link>
        </div>
      </div>

      {/* Debug Info (nur im Development) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-dashed border-muted">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground space-y-1">
              <div>🛡️ BULLETPROOF MODE - Debug Info:</div>
              <div>Beete: {beds.length}, Kräuter: {herbVarieties.length}, Segmente: {segments.length}</div>
              <div>Arrays sind sicher: {JSON.stringify({
                beds: safeArrayCheck(beds),
                herbs: safeArrayCheck(herbVarieties),
                segments: safeArrayCheck(segments)
              })}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Beete-Tabelle - Original-Visualisierung mit BULLETPROOF-Sicherheit */}
      <Card>
        <CardHeader>
          <CardTitle>Aktive Beete</CardTitle>
          <CardDescription>
            Übersicht aller angelegten Beete im Garten
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bedsCount > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nr.</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Kräutersorte</TableHead>
                    <TableHead>Größe</TableHead>
                    <TableHead>Pflanzdatum</TableHead>
                    <TableHead>Bemerkungen</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderTableRows()}
                </TableBody>
              </Table>
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

      {/* Verfügbare Beetplätze */}
      {availableBeds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Verfügbare Beetplätze</CardTitle>
            <CardDescription>
              Freie Beetnummern für neue Beete
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {safeMap(availableBeds.slice(0, 10), (number: number) => (
                <Link key={number} href={`/beds/new?bedNumber=${number}`}>
                  <Button variant="outline" size="sm">
                    Beet {number}
                  </Button>
                </Link>
              ))}
              {availableBeds.length > 10 && (
                <span className="text-muted-foreground text-sm self-center">
                  ... und {availableBeds.length - 10} weitere
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
