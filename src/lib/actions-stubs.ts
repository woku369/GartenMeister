// TEMPORÄRE STUBS für Server Actions während Static Export
// Diese werden später durch IPC-Calls ersetzt

export const addHerbVarietyAction = async (name: string, color?: string) => ({
  success: true,
  data: { id: Date.now().toString(), name, color: color || '#10B981' }
});

export const createBedAction = async (formData: any) => ({
  success: true,
  data: { id: `bed-${Date.now()}`, ...formData }
});

export const updateBedAction = async (id: string, formData: any) => ({
  success: true,
  data: { id, ...formData }
});

export const deleteBedAction = async (id: string) => ({
  success: true
});

export const createSegmentAction = async (bedId: string, segmentData: any) => ({
  success: true,
  data: { id: `segment-${Date.now()}`, bedId, ...segmentData }
});

export const updateSegmentAction = async (segmentId: string, bedId: string, segmentData: any) => ({
  success: true,
  data: { id: segmentId, bedId, ...segmentData }
});

export const deleteSegmentAction = async (segmentId: string, bedId: string) => ({
  success: true
});

export const startHarvestEventAction = async (data: any) => {
  try {
    console.log('[Action-IPC] startHarvestEventAction aufgerufen mit:', data);
    
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Erstelle Standard-Contributions basierend auf ausgewählten Beeten
      const contributions = [];
      
      if (data.selectedBedsAndSegments && Array.isArray(data.selectedBedsAndSegments)) {
        console.log('[Action-IPC] Erstelle Standard-Contributions für', data.selectedBedsAndSegments.length, 'Beete');
        console.log('[Action-IPC] Bed-Details:', data.selectedBedsAndSegments.map(b => ({
          id: b.id,
          type: b.type,
          productivePlantsPercentage: b.productivePlantsPercentage,
          segments: b.segmentsRelevantToHarvest?.map(s => ({
            id: s.id,
            productivePlantsPercentage: s.productivePlantsPercentage
          }))
        })));
        
        data.selectedBedsAndSegments.forEach((bed: any) => {
          if (bed.type === 'Standard') {
            // Verwende den aktuellen Produktivitätswert aus dem Beet (NICHT 100% als Fallback!)
            const productivePercentage = bed.productivePlantsPercentage;
            console.log('[Action-IPC] Standard-Beet:', bed.id, 'Produktivität:', productivePercentage);
            contributions.push({
              bedId: bed.id,
              productivePlantsPercentage: productivePercentage,
              notes: `Übernommen aus Beetübersicht: ${productivePercentage}%`,
              harvestEventId: `harvest-${Date.now()}`
            });
          } else if (bed.type === 'Kombinationsbeet' && bed.segmentsRelevantToHarvest) {
            bed.segmentsRelevantToHarvest.forEach((segment: any) => {
              // Verwende den aktuellen Produktivitätswert aus dem Segment (NICHT 100% als Fallback!)
              const productivePercentage = segment.productivePlantsPercentage;
              console.log('[Action-IPC] Segment:', segment.id, 'Produktivität:', productivePercentage);
              contributions.push({
                bedId: bed.id,
                segmentId: segment.id,
                productivePlantsPercentage: productivePercentage,
                notes: `Übernommen aus Segment: ${productivePercentage}%`,
                harvestEventId: `harvest-${Date.now()}`
              });
            });
          }
        });
      }
      
      // Erstelle die vollständige Ernte mit Standard-Contributions
      const harvestData = {
        herbVarietyId: data.herbVarietyId,
        harvestDateStart: data.harvestDateStart,
        harvestDateEnd: data.harvestDateEnd,
        totalWeight: 0, // Wird später in finalize gesetzt
        remarks: '',
        contributions: contributions
      };
      
      console.log('[Action-IPC] Erstelle Harvest mit', contributions.length, 'Contributions');
      
      const result = await window.electronAPI.invoke('harvests:create', harvestData);
      console.log('[Action-IPC] Harvest Event erstellt:', result);
      
      return {
        success: true,
        eventId: result.harvest?.id || `harvest-${Date.now()}`
      };
    } else {
      console.warn('[Action-IPC] ElectronAPI nicht verfügbar');
      return {
        success: false,
        error: 'ElectronAPI nicht verfügbar'
      };
    }
  } catch (error) {
    console.error('[Action-IPC] Fehler bei startHarvestEventAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    };
  }
};

