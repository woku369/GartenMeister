'use client';

import { useBeds, useHerbVarieties, useSegments, useGartenConfiguration } from '@/lib/data-hooks-safe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PlusCircle, Edit, Loader2, Trash2, RotateCcw, LayoutDashboard, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import HarvestInitiatorButton from '@/components/layout/HarvestInitiatorButton';
import GardenExportPDFButton from '@/components/ui/garden-export-pdf-button';
import { useMemo, useState, useEffect } from 'react';
import type { Bed, StandardBed, VersuchsbeetSegment, HerbVariety, GartenConfiguration } from '@/lib/definitions';
import GartenDraufsicht from '@/components/garden/GartenDraufsicht';
import { GartenLayout, GardenViewMode, DEFAULT_GARTEN_LAYOUT } from '@/types/garden-layout';
import { electronAPI, isElectron } from '@/lib/electron-bridge';

export default function GardenOverviewPage() {
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
        currentBeetCount: typeof config.currentBeetCount === 'number' ? config.currentBeetCount : 20
      };
    } catch (err) {
      console.error('[safeConfig] Error:', err);
      return { currentBeetCount: 20 };
    }
  }, [config]);
  
  const loading = bedsLoading || herbsLoading || segmentsLoading || configLoading;
  const error = bedsError || herbsError || segmentsError || configError;

  // Lageplan-Konfiguration aus Electron-Config
  const [gardenViewMode, setGardenViewMode] = useState<GardenViewMode>('classic');
  const [gartenLayout, setGartenLayout] = useState<GartenLayout>(DEFAULT_GARTEN_LAYOUT);

  useEffect(() => {
    if (!isElectron()) return;
    electronAPI.getConfig().then((cfg: any) => {
      if (!cfg) return;
      if (cfg.gardenView) setGardenViewMode(cfg.gardenView);
      if (cfg.gardenLayout) setGartenLayout(cfg.gardenLayout);
    }).catch(() => {});
  }, []);

  const handleViewToggle = async (mode: GardenViewMode) => {
    setGardenViewMode(mode);
    if (!isElectron()) return;
    try {
      const cfg = (await electronAPI.getConfig()) ?? {};
      await electronAPI.saveConfig({ ...cfg, gardenView: mode });
    } catch {}
  };

  const handleBedClickSvg = (bedId: string) => {
    const url = `/beds/${encodeURIComponent(bedId)}/edit`;
    if (typeof window !== 'undefined' && window.electronAPI?.navigateTo) {
      window.electronAPI.navigateTo(url);
    } else {
      window.location.href = url;
    }
  };

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
          Fehler beim Laden der Daten: {typeof error === 'string' ? error : String(error || 'Unbekannter Fehler')}
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
              {String(safeBedsArray?.length || 0)} von {String(safeConfig?.currentBeetCount || 20)} Beeten belegt
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
            <Button
              onClick={() => {
                if (typeof window !== 'undefined' && window.electronAPI?.navigateTo) {
                  window.electronAPI.navigateTo('/beds/new');
                } else {
                  window.location.href = '/beds/new';
                }
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Neues Beet
            </Button>
          </div>
        </div>

        {/* Beetvisualisierung */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Gartenplan Visualisierung</CardTitle>
                <CardDescription>
                  {gardenViewMode === 'classic'
                    ? `Darstellung der Beete 1 bis ${String(safeConfig?.currentBeetCount || 20)}. Breiten sind proportional.`
                    : 'Quadranten-Lageplan – klick auf ein Beet für Details.'}
                </CardDescription>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={gardenViewMode === 'classic' ? 'default' : 'outline'}
                  onClick={() => handleViewToggle('classic')}
                  title="Klassische Ansicht"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={gardenViewMode === 'quadrant' ? 'default' : 'outline'}
                  onClick={() => handleViewToggle('quadrant')}
                  title="Lageplan"
                >
                  <LayoutDashboard className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {gardenViewMode === 'quadrant' ? (
              <GartenDraufsicht
                layout={gartenLayout}
                beds={safeBedsArray}
                onBedClick={handleBedClickSvg}
              />
            ) : (
            <div className="flex flex-row items-stretch overflow-x-auto space-x-1.5 bg-muted/20 rounded-lg border h-96 shadow-inner p-3 w-full">
              {Array.from({ length: Math.max(1, safeConfig?.currentBeetCount || 20) }, (_, i) => i + 1).map(slotNumber => {
                const bed = safeBedsArray.find(b => b.bedNumber === slotNumber);
                const isOccupied = !!bed;
                const bedWidth = (bed && typeof bed.width === 'number') ? bed.width : 1.5;

                const handleBedClick = () => {
                  const targetUrl = isOccupied && bed ? `/beds/${encodeURIComponent(bed.id)}/edit` : `/beds/new?bedNumber=${slotNumber}`;
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
                    title={isOccupied ? `Beet ${slotNumber} (${bed?.type || 'Unbekannt'}) - ID: ${bed?.id}` : `Position ${slotNumber} frei`}
                    onClick={handleBedClick}
                  >
                    <div className="flex flex-col items-center h-full">
                      <span className="font-semibold text-xs mb-0.5 text-center w-full text-foreground">
                        {slotNumber}
                      </span>
                      <div
                        className="w-full flex-grow rounded-md shadow-sm overflow-hidden"
                        style={{ 
                          backgroundColor: !isOccupied ? '#f8fafc' : (bed?.color || '#cccccc'),
                          border: '1px solid rgba(0, 0, 0, 0.2)',
                          display: 'flex',
                          flexDirection: bed?.type === 'Kombinationsbeet' ? 'column' : 'block'
                        }}
                      >
                        {/* Segment-Visualisierung für Kombinationsbeete */}
                        {isOccupied && bed && bed.type === 'Kombinationsbeet' && (() => {
                          const bedSegments = getSegmentsForBed(bed.id);
                          
                          if (bedSegments.length > 0) {
                            const totalSegmentLength = bedSegments.reduce((sum, seg) => sum + (seg.segmentLength || 0), 0);
                            const totalBedLength = bed.length || 3; // Gesamte Beetlänge
                            
                            // Berechne Anteile basierend auf der Gesamtbeetlänge
                            const segmentElements = bedSegments.map((segment, segIndex) => {
                              const segmentHeight = (segment.segmentLength || 0) / totalBedLength * 100; // Prozent der Gesamtlänge
                              const herbColor = getHerbColor(String(segment.herbVarietyId || ''));
                              return (
                                <div 
                                  key={segment.id}
                                  className="w-full"
                                  style={{
                                    backgroundColor: herbColor,
                                    height: `${segmentHeight}%`,
                                    minHeight: '8px',
                                    border: '1px solid rgba(255,255,255,0.4)',
                                    borderRadius: '1px',
                                    margin: '0.5px 0',
                                    boxSizing: 'border-box'
                                  }}
                                  title={`Segment ${segIndex + 1}: ${getHerbName(String(segment.herbVarietyId || ''))} (${segment.segmentLength || 0}m von ${totalBedLength}m)`}
                                />
                              );
                            });
                            
                            // Füge unbelegte Fläche hinzu falls Segmente < Gesamtlänge
                            if (totalSegmentLength < totalBedLength) {
                              const emptyHeight = (totalBedLength - totalSegmentLength) / totalBedLength * 100;
                              segmentElements.push(
                                <div 
                                  key="empty-space"
                                  className="w-full"
                                  style={{
                                    backgroundColor: bed.color || '#f0f0f0',
                                    height: `${emptyHeight}%`,
                                    minHeight: '8px',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    borderRadius: '1px',
                                    margin: '0.5px 0',
                                    boxSizing: 'border-box'
                                  }}
                                  title={`Unbelegte Fläche: ${(totalBedLength - totalSegmentLength).toFixed(1)}m von ${totalBedLength}m`}
                                />
                              );
                            }
                            
                            return segmentElements;
                          } else {
                            // Fallback für Kombinationsbeete ohne Segmente
                            return (
                              <div 
                                className="w-full h-full flex items-center justify-center text-xs text-gray-600"
                                style={{ backgroundColor: bed.color || '#f0f0f0' }}
                              >
                                Keine Segmente
                              </div>
                            );
                          }
                        })()}
                        {/* Standard-Darstellung für andere Beettypen */}
                        {isOccupied && bed && bed.type !== 'Kombinationsbeet' && (
                          <div 
                            className="w-full h-full" 
                            style={{ 
                              backgroundColor: bed.type === 'Standard' 
                                ? getHerbColor(String((bed as StandardBed).herbVarietyId || ''))
                                : (bed.color || '#cccccc')
                            }} 
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
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
                  const bed = safeBedsArray.find(b => b.bedNumber === slotNumber);
                  
                  if (!bed) {
                    return (
                      <TableRow key={`slot-${slotNumber}`} className="bg-muted/30">
                        <TableCell>{slotNumber}</TableCell>
                        <TableCell colSpan={8} className="text-muted-foreground italic">
                          Position {slotNumber} unbelegt
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (typeof window !== 'undefined' && window.electronAPI?.navigateTo) {
                                window.electronAPI.navigateTo(`/beds/new?bedNumber=${slotNumber}`);
                              } else {
                                window.location.href = `/beds/new?bedNumber=${slotNumber}`;
                              }
                            }}
                          >
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  // Berechne Details für das Beet
                  const bedSegments = getSegmentsForBed(bed.id);
                  let herbDetails = String(bed.type || 'Unbekannt');
                  let plantingDate = '-';
                  let ageInDays = '-';
                  let initialPlants = '-';
                  let currentPlants = '-';
                  
                  if (bed.type === 'Standard') {
                    const standardBed = bed as StandardBed;
                    const herbName = String(getHerbName(String(standardBed.herbVarietyId || '')) || 'Unbekannt');
                    const subVariety = standardBed.subVarietyName ? String(standardBed.subVarietyName) : '';
                    herbDetails = `${herbName}${subVariety ? ` (${subVariety})` : ''}`;
                    
                    if (standardBed.plantingDate) {
                      const plantDate = new Date(standardBed.plantingDate);
                      plantingDate = plantDate.toLocaleDateString('de-DE');
                      
                      const daysDiff = Math.floor((new Date().getTime() - plantDate.getTime()) / (1000 * 60 * 60 * 24));
                      const yearsDiff = daysDiff / 365.25; // Berücksichtigt Schaltjahre
                      ageInDays = daysDiff >= 0 ? `${yearsDiff.toFixed(1)} Jahre` : 'Zukunft';
                    }
                    
                    // Berechne Pflanzenanzahl: Länge * plantsPerMeter
                    const totalPlants = Math.floor((standardBed.length || 0) * (standardBed.plantsPerMeter || 0));
                    initialPlants = totalPlants.toString();
                    const productivePercent = standardBed.productivePlantsPercentage || 100;
                    const currentCount = Math.floor(totalPlants * (productivePercent / 100));
                    currentPlants = `${currentCount} (${productivePercent}%)`;
                  } else if (bed.type === 'Kombinationsbeet' && bedSegments.length > 0) {
                    herbDetails = bedSegments.map((s: any) => {
                      const herbName = String(getHerbName(String(s.herbVarietyId || '')) || 'Unbekannt');
                      const subVariety = s.subVarietyName ? String(s.subVarietyName) : '';
                      const segLength = s.segmentLength ? String(s.segmentLength) : '0';
                      return `${herbName}${subVariety ? ` (${subVariety})` : ''} ${segLength}m`;
                    }).join(', ');
                    
                    // Für Kombinationsbeete: Verwende das älteste Pflanzungsdatum
                    const earliestDate = bedSegments.reduce((earliest: string | null, s: any) => {
                      if (!s.plantingDate) return earliest;
                      if (!earliest) return s.plantingDate;
                      return new Date(s.plantingDate) < new Date(earliest) ? s.plantingDate : earliest;
                    }, null);
                    
                    if (earliestDate) {
                      const plantDate = new Date(earliestDate);
                      plantingDate = plantDate.toLocaleDateString('de-DE');
                      
                      const daysDiff = Math.floor((new Date().getTime() - plantDate.getTime()) / (1000 * 60 * 60 * 24));
                      const yearsDiff = daysDiff / 365.25; // Berücksichtigt Schaltjahre
                      ageInDays = daysDiff >= 0 ? `${yearsDiff.toFixed(1)} Jahre` : 'Zukunft';
                    }
                    
                    const totalInitial = bedSegments.reduce((sum: number, s: any) => {
                      const segmentPlants = Math.floor((s.segmentLength || 0) * (s.plantsPerMeter || 0));
                      return sum + segmentPlants;
                    }, 0);
                    const totalCurrent = bedSegments.reduce((sum: number, s: any) => {
                      const segmentPlants = Math.floor((s.segmentLength || 0) * (s.plantsPerMeter || 0));
                      const productive = s.productivePlantsPercentage || 100;
                      return sum + Math.floor(segmentPlants * (productive / 100));
                    }, 0);
                    
                    initialPlants = totalInitial.toString();
                    currentPlants = totalCurrent.toString();
                  }

                  return (
                    <TableRow key={`bed-${bed.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-2 border"
                            style={{ 
                              backgroundColor: bed.type === 'Standard' 
                                ? getHerbColor(String((bed as StandardBed).herbVarietyId || ''))
                                : bed.color || '#cccccc'
                            }}
                          />
                          {String(bed.bedNumber || '?')}
                        </div>
                      </TableCell>
                      <TableCell>{String(bed.type || 'Unbekannt')}</TableCell>
                      <TableCell>{String((bed.width && typeof bed.width === 'number') ? bed.width : 0)}m</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="whitespace-pre-wrap text-sm">
                          {String(herbDetails)}
                        </div>
                      </TableCell>
                      <TableCell>{String(plantingDate)}</TableCell>
                      <TableCell>{String(ageInDays)}</TableCell>
                      <TableCell className="text-center">{String(initialPlants)}</TableCell>
                      <TableCell className="text-center">{String(currentPlants)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {String(bed.remarks || '-')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (typeof window !== 'undefined' && window.electronAPI?.navigateTo) {
                                window.electronAPI.navigateTo(`/beds/${encodeURIComponent(bed.id)}/edit`);
                              } else {
                                window.location.href = `/beds/${encodeURIComponent(bed.id)}/edit`;
                              }
                            }}
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
