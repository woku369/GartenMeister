'use client';

import { useEffect } from 'react';

/**
 * PORTABLE EXE: Prefetching-Killer
 * 
 * Deaktiviert Next.js Router-Prefetching komplett zur Laufzeit
 * um RSC Payload-Errors in Electron zu verhindern.
 */
export function PrefetchKiller() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    console.log('[PrefetchKiller] Deaktiviere Next.js Prefetching...');
    
    // 1. Überschreibe Router-Prefetch-Methode
    const originalPrefetch = window.next?.router?.prefetch;
    if (window.next?.router && originalPrefetch) {
      window.next.router.prefetch = () => {
        console.log('[PrefetchKiller] Prefetch-Request blockiert');
        return Promise.resolve();
      };
    }
    
    // 2. Überschreibe Intersection Observer für Link-Prefetching
    const OriginalIntersectionObserver = window.IntersectionObserver;
    if (OriginalIntersectionObserver) {
      window.IntersectionObserver = class MockIntersectionObserver {
        constructor(callback: any, options?: any) {
          console.log('[PrefetchKiller] IntersectionObserver für Prefetching deaktiviert');
          // Mock-Implementation die nichts tut
          return {
            observe: () => {},
            unobserve: () => {},
            disconnect: () => {},
          } as any;
        }
      } as any;
    }
    
    // 3. Fetch-Requests für RSC blockieren
    const originalFetch = window.fetch;
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      
      // RSC-Requests blockieren
      if (url.includes('_rsc=') || url.includes('index.txt')) {
        console.log('[PrefetchKiller] RSC Fetch blockiert:', url);
        return Promise.reject(new Error('RSC Prefetching blocked by PrefetchKiller'));
      }
      
      return originalFetch(input, init);
    };
    
    console.log('[PrefetchKiller] ✅ Alle Prefetching-Mechanismen deaktiviert');
    
    return () => {
      // Cleanup: Originale Funktionen wiederherstellen
      if (originalPrefetch && window.next?.router) {
        window.next.router.prefetch = originalPrefetch;
      }
      if (OriginalIntersectionObserver) {
        window.IntersectionObserver = OriginalIntersectionObserver;
      }
      window.fetch = originalFetch;
    };
  }, []);
  
  return null; // Keine UI-Ausgabe
}

// TypeScript-Erweiterung für window.next
declare global {
  interface Window {
    next?: {
      router?: {
        prefetch?: (href: string) => Promise<void>;
      };
    };
  }
}
