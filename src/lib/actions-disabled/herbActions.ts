'use server';

import { revalidatePath } from 'next/cache';
import { addHerbVariety, getHerbVarieties, updateHerbVariety } from '@/lib/data';
import { z } from 'zod';
import type { HerbVariety } from '@/lib/definitions';

export async function addHerbVarietyAction(name: string, color?: string): Promise<{ success: boolean; data?: HerbVariety; error?: string }> {
  try {
    console.log('[herbActions.ts] addHerbVarietyAction called with Name:', name, 'Color:', color);

    if (!name || name.trim().length < 2) {
      return { success: false, error: 'Name ist zu kurz.' };
    }
    
    const newHerb = await addHerbVariety(name, color); 

    revalidatePath('/herbs');
    revalidatePath('/'); 
    revalidatePath('/beds/[id]/edit', 'layout'); 
    return { success: true, data: newHerb };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Ein serverseitiger Fehler ist aufgetreten.';
    console.error('[herbActions.ts] Error in addHerbVarietyAction:', error);
    return { success: false, error };
  }
}

export async function fetchHerbVarietiesForClient(): Promise<HerbVariety[]> {
  try {
    const herbs = await getHerbVarieties();
    return herbs;
  } catch (e) {
    console.error('[herbActions.ts] Error fetching herb varieties for client:', e);
    return [];
  }
}

const UpdateHerbVarietySchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Name ist zu kurz.'),
  color: z.string().optional().nullable(),
});

export async function updateHerbVarietyAction(id: string, formData: FormData): Promise<{ success: boolean; data?: HerbVariety; error?: string }> {
  try {
    const rawFormData = {
      id: formData.get('id'),
      name: formData.get('name'),
      color: formData.get('color') || undefined, // Handle empty string as undefined
    };

    const validatedFields = UpdateHerbVarietySchema.safeParse(rawFormData);

    if (!validatedFields.success) {
      return { success: false, error: 'Ungültige Eingabe für Kräutersorte.' };
    }

    const colorValue = validatedFields.data.color === null ? undefined : validatedFields.data.color;
    const updatedHerb = await updateHerbVariety(validatedFields.data.id, { name: validatedFields.data.name, color: colorValue });

    if (!updatedHerb) {
      return { success: false, error: 'Kräutersorte nicht gefunden oder kann nicht aktualisiert werden.' };
    }

    revalidatePath('/herbs');
    revalidatePath('/');
    revalidatePath('/beds/[id]/edit', 'layout');
    return { success: true, data: updatedHerb };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Ein serverseitiger Fehler ist aufgetreten.';
    console.error('[herbActions.ts] Error in updateHerbVarietyAction:', error);
    return { success: false, error };
  }
}