'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Wifi, WifiOff, QrCode, Server, Loader2 } from 'lucide-react';

interface NasSettings {
  enabled: boolean;
  url: string;
}

export function NasImageSettings() {
  const { toast } = useToast();

  const [settings, setSettings] = useState<NasSettings>({ enabled: false, url: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'online' | 'offline'>('idle');

  // Einstellungen laden
  useEffect(() => {
    const load = async () => {
      try {
        const config = await window.electronAPI?.getConfig?.();
        if (config?.nasSettings) {
          setSettings({ enabled: config.nasSettings.enabled ?? false, url: config.nasSettings.url ?? '' });
        }
      } catch (e) {
        console.error('[NasImageSettings] Laden fehlgeschlagen:', e);
      }
    };
    load();
  }, []);

  // Verbindungs-Test
  const testConnection = async () => {
    if (!settings.url) {
      toast({ title: 'Keine URL', description: 'Bitte zuerst eine NAS-URL eingeben.', variant: 'destructive' });
      return;
    }
    setTestStatus('loading');
    try {
      const url = settings.url.replace(/\/$/, '');
      const res = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        setTestStatus('online');
        toast({ title: 'Verbindung erfolgreich', description: 'NAS-Server antwortet.' });
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (e: unknown) {
      setTestStatus('offline');
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Verbindung fehlgeschlagen', description: msg, variant: 'destructive' });
    }
  };

  // Einstellungen speichern
  const save = async () => {
    setIsSaving(true);
    try {
      const config = (await window.electronAPI?.getConfig?.()) ?? {};
      await window.electronAPI?.saveConfig?.({ ...config, nasSettings: settings });
      toast({ title: 'Gespeichert', description: 'NAS-Einstellungen wurden gespeichert.' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Fehler beim Speichern', description: msg, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const uploadUrl = settings.url ? `${settings.url.replace(/\/$/, '')}/upload.html` : '';
  const qrUrl = uploadUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&format=png&data=${encodeURIComponent(uploadUrl)}`
    : null;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="w-5 h-5 text-[var(--color-garten,#9BA97E)]" />
          GartenMeister API-Server
        </CardTitle>
        <CardDescription>
          Verbindet die App mit dem NAS-Server (Port 3003) für Foto-Upload und Dokumentenverwaltung über Tailscale.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Aktivieren-Schalter */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="nas-enabled" className="text-sm font-medium">NAS-Verbindung aktivieren</Label>
            <p className="text-xs text-muted-foreground">Bilder und Dokumente primär auf dem NAS speichern</p>
          </div>
          <Switch
            id="nas-enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) => setSettings(s => ({ ...s, enabled: checked }))}
          />
        </div>

        {/* URL-Eingabe */}
        <div className="space-y-2">
          <Label htmlFor="nas-url">Server-URL (Tailscale IP)</Label>
          <div className="flex gap-2">
            <Input
              id="nas-url"
              placeholder="http://100.x.y.z:3003"
              value={settings.url}
              onChange={(e) => {
                setSettings(s => ({ ...s, url: e.target.value }));
                setTestStatus('idle');
              }}
              className="font-mono text-sm"
            />
            <Button variant="outline" size="sm" onClick={testConnection} disabled={testStatus === 'loading'}>
              {testStatus === 'loading' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Testen'
              )}
            </Button>
          </div>

          {/* Verbindungs-Badge */}
          {testStatus !== 'idle' && (
            <div className="flex items-center gap-2 mt-1">
              {testStatus === 'online' && (
                <Badge variant="outline" className="text-green-600 border-green-400 gap-1">
                  <Wifi className="w-3 h-3" /> Online
                </Badge>
              )}
              {testStatus === 'offline' && (
                <Badge variant="outline" className="text-red-500 border-red-400 gap-1">
                  <WifiOff className="w-3 h-3" /> Nicht erreichbar
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Speichern */}
        <Button onClick={save} disabled={isSaving} className="w-full">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Einstellungen speichern
        </Button>

        {/* QR-Code Sektion (DB.4) */}
        {uploadUrl && (
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <QrCode className="w-4 h-4 text-[var(--color-garten,#9BA97E)]" />
              Smartphone-Upload (PWA)
            </div>
            <p className="text-xs text-muted-foreground">
              QR-Code mit dem Smartphone scannen, um Fotos direkt auf den NAS hochzuladen.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              {/* QR-Code */}
              {qrUrl && (
                <div className="border rounded-lg p-2 bg-white shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt="QR-Code für NAS-Upload"
                    width={180}
                    height={180}
                    className="block"
                  />
                </div>
              )}

              {/* URL als Text */}
              <div className="space-y-2 min-w-0 flex-1">
                <Label className="text-xs text-muted-foreground">Upload-URL</Label>
                <div className="rounded-md bg-muted px-3 py-2 font-mono text-xs break-all">
                  {uploadUrl}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(uploadUrl);
                    toast({ title: 'URL kopiert', description: 'In die Zwischenablage kopiert.' });
                  }}
                >
                  URL kopieren
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