export const getBedsForHarvestEventAction = async (herbVarietyId: string) => {
  try {
    console.log('[Action-IPC] getBedsForHarvestEventAction aufgerufen für:', herbVarietyId);
    console.log('[Action-IPC] window.electronAPI verfügbar:', typeof window !== 'undefined' && !!window.electronAPI);
    console.log('[Action-IPC] window.electronAPI.invoke verfügbar:', typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.invoke === 'function');
    
    if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.invoke === 'function') {
      const relevantBeds = await window.electronAPI.invoke('beds:get-relevant-for-harvest', { variety: herbVarietyId });
      console.log('[Action-IPC] Relevante Beete erhalten:', relevantBeds);
      
      return {
        success: true,
        relevantBeds: relevantBeds || []
      };
    } else {
      console.warn('[Action-IPC] ElectronAPI nicht verfügbar oder invoke-Methode fehlt');
      console.log('[Action-IPC] window:', typeof window);
      console.log('[Action-IPC] window.electronAPI:', typeof window !== 'undefined' ? window.electronAPI : 'window undefined');
      return {
        success: false,
        error: 'ElectronAPI nicht verfügbar'
      };
    }
  } catch (error) {
    console.error('[Action-IPC] Fehler bei getBedsForHarvestEventAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    };
  }
};

export const saveProductivityUpdatesAction = async (data: any) => {
  try {
    console.log('[Action-IPC] saveProductivityUpdatesAction aufgerufen mit:', data);
    
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Konvertiere updates zu contributions für die IPC-Schnittstelle
      const contributions = data.updates ? data.updates.map((update: any) => ({
        bedId: update.bedId,
        segmentId: update.type === 'segment' ? update.entityId : undefined,
        productivePlantsPercentage: update.productivePlantsPercentageAtHarvestTime || 0,
        notes: update.notesOnProductivityChange || '',
        harvestEventId: data.harvestEventId
      })) : [];
      
      console.log('[Action-IPC] Konvertierte Contributions:', contributions);
      
      // Aktualisiere die bestehende Ernte mit den Contributions
      const updateData = {
        contributions: contributions
      };
      
      const result = await window.electronAPI.invoke('harvests:update-with-contributions', data.harvestEventId, updateData);
      console.log('[Action-IPC] Harvest Event mit Contributions aktualisiert:', result);
      
      return {
        success: true,
        eventId: data.harvestEventId
      };
    } else {
      console.warn('[Action-IPC] ElectronAPI nicht verfügbar');
      return {
        success: false,
        error: 'ElectronAPI nicht verfügbar'
      };
    }
  } catch (error) {
    console.error('[Action-IPC] Fehler bei saveProductivityUpdatesAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    };
  }
};

export const finalizeHarvestEventAction = async (data: any) => {
  try {
    console.log('[Action-IPC] finalizeHarvestEventAction aufgerufen mit:', data);
    
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Bereite die Daten für den IPC-Handler vor
      const updateData = {
        totalWeight: data.totalYieldKg, // Verwende totalWeight statt totalYieldKg
        remarks: data.remarks
      };
      
      const result = await window.electronAPI.invoke('harvests:update-with-contributions', data.eventId, updateData);
      console.log('[Action-IPC] Harvest Event finalisiert:', result);
      
      return {
        success: true,
        harvest: result.harvest
      };
    } else {
      console.warn('[Action-IPC] ElectronAPI nicht verfügbar');
      return {
        success: false,
        error: 'ElectronAPI nicht verfügbar'
      };
    }
  } catch (error) {
    console.error('[Action-IPC] Fehler bei finalizeHarvestEventAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    };
  }
};

export const updateFinalizedHarvestEventAction = async (data: any) => {
  try {
    console.log('[Action-IPC] updateFinalizedHarvestEventAction aufgerufen mit:', data);
    
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Bereite die Daten für den IPC-Handler vor
      const updateData = {
        totalWeight: data.totalYieldKg, // Verwende totalWeight statt totalYieldKg
        remarks: data.remarks
      };
      
      const result = await window.electronAPI.invoke('harvests:update-with-contributions', data.eventId, updateData);
      console.log('[Action-IPC] Ernte aktualisiert:', result);
      
      return {
        success: true,
        harvest: result.harvest
      };
    } else {
      console.warn('[Action-IPC] ElectronAPI nicht verfügbar');
      return {
        success: false,
        error: 'ElectronAPI nicht verfügbar'
      };
    }
  } catch (error) {
    console.error('[Action-IPC] Fehler bei updateFinalizedHarvestEventAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    };
  }
};

export type ProcessedProductivityUpdateForAction = any;
