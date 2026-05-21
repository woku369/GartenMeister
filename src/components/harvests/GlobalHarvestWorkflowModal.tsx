'use client';

import { useState, useEffect, useTransition } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import type { HerbVariety, Bed, KombinationsbeetSegment, HarvestEvent, StandardBed } from '@/lib/definitions';
import { startHarvestEventAction, getBedsForHarvestEventAction, saveProductivityUpdatesAction, finalizeHarvestEventAction } from '@/lib/actions-stubs'; // TEMPORÄR für Static Export
import type { ProcessedProductivityUpdateForAction } from '@/lib/actions-stubs'; // TEMPORÄR für Static Export


interface GlobalHarvestWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  herbVarieties: HerbVariety[];
}

type WorkflowStep = 1 | 2 | 3; // 1: Select Herb/Dates, 2: Update Productivity, 3: Finalize Yield

export default function GlobalHarvestWorkflowModal({ isOpen, onClose, herbVarieties: initialHerbVarieties }: GlobalHarvestWorkflowModalProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(1);
  
  const [selectedHerbId, setSelectedHerbId] = useState<string>('');
  const [harvestDateStart, setHarvestDateStart] = useState<string>(new Date().toISOString().split('T')[0]);
  const [harvestDateEnd, setHarvestDateEnd] = useState<string>('');

  const [currentHarvestEventId, setCurrentHarvestEventId] = useState<string | undefined>(undefined);
  
  const [relevantBedsAndSegments, setRelevantBedsAndSegments] = useState<Array<Bed & { segmentsRelevantToHarvest?: KombinationsbeetSegment[] }>>([]);
  const [selectedBeds, setSelectedBeds] = useState<Set<string>>(new Set()); // Neue State für ausgewählte Beete
  type ProductivityUpdateState = {
    id: string; 
    type: 'bed' | 'segment';
    originalPercentage: number;
    newPercentage?: number; 
    notes?: string;
  };
  const [productivityUpdates, setProductivityUpdates] = useState<Record<string, ProductivityUpdateState>>({});

  const [totalYieldKg, setTotalYieldKg] = useState<string>(''); // Keep as string for controlled input
  const [harvestEventRemarks, setHarvestEventRemarks] = useState<string>('');


  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setCurrentStep(1);
      setSelectedHerbId(undefined);
      setHarvestDateStart(new Date().toISOString().split('T')[0]);
      setHarvestDateEnd('');
      setCurrentHarvestEventId(undefined);
      setRelevantBedsAndSegments([]);
      setSelectedBeds(new Set()); // Reset ausgewählte Beete
      setProductivityUpdates({});
      setTotalYieldKg('');
      setHarvestEventRemarks('');
    }
  }, [isOpen]);

  const handleStartEvent = async () => {
    if (!selectedHerbId) {
      toast({ title: "Fehler", description: "Bitte wählen Sie eine Kräutersorte.", variant: "destructive" });
      return;
    }

    // Wenn bereits Beete geladen sind, aber keine ausgewählt, Warnung anzeigen
    if (relevantBedsAndSegments.length > 0 && selectedBeds.size === 0) {
      toast({ title: "Fehler", description: "Bitte wählen Sie mindestens ein Beet für die Ernte aus.", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      // Wenn noch keine Beete geladen sind, erst laden
      if (relevantBedsAndSegments.length === 0) {
        const bedsResult = await getBedsForHarvestEventAction(selectedHerbId);
        if (bedsResult.success && bedsResult.relevantBeds) {
          // Alle Beete als ausgewählt markieren (bisheriges Verhalten) - SAFE MAP
          const allBedIds = new Set(
            Array.isArray(bedsResult.relevantBeds) 
              ? bedsResult.relevantBeds
                  .filter(bed => bed && typeof bed === 'object' && bed.id)
                  .map(bed => bed.id)
              : []
          );
          setSelectedBeds(allBedIds);
          setRelevantBedsAndSegments(bedsResult.relevantBeds);
          // Bleibe in Step 1 für Beetauswahl
          return;
        } else {
          toast({ title: "Fehler", description: bedsResult.error || "Relevante Beete konnten nicht geladen werden.", variant: "destructive" });
          return;
        }
      }

      // Erntevorgang starten mit den ausgewählten Beeten
      const result = await startHarvestEventAction({
        herbVarietyId: selectedHerbId,
        harvestDateStart,
        harvestDateEnd: harvestDateEnd || undefined,
        selectedBedsAndSegments: relevantBedsAndSegments.filter(bed => selectedBeds.has(bed.id))
      });
      
      if (result.success && result.eventId) {
        toast({ title: "Erfolg", description: "Erntevorgang gestartet." });
        setCurrentHarvestEventId(result.eventId);
        
        // Nur für ausgewählte Beete Productivity Updates erstellen
        const initialUpdates: Record<string, ProductivityUpdateState> = {};
        relevantBedsAndSegments.forEach(bed => {
          // Nur wenn das Beet ausgewählt ist
          if (selectedBeds.has(bed.id)) {
            if (bed.type === 'Standard') {
              initialUpdates[bed.id] = { 
                id: bed.id, 
                type: 'bed', 
                originalPercentage: (bed as StandardBed).productivePlantsPercentage, 
                newPercentage: (bed as StandardBed).productivePlantsPercentage 
              };
            } else if (bed.type === 'Kombinationsbeet' && bed.segmentsRelevantToHarvest) {
              bed.segmentsRelevantToHarvest.forEach(seg => {
                initialUpdates[seg.id] = { 
                  id: seg.id, 
                  type: 'segment', 
                  originalPercentage: seg.productivePlantsPercentage,
                  newPercentage: seg.productivePlantsPercentage 
                };
              });
            }
          }
        });
        setProductivityUpdates(initialUpdates);
        setCurrentStep(2);
      } else {
        toast({ title: "Fehler", description: result.error || "Erntevorgang konnte nicht gestartet werden.", variant: "destructive" });
      }
    });
  };
  
  const handleProductivityChange = (id: string, value: string) => {
    const numValue = parseInt(value, 10);
    setProductivityUpdates(prev => ({
        ...prev,
        [id]: {
            ...prev[id],
            newPercentage: isNaN(numValue) ? undefined : Math.max(0, Math.min(100, numValue))
        }
    }));
  };

  const handleSaveProductivityAndContributions = async () => {
    if (!currentHarvestEventId || !relevantBedsAndSegments) {
        toast({ title: "Fehler", description: "Keine aktive Ernte-Event ID oder keine relevanten Beete/Segmente gefunden.", variant: "destructive" });
        return;
    }

    if (selectedBeds.size === 0) {
        toast({ title: "Fehler", description: "Keine Beete ausgewählt. Bitte wählen Sie mindestens ein Beet aus.", variant: "destructive" });
        return;
    }

    startTransition(async () => {
        // Debug: Produktivitäts-Updates-Status
        console.log('[GlobalHarvestWorkflowModal] productivityUpdates Object:', productivityUpdates);
        console.log('[GlobalHarvestWorkflowModal] Object.keys(productivityUpdates):', Object.keys(productivityUpdates));
        console.log('[GlobalHarvestWorkflowModal] Object.values(productivityUpdates):', Object.values(productivityUpdates));
        console.log('[GlobalHarvestWorkflowModal] selectedBeds:', Array.from(selectedBeds));
        
        // Nur Updates für ausgewählte Beete verarbeiten - SAFE MAP
        const validProductivityUpdates = Object.values(productivityUpdates);
        const filteredUpdates = Array.isArray(validProductivityUpdates) ? validProductivityUpdates.filter(update => {
            // Für Beet-Updates: Prüfen ob das Beet ausgewählt ist
            if (update.type === 'bed') {
              return selectedBeds.has(update.id);
            }
            // Für Segment-Updates: Prüfen ob das übergeordnete Beet ausgewählt ist
            if (update.type === 'segment') {
              const parentBed = Array.isArray(relevantBedsAndSegments) ? relevantBedsAndSegments.find(b => 
                Array.isArray(b.segmentsRelevantToHarvest) && b.segmentsRelevantToHarvest.some(s => s?.id === update.id)
              ) : null;
              return parentBed ? selectedBeds.has(parentBed.id) : false;
            }
            return false;
          }) : [];
        
        const updatesForAction: ProcessedProductivityUpdateForAction[] = Array.isArray(filteredUpdates) ? filteredUpdates.map(update => {
            const parentBedForSegment = update.type === 'segment' 
                ? (Array.isArray(relevantBedsAndSegments) ? relevantBedsAndSegments.find(b => 
                    Array.isArray(b.segmentsRelevantToHarvest) && b.segmentsRelevantToHarvest.some(s => s?.id === update.id)
                  ) : null)
                : null;
            
            const bedIdForContribution = update.type === 'bed' ? update.id : (parentBedForSegment ? parentBedForSegment.id : '');

            if (update.type === 'segment' && !bedIdForContribution) { 
                 console.error(`[GlobalHarvestWorkflowModal] Could not find parent bed ID for segment update:`, update);
                 return null; 
            }

            return {
                entityId: update.id,
                type: update.type,
                bedId: bedIdForContribution, 
                productivePlantsPercentageAtHarvestTime: update.newPercentage ?? update.originalPercentage, // Use new if defined, else original
                newProductivePlantsPercentageOnEntity: (update.newPercentage !== undefined && update.newPercentage !== update.originalPercentage) ? update.newPercentage : undefined,
                notesOnProductivityChange: update.notes,
            };
        }).filter(Boolean) as ProcessedProductivityUpdateForAction[] : [];

        if (updatesForAction.length === 0) {
            toast({ title: "Fehler", description: "Keine gültigen Updates für die ausgewählten Beete gefunden.", variant: "destructive" });
            return;
        }

        if (updatesForAction.some(u => !u.bedId)) {
             toast({ title: "Fehler bei Datenaufbereitung", description: "Einige Segment-Updates konnten keiner Beet-ID zugeordnet werden.", variant: "destructive" });
             return;
        }
        
        const result = await saveProductivityUpdatesAction({
            harvestEventId: currentHarvestEventId,
            updates: updatesForAction,
            herbVarietyId: selectedHerbId,
            harvestDateStart: harvestDateStart,
            harvestDateEnd: harvestDateEnd || undefined,
        });

        if (result.success) {
            toast({ title: "Produktivität aktualisiert", description: `Prozentsätze und Beiträge für ${selectedBeds.size} Beete gespeichert.` });
            setCurrentStep(3);
        } else {
            toast({ title: "Fehler", description: result.error || "Updates konnten nicht gespeichert werden.", variant: "destructive" });
        }
    });
  };
  
  const handleFinalizeHarvest = async () => {
    if (!currentHarvestEventId) {
        toast({ title: "Fehler", description: "Keine aktive Ernte-Event ID.", variant: "destructive" });
        return;
    }
    
    let yieldKgNum: number | undefined = undefined;
    if (totalYieldKg.trim() !== '') {
        yieldKgNum = parseFloat(totalYieldKg);
        if (isNaN(yieldKgNum) || yieldKgNum < 0) {
            toast({ title: "Fehler", description: "Bitte geben Sie eine gültige, nicht-negative Erntemenge ein, oder lassen Sie das Feld leer.", variant: "destructive" });
            return;
        }
    }

    startTransition(async () => {
        const result = await finalizeHarvestEventAction({
            eventId: currentHarvestEventId,
            totalYieldKg: yieldKgNum,
            remarks: harvestEventRemarks || undefined,
        });

        if (result.success) {
            toast({ title: "Erfolg!", description: "Erntevorgang erfolgreich abgeschlossen." });
            onClose(); // Close the modal
        } else {
            toast({ title: "Fehler", description: result.error || "Erntevorgang konnte nicht abgeschlossen werden.", variant: "destructive" });
        }
    });
  };


  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="herbVariety">Kräutersorte</Label>
        <Select value={selectedHerbId} onValueChange={setSelectedHerbId} disabled={isPending}>
          <SelectTrigger id="herbVariety">
            <SelectValue placeholder="Sorte wählen..." />
          </SelectTrigger>
          <SelectContent>
            {Array.isArray(initialHerbVarieties) ? initialHerbVarieties.map(herb => (
              <SelectItem key={herb?.id || Math.random()} value={herb?.id || ''}>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: herb?.color || 'grey' }}></span>
                  {herb?.name || 'Unbekannt'}
                </div>
              </SelectItem>
            )) : []}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="harvestDateStart">Ernte Startdatum</Label>
        <Input id="harvestDateStart" type="date" value={harvestDateStart} onChange={e => setHarvestDateStart(e.target.value)} disabled={isPending} />
      </div>
      <div>
        <Label htmlFor="harvestDateEnd">Ernte Enddatum (optional)</Label>
        <Input id="harvestDateEnd" type="date" value={harvestDateEnd} onChange={e => setHarvestDateEnd(e.target.value)} disabled={isPending} />
      </div>

      {/* Beetauswahl anzeigen wenn Beete geladen sind */}
      {relevantBedsAndSegments.length > 0 && (
        <div className="space-y-3 p-4 border rounded-md bg-muted/5">
          <h4 className="font-semibold text-sm">Beete für Ernte auswählen:</h4>
          <div className="flex gap-2 mb-3">
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              onClick={handleSelectAllBeds}
              disabled={isPending}
            >
              Alle auswählen
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              onClick={handleDeselectAllBeds}
              disabled={isPending}
            >
              Alle abwählen
            </Button>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {Array.isArray(relevantBedsAndSegments) ? relevantBedsAndSegments.map(bed => (
              bed && bed.id ? (
                <div key={bed.id} className="flex items-center space-x-3 p-2 border rounded bg-background">
                  <Checkbox
                    id={`bed-${bed.id}`}
                    checked={selectedBeds.has(bed.id)}
                    onCheckedChange={(checked) => handleBedSelection(bed.id, !!checked)}
                    disabled={isPending}
                  />
                  <label htmlFor={`bed-${bed.id}`} className="text-sm font-medium cursor-pointer flex-1">
                    Beet Nr. {bed.bedNumber || 'N/A'} ({bed.type || 'Unbekannt'})
                    {bed.type === 'Kombinationsbeet' && bed.segmentsRelevantToHarvest && 
                      ` - ${Array.isArray(bed.segmentsRelevantToHarvest) ? bed.segmentsRelevantToHarvest.length : 0} Segment(e)`}
                  </label>
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: Array.isArray(initialHerbVarieties) ? initialHerbVarieties.find(h => h?.id === selectedHerbId)?.color || 'grey' : 'grey' }}
                ></span>
              </div>
              ) : null
            )) : []}
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedBeds.size} von {Array.isArray(relevantBedsAndSegments) ? relevantBedsAndSegments.length : 0} Beeten ausgewählt
          </p>
        </div>
      )}

      <DialogFooter>
        <DialogClose asChild><Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button></DialogClose>
        <Button onClick={handleStartEvent} disabled={isPending || !selectedHerbId}>
          {isPending ? "Wird gestartet..." : relevantBedsAndSegments.length > 0 ? "Weiter zu Produktivität" : "Weiter zu Beetauswahl"}
        </Button>
      </DialogFooter>
    </div>
  );

  const renderStep2 = () => {
    const selectedBedsArray = relevantBedsAndSegments.filter(bed => selectedBeds.has(bed.id));
    
    return (
      <div className="space-y-4">
        <h4 className="font-semibold">Produktivität für ausgewählte Beete/Segmente anpassen:</h4>
        {selectedHerbId && Array.isArray(initialHerbVarieties) && initialHerbVarieties.find(h => h?.id === selectedHerbId) && (
          <> {/* Use a fragment to group the p and div */}
            <p className="text-sm text-muted-foreground mb-4"> {/* Added mb-4 for spacing */}
              <span className="w-3 h-3 rounded-full mr-2 inline-block" style={{ backgroundColor: initialHerbVarieties.find(h => h?.id === selectedHerbId)?.color || 'grey' }}></span>
              Sorte: {initialHerbVarieties.find(h => h?.id === selectedHerbId)?.name || 'Unbekannt'}. <br />
              Aktualisieren Sie den Prozentsatz ertragsfähiger Pflanzen für diesen spezifischen Schnitt. Der Wert wird auch auf dem Beet/Segment für die Zukunft gespeichert.
              <br />
              <strong>{Array.isArray(selectedBedsArray) ? selectedBedsArray.length : 0} von {Array.isArray(relevantBedsAndSegments) ? relevantBedsAndSegments.length : 0} Beeten ausgewählt</strong>
            </p>
            <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
              {(!Array.isArray(selectedBedsArray) || selectedBedsArray.length === 0) && <p className="text-sm text-center py-4">Keine Beete ausgewählt.</p>}
              {Array.isArray(selectedBedsArray) ? selectedBedsArray.map(bed => (
                <div key={bed.id} className="p-3 border rounded-md bg-muted/10 shadow-sm">
                  <h5 className="font-medium text-primary">Beet Nr. {bed.bedNumber} ({bed.type})</h5>
                  {bed.type === 'Standard' && productivityUpdates[bed.id] && (
                    <div className="mt-2 space-y-1">
                      <Label htmlFor={`prod-${bed.id}`} className="text-xs">Ertragsf. Pflanzen (%) - Aktuell: {productivityUpdates[bed.id].originalPercentage}%</Label>
                      <Input
                        id={`prod-${bed.id}`}
                        type="number"
                        min="0" max="100"
                        value={productivityUpdates[bed.id].newPercentage ?? ''}
                        onChange={e => handleProductivityChange(bed.id, e.target.value)}
                        className="mt-0.5 h-9"
                        placeholder="Neuer % Wert"
                        disabled={isPending}
                      />
                    </div>
                  )}
                  {bed.type === 'Kombinationsbeet' && Array.isArray(bed.segmentsRelevantToHarvest) && bed.segmentsRelevantToHarvest.map(segment => segment && productivityUpdates[segment.id] && (
                    <div key={segment.id} className="mt-2 ml-3 pl-3 border-l-2 border-primary/30 space-y-1">
                      <p className="text-xs font-semibold text-foreground">Segment (L: {segment.segmentLength}m)</p>
                      <Label htmlFor={`prod-${segment.id}`} className="text-xs">Ertragsf. Pflanzen (%) - Aktuell: {productivityUpdates[segment.id].originalPercentage}%</Label>
                      <Input
                        id={`prod-${segment.id}`}
                        type="number"
                        min="0" max="100"
                        value={productivityUpdates[segment.id].newPercentage ?? ''}
                        onChange={e => handleProductivityChange(segment.id, e.target.value)}
                        className="mt-0.5 h-9"
                        placeholder="Neuer % Wert"
                        disabled={isPending}
                      />
                    </div>
                  ))}
                </div>
              )) : []}
            </div>
          </>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} disabled={isPending}>Zurück</Button>
          <Button onClick={handleSaveProductivityAndContributions} disabled={isPending || selectedBedsArray.length === 0}>
              {isPending ? "Wird gespeichert..." : "Produktivität speichern & Weiter"}
          </Button>
        </DialogFooter>
      </div>
    );
  };
  
  const renderStep3 = () => (
     <div className="space-y-4">
      <h4 className="font-semibold">
        <span className="w-3 h-3 rounded-full mr-2 inline-block" style={{ backgroundColor: initialHerbVarieties.find(h => h.id === selectedHerbId)?.color || 'grey' }}></span>
        Gesamtertrag für Sorte '{initialHerbVarieties.find(h => h.id === selectedHerbId)?.name}' erfassen:
        
      </h4>
       <div>
        <Label htmlFor="totalYieldKg">Gesamte Erntemenge (kg) für diese Sorte & Zeitraum (optional)</Label>
        <Input 
            id="totalYieldKg" 
            type="number" 
            step="0.01" 
            min="0"
            value={totalYieldKg} // Controlled component
            onChange={e => setTotalYieldKg(e.target.value)} // Update string state
            placeholder="z.B. 125.5 (optional)"
            disabled={isPending}
        />
      </div>
      <div>
        <Label htmlFor="harvestEventRemarks">Allgemeine Bemerkungen zum Erntevorgang (optional)</Label>
        <Input 
            id="harvestEventRemarks"
            value={harvestEventRemarks}
            onChange={e => setHarvestEventRemarks(e.target.value)}
            placeholder="Besonderheiten, Wetter etc."
            disabled={isPending}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} disabled={isPending}>Zurück</Button>
        <Button onClick={handleFinalizeHarvest} disabled={isPending}>
            {isPending ? "Wird abgeschlossen..." : "Erntevorgang abschließen"}
        </Button>
      </DialogFooter>
    </div>
  );


  // Funktionen für Beetauswahl
  const handleBedSelection = (bedId: string, isSelected: boolean) => {
    const newSelectedBeds = new Set(selectedBeds);
    if (isSelected) {
      newSelectedBeds.add(bedId);
    } else {
      newSelectedBeds.delete(bedId);
    }
    setSelectedBeds(newSelectedBeds);
    
    // Productivity Updates für nicht ausgewählte Beete entfernen/hinzufügen
    const bed = relevantBedsAndSegments.find(b => b.id === bedId);
    if (!bed) return;
    
    setProductivityUpdates(prev => {
      const newUpdates = { ...prev };
      
      if (isSelected) {
        // Beet ausgewählt: Updates hinzufügen
        if (bed.type === 'Standard') {
          newUpdates[bed.id] = { 
            id: bed.id, 
            type: 'bed', 
            originalPercentage: (bed as StandardBed).productivePlantsPercentage, 
            newPercentage: (bed as StandardBed).productivePlantsPercentage 
          };
        } else if (bed.type === 'Kombinationsbeet' && bed.segmentsRelevantToHarvest) {
          bed.segmentsRelevantToHarvest.forEach(seg => {
            newUpdates[seg.id] = { 
              id: seg.id, 
              type: 'segment', 
              originalPercentage: seg.productivePlantsPercentage,
              newPercentage: seg.productivePlantsPercentage 
            };
          });
        }
      } else {
        // Beet abgewählt: Updates entfernen
        if (bed.type === 'Standard') {
          delete newUpdates[bed.id];
        } else if (bed.type === 'Kombinationsbeet' && bed.segmentsRelevantToHarvest) {
          bed.segmentsRelevantToHarvest.forEach(seg => {
            delete newUpdates[seg.id];
          });
        }
      }
      
      return newUpdates;
    });
  };

  const handleSelectAllBeds = () => {
    const allBedIds = new Set(
      Array.isArray(relevantBedsAndSegments) 
        ? relevantBedsAndSegments
            .filter(bed => bed && typeof bed === 'object' && bed.id)
            .map(bed => bed.id)
        : []
    );
    setSelectedBeds(allBedIds);
    
    // Alle Updates hinzufügen
    const initialUpdates: Record<string, ProductivityUpdateState> = {};
    if (Array.isArray(relevantBedsAndSegments)) {
      relevantBedsAndSegments.forEach(bed => {
        if (!bed) return;
      if (bed.type === 'Standard') {
        initialUpdates[bed.id] = { 
          id: bed.id, 
          type: 'bed', 
          originalPercentage: (bed as StandardBed).productivePlantsPercentage, 
          newPercentage: (bed as StandardBed).productivePlantsPercentage 
        };
      } else if (bed.type === 'Kombinationsbeet' && Array.isArray(bed.segmentsRelevantToHarvest)) {
        bed.segmentsRelevantToHarvest.forEach(seg => {
          if (!seg) return;
          initialUpdates[seg.id] = { 
            id: seg.id, 
            type: 'segment', 
            originalPercentage: seg.productivePlantsPercentage,
            newPercentage: seg.productivePlantsPercentage 
          };
        });
      }
      });
    }
    setProductivityUpdates(initialUpdates);
  };

  const handleDeselectAllBeds = () => {
    setSelectedBeds(new Set());
    setProductivityUpdates({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Globalen Erntevorgang starten/verwalten</DialogTitle>
          <DialogDescription>
            Schritt {currentStep} von 3: {
              currentStep === 1 ? "Sorte und Zeitraum wählen." :
              currentStep === 2 ? "Produktivität der Beete für diesen Schnitt anpassen." :
              "Gesamtertrag erfassen und abschließen."
            }
          </DialogDescription>
        </DialogHeader>
        
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

      </DialogContent>
    </Dialog>
  );
}

