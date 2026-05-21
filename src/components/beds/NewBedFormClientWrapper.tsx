'use client';

import { useEffect, useState } from 'react';
import BedForm from './BedForm';
import { HerbVariety } from '@/lib/definitions';

interface NewBedFormClientWrapperProps {
  availableBedNumbers: number[];
  herbVarieties: HerbVariety[];
  requestedBedNumber?: number;
}

export default function NewBedFormClientWrapper({
  availableBedNumbers,
  herbVarieties,
  requestedBedNumber
}: NewBedFormClientWrapperProps) {

  
  // Prüfen, ob die angeforderte Beetnummer verfügbar ist
  const isRequestedNumberAvailable = requestedBedNumber !== undefined && 
    availableBedNumbers.includes(requestedBedNumber);
  
  console.log('NewBedFormClientWrapper Debug:', {
    requestedBedNumber,
    availableBedNumbers,
    isRequestedNumberAvailable
  });
  
  // Wenn die angeforderte Nummer verfügbar ist, stellen wir sicher, dass sie als erste Option erscheint
  const sortedAvailableNumbers = [...availableBedNumbers];
  if (isRequestedNumberAvailable) {
    const index = sortedAvailableNumbers.indexOf(requestedBedNumber);
    if (index > 0) {
      // Entfernen der Nummer aus dem Array und an den Anfang stellen
      sortedAvailableNumbers.splice(index, 1);
      sortedAvailableNumbers.unshift(requestedBedNumber);
    }
  }

  return (
    <BedForm
      availableBedNumbers={sortedAvailableNumbers}
      herbVarieties={herbVarieties}
      preferredBedNumber={isRequestedNumberAvailable ? requestedBedNumber : undefined}
    />
  );
}
