'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Home,
  Leaf,
  Camera,
  BarChart3,
  Repeat,
  Settings,
  Users,
  HardDrive,
  PlusCircle,
  Image,
  FileText,
  LayoutDashboard,
  Network,
  CheckCircle2,
  Info,
  Lightbulb,
  AlertTriangle,
  CloudRain,
} from 'lucide-react';

interface Section {
  id: string;
  title: string;
  icon: any;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  content: React.ReactNode;
}

export default function HandbuchPage() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['erste-schritte']));

  const toggle = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const Step = ({ num, text }: { num: number; text: string }) => (
    <div className="flex items-start gap-3 py-1">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">
        {num}
      </span>
      <span className="text-sm">{text}</span>
    </div>
  );

  const Tip = ({ text }: { text: string }) => (
    <div className="flex items-start gap-2 mt-3 p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-sm">
      <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{text}</span>
    </div>
  );

  const Warn = ({ text }: { text: string }) => (
    <div className="flex items-start gap-2 mt-3 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{text}</span>
    </div>
  );

  const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mt-4">
      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">{title}</h4>
      {children}
    </div>
  );

  const sections: Section[] = [
    {
      id: 'erste-schritte',
      title: 'Erste Schritte & Navigation',
      icon: Home,
      badge: 'Start hier',
      badgeVariant: 'default',
      content: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            GartenMeister ist eine Desktop-App zur Verwaltung von Gartenbeeten, Kräutern, Ernten und Fotos.
            Die Navigation erfolgt über die Leiste auf der linken Seite.
          </p>
          <SubSection title="Hauptbereiche">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {[
                { icon: Home, label: 'Übersicht', desc: 'Startseite mit aktuellen Beeten' },
                { icon: LayoutDashboard, label: 'Dashboard', desc: 'Statistiken und Schnellzugriff' },
                { icon: Leaf, label: 'Kräutersorten', desc: 'Alle verwalteten Pflanzen' },
                { icon: Camera, label: 'Bildersammlung', desc: 'Fotos nach Beet/Kraut' },
                { icon: BarChart3, label: 'Ernteberichte', desc: 'Ernte-Aufzeichnungen' },
                { icon: CloudRain, label: 'Gartenwerkzeuge', desc: 'Wetter & Hilfsmittel' },
                { icon: Repeat, label: 'Routinen', desc: 'Wiederkehrende Aufgaben' },
                { icon: Settings, label: 'Einstellungen', desc: 'App konfigurieren' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-2 p-2 rounded border text-sm">
                  <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                  <div>
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground"> — {desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </SubSection>
          <Tip text="Die Sidebar lässt sich durch Klick auf den Pfeil am oberen Rand auf ein Icon-Menü verkleinern — nützlich auf kleineren Bildschirmen." />
        </div>
      ),
    },
    {
      id: 'benutzer',
      title: 'Benutzerverwaltung',
      icon: Users,
      content: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Mehrere Benutzer können die App gemeinsam nutzen. Jeder Benutzer hat eigene Einstellungen und Aktivitätsprotokolle.
          </p>
          <SubSection title="Benutzer anlegen">
            <Step num={1} text="Sidebar → Benutzer öffnen" />
            <Step num={2} text='Schaltfläche "Neuer Benutzer" klicken' />
            <Step num={3} text="Name und optional Farbe/Avatar festlegen" />
            <Step num={4} text='Mit "Speichern" bestätigen' />
          </SubSection>
          <SubSection title="Benutzer wechseln">
            <p className="text-sm text-muted-foreground">
              Unten in der Sidebar befindet sich der Benutzer-Umschalter. Mit einem Klick auf den angezeigten Namen öffnet sich die Auswahl aller angelegten Benutzer.
            </p>
          </SubSection>
          <Tip text="Der aktive Benutzer wird in Ernte-Einträgen und Aktivitätsprotokollen automatisch vermerkt." />
        </div>
      ),
    },
    {
      id: 'beete',
      title: 'Beete verwalten',
      icon: PlusCircle,
      content: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Beete sind die zentrale Verwaltungseinheit der App. Jedes Beet kann mehrere Kräutersorten enthalten.
          </p>
          <SubSection title="Neues Beet anlegen">
            <Step num={1} text='Schaltfläche "Neues Beet" (grün, unten in der Sidebar) klicken' />
            <Step num={2} text="Name, Typ und Quadrant auswählen" />
            <Step num={3} text="Kräutersorten zuweisen (optional)" />
            <Step num={4} text="Speichern" />
          </SubSection>
          <SubSection title="Beet bearbeiten">
            <Step num={1} text="Übersicht öffnen → gewünschtes Beet anklicken" />
            <Step num={2} text='Schaltfläche "Bearbeiten" im Detailbereich klicken' />
            <Step num={3} text="Änderungen vornehmen und speichern" />
          </SubSection>
          <SubSection title="Gartenvisualisierung">
            <p className="text-sm text-muted-foreground">
              Auf der Übersichtsseite gibt es eine grafische Draufsicht des Gartens. Beete sind nach Quadrant farblich gekennzeichnet. Ein Klick auf ein Beet öffnet den Detailbereich.
            </p>
          </SubSection>
          <Warn text="Gelöschte Beete können nicht wiederhergestellt werden — vorher eine Datensicherung erstellen!" />
        </div>
      ),
    },
    {
      id: 'kraeutersorten',
      title: 'Kräutersorten',
      icon: Leaf,
      content: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Im Bereich "Kräutersorten" werden alle Pflanzenarten verwaltet, die in den Beeten angebaut werden.
          </p>
          <SubSection title="Neue Kräutersorte anlegen">
            <Step num={1} text='Sidebar → "Kräutersorten" öffnen' />
            <Step num={2} text='Schaltfläche "Neue Kräutersorte" klicken' />
            <Step num={3} text="Name, botanischer Name und Eigenschaften eingeben" />
            <Step num={4} text="Bild optional hochladen" />
            <Step num={5} text="Speichern" />
          </SubSection>
          <SubSection title="Kräuter einem Beet zuweisen">
            <p className="text-sm text-muted-foreground">
              Die Zuweisung erfolgt entweder direkt beim Anlegen/Bearbeiten eines Beets oder über die Detailansicht einer Kräutersorte.
            </p>
          </SubSection>
          <Tip text="Über die Suchfunktion können Kräuter schnell nach Name oder Eigenschaft gefiltert werden." />
        </div>
      ),
    },
    {
      id: 'fotos',
      title: 'Fotos & Bildersammlung',
      icon: Camera,
      content: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Fotos können direkt aus der App oder per Smartphone-Upload über das NAS hinzugefügt werden.
          </p>
          <SubSection title="Foto am PC hinzufügen">
            <Step num={1} text='Sidebar → "Bildersammlung" öffnen' />
            <Step num={2} text="Beet oder Kraut auswählen" />
            <Step num={3} text='Schaltfläche "Foto hinzufügen" klicken' />
            <Step num={4} text="Bild aus dem Dateisystem auswählen" />
          </SubSection>
          <SubSection title="Foto per Smartphone (NAS)">
            <Step num={1} text="Einstellungen → NAS → Verbindung einrichten" />
            <Step num={2} text="QR-Code scannen → upload.html öffnet sich im Browser" />
            <Step num={3} text="Foto aufnehmen oder aus Galerie wählen → Hochladen" />
            <Step num={4} text="Foto erscheint automatisch in der App (nach Sync)" />
          </SubSection>
          <Tip text="EXIF-Daten (Aufnahmedatum, GPS) werden automatisch ausgelesen und dem Foto zugeordnet." />
        </div>
      ),
    },
    {
      id: 'ernte',
      title: 'Ernte erfassen',
      icon: BarChart3,
      content: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Erntemengen werden pro Beet und Datum erfasst. Die Daten fließen automatisch in die Berichte ein.
          </p>
          <SubSection title="Ernte eintragen">
            <Step num={1} text="Übersicht → Beet auswählen" />
            <Step num={2} text='Schaltfläche "Ernte eintragen" klicken' />
            <Step num={3} text="Menge, Einheit und Datum eingeben" />
            <Step num={4} text="Optional: Notiz hinzufügen" />
            <Step num={5} text="Speichern" />
          </SubSection>
          <SubSection title="Ernte-History">
            <p className="text-sm text-muted-foreground">
              Alle Einträge eines Beets sind in der Detailansicht sichtbar. Im Bereich "Ernteberichte" gibt es eine Gesamtübersicht mit Filteroptionen nach Zeitraum und Kräutersorte.
            </p>
          </SubSection>
        </div>
      ),
    },
    {
      id: 'berichte',
      title: 'Berichte & PDF-Export',
      icon: FileText,
      content: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Erntedaten, Beet-Übersichten und Aktivitätsprotokolle lassen sich als PDF exportieren.
          </p>
          <SubSection title="Bericht erstellen">
            <Step num={1} text='Sidebar → "Ernteberichte" öffnen' />
            <Step num={2} text="Zeitraum und Beete auswählen" />
            <Step num={3} text='Schaltfläche "PDF exportieren" klicken' />
            <Step num={4} text="Speicherort wählen → PDF wird erzeugt" />
          </SubSection>
          <Tip text="Der Export enthält automatisch Diagramme und Summen — keine manuelle Aufbereitung notwendig." />
          <Warn text="Für den PDF-Export muss die App vollständig gestartet sein (nicht nur das Tray-Icon). Bei Problemen App neu starten." />
        </div>
      ),
    },
    {
      id: 'routinen',
      title: 'Routinen & Aufgaben',
      icon: Repeat,
      content: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Wiederkehrende Aufgaben (Gießen, Düngen, Schneiden) können als Routinen angelegt werden.
          </p>
          <SubSection title="Routine anlegen">
            <Step num={1} text='Sidebar → "Routinen" öffnen' />
            <Step num={2} text='Schaltfläche "Neue Routine" klicken' />
            <Step num={3} text="Aufgabe beschreiben, Intervall wählen (täglich / wöchentlich / …)" />
            <Step num={4} text="Beete zuweisen" />
            <Step num={5} text="Speichern" />
          </SubSection>
          <SubSection title="Aufgabe als erledigt markieren">
            <p className="text-sm text-muted-foreground">
              In der Routinen-Übersicht jede fällige Aufgabe mit dem Haken-Symbol abhaken. Das Erledigungsdatum wird automatisch gespeichert.
            </p>
          </SubSection>
        </div>
      ),
    },
    {
      id: 'nas',
      title: 'NAS-Synchronisierung',
      icon: Network,
      content: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Fotos und Daten können über ein Synology NAS (Heimnetz oder Tailscale) mit mehreren Geräten synchronisiert werden.
          </p>
          <SubSection title="NAS einrichten">
            <Step num={1} text="Einstellungen → NAS öffnen" />
            <Step num={2} text="NAS-URL eingeben: http://100.121.103.107:3003 (Tailscale-IP der NAS DS124-RockingK)" />
            <Step num={3} text='Schaltfläche "Verbindung testen" klicken' />
            <Step num={4} text="Bei Erfolg: Sync aktivieren und speichern" />
          </SubSection>
          <SubSection title="Smartphone-Upload">
            <Step num={1} text="NAS muss aktiv und verbunden sein" />
            <Step num={2} text="In den NAS-Einstellungen den QR-Code anzeigen" />
            <Step num={3} text="QR-Code mit dem Smartphone scannen" />
            <Step num={4} text="Foto in der Upload-Seite auswählen und hochladen" />
          </SubSection>
          <Tip text="Der NAS-Server (server-gartenmeister.js) muss auf dem NAS laufen. Autostart über den DSM-Aufgabenplaner einrichten." />
        </div>
      ),
    },
    {
      id: 'datensicherung',
      title: 'Datensicherung & Wiederherstellung',
      icon: HardDrive,
      content: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Alle App-Daten liegen in <code className="text-xs bg-muted px-1 py-0.5 rounded">%APPDATA%\GartenMeister-Portable\</code>.
            Regelmäßige Backups schützen vor Datenverlust.
          </p>
          <SubSection title="Backup erstellen">
            <Step num={1} text='Sidebar → "Datensicherung" öffnen' />
            <Step num={2} text='Schaltfläche "Backup erstellen" klicken' />
            <Step num={3} text="Speicherort wählen — ZIP-Datei mit allen Daten wird erzeugt" />
          </SubSection>
          <SubSection title="Backup wiederherstellen">
            <Step num={1} text='Sidebar → "Datensicherung" öffnen' />
            <Step num={2} text='Schaltfläche "Backup importieren" klicken' />
            <Step num={3} text="ZIP-Datei auswählen — App liest die Daten ein" />
            <Step num={4} text="App neu starten" />
          </SubSection>
          <Warn text="Beim Importieren werden alle aktuellen Daten überschrieben. Vorher ein frisches Backup erstellen!" />
        </div>
      ),
    },
    {
      id: 'einstellungen',
      title: 'Einstellungen',
      icon: Settings,
      content: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Unter Einstellungen wird die App konfiguriert. Die Seite ist in folgende Tabs gegliedert:
          </p>
          <SubSection title="Tabs in den Einstellungen">
            <div className="space-y-1 mt-1">
              {[
                { label: 'Allgemein', desc: 'Theme, Startseite, Anzeigepräferenzen' },
                { label: 'OneDrive', desc: 'OneDrive-Backup aktivieren und konfigurieren' },
                { label: 'Wetter-API', desc: 'OpenWeatherMap-API-Key und Standort' },
                { label: 'NAS-Integration', desc: 'NAS-URL eingeben, Verbindung testen, QR-Code für Smartphone-Upload' },
                { label: 'Remote-Zugriff', desc: 'Lokale und Remote-NAS-Verbindung (SMB / Quickconnect)' },
                { label: 'Remote-Clients', desc: 'Upload-Clients verwalten' },
                { label: 'Lageplan', desc: 'Gartenvisualisierung konfigurieren (Quadranten, Wege, Maßstab)' },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-start gap-2 text-sm py-1">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span><span className="font-medium">{label}</span> — {desc}</span>
                </div>
              ))}
            </div>
          </SubSection>
          <Tip text="Einstellungen werden nach dem Klick auf 'Speichern' sofort übernommen. Ein Neustart ist in der Regel nicht notwendig." />
        </div>
      ),
    },
    {
      id: 'haeufige-probleme',
      title: 'Häufige Probleme',
      icon: Info,
      badge: 'FAQ',
      badgeVariant: 'secondary',
      content: (
        <div className="space-y-4">
          {[
            {
              q: 'App startet, aber Daten sind leer',
              a: 'Datenpfad in den Einstellungen prüfen. Standard: %APPDATA%\\GartenMeister-Portable\\. App neu starten.',
            },
            {
              q: 'Fotos werden nicht angezeigt',
              a: 'Sicherstellen, dass die Bilddateien im konfigurierten Bildpfad liegen. NAS-Verbindung testen falls NAS-Sync aktiv.',
            },
            {
              q: 'PDF-Export schlägt fehl',
              a: 'App vollständig starten (nicht nur Tray). Schreibrechte im Zielordner prüfen. App-Neustart hilft oft.',
            },
            {
              q: 'NAS-Verbindungstest schlägt fehl',
              a: 'NAS-Server läuft? http://100.121.103.107:3003/api/health im Browser testen. Tailscale VPN aktiv? URL ohne abschließenden Schrägstrich eingeben.',
            },
            {
              q: 'Benutzer-Wechsel hat keine Wirkung',
              a: 'Seite neuladen (Strg+R in der App). Falls das Problem anhält, App neu starten.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="border rounded-md p-3">
              <p className="font-medium text-sm mb-1">❓ {q}</p>
              <p className="text-sm text-muted-foreground">→ {a}</p>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <BookOpen className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bedienerhandbuch</h1>
          <p className="text-muted-foreground text-sm">GartenMeister v2.0 — Benutzeranleitung</p>
        </div>
      </div>
      <Separator className="my-4" />

      {/* Info-Banner */}
      <div className="flex items-start gap-2 p-3 mb-6 rounded-md bg-green-50 border border-green-200 text-green-800 text-sm">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Dieses Handbuch beschreibt alle Funktionen der App. Klicke auf einen Abschnitt um ihn zu öffnen. 
          Inhalt und Layout werden laufend verbessert.
        </span>
      </div>

      {/* Schnellübersicht */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {[
          { label: 'Abschnitte', value: String(sections.length), icon: BookOpen },
          { label: 'Bereiche', value: '7', icon: LayoutDashboard },
          { label: 'Version', value: '2.0.0', icon: CheckCircle2 },
          { label: 'Stand', value: '12.04.26', icon: Info },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="text-center py-3">
            <Icon className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </Card>
        ))}
      </div>

      {/* Sektionen */}
      <div className="space-y-3">
        {sections.map((section) => {
          const isOpen = openSections.has(section.id);
          const Icon = section.icon;
          return (
            <Collapsible key={section.id} open={isOpen} onOpenChange={() => toggle(section.id)}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="hover:bg-muted/50 transition-colors cursor-pointer py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                        <CardTitle className="text-base text-left">{section.title}</CardTitle>
                        {section.badge && (
                          <Badge variant={section.badgeVariant ?? 'secondary'} className="ml-1">
                            {section.badge}
                          </Badge>
                        )}
                      </div>
                      {isOpen
                        ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4">
                    <Separator className="mb-4" />
                    {section.content}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      <Separator className="my-6" />
      <p className="text-xs text-center text-muted-foreground">
        GartenMeister v2.0.0 — Bedienerhandbuch · Inhalt wird laufend erweitert
      </p>
    </div>
  );
}
