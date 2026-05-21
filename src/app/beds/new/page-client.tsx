'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBeds, useHerbVarieties, useGartenConfiguration } from '@/lib/data-hooks-safe';
import NewBedFormClientWrapper from '@/components/beds/NewBedFormClientWrapper';

export default function NewBedPageClient() {
  const searchParams = useSearchParams();
  const bedNumberParam = searchParams.get('bedNumber');
  
  console.log('NewBedPageClient Debug - searchParams string:', searchParams.toString());
  console.log('NewBedPageClient Debug - bedNumber param:', bedNumberParam);
  
  // Verwende die neuen, sicheren Hooks
  const { beds, loading: bedsLoading, error: bedsError } = useBeds();
  const { herbVarieties, loading: herbsLoading, error: herbsError } = useHerbVarieties();
  const { config, loading: configLoading, error: configError } = useGartenConfiguration();

  // Sichere Array-Extraktion
  const safeBedsArray = useMemo(() => {
    try {
      if (Array.isArray(beds)) return beds;
      return [];
    } catch (err) {
      console.error('Fehler beim Laden der Beete:', err);
      return [];
    }
  }, [beds]);

  const safeHerbsArray = useMemo(() => {
    try {
      if (Array.isArray(herbVarieties)) return herbVarieties;
      return [];
    } catch (err) {
      console.error('Fehler beim Laden der Kräutersorten:', err);
      return [];
    }
  }, [herbVarieties]);

  // Berechne verfügbare Beetnummern (nur unbelegte)
  const availableBedNumbers = useMemo(() => {
    try {
      const totalBeds = config?.currentBeetCount || 20;
      const occupiedNumbers = safeBedsArray.map(bed => bed.bedNumber).filter(num => typeof num === 'number');
      
      const available = [];
      for (let i = 1; i <= totalBeds; i++) {
        if (!occupiedNumbers.includes(i)) {
          available.push(i);
        }
      }
      

      
      return available;
    } catch (err) {
      console.error('Fehler beim Berechnen verfügbarer Beetnummern:', err);
      return [];
    }
  }, [safeBedsArray, config]);

  // Extrahiere die gewünschte Beetnummer aus den URL-Parametern
  const requestedBedNumber = bedNumberParam ? parseInt(bedNumberParam, 10) : undefined;
  
  console.log('NewBedPageClient Debug - requestedBedNumber:', requestedBedNumber);


  // Loading state
  if (bedsLoading || herbsLoading || configLoading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Neues Beet anlegen</h1>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Lade Daten...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (bedsError || herbsError || configError) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Neues Beet anlegen</h1>
        <div className="text-red-600">
          Fehler beim Laden der Daten: {bedsError || herbsError || configError}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Neues Beet anlegen</h1>
      <NewBedFormClientWrapper
        availableBedNumbers={availableBedNumbers}
        herbVarieties={safeHerbsArray}
        requestedBedNumber={requestedBedNumber}
      />
    </div>
  );
}
