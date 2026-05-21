'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  HelpCircle, 
  BookOpen, 
  Settings, 
  Download, 
  Folder, 
  Network,
  FileText,
  Play,
  ChevronDown,
  ChevronRight,
  Info,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react';

export default function HilfePage() {
  const [openSections, setOpenSections] = useState(new Set(['erste-schritte']));
  const [copiedText, setCopiedText] = useState('');

  const toggleSection = (section: string) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(section)) {
      newOpenSections.delete(section);
    } else {
      newOpenSections.add(section);
    }
    setOpenSections(newOpenSections);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const HelpSection = ({ id, title, icon: Icon, children, priority = 'normal' }: {
    id: string;
    title: string;
    icon: any;
    children: React.ReactNode;
    priority?: 'high' | 'normal' | 'low';
  }) => {
    const isOpen = openSections.has(id);
    const priorityColors = {
      high: 'border-red-200 bg-red-50',
      normal: 'border-gray-200 bg-white',
      low: 'border-gray-100 bg-gray-50'
    };

    return (
      <Collapsible open={isOpen} onOpenChange={() => toggleSection(id)}>
        <Card className={`${priorityColors[priority]} transition-all`}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-left">{title}</CardTitle>
                  {priority === 'high' && (
                    <Badge variant="destructive" className="ml-2">Wichtig</Badge>
                  )}
                </div>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {children}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  };

  const CodeBlock = ({ code, label }: { code: string; label?: string }) => (
    <div className="relative bg-gray-900 text-gray-100 p-4 rounded-lg my-3">
      {label && (
        <div className="text-xs text-gray-400 mb-2">{label}</div>
      )}
      <pre className="text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
        onClick={() => copyToClipboard(code)}
      >
        <Copy className="h-4 w-4" />
      </Button>
      {copiedText === code && (
        <div className="absolute top-8 right-2 text-xs text-green-400">
          Kopiert!
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-green-800 mb-2 flex items-center gap-3">
          <HelpCircle className="h-8 w-8" />
          GartenMeister Hilfe & Anleitungen
        </h1>
        <p className="text-gray-600">
          Vollständige Anleitung für die GartenMeister Desktop-Anwendung
        </p>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-600" />
              Schnellstart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Erste Schritte mit GartenMeister
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toggleSection('erste-schritte')}
            >
              Jetzt starten
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-600" />
              Konfiguration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              NAS, Wetter & Einstellungen
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toggleSection('konfiguration')}
            >
              Einrichten
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Problemlösung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Häufige Probleme & Lösungen
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toggleSection('problemloesung')}
            >
              Hilfe finden
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Help Content */}
      <div className="space-y-4">
        
        {/* Erste Schritte */}
        <HelpSection 
          id="erste-schritte" 
          title="Erste Schritte mit GartenMeister" 
          icon={Play}
          priority="high"
        >
          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Willkommen!</strong> Diese Anleitung hilft Ihnen beim Einstieg in GartenMeister.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-green-800">1. Grundlegende Navigation</h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Dashboard: Überblick über Ihren Garten
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Beete: Verwalten Sie Ihre Gartenbereiche
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Kräuter: Pflanzendatenbank
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Ernte: Protokollieren Sie Ihre Erträge
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-green-800">2. Erstes Beet anlegen</h4>
                <ol className="space-y-1 text-sm list-decimal list-inside">
                  <li>Gehen Sie zu "Beete" in der Seitenleiste</li>
                  <li>Klicken Sie auf "Neues Beet hinzufügen"</li>
                  <li>Füllen Sie Name und Eigenschaften aus</li>
                  <li>Speichern Sie das Beet</li>
                  <li>Fügen Sie Kräuter hinzu</li>
                </ol>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-600" />
                Profi-Tipp
              </h4>
              <p className="text-sm text-gray-600">
                Starten Sie mit einem kleinen Testbeet, um sich mit der Software vertraut zu machen. 
                Sie können später beliebig viele Beete hinzufügen und organisieren.
              </p>
            </div>
          </div>
        </HelpSection>

        {/* Wetterdatensammlung */}
        <HelpSection 
          id="wetterdatensammlung" 
          title="Wetterdatensammlung & NAS-Integration" 
          icon={Wifi}
          priority="high"
        >
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Automatisch verfügbar!</strong> Das Weather-System ist bereits funktionsfähig und 
                sammelt Wetterdaten für optimale Gartenplanung.
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="setup" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="setup">Einrichtung</TabsTrigger>
                <TabsTrigger value="nas">NAS-Integration</TabsTrigger>
                <TabsTrigger value="apis">API-Konfiguration</TabsTrigger>
              </TabsList>

              <TabsContent value="setup" className="space-y-4">
                <h4 className="font-semibold">Grundlegende Einrichtung</h4>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <p className="font-medium">Weather-Seite öffnen</p>
                      <p className="text-sm text-gray-600">Gehen Sie zu "Gartenwerkzeuge" in der Seitenleiste</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <p className="font-medium">Automatische Sammlung aktivieren</p>
                      <p className="text-sm text-gray-600">Standard-Intervall: Alle 2 Stunden</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <p className="font-medium">Daten überprüfen</p>
                      <p className="text-sm text-gray-600">Statistiken und Graphen werden automatisch generiert</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Datenspeicherung in EXE-Modus:</h5>
                  <CodeBlock 
                    code="📁 Automatische Pfad-Erkennung:
