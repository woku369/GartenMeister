'use client';

import { useBeds, useHerbVarieties, useSegments, useGartenConfiguration } from '@/lib/data-hooks-safe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PlusCircle, Edit, Loader2, Trash2, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import HarvestInitiatorButton from '@/components/layout/HarvestInitiatorButton';
import GardenExportPDFButton from '@/components/ui/garden-export-pdf-button';
import { useMemo } from 'react';

export default function GardenOverviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Sichere Hooks
  const { beds, loading: bedsLoading, error: bedsError, deleteBed, refetch: refreshBeds } = useBeds();
  const { herbVarieties, loading: herbsLoading, error: herbsError } = useHerbVarieties();
  const { segments, loading: segmentsLoading, error: segmentsError } = useSegments();
  const { config, loading: configLoading, error: configError } = useGartenConfiguration();

  // Sichere Arrays mit useMemo
  const safeBedsArray = useMemo(() => {
    if (!beds || !Array.isArray(beds)) {
      return [];
    }
    return beds.filter(bed => bed && typeof bed === 'object' && bed.id);
  }, [beds]);

  const safeHerbsArray = useMemo(() => {
    if (!herbVarieties || !Array.isArray(herbVarieties)) {
      return [];
    }
    return herbVarieties.filter(herb => herb && typeof herb === 'object' && herb.id);
  }, [herbVarieties]);

  const safeSegmentsArray = useMemo(() => {
    if (!segments || !Array.isArray(segments)) {
      return [];
    }
    return segments.filter(segment => segment && typeof segment === 'object' && segment.id);
  }, [segments]);

  const safeConfig = useMemo(() => {
    if (!config || typeof config !== 'object') {
      return { currentBeetCount: 20 };
    }
    return {
      currentBeetCount: typeof config.currentBeetCount === 'number' ? config.currentBeetCount : 20
    };
  }, [config]);
  
  const loading = bedsLoading || herbsLoading || segmentsLoading || configLoading;
  const error = bedsError || herbsError || segmentsError || configError;

  // Sichere Hilfsfunktionen
  const getAvailableBedNumbers = (): number[] => {
    try {
      const usedNumbers = new Set(safeBedsArray.map(bed => bed.bedNumber));
      const available: number[] = [];
      for (let i = 1; i <= safeConfig.currentBeetCount; i++) {
        if (!usedNumbers.has(i)) {
          available.push(i);
        }
      }
      return available.sort((a, b) => a - b);
    } catch (err) {
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
      return 'Unbekannt';
    }
  };

  const getHerbColor = (herbId: string): string => {
    try {
      return safeHerbsArray.find(h => h.id === herbId)?.color || '#cccccc';
    } catch (err) {
      return '#cccccc';
    }
  };

  const getSegmentsForBed = (bedId: string) => {
    try {
      return safeSegmentsArray.filter(s => s.bedId === bedId);
    } catch (err) {
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
        <div className="text-destructive mb-4">
          Fehler beim Laden der Daten: {typeof error === 'string' ? error : 'Unbekannter Fehler'}
        </div>
        <Button onClick={handleRefresh} className="mt-4">
          <RotateCcw className="mr-2 h-4 w-4" />
          Neu laden
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gartenübersicht</h1>
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
            <HarvestInitiatorButton herbVarieties={safeHerbsArray} />
            <Link href="/beds/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Neues Beet
              </Button>
            </Link>
          </div>
        </div>

        {/* Beetvisualisierung */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Gartenplan Visualisierung</CardTitle>
            <CardDescription>
              Darstellung der Beete 1 bis {safeConfig.currentBeetCount}. Breiten sind proportional.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-row items-stretch overflow-x-auto space-x-1.5 bg-muted/20 rounded-lg border h-96 shadow-inner p-3 w-full">
              {Array.from({ length: safeConfig.currentBeetCount }, (_, i) => i + 1).map(slotNumber => {
                const bed = safeBedsArray.find(b => b.bedNumber === slotNumber);
                const isOccupied = !!bed;
                const bedWidth = bed?.width || 1.5;

                const handleBedClick = () => {
                  const targetUrl = isOccupied && bed ? `/beds/${bed.id}/edit` : `/beds/new?bedNumber=${slotNumber}`;
                  if (typeof window !== 'undefined' && window.electronAPI?.navigateTo) {
                    window.electronAPI.navigateTo(targetUrl);
                  } else {
                    window.location.href = targetUrl;
                  }
                };

                return (
                  <div
                    key={slotNumber}
                    className="block group h-full hover:opacity-80 transition-opacity duration-150 flex-grow cursor-pointer"
                    style={{ flexGrow: bedWidth }}
                    title={isOccupied ? `Beet ${slotNumber} (${bed.type})` : `Position ${slotNumber} frei`}
                    onClick={handleBedClick}
                  >
                    <div className="flex flex-col items-center h-full">
                      <span className="font-semibold text-xs mb-0.5 text-center w-full text-foreground">
                        {slotNumber}
                      </span>
                      <div
                        className="w-full flex-grow rounded-md shadow-sm"
                        style={{ 
                          backgroundColor: isOccupied && bed ? (bed.color || getHerbColor(bed.herbVarietyId || '')) : '#f8fafc',
                          border: '1px solid rgba(0, 0, 0, 0.2)'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Beete-Tabelle */}
        <Card>
          <CardHeader>
            <CardTitle>Meine Beete</CardTitle>
            <CardDescription>
              Übersicht aller angelegten Beete im Garten
            </CardDescription>
          </CardHeader>
          <CardContent>
            {safeBedsArray.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Beet Nr.</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Inhalt</TableHead>
                      <TableHead>Größe</TableHead>
                      <TableHead>Pflanzzeit</TableHead>
                      <TableHead>Bemerkungen</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeBedsArray.map((bed, index) => {
                      if (!bed || typeof bed !== 'object' || !bed.id) {
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
                                          {bedSegments.map((segment: any) => (
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
                            {bed.width || 0}m × {bed.length || 0}m
                          </TableCell>
                          <TableCell>
                            {(bed as any).plantingDate ? new Date((bed as any).plantingDate).toLocaleDateString('de-DE') : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-32 truncate" title={(bed as any).remarks || ''}>
                              {(bed as any).remarks || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  if (typeof window !== 'undefined' && window.electronAPI?.navigateTo) {
                                    window.electronAPI.navigateTo(`/beds/${bed.id}/edit`);
                                  } else {
                                    window.location.href = `/beds/${bed.id}/edit`;
                                  }
                                }}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Bearbeiten</span>
                              </Button>
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
                    }).filter(Boolean)}
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
      </div>
    </TooltipProvider>
  );
}
