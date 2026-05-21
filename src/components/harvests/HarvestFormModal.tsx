
'use client';

import type { Bed, Harvest, HerbVariety, StandardBed, Kombinationsbeet, KombinationsbeetSegment } from '@/lib/definitions';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
// import { createHarvestAction, deleteHarvestAction } from '@/lib/actions/harvestActions'; // Auskommentiert
import { PlusCircle, Trash2, BookOpenText, CalendarIcon, WeightIcon, InfoIcon } from 'lucide-react';
import { useState, useTransition, useEffect } from 'react';
import { Table, TableBody, TableCell, TableCaption, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const DEFAULT_HERB_COLOR = '#d4d4d8'; // Default color for unknown or generic herbs

const harvestFormSchemaBase = z.object({
  harvestDate: z.string().refine((date) => date && !isNaN(Date.parse(date)), { message: "Gültiges Erntedatum erforderlich." }),
  yieldKg: z.coerce.number({ invalid_type_error: "Menge muss eine Zahl sein." }).min(0, "Menge muss mindestens 0 sein."),
  remarks: z.string().max(300, "Bemerkungen max. 300 Zeichen."),
});

// Schema for Standard Bed Harvest (herbVarietyId is fixed)
const standardBedHarvestSchema = harvestFormSchemaBase.extend({
  bedType: z.literal('Standard'),
  herbVarietyId: z.string(), // Will be populated from the bed, not a form field
  segmentId: z.undefined().optional(),
});

// Schema for Kombinationsbeet Harvest (segmentId is required to get herbVarietyId)
const kombinationsbeetHarvestSchema = harvestFormSchemaBase.extend({
  bedType: z.literal('Kombinationsbeet'),
  segmentId: z.string().min(1, "Segmentauswahl ist erforderlich."),
  herbVarietyId: z.string(), // Will be derived from segment, not a form field
});

// Placeholder for other types if needed, but for now, we focus on yield-specific harvests
const otherBedHarvestSchema = harvestFormSchemaBase.extend({
  bedType: z.enum(['Blühstreifen', 'Brachfläche']),
  herbVarietyId: z.string().optional(), 
  segmentId: z.undefined().optional(),
});


const harvestFormSchema = z.discriminatedUnion("bedType", [
  standardBedHarvestSchema,
  kombinationsbeetHarvestSchema,
  otherBedHarvestSchema,
]);

type HarvestFormValues = z.infer<typeof harvestFormSchema>;

interface HarvestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  bed: Bed;
  segments: KombinationsbeetSegment[]; 
  herbVarieties: HerbVariety[]; 
  existingHarvests: Harvest[]; 
  onHarvestChange: () => void; 
}

