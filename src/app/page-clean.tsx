'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PlusCircle, Edit, ListFilter, Download, Loader2, Trash2, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { DEFAULT_GARTEN_CONFIG, HerbVariety, BaseBed, Bed, StandardBed, SpecialBed, Versuchsbeet, VersuchsbeetSegment, GartenConfiguration } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import HarvestInitiatorButton from '@/components/layout/HarvestInitiatorButton';
import GardenExportPDFButton from '@/components/ui/garden-export-pdf-button';
import Link from 'next/link';

// Neue saubere Hooks verwenden - KEIN LEGACY CODE MEHR
import { useBeds, useHerbVarieties, useSegments, useGartenConfiguration } from '@/lib/data-hooks';

const DEFAULT_SEGMENT_COLOR = 'rgba(220, 220, 220, 0.8)';
const UNOCCUPIED_BED_COLOR = 'hsl(var(--card))';
const UNOCCUPIED_SEGMENT_COLOR = 'hsl(var(--card))';
const REFERENCE_WIDTH_UNOCCUPIED_M = 1.5; // Meter
const REFERENCE_WIDTH_UNOCCUPIED_PX = 48; // Pixel, entspricht w-12
const PIXELS_PER_METER = REFERENCE_WIDTH_UNOCCUPIED_PX / REFERENCE_WIDTH_UNOCCUPIED_M; // 32px/m

const calculatePlantAge = (plantingDate: string): number => {
  const plantYear = new Date(plantingDate).getFullYear();
  const currentYear = new Date().getFullYear();
  return Math.max(0, currentYear - plantYear);
};

const calculateInitialPlants = (entity: StandardBed | VersuchsbeetSegment): number => {
  const length = 'segmentLength' in entity ? entity.segmentLength : entity.length;
  return Math.floor((length || 0) * (entity.plantsPerMeter || 0));
};

const calculateCurrentPlants = (entity: StandardBed | VersuchsbeetSegment): number => {
  const initialPlants = calculateInitialPlants(entity);
  return Math.floor(initialPlants * ((entity.productivePlantsPercentage || 0) / 100));
};

