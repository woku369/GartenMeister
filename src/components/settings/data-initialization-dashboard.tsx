'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Download,
  Upload,
  Clock,
  Info
} from 'lucide-react';

/**
 * Dateninitialisierungs-Dashboard
 * Überwacht und verwaltet die sichere Dateninitialisierung
 */
export default function DataInitializationDashboard() {
  const [initStatus, setInitStatus] = useState({
    initialized: false,
    timestamp: null,
    source: null,
    loading: true
  });
  
  const [dataStatus, setDataStatus] = useState({
    hasRemoteData: false,
    hasLocalData: false,
    hasBackupData: false,
    dataCount: {
      beds: 0,
      herbVarieties: 0,
      segments: 0
    }
  });
  
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    checkInitializationStatus();
  }, []);

  const checkInitializationStatus = async () => {
    try {
      const response = await fetch('/api/data-initialization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-initialization' })
      });
      
      if (response.ok) {
        const result = await response.json();
        setInitStatus({
          initialized: result.initialized,
          timestamp: result.timestamp,
          source: result.source,
          loading: false
        });
      }
    } catch (error) {
      console.error('Fehler beim Prüfen des Initialisierungsstatus:', error);
      setInitStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const performSafeInitialization = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch('/api/data-initialization');
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          setDataStatus({
            hasRemoteData: result.data.dataSource.includes('remote'),
            hasLocalData: result.data.dataSource.includes('local'),
            hasBackupData: result.data.dataSource.includes('backup'),
            dataCount: {
              beds: result.data.beds?.length || 0,
              herbVarieties: result.data.herbVarieties?.length || 0,
              segments: result.data.segments?.length || 0
            }
          });
          
          await checkInitializationStatus();
        }
      }
    } catch (error) {
      console.error('Fehler bei der Initialisierung:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const forceReinitialization = async () => {
    if (!confirm('Möchten Sie eine Neuinitialisierung durchführen? Dies lädt die aktuellsten verfügbaren Daten.')) {
      return;
    }
    
    setIsInitializing(true);
    try {
      const response = await fetch('/api/data-initialization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force-reinitialization' })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await checkInitializationStatus();
          alert('Neuinitialisierung erfolgreich abgeschlossen!');
        }
      }
    } catch (error) {
      console.error('Fehler bei der Neuinitialisierung:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const getSourceBadge = (source) => {
    switch (source) {
      case 'remote-nas':
        return <Badge variant="default" className="bg-blue-500">Remote NAS</Badge>;
      case 'local-nas':
        return <Badge variant="default" className="bg-green-500">Lokale NAS</Badge>;
      case 'local-backup':
        return <Badge variant="secondary">Lokales Backup</Badge>;
      case 'seed-file':
        return <Badge variant="outline">Seed-Datei</Badge>;
      case 'embedded-seed':
        return <Badge variant="outline">Eingebaute Daten</Badge>;
      default:
        return <Badge variant="destructive">Unbekannt</Badge>;
    }
  };

  if (initStatus.loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Dateninitialisierung
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Prüfe Initialisierungsstatus...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Sichere Dateninitialisierung
          </CardTitle>
          <CardDescription>
            Überwacht und verwaltet die sichere Ladung von Gartendaten bei App-Installation
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              {initStatus.initialized ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">Initialisiert</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-600">Nicht initialisiert</span>
                </>
              )}
            </div>
            
            {initStatus.source && getSourceBadge(initStatus.source)}
          </div>

          {initStatus.timestamp && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Letzte Initialisierung: {new Date(initStatus.timestamp).toLocaleString()}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{dataStatus.dataCount.beds}</div>
              <div className="text-sm text-muted-foreground">Beete</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{dataStatus.dataCount.herbVarieties}</div>
              <div className="text-sm text-muted-foreground">Kräuterarten</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{dataStatus.dataCount.segments}</div>
              <div className="text-sm text-muted-foreground">Segmente</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datenschutz-Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-500" />
            <div>
              <div className="font-medium">Überschreibungsschutz</div>
              <div className="text-sm text-muted-foreground">
                Verhindert, dass leere Daten bestehende Datenbestände überschreiben
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-500" />
            <div>
              <div className="font-medium">Automatische Quellenerkennung</div>
              <div className="text-sm text-muted-foreground">
                Lädt automatisch die neuesten verfügbaren Daten (Remote → Lokal → Backup)
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-purple-500" />
            <div>
              <div className="font-medium">Sichere Synchronisation</div>
              <div className="text-sm text-muted-foreground">
                Speichert Daten nur wenn sie gültig und vollständig sind
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Wichtig:</strong> Die Dateninitialisierung stellt sicher, dass neue App-Installationen 
          immer Ihre bestehenden Gartendaten laden und niemals leere Daten über Ihren aktuellen 
          Datenbestand speichern.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between gap-4">
        <Button
          onClick={performSafeInitialization}
          disabled={isInitializing}
          variant="default"
        >
          {isInitializing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white border-opacity-60 mr-2" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Sichere Initialisierung
        </Button>
        
        <Button
          onClick={forceReinitialization}
          disabled={isInitializing}
          variant="outline"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Neuinitialisierung
        </Button>
        
        <Button
          onClick={checkInitializationStatus}
          disabled={isInitializing}
          variant="ghost"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Status aktualisieren
        </Button>
      </div>
    </div>
  );
}
