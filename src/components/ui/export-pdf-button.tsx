"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportToPDF } from '@/lib/electron-bridge';

interface ExportPDFButtonProps {
  type: 'beds' | 'reports';
  data: any[];
  disabled?: boolean;
}

export default function ExportPDFButton({ type, data, disabled = false }: ExportPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (disabled || !data || data.length === 0) {
      toast({
        title: "Export nicht möglich",
        description: "Es sind keine Daten zum Exportieren vorhanden.",
        variant: "destructive",
      });
      return;
    }    setIsExporting(true);
    try {
      // Neues API-Format verwenden
      const exportData = {
        type: type,
        data: data,
        timestamp: new Date().toISOString(),
        filename: type === 'beds' ? 'gartenmeister-gartenplan' : 'gartenmeister-ernteberichte'
      };
        const result = await exportToPDF(exportData);
      if (result.success) {
        toast({
          title: "PDF-Export erfolgreich",
          description: `Die ${type === 'beds' ? 'Beete-Übersicht' : 'Ernte-Berichte'} wurde als PDF exportiert.`,
          variant: "default",
        });
        
        // Bei erfolgreicher Erstellung Bestätigungsdialog anzeigen und PDF öffnen
        if (window.confirm(`Der PDF-Export war erfolgreich! Möchten Sie das PDF jetzt öffnen?`)) {
          try {
            // Versuchen, den Ordner zu öffnen (falls Electron-API verfügbar)
            if (window.electronAPI && window.electronAPI.openExportFolder) {
              await window.electronAPI.openExportFolder();
            }
          } catch (openError) {
            console.warn("Konnte den Export-Ordner nicht öffnen:", openError);
          }
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Fehler beim PDF-Export:', error);
      toast({
        title: "PDF-Export fehlgeschlagen",
        description: "Beim Exportieren der PDF-Datei ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      onClick={handleExport} 
      disabled={disabled || isExporting}
      className="bg-[#8FBC8F] hover:bg-[#2e7d32]"
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exportiere...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          Als PDF exportieren
        </>
      )}
    </Button>
  );
}
