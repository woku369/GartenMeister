/**
 * React Hooks für die Dateninteraktion
 * - Einfache, saubere API für Komponenten
 * - Automatisches Re-Rendering nach Datenänderungen
 * - Keine Events, keine Endlosschleifen
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Bed, HerbVariety, KombinationsbeetSegment, SegmentFormData, GartenConfiguration } from './definitions';
import * as DataStore from './data-store';

// Hook für Beete
export function useBeds() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBeds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await DataStore.loadStore();
      setBeds(DataStore.getAllBeds());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Beete');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBeds();
  }, [loadBeds]);

  const createBed = useCallback(async (bedData: Parameters<typeof DataStore.createBed>[0]) => {
    const newBed = await DataStore.createBed(bedData);
    if (newBed) {
      setBeds(DataStore.getAllBeds());
    }
    return newBed;
  }, []);

  const updateBed = useCallback(async (id: string, updateData: Parameters<typeof DataStore.updateBed>[1]) => {
    const updatedBed = await DataStore.updateBed(id, updateData);
    if (updatedBed) {
      setBeds(DataStore.getAllBeds());
    }
    return updatedBed;
  }, []);

  const deleteBed = useCallback(async (id: string) => {
    const success = await DataStore.deleteBed(id);
    if (success) {
      setBeds(DataStore.getAllBeds());
    }
    return success;
  }, []);

  return {
    beds,
    loading,
    error,
    createBed,
    updateBed,
    deleteBed,
    refetch: loadBeds,
  };
}

// Hook für Kräutersorten
export function useHerbVarieties() {
  const [herbVarieties, setHerbVarieties] = useState<HerbVariety[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHerbVarieties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await DataStore.loadStore();
      setHerbVarieties(DataStore.getAllHerbVarieties());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Kräutersorten');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHerbVarieties();
  }, [loadHerbVarieties]);

  const createHerbVariety = useCallback(async (name: string, color?: string) => {
    const newHerb = await DataStore.createHerbVariety(name, color);
    if (newHerb) {
      setHerbVarieties(DataStore.getAllHerbVarieties());
    }
    return newHerb;
  }, []);

  return {
    herbVarieties,
    loading,
    error,
    createHerbVariety,
    refetch: loadHerbVarieties,
  };
}

// Hook für Segmente
export function useSegments(bedId?: string) {
  const [segments, setSegments] = useState<KombinationsbeetSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSegments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await DataStore.loadStore();
      const allSegments = bedId 
        ? DataStore.getSegmentsByBedId(bedId)
        : DataStore.getAllSegments();
      setSegments(allSegments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Segmente');
    } finally {
      setLoading(false);
    }
  }, [bedId]);

  useEffect(() => {
    loadSegments();
  }, [loadSegments]);

  const createSegment = useCallback(async (bedId: string, segmentData: SegmentFormData) => {
    const newSegment = await DataStore.createSegment(bedId, segmentData);
    if (newSegment) {
      setSegments(bedId === newSegment.bedId 
        ? DataStore.getSegmentsByBedId(bedId)
        : DataStore.getAllSegments());
    }
    return newSegment;
  }, []);

  const updateSegment = useCallback(async (id: string, updateData: Partial<SegmentFormData>) => {
    const updatedSegment = await DataStore.updateSegment(id, updateData);
    if (updatedSegment) {
      const allSegments = bedId 
        ? DataStore.getSegmentsByBedId(bedId)
        : DataStore.getAllSegments();
      setSegments(allSegments);
    }
    return updatedSegment;
  }, [bedId]);

  const deleteSegment = useCallback(async (id: string) => {
    const success = await DataStore.deleteSegment(id);
    if (success) {
      const allSegments = bedId 
        ? DataStore.getSegmentsByBedId(bedId)
        : DataStore.getAllSegments();
      setSegments(allSegments);
    }
    return success;
  }, [bedId]);

  return {
    segments,
    loading,
    error,
    createSegment,
    updateSegment,
    deleteSegment,
    refetch: loadSegments,
  };
}

// Hook für Gartenkonfiguration
export function useGartenConfiguration() {
  const [config, setConfig] = useState<GartenConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await DataStore.loadStore();
      setConfig(DataStore.getGartenConfiguration());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Konfiguration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const updateConfig = useCallback(async (updateData: Partial<GartenConfiguration>) => {
    const success = await DataStore.updateGartenConfiguration(updateData);
    if (success) {
      setConfig(DataStore.getGartenConfiguration());
    }
    return success;
  }, []);

  return {
    config,
    loading,
    error,
    updateConfig,
    refetch: loadConfig,
  };
}

// Hook für verfügbare Beetnummern
export function useAvailableBedNumbers() {
  const { beds } = useBeds();
  const { config } = useGartenConfiguration();

  const availableNumbers = [];
  const maxBeetCount = config?.currentBeetCount || 20;
  const usedNumbers = new Set(beds.map(bed => bed.bedNumber));

  for (let i = 1; i <= maxBeetCount; i++) {
    if (!usedNumbers.has(i)) {
      availableNumbers.push(i);
    }
  }

  return availableNumbers;
}

// Hook für die gesamte App-Initialisierung
export function useAppData() {
  const bedsHook = useBeds();
  const herbsHook = useHerbVarieties();
  const configHook = useGartenConfiguration();

  const loading = bedsHook.loading || herbsHook.loading || configHook.loading;
  const error = bedsHook.error || herbsHook.error || configHook.error;

  return {
    beds: bedsHook.beds,
    herbVarieties: herbsHook.herbVarieties,
    config: configHook.config,
    loading,
    error,
    refetchAll: async () => {
      await Promise.all([
        bedsHook.refetch(),
        herbsHook.refetch(),
        configHook.refetch(),
      ]);
    },
  };
}
