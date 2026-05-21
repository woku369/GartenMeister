
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react'; // Or a more fitting icon like 'Vegan' or 'Scissors' for harvest
import GlobalHarvestWorkflowModal from '@/components/harvests/GlobalHarvestWorkflowModal';
import type { HerbVariety } from '@/lib/definitions';

interface HarvestInitiatorButtonProps {
  herbVarieties: HerbVariety[];
}

export default function HarvestInitiatorButton({ herbVarieties }: HarvestInitiatorButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setIsModalOpen(true)}>
        <PlusCircle className="mr-2 h-4 w-4" /> Neuen Erntevorgang starten
      </Button>
      <GlobalHarvestWorkflowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        herbVarieties={herbVarieties}
      />
    </>
  );
}
