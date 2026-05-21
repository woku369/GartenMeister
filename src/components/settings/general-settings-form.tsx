'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings2, 
  Folder, 
  Palette, 
  Monitor, 
  Save, 
  RotateCcw,
  CheckCircle,
  Download,
  Upload,
  HardDrive,
  FileText,
  Bell,
  Moon,
  Sun,
  Laptop
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { electronAPI, isElectron } from '@/lib/electron-bridge';

interface GeneralSettings {
  // Garten-Konfiguration
  currentBeetCount: number; // Aktuelle Anzahl der Beete (1-50)
  
  // Erscheinungsbild
  theme: 'light' | 'dark' | 'system';
  language: 'de' | 'en';
  compactMode: boolean;
  showAnimations: boolean;
  
  // Dateien & Speicher
  autoSave: boolean;
  autoSaveInterval: number; // Minuten
  maxBackupFiles: number;
  defaultExportPath: string;
  
  // Benachrichtigungen
  showNotifications: boolean;
  soundEnabled: boolean;
  reminderNotifications: boolean;
  
  // Performance
  imageQuality: 'low' | 'medium' | 'high';
  maxImageSize: number; // MB
  enableCaching: boolean;
  
  // Erweitert
  enableLogging: boolean;
  debugMode: boolean;
  telemetryEnabled: boolean;
}

const defaultSettings: GeneralSettings = {
  currentBeetCount: 20,
  theme: 'system',
  language: 'de',
  compactMode: false,
  showAnimations: true,
  autoSave: true,
  autoSaveInterval: 5,
  maxBackupFiles: 10,
  defaultExportPath: '',
  showNotifications: true,
  soundEnabled: true,
  reminderNotifications: true,
  imageQuality: 'medium',
  maxImageSize: 10,
  enableCaching: true,
  enableLogging: true,
  debugMode: false,
  telemetryEnabled: false
};

