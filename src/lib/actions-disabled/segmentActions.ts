
'use server';

import { revalidatePath } from 'next/cache';
import {
  addSegmentToBed,
  updateSegment as updateSegmentData,
  deleteSegment as deleteSegmentData,
  getBedById,
  getSegmentsForBed
} from '@/lib/data';
import type { KombinationsbeetSegment, SegmentFormData } from '@/lib/definitions';

export async function createSegmentAction(bedId: string, segmentData: SegmentFormData): Promise<{ success: boolean; data?: KombinationsbeetSegment; error?: string }> {
  try {
    console.log('[segmentActions] ========= SEGMENT CREATION START =========');
    console.log('[segmentActions] Versuche Segment zu erstellen für bedId:', bedId);
    console.log('[segmentActions] segmentData:', JSON.stringify(segmentData, null, 2));
    console.log('[segmentActions] Server-Umgebung:', typeof window === 'undefined');
    console.log('[segmentActions] Electron API verfügbar:', typeof (global as any).electronAPI !== 'undefined');
    
    const bed = await getBedById(bedId);
    console.log('[segmentActions] getBedById Ergebnis:', bed);
    console.log('[segmentActions] Beet-Typ:', bed?.type);
    console.log('[segmentActions] Typ-Vergleich mit "Kombinationsbeet":', bed?.type === 'Kombinationsbeet');
    console.log('[segmentActions] Typ als String:', JSON.stringify(bed?.type));
    console.log('[segmentActions] "Kombinationsbeet" als String:', JSON.stringify('Kombinationsbeet'));
    
    if (!bed) {
      console.log('[segmentActions] FEHLER: Beet nicht gefunden');
      return { success: false, error: 'Beet nicht gefunden.' };
    }
    
    if (bed.type !== 'Kombinationsbeet') {
      console.log('[segmentActions] FEHLER: Beet ist kein Kombinationsbeet. Typ ist:', bed.type);
      return { success: false, error: 'Segment kann nur zu einem Kombinationsbeet hinzugefügt werden.' };
    }

    console.log('[segmentActions] ✅ Typ-Check erfolgreich - Beet ist ein Kombinationsbeet');
    const existingSegments = await getSegmentsForBed(bedId);
    const totalExistingLength = existingSegments.reduce((sum, seg) => sum + seg.segmentLength, 0);
    if (totalExistingLength + segmentData.segmentLength > bed.length) {
      // Ensure bed.length is defined and a number
      const bedLength = bed.length || 0;
      return { success: false, error: `Gesamtlänge der Segmente (${totalExistingLength + segmentData.segmentLength}m) würde Beetlänge (${bedLength}m) überschreiten.` };
    }

    const newSegment = await addSegmentToBed(bedId, segmentData);
    revalidatePath(`/beds/${bedId}/edit`);
    return { success: true, data: newSegment };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Ein serverseitiger Fehler ist aufgetreten.';
    return { success: false, error };
  }
}

export async function updateSegmentAction(segmentId: string, bedId: string, segmentData: Partial<SegmentFormData>): Promise<{ success: boolean; data?: VersuchsbeetSegment; error?: string }> {
  try {
    const updatedSegment = await updateSegmentData(segmentId, segmentData);
    if (!updatedSegment) {
      return { success: false, error: 'Segment nicht gefunden oder Aktualisierung fehlgeschlagen.' };
    }
    revalidatePath(`/beds/${bedId}/edit`); // bedId is passed to ensure correct revalidation
    return { success: true, data: updatedSegment };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Ein serverseitiger Fehler ist aufgetreten.';
    return { success: false, error };
  }
}

export async function deleteSegmentAction(segmentId: string, bedId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const success = await deleteSegmentData(segmentId);
        if (!success) {
            return { success: false, error: 'Segment konnte nicht gefunden oder gelöscht werden.' };
        }
        revalidatePath(`/beds/${bedId}/edit`); // bedId is passed for revalidation
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : 'Ein serverseitiger Fehler ist aufgetreten.';
        return { success: false, error };
    }
}
