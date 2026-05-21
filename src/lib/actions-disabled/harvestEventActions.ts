
'use server';

import { revalidatePath } from 'next/cache';
import { 
    createHarvestEvent as createHarvestEventData, 
    getBeds, 
    getAllSegments, 
    getHerbVarietyById,
    addHarvestContribution,
    updateProductivePlantsPercentageOnBed,
    updateProductivePlantsPercentageOnSegment,
    updateHarvestEventData as updateHarvestEventDataFn,
} from '@/lib/data';
import type { HarvestEvent, Bed, VersuchsbeetSegment, StandardBed, HarvestContribution } from '@/lib/definitions';

export interface ProcessedProductivityUpdateForAction {
    entityId: string; 
    type: 'bed' | 'segment';
    bedId: string; 
    productivePlantsPercentageAtHarvestTime: number; 
    newProductivePlantsPercentageOnEntity?: number; 
    notesOnProductivityChange?: string;
}

export async function startHarvestEventAction(data: {
  herbVarietyId: string;
  harvestDateStart: string;
  harvestDateEnd?: string;
}): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    if (!data.herbVarietyId || !data.harvestDateStart) {
      return { success: false, error: 'Kräutersorte und Startdatum sind erforderlich.' };
    }
    const herb = await getHerbVarietyById(data.herbVarietyId);
    if (!herb) {
        return { success: false, error: 'Ausgewählte Kräutersorte nicht gefunden.' };
    }

    const newEventData: Omit<HarvestEvent, 'id' | 'isFinalized' | 'totalYieldKg' | 'remarks'> = {
      herbVarietyId: data.herbVarietyId,
      harvestDateStart: data.harvestDateStart,
      harvestDateEnd: data.harvestDateEnd,
    };
    const newEvent = await createHarvestEventData(newEventData);
    return { success: true, eventId: newEvent.id };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Ein serverseitiger Fehler ist aufgetreten.';
    return { success: false, error };
  }
}

export async function getBedsForHarvestEventAction(herbVarietyId: string): Promise<{
  success: boolean;
  relevantBeds?: Array<Bed & { segmentsRelevantToHarvest?: VersuchsbeetSegment[] }>; 
  error?: string;
}> {
  try {
    if (!herbVarietyId) {
      return { success: false, error: 'Kräutersorte ist erforderlich.' };
    }

    const allBeds = await getBeds();
    const allSegments = await getAllSegments();
    
    const relevantBedsResult: Array<Bed & { segmentsRelevantToHarvest?: VersuchsbeetSegment[] }> = [];

    for (const bed of allBeds) {
      if (bed.type === 'Standard' && (bed as StandardBed).herbVarietyId === herbVarietyId) {
        relevantBedsResult.push(bed);
      } else if (bed.type === 'Kombinationsbeet') {
        const bedSegmentsForHerb = allSegments.filter(s => s.bedId === bed.id && s.herbVarietyId === herbVarietyId);
        if (bedSegmentsForHerb.length > 0) {
          relevantBedsResult.push({ ...bed, segmentsRelevantToHarvest: bedSegmentsForHerb });
        }
      }
    }
    return { success: true, relevantBeds: relevantBedsResult };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Ein serverseitiger Fehler ist aufgetreten.';
    return { success: false, error };
  }
}

export async function saveProductivityUpdatesAction(
    payload: {
        harvestEventId: string;
        updates: ProcessedProductivityUpdateForAction[];
    }
): Promise<{ success: boolean; error?: string }> {
    const { harvestEventId, updates } = payload;

    if (!harvestEventId || !updates) {
        return { success: false, error: 'Harvest Event ID und Updates sind erforderlich.' };
    }
    if (!Array.isArray(updates)) {
        return { success: false, error: 'Updates müssen ein Array sein.' };
    }


    try {
        for (const update of updates) {
            if (!update.bedId) {
                console.error("[saveProductivityUpdatesAction] Fehlende bedId für Update:", update);
                // Optional: throw new Error oder return mit spezifischer Fehlermeldung für dieses Update
                continue; // Überspringe dieses fehlerhafte Update
            }
            const contributionData: Omit<HarvestContribution, 'id'> = {
                harvestEventId: harvestEventId,
                bedId: update.bedId, // Sicherstellen, dass bedId hier korrekt ist
                segmentId: update.type === 'segment' ? update.entityId : undefined,
                productivePlantsPercentageAtHarvestTime: update.productivePlantsPercentageAtHarvestTime,
                notesOnProductivityChange: update.notesOnProductivityChange,
            };
            await addHarvestContribution(contributionData);

            if (update.newProductivePlantsPercentageOnEntity !== undefined) {
                if (update.type === 'bed') {
                    await updateProductivePlantsPercentageOnBed(update.entityId, update.newProductivePlantsPercentageOnEntity);
                } else if (update.type === 'segment') {
                    await updateProductivePlantsPercentageOnSegment(update.entityId, update.newProductivePlantsPercentageOnEntity);
                }
            }
        }
        revalidatePath('/');
        revalidatePath('/reports'); 
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : 'Fehler beim Speichern der Produktivitätsupdates.';
        console.error("[harvestEventActions.ts saveProductivityUpdatesAction] Error:", error);
        return { success: false, error };
    }
}


