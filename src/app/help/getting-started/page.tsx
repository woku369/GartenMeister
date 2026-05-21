'use client';

import React from 'react';
import Link from 'next/link';

// Simple SVG Icons als React Components
const ArrowLeft = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const Seedling = () => (
  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
  </svg>
);

const Camera = () => (
  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const FileText = () => (
  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const Settings = () => (
  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const Cloud = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const Calendar = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export default function GettingStartedPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center mb-6">
        <Link 
          href="/" 
          className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Erste Schritte mit GartenMeister</h1>
      </div>

      <div className="prose max-w-none">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-green-800 mb-3">Willkommen bei GartenMeister! 🌿</h2>
          <p className="text-green-700">
            GartenMeister ist Ihre komplette Lösung für das Kräutergarten-Management. 
            Diese Anleitung führt Sie durch die ersten Schritte.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <Seedling className="text-green-600 mr-3" />
              <h3 className="text-lg font-semibold">1. Erstes Beet anlegen</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Beginnen Sie mit der Erstellung Ihres ersten Kräuterbeets.
            </p>
            <Link 
              href="/beds/new" 
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Neues Beet anlegen
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <Camera className="text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold">2. Bildersammlung</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Dokumentieren Sie Ihren Garten mit der integrierten Bildersammlung.
            </p>
            <Link 
              href="/gallery" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Zur Galerie
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <FileText className="text-purple-600 mr-3" />
              <h3 className="text-lg font-semibold">3. PDF-Export</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Exportieren Sie Ihre Gartenübersicht als professionelles PDF.
            </p>
            <Link 
              href="/reports" 
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Zu den Berichten
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <Settings className="text-gray-600 mr-3" />
              <h3 className="text-lg font-semibold">4. Einstellungen</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Konfigurieren Sie Cloud-Sync, Wetter und weitere Funktionen.
            </p>
            <Link 
              href="/settings" 
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Zu den Einstellungen
            </Link>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📋 Schneller Workflow</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li><strong>Beet anlegen:</strong> Verwenden Sie "Datei → Neu → Neues Beet anlegen" oder gehen Sie zur <Link href="/beds/new" className="text-blue-600 hover:underline">Beet-Erstellung</Link></li>
            <li><strong>Kräuter hinzufügen:</strong> Fügen Sie Segmente zu Ihrem Beet hinzu und wählen Sie die gewünschten Kräutersorten</li>
            <li><strong>Ernten verfolgen:</strong> Nutzen Sie den "Ernte starten" Button für die Ernteverfolgung</li>
            <li><strong>Bilder sammeln:</strong> Dokumentieren Sie Fortschritte in der <Link href="/gallery" className="text-blue-600 hover:underline">Bildersammlung</Link></li>
            <li><strong>PDF erstellen:</strong> Exportieren Sie regelmäßig PDFs für Ihre Unterlagen</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center mb-3">
              <Cloud className="text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-blue-800">Cloud-Synchronisation</h3>
            </div>
            <p className="text-blue-700 text-sm mb-3">
              Synchronisieren Sie Ihre Daten mit Cloud-Speichern oder NAS-Systemen.
            </p>
            <Link 
              href="/settings" 
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              Cloud-Sync einrichten →
            </Link>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-center mb-3">
              <Calendar className="text-orange-600 mr-2" />
              <h3 className="text-lg font-semibold text-orange-800">Wetter & Kalender</h3>
            </div>
            <p className="text-orange-700 text-sm mb-3">
              Nutzen Sie Wettervorhersagen und Kalenderintegration für optimale Planung.
            </p>
            <Link 
              href="/dashboard" 
              className="text-orange-600 hover:underline text-sm font-medium"
            >
              Zum Dashboard →
            </Link>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-3">💡 Profi-Tipps</h2>
          <ul className="list-disc list-inside space-y-2 text-yellow-700 text-sm">
            <li><strong>Versuchsbeete:</strong> Nutzen Sie Versuchsbeete für neue Kräutersorten oder Experimente</li>
            <li><strong>Backup:</strong> Aktivieren Sie Cloud-Sync für automatische Datensicherung</li>
            <li><strong>Routinen:</strong> Erstellen Sie Pflegekalender für regelmäßige Gartenarbeiten</li>
            <li><strong>Kategorien:</strong> Organisieren Sie Ihre Bilder mit Tags und Kategorien</li>
            <li><strong>PDF-Export:</strong> Erstellen Sie saisonale Berichte für Ihre Gartenplanung</li>
          </ul>
        </div>

        <div className="text-center mt-8">
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
