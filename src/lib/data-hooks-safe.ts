/**
 * SUPER-SICHERE React Hooks für die Dateninteraktion
 * Diese Hooks geben NIEMALS undefined zurück und sind 100% gegen .map() Fehler geschützt
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Bed, HerbVariety, KombinationsbeetSegment, SegmentFormData, GartenConfiguration } from './definitions';
import * as DataStore from './data-store';

// Sichere Default-Werte
const SAFE_DEFAULTS = {
  beds: [],
  herbVarieties: [],
  segments: [],
  config: { currentBeetCount: 20 },
  loading: false,
  error: null
};

// Super-sicherer Hook für Beete
export function useBeds() {
  const [state, setState] = useState({
    beds: SAFE_DEFAULTS.beds,
    loading: true,
    error: SAFE_DEFAULTS.error
  });

  const loadBeds = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await DataStore.loadStore();
      const beds = DataStore.getAllBeds();
      setState({
        beds: Array.isArray(beds) ? beds : SAFE_DEFAULTS.beds,
        loading: false,
        error: null
      });
    } catch (err) {
      setState({
        beds: SAFE_DEFAULTS.beds,
        loading: false,
        error: err instanceof Error ? err.message : 'Fehler beim Laden der Beete'
      });
    }
  }, []);

  useEffect(() => {
    loadBeds();
  }, [loadBeds]);

  const createBed = useCallback(async (bedData: Parameters<typeof DataStore.createBed>[0]) => {
    try {
      const newBed = await DataStore.createBed(bedData);
      if (newBed) {
        const beds = DataStore.getAllBeds();
        setState(prev => ({
          ...prev,
          beds: Array.isArray(beds) ? beds : SAFE_DEFAULTS.beds
        }));
      }
      return newBed;
    } catch (err) {
      console.error('[useBeds] createBed error:', err);
      return null;
    }
  }, []);

  const updateBed = useCallback(async (id: string, updateData: Parameters<typeof DataStore.updateBed>[1]) => {
    try {
      const updatedBed = await DataStore.updateBed(id, updateData);
      if (updatedBed) {
        const beds = DataStore.getAllBeds();
        setState(prev => ({
          ...prev,
          beds: Array.isArray(beds) ? beds : SAFE_DEFAULTS.beds
        }));
      }
      return updatedBed;
    } catch (err) {
      console.error('[useBeds] updateBed error:', err);
      return null;
    }
  }, []);

  const deleteBed = useCallback(async (id: string) => {
    try {
      const success = await DataStore.deleteBed(id);
      if (success) {
        const beds = DataStore.getAllBeds();
        setState(prev => ({
          ...prev,
          beds: Array.isArray(beds) ? beds : SAFE_DEFAULTS.beds
        }));
      }
      return success;
    } catch (err) {
      console.error('[useBeds] deleteBed error:', err);
      return false;
    }
  }, []);

  // GARANTIERT: Diese Funktion gibt NIEMALS undefined zurück
  return {
    beds: Array.isArray(state.beds) ? state.beds : SAFE_DEFAULTS.beds,
    loading: typeof state.loading === 'boolean' ? state.loading : false,
    error: state.error,
    createBed,
    updateBed,
    deleteBed,
    refetch: loadBeds,
  };
}

// Super-sicherer Hook für Kräutersorten
export function useHerbVarieties() {
  const [state, setState] = useState({
    herbVarieties: SAFE_DEFAULTS.herbVarieties,
    loading: true,
    error: SAFE_DEFAULTS.error
  });

  const loadHerbVarieties = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await DataStore.loadStore();
      const herbVarieties = DataStore.getAllHerbVarieties();
      setState({
        herbVarieties: Array.isArray(herbVarieties) ? herbVarieties : SAFE_DEFAULTS.herbVarieties,
        loading: false,
        error: null
      });
    } catch (err) {
      setState({
        herbVarieties: SAFE_DEFAULTS.herbVarieties,
        loading: false,
        error: err instanceof Error ? err.message : 'Fehler beim Laden der Kräutersorten'
      });
    }
  }, []);

  useEffect(() => {
    loadHerbVarieties();
  }, [loadHerbVarieties]);

  const createHerbVariety = useCallback(async (name: string, color?: string) => {
    try {
      const newHerb = await DataStore.createHerbVariety(name, color);
      if (newHerb) {
        const herbVarieties = DataStore.getAllHerbVarieties();
        setState(prev => ({
          ...prev,
          herbVarieties: Array.isArray(herbVarieties) ? herbVarieties : SAFE_DEFAULTS.herbVarieties
        }));
      }
      return newHerb;
    } catch (err) {
      console.error('[useHerbVarieties] createHerbVariety error:', err);
      return null;
    }
  }, []);

  return {
    herbVarieties: Array.isArray(state.herbVarieties) ? state.herbVarieties : SAFE_DEFAULTS.herbVarieties,
    loading: typeof state.loading === 'boolean' ? state.loading : false,
    error: state.error,
    createHerbVariety,
    refetch: loadHerbVarieties,
  };
}

// Super-sicherer Hook für Segmente
export function useSegments(bedId?: string) {
  const [state, setState] = useState({
    segments: SAFE_DEFAULTS.segments,
    loading: true,
    error: SAFE_DEFAULTS.error
  });

  const loadSegments = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await DataStore.loadStore();
      const allSegments = bedId 
        ? DataStore.getSegmentsByBedId(bedId)
        : DataStore.getAllSegments();
      setState({
        segments: Array.isArray(allSegments) ? allSegments : SAFE_DEFAULTS.segments,
        loading: false,
        error: null
      });
    } catch (err) {
      setState({
        segments: SAFE_DEFAULTS.segments,
        loading: false,
        error: err instanceof Error ? err.message : 'Fehler beim Laden der Segmente'
      });
    }
  }, [bedId]);

  useEffect(() => {
    loadSegments();
  }, [loadSegments]);

  const createSegment = useCallback(async (bedId: string, segmentData: SegmentFormData) => {
    try {
      const newSegment = await DataStore.createSegment(bedId, segmentData);
      if (newSegment) {
        const segments = bedId === newSegment.bedId 
          ? DataStore.getSegmentsByBedId(bedId)
          : DataStore.getAllSegments();
        setState(prev => ({
          ...prev,
          segments: Array.isArray(segments) ? segments : SAFE_DEFAULTS.segments
        }));
      }
      return newSegment;
    } catch (err) {
      console.error('[useSegments] createSegment error:', err);
      return null;
    }
  }, []);

  const updateSegment = useCallback(async (id: string, updateData: Partial<SegmentFormData>) => {
    try {
      const updatedSegment = await DataStore.updateSegment(id, updateData);
      if (updatedSegment) {
        const allSegments = bedId 
          ? DataStore.getSegmentsByBedId(bedId)
          : DataStore.getAllSegments();
        setState(prev => ({
          ...prev,
          segments: Array.isArray(allSegments) ? allSegments : SAFE_DEFAULTS.segments
        }));
      }
      return updatedSegment;
    } catch (err) {
      console.error('[useSegments] updateSegment error:', err);
      return null;
    }
  }, [bedId]);

  const deleteSegment = useCallback(async (id: string) => {
    try {
      const success = await DataStore.deleteSegment(id);
      if (success) {
        const allSegments = bedId 
          ? DataStore.getSegmentsByBedId(bedId)
          : DataStore.getAllSegments();
        setState(prev => ({
          ...prev,
          segments: Array.isArray(allSegments) ? allSegments : SAFE_DEFAULTS.segments
        }));
      }
      return success;
    } catch (err) {
      console.error('[useSegments] deleteSegment error:', err);
      return false;
    }
  }, [bedId]);

  return {
    segments: Array.isArray(state.segments) ? state.segments : SAFE_DEFAULTS.segments,
    loading: typeof state.loading === 'boolean' ? state.loading : false,
    error: state.error,
    createSegment,
    updateSegment,
    deleteSegment,
    refetch: loadSegments,
  };
}

// Super-sicherer Hook für Gartenkonfiguration
export function useGartenConfiguration() {
  const [state, setState] = useState({
    config: SAFE_DEFAULTS.config,
    loading: true,
    error: SAFE_DEFAULTS.error
  });

  const loadConfig = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await DataStore.loadStore();
      const config = DataStore.getGartenConfiguration();
      setState({
        config: config || SAFE_DEFAULTS.config,
        loading: false,
        error: null
      });
    } catch (err) {
      setState({
        config: SAFE_DEFAULTS.config,
        loading: false,
        error: err instanceof Error ? err.message : 'Fehler beim Laden der Konfiguration'
      });
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const updateConfig = useCallback(async (updateData: Partial<GartenConfiguration>) => {
    try {
      const success = await DataStore.updateGartenConfiguration(updateData);
      if (success) {
        const config = DataStore.getGartenConfiguration();
        setState(prev => ({
          ...prev,
          config: config || SAFE_DEFAULTS.config
        }));
      }
      return success;
    } catch (err) {
      console.error('[useGartenConfiguration] updateConfig error:', err);
      return false;
    }
  }, []);

  return {
    config: state.config || SAFE_DEFAULTS.config,
    loading: typeof state.loading === 'boolean' ? state.loading : false,
    error: state.error,
    updateConfig,
    refetch: loadConfig,
  };
}

// Super-sicherer Hook für Ernten
export function useHarvests() {
  const [state, setState] = useState({
    harvests: [],
    loading: true,
    error: SAFE_DEFAULTS.error
  });

  const loadHarvests = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Ernten über IPC laden
      if (window.electronAPI?.readJsonFile) {
        const harvestData = await window.electronAPI.readJsonFile('harvests.json');
        setState({
          harvests: Array.isArray(harvestData) ? harvestData : [],
          loading: false,
          error: null
        });
      } else {
        setState({
          harvests: [],
          loading: false,
          error: null
        });
      }
    } catch (err) {
      setState({
        harvests: [],
        loading: false,
        error: err instanceof Error ? err.message : 'Fehler beim Laden der Ernten'
      });
    }
  }, []);

  useEffect(() => {
    loadHarvests();
  }, [loadHarvests]);

  return {
    harvests: Array.isArray(state.harvests) ? state.harvests : [],
    loading: typeof state.loading === 'boolean' ? state.loading : false,
    error: state.error,
    refetch: loadHarvests,
  };
}
