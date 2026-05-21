'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { WeatherDataPoint, WeatherStatistics } from '@/lib/definitions';
import { Thermometer, Droplets, Wind, CloudRain } from 'lucide-react';

interface WeatherStatisticsChartsProps {
  weatherData: WeatherDataPoint[];
  weatherStats: WeatherStatistics[];
}

export default function WeatherStatisticsCharts({ weatherData, weatherStats }: WeatherStatisticsChartsProps) {
  
  // Bereite Daten für Jahresgraph vor
  const yearlyChartData = useMemo(() => {
    return weatherStats.map(stat => ({
      year: stat.year,
      avgAirTemp: Math.round(stat.avgAirTemperature * 10) / 10,
      avgSoilTemp: Math.round(stat.avgSoilTemperature * 10) / 10,
      totalPrecipitation: Math.round(stat.totalPrecipitation * 10) / 10,
      avgHumidity: Math.round(stat.avgHumidity * 10) / 10,
      frostDays: stat.frostDays,
      dryDays: stat.dryDays
    })).sort((a, b) => a.year - b.year);
  }, [weatherStats]);

  // Bereite Daten für Monatsgraph vor (aktuelles Jahr)
  const currentYear = new Date().getFullYear();
  const monthlyChartData = useMemo(() => {
    const currentYearData = weatherData.filter(point => 
      new Date(point.timestamp).getFullYear() === currentYear
    );

    const monthlyStats = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const monthData = currentYearData.filter(point => 
        new Date(point.timestamp).getMonth() === index
      );

      if (monthData.length === 0) {
        return {
          month: month.toString().padStart(2, '0'),
          monthName: new Date(currentYear, index, 1).toLocaleDateString('de-DE', { month: 'short' }),
          avgAirTemp: 0,
          avgSoilTemp: 0,
          totalPrecipitation: 0,
          avgHumidity: 0,
          dataPoints: 0
        };
      }

      const avgAirTemp = monthData.reduce((sum, p) => sum + p.airTemperature, 0) / monthData.length;
      const avgSoilTemp = monthData.reduce((sum, p) => sum + p.soilTemperature, 0) / monthData.length;
      const totalPrecipitation = monthData.reduce((sum, p) => sum + p.precipitation, 0);
      const avgHumidity = monthData.reduce((sum, p) => sum + p.humidity, 0) / monthData.length;

      return {
        month: month.toString().padStart(2, '0'),
        monthName: new Date(currentYear, index, 1).toLocaleDateString('de-DE', { month: 'short' }),
        avgAirTemp: Math.round(avgAirTemp * 10) / 10,
        avgSoilTemp: Math.round(avgSoilTemp * 10) / 10,
        totalPrecipitation: Math.round(totalPrecipitation * 10) / 10,
        avgHumidity: Math.round(avgHumidity * 10) / 10,
        dataPoints: monthData.length
      };
    });

    return monthlyStats;
  }, [weatherData, currentYear]);

  if (weatherData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Wetterstatistiken
          </CardTitle>
          <CardDescription>
            Graphische Auswertung der gesammelten Wetterdaten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <CloudRain className="mx-auto h-12 w-12 mb-4 opacity-70" />
            <p className="text-lg font-semibold">Noch keine Wetterdaten vorhanden</p>
            <p>Wetterdaten werden automatisch über das Dashboard-Widget gesammelt.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Temperaturverläufe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Temperaturverläufe {currentYear}
          </CardTitle>
          <CardDescription>
            Monatsweise Durchschnittstemperaturen für Luft und Boden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="monthName" />
              <YAxis label={{ value: 'Temperatur (°C)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                labelFormatter={(label) => `Monat: ${label}`}
                formatter={(value: number, name: string) => [
                  `${value}°C`,
                  name === 'avgAirTemp' ? 'Lufttemperatur' : 'Bodentemperatur'
                ]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="avgAirTemp" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Lufttemperatur"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="avgSoilTemp" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Bodentemperatur"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Niederschlag und Luftfeuchtigkeit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5" />
              Niederschlag {currentYear}
            </CardTitle>
            <CardDescription>
              Monatliche Niederschlagsmengen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthName" />
                <YAxis label={{ value: 'Niederschlag (mm)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  labelFormatter={(label) => `Monat: ${label}`}
                  formatter={(value: number) => [`${value} mm`, 'Niederschlag']}
                />
                <Bar dataKey="totalPrecipitation" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5" />
              Luftfeuchtigkeit {currentYear}
            </CardTitle>
            <CardDescription>
              Durchschnittliche Luftfeuchtigkeit pro Monat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthName" />
                <YAxis 
                  label={{ value: 'Luftfeuchtigkeit (%)', angle: -90, position: 'insideLeft' }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  labelFormatter={(label) => `Monat: ${label}`}
                  formatter={(value: number) => [`${value}%`, 'Luftfeuchtigkeit']}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgHumidity" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Jahresvergleich (falls mehrere Jahre verfügbar) */}
      {yearlyChartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Jahresvergleich</CardTitle>
            <CardDescription>
              Vergleich der Durchschnittstemperaturen und Niederschläge über mehrere Jahre
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={yearlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis yAxisId="temp" orientation="left" label={{ value: 'Temperatur (°C)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="rain" orientation="right" label={{ value: 'Niederschlag (mm)', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="temp" type="monotone" dataKey="avgAirTemp" stroke="#ef4444" strokeWidth={2} name="Lufttemperatur" />
                <Line yAxisId="temp" type="monotone" dataKey="avgSoilTemp" stroke="#8b5cf6" strokeWidth={2} name="Bodentemperatur" />
                <Line yAxisId="rain" type="monotone" dataKey="totalPrecipitation" stroke="#3b82f6" strokeWidth={2} name="Niederschlag" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
