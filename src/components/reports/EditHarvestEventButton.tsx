
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import EditHarvestEventModal from '@/components/harvests/EditHarvestEventModal';
import { electronAPI } from '@/lib/electron-bridge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { HarvestEvent } from '@/lib/definitions';

// Using the refined type from reports page. If not available, define a local one or import.
// For now, assuming a prop 'event' that matches what EditHarvestEventModal expects.
interface EnrichedHarvestEventForEdit extends Pick<HarvestEvent, 'id' | 'totalYieldKg' | 'remarks'> {
  herbName?: string;
  // Add other fields from EnrichedHarvestEvent if EditHarvestEventModal's title/description needs them
}

interface EditHarvestEventButtonProps {
  event: EnrichedHarvestEventForEdit;
}

export default function EditHarvestEventButton({ event }: EditHarvestEventButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleUpdateSuccess = () => {
    router.refresh(); // Re-fetch data for the current page
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!event.id) return;
    
    setIsDeleting(true);
    try {
      if (electronAPI.isElectron() && window.electronAPI?.invoke) {
        const success = await window.electronAPI.invoke('harvests:delete', event.id);
        if (success) {
          console.log('Harvest event deleted successfully');
          router.refresh(); // Refresh the page to update the data
        } else {
          console.error('Failed to delete harvest event');
        }
      } else {
        console.error('Electron API not available for delete operation');
      }
    } catch (error) {
      console.error('Error deleting harvest event:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation(); // Prevent accordion from toggling
            setIsModalOpen(true);
          }}
          className="p-1 h-auto"
          title="Ernte-Event bearbeiten"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Ernte-Event bearbeiten</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDeleteClick}
          className="p-1 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Ernte-Event löschen"
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Ernte-Event löschen</span>
        </Button>
      </div>
      
      {isModalOpen && ( // Conditionally render modal for performance
        <EditHarvestEventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          event={event}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ernte-Event löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie dieses Ernte-Event löschen möchten? 
              {event.herbName && ` (${event.herbName})`}
              <br />
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Lösche...' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
