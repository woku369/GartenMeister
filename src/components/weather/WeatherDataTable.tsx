'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { WeatherDataPoint } from '@/lib/definitions';
import { Thermometer, Droplets, Wind, CloudRain } from 'lucide-react';

interface WeatherDataTableProps {
  weatherData: WeatherDataPoint[];
}

export default function WeatherDataTable({ weatherData }: WeatherDataTableProps) {
  
  const recentData = useMemo(() => {
    return weatherData
      .slice(0, 100) // Zeige nur die letzten 100 Einträge
      .map(point => ({
        ...point,
        formattedDate: new Date(point.timestamp).toLocaleDateString('de-DE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }),
        formattedTime: new Date(point.timestamp).toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }));
  }, [weatherData]);

  const getConditionBadge = (condition: string) => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('sonni') || conditionLower.includes('clear')) {
      return <Badge variant="default" className="bg-yellow-500 text-white">☀️ {condition}</Badge>;
    }
    if (conditionLower.includes('regen') || conditionLower.includes('rain')) {
      return <Badge variant="default" className="bg-blue-500 text-white">🌧️ {condition}</Badge>;
    }
    if (conditionLower.includes('bewölkt') || conditionLower.includes('cloud')) {
      return <Badge variant="secondary">☁️ {condition}</Badge>;
    }
    return <Badge variant="outline">{condition}</Badge>;
  };

  const getTemperatureColor = (temp: number) => {
    if (temp < 0) return 'text-blue-600 font-semibold';
    if (temp < 10) return 'text-blue-500';
    if (temp < 25) return 'text-green-600';
    if (temp < 35) return 'text-orange-500';
    return 'text-red-600 font-semibold';
  };

  if (weatherData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudRain className="h-5 w-5" />
            Wetterdaten
          </CardTitle>
          <CardDescription>
            Detaillierte Übersicht der gesammelten Wetterdaten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <CloudRain className="mx-auto h-12 w-12 mb-4 opacity-70" />
            <p className="text-lg font-semibold">Keine Wetterdaten verfügbar</p>
            <p>Wetterdaten werden automatisch über das Dashboard gesammelt.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudRain className="h-5 w-5" />
          Wetterdaten
        </CardTitle>
        <CardDescription>
          Die letzten {Math.min(100, weatherData.length)} Wettermessungen (von insgesamt {weatherData.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Zeit</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Thermometer className="h-4 w-4" />
                    Luft °C
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Thermometer className="h-4 w-4" />
                    Boden °C
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Droplets className="h-4 w-4" />
                    Feucht. %
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Wind className="h-4 w-4" />
                    Wind km/h
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <CloudRain className="h-4 w-4" />
                    Regen mm
                  </div>
                </TableHead>
                <TableHead>Bedingung</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentData.map((point) => (
                <TableRow key={point.id}>
                  <TableCell className="font-medium">
                    {point.formattedDate}
                  </TableCell>
                  <TableCell>
                    {point.formattedTime}
                  </TableCell>
                  <TableCell className={`text-center ${getTemperatureColor(point.airTemperature)}`}>
                    {point.airTemperature.toFixed(1)}°
                  </TableCell>
                  <TableCell className={`text-center ${getTemperatureColor(point.soilTemperature)}`}>
                    {point.soilTemperature.toFixed(1)}°
                  </TableCell>
                  <TableCell className="text-center">
                    {point.humidity.toFixed(0)}%
                  </TableCell>
                  <TableCell className="text-center">
                    {point.windSpeed.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={point.precipitation > 0 ? 'text-blue-600 font-medium' : 'text-muted-foreground'}>
                      {point.precipitation.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getConditionBadge(point.condition)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
