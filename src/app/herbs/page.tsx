'use client';

import { useEffect, useState } from 'react';

// Force static generation for this page
export const dynamic = 'force-static';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2, Save, X, Plus } from 'lucide-react';
import { HerbVariety } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';

interface EditingHerb {
  id: string;
  name: string;
  color: string;
  remarks: string;
}

export default function HerbsPage() {
  const [herbs, setHerbs] = useState<HerbVariety[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingHerb, setEditingHerb] = useState<EditingHerb | null>(null);
  const [deletingHerbId, setDeletingHerbId] = useState<string | null>(null);
  const { toast } = useToast();

  // Verfügbare Farben für die Auswahl
  const availableColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#6b7280', '#374151', '#1f2937'
  ];

  // Kräuter laden
  const loadHerbs = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const herbData = await window.electronAPI.invoke('herbs:get-all');
        setHerbs(herbData || []);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Kräuter:', error);
      toast({
        title: "Fehler",
        description: "Kräuter konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHerbs();
  }, []);

  // Bereits verwendete Farben ermitteln (ohne die aktuell bearbeitete)
  const getUsedColors = () => {
    return herbs
      .filter(herb => editingHerb ? herb.id !== editingHerb.id : true)
      .map(herb => herb.color)
      .filter(Boolean);
  };

  // Verfügbare Farben für die Auswahl (ohne bereits verwendete)
  const getAvailableColorsForSelection = () => {
    const usedColors = getUsedColors();
    return availableColors.filter(color => !usedColors.includes(color));
  };

  // Bearbeitung starten
  const startEdit = (herb: HerbVariety) => {
    setEditingHerb({
      id: herb.id,
      name: herb.name,
      color: herb.color || '#6b7280',
      remarks: herb.remarks || ''
    });
  };

  // Bearbeitung speichern
  const saveEdit = async () => {
    if (!editingHerb) return;

    try {
      // Prüfen ob Farbe bereits verwendet wird
      const usedColors = getUsedColors();
      if (usedColors.includes(editingHerb.color)) {
        toast({
          title: "Farbe bereits verwendet",
          description: "Diese Farbe wird bereits von einer anderen Sorte verwendet. Bitte wählen Sie eine andere Farbe.",
          variant: "destructive",
        });
        return;
      }

      if (window.electronAPI) {
        await window.electronAPI.invoke('herbs:update', {
          id: editingHerb.id,
          name: editingHerb.name.trim(),
          color: editingHerb.color,
          remarks: editingHerb.remarks.trim()
        });

        setEditingHerb(null);
        await loadHerbs(); // Daten neu laden
        
        toast({
          title: "Erfolgreich gespeichert",
          description: "Die Kräutersorte wurde erfolgreich aktualisiert.",
        });
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      toast({
        title: "Fehler",
        description: "Kräutersorte konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  // Bearbeitung abbrechen
  const cancelEdit = () => {
    setEditingHerb(null);
  };

  // Kräutersorte löschen
  const deleteHerb = async (herbId: string) => {
    if (!window.confirm('Möchten Sie diese Kräutersorte wirklich löschen?')) {
      return;
    }

    try {
      setDeletingHerbId(herbId);
      
      if (window.electronAPI) {
        await window.electronAPI.invoke('herbs:delete', herbId);
        await loadHerbs(); // Daten neu laden
        
        toast({
          title: "Erfolgreich gelöscht",
          description: "Die Kräutersorte wurde erfolgreich gelöscht.",
        });
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      toast({
        title: "Fehler",
        description: "Kräutersorte konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    } finally {
      setDeletingHerbId(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Kräuter werden geladen...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Kräuter-Management</h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle verfügbaren Kräutersorten mit Farben und Bemerkungen
          </p>
        </div>
        <Button 
          onClick={() => window.electronAPI?.invoke('navigate', '/herbs/new')}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Neue Sorte hinzufügen
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Kräutersorten ({herbs.length})</CardTitle>
          <CardDescription>
            Bearbeiten Sie Sortennamen, Farben und Bemerkungen direkt in der Tabelle
          </CardDescription>
        </CardHeader>
        <CardContent>
          {herbs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Noch keine Kräutersorten vorhanden. 
              <Button 
                variant="link" 
                onClick={() => window.electronAPI?.invoke('navigate', '/herbs/new')}
                className="p-0 ml-1 h-auto"
              >
                Jetzt hinzufügen
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sortenname</TableHead>
                  <TableHead>Farbe</TableHead>
                  <TableHead>Bemerkungen</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {herbs.map((herb) => (
                  <TableRow key={herb.id}>
                    <TableCell>
                      {editingHerb?.id === herb.id ? (
                        <Input
                          value={editingHerb.name}
                          onChange={(e) => setEditingHerb({...editingHerb, name: e.target.value})}
                          className="w-full"
                        />
                      ) : (
                        <span className="font-medium">{herb.name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingHerb?.id === herb.id ? (
                        <Select
                          value={editingHerb.color}
                          onValueChange={(value) => setEditingHerb({...editingHerb, color: value})}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue>
                              <div className="flex items-center justify-center">
                                <div 
                                  className="w-5 h-5 rounded-full border border-gray-300"
                                  style={{ backgroundColor: editingHerb.color }}
                                />
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableColorsForSelection().map((color) => (
                              <SelectItem key={color} value={color}>
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-5 h-5 rounded-full border border-gray-300"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="text-xs text-gray-500">{color}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div 
                          className="w-5 h-5 rounded-full border border-gray-300"
                          style={{ backgroundColor: herb.color }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {editingHerb?.id === herb.id ? (
                        <Textarea
                          value={editingHerb.remarks}
                          onChange={(e) => setEditingHerb({...editingHerb, remarks: e.target.value})}
                          placeholder="Bemerkungen zur Sorte..."
                          className="w-full min-h-[60px]"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {herb.remarks || '-'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingHerb?.id === herb.id ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={saveEdit}
                            className="flex items-center gap-1 h-8 px-3 text-xs text-green-700 hover:text-green-800 hover:bg-green-50"
                          >
                            <Save size={12} />
                            Speichern
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEdit}
                            className="flex items-center gap-1 h-8 px-3 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                          >
                            <X size={12} />
                            Abbrechen
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(herb)}
                            className="flex items-center gap-1 h-8 px-2 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                          >
                            <Pencil size={12} />
                            Bearbeiten
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteHerb(herb.id)}
                            disabled={deletingHerbId === herb.id}
                            className="flex items-center gap-1 h-8 px-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 size={12} />
                            {deletingHerbId === herb.id ? 'Lösche...' : 'Löschen'}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
