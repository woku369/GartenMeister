'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, FolderOpen, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Bed, KombinationsbeetSegment, HerbVariety, GartenConfiguration } from '@/lib/definitions';

// Electron API Type Declaration
declare global {
  interface Window {
    electronAPI?: {
      exportPDF: (data: any) => Promise<{ success: boolean; message?: string; filePath?: string }>;
      openPDFFile: (filePath: string) => Promise<{ success: boolean; message?: string }>;
      openExportFolder: () => Promise<{ success: boolean; message?: string; path?: string }>;
    };
  }
}

interface GardenExportPDFButtonProps {
  beds: Bed[];
  segments: KombinationsbeetSegment[];
  herbVarieties: HerbVariety[];
  gartenConfiguration: GartenConfiguration | null;
}

export default function GardenExportPDFButton({ 
  beds, 
  segments, 
  herbVarieties, 
  gartenConfiguration 
}: GardenExportPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportedFilePath, setLastExportedFilePath] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExportPDF = async () => {
    if (!beds || beds.length === 0) {
      toast({
        title: "Information",
        description: "Es wurden keine Beete gefunden. Erstellen Sie zuerst ein Beet.",
        variant: "default"
      });
      return;
    }

    setIsExporting(true);
    
    try {
      // Debug: Prüfen welcher Export-Weg verwendet wird
      console.log('Electron API verfügbar:', !!window.electronAPI);
      console.log('Export-Funktion verfügbar:', !!window.electronAPI?.exportPDF);
      
      // Erzwinge Electron-Export (für Debugging)
      const isElectron = typeof window !== 'undefined' && window.electronAPI;
      
      if (isElectron) {
        console.log('Verwende Electron-basierten PDF-Export (SimplePdfGenerator)');
        // Electron-basierter Export
        const exportData = {
          beds,
          segments,
          herbVarieties,
          gartenConfiguration,
          filename: 'gartenmeister-garden-overview'
        };
        
        console.log('Sende Daten an Electron:', exportData);
        const result = await window.electronAPI.exportPDF(exportData);
        console.log('Electron Export Ergebnis:', result);
        
        if (result.success && result.filePath) {
          setLastExportedFilePath(result.filePath);
          
          // Prüfe ob es ein HTML-Export (Safe Mode) ist
          const isHtmlExport = result.isHtml || result.filePath.endsWith('.html');
          
          toast({
            title: isHtmlExport ? "HTML-Export erfolgreich (Safe Mode)" : "PDF erfolgreich exportiert",
            description: (
              <div className="space-y-2">
                <p>{isHtmlExport 
                  ? "HTML-Datei erstellt. Öffnen Sie diese und drucken Sie sie als PDF." 
                  : "Die Gartenübersicht wurde gespeichert."
                }</p>
                {result.needsDefenderFix && (
                  <div className="text-xs bg-yellow-50 p-2 rounded">
                    <p><strong>Hinweis:</strong> Für direkten PDF-Export fügen Sie GartenMeister zu den Windows Defender-Ausnahmen hinzu.</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    onClick={() => handleOpenPDF(result.filePath!)}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    {isHtmlExport ? 'HTML öffnen' : 'PDF öffnen'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleOpenExportFolder}
                  >
                    <FolderOpen className="w-3 h-3 mr-1" />
                    Ordner öffnen
                  </Button>
                </div>
              </div>
            ),
            variant: "default"
          });
        } else {
          throw new Error(result.message || 'PDF-Export fehlgeschlagen');
        }
      } else {
        console.log('Electron API nicht verfügbar, verwende Browser-Fallback (pdfmake)');
        throw new Error('Electron API ist nicht verfügbar - App läuft nicht in Electron-Umgebung');
        
        // Dieser Code wird nicht erreicht, da wir einen Fehler werfen
        /*
        const { generateGardenPDF } = await import('@/lib/pdf-export');
        await generateGardenPDF(beds, segments, herbVarieties, gartenConfiguration);
        
        toast({
          title: "PDF exportiert",
          description: "Die Gartenübersicht wurde als PDF heruntergeladen.",
          variant: "default"
        });
        */
      }
    } catch (error) {
      console.error('PDF Export Error:', error);
      
      // Spezielle Behandlung für Windows Defender-Probleme
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('Defender') || errorMessage.includes('blockiert')) {
        toast({
          title: "Windows Defender Blockierung",
          description: (
            <div className="space-y-2">
              <p>Der PDF-Export wurde von Windows Defender blockiert.</p>
              <div className="text-sm space-y-1">
                <p><strong>Schnelle Lösung:</strong></p>
                <p>1. Führen Sie <code>scripts/add-defender-exclusions.ps1</code> als Administrator aus</p>
                <p>2. Oder fügen Sie das GartenMeister-Verzeichnis zu den Windows Defender-Ausnahmen hinzu</p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  if (window.electronAPI) {
                    // Öffne Anleitung über Electron API
                    window.electronAPI.openPDFFile(process.cwd() + '/WINDOWS_DEFENDER_LOSUNG.md')
                      .catch(() => {
                        // Fallback: Toast mit Pfad
                        toast({
                          title: "Anleitung",
                          description: "Siehe WINDOWS_DEFENDER_LOSUNG.md im Projektordner",
                        });
                      });
                  } else {
                    // Fallback für Browser
                    toast({
                      title: "Anleitung",
                      description: "Siehe WINDOWS_DEFENDER_LOSUNG.md im Projektordner",
                    });
                  }
                }}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Anleitung öffnen
              </Button>
            </div>
          ),
          variant: "destructive",
          duration: 10000 // Längere Anzeige für wichtige Info
        });
      } else {
        toast({
          title: "Fehler",
          description: "Beim PDF-Export ist ein Fehler aufgetreten: " + errorMessage,
          variant: "destructive"
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenPDF = async (filePath: string) => {
    try {
      if (window.electronAPI?.openPDFFile) {
        const result = await window.electronAPI.openPDFFile(filePath);
        if (!result.success) {
          toast({
            title: "Fehler",
            description: result.message || "PDF konnte nicht geöffnet werden.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      toast({
        title: "Fehler",
        description: "PDF konnte nicht geöffnet werden.",
        variant: "destructive"
      });
    }
  };

  const handleOpenExportFolder = async () => {
    try {
      if (window.electronAPI?.openExportFolder) {
        const result = await window.electronAPI.openExportFolder();
        if (!result.success) {
          toast({
            title: "Fehler",
            description: result.message || "Export-Ordner konnte nicht geöffnet werden.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error opening export folder:', error);
      toast({
        title: "Fehler",
        description: "Export-Ordner konnte nicht geöffnet werden.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        onClick={handleExportPDF} 
        variant="outline"
        disabled={isExporting}
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        {isExporting ? 'Exportiere...' : 'PDF Export'}
      </Button>
      
      {/* Schnellzugriff auf Export-Ordner */}
      <Button 
        onClick={handleOpenExportFolder}
        variant="ghost"
        size="sm"
        title="Export-Ordner öffnen"
      >
        <FolderOpen className="h-4 w-4" />
      </Button>
    </div>
  );
}
