/**
 * 🌐 Remote NAS Connection Settings
 * 
 * Ermöglicht Konfiguration von Remote-Zugriff auf Synology NAS:
 * - QuickConnect (https://quickconnect.to/diwkaon)
 * - Lokales Netzwerk als Fallback
 * - Benutzerdefinierte Verbindungseinstellungen
 * 
 * Version: 1.0.0
 * Datum: 10.07.2025
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Globe, 
  Wifi, 
  Lock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Settings,
  TestTube,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';

interface RemoteConnectionConfig {
  quickConnect: {
    enabled: boolean;
    id: string;
    url: string;
  };
  local: {
    enabled: boolean;
    host: string;
    ip: string;
    port: number;
    useHTTPS: boolean;
  };
  auth: {
    username: string;
    password: string;
    remember: boolean;
  };
  paths: {
    basePath: string;
    dataPath: string;
    imagesPath: string;
    backupPath: string;
  };
}

export default function RemoteNASConnectionSettings() {
  const { toast } = useToast();
  const [config, setConfig] = useState<RemoteConnectionConfig>({
    quickConnect: {
      enabled: true,
      id: 'diwkaon',
      url: 'https://quickconnect.to/diwkaon'
    },
    local: {
      enabled: true,
      host: 'DS124-RockingK',
      ip: '192.168.0.25',
      port: 5000,
      useHTTPS: false
    },
    auth: {
      username: '',
      password: '',
      remember: false
    },
    paths: {
      basePath: '/Gurktaler/gartenmeister',
      dataPath: '/data',
      imagesPath: '/images',
      backupPath: '/data/backups'
    }
  });

  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    method: string;
    server: string;
    lastTest: string;
    error?: string;
  }>({
    connected: false,
    method: 'None',
    server: '',
    lastTest: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Lade gespeicherte Konfiguration
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = () => {
    try {
      const saved = localStorage.getItem('remoteNASConfig');
      if (saved) {
        const savedConfig = JSON.parse(saved);
        setConfig(prev => ({
          ...prev,
          ...savedConfig,
          auth: {
            ...prev.auth,
            // Passwort aus Sicherheitsgründen nicht laden
            password: '',
            username: savedConfig.auth?.username || '',
            remember: savedConfig.auth?.remember || false
          }
        }));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Konfiguration:', error);
    }
  };

  const saveConfiguration = () => {
    try {
      const configToSave = {
        ...config,
        auth: {
          ...config.auth,
          // Passwort nur speichern wenn explizit gewünscht
          password: config.auth.remember ? config.auth.password : ''
        }
      };
      
      localStorage.setItem('remoteNASConfig', JSON.stringify(configToSave));
      
      toast({
        title: "Konfiguration gespeichert",
        description: "Die Remote-Verbindungseinstellungen wurden gespeichert.",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Konfiguration konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  const testConnection = async () => {
    setIsLoading(true);
    
    try {
      // Test QuickConnect
      if (config.quickConnect.enabled) {
        const response = await fetch('/api/nas-remote-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'quickconnect',
            config: config.quickConnect,
            auth: config.auth
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          setConnectionStatus({
            connected: true,
            method: 'QuickConnect',
            server: result.server,
            lastTest: new Date().toLocaleString()
          });
          
          toast({
            title: "Verbindung erfolgreich",
            description: `Verbunden über QuickConnect: ${result.server}`,
          });
          return;
        }
      }
      
      // Test lokales Netzwerk
      if (config.local.enabled) {
        const response = await fetch('/api/nas-remote-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'local',
            config: config.local,
            auth: config.auth
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          setConnectionStatus({
            connected: true,
            method: 'Local Network',
            server: result.server,
            lastTest: new Date().toLocaleString()
          });
          
          toast({
            title: "Verbindung erfolgreich",
            description: `Verbunden über lokales Netzwerk: ${result.server}`,
          });
          return;
        }
      }
      
      // Beide Methoden fehlgeschlagen
      setConnectionStatus({
        connected: false,
        method: 'None',
        server: '',
        lastTest: new Date().toLocaleString(),
        error: 'Alle Verbindungsmethoden fehlgeschlagen'
      });
      
      toast({
        title: "Verbindung fehlgeschlagen",
        description: "Keine Verbindung zum NAS möglich. Prüfen Sie die Einstellungen.",
        variant: "destructive",
      });
      
    } catch (error) {
      console.error('Verbindungstest Fehler:', error);
      toast({
        title: "Verbindungstest fehlgeschlagen",
        description: "Ein Fehler ist aufgetreten: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Remote NAS-Verbindung
          </CardTitle>
          <CardDescription>
            Konfiguration für den Zugriff auf Synology NAS von entfernten Geräten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Verbindungsstatus */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                {connectionStatus.connected ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium">
                    {connectionStatus.connected ? 'Verbunden' : 'Nicht verbunden'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {connectionStatus.method !== 'None' && (
                      `Methode: ${connectionStatus.method}`
                    )}
                    {connectionStatus.server && (
                      ` | Server: ${connectionStatus.server}`
                    )}
                  </p>
                </div>
              </div>
              <Button 
                onClick={testConnection} 
                disabled={isLoading}
                size="sm"
                className="flex items-center gap-2"
              >
                <TestTube className="w-4 h-4" />
                {isLoading ? 'Teste...' : 'Testen'}
              </Button>
            </div>

            {/* Konfiguration */}
            <Tabs defaultValue="quickconnect" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="quickconnect">QuickConnect</TabsTrigger>
                <TabsTrigger value="local">Lokales Netzwerk</TabsTrigger>
                <TabsTrigger value="auth">Authentifizierung</TabsTrigger>
              </TabsList>

              <TabsContent value="quickconnect" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="quickconnect-enabled">QuickConnect aktivieren</Label>
                    <Switch
                      id="quickconnect-enabled"
                      checked={config.quickConnect.enabled}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({
                          ...prev,
                          quickConnect: { ...prev.quickConnect, enabled: checked }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="quickconnect-id">QuickConnect ID</Label>
                      <Input
                        id="quickconnect-id"
                        value={config.quickConnect.id}
                        onChange={(e) =>
                          setConfig(prev => ({
                            ...prev,
                            quickConnect: { ...prev.quickConnect, id: e.target.value }
                          }))
                        }
                        placeholder="diwkaon"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="quickconnect-url">QuickConnect URL</Label>
                      <Input
                        id="quickconnect-url"
                        value={config.quickConnect.url}
                        onChange={(e) =>
                          setConfig(prev => ({
                            ...prev,
                            quickConnect: { ...prev.quickConnect, url: e.target.value }
                          }))
                        }
                        placeholder="https://quickconnect.to/diwkaon"
                      />
                    </div>
                  </div>
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      QuickConnect ermöglicht den Zugriff über das Internet ohne VPN.
                      Stelle sicher, dass dein NAS über das Internet erreichbar ist.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>

              <TabsContent value="local" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="local-enabled">Lokales Netzwerk aktivieren</Label>
                    <Switch
                      id="local-enabled"
                      checked={config.local.enabled}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({
                          ...prev,
                          local: { ...prev.local, enabled: checked }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="local-host">Hostname</Label>
                      <Input
                        id="local-host"
                        value={config.local.host}
                        onChange={(e) =>
                          setConfig(prev => ({
                            ...prev,
                            local: { ...prev.local, host: e.target.value }
                          }))
                        }
                        placeholder="DS124-RockingK"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="local-ip">IP-Adresse</Label>
                      <Input
                        id="local-ip"
                        value={config.local.ip}
                        onChange={(e) =>
                          setConfig(prev => ({
                            ...prev,
                            local: { ...prev.local, ip: e.target.value }
                          }))
                        }
                        placeholder="192.168.0.25"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="local-port">Port</Label>
                      <Input
                        id="local-port"
                        type="number"
                        value={config.local.port}
                        onChange={(e) =>
                          setConfig(prev => ({
                            ...prev,
                            local: { ...prev.local, port: parseInt(e.target.value) || 5000 }
                          }))
                        }
                        placeholder="5000"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-6">
                      <Switch
                        id="local-https"
                        checked={config.local.useHTTPS}
                        onCheckedChange={(checked) => 
                          setConfig(prev => ({
                            ...prev,
                            local: { ...prev.local, useHTTPS: checked }
                          }))
                        }
                      />
                      <Label htmlFor="local-https">HTTPS verwenden</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="auth" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="auth-username">Benutzername</Label>
                    <Input
                      id="auth-username"
                      value={config.auth.username}
                      onChange={(e) =>
                        setConfig(prev => ({
                          ...prev,
                          auth: { ...prev.auth, username: e.target.value }
                        }))
                      }
                      placeholder="Synology Benutzername"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="auth-password">Passwort</Label>
                    <div className="relative">
                      <Input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        value={config.auth.password}
                        onChange={(e) =>
                          setConfig(prev => ({
                            ...prev,
                            auth: { ...prev.auth, password: e.target.value }
                          }))
                        }
                        placeholder="Synology Passwort"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auth-remember"
                      checked={config.auth.remember}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({
                          ...prev,
                          auth: { ...prev.auth, remember: checked }
                        }))
                      }
                    />
                    <Label htmlFor="auth-remember">Passwort speichern</Label>
                  </div>
                  
                  <Alert>
                    <Lock className="h-4 w-4" />
                    <AlertDescription>
                      Verwende einen dedizierten Benutzer für GartenMeister mit minimalen Berechtigungen.
                      Das Passwort wird nur lokal gespeichert, wenn aktiviert.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            {/* Pfad-Konfiguration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pfad-Konfiguration</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="path-base">Basis-Pfad</Label>
                  <Input
                    id="path-base"
                    value={config.paths.basePath}
                    onChange={(e) =>
                      setConfig(prev => ({
                        ...prev,
                        paths: { ...prev.paths, basePath: e.target.value }
                      }))
                    }
                    placeholder="/Gurktaler/gartenmeister"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="path-data">Daten-Pfad</Label>
                    <Input
                      id="path-data"
                      value={config.paths.dataPath}
                      onChange={(e) =>
                        setConfig(prev => ({
                          ...prev,
                          paths: { ...prev.paths, dataPath: e.target.value }
                        }))
                      }
                      placeholder="/data"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="path-images">Bilder-Pfad</Label>
                    <Input
                      id="path-images"
                      value={config.paths.imagesPath}
                      onChange={(e) =>
                        setConfig(prev => ({
                          ...prev,
                          paths: { ...prev.paths, imagesPath: e.target.value }
                        }))
                      }
                      placeholder="/images"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Aktionen */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={loadConfiguration}>
                Zurücksetzen
              </Button>
              <Button onClick={saveConfiguration} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Speichern
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
