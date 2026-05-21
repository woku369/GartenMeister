'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
import CalendarWidget from '@/components/dashboard/CalendarWidget';
import TodoWidget from '@/components/dashboard/TodoWidget';
import TeamsWidget from '@/components/dashboard/TeamsWidget';
import WebcamWidget from '@/components/dashboard/WebcamWidget';
import GardenExportPDFButton from '@/components/ui/garden-export-pdf-button';
import { useBeds, useHerbVarieties, useSegments, useGartenConfiguration } from '@/lib/data-hooks-safe';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Daten für PDF-Export laden
  const { beds } = useBeds();
  const { herbVarieties } = useHerbVarieties();
  const { segments } = useSegments();
  const { config } = useGartenConfiguration();

  useEffect(() => {
    // Simuliere das Laden von Dashboard-Daten
    const loadDashboardData = async () => {
      setLoading(true);
      // Hier würden wir normalerweise Daten laden
      setTimeout(() => {
        setLoading(false);
        setLastRefresh(new Date());
      }, 500); // Reduzierte Zeit für schnelleres Testing
    };

    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setLastRefresh(new Date());
    }, 1000);
  };

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

      <Card>
        <CardHeader>
          <CardTitle>Terminplaner</CardTitle>
          <CardDescription>Übersicht und Microsoft Teams Integration</CardDescription>
        </CardHeader>
        <CardContent>
          <TeamsWidget />
        </CardContent>
      </Card>
    </div>
  );
}
