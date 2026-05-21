'use client';

import { useEffect, useState, useTransition, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { Bed, BedType, HerbVariety, StandardBed, VersuchsbeetSegment, BedFormData, SegmentFormData } from '@/lib/definitions';
import { createBedAction, updateBedAction, deleteBedAction } from '@/lib/actions-stubs'; // TEMPORÄR für Static Export
import { createSegmentAction, updateSegmentAction, deleteSegmentAction } from '@/lib/actions-stubs'; // TEMPORÄR für Static Export
import { PlusCircle, Save, Trash2, Palette, CornerDownLeft, Check, ListPlus, Edit3, CircleX } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { HERB_COLOR_PALETTE, FIXED_HERB_VARIETIES } from '@/lib/definitions';
import { electronAPI } from '@/lib/electron-bridge';
import { addBed, updateBed } from '@/lib/data';
import { useBeds, useHerbVarieties, useSegments } from '@/lib/data-hooks-safe';

// Schemas
const segmentFormClientSchema = z.object({
  id: z.string().optional(),
  tempId: z.string().optional(),
  segmentLength: z.coerce.number({invalid_type_error: "Länge muss eine Zahl sein."}).min(0.1, "Länge muss mind. 0.1m sein."),
  herbVarietyId: z.string().min(1, "Kräutersorte ist erforderlich."),
  subVarietyName: z.string().max(100, "Untersorte max. 100 Zeichen.").optional().default(''),
  plantsPerMeter: z.coerce.number({invalid_type_error: "Pflanzen/m muss eine Zahl sein."}).min(0, "Pflanzen/m mind. 0."),
  productivePlantsPercentage: z.coerce.number({invalid_type_error: "% muss eine Zahl sein."}).min(0).max(100),
  plantingDate: z.string().refine((date) => date && !isNaN(Date.parse(date)), { message: "Gültiges Pflanzdatum erforderlich." }),
  remarks: z.string().max(300, "Bemerkungen max. 300 Zeichen.").optional().default(''),
});
export type SegmentFormClientValues = z.infer<typeof segmentFormClientSchema>;

const bedFormSchemaBase = z.object({
  bedNumber: z.coerce.number().min(1, "Beetnummer ist erforderlich.").optional(), // Made optional as it's handled separately for edit mode
  type: z.enum(['Standard', 'Blühstreifen', 'Brachfläche', 'Versuchsbeet'], { required_error: "Beettyp ist erforderlich." }),
  width: z.coerce.number({invalid_type_error: "Breite muss eine Zahl sein.", required_error: "Breite ist erforderlich."}).min(0.1, "Breite muss mindestens 0.1m sein.").max(87, "Breite darf maximal 87m sein."),
  plantingDate: z.string().refine((date) => date && !isNaN(Date.parse(date)), { message: "Gültiges Bepflanzungsdatum erforderlich." }),
  remarks: z.string().max(500, "Bemerkungen dürfen maximal 500 Zeichen lang sein."),
  length: z.coerce.number({invalid_type_error: "Länge muss eine Zahl sein."}).min(0.1, "Länge muss mindestens 0.1m sein.").optional(),
  color: z.string().optional(), // color is managed globally for standard herbs, but directly for others
});

const standardBedSchema = bedFormSchemaBase.extend({
  type: z.literal('Standard'),
  bedNumber: z.coerce.number().min(1, "Beetnummer ist erforderlich."), // Mandatory for Standard
  herbVarietyId: z.string().min(1, "Kräutersorte ist erforderlich."),
  subVarietyName: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === "" ? undefined : val),
    z.string().max(100, "Untersorte darf maximal 100 Zeichen haben.").optional()
  ),
  plantsPerMeter: z.coerce.number({invalid_type_error: "Pflanzen/m muss eine Zahl sein.", required_error: "Pflanzen/m ist erforderlich."}).min(0, "Pflanzen/m müssen mindestens 0 sein."),
  productivePlantsPercentage: z.coerce.number({invalid_type_error: "Prozentsatz muss eine Zahl sein.", required_error: "Ertragsf. Pflanzen % ist erforderlich."}).min(0, "Prozentsatz muss mindestens 0 sein.").max(100, "Prozentsatz darf maximal 100 sein."),
  // 'color' for StandardBed is derived from its HerbVariety, not set directly.
  // It's included in base for other types, but should not be an editable field for Standard.
});

const specialBedSchema = bedFormSchemaBase.extend({
  type: z.enum(['Blühstreifen', 'Brachfläche']),
  bedNumber: z.coerce.number().min(1, "Beetnummer ist erforderlich."), // Mandatory for Special
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Ungültiger Farbcode (Hex)."),
  expectedHarvestDate: z.string().refine((date) => date ? !isNaN(Date.parse(date)) : true, { message: "Gültiges Erntedatum erforderlich." }).optional(),
});

const kombinationsbeetSchema = bedFormSchemaBase.extend({
  type: z.literal('Kombinationsbeet'),
  bedNumber: z.coerce.number().min(1, "Beetnummer ist erforderlich."), // Mandatory for Versuchsbeet
  length: z.coerce.number({invalid_type_error: "Länge muss eine Zahl sein.", required_error: "Länge ist für Kombinationsbeet erforderlich."}).min(0.1, "Länge muss mindestens 0.1m sein."),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Ungültiger Farbcode (Hex).").optional(),
});

const bedFormSchema = z.discriminatedUnion("type", [
  standardBedSchema,
  specialBedSchema,
  kombinationsbeetSchema,
]);
type BedFormValues = z.infer<typeof bedFormSchema>;