export function GeneralSettingsForm() {
  const [settings, setSettings] = useState<GeneralSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [isElectronApp, setIsElectronApp] = useState(false);
  const { toast } = useToast();

  // Einstellungen laden
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // DYNAMISCHE Electron-Erkennung zur Laufzeit
        const isElectronEnv = typeof window !== 'undefined' && 
          (window.navigator.userAgent.toLowerCase().indexOf('electron') > -1 ||
           !!window.electronAPI);
        
        console.log('[GeneralSettings] Electron-Umgebung erkannt:', isElectronEnv);
        console.log('[GeneralSettings] window.electronAPI verfügbar:', !!window.electronAPI);
        console.log('[GeneralSettings] getGartenConfiguration verfügbar:', !!window.electronAPI?.getGartenConfiguration);
        setIsElectronApp(isElectronEnv);
        
        // Versuche Einstellungen zu laden (localStorage als Fallback)
        const savedSettings = localStorage.getItem('generalSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...defaultSettings, ...parsed });
        }
        
        // Wenn Electron verfügbar ist, versuche erweiterte Konfiguration zu laden
        if (isElectronEnv && window.electronAPI?.getConfig) {
          try {
            const electronConfig = await window.electronAPI.getConfig();
            if (electronConfig) {
              setSettings(prev => ({ 
                ...prev, 
                defaultExportPath: electronConfig.exportPath || '',
                theme: electronConfig.appTheme || prev.theme
              }));
            }
          } catch (error) {
            console.log('Electron-Konfiguration nicht verfügbar:', error);
          }
        }

        // Lade auch die Garten-Konfiguration - DIREKTER TEST
        if (isElectronEnv && window.electronAPI?.getGartenConfiguration) {
          try {
            console.log('[GeneralSettings] Rufe getGartenConfiguration auf...');
            const gartenConfig = await window.electronAPI.getGartenConfiguration();
            console.log('[GeneralSettings] Geladene Garten-Konfiguration:', gartenConfig);
            if (gartenConfig && typeof gartenConfig.currentBeetCount === 'number') {
              setSettings(prev => ({ 
                ...prev, 
                currentBeetCount: gartenConfig.currentBeetCount
              }));
              console.log('[GeneralSettings] Beet-Anzahl gesetzt auf:', gartenConfig.currentBeetCount);
            }
          } catch (error) {
            console.error('[GeneralSettings] Fehler beim Laden der Garten-Konfiguration:', error);
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden der Einstellungen:', error);
        toast({
          title: 'Warnung',
          description: 'Einstellungen konnten nicht geladen werden. Standardwerte werden verwendet.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [toast]);

  const handleSettingChange = <K extends keyof GeneralSettings>(
    key: K,
    value: GeneralSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      
      console.log('[GeneralSettings] Speichern gestartet mit currentBeetCount:', settings.currentBeetCount);
      
      // Speichere in localStorage
      localStorage.setItem('generalSettings', JSON.stringify(settings));
      
      // DYNAMISCHE Electron-Erkennung für Speichern
      const isElectronEnv = typeof window !== 'undefined' && 
        (window.navigator.userAgent.toLowerCase().indexOf('electron') > -1 ||
         !!window.electronAPI);
      
      console.log('[GeneralSettings] Electron-Umgebung:', isElectronEnv);
      
      // Wenn Electron verfügbar ist, speichere auch dort
      if (isElectronEnv && window.electronAPI?.saveConfig) {
        try {
          const configResult = await window.electronAPI.saveConfig({
            appTheme: settings.theme,
            exportPath: settings.defaultExportPath,
            // Weitere Electron-spezifische Einstellungen hier
          });
          console.log('[GeneralSettings] App-Konfiguration gespeichert:', configResult);
        } catch (error) {
          console.log('Electron-Konfiguration konnte nicht gespeichert werden:', error);
        }
      }

      // Speichere auch die Garten-Konfiguration
      if (isElectronEnv && window.electronAPI?.updateGartenConfiguration) {
        try {
          const gartenUpdateData = {
            currentBeetCount: settings.currentBeetCount
          };
          console.log('[GeneralSettings] Aktualisiere Garten-Konfiguration mit:', gartenUpdateData);
          
          const gartenResult = await window.electronAPI.updateGartenConfiguration(gartenUpdateData);
          console.log('[GeneralSettings] Garten-Konfiguration Ergebnis:', gartenResult);
          
          // Zusätzlich: Data Store direkt aktualisieren für sofortige UI-Updates
          const { DataStore } = await import('@/lib/data-store');
          const dataStoreResult = await DataStore.updateGartenConfiguration({
            currentBeetCount: settings.currentBeetCount
          });
          console.log('[GeneralSettings] DataStore Update Ergebnis:', dataStoreResult);
          
        } catch (error) {
          console.error('Garten-Konfiguration konnte nicht gespeichert werden:', error);
        }
      }
      
      setHasChanges(false);
      
      // Erfolgreich gespeichert
      toast({
        title: 'Erfolgreich gespeichert',
        description: 'Allgemeine Einstellungen wurden aktualisiert. Navigiere zur Hauptseite...',
      });
      
      console.log('[GeneralSettings] Speichern abgeschlossen, navigiere zur Hauptseite');
      
      // Nach kurzer Verzögerung zur Hauptseite navigieren
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.electronAPI?.navigateTo) {
          window.electronAPI.navigateTo('/');
        } else {
          window.location.href = '/';
        }
      }, 1000);
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      toast({
        title: 'Fehler',
        description: 'Einstellungen konnten nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast({
      title: 'Zurückgesetzt',
      description: 'Einstellungen wurden auf Standardwerte zurückgesetzt.',
    });
  };

  const selectExportPath = async () => {
    if (isElectronApp && electronAPI?.selectDirectory) {
      try {
        const path = await electronAPI.selectDirectory();
        if (path) {
          handleSettingChange('defaultExportPath', path);
        }
      } catch (error) {
        toast({
          title: 'Fehler',
          description: 'Ordner konnte nicht ausgewählt werden.',
          variant: 'destructive',
        });
      }
    }
  };

  const getThemeIcon = () => {
    switch (settings.theme) {
      case 'light': return <Sun className="w-4 h-4" />;
      case 'dark': return <Moon className="w-4 h-4" />;
      default: return <Laptop className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings2 className="w-5 h-5 mr-2" />
            Allgemeine Einstellungen
          </CardTitle>
          <CardDescription>Grundlegende Konfiguration der Anwendung</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8FBC8F]"></div>
            <span className="ml-3 text-muted-foreground">Lade Einstellungen...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Garten-Konfiguration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings2 className="w-5 h-5 mr-2" />
            Garten-Konfiguration
          </CardTitle>
          <CardDescription>Grundlegende Garten-Einstellungen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="bed-count">Anzahl der Beete</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="bed-count"
                type="number"
                min="1"
                max="50"
                value={settings.currentBeetCount}
                onChange={(e) => handleSettingChange('currentBeetCount', parseInt(e.target.value) || 20)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">Beete (1-50)</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Legt fest, wie viele Beetpositionen in der Übersicht angezeigt werden. 
              Änderungen werden sofort in der Gartenvisualisierung sichtbar.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Erscheinungsbild */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            Erscheinungsbild
          </CardTitle>
          <CardDescription>Design und Darstellung der Anwendung</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="theme">Design-Modus</Label>
              <Select 
                value={settings.theme} 
                onValueChange={(value: 'light' | 'dark' | 'system') => 
                  handleSettingChange('theme', value)
                }
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center">
                    {getThemeIcon()}
                    <SelectValue className="ml-2" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">
                    <div className="flex items-center">
                      <Laptop className="w-4 h-4 mr-2" />
                      System folgen
                    </div>
                  </SelectItem>
                  <SelectItem value="light">
                    <div className="flex items-center">
                      <Sun className="w-4 h-4 mr-2" />
                      Hell
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center">
                      <Moon className="w-4 h-4 mr-2" />
                      Dunkel
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Sprache</Label>
              <Select 
                value={settings.language} 
                onValueChange={(value: 'de' | 'en') => 
                  handleSettingChange('language', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="compact-mode">Kompakt-Modus</Label>
                <p className="text-sm text-muted-foreground">
                  Reduzierte Abstände für mehr Inhalt auf dem Bildschirm
                </p>
              </div>
              <Switch
                id="compact-mode"
                checked={settings.compactMode}
                onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="animations">Animationen</Label>
                <p className="text-sm text-muted-foreground">
                  Übergänge und bewegte Elemente aktivieren
                </p>
              </div>
              <Switch
                id="animations"
                checked={settings.showAnimations}
                onCheckedChange={(checked) => handleSettingChange('showAnimations', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dateien & Speicher */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HardDrive className="w-5 h-5 mr-2" />
            Dateien & Speicher
          </CardTitle>
          <CardDescription>Automatisches Speichern und Backup-Einstellungen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-save">Automatisches Speichern</Label>
              <p className="text-sm text-muted-foreground">
                Änderungen werden automatisch gespeichert
              </p>
            </div>
            <Switch
              id="auto-save"
              checked={settings.autoSave}
              onCheckedChange={(checked) => handleSettingChange('autoSave', checked)}
            />
          </div>

          {settings.autoSave && (
            <div className="space-y-2">
              <Label htmlFor="auto-save-interval">Speicher-Intervall (Minuten)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="auto-save-interval"
                  type="number"
                  min="1"
                  max="60"
                  value={settings.autoSaveInterval}
                  onChange={(e) => handleSettingChange('autoSaveInterval', parseInt(e.target.value) || 5)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">Minuten</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="max-backups">Maximale Backup-Dateien</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="max-backups"
                type="number"
                min="5"
                max="100"
                value={settings.maxBackupFiles}
                onChange={(e) => handleSettingChange('maxBackupFiles', parseInt(e.target.value) || 10)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">Dateien</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="export-path">Standard-Export-Pfad</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="export-path"
                value={settings.defaultExportPath}
                onChange={(e) => handleSettingChange('defaultExportPath', e.target.value)}
                placeholder="Pfad für Exporte..."
                className="flex-1"
                readOnly={isElectronApp}
              />
              {isElectronApp && (
                <Button variant="outline" size="sm" onClick={selectExportPath}>
                  <Folder className="w-4 h-4 mr-2" />
                  Auswählen
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benachrichtigungen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Benachrichtigungen
          </CardTitle>
          <CardDescription>Erinnerungen und Statusmeldungen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Benachrichtigungen anzeigen</Label>
              <p className="text-sm text-muted-foreground">
                Toast-Nachrichten bei wichtigen Ereignissen
              </p>
            </div>
            <Switch
              id="notifications"
              checked={settings.showNotifications}
              onCheckedChange={(checked) => handleSettingChange('showNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound">Sound-Effekte</Label>
              <p className="text-sm text-muted-foreground">
                Akustische Signale für Benachrichtigungen
              </p>
            </div>
            <Switch
              id="sound"
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => handleSettingChange('soundEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reminders">Erinnerungen</Label>
              <p className="text-sm text-muted-foreground">
                Automatische Erinnerungen für Garten-Aufgaben
              </p>
            </div>
            <Switch
              id="reminders"
              checked={settings.reminderNotifications}
              onCheckedChange={(checked) => handleSettingChange('reminderNotifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="w-5 h-5 mr-2" />
            Performance
          </CardTitle>
          <CardDescription>Optimierung für bessere Leistung</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="image-quality">Bildqualität</Label>
            <Select 
              value={settings.imageQuality} 
              onValueChange={(value: 'low' | 'medium' | 'high') => 
                handleSettingChange('imageQuality', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Niedrig (schnell)</SelectItem>
                <SelectItem value="medium">Mittel (ausgewogen)</SelectItem>
                <SelectItem value="high">Hoch (beste Qualität)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-image-size">Maximale Bildgröße (MB)</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="max-image-size"
                type="number"
                min="1"
                max="50"
                value={settings.maxImageSize}
                onChange={(e) => handleSettingChange('maxImageSize', parseInt(e.target.value) || 10)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">MB</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="caching">Caching aktivieren</Label>
              <p className="text-sm text-muted-foreground">
                Bilder und Daten zwischenspeichern für bessere Performance
              </p>
            </div>
            <Switch
              id="caching"
              checked={settings.enableCaching}
              onCheckedChange={(checked) => handleSettingChange('enableCaching', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Erweiterte Einstellungen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Erweiterte Einstellungen
          </CardTitle>
          <CardDescription>Entwickler- und Debug-Optionen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="logging">Logging aktivieren</Label>
              <p className="text-sm text-muted-foreground">
                Detaillierte Logs für Fehlerbehebung
              </p>
            </div>
            <Switch
              id="logging"
              checked={settings.enableLogging}
              onCheckedChange={(checked) => handleSettingChange('enableLogging', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="debug">Debug-Modus</Label>
              <p className="text-sm text-muted-foreground">
                Erweiterte Entwicklertools und Informationen
              </p>
            </div>
            <Switch
              id="debug"
              checked={settings.debugMode}
              onCheckedChange={(checked) => handleSettingChange('debugMode', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="telemetry">Telemetrie</Label>
              <p className="text-sm text-muted-foreground">
                Anonyme Nutzungsstatistiken zur Verbesserung der App
              </p>
            </div>
            <Switch
              id="telemetry"
              checked={settings.telemetryEnabled}
              onCheckedChange={(checked) => handleSettingChange('telemetryEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Aktionen */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {hasChanges && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  Ungespeicherte Änderungen
                </Badge>
              )}
              {!hasChanges && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Gespeichert
                </Badge>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={resetSettings}
                disabled={isLoading}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Zurücksetzen
              </Button>
              <Button 
                onClick={saveSettings}
                disabled={isLoading || !hasChanges}
                className="bg-[#8FBC8F] hover:bg-[#2e7d32]"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Speichere...' : 'Speichern'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
