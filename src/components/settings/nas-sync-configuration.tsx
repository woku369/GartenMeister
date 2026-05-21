/**
 * 🔧 NAS Sync-Konfiguration Komponente
 * Schritt 3: NAS-Konfiguration und Sync-Optionen in der UI
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  RefreshCw, 
  RotateCcw, 
  Clock, 
  Shield, 
  Database, 
  Trash2,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3
} from 'lucide-react';

interface SyncConfig {
  autoSync: boolean;
  syncInterval: number;
  conflictResolution: string;
  retryAttempts: number;
  retryDelay: number;
  enableCompression: boolean;
  enableEncryption: boolean;
  maxBackups: number;
  backupRetentionDays: number;
  paths: {
    dataPath: string;
    backupPath: string;
    logsPath: string;
    syncPath: string;
  };
  features: {
    imageSync: boolean;
    weatherSync: boolean;
    automaticMigration: boolean;
    offlineMode: boolean;
    realTimeSync: boolean;
  };
  monitoring: {
    enableLogging: boolean;
    logLevel: string;
    enableMetrics: boolean;
    enableAlerts: boolean;
  };
}

interface SyncStats {
  lastSync: string | null;
  totalSyncs: number;
  syncErrors: number;
  avgSyncTime: number;
  totalDataSize: number;
  backupCount: number;
}

export function NASSyncConfiguration() {
  const [config, setConfig] = useState<SyncConfig | null>(null);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const { toast } = useToast();

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/nas-sync');
      const result = await response.json();
      
      if (result.success) {
        setConfig(result.data.config);
        setStats(result.data.stats);
      } else {
        toast({
          title: "Fehler beim Laden",
          description: result.error || "Konfiguration konnte nicht geladen werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden der Sync-Konfiguration:', error);
      toast({
        title: "Verbindungsfehler",
        description: "Sync-Konfiguration konnte nicht geladen werden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (newConfig: SyncConfig) => {
    try {
      const response = await fetch('/api/nas-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update-config',
          config: newConfig
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setConfig(newConfig);
        toast({
          title: "Konfiguration gespeichert",
          description: "Sync-Einstellungen wurden erfolgreich aktualisiert",
          variant: "default"
        });
      } else {
        toast({
          title: "Fehler beim Speichern",
          description: result.error || "Konfiguration konnte nicht gespeichert werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Konfiguration:', error);
      toast({
        title: "Speicher-Fehler",
        description: "Konfiguration konnte nicht gespeichert werden",
        variant: "destructive"
      });
    }
  };

  const performAction = async (action: string, actionName: string, setLoadingState: (loading: boolean) => void) => {
    try {
      setLoadingState(true);
      const response = await fetch('/api/nas-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: `${actionName} erfolgreich`,
          description: result.message,
          variant: "default"
        });
        
        // Stats neu laden nach Aktionen
        if (action !== 'test-performance') {
          fetchConfig();
        }
        
        return result.data;
      } else {
        toast({
          title: `${actionName} fehlgeschlagen`,
          description: result.error || "Unbekannter Fehler",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`Fehler bei ${actionName}:`, error);
      toast({
        title: `${actionName}-Fehler`,
        description: `${actionName} konnte nicht durchgeführt werden`,
        variant: "destructive"
      });
    } finally {
      setLoadingState(false);
    }
  };

  const forceSync = () => performAction('force-sync', 'Manuelle Synchronisation', setSyncing);
  const clearBackups = () => performAction('clear-backups', 'Backup-Bereinigung', setCleaning);
  const testPerformance = () => performAction('test-performance', 'Performance-Test', setTesting);

  useEffect(() => {
    fetchConfig();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatInterval = (seconds: number) => {
    if (seconds < 60) return `${seconds} Sekunden`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} Minuten`;
    return `${Math.floor(seconds / 3600)} Stunden`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Konfiguration wird geladen...</span>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Konfiguration konnte nicht geladen werden</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sync-Status und Schnellaktionen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <RotateCcw className="w-5 h-5 mr-2" />
              Synchronisation verwalten
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchConfig}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
          </CardTitle>
          <CardDescription>
            Manuelle Sync-Aktionen und Performance-Tests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={forceSync} 
              disabled={syncing}
              className="flex items-center justify-center"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Synchronisiert...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Jetzt synchronisieren
                </>
              )}
            </Button>

            <Button 
              variant="outline"
              onClick={testPerformance} 
              disabled={testing}
            >
              {testing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Teste...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Performance-Test
                </>
              )}
            </Button>

            <Button 
              variant="outline"
              onClick={clearBackups} 
              disabled={cleaning}
            >
              {cleaning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Bereinigt...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Backups bereinigen
                </>
              )}
            </Button>
          </div>

          {/* Statistiken */}
          {stats && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.backupCount}</div>
                <div className="text-sm text-muted-foreground">Backups</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formatBytes(stats.totalDataSize)}</div>
                <div className="text-sm text-muted-foreground">Datengröße</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.totalSyncs}</div>
                <div className="text-sm text-muted-foreground">Gesamt-Syncs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.syncErrors}</div>
                <div className="text-sm text-muted-foreground">Fehler</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync-Einstellungen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Synchronisation-Einstellungen
          </CardTitle>
          <CardDescription>
            Konfiguration der automatischen Datensynchronisation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-Sync */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-sync">Automatische Synchronisation</Label>
              <p className="text-sm text-muted-foreground">
                Daten automatisch mit NAS synchronisieren
              </p>
            </div>
            <Switch
              id="auto-sync"
              checked={config.autoSync}
              onCheckedChange={(checked) => {
                const newConfig = { ...config, autoSync: checked };
                setConfig(newConfig);
                updateConfig(newConfig);
              }}
            />
          </div>

          <Separator />

          {/* Sync-Intervall */}
          <div>
            <Label>Sync-Intervall: {formatInterval(config.syncInterval)}</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Wie oft soll automatisch synchronisiert werden?
            </p>
            <Slider
              value={[config.syncInterval]}
              onValueChange={([value]) => {
                const newConfig = { ...config, syncInterval: value };
                setConfig(newConfig);
              }}
              onValueCommit={([value]) => {
                const newConfig = { ...config, syncInterval: value };
                updateConfig(newConfig);
              }}
              min={60}
              max={3600}
              step={60}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1 Min</span>
              <span>1 Std</span>
            </div>
          </div>

          <Separator />

          {/* Konfliktlösung */}
          <div>
            <Label htmlFor="conflict-resolution">Konfliktlösung</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Wie sollen Datenkonflikte behandelt werden?
            </p>
            <Select
              value={config.conflictResolution}
              onValueChange={(value) => {
                const newConfig = { ...config, conflictResolution: value };
                setConfig(newConfig);
                updateConfig(newConfig);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timestamp">Neueste Version gewinnt</SelectItem>
                <SelectItem value="manual">Manuelle Auflösung</SelectItem>
                <SelectItem value="backup">Backup erstellen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Erweiterte Optionen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Erweiterte Optionen
          </CardTitle>
          <CardDescription>
            Backup-Strategien und Performance-Einstellungen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Feature-Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Komprimierung</Label>
                <p className="text-xs text-muted-foreground">Reduziert Speicherplatz</p>
              </div>
              <Switch
                checked={config.enableCompression}
                onCheckedChange={(checked) => {
                  const newConfig = { ...config, enableCompression: checked };
                  setConfig(newConfig);
                  updateConfig(newConfig);
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Echtzeit-Sync</Label>
                <p className="text-xs text-muted-foreground">Sofortige Synchronisation</p>
              </div>
              <Switch
                checked={config.features.realTimeSync}
                onCheckedChange={(checked) => {
                  const newConfig = {
                    ...config,
                    features: { ...config.features, realTimeSync: checked }
                  };
                  setConfig(newConfig);
                  updateConfig(newConfig);
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Bilder-Sync</Label>
                <p className="text-xs text-muted-foreground">Automatische Bildsynchronisation</p>
              </div>
              <Switch
                checked={config.features.imageSync}
                onCheckedChange={(checked) => {
                  const newConfig = {
                    ...config,
                    features: { ...config.features, imageSync: checked }
                  };
                  setConfig(newConfig);
                  updateConfig(newConfig);
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Offline-Modus</Label>
                <p className="text-xs text-muted-foreground">Arbeiten ohne NAS</p>
              </div>
              <Switch
                checked={config.features.offlineMode}
                onCheckedChange={(checked) => {
                  const newConfig = {
                    ...config,
                    features: { ...config.features, offlineMode: checked }
                  };
                  setConfig(newConfig);
                  updateConfig(newConfig);
                }}
              />
            </div>
          </div>

          <Separator />

          {/* Backup-Einstellungen */}
          <div>
            <Label>Maximale Backup-Anzahl: {config.maxBackups}</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Wie viele Backups sollen aufbewahrt werden?
            </p>
            <Slider
              value={[config.maxBackups]}
              onValueChange={([value]) => {
                const newConfig = { ...config, maxBackups: value };
                setConfig(newConfig);
              }}
              onValueCommit={([value]) => {
                const newConfig = { ...config, maxBackups: value };
                updateConfig(newConfig);
              }}
              min={5}
              max={50}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>5</span>
              <span>50</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status-Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Ihre NAS-Synchronisierung ist vollständig konfiguriert.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
