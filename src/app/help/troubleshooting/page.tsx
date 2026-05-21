'use client';

import React from 'react';
import Link from 'next/link';

// Simple SVG Icons als React Components
const ArrowLeft = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const AlertTriangle = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const CheckCircle = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircle = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Info = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function TroubleshootingPage() {
  const troubleshootingItems = [
    {
      category: "Allgemeine Probleme",
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      items: [
        {
          problem: "App startet nicht",
          solution: "Starten Sie die App als Administrator und überprüfen Sie, ob alle erforderlichen Dateien vorhanden sind. Stellen Sie sicher, dass Ihr System die Mindestanforderungen erfüllt."
        },
        {
          problem: "Daten werden nicht gespeichert",
          solution: "Überprüfen Sie die Schreibberechtigungen im Anwendungsordner. Stellen Sie sicher, dass ausreichend Speicherplatz verfügbar ist."
        },
        {
          problem: "App läuft langsam",
          solution: "Schließen Sie andere Programme und stellen Sie sicher, dass genügend RAM verfügbar ist. Überprüfen Sie, ob die Cloud-Sync aktiv ist und ggf. temporär deaktivieren."
        }
      ]
    },
    {
      category: "Beetverwaltung",
      icon: Info,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      items: [
        {
          problem: "Beet kann nicht erstellt werden",
          solution: "Stellen Sie sicher, dass Sie eine gültige Beetgröße eingegeben haben. Überprüfen Sie, ob bereits ein Beet mit derselben Nummer existiert."
        },
        {
          problem: "Segmente werden nicht angezeigt",
          solution: "Aktualisieren Sie die Seite (F5) oder starten Sie die App neu. Überprüfen Sie, ob das Segment korrekt gespeichert wurde."
        },
        {
          problem: "Kräuter fehlen in der Auswahlliste",
          solution: "Die Kräuterliste wird automatisch geladen. Bei Problemen starten Sie die App neu oder überprüfen Sie die Internetverbindung."
        }
      ]
    },
    {
      category: "PDF-Export",
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      items: [
        {
          problem: "PDF wird nicht erstellt",
          solution: "Überprüfen Sie, ob der Export-Ordner existiert und Schreibberechtigungen vorhanden sind. Stellen Sie sicher, dass mindestens ein Beet vorhanden ist."
        },
        {
          problem: "PDF ist leer oder unvollständig",
          solution: "Warten Sie, bis alle Beete vollständig geladen sind, bevor Sie den Export starten. Überprüfen Sie, ob alle erforderlichen Daten vorhanden sind."
        },
        {
          problem: "Export-Ordner kann nicht geöffnet werden",
          solution: "Überprüfen Sie, ob der Ordner existiert und nicht von einem anderen Programm blockiert wird. Starten Sie ggf. die App als Administrator."
        }
      ]
    },
    {
      category: "Cloud-Sync",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      items: [
        {
          problem: "Cloud-Sync funktioniert nicht",
          solution: "Überprüfen Sie die Internetverbindung und stellen Sie sicher, dass der Cloud-Ordner erreichbar ist. Prüfen Sie die Zugriffsberechtigungen."
        },
        {
          problem: "Daten werden nicht synchronisiert",
          solution: "Stellen Sie sicher, dass der Sync-Ordner korrekt konfiguriert ist. Überprüfen Sie, ob ausreichend Speicherplatz in der Cloud verfügbar ist."
        },
        {
          problem: "Konflikte bei der Synchronisation",
          solution: "Verwenden Sie nur eine Instanz der App gleichzeitig. Bei Konflikten erstellen Sie ein Backup und starten die Sync neu."
        }
      ]
    },
    {
      category: "Bildersammlung",
      icon: Info,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      items: [
        {
          problem: "Bilder werden nicht hochgeladen",
          solution: "Überprüfen Sie das Dateiformat (JPG, PNG unterstützt) und die Dateigröße. Stellen Sie sicher, dass Schreibberechtigungen vorhanden sind."
        },
        {
          problem: "Bilder werden nicht angezeigt",
          solution: "Aktualisieren Sie die Galerie (F5) und überprüfen Sie, ob die Bilddateien noch vorhanden sind. Prüfen Sie die Pfadkonfiguration."
        },
        {
          problem: "Kommentare gehen verloren",
          solution: "Stellen Sie sicher, dass die Daten korrekt gespeichert werden. Aktivieren Sie die Cloud-Sync für automatische Backups."
        }
      ]
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center mb-6">
        <Link 
          href="/help" 
          className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Fehlerbehebung</h1>
      </div>

      <div className="prose max-w-none">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
          <div className="flex items-center mb-3">
            <AlertTriangle className="text-orange-600 mr-2" />
            <h2 className="text-xl font-semibold text-orange-800">Problembehebung</h2>
          </div>
          <p className="text-orange-700">
            Diese Seite hilft Ihnen bei der Lösung häufiger Probleme mit GartenMeister.
          </p>
        </div>

        <div className="space-y-8">
          {troubleshootingItems.map((category, categoryIndex) => (
            <section key={categoryIndex}>
              <div className={`${category.bgColor} ${category.borderColor} border rounded-lg p-6`}>
                <div className="flex items-center mb-4">
                  <category.icon className={`${category.color} mr-3`} />
                  <h2 className={`text-xl font-semibold ${category.color.replace('text-', 'text-').replace('-600', '-800')}`}>
                    {category.category}
                  </h2>
                </div>
                
                <div className="space-y-4">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Problem: {item.problem}</h3>
                      <p className="text-gray-700"><strong>Lösung:</strong> {item.solution}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Erweiterte Fehlerbehebung</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Logdateien prüfen</h3>
              <p className="text-gray-700">
                Bei persistenten Problemen finden Sie Logdateien im Anwendungsordner unter 
                <code className="bg-gray-200 px-2 py-1 rounded text-sm mx-1">%APPDATA%/GartenMeister/logs/</code>
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">App zurücksetzen</h3>
              <p className="text-gray-700">
                Als letzter Ausweg können Sie die App-Einstellungen zurücksetzen. Ihre Gartendaten bleiben erhalten.
                Löschen Sie den Ordner <code className="bg-gray-200 px-2 py-1 rounded text-sm mx-1">%APPDATA%/GartenMeister/config/</code>
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Neuinstallation</h3>
              <p className="text-gray-700">
                Bei schwerwiegenden Problemen deinstallieren Sie GartenMeister vollständig und installieren Sie es neu.
                Sichern Sie vorher Ihre Daten über die Cloud-Sync Funktion.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-blue-800 mb-3">Immer noch Probleme?</h2>
          <p className="text-blue-700 mb-4">
            Falls Ihr Problem hier nicht gelöst werden konnte, schauen Sie in die anderen Hilfebereiche:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link 
              href="/help/faq" 
              className="text-blue-600 hover:underline font-medium"
            >
              → FAQ
            </Link>
            <Link 
              href="/help/user-guide" 
              className="text-blue-600 hover:underline font-medium"
            >
              → Benutzerhandbuch
            </Link>
            <Link 
              href="/help/getting-started" 
              className="text-blue-600 hover:underline font-medium"
            >
              → Erste Schritte
            </Link>
            <Link 
              href="/settings" 
              className="text-blue-600 hover:underline font-medium"
            >
              → Einstellungen
            </Link>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link 
            href="/help" 
            className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors mr-4"
          >
            Zurück zur Hilfe
          </Link>
          <Link 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Zur Hauptübersicht
          </Link>
        </div>
      </div>
    </div>
  );
}
