'use client';

import React from 'react';
import Link from 'next/link';

// Simple SVG Icons als React Components
const ArrowLeft = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const MessageCircle = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const HelpCircle = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function FAQPage() {
  const faqItems = [
    {
      question: "Wie erstelle ich mein erstes Beet?",
      answer: "Klicken Sie auf 'Neues Beet anlegen' im Hauptmenü. Wählen Sie die Beetgröße und fügen Sie Segmente für Ihre Kräuter hinzu. Sie können zwischen normalen Beeten und Versuchsbeeten wählen."
    },
    {
      question: "Was ist der Unterschied zwischen normalen Beeten und Versuchsbeeten?",
      answer: "Versuchsbeete sind für experimentelle Anpflanzungen gedacht und werden in der Visualisierung anders dargestellt. Sie eignen sich für das Testen neuer Kräutersorten oder Anbaumethoden."
    },
    {
      question: "Wie funktioniert die Cloud-Synchronisation?",
      answer: "Gehen Sie zu Einstellungen → Cloud-Sync und wählen Sie einen Ordner auf Ihrem Cloud-Speicher oder NAS. GartenMeister synchronisiert Ihre Daten automatisch zwischen verschiedenen Geräten."
    },
    {
      question: "Warum werden meine Bilder nicht angezeigt?",
      answer: "Überprüfen Sie, ob die Bilder korrekt hochgeladen wurden und im richtigen Format vorliegen (JPG, PNG). Stellen Sie sicher, dass der Bilderordner korrekt konfiguriert ist."
    },
    {
      question: "Kann ich meine Daten exportieren?",
      answer: "Ja, Sie können PDF-Berichte Ihrer Gartenübersicht exportieren. Zusätzlich können Sie Ihre Rohdaten über den Cloud-Sync Ordner sichern."
    },
    {
      question: "Wie füge ich neue Kräutersorten hinzu?",
      answer: "Beim Erstellen von Segmenten können Sie aus einer vordefinierten Liste von Kräutern wählen. Falls ein Kraut fehlt, können Sie es über die Kräuterverwaltung hinzufügen."
    },
    {
      question: "Was passiert mit gelöschten Daten?",
      answer: "Gelöschte Beete und Segmente werden dauerhaft entfernt. Nutzen Sie die Cloud-Synchronisation für regelmäßige Backups Ihrer Daten."
    },
    {
      question: "Wie kann ich die Wetterdaten aktualisieren?",
      answer: "Die Wetterdaten werden automatisch im Hintergrund aktualisiert. Sie können die Aktualisierung in den Einstellungen konfigurieren oder manuell über das Dashboard anstoßen."
    },
    {
      question: "Unterstützt GartenMeister mehrere Benutzer?",
      answer: "Die Bildersammlung unterstützt Multi-User-Funktionalität mit Kommentaren. Für die Hauptfunktionen ist GartenMeister als Einzelbenutzer-Anwendung konzipiert."
    },
    {
      question: "Wie erstelle ich Ernteberichte?",
      answer: "Nutzen Sie den 'Ernte starten' Button, um Ernten zu dokumentieren. Diese werden automatisch gespeichert und können über den PDF-Export in Berichte eingebunden werden."
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
        <h1 className="text-3xl font-bold text-gray-900">Häufig gestellte Fragen (FAQ)</h1>
      </div>

      <div className="prose max-w-none">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
          <div className="flex items-center mb-3">
            <MessageCircle className="text-purple-600 mr-2" />
            <h2 className="text-xl font-semibold text-purple-800">Antworten auf häufige Fragen</h2>
          </div>
          <p className="text-purple-700">
            Hier finden Sie Lösungen für die am häufigsten gestellten Fragen zu GartenMeister.
          </p>
        </div>

        <div className="space-y-6">
          {faqItems.map((item, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start mb-3">
                <HelpCircle className="text-blue-600 mr-3 mt-1 flex-shrink-0" />
                <h3 className="text-lg font-semibold text-gray-900">{item.question}</h3>
              </div>
              <div className="ml-8">
                <p className="text-gray-700">{item.answer}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-blue-800 mb-3">Weitere Hilfe benötigt?</h2>
          <p className="text-blue-700 mb-4">
            Falls Ihre Frage hier nicht beantwortet wurde, schauen Sie in die anderen Hilfebereiche:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link 
              href="/help/getting-started" 
              className="text-blue-600 hover:underline font-medium"
            >
              → Erste Schritte
            </Link>
            <Link 
              href="/help/user-guide" 
              className="text-blue-600 hover:underline font-medium"
            >
              → Benutzerhandbuch
            </Link>
            <Link 
              href="/help/troubleshooting" 
              className="text-blue-600 hover:underline font-medium"
            >
              → Fehlerbehebung
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
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mr-4"
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
