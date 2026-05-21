import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Prüft, ob die App in einer Electron-Umgebung läuft
 */
export function isElectron(): boolean {
  // Check if we're in a browser environment first
  if (typeof window === 'undefined') {
    return false;
  }
  
  // Check for Electron-specific properties
  return !!(
    window.electronAPI ||
    (window as any).electron ||
    process?.versions?.electron ||
    navigator?.userAgent?.includes('Electron')
  );
}
