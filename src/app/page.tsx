'use client';

import dynamic from 'next/dynamic';

/**
 * SSR-SICHERE VERSION - Gartenübersicht
 * Lädt die Client-Komponente dynamisch ohne SSR
 * Verhindert React Error #130, #310 und andere SSR-Probleme
 */

// Dynamic import ohne SSR für Client-Only Hooks
const GardenOverviewPageClient = dynamic(() => import('./page-client'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      <span className="ml-2">Lade Gartenübersicht...</span>
    </div>
  ),
});

export default function GardenOverviewPage() {
  return <GardenOverviewPageClient />;
}
