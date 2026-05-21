'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Cloud, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Upload, 
  Download,
  FolderOpen,
  AlertCircle
} from 'lucide-react';
import { isElectron } from '@/lib/utils';

interface OneDriveStatus {
  connected: boolean;
  oneDrivePath?: string;
  gartenmeisterPath?: string;
  hasAppData?: boolean;
  isRealOneDrive?: boolean;
  error?: string;
  lastCheck?: string;
}

export default function OneDriveSettings() {
  const [status, setStatus] = useState<OneDriveStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);

  useEffect(() => {
    checkOneDriveStatus();
  }, []);

  const checkOneDriveStatus = async () => {
    if (!isElectron()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const oneDriveStatus = await window.electronAPI.onedrive.checkStatus();
      setStatus(oneDriveStatus);
    } catch (error) {
      console.error('Fehler beim OneDrive-Status:', error);
      setStatus({ 
        connected: false, 
        error: 'Fehler beim Abrufen des OneDrive-Status' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!isElectron()) return;

    try {
      setSyncing(true);
      const result = await window.electronAPI.onedrive.syncData();
      setLastSyncResult(result);
      
      // Status nach Sync aktualisieren
      await checkOneDriveStatus();
      
      console.log('OneDrive-Sync abgeschlossen:', result);
    } catch (error) {
      console.error('Fehler beim OneDrive-Sync:', error);
      setLastSyncResult({ 
        success: false, 
        message: 'Synchronisation fehlgeschlagen' 
      });
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="h-5 w-5 animate-spin" />;
    if (status.connected) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusText = () => {
    if (loading) return 'Prüfe OneDrive-Status...';
    if (status.connected) {
      return status.isRealOneDrive 
        ? 'Mit OneDrive verbunden' 
        : 'Fallback-Ordner aktiv';
    }
    return 'OneDrive nicht verfügbar';
  };

  const getSyncResultIcon = () => {
    if (!lastSyncResult) return null;
    
    switch (lastSyncResult.action) {
      case 'upload':
        return <Upload className="h-4 w-4 text-blue-500" />;
      case 'download':
        return <Download className="h-4 w-4 text-green-500" />;
      case 'sync':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return lastSyncResult.success 
          ? <CheckCircle className="h-4 w-4 text-green-500" />
          : <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  if (!isElectron()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cloud className="h-5 w-5 mr-2" />
            OneDrive-Integration
          </CardTitle>
          <CardDescription>
            OneDrive-Synchronisation ist nur in der Desktop-App verfügbar
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Cloud className="h-5 w-5 mr-2" />
          OneDrive-Integration
        </CardTitle>
        <CardDescription>
          Automatische Synchronisation Ihrer GartenMeister-Daten mit OneDrive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status-Anzeige */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <p className="font-medium">{getStatusText()}</p>
              {status.oneDrivePath && (
                <p className="text-sm text-muted-foreground">
                  {status.oneDrivePath}
                </p>
              )}
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkOneDriveStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Fehler-Anzeige */}
        {status.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{status.error}</AlertDescription>
          </Alert>
        )}

        {/* OneDrive-Info */}
        {status.connected && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span>OneDrive erkannt:</span>
              <Badge variant={status.isRealOneDrive ? "default" : "secondary"}>
                {status.isRealOneDrive ? "Ja" : "Fallback"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Daten vorhanden:</span>
              <Badge variant={status.hasAppData ? "default" : "outline"}>
                {status.hasAppData ? "Ja" : "Nein"}
              </Badge>
            </div>
          </div>
        )}

        {/* Sync-Aktionen */}
        {status.connected && (
          <div className="space-y-3">
            <Button 
              onClick={handleSync} 
              disabled={syncing} 
              className="w-full"
            >
              {syncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Synchronisiere...
                </>
              ) : (
                <>
                  <Cloud className="h-4 w-4 mr-2" />
                  Jetzt synchronisieren
                </>
              )}
            </Button>

            {/* Letztes Sync-Ergebnis */}
            {lastSyncResult && (
              <Alert variant={lastSyncResult.success ? "default" : "destructive"}>
                <div className="flex items-center space-x-2">
                  {getSyncResultIcon()}
                  <AlertDescription>{lastSyncResult.message}</AlertDescription>
                </div>
              </Alert>
            )}

            {/* OneDrive-Ordner öffnen */}
            {status.gartenmeisterPath && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (window.electronAPI?.openExportFolder) {
                    // Hier könnten wir einen speziellen Handler für OneDrive-Ordner hinzufügen
                    console.log('Öffne OneDrive-Ordner:', status.gartenmeisterPath);
                  }
                }}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                OneDrive-Ordner öffnen
              </Button>
            )}
          </div>
        )}

        {/* Informationen */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Funktionsweise:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Automatische Erkennung des OneDrive-Ordners</li>
            <li>Synchronisation über lokalen OneDrive-Client</li>
            <li>Fallback auf lokalen Ordner wenn OneDrive nicht verfügbar</li>
            <li>Konfliktauflösung basierend auf Zeitstempel</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
