'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { WeatherStatistics } from '@/lib/definitions';
import { Thermometer, Droplets, Wind, CloudRain, Snowflake, Sun } from 'lucide-react';

interface WeatherOverviewProps {
  weatherStats: WeatherStatistics[];
}

export default function WeatherOverview({ weatherStats }: WeatherOverviewProps) {
  
  const currentYearStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return weatherStats.find(stat => stat.year === currentYear);
  }, [weatherStats]);

  const previousYearStats = useMemo(() => {
    const previousYear = new Date().getFullYear() - 1;
    return weatherStats.find(stat => stat.year === previousYear);
  }, [weatherStats]);

  const calculateChange = (current: number, previous: number) => {
    if (!previous) return null;
    const change = ((current - previous) / previous) * 100;
    return change;
  };

  const formatChange = (change: number | null) => {
    if (change === null) return '';
    const sign = change > 0 ? '+' : '';
    const color = change > 0 ? 'text-red-500' : 'text-blue-500';
    return (
      <span className={`text-xs ${color} ml-1`}>
        ({sign}{change.toFixed(1)}%)
      </span>
    );
  };

  if (!currentYearStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudRain className="h-5 w-5" />
            Wetterübersicht
          </CardTitle>
          <CardDescription>
            Aktuelle Jahresstatistiken und Vergleich zum Vorjahr
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CloudRain className="mx-auto h-8 w-8 mb-2 opacity-70" />
            <p>Noch keine Statistiken für das aktuelle Jahr verfügbar.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tempChange = calculateChange(
    currentYearStats.avgAirTemperature, 
    previousYearStats?.avgAirTemperature || 0
  );
  
  const precipitationChange = calculateChange(
    currentYearStats.totalPrecipitation, 
    previousYearStats?.totalPrecipitation || 0
  );

  const humidityChange = calculateChange(
    currentYearStats.avgHumidity, 
    previousYearStats?.avgHumidity || 0
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Durchschnittstemperatur */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Thermometer className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-2xl font-bold">
                {currentYearStats.avgAirTemperature.toFixed(1)}°C
                {formatChange(tempChange)}
              </p>
              <p className="text-xs text-muted-foreground">Ø Lufttemperatur {currentYearStats.year}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bodentemperatur */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Thermometer className="h-5 w-5 text-orange-600" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-orange-600 rounded-full"></div>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {currentYearStats.avgSoilTemperature.toFixed(1)}°C
              </p>
              <p className="text-xs text-muted-foreground">Ø Bodentemperatur {currentYearStats.year}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Niederschlag */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">
                {currentYearStats.totalPrecipitation.toFixed(0)} mm
                {formatChange(precipitationChange)}
              </p>
              <p className="text-xs text-muted-foreground">Niederschlag {currentYearStats.year}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Luftfeuchtigkeit */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Wind className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold">
                {currentYearStats.avgHumidity.toFixed(0)}%
                {formatChange(humidityChange)}
              </p>
              <p className="text-xs text-muted-foreground">Ø Luftfeuchtigkeit {currentYearStats.year}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Frosttage */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Snowflake className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-2xl font-bold">{currentYearStats.frostDays}</p>
              <p className="text-xs text-muted-foreground">Frosttage {currentYearStats.year}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trockene Tage */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Sun className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{currentYearStats.dryDays}</p>
              <p className="text-xs text-muted-foreground">Trockene Tage {currentYearStats.year}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regentage */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <CloudRain className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{currentYearStats.rainyDays}</p>
              <p className="text-xs text-muted-foreground">Regentage {currentYearStats.year}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datenpunkte */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center">
              <div className="h-2 w-2 bg-white rounded-full"></div>
            </div>
            <div>
              <p className="text-2xl font-bold">{currentYearStats.dataPointCount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Messungen {currentYearStats.year}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
