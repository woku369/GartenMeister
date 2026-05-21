'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Wifi, 
  WifiOff, 
  Globe, 
  Network, 
  Settings, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

/**
 * Remote NAS Konfiguration
 * Ermöglicht sowohl lokale als auch Remote-Verbindungen zur Synology NAS
 */
export default function RemoteNASConfiguration() {
  const [config, setConfig] = useState({
    local: {
      enabled: true,
      host: 'DS124-RockingK',
      ip: '192.168.0.25',
      path: 'G:\\gartenmeister',
      share: '\\\\DS124-RockingK\\Gurktaler'
    },
    remote: {
      enabled: false,
      quickconnectId: 'diwkaon',
      quickconnectUrl: 'https://quickconnect.to/diwkaon',
      username: '',
      password: '',
      sharePath: '/Gurktaler/gartenmeister',
      sessionId: null,
      lastConnected: null
    }
  });

  const [connectionStatus, setConnectionStatus] = useState({
    local: false,
    remote: false,
    activeConnection: null,
    error: null,
    testing: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Lade aktuelle Konfiguration
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/remote-nas-config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Konfiguration:', error);
    }
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/remote-nas-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        // Teste Verbindung nach dem Speichern
        await testConnection();
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Konfiguration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    setConnectionStatus(prev => ({ ...prev, testing: true }));
    
    try {
      const response = await fetch('/api/remote-nas-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const status = await response.json();
        setConnectionStatus({
          ...status,
          testing: false
        });
      }
    } catch (error) {
      setConnectionStatus({
        local: false,
        remote: false,
        activeConnection: null,
        error: error.message,
        testing: false
      });
    }
  };

  const handleConfigChange = (section, field, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const getConnectionIcon = (type) => {
    if (connectionStatus.testing) {
      return <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />;
    }
    
    if (type === 'local') {
      return connectionStatus.local ? 
        <CheckCircle className="w-4 h-4 text-green-500" /> : 
        <XCircle className="w-4 h-4 text-red-500" />;
    } else {
      return connectionStatus.remote ? 
        <CheckCircle className="w-4 h-4 text-green-500" /> : 
        <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getConnectionBadge = () => {
    if (connectionStatus.testing) {
      return <Badge variant="outline">Teste...</Badge>;
    }
    
    if (connectionStatus.activeConnection === 'local') {
      return <Badge variant="default" className="bg-green-500">Lokal verbunden</Badge>;
    } else if (connectionStatus.activeConnection === 'remote') {
      return <Badge variant="default" className="bg-blue-500">Remote verbunden</Badge>;
    } else {
      return <Badge variant="destructive">Nicht verbunden</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Remote NAS-Konfiguration</h2>
          <p className="text-muted-foreground">
            Konfiguriere den Zugriff auf deine Synology NAS - lokal oder remote
          </p>
        </div>
        {getConnectionBadge()}
      </div>

      {connectionStatus.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{connectionStatus.error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="local" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="local" className="flex items-center gap-2">
            <Network className="w-4 h-4" />
            Lokales Netzwerk
          </TabsTrigger>
          <TabsTrigger value="remote" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Remote-Zugriff
          </TabsTrigger>
        </TabsList>

        <TabsContent value="local" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="w-5 h-5" />
                    Lokale Netzwerk-Verbindung
                  </CardTitle>
                  <CardDescription>
                    Verbindung zur NAS im lokalen Netzwerk (empfohlen für beste Performance)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getConnectionIcon('local')}
                  <Switch
                    checked={config.local.enabled}
                    onCheckedChange={(checked) => handleConfigChange('local', 'enabled', checked)}
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="local-host">NAS-Hostname</Label>
                  <Input
                    id="local-host"
                    value={config.local.host}
                    onChange={(e) => handleConfigChange('local', 'host', e.target.value)}
                    placeholder="DS124-RockingK"
                    disabled={!config.local.enabled}
                  />
                </div>
                <div>
                  <Label htmlFor="local-ip">IP-Adresse</Label>
                  <Input
                    id="local-ip"
                    value={config.local.ip}
                    onChange={(e) => handleConfigChange('local', 'ip', e.target.value)}
                    placeholder="192.168.0.25"
                    disabled={!config.local.enabled}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="local-path">Lokaler Pfad</Label>
                <Input
                  id="local-path"
                  value={config.local.path}
                  onChange={(e) => handleConfigChange('local', 'path', e.target.value)}
                  placeholder="G:\\gartenmeister"
                  disabled={!config.local.enabled}
                />
              </div>

              <div>
                <Label htmlFor="local-share">Netzwerk-Share</Label>
                <Input
                  id="local-share"
                  value={config.local.share}
                  onChange={(e) => handleConfigChange('local', 'share', e.target.value)}
                  placeholder="\\\\DS124-RockingK\\Gurktaler"
                  disabled={!config.local.enabled}
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Verbindungsstatus</h4>
                    <p className="text-sm text-muted-foreground">
                      {connectionStatus.local ? 'Lokale Verbindung aktiv' : 'Keine lokale Verbindung'}
                    </p>
                  </div>
                  <Button
                    onClick={testConnection}
                    disabled={connectionStatus.testing || !config.local.enabled}
                    variant="outline"
                    size="sm"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Testen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="remote" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Remote-Zugriff über QuickConnect
                  </CardTitle>
                  <CardDescription>
                    Verbindung zur NAS über das Internet (für entfernte Geräte)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getConnectionIcon('remote')}
                  <Switch
                    checked={config.remote.enabled}
                    onCheckedChange={(checked) => handleConfigChange('remote', 'enabled', checked)}
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="remote-quickconnect-id">QuickConnect ID</Label>
                  <Input
                    id="remote-quickconnect-id"
                    value={config.remote.quickconnectId}
                    onChange={(e) => handleConfigChange('remote', 'quickconnectId', e.target.value)}
                    placeholder="diwkaon"
                    disabled={!config.remote.enabled}
                  />
                </div>
                <div>
                  <Label htmlFor="remote-quickconnect-url">QuickConnect URL</Label>
                  <Input
                    id="remote-quickconnect-url"
                    value={config.remote.quickconnectUrl}
                    onChange={(e) => handleConfigChange('remote', 'quickconnectUrl', e.target.value)}
                    placeholder="https://quickconnect.to/diwkaon"
                    disabled={!config.remote.enabled}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="remote-username">Benutzername</Label>
                  <Input
                    id="remote-username"
                    value={config.remote.username}
                    onChange={(e) => handleConfigChange('remote', 'username', e.target.value)}
                    placeholder="Benutzername"
                    disabled={!config.remote.enabled}
                  />
                </div>
                <div>
                  <Label htmlFor="remote-password">Passwort</Label>
                  <div className="relative">
                    <Input
                      id="remote-password"
                      type={showPassword ? 'text' : 'password'}
                      value={config.remote.password}
                      onChange={(e) => handleConfigChange('remote', 'password', e.target.value)}
                      placeholder="Passwort"
                      disabled={!config.remote.enabled}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="remote-share-path">Share-Pfad</Label>
                <Input
                  id="remote-share-path"
                  value={config.remote.sharePath}
                  onChange={(e) => handleConfigChange('remote', 'sharePath', e.target.value)}
                  placeholder="/Gurktaler/gartenmeister"
                  disabled={!config.remote.enabled}
                />
              </div>

              {config.remote.lastConnected && (
                <div className="text-sm text-muted-foreground">
                  Letzte Verbindung: {new Date(config.remote.lastConnected).toLocaleString()}
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Remote-Verbindungsstatus</h4>
                    <p className="text-sm text-muted-foreground">
                      {connectionStatus.remote ? 'Remote-Verbindung aktiv' : 'Keine Remote-Verbindung'}
                    </p>
                  </div>
                  <Button
                    onClick={testConnection}
                    disabled={connectionStatus.testing || !config.remote.enabled || !config.remote.username || !config.remote.password}
                    variant="outline"
                    size="sm"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Testen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Aktuelle Verbindung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Aktive Verbindung:</span>
              {getConnectionBadge()}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Lokales Netzwerk:</span>
              <div className="flex items-center gap-2">
                {getConnectionIcon('local')}
                <span className="text-sm">{connectionStatus.local ? 'Verfügbar' : 'Nicht verfügbar'}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Remote-Zugriff:</span>
              <div className="flex items-center gap-2">
                {getConnectionIcon('remote')}
                <span className="text-sm">{connectionStatus.remote ? 'Verfügbar' : 'Nicht verfügbar'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button
          onClick={loadConfiguration}
          variant="outline"
          disabled={isSaving}
        >
          <Settings className="w-4 h-4 mr-2" />
          Zurücksetzen
        </Button>
        <Button
          onClick={saveConfiguration}
          disabled={isSaving}
        >
          {isSaving ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          Konfiguration speichern
        </Button>
      </div>
    </div>
  );
}
