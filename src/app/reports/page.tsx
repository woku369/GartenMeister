'use client';

import { useEffect, useState } from 'react';
import type { HarvestEvent, HarvestContribution, HerbVariety, Bed, KombinationsbeetSegment, StandardBed } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, FileText, Leaf, MapPin, Trees, Pencil } from 'lucide-react'; 
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import EditHarvestEventButton from '@/components/reports/EditHarvestEventButton';
import ExportPDFButton from '@/components/ui/export-pdf-button';
import YearlyHarvestStatistics from '@/components/reports/YearlyHarvestStatistics';


interface EnrichedContribution extends HarvestContribution {
  bedNumber?: number;
  segmentName?: string;
  yieldablePlantsAtHarvestTimeCount?: number;
}
export interface EnrichedHarvestEvent extends HarvestEvent { // Exporting for use in EditHarvestEventButton
  herbName?: string;
  contributionsData?: Array<EnrichedContribution>;
  totalYieldablePlantsForEvent?: number;
  contributingBedNumbersString?: string;
}


export default function ReportsPage() {
  const [harvestEvents, setHarvestEvents] = useState<HarvestEvent[]>([]);
  const [allContributions, setAllContributions] = useState<HarvestContribution[]>([]);
  const [herbVarieties, setHerbVarieties] = useState<HerbVariety[]>([]);
  const [allBeds, setAllBeds] = useState<Bed[]>([]);
  const [allSegments, setAllSegments] = useState<KombinationsbeetSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (typeof window !== 'undefined' && window.electronAPI) {
          // Lade Daten über IPC
          const [
            harvestsData,
            herbsData,
            bedsData
          ] = await Promise.all([
            window.electronAPI.invoke('harvests:get-all'),
            window.electronAPI.invoke('herbs:get-all'),
            window.electronAPI.invoke('beds:get-all')
          ]);

          // Lade JSON-Daten für Segmente und Contributions
          const jsonData = await window.electronAPI.invoke('read-json-file', 
            await window.electronAPI.invoke('get-data-file-path', 'app-data.json')
          );
          
          const segments = jsonData?.segments || [];
          // Debug: Schaue was in harvestsData drin steht
          console.log('[Reports] harvestsData:', harvestsData);
          console.log('[Reports] harvestsData ist Array?', Array.isArray(harvestsData));
          if (harvestsData && Array.isArray(harvestsData)) {
            harvestsData.forEach((event, index) => {
              console.log(`[Reports] HarvestEvent ${index}:`, event.id, 'contributions:', event.contributions);
            });
          }
          
          // Extract contributions from harvestEvents instead of using old harvestContributions
          const extractedContributions: HarvestContribution[] = [];
          if (harvestsData && Array.isArray(harvestsData)) {
            harvestsData.forEach(harvestEvent => {
              if (harvestEvent.contributions && Array.isArray(harvestEvent.contributions)) {
                harvestEvent.contributions.forEach(contribution => {
                  extractedContributions.push({
                    ...contribution,
                    id: contribution.id || `${harvestEvent.id}-${contribution.bedId}`,
                    harvestEventId: harvestEvent.id
                  });
                });
              }
            });
          }
          
          console.log('[Reports] Geladene Ernten:', harvestsData?.length || 0);
          console.log('[Reports] Geladene Kräuter:', herbsData?.length || 0);
          console.log('[Reports] Geladene Beete:', bedsData?.length || 0);
          console.log('[Reports] Geladene Segmente:', segments?.length || 0);
          console.log('[Reports] Extrahierte Contributions aus HarvestEvents:', extractedContributions?.length || 0);
          console.log('[Reports] Debug - Extracted Contributions:', JSON.stringify(extractedContributions, null, 2));
          
          setHarvestEvents(harvestsData || []);
          setAllContributions(extractedContributions); // Use extracted contributions from harvestEvents
          setHerbVarieties(herbsData || []);
          setAllBeds(bedsData || []);
          setAllSegments(segments || []);
        }
      } catch (error) {
        console.error('[Reports] Fehler beim Laden der Daten:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const herbMap = new Map(herbVarieties.map(h => [h.id, h]));
  const bedMap = new Map(allBeds.map(b => [b.id, b]));
  const segmentMap = new Map(allSegments.map(s => [s.id, s]));

  const calculateYieldablePlantsForContribution = (contribution: HarvestContribution): number => {
    console.log('[ReportsPage] Calculating yieldable plants for contribution:', JSON.stringify(contribution));
    const bed = bedMap.get(contribution.bedId);
    if (!bed) {
      console.log(`[ReportsPage] Bed not found for contribution.bedId: ${contribution.bedId}`);
      return 0;
    }
    console.log(`[ReportsPage] Found bed for contribution: ${bed.id}, type: ${bed.type}`);

    if (contribution.segmentId) {
      const segment = segmentMap.get(contribution.segmentId);
      if (segment) {
        console.log(`[ReportsPage] Found segment: ${segment.id}, plantsPerMeter: ${segment.plantsPerMeter}, length: ${segment.segmentLength}`);
        if (segment.plantsPerMeter !== undefined && typeof segment.plantsPerMeter === 'number' && segment.segmentLength !== undefined) {
          const initialPlants = Math.floor(segment.segmentLength * segment.plantsPerMeter);
          const yieldable = Math.floor(initialPlants * (contribution.productivePlantsPercentage / 100));
          console.log(`[ReportsPage] Segment yieldable: ${yieldable}`);
          return yieldable;
        } else {
          console.log(`[ReportsPage] Segment ${segment.id} missing plantsPerMeter or segmentLength.`);
        }
      }
      else {
        console.log(`[ReportsPage] Segment not found for contribution.segmentId: ${contribution.segmentId}`);
      }
    } else if (bed.type === 'Standard') {
      const standardBed = bed as StandardBed;
      console.log(`[ReportsPage] StandardBed: ${standardBed.id}, plantsPerMeter: ${standardBed.plantsPerMeter}, length: ${standardBed.length}`);
      if (standardBed.plantsPerMeter !== undefined && typeof standardBed.plantsPerMeter === 'number' && standardBed.length !== undefined) {
        const initialPlants = Math.floor(standardBed.length * standardBed.plantsPerMeter);
        const yieldable = Math.floor(initialPlants * (contribution.productivePlantsPercentage / 100));
        console.log(`[ReportsPage] StandardBed yieldable: ${yieldable}`);
        return yieldable;
      } else {
         console.log(`[ReportsPage] StandardBed ${standardBed.id} missing plantsPerMeter or length.`);
      }
    }
    console.log('[ReportsPage] Defaulting to 0 yieldable plants for contribution.');
    return 0;
  };


  const finalizedHarvestEvents: EnrichedHarvestEvent[] = harvestEvents
    .filter(event => event.isFinalized) 
    .map(event => {
      console.log('[Reports] Processing finalized harvest event:', event.id);
      const contributionsForEvent = allContributions
        .filter(c => c.harvestEventId === event.id);
      console.log('[Reports] Found contributions for event:', contributionsForEvent.length);
      
      const enrichedContributions = contributionsForEvent
        .map(contribution => {
          console.log('[Reports] Processing contribution:', contribution.id);
          const bed = bedMap.get(contribution.bedId);
          let segmentName: string | undefined;
          if (contribution.segmentId) {
            const segment = segmentMap.get(contribution.segmentId);
            const segmentHerb = segment ? herbMap.get(segment.herbVarietyId) : undefined;
            segmentName = segment ? `Segment (L: ${segment.segmentLength}m, Kraut: ${segmentHerb?.name || 'Unbekannt'})` : 'Unbekanntes Segment';
          }
          const yieldablePlantsCount = calculateYieldablePlantsForContribution(contribution);
          console.log('[Reports] Calculated yieldable plants for contribution:', contribution.id, '=', yieldablePlantsCount);
          return {
            ...contribution,
            bedNumber: bed?.bedNumber, 
            segmentName: segmentName,
            yieldablePlantsAtHarvestTimeCount: yieldablePlantsCount,
          };
        })
        .sort((a,b) => (a.bedNumber || 0) - (b.bedNumber || 0) || (a.segmentId || '').localeCompare(b.segmentId || ''));
      
      let totalYieldablePlantsForEvent = 0;
      if (enrichedContributions) {
        totalYieldablePlantsForEvent = enrichedContributions.reduce((sum, contrib) => {
          const plants = contrib.yieldablePlantsAtHarvestTimeCount || 0;
          console.log('[Reports] Adding plants to total:', plants, 'from contribution:', contrib.id);
          return sum + plants;
        }, 0);
      }
      console.log('[Reports] Total yieldable plants for event:', event.id, '=', totalYieldablePlantsForEvent);

      const contributingBedNumbersSet = new Set<number>();
      if (enrichedContributions) {
        enrichedContributions.forEach(c => {
          if (c.bedNumber !== undefined) contributingBedNumbersSet.add(c.bedNumber);
        });
      }
      const contributingBedNumbersString = Array.from(contributingBedNumbersSet).sort((a,b) => a-b).join(', ');
        const enrichedEvent = {
        ...event,
        herbName: herbMap.get(event.herbVarietyId)?.name || 'Unbekannte Sorte',
        herbColor: herbMap.get(event.herbVarietyId)?.color,
        contributionsData: enrichedContributions,
        totalYieldablePlantsForEvent: totalYieldablePlantsForEvent,
        contributingBedNumbersString: contributingBedNumbersString,
        totalYieldKg: event.totalWeight, // Mapping von totalWeight zu totalYieldKg für UI-Kompatibilität
      };
      // Log the enriched event object to inspect its properties
      // console.log('[ReportsPage] Enriched Harvest Event:', JSON.stringify(enrichedEvent, null, 2));
      return enrichedEvent;
    })
    .sort((a,b) => new Date(b.harvestDateStart).getTime() - new Date(a.harvestDateStart).getTime());
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <p>Lade Erntedaten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Ernteberichte</h1>
        {/* PDF export button removed */}
      </div>

      {/* Jahresstatistiken */}
      <YearlyHarvestStatistics 
        harvestEvents={finalizedHarvestEvents}
        herbVarieties={herbVarieties}
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Abgeschlossene Erntevorgänge</CardTitle>
          <CardDescription>
            Übersicht aller abgeschlossenen Erntevorgänge, sortiert nach Startdatum (neueste zuerst).
            Zeigt "kg pro Sorte und Schnitt".
          </CardDescription>
          <div className="flex justify-end mt-2">
            <ExportPDFButton 
              type="reports" 
              data={finalizedHarvestEvents}
              disabled={finalizedHarvestEvents.length === 0} 
            />
          </div>
        </CardHeader>
        <CardContent>
          {finalizedHarvestEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-70" />
              <p className="text-lg font-semibold">Noch keine abgeschlossenen Erntevorgänge vorhanden.</p>
              <p>Sobald Sie Ernten über den globalen Workflow erfassen und abschließen, werden diese hier angezeigt.</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {finalizedHarvestEvents.map((event) => (
                  <AccordionItem value={event.id} key={event.id} className="border-b">
                    <AccordionTrigger className="hover:no-underline group">
                      <div className="flex justify-between w-full items-center pr-2">
                        <div className="flex items-center space-x-3 flex-grow">
                           {herbMap.get(event.herbVarietyId)?.color && (
                              <span style={{ backgroundColor: herbMap.get(event.herbVarietyId)?.color }} className="w-4 h-4 rounded-full border border-muted-foreground/30 shrink-0"></span>
                           )}
                           {!herbMap.get(event.herbVarietyId)?.color && (
                              <Leaf className="w-4 h-4 text-muted-foreground shrink-0"/>
                           )}
                          <span className="font-medium text-base">{event.herbName}</span>
                          <span className="text-sm text-muted-foreground">
                            ({new Date(event.harvestDateStart).toLocaleDateString('de-DE')}
                            {event.harvestDateEnd ? ` - ${new Date(event.harvestDateEnd).toLocaleDateString('de-DE')}` : ''})
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-lg font-semibold text-primary">
                            {event.totalYieldKg !== undefined ? `${event.totalYieldKg.toFixed(2)} kg` : <span className="text-xs italic text-muted-foreground">(Menge offen)</span>}
                          </span>
                          {event.totalYieldablePlantsForEvent !== undefined && (
                            <div className="flex items-center justify-end text-xs text-muted-foreground mt-0.5">
                              <Trees className="mr-1 h-3 w-3" />
                              <span>aus {event.totalYieldablePlantsForEvent} Pfl.</span>
                            </div>
                          )}
                        </div>
                        {/* Edit Button - now part of EditHarvestEventButton component */}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-3 pl-2 pr-2 bg-muted/30 rounded-b-md space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                            {event.remarks && (
                                <p className="italic border-l-2 border-primary pl-2 mb-2">
                                    Bemerkung zum Event: "{event.remarks}"
                                </p>
                            )}
                            {event.contributingBedNumbersString && event.contributingBedNumbersString.length > 0 ? (
                                <div className="flex items-center">
                                    <MapPin className="mr-2 h-4 w-4 text-primary/80 shrink-0" />
                                    <span className="font-medium mr-1">Beteiligte Beetnummern:</span>
                                    <span>{event.contributingBedNumbersString}</span>
                                </div>
                            ) : (
                                event.contributionsData && event.contributionsData.length > 0 && 
                                <p className="text-xs italic">
                                    Keine Beetnummern für Beiträge ermittelbar oder keine Beiträge vorhanden.
                                </p>
                            )}
                        </div>
                        <EditHarvestEventButton event={event} />
                      </div>

                      {event.contributionsData && event.contributionsData.length > 0 && (
                        <div className="space-y-1.5 pt-2 mt-2 border-t border-border">
                          <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1">Beitragende Beete/Segmente im Detail:</h4>
                          <Table className="bg-background rounded-md shadow-sm text-xs">
                            <TableHeader>
                              <TableRow className="text-xs">
                                <TableHead className="h-8 px-2 py-1">Beet Nr.</TableHead>
                                <TableHead className="h-8 px-2 py-1">Segment Details</TableHead>
                                <TableHead className="h-8 px-2 py-1 text-right">Produktivität (%)</TableHead>
                                <TableHead className="h-8 px-2 py-1 text-right">
                                  <div className="flex items-center justify-end">
                                    <Trees className="mr-1 h-3 w-3" />
                                    Ertragsf. Pfl.
                                  </div>
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {event.contributionsData.map(contrib => (
                                <TableRow key={contrib.id} className="text-xs">
                                  <TableCell className="px-2 py-1 font-medium">{contrib.bedNumber !== undefined ? contrib.bedNumber : 'N/A'}</TableCell>
                                  <TableCell className="px-2 py-1">{contrib.segmentName || '-'}</TableCell>
                                  <TableCell className="px-2 py-1 text-right">{contrib.productivePlantsPercentageAtHarvestTime}%</TableCell>
                                  <TableCell className="px-2 py-1 text-right">{contrib.yieldablePlantsAtHarvestTimeCount ?? '-'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                       {(!event.contributionsData || event.contributionsData.length === 0) && (
                           <p className="text-xs text-muted-foreground italic pt-2 mt-2 border-t border-border">Keine spezifischen Beet-/Segmentbeiträge für diesen Event erfasst.</p>
                       )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
