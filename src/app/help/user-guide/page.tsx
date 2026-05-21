'use client';

import React from 'react';
import Link from 'next/link';

// Simple SVG Icons als React Components
const ArrowLeft = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const Book = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

export default function UserGuidePage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center mb-6">
        <Link 
          href="/help" 
          className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Benutzerhandbuch</h1>
      </div>

      <div className="prose max-w-none">          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center mb-3">
              <Book className="text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-blue-800">Vollständige Dokumentation</h2>
            </div>
          <p className="text-blue-700">
            Dieses Handbuch erklärt alle Funktionen von GartenMeister im Detail.
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Gartenbeete verwalten</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Neue Beete anlegen</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Klicken Sie auf "Neues Beet anlegen" im Hauptmenü</li>
                <li>Wählen Sie zwischen normalem Beet und Versuchsbeet</li>
                <li>Definieren Sie Größe und Position des Beets</li>
                <li>Fügen Sie Segmente für verschiedene Kräuter hinzu</li>
              </ul>
              
              <h3 className="text-lg font-semibold mb-3 mt-6">Segmente verwalten</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Klicken Sie auf "Segment hinzufügen" in der Beetansicht</li>
                <li>Wählen Sie ein Kraut aus der verfügbaren Liste</li>
                <li>Legen Sie die Segmentgröße fest</li>
                <li>Segments können jederzeit bearbeitet oder gelöscht werden</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Ernten verfolgen</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Ernte starten</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Klicken Sie auf "Ernte starten" im Hauptbereich</li>
                <li>Wählen Sie die zu erntenden Beete aus</li>
                <li>Dokumentieren Sie Menge und Qualität</li>
                <li>Alle Ernten werden automatisch gespeichert</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Bildersammlung</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Bilder verwalten</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Navigieren Sie zur Galerie über das Hauptmenü</li>
                <li>Laden Sie Bilder per Drag & Drop hoch</li>
                <li>Fügen Sie Kommentare und Tags hinzu</li>
                <li>Nutzen Sie Filter für die Suche</li>
                <li>Organisieren Sie Bilder nach Datum und Kategorie</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. PDF-Export</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Berichte erstellen</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Klicken Sie auf "PDF exportieren" in der Hauptansicht</li>
                <li>Der Export enthält alle Beete und deren aktuelle Bepflanzung</li>
                <li>PDFs werden im konfigurierten Export-Ordner gespeichert</li>
                <li>Öffnen Sie den Export-Ordner direkt aus der App</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Cloud-Synchronisation</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Einrichtung</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Gehen Sie zu Einstellungen → Cloud-Sync</li>
                <li>Wählen Sie einen Synchronisationsordner</li>
                <li>Aktivieren Sie die automatische Synchronisation</li>
                <li>Ihre Daten werden automatisch gesichert</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Dashboard & Wetter</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Übersicht</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Das Dashboard zeigt aktuelle Wetterinformationen</li>
                <li>Verfolgen Sie Ihre Aufgaben und To-dos</li>
                <li>Integrieren Sie Ihren Google Kalender</li>
                <li>Überwachen Sie Webcam-Feeds (optional)</li>
              </ul>
            </div>
          </section>
        </div>

        <div className="text-center mt-8">
          <Link 
            href="/help" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-4"
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
