/**
 * 🌤️ Weather Provider Configuration Panel
 * 
 * Ermöglicht es dem Benutzer, zwischen verschiedenen Wetter-Anbietern zu wechseln
 * und API-Schlüssel zu verwalten
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Cloud, 
  Settings, 
  Key, 
  CheckCircle, 
  AlertCircle, 
  Wifi,
  Database,
  Save
} from 'lucide-react';
import { electronAPI } from '@/lib/electron-bridge';

export default function WeatherProviderConfig() {
  const [config, setConfig] = useState({
    activeProvider: 'openweathermap',
    providers: {
      openweathermap: {
        apiKey: '7c24de0c0b5a6d85a0f84c01eeff96ba',
        enabled: true
      },
      meteoblue: {
        apiKey: '',
        enabled: false
      },
      customStation: {
        endpoint: '',
        apiKey: '',
        enabled: false
      }
    }
  });
  const [apiKeys, setApiKeys] = useState({
    meteoblue: '',
    customStation: ''
  });
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | 'pending'>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Lade gespeicherte Konfiguration
    const loadConfig = async () => {
      try {
        const savedConfig = await electronAPI.weather.getConfig();
        if (savedConfig) {
          setConfig(savedConfig);
          setApiKeys({
            meteoblue: savedConfig.providers.meteoblue.apiKey || '',
            customStation: savedConfig.providers.customStation.apiKey || ''
          });
          setCustomEndpoint(savedConfig.providers.customStation.endpoint || '');
        }
      } catch (error) {
        console.error('Fehler beim Laden der Wetter-Konfiguration:', error);
      }
    };
    
    loadConfig();
  }, []);

  const testProvider = async (providerId: string) => {
    setTestResults(prev => ({ ...prev, [providerId]: 'pending' }));
    
    try {
      let testConfig: any = {};
      
      if (providerId === 'meteoblue') {
        testConfig.apiKey = apiKeys.meteoblue;
      } else if (providerId === 'customStation') {
        testConfig.endpoint = customEndpoint;
        testConfig.apiKey = apiKeys.customStation;
      } else if (providerId === 'openweathermap') {
        testConfig.apiKey = config.providers.openweathermap.apiKey;
      }
      
      const result = await electronAPI.weather.testProvider(providerId, testConfig);
      setTestResults(prev => ({ ...prev, [providerId]: result.success ? 'success' : 'error' }));
    } catch (error) {
      console.error(`Test für ${providerId} fehlgeschlagen:`, error);
      setTestResults(prev => ({ ...prev, [providerId]: 'error' }));
    }
  };

  const saveConfiguration = async () => {
    setSaving(true);
    
    try {
      const newConfig = {
        ...config,
        providers: {
          ...config.providers,
          meteoblue: {
            apiKey: apiKeys.meteoblue,
            enabled: !!apiKeys.meteoblue && testResults.meteoblue === 'success'
          },
          customStation: {
            endpoint: customEndpoint,
            apiKey: apiKeys.customStation,
            enabled: !!customEndpoint && testResults.customStation === 'success'
          }
        }
      };
      
      // Speichere Konfiguration
      const result = await electronAPI.weather.saveConfig(newConfig);
      if (result.success) {
        setConfig(newConfig);
        console.log('Weather-Konfiguration gespeichert:', newConfig);
      } else {
        console.error('Fehler beim Speichern:', result.error);
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Konfiguration:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Wetter-Provider Konfiguration
        </CardTitle>
        <CardDescription>
          Verwalten Sie die verfügbaren Wetterdienste und API-Schlüssel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="providers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="providers">Provider</TabsTrigger>
            <TabsTrigger value="settings">Einstellungen</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-4">
            {/* OpenWeatherMap */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    <CardTitle className="text-base">OpenWeatherMap</CardTitle>
                  </div>
                  <Badge variant={config.providers.openweathermap.enabled ? "default" : "secondary"}>
                    {config.providers.openweathermap.enabled ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </div>
                <CardDescription>
                  Standard-Wetterdienst (bereits konfiguriert)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={config.providers.openweathermap.enabled} 
                    onCheckedChange={(enabled) => 
                      setConfig(prev => ({
                        ...prev,
                        providers: {
                          ...prev.providers,
                          openweathermap: { ...prev.providers.openweathermap, enabled }
                        }
                      }))
                    }
                  />
                  <Label>Provider aktivieren</Label>
                </div>
              </CardContent>
            </Card>

            {/* Meteoblue */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <CardTitle className="text-base">Meteoblue</CardTitle>
                  </div>
                  <Badge variant={apiKeys.meteoblue && testResults.meteoblue === 'success' ? "default" : "secondary"}>
                    {apiKeys.meteoblue ? 
                      (testResults.meteoblue === 'success' ? "Konfiguriert" : 
                       testResults.meteoblue === 'error' ? "Fehler" : "Ungetestet") 
                      : "Nicht konfiguriert"}
                  </Badge>
                </div>
                <CardDescription>
                  Professioneller Wetterdienst mit erweiterten Daten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="meteoblue-key">API-Schlüssel</Label>
                  <div className="flex gap-2">
                    <Input
                      id="meteoblue-key"
                      type="password"
                      placeholder="Meteoblue API Key eingeben..."
                      value={apiKeys.meteoblue}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, meteoblue: e.target.value }))}
                    />
                    <Button 
                      onClick={() => testProvider('meteoblue')} 
                      variant="outline"
                      disabled={!apiKeys.meteoblue || testResults.meteoblue === 'pending'}
                    >
                      {testResults.meteoblue === 'pending' ? 'Teste...' : 'Test'}
                    </Button>
                  </div>
                </div>
                
                {testResults.meteoblue === 'success' && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-800">
                      Meteoblue API erfolgreich getestet
                    </AlertDescription>
                  </Alert>
                )}
                
                {testResults.meteoblue === 'error' && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-800">
                      Meteoblue API-Test fehlgeschlagen. Überprüfen Sie den API-Schlüssel.
                    </AlertDescription>
                  </Alert>
                )}
                
                <p className="text-xs text-muted-foreground">
                  💡 Meteoblue bietet sehr genaue Wetterdaten und ist besonders für Gartenbau geeignet.
                  API-Schlüssel erhalten Sie auf <a href="https://meteoblue.com" target="_blank" className="underline">meteoblue.com</a>
                </p>
              </CardContent>
            </Card>

            {/* Custom Weather Station */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    <CardTitle className="text-base">Eigene Wetterstation</CardTitle>
                  </div>
                  <Badge variant={customEndpoint && testResults.customStation === 'success' ? "default" : "secondary"}>
                    {customEndpoint ? 
                      (testResults.customStation === 'success' ? "Verbunden" : 
                       testResults.customStation === 'error' ? "Fehler" : "Ungetestet") 
                      : "Nicht konfiguriert"}
                  </Badge>
                </div>
                <CardDescription>
                  Verbindung zu Ihrer lokalen Wetterstation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="custom-endpoint">API-Endpoint</Label>
                  <Input
                    id="custom-endpoint"
                    placeholder="http://192.168.1.100:8080/api/weather"
                    value={customEndpoint}
                    onChange={(e) => setCustomEndpoint(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="custom-key">API-Schlüssel (optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="custom-key"
                      type="password"
                      placeholder="Authentifizierung (falls erforderlich)"
                      value={apiKeys.customStation}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, customStation: e.target.value }))}
                    />
                    <Button 
                      onClick={() => testProvider('customStation')} 
                      variant="outline"
                      disabled={!customEndpoint || testResults.customStation === 'pending'}
                    >
                      {testResults.customStation === 'pending' ? 'Teste...' : 'Test'}
                    </Button>
                  </div>
                </div>
                
                {testResults.customStation === 'success' && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-800">
                      Wetterstation erfolgreich verbunden
                    </AlertDescription>
                  </Alert>
                )}
                
                {testResults.customStation === 'error' && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-800">
                      Verbindung zur Wetterstation fehlgeschlagen. Prüfen Sie Endpoint und Netzwerk.
                    </AlertDescription>
                  </Alert>
                )}
                
                <p className="text-xs text-muted-foreground">
                  🏠 Für lokale Wetterstationen. Das System erwartet JSON-Daten mit den Standardfeldern.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Provider-Priorität</CardTitle>
                <CardDescription>
                  Bestimmen Sie die Reihenfolge der Wetterdienste bei Ausfällen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Haupt-Provider</Label>
                  <select 
                    value={config.primaryProvider} 
                    onChange={(e) => setConfig(prev => ({ ...prev, primaryProvider: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="openweathermap">OpenWeatherMap</option>
                    <option value="meteoblue">Meteoblue</option>
                    <option value="customStation">Eigene Wetterstation</option>
                  </select>
                </div>
                
                <div>
                  <Label>Fallback-Reihenfolge</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Wird verwendet wenn der Haupt-Provider nicht verfügbar ist
                  </p>
                  <div className="space-y-2">
                    {['openweathermap', 'meteoblue', 'customStation'].map((provider, index) => (
                      <div key={provider} className="flex items-center gap-2">
                        <span className="text-sm w-4">{index + 1}.</span>
                        <span className="text-sm">
                          {provider === 'openweathermap' ? 'OpenWeatherMap' :
                           provider === 'meteoblue' ? 'Meteoblue' : 'Eigene Wetterstation'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">System-Status</CardTitle>
                <CardDescription>
                  Aktueller Status aller konfigurierten Provider
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Entferne weatherService.getAvailableProviders() da nicht verfügbar */}
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <span className="font-medium">OpenWeatherMap</span>
                    </div>
                    <Badge variant={config.providers.openweathermap.enabled ? "default" : "secondary"}>
                      {config.providers.openweathermap.enabled ? 'Verfügbar' : 'Deaktiviert'}
                    </Badge>
                  </div>
                  
                  {config.providers.meteoblue.enabled && (
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">Meteoblue</span>
                      </div>
                      <Badge variant="default">Verfügbar</Badge>
                    </div>
                  )}
                  
                  {config.providers.customStation.enabled && (
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">Eigene Wetterstation</span>
                      </div>
                      <Badge variant="default">Verfügbar</Badge>
                    </div>
                  )}
                  
                  {!config.providers.meteoblue.enabled && !config.providers.customStation.enabled && !config.providers.openweathermap.enabled && (
                    <p className="text-center text-muted-foreground py-4">
                      Keine Provider konfiguriert
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button onClick={saveConfiguration} disabled={saving}>
            {saving ? (
              <>Speichere...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Konfiguration speichern
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
