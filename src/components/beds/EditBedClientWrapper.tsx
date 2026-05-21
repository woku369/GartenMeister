'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Harvest, Bed, HerbVariety, VersuchsbeetSegment } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { BookOpenText } from 'lucide-react';
import BedForm from '@/components/beds/BedForm';
import HarvestFormModal from '@/components/harvests/HarvestFormModal';

export interface EditBedClientWrapperProps {
  bed: Bed;
  availableBedNumbers: number[];
  herbVarieties: HerbVariety[];
  segments: VersuchsbeetSegment[];
  initialHarvests: Harvest[];
}

export default function EditBedClientWrapper({
  bed,
  availableBedNumbers,
  herbVarieties,
  segments: initialSegments, // Renamed to avoid conflict if we introduce a state for segments
  initialHarvests,
}: EditBedClientWrapperProps) {
  const router = useRouter();
  const [isHarvestModalOpen, setIsHarvestModalOpen] = useState(false);
  
  // The BedForm will now manage its own segments and harvests internally based on props
  // So, we don't need to hold `currentHarvests` or `currentSegments` state here.
  // The `initialHarvests` and `initialSegments` are passed down to child components.

  // useEffect(() => {
  //   console.log("[EditBedClientWrapper] Received initialSegments:", initialSegments?.length);
  //   console.log("[EditBedClientWrapper] Received initialHarvests:", initialHarvests?.length);
  // }, [initialSegments, initialHarvests]);

  const handleHarvestChange = () => {
    // When a harvest is added/deleted in the modal,
    // we refresh the server component data which will then re-render this client component
    // with updated initialHarvests.
    router.refresh(); 
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Beet Nr. {bed.bedNumber} bearbeiten</h1>
        {(bed.type === 'Standard' || bed.type === 'Kombinationsbeet') && (
          <Button variant="outline" onClick={() => setIsHarvestModalOpen(true)}>
            <BookOpenText className="mr-2 h-4 w-4" /> Ernten verwalten
          </Button>
        )}
      </div>

      {/* BedForm now receives initialSegments and will manage them internally if needed */}
      <BedForm
        bed={bed}
        segments={initialSegments} 
        availableBedNumbers={availableBedNumbers}
        herbVarieties={herbVarieties}
      />

      {(bed.type === 'Standard' || bed.type === 'Kombinationsbeet') && (
        <HarvestFormModal
          isOpen={isHarvestModalOpen}
          onClose={() => setIsHarvestModalOpen(false)}
          bed={bed}
          segments={initialSegments} // Pass initial segments to modal
          herbVarieties={herbVarieties}
          existingHarvests={initialHarvests} // Pass initial harvests
          onHarvestChange={handleHarvestChange}
        />
      )}
    </div>
  );
}
