'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { electronAPI, isElectron } from '@/lib/electron-bridge';
import { Settings2, HardDrive, Info, Upload, Cloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { GeneralSettingsForm } from '@/components/settings/general-settings-form';
import WeatherProviderConfig from '@/components/weather/WeatherProviderConfig';
import { NasImageSettings } from '@/components/settings/nas-image-settings';
import GartenLayoutSettings from '@/components/settings/garden-layout-settings';
import { LayoutDashboard } from 'lucide-react';

// Minimale Konfiguration für ersten Test
interface AppConfig {
  appTheme: string;
  exportPath: string | null;
}

const defaultConfig: AppConfig = {
  appTheme: 'light',
  exportPath: null
};

import OneDriveManager from '@/components/settings/OneDriveManager';

export default function SettingsPage() {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isElectronApp, setIsElectronApp] = useState(false);
  const { toast } = useToast();

  // Konfiguration laden
  useEffect(() => {
    const checkElectronAndLoadConfig = async () => {
      try {
        // DYNAMISCHE Electron-Erkennung zur Laufzeit
        const isElectronEnv = typeof window !== 'undefined' && 
          (window.navigator.userAgent.toLowerCase().indexOf('electron') > -1 ||
           !!window.electronAPI);
        
        console.log('[Settings] Electron-Umgebung erkannt:', isElectronEnv);
        setIsElectronApp(isElectronEnv);
        
        if (isElectronEnv && typeof window !== 'undefined' && window.electronAPI) {
          try {
            if (typeof window.electronAPI.getConfig === 'function') {
              const appConfig = await window.electronAPI.getConfig();
              if (appConfig) {
                setConfig(appConfig);
              } else {
                setConfig(defaultConfig);
              }
            } else {
              setConfig(defaultConfig);
            }
          } catch (error) {
            console.error('Fehler beim Laden der Konfiguration:', error);
            setConfig(defaultConfig);
          }
        } else {
          setConfig(defaultConfig);
        }
      } catch (error) {
        console.error('Fehler beim Initialisieren:', error);
        setConfig(defaultConfig);
      } finally {
        setIsLoading(false);
      }
    };

    checkElectronAndLoadConfig();
  }, []);

  const saveConfig = async () => {
    if (!isElectronApp) return;
    
    try {
      if (typeof electronAPI.saveConfig === 'function') {
        await electronAPI.saveConfig(config);
        toast({
          title: "Einstellungen gespeichert",
          description: "Ihre Einstellungen wurden erfolgreich gespeichert.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Konfiguration:', error);
      toast({
        title: "Fehler beim Speichern",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive"
      });
    }
  };

  if (!isElectronApp) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Einstellungen</CardTitle>
          <CardDescription>Einstellungen sind nur in der Desktop-Version verfügbar.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <Info className="mx-auto mb-4 w-12 h-12 text-muted-foreground" />
          <p>Diese Seite ist nur in der Electron Desktop-App verfügbar.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading || !config) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Einstellungen werden geladen...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Einstellungen</h1>
      
      <Tabs defaultValue="general" className="mb-8">
        <TabsList className="mb-6 w-full flex flex-wrap justify-start h-auto gap-1 p-1">
          <TabsTrigger value="general" className="flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-fit">
            <Settings2 className="w-4 h-4" />
            <span className="text-xs whitespace-nowrap">Allgemein</span>
          </TabsTrigger>
          <TabsTrigger value="onedrive" className="flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-fit">
            <Upload className="w-4 h-4" />
            <span className="text-xs whitespace-nowrap">OneDrive</span>
          </TabsTrigger>
          <TabsTrigger value="weather" className="flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-fit">
            <Cloud className="w-4 h-4" />
            <span className="text-xs whitespace-nowrap">Wetter-API</span>
          </TabsTrigger>
          <TabsTrigger value="nas" className="flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-fit">
            <HardDrive className="w-4 h-4" />
            <span className="text-xs whitespace-nowrap">NAS-Integration</span>
          </TabsTrigger>
          <TabsTrigger value="lageplan" className="flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-fit">
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-xs whitespace-nowrap">Lageplan</span>
          </TabsTrigger>
        </TabsList>

        {/* Allgemeine Einstellungen */}
        <TabsContent value="general">
          <GeneralSettingsForm />
        </TabsContent>

        {/* OneDrive-Integration */}
        <TabsContent value="onedrive">
          <OneDriveManager />
        </TabsContent>

        {/* Wetter-API-Konfiguration */}
        <TabsContent value="weather">
          <WeatherProviderConfig />
        </TabsContent>

        {/* NAS-Integration */}
        <TabsContent value="nas">
          <div className="space-y-6">
            <NasImageSettings />
          </div>
        </TabsContent>

        {/* Lageplan-Konfiguration */}
        <TabsContent value="lageplan">
          <GartenLayoutSettings />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button onClick={saveConfig} className="bg-[#8FBC8F] hover:bg-[#2e7d32]">
          Einstellungen speichern
        </Button>
      </div>
    </div>
  );
}
