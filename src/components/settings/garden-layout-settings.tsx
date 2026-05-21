'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { electronAPI, isElectron } from '@/lib/electron-bridge';
import { Save, RotateCcw, Map } from 'lucide-react';
import {
  GartenLayout,
  QuadrantId,
  BeetZuordnung,
  DEFAULT_GARTEN_LAYOUT,
} from '@/types/garden-layout';
import * as DataStore from '@/lib/data-store';
import type { Bed } from '@/lib/definitions';

// ─── Typen ────────────────────────────────────────────────────────────────────

interface LocalState {
  gardenView: 'classic' | 'quadrant';
  gartenLayout: GartenLayout;
}

const makeDefault = (): LocalState => ({
  gardenView: 'classic',
  gartenLayout: JSON.parse(JSON.stringify(DEFAULT_GARTEN_LAYOUT)),
});

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

function numInput(val: number | undefined): string {
  return val !== undefined ? String(val) : '';
}

function parseNum(s: string, fallback: number): number {
  const v = parseFloat(s);
  return isNaN(v) ? fallback : v;
}

// ─── Komponente ───────────────────────────────────────────────────────────────

export default function GartenLayoutSettings() {
  const [state, setState]       = useState<LocalState>(makeDefault());
  const [beds, setBeds]         = useState<Bed[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast }               = useToast();

  // Config laden
  useEffect(() => {
    loadSettings();
    loadBeds();
  }, []);

  const loadSettings = async () => {
    if (!isElectron()) return;
    try {
      const config = await electronAPI.getConfig();
      if (!config) return;
      setState({
        gardenView:    config.gardenView    ?? 'classic',
        gartenLayout:  config.gardenLayout  ?? JSON.parse(JSON.stringify(DEFAULT_GARTEN_LAYOUT)),
      });
    } catch (err) {
      console.error('[GartenLayoutSettings] loadSettings:', err);
    }
  };

  const loadBeds = async () => {
    try {
      await DataStore.loadStore();
      const b = DataStore.getAllBeds();
      setBeds(Array.isArray(b) ? b : []);
    } catch (err) {
      console.error('[GartenLayoutSettings] loadBeds:', err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const config = (await electronAPI.getConfig()) ?? {};
      await electronAPI.saveConfig({
        ...config,
        gardenView:   state.gardenView,
        gardenLayout: state.gartenLayout,
      });
      toast({ title: 'Gespeichert', description: 'Lageplan-Einstellungen wurden gespeichert.' });
    } catch {
      toast({ title: 'Fehler', description: 'Speichern fehlgeschlagen.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => setState(makeDefault());

  // Weg-Werte updaten
  const setWeg = (field: keyof GartenLayout['weg'], raw: string) => {
    const defaults: GartenLayout['weg'] = DEFAULT_GARTEN_LAYOUT.weg;
    setState(prev => ({
      ...prev,
      gartenLayout: {
        ...prev.gartenLayout,
        weg: { ...prev.gartenLayout.weg, [field]: parseNum(raw, defaults[field]) },
      },
    }));
  };

  // Rondeau updaten
  const setRondeau = (field: keyof GartenLayout['rondeau'], value: number | boolean) => {
    setState(prev => ({
      ...prev,
      gartenLayout: {
        ...prev.gartenLayout,
        rondeau: { ...prev.gartenLayout.rondeau, [field]: value },
      },
    }));
  };

  // Beet-Zuordnung updaten
  const setBeetZuordnung = (beetId: string, quadrant: QuadrantId | '', nummer: number) => {
    setState(prev => {
      const bez = prev.gartenLayout.beetZuordnung.filter(z => z.beetId !== beetId);
      if (quadrant !== '') {
        bez.push({ beetId, quadrant, nummer });
      }
      return {
        ...prev,
        gartenLayout: { ...prev.gartenLayout, beetZuordnung: bez },
      };
    });
  };

  const getZuordnung = (beetId: string): BeetZuordnung | undefined =>
    state.gartenLayout.beetZuordnung.find(z => z.beetId === beetId);

  const zugeordnet = beds.filter(b => getZuordnung(b.id));
  const unzugeordnet = beds.filter(b => !getZuordnung(b.id));

  return (
    <div className="space-y-6">
      {/* ── Ansichts-Modus ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Map className="h-5 w-5" /> Gartenansicht</CardTitle>
          <CardDescription>Standard-Anzeigemodus auf der Startseite</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              variant={state.gardenView === 'classic' ? 'default' : 'outline'}
              onClick={() => setState(p => ({ ...p, gardenView: 'classic' }))}
            >
              Klassisch
            </Button>
            <Button
              variant={state.gardenView === 'quadrant' ? 'default' : 'outline'}
              onClick={() => setState(p => ({ ...p, gardenView: 'quadrant' }))}
            >
              Lageplan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Gartenmaße gesperrt ── */}
      <Card>
        <CardHeader>
          <CardTitle>Gartenmaße</CardTitle>
          <CardDescription>Fläche: {state.gartenLayout.gartenBreite} m (B) × {state.gartenLayout.gartenHoehe} m (H)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Die Gartenmaße sind auf 85 × 43 m festgelegt (anpassbar im Quellcode).</p>
        </CardContent>
      </Card>

      {/* ── Wege ── */}
      <Card>
        <CardHeader>
          <CardTitle>Weg-Konfiguration</CardTitle>
          <CardDescription>Position und Breite der Haupt-Wege in Metern</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Längsweg – X-Position (von W)</Label>
            <Input
              type="number" min={1} max={80} step={0.5}
              value={numInput(state.gartenLayout.weg.xPosition)}
              onChange={e => setWeg('xPosition', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Längsweg – Breite</Label>
            <Input
              type="number" min={0.5} max={10} step={0.5}
              value={numInput(state.gartenLayout.weg.xBreite)}
              onChange={e => setWeg('xBreite', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Querweg – Y-Position (von N)</Label>
            <Input
              type="number" min={1} max={40} step={0.5}
              value={numInput(state.gartenLayout.weg.yPosition)}
              onChange={e => setWeg('yPosition', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Querweg – Breite</Label>
            <Input
              type="number" min={0.5} max={10} step={0.5}
              value={numInput(state.gartenLayout.weg.yBreite)}
              onChange={e => setWeg('yBreite', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Rondeau ── */}
      <Card>
        <CardHeader>
          <CardTitle>Rondeau</CardTitle>
          <CardDescription>Kreisförmiges Beet im Wegkreuzungspunkt</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={state.gartenLayout.rondeau.aktiv}
              onCheckedChange={v => setRondeau('aktiv', v)}
            />
            <Label>Rondeau anzeigen</Label>
          </div>
          {state.gartenLayout.rondeau.aktiv && (
            <div className="space-y-1">
              <Label>Radius (m)</Label>
              <Input
                type="number" min={0.5} max={5} step={0.5}
                className="w-32"
                value={numInput(state.gartenLayout.rondeau.radius)}
                onChange={e => setRondeau('radius', parseNum(e.target.value, 3.5))}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Beet-Zuordnung ── */}
      <Card>
        <CardHeader>
          <CardTitle>Beet-Zuordnung</CardTitle>
          <CardDescription>
            Weise jedem Beet einen Quadranten und eine Position im Lageplan zu.
            {unzugeordnet.length > 0 && (
              <span className="ml-2">
                <Badge variant="secondary">{unzugeordnet.length} noch nicht zugeordnet</Badge>
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {beds.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Beete vorhanden.</p>
          ) : (
            <div className="w-full overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-1 px-2 text-left">Nr.</th>
                    <th className="py-1 px-2 text-left">Name</th>
                    <th className="py-1 px-2 text-left">Typ</th>
                    <th className="py-1 px-2 text-left">Quadrant</th>
                    <th className="py-1 px-2 text-left">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {beds.map(bed => {
                    const z = getZuordnung(bed.id);
                    return (
                      <tr key={bed.id} className="border-b last:border-0">
                        <td className="py-1 px-2">{bed.bedNumber}</td>
                        <td className="py-1 px-2 font-medium">{bed.name}</td>
                        <td className="py-1 px-2 text-muted-foreground">{bed.type}</td>
                        <td className="py-1 px-2">
                          <Select
                            value={z?.quadrant ?? 'none'}
                            onValueChange={(val: string) =>
                              setBeetZuordnung(bed.id, val === 'none' ? '' as QuadrantId : val as QuadrantId, z?.nummer ?? 1)
                            }
                          >
                            <SelectTrigger className="h-7 w-24 text-xs">
                              <SelectValue placeholder="–" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">– keine –</SelectItem>
                              <SelectItem value="NW">NW</SelectItem>
                              <SelectItem value="NO">NO</SelectItem>
                              <SelectItem value="SW">SW</SelectItem>
                              <SelectItem value="SO">SO</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-1 px-2">
                          {z?.quadrant ? (
                            <Input
                              type="number" min={1} max={20} step={1}
                              className="h-7 w-16 text-xs"
                              value={z.nummer}
                              onChange={e =>
                                setBeetZuordnung(bed.id, z.quadrant, parseInt(e.target.value) || 1)
                              }
                            />
                          ) : (
                            <span className="text-muted-foreground">–</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Speichern ── */}
      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Speichert...' : 'Speichern'}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Zurücksetzen
        </Button>
      </div>
    </div>
  );
}
