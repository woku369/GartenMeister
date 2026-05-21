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
  const { beds, loading: bedsLoading, error: bedsError, deleteBed } = useBeds();
  const { herbVarieties, loading: herbsLoading } = useHerbVarieties();
  const { segments, loading: segmentsLoading } = useSegments();
  const { config, loading: configLoading } = useGartenConfiguration();

  const loading = bedsLoading || herbsLoading || segmentsLoading || configLoading;
  const error = bedsError; // Hauptfehler aus Beeten

  // PHASE 1: Dynamische Beetanzahl aus Konfiguration
  const currentBeetCount = config?.currentBeetCount || DEFAULT_GARTEN_CONFIG.currentBeetCount;
      try {
        const configResponse = await fetch('/api/garten-configuration');
        if (configResponse.ok) {
          const newConfig: GartenConfiguration = await configResponse.json();
          if (gartenConfiguration && newConfig.lastModified !== gartenConfiguration.lastModified) {
            console.log('Garden configuration changed detected via polling, refreshing...');
            fetchData();
          }
        }
      } catch (error) {
        console.warn('Polling check failed:', error);
      }
    }, 300000); // Alle 5 Minuten statt 30 Sekunden - Performance-Fix
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('garden-config-updated' as any, handleCustomEvent);
      clearInterval(pollingInterval);
    };
  }, [gartenConfiguration]); // Abhängigkeit hinzugefügt für Polling-Vergleich
  
  // Funktion zum Erstellen eines neuen Beets
  const handleCreateBed = async () => {
    router.push('/beds/new');
  };
  
  // Funktion zum Löschen eines Beets
  const handleDeleteBed = async (bedId: string) => {
    try {
      const response = await fetch('/api/beds', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: bedId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete bed');
      }
      
      // Nach dem Löschen Daten neu laden
      await fetchData();
      toast({
        title: "Beet gelöscht",
        description: "Das Beet wurde erfolgreich gelöscht",
      });
    } catch (err) {
      console.error('Error deleting bed:', err);
      toast({
        title: "Fehler",
        description: "Fehler beim Löschen des Beets",
        variant: "destructive",
      });
    }
  };


   const handleDownloadPDF = async () => {
    try {
      // Open the PDF in a new tab/window
      window.open('/api/export/beds-overview', '_blank');
       // Alternatively, to force download:
      // const response = await fetch('/api/export/beds-overview');
      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = 'beetuebersicht.pdf';
      // document.body.appendChild(a);
      // a.click();
      // document.body.removeChild(a);
      // window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error initiating PDF download:', error);
      alert('Fehler beim Starten des PDF-Downloads.');
    }
  };

  const herbMap = new Map<string, HerbVariety>();
  if (allHerbVarieties && Array.isArray(allHerbVarieties)) {
    allHerbVarieties.forEach(herb => {
      herbMap.set(herb.id, herb);
    });
  }

   const bedMap = new Map(beds.map(bed => [bed.bedNumber, bed]));

  const segmentMapByBedId = new Map<string, VersuchsbeetSegment[]>();
  allSegments.forEach(segment => {
    if (!segmentMapByBedId.has(segment.bedId)) {
      segmentMapByBedId.set(segment.bedId, []);
    }
    segmentMapByBedId.get(segment.bedId)!.push(segment);
  });

  segmentMapByBedId.forEach((segmentsList) => {
    segmentsList.sort((a, b) => new Date(a.plantingDate).getTime() - new Date(b.plantingDate).getTime());
  });

   const currentDate = new Date().toLocaleDateString('de-DE', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  if (loading || !dataReady) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">
          {!dataReady ? 'Lade gespeicherte Daten...' : 'Lade Gartenübersicht...'}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 text-center text-red-500">
        <p>{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">Neu laden</Button>
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
            <Button onClick={fetchData} variant="outline" size="sm">
              <RotateCcw className="mr-2 h-4 w-4" /> Aktualisieren
            </Button>
            <HarvestInitiatorButton herbVarieties={allHerbVarieties} />
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
                    } catch (err) {
                      console.warn('Fehler beim Beetname-Mapping:', err);
                    }
                    
                    return {
                      ...bed,
                      name,
                      color
                    };
                  })}                  segments={allSegments}
                  herbVarieties={allHerbVarieties}
                  gartenConfiguration={gartenConfiguration || undefined} // PHASE 1: GartenConfiguration übergeben
                  disabled={beds.length === 0} 
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4">            <div className="flex flex-row items-stretch overflow-x-auto space-x-1.5 bg-muted/20 rounded-lg border h-96 shadow-inner p-3 print:overflow-visible print:space-x-1 print:p-1 print:h-auto print:border-0 print:bg-transparent print:shadow-none w-full">
              {Array.from({ length: currentBeetCount }, (_, i) => i + 1).map(slotNumber => {
                const bed = bedMap.get(slotNumber);
                const isOccupied = !!bed;
                const bedWidthPx = (bed ? bed.width : REFERENCE_WIDTH_UNOCCUPIED_M) * PIXELS_PER_METER;

                const bedBorderColorClass = isOccupied && bed && bed.color !== UNOCCUPIED_BED_COLOR && bed.color !== DEFAULT_SEGMENT_COLOR ? 'border-black/50' : 'border-border';
                const numberColorClass = 'text-foreground';

                let bedContentVisual;
                const tooltipTitleParts: string[] = [];
                if (isOccupied && bed) {
                  tooltipTitleParts.push(`Beet ${slotNumber}: ${bed.type}`);
                  if (bed.type === 'Standard') {
                     tooltipTitleParts.push(`Kraut: ${herbMap.get((bed as StandardBed).herbVarietyId)?.name || 'Unbek.'}`);
                  }
                   // Safely access bed.length for tooltip
                  tooltipTitleParts.push(`Maße: ${bed.width}m x ${bed.length ?? '?'}m`);
                } else {
                  tooltipTitleParts.push(`Position ${slotNumber} frei (angen. ${REFERENCE_WIDTH_UNOCCUPIED_M}m breit)`);
                }

                if (bed && bed.type === 'Versuchsbeet') {
                  const bedSegments = segmentMapByBedId.get(bed.id) || [];
                   // Access bed.length, assuming Versuchsbeet always has length
                  const versuchsbeetLength = bed.length || 0; // Use 0 as fallback, though type implies number
                  tooltipTitleParts.push(`Segmente: ${bedSegments.length}, GesamtL: ${versuchsbeetLength}m`);

                  if (bedSegments.length > 0 && versuchsbeetLength > 0) {
                    let accumulatedLength = 0;

                    bedContentVisual = (
                      <div
                        className={cn(
                          "w-full flex-grow rounded-sm shadow-sm group-hover:shadow-md transition-shadow duration-200 border flex flex-col overflow-hidden print:shadow-none",
                          bedBorderColorClass
                        )}
                      >
                        {bedSegments.map((segment) => {
                          const herb = herbMap.get(segment.herbVarietyId);
                          const segmentColor = herb?.color || DEFAULT_SEGMENT_COLOR;
                           // Safely calculate height percentage
                          const segmentHeightPercentage = (segment.segmentLength / versuchsbeetLength) * 100;
                          accumulatedLength += segment.segmentLength;

                          tooltipTitleParts.push(`  - ${herb?.name || 'Unbek.'} (${segment.segmentLength}m) Farbe: ${segmentColor}`);                          return (
                            <div
                              key={segment.id}                              style={{
                                backgroundColor: segmentColor,
                                height: `${segmentHeightPercentage}%`,
                                border: '1px solid rgba(0, 0, 0, 0.4)' // Grauton (40% schwarz) für dezentere Haarlinie
                              }}
                              className="w-full last:border-b-0 print:border-black/30"
                              title={`Segment: ${herb?.name || 'Unbekannt'} (${segment.segmentLength}m), Kraut-Farbe: ${segmentColor}`}
                            />
                          );
                        })}
                         {/* Safely calculate remaining height percentage */}                        {accumulatedLength < versuchsbeetLength && versuchsbeetLength > 0 && (
                          <div
                            style={{
                              backgroundColor: UNOCCUPIED_SEGMENT_COLOR,
                              height: `${((versuchsbeetLength - accumulatedLength) / versuchsbeetLength) * 100}%`,
                              border: '1px solid rgba(0, 0, 0, 0.4)' // Grauton (40% schwarz) für dezentere Haarlinie
                            }}
                            className="w-full"
                            title={`Unbelegt (${(versuchsbeetLength - accumulatedLength).toFixed(1)}m)`}
                          />
                        )}
                      </div>
                    );
                  } else {                    bedContentVisual = (
                      <div
                        className={cn(
                          "w-full flex-grow rounded-md shadow-sm group-hover:shadow-md transition-shadow duration-200 print:shadow-none",
                          bedBorderColorClass
                        )}
                        style={{ 
                          backgroundColor: bed.color || DEFAULT_SEGMENT_COLOR,
                          border: '1px solid rgba(0, 0, 0, 0.4)' // Grauton (40% schwarz) für dezentere Haarlinie
                        }}
                        title={`Versuchsbeet (leer), Farbe: ${bed.color || DEFAULT_SEGMENT_COLOR}`}
                      />
                    );
                  }
                } else {
                  let bedBackgroundColor = UNOCCUPIED_BED_COLOR;
                  if (isOccupied && bed) {
                     bedBackgroundColor = bed.color || DEFAULT_SEGMENT_COLOR;
                  }                  bedContentVisual = (
                    <div
                      className={cn(
                        "w-full flex-grow rounded-md shadow-sm group-hover:shadow-md transition-shadow duration-200 print:shadow-none",
                        bedBorderColorClass
                      )}
                      style={{ 
                        backgroundColor: bedBackgroundColor,
                        border: '1px solid rgba(0, 0, 0, 0.4)' // Grauton (40% schwarz) für dezentere Haarlinie
                      }}
                    />
                  );
                }

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
                    className="block group h-full hover:opacity-80 transition-opacity duration-150 print:hover:opacity-100 flex-grow cursor-pointer"
                    style={{ flexGrow: bed ? bed.width || 1 : REFERENCE_WIDTH_UNOCCUPIED_M }}
                    title={tooltipTitleParts.join(' | ')}
                    aria-label={isOccupied && bed ? `Beet ${slotNumber} (${bed.type}) bearbeiten` : `Neues Beet an Position ${slotNumber} anlegen`}
                    onClick={handleBedClick}
                  >
                    <div className="flex flex-col items-center h-full">
                      <span className={cn("font-semibold text-xs mb-0.5 text-center w-full print:text-[8px] print:mb-0", numberColorClass)}>
                        {slotNumber}
                      </span>
                      {bedContentVisual}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <div id="print-page-break-after-visualization" className="hidden print:block print-page-break"></div>

        <div id="garden-list-view-card">
          <h2 className="text-3xl font-bold mb-4 print:text-xl print:mt-8 text-slate-900">Angelegte Beete (Listenansicht)</h2>
          {beds.length === 0 && currentBeetCount > 0 && !loading && !error && (
            <Card className="text-center py-12 shadow-md print:shadow-none print:border-none print:py-4">
              <CardHeader>
                <div className="mx-auto bg-secondary p-3 rounded-full w-fit mb-2 print:hidden">
                  <ListFilter className="h-10 w-10 text-secondary-foreground" />
                </div>
                <CardTitle>Noch keine Beete angelegt</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">Beginnen Sie mit der Planung Ihres Gartens, indem Sie Ihr erstes Beet anlegen.</CardDescription>
                <Button 
                  size="lg" 
                  className="print:hidden"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.electronAPI?.navigateTo) {
                      window.electronAPI.navigateTo('/beds/new');
                    } else {
                      window.location.href = '/beds/new';
                    }
                  }}
                >
                  <PlusCircle className="mr-2 h-5 w-5" /> Erstes Beet anlegen
                </Button>
              </CardContent>
            </Card>
          )}          {(beds.length > 0 || currentBeetCount > 0) && (
            <Card className="shadow-lg print:shadow-none print:border-none overflow-hidden">
              <CardContent className="p-0">
                <Table className="print:text-xs">
                  <TableHeader className="bg-[hsl(40,40%,75%)] rounded-t-lg print:bg-[hsl(40,40%,85%)]">
                    <TableRow className="border-b-2 border-slate-400">
                      <TableHead className="w-[60px] print:w-[40px] print:p-1 print:pt-2 font-bold text-slate-800">Nr.</TableHead>
                      <TableHead className="print:p-1 print:pt-2 font-bold text-slate-800">Typ</TableHead>
                      <TableHead className="print:p-1 font-bold text-slate-800">Breite</TableHead>
                      <TableHead className="print:p-1 font-bold text-slate-800">
                        <span className="block">Sorte</span>
                        <span className="text-xs font-normal text-slate-700">(Untersorte)</span>
                      </TableHead>
                      <TableHead className="print:p-1 font-bold text-slate-800">
                        <span className="block">Pflanz-</span>
                        <span className="block">datum</span>
                      </TableHead>
                      <TableHead className="print:p-1 font-bold text-slate-800">Alter</TableHead>
                      <TableHead className="text-center print:p-1 font-bold text-slate-800">
                        <span className="block">Pflanzen</span>
                        <span className="block">bei Besatz</span>
                      </TableHead>
                      <TableHead className="text-center print:p-1 font-bold text-slate-800">
                        <span className="block">Pflanzen</span>
                        <span className="block">aktuell</span>
                      </TableHead>
                      <TableHead className="print:p-1 font-bold text-slate-800">Bemerkungen</TableHead>
                      <TableHead className="text-right print:hidden font-bold text-slate-800">Aktion</TableHead>
                    </TableRow>
                  </TableHeader>                  <TableBody>
                    {Array.from({ length: currentBeetCount }, (_, i) => i + 1).map(slotNumber => {
                      const bed = bedMap.get(slotNumber);
                      if (!bed) {
                        return (
                          <TableRow key={`slot-${slotNumber}`} className="bg-muted/30 print:bg-transparent">
                            <TableCell className="print:p-1">{slotNumber}</TableCell>
                            <TableCell colSpan={8} className="text-muted-foreground italic print:p-1">
                              Position {slotNumber} unbelegt
                            </TableCell>
                            <TableCell className="print:hidden"></TableCell>
                          </TableRow>
                        );
                      }

                      const standardBed = bed.type === 'Standard' ? bed as StandardBed : null;
                      const versuchsBed = bed.type === 'Versuchsbeet' ? bed as Versuchsbeet : null;

                      let initialPlantsTotal = 0;
                      let currentPlantsTotal = 0;
                      let productivePlantsPercentageDisplay = '-';
                      let herbDetails: string = bed.type; // Explicitly type as string
                      let bedColorIndicator: string = bed.color || DEFAULT_SEGMENT_COLOR; // Explicitly type as string

                      if (standardBed) {
                        const herb = herbMap.get(standardBed.herbVarietyId);
                        herbDetails = `${herb?.name || 'Unbekannt'}${standardBed.subVarietyName ? ` (${standardBed.subVarietyName})` : ''}`;
                        initialPlantsTotal = calculateInitialPlants(standardBed);
                        currentPlantsTotal = calculateCurrentPlants(standardBed);
                        productivePlantsPercentageDisplay = `${standardBed.productivePlantsPercentage}%`;
                        bedColorIndicator = standardBed.color || DEFAULT_SEGMENT_COLOR; // Ensure string fallback
                      } else if (versuchsBed) {
                        const segments = segmentMapByBedId.get(bed.id) || [];
                        if (segments.length > 0) {
                          // Versuchsbeet mit Segmenten: Zeige jedes Segment in einer eigenen Zeile
                          herbDetails = segments.map(s => {
                              const herb = herbMap.get(s.herbVarietyId);
                              // Füge die Segmentlänge direkt an den Kräuternamen an
                              return `${herb?.name || 'Unbek.'}${s.subVarietyName ? ` (${s.subVarietyName})` : ''} ${s.segmentLength}m`;
                          }).join('\n');
                          initialPlantsTotal = segments.reduce((sum, s) => sum + calculateInitialPlants(s), 0);
                          currentPlantsTotal = segments.reduce((sum, s) => sum + calculateCurrentPlants(s), 0);
                          if (segments.length === 1 && segments[0].productivePlantsPercentage !== undefined) {
                              productivePlantsPercentageDisplay = `${segments[0].productivePlantsPercentage}%`;
                          } else if (segments.length > 1) {
                              const firstSegmentPercentage = segments[0].productivePlantsPercentage;
                              const allSamePercentage = segments.every(s => s.productivePlantsPercentage === firstSegmentPercentage);
                              if (allSamePercentage && firstSegmentPercentage !== undefined) {
                                  productivePlantsPercentageDisplay = `${firstSegmentPercentage}%`;
                              } else {
                                  productivePlantsPercentageDisplay = 'siehe Seg.';
                              }
                          }
                        } else {
                          herbDetails = "Versuchsbeet (leer)";
                        }
                         bedColorIndicator = bed.color || DEFAULT_SEGMENT_COLOR; // Ensure string fallback
                      } else {
                         bedColorIndicator = bed.color || DEFAULT_SEGMENT_COLOR; // Ensure string fallback
                      }

                      return (
                        <TableRow key={bed.id}>
                          <TableCell className="print:p-1">
                            <div className="flex items-center">
                              <span
                                className="w-3 h-3 rounded-sm mr-2 border border-black/20 print:w-2 print:h-2 print:mr-1"
                                style={{ backgroundColor: bedColorIndicator }}
                                title={`Farbindikator: ${bedColorIndicator}`}
                              ></span>
                              {bed.bedNumber}
                            </div>
                          </TableCell>
                          <TableCell className="print:p-1">{bed.type}</TableCell>
                          <TableCell className="print:p-1">
                            {bed.width}m
                          </TableCell>
                          <TableCell className="max-w-[200px] print:max-w-[150px] print:p-1" title={herbDetails.replace('\\n', '; ')}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                {(() => {
                                  if (bed.type === 'Kombinationsbeet') {
                                    const segmentsForThisBed = segmentMapByBedId.get(bed.id) || [];
                                    if (segmentsForThisBed.length > 0) {
                                      return (
                                        <div className="space-y-0.5">
                                          {segmentsForThisBed.map((segment) => {
                                            const herb = herbMap.get(segment.herbVarietyId);
                                            const segmentDetailText = `${herb?.name || 'Unbek.'}${segment.subVarietyName ? ` (${segment.subVarietyName})` : ''} ${segment.segmentLength}m`;
                                            return (
                                              <div key={segment.id} className="text-xs">
                                                {segmentDetailText}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    } else {
                                      // Versuchsbeet ist leer, herbDetails wäre "Versuchsbeet (leer)"
                                      return <span className="truncate block">{herbDetails}</span>;
                                    }
                                  } else {
                                    // Kein Versuchsbeet (Standard oder Spezial)
                                    return <span className="truncate block">{herbDetails}</span>;
                                  }
                                })()}
                              </TooltipTrigger>
                              {herbDetails.length > 25 && (
                                 <TooltipContent>
                                   <p className="max-w-xs whitespace-pre-line">{herbDetails}</p>
                                 </TooltipContent>
                              )}
                            </Tooltip>
                          </TableCell>
                          <TableCell className="print:p-1">{new Date(bed.plantingDate).toLocaleDateString('de-DE')}</TableCell>
                          <TableCell className="print:p-1">{calculatePlantAge(bed.plantingDate)} J.</TableCell>
                           {/* Maße entsprechend Beettyp anzeigen - Wurde nach oben verschoben */}
                          <TableCell className="text-center print:p-1 align-top">
                            {(() => {
                              if (standardBed) {
                                return calculateInitialPlants(standardBed);
                              } else if (versuchsBed) {
                                const segments = segmentMapByBedId.get(bed.id) || [];
                                if (segments.length > 0) {
                                  return (
                                    <div className="space-y-0.5">
                                      {segments.map(segment => (
                                        <div key={`initial-${segment.id}`} className="text-xs">
                                          {calculateInitialPlants(segment)}
                                        </div>
                                      ))}
                                    </div>
                                  );
                                } else {
                                  return '-'; // Leeres Versuchsbeet
                                }
                              } else {
                                return '-'; // Andere Beettypen
                              }
                            })()}
                          </TableCell>
                          <TableCell className="text-center print:p-1 align-top">
                            {(() => {
                              if (standardBed) {
                                return `${calculateCurrentPlants(standardBed)} (${standardBed.productivePlantsPercentage || 0}%)`;
                              } else if (versuchsBed) {
                                const segments = segmentMapByBedId.get(bed.id) || [];
                                if (segments.length > 0) {
                                  return (
                                    <div className="space-y-0.5">
                                      {segments.map(segment => (
                                        <div key={`current-${segment.id}`} className="text-xs">
                                          {`${calculateCurrentPlants(segment)} (${segment.productivePlantsPercentage || 0}%)`}
                                        </div>
                                      ))}
                                    </div>
                                  );
                                } else {
                                  return '-'; // Leeres Versuchsbeet
                                }
                              } else {
                                return '-'; // Andere Beettypen
                              }
                            })()}
                          </TableCell>
                          <TableCell className="max-w-[300px] print:max-w-[200px] print:p-1 align-top">
                            <div className="whitespace-pre-wrap italic text-muted-foreground break-words" style={{ maxHeight: 'none', minHeight: '100%' }}>
                              {bed.remarks || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right print:hidden">
                            <div className="flex justify-end space-x-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                aria-label={`Beet ${bed.bedNumber} bearbeiten`}
                                onClick={() => {
                                  if (typeof window !== 'undefined' && window.electronAPI?.navigateTo) {
                                    window.electronAPI.navigateTo(`/beds/${bed.id}/edit`);
                                  } else {
                                    window.location.href = `/beds/${bed.id}/edit`;
                                  }
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleDeleteBed(bed.id)}
                                      aria-label={`Beet ${bed.bedNumber} löschen`}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Beet löschen</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
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
         <div id="print-footer-page-1" className="hidden print:block print-footer text-center mt-4">
          <p className="text-xs">Seite 1 von 2</p>
        </div>
         <div id="print-footer-page-2" className="hidden print:block print-footer text-center mt-4">
          <p className="text-xs">Seite 2 von 2</p>
        </div>
      </div>
    </TooltipProvider>
  );
}
