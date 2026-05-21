'use client';

import { useEffect } from 'react';

/**
 * PORTABLE EXE: Navigation Debug-Test
 * 
 * Testet verschiedene Navigations-Mechanismen
 */
export function NavigationDebugger() {
  useEffect(() => {
    console.log('[NavigationDebugger] Started');
  }, []);
  
  const handleNavigateIPC = async (route: string) => {
    console.log(`[NavigationDebugger] IPC Navigation zu: ${route}`);
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const result = await (window as any).electronAPI.navigateTo(route);
        console.log('[NavigationDebugger] IPC Navigation Ergebnis:', result);
      } else {
        console.log('[NavigationDebugger] ElectronAPI nicht verfügbar, verwende window.location.href');
        window.location.href = route;
      }
    } catch (error) {
      console.error('[NavigationDebugger] Navigation Fehler:', error);
    }
  };
  
  const handleNavigateWindow = (route: string) => {
    console.log(`[NavigationDebugger] Window Navigation zu: ${route}`);
    window.location.href = route;
  };
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'yellow', 
      padding: '10px', 
      zIndex: 9999,
      fontSize: '12px',
      border: '1px solid black'
    }}>
      <div>Navigation Debugger Active</div>
      <button 
        onClick={() => handleNavigateIPC('/dashboard')}
        style={{ marginTop: '5px', padding: '5px', display: 'block', width: '100%' }}
      >
        IPC: Dashboard
      </button>
      <button 
        onClick={() => handleNavigateWindow('/dashboard')}
        style={{ marginTop: '5px', padding: '5px', display: 'block', width: '100%' }}
      >
        Window: Dashboard
      </button>
      <button 
        onClick={() => handleNavigateIPC('/herbs')}
        style={{ marginTop: '5px', padding: '5px', display: 'block', width: '100%' }}
      >
        IPC: Herbs
      </button>
    </div>
  );
}