export default function GardenOverviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Neue saubere Hooks verwenden - KOMPLETT BEREINIGT
  const { beds, loading: bedsLoading, error: bedsError, deleteBed, refetch: refetchBeds } = useBeds();
  const { herbVarieties, loading: herbsLoading, refetch: refetchHerbs } = useHerbVarieties();
  const { segments, loading: segmentsLoading, refetch: refetchSegments } = useSegments();
  const { config, loading: configLoading, refetch: refetchConfig } = useGartenConfiguration();

  const loading = bedsLoading || herbsLoading || segmentsLoading || configLoading;
  const error = bedsError; // Hauptfehler aus Beeten

  // PHASE 1: Dynamische Beetanzahl aus Konfiguration
  const currentBeetCount = config?.currentBeetCount || DEFAULT_GARTEN_CONFIG.currentBeetCount;

  // Refetch-Funktion für alle Daten
  const refreshData = async () => {
    await Promise.all([
      refetchBeds(),
      refetchHerbs(),
      refetchSegments(),
      refetchConfig(),
    ]);
  };

  // Funktion zum Erstellen eines neuen Beets
  const handleCreateBed = () => {
    router.push('/beds/new');
  };

  // Funktion zum Löschen eines Beets
  const handleDeleteBed = async (bedId: string) => {
    try {
      const success = await deleteBed(bedId);
      if (success) {
        toast({
          title: "Beet gelöscht",
          description: "Das Beet wurde erfolgreich gelöscht",
        });
      } else {
        throw new Error('Delete operation failed');
      }
    } catch (err) {
      console.error('Error deleting bed:', err);
      toast({
        title: "Fehler",
        description: "Fehler beim Löschen des Beets",
        variant: "destructive",
      });
    }
  };

  // Mapping für Kräuter
  const herbMap = new Map<string, HerbVariety>();
  if (herbVarieties && Array.isArray(herbVarieties)) {
    herbVarieties.forEach(herb => {
      herbMap.set(herb.id, herb);
    });
  }

  // Mapping für Beete
  const bedMap = new Map(beds.map(bed => [bed.bedNumber, bed]));

  // Mapping für Segmente
  const segmentMapByBedId = new Map<string, VersuchsbeetSegment[]>();
  segments.forEach(segment => {
    if (!segmentMapByBedId.has(segment.bedId)) {
      segmentMapByBedId.set(segment.bedId, []);
    }
    segmentMapByBedId.get(segment.bedId)!.push(segment);
  });

  // Segmente nach Pflanzungsdatum sortieren
  segmentMapByBedId.forEach((segmentsList) => {
    segmentsList.sort((a, b) => new Date(a.plantingDate).getTime() - new Date(b.plantingDate).getTime());
  });

  const currentDate = new Date().toLocaleDateString('de-DE', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Lade Gartenübersicht...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 text-center text-red-500">
        <p>{error}</p>
        <Button onClick={refreshData} className="mt-4">Neu laden</Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8 print:py-4">
        {/* Hinweis bei komplett leerem Store */}
        {beds.length === 0 && (
          <Card className="text-center py-12 shadow-md print:shadow-none print:border-none print:py-4 mb-8">
            <CardHeader>
              <div className="mx-auto bg-secondary p-3 rounded-full w-fit mb-2 print:hidden">
                <ListFilter className="h-10 w-10 text-secondary-foreground" />
              </div>
              <CardTitle>Noch keine Beete vorhanden</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">Es wurden noch keine Beete angelegt. Jetzt das erste Beet anlegen!</CardDescription>
              <Button asChild size="lg" className="print:hidden">
                <Link href="/beds/new">
                  <PlusCircle className="mr-2 h-5 w-5" /> Erstes Beet anlegen
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between items-center mb-2 print:mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gartenübersicht Stiftsgarten Gurk   &ndash;   Bewirtschaftungsjahr {new Date().getFullYear()}</h1>
            <p className="text-muted-foreground">Aktuelle Ansicht Stand: {currentDate}</p>
            <p className="text-sm text-muted-foreground">Konfiguriert für {currentBeetCount} Beete | {beds.length} Beete angelegt</p>
          </div>
          <div className="flex space-x-2 print:hidden">
            <Button onClick={refreshData} variant="outline" size="sm">
              <RotateCcw className="mr-2 h-4 w-4" /> Aktualisieren
            </Button>
            <HarvestInitiatorButton herbVarieties={herbVarieties} />
            <Button onClick={handleCreateBed}>
                <PlusCircle className="mr-2 h-4 w-4" /> Neues Beet anlegen
            </Button>
          </div>
        </div>

        <Card className="mb-8 shadow-lg" id="garden-visualization-card">
          <CardHeader className="print:hidden">
            <CardTitle>Gartenplan Visualisierung</CardTitle>
            <CardDescription>
              Darstellung der Beete 1 bis {currentBeetCount}. Breiten sind proportional.
            </CardDescription>
            <div className="flex justify-end mt-2 space-x-2">
              {/* Gartenplan-Visualisierung als PDF exportieren */}
              {!loading && beds.length > 0 && (
                <GardenExportPDFButton 
                  beds={beds.map(bed => {
                    // Sicheres Mapping mit zusätzlicher Fehlerbehandlung
                    let name = `Beet ${bed.bedNumber}`;
                    let color = bed.color || DEFAULT_SEGMENT_COLOR;
                    
                    try {
                      if (bed.type === 'Standard') {
                        const standardBed = bed as StandardBed;
                        if (standardBed.herbVarietyId && herbMap.has(standardBed.herbVarietyId)) {
                          const herb = herbMap.get(standardBed.herbVarietyId);
                          if (herb && herb.name) {
                            name = herb.name;
                          }
                        }
                      }
                    } catch (error) {
                      console.warn('Error mapping bed name:', error);
                    }
                    
                    return {
                      ...bed,
                      displayName: name,
                      displayColor: color
                    };
                  })}
                  segments={segments}
                  herbVarieties={herbVarieties}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Gartenplan Visualisierung */}
            <div className="space-y-4">
              {/* Legende */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs print:grid-cols-6">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Belegt</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-300 rounded border"></div>
                  <span>Unbelegt</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Versuchsbeet</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span>Spezialbeet</span>
                </div>
              </div>

              {/* Gartenraster */}
              <div className="grid grid-cols-10 gap-2 print:grid-cols-20">
                {Array.from({ length: currentBeetCount }, (_, i) => {
                  const bedNumber = i + 1;
                  const bed = bedMap.get(bedNumber);
                  
                  if (!bed) {
                    // Unbesetztes Beet
                    return (
                      <div
                        key={bedNumber}
                        className="relative border border-dashed border-gray-300 rounded p-2 text-center text-xs print:text-[10px] bg-gray-50"
                        style={{
                          minHeight: '60px',
                          width: `${REFERENCE_WIDTH_UNOCCUPIED_PX}px`
                        }}
                      >
                        <div className="font-medium text-gray-400">{bedNumber}</div>
                        <div className="text-gray-400 mt-1">Leer</div>
                      </div>
                    );
                  }

                  // Besetzte Beete
                  const widthPx = Math.max(32, bed.width * PIXELS_PER_METER);
                  
                  if (bed.type === 'Standard') {
                    const standardBed = bed as StandardBed;
                    const herb = herbMap.get(standardBed.herbVarietyId || '');
                    const herbName = herb?.name || 'Unbekannt';
                    const herbColor = herb?.color || '#22c55e';
                    
                    return (
                      <Tooltip key={bed.id}>
                        <TooltipTrigger asChild>
                          <div
                            className="relative border border-gray-200 rounded p-2 text-center text-xs print:text-[10px] shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            style={{
                              backgroundColor: herbColor,
                              minHeight: '60px',
                              width: `${widthPx}px`,
                              color: 'white',
                              textShadow: '1px 1px 1px rgba(0,0,0,0.5)'
                            }}
                            onClick={() => router.push(`/beds/${bed.id}`)}
                          >
                            <div className="font-medium">{bed.bedNumber}</div>
                            <div className="mt-1 text-xs truncate">{herbName}</div>
                            <div className="text-xs opacity-90">
                              {calculateCurrentPlants(standardBed)} Pfl.
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <div className="font-medium">Beet {bed.bedNumber}: {herbName}</div>
                            <div>Größe: {bed.width} × {bed.length} m</div>
                            <div>Pflanzen: {calculateCurrentPlants(standardBed)} / {calculateInitialPlants(standardBed)}</div>
                            <div>Alter: {calculatePlantAge(standardBed.plantingDate)} Jahre</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  if (bed.type === 'Versuchsbeet') {
                    const versuchsbeet = bed as Versuchsbeet;
                    const bedSegments = segmentMapByBedId.get(bed.id) || [];
                    
                    return (
                      <Tooltip key={bed.id}>
                        <TooltipTrigger asChild>
                          <div
                            className="relative border border-blue-300 rounded p-1 text-center text-xs print:text-[10px] bg-blue-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            style={{
                              minHeight: '60px',
                              width: `${widthPx}px`
                            }}
                            onClick={() => router.push(`/beds/${bed.id}`)}
                          >
                            <div className="font-medium text-blue-800">{bed.bedNumber}</div>
                            <div className="text-blue-700 mt-1">Versuch</div>
                            <div className="text-blue-600 text-xs">
                              {bedSegments.length} Seg.
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <div className="font-medium">Versuchsbeet {bed.bedNumber}</div>
                            <div>Größe: {bed.width} × {bed.length} m</div>
                            <div>Segmente: {bedSegments.length}</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  if (bed.type === 'Spezialbeet') {
                    const specialBed = bed as SpecialBed;
                    
                    return (
                      <Tooltip key={bed.id}>
                        <TooltipTrigger asChild>
                          <div
                            className="relative border border-purple-300 rounded p-2 text-center text-xs print:text-[10px] bg-purple-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            style={{
                              minHeight: '60px',
                              width: `${widthPx}px`
                            }}
                            onClick={() => router.push(`/beds/${bed.id}`)}
                          >
                            <div className="font-medium text-purple-800">{bed.bedNumber}</div>
                            <div className="text-purple-700 mt-1 truncate">{specialBed.specialPurpose}</div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <div className="font-medium">Spezialbeet {bed.bedNumber}</div>
                            <div>Zweck: {specialBed.specialPurpose}</div>
                            <div>Größe: {bed.width} × {bed.length} m</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Beetliste */}
        {beds.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader className="flex-row items-center justify-between print:hidden">
              <div>
                <CardTitle>Aktuelle Beete</CardTitle>
                <CardDescription>
                  Übersicht aller angelegten Beete mit Details
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => window.open('/api/export/beds-overview', '_blank')}
                  variant="outline"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  PDF Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nr.</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Inhalt</TableHead>
                    <TableHead>Größe</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="print:hidden">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {beds
                    .sort((a, b) => a.bedNumber - b.bedNumber)
                    .map((bed) => {
                      const herb = bed.type === 'Standard' 
                        ? herbMap.get((bed as StandardBed).herbVarietyId || '') 
                        : null;
                      
                      return (
                        <TableRow key={bed.id}>
                          <TableCell className="font-medium">{bed.bedNumber}</TableCell>
                          <TableCell>
                            <span className={cn(
                              "inline-flex items-center px-2 py-1 rounded-full text-xs",
                              bed.type === 'Standard' && "bg-green-100 text-green-800",
                              bed.type === 'Versuchsbeet' && "bg-blue-100 text-blue-800",
                              bed.type === 'Spezialbeet' && "bg-purple-100 text-purple-800"
                            )}>
                              {bed.type}
                            </span>
                          </TableCell>
                          <TableCell>
                            {bed.type === 'Standard' && herb?.name}
                            {bed.type === 'Versuchsbeet' && 
                              `${segmentMapByBedId.get(bed.id)?.length || 0} Segmente`}
                            {bed.type === 'Spezialbeet' && (bed as SpecialBed).specialPurpose}
                          </TableCell>
                          <TableCell>{bed.width} × {bed.length} m</TableCell>
                          <TableCell>
                            {bed.isActive ? (
                              <span className="text-green-600 font-medium">Aktiv</span>
                            ) : (
                              <span className="text-gray-500">Inaktiv</span>
                            )}
                          </TableCell>
                          <TableCell className="print:hidden">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/beds/${bed.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteBed(bed.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
