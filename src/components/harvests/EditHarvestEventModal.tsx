
'use client';

import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { HarvestEvent } from '@/lib/definitions'; // Assuming EnrichedHarvestEvent is too complex or not needed here directly
import { updateFinalizedHarvestEventAction } from '@/lib/actions-stubs'; // TEMPORÄR für Static Export
import { Loader2, Save } from 'lucide-react';

// Define the type for the event prop more narrowly if EnrichedHarvestEvent is not available here
// For now, we assume HarvestEvent contains what's needed or we'll use a more specific prop type.
interface EditHarvestEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Pick<HarvestEvent, 'id' | 'totalYieldKg' | 'remarks'> & { herbName?: string }; // Use a more specific type
  onUpdateSuccess: () => void;
}

const EditHarvestEventFormSchema = z.object({
  totalYieldKg: z.union([
    z.coerce.number({ invalid_type_error: "Menge muss eine Zahl sein." })
      .min(0, "Menge muss eine nicht-negative Zahl sein."),
    z.undefined()
  ]).optional(),
  remarks: z.string().max(500, "Bemerkungen dürfen maximal 500 Zeichen lang sein.").optional(),
});

type EditHarvestEventFormValues = z.infer<typeof EditHarvestEventFormSchema>;

export default function EditHarvestEventModal({ isOpen, onClose, event, onUpdateSuccess }: EditHarvestEventModalProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<EditHarvestEventFormValues>({
    resolver: zodResolver(EditHarvestEventFormSchema) as any,
    defaultValues: {
      totalYieldKg: event.totalYieldKg ?? undefined, // Ensure undefined if null or not present
      remarks: event.remarks ?? '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        totalYieldKg: event.totalYieldKg ?? undefined,
        remarks: event.remarks ?? '',
      });
    }
  }, [isOpen, event, form]);

  const onSubmit = (values: EditHarvestEventFormValues) => {
    startTransition(async () => {
      const result = await updateFinalizedHarvestEventAction({
        eventId: event.id,
        totalYieldKg: values.totalYieldKg, // Will be number or undefined
        remarks: values.remarks || undefined, // Ensure undefined if empty string (Zod handles optional)
      });

      if (result.success) {
        toast({ title: 'Erfolg', description: 'Ernte-Event erfolgreich aktualisiert.' });
        onUpdateSuccess(); // This should trigger router.refresh() in the parent
        onClose();
      } else {
        toast({ title: 'Fehler', description: result.error || 'Fehler beim Aktualisieren des Ernte-Events.', variant: 'destructive' });
      }
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ernte-Event bearbeiten</DialogTitle>
          <DialogDescription>
            Aktualisieren Sie die Gesamt-Erntemenge (kg) und/oder die Bemerkungen für {event.herbName || 'diesen Erntevorgang'}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="totalYieldKg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gesamt-Erntemenge (kg)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      placeholder="z.B. 120.5" 
                      {...field} 
                      value={field.value === undefined ? '' : field.value} // Handle undefined for controlled input
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>Lassen Sie das Feld leer, um keine Menge anzugeben oder eine vorhandene zu entfernen.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bemerkungen</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optionale Bemerkungen zum Erntevorgang..." {...field} value={field.value ?? ""} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Abbrechen
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Speichern
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
