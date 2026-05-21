'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Routine } from '@/lib/routines-manager';

// Schema für die Routine-Form
const routineFormSchema = z.object({
  name: z.string().min(3, { message: 'Name muss mindestens 3 Zeichen lang sein' }),
  description: z.string().optional(),
  type: z.enum(['calendar', 'bed', 'harvest', 'herb', 'other']),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  configuration: z.record(z.any())
});

type RoutineFormValues = z.infer<typeof routineFormSchema>;

interface RoutineFormProps {
  initialData?: Routine;
  onSubmit: (data: Routine) => void;
  onCancel: () => void;
}

export default function RoutineForm({ initialData, onSubmit, onCancel }: RoutineFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Standardwerte für das Formular
  const defaultValues: Partial<RoutineFormValues> = {
    name: initialData?.name || '',
    description: initialData?.description || '',
    type: initialData?.type || 'other',
    frequency: initialData?.frequency,
    configuration: initialData?.configuration || {}
  };

  const form = useForm<RoutineFormValues>({
    resolver: zodResolver(routineFormSchema),
    defaultValues
  });

  const handleSubmit = async (values: RoutineFormValues) => {
    setIsSubmitting(true);
    try {
      const routineData: Routine = {
        id: initialData?.id || `routine-${Date.now()}`,
        name: values.name,
        description: values.description,
        type: values.type,
        frequency: values.frequency,
        lastRun: initialData?.lastRun,
        nextRun: initialData?.nextRun,
        configuration: values.configuration || {}
      };

      onSubmit(routineData);
      toast({
        title: initialData ? 'Routine aktualisiert' : 'Routine erstellt',
        description: `Die Routine "${values.name}" wurde erfolgreich ${initialData ? 'aktualisiert' : 'erstellt'}.`
      });
    } catch (error) {
      console.error('Fehler beim Speichern der Routine:', error);
      toast({
        title: 'Fehler',
        description: 'Die Routine konnte nicht gespeichert werden.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{initialData ? 'Routine bearbeiten' : 'Neue Routine erstellen'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name der Routine" {...field} />
                  </FormControl>
                  <FormDescription>
                    Ein klarer Name zur Identifikation der Routine
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Beschreiben Sie die Routine und ihren Zweck"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Optionale Beschreibung zur Erläuterung der Routine
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Typ</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Typ auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="calendar">Kalender</SelectItem>
                      <SelectItem value="bed">Beet</SelectItem>
                      <SelectItem value="harvest">Ernte</SelectItem>
                      <SelectItem value="herb">Kräuter</SelectItem>
                      <SelectItem value="other">Sonstiges</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Kategorie der Routine
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Häufigkeit</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Häufigkeit auswählen (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Täglich</SelectItem>
                      <SelectItem value="weekly">Wöchentlich</SelectItem>
                      <SelectItem value="monthly">Monatlich</SelectItem>
                      <SelectItem value="yearly">Jährlich</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Wie oft soll die Routine ausgeführt werden?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Wird gespeichert..." : initialData ? "Aktualisieren" : "Erstellen"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
