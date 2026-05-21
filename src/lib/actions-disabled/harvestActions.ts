
'use server';

import { revalidatePath } from 'next/cache';
// Die folgenden Importe sind veraltet, da sich das Datenmodell für Ernten geändert hat.
// import { 
//     addHarvest as addHarvestData, 
//     updateHarvest as updateHarvestData,
//     deleteHarvest as deleteHarvestData,
// } from '@/lib/data';
import { 
    getBedById,
    getSegmentsForBed,
} from '@/lib/data';
// Der Typ 'Harvest' ist veraltet und wurde durch HarvestEvent/HarvestContribution ersetzt.
// import type { Harvest } from '@/lib/definitions';

// Die folgenden Aktionen basieren auf dem alten Harvest-Modell und sind nicht mehr direkt anwendbar.
// Sie müssen durch neue Aktionen für den globalen Ernte-Workflow ersetzt werden.

/*
export async function createHarvestAction(harvestData: Omit<Harvest, 'id'>): Promise<{ success: boolean; data?: Harvest; error?: string }> {
  try {
    // Additional validation can be done here if needed
    // e.g., check if bedId and segmentId (if provided) are valid
    const bed = await getBedById(harvestData.bedId);
    if (!bed) {
      return { success: false, error: 'Zugehöriges Beet nicht gefunden.' };
    }

    if (harvestData.segmentId) {
      const segments = await getSegmentsForBed(harvestData.bedId);
      if (!segments.find(s => s.id === harvestData.segmentId)) {
        return { success: false, error: 'Zugehöriges Segment nicht gefunden.' };
      }
    } else if (bed.type === 'Kombinationsbeet') {
        // For Kombinationsbeet, harvest should ideally be tied to a segment.
        // This logic might need refinement based on how harvests for whole Kombinationsbeete (without segments) are handled.
        // For now, we allow it but it might lead to ambiguity in reporting if segments also exist.
    }
    
    // Ensure herbVarietyId is always set, even if it's a generic marker for non-specific yields
    if (!harvestData.herbVarietyId) {
        if (bed.type === 'Standard') {
            return { success: false, error: 'Kräutersorte für Standardbeet-Ernte nicht definiert.' };
        }
        // For Blühstreifen/Brachfläche, a generic ID or no ID might be acceptable.
        // The current Harvest type requires herbVarietyId: string.
        // Fallback for now, can be refined.
        harvestData.herbVarietyId = 'generic-yield-type'; 
    }


    // const newHarvest = await addHarvestData(harvestData);
    // revalidatePath(`/beds/${harvestData.bedId}/edit`); // Revalidate the bed edit page
    // revalidatePath('/reports'); // Revalidate reports page
    // return { success: true, data: newHarvest };
    console.warn("createHarvestAction is called but uses an outdated data model. Needs refactoring for HarvestEvent/HarvestContribution.");
    return { success: false, error: "Veraltete Funktion, bitte anpassen." };

  } catch (e) {
    const error = e instanceof Error ? e.message : 'Ein serverseitiger Fehler ist aufgetreten.';
    console.error("Error in createHarvestAction:", error);
    return { success: false, error };
  }
}

export async function updateHarvestAction(id: string, harvestData: Partial<Omit<Harvest, 'id'>>): Promise<{ success: boolean; data?: Harvest; error?: string }> {
  try {
    // const updatedHarvest = await updateHarvestData(id, harvestData);
    // if (!updatedHarvest) {
    //   return { success: false, error: 'Ernteeintrag nicht gefunden oder Aktualisierung fehlgeschlagen.' };
    // }
    // revalidatePath(`/beds/${updatedHarvest.bedId}/edit`);
    // revalidatePath('/reports');
    // return { success: true, data: updatedHarvest };
    console.warn("updateHarvestAction is called but uses an outdated data model. Needs refactoring.");
    return { success: false, error: "Veraltete Funktion, bitte anpassen." };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Ein serverseitiger Fehler ist aufgetreten.';
    console.error("Error in updateHarvestAction:", error);
    return { success: false, error };
  }
}

export async function deleteHarvestAction(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Optional: Fetch harvest before deleting to revalidate the correct bed page
        // const harvestToDelete = await getHarvestById(id); 
        // if (!harvestToDelete) return { success: false, error: "Harvest not found" };
        
        // const success = await deleteHarvestData(id);
        // if (!success) {
        //     return { success: false, error: 'Ernteeintrag konnte nicht gefunden oder gelöscht werden.' };
        // }
        // Revalidate paths - ideally, we'd know which bed page to revalidate
        // For now, revalidating common paths
        // revalidatePath('/beds/[id]/edit', 'layout'); // Revalidate all bed edit pages, 'layout' for dynamic routes
        // revalidatePath('/reports');
        // return { success: true };
        console.warn("deleteHarvestAction is called but uses an outdated data model. Needs refactoring.");
        return { success: false, error: "Veraltete Funktion, bitte anpassen." };
    } catch (e) {
        const error = e instanceof Error ? e.message : 'Ein serverseitiger Fehler ist aufgetreten.';
        console.error("Error in deleteHarvestAction:", error);
        return { success: false, error };
    }
}
*/