const STANDARD_VERSUCHSBEET_COLORS = HERB_COLOR_PALETTE;
const BLUEHSTREIFEN_COLORS = [
  { name: 'Rosa', value: '#FFC0CB' }, { name: 'Hellgelb', value: '#FFFFE0' },
  { name: 'Lachs', value: '#FFA07A' }, { name: 'Orange', value: '#FFA500' },
  { name: 'Lavendel', value: '#E6E6FA' }, { name: 'Violett', value: '#8A2BE2'},
  { name: 'Pink', value: '#FF69B4' }, { name: 'Koralle', value: '#FF7F50' },
  { name: 'Himmelblau', value: '#87CEEB' }, { name: 'Flieder', value: '#C8A2C8' },
];
const BRACHFLAECHE_COLOR_VALUE = '#6B8E23';
const DEFAULT_FALLBACK_COLOR = '#D1D5DB';

interface BedFormProps {
  bed?: Bed;
  segments?: VersuchsbeetSegment[];
  availableBedNumbers: number[];
  herbVarieties: HerbVariety[];
  preferredBedNumber?: number; // Parameter für die bevorzugte Beetnummer
};

export default function BedForm({ 
  bed: initialBed, 
  segments: initialSegments, 
  availableBedNumbers: initialAvailableBedNumbers, 
  herbVarieties: initialHerbVarietiesProp,
  preferredBedNumber 
}: BedFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  // Verwende die neuen Hooks für CRUD-Operationen
  const { createBed, updateBed, deleteBed, refetch } = useBeds();
  const { createSegment, updateSegment, deleteSegment } = useSegments();
  const { herbVarieties, createHerbVariety, refetch: refreshHerbVarieties } = useHerbVarieties();
  const { segments: allSegments } = useSegments(initialBed?.id); // Hole Segmente für dieses Beet

  const isEditMode = !!initialBed;
  // Verwende herbVarieties aus Hook statt aus Props
  const [showNewHerbForm, setShowNewHerbForm] = useState(false);
  const [newHerbName, setNewHerbName] = useState('');
  const [newHerbColor, setNewHerbColor] = useState<string | undefined>(undefined);
  const [showSegmentForm, setShowSegmentForm] = useState(false);
  const [editingSegment, setEditingSegment] = useState<SegmentFormClientValues | null>(null);
  const [segmentFormError, setSegmentFormError] = useState<string | null>(null);
  const [showNewHerbFormInSegment, setShowNewHerbFormInSegment] = useState(false);
  const [newHerbNameInSegment, setNewHerbNameInSegment] = useState('');
  const [newHerbColorInSegment, setNewHerbColorInSegment] = useState<string | undefined>(undefined);

  const form = useForm<BedFormValues>({
    resolver: zodResolver(bedFormSchema) as any, // Type assertion to avoid discriminated union issues
    defaultValues: useMemo(() => {
        if (isEditMode && initialBed) {
          let bedColorToSet = initialBed.color;
          if (initialBed.type === 'Standard') {
            const herb = herbVarieties.find(h => h.id === (initialBed as StandardBed).herbVarietyId);
            bedColorToSet = herb?.color || DEFAULT_FALLBACK_COLOR;
          } else if (initialBed.type === 'Brachfläche') {
            bedColorToSet = BRACHFLAECHE_COLOR_VALUE;
          } else if (initialBed.type === 'Blühstreifen' && !initialBed.color) {
            bedColorToSet = BLUEHSTREIFEN_COLORS[0]?.value || DEFAULT_FALLBACK_COLOR;          } else if (initialBed.type === 'Kombinationsbeet' && !initialBed.color) {
             bedColorToSet = STANDARD_VERSUCHSBEET_COLORS[0] || DEFAULT_FALLBACK_COLOR;
          }

          const bedFormData: any = {
            ...initialBed,
            bedNumber: initialBed.bedNumber, // Ensure bedNumber is set for edit mode
            plantingDate: initialBed.plantingDate ? new Date(initialBed.plantingDate).toISOString().split('T')[0] : '',
            length: initialBed.length,
            color: bedColorToSet,
            herbVarietyId: initialBed.type === 'Standard' ? (initialBed as StandardBed).herbVarietyId : undefined,
            subVarietyName: initialBed.type === 'Standard' ? (initialBed as StandardBed).subVarietyName : undefined,
            plantsPerMeter: initialBed.type === 'Standard' ? (initialBed as StandardBed).plantsPerMeter || 0 : 0,
            productivePlantsPercentage: initialBed.type === 'Standard' ? (initialBed as StandardBed).productivePlantsPercentage || 100 : 100,
            expectedHarvestDate: (initialBed.type === 'Blühstreifen' || initialBed.type === 'Brachfläche') && (initialBed as any).expectedHarvestDate
                ? new Date((initialBed as any).expectedHarvestDate).toISOString().split('T')[0]
                : undefined,          };
          return bedFormData;
        }
        const defaultFormData: any = {
          // WICHTIG: Wenn eine bevorzugte Beetnummer angegeben wurde, wird diese ZWINGEND verwendet
          bedNumber: preferredBedNumber !== undefined ? preferredBedNumber : (initialAvailableBedNumbers[0] || 1),
          type: 'Standard' as const,
          width: 1.0,
          plantingDate: new Date().toISOString().split('T')[0],
          remarks: '',
          color: STANDARD_VERSUCHSBEET_COLORS[0] || DEFAULT_FALLBACK_COLOR,
          herbVarietyId: herbVarieties.length > 0 ? (herbVarieties.find(h => h.isFixed)?.id || herbVarieties[0].id) : undefined,
          plantsPerMeter: 5.0,
          productivePlantsPercentage: 100,
          length: 43.0,
        };
        console.log('BedForm defaultValues Debug:', {
          preferredBedNumber,
          initialAvailableBedNumbers,
          selectedBedNumber: defaultFormData.bedNumber,
          zwingendGewählteNummer: preferredBedNumber !== undefined ? 'JA' : 'NEIN'
        });
        return defaultFormData;
    }, [isEditMode, initialBed, initialAvailableBedNumbers, herbVarieties, preferredBedNumber]),
  });

  const selectedType = form.watch('type');
  const selectedHerbVarietyId = form.watch('herbVarietyId' as any) as string | undefined;

  // Type assertion for form control to avoid discriminated union issues
  const formControl = form.control as any;

  useEffect(() => {
    // Removed - use herbVarieties from hook instead of local state
  }, []);

  useEffect(() => {
    const currentType = form.getValues('type');
    let calculatedColor: string = DEFAULT_FALLBACK_COLOR; // Start with a default string

    if (currentType === 'Standard') {
      const currentHerbId = form.getValues('herbVarietyId' as any) as string | undefined;
      const herb = herbVarieties.find(h => h.id === currentHerbId);
      calculatedColor = herb?.color || DEFAULT_FALLBACK_COLOR;
    } else if (currentType === 'Brachfläche') {
      calculatedColor = BRACHFLAECHE_COLOR_VALUE;
    } else if (currentType === 'Blühstreifen') {
      const currentColorFromForm = form.getValues('color');
      calculatedColor = BLUEHSTREIFEN_COLORS.some(c => c.value === currentColorFromForm)
        ? currentColorFromForm || DEFAULT_FALLBACK_COLOR // Ensure string fallback
        : (BLUEHSTREIFEN_COLORS[0]?.value || DEFAULT_FALLBACK_COLOR); // Ensure string fallback
    } else if (currentType === 'Kombinationsbeet') {
      const currentColorFromForm = form.getValues('color');
       calculatedColor = STANDARD_VERSUCHSBEET_COLORS.includes(currentColorFromForm || '') // Check against string
        ? currentColorFromForm || DEFAULT_FALLBACK_COLOR // Ensure string fallback
        : (STANDARD_VERSUCHSBEET_COLORS[0] || DEFAULT_FALLBACK_COLOR); // Ensure string fallback
    }

    // Ensure the value passed to setValue is definitely a string
    const colorToSet = calculatedColor ?? DEFAULT_FALLBACK_COLOR;


    if (form.getValues('color') !== colorToSet) {
        form.setValue('color', colorToSet, { shouldValidate: true, shouldDirty: isEditMode });
    }

  }, [selectedType, selectedHerbVarietyId, form, herbVarieties, isEditMode]);

  // useEffect für currentSegments entfernt - verwende direkt allSegments aus Hook

  const availableColorsForNewHerb = useMemo(() => {
    const usedColors = new Set(
      herbVarieties
        .map(h => h.color)
        .filter((color): color is string => !!color)
    );
    return HERB_COLOR_PALETTE.filter(colorOption => !usedColors.has(colorOption));
  }, [herbVarieties]);

  const cardHeaderStyle = useMemo(() => {
    const currentFormColor = form.getValues('color');
    if (currentFormColor && currentFormColor !== DEFAULT_FALLBACK_COLOR) {
      return { backgroundColor: currentFormColor, color: 'hsl(var(--primary-foreground))' };
    }
    return {};
  }, [form.watch('color')]);

  const onSubmit = async (values: BedFormValues) => {
    setFormError(null);
    const finalValues = {...values} as BedFormData; // Cast to BedFormData for type safety

    console.log('BedForm onSubmit Debug:', {
      values,
      finalValues,
      bedNumber: finalValues.bedNumber,
      isEditMode
    });

    if (finalValues.type !== 'Kombinationsbeet') {
      finalValues.length = 43;
    } else if (finalValues.type === 'Kombinationsbeet' && (typeof finalValues.length !== 'number' || finalValues.length <= 0 )) {
        form.setError('length' as any, {type: 'manual', message: 'Länge ist für Kombinationsbeet erforderlich und muss positiv sein.'});
        return;
    }

    if (finalValues.type === 'Standard') {
        const herb = herbVarieties.find(h => h.id === (finalValues as any).herbVarietyId); // Cast to any to access herbVarietyId
        finalValues.color = herb?.color || DEFAULT_FALLBACK_COLOR;
    } else if (finalValues.type === 'Brachfläche') {
        finalValues.color = BRACHFLAECHE_COLOR_VALUE;
    }

    startTransition(async () => {
      let result: { success: boolean; data?: Bed; error?: string } | undefined;
      
      try {
        if (isEditMode && initialBed) {
          // Verwende den neuen Hook für Update
          const updated = await updateBed(initialBed.id, finalValues);
          result = updated ? { success: true, data: updated } : { success: false, error: 'Update fehlgeschlagen.' };
        } else {
          // Verwende den neuen Hook für Create
          const created = await createBed(finalValues);
          result = created ? { success: true, data: created } : { success: false, error: 'Anlage fehlgeschlagen.' };
        }
        
        // Daten neu laden nach Änderung
        if (result?.success) {
          await refetch();
        }
      } catch (err: any) {
        console.error('Fehler beim Speichern des Beets:', err);
        result = { success: false, error: err?.message || 'Fehler bei der Beet-Speicherung.' };
      }

      if (result?.success) {
        toast({
          title: 'Erfolg!',
          description: `Beet wurde erfolgreich ${isEditMode ? 'aktualisiert' : 'angelegt'}.`,
        });
        await refreshHerbVarieties();
        // Zurück zur Übersicht - die neuen Hooks laden automatisch die aktuellen Daten
        router.push('/');
      } else if (result?.error) {
        const errorMessage = result.error || 'Ein Fehler ist aufgetreten.';
        setFormError(errorMessage);
        toast({ title: 'Fehler', description: errorMessage, variant: 'destructive' });
      }
    });
  };

  const handleDelete = async () => {
    if (!initialBed) return;
    startDeleteTransition(async () => {
      try {
        const success = await deleteBed(initialBed.id);
        if (success) {
          // Daten neu laden nach Löschung
          await refetch();
          toast({ title: 'Erfolg!', description: 'Beet wurde gelöscht.' });
          router.push('/');
        } else {
          toast({ title: 'Fehler', description: 'Beet konnte nicht gelöscht werden.', variant: 'destructive' });
        }
      } catch (err: any) {
        console.error('Fehler beim Löschen des Beets:', err);
        toast({ title: 'Fehler', description: err?.message || 'Beet konnte nicht gelöscht werden.', variant: 'destructive' });
      }
    });
  };

  const handleAddNewHerb = async () => {
    if (newHerbName.trim() === '') {
      toast({ title: 'Fehler', description: 'Kräutername darf nicht leer sein.', variant: 'destructive' });
      return;
    }
    startTransition(async () => {
      // Client-seitige Herb-Erstellung verwenden
      console.log('[BedForm] Verwende Client-seitige Herb-Erstellung');
      const newHerb = await createHerbVariety(newHerbName.trim(), newHerbColor);
      
      if (newHerb) {
        // Erfolgreich erstellt
        form.setValue('herbVarietyId' as any, newHerb.id);
        if (newHerb.color) {
          form.setValue('color', newHerb.color, { shouldValidate: true, shouldDirty: true });
        }
        setShowNewHerbForm(false);
        setNewHerbName('');
        setNewHerbColor(undefined);
        toast({ title: 'Erfolg', description: `Kräutersorte "${newHerb.name}" hinzugefügt.` });
      } else {
        setFormError('Konnte Kräutersorte nicht hinzufügen.');
        toast({ title: 'Fehler', description: 'Konnte Kräutersorte nicht hinzufügen.', variant: 'destructive' });
      }
    });
  };

  const handleAddNewSegment = () => {
    setEditingSegment({
      tempId: `new-segment-${Date.now()}`,
      segmentLength: 1,
      herbVarietyId: herbVarieties.length > 0 ? herbVarieties[0].id : '', // Default to empty string if no herbs
      plantsPerMeter: 5,
      productivePlantsPercentage: 100,
      plantingDate: new Date().toISOString().split('T')[0],
      remarks: '',
      subVarietyName: '',
    });
    setShowSegmentForm(true);
    setSegmentFormError(null);
  };

  const handleEditSegment = (segment: VersuchsbeetSegment) => {
    setEditingSegment({
        ...segment, // Copy all existing properties
        tempId: segment.id,
        subVarietyName: segment.subVarietyName ?? '', // Ensure string
        remarks: segment.remarks ?? '', // Ensure string
    });
    setShowSegmentForm(true);
    setSegmentFormError(null);
  };

  const handleSaveSegment = async () => {
    if (!editingSegment || !initialBed) return;
    setSegmentFormError(null);

    const validationResult = segmentFormClientSchema.safeParse(editingSegment);
    if (!validationResult.success) {
      const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
      setSegmentFormError(firstError || "Validierungsfehler im Segmentformular.");
      return;
    }

    const segmentDataToSave: SegmentFormData = { ...validationResult.data, subVarietyName: validationResult.data.subVarietyName ?? '', remarks: validationResult.data.remarks ?? '' };
    delete (segmentDataToSave as any).id;
    delete (segmentDataToSave as any).tempId;

    const otherSegmentsLength = allSegments
        .filter(s => s.id !== editingSegment.id && s.id !== editingSegment.tempId)
        .reduce((sum, s) => sum + s.segmentLength, 0);

    const bedLength = form.getValues('length');
    if (typeof bedLength !== 'number' || bedLength <= 0) {
        setSegmentFormError('Ungültige oder fehlende Beetlänge für die Segmentvalidierung.');
        return;
    }

    if ((otherSegmentsLength + segmentDataToSave.segmentLength > bedLength)) {
        setSegmentFormError(`Gesamtlänge der Segmente (${(otherSegmentsLength + segmentDataToSave.segmentLength).toFixed(1)}m) würde Beetlänge (${bedLength}m) überschreiten.`);
        return;
    }

    startTransition(async () => {
      let result;
      const isExistingSegment = editingSegment.id && !editingSegment.id.startsWith('new-segment-');

      if (isExistingSegment) {
        // Server Action für Update beibehalten (funktioniert)
        result = await updateSegmentAction(editingSegment.id!, initialBed.id, segmentDataToSave);
      } else {
        // Client-seitige Erstellung verwenden
        console.log('[BedForm] Verwende Client-seitige Segment-Erstellung');
        const newSegment = await createSegment(initialBed.id, segmentDataToSave);
        if (newSegment) {
          result = { success: true, data: newSegment };
        } else {
          result = { success: false, error: 'Segment konnte nicht erstellt werden' };
        }
      }

      if (result && 'success' in result && result.success && result.data) {
        await refreshHerbVarieties(); // Refresh herbs after segment save, new herb might have been added
        router.refresh();
        setShowSegmentForm(false);
        setEditingSegment(null);
        toast({ title: 'Erfolg', description: `Segment ${isExistingSegment ? 'aktualisiert' : 'hinzugefügt'}.` });
      } else {
        setSegmentFormError(result?.error || `Segment konnte nicht ${isExistingSegment ? 'aktualisiert' : 'hinzugefügt'} werden.`);
        toast({ title: 'Fehler Segment', description: result?.error || 'Aktion fehlgeschlagen.', variant: 'destructive' });
      }
    });
  };

  const handleDeleteSegment = async (segmentIdToDelete: string) => {
    if (!initialBed) return;
    startTransition(async () => {
      const result = await deleteSegmentAction(segmentIdToDelete, initialBed.id);
      if (result && 'success' in result && result.success) {
        router.refresh();
        toast({ title: 'Erfolg', description: 'Segment gelöscht.' });
      } else {
        toast({ title: 'Fehler Segment', description: result?.error || 'Konnte Segment nicht löschen.', variant: 'destructive' });
      }
    });
  };

  const handleAddNewHerbInSegment = async () => {
    if (!editingSegment) return;
    if (newHerbNameInSegment.trim() === '') {
      toast({ title: 'Fehler', description: 'Kräutername darf nicht leer sein.', variant: 'destructive' });
      return;
    }
    startTransition(async () => {
      // Client-seitige Herb-Erstellung verwenden
      console.log('[BedForm] Verwende Client-seitige Herb-Erstellung für Segment');
      const newHerb = await createHerbVariety(newHerbNameInSegment.trim(), newHerbColorInSegment);
      
      if (newHerb) {
        // Erfolgreich erstellt
        setEditingSegment(prev => prev ? {...prev, herbVarietyId: newHerb.id } : null);
        setShowNewHerbFormInSegment(false);
        setNewHerbNameInSegment('');
        setNewHerbColorInSegment(undefined);
        toast({ title: 'Erfolg', description: `Kräutersorte "${newHerb.name}" hinzugefügt.` });
      } else {
        setSegmentFormError('Konnte Kräutersorte für Segment nicht hinzufügen.');
        toast({ title: 'Fehler', description: 'Konnte Kräutersorte nicht hinzufügen.', variant: 'destructive' });
      }
    });
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit as any)}>

          <CardHeader style={cardHeaderStyle} className={cn(cardHeaderStyle.backgroundColor ? 'text-primary-foreground' : '')}>
            <CardTitle>{isEditMode ? `Beet Nr. ${initialBed?.bedNumber} bearbeiten` : 'Neues Beet erstellen'}</CardTitle>
            <CardDescription className={cn(cardHeaderStyle.backgroundColor ? 'text-primary-foreground/80' : '')}>
              Füllen Sie die Details für das Beet aus. Die Länge für Standard, Blühstreifen und Brachfläche ist fix (43m).
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-0">
            <>
              {formError && <p className="text-sm font-medium text-destructive mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md">{formError}</p>}

              <FormField
                  control={formControl}
                  name="bedNumber"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Beetnummer</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value?.toString() ?? ''} 
                        disabled={isPending || isEditMode}
                      >
                          <FormControl>
                          <SelectTrigger><SelectValue placeholder="Nummer wählen" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          {(isEditMode && initialBed && !initialAvailableBedNumbers.includes(initialBed.bedNumber) ? [...initialAvailableBedNumbers, initialBed.bedNumber].sort((a,b)=>a-b) : initialAvailableBedNumbers).map(num => (
                              <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                          ))}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
                  />

              <FormField
                  control={formControl}
                  name="type"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Beettyp</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value !== 'Kombinationsbeet') {
                            setShowSegmentForm(false);
                            setEditingSegment(null);
                            form.setValue('length', 43);
                          } else {
                             if (!isEditMode || (initialBed && initialBed.type !== 'Kombinationsbeet')) {
                                 form.setValue('length', initialBed?.length || 43);
                             }
                          }
                        }}
                        value={field.value}
                        disabled={isPending}
                      >
                        <FormControl><SelectTrigger><SelectValue placeholder="Typ wählen" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Standard">Standard Kräuterbeet</SelectItem>
                          <SelectItem value="Blühstreifen">Blühstreifen
                          </SelectItem>
                          <SelectItem value="Brachfläche">Brachfläche</SelectItem>
                          <SelectItem value="Kombinationsbeet">Kombinationsbeet</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                  control={formControl}
                  name="width"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Breite (in Metern)</FormLabel>
                      <FormControl><Input type="number" step="0.1" {...field} onChange={e => {
                        const value = parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? '' : value);
                      }} disabled={isPending} /></FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <FormField
                      control={formControl}
                      name="length"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Länge (in Metern)</FormLabel>
                          <FormControl>
                              <Input
                                  type="number"
                                  step="0.1" {...field}
                                  onChange={e => {
                                    const value = parseFloat(e.target.value);
                                    field.onChange(isNaN(value) ? '' : value);
                                  }}
                                  disabled={isPending || selectedType !== 'Kombinationsbeet'}
                                  readOnly={selectedType !== 'Kombinationsbeet'}
                                  className={selectedType !== 'Kombinationsbeet' ? 'bg-muted/50 cursor-not-allowed' : ''}
                              />
                          </FormControl>
                          {selectedType !== 'Kombinationsbeet' && <FormDescription>Länge ist für diesen Beet-Typ fix.</FormDescription>}
                          <FormMessage />
                          </FormItem>
                      )}
                  />
              </div>

              <FormField
                control={formControl}
                name="plantingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bepflanzungsdatum (Besatzdatum)</FormLabel>
                    <FormControl><Input type="date" {...field} value={field.value || ''} disabled={isPending} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedType === 'Standard' && (
                   <FormField
                      control={formControl}
                      name="color"
                      render={({ field }) => (
                          <FormItem className="hidden"> {/* Verstecktes Feld, um den Farbwert zu halten, der vom Kraut abgeleitet wird */}
                              <FormControl><Input type="hidden" {...field} /></FormControl>
                          </FormItem>
                      )}
                  />
              )}

              {(selectedType === 'Blühstreifen' || selectedType === 'Brachfläche' || selectedType === 'Kombinationsbeet') && (
                    <FormField
                      control={formControl}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 flex items-center">
                            <Palette className="inline mr-2 h-4 w-4" />
                            Beetfarbe {selectedType === 'Kombinationsbeet' ? '(für Hauptbeet)' : ''}
                          </FormLabel>

                          {selectedType === 'Brachfläche' && ( // Brachfläche logic - corrected to check against 'Brachfläche'
                        <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted/30 cursor-not-allowed">
                              <div
                                className="h-8 w-8 rounded-md border-2 border-muted-foreground"
                                style={{ backgroundColor: BRACHFLAECHE_COLOR_VALUE }}
                                />
                              <span className="text-sm text-muted-foreground">Fixiert für Brachfläche</span>
                            </div>
                          )}

                      {selectedType === 'Blühstreifen' && ( // Blühstreifen logic
                            <div className="flex flex-wrap gap-2 p-3 border rounded-md">
                              {BLUEHSTREIFEN_COLORS.map((colorOption) => (
                                <Button
                                  key={colorOption.value} type="button" variant="outline"
                                  className={cn("h-10 w-10 p-0 border-2 rounded-md focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                    field.value === colorOption.value ? "border-primary ring-2 ring-primary ring-offset-background" : "border-muted hover:border-muted-foreground"
                                  )}
                                  style={{ backgroundColor: colorOption.value }}
                                  onClick={() => field.onChange(colorOption.value)}
                                  title={colorOption.name} disabled={isPending} aria-pressed={field.value === colorOption.value}
                                >
                                  {field.value === colorOption.value && <Check className="h-5 w-5 text-white mix-blend-difference" />}
                                  <span className="sr-only">{colorOption.name}</span>
                                </Button>
                              ))}
                            </div>
                          )}

                          {selectedType === 'Kombinationsbeet' && ( // Kombinationsbeet logic
                            <div className="flex flex-wrap gap-2 p-3 border rounded-md">
                              {STANDARD_VERSUCHSBEET_COLORS.map((colorValue) => (
                                <Button
                                  key={colorValue} type="button" variant="outline"
                                  className={cn("h-10 w-10 p-0 border-2 rounded-md focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                    field.value === colorValue ? "border-primary ring-2 ring-primary ring-offset-background" : "border-muted hover:border-muted-foreground"
                                  )}
                                  style={{ backgroundColor: colorValue }}
                                  onClick={() => field.onChange(colorValue)}
                                  title={colorValue} disabled={isPending} aria-pressed={field.value === colorValue}
                                >
                                  {field.value === colorValue && <Check className="h-5 w-5 text-white mix-blend-difference" />}
                                  <span className="sr-only">{colorValue}</span>
                                </Button>
                              ))}
                            </div>
                          )}
                           <FormDescription className="mt-1">
                            {form.getValues('type') === 'Brachfläche' ? 'Brachflächen haben eine feste Farbe.'
                              : form.getValues('type') === 'Standard' ? 'Farbe wird von der ausgewählten Kräutersorte abgeleitet (siehe Kartenkopf).'
                              : 'Wählen Sie eine Farbe für die Visualisierung des Beetes.'}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

              {selectedType === 'Standard' && !showNewHerbForm && (
                <FormField
                  control={formControl}
                  name="herbVarietyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-2 flex items-center justify-between">
                        Kräutersorte
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowNewHerbForm(true)}
                          disabled={isPending || availableColorsForNewHerb.length === 0}
                        >
                          <PlusCircle className="mr-1 h-4 w-4" /> Neue Sorte
                        </Button>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Sorte wählen" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {herbVarieties.map(herb => (
                                <SelectItem key={herb.id} value={herb.id}>
                                    <div className="flex items-center">
                                        <div className="h-4 w-4 rounded-full mr-2 border" style={{ backgroundColor: herb.color || DEFAULT_FALLBACK_COLOR }}></div>
                                        {herb.name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {availableColorsForNewHerb.length === 0 && (
                        <FormDescription className="text-orange-500">
                            Alle verfügbaren Farben für neue Kräutersorten sind bereits vergeben.
                        </FormDescription>
                       )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

                {selectedType === 'Standard' && showNewHerbForm && (
                    <div className="mb-4 p-4 border rounded-md grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                         <Button
                            type="button" variant="ghost" size="icon"
                            className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowNewHerbForm(false)} disabled={isPending}
                        >
                            <CircleX className="h-4 w-4" />
                            <span className="sr-only">Abbrechen</span>
                        </Button>
                        <div className="col-span-full"><Label>Neue Kräutersorte hinzufügen</Label></div>
                         <Input
                            placeholder="Name der neuen Kräutersorte"
                            value={newHerbName} onChange={(e) => setNewHerbName(e.target.value)}
                            disabled={isPending} className="col-span-full md:col-span-1"
                         />
                         <div>
                            <Label className="mb-2 flex items-center"><Palette className="inline mr-2 h-4 w-4" /> Farbe wählen</Label>
                            <div className="flex flex-wrap gap-2">
                                {availableColorsForNewHerb.map(colorValue => (
                                     <Button
                                        key={colorValue} type="button" variant="outline" size="icon"
                                        className={cn("h-8 w-8 p-0 border-2 rounded-md focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                             newHerbColor === colorValue ? "border-primary ring-2 ring-primary ring-offset-background" : "border-muted hover:border-muted-foreground"
                                        )}
                                        style={{ backgroundColor: colorValue }}
                                        onClick={() => setNewHerbColor(colorValue)}
                                        title={colorValue} disabled={isPending} aria-pressed={newHerbColor === colorValue}
                                    >
                                        {newHerbColor === colorValue && <Check className="h-4 w-4 text-white mix-blend-difference" />}
                                        <span className="sr-only">{colorValue}</span>
                                    </Button>
                                ))}
                                {availableColorsForNewHerb.length === 0 && (
                                    <span className="text-sm text-muted-foreground italic">Keine Farben verfügbar.</span>
                                )}
                            </div>
                         </div>
                         <Button type="button" onClick={handleAddNewHerb} disabled={isPending || newHerbName.trim() === '' || availableColorsForNewHerb.length === 0 || newHerbColor === undefined}>
                            <CornerDownLeft className="mr-2 h-4 w-4" /> Hinzufügen
                         </Button>
                    </div>
                )}

                {selectedType === 'Standard' && (
                    <>
                         <FormField
                            control={formControl}
                            name="subVarietyName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Untersorte (Optional)</FormLabel>
                                <FormControl><Input {...field} disabled={isPending} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={formControl}
                                name="plantsPerMeter"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Pflanzen pro Laufmeter</FormLabel>
                                    <FormControl><Input type="number" step="1" {...field} onChange={e => {
                                      const value = parseFloat(e.target.value);
                                      field.onChange(isNaN(value) ? '' : value);
                                    }} disabled={isPending} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={formControl}
                                name="productivePlantsPercentage"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Ertragsfähige Pflanzen (%)</FormLabel>
                                    <FormControl><Input type="number" step="1" {...field} onChange={e => {
                                      const value = parseFloat(e.target.value);
                                      field.onChange(isNaN(value) ? '' : value);
                                    }} disabled={isPending} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </>
                )}

                {(selectedType === 'Blühstreifen' || selectedType === 'Brachfläche') && (
                     <FormField
                        control={formControl}
                        name="expectedHarvestDate"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Voraussichtliches Erntedatum (Optional)</FormLabel>
                            <FormControl><Input type="date" {...field} value={field.value || ''} disabled={isPending} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}

                {selectedType === 'Kombinationsbeet' && isEditMode && (
                    <div className="mt-6 p-4 border rounded-md">
                        <h3 className="text-lg font-semibold mb-3 flex items-center justify-between">
                            Segmente ({allSegments.reduce((sum, s) => sum + s.segmentLength, 0).toFixed(1)} / {form.getValues('length')?.toFixed(1) || 'N/A'} m)
                             <Button type="button" variant="outline" size="sm" onClick={handleAddNewSegment} disabled={isPending}>
                                <ListPlus className="mr-1 h-4 w-4" /> Segment hinzufügen
                            </Button>
                        </h3>

                        {segmentFormError && <p className="text-sm font-medium text-destructive mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md">{segmentFormError}</p>}

                        {showSegmentForm && (
                            <div className="mb-6 p-4 border rounded-md grid grid-cols-1 md:grid-cols-2 gap-4 relative bg-muted/30">
                                 <Button
                                    type="button" variant="ghost" size="icon"
                                    className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground"
                                    onClick={() => { setShowSegmentForm(false); setEditingSegment(null); setSegmentFormError(null); }} disabled={isPending}
                                >
                                    <CircleX className="h-4 w-4" />
                                    <span className="sr-only">Abbrechen</span>
                                </Button>
                                <div className="col-span-full"><Label>{editingSegment?.id && !editingSegment.id.startsWith('new-segment-') ? 'Segment bearbeiten' : 'Neues Segment hinzufügen'}</Label></div>

                                <div className="col-span-full md:col-span-1">
                                     <Label htmlFor="segmentLength">Länge (in Metern)</Label>
                                     <Input
                                        id="segmentLength" type="number" step="0.1"
                                        value={editingSegment?.segmentLength ?? ''}
                                        onChange={e => {
                                          const value = parseFloat(e.target.value);
                                          setEditingSegment(prev => prev ? {...prev, segmentLength: isNaN(value) ? 0 : value} : null);
                                        }}
                                        disabled={isPending}
                                    />
                                </div>

                                <div className="col-span-full md:col-span-1">
                                    <Label className="mb-2 flex items-center justify-between">
                                        Kräutersorte
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setShowNewHerbFormInSegment(true)}
                                          disabled={isPending || availableColorsForNewHerb.length === 0}
                                        >
                                          <PlusCircle className="mr-1 h-4 w-4" /> Neue Sorte
                                        </Button>
                                    </Label>
                                    <Select
                                        value={editingSegment?.herbVarietyId ?? ''}
                                        onValueChange={value => setEditingSegment(prev => prev ? {...prev, herbVarietyId: value} : null)}
                                        disabled={isPending}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Sorte wählen" /></SelectTrigger>
                                        <SelectContent>
                                            {herbVarieties.map(herb => (
                                                <SelectItem key={herb.id} value={herb.id}>
                                                     <div className="flex items-center">
                                                        <div className="h-4 w-4 rounded-full mr-2 border" style={{ backgroundColor: herb.color || DEFAULT_FALLBACK_COLOR }}></div>
                                                        {herb.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                     {availableColorsForNewHerb.length === 0 && (
                                        <p className="text-sm text-orange-500 mt-1">
                                            Alle verfügbaren Farben für neue Kräutersorten sind bereits vergeben.
                                        </p>
                                     )}
                                </div>

                                 {showNewHerbFormInSegment && (
                                    <div className="col-span-full p-4 border rounded-md grid grid-cols-1 md:grid-cols-2 gap-4 relative bg-background/80">
                                         <Button
                                            type="button" variant="ghost" size="icon"
                                            className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground"
                                            onClick={() => setShowNewHerbFormInSegment(false)} disabled={isPending}
                                        >
                                            <CircleX className="h-4 w-4" />
                                            <span className="sr-only">Abbrechen</span>
                                        </Button>
                                        <div className="col-span-full"><Label>Neue Kräutersorte hinzufügen</Label></div>
                                        <Input
                                            placeholder="Name der neuen Kräutersorte"
                                            value={newHerbNameInSegment} onChange={(e) => setNewHerbNameInSegment(e.target.value)}
                                            disabled={isPending} className="col-span-full md:col-span-1"
                                        />
                                         <div>
                                            <Label className="mb-2 flex items-center"><Palette className="inline mr-2 h-4 w-4" /> Farbe wählen</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {availableColorsForNewHerb.map(colorValue => (
                                                     <Button
                                                        key={colorValue} type="button" variant="outline" size="icon"
                                                        className={cn("h-8 w-8 p-0 border-2 rounded-md focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                                             newHerbColorInSegment === colorValue ? "border-primary ring-2 ring-primary ring-offset-background" : "border-muted hover:border-muted-foreground"
                                                        )}
                                                        style={{ backgroundColor: colorValue }}
                                                        onClick={() => setNewHerbColorInSegment(colorValue)}
                                                        title={colorValue} disabled={isPending} aria-pressed={newHerbColorInSegment === colorValue}
                                                    >
                                                        {newHerbColorInSegment === colorValue && <Check className="h-4 w-4 text-white mix-blend-difference" />}
                                                        <span className="sr-only">{colorValue}</span>
                                                    </Button>
                                                ))}
                                                {availableColorsForNewHerb.length === 0 && (
                                                    <span className="text-sm text-muted-foreground italic">Keine Farben verfügbar.</span>
                                                )}
                                            </div>
                                         </div>
                                         <Button type="button" onClick={handleAddNewHerbInSegment} disabled={isPending || newHerbNameInSegment.trim() === '' || availableColorsForNewHerb.length === 0 || newHerbColorInSegment === undefined}>
                                            <CornerDownLeft className="mr-2 h-4 w-4" /> Hinzufügen
                                         </Button>
                                    </div>
                                )}


                                <div className="col-span-full md:col-span-1">
                                     <Label htmlFor="segmentSubVarietyName">Untersorte (Optional)</Label>
                                     <Input
                                        id="segmentSubVarietyName"
                                        value={editingSegment?.subVarietyName ?? ''}
                                        onChange={e => setEditingSegment(prev => prev ? {...prev, subVarietyName: e.target.value} : null)}
                                        disabled={isPending}
                                    />
                                </div>

                                <div className="col-span-full md:col-span-1">
                                     <Label htmlFor="segmentPlantsPerMeter">Pflanzen pro Laufmeter</Label>
                                     <Input
                                        id="segmentPlantsPerMeter" type="number" step="1"
                                        value={editingSegment?.plantsPerMeter ?? ''}
                                        onChange={e => {
                                          const value = parseFloat(e.target.value);
                                          setEditingSegment(prev => prev ? {...prev, plantsPerMeter: isNaN(value) ? 0 : value} : null);
                                        }}
                                        disabled={isPending}
                                    />
                                </div>

                                <div className="col-span-full md:col-span-1">
                                     <Label htmlFor="segmentProductivePlantsPercentage">Ertragsfähige Pflanzen (%)</Label>
                                     <Input
                                        id="segmentProductivePlantsPercentage" type="number" step="1"
                                        value={editingSegment?.productivePlantsPercentage ?? ''}
                                        onChange={e => {
                                          const value = parseInt(e.target.value);
                                          setEditingSegment(prev => prev ? {...prev, productivePlantsPercentage: isNaN(value) ? 0 : value} : null);
                                        }}
                                        disabled={isPending}
                                    />
                                </div>

                                <div className="col-span-full md:col-span-1">
                                    <Label htmlFor="segmentPlantingDate">Pflanzdatum (Besatzdatum)</Label>
                                    <Input
                                        id="segmentPlantingDate" type="date"
                                        value={editingSegment?.plantingDate || ''}
                                        onChange={e => setEditingSegment(prev => prev ? {...prev, plantingDate: e.target.value} : null)}
                                        disabled={isPending}
                                    />
                                </div>

                                 <div className="col-span-full">
                                    <Label htmlFor="segmentRemarks">Bemerkungen (Optional)</Label>
                                    <Textarea
                                        id="segmentRemarks"
                                        value={editingSegment?.remarks ?? ''}
                                        onChange={e => setEditingSegment(prev => prev ? {...prev, remarks: e.target.value} : null)}
                                        disabled={isPending}
                                        rows={3}
                                    />
                                </div>

                                <div className="col-span-full flex justify-end space-x-2">
                                    <Button type="button" variant="outline" onClick={() => { setShowSegmentForm(false); setEditingSegment(null); setSegmentFormError(null); }} disabled={isPending}>
                                        Abbrechen
                                    </Button>
                                    <Button type="button" onClick={handleSaveSegment} disabled={isPending}>
                                        <Save className="mr-2 h-4 w-4" /> Segment speichern
                                    </Button>
                                </div>
                            </div>
                        )}

                        {allSegments.length > 0 ? (
                            <ul className="space-y-3">
                                {allSegments.map(segment => (
                                    <li key={segment.id} className="flex items-center justify-between p-3 border rounded-md">
                                        <div className="flex items-center">
                                            <div
                                                className="h-6 w-6 rounded-full mr-3 border flex-shrink-0"
                                                style={{ backgroundColor: herbVarieties.find(h => h.id === segment.herbVarietyId)?.color || DEFAULT_FALLBACK_COLOR }}
                                            ></div>
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {herbVarieties.find(h => h.id === segment.herbVarietyId)?.name || 'Unbekannte Sorte'}
                                                    {segment.subVarietyName && ` (${segment.subVarietyName})`}
                                                </p>
                                                <p className="text-xs text-muted-foreground italic">Länge: {segment.segmentLength.toFixed(1)}m</p>
                                                <p className="text-xs text-muted-foreground">{segment.plantsPerMeter} P/m, {segment.productivePlantsPercentage}% ertragsf.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleEditSegment(segment)} disabled={isPending}>
                                                <Edit3 className="h-4 w-4" />
                                                <span className="sr-only">Bearbeiten</span>
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                     <Button type="button" variant="ghost" size="icon" disabled={isPending}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                        <span className="sr-only">Löschen</span>
                                                     </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Segment wirklich löschen?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Diese Aktion kann nicht rückgängig gemacht werden.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteSegment(segment.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Löschen</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-muted-foreground italic">Keine Segmente für dieses Kombinationsbeet vorhanden.</p>
                        )}
                    </div>
                )}

              <FormField
                control={formControl}
                name="remarks"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Bemerkungen (Optional)</FormLabel>
                    <FormControl><Textarea {...field} disabled={isPending} rows={4} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          </CardContent>

          <CardFooter className="flex justify-between space-x-2">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending || isDeleting}>
              Abbrechen
            </Button>
            {isEditMode && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" disabled={isDeleting || isPending}>
                           <Trash2 className="mr-2 h-4 w-4" /> Löschen
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Beet wirklich löschen?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Diese Aktion kann nicht rückgängig gemacht werden und löscht auch alle zugehörigen Segmente.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
                                {isDeleting ? 'Löschen...' : 'Löschen'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            <Button type="submit" disabled={isPending || isDeleting}>
              <Save className="mr-2 h-4 w-4" />
              {isPending ? (isEditMode ? 'Speichern...' : 'Erstellen...') : (isEditMode ? 'Änderungen speichern' : 'Beet erstellen')}
            </Button>
          </CardFooter>

        </form>
      </Form>
    </Card>
  );
}
