'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PlusCircle, Edit, Loader2, Trash2, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import HarvestInitiatorButton from '@/components/layout/HarvestInitiatorButton';
import GardenExportPDFButton from '@/components/ui/garden-export-pdf-button';
import { getDashboardData } from '@/lib/actions/dashboard-actions';
import type { Bed, HerbVariety, User } from '@/lib/definitions';

interface DashboardData {
  currentUser: User | null;
  beds: Bed[];
  herbs: HerbVariety[];
  harvestEvents: any[];
  isElectron: boolean;
}

export default function GardenOverviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // State für Dashboard-Daten
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dashboard-Daten laden
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🟢 Loading dashboard data...');
      
      const data = await getDashboardData();
      setDashboardData(data);
      
      console.log('✅ Dashboard data loaded successfully:', {
        user: data.currentUser?.name,
        beds: data.beds.length,
        herbs: data.herbs.length,
        isElectron: data.isElectron
      });
      
    } catch (err) {
      console.error('❌ Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Dashboard-Daten');
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Dashboard-Daten konnten nicht geladen werden."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Sichere Arrays mit useMemo
  const safeBedsArray = useMemo(() => {
    try {
      if (!dashboardData?.beds || !Array.isArray(dashboardData.beds)) {
        return [];
      }
      return dashboardData.beds.filter(bed => bed && typeof bed === 'object' && bed.id);
    } catch (err) {
      console.error('[safeBedsArray] Error:', err);
      return [];
    }
  }, [dashboardData?.beds]);

  const safeHerbsArray = useMemo(() => {
    try {
      if (!dashboardData?.herbs || !Array.isArray(dashboardData.herbs)) {
        return [];
      }
      return dashboardData.herbs.filter(herb => herb && typeof herb === 'object' && herb.id);
    } catch (err) {
      console.error('[safeHerbsArray] Error:', err);
      return [];
    }
  }, [dashboardData?.herbs]);

  // Beet löschen Funktion
  const handleDeleteBed = async (bedId: string) => {
    try {
      // TODO: Implementiere deleteBed via IPC
      toast({
        title: "Beet löschen",
        description: "Löschen-Funktion wird implementiert..."
      });
    } catch (err) {
      console.error('Error deleting bed:', err);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Beet konnte nicht gelöscht werden."
      });
    }
  };

  // Refresh Funktion
  const handleRefresh = () => {
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Lade Dashboard-Daten...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Fehler beim Laden</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard Statistics
  const stats = useMemo(() => {
    const totalBeds = safeBedsArray.length;
    const activeBeds = safeBedsArray.filter(bed => bed.status === 'bepflanzt').length;
    const totalHerbs = safeHerbsArray.length;
    const harvestEvents = dashboardData?.harvestEvents?.length || 0;

    return {
      totalBeds,
      activeBeds,
      totalHerbs,
      harvestEvents
    };
  }, [safeBedsArray, safeHerbsArray, dashboardData?.harvestEvents]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gartenübersicht</h1>
          <p className="text-muted-foreground">
            {dashboardData?.currentUser?.name ? 
              `Willkommen zurück, ${dashboardData.currentUser.name}!` : 
              'Willkommen im GartenMeister!'
            }
          </p>
          {dashboardData?.isElectron && (
            <p className="text-sm text-green-600">✅ Läuft als Portable App</p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
          <GardenExportPDFButton beds={safeBedsArray} />
          <HarvestInitiatorButton />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamte Beete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBeds}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeBeds} aktiv bepflanzt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kräutersorten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHerbs}</div>
            <p className="text-xs text-muted-foreground">
              Verfügbare Sorten
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ernte-Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.harvestEvents}</div>
            <p className="text-xs text-muted-foreground">
              Diesen Monat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.isElectron ? '💻' : '🌐'}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.isElectron ? 'Desktop App' : 'Web Version'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Beete Übersicht */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Beete Übersicht</CardTitle>
              <CardDescription>
                Verwalten Sie Ihre Gartenbeete
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/beds/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                Neues Beet
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {safeBedsArray.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Noch keine Beete vorhanden</p>
              <Button asChild>
                <Link href="/beds/new">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Erstes Beet anlegen
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Größe</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeBedsArray.map((bed) => (
                  <TableRow key={bed.id}>
                    <TableCell className="font-medium">{bed.name}</TableCell>
                    <TableCell>
                      <span className="capitalize">{bed.type}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        bed.status === 'bepflanzt' 
                          ? 'bg-green-100 text-green-800' 
                          : bed.status === 'verfuegbar'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {bed.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {bed.type === 'standard' 
                        ? `${bed.dimensions?.width || 0}×${bed.dimensions?.height || 0}m` 
                        : `${bed.segmentCount || 0} Segmente`
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => router.push(`/beds/${bed.id}/edit`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Beet bearbeiten</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteBed(bed.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Beet löschen</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Kräuter Übersicht */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Kräuter Übersicht</CardTitle>
              <CardDescription>
                Verfügbare Kräutersorten
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/herbs/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                Neue Sorte
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {safeHerbsArray.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Noch keine Kräutersorten vorhanden</p>
              <Button asChild>
                <Link href="/herbs/new">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Erste Sorte anlegen
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {safeHerbsArray.slice(0, 6).map((herb) => (
                <Card key={herb.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{herb.name}</h4>
                      <p className="text-sm text-muted-foreground">{herb.botanicalName}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      herb.isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  </div>
                </Card>
              ))}
              {safeHerbsArray.length > 6 && (
                <Card className="p-4 flex items-center justify-center">
                  <Button asChild variant="outline">
                    <Link href="/herbs">
                      {safeHerbsArray.length - 6} weitere...
                    </Link>
                  </Button>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
