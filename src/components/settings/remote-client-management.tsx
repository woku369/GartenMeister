/**
 * 👥 Remote Client Management Komponente
 * Schritt 4: Remote-Client-Management (Client-Liste, Status, Upload-Statistiken)
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  RefreshCw, 
  Monitor,
  Smartphone,
  Laptop,
  Trash2,
  Upload,
  Download,
  Shield,
  Clock,
  HardDrive,
  Wifi,
  UserPlus,
  Settings,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface RemoteClient {
  id: string;
  name: string;
  type: 'primary' | 'secondary' | 'mobile' | 'guest';
  ip: string;
  lastSeen: string;
  status: 'online' | 'recently_active' | 'offline';
  uploads: number;
  role: 'admin' | 'user' | 'guest' | 'blocked';
  registeredAt?: string;
  lastModified?: string;
}

interface UploadStats {
  totalUploads: number;
  totalSize: number;
  successfulUploads: number;
  failedUploads: number;
  lastUpload: string | null;
}

interface RemoteConfig {
  enabled: boolean;
  autoAcceptUploads: boolean;
  maxUploadSize: number;
  allowedFileTypes: string[];
  requireApproval: boolean;
  notifyOnUpload: boolean;
  quarantinePeriod: number;
  maxStorageMB: number;
}

export function RemoteClientManagement() {
  const [clients, setClients] = useState<RemoteClient[]>([]);
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null);
  const [remoteConfig, setRemoteConfig] = useState<RemoteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/remote-clients');
      const result = await response.json();
      
      if (result.success) {
        setClients(result.data.clients);
        setUploadStats(result.data.uploadStats);
        setRemoteConfig(result.data.remoteConfig);
      } else {
        toast({
          title: "Fehler beim Laden",
          description: result.error || "Client-Daten konnten nicht geladen werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden der Client-Daten:', error);
      toast({
        title: "Verbindungsfehler",
        description: "Client-Daten konnten nicht geladen werden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const performClientAction = async (action: string, clientId?: string, data?: any) => {
    try {
      setUpdating(clientId || action);
      const response = await fetch('/api/remote-clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          clientId,
          ...data
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Erfolgreich",
          description: result.message,
          variant: "default"
        });
        
        // Daten neu laden
        fetchClientData();
        
        return result.data;
      } else {
        toast({
          title: "Fehler",
          description: result.error || "Aktion fehlgeschlagen",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Fehler bei Client-Aktion:', error);
      toast({
        title: "Aktions-Fehler",
        description: "Aktion konnte nicht durchgeführt werden",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const updateClientRole = (clientId: string, newRole: string) => {
    performClientAction('update-client-role', clientId, { clientData: { role: newRole } });
  };

  const removeClient = (clientId: string) => {
    performClientAction('remove-client', clientId);
  };

  const clearUploads = () => {
    performClientAction('clear-uploads');
  };

  const updateRemoteConfig = (newConfig: RemoteConfig) => {
    performClientAction('update-remote-config', undefined, { config: newConfig });
    setRemoteConfig(newConfig);
  };

  useEffect(() => {
    fetchClientData();
  }, []);

  const getClientIcon = (type: string) => {
    switch (type) {
      case 'primary': return <Monitor className="w-5 h-5" />;
      case 'mobile': return <Smartphone className="w-5 h-5" />;
      case 'secondary': return <Laptop className="w-5 h-5" />;
      default: return <Users className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'default';
      case 'recently_active': return 'secondary';
      case 'offline': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'recently_active': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'offline': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'user': return 'secondary';
      case 'guest': return 'outline';
      case 'blocked': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Unbekannt';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Client-Daten werden geladen...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload-Statistiken */}
      {uploadStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Upload-Statistiken
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchClientData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Aktualisieren
              </Button>
            </CardTitle>
            <CardDescription>
              Übersicht aller Remote-Upload-Aktivitäten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{uploadStats.totalUploads}</div>
                <div className="text-sm text-muted-foreground">Gesamt-Uploads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatBytes(uploadStats.totalSize)}</div>
                <div className="text-sm text-muted-foreground">Gesamtgröße</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{uploadStats.successfulUploads}</div>
                <div className="text-sm text-muted-foreground">Erfolgreich</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{uploadStats.failedUploads}</div>
                <div className="text-sm text-muted-foreground">Fehlgeschlagen</div>
              </div>
            </div>

            {uploadStats.lastUpload && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Letzter Upload: {formatDate(uploadStats.lastUpload)}
                </p>
              </div>
            )}

            <div className="mt-4 flex justify-center">
              <Button 
                variant="outline"
                onClick={clearUploads}
                disabled={updating === 'clear-uploads'}
              >
                {updating === 'clear-uploads' ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Bereinigt...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Uploads bereinigen
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client-Liste */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Verbundene Clients ({clients.length})
          </CardTitle>
          <CardDescription>
            Verwaltung aller Geräte mit Zugriff auf die NAS
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Keine Clients registriert</p>
            </div>
          ) : (
            <div className="space-y-4">
              {clients.map((client) => (
                <div key={client.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getClientIcon(client.type)}
                      <div>
                        <div className="font-medium flex items-center">
                          {client.name}
                          {client.type === 'primary' && (
                            <Badge variant="outline" className="ml-2">Haupt-PC</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {client.id} • IP: {client.ip}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Letzter Zugriff: {formatDate(client.lastSeen)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Status */}
                      <div className="flex items-center">
                        {getStatusIcon(client.status)}
                        <Badge variant={getStatusColor(client.status)} className="ml-2">
                          {client.status === 'online' ? 'Online' :
                           client.status === 'recently_active' ? 'Vor kurzem aktiv' : 'Offline'}
                        </Badge>
                      </div>

                      {/* Upload-Anzahl */}
                      <div className="text-center">
                        <div className="text-sm font-medium">{client.uploads}</div>
                        <div className="text-xs text-muted-foreground">Uploads</div>
                      </div>

                      {/* Rolle */}
                      {client.type !== 'primary' && (
                        <Select
                          value={client.role}
                          onValueChange={(value) => updateClientRole(client.id, value)}
                          disabled={updating === client.id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="user">Benutzer</SelectItem>
                            <SelectItem value="guest">Gast</SelectItem>
                            <SelectItem value="blocked">Blockiert</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      {/* Aktionen */}
                      {client.type !== 'primary' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeClient(client.id)}
                          disabled={updating === client.id}
                        >
                          {updating === client.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remote-Konfiguration */}
      {remoteConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Remote-Zugriff Konfiguration
            </CardTitle>
            <CardDescription>
              Einstellungen für Remote-Uploads und Client-Zugriff
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Remote-Zugriff aktivieren */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="remote-enabled">Remote-Zugriff aktiviert</Label>
                <p className="text-sm text-muted-foreground">
                  Erlaubt anderen Geräten den Zugriff auf die NAS
                </p>
              </div>
              <Switch
                id="remote-enabled"
                checked={remoteConfig.enabled}
                onCheckedChange={(checked) => {
                  const newConfig = { ...remoteConfig, enabled: checked };
                  updateRemoteConfig(newConfig);
                }}
              />
            </div>

            <Separator />

            {/* Upload-Einstellungen */}
            <div className="space-y-4">
              <h4 className="font-medium">Upload-Einstellungen</h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Automatische Upload-Genehmigung</Label>
                  <p className="text-sm text-muted-foreground">
                    Uploads werden automatisch akzeptiert
                  </p>
                </div>
                <Switch
                  checked={remoteConfig.autoAcceptUploads}
                  onCheckedChange={(checked) => {
                    const newConfig = { ...remoteConfig, autoAcceptUploads: checked };
                    updateRemoteConfig(newConfig);
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Upload-Benachrichtigungen</Label>
                  <p className="text-sm text-muted-foreground">
                    Benachrichtigung bei neuen Uploads
                  </p>
                </div>
                <Switch
                  checked={remoteConfig.notifyOnUpload}
                  onCheckedChange={(checked) => {
                    const newConfig = { ...remoteConfig, notifyOnUpload: checked };
                    updateRemoteConfig(newConfig);
                  }}
                />
              </div>
            </div>

            <Separator />

            {/* Limits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Maximale Upload-Größe</Label>
                <p className="text-sm text-muted-foreground">
                  {formatBytes(remoteConfig.maxUploadSize)} pro Datei
                </p>
              </div>
              <div>
                <Label>Maximaler Speicher</Label>
                <p className="text-sm text-muted-foreground">
                  {remoteConfig.maxStorageMB} MB für Remote-Uploads
                </p>
              </div>
            </div>

            <div>
              <Label>Erlaubte Dateitypen</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {remoteConfig.allowedFileTypes.map((type) => (
                  <Badge key={type} variant="secondary">
                    .{type}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status-Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Remote-Client-Management ist vollständig konfiguriert.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
