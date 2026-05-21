'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  HardDrive, 
  Download, 
  Trash2, 
  RotateCcw, 
  Calendar,
  FileText,
  Database,
  Plus,
  AlertTriangle
} from 'lucide-react';

interface BackupInfo {
  path: string;
  folder: string;
  timestamp: string;
  version: string;
  description: string;
  files: string[];
  size: number;
  created: string;
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [backupDescription, setBackupDescription] = useState('');
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {}
  });

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      if (window.electronAPI?.listBackups) {
        const backupList = await window.electronAPI.listBackups();
        setBackups(backupList);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Backups:', error);
      setMessage('Fehler beim Laden der Backups');
    }
  };

  const createBackup = async () => {
    setLoading(true);
    setMessage('');
    try {
      const description = backupDescription || 'Manuelles Backup';
      if (window.electronAPI?.createBackup) {
        const result = await window.electronAPI.createBackup({ description });
        if (result?.success) {
          setMessage(`✅ Backup erstellt: ${result.filesCount} Dateien gesichert`);
          await loadBackups();
          setIsCreateDialogOpen(false);
          setBackupDescription('');
        } else {
          setMessage(`❌ Backup-Fehler: ${result?.error || 'Unbekannter Fehler'}`);
        }
      } else {
        setMessage('❌ Backup-API nicht verfügbar');
      }
    } catch (error) {
      setMessage(`❌ Fehler: ${error}`);
    }
    setLoading(false);
  };

  const restoreBackup = async (backupPath: string) => {
    setConfirmAction({
      isOpen: true,
      title: 'Backup wiederherstellen',
      message: 'Möchten Sie wirklich das Backup wiederherstellen? Die aktuellen Daten werden überschrieben.',
      action: async () => {
        setLoading(true);
        setMessage('');
        try {
          if (window.electronAPI?.restoreBackup) {
            const result = await window.electronAPI.restoreBackup(backupPath);
            if (result?.success) {
              setMessage(`✅ Backup wiederhergestellt: ${result.restoredFiles} Dateien`);
              await loadBackups();
            } else {
              setMessage(`❌ Wiederherstellungs-Fehler: ${result?.error || 'Unbekannter Fehler'}`);
            }
          } else {
            setMessage('❌ Wiederherstellungs-API nicht verfügbar');
          }
        } catch (error) {
          setMessage(`❌ Fehler: ${error}`);
        }
        setLoading(false);
        setConfirmAction(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const deleteBackup = async (backupPath: string) => {
    setConfirmAction({
      isOpen: true,
      title: 'Backup löschen',
      message: 'Möchten Sie dieses Backup wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
      action: async () => {
        setLoading(true);
        setMessage('');
        try {
          if (window.electronAPI?.deleteBackup) {
            const result = await window.electronAPI.deleteBackup(backupPath);
            if (result?.success) {
              setMessage('✅ Backup gelöscht');
              await loadBackups();
            } else {
              setMessage(`❌ Lösch-Fehler: ${result?.error || 'Unbekannter Fehler'}`);
            }
          } else {
            setMessage('❌ Lösch-API nicht verfügbar');
          }
        } catch (error) {
          setMessage(`❌ Fehler: ${error}`);
        }
        setLoading(false);
        setConfirmAction(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleString('de-DE');
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <HardDrive className="w-8 h-8" />
            Backup & Wiederherstellung
          </h1>
          <p className="text-muted-foreground mt-2">
            Sichern Sie Ihre Gartendaten und stellen Sie sie bei Bedarf wieder her
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Neues Backup
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neues Backup erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Beschreibung (optional)</Label>
                <Input
                  id="description"
                  value={backupDescription}
                  onChange={(e) => setBackupDescription(e.target.value)}
                  placeholder="z.B. Vor Sommerernte 2024"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={createBackup} disabled={loading}>
                {loading ? 'Erstelle...' : 'Backup erstellen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {message && (
        <Card className={`border-l-4 ${
          message.includes('✅') ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'
        }`}>
          <CardContent className="pt-4">
            <p className="text-sm">{message}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Database className="w-5 h-5" />
          Verfügbare Backups ({backups.length})
        </h2>

        {backups.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <HardDrive className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Keine Backups vorhanden</h3>
              <p className="text-muted-foreground">
                Erstellen Sie Ihr erstes Backup, um Ihre Daten zu sichern.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {backups.map((backup, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{backup.description}</h3>
                        <Badge variant="secondary">{backup.version}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(backup.created)}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {backup.files.length} Dateien
                        </div>
                        <div className="flex items-center gap-1">
                          <HardDrive className="w-4 h-4" />
                          {formatFileSize(backup.size)}
                        </div>
                      </div>
                      
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                        <div className="text-xs font-medium text-blue-700 mb-1">Speicherpfad:</div>
                        <div className="text-sm font-mono text-blue-800 break-all">
                          📁 {backup.path}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreBackup(backup.path)}
                        disabled={loading}
                        className="flex items-center gap-1"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Wiederherstellen
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteBackup(backup.path)}
                        disabled={loading}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        Löschen
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmAction.isOpen} onOpenChange={(open) => 
        setConfirmAction(prev => ({ ...prev, isOpen: open }))
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {confirmAction.title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmAction.message}
          </p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmAction(prev => ({ ...prev, isOpen: false }))}
            >
              Abbrechen
            </Button>
            <Button 
              onClick={confirmAction.action}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Verarbeite...' : 'Bestätigen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
