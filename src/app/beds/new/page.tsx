'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import der Client-Komponente ohne SSR
const NewBedPageClient = dynamic(() => import('./page-client'), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Neues Beet anlegen</h1>
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Lade Formular...</span>
      </div>
    </div>
  ),
});

export default function NewBedPage() {
  return <NewBedPageClient />;
}