export default function HarvestFormModal({
  isOpen,
  onClose,
  bed,
  segments,
  herbVarieties,
  existingHarvests, 
  onHarvestChange
}: HarvestFormModalProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | undefined>(undefined);
  
  const herbMap = new Map(herbVarieties.map(h => [h.id, h]));

  const form = useForm<HarvestFormValues>({
    resolver: zodResolver(harvestFormSchema),
    defaultValues: {
      harvestDate: new Date().toISOString().split('T')[0],
      yieldKg: 0, 
      remarks: '',
      bedType: bed.type,
      ...(bed.type === 'Standard' && { herbVarietyId: (bed as StandardBed).herbVarietyId }),
      ...(bed.type === 'Kombinationsbeet' && { segmentId: undefined, herbVarietyId: undefined }),
      ...( (bed.type === 'Blühstreifen' || bed.type === 'Brachfläche') && { herbVarietyId: undefined } )
    },
  });
  
  useEffect(() => {
    if (isOpen) {
      const resetData: any = {
        harvestDate: new Date().toISOString().split('T')[0],
        yieldKg: 0,
        remarks: '',
        bedType: bed.type,
        ...(bed.type === 'Standard' && { herbVarietyId: (bed as StandardBed).herbVarietyId }),
        ...(bed.type === 'Kombinationsbeet' && { segmentId: undefined, herbVarietyId: undefined }),
        ...( (bed.type === 'Blühstreifen' || bed.type === 'Brachfläche') && { herbVarietyId: undefined } )
      };
      form.reset(resetData);
      setSelectedSegmentId(undefined);
    }
  }, [isOpen, bed, form]);


  const onSubmit = async (values: HarvestFormValues) => {
    /* Auskommentiert, da createHarvestAction nicht mehr existiert und der Workflow überarbeitet wird
    startTransition(async () => {
      let submissionData: Omit<Harvest, 'id'> = {
        bedId: bed.id,
        harvestDate: values.harvestDate,
        yieldKg: values.yieldKg,
        remarks: values.remarks,
        herbVarietyId: '', 
      };

      if (values.bedType === 'Standard') {
        submissionData.herbVarietyId = values.herbVarietyId;
      } else if (values.bedType === 'Kombinationsbeet') {
        if (!values.segmentId) {
          form.setError('segmentId' as any, { type: 'manual', message: 'Segmentauswahl erforderlich.' });
          return;
        }
        const selectedSegment = segments.find(s => s.id === values.segmentId);
        if (!selectedSegment) {
          form.setError('segmentId'as any, { type: 'manual', message: 'Ausgewähltes Segment nicht gefunden.' });
          return;
        }
        submissionData.segmentId = selectedSegment.id;
        submissionData.herbVarietyId = selectedSegment.herbVarietyId;
      } else { 
        submissionData.herbVarietyId = values.herbVarietyId || 'generic-yield-type'; 
      }

      // const result = await createHarvestAction(submissionData);
      // if (result.success) {
      //   toast({ title: 'Erfolg!', description: 'Ernteeintrag hinzugefügt.' });
      //   form.reset({ 
      //       harvestDate: new Date().toISOString().split('T')[0],
      //       yieldKg: 0,
      //       remarks: '',
      //       bedType: bed.type,
      //       ...(bed.type === 'Standard' && { herbVarietyId: (bed as StandardBed).herbVarietyId }),
      //       ...(bed.type === 'Kombinationsbeet' && { segmentId: undefined, herbVarietyId: undefined }),
      //       ...( (bed.type === 'Blühstreifen' || bed.type === 'Brachfläche') && { herbVarietyId: undefined } )
      //   });
      //   setSelectedSegmentId(undefined);
      //   onHarvestChange(); 
      // } else {
      //   toast({ title: 'Fehler', description: result.error || 'Ernte konnte nicht hinzugefügt werden.', variant: 'destructive' });
      // }
      toast({ title: 'Info', description: 'Ernte hinzufügen Funktion wird überarbeitet.', variant: 'default' });
    });
    */
    toast({ title: 'Info', description: 'Die Funktion zum Hinzufügen von Ernten wird derzeit für den neuen globalen Workflow überarbeitet.', variant: 'default' });
  };

  const handleDelete = async (harvestId: string) => {
    /* Auskommentiert, da deleteHarvestAction nicht mehr existiert und der Workflow überarbeitet wird
    startDeleteTransition(async () => {
      // const result = await deleteHarvestAction(harvestId);
      // if (result.success) {
      //   toast({ title: 'Erfolg!', description: 'Ernteeintrag gelöscht.' });
      //   onHarvestChange(); 
      // } else {
      //   toast({ title: 'Fehler', description: result.error || 'Ernteeintrag konnte nicht gelöscht werden.', variant: 'destructive' });
      // }
      toast({ title: 'Info', description: 'Ernte löschen Funktion wird überarbeitet.', variant: 'default' });
    });
    */
    toast({ title: 'Info', description: 'Die Funktion zum Löschen von Ernten wird derzeit für den neuen globalen Workflow überarbeitet.', variant: 'default' });
  };

  const getHerbDetailsForHarvest = (harvest: Harvest): { name: string; color: string } => {
    let herbName = 'Unbekanntes Kraut';
    let herbColor = DEFAULT_HERB_COLOR;

    if (harvest.segmentId) {
      const segment = segments.find(s => s.id === harvest.segmentId);
      if (segment) {
        const herb = herbMap.get(segment.herbVarietyId);
        herbName = `Segment (L: ${segment.segmentLength}m) - ${herb?.name || 'Unbekanntes Segmentkraut'}`;
        if (segment.subVarietyName) herbName += ` (${segment.subVarietyName})`;
        herbColor = herb?.color || DEFAULT_HERB_COLOR;
      } else {
        herbName = 'Segment nicht gefunden';
      }
    } else if ((harvest as any).herbVarietyId) {
        // Handles old harvest structure or generic types
        const herb = herbMap.get((harvest as any).herbVarietyId);
        herbName = herb?.name || 'Unbekanntes Kraut';
        herbColor = herb?.color || DEFAULT_HERB_COLOR;
    }
    
    return { name: herbName, color: herbColor };
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BookOpenText className="mr-2 h-6 w-6 text-primary" />
            Ernten für Beet Nr. {bed.bedNumber}{' '}
            {bed.type === 'Standard' && (
              <>
                ({herbMap.get((bed as StandardBed).herbVarietyId)?.name || 'Unbekanntes Kraut'} <span className="inline-block w-3 h-3 rounded-full ml-1 align-middle border border-black/20" style={{ backgroundColor: herbMap.get((bed as StandardBed).herbVarietyId)?.color || DEFAULT_HERB_COLOR }}></span>)
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Fügen Sie neue Ernteeinträge hinzu oder verwalten Sie bestehende. (Diese Ansicht wird überarbeitet)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-2 space-y-6 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 border rounded-lg shadow-sm bg-card space-y-4">
              <h4 className="text-lg font-semibold text-card-foreground flex items-center">
                <PlusCircle className="mr-2 h-5 w-5 text-primary" />
                Neuen Ernteeintrag hinzufügen (Funktion in Überarbeitung)
              </h4>
              
              {bed.type === 'Kombinationsbeet' && (
                <FormField
                  control={form.control}
                  name="segmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Segment</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedSegmentId(value);
                          const selectedSegment = segments.find(s => s.id === value);
                          form.setValue('herbVarietyId' as any, selectedSegment?.herbVarietyId || '');
                        }}
                        value={field.value}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Segment wählen..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {segments.length === 0 && <SelectItem value="no-segments" disabled>Keine Segmente für dieses Beet vorhanden.</SelectItem>}
                          {segments.map(segment => (
                            <SelectItem key={segment.id} value={segment.id}>
                              Segment (L: {segment.segmentLength}m) -{' '}
                              {herbMap.get(segment.herbVarietyId)?.name || 'Unbekanntes Kraut'}
                              <span className="inline-block w-3 h-3 rounded-full ml-1 align-middle border border-black/20"
                                    style={{ backgroundColor: herbMap.get(segment.herbVarietyId)?.color || DEFAULT_HERB_COLOR }}>
                              </span>
                              {segment.subVarietyName && ` (${segment.subVarietyName})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="harvestDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground"/>Erntedatum</FormLabel>
                    <FormControl><Input type="date" {...field} disabled={isPending} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="yieldKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><WeightIcon className="mr-2 h-4 w-4 text-muted-foreground"/>Erntemenge (kg)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} placeholder="z.B. 5.5" disabled={isPending}/></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><InfoIcon className="mr-2 h-4 w-4 text-muted-foreground"/>Bemerkungen (optional)</FormLabel>
                    <FormControl><Textarea {...field} placeholder="Zusätzliche Hinweise zur Ernte..." disabled={isPending}/></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending || (bed.type === 'Kombinationsbeet' && segments.length === 0)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {isPending ? 'Wird hinzugefügt...' : 'Ernte hinzufügen (Deaktiviert)'}
              </Button>
              {bed.type === 'Kombinationsbeet' && segments.length === 0 && (
                <p className="text-xs text-destructive text-center mt-2">Für Kombinationsbeete ohne Segmente können keine Ernten erfasst werden.</p>
              )}
            </form>
          </Form>

          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-2 text-foreground">Bestehende Ernten ({existingHarvests.length})</h4>
            {existingHarvests.length === 0 ? (
              <p className="text-muted-foreground italic text-center py-4">Noch keine Ernten für dieses Beet erfasst.</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      {bed.type === 'Kombinationsbeet' && <TableHead>Segment/Kraut</TableHead>}
                      {bed.type !== 'Kombinationsbeet' && <TableHead>Kraut</TableHead>}
                      <TableHead className="text-right">Menge (kg)</TableHead>
                      <TableHead>Bemerkungen</TableHead>
                      <TableHead className="text-right">Aktion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {existingHarvests.sort((a,b) => new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime()).map(harvest => (
                      <TableRow key={harvest.id}>
                        <TableCell>{new Date(harvest.harvestDate).toLocaleDateString('de-DE')}</TableCell>
                        <TableCell className="flex items-center">
                            <span
                                className="w-3 h-3 rounded-full mr-2 border border-black/20"
                                style={{ backgroundColor: getHerbDetailsForHarvest(harvest).color }}
                                title={`Farbindikator: ${getHerbDetailsForHarvest(harvest).color}`}
                            ></span>
                            {getHerbDetailsForHarvest(harvest).name}
                        </TableCell>

                        <TableCell className="text-right">{harvest.yieldKg.toFixed(2)}</TableCell>
                        <TableCell className="text-xs italic text-muted-foreground">{harvest.remarks || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(harvest.id)}
                            disabled={isDeleting}
                            aria-label="Ernte löschen"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>
              Schließen
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
