'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  UserPlus, 
  Settings, 
  Crown, 
  User,
  Mail,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  Camera,
  MessageSquare,
  Heart,
  Image as ImageIcon
} from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'user';
  createdAt: string;
  preferences: {
    defaultCategory: string;
    autoTagging: boolean;
    notifications: boolean;
  };
  stats?: {
    totalUploads: number;
    totalComments: number;
    favoriteImages: number;
    joinedDate: string;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'user' as 'admin' | 'user',
    preferences: {
      defaultCategory: 'Allgemein',
      autoTagging: true,
      notifications: true
    }
  });

  // Benutzer laden
  const loadUsers = async () => {
    try {
      setLoading(true);
      
      if (typeof window !== 'undefined' && window.electronAPI?.users) {
        const [allUsers, current] = await Promise.all([
          window.electronAPI.users.getAll(),
          window.electronAPI.users.getCurrent()
        ]);
        
        setUsers(allUsers || []);
        setCurrentUser(current);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error);
      toast({
        title: "Fehler",
        description: "Benutzer konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Benutzer hinzufügen
  const handleAddUser = async () => {
    if (!newUser.name.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Namen ein",
        variant: "destructive",
      });
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.electronAPI?.users) {
        await window.electronAPI.users.add(newUser);
        
        toast({
          title: "Erfolg",
          description: "Benutzer wurde erfolgreich hinzugefügt",
        });
        
        setShowAddDialog(false);
        setNewUser({
          name: '',
          email: '',
          role: 'user',
          preferences: {
            defaultCategory: 'Allgemein',
            autoTagging: true,
            notifications: true
          }
        });
        
        loadUsers();
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Benutzers:', error);
      toast({
        title: "Fehler",
        description: "Benutzer konnte nicht hinzugefügt werden",
        variant: "destructive",
      });
    }
  };

  // Aktuellen Benutzer wechseln
  const handleSwitchUser = async (userId: string) => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI?.users) {
        await window.electronAPI.users.setCurrent(userId);
        
        toast({
          title: "Erfolg",
          description: "Benutzer wurde gewechselt",
        });
        
        loadUsers();
        
        // App-weiten Neustart vorschlagen
        setTimeout(() => {
          toast({
            title: "Info",
            description: "Ein App-Neustart wird empfohlen, um alle Änderungen zu übernehmen",
          });
        }, 1500);
      }
    } catch (error) {
      console.error('Fehler beim Wechseln des Benutzers:', error);
      toast({
        title: "Fehler",
        description: "Benutzer konnte nicht gewechselt werden",
        variant: "destructive",
      });
    }
  };

  // Benutzer löschen
  const handleDeleteUser = async (userId: string) => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI?.users) {
        await window.electronAPI.users.delete(userId);
        toast({
          title: "Erfolg",
          description: "Benutzer wurde erfolgreich gelöscht",
        });
        loadUsers();
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Benutzers:', error);
      toast({
        title: "Fehler",
        description: "Benutzer konnte nicht gelöscht werden",
        variant: "destructive",
      });
    }
  };

  // Benutzer bearbeiten/aktualisieren
  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    try {
      if (typeof window !== 'undefined' && window.electronAPI?.users) {
        await window.electronAPI.users.update(editingUser.id, {
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          preferences: editingUser.preferences
        });
        
        toast({
          title: "Erfolg",
          description: "Benutzer wurde erfolgreich aktualisiert",
        });
        
        setEditingUser(null);
        loadUsers();
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Benutzers:', error);
      toast({
        title: "Fehler",
        description: "Benutzer konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    }
  };

  // Avatar-Initialen generieren
  const generateAvatarInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Avatar-Farbe generieren
  const generateAvatarColor = (name: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    return colors[name.length % colors.length];
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Lade Benutzer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Benutzer-Verwaltung
          </h1>
          <p className="text-gray-600 mt-2">
            Verwalten Sie Benutzerkonten und Berechtigungen für GartenMeister
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Neuer Benutzer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Benutzer hinzufügen</DialogTitle>
              <DialogDescription>
                Erstellen Sie ein neues Benutzerkonto für GartenMeister
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Vollständiger Name"
                />
              </div>
              
              <div>
                <Label htmlFor="email">E-Mail (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="benutzer@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="role">Rolle</Label>
                <Select value={newUser.role} onValueChange={(value: 'admin' | 'user') => setNewUser(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Benutzer
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        Administrator
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label>Einstellungen</Label>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoTagging" className="text-sm font-normal">
                    Automatisches Tagging
                  </Label>
                  <Switch
                    id="autoTagging"
                    checked={newUser.preferences.autoTagging}
                    onCheckedChange={(checked) => 
                      setNewUser(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, autoTagging: checked }
                      }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications" className="text-sm font-normal">
                    Benachrichtigungen
                  </Label>
                  <Switch
                    id="notifications"
                    checked={newUser.preferences.notifications}
                    onCheckedChange={(checked) => 
                      setNewUser(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, notifications: checked }
                      }))
                    }
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleAddUser}>
                Benutzer hinzufügen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Benutzer bearbeiten Dialog */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Benutzer bearbeiten</DialogTitle>
              <DialogDescription>
                Bearbeiten Sie die Informationen von {editingUser?.name}
              </DialogDescription>
            </DialogHeader>
            
            {editingUser && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    placeholder="Vollständiger Name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-email">E-Mail (optional)</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                    placeholder="benutzer@example.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-role">Rolle</Label>
                  <Select value={editingUser.role} onValueChange={(value: 'admin' | 'user') => setEditingUser(prev => prev ? ({ ...prev, role: value }) : null)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Benutzer
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          Administrator
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <Label>Einstellungen</Label>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-autoTagging" className="text-sm font-normal">
                      Automatisches Tagging
                    </Label>
                    <Switch
                      id="edit-autoTagging"
                      checked={editingUser.preferences.autoTagging}
                      onCheckedChange={(checked) => 
                        setEditingUser(prev => prev ? ({
                          ...prev,
                          preferences: { ...prev.preferences, autoTagging: checked }
                        }) : null)
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-notifications" className="text-sm font-normal">
                      Benachrichtigungen
                    </Label>
                    <Switch
                      id="edit-notifications"
                      checked={editingUser.preferences.notifications}
                      onCheckedChange={(checked) => 
                        setEditingUser(prev => prev ? ({
                          ...prev,
                          preferences: { ...prev.preferences, notifications: checked }
                        }) : null)
                      }
                    />
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Abbrechen
              </Button>
              <Button onClick={handleUpdateUser}>
                Änderungen speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="current">Aktueller Benutzer</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
        </TabsList>

        {/* Übersicht Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Aktueller Benutzer Card */}
          {currentUser && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <User className="h-5 w-5" />
                  Aktuell angemeldet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={currentUser.avatar} />
                    <AvatarFallback 
                      style={{ backgroundColor: generateAvatarColor(currentUser.name) }}
                      className="text-white font-semibold"
                    >
                      {generateAvatarInitials(currentUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-green-800">{currentUser.name}</h3>
                      <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'}>
                        {currentUser.role === 'admin' ? (
                          <><Crown className="h-3 w-3 mr-1" /> Administrator</>
                        ) : (
                          <><User className="h-3 w-3 mr-1" /> Benutzer</>
                        )}
                      </Badge>
                    </div>
                    {currentUser.email && (
                      <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" />
                        {currentUser.email}
                      </p>
                    )}
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      Mitglied seit {new Date(currentUser.createdAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alle Benutzer */}
          <Card>
            <CardHeader>
              <CardTitle>Alle Benutzer ({users.length})</CardTitle>
              <CardDescription>
                Übersicht aller registrierten Benutzer in GartenMeister
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback 
                          style={{ backgroundColor: generateAvatarColor(user.name) }}
                          className="text-white font-semibold"
                        >
                          {generateAvatarInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{user.name}</h4>
                          {user.id === currentUser?.id && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Aktiv
                            </Badge>
                          )}
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? (
                              <><Crown className="h-3 w-3 mr-1" /> Admin</>
                            ) : (
                              <><User className="h-3 w-3 mr-1" /> User</>
                            )}
                          </Badge>
                        </div>
                        {user.email && (
                          <p className="text-sm text-gray-600">{user.email}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Mitglied seit {new Date(user.createdAt).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {user.id !== currentUser?.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSwitchUser(user.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Wechseln zu
                        </Button>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditingUser(user)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      {user.id !== currentUser?.id && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {users.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Noch keine Benutzer vorhanden</p>
                    <p className="text-sm">Fügen Sie den ersten Benutzer hinzu</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aktueller Benutzer Tab */}
        <TabsContent value="current" className="space-y-6">
          {currentUser ? (
            <>
              {/* Profil Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Mein Profil</CardTitle>
                  <CardDescription>
                    Verwalten Sie Ihre persönlichen Informationen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={currentUser.avatar} />
                      <AvatarFallback 
                        style={{ backgroundColor: generateAvatarColor(currentUser.name) }}
                        className="text-white font-bold text-2xl"
                      >
                        {generateAvatarInitials(currentUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold">{currentUser.name}</h3>
                      {currentUser.email && (
                        <p className="text-gray-600 flex items-center gap-1 mt-1">
                          <Mail className="h-4 w-4" />
                          {currentUser.email}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'}>
                          {currentUser.role === 'admin' ? (
                            <><Crown className="h-3 w-3 mr-1" /> Administrator</>
                          ) : (
                            <><User className="h-3 w-3 mr-1" /> Benutzer</>
                          )}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Mitglied seit {new Date(currentUser.createdAt).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                    </div>
                    
                    <Button variant="outline" className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Profil bearbeiten
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Statistiken Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Meine Statistiken</CardTitle>
                  <CardDescription>
                    Übersicht über Ihre Aktivitäten in GartenMeister
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <ImageIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-700">0</p>
                      <p className="text-sm text-blue-600">Uploads</p>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-700">0</p>
                      <p className="text-sm text-green-600">Kommentare</p>
                    </div>
                    
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <Heart className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-red-700">0</p>
                      <p className="text-sm text-red-600">Favoriten</p>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Camera className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-700">0</p>
                      <p className="text-sm text-purple-600">Bewertungen</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Einstellungen Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Meine Einstellungen</CardTitle>
                  <CardDescription>
                    Personalisieren Sie Ihr GartenMeister-Erlebnis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Automatisches Tagging</Label>
                      <p className="text-sm text-gray-600">Automatische Verschlagwortung neuer Bilder</p>
                    </div>
                    <Switch checked={currentUser.preferences.autoTagging} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Benachrichtigungen</Label>
                      <p className="text-sm text-gray-600">System-Benachrichtigungen erhalten</p>
                    </div>
                    <Switch checked={currentUser.preferences.notifications} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Standard-Kategorie</Label>
                      <p className="text-sm text-gray-600">Vorgabe für neue Uploads</p>
                    </div>
                    <Badge variant="outline">{currentUser.preferences.defaultCategory}</Badge>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-gray-500">Kein Benutzer angemeldet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Einstellungen Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System-Einstellungen
              </CardTitle>
              <CardDescription>
                Globale Einstellungen für das Benutzer-Management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Neue Benutzer als Admin</Label>
                  <p className="text-sm text-gray-600">Neue Benutzer erhalten automatisch Admin-Rechte</p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Automatische Avatars</Label>
                  <p className="text-sm text-gray-600">Initialen-basierte Avatars generieren</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Benutzer-Statistiken</Label>
                  <p className="text-sm text-gray-600">Upload- und Aktivitäts-Statistiken sammeln</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
