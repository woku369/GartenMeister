'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PlusCircle, Edit, Trash2, Calendar, Check, Flower2, Scissors, LayoutDashboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Routine } from '@/lib/routines-manager';
import RoutineForm from './RoutineForm';

export default function RoutineList() {
  const { toast } = useToast();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentRoutine, setCurrentRoutine] = useState<Routine | undefined>(undefined);

  // Routinen laden
  const loadRoutines = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/routines');
      if (!response.ok) throw new Error('Fehler beim Laden der Routinen');
      const data = await response.json();
      setRoutines(data);
    } catch (error) {
      console.error('Fehler beim Laden der Routinen:', error);
      toast({
        title: 'Fehler',
        description: 'Die Routinen konnten nicht geladen werden',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoutines();
  }, []);

  // Routine speichern
  const handleSaveRoutine = async (routine: Routine) => {
    try {
      const isEdit = !!currentRoutine;
      const url = '/api/routines';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(routine)
      });
      
      if (!response.ok) throw new Error('Fehler beim Speichern der Routine');
      
      setIsFormOpen(false);
      setCurrentRoutine(undefined);
      loadRoutines();
    } catch (error) {
      console.error('Fehler beim Speichern der Routine:', error);
      toast({
        title: 'Fehler',
        description: 'Die Routine konnte nicht gespeichert werden',
        variant: 'destructive'
      });
    }
  };

  // Routine löschen
  const handleDeleteRoutine = async () => {
    if (!routineToDelete) return;
    
    try {
      const response = await fetch(`/api/routines?id=${routineToDelete}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Fehler beim Löschen der Routine');
      
      toast({
        title: 'Routine gelöscht',
        description: 'Die Routine wurde erfolgreich gelöscht'
      });
      
      loadRoutines();
    } catch (error) {
      console.error('Fehler beim Löschen der Routine:', error);
      toast({
        title: 'Fehler',
        description: 'Die Routine konnte nicht gelöscht werden',
        variant: 'destructive'
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setRoutineToDelete(null);
    }
  };

  // Routine bearbeiten
  const handleEditRoutine = (routine: Routine) => {
    setCurrentRoutine(routine);
    setIsFormOpen(true);
  };

  // Zeitstempel aktualisieren (Routine ausgeführt)
  const handleRunRoutine = async (id: string) => {
    try {
      const response = await fetch('/api/routines', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });
      
      if (!response.ok) throw new Error('Fehler beim Aktualisieren des Zeitstempels');
      
      toast({
        title: 'Routine ausgeführt',
        description: 'Die Routine wurde als ausgeführt markiert'
      });
      
      loadRoutines();
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Zeitstempels:', error);
      toast({
        title: 'Fehler',
        description: 'Der Zeitstempel konnte nicht aktualisiert werden',
        variant: 'destructive'
      });
    }
  };

  // Icon für den Routinen-Typ
  const getTypeIcon = (type: Routine['type']) => {
    switch (type) {
      case 'calendar':
        return <Calendar className="h-4 w-4" />;
      case 'bed':
        return <Flower2 className="h-4 w-4" />;
      case 'harvest':
        return <Scissors className="h-4 w-4" />;
      case 'herb':
        return <Flower2 className="h-4 w-4" />;
      default:
        return <LayoutDashboard className="h-4 w-4" />;
    }
  };

  // Typ-Bezeichnung
  const getTypeName = (type: Routine['type']) => {
    switch (type) {
      case 'calendar':
        return 'Kalender';
      case 'bed':
        return 'Beet';
      case 'harvest':
        return 'Ernte';
      case 'herb':
        return 'Kräuter';
      default:
        return 'Sonstiges';
    }
  };

  // Frequenz-Bezeichnung
  const getFrequencyName = (frequency?: string) => {
    if (!frequency) return 'Einmalig';
    switch (frequency) {
      case 'daily':
        return 'Täglich';
      case 'weekly':
        return 'Wöchentlich';
      case 'monthly':
        return 'Monatlich';
      case 'yearly':
        return 'Jährlich';
      default:
        return 'Einmalig';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Wiederkehrende Routinen</h2>
        <Button onClick={() => { setCurrentRoutine(undefined); setIsFormOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Neue Routine
        </Button>
      </div>

      <Separator className="my-4" />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <RoutineForm 
            initialData={currentRoutine} 
            onSubmit={handleSaveRoutine} 
            onCancel={() => setIsFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Routine löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie diese Routine löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRoutine} className="bg-red-500 hover:bg-red-600">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : routines.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Häufigkeit</TableHead>
                  <TableHead>Letzte Ausführung</TableHead>
                  <TableHead>Nächste Ausführung</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routines.map((routine) => (
                  <TableRow key={routine.id}>
                    <TableCell className="font-medium">{routine.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getTypeIcon(routine.type)}
                        <span className="ml-2">{getTypeName(routine.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getFrequencyName(routine.frequency)}</TableCell>
                    <TableCell>
                      {routine.lastRun ? new Date(routine.lastRun).toLocaleDateString('de-DE') : '-'}
                    </TableCell>
                    <TableCell>
                      {routine.nextRun ? new Date(routine.nextRun).toLocaleDateString('de-DE') : '-'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleRunRoutine(routine.id)} title="Als ausgeführt markieren">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditRoutine(routine)} title="Bearbeiten">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setRoutineToDelete(routine.id); setIsDeleteDialogOpen(true); }}
                        title="Löschen"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-4">Keine Routinen gefunden.</p>
            <Button onClick={() => { setCurrentRoutine(undefined); setIsFormOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Erstellen Sie Ihre erste Routine
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
