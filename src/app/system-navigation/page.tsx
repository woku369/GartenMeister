'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Settings, 
  FileText, 
  TestTube, 
  BarChart3, 
  Package, 
  ShoppingBasket,
  FileDown,
  ArrowRight,
  CheckCircle,
  PlayCircle,
  Target
} from 'lucide-react';

export default function SystemNavigationPage() {
  const phases = [
    {
      id: 'phase1',
      title: 'Phase 1: Core IPC System',
      status: 'complete',
      description: 'Grundlegende IPC-Handler für Beete, Kräuter und Datenverwaltung',
      features: [
        '18 Core IPC-Handler implementiert',
        'Adaptive NAS-Konfiguration',
        'Portable Data Manager',
        'Frontend IPC-Integration'
      ],
      links: [
        { title: 'Beete verwalten', href: '/beds', icon: Package },
        { title: 'Kräuter verwalten', href: '/herbs', icon: ShoppingBasket },
        { title: 'Test-Seite', href: '/test-phase2', icon: TestTube }
      ]
    },
    {
      id: 'phase2',
      title: 'Phase 2: Advanced Features',
      status: 'complete',
      description: 'PDF Export System und Harvest Management mit 11 erweiterten Handlern',
      features: [
        'PDF Export System (4 Handler)',
        'Harvest Management (7 Handler)',
        'Electron Bridge erweitert',
        'Export-Verzeichnis Management'
      ],
      links: [
        { title: 'Phase 2 Tests', href: '/test-phase2', icon: TestTube },
        { title: 'PDF Exports', href: '#', icon: FileDown },
        { title: 'Harvest Management', href: '#', icon: BarChart3 }
      ]
    },
    {
      id: 'phase3',
      title: 'Phase 3: Advanced Hooks & UI',
      status: 'active',
      description: 'React Hooks für alle IPC-Features und erweiterte Dashboard-Komponenten',
      features: [
        'Advanced Data Hooks',
        'PDF Export Management UI',
        'Harvest Tracking Interface',
        'Kombinierte Dashboard-Ansichten'
      ],
      links: [
        { title: 'Phase 3 Dashboard', href: '/phase3-dashboard', icon: BarChart3 },
        { title: 'Advanced Features', href: '#', icon: Target },
        { title: 'System Overview', href: '#', icon: Settings }
      ]
    },
    {
      id: 'phase4',
      title: 'Phase 4: Portable EXE Ready',
      status: 'planned',
      description: 'Finale Optimierung und portable EXE-Generierung',
      features: [
        'Performance-Optimierung',
        'EXE-Packaging vorbereitet',
        'Vollständige Feature-Parität',
        'Production-ready Build'
      ],
      links: [
        { title: 'Build Config', href: '#', icon: Settings },
        { title: 'Performance Tests', href: '#', icon: TestTube },
        { title: 'Final Export', href: '#', icon: FileDown }
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-100 text-green-800">✅ Abgeschlossen</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">🔄 Aktiv</Badge>;
      case 'planned':
        return <Badge className="bg-gray-100 text-gray-800">📋 Geplant</Badge>;
      default:
        return <Badge variant="outline">❓ Unbekannt</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'active':
        return <PlayCircle className="h-6 w-6 text-blue-600" />;
      case 'planned':
        return <Target className="h-6 w-6 text-gray-600" />;
      default:
        return <Settings className="h-6 w-6 text-gray-400" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-green-800 mb-4">
          🚀 GartenMeister System Navigation
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Übersicht aller Entwicklungsphasen für das Portable EXE System
        </p>
        
        {/* Quick Actions */}
        <div className="flex justify-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Startseite
            </Button>
          </Link>
          <Link href="/phase3-dashboard">
            <Button>
              <BarChart3 className="h-4 w-4 mr-2" />
              Phase 3 Dashboard
            </Button>
          </Link>
          <Link href="/test-phase2">
            <Button variant="outline">
              <TestTube className="h-4 w-4 mr-2" />
              System Tests
            </Button>
          </Link>
        </div>
      </div>

      {/* Phase Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {phases.map((phase) => (
          <Card key={phase.id} className={`relative ${
            phase.status === 'active' ? 'ring-2 ring-blue-500 shadow-lg' : ''
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(phase.status)}
                  <div>
                    <CardTitle className="text-lg">{phase.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {phase.description}
                    </CardDescription>
                  </div>
                </div>
                {getStatusBadge(phase.status)}
              </div>
            </CardHeader>
            <CardContent>
              {/* Features */}
              <div className="mb-4">
                <h4 className="font-semibold text-sm mb-2">Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {phase.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Links */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Navigation:</h4>
                {phase.links.map((link, index) => (
                  <Link key={index} href={link.href}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start h-8"
                      disabled={link.href === '#'}
                    >
                      <link.icon className="h-3 w-3 mr-2" />
                      {link.title}
                      <ArrowRight className="h-3 w-3 ml-auto" />
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>

            {/* Active Indicator */}
            {phase.status === 'active' && (
              <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                AKTIV
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* System Status Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-800">29</div>
              <div className="text-sm text-green-600">IPC Handler</div>
              <div className="text-xs text-gray-500">Phase 1+2</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-800">12</div>
              <div className="text-sm text-blue-600">React Hooks</div>
              <div className="text-xs text-gray-500">Phase 3</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-800">100%</div>
              <div className="text-sm text-purple-600">IPC Integration</div>
              <div className="text-xs text-gray-500">Alle Features</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-800">Ready</div>
              <div className="text-sm text-orange-600">Portable EXE</div>
              <div className="text-xs text-gray-500">Phase 4 Prep</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Progress */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Aktueller Fortschritt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Gesamt-Fortschritt</span>
              <span className="text-sm text-gray-500">75%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <div className="text-sm text-gray-600">
              <strong>Aktueller Stand:</strong> Phase 3 Hooks und Dashboard implementiert. 
              Alle Core-Features funktional. Bereit für Phase 4 (Portable EXE Finalisierung).
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
