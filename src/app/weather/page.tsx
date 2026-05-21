import { 
  getWeatherStatistics,
  getWeatherData 
} from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WeatherStatisticsCharts from '@/components/weather/WeatherStatisticsCharts';
import WeatherDataTable from '@/components/weather/WeatherDataTable';
import WeatherOverview from '@/components/weather/WeatherOverview';
import { CloudRain, Thermometer, Wind, Droplets } from 'lucide-react';

export default async function WeatherStatsPage() {
  const [weatherData, weatherStats] = await Promise.all([
    getWeatherData(),
    getWeatherStatistics()
  ]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Gartenwerkzeuge</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CloudRain className="h-4 w-4" />
          Wetterstatistiken für Gurk, Österreich
        </div>
      </div>

      {/* Übersicht */}
      <WeatherOverview weatherStats={weatherStats} />

      {/* Hauptinhalt mit Tabs */}
      <Tabs defaultValue="charts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <Thermometer className="h-4 w-4" />
            Jahresgraphen
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            Datentabelle
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Wind className="h-4 w-4" />
            Analyse
          </TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          <WeatherStatisticsCharts 
            weatherData={weatherData} 
            weatherStats={weatherStats} 
          />
        </TabsContent>

        <TabsContent value="table" className="space-y-6">
          <WeatherDataTable weatherData={weatherData} />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ertragsanalyse</CardTitle>
              <CardDescription>
                Korrelation zwischen Wetterbedingungen und Ernteerträgen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <CloudRain className="mx-auto h-12 w-12 mb-4 opacity-70" />
                <p className="text-lg font-semibold">Ertragsanalyse in Entwicklung</p>
                <p>Diese Funktion wird verfügbar, sobald genügend Ernte- und Wetterdaten gesammelt wurden.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
