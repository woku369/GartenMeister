'use client';

import { useForm } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { addHerbVarietyAction } from '@/lib/actions-stubs'; // TEMPORÄR für Static Export
import { PlusCircle } from 'lucide-react';
import { useState, useTransition, useEffect } from 'react';
import { HERB_COLOR_PALETTE } from '@/lib/definitions';
import type { HerbVariety } from '@/lib/definitions';

const herbFormSchema = z.object({
  name: z.string().min(2, { message: 'Name muss mindestens 2 Zeichen lang sein.' }).max(50, { message: 'Name darf maximal 50 Zeichen lang sein.' }),
  color: z.string().optional(), // Added optional color field
  remarks: z.string().optional(), // Neu: Bemerkungsfeld
});

type HerbFormValues = z.infer<typeof herbFormSchema>;

interface HerbFormProps {
  onHerbAdded?: () => void;
}

export default function HerbForm({ onHerbAdded }: HerbFormProps) {
  // Note: This component is currently only used for *adding* new herbs, not editing.
  // The logic here is specifically for adding with an optional color.
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [existingHerbs, setExistingHerbs] = useState<HerbVariety[]>([]);

  // Lade vorhandene Kräuter zum Filtern der Farben
  const loadExistingHerbs = async () => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const herbs = await window.electronAPI.herbs.getAll();
        setExistingHerbs(herbs || []);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Kräuter für Farbfilterung:', error);
    }
  };

  useEffect(() => {
    loadExistingHerbs();
  }, []);

  // Verfügbare Farben filtern (bereits verwendete ausschließen)
  const availableColors = HERB_COLOR_PALETTE.filter(color => 
    !existingHerbs.some(herb => herb.color?.toLowerCase() === color.toLowerCase())
  );

  const form = useForm<HerbFormValues>({
    resolver: zodResolver(herbFormSchema),
    defaultValues: {
 name: '',
 color: '', // Initialize color field
 remarks: '', // Initialize remarks field
    },
  });

  const onSubmit = async (values: HerbFormValues) => {
    setError(null);
    startTransition(async () => { // Pass the selected color to the action
      try {
        // In Electron verwende IPC
        if (typeof window !== 'undefined' && window.electronAPI) {
          await window.electronAPI.herbs.create({ 
            name: values.name, 
            color: values.color,
            remarks: values.remarks 
          });
        } else {
          // Fallback für Development
          const result = await addHerbVarietyAction(values.name, values.color);
          if (!result.success) {
            throw new Error(result.error || 'Fehler beim Hinzufügen');
          }
        }
        
        toast({
          title: 'Erfolg!',
          description: `Kräutersorte "${values.name}" wurde erfolgreich hinzugefügt.`,
        });
        form.reset();
        
        // Callback aufrufen um die Liste zu aktualisieren
        if (onHerbAdded) {
          onHerbAdded();
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten.';
        setError(errorMessage);
        toast({
          title: 'Fehler',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Neue Kräutersorte anlegen</CardTitle>
        <CardDescription>Fügen Sie eine neue Sorte zu Ihrer Datenbank hinzu.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="herbName">Name der Kräutersorte</FormLabel>
                  <FormControl>
                    <Input id="herbName" placeholder="z.B. Rosmarin, Basilikum" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Color Selection Field */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="herbColor">Farbe (optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                    <FormControl>
                      <SelectTrigger id="herbColor">
                        <SelectValue placeholder="Wählen Sie eine Farbe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableColors.length === 0 ? (
                        <SelectItem value="" disabled>
                          <div className="flex items-center text-muted-foreground">
                            <span>Alle Farben bereits vergeben</span>
                          </div>
                        </SelectItem>
                      ) : (
                        availableColors.map(color => (
                          <SelectItem key={color} value={color}>
                            <div className="flex items-center">
                              <span className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: color }}></span>
                              {color}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            {/* Bemerkungsfeld */}
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="herbRemarks">Bemerkungen (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      id="herbRemarks" 
                      placeholder="z.B. Anbauhinweise, Erntenotizen, Besonderheiten..." 
                      rows={3}
                      {...field} 
                      disabled={isPending} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isPending}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {isPending ? 'Wird hinzugefügt...' : 'Sorte hinzufügen'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
