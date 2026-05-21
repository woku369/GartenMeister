'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  HardDrive, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Download,
  RefreshCw,
  Monitor,
  FileText,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MonitoringData {
  status: string;
  performance: {
    pingTime: number | null;
    diskSpace: {
      used: string;
      available: string;
      total: string;
      usagePercent: number;
    } | null;
    syncLatency: number | null;
    lastSyncTime: string | null;
  };
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    details?: any;
  }>;
  connectivity: {
    pingStatus: boolean;
    smbStatus: boolean;
    driveStatus: boolean;
    lastCheck: string;
  };
  diagnostics: {
    fileOperations: {
      reads: number;
      writes: number;
      errors: number;
      avgResponseTime: number;
    };
    syncHistory: Array<{
      timestamp: string;
      status: string;
      filesChanged: number;
      duration: number;
    }>;
  };
}

export function NASMonitoringDashboard() {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { toast } = useToast();

  const loadMonitoringData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/nas-monitoring');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setMonitoringData(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Fehler beim Laden der Monitoring-Daten:', error);
      toast({
        title: 'Fehler',
        description: 'Monitoring-Daten konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      const response = await fetch('/api/nas-monitoring?export=logs');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `nas-logs-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Export erfolgreich',
        description: 'Logs wurden heruntergeladen.',
      });
    } catch (error) {
      toast({
        title: 'Export fehlgeschlagen',
        description: 'Logs konnten nicht exportiert werden.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadMonitoringData();
    
    // Auto-Refresh alle 30 Sekunden
    const interval = setInterval(() => {
      loadMonitoringData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'disconnected': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading && !monitoringData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            NAS-Monitoring & Diagnose
          </CardTitle>
          <CardDescription>
            System-Performance, Logs und Troubleshooting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Lade Monitoring-Daten...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              NAS-Monitoring & Diagnose
            </CardTitle>
            <CardDescription>
              System-Performance, Logs und Troubleshooting
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Letztes Update: {lastRefresh.toLocaleTimeString()}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadMonitoringData}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {monitoringData ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Übersicht</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="diagnostics">Diagnose</TabsTrigger>
            </TabsList>

            {/* Übersicht */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* System-Status */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      System-Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">NAS-Verbindung</span>
                        <Badge variant={monitoringData.status === 'connected' ? 'default' : 'destructive'}>
                          {monitoringData.status === 'connected' ? 'Verbunden' : 'Getrennt'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Ping</span>
                        {getStatusIcon(monitoringData.connectivity.pingStatus)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">SMB</span>
                        {getStatusIcon(monitoringData.connectivity.smbStatus)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Laufwerk</span>
                        {getStatusIcon(monitoringData.connectivity.driveStatus)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Speicherplatz */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <HardDrive className="w-4 h-4" />
                      Speicherplatz
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {monitoringData.performance.diskSpace ? (
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Belegt</span>
                          <span>{monitoringData.performance.diskSpace.used}</span>
                        </div>
                        <Progress 
                          value={monitoringData.performance.diskSpace.usagePercent} 
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Verfügbar: {monitoringData.performance.diskSpace.available}</span>
                          <span>Gesamt: {monitoringData.performance.diskSpace.total}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Keine Daten verfügbar</p>
                    )}
                  </CardContent>
                </Card>

                {/* Performance */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Ping-Zeit</span>
                        <span>{monitoringData.performance.pingTime ? `${monitoringData.performance.pingTime}ms` : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Sync-Latenz</span>
                        <span>{monitoringData.performance.syncLatency ? `${monitoringData.performance.syncLatency}ms` : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Ø Antwortzeit</span>
                        <span>{monitoringData.diagnostics.fileOperations.avgResponseTime}ms</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Performance Details */}
            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Datei-Operationen */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Datei-Operationen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Lesevorgänge</span>
                        <span className="font-medium">{monitoringData.diagnostics.fileOperations.reads}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Schreibvorgänge</span>
                        <span className="font-medium">{monitoringData.diagnostics.fileOperations.writes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Fehler</span>
                        <span className="font-medium text-red-600">{monitoringData.diagnostics.fileOperations.errors}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Ø Antwortzeit</span>
                        <span className="font-medium">{monitoringData.diagnostics.fileOperations.avgResponseTime}ms</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sync-Verlauf */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Letzte Sync-Vorgänge</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-32">
                      {monitoringData.diagnostics.syncHistory.length > 0 ? (
                        <div className="space-y-2">
                          {monitoringData.diagnostics.syncHistory.slice(0, 5).map((sync, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Badge variant={sync.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                                  {sync.status}
                                </Badge>
                                <span>{sync.filesChanged} Dateien</span>
                              </div>
                              <div className="text-muted-foreground">
                                {new Date(sync.timestamp).toLocaleTimeString()} ({sync.duration}ms)
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Keine Sync-Daten verfügbar</p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Logs */}
            <TabsContent value="logs" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">System-Logs</h3>
                <Button variant="outline" size="sm" onClick={exportLogs}>
                  <Download className="w-4 h-4 mr-2" />
                  Logs exportieren
                </Button>
              </div>
              
              <Card>
                <CardContent className="p-0">
                  <ScrollArea className="h-96">
                    <div className="p-4 space-y-2">
                      {monitoringData.logs.length > 0 ? (
                        monitoringData.logs.map((log, index) => (
                          <div key={index} className="flex gap-3 py-2 border-b border-gray-100 last:border-b-0">
                            <div className="text-xs text-muted-foreground min-w-20">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </div>
                            <div className={`text-xs font-medium min-w-16 ${getLevelColor(log.level)}`}>
                              {log.level.toUpperCase()}
                            </div>
                            <div className="text-sm flex-1">
                              {log.message}
                              {log.details && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {JSON.stringify(log.details, null, 2)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Keine Logs verfügbar
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Diagnose */}
            <TabsContent value="diagnostics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Konnektivitäts-Tests */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Konnektivitäts-Tests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Netzwerk-Ping</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(monitoringData.connectivity.pingStatus)}
                          <span className="text-xs text-muted-foreground">
                            {monitoringData.performance.pingTime ? `${monitoringData.performance.pingTime}ms` : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">SMB-Verbindung</span>
                        {getStatusIcon(monitoringData.connectivity.smbStatus)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Laufwerk-Zugriff</span>
                        {getStatusIcon(monitoringData.connectivity.driveStatus)}
                      </div>
                      <div className="text-xs text-muted-foreground pt-2">
                        Letzter Check: {new Date(monitoringData.connectivity.lastCheck).toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sync-Informationen */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Synchronisation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Letzter Sync</span>
                        <span className="text-sm font-medium">
                          {monitoringData.performance.lastSyncTime ? 
                            new Date(monitoringData.performance.lastSyncTime).toLocaleString() : 
                            'Nie'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Erfolgreiche Syncs</span>
                        <span className="text-sm font-medium text-green-600">
                          {monitoringData.diagnostics.syncHistory.filter(s => s.status === 'success').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Fehlgeschlagene Syncs</span>
                        <span className="text-sm font-medium text-red-600">
                          {monitoringData.diagnostics.syncHistory.filter(s => s.status !== 'success').length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Troubleshooting-Tipps */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Troubleshooting
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    {!monitoringData.connectivity.pingStatus && (
                      <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded">
                        <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                        <div>
                          <strong>Netzwerk-Problem:</strong> NAS nicht erreichbar. 
                          Prüfen Sie die Netzwerkverbindung und NAS-IP-Adresse.
                        </div>
                      </div>
                    )}
                    
                    {!monitoringData.connectivity.smbStatus && monitoringData.connectivity.pingStatus && (
                      <div className="flex gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <div>
                          <strong>SMB-Problem:</strong> Freigabe nicht verfügbar. 
                          Prüfen Sie Benutzerrechte und SMB-Einstellungen.
                        </div>
                      </div>
                    )}
                    
                    {monitoringData.diagnostics.fileOperations.errors > 0 && (
                      <div className="flex gap-2 p-3 bg-orange-50 border border-orange-200 rounded">
                        <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                        <div>
                          <strong>Datei-Fehler:</strong> {monitoringData.diagnostics.fileOperations.errors} 
                          Fehler bei Datei-Operationen. Prüfen Sie Schreibrechte.
                        </div>
                      </div>
                    )}
                    
                    {monitoringData.performance.diskSpace?.usagePercent && monitoringData.performance.diskSpace.usagePercent > 90 && (
                      <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                        <div>
                          <strong>Speicher voll:</strong> Weniger als 10% Speicherplatz verfügbar. 
                          Löschen Sie nicht benötigte Dateien.
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <Monitor className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Keine Monitoring-Daten</h3>
            <p className="text-muted-foreground mb-4">
              Monitoring-Daten konnten nicht geladen werden.
            </p>
            <Button onClick={loadMonitoringData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Erneut versuchen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