1. Neben der EXE-Datei: /weather-data/
2. User-Verzeichnis: ~/GartenMeister/weather-data/
3. Temporäres Verzeichnis (Fallback)"
                    label="Speicherorte"
                  />
                </div>
              </TabsContent>

              <TabsContent value="nas" className="space-y-4">
                <h4 className="font-semibold">NAS-Synchronisation einrichten</h4>
                
                <Alert className="border-blue-200 bg-blue-50">
                  <Network className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Automatische NAS-Erkennung:</strong> Das System erkennt automatisch verfügbare NAS-Laufwerke und synchronisiert Wetterdaten.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <h5 className="font-semibold">Unterstützte NAS-Pfade:</h5>
                  <CodeBlock 
                    code="G:\gartenmeister\weather\      # Laufwerk G
Z:\gartenmeister\weather\      # Laufwerk Z  
\\nas\gartenmeister\weather\   # Netzwerk-Pfad
/volume1/gartenmeister/weather # Synology"
                    label="Standard NAS-Pfade"
                  />
                </div>

                <div className="space-y-3">
                  <h5 className="font-semibold">Manuelle Konfiguration:</h5>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Stellen Sie sicher, dass das NAS-Laufwerk gemountet ist</li>
                    <li>Erstellen Sie den Ordner <code className="bg-gray-200 px-1 rounded">gartenmeister/weather</code></li>
                    <li>Starten Sie GartenMeister neu für automatische Erkennung</li>
                    <li>Das System migriert vorhandene Daten automatisch</li>
                  </ol>
                </div>
              </TabsContent>

              <TabsContent value="apis" className="space-y-4">
                <h4 className="font-semibold">Weather API Konfiguration</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h5 className="font-semibold text-green-700">✅ OpenWeatherMap (Standard)</h5>
                    <p className="text-sm text-gray-600">Bereits konfiguriert und einsatzbereit</p>
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                      <p className="text-sm">
                        <strong>Status:</strong> Aktiv<br/>
                        <strong>Location:</strong> Gurk, Österreich<br/>
                        <strong>Intervall:</strong> 2 Stunden
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-semibold text-blue-700">🔵 Meteoblue (Optional)</h5>
                    <p className="text-sm text-gray-600">Premium Weather Service</p>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">API Key benötigt:</p>
                      <CodeBlock 
                        code="1. Registrierung: meteoblue.com
