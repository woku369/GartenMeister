'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  HardDrive, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Upload, 
  Download,
  FolderOpen,
  AlertCircle,
  Settings,
  RotateCcw,
  Files
} from 'lucide-react';
import { isElectron } from '@/lib/utils';
import { electronAPI } from '@/lib/electron-bridge';

interface OneDriveBackup {
  fileName: string;
  fullPath: string;
  modifiedDate: string;
  size: number;
}

interface OneDriveConfig {
  isInitialized: boolean;
  isConnected: boolean;
  oneDrivePath?: string;
  gartenmeisterPath?: string;
  customPath?: string;
  error?: string;
}

export default function OneDriveManager() {
  const [status, setStatus] = useState<any>(null);
  const [config, setConfig] = useState<OneDriveConfig | null>(null);
  const [backups, setBackups] = useState<OneDriveBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [customPath, setCustomPath] = useState('');
  const [showCustomPath, setShowCustomPath] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    loadOneDriveData();
  }, []);

  const loadOneDriveData = async () => {
    if (!isElectron()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [statusResult, configResult] = await Promise.all([
        electronAPI.onedrive.checkStatus(),
        electronAPI.onedrive.getConfiguration()
      ]);
      setStatus(statusResult);
      setConfig(configResult);
    } catch (error) {
      console.error('Fehler beim Laden der OneDrive-Daten:', error);
      setMessage({ type: 'error', text: 'Fehler beim Laden der OneDrive-Konfiguration' });
    } finally {
      setLoading(false);
    }
  };

  const loadBackups = async () => {
    if (!isElectron()) return;

    try {
      setLoadingBackups(true);
      const backupFiles = await electronAPI.onedrive.listBackups();
      setBackups(backupFiles);
      setMessage({ type: 'info', text: `${backupFiles.length} Backup-Dateien gefunden` });
    } catch (error) {
      console.error('Fehler beim Laden der Backup-Dateien:', error);
      setMessage({ type: 'error', text: 'Fehler beim Laden der Backup-Dateien' });
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleSync = async () => {
    if (!isElectron()) return;

    setSyncing(true);
    setMessage(null);
    try {
      const result = await electronAPI.onedrive.syncData();
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Synchronisation erfolgreich: ${result.message || result.action}` 
        });
        await loadOneDriveData();
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message || 'Synchronisation fehlgeschlagen' 
        });
      }
    } catch (error) {
      console.error('Sync-Fehler:', error);
      setMessage({ type: 'error', text: 'Fehler bei der Synchronisation' });
    } finally {
      setSyncing(false);
    }
  };

  const handleRestoreBackup = async (backup: OneDriveBackup) => {
    if (!confirm(`Möchten Sie wirklich das Backup "${backup.fileName}" wiederherstellen?\n\nDies überschreibt Ihre aktuellen Daten!`)) {
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const result = await electronAPI.onedrive.restoreBackup(backup.fullPath);
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: 'Backup erfolgreich wiederhergestellt. Bitte starten Sie die App neu, um die Änderungen zu sehen.' 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message || 'Backup-Wiederherstellung fehlgeschlagen' 
        });
      }
    } catch (error) {
      console.error('Restore-Fehler:', error);
      setMessage({ type: 'error', text: 'Fehler bei der Backup-Wiederherstellung' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetCustomPath = async () => {
    if (!customPath.trim()) {
      setMessage({ type: 'error', text: 'Bitte geben Sie einen gültigen Pfad ein' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const result = await electronAPI.onedrive.setCustomPath(customPath);
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: 'OneDrive-Pfad erfolgreich gesetzt' 
        });
        await loadOneDriveData();
        setShowCustomPath(false);
        setCustomPath('');
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message || 'Pfad konnte nicht gesetzt werden' 
        });
      }
    } catch (error) {
      console.error('Pfad-Fehler:', error);
      setMessage({ type: 'error', text: 'Fehler beim Setzen des Pfads' });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('de-DE');
  };

  if (!isElectron()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            OneDrive-Manager
          </CardTitle>
          <CardDescription>
            OneDrive-Funktionen sind nur in der Desktop-Version verfügbar.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading && !status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            OneDrive-Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Lade OneDrive-Status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Nachrichten */}
      {message && (
        <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 
                        message.type === 'success' ? 'border-green-200 bg-green-50' : 
                        'border-blue-200 bg-blue-50'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* OneDrive-Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            OneDrive-Status
          </CardTitle>
          <CardDescription>
            Verbindungsstatus und Konfiguration Ihrer OneDrive-Integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            {status?.connected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="font-medium">
              {status?.connected ? 'Verbunden' : 'Nicht verbunden'}
            </span>
            <Badge variant={status?.connected ? 'default' : 'destructive'}>
              {status?.connected ? 'Aktiv' : 'Inaktiv'}
            </Badge>
          </div>

          {config?.oneDrivePath && (
            <div className="text-sm text-gray-600">
              <strong>OneDrive-Pfad:</strong> {config.oneDrivePath}
            </div>
          )}

          {config?.gartenmeisterPath && (
            <div className="text-sm text-gray-600">
              <strong>GartenMeister-Ordner:</strong> {config.gartenmeisterPath}
            </div>
          )}

          {config?.customPath && (
            <div className="text-sm text-gray-600">
              <strong>Benutzerdefinierter Pfad:</strong> {config.customPath}
            </div>
          )}

          {status?.error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{status.error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleSync} 
              disabled={syncing || loading}
              className="flex items-center gap-2"
            >
              {syncing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {syncing ? 'Synchronisiere...' : 'Jetzt synchronisieren'}
            </Button>

            <Button 
              variant="outline" 
              onClick={loadOneDriveData}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Status aktualisieren
            </Button>

            <Button 
              variant="outline" 
              onClick={() => setShowCustomPath(!showCustomPath)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Pfad konfigurieren
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Benutzerdefinierter Pfad */}
      {showCustomPath && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              OneDrive-Pfad konfigurieren
            </CardTitle>
            <CardDescription>
              Setzen Sie einen benutzerdefinierten OneDrive-Pfad, falls die automatische Erkennung fehlschlägt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="C:\Users\IhrName\OneDrive"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleSetCustomPath}
                disabled={loading || !customPath.trim()}
              >
                Pfad setzen
              </Button>
            </div>
            <div className="text-sm text-gray-500">
              Beispiel: C:\Users\IhrName\OneDrive oder C:\Users\IhrName\OneDrive - Firmenname
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup-Manager */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Files className="h-5 w-5" />
            Backup-Manager
          </CardTitle>
          <CardDescription>
            Importieren Sie Ihre Daten von einem anderen Computer als Anfangsbestand
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={loadBackups}
              disabled={loadingBackups}
              className="flex items-center gap-2"
            >
              {loadingBackups ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {loadingBackups ? 'Lade...' : 'Backup-Dateien suchen'}
            </Button>
          </div>

          {backups.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Gefundene Backup-Dateien:</h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {backups.map((backup, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{backup.fileName}</div>
                      <div className="text-sm text-gray-500">
                        {formatDate(backup.modifiedDate)} • {formatFileSize(backup.size)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleRestoreBackup(backup)}
                      disabled={loading}
                      className="flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Wiederherstellen
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {backups.length === 0 && loadingBackups === false && (
            <div className="text-center py-8 text-gray-500">
              <Files className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Keine Backup-Dateien gefunden</p>
              <p className="text-sm">Klicken Sie auf "Backup-Dateien suchen", um zu beginnen</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
