/**
 * 🖥️ NAS Status Dashboard Komponente
 * Schritt 2: NAS-Status-Anzeige für Settings-Tab
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  HardDrive, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Wifi, 
  Database, 
  FolderOpen,
  Clock,
  Activity
} from 'lucide-react';

interface NASStatus {
  available: boolean;
  connected: boolean;
  hasData: boolean;
  lastSync?: string;
  error?: string;
  timestamp?: string;
  features?: {
    imageStorage: boolean;
    weatherData: boolean;
    remoteAccess: boolean;
    autoBackup: boolean;
    multiClient: boolean;
  };
  paths?: {
    base: string;
    images: string;
    data: string;
    weather: string;
    backups: string;
  };
  pathChecks?: Record<string, boolean>;
  storage?: {
    available: boolean;
    drive?: string;
    message: string;
  };
}

interface TestResult {
  testResult: {
    timestamp: string;
    tests: {
      driveExists: { success: boolean; message: string };
      writeTest: { success: boolean; message: string };
      directoryStructure: { 
        success: boolean; 
        directories: Record<string, boolean> 
      };
    };
  };
  overallSuccess: boolean;
  message: string;
}

export function NASStatusDashboard() {
  const [status, setStatus] = useState<NASStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const { toast } = useToast();

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/nas-status');
      const result = await response.json();
      
      if (result.success) {
        setStatus(result.data);
      } else {
        toast({
          title: "Fehler beim Laden des NAS-Status",
          description: result.error || "Unbekannter Fehler",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden des NAS-Status:', error);
      toast({
        title: "Verbindungsfehler",
        description: "NAS-Status konnte nicht geladen werden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runConnectionTest = async () => {
    try {
      setTesting(true);
      const response = await fetch('/api/nas-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'test-connection' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTestResult(result.data);
        toast({
          title: "Verbindungstest abgeschlossen",
          description: result.data.message,
          variant: result.data.overallSuccess ? "default" : "destructive"
        });
      } else {
        toast({
          title: "Test fehlgeschlagen",
          description: result.error || "Unbekannter Fehler",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Fehler beim Verbindungstest:', error);
      toast({
        title: "Test-Fehler",
        description: "Verbindungstest konnte nicht durchgeführt werden",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const getStatusIcon = (connected: boolean, available: boolean) => {
    if (!available) return <XCircle className="w-5 h-5 text-red-500" />;
    if (connected) return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  const getStatusText = (connected: boolean, available: boolean) => {
    if (!available) return "Nicht verfügbar";
    if (connected) return "Verbunden";
    return "Getrennt";
  };

  const getStatusColor = (connected: boolean, available: boolean) => {
    if (!available) return "destructive";
    if (connected) return "default";
    return "secondary";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Status wird geladen...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Haupt-Status-Karte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <HardDrive className="w-5 h-5 mr-2" />
              Synology DS124 NAS-Status
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchStatus}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
          </CardTitle>
          <CardDescription>
            Aktuelle Verbindung und Verfügbarkeit der NAS-Integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status ? (
            <div className="space-y-4">
              {/* Status-Übersicht */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(status.connected, status.available)}
                  <div>
                    <div className="font-medium">
                      {getStatusText(status.connected, status.available)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {status.timestamp && `Zuletzt geprüft: ${new Date(status.timestamp).toLocaleString()}`}
                    </div>
                  </div>
                </div>
                <Badge variant={getStatusColor(status.connected, status.available)}>
                  {status.connected ? 'Online' : 'Offline'}
                </Badge>
              </div>

              {/* Fehlerbehandlung */}
              {status.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <XCircle className="w-4 h-4 text-red-500 mr-2" />
                    <span className="text-sm text-red-700">{status.error}</span>
                  </div>
                </div>
              )}

              <Separator />

              {/* Features-Status */}
              {status.features && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Verfügbare Features
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm">Bilderspeicherung</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm">Wetterdaten</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm">Remote-Zugriff</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm">Auto-Backup</span>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Pfad-Informationen */}
              {status.paths && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Speicherpfade
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Basis:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {status.paths.base}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bilder:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {status.paths.images}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Daten:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {status.paths.data}
                      </code>
                    </div>
                  </div>
                </div>
              )}

              {/* Letzte Synchronisation */}
              {status.lastSync && (
                <div>
                  <div className="flex items-center mb-2">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="font-medium">Letzte Synchronisation</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(status.lastSync).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Status konnte nicht geladen werden</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verbindungstest */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wifi className="w-5 h-5 mr-2" />
            Verbindungstest
          </CardTitle>
          <CardDescription>
            Detaillierte Diagnose der NAS-Verbindung
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={runConnectionTest} 
              disabled={testing}
              className="w-full"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Test läuft...
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 mr-2" />
                  Verbindungstest starten
                </>
              )}
            </Button>

            {/* Test-Ergebnisse */}
            {testResult && testResult.testResult?.tests && (
              <div className="space-y-3">
                <Separator />
                <div className="space-y-2">
                  {Object.entries(testResult.testResult.tests).map(([testName, result]) => (
                    <div key={testName} className="flex items-center justify-between">
                      <span className="text-sm capitalize">
                        {testName.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className="flex items-center">
                        {result.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {result.message}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 p-3 rounded-lg bg-muted">
                  <div className="text-sm font-medium">
                    Gesamtergebnis: {testResult.message}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Getestet am: {new Date(testResult.testResult.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
