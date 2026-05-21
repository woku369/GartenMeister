'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBeds, useHerbVarieties, useSegments } from '@/lib/data-hooks-safe';
import type { Bed, HerbVariety, VersuchsbeetSegment } from '@/lib/definitions';
import EditBedClientWrapper from '@/components/beds/EditBedClientWrapper';
import { Loader2 } from 'lucide-react';

// Client Component für die eigentliche Funktionalität
export default function EditBedPageClient({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [bedId, setBedId] = useState<string | null>(null);
  const [bed, setBed] = useState<Bed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Hooks für Daten
  const { beds, loading: bedsLoading } = useBeds();
  const { herbVarieties } = useHerbVarieties();
  const { segments } = useSegments();

  // URL-Parameter auflösen
  useEffect(() => {
    params.then(resolvedParams => {
      setBedId(resolvedParams.id);
    });
  }, [params]);

  // Beet finden wenn bedId und beds verfügbar sind
  useEffect(() => {
    if (!bedId) {
      console.log('Noch keine bedId verfügbar');
      return;
    }
    
    if (bedsLoading) {
      console.log('Beds werden noch geladen...');
      return;
    }
    
    if (!beds || !Array.isArray(beds)) {
      console.log('Beds noch nicht geladen oder ungültig:', beds);
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    console.log('Suche Beet mit ID:', bedId);
    console.log('Verfügbare Beete:', beds.map(b => `${b.id} (Nummer ${b.bedNumber})`));

    const foundBed = beds.find(b => b.id === bedId);
    if (!foundBed) {
      console.log('Beet nicht gefunden!');
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    console.log('Beet gefunden:', foundBed);
    setBed(foundBed);
    setIsLoading(false);
  }, [bedId, beds, bedsLoading]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Lade Beetdaten...</span>
      </div>
    );
  }

  // Not found state
  if (notFound || !bed) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h1 className="text-2xl font-bold mb-4">Beet nicht gefunden</h1>
        <p className="text-muted-foreground mb-4">
          Das angeforderte Beet mit der ID "{bedId}" konnte nicht gefunden werden.
        </p>
        <button 
          onClick={() => router.push('/')} 
          className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
        >
          Zurück zur Übersicht
        </button>
      </div>
    );
  }

  // Segmente für Kombinationsbeete filtern
  const bedSegments = bed.type === 'Kombinationsbeet' ? 
    (segments || []).filter(s => s.bedId === bed.id) : [];

  // Verfügbare Beetnummern berechnen (für Bearbeitung ist die aktuelle Nummer immer verfügbar)
  const usedBedNumbers = (beds || []).map(b => b.bedNumber).filter(num => num !== bed.bedNumber);
  // Maximale Beetanzahl aus der Konfiguration verwenden (Standard: 50)
  const maxBeds = 50; // TODO: Aus Konfiguration laden
  const availableBedNumbers = Array.from({ length: maxBeds }, (_, i) => i + 1)
    .filter(num => !usedBedNumbers.includes(num));

  return (
    <div className="container mx-auto py-8">
      <EditBedClientWrapper
        bed={bed}
        availableBedNumbers={availableBedNumbers}
        herbVarieties={herbVarieties || []}
        segments={bedSegments}
        initialHarvests={[]} // Leeres Array als Platzhalter
      />
    </div>
  );
}