2. API Key erhalten
3. In GartenMeister eintragen
4. Provider aktivieren"
                        label="Meteoblue Setup"
                      />
                    </div>
                  </div>
                </div>

                <Alert className="border-yellow-200 bg-yellow-50">
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Tipp:</strong> OpenWeatherMap reicht für die meisten Anwendungen aus. 
                    Meteoblue bietet zusätzliche Präzision für professionelle Landwirtschaft.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </div>
        </HelpSection>

        {/* Konfiguration */}
        <HelpSection 
          id="konfiguration" 
          title="System-Konfiguration & Einstellungen" 
          icon={Settings}
        >
          <div className="space-y-4">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">Allgemein</TabsTrigger>
                <TabsTrigger value="storage">Speicher</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
                <TabsTrigger value="advanced">Erweitert</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <h4 className="font-semibold">Grundeinstellungen</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="font-medium">Benutzeroberfläche</h5>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Theme: Hell/Dunkel automatisch</li>
                      <li>• Sprache: Deutsch (Standard)</li>
                      <li>• Sidebar: Einklappbar</li>
                      <li>• Shortcuts: Standardtasten</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-medium">Garteneinstellungen</h5>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Standort: Gurk, Österreich</li>
                      <li>• Maßeinheiten: Metrisch</li>
                      <li>• Kalender: Gregorianisch</li>
                      <li>• Zeitzone: CEST/CET</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="storage" className="space-y-4">
                <h4 className="font-semibold">Datenspeicherung</h4>
                
                <Alert className="border-blue-200 bg-blue-50">
                  <HardDrive className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Portable EXE:</strong> Alle Daten werden automatisch neben der Anwendung gespeichert. 
                    Keine Installation erforderlich!
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <h5 className="font-semibold">Speicherorte:</h5>
                  <CodeBlock 
                    code="📁 EXE-Modus:
   ./app-data/           # Hauptdaten
   ./weather-data/       # Wetterdaten  
   ./backups/           # Automatische Backups
   ./exports/           # PDF-Exporte

📁 NAS-Modus (wenn verfügbar):
   G:\gartenmeister\    # Alle Daten
   \\nas\gartenmeister\ # Netzwerk-Sync"
                    label="Verzeichnisstruktur"
                  />
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Automatische Backups:</h5>
                  <ul className="text-sm space-y-1">
                    <li>• Täglich: Alle Anwendungsdaten</li>
                    <li>• Wöchentlich: Wetterdaten</li>
                    <li>• Aufbewahrung: 30 Tage</li>
                    <li>• Format: JSON (human-readable)</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="export" className="space-y-4">
                <h4 className="font-semibold">PDF-Export Konfiguration</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h5 className="font-semibold">Verfügbare Exporte:</h5>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        Beete-Übersicht
                      </li>
                      <li className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-green-600" />
                        Gartenplan
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-orange-600" />
                        Ernteprotokoll
                      </li>
                      <li className="flex items-center gap-2">
                        <Wifi className="h-4 w-4 text-purple-600" />
                        Wetterstatistiken
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-semibold">Export-Einstellungen:</h5>
                    <CodeBlock 
                      code="Format: PDF (A4)
Qualität: Hoch (300 DPI)
Schrift: Arial/Helvetica
Farben: Vollfarbe
Speicher: ./exports/
Auto-Öffnen: Ja"
                      label="Standard-Konfiguration"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <h4 className="font-semibold">Erweiterte Einstellungen</h4>
                
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Achtung:</strong> Diese Einstellungen sind für erfahrene Benutzer gedacht.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold mb-2">IPC-System Status:</h5>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Handler registriert:</strong> 29
                        </div>
                        <div>
                          <strong>Status:</strong> ✅ Aktiv
                        </div>
                        <div>
                          <strong>Phase 1:</strong> ✅ Core Features
                        </div>
                        <div>
                          <strong>Phase 2:</strong> ✅ Extended Features
                        </div>
                        <div>
                          <strong>Phase 3:</strong> ✅ React Hooks
                        </div>
                        <div>
                          <strong>Weather:</strong> ✅ NAS-kompatibel
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold mb-2">Debug-Informationen:</h5>
                    <CodeBlock 
                      code="Entwicklertools: F12