export async function finalizeHarvestEventAction(data: { 
  eventId: string; 
  totalYieldKg?: number; 
  remarks?: string 
}): Promise<{ success: boolean; event?: HarvestEvent; error?: string }> {
  console.log("[harvestEventActions.ts finalizeHarvestEventAction] Received data:", data);
  try {
    if (!data.eventId) {
      console.error("[harvestEventActions.ts finalizeHarvestEventAction] Validation failed: Event ID is required.");
      return { success: false, error: 'Event ID ist erforderlich.' };
    }
    if (data.totalYieldKg !== undefined && (typeof data.totalYieldKg !== 'number' || data.totalYieldKg < 0)) {
      console.error("[harvestEventActions.ts finalizeHarvestEventAction] Validation failed: totalYieldKg, if provided, must be a non-negative number.");
      return { success: false, error: 'Gesamt-Erntemenge muss, falls angegeben, eine nicht-negative Zahl sein.' };
    }

    const updateData: Partial<Pick<HarvestEvent, 'totalYieldKg' | 'remarks' | 'isFinalized'>> = {
      isFinalized: true, // This action always finalizes the event
    };

    // Only include totalYieldKg and remarks in updateData if they are actually provided
    if (data.totalYieldKg !== undefined) {
      updateData.totalYieldKg = data.totalYieldKg;
    }
    if (data.remarks !== undefined) {
      updateData.remarks = data.remarks;
    }
    
    const updatedEvent = await updateHarvestEventDataFn(data.eventId, updateData);
    console.log("[harvestEventActions.ts finalizeHarvestEventAction] Result from updateHarvestEventDataFn:", updatedEvent);

    if (!updatedEvent) {
      console.error(`[harvestEventActions.ts finalizeHarvestEventAction] Failed to update event ${data.eventId}. updateHarvestEventDataFn returned null.`);
      return { success: false, error: 'Ernte-Event nicht gefunden oder Aktualisierung fehlgeschlagen.' };
    }

    revalidatePath('/'); 
    revalidatePath('/reports');
    return { success: true, event: updatedEvent };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Ein serverseitiger Fehler ist aufgetreten.';
    console.error("[harvestEventActions.ts finalizeHarvestEventAction] Exception caught:", error);
    return { success: false, error };
  }
}

export async function updateFinalizedHarvestEventAction(data: {
  eventId: string;
  totalYieldKg?: number;
  remarks?: string;
}): Promise<{ success: boolean; event?: HarvestEvent; error?: string }> {
  try {
    if (!data.eventId) {
      return { success: false, error: 'Event ID ist erforderlich für die Aktualisierung.' };
    }

    if (data.totalYieldKg !== undefined && (typeof data.totalYieldKg !== 'number' || data.totalYieldKg < 0)) {
      return { success: false, error: 'Gesamt-Erntemenge muss, falls angegeben, eine nicht-negative Zahl sein.' };
    }

    const updatePayload: Partial<Pick<HarvestEvent, 'totalYieldKg' | 'remarks'>> = {};

    // Only include fields in the payload if they are provided (not undefined)
    // This allows clearing a field by passing an empty string which then becomes undefined via Zod.
    if (data.hasOwnProperty('totalYieldKg')) {
        updatePayload.totalYieldKg = data.totalYieldKg;
    }
    if (data.hasOwnProperty('remarks')) {
         updatePayload.remarks = data.remarks;
    }
    
    // Ensure we only update if there's something to update
    if (Object.keys(updatePayload).length === 0) {
        return { success: true, error: 'Keine Daten zum Aktualisieren angegeben.' }; // Or return the existing event
    }

    const updatedEvent = await updateHarvestEventDataFn(data.eventId, updatePayload);

    if (!updatedEvent) {
      return { success: false, error: 'Ernte-Event nicht gefunden oder Aktualisierung fehlgeschlagen.' };
    }

    revalidatePath('/reports');
    return { success: true, event: updatedEvent };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Ein serverseitiger Fehler ist aufgetreten beim Aktualisieren des Ernte-Events.';
    return { success: false, error };
  }
}
