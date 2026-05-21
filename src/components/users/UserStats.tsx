'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Crown, 
  Calendar,
  Activity,
  TrendingUp
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
}

interface UserStatsProps {
  userId?: string;
  showActions?: boolean;
}

export default function UserStats({ userId, showActions = false }: UserStatsProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState({
    totalUploads: 0,
    totalComments: 0,
    favoriteImages: 0,
    lastActiveDate: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);

  // Avatar-Initialen generieren
  const generateAvatarInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Avatar-Farbe generieren
  const generateAvatarColor = (name: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    return colors[name.length % colors.length];
  };

  // Benutzer und Statistiken laden
  const loadUserData = async () => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI?.users) {
        let userData;
        
        if (userId) {
          // Spezifischen Benutzer laden
          const allUsers = await window.electronAPI.users.getAll();
          userData = allUsers.find((u: UserData) => u.id === userId);
        } else {
          // Aktuellen Benutzer laden
          userData = await window.electronAPI.users.getCurrent();
        }
        
        setUser(userData);
        
        // TODO: Echte Statistiken aus ImageManager laden
        // Für jetzt Mock-Daten
        setStats({
          totalUploads: Math.floor(Math.random() * 50),
          totalComments: Math.floor(Math.random() * 100),
          favoriteImages: Math.floor(Math.random() * 25),
          lastActiveDate: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden der Benutzerdaten:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="h-3 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-gray-500">Benutzer nicht gefunden</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Benutzer-Statistiken
            </CardTitle>
            <CardDescription>
              Aktivitäts-Übersicht für {user.name}
            </CardDescription>
          </div>
          {showActions && (
            <Button variant="outline" size="sm">
              Details anzeigen
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Benutzer Info */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar} />
            <AvatarFallback 
              style={{ backgroundColor: generateAvatarColor(user.name) }}
              className="text-white font-bold text-xl"
            >
              {generateAvatarInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                {user.role === 'admin' ? (
                  <><Crown className="h-3 w-3 mr-1" /> Administrator</>
                ) : (
                  <><User className="h-3 w-3 mr-1" /> Benutzer</>
                )}
              </Badge>
            </div>
            {user.email && (
              <p className="text-gray-600 text-sm mb-2">{user.email}</p>
            )}
            <p className="text-gray-500 text-sm flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Mitglied seit {new Date(user.createdAt).toLocaleDateString('de-DE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Statistiken Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {stats.totalUploads}
            </div>
            <div className="text-sm text-blue-600">Uploads</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {stats.totalComments}
            </div>
            <div className="text-sm text-green-600">Kommentare</div>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600 mb-1">
              {stats.favoriteImages}
            </div>
            <div className="text-sm text-red-600">Favoriten</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
            </div>
            <div className="text-sm text-purple-600">Tage aktiv</div>
          </div>
        </div>

        {/* Aktivitäts-Trend */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium mb-1">Letzte Aktivität</h4>
            <p className="text-sm text-gray-600">
              {new Date(stats.lastActiveDate).toLocaleDateString('de-DE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <TrendingUp className="h-8 w-8 text-green-500" />
        </div>

        {/* Einstellungen Übersicht */}
        <div className="space-y-2">
          <h4 className="font-medium">Einstellungen</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Standard-Kategorie:</span>
              <Badge variant="outline" className="text-xs">
                {user.preferences.defaultCategory}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Auto-Tagging:</span>
              <Badge variant={user.preferences.autoTagging ? "default" : "secondary"} className="text-xs">
                {user.preferences.autoTagging ? "Ein" : "Aus"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Benachrichtigungen:</span>
              <Badge variant={user.preferences.notifications ? "default" : "secondary"} className="text-xs">
                {user.preferences.notifications ? "Ein" : "Aus"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