Logs: Console Tab
IPC-Test: window.electronAPI
Version: Check About Dialog
Portable: process.pkg === true"
                      label="Debug-Kommandos"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </HelpSection>

        {/* Problemlösung */}
        <HelpSection 
          id="problemloesung" 
          title="Problemlösung & Häufige Fragen" 
          icon={AlertTriangle}
          priority="high"
        >
          <div className="space-y-4">
            <Tabs defaultValue="common" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="common">Häufige Probleme</TabsTrigger>
                <TabsTrigger value="weather">Wetter-System</TabsTrigger>
                <TabsTrigger value="data">Daten & Backup</TabsTrigger>
              </TabsList>

              <TabsContent value="common" className="space-y-4">
                <div className="space-y-4">
                  
                  <div className="border border-red-200 bg-red-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-red-800 mb-2">❌ Anwendung startet nicht</h5>
                    <div className="text-sm text-red-700 space-y-1">
                      <p><strong>Lösung 1:</strong> Windows Defender Ausnahme hinzufügen</p>
                      <p><strong>Lösung 2:</strong> Als Administrator ausführen</p>
                      <p><strong>Lösung 3:</strong> Neueste Version herunterladen</p>
                    </div>
                  </div>

                  <div className="border border-yellow-200 bg-yellow-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-yellow-800 mb-2">⚠️ Daten werden nicht gespeichert</h5>
                    <div className="text-sm text-yellow-700 space-y-1">
                      <p><strong>Ursache:</strong> Keine Schreibrechte im Verzeichnis</p>
                      <p><strong>Lösung:</strong> EXE in Benutzerverzeichnis verschieben</p>
                      <CodeBlock 
                        code="Empfohlener Pfad:
C:\Users\[IhrName]\GartenMeister\
oder
Desktop\GartenMeister\"
                        label="Sichere Verzeichnisse"
                      />
                    </div>
                  </div>

                  <div className="border border-blue-200 bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-blue-800 mb-2">ℹ️ PDF-Export funktioniert nicht</h5>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>Prüfen:</strong> Exports-Ordner existiert</p>
                      <p><strong>Prüfen:</strong> Schreibrechte vorhanden</p>
                      <p><strong>Prüfen:</strong> Ausreichend Speicherplatz</p>
                    </div>
                  </div>

                </div>
              </TabsContent>

              <TabsContent value="weather" className="space-y-4">
                <div className="space-y-4">
                  
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Status:</strong> Weather-System ist vollständig EXE- und NAS-kompatibel implementiert!
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <h5 className="font-semibold">Wetter-Troubleshooting:</h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h6 className="font-medium text-green-700">✅ Funktioniert bereits:</h6>
                        <ul className="text-sm space-y-1">
                          <li>• OpenWeatherMap Integration</li>
                          <li>• Automatische Datensammlung</li>
                          <li>• EXE-kompatible Speicherung</li>
                          <li>• NAS-Synchronisation</li>
                          <li>• Backup & Recovery</li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h6 className="font-medium text-blue-700">🔧 Bei Problemen prüfen:</h6>
                        <ul className="text-sm space-y-1">
                          <li>• Internet-Verbindung aktiv?</li>
                          <li>• Firewall blockiert Zugriff?</li>
                          <li>• Weather-Ordner beschreibbar?</li>
                          <li>• NAS-Laufwerk gemountet?</li>
                        </ul>
                      </div>
                    </div>

                    <CodeBlock 
                      code="# Manual Weather Test (Entwicklertools):
await window.electronAPI.invoke('weather:collect-current')
await window.electronAPI.invoke('weather:get-stored-data')
await window.electronAPI.invoke('weather:get-config')"
                      label="Test-Kommandos"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="data" className="space-y-4">
                <div className="space-y-4">
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">💾 Daten-Recovery</h5>
                    <p className="text-sm text-gray-600 mb-3">
                      Falls Daten verloren gehen oder beschädigt werden:
                    </p>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Prüfen Sie den Backups-Ordner neben der EXE</li>
                      <li>Suchen Sie die neueste app-data-backup.json</li>
                      <li>Kopieren Sie diese als app-data.json</li>
                      <li>Starten Sie GartenMeister neu</li>
                    </ol>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">📤 Daten-Export</h5>
                    <p className="text-sm text-gray-600 mb-3">
                      Für manuelle Backups oder Migration:
                    </p>
                    <CodeBlock 
                      code="Kopieren Sie diese Ordner:
📁 app-data/         # Alle Gartendaten
📁 weather-data/     # Wetterdaten  
📁 exports/          # PDF-Dateien
📁 backups/          # Automatische Backups"
                      label="Zu sichernde Verzeichnisse"
                    />
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">🔄 Migration zwischen Computern</h5>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Kopieren Sie den kompletten GartenMeister-Ordner</li>
                      <li>Stellen Sie sicher, dass alle Unterordner mit kopiert werden</li>
                      <li>Auf dem neuen Computer: Führen Sie die EXE aus</li>
                      <li>Alle Daten und Einstellungen sind sofort verfügbar</li>
                    </ol>
                  </div>

                </div>
              </TabsContent>
            </Tabs>
          </div>
        </HelpSection>

        {/* Systemanforderungen */}
        <HelpSection 
          id="systemanforderungen" 
          title="Systemanforderungen & Technische Details" 
          icon={Cpu}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-green-800">Mindestanforderungen</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-blue-600" />
                      <span><strong>Prozessor:</strong> Dual-Core 1.5 GHz</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-green-600" />
                      <span><strong>Arbeitsspeicher:</strong> 4 GB RAM</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-orange-600" />
                      <span><strong>Speicherplatz:</strong> 200 MB</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-purple-600" />
                      <span><strong>Internet:</strong> Für Wetterdaten</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-green-800">Empfohlene Konfiguration</h4>
                <div className="bg-green-50 p-4 rounded-lg">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-blue-600" />
                      <span><strong>Prozessor:</strong> Quad-Core 2.0+ GHz</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-green-600" />
                      <span><strong>Arbeitsspeicher:</strong> 8+ GB RAM</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-orange-600" />
                      <span><strong>Speicherplatz:</strong> 1+ GB</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Network className="h-4 w-4 text-purple-600" />
                      <span><strong>NAS:</strong> Synology/QNAP</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">Technische Spezifikationen</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Framework:</strong><br/>
                  Electron 36.5.0<br/>
                  Next.js 15.3.4<br/>
                  React 18.3.1
                </div>
                <div>
                  <strong>Features:</strong><br/>
                  29 IPC-Handler<br/>
                  NAS-Integration<br/>
                  Weather-APIs
                </div>
                <div>
                  <strong>Kompatibilität:</strong><br/>
                  Windows 10/11<br/>
                  Portable EXE<br/>
                  Keine Installation
                </div>
              </div>
            </div>
          </div>
        </HelpSection>

        {/* Kontakt & Support */}
        <HelpSection 
          id="support" 
          title="Kontakt & Support" 
          icon={ExternalLink}
        >
          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Open Source:</strong> GartenMeister ist eine eigenständige Desktop-Anwendung. 
                Diese Hilfe-Dokumentation deckt alle verfügbaren Funktionen ab.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold">Weitere Hilfe finden</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Entwicklertools (F12) für Debug-Informationen</li>
                  <li>• Console-Logs für Fehlermeldungen</li>
                  <li>• Diese Hilfe-Seite als Referenz</li>
                  <li>• Backup-Funktion bei Problemen nutzen</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Verbesserungsvorschläge</h4>
                <p className="text-sm text-gray-600">
                  Dokumentieren Sie gewünschte Features oder Probleme für zukünftige Versionen. 
                  Die aktuelle Version bietet alle dokumentierten Funktionen.
                </p>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-green-800">✅ Vollständig implementiert</h4>
              <p className="text-sm text-green-700">
                Alle in dieser Hilfe beschriebenen Features sind vollständig implementiert und funktionsfähig. 
                GartenMeister ist ready-to-use ohne weitere Konfiguration!
              </p>
            </div>
          </div>
        </HelpSection>

      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>GartenMeister Desktop-Anwendung - Vollständige Hilfe & Dokumentation</p>
        <p>Letzte Aktualisierung: August 2025 - Version 1.0</p>
      </div>
    </div>
  );
}
