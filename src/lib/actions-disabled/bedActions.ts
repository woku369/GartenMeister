'use server';

import { revalidatePath } from 'next/cache';
import { addBed, updateBed as updateBedData, deleteBed as deleteBedData, getBedById, getAvailableBedNumbers } from '@/lib/data';
import type { Bed, BedFormData, StandardBed, SpecialBed, Versuchsbeet } from '@/lib/definitions';

// Helper to construct the full bed object based on type
function mapFormDataToBed(formData: BedFormData): Omit<Bed, 'id' | 'length'> {
    const baseData = {
        bedNumber: formData.bedNumber,
        type: formData.type,
        width: formData.width,
        plantingDate: formData.plantingDate,
        remarks: formData.remarks,
        color: formData.color,
    };

    switch (formData.type) {
        case 'Standard':
            if (!formData.herbVarietyId || formData.plantsPerMeter === undefined || formData.productivePlantsPercentage === undefined) {
                throw new Error("Missing required fields for Standard bed type.");
            }
            return {
                ...baseData,
                type: 'Standard',
                herbVarietyId: formData.herbVarietyId,
                subVarietyName: formData.subVarietyName,
                plantsPerMeter: formData.plantsPerMeter,
                productivePlantsPercentage: formData.productivePlantsPercentage,
            } as Omit<StandardBed, 'id' | 'length'>;
        case 'Blühstreifen':
        case 'Brachfläche':
            return {
                ...baseData,
                type: formData.type,
                expectedHarvestDate: formData.expectedHarvestDate,
            } as Omit<SpecialBed, 'id' | 'length'>;
        case 'Kombinationsbeet':
            return {
                ...baseData,
                type: 'Kombinationsbeet',
            } as Omit<Kombinationsbeet, 'id' | 'length'>;
        default:
            throw new Error(`Unsupported bed type: ${formData.type}`);
    }
}


export async function createBedAction(formData: BedFormData): Promise<{ success: boolean; data?: Bed; error?: string }> {
  // Electron-Check: Nur im Renderer/Electron zulassen
  if (typeof process !== 'undefined' && process.versions && !process.versions.electron) {
    return { success: false, error: 'Beetanlage ist nur in der Electron-App möglich.' };
  }
  // Fallback für Next.js-Server-Kontext (z.B. Vercel, reines SSR)
  if (typeof window === 'undefined') {
    // window ist im Server-Kontext nicht definiert
    return { success: false, error: 'Beetanlage ist nur in der Electron-App möglich.' };
  }
  try {
    const availableNumbers = await getAvailableBedNumbers();
    if (!availableNumbers.includes(formData.bedNumber)) {
        return { success: false, error: `Beetnummer ${formData.bedNumber} ist bereits vergeben oder ungültig.` };
    }
    
    const bedData = mapFormDataToBed(formData);
    const newBed = await addBed(bedData);
    revalidatePath('/');
    revalidatePath('/beds/new');
    return { success: true, data: newBed };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Unbekannter Fehler bei der Beet-Anlage.' };
  }
}

export async function updateBedAction(id: string, formData: BedFormData): Promise<{ success: boolean; data?: Bed; error?: string }> {
  try {
    const existingBed = await getBedById(id);
    if (!existingBed) {
        return { success: false, error: 'Beet nicht gefunden.' };
    }
    // If bedNumber is changed, check if new number is available (excluding current bed's original number)
    if (formData.bedNumber !== existingBed.bedNumber) {
        const availableNumbers = await getAvailableBedNumbers();
        if (!availableNumbers.includes(formData.bedNumber)) {
             return { success: false, error: `Beetnummer ${formData.bedNumber} ist bereits vergeben oder ungültig.` };
        }
    }

    const bedData = mapFormDataToBed(formData);
    const updatedBed = await updateBedData(id, bedData);
    if (!updatedBed) {
        return { success: false, error: 'Aktualisierung fehlgeschlagen.' };
    }
    revalidatePath('/');
    revalidatePath(`/beds/${id}/edit`);
    return { success: true, data: updatedBed };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Ein serverseitiger Fehler ist aufgetreten.';
    return { success: false, error };
  }
}

export async function deleteBedAction(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const success = await deleteBedData(id);
        if (!success) {
            return { success: false, error: 'Beet konnte nicht gefunden oder gelöscht werden.' };
        }
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : 'Ein serverseitiger Fehler ist aufgetreten.';
        return { success: false, error };
    }
}
