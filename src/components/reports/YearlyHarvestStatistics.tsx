'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TreePine, Package, TrendingUp, Calendar } from 'lucide-react';
import type { EnrichedHarvestEvent } from '@/app/reports/page';
import type { HerbVariety } from '@/lib/definitions';

interface YearlyHarvestStatisticsProps {
  harvestEvents: EnrichedHarvestEvent[];
  herbVarieties: HerbVariety[];
}

interface YearlyVarietyStats {
  varietyId: string;
  varietyName: string;
  varietyColor?: string;
  totalKg: number;
  totalYieldablePlants: number;
  harvestCount: number;
  harvestEvents: EnrichedHarvestEvent[];
  averageKgPerHarvest: number;
  averageKgPerPlant: number;
}

interface YearlyStats {
  year: number;
  varietyStats: YearlyVarietyStats[];
  totalKgAllVarieties: number;
  totalYieldablePlantsAllVarieties: number;
  totalHarvestsAllVarieties: number;
}

export default function YearlyHarvestStatistics({ harvestEvents, herbVarieties }: YearlyHarvestStatisticsProps) {
  const herbMap = useMemo(() => new Map(herbVarieties.map(h => [h.id, h])), [herbVarieties]);

  const yearlyStats = useMemo(() => {
    // Gruppiere Events nach Jahr
    const eventsByYear = harvestEvents.reduce((acc, event) => {
      const year = new Date(event.harvestDateStart).getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(event);
      return acc;
    }, {} as Record<number, EnrichedHarvestEvent[]>);

    // Berechne Statistiken pro Jahr
    return Object.entries(eventsByYear).map(([yearStr, events]) => {
      const year = parseInt(yearStr);
      
      // Gruppiere Events nach Sorte
      const eventsByVariety = events.reduce((acc, event) => {
        if (!acc[event.herbVarietyId]) acc[event.herbVarietyId] = [];
        acc[event.herbVarietyId].push(event);
        return acc;
      }, {} as Record<string, EnrichedHarvestEvent[]>);

      const varietyStats = Object.entries(eventsByVariety).map(([varietyId, varietyEvents]) => {
        const herb = herbMap.get(varietyId);
        const totalKg = varietyEvents.reduce((sum, event) => sum + (event.totalYieldKg || 0), 0);
        const totalYieldablePlants = varietyEvents.reduce((sum, event) => sum + (event.totalYieldablePlantsForEvent || 0), 0);
        const harvestCount = varietyEvents.length;
        
        return {
          varietyId,
          varietyName: herb?.name || 'Unbekannte Sorte',
          varietyColor: herb?.color,
          totalKg,
          totalYieldablePlants,
          harvestCount,
          harvestEvents: varietyEvents,
          averageKgPerHarvest: harvestCount > 0 ? totalKg / harvestCount : 0,
          averageKgPerPlant: totalYieldablePlants > 0 ? totalKg / totalYieldablePlants : 0,
        } as YearlyVarietyStats;
      }).sort((a, b) => b.totalKg - a.totalKg); // Sortiere nach Gesamtertrag

      const totalKgAllVarieties = varietyStats.reduce((sum, stat) => sum + stat.totalKg, 0);
      const totalYieldablePlantsAllVarieties = varietyStats.reduce((sum, stat) => sum + stat.totalYieldablePlants, 0);
      const totalHarvestsAllVarieties = varietyStats.reduce((sum, stat) => sum + stat.harvestCount, 0);

      return {
        year,
        varietyStats,
        totalKgAllVarieties,
        totalYieldablePlantsAllVarieties,
        totalHarvestsAllVarieties,
      } as YearlyStats;
    }).sort((a, b) => b.year - a.year); // Neueste Jahre zuerst
  }, [harvestEvents, herbMap]);

  if (yearlyStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Jahresstatistiken
          </CardTitle>
          <CardDescription>
            Ertragsübersicht nach Bewirtschaftungsjahren und Sorten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="mx-auto h-12 w-12 mb-4 opacity-70" />
            <p>Noch keine Daten für Jahresstatistiken vorhanden.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Jahresstatistiken
        </CardTitle>
        <CardDescription>
          Ertragsübersicht nach Bewirtschaftungsjahren und Sorten
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={yearlyStats[0]?.year.toString()} className="w-full">
          <TabsList className="grid w-full grid-cols-auto" style={{ gridTemplateColumns: `repeat(${yearlyStats.length}, 1fr)` }}>
            {yearlyStats.map((yearStat) => (
              <TabsTrigger key={yearStat.year} value={yearStat.year.toString()}>
                {yearStat.year}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {yearlyStats.map((yearStat) => (
            <TabsContent key={yearStat.year} value={yearStat.year.toString()} className="space-y-4">
              
              {/* Jahresübersicht */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Package className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold">{yearStat.totalKgAllVarieties.toFixed(2)} kg</p>
                        <p className="text-xs text-muted-foreground">Gesamtertrag {yearStat.year}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <TreePine className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold">{yearStat.totalYieldablePlantsAllVarieties.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Ertragsfähige Pflanzen</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-2xl font-bold">{yearStat.totalHarvestsAllVarieties}</p>
                        <p className="text-xs text-muted-foreground">Ernten gesamt</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sorten-Statistiken */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ertrag nach Sorten ({yearStat.year})</CardTitle>
                  <CardDescription>
                    Detailaufschlüsselung der Erträge und Pflanzenzahlen pro Kräutersorte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sorte</TableHead>
                        <TableHead className="text-right">Ernten</TableHead>
                        <TableHead className="text-right">Gesamtertrag</TableHead>
                        <TableHead className="text-right">Ertragsfähige Pflanzen</TableHead>
                        <TableHead className="text-right">Ø kg/Ernte</TableHead>
                        <TableHead className="text-right">Ø kg/Pflanze</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {yearStat.varietyStats.map((varietyStat) => (
                        <TableRow key={varietyStat.varietyId}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {varietyStat.varietyColor && (
                                <span 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: varietyStat.varietyColor }}
                                ></span>
                              )}
                              <span className="font-medium">{varietyStat.varietyName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{varietyStat.harvestCount}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {varietyStat.totalKg.toFixed(2)} kg
                          </TableCell>
                          <TableCell className="text-right">
                            {varietyStat.totalYieldablePlants.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {varietyStat.averageKgPerHarvest.toFixed(2)} kg
                          </TableCell>
                          <TableCell className="text-right">
                            {varietyStat.averageKgPerPlant > 0 ? `${(varietyStat.averageKgPerPlant * 1000).toFixed(1)} g` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
