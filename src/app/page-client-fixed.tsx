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

// Sichere String-Konvertierung mit Null-Checks
const safeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
  if (typeof value === 'object') {
    // Verhindere Object-Rendering in React
    return JSON.stringify(value);
  }
  return String(value);
};

// Sichere Nummer-Konvertierung
const safeNumber = (value: any, defaultValue: number = 0): number => {
  if (typeof value === 'number' && !isNaN(value)) return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

export default function GardenOverviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Sichere Hooks
  const { beds, loading: bedsLoading, error: bedsError, deleteBed, refetch: refreshBeds } = useBeds();
  const { herbVarieties, loading: herbsLoading, error: herbsError } = useHerbVarieties();
  const { segments, loading: segmentsLoading, error: segmentsError } = useSegments();
  const { config, loading: configLoading, error: configError } = useGartenConfiguration();

  // Sichere Arrays mit useMemo - ULTRA-DEFENSIV
  const safeBedsArray = useMemo(() => {
    try {
      if (!beds || !Array.isArray(beds)) {
        return [];
      }
      return beds.filter(bed => bed && typeof bed === 'object' && bed.id);
    } catch (err) {
      console.error('[safeBedsArray] Error:', err);
      return [];
    }
  }, [beds]);

  const safeHerbsArray = useMemo(() => {
    try {
      if (!herbVarieties || !Array.isArray(herbVarieties)) {
        return [];
      }
      return herbVarieties.filter(herb => herb && typeof herb === 'object' && herb.id);
    } catch (err) {
      console.error('[safeHerbsArray] Error:', err);
      return [];
    }
  }, [herbVarieties]);

  const safeSegmentsArray = useMemo(() => {
    try {
      if (!segments || !Array.isArray(segments)) {
        return [];
      }
      return segments.filter(segment => segment && typeof segment === 'object' && segment.id);
    } catch (err) {
      console.error('[safeSegmentsArray] Error:', err);
      return [];
    }
  }, [segments]);

  const safeConfig = useMemo(() => {
    try {
      if (!config || typeof config !== 'object') {
        return { currentBeetCount: 20 };
      }
      return {
        currentBeetCount: safeNumber(config.currentBeetCount, 20)
      };
    } catch (err) {
      console.error('[safeConfig] Error:', err);
      return { currentBeetCount: 20 };
    }
  }, [config]);
  
  const loading = bedsLoading || herbsLoading || segmentsLoading || configLoading;
  const error = bedsError || herbsError || segmentsError || configError;

  // Sichere Hilfsfunktionen
  const getAvailableBedNumbers = (): number[] => {
    try {
      const usedNumbers = new Set(safeBedsArray.map(bed => safeNumber(bed.bedNumber, 0)));
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
      const herb = safeHerbsArray.find(h => h.id === herbId);
      return safeString(herb?.name || 'Unbekannt');
    } catch (err) {
      return 'Unbekannt';
    }
  };

  const getHerbColor = (herbId: string): string => {
    try {
      const herb = safeHerbsArray.find(h => h.id === herbId);
      const color = safeString(herb?.color || '#cccccc');
      return color.startsWith('#') ? color : '#cccccc';
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
          Fehler beim Laden der Daten: {safeString(error || 'Unbekannter Fehler')}
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
              {safeString(safeBedsArray?.length || 0)} von {safeString(safeConfig?.currentBeetCount || 20)} Beeten belegt
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              Aktualisieren
            </Button>
            <GardenExportPDFButton 
              beds={safeBedsArray} 
              segments={safeSegmentsArray}
              herbVarieties={safeHerbsArray}
              gartenConfiguration={safeConfig}
            />
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
              Darstellung der Beete 1 bis {safeString(safeConfig?.currentBeetCount || 20)}. Breiten sind proportional.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-row items-stretch overflow-x-auto space-x-1.5 bg-muted/20 rounded-lg border h-96 shadow-inner p-3 w-full">
              {Array.from({ length: Math.max(1, safeConfig?.currentBeetCount || 20) }, (_, i) => i + 1).map(slotNumber => {
                const bed = safeBedsArray.find(b => safeNumber(b.bedNumber, 0) === slotNumber);
                const isOccupied = !!bed;
                const bedWidth = safeNumber(bed?.width, 1.5);

                return (
                  <Link
                    href={isOccupied && bed ? `/beds/${bed.id}/edit` : `/beds/new?bedNumber=${slotNumber}`}
                    key={slotNumber}
                    className="block group h-full hover:opacity-80 transition-opacity duration-150 flex-grow"
                    style={{ flexGrow: bedWidth }}
                    title={isOccupied ? `Beet ${slotNumber} (${safeString(bed?.type || 'Unbekannt')})` : `Position ${slotNumber} frei`}
                  >
                    <div className="flex flex-col items-center h-full">
                      <span className="font-semibold text-xs mb-0.5 text-center w-full text-foreground">
                        {safeString(slotNumber)}
                      </span>
                      <div
                        className="w-full flex-grow rounded-md shadow-sm"
                        style={{ 
                          backgroundColor: isOccupied && bed ? (safeString(bed.color) || getHerbColor(safeString(bed.herbVarietyId || ''))) : '#f8fafc',
                          border: '1px solid rgba(0, 0, 0, 0.2)'
                        }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Beete-Tabelle mit allen Positionen */}
        <Card>
          <CardHeader>
            <CardTitle>Detailübersicht aller Beetpositionen</CardTitle>
            <CardDescription>
              Übersicht aller 20 Beetpositionen mit detaillierten Informationen
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-[hsl(40,40%,75%)] rounded-t-lg">
                <TableRow className="border-b-2 border-slate-400">
                  <TableHead className="w-[60px] font-bold text-slate-800">Nr.</TableHead>
                  <TableHead className="font-bold text-slate-800">Typ</TableHead>
                  <TableHead className="font-bold text-slate-800">Breite</TableHead>
                  <TableHead className="font-bold text-slate-800">
                    <span className="block">Sorte</span>
                    <span className="text-xs font-normal text-slate-700">(Untersorte)</span>
                  </TableHead>
                  <TableHead className="font-bold text-slate-800">
                    <span className="block">Pflanz-</span>
                    <span className="block">datum</span>
                  </TableHead>
                  <TableHead className="font-bold text-slate-800">Alter</TableHead>
                  <TableHead className="text-center font-bold text-slate-800">
                    <span className="block">Pflanzen</span>
                    <span className="block">bei Besatz</span>
                  </TableHead>
                  <TableHead className="text-center font-bold text-slate-800">
                    <span className="block">Pflanzen</span>
                    <span className="block">aktuell</span>
                  </TableHead>
                  <TableHead className="font-bold text-slate-800">Bemerkungen</TableHead>
                  <TableHead className="text-right font-bold text-slate-800">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: Math.max(1, safeConfig?.currentBeetCount || 20) }, (_, i) => i + 1).map(slotNumber => {
                  const bed = safeBedsArray.find(b => safeNumber(b.bedNumber, 0) === slotNumber);
                  
                  if (!bed) {
                    return (
                      <TableRow key={`slot-${slotNumber}`} className="bg-muted/30">
                        <TableCell>{safeString(slotNumber)}</TableCell>
                        <TableCell colSpan={8} className="text-muted-foreground italic">
                          Position {safeString(slotNumber)} unbelegt
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/beds/new?bedNumber=${slotNumber}`)}
                          >
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  // Berechne Details für das Beet
                  const bedSegments = getSegmentsForBed(bed.id);
                  let herbDetails = safeString(bed.type || 'Unbekannt');
                  let plantingDate = '-';
                  let ageInDays = '-';
                  let initialPlants = '-';
                  let currentPlants = '-';
                  
                  try {
                    if (safeString(bed.type) === 'Standard') {
                      const herbName = getHerbName(safeString((bed as any).herbVarietyId || ''));
                      const subVariety = safeString((bed as any).subVarietyName || '');
                      herbDetails = `${herbName}${subVariety ? ` (${subVariety})` : ''}`;
                      
                      const rawPlantingDate = (bed as any).plantingDate;
                      if (rawPlantingDate) {
                        try {
                          const plantDate = new Date(rawPlantingDate);
                          if (!isNaN(plantDate.getTime())) {
                            plantingDate = plantDate.toLocaleDateString('de-DE');
                            
                            const daysDiff = Math.floor((new Date().getTime() - plantDate.getTime()) / (1000 * 60 * 60 * 24));
                            ageInDays = daysDiff >= 0 ? `${daysDiff} Tage` : 'Zukunft';
                          }
                        } catch (dateErr) {
                          // Fehlerhaftes Datum ignorieren
                        }
                      }
                      
                      const numPlants = safeNumber((bed as any).numberOfPlants, 0);
                      initialPlants = safeString(numPlants);
                      
                      const productivePercent = safeNumber((bed as any).productivePlantsPercentage, 100);
                      const currentCount = Math.floor(numPlants * (productivePercent / 100));
                      currentPlants = `${safeString(currentCount)} (${safeString(productivePercent)}%)`;
                      
                    } else if (safeString(bed.type) === 'Versuchsbeet' && Array.isArray(bedSegments) && bedSegments.length > 0) {
                      const segmentDetails = bedSegments.map((s: any) => {
                        const herbName = getHerbName(safeString(s.herbVarietyId || ''));
                        const subVariety = safeString(s.subVarietyName || '');
                        const segLength = safeString(safeNumber(s.segmentLength, 0));
                        return `${herbName}${subVariety ? ` (${subVariety})` : ''} ${segLength}m`;
                      }).join(', ');
                      herbDetails = segmentDetails;
                      
                      // Für Versuchsbeete: Verwende das älteste Pflanzungsdatum
                      let earliestDate: string | null = null;
                      for (const s of bedSegments) {
                        if (s.plantingDate) {
                          if (!earliestDate) {
                            earliestDate = s.plantingDate;
                          } else {
                            try {
                              if (new Date(s.plantingDate) < new Date(earliestDate)) {
                                earliestDate = s.plantingDate;
                              }
                            } catch (err) {
                              // Ignore invalid dates
                            }
                          }
                        }
                      }
                      
                      if (earliestDate) {
                        try {
                          const plantDate = new Date(earliestDate);
                          if (!isNaN(plantDate.getTime())) {
                            plantingDate = plantDate.toLocaleDateString('de-DE');
                            
                            const daysDiff = Math.floor((new Date().getTime() - plantDate.getTime()) / (1000 * 60 * 60 * 24));
                            ageInDays = daysDiff >= 0 ? `${daysDiff} Tage` : 'Zukunft';
                          }
                        } catch (dateErr) {
                          // Fehlerhaftes Datum ignorieren
                        }
                      }
                      
                      const totalInitial = bedSegments.reduce((sum: number, s: any) => {
                        return sum + safeNumber(s.numberOfPlants, 0);
                      }, 0);
                      
                      const totalCurrent = bedSegments.reduce((sum: number, s: any) => {
                        const plants = safeNumber(s.numberOfPlants, 0);
                        const productive = safeNumber(s.productivePlantsPercentage, 100);
                        return sum + Math.floor(plants * (productive / 100));
                      }, 0);
                      
                      initialPlants = safeString(totalInitial);
                      currentPlants = safeString(totalCurrent);
                    }
                  } catch (detailErr) {
                    console.error('[bed details] Error:', detailErr);
                    // Fallback zu Standardwerten
                  }

                  return (
                    <TableRow key={`bed-${bed.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-2 border"
                            style={{ 
                              backgroundColor: safeString(bed.type) === 'Standard' 
                                ? getHerbColor(safeString((bed as any).herbVarietyId || ''))
                                : (safeString(bed.color) || '#cccccc')
                            }}
                          />
                          {safeString(bed.bedNumber || '?')}
                        </div>
                      </TableCell>
                      <TableCell>{safeString(bed.type || 'Unbekannt')}</TableCell>
                      <TableCell>{safeString(safeNumber(bed.bedWidth, 0))}m</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="whitespace-pre-wrap text-sm">
                          {herbDetails}
                        </div>
                      </TableCell>
                      <TableCell>{plantingDate}</TableCell>
                      <TableCell>{ageInDays}</TableCell>
                      <TableCell className="text-center">{initialPlants}</TableCell>
                      <TableCell className="text-center">{currentPlants}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {safeString(bed.remarks || '-')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/beds/${bed.id}/edit`)}
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
      </div>
    </TooltipProvider>
  );
}
