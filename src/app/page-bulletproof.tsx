'use client';

import { useBeds, useHerbVarieties, useSegments, useGartenConfiguration } from '@/lib/data-hooks-safe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PlusCircle, Edit, Loader2, Trash2, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import HarvestInitiatorButton from '@/components/layout/HarvestInitiatorButton';
import GardenExportPDFButton from '@/components/ui/garden-export-pdf-button';
import { useMemo } from 'react';

export default function GardenOverviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // SUPER-SICHERE Hooks - können NIEMALS undefined zurückgeben
  const { beds, loading: bedsLoading, error: bedsError, deleteBed, refetch: refreshBeds } = useBeds();
  const { herbVarieties, loading: herbsLoading, error: herbsError } = useHerbVarieties();
  const { segments, loading: segmentsLoading, error: segmentsError } = useSegments();
  const { config, loading: configLoading, error: configError } = useGartenConfiguration();

  // BULLETPROOF: Mehrfach abgesicherte Arrays mit useMemo
  const safeBedsArray = useMemo(() => {
    if (!beds || !Array.isArray(beds)) {
      console.error('[BULLETPROOF] Beds ist kein Array:', beds);
      return [];
    }
    return beds.filter(bed => bed && typeof bed === 'object' && bed.id);
  }, [beds]);

  const safeHerbsArray = useMemo(() => {
    if (!herbVarieties || !Array.isArray(herbVarieties)) {
      console.error('[BULLETPROOF] HerbVarieties ist kein Array:', herbVarieties);
      return [];
    }
    return herbVarieties.filter(herb => herb && typeof herb === 'object' && herb.id);
  }, [herbVarieties]);

  const safeSegmentsArray = useMemo(() => {
    if (!segments || !Array.isArray(segments)) {
      console.error('[BULLETPROOF] Segments ist kein Array:', segments);
      return [];
    }
    return segments.filter(segment => segment && typeof segment === 'object' && segment.id);
  }, [segments]);

  const safeConfig = useMemo(() => {
    if (!config || typeof config !== 'object') {
      console.error('[BULLETPROOF] Config ist kein Objekt:', config);
      return { currentBeetCount: 20 };
    }
    return {
      currentBeetCount: typeof config.currentBeetCount === 'number' ? config.currentBeetCount : 20
    };
  }, [config]);
  
  const loading = bedsLoading || herbsLoading || segmentsLoading || configLoading;
  const error = bedsError || herbsError || segmentsError || configError;

  console.log('[BULLETPROOF] Render state:', {
    bedsLength: safeBedsArray.length,
    herbsLength: safeHerbsArray.length,
    segmentsLength: safeSegmentsArray.length,
    loading,
    error,
    bedsType: Array.isArray(safeBedsArray) ? 'Array' : typeof safeBedsArray,
    herbsType: Array.isArray(safeHerbsArray) ? 'Array' : typeof safeHerbsArray,
    segmentsType: Array.isArray(safeSegmentsArray) ? 'Array' : typeof safeSegmentsArray
  });

  // Hilfsfunktionen - arbeiten mit garantiert sicheren Arrays
  const getAvailableBedNumbers = (): number[] => {
    try {
      const occupied = new Set(safeBedsArray.map(bed => bed.bedNumber));
      const available: number[] = [];
      for (let i = 1; i <= safeConfig.currentBeetCount; i++) {
        if (!occupied.has(i)) {
          available.push(i);
        }
      }
      return available.sort((a, b) => a - b);
    } catch (err) {
      console.error('[BULLETPROOF] Fehler in getAvailableBedNumbers:', err);
      return [];
    }
  };

  const handleDeleteBed = async (bedId: string) => {
    try {
      await deleteBed(bedId);
      toast({
        title: 'Erfolg!',
        description: 'Beet wurde gelöscht.',
      });
    } catch (err) {
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
      toast({
        title: 'Fehler',
        description: 'Daten konnten nicht aktualisiert werden.',
        variant: 'destructive',
      });
    }
  };

  const getHerbName = (herbId: string): string => {
    try {
      return safeHerbsArray.find(h => h.id === herbId)?.name || 'Unbekannt';
    } catch (err) {
      console.error('[BULLETPROOF] Fehler in getHerbName:', err);
      return 'Unbekannt';
    }
  };

  const getHerbColor = (herbId: string): string => {
    try {
      return safeHerbsArray.find(h => h.id === herbId)?.color || '#cccccc';
    } catch (err) {
      console.error('[BULLETPROOF] Fehler in getHerbColor:', err);
      return '#cccccc';
    }
  };

  const getSegmentsForBed = (bedId: string) => {
    try {
      return safeSegmentsArray.filter(s => s.bedId === bedId);
    } catch (err) {
      console.error('[BULLETPROOF] Fehler in getSegmentsForBed:', err);
      return [];
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gartenübersicht (Bulletproof)</h1>
          <p className="text-muted-foreground">
            {safeBedsArray.length} von {safeConfig.currentBeetCount} Beeten belegt
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Aktualisieren
          </Button>
          <GardenExportPDFButton beds={safeBedsArray} />
          <HarvestInitiatorButton />
          <Link href="/beds/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Neues Beet
            </Button>
          </Link>
        </div>
      </div>

      {/* Debug-Infos */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-sm">Debug-Informationen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs space-y-1">
            <div>Beete: {safeBedsArray.length} (Array: {Array.isArray(safeBedsArray) ? 'Ja' : 'Nein'})</div>
            <div>Kräuter: {safeHerbsArray.length} (Array: {Array.isArray(safeHerbsArray) ? 'Ja' : 'Nein'})</div>
            <div>Segmente: {safeSegmentsArray.length} (Array: {Array.isArray(safeSegmentsArray) ? 'Ja' : 'Nein'})</div>
            <div>Verfügbare Beetplätze: {getAvailableBedNumbers().length}</div>
          </div>
        </CardContent>
      </Card>

      {/* Beete-Tabelle - BULLETPROOF Version */}
      <Card>
        <CardHeader>
          <CardTitle>Aktive Beete</CardTitle>
          <CardDescription>
            Übersicht aller angelegten Beete im Garten (Bulletproof-Version)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {safeBedsArray.length > 0 ? (
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
                  {(() => {
                    try {
                      console.log('[BULLETPROOF] Vor map() - safeBedsArray:', safeBedsArray);
                      console.log('[BULLETPROOF] safeBedsArray.length:', safeBedsArray.length);
                      console.log('[BULLETPROOF] Array.isArray(safeBedsArray):', Array.isArray(safeBedsArray));
                      
                      if (!Array.isArray(safeBedsArray)) {
                        console.error('[BULLETPROOF] KRITISCH: safeBedsArray ist kein Array!');
                        return (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-red-600">
                              FEHLER: Datenstruktur ist kein Array
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return safeBedsArray.map((bed, index) => {
                        try {
                          console.log(`[BULLETPROOF] Verarbeite Beet ${index}:`, bed);
                          
                          if (!bed || typeof bed !== 'object' || !bed.id) {
                            console.error(`[BULLETPROOF] Ungültiges Beet bei Index ${index}:`, bed);
                            return null;
                          }

                          const bedSegments = getSegmentsForBed(bed.id);
                          
                          return (
                            <TableRow key={`bed-${bed.id}-${index}`}>
                              <TableCell className="font-medium">
                                <div className="flex items-center">
                                  <div
                                    className="w-4 h-4 rounded-full mr-2 border"
                                    style={{ 
                                      backgroundColor: bed.type === 'Standard' 
                                        ? getHerbColor((bed as any).herbVarietyId)
                                        : bed.color || '#cccccc'
                                    }}
                                  />
                                  {bed.bedNumber || '?'}
                                </div>
                              </TableCell>
                              <TableCell>{bed.type || 'Unbekannt'}</TableCell>
                              <TableCell>
                                {bed.type === 'Standard' ? (
                                  <div>
                                    {getHerbName((bed as any).herbVarietyId)}
                                    {(bed as any).subVarietyName && (
                                      <div className="text-xs text-muted-foreground">
                                        {(bed as any).subVarietyName}
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
                                              {bedSegments.map(segment => (
                                                <div key={segment.id} className="text-xs">
                                                  {getHerbName(segment.herbVarietyId)} ({segment.segmentLength}m)
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
                                {(bed.width || 0)}m × {(bed.length || 0)}m
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
                        } catch (bedError) {
                          console.error(`[BULLETPROOF] Fehler beim Rendern von Beet ${index}:`, bedError);
                          return (
                            <TableRow key={`error-${index}`}>
                              <TableCell colSpan={7} className="text-center text-red-600">
                                Fehler beim Laden von Beet {index + 1}
                              </TableCell>
                            </TableRow>
                          );
                        }
                      }).filter(Boolean);
                    } catch (mapError) {
                      console.error('[BULLETPROOF] KRITISCHER FEHLER in map():', mapError);
                      return (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-red-600">
                            KRITISCHER FEHLER: {mapError.message}
                          </TableCell>
                        </TableRow>
                      );
                    }
                  })()}
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
      {(() => {
        try {
          const availableNumbers = getAvailableBedNumbers();
          if (availableNumbers.length > 0) {
            return (
              <Card>
                <CardHeader>
                  <CardTitle>Verfügbare Beetplätze</CardTitle>
                  <CardDescription>
                    Freie Beetnummern für neue Beete
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {availableNumbers.slice(0, 10).map(number => (
                      <Link key={number} href={`/beds/new?bedNumber=${number}`}>
                        <Button variant="outline" size="sm">
                          Beet {number}
                        </Button>
                      </Link>
                    ))}
                    {availableNumbers.length > 10 && (
                      <span className="text-muted-foreground text-sm self-center">
                        ... und {availableNumbers.length - 10} weitere
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          }
          return null;
        } catch (err) {
          console.error('[BULLETPROOF] Fehler bei verfügbaren Beetplätzen:', err);
          return null;
        }
      })()}
    </div>
  );
}
