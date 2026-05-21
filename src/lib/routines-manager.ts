import { electronAPI, isElectron } from './electron-bridge';

export interface Routine {
  id: string;
  name: string;
  description?: string;
  type: 'calendar' | 'bed' | 'harvest' | 'herb' | 'other';
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  lastRun?: string; // ISO date string
  nextRun?: string; // ISO date string
  configuration: Record<string, any>; // Spezifische Konfiguration basierend auf dem Typ
  isActive?: boolean; // Status der Routine
  createdAt?: string; // Erstellungsdatum
  updatedAt?: string; // Letztes Aktualisierungsdatum
}

const ROUTINES_STORAGE_KEY = 'garden_routines';

// Lokaler Speicher für Entwicklung im Browser
const getLocalStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(ROUTINES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Fehler beim Lesen aus localStorage:', e);
      return [];
    }
  }
  return [];
};

const setLocalStorage = (data: Routine[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Fehler beim Schreiben in localStorage:', e);
      return false;
    }
  }
  return false;
};

/**
 * Verwaltet wiederkehrende Routinen, die gespeichert und wiederverwendet werden können
 */
export class RoutinesManager {
  private static instance: RoutinesManager;
  private routines: Routine[] = [];
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): RoutinesManager {
    if (!RoutinesManager.instance) {
      RoutinesManager.instance = new RoutinesManager();
    }
    return RoutinesManager.instance;
  }

  /**
   * Lädt gespeicherte Routinen aus dem Konfigurationsspeicher oder localStorage
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      if (isElectron()) {
        const config = await electronAPI.getConfig();
        if (config && config[ROUTINES_STORAGE_KEY]) {
          this.routines = config[ROUTINES_STORAGE_KEY];
        }
      } else {
        // Im Browser: Aus localStorage laden
        this.routines = getLocalStorage();
      }
      this.initialized = true;
    } catch (error) {
      console.error('Fehler beim Laden der Routinen:', error);
      this.routines = [];
      this.initialized = true;
    }
  }
  /**
   * Speichert alle Routinen im Konfigurationsspeicher oder localStorage
   */
  private async saveRoutines(): Promise<boolean> {
    try {
      if (isElectron()) {
        const config = await electronAPI.getConfig() || {};
        config[ROUTINES_STORAGE_KEY] = this.routines;
        return await electronAPI.saveConfig(config);
      } else {
        // Im Browser: In localStorage speichern
        return setLocalStorage(this.routines);
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Routinen:', error);
      return false;
    }
  }

  /**
   * Fügt eine neue Routine hinzu oder aktualisiert eine vorhandene
   */
  public async addOrUpdateRoutine(routine: Routine): Promise<boolean> {
    await this.initialize();
    
    const index = this.routines.findIndex(r => r.id === routine.id);
    if (index >= 0) {
      this.routines[index] = routine;
    } else {
      this.routines.push(routine);
    }
    
    return this.saveRoutines();
  }

  /**
   * Entfernt eine Routine anhand ihrer ID
   */
  public async removeRoutine(id: string): Promise<boolean> {
    await this.initialize();
    
    const initialLength = this.routines.length;
    this.routines = this.routines.filter(r => r.id !== id);
    
    if (this.routines.length < initialLength) {
      return this.saveRoutines();
    }
    
    return false;
  }

  /**
   * Gibt alle gespeicherten Routinen zurück
   */
  public async getAllRoutines(): Promise<Routine[]> {
    await this.initialize();
    return [...this.routines];
  }

  /**
   * Gibt Routinen eines bestimmten Typs zurück
   */
  public async getRoutinesByType(type: Routine['type']): Promise<Routine[]> {
    await this.initialize();
    return this.routines.filter(r => r.type === type);
  }

  /**
   * Gibt eine bestimmte Routine anhand ihrer ID zurück
   */
  public async getRoutineById(id: string): Promise<Routine | undefined> {
    await this.initialize();
    return this.routines.find(r => r.id === id);
  }

  /**
   * Aktualisiert den Zeitstempel der letzten und nächsten Ausführung einer Routine
   */
  public async updateRoutineTimestamp(id: string): Promise<boolean> {
    await this.initialize();
    
    const index = this.routines.findIndex(r => r.id === id);
    if (index < 0) return false;
    
    const now = new Date();
    this.routines[index].lastRun = now.toISOString();
    
    // Berechne das nächste Ausführungsdatum basierend auf der Frequenz
    if (this.routines[index].frequency) {
      const nextRun = new Date(now);
      switch (this.routines[index].frequency) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1);
          break;
        case 'yearly':
          nextRun.setFullYear(nextRun.getFullYear() + 1);
          break;
      }
      this.routines[index].nextRun = nextRun.toISOString();
    }
    
    return this.saveRoutines();
  }
}

// Export eine Singleton-Instanz
export const routinesManager = RoutinesManager.getInstance();
