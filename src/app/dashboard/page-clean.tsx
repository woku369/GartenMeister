'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, MapPin, Sprout, Activity, TrendingUp, Calendar } from 'lucide-react';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
import CalendarWidget from '@/components/dashboard/CalendarWidget';
import TodoWidget from '@/components/dashboard/TodoWidget';
import TeamsWidget from '@/components/dashboard/TeamsWidget';
import WebcamWidget from '@/components/dashboard/WebcamWidget';
import GardenExportPDFButton from '@/components/ui/garden-export-pdf-button';
import { useBeds, useHerbVarieties, useSegments, useGartenConfiguration, useHarvests } from '@/lib/data-hooks-safe';

interface DashboardStats {
  totalBeds: number;
  totalVarieties: number;
  activeHerbTypes: string[];
  totalHarvests: number;
  recentHarvests: any[];
  bedsByType: { [key: string]: number };
  productivityOverview: { bedId: string; bedName: string; productivity: number }[];
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Daten laden
  const { beds } = useBeds();
  const { herbVarieties } = useHerbVarieties();
  const { segments } = useSegments();
  const { config } = useGartenConfiguration();
  const { harvests } = useHarvests();

  useEffect(() => {
    if (beds && herbVarieties && harvests !== undefined) {
      calculateDashboardStats();
    }
  }, [beds, herbVarieties, harvests]);

  const calculateDashboardStats = () => {
    setLoading(true);
    
    if (!beds || !herbVarieties) {
      setLoading(false);
      return;
    }

    try {
      // Beet-Typen analysieren
      const bedsByType: { [key: string]: number } = {};
      beds.forEach(bed => {
        const bedType = bed.type || 'Standard';
        bedsByType[bedType] = (bedsByType[bedType] || 0) + 1;
      });

      // Aktive Kräuterarten sammeln
      const activeHerbTypes = [...new Set(beds.map(bed => {
        const variety = herbVarieties.find(v => v.id === bed.varietyId);
        return variety?.name || 'Unbekannt';
      }))];

      // Produktivität berechnen
      const productivityOverview = beds.map(bed => ({
        bedId: bed.id,
        bedName: `Beet ${bed.bedNumber}`,
        productivity: bed.productivity || 100
      })).sort((a, b) => b.productivity - a.productivity);

      // Letzte Ernten
      const recentHarvests = (harvests || [])
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      const dashboardStats: DashboardStats = {
        totalBeds: beds.length,
        totalVarieties: herbVarieties.length,
        activeHerbTypes,
        totalHarvests: harvests?.length || 0,
        recentHarvests,
        bedsByType,
        productivityOverview
      };

      setStats(dashboardStats);
    } catch (error) {
      console.error('Fehler beim Berechnen der Dashboard-Statistiken:', error);
    }
    
    setLoading(false);
    setLastRefresh(new Date());
  };

  const handleRefresh = () => {
    calculateDashboardStats();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('de-DE');
    } catch {
      return dateString;
    }
  };

  if (loading || !stats) {
    return (
      <div className="container py-6">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin mr-2" />
          <p>Dashboard wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">GartenMeister Dashboard</h1>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {lastRefresh
              ? `Zuletzt aktualisiert: ${lastRefresh.toLocaleTimeString()}`
              : 'Wird geladen...'}
          </p>
          <Button
            onClick={handleRefresh}
            size="sm"
            variant="outline" 
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
          {/* PDF-Export für Gartenübersicht */}
          {beds && beds.length > 0 && (
            <GardenExportPDFButton
              beds={beds}
              segments={segments || []}
              herbVarieties={herbVarieties || []}
              gartenConfiguration={config}
            />
          )}
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Erste Spalte - Wetter und Webcam */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Wetter in Gurk</CardTitle>
              <CardDescription>Aktuelle Wetterlage und Bodentemperatur</CardDescription>
            </CardHeader>
            <CardContent>
              <WeatherWidget />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Garten-Webcam</CardTitle>
              <CardDescription>Live-Überwachung und Dokumentation</CardDescription>
            </CardHeader>
            <CardContent>
              <WebcamWidget />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Anstehende Termine</CardTitle>
            <CardDescription>Google Kalender Integration</CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarWidget />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Aufgabenliste</CardTitle>
            <CardDescription>Garten-Aufgaben und Erinnerungen</CardDescription>
          </CardHeader>
          <CardContent>
            <TodoWidget />
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Terminplaner</CardTitle>
          <CardDescription>Übersicht und Microsoft Teams Integration</CardDescription>
        </CardHeader>
        <CardContent>
          <TeamsWidget />
        </CardContent>
      </Card>

      {/* Statistik-Übersicht */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamte Beete</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBeds}</div>
            <p className="text-xs text-muted-foreground">
              Aktive Anbauflächen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kräutersorten</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVarieties}</div>
            <p className="text-xs text-muted-foreground">
              Verfügbare Sorten
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ernten</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHarvests}</div>
            <p className="text-xs text-muted-foreground">
              Aufgezeichnete Ernten
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ø Produktivität</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(stats.productivityOverview.reduce((sum, bed) => sum + bed.productivity, 0) / stats.productivityOverview.length)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Durchschnittliche Effizienz
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Beet-Typen Übersicht */}
        <Card>
          <CardHeader>
            <CardTitle>Beet-Verteilung</CardTitle>
            <CardDescription>Verteilung nach Beet-Typen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.bedsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{type}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{count} Beete</Badge>
                    <div className="w-12 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${(count / stats.totalBeds) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Aktuelle Kräuter */}
        <Card>
          <CardHeader>
            <CardTitle>Angebaute Kräuter</CardTitle>
            <CardDescription>Aktuell in den Beeten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.activeHerbTypes.map((herb, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  <Sprout className="w-3 h-3" />
                  {herb}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produktivitäts-Ranking */}
        <Card>
          <CardHeader>
            <CardTitle>Produktivitäts-Ranking</CardTitle>
            <CardDescription>Leistung der einzelnen Beete</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.productivityOverview.slice(0, 5).map((bed, index) => (
                <div key={bed.bedId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      #{index + 1}
                    </Badge>
                    <span className="text-sm font-medium">{bed.bedName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{bed.productivity}%</span>
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          bed.productivity >= 90 ? 'bg-green-500' : 
                          bed.productivity >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${bed.productivity}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Letzte Ernten */}
        <Card>
          <CardHeader>
            <CardTitle>Letzte Ernten</CardTitle>
            <CardDescription>Kürzlich durchgeführte Ernten</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentHarvests.length > 0 ? (
              <div className="space-y-3">
                {stats.recentHarvests.map((harvest, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {harvest.herbName || 'Unbekannte Sorte'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(harvest.date)}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {harvest.weight || 0}g
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="w-8 h-8 mx-auto mb-2" />
                <p>Noch keine Ernten aufgezeichnet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
