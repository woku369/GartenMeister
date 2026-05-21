'use client';

import { useBeds, useHerbVarieties, useSegments, useGartenConfiguration } from '@/lib/data-hooks';
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

export default function GardenOverviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Sichere Hook-Zugriffe mit Fallbacks
  const bedsHook = useBeds() || {};
  const herbsHook = useHerbVarieties() || {};
  const segmentsHook = useSegments() || {};
  const configHook = useGartenConfiguration() || {};

  // Triple-Safety: Hook + Property + Array-Check
  const beds = bedsHook?.beds;
  const herbVarieties = herbsHook?.herbVarieties;
  const segments = segmentsHook?.segments;
  const config = configHook?.config;
  
  // Garantiert sichere Arrays - niemals undefined
  const bedsArray = Array.isArray(beds) ? beds : [];
  const herbsArray = Array.isArray(herbVarieties) ? herbVarieties : [];
  const segmentsArray = Array.isArray(segments) ? segments : [];
  
  const currentBeetCount = config?.currentBeetCount || 20;
  const loading = bedsHook?.loading || herbsHook?.loading || segmentsHook?.loading || configHook?.loading || false;
  const error = bedsHook?.error || herbsHook?.error || segmentsHook?.error || configHook?.error || null;

  // Debug-Log für Troubleshooting
  console.log('[GartenOverview] Safety Check:', {
    bedsHookExists: !!bedsHook,
    bedsExists: !!beds,
    bedsIsArray: Array.isArray(beds),
    bedsArrayLength: bedsArray.length,
    loading,
    error
  });

  // Hilfsfunktionen mit absolut sicheren Arrays
  const getAvailableBedNumbers = (): number[] => {
    // Extra Safety: Prüfe ob bedsArray wirklich ein Array ist
    if (!Array.isArray(bedsArray) || bedsArray.length === 0) {
      const available: number[] = [];
      for (let i = 1; i <= currentBeetCount; i++) {
        available.push(i);
      }
      return available;
    }
    
    const occupied = new Set(bedsArray.map(bed => bed?.bedNumber).filter(num => num != null));
    const available: number[] = [];
    for (let i = 1; i <= currentBeetCount; i++) {
      if (!occupied.has(i)) {
        available.push(i);
      }
    }
    return available.sort((a, b) => a - b);
  };

  const handleDeleteBed = async (bedId: string) => {
    try {
      if (bedsHook?.deleteBed) {
        await bedsHook.deleteBed(bedId);
        toast({
          title: 'Erfolg!',
          description: 'Beet wurde gelöscht.',
        });
      }
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

  const getHerbName = (herbId: string): string => {
    if (!Array.isArray(herbsArray) || !herbId) return 'Unbekannt';
    return herbsArray.find(h => h?.id === herbId)?.name || 'Unbekannt';
  };

  const getHerbColor = (herbId: string): string => {
    if (!Array.isArray(herbsArray) || !herbId) return '#cccccc';
    return herbsArray.find(h => h?.id === herbId)?.color || '#cccccc';
  };

  const getSegmentsForBed = (bedId: string) => {
    if (!Array.isArray(segmentsArray) || !bedId) return [];
    return segmentsArray.filter(s => s?.bedId === bedId);
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
          <h1 className="text-3xl font-bold">Gartenübersicht</h1>
          <p className="text-muted-foreground">
            {bedsArray.length} von {currentBeetCount} Beeten belegt
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Aktualisieren
          </Button>
          <GardenExportPDFButton beds={bedsArray} />
          <HarvestInitiatorButton />
          <Link href="/beds/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Neues Beet
            </Button>
          </Link>
        </div>
      </div>

      {/* Beete-Tabelle */}
      <Card>
        <CardHeader>
          <CardTitle>Aktive Beete</CardTitle>
          <CardDescription>
            Übersicht aller angelegten Beete im Garten
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bedsArray.length > 0 ? (
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
                  {Array.isArray(bedsArray) && bedsArray.length > 0 ? bedsArray.map((bed, index) => {
                    // Extra safety für jedes einzelne Beet
                    if (!bed || !bed.id) return null;
                    
                    const bedSegments = getSegmentsForBed(bed.id);
                    
                    return (
                      <TableRow key={bed?.id || index}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <div
                              className="w-4 h-4 rounded-full mr-2 border"
                              style={{ 
                                backgroundColor: bed.type === 'Standard' 
                                  ? getHerbColor((bed as any).herbVarietyId)
                                  : bed.color 
                              }}
                            />
                            {bed.bedNumber}
                          </div>
                        </TableCell>
                        <TableCell>{bed.type}</TableCell>
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
                                        {Array.isArray(bedSegments) && bedSegments.length > 0 ? bedSegments.map((segment, segIndex) => (
                                          <div key={segment?.id || segIndex} className="text-xs">
                                            {getHerbName(segment?.herbVarietyId || '')} ({segment?.segmentLength || 0}m)
                                          </div>
                                        )) : null}
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
                          {bed.width}m × {bed.length}m
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
                  }) : null}
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
      {getAvailableBedNumbers().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Verfügbare Beetplätze</CardTitle>
            <CardDescription>
              Freie Beetnummern für neue Beete
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(getAvailableBedNumbers()) ? getAvailableBedNumbers().slice(0, 10).map(number => (
                <Link key={number} href={`/beds/new?bedNumber=${number}`}>
                  <Button variant="outline" size="sm">
                    Beet {number}
                  </Button>
                </Link>
              )) : null}
              {getAvailableBedNumbers().length > 10 && (
                <span className="text-muted-foreground text-sm self-center">
                  ... und {getAvailableBedNumbers().length - 10} weitere
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
